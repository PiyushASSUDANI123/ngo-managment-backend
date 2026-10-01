const express = require('express');
const router = express.Router();
const Field = require('../models/Field');
const { protect, adminOnly } = require('../middleware/auth');

// ──────────────── Get All Fields ────────────────
router.get('/', protect, async (req, res) => {
  try {
    const fields = await Field.find().sort('name');
    res.json(fields);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Create Field ────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Field name is required' });
    }

    const existingField = await Field.findOne({ name: name.trim() });
    if (existingField) {
      return res.status(400).json({ message: 'A field with this name already exists' });
    }

    const field = await Field.create({ name: name.trim(), description });
    res.status(201).json(field);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Update Field ────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, description } = req.body;

    const field = await Field.findByIdAndUpdate(
      req.params.id,
      { name: name?.trim(), description },
      { new: true, runValidators: true }
    );

    if (!field) {
      return res.status(404).json({ message: 'Field not found' });
    }

    res.json(field);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Delete Field ────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const field = await Field.findByIdAndDelete(req.params.id);
    if (!field) {
      return res.status(404).json({ message: 'Field not found' });
    }
    res.json({ message: 'Field deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
