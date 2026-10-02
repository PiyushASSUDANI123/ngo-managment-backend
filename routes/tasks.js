const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect, adminOnly } = require('../middleware/auth');

// ──────────────── Get Tasks ────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { volunteer, status } = req.query;
    const filter = {};

    // Volunteers can only see their own tasks
    if (req.user.role === 'volunteer') {
      filter.volunteer = req.user._id;
    } else if (volunteer) {
      filter.volunteer = volunteer;
    }

    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate('volunteer', 'name volunteerId')
      .sort('-createdAt')
      .lean();

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Create Task ────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { volunteer, title, description, dueDate } = req.body;

    if (!volunteer || !title) {
      return res.status(400).json({ message: 'Volunteer and title are required' });
    }

    const task = await Task.create({
      volunteer,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null
    });

    const populated = await Task.findById(task._id)
      .populate('volunteer', 'name volunteerId');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Update Task ────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Volunteers can only update status of their own tasks
    if (req.user.role === 'volunteer') {
      if (task.volunteer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      // Volunteers can only update the status
      task.status = req.body.status || task.status;
    } else {
      // Admin can update everything
      task.title = req.body.title || task.title;
      task.description = req.body.description !== undefined ? req.body.description : task.description;
      task.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : task.dueDate;
      task.status = req.body.status || task.status;
      task.volunteer = req.body.volunteer || task.volunteer;
    }

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('volunteer', 'name volunteerId');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Delete Task ────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
