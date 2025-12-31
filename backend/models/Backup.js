const mongoose = require('mongoose');

const backupSchema = new mongoose.Schema({
  backupId: {
    type: String,
    required: true,
    unique: true
  },
  data: mongoose.Schema.Types.Mixed,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  size: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Backup', backupSchema);
