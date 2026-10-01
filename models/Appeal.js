const mongoose = require('mongoose');

const appealSchema = new mongoose.Schema({
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminResponse: { type: String, trim: true, default: '' }
}, { timestamps: true });

appealSchema.index({ volunteer: 1, status: 1 });

module.exports = mongoose.model('Appeal', appealSchema);
