const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  date: { type: Date, default: Date.now },
  taskType: { type: String, enum: ['spam', 'referral', 'other'], default: 'spam' },
  description: { type: String, trim: true },
  screenshots: [{ type: String, required: true }], // Array of image URLs/paths
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  pointsAwarded: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
