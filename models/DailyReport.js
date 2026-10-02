const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  date: { type: Date, default: Date.now },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'PointsCategory', required: true },
  description: { type: String, trim: true },
  screenshots: [{ type: String, required: true }], // Array of image URLs/paths
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  pointsAwarded: { type: Number, default: 0 }
}, { timestamps: true });

// ──────────────── Indexes for Performance ────────────────
dailyReportSchema.index({ volunteer: 1, createdAt: -1 }); // Fast lookups for volunteer's own reports
dailyReportSchema.index({ status: 1, createdAt: -1 }); // Used by admin to quickly find pending/approved reports

module.exports = mongoose.model('DailyReport', dailyReportSchema);
