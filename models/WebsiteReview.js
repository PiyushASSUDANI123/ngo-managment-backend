const mongoose = require('mongoose');

const websiteReviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  review: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  role: { type: String, enum: ['Donor', 'Volunteer', 'Supporter', 'Parent', 'Student', 'Other'], default: 'Supporter' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, {
  timestamps: true
});

module.exports = mongoose.model('WebsiteReview', websiteReviewSchema);
