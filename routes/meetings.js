const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const { protect, adminOnly } = require('../middleware/auth');

// Get all meetings
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate('attendance.volunteer', 'name volunteerId field')
      .sort({ date: -1 });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a meeting
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, date, description, attendance } = req.body;
    const meeting = new Meeting({ title, date, description, attendance });
    await meeting.save();
    res.status(201).json(meeting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a meeting
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
