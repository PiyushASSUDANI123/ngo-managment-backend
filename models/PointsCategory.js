const mongoose = require('mongoose');

const pointsCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true, default: '' },
  defaultPoints: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('PointsCategory', pointsCategorySchema);
