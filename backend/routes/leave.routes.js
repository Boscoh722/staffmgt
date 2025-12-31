const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Leave = require('../models/Leave');
const User = require('../models/User');
const { sendTemplateEmail } = require('../utils/emailService');
const EmailTemplate = require('../models/EmailTemplate');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

// Apply for leave (Staff)
router.post('/apply', auth, authorize('staff'), upload.array('documents'), async (req, res) => {
  try {
    const leaveData = {
      ...req.body,
      staff: req.user._id,
      numberOfDays: calculateDays(req.body.startDate, req.body.endDate)
    };

    if (req.files) {
      leaveData.supportingDocuments = req.files.map(file => `/uploads/${file.filename}`);
    }

    const leave = new Leave(leaveData);
    await leave.save();

    // Send notification to supervisor
    const supervisor = await User.findById(req.user.supervisor);
    if (supervisor) {
      const template = await EmailTemplate.findOne({ name: 'leave_application' });
      if (template) {
        await sendTemplateEmail(template, supervisor, {
          staffName: `${req.user.firstName} ${req.user.lastName}`,
          leaveType: leave.leaveType,
          startDate: new Date(leave.startDate).toLocaleDateString(),
          endDate: new Date(leave.endDate).toLocaleDateString(),
          numberOfDays: leave.numberOfDays
        });
      }
    }

    res.status(201).json(leave);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get staff's leaves (Staff)
router.get('/my-leaves', auth, authorize('staff'), async (req, res) => {
  try {
    const leaves = await Leave.find({ staff: req.user._id })
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'firstName lastName');
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all leaves with filters (Supervisor/Admin/Clerk) - ENHANCED
router.get('/', auth, authorize('supervisor', 'admin', 'clerk'), async (req, res) => {
  try {
    const { 
      status, 
      leaveType, 
      department,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    let query = {};

    // Status filter
    if (status) {
      query.status = status;
    }

    // Leave type filter
    if (leaveType) {
      query.leaveType = leaveType;
    }

    // Date range filter for createdAt (when leave was applied)
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // For supervisor, only show their staff's leaves
    if (req.user.role === 'supervisor') {
      const staffUnderSupervision = await User.find({ supervisor: req.user._id }).select('_id');
      const staffIds = staffUnderSupervision.map(staff => staff._id);
      query.staff = { $in: staffIds };
    }

    // Department filter
    if (department && req.user.role === 'admin') {
      const staffInDept = await User.find({ department }).select('_id');
      const staffIds = staffInDept.map(staff => staff._id);
      query.staff = { $in: staffIds };
    }

    const skip = (page - 1) * limit;

    const leaves = await Leave.find(query)
      .populate('staff', 'firstName lastName email position department profileImage')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Leave.countDocuments(query);

    // Get monthly summary for dashboard
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyLeaves = await Leave.find({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      leaves,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      monthlyStats: {
        total: monthlyLeaves.length,
        approved: monthlyLeaves.filter(l => l.status === 'approved').length,
        pending: monthlyLeaves.filter(l => l.status === 'pending').length,
        rejected: monthlyLeaves.filter(l => l.status === 'rejected').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly leave statistics for dashboard
router.get('/monthly-stats', auth, authorize('admin', 'supervisor', 'clerk'), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const leaves = await Leave.find({
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });

    // Group by day for chart
    const dailyStats = {};
    
    // Initialize last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = {
        approved: 0,
        pending: 0,
        rejected: 0,
        total: 0
      };
    }

    // Count leaves per day
    leaves.forEach(leave => {
      const dateStr = new Date(leave.createdAt).toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        dailyStats[dateStr][leave.status]++;
        dailyStats[dateStr].total++;
      }
    });

    // Convert to array for chart
    const chartData = Object.keys(dailyStats)
      .sort()
      .map(date => ({
        date,
        ...dailyStats[date]
      }));

    // Overall statistics
    const totalLeaves = leaves.length;
    const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
    const rejectedLeaves = leaves.filter(l => l.status === 'rejected').length;

    res.json({
      chartData,
      summary: {
        total: totalLeaves,
        approved: approvedLeaves,
        pending: pendingLeaves,
        rejected: rejectedLeaves,
        approvalRate: totalLeaves > 0 ? Math.round((approvedLeaves / totalLeaves) * 100) : 0
      },
      recentLeaves: await Leave.find()
        .populate('staff', 'firstName lastName email position')
        .sort({ createdAt: -1 })
        .limit(10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve/Reject leave
router.put('/:id/status', auth, authorize('supervisor', 'admin', 'clerk'), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    
    const leave = await Leave.findById(req.params.id).populate('staff');
    if (!leave) {
      return res.status(404).json({ error: 'Leave not found' });
    }

    // Supervisor permission check
    if (req.user.role === 'supervisor') {
      const staff = await User.findById(leave.staff._id);
      if (!staff || staff.supervisor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to approve this leave' });
      }
    }

    leave.status = status;
    leave.approvedBy = req.user._id;
    
    if (status === 'rejected') {
      leave.rejectionReason = rejectionReason;
    } else if (status === 'approved') {
      await updateLeaveBalance(leave.staff._id, leave.leaveType, leave.numberOfDays);
    }

    await leave.save();

    // Send email notification
    const templateName = status === 'approved' ? 'leave_approval' : 'leave_rejection';
    const template = await EmailTemplate.findOne({ name: templateName });
    
    if (template) {
      await sendTemplateEmail(template, leave.staff, {
        leaveType: leave.leaveType,
        startDate: new Date(leave.startDate).toLocaleDateString(),
        endDate: new Date(leave.endDate).toLocaleDateString(),
        numberOfDays: leave.numberOfDays,
        rejectionReason: leave.rejectionReason || ''
      });
    }

    // Audit log
    await createAuditLog(req.user, 'update', 'leave', {
      leaveId: leave._id,
      status,
      staffId: leave.staff._id
    });

    res.json(leave);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Leave statistics
router.get('/stats', auth, async (req, res) => {
  getStats(req, res);
});

router.get('/stats/:staffId', auth, async (req, res) => {
  getStats(req, res);
});

// Cancel leave
router.put('/:id/cancel', auth, authorize('staff'), async (req, res) => {
  try {
    const leave = await Leave.findOne({
      _id: req.params.id,
      staff: req.user._id
    });

    if (!leave) {
      return res.status(404).json({ error: 'Leave not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending leaves can be cancelled' });
    }

    leave.status = 'cancelled';
    await leave.save();

    res.json({ message: 'Leave cancelled successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* ---------------------------------------
   Helper Functions
---------------------------------------- */

async function getStats(req, res) {
  try {
    const staffId = req.params.staffId || req.user._id;

    if (req.user.role === 'staff' && req.user._id.toString() !== staffId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await calculateLeaveStats(staffId);
    res.json(stats);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
}

async function updateLeaveBalance(staffId, leaveType, daysTaken) {
  const user = await User.findById(staffId);
  
  if (!user.leaveBalance) {
    user.leaveBalance = {};
  }
  
  if (!user.leaveBalance[leaveType]) {
    user.leaveBalance[leaveType] = {
      total: getDefaultLeaveDays(leaveType),
      taken: 0,
      remaining: getDefaultLeaveDays(leaveType)
    };
  }
  
  user.leaveBalance[leaveType].taken += daysTaken;
  user.leaveBalance[leaveType].remaining = user.leaveBalance[leaveType].total - user.leaveBalance[leaveType].taken;
  
  await user.save();
}

function getDefaultLeaveDays(leaveType) {
  const defaults = {
    annual: 21,
    maternity: 90,
    paternity: 14,
    sick: 30,
    compassionate: 7,
    study: 30
  };
  return defaults[leaveType] || 0;
}

async function calculateLeaveStats(staffId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const leaves = await Leave.find({ 
    staff: staffId,
    createdAt: { $gte: thirtyDaysAgo }
  });
  
  const stats = {
    totalApplied: leaves.length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
    pending: leaves.filter(l => l.status === 'pending').length,
    byType: {},
    monthlyTrend: processMonthlyTrend(leaves)
  };

  leaves.forEach(leave => {
    if (!stats.byType[leave.leaveType]) {
      stats.byType[leave.leaveType] = {
        total: 0,
        approved: 0,
        pending: 0
      };
    }
    
    stats.byType[leave.leaveType].total += leave.numberOfDays;
    if (leave.status === 'approved') {
      stats.byType[leave.leaveType].approved += leave.numberOfDays;
    } else if (leave.status === 'pending') {
      stats.byType[leave.leaveType].pending += leave.numberOfDays;
    }
  });

  return stats;
}

function processMonthlyTrend(leaves) {
  const dailyCount = {};
  
  leaves.forEach(leave => {
    const date = new Date(leave.createdAt).toISOString().split('T')[0];
    dailyCount[date] = (dailyCount[date] || 0) + 1;
  });
  
  return Object.keys(dailyCount)
    .sort()
    .map(date => ({
      date,
      count: dailyCount[date]
    }));
}

async function createAuditLog(user, action, entity, details) {
  try {
    const AuditLog = require('../models/AuditLog');
    
    const log = new AuditLog({
      user: user._id,
      action,
      entity,
      details,
      timestamp: new Date()
    });
    
    await log.save();
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

module.exports = router;