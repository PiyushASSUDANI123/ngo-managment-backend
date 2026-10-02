const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Volunteer = require('../models/Volunteer');
const { protect, adminOnly } = require('../middleware/auth');

// ──────────────── Multer Configuration ────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/volunteers');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `volunteer-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ──────────────── Get All Volunteers ────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { field, status, search } = req.query;
    const filter = {};

    if (field) filter.field = field;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { volunteerId: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const volunteers = await Volunteer.find(filter)
      .populate('field')
      .select('-password')
      .sort('-createdAt');

    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Get Single Volunteer ────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id)
      .populate('field')
      .select('-password');

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    // Volunteers can only view their own profile
    if (req.user.role === 'volunteer' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(volunteer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Create Volunteer ────────────────
router.post('/', protect, adminOnly, upload.single('photo'), async (req, res) => {
  try {
    const { name, email, mobile, address, city, state, field } = req.body;

    if (!name || !mobile || !field) {
      return res.status(400).json({ message: 'Name, mobile, and field are required' });
    }

    // Generate unique volunteer ID
    const lastVolunteer = await Volunteer.findOne().sort('-createdAt');
    let nextNum = 1;
    if (lastVolunteer && lastVolunteer.volunteerId) {
      const lastNum = parseInt(lastVolunteer.volunteerId.split('-')[1]) || 0;
      nextNum = lastNum + 1;
    }
    const volunteerId = `VOL-${String(nextNum).padStart(4, '0')}`;

    // Generate random default password (8 chars)
    const defaultPassword = crypto.randomBytes(4).toString('hex');

    const volunteer = await Volunteer.create({
      volunteerId,
      password: defaultPassword,
      plainPassword: defaultPassword,
      name,
      email,
      mobile,
      address,
      city,
      state,
      field,
      photo: req.file ? `/uploads/volunteers/${req.file.filename}` : null
    });

    const populatedVolunteer = await Volunteer.findById(volunteer._id)
      .populate('field')
      .select('-password');

    res.status(201).json({
      volunteer: populatedVolunteer,
      credentials: {
        volunteerId,
        password: defaultPassword
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Update Volunteer ────────────────
router.put('/:id', protect, adminOnly, upload.single('photo'), async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // Don't update password through this route
    delete updates.volunteerId; // Don't change volunteer ID

    if (req.file) {
      updates.photo = `/uploads/volunteers/${req.file.filename}`;
    }

    const volunteer = await Volunteer.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('field').select('-password');

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    res.json(volunteer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Delete Volunteer ────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    // Delete photo file if exists
    if (volunteer.photo) {
      const photoPath = path.join(__dirname, '..', volunteer.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    res.json({ message: 'Volunteer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Reset Volunteer Password ────────────────
router.put('/:id/reset-password', protect, adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const volunteer = await Volunteer.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    const generatedPassword = crypto.randomBytes(4).toString('hex');
    volunteer.password = newPassword || generatedPassword;
    volunteer.plainPassword = newPassword || generatedPassword;
    await volunteer.save();

    res.json({
      message: 'Password reset successfully',
      newPassword: volunteer.plainPassword
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
