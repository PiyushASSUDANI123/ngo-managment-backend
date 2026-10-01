const mongoose = require('mongoose');

const websiteApplicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  class: { type: String, required: true },
  school: { type: String, required: true },
  location: { type: String, required: true },
  department: { type: String, required: true },
  reason: { type: String, required: true },
  contact: { type: String, required: true },
  experienceLink: { type: String },
  reference: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, {
  timestamps: true
});

module.exports = mongoose.model('WebsiteApplication', websiteApplicationSchema);
