const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  active: { type: Boolean, default: true } // If true, it pops up for users
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
