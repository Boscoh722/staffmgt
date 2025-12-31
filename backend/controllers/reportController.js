// controllers/reportController.js
const mongoose = require('mongoose');
const Report = require('../models/Report');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Disciplinary = require('../models/Disciplinary');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// ============================================
// REPORT MANAGEMENT CONTROLLERS
// ============================================

// @desc    Get all generated reports
// @route   GET /api/reports/list
// @access  Private (Admin, Supervisor, Clerk)
const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, startDate, endDate } = req.query;
    
    const query = {};
    
    if (type && type !== 'undefined' && type !== '') query.reportType = type;
    if (status && status !== 'undefined' && status !== '') query.status = status;
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Non-admins can only see their own reports
    if (req.user.role !== 'admin') {
      query.generatedBy = req.user.id;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    const reports = await Report.find(query)
      .populate('generatedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single report
// @route   GET /api/reports/view/:id
// @access  Private
const getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('generatedBy', 'firstName lastName email');

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && report.generatedBy._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this report' });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Download report file
// @route   GET /api/reports/download/:id
// @access  Private
const downloadReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    if (report.status !== 'completed') {
      return res.status(400).json({ success: false, error: 'Report is not ready for download' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && report.generatedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to download this report' });
    }

    // Increment download count
    report.downloadCount += 1;
    await report.save();

    // Send file if exists
    if (report.filePath && fs.existsSync(report.filePath)) {
      const filename = `${report.title.replace(/\s+/g, '_')}_${report._id}.${report.format}`;
      return res.download(report.filePath, filename);
    }

    // Fallback to sending JSON data
    res.json({
      success: true,
      message: 'Report data',
      data: report.data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/delete/:id
// @access  Private/Admin
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Only admins can delete any report
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to delete reports' });
    }

    // Delete file if exists
    if (report.filePath && fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
    }

    await report.deleteOne();

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Generate new report
// @route   POST /api/reports/generate
// @access  Private (Admin, Supervisor, Clerk)
const generateReport = async (req, res) => {
  try {
    const { reportType, filters = {}, options = {} } = req.body;
    
    const { format = 'excel', save = true, title } = options;
    
    if (!reportType) {
      return res.status(400).json({ success: false, error: 'Report type is required' });
    }

    let reportData;
    let generatedFilePath = null;

    // Generate report based on type
    switch (reportType) {
      case 'attendance':
        reportData = await generateAttendanceReportData(filters);
        if (format !== 'json') {
          generatedFilePath = await generateAttendanceFile(reportData, filters, format);
        }
        break;
        
      case 'leaves':
        reportData = await generateLeaveReportData(filters);
        if (format !== 'json') {
          generatedFilePath = await generateLeaveFile(reportData, filters, format);
        }
        break;
        
      case 'disciplinary':
        reportData = await generateDisciplinaryReportData(filters);
        if (format !== 'json') {
          generatedFilePath = await generateDisciplinaryFile(reportData, filters, format);
        }
        break;
        
      case 'performance':
        reportData = await generatePerformanceReportData(filters);
        if (format !== 'json') {
          generatedFilePath = await generatePerformanceFile(reportData, filters, format);
        }
        break;
        
      case 'dashboard':
        reportData = await generateDashboardReportData(filters);
        if (format !== 'json') {
          generatedFilePath = await generateDashboardFile(reportData, filters, format);
        }
        break;
        
      case 'department':
        reportData = await generateDepartmentReportData(filters);
        if (format !== 'json') {
          generatedFilePath = await generateDepartmentFile(reportData, filters, format);
        }
        break;
        
      case 'leave-balance':
        reportData = await generateLeaveBalanceReportData(filters);
        if (format !== 'json') {
          generatedFilePath = await generateLeaveBalanceFile(reportData, filters, format);
        }
        break;
        
      default:
        return res.status(400).json({ success: false, error: 'Invalid report type' });
    }

    let savedReport = null;
    
    // Save to database if requested
    if (save) {
      const reportTitle = title || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${new Date().toLocaleDateString()}`;
      
      savedReport = await Report.create({
        title: reportTitle,
        reportType,
        generatedBy: req.user.id,
        filters,
        format,
        data: reportData,
        filePath: generatedFilePath,
        status: 'completed',
        downloadCount: 0,
        metadata: {
          generatedAt: new Date(),
          fileSize: generatedFilePath ? `${(fs.statSync(generatedFilePath).size / 1024).toFixed(2)} KB` : null
        }
      });
    }

    const response = {
      success: true,
      message: 'Report generated successfully',
      reportType,
      format,
      data: format === 'json' ? reportData : null,
      downloadUrl: format !== 'json' && generatedFilePath ? `/api/reports/download/${savedReport?._id}` : null,
      savedReportId: savedReport?._id
    };

    // If not saving and format is not JSON, send the file directly
    if (!save && format !== 'json' && generatedFilePath) {
      const filename = `${reportType}_report_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;
      return res.download(generatedFilePath, filename);
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// SPECIFIC REPORT GENERATORS
// ============================================

// Attendance Report
async function generateAttendanceReportData(filters) {
  const { startDate, endDate, department, staffId } = filters;
  
  if (!startDate || !endDate) {
    throw new Error('Start date and end date are required for attendance report');
  }

  const query = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  // Apply filters
  if (staffId) {
    query.staff = staffId;
  } else if (department) {
    const staffInDept = await User.find({ department }).select('_id');
    query.staff = { $in: staffInDept.map(s => s._id) };
  }

  const attendance = await Attendance.find(query)
    .populate('staff', 'firstName lastName employeeId department position')
    .populate('markedBy', 'firstName lastName')
    .sort({ date: 1, 'staff.firstName': 1 });

  // Calculate summary
  const summary = await calculateAttendanceSummary(query, startDate, endDate);

  return {
    period: { startDate, endDate },
    summary,
    attendance,
    totalRecords: attendance.length,
    generatedAt: new Date()
  };
}

// Leave Report
async function generateLeaveReportData(filters) {
  const { startDate, endDate, department, leaveType, status } = filters;
  
  const query = {};

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (leaveType) query.leaveType = leaveType;
  if (status) query.status = status;

  // Apply department filter
  if (department) {
    const staffInDept = await User.find({ department }).select('_id');
    query.staff = { $in: staffInDept.map(s => s._id) };
  }

  const leaves = await Leave.find(query)
    .populate('staff', 'firstName lastName employeeId department')
    .populate('approvedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  // Calculate statistics
  const stats = await calculateLeaveStatistics(query);

  return {
    filters,
    statistics: stats,
    leaves,
    totalRecords: leaves.length,
    generatedAt: new Date()
  };
}

// Disciplinary Report
async function generateDisciplinaryReportData(filters) {
  const { startDate, endDate, department, infractionType, status } = filters;
  
  const query = {};

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (infractionType) query.infractionType = infractionType;
  if (status) query.status = status;

  // Apply department filter
  if (department) {
    const staffInDept = await User.find({ department }).select('_id');
    query.staff = { $in: staffInDept.map(s => s._id) };
  }

  const cases = await Disciplinary.find(query)
    .populate('staff', 'firstName lastName employeeId department')
    .populate('reportedBy', 'firstName lastName')
    .populate('actionTakenBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  // Calculate statistics
  const stats = await calculateDisciplinaryStatistics(query);

  return {
    filters,
    statistics: stats,
    cases,
    totalRecords: cases.length,
    generatedAt: new Date()
  };
}

// Performance Report
async function generatePerformanceReportData(filters) {
  const { department, period = 'month' } = filters;
  
  const query = { role: 'staff', isActive: true };
  if (department) query.department = department;

  const staff = await User.find(query)
    .select('firstName lastName employeeId department position dateOfJoining')
    .populate('supervisor', 'firstName lastName');

  const performanceData = [];

  for (const employee of staff) {
    const performance = await calculateStaffPerformance(employee._id, period);
    performanceData.push({
      staff: employee,
      performance
    });
  }

  // Sort by performance score
  performanceData.sort((a, b) => b.performance.score - a.performance.score);

  return {
    period,
    department: department || 'All',
    totalStaff: performanceData.length,
    data: performanceData,
    generatedAt: new Date()
  };
}

// Dashboard Report
async function generateDashboardReportData(filters) {
  const { period = 'month' } = filters;
  
  const dashboardData = await generateDashboardData(period);

  return {
    ...dashboardData,
    generatedAt: new Date()
  };
}

// Department Report
async function generateDepartmentReportData(filters) {
  const { department } = filters;
  
  const departments = department ? [department] : await getDistinctDepartments();

  const departmentReports = [];

  for (const dept of departments) {
    const report = await generateDepartmentReport(dept);
    departmentReports.push(report);
  }

  return {
    generatedAt: new Date(),
    reports: departmentReports
  };
}

// Leave Balance Report
async function generateLeaveBalanceReportData(filters) {
  const { department } = filters;
  
  const query = { role: 'staff', isActive: true };
  if (department) query.department = department;

  const staff = await User.find(query)
    .select('firstName lastName employeeId department position leaveBalance')
    .sort('department lastName');

  const leaveBalanceData = staff.map(employee => ({
    employee: {
      name: `${employee.firstName} ${employee.lastName}`,
      employeeId: employee.employeeId,
      department: employee.department,
      position: employee.position
    },
    leaveBalance: employee.leaveBalance || {}
  }));

  return {
    generatedAt: new Date(),
    department: department || 'All Departments',
    totalStaff: leaveBalanceData.length,
    data: leaveBalanceData
  };
}

// ============================================
// HELPER FUNCTIONS (from your routes)
// ============================================

async function calculateAttendanceSummary(query, startDate, endDate) {
  const attendance = await Attendance.find(query)
    .populate('staff', 'department');

  const summary = {
    totalDays: attendance.length,
    present: 0,
    absent: 0,
    leave: 0,
    offDuty: 0,
    late: 0,
    byDepartment: {},
    averageAttendance: 0
  };

  attendance.forEach(record => {
    const status = record.status || 'absent';
    summary[status] = (summary[status] || 0) + 1;
    
    if (record.staff && record.staff.department) {
      if (!summary.byDepartment[record.staff.department]) {
        summary.byDepartment[record.staff.department] = {
          present: 0,
          absent: 0,
          leave: 0,
          offDuty: 0,
          late: 0,
          total: 0
        };
      }
      summary.byDepartment[record.staff.department][status]++;
      summary.byDepartment[record.staff.department].total++;
    }
  });

  // Calculate average attendance percentage
  const workingDays = (summary.present || 0) + (summary.late || 0) + (summary.leave || 0) + (summary.offDuty || 0);
  summary.averageAttendance = summary.totalDays > 0 
    ? ((workingDays / summary.totalDays) * 100).toFixed(2) 
    : 0;

  return summary;
}

async function calculateLeaveStatistics(query) {
  const leaves = await Leave.find(query);
  
  const stats = {
    total: leaves.length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
    pending: leaves.filter(l => l.status === 'pending').length,
    cancelled: leaves.filter(l => l.status === 'cancelled').length,
    byType: {},
    byMonth: {}
  };

  leaves.forEach(leave => {
    // By type
    if (!stats.byType[leave.leaveType]) {
      stats.byType[leave.leaveType] = {
        total: 0,
        approved: 0,
        days: 0
      };
    }
    stats.byType[leave.leaveType].total++;
    if (leave.status === 'approved') {
      stats.byType[leave.leaveType].approved++;
      stats.byType[leave.leaveType].days += leave.numberOfDays || 0;
    }

    // By month
    const month = leave.startDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!stats.byMonth[month]) {
      stats.byMonth[month] = 0;
    }
    stats.byMonth[month]++;
  });

  // Calculate approval rate
  stats.approvalRate = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(2) : 0;

  return stats;
}

async function calculateDisciplinaryStatistics(query) {
  const cases = await Disciplinary.find(query);
  
  const stats = {
    total: cases.length,
    open: cases.filter(c => c.status === 'open').length,
    underReview: cases.filter(c => c.status === 'under-review').length,
    resolved: cases.filter(c => c.status === 'resolved').length,
    appealed: cases.filter(c => c.status === 'appealed').length,
    byInfractionType: {},
    bySanction: {},
    byDepartment: {}
  };

  cases.forEach(caseItem => {
    // By infraction type
    if (!stats.byInfractionType[caseItem.infractionType]) {
      stats.byInfractionType[caseItem.infractionType] = 0;
    }
    stats.byInfractionType[caseItem.infractionType]++;

    // By sanction
    const sanction = caseItem.sanction || 'none';
    if (!stats.bySanction[sanction]) {
      stats.bySanction[sanction] = 0;
    }
    stats.bySanction[sanction]++;
  });

  // Calculate resolution rate
  stats.resolutionRate = stats.total > 0 
    ? (((stats.resolved) / stats.total) * 100).toFixed(2) 
    : 0;

  return stats;
}

async function calculateStaffPerformance(staffId, period) {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'quarter':
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  const [attendance, leaves, disciplinary] = await Promise.all([
    Attendance.find({
      staff: staffId,
      date: { $gte: startDate }
    }),
    Leave.find({
      staff: staffId,
      status: 'approved',
      startDate: { $gte: startDate }
    }),
    Disciplinary.find({
      staff: staffId,
      status: { $in: ['open', 'under-review'] },
      createdAt: { $gte: startDate }
    })
  ]);

  const presentDays = attendance.filter(a => a.status === 'present').length;
  const totalDays = attendance.length;
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  const performance = {
    period,
    startDate,
    endDate: new Date(),
    attendance: {
      totalDays,
      presentDays,
      attendanceRate: attendanceRate.toFixed(2),
      leavesTaken: leaves.reduce((sum, leave) => sum + (leave.numberOfDays || 0), 0),
      disciplinaryCases: disciplinary.length
    },
    score: calculatePerformanceScore(attendanceRate, leaves.length, disciplinary.length)
  };

  return performance;
}

function calculatePerformanceScore(attendanceRate, leavesTaken, disciplinaryCases) {
  let score = 100;
  
  // Attendance component (60%)
  score *= (attendanceRate / 100) * 0.6;
  
  // Leave component (30%)
  const leavePenalty = Math.min(leavesTaken * 2, 30);
  score -= leavePenalty;
  
  // Disciplinary component (10% penalty per case)
  score -= disciplinaryCases * 10;
  
  return Math.max(0, Math.min(100, score)).toFixed(2);
}

async function generateDashboardData(period) {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'quarter':
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  const [
    totalStaff,
    activeStaff,
    todayAttendance,
    pendingLeaves,
    openDisciplinary,
    attendanceTrend,
    leaveTrend,
    departmentStats
  ] = await Promise.all([
    User.countDocuments({ role: 'staff' }),
    User.countDocuments({ role: 'staff', isActive: true }),
    Attendance.countDocuments({
      date: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      }
    }),
    Leave.countDocuments({ status: 'pending' }),
    Disciplinary.countDocuments({ status: { $in: ['open', 'under-review'] } }),
    getAttendanceTrend(startDate),
    getLeaveTrend(startDate),
    getDepartmentStatistics()
  ]);

  return {
    period,
    startDate,
    endDate: new Date(),
    summary: {
      totalStaff,
      activeStaff,
      todayAttendance,
      pendingLeaves,
      openDisciplinary,
      attendanceRate: await getOverallAttendanceRate(startDate)
    },
    trends: {
      attendance: attendanceTrend,
      leaves: leaveTrend
    },
    departmentStats,
    generatedAt: new Date()
  };
}

async function getAttendanceTrend(startDate) {
  const trend = [];
  const currentDate = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const attendance = await Attendance.countDocuments({
      date: { $gte: startOfDay, $lt: endOfDay },
      status: 'present'
    });
    
    const totalStaff = await User.countDocuments({ role: 'staff', isActive: true });
    const rate = totalStaff > 0 ? (attendance / totalStaff) * 100 : 0;
    
    trend.push({
      date: startOfDay.toLocaleDateString(),
      attendance,
      rate: rate.toFixed(2)
    });
  }
  
  return trend;
}

async function getLeaveTrend(startDate) {
  const trend = [];
  const months = 6;
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    
    const leaves = await Leave.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });
    
    trend.push({
      month: date.toLocaleString('default', { month: 'short' }),
      year,
      leaves
    });
  }
  
  return trend;
}

async function getDepartmentStatistics() {
  const departments = await getDistinctDepartments();
  const stats = [];
  
  for (const dept of departments) {
    const staffCount = await User.countDocuments({ 
      department: dept, 
      role: 'staff', 
      isActive: true 
    });
    
    const attendance = await Attendance.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'staff',
          foreignField: '_id',
          as: 'staffInfo'
        }
      },
      { $unwind: '$staffInfo' },
      { $match: { 'staffInfo.department': dept } },
      { $match: { status: 'present' } },
      { $count: 'presentCount' }
    ]);
    
    const presentCount = attendance[0]?.presentCount || 0;
    const attendanceRate = staffCount > 0 ? (presentCount / (staffCount * 20)) * 100 : 0;
    
    stats.push({
      department: dept,
      staffCount,
      attendanceRate: attendanceRate.toFixed(2),
      leaves: await Leave.countDocuments({ 
        'staff.department': dept,
        status: 'approved',
        startDate: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) }
      })
    });
  }
  
  return stats;
}

