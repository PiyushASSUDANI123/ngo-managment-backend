const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const DailyReport = require('../models/DailyReport');
const { protect, adminOnly } = require('../middleware/auth');

// ──────────────── Multer Configuration ────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/reports');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `report-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per file
});

// ──────────────── Volunteer: Upload Report ────────────────
router.post('/', protect, upload.array('screenshots', 5), async (req, res) => {
  try {
    if (req.user.role !== 'volunteer') {
      return res.status(403).json({ message: 'Only volunteers can upload reports' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one screenshot' });
    }

    const screenshots = req.files.map(file => `/uploads/reports/${file.filename}`);

    if (!req.body.category) return res.status(400).json({ message: 'Category is required' });

    const report = await DailyReport.create({
      volunteer: req.user._id,
      category: req.body.category,
      description: req.body.description,
      screenshots
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Admin: Get All Reports ────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { date, volunteerId } = req.query;
    const filter = {};

    if (volunteerId) filter.volunteer = volunteerId;
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const reports = await DailyReport.find(filter)
      .populate('volunteer', 'name volunteerId')
      .populate('category', 'name defaultPoints')
      .sort('-createdAt');

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Volunteer: Get My Reports ────────────────
router.get('/my-reports', protect, async (req, res) => {
  try {
    if (req.user.role !== 'volunteer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const reports = await DailyReport.find({ volunteer: req.user._id })
      .populate('category', 'name defaultPoints')
      .sort('-createdAt');

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Admin: Verify Report & Award Points ────────────────
router.put('/:id/verify', protect, adminOnly, async (req, res) => {
  try {
    const { status, points } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const report = await DailyReport.findById(req.params.id).populate('category');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.status !== 'pending') return res.status(400).json({ message: 'Report already processed' });

    report.status = status;
    
    if (status === 'approved' && points > 0) {
      report.pointsAwarded = points;
      
      // Add points to volunteer
      const Points = require('../models/Points'); // Require here to avoid circular dep
      
      await Points.create({
        volunteer: report.volunteer,
        category: report.category._id,
        points: points,
        date: new Date(),
        remarks: `${report.category.name} Verified`
      });
    }

    await report.save();
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
