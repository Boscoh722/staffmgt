const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Disciplinary = require('../models/Disciplinary');
const EmailTemplate = require('../models/EmailTemplate');
const { sendEmail } = require('../utils/emailService');

// Dashboard statistics - UPDATED FOR REAL DATA
router.get('/dashboard/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Fetch all data in parallel for efficiency
    const [
      totalStaff,
      activeStaff,
      todayAttendance,
      todayLeaves,
      monthlyLeaves,
      recentLeaves,
      attendanceStats
    ] = await Promise.all([
      // Total staff count
      User.countDocuments({ role: 'staff' }),
      
      // Active staff count
      User.countDocuments({ role: 'staff', isActive: true }),
      
      // Today's attendance
      Attendance.find({
        date: { $gte: today, $lt: tomorrow }
      }).populate('staff', 'firstName lastName department'),
      
      // Leaves active today
      Leave.find({
        status: 'approved',
        startDate: { $lte: today },
        endDate: { $gte: today }
      }).populate('staff', 'firstName lastName'),
      
      // Leave applications from past 30 days
      Leave.find({
        createdAt: { $gte: thirtyDaysAgo }
      }).sort({ createdAt: -1 }),
      
      // Recent leave applications (last 7 days)
      Leave.find({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
        .populate('staff', 'firstName lastName email position department profileImage')
        .populate('approvedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10),
      
      // Monthly attendance statistics
      calculateAttendanceStats(startOfMonth, endOfMonth)
    ]);

    // Calculate statistics
    const todayPresent = todayAttendance.filter(a => a.status === 'present').length;
    const todayLate = todayAttendance.filter(a => a.status === 'late').length;
    const todayAbsent = todayAttendance.filter(a => a.status === 'absent').length;
    
    const activeLeavesToday = todayLeaves.length;
    
    // Process monthly leave data for chart
    const monthlyLeaveData = processMonthlyLeaveData(monthlyLeaves, thirtyDaysAgo);
    
    // Calculate approval rate for past 30 days
    const approvedLeaves = monthlyLeaves.filter(leave => leave.status === 'approved').length;
    const pendingLeaves = monthlyLeaves.filter(leave => leave.status === 'pending').length;
    const approvalRate = monthlyLeaves.length > 0 
      ? Math.round((approvedLeaves / monthlyLeaves.length) * 100) 
      : 0;

    // Get staff hired in last 30 days
    const recentHires = await User.countDocuments({
      role: 'staff',
      dateOfJoining: { $gte: thirtyDaysAgo }
    });

    // Get open disciplinary cases
    const openCases = await Disciplinary.countDocuments({ 
      status: { $in: ['open', 'under-review'] } 
    });

    res.json({
      // Staff statistics
      totalStaff,
      activeStaff,
      recentHires,
      
      // Leave statistics
      activeLeaves: activeLeavesToday,
      pendingLeaves,
      approvalRate,
      monthlyLeaves: monthlyLeaveData,
      recentLeaves,
      
      // Attendance statistics
      todayPresent,
      todayLate,
      todayAbsent,
      todayOnLeave: activeLeavesToday,
      attendanceStats,
      
      // Other statistics
      openCases,
      
      // Calculated values for dashboard cards
      todayAttendance: todayAttendance.length,
      monthlyLeaveCount: monthlyLeaves.length
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User management
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, department, isActive } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .populate('supervisor', 'firstName lastName')
      .populate('department', 'name code')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Update user
router.post('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const userData = req.body;
    
    // Generate employee ID if not provided
    if (!userData.employeeId && userData.role === 'staff') {
      userData.employeeId = await generateEmployeeId();
    }

    let user;
    if (userData._id) {
      // Update existing user
      user = await User.findByIdAndUpdate(
        userData._id,
        userData,
        { new: true, runValidators: true }
      ).select('-password');
    } else {
      // Create new user
      user = new User(userData);
      await user.save();
      user = user.toObject();
      delete user.password;
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Deactivate/Activate user
router.put('/users/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Manage email templates
router.get('/email-templates', auth, authorize('admin'), async (req, res) => {
  try {
    const templates = await EmailTemplate.find().sort({ name: 1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/email-templates', auth, authorize('admin'), async (req, res) => {
  try {
    const template = new EmailTemplate(req.body);
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/email-templates/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send bulk emails
router.post('/send-bulk-emails', auth, authorize('admin'), async (req, res) => {
  try {
    const { templateId, staffIds, additionalVariables } = req.body;
    
    const template = await EmailTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const staff = await User.find({ _id: { $in: staffIds } });
    const results = [];

    for (const staffMember of staff) {
      try {
        const result = await sendEmail(
          staffMember.email,
          template.subject,
          template.body,
          []
        );
        results.push({
          staffId: staffMember._id,
          email: staffMember.email,
          success: result.success,
          message: result.success ? 'Email sent' : result.error
        });
      } catch (error) {
        results.push({
          staffId: staffMember._id,
          email: staffMember.email,
          success: false,
          message: error.message
        });
      }
    }

    res.json({
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// System settings
router.get('/settings', auth, authorize('admin'), async (req, res) => {
  try {
    const settings = {
      leavePolicies: {
        annual: 21,
        maternity: 90,
        paternity: 14,
        sick: 30,
        compassionate: 7,
        study: 30
      },
      workingHours: {
        start: '08:00',
        end: '17:00',
        breakDuration: 60
      },
      notificationSettings: {
        emailNotifications: true,
        leaveReminders: true,
        attendanceAlerts: true
      }
    };

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Backup database
router.post('/backup', auth, authorize('admin'), async (req, res) => {
  try {
    const backupData = {
      timestamp: new Date(),
      users: await User.find().select('-password'),
      attendance: await Attendance.find().limit(1000),
      leaves: await Leave.find().limit(1000),
      disciplinary: await Disciplinary.find().limit(1000)
    };

    // In production, you would save this to a file or cloud storage
    const backupId = `backup_${Date.now()}`;
    
    // Save backup metadata to database
    const Backup = require('../models/Backup');
    const backup = new Backup({
      backupId,
      data: backupData,
      createdBy: req.user._id
    });
    
    await backup.save();

    res.json({
      message: 'Backup created successfully',
      backupId,
      timestamp: backup.timestamp
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
async function generateEmployeeId() {
  const year = new Date().getFullYear().toString().slice(-2);
  const lastStaff = await User.findOne({ role: 'staff' })
    .sort({ employeeId: -1 });
  
  let sequence = 1;
  if (lastStaff && lastStaff.employeeId) {
    const lastSequence = parseInt(lastStaff.employeeId.slice(-3));
    sequence = lastSequence + 1;
  }
  
  return `EMP${year}${sequence.toString().padStart(3, '0')}`;
}

// Process monthly leave data for chart
function processMonthlyLeaveData(leaves, thirtyDaysAgo) {
  const dailyData = {};
  
  // Initialize last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyData[dateStr] = { approved: 0, pending: 0, rejected: 0, total: 0 };
  }

  // Count leaves by date and status
  leaves.forEach(leave => {
    const date = new Date(leave.createdAt).toISOString().split('T')[0];
    if (dailyData[date]) {
      if (leave.status === 'approved') dailyData[date].approved++;
      else if (leave.status === 'pending') dailyData[date].pending++;
      else if (leave.status === 'rejected') dailyData[date].rejected++;
      dailyData[date].total++;
    }
  });

  // Convert to array format for chart
  return Object.keys(dailyData)
    .sort()
    .map(date => ({
      date,
      approved: dailyData[date].approved,
      pending: dailyData[date].pending,
      rejected: dailyData[date].rejected,
      total: dailyData[date].total
    }));
}

// Calculate attendance statistics
async function calculateAttendanceStats(startDate, endDate) {
  const attendance = await Attendance.find({
    date: { $gte: startDate, $lte: endDate }
  });

  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    onLeave: attendance.filter(a => a.status === 'leave').length,
    total: attendance.length
  };

  // Calculate percentages
  if (stats.total > 0) {
    stats.presentPercentage = Math.round((stats.present / stats.total) * 100);
    stats.absentPercentage = Math.round((stats.absent / stats.total) * 100);
    stats.latePercentage = Math.round((stats.late / stats.total) * 100);
    stats.leavePercentage = Math.round((stats.onLeave / stats.total) * 100);
  } else {
    stats.presentPercentage = 0;
    stats.absentPercentage = 0;
    stats.latePercentage = 0;
    stats.leavePercentage = 0;
  }

  return stats;
}

module.exports = router;