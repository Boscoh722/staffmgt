const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create', 'read', 'update', 'delete',
      'login', 'logout', 'export', 'import',
      'approve', 'reject', 'suspend', 'activate',
      'password_change', 'profile_update', 'file_upload',
      'email_sent', 'report_generated', 'backup_created',
      'system_config', 'permission_change'
    ],
    index: true
  },
  entity: {
    type: String,
    required: true,
    enum: [
      'user', 'attendance', 'leave', 'disciplinary',
      'email', 'report', 'backup', 'system',
      'qualification', 'department', 'position',
      'template', 'audit', 'notification', 'file'
    ],
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  ipAddress: {
    type: String,
    index: true
  },
  userAgent: String,
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'partial'],
    default: 'success'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  sessionId: String,
  requestId: String,
  responseTime: Number, // in milliseconds
  resource: String, // API endpoint or page URL
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    index: { expires: 0 } // TTL index
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for common queries
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ action: 1, entity: 1 });
auditLogSchema.index({ timestamp: -1, severity: 1 });

// Virtual for formatted date
auditLogSchema.virtual('formattedDate').get(function() {
  return this.timestamp.toLocaleString();
});

// Virtual for user info (for populated queries)
auditLogSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Method to calculate severity based on action and entity
auditLogSchema.methods.calculateSeverity = function() {
  const criticalActions = ['delete', 'suspend', 'password_change', 'permission_change'];
  const criticalEntities = ['user', 'system', 'backup'];
  
  if (criticalActions.includes(this.action) && criticalEntities.includes(this.entity)) {
    return 'critical';
  }
  
  if (this.action === 'login' && this.status === 'failed') {
    return 'high';
  }
  
  if (['update', 'create'].includes(this.action) && ['user', 'disciplinary'].includes(this.entity)) {
    return 'medium';
  }
  
  return 'low';
};

// Pre-save middleware to calculate severity
auditLogSchema.pre('save', function(next) {
  if (!this.severity || this.isModified('action') || this.isModified('entity') || this.isModified('status')) {
    this.severity = this.calculateSeverity();
  }
  next();
});

// Static method to get recent activities
auditLogSchema.statics.getRecentActivities = async function(limit = 50) {
  return this.find()
    .populate('user', 'firstName lastName email role')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get activities by user
auditLogSchema.statics.getUserActivities = async function(userId, limit = 100) {
  return this.find({ user: userId })
    .populate('user', 'firstName lastName email role')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get failed login attempts
auditLogSchema.statics.getFailedLogins = async function(hours = 24) {
  const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
  
  return this.find({
    action: 'login',
    status: 'failed',
    timestamp: { $gte: cutoff }
  })
  .populate('user', 'firstName lastName email')
  .sort({ timestamp: -1 });
};

// Static method to get high severity events
auditLogSchema.statics.getHighSeverityEvents = async function(days = 7) {
  const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  
  return this.find({
    severity: { $in: ['high', 'critical'] },
    timestamp: { $gte: cutoff }
  })
  .populate('user', 'firstName lastName email role')
  .sort({ timestamp: -1 });
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