async function getOverallAttendanceRate(startDate) {
  const totalAttendanceDays = await Attendance.countDocuments({
    date: { $gte: startDate },
    status: 'present'
  });
  
  const totalStaff = await User.countDocuments({ role: 'staff', isActive: true });
  const workingDays = calculateWorkingDays(startDate, new Date());
  
  const expectedAttendance = totalStaff * workingDays;
  return expectedAttendance > 0 ? ((totalAttendanceDays / expectedAttendance) * 100).toFixed(2) : 0;
}

function calculateWorkingDays(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

async function getDistinctDepartments() {
  const departments = await User.distinct('department', { 
    role: 'staff', 
    isActive: true,
    department: { $ne: null, $ne: '' }
  });
  return departments.sort();
}

async function generateDepartmentReport(department) {
  const staff = await User.find({ 
    department, 
    role: 'staff', 
    isActive: true 
  }).select('firstName lastName employeeId position dateOfJoining');

  const attendance = await Attendance.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'staff',
        foreignField: '_id',
        as: 'staffInfo'
      }
    },
    { $unwind: '$staffInfo' },
    { $match: { 'staffInfo.department': department } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const leaves = await Leave.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'staff',
        foreignField: '_id',
        as: 'staffInfo'
      }
    },
    { $unwind: '$staffInfo' },
    { $match: { 'staffInfo.department': department } },
    {
      $group: {
        _id: { type: '$leaveType', status: '$status' },
        count: { $sum: 1 },
        totalDays: { $sum: '$numberOfDays' }
      }
    }
  ]);

  const disciplinary = await Disciplinary.countDocuments({
    'staff.department': department,
    createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
  });

  return {
    department,
    staffCount: staff.length,
    attendance: attendance.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
    leaves: leaves.reduce((acc, curr) => {
      if (!acc[curr._id.type]) {
        acc[curr._id.type] = { approved: 0, pending: 0, totalDays: 0 };
      }
      acc[curr._id.type][curr._id.status] = curr.count;
      acc[curr._id.type].totalDays += curr.totalDays;
      return acc;
    }, {}),
    disciplinaryCases: disciplinary,
    reportDate: new Date()
  };
}

