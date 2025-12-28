const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'wish'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', ProjectSchema);
