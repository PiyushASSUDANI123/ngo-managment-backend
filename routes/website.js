const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

const WebsiteApplication = require('../models/WebsiteApplication');
const WebsiteReview = require('../models/WebsiteReview');
const GalleryImage = require('../models/GalleryImage');
const Donation = require('../models/Donation');
const VolunteerPageConfig = require('../models/VolunteerPageConfig');
const { protect, adminOnly } = require('../middleware/auth');

// ── Multer config for gallery uploads ──
const galleryDir = path.join(__dirname, '..', 'uploads', 'gallery');
if (!fs.existsSync(galleryDir)) {
  fs.mkdirSync(galleryDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, galleryDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// ──────────────── PUBLIC ENDPOINTS ────────────────

router.get('/volunteer-config', async (req, res) => {
  try {
    let config = await VolunteerPageConfig.findOne();
    if (!config) {
      config = await VolunteerPageConfig.create({});
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/applications', async (req, res) => {
  try {
    const application = await WebsiteApplication.create(req.body);
    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/reviews', async (req, res) => {
  try {
    const review = await WebsiteReview.create(req.body);
    cache.del('public-reviews'); // Invalidate cache so new review appears immediately
    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/public-reviews', async (req, res) => {
  try {
    const cachedReviews = cache.get('public-reviews');
    if (cachedReviews) return res.json({ reviews: cachedReviews });

    const reviews = await WebsiteReview.find({ status: 'Approved' }).sort('-createdAt').limit(10);
    cache.set('public-reviews', reviews);
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/public-gallery', async (req, res) => {
  try {
    const cachedGallery = cache.get('public-gallery');
    if (cachedGallery) return res.json({ images: cachedGallery });

    const images = await GalleryImage.find({ isActive: true }).sort('-createdAt');
    cache.set('public-gallery', images);
    res.json({ images });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/donations/intent', async (req, res) => {
  try {
    const { donorName, email, phone, amount, address, city, state, purpose, status } = req.body;
    const donation = await Donation.create({
      donorName: donorName || 'Anonymous',
      amount: amount || 0,
      email, phone, address, city, state, purpose,
      status: status || 'initiated'
    });
    res.status(201).json({ message: 'Donation intent recorded', donation });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/donations/intent/:id', async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    res.json(donation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ──────────────── ADMIN ENDPOINTS ────────────────

router.put('/volunteer-config', protect, adminOnly, async (req, res) => {
  try {
    let config = await VolunteerPageConfig.findOne();
    if (!config) {
      config = new VolunteerPageConfig(req.body);
    } else {
      Object.assign(config, req.body);
    }
    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/applications', protect, adminOnly, async (req, res) => {
  try {
    const applications = await WebsiteApplication.find().sort('-createdAt');
    res.json({ applications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/applications/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const application = await WebsiteApplication.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/applications/:id', protect, adminOnly, async (req, res) => {
  try {
    const application = await WebsiteApplication.findByIdAndDelete(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json({ message: 'Application deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/reviews', protect, adminOnly, async (req, res) => {
  try {
    const reviews = await WebsiteReview.find().sort('-createdAt');
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/reviews/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const review = await WebsiteReview.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/reviews/:id', protect, adminOnly, async (req, res) => {
  try {
    const review = await WebsiteReview.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── GALLERY ADMIN ENDPOINTS ────────────────

router.get('/gallery', protect, adminOnly, async (req, res) => {
  try {
    const images = await GalleryImage.find().sort('-createdAt');
    res.json({ images });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/gallery', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload an image' });
    const imageUrl = `/uploads/gallery/${req.file.filename}`;
    const image = await GalleryImage.create({
      title: req.body.title || 'Untitled',
      caption: req.body.caption || '',
      category: req.body.category || 'Other',
      imageUrl
    });
    res.status(201).json({ message: 'Image uploaded successfully', image });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/gallery/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });
    image.isActive = !image.isActive;
    await image.save();
    res.json(image);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/gallery/:id', protect, adminOnly, async (req, res) => {
  try {
    const image = await GalleryImage.findByIdAndDelete(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });
    const filePath = path.join(__dirname, '..', image.imageUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
