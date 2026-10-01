const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Field', fieldSchema);
