const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorName: { type: String, required: true, trim: true },
  email: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  purpose: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' },
  utrNumber: { type: String, trim: true, default: '' },
  screenshot: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['initiated', 'partial', 'completed'], default: 'initiated' }
}, { timestamps: true });

donationSchema.index({ date: -1 });

module.exports = mongoose.model('Donation', donationSchema);
