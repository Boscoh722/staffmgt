import api from './api';

export const reportService = {
  // ============================================
  // EXISTING REPORT ROUTES (for direct downloads)
  // ============================================
  
  generateAttendanceReport: (params) =>
    api.get('/reports/attendance', {
      params,
      responseType: params?.format !== 'json' ? 'blob' : 'json',
    }),

  generateLeaveReport: (params) =>
    api.get('/reports/leaves', {
      params,
      responseType: params?.format !== 'json' ? 'blob' : 'json',
    }),

  generateDisciplinaryReport: (params) =>
    api.get('/reports/disciplinary', {
      params,
      responseType: params?.format !== 'json' ? 'blob' : 'json',
    }),

  generatePerformanceReport: (params) =>
    api.get('/reports/performance', {
      params,
      responseType: params?.format !== 'json' ? 'blob' : 'json',
    }),

  generateDashboardReport: (params) =>
    api.get('/reports/dashboard', {
      params,
      responseType: params?.format !== 'json' ? 'blob' : 'json',
    }),

  generateStaffReport: (staffId, params) =>
    api.get(`/reports/staff/${staffId}`, {
      params,
      responseType: params?.format !== 'json' ? 'blob' : 'json',
    }),

  generateDepartmentReport: (params) =>
    api.get('/reports/department', {
      params,
      responseType: params?.format !== 'json' ? 'blob' : 'json',
    }),

  generateLeaveBalanceReport: (params) =>
    api.get('/reports/leave-balance', {
      params,
      responseType: params?.format !== 'json' ? 'blob' : 'json',
    }),

  getRecentActivities: () => api.get('/reports/recent-activities'),

  // ============================================
  // NEW REPORT MANAGEMENT ROUTES
  // ============================================

  // Get all generated reports
  getGeneratedReports: (params = {}) => 
    api.get('/reports/list', { params }),

  // Get single report details
  getReport: (id) => 
    api.get(`/reports/view/${id}`),

  // Download saved report file
  downloadReport: (id) => 
    api.get(`/reports/download/${id}`, { responseType: 'blob' }),

  // Delete report
  deleteReport: (id) => 
    api.delete(`/reports/delete/${id}`),

  // Generate new report (unified endpoint - saves to database)
  generateAndSaveReport: (data) => 
    api.post('/reports/generate', data),

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  // Unified report generator with save option
  generateReport: async (type, filters, options = {}) => {
    try {
      const { 
        format = 'json', 
        save = false, 
        title = null,
        startDate = null,
        endDate = null 
      } = options;

      // For direct downloads (old behavior)
      if (!save && format !== 'json') {
        let response;
        const params = { ...filters, format };

        switch (type) {
          case 'attendance':
            response = await reportService.generateAttendanceReport(params);
            break;
          case 'leaves':
            response = await reportService.generateLeaveReport(params);
            break;
          case 'disciplinary':
            response = await reportService.generateDisciplinaryReport(params);
            break;
          case 'performance':
            response = await reportService.generatePerformanceReport(params);
            break;
          case 'dashboard':
            response = await reportService.generateDashboardReport(params);
            break;
          case 'department':
            response = await reportService.generateDepartmentReport(params);
            break;
          case 'leave-balance':
            response = await reportService.generateLeaveBalanceReport(params);
            break;
          default:
            throw new Error('Invalid report type');
        }

        return response.data;
      }

      // For saved reports (new behavior)
      if (save) {
        const reportData = {
          reportType: type,
          filters,
          format,
          title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        };

        // Add date range for relevant reports
        if (['attendance', 'leaves', 'disciplinary'].includes(type)) {
          if (startDate && endDate) {
            reportData.startDate = startDate;
            reportData.endDate = endDate;
          } else if (filters.startDate && filters.endDate) {
            reportData.startDate = filters.startDate;
            reportData.endDate = filters.endDate;
          }
        }

        const response = await reportService.generateAndSaveReport(reportData);
        return response.data;
      }

      // For JSON preview (old behavior)
      const params = { ...filters, format: 'json' };
      let response;

      switch (type) {
        case 'attendance':
          response = await reportService.generateAttendanceReport(params);
          break;
        case 'leaves':
          response = await reportService.generateLeaveReport(params);
          break;
        case 'disciplinary':
          response = await reportService.generateDisciplinaryReport(params);
          break;
        case 'performance':
          response = await reportService.generatePerformanceReport(params);
          break;
        case 'dashboard':
          response = await reportService.generateDashboardReport(params);
          break;
        case 'department':
          response = await reportService.generateDepartmentReport(params);
          break;
        case 'leave-balance':
          response = await reportService.generateLeaveBalanceReport(params);
          break;
        default:
          throw new Error('Invalid report type');
      }

      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  // Quick report download helpers
  downloadQuickAttendanceReport: async (startDate, endDate, department = null) => {
    const params = {
      startDate,
      endDate,
      department,
      format: 'excel',
      save: false
    };
    
    try {
      const response = await reportService.generateAttendanceReport(params);
      reportService.handleBlobResponse(response.data, `attendance_${startDate}_to_${endDate}.xlsx`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  downloadQuickLeaveReport: async (status = 'approved') => {
    const params = {
      status,
      format: 'excel',
      save: false
    };
    
    try {
      const response = await reportService.generateLeaveReport(params);
      reportService.handleBlobResponse(response.data, `leave_report_${status}_${Date.now()}.xlsx`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Handle blob download
  handleBlobResponse: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Get report preview (JSON format)
  getReportPreview: (type, filters) =>
    reportService.generateReport(type, filters, { format: 'json', save: false }),

  // Export report data with various formats
  exportReportData: async (type, filters, format = 'excel', save = false) => {
    try {
      const options = { format, save };
      
      if (format !== 'json') {
        options.save = false; // Non-JSON formats don't save by default
      }

      const data = await reportService.generateReport(type, filters, options);

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const filename = `${type}_report_${Date.now()}.json`;
        reportService.handleBlobResponse(blob, filename);
      } else if (data && data.downloadUrl) {
        // For saved reports with download URL
        window.open(data.downloadUrl, '_blank');
      } else if (data instanceof Blob) {
        // For direct downloads
        const filename = `${type}_report_${Date.now()}.${format}`;
        reportService.handleBlobResponse(data, filename);
      }

      return { 
        success: true, 
        data,
        savedReportId: data?.reportId,
        downloadUrl: data?.downloadUrl 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get report statistics
  getReportStats: async () => {
    try {
      const reports = await reportService.getGeneratedReports();
      const totalReports = reports.data?.pagination?.total || 0;
      const recentReports = reports.data?.reports?.slice(0, 5) || [];
      
      // Calculate stats from recent reports
      const stats = {
        totalReports,
        recentCount: recentReports.length,
        byType: {},
        byFormat: {},
        totalDownloads: 0
      };

      recentReports.forEach(report => {
        stats.byType[report.reportType] = (stats.byType[report.reportType] || 0) + 1;
        stats.byFormat[report.format] = (stats.byFormat[report.format] || 0) + 1;
        stats.totalDownloads += report.downloadCount || 0;
      });

      return { success: true, stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Format report date for display
  formatReportDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Get report type label
  getReportTypeLabel: (type) => {
    const labels = {
      'attendance': 'Attendance Report',
      'leaves': 'Leave Report',
      'disciplinary': 'Disciplinary Report',
      'performance': 'Performance Report',
      'dashboard': 'Dashboard Report',
      'staff': 'Staff Report',
      'department': 'Department Report',
      'leave-balance': 'Leave Balance Report'
    };
    return labels[type] || type;
  },

  // Get format icon
  getFormatIcon: (format) => {
    const icons = {
      'pdf': 'picture_as_pdf',
      'excel': 'grid_on',
      'csv': 'table_chart',
      'json': 'code'
    };
    return icons[format] || 'description';
  },

  // Get status color
  getStatusColor: (status) => {
    const colors = {
      'completed': 'success',
      'processing': 'warning',
      'failed': 'error',
      'pending': 'info'
    };
    return colors[status] || 'default';
  }
};

export default reportService;