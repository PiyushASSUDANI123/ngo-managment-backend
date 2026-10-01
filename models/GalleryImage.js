const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  caption: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  category: { type: String, enum: ['Education', 'Creative Learning', 'Community', 'Events', 'Other'], default: 'Other' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('GalleryImage', galleryImageSchema);
