import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/auditService';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AuditLogViewer = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    endDate: new Date(),
    userId: '',
    action: '',
    entity: '',
    page: 1,
    limit: 50,
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  const [users, setUsers] = useState([]);
  const [actions, setActions] = useState([]);
  const [entities, setEntities] = useState([]);

  useEffect(() => {
    fetchLogs();
    fetchFilterOptions();
  }, [filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString()
      };
      
      const response = await auditService.getAuditLogs(params);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch audit logs');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await auditService.getAuditLogs({ 
        limit: 1,
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString()
      });
      
      setUsers(response.data.filters?.users || []);
      setActions(response.data.filters?.actions || []);
      setEntities(response.data.filters?.entities || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleExport = async (format) => {
    try {
      const params = {
        ...filters,
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        format
      };
      
      const response = await auditService.exportAuditLogs(params);
      
      if (format === 'json') {
        // Download JSON file
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
          type: 'application/json' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit_logs_${Date.now()}.json`;
        link.click();
      } else {
        // For CSV/Excel/PDF, response is already a blob
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit_logs_${Date.now()}.${format}`;
        link.click();
      }
      
      toast.success(`Exported audit logs as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export audit logs');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return '➕';
      case 'read': return '👁️';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'login': return '🔑';
      case 'logout': return '🚪';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Audit Log Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => handleFilterChange('startDate', date)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
              maxDate={new Date()}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => handleFilterChange('endDate', date)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
              maxDate={new Date()}
              minDate={filters.startDate}
            />
          </div>
          
          {/* User Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User
            </label>
            <select
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} ({user.role})
                </option>
              ))}
            </select>
          </div>
          
          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
            >
              <option value="">All Actions</option>
              {actions.map(action => (
                <option key={action} value={action}>
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Entity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entity
            </label>
            <select
              value={filters.entity}
              onChange={(e) => handleFilterChange('entity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
            >
              <option value="">All Entities</option>
              {entities.map(entity => (
                <option key={entity} value={entity}>
                  {entity.charAt(0).toUpperCase() + entity.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
            >
              <option value="timestamp">Timestamp</option>
              <option value="action">Action</option>
              <option value="entity">Entity</option>
              <option value="severity">Severity</option>
            </select>
          </div>
          
          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          
          {/* Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Records per page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="250">250</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {pagination.total ? ((filters.page - 1) * filters.limit) + 1 : 0} - {Math.min(filters.page * filters.limit, pagination.total)} of {pagination.total} records
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-4 py-2 bg-dark-green-600 text-white rounded-md text-sm font-medium hover:bg-dark-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-green-500 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
            
            <button
              onClick={() => setFilters({
                startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
                endDate: new Date(),
                userId: '',
                action: '',
                entity: '',
                page: 1,
                limit: 50,
                sortBy: 'timestamp',
                sortOrder: 'desc'
              })}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex justify-end space-x-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">Export as:</span>
          <button
            onClick={() => handleExport('pdf')}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Excel
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
          >
            JSON
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="animate-pulse">Loading audit logs...</div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No audit logs found for the selected filters
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {log.user?.role || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">{getActionIcon(log.action)}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {log.action.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 capitalize">
                      {log.entity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                        {log.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                      <div className="max-w-xs truncate" title={JSON.stringify(log.details)}>
                        {log.details.method} {log.details.path} - {log.details.statusCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {log.ipAddress || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-400">
                Page <span className="font-medium">{filters.page}</span> of <span className="font-medium">{pagination.pages}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                  disabled={filters.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (filters.page <= 3) {
                    pageNum = i + 1;
                  } else if (filters.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = filters.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handleFilterChange('page', pageNum)}
                      className={`px-3 py-1 border rounded-md text-sm font-medium ${
                        filters.page === pageNum
                          ? 'bg-dark-green-600 text-white border-dark-green-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handleFilterChange('page', Math.min(pagination.pages, filters.page + 1))}
                  disabled={filters.page === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogViewer;