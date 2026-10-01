const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect, adminOnly } = require('../middleware/auth');

// ──────────────── Get Active Notifications (Volunteer) ────────────────
router.get('/active', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ active: true }).sort('-createdAt');
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Create Notification (Admin) ────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, message } = req.body;
    const notification = await Notification.create({ title, message, createdBy: req.user._id });
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Get All Notifications (Admin) ────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const notifications = await Notification.find().sort('-createdAt').populate('createdBy', 'name');
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Deactivate Notification ────────────────
router.put('/:id/deactivate', protect, adminOnly, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Notification deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
