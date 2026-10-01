const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const { protect, adminOnly } = require('../middleware/auth');

// ──────────────── Change Admin Password ────────────────
router.put('/change-password', protect, adminOnly, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    const admin = await Admin.findById(req.user._id);
    
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    admin.password = newPassword;
    await admin.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Create New Admin ────────────────
router.post('/create-admin', protect, adminOnly, async (req, res) => {
  try {
    const { username, password, name } = req.body;
    
    if (!username || !password || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const adminExists = await Admin.findOne({ username });
    if (adminExists) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const newAdmin = await Admin.create({ username, password, name });
    
    res.status(201).json({ message: 'New admin created successfully', admin: { username: newAdmin.username, name: newAdmin.name } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
