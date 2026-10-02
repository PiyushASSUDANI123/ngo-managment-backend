const mongoose = require('mongoose');

const shoutoutSchema = new mongoose.Schema({
  donorName: { type: String, required: true },
  amount: { type: Number },
  message: { type: String },
  image: { type: String }, // URL to uploaded photo
  slug: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Shoutout', shoutoutSchema);
