// models/Report.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const ReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true
  },
  reportType: {
    type: String,
    required: [true, 'Report type is required'],
    enum: ['attendance', 'leaves', 'disciplinary', 'performance', 'dashboard', 'staff', 'department', 'leave-balance']
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filters: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  dateRange: {
    startDate: Date,
    endDate: Date
  },
  format: {
    type: String,
    enum: ['pdf', 'excel', 'csv', 'json'],
    default: 'json'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  filePath: {
    type: String
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'completed'
  },
  metadata: {
    generatedAt: {
      type: Date,
      default: Date.now
    },
    rowCount: Number,
    fileSize: String,
    generationTime: Number
  }
}, {
  timestamps: true
});

// Indexes for faster queries
ReportSchema.index({ reportType: 1, createdAt: -1 });
ReportSchema.index({ generatedBy: 1, status: 1 });
ReportSchema.index({ 'dateRange.startDate': 1, 'dateRange.endDate': 1 });

// Add pagination plugin
ReportSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Report', ReportSchema);