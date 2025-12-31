const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get audit logs with filters
router.get('/logs', auth, authorize('admin'), async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      action,
      entity,
      entityId,
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // User filter
    if (userId) {
      query.user = userId;
    }

    // Action filter
    if (action) {
      query.action = action;
    }

    // Entity filter
    if (entity) {
      query.entity = entity;
    }

    // Entity ID filter
    if (entityId) {
      query.entityId = entityId;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get logs with population
    const logs = await AuditLog.find(query)
      .populate('user', 'firstName lastName email role employeeId')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await AuditLog.countDocuments(query);

    // Get unique users for filter dropdown
    const uniqueUsers = await AuditLog.distinct('user', query);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      filters: {
        users: await User.find({ _id: { $in: uniqueUsers } })
          .select('firstName lastName email role')
          .sort('firstName'),
        actions: await AuditLog.distinct('action', query),
        entities: await AuditLog.distinct('entity', query)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit log statistics
router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }

    let groupStage;
    let projectStage;
    
    switch (groupBy) {
      case 'hour':
        groupStage = {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' },
              hour: { $hour: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        };
        projectStage = {
          $project: {
            _id: 0,
            period: {
              $dateToString: {
                format: '%Y-%m-%d %H:00',
                date: {
                  $dateFromParts: {
                    year: '$_id.year',
                    month: '$_id.month',
                    day: '$_id.day',
                    hour: '$_id.hour'
                  }
                }
              }
            },
            count: 1
          }
        };
        break;
        
      case 'day':
        groupStage = {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        };
        projectStage = {
          $project: {
            _id: 0,
            period: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: {
                  $dateFromParts: {
                    year: '$_id.year',
                    month: '$_id.month',
                    day: '$_id.day'
                  }
                }
              }
            },
            count: 1
          }
        };
        break;
        
      case 'month':
        groupStage = {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        };
        projectStage = {
          $project: {
            _id: 0,
            period: {
              $dateToString: {
                format: '%Y-%m',
                date: {
                  $dateFromParts: {
                    year: '$_id.year',
                    month: '$_id.month'
                  }
                }
              }
            },
            count: 1
          }
        };
        break;
        
      default:
        groupStage = {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        };
        projectStage = {
          $project: {
            _id: 0,
            period: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: {
                  $dateFromParts: {
                    year: '$_id.year',
                    month: '$_id.month',
                    day: '$_id.day'
                  }
                }
              }
            },
            count: 1
          }
        };
    }

    const stats = await AuditLog.aggregate([
      { $match: matchStage },
      groupStage,
      projectStage,
      { $sort: { period: 1 } }
    ]);

    // Get top users by activity
    const topUsers = await AuditLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
          email: '$userInfo.email',
          role: '$userInfo.role',
          activityCount: '$count'
        }
      }
    ]);

    // Get actions distribution
    const actionsDistribution = await AuditLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get entities distribution
    const entitiesDistribution = await AuditLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$entity',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      period: {
        startDate: startDate || 'Beginning',
        endDate: endDate || 'Now'
      },
      activityOverTime: stats,
      topUsers,
      actionsDistribution,
      entitiesDistribution,
      summary: {
        totalActivities: stats.reduce((sum, item) => sum + item.count, 0),
        uniqueUsers: topUsers.length,
        mostActiveUser: topUsers[0] || null,
        mostCommonAction: actionsDistribution[0] || null,
        mostCommonEntity: entitiesDistribution[0] || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user-specific audit trail
router.get('/user/:userId', auth, authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;

    const query = { user: userId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('user', 'firstName lastName email role employeeId')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Get user information
    const user = await User.findById(userId)
      .select('firstName lastName email role department position dateOfJoining isActive');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate user activity statistics
    const activityStats = await AuditLog.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            action: '$action',
            entity: '$entity'
          },
          count: { $sum: 1 },
          firstActivity: { $min: '$timestamp' },
          lastActivity: { $max: '$timestamp' }
        }
      },
      {
        $group: {
          _id: '$_id.action',
          total: { $sum: '$count' },
          entities: {
            $push: {
              entity: '$_id.entity',
              count: '$count'
            }
          },
          firstActivity: { $min: '$firstActivity' },
          lastActivity: { $max: '$lastActivity' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      user,
      logs,
      activityStats,
      summary: {
        totalActivities: logs.length,
        firstActivity: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
        lastActivity: logs.length > 0 ? logs[0].timestamp : null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search audit logs
router.post('/search', auth, authorize('admin'), async (req, res) => {
    try {
      const { searchTerm, fields = [], startDate, endDate, page = 1, limit = 50 } = req.body;
  
      if (!searchTerm || searchTerm.length < 2) {
        return res.status(400).json({ error: 'Search term must be at least 2 characters long' });
      }
  
      const query = { $or: [] };
  
      // Determine which fields to search
      const searchFields = fields.length > 0 ? fields : ['action', 'entity', 'details', 'ipAddress', 'user'];
  
      // Build the query
      for (const field of searchFields) {
        if (field === 'details') {
          query.$or.push({
            details: { $regex: searchTerm, $options: 'i' }
          });
        } else if (field === 'user') {
          const userIds = await getUserIdsByName(searchTerm);
          if (userIds.length > 0) {
            query.$or.push({ user: { $in: userIds } });
          }
        } else {
          query.$or.push({
            [field]: { $regex: searchTerm, $options: 'i' }
          });
        }
      }
  
      // Date range filter
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
  
      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
  
      const logs = await AuditLog.find(query)
        .populate('user', 'firstName lastName email role employeeId')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit));
  
      const total = await AuditLog.countDocuments(query);
  
      res.json({
        searchTerm,
        fields: searchFields,
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Export audit logs
router.get('/export', auth, authorize('admin'), async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    const query = {};
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('user', 'firstName lastName email role employeeId')
      .sort({ timestamp: -1 });

    if (format === 'csv') {
      return exportAuditLogsCSV(res, logs);
    } else if (format === 'excel') {
      return exportAuditLogsExcel(res, logs);
    } else if (format === 'pdf') {
      return exportAuditLogsPDF(res, logs, startDate, endDate);
    }

    // Default to JSON
    res.json({
      exportDate: new Date(),
      period: { startDate, endDate },
      totalRecords: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system activity summary
router.get('/activity-summary', auth, authorize('admin'), async (req, res) => {
  try {
    const { period = '24h' } = req.query;

    let startDate = new Date();
    
    switch (period) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '6h':
        startDate.setHours(startDate.getHours() - 6);
        break;
      case '12h':
        startDate.setHours(startDate.getHours() - 12);
        break;
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 1);
    }

    const summary = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $facet: {
          // Hourly activity
          hourlyActivity: [
            {
              $group: {
                _id: {
                  hour: { $hour: '$timestamp' },
                  date: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$timestamp'
                    }
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.date': 1, '_id.hour': 1 } }
          ],
          
          // Top actions
          topActions: [
            {
              $group: {
                _id: '$action',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ],
          
          // Top users
          topUsers: [
            {
              $group: {
                _id: '$user',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userInfo'
              }
            },
            { $unwind: '$userInfo' }
          ],
          
          // Entity distribution
          entityDistribution: [
            {
              $group: {
                _id: '$entity',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          
          // Risk indicators
          riskIndicators: [
            {
              $match: {
                action: { $in: ['delete', 'update'] },
                entity: { $in: ['user', 'disciplinary', 'attendance'] }
              }
            },
            {
              $group: {
                _id: {
                  user: '$user',
                  action: '$action',
                  entity: '$entity'
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    // Calculate activity rate
    const totalHours = (new Date() - startDate) / (1000 * 60 * 60);
    const totalActivities = summary[0].hourlyActivity.reduce((sum, item) => sum + item.count, 0);
    const activityRate = totalHours > 0 ? (totalActivities / totalHours).toFixed(2) : 0;

    res.json({
      period,
      startDate,
      endDate: new Date(),
      summary: summary[0],
      metrics: {
        totalActivities,
        activityRate: `${activityRate} activities/hour`,
        peakHour: findPeakHour(summary[0].hourlyActivity),
        riskLevel: calculateRiskLevel(summary[0].riskIndicators)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clean old audit logs (admin only)
router.delete('/cleanup', auth, authorize('admin'), async (req, res) => {
  try {
    const { retentionDays = 90, dryRun = true } = req.body;

    if (retentionDays < 30) {
      return res.status(400).json({ error: 'Retention period must be at least 30 days' });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const query = { timestamp: { $lt: cutoffDate } };

    if (dryRun) {
      const logsToDelete = await AuditLog.countDocuments(query);
      const diskUsage = await estimateDiskUsage(query);
      
      return res.json({
        dryRun: true,
        cutoffDate,
        logsToDelete,
        estimatedDiskSpace: `${diskUsage} MB`,
        message: `This would delete ${logsToDelete} logs older than ${cutoffDate.toLocaleDateString()}`
      });
    }

    // Actually delete the logs
    const result = await AuditLog.deleteMany(query);

    // Log this cleanup action
    await createAuditLog(req.user, 'delete', 'audit', {
      retentionDays,
      logsDeleted: result.deletedCount,
      cutoffDate
    });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} audit logs`,
      cutoffDate,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit log by ID
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('user', 'firstName lastName email role employeeId department');

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    // Get related logs (same user, same entity, similar time)
    const relatedLogs = await AuditLog.find({
      _id: { $ne: log._id },
      $or: [
        { user: log.user, timestamp: { $gte: new Date(log.timestamp.getTime() - 3600000) } },
        { entity: log.entity, entityId: log.entityId }
      ]
    })
    .populate('user', 'firstName lastName')
    .sort({ timestamp: -1 })
    .limit(10);

    res.json({
      log,
      relatedLogs,
      context: {
        timePeriod: 'Last hour',
        totalRelated: relatedLogs.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper Functions

async function getUserIdsByName(name) {
  const users = await User.find({
    $or: [
      { firstName: { $regex: name, $options: 'i' } },
      { lastName: { $regex: name, $options: 'i' } },
      { email: { $regex: name, $options: 'i' } }
    ]
  }).select('_id');
  
  return users.map(user => user._id);
}

async function exportAuditLogsCSV(res, logs) {
  const headers = [
    'Timestamp',
    'User',
    'Role',
    'Action',
    'Entity',
    'Entity ID',
    'IP Address',
    'User Agent',
    'Details'
  ];

  let csvContent = headers.join(',') + '\n';

  logs.forEach(log => {
    const row = [
      `"${new Date(log.timestamp).toISOString()}"`,
      `"${log.user ? `${log.user.firstName} ${log.user.lastName}` : 'N/A'}"`,
      `"${log.user ? log.user.role : 'N/A'}"`,
      `"${log.action}"`,
      `"${log.entity}"`,
      `"${log.entityId || 'N/A'}"`,
      `"${log.ipAddress || 'N/A'}"`,
      `"${log.userAgent || 'N/A'}"`,
      `"${JSON.stringify(log.details).replace(/"/g, '""')}"`
    ];
    csvContent += row.join(',') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.csv`);
  res.send(csvContent);
}

async function exportAuditLogsExcel(res, logs) {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Audit Logs');

  // Add headers
  worksheet.columns = [
    { header: 'Timestamp', key: 'timestamp', width: 20 },
    { header: 'User', key: 'user', width: 25 },
    { header: 'Role', key: 'role', width: 15 },
    { header: 'Action', key: 'action', width: 15 },
    { header: 'Entity', key: 'entity', width: 15 },
    { header: 'Entity ID', key: 'entityId', width: 20 },
    { header: 'IP Address', key: 'ip', width: 20 },
    { header: 'User Agent', key: 'userAgent', width: 40 },
    { header: 'Details', key: 'details', width: 50 }
  ];

  // Add data
  logs.forEach(log => {
    worksheet.addRow({
      timestamp: new Date(log.timestamp),
      user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'N/A',
      role: log.user ? log.user.role : 'N/A',
      action: log.action,
      entity: log.entity,
      entityId: log.entityId || 'N/A',
      ip: log.ipAddress || 'N/A',
      userAgent: log.userAgent || 'N/A',
      details: JSON.stringify(log.details, null, 2)
    });
  });

  // Format date column
  worksheet.getColumn('timestamp').numFmt = 'yyyy-mm-dd hh:mm:ss';

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
}

async function exportAuditLogsPDF(res, logs, startDate, endDate) {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ margin: 50 });
  const filename = `audit_logs_${Date.now()}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  // Header
  doc.fontSize(20).text('MAKONGENI WARD STAFF MANAGEMENT', { align: 'center' });
  doc.fontSize(16).text('Audit Log Report', { align: 'center' });
  doc.moveDown();
  
  // Period
  if (startDate || endDate) {
    doc.fontSize(12).text(`Period: ${startDate ? new Date(startDate).toLocaleDateString() : 'Beginning'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'Now'}`);
  }
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`);
  doc.text(`Total Records: ${logs.length}`);
  doc.moveDown();

  // Logs
  let pageNumber = 1;
  
  logs.forEach((log, index) => {
    if (index > 0 && index % 25 === 0) {
      doc.addPage();
      pageNumber++;
    }
    
    doc.fontSize(10)
      .text(`${index + 1}. ${new Date(log.timestamp).toLocaleString()}`, { continued: true })
      .text(` - ${log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown'}`, { continued: true })
      .text(` - ${log.action} ${log.entity}`, { align: 'right' })
      .moveDown(0.2);
    
    if (log.details) {
      doc.fontSize(8)
        .text(`Details: ${JSON.stringify(log.details)}`, { indent: 20 })
        .moveDown(0.2);
    }
    
    if (log.ipAddress) {
      doc.fontSize(8)
        .text(`IP: ${log.ipAddress}`, { indent: 20 })
        .moveDown(0.2);
    }
    
    doc.moveDown(0.5);
  });

  // Footer with page numbers
  doc.on('pageAdded', () => {
    doc.y = doc.page.height - 50;
    doc.fontSize(10)
      .text(`Page ${pageNumber}`, { align: 'center' });
    pageNumber++;
  });

  doc.end();
}

function findPeakHour(hourlyActivity) {
  if (!hourlyActivity || hourlyActivity.length === 0) {
    return null;
  }
  
  return hourlyActivity.reduce((peak, current) => 
    current.count > peak.count ? current : peak
  );
}

function calculateRiskLevel(riskIndicators) {
  if (!riskIndicators || riskIndicators.length === 0) {
    return 'low';
  }
  
  const totalRiskActions = riskIndicators.reduce((sum, item) => sum + item.count, 0);
  
  if (totalRiskActions > 50) return 'high';
  if (totalRiskActions > 20) return 'medium';
  return 'low';
}

async function estimateDiskUsage(query) {
  // This is a simplified estimation
  const count = await AuditLog.countDocuments(query);
  const avgLogSize = 500; // bytes per log (estimate)
  return ((count * avgLogSize) / (1024 * 1024)).toFixed(2);
}

async function createAuditLog(user, action, entity, details) {
  const log = new AuditLog({
    user: user._id,
    action,
    entity,
    details,
    ipAddress: '127.0.0.1', // In production, get from request
    userAgent: 'System'
  });
  
  await log.save();
  return log;
}

module.exports = router;
