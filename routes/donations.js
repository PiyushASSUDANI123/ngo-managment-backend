const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const generateCertificate = require('../utils/generateCertificate');
const { protect, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ──────────────── Multer Configuration ────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/donations');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `donation-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  }
});

// ──────────────── Public: Create Donation Intent ────────────────
router.post('/intent', upload.single('screenshot'), async (req, res) => {
  try {
    const { donorName, email, phone, address, city, state, amount, status, utrNumber } = req.body;
    let screenshotUrl = '';
    if (req.file) screenshotUrl = `/uploads/donations/${req.file.filename}`;
    
    const donation = await Donation.create({
      donorName: donorName || 'Anonymous', // Fallback for progressive flow
      email, phone, address, city, state, amount: amount || 0, status: status || 'initiated',
      utrNumber: utrNumber || '',
      screenshot: screenshotUrl
    });
    res.status(201).json({ donation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Public: Update Donation Intent ────────────────
router.put('/intent/:id', upload.single('screenshot'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.screenshot = `/uploads/donations/${req.file.filename}`;

    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    res.json({ donation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Admin: Get All Donations ────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { donorName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const donations = await Donation.find(filter).sort('-date').lean();
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

    res.json({ donations, totalAmount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Get Single Donation ────────────────
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).lean();
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Create Donation ────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { donorName, email, phone, address, city, state, amount, date, purpose, notes } = req.body;

    if (!donorName || !amount) {
      return res.status(400).json({ message: 'Donor name and amount are required' });
    }

    const donation = await Donation.create({
      donorName,
      email,
      phone,
      address,
      city,
      state,
      amount,
      date: date ? new Date(date) : new Date(),
      purpose,
      notes
    });

    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Update Donation ────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Delete Donation ────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    res.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Generate Certificate PDF ────────────────
router.get('/:id/certificate', protect, adminOnly, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    generateCertificate(donation, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
