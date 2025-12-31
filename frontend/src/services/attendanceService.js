import api from './api';

const attendanceService = {
  // Get all attendance records with filters
  getAttendance: (params) => api.get('/attendance', { params }),
  
  // Get attendance for specific date
  getAttendanceByDate: (date) => {
    return api.get('/attendance', { params: { date } });
  },
  
  // Get attendance for date range
  getAttendanceByDateRange: (startDate, endDate, params = {}) => {
    return api.get('/attendance', { 
      params: { 
        startDate, 
        endDate, 
        ...params 
      } 
    });
  },
  
  // Get attendance by staff ID
  getAttendanceByStaff: (staffId, params = {}) => {
    return api.get('/attendance', { 
      params: { 
        staff: staffId,
        ...params 
      } 
    });
  },
  
  // Get my attendance (current user)
  getMyAttendance: (params) => api.get('/attendance/my-attendance', { params }),
  
  // Mark single attendance
  markSingleAttendance: (data) => api.post('/attendance/mark', data),
  
  // Mark bulk attendance
  markBulkAttendance: (data) => api.post('/attendance/bulk', data),
  
  // Get attendance statistics
  getAttendanceStats: (params) => api.get('/attendance/stats', { params }),
  
  // Get monthly summary
  getMonthlySummary: (params) => api.get('/attendance/monthly-summary', { params }),
  
  // Get weekly summary (you might need to add this endpoint)
  getWeeklySummary: (params) => {
    return api.get('/attendance', { 
      params: { 
        period: 'weekly',
        ...params 
      } 
    });
  },
  
  // Get dashboard overview
  getAttendanceOverview: () => api.get('/attendance/dashboard/overview'),
  
  // Get supervisor team attendance
  getTeamAttendance: (params = {}) => {
    return api.get('/attendance', { 
      params: { 
        supervisor: true,
        ...params 
      } 
    });
  },
  
  // Get attendance for supervisor's team by date
  getTeamAttendanceByDate: (date, params = {}) => {
    return api.get('/attendance', { 
      params: { 
        supervisor: true,
        date,
        ...params 
      } 
    });
  },
  
  // Get attendance summary for dashboard
  getDashboardSummary: () => {
    return api.get('/attendance/dashboard/overview');
  },
  
  // Get recent attendance activities
  getRecentActivities: (limit = 10) => {
    return api.get('/attendance', { 
      params: { 
        recent: true,
        limit,
        sortBy: 'createdAt:desc'
      } 
    });
  },
  
  // Update attendance status (for corrections)
  updateAttendance: (attendanceId, data) => {
    return api.put(`/attendance/${attendanceId}`, data);
  },
  
  // Calculate attendance percentage for a group
  calculateAttendancePercentage: (attendanceRecords) => {
    if (!attendanceRecords || attendanceRecords.length === 0) return 0;
    
    const presentCount = attendanceRecords.filter(
      record => record.status === 'present' || record.status === 'on-duty'
    ).length;
    
    return Math.round((presentCount / attendanceRecords.length) * 100);
  },
  
  // Helper: Get current week dates
  getCurrentWeekDates: () => {
    const dates = [];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Start from Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    }
    
    return dates;
  },
  
  // Helper: Format date for API
  formatDateForAPI: (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }
};

export default attendanceService;