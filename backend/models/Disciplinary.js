const mongoose = require('mongoose');

const disciplinarySchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  infractionType: {
    type: String,
    required: true,
    enum: ['minor', 'major', 'severe']
  },
  description: {
    type: String,
    required: true
  },
  dateOfInfraction: {
    type: Date,
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sanction: {
    type: String,
    enum: ['warning', 'suspension', 'demotion', 'termination', 'none']
  },
  sanctionDetails: String,
  sanctionDate: Date,
  remedialMeasures: String,
  staffResponse: String,
  responseDate: Date,
  actionTaken: String,
  actionTakenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actionDate: Date,
  appeal: {
    hasAppealed: Boolean,
    appealDetails: String,
    appealDate: Date,
    appealDecision: String,
    appealDecidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appealDecisionDate: Date
  },
  documents: [String],
  status: {
    type: String,
    enum: ['open', 'under-review', 'resolved', 'appealed'],
    default: 'open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Disciplinary', disciplinarySchema);
