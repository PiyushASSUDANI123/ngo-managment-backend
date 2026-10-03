const mongoose = require('mongoose');

const websiteApplicationSchema = new mongoose.Schema({
  name: { type: String },
  class: { type: String },
  school: { type: String },
  location: { type: String },
  department: { type: String },
  reason: { type: String },
  contact: { type: String },
  experienceLink: { type: String },
  reference: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('WebsiteApplication', websiteApplicationSchema);
