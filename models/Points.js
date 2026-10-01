const mongoose = require('mongoose');

const pointsSchema = new mongoose.Schema({
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'PointsCategory', required: true },
  points: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  remarks: { type: String, trim: true, default: '' }
}, { timestamps: true });

// Compound index for efficient querying
pointsSchema.index({ volunteer: 1, date: -1 });
pointsSchema.index({ volunteer: 1, category: 1, date: -1 });

module.exports = mongoose.model('Points', pointsSchema);
