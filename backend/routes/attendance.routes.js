const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Leave = require('../models/Leave');

// Mark attendance - Add better validation
router.post('/mark', auth, authorize('clerk', 'supervisor', 'admin'), async (req, res) => {
  try {
    const { staffId, date, status, checkInTime, checkOutTime, remarks } = req.body;
    
    // Validate required fields
    if (!staffId || !date || !status) {
      return res.status(400).json({ 
        error: 'Missing required fields: staffId, date, and status are required' 
      });
    }

    // Validate staff exists
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Validate date format
    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Validate date is not in future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (attendanceDate > today) {
      return res.status(400).json({ error: 'Cannot mark attendance for future dates' });
    }

    // Normalize date to start of day for comparison
    const normalizedDate = new Date(attendanceDate);
    normalizedDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      staff: staffId,
      date: {
        $gte: normalizedDate,
        $lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    let attendance;
    if (existingAttendance) {
      // Update existing
      existingAttendance.status = status;
      existingAttendance.checkInTime = checkInTime || existingAttendance.checkInTime;
      existingAttendance.checkOutTime = checkOutTime || existingAttendance.checkOutTime;
      existingAttendance.remarks = remarks;
      existingAttendance.markedBy = req.user._id;
      
      // Calculate hours
      if (checkInTime && checkOutTime) {
        const hours = (new Date(checkOutTime) - new Date(checkInTime)) / (1000 * 60 * 60);
        existingAttendance.hoursWorked = hours;
      }
      
      attendance = await existingAttendance.save();
    } else {
      // Create new
      attendance = new Attendance({
        staff: staffId,
        date: normalizedDate,
        status,
        checkInTime,
        checkOutTime,
        remarks,
        markedBy: req.user._id
      });

      // Calculate hours
      if (checkInTime && checkOutTime) {
        const hours = (new Date(checkOutTime) - new Date(checkInTime)) / (1000 * 60 * 60);
        attendance.hoursWorked = hours;
      }

      await attendance.save();
    }

    // Populate staff details for response
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('staff', 'firstName lastName employeeId department')
      .populate('markedBy', 'firstName lastName');

    res.json(populatedAttendance);

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(400).json({ 
      error: error.message,
      details: 'Check the data format and try again' 
    });
  }
});
// Bulk mark attendance
router.post('/bulk', auth, authorize('clerk', 'admin'), async (req, res) => {
  try {
    const { date, attendanceData } = req.body;
    const results = [];
    const errors = [];

    for (const data of attendanceData) {
      try {
        const attendance = await Attendance.findOneAndUpdate(
          {
            staff: data.staffId,
            date: new Date(date)
          },
          {
            status: data.status,
            remarks: data.remarks,
            markedBy: req.user._id
          },
          { upsert: true, new: true }
        );
        results.push(attendance);
      } catch (error) {
        errors.push({ staffId: data.staffId, error: error.message });
      }
    }

    res.json({
      success: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get attendance for staff (Staff)
router.get('/my-attendance', auth, authorize('staff'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { staff: req.user._id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.date = { $gte: thirtyDaysAgo };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('markedBy', 'firstName lastName');
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance for all staff (Admin/Supervisor/Clerk)
router.get('/', auth, authorize('admin', 'supervisor', 'clerk'), async (req, res) => {
  try {
    const { date, startDate, endDate, staffId, department } = req.query;
    
    const query = {};
    
    // Filter by date range or single date
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: start,
        $lte: end
      };
    } else if (date) {
      // Single date filter (backward compatibility)
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.date = {
        $gte: filterDate,
        $lt: nextDay
      };
    }

    // Filter by staff
    if (staffId) {
      query.staff = staffId;
    } else if (req.user.role === 'supervisor') {
      // Get staff under supervisor
      const supervisedStaff = await User.find({ 
        supervisor: req.user._id 
      }).select('_id');
      
      const staffIds = supervisedStaff.map(staff => staff._id);
      query.staff = { $in: staffIds };
    } else if (department) {
      // Filter by department
      const staffInDept = await User.find({ department }).select('_id');
      const staffIds = staffInDept.map(staff => staff._id);
      query.staff = { $in: staffIds };
    }

    const attendance = await Attendance.find(query)
      .populate('staff', 'firstName lastName employeeId department')
      .populate('markedBy', 'firstName lastName')
      .sort({ date: -1, 'staff.firstName': 1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance statistics - ENHANCED FOR DASHBOARD
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate, staffId } = req.query;
    
    const query = {};
    const staffIdToUse = staffId || (req.user.role === 'staff' ? req.user._id : null);
    
    if (staffIdToUse) {
      query.staff = staffIdToUse;
    }
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      query.date = {
        $gte: firstDay,
        $lte: lastDay
      };
    }

    const attendance = await Attendance.find(query);
    
    // Calculate daily statistics for chart
    const dailyStats = {};
    attendance.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!dailyStats[dateStr]) {
        dailyStats[dateStr] = {
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          total: 0
        };
      }
      dailyStats[dateStr][record.status]++;
      dailyStats[dateStr].total++;
    });
    
    // Convert to array for chart
    const chartData = Object.keys(dailyStats)
      .sort()
      .map(date => ({
        date,
        ...dailyStats[date]
      }));
    
    const stats = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      leave: attendance.filter(a => a.status === 'leave').length,
      offDuty: attendance.filter(a => a.status === 'off-duty').length,
      late: attendance.filter(a => a.status === 'late').length,
      chartData,
      averageHours: 0
    };

    // Calculate average hours worked
    const presentDays = attendance.filter(a => a.hoursWorked);
    if (presentDays.length > 0) {
      const totalHours = presentDays.reduce((sum, a) => sum + a.hoursWorked, 0);
      stats.averageHours = (totalHours / presentDays.length).toFixed(2);
    }

    // Calculate attendance percentage
    const workingDays = attendance.filter(a => 
      ['present', 'late', 'leave', 'off-duty'].includes(a.status)
    ).length;
    stats.attendancePercentage = attendance.length > 0 
      ? ((workingDays / attendance.length) * 100).toFixed(2) 
      : 0;

    // Get today's stats separately
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });
    
    const todayPresent = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: 'present'
    });
    
    const todayAbsent = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: 'absent'
    });

    stats.today = {
      total: todayAttendance,
      present: todayPresent,
      absent: todayAbsent
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly summary
router.get('/monthly-summary', auth, async (req, res) => {
  try {
    const { year, month, staffId } = req.query;
    
    const query = { staff: staffId || req.user._id };
    
    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);
    
    query.date = {
      $gte: startDate,
      $lte: endDate
    };

    const attendance = await Attendance.find(query)
      .sort({ date: 1 });

    // Create calendar view
    const daysInMonth = endDate.getDate();
    const calendar = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(targetYear, targetMonth - 1, day);
      const attendanceForDay = attendance.find(a => 
        a.date.getDate() === day
      );
      
      calendar.push({
        date,
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
        attendance: attendanceForDay || { status: 'not-marked' },
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }

    res.json({
      year: targetYear,
      month: targetMonth,
      calendar,
      summary: await calculateMonthlyStats(attendance)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update attendance (Admin/Clerk)
router.put('/:id', auth, authorize('admin', 'clerk'), async (req, res) => {
  try {
    const updates = req.body;
    updates.markedBy = req.user._id;
    
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('staff', 'firstName lastName employeeId');
    
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    // Add audit trail
    await createAuditLog(req.user, 'attendance', 'update', {
      attendanceId: attendance._id,
      staffId: attendance.staff._id,
      date: attendance.date
    });

    res.json(attendance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get dashboard attendance overview
router.get('/dashboard/overview', auth, authorize('admin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get today's attendance
    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('staff', 'firstName lastName department');

    // Get monthly attendance for chart
    const monthlyAttendance = await Attendance.find({
      date: { $gte: thirtyDaysAgo }
    });

    // Process daily attendance for chart
    const dailyAttendance = {};
    monthlyAttendance.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!dailyAttendance[dateStr]) {
        dailyAttendance[dateStr] = {
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          total: 0
        };
      }
      dailyAttendance[dateStr][record.status]++;
      dailyAttendance[dateStr].total++;
    });

    // Convert to array for chart
    const chartData = Object.keys(dailyAttendance)
      .sort()
      .slice(-30) // Last 30 days
      .map(date => ({
        date,
        present: dailyAttendance[date].present,
        absent: dailyAttendance[date].absent,
        late: dailyAttendance[date].late
      }));

    // Today's statistics
    const todayStats = {
      present: todayAttendance.filter(a => a.status === 'present').length,
      absent: todayAttendance.filter(a => a.status === 'absent').length,
      late: todayAttendance.filter(a => a.status === 'late').length,
      leave: todayAttendance.filter(a => a.status === 'leave').length,
      total: todayAttendance.length
    };

    // Monthly statistics
    const monthlyStats = {
      present: monthlyAttendance.filter(a => a.status === 'present').length,
      absent: monthlyAttendance.filter(a => a.status === 'absent').length,
      late: monthlyAttendance.filter(a => a.status === 'late').length,
      leave: monthlyAttendance.filter(a => a.status === 'leave').length,
      total: monthlyAttendance.length,
      attendanceRate: monthlyAttendance.length > 0 
        ? Math.round((monthlyAttendance.filter(a => a.status === 'present').length / monthlyAttendance.length) * 100)
        : 0
    };

    res.json({
      today: todayStats,
      monthly: monthlyStats,
      chartData,
      recentAbsentees: todayAttendance
        .filter(a => a.status === 'absent')
        .slice(0, 5)
        .map(a => ({
          name: `${a.staff.firstName} ${a.staff.lastName}`,
          department: a.staff.department,
          reason: a.remarks || 'No reason provided'
        }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
async function calculateMonthlyStats(attendance) {
  const stats = {
    workingDays: attendance.length,
    present: 0,
    absent: 0,
    leave: 0,
    offDuty: 0,
    late: 0,
    totalHours: 0
  };

  attendance.forEach(record => {
    stats[record.status]++;
    if (record.hoursWorked) {
      stats.totalHours += record.hoursWorked;
    }
  });

  return stats;
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