// ============================================
// FILE GENERATION FUNCTIONS
// ============================================

async function generateAttendanceFile(data, filters, format) {
  if (format === 'excel') {
    return generateAttendanceExcel(data, filters);
  } else if (format === 'pdf') {
    return generateAttendancePDF(data, filters);
  } else if (format === 'csv') {
    return generateAttendanceCSV(data, filters);
  }
  return null;
}

async function generateAttendanceExcel(data, filters) {
  const filename = `attendance_report_${Date.now()}.xlsx`;
  const filepath = path.join(reportsDir, filename);
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Report');

  // Add headers
  worksheet.columns = [
    { header: 'Employee ID', key: 'employeeId', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Check In', key: 'checkIn', width: 15 },
    { header: 'Check Out', key: 'checkOut', width: 15 },
    { header: 'Hours Worked', key: 'hours', width: 15 },
    { header: 'Remarks', key: 'remarks', width: 30 }
  ];

  // Add data
  data.attendance.forEach(record => {
    worksheet.addRow({
      employeeId: record.staff.employeeId,
      name: `${record.staff.firstName} ${record.staff.lastName}`,
      department: record.staff.department,
      date: new Date(record.date).toLocaleDateString(),
      status: record.status,
      checkIn: record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : 'N/A',
      checkOut: record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : 'N/A',
      hours: record.hoursWorked || 'N/A',
      remarks: record.remarks || ''
    });
  });

  // Add summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 20 }
  ];

  summarySheet.addRow({ metric: 'Period', value: `${data.period.startDate} to ${data.period.endDate}` });
  summarySheet.addRow({ metric: 'Total Records', value: data.summary.totalDays });
  summarySheet.addRow({ metric: 'Present Days', value: data.summary.present });
  summarySheet.addRow({ metric: 'Absent Days', value: data.summary.absent });
  summarySheet.addRow({ metric: 'Leave Days', value: data.summary.leave });
  summarySheet.addRow({ metric: 'Average Attendance', value: `${data.summary.averageAttendance}%` });

  // Save file
  await workbook.xlsx.writeFile(filepath);
  return filepath;
}

