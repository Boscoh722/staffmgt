import React, { useState } from 'react';
import { reportService } from '../../services/reportService';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';

const ReportGenerator = ({ reportType }) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    department: '',
    format: 'pdf'
  });

  const reportTypes = {
    attendance: {
      title: 'Attendance Report',
      description: 'Generate attendance report for selected period',
      filters: ['startDate', 'endDate', 'department', 'staffId']
    },
    leaves: {
      title: 'Leave Report',
      description: 'Generate leave application and approval report',
      filters: ['startDate', 'endDate', 'department', 'leaveType', 'status']
    },
    disciplinary: {
      title: 'Disciplinary Report',
      description: 'Generate disciplinary cases report',
      filters: ['startDate', 'endDate', 'department', 'infractionType', 'status']
    },
    performance: {
      title: 'Performance Report',
      description: 'Generate staff performance evaluation report',
      filters: ['department', 'period']
    },
    dashboard: {
      title: 'Dashboard Report',
      description: 'Generate comprehensive system dashboard report',
      filters: ['period']
    },
    department: {
      title: 'Department Report',
      description: 'Generate department-wise analysis report',
      filters: ['department']
    },
    'leave-balance': {
      title: 'Leave Balance Report',
      description: 'Generate staff leave balance report',
      filters: ['department']
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await reportService.generateReport(reportType, filters, filters.format);
      
      if (filters.format === 'json') {
        // Display JSON data
        console.log('Report data:', response);
        toast.success('Report generated successfully!');
      } else {
        // Download file
        const blob = new Blob([response], { 
          type: filters.format === 'pdf' 
            ? 'application/pdf' 
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const filename = `${reportType}_report_${Date.now()}.${filters.format}`;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success(`${filters.format.toUpperCase()} report downloaded successfully!`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const renderFilter = (filterName) => {
    switch (filterName) {
      case 'startDate':
      case 'endDate':
        return (
          <div key={filterName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
              {filterName.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <DatePicker
              selected={filters[filterName]}
              onChange={(date) => setFilters(prev => ({ ...prev, [filterName]: date }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
              dateFormat="yyyy-MM-dd"
            />
          </div>
        );
      
      case 'department':
        return (
          <div key={filterName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
            >
              <option value="">All Departments</option>
              <option value="Administration">Administration</option>
              <option value="Finance">Finance</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Operations">Operations</option>
              <option value="IT">IT</option>
            </select>
          </div>
        );
      
      case 'format':
        return (
          <div key={filterName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Format
            </label>
            <select
              value={filters.format}
              onChange={(e) => setFilters(prev => ({ ...prev, format: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="json">JSON</option>
            </select>
          </div>
        );
      
      case 'period':
        return (
          <div key={filterName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Period
            </label>
            <select
              value={filters.period || 'month'}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        );
      
      case 'leaveType':
        return (
          <div key={filterName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Leave Type
            </label>
            <select
              value={filters.leaveType || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, leaveType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
            >
              <option value="">All Types</option>
              <option value="annual">Annual</option>
              <option value="maternity">Maternity</option>
              <option value="paternity">Paternity</option>
              <option value="sick">Sick</option>
              <option value="compassionate">Compassionate</option>
              <option value="study">Study</option>
            </select>
          </div>
        );
      
      case 'status':
        return (
          <div key={filterName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        );
      
      default:
        return (
          <div key={filterName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
              {filterName.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <input
              type="text"
              value={filters[filterName] || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, [filterName]: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
              placeholder={`Enter ${filterName}`}
            />
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {reportTypes[reportType]?.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {reportTypes[reportType]?.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes[reportType]?.filters.map(filter => renderFilter(filter))}
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={() => setFilters({
            startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
            endDate: new Date(),
            department: '',
            format: 'pdf'
          })}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset Filters
        </button>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-dark-green-600 text-white rounded-md text-sm font-medium hover:bg-dark-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-green-500 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </div>
  );
};

export default ReportGenerator;