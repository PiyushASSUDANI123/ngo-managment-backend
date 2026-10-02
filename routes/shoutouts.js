const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Shoutout = require('../models/Shoutout');
const { protect, admin } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/gallery/'); // Reusing gallery uploads folder for shoutouts
  },
  filename(req, file, cb) {
    cb(null, `shoutout-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// Get all shoutouts
router.get('/', async (req, res) => {
  try {
    const shoutouts = await Shoutout.find().sort({ createdAt: -1 });
    res.json(shoutouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get shoutout by slug
router.get('/:slug', async (req, res) => {
  try {
    const shoutout = await Shoutout.findOne({ slug: req.params.slug });
    if (!shoutout) return res.status(404).json({ message: 'Not found' });
    res.json(shoutout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create shoutout (Admin only)
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { donorName, amount, message } = req.body;
    let slug = donorName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 10000);
    
    const newShoutout = new Shoutout({
      donorName,
      amount,
      message,
      slug,
      image: req.file ? `/uploads/gallery/${req.file.filename}` : null
    });
    
    await newShoutout.save();
    res.status(201).json(newShoutout);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete shoutout (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    await Shoutout.findByIdAndDelete(req.params.id);
    res.json({ message: 'Shoutout deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
