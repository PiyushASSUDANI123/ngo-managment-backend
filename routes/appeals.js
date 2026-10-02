const express = require('express');
const router = express.Router();
const Appeal = require('../models/Appeal');
const { protect, adminOnly } = require('../middleware/auth');

// ──────────────── Get Appeals ────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    // Volunteers see only their own appeals
    if (req.user.role === 'volunteer') {
      filter.volunteer = req.user._id;
    }

    if (status) filter.status = status;

    const appeals = await Appeal.find(filter)
      .populate('volunteer', 'name volunteerId')
      .sort('-createdAt')
      .lean();

    res.json(appeals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Create Appeal (Volunteer) ────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    // Only volunteers can create appeals
    if (req.user.role !== 'volunteer') {
      return res.status(403).json({ message: 'Only volunteers can submit appeals' });
    }

    const appeal = await Appeal.create({
      volunteer: req.user._id,
      subject,
      message
    });

    const populated = await Appeal.findById(appeal._id)
      .populate('volunteer', 'name volunteerId');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Respond to Appeal (Admin) ────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const appeal = await Appeal.findByIdAndUpdate(
      req.params.id,
      { status, adminResponse: adminResponse || '' },
      { new: true }
    ).populate('volunteer', 'name volunteerId');

    if (!appeal) {
      return res.status(404).json({ message: 'Appeal not found' });
    }

    res.json(appeal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Delete Appeal ────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const appeal = await Appeal.findByIdAndDelete(req.params.id);
    if (!appeal) {
      return res.status(404).json({ message: 'Appeal not found' });
    }
    res.json({ message: 'Appeal deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
