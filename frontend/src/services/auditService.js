import api from './api';

export const auditService = {
  // Get audit logs with filters
  getAuditLogs: (params) => api.get('/audit/logs', { params }),
  
  // Get audit statistics
  getAuditStats: (params) => api.get('/audit/stats', { params }),
  
  // Get user-specific audit trail
  getUserAuditTrail: (userId, params) => api.get(`/audit/user/${userId}`, { params }),
  
  // Search audit logs
  searchAuditLogs: (data) => api.post('/audit/search', data),
  
  // Export audit logs
  exportAuditLogs: (params) => api.get('/audit/export', { 
    params,
    responseType: params.format === 'json' ? 'json' : 'blob'
  }),
  
  // Get activity summary
  getActivitySummary: (params) => api.get('/audit/activity-summary', { params }),
  
  // Get audit log by ID
  getAuditLogById: (id) => api.get(`/audit/${id}`),
  
  // Clean up old audit logs
  cleanupAuditLogs: (data) => api.delete('/audit/cleanup', { data }),
  
  // Get recent activities
  getRecentActivities: (limit = 20) => 
    api.get('/audit/logs', { params: { limit, sortBy: 'timestamp', sortOrder: 'desc' } }),
  
  // Get failed login attempts
  getFailedLogins: (hours = 24) => 
    api.get('/audit/logs', { 
      params: { 
        action: 'login',
        status: 'failed',
        startDate: new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString(),
        sortBy: 'timestamp',
        sortOrder: 'desc'
      }
    }),
  
  // Get high severity events
  getHighSeverityEvents: (days = 7) =>
    api.get('/audit/logs', {
      params: {
        severity: 'high,critical',
        startDate: new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString(),
        sortBy: 'timestamp',
        sortOrder: 'desc'
      }
    })
};
