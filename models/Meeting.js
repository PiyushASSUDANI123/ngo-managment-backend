const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  description: { type: String, trim: true },
  attendance: [{
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
    status: { type: String, enum: ['Present', 'Absent'], required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
