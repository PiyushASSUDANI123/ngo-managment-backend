const express = require('express');
const router = express.Router();
const Points = require('../models/Points');
const { protect, adminOnly } = require('../middleware/auth');

// ──────────────── Get Points (with filters) ────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { volunteer, category, startDate, endDate } = req.query;
    const filter = {};

    // Volunteers can only see their own points
    if (req.user.role === 'volunteer') {
      filter.volunteer = req.user._id;
    } else if (volunteer) {
      filter.volunteer = volunteer;
    }

    if (category) filter.category = category;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const points = await Points.find(filter)
      .populate('volunteer', 'name volunteerId')
      .populate('category', 'name')
      .sort('-date')
      .lean();

    res.json(points);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Get Points Summary for a Volunteer ────────────────
router.get('/summary/:volunteerId', protect, async (req, res) => {
  try {
    // Volunteers can only see their own summary
    if (req.user.role === 'volunteer' && req.user._id.toString() !== req.params.volunteerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const summary = await Points.aggregate([
      { $match: { volunteer: require('mongoose').Types.ObjectId.createFromHexString(req.params.volunteerId) } },
      {
        $group: {
          _id: '$category',
          totalPoints: { $sum: '$points' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'pointscategories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $project: {
          category: '$categoryInfo.name',
          totalPoints: 1,
          count: 1
        }
      }
    ]);

    const totalPoints = summary.reduce((acc, s) => acc + s.totalPoints, 0);

    res.json({ summary, totalPoints });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Assign Points ────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { volunteer, category, points, date, remarks } = req.body;

    if (!volunteer || !category || points === undefined || !date) {
      return res.status(400).json({ message: 'Volunteer, category, points, and date are required' });
    }

    const newPoints = await Points.create({
      volunteer,
      category,
      points,
      date: new Date(date),
      remarks
    });

    const populated = await Points.findById(newPoints._id)
      .populate('volunteer', 'name volunteerId')
      .populate('category', 'name');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Delete Points Entry ────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const points = await Points.findByIdAndDelete(req.params.id);
    if (!points) {
      return res.status(404).json({ message: 'Points entry not found' });
    }
    res.json({ message: 'Points entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
