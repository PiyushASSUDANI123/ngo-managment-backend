const express = require('express');
const router = express.Router();
const PointsCategory = require('../models/PointsCategory');
const { protect, adminOnly } = require('../middleware/auth');

// Get All Point Categories
router.get('/', protect, async (req, res) => {
  try {
    const categories = await PointsCategory.find().sort('name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Point Category
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, defaultPoints } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const existing = await PointsCategory.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: 'Category already exists' });

    const category = await PointsCategory.create({ 
      name: name.trim(), 
      description,
      defaultPoints: Number(defaultPoints) || 0
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Point Category
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, defaultPoints } = req.body;
    const category = await PointsCategory.findByIdAndUpdate(
      req.params.id,
      { 
        name: name?.trim(), 
        description,
        defaultPoints: Number(defaultPoints) || 0
      },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Point Category
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const category = await PointsCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
