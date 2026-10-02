const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const generateCertificate = require('../utils/generateCertificate');
const { protect, adminOnly } = require('../middleware/auth');

// ──────────────── Get All Donations ────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { donorName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const donations = await Donation.find(filter).sort('-date').lean();
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

    res.json({ donations, totalAmount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Get Single Donation ────────────────
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).lean();
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Create Donation ────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { donorName, email, phone, address, city, state, amount, date, purpose, notes } = req.body;

    if (!donorName || !amount) {
      return res.status(400).json({ message: 'Donor name and amount are required' });
    }

    const donation = await Donation.create({
      donorName,
      email,
      phone,
      address,
      city,
      state,
      amount,
      date: date ? new Date(date) : new Date(),
      purpose,
      notes
    });

    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Update Donation ────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Delete Donation ────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    res.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── Generate Certificate PDF ────────────────
router.get('/:id/certificate', protect, adminOnly, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    generateCertificate(donation, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
