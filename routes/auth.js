const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Volunteer = require('../models/Volunteer');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 5, // Limit each IP to 5 login requests per 15 minutes
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ──────────────── Admin Login ────────────────
router.post('/admin/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: admin._id,
      name: admin.name,
      username: admin.username,
      role: 'admin',
      token: generateToken(admin._id, 'admin')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Volunteer Login ────────────────
router.post('/volunteer/login', loginLimiter, async (req, res) => {
  try {
    const { volunteerId, password } = req.body;

    if (!volunteerId || !password) {
      return res.status(400).json({ message: 'Please provide volunteer ID and password' });
    }

    const volunteer = await Volunteer.findOne({ volunteerId }).populate('field');
    if (!volunteer) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await volunteer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (volunteer.status !== 'active') {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact admin.' });
    }

    res.json({
      _id: volunteer._id,
      name: volunteer.name,
      volunteerId: volunteer.volunteerId,
      field: volunteer.field,
      role: 'volunteer',
      token: generateToken(volunteer._id, 'volunteer')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Get Current User ────────────────
router.get('/me', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const admin = await Admin.findById(req.user._id).select('-password');
      return res.json({ ...admin.toObject(), role: 'admin' });
    } else {
      const volunteer = await Volunteer.findById(req.user._id).populate('field').select('-password');
      return res.json({ ...volunteer.toObject(), role: 'volunteer' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Change Password (Volunteer) ────────────────
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ message: 'New password must be at least 4 characters' });
    }

    let user;
    if (req.user.role === 'volunteer') {
      user = await Volunteer.findById(req.user._id);
    } else {
      user = await Admin.findById(req.user._id);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    if (req.user.role === 'volunteer') {
      user.plainPassword = newPassword;
    }
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
