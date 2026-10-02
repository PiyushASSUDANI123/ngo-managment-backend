const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  dueDate: { type: Date },
  notes: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' }
}, { timestamps: true });

taskSchema.index({ volunteer: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