async function generateAttendancePDF(data, filters) {
  return new Promise((resolve, reject) => {
    const filename = `attendance_report_${Date.now()}.pdf`;
    const filepath = path.join(reportsDir, filename);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('MAKONGENI WARD STAFF MANAGEMENT', { align: 'center' });
    doc.fontSize(16).text('Attendance Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${new Date(data.period.startDate).toLocaleDateString()} to ${new Date(data.period.endDate).toLocaleDateString()}`);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Summary
    doc.fontSize(14).text('Summary Statistics', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total Records: ${data.summary.totalDays}`);
    doc.text(`Present: ${data.summary.present} (${((data.summary.present/data.summary.totalDays)*100).toFixed(2)}%)`);
    doc.text(`Absent: ${data.summary.absent} (${((data.summary.absent/data.summary.totalDays)*100).toFixed(2)}%)`);
    doc.text(`Leave: ${data.summary.leave} (${((data.summary.leave/data.summary.totalDays)*100).toFixed(2)}%)`);
    doc.text(`Average Attendance: ${data.summary.averageAttendance}%`);
    doc.moveDown();

    doc.end();
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

async function generateAttendanceCSV(data, filters) {
  const filename = `attendance_report_${Date.now()}.csv`;
  const filepath = path.join(reportsDir, filename);
  
  let csvContent = 'Employee ID,Name,Department,Date,Status,Check In,Check Out,Hours Worked,Remarks\n';
  
  data.attendance.forEach(record => {
    csvContent += `${record.staff.employeeId},"${record.staff.firstName} ${record.staff.lastName}","${record.staff.department}",${new Date(record.date).toLocaleDateString()},"${record.status}","${record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : 'N/A'}","${record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : 'N/A'}","${record.hoursWorked || 'N/A'}","${record.remarks || ''}"\n`;
  });
  
  fs.writeFileSync(filepath, csvContent);
  return filepath;
}


async function generateLeaveFile(data, filters, format) {
  const filename = `leave_report_${Date.now()}.xlsx`;
  const filepath = path.join(reportsDir, filename);
  // Implement similar to generateAttendanceFile
  return filepath;
}

async function generateDisciplinaryFile(data, filters, format) {
  const filename = `disciplinary_report_${Date.now()}.xlsx`;
  const filepath = path.join(reportsDir, filename);
  // Implement similar to generateAttendanceFile
  return filepath;
}

async function generatePerformanceFile(data, filters, format) {
  const filename = `performance_report_${Date.now()}.xlsx`;
  const filepath = path.join(reportsDir, filename);
  // Implement similar to generateAttendanceFile
  return filepath;
}

async function generateDashboardFile(data, filters, format) {
  const filename = `dashboard_report_${Date.now()}.xlsx`;
  const filepath = path.join(reportsDir, filename);
  // Implement similar to generateAttendanceFile
  return filepath;
}

async function generateDepartmentFile(data, filters, format) {
  const filename = `department_report_${Date.now()}.xlsx`;
  const filepath = path.join(reportsDir, filename);
  // Implement similar to generateAttendanceFile
  return filepath;
}

async function generateLeaveBalanceFile(data, filters, format) {
  const filename = `leave_balance_report_${Date.now()}.xlsx`;
  const filepath = path.join(reportsDir, filename);
  // Implement similar to generateAttendanceFile
  return filepath;
}

module.exports = {
  getReports,
  getReport,
  downloadReport,
  deleteReport,
  generateReport
};