// staffService.js - UPDATED VERSION
import api from './api';

export const staffService = {
  // Staff
  getStaff: () => api.get('/staff'),
  getProfile: (id) => api.get(`/staff/profile/${id}`),
  updateProfile: (id, data) => api.put(`/staff/profile/${id}`, data),
  addQualification: (id, data) => api.post(`/staff/qualifications/${id}`, data),
  
  // Attendance - UPDATED
  getAttendance: (params) => api.get('/attendance', { params }),
  
  // Fixed: Check if it's bulk or single attendance
  markAttendance: (data) => {
    // Check if data contains attendanceData array (bulk marking)
    if (data.attendanceData && Array.isArray(data.attendanceData)) {
      return api.post('/attendance/bulk', data);
    } else {
      // Single attendance marking
      return api.post('/attendance/mark', data);
    }
  },
  
  // Alternative: Separate methods for bulk and single
  markSingleAttendance: (data) => api.post('/attendance/mark', data),
  markBulkAttendance: (data) => api.post('/attendance/bulk', data),
  
  getMyAttendance: (params) => api.get('/attendance/my-attendance', { params }),
  getAttendanceStats: (params) => api.get('/attendance/stats', { params }),
  getMonthlySummary: (params) => api.get('/attendance/monthly-summary', { params }),
  getAttendanceOverview: () => api.get('/attendance/dashboard/overview'),
  
  // Leaves
  applyLeave: (data) => api.post('/leaves/apply', data),
  getMyLeaves: () => api.get('/leaves/my-leaves'),
  getAllLeaves: (params) => api.get('/leaves', { params }),
  updateLeaveStatus: (id, data) => api.put(`/leaves/${id}/status`, data),
  getLeaveStats: (staffId) => api.get(`/leaves/stats/${staffId}`),
  cancelLeave: (id) => api.put(`/leaves/${id}/cancel`),
  getMonthlyLeaveStats: () => api.get('/leaves/monthly-stats'),
  
  // Disciplinary - UPDATED WITH MISSING METHOD
  getDisciplinaryCases: () => api.get('/disciplinary'),
  getMyCases: () => api.get('/disciplinary/my-cases'),
  createCase: (data) => api.post('/disciplinary', data),
  addResponse: (id, data) => api.post(`/disciplinary/${id}/response`, data),
  fileAppeal: (id, data) => api.post(`/disciplinary/${id}/appeal`, data),
  updateCaseStatus: (id, data) => api.put(`/disciplinary/${id}/status`, data), // ADDED THIS
  
  // Admin
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  getEmailTemplates: () => api.get('/admin/email-templates'),
  sendBulkEmails: (data) => api.post('/admin/send-bulk-emails', data),
  assignSupervisor: (staffId, supervisorId) => api.put(`/staff/${staffId}/assign-supervisor`, { supervisorId }),
  getSupervisors: () => api.get('/staff/supervisors'),

  // Supervisor
  getSupervisedStaff: () => api.get('/staff/supervised'),
  
  // Reports
  generateReport: (type, params) => api.get(`/reports/${type}`, { params }),
  
  // Audit
  getAuditLogs: (params) => api.get('/audit/logs', { params }),
  
  // Departments
  getDepartmentOptions: () => api.get('/departments/options'),
  getDepartments: (params) => api.get('/departments', { params }),
  createDepartment: (data) => api.post('/departments', data),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/departments/${id}`)
};