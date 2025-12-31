import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const SupervisorLeaves = () => {
  useDocumentTitle('Leave Management');
  const { user } = useSelector((state) => state.auth);
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionData, setActionData] = useState({
    status: '',
    rejectionReason: ''
  });

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    leaveType: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await staffService.getAllLeaves();

      // Handle both response formats
      const leavesData = response.data?.leaves || response.data || [];

      // Get staff under supervisor
      const staffResponse = await staffService.getStaff();
      const supervisedStaff = staffResponse.data.filter(s => {
        const supervisorId = s.supervisor?._id || s.supervisor;
        return supervisorId === user._id;
      });

      // Filter leaves for supervised staff
      const supervisedLeaves = leavesData.filter(leave =>
        supervisedStaff.some(staff =>
          staff._id === leave.staff?._id || staff._id === leave.staff
        )
      );

      setLeaves(supervisedLeaves);
      setFilteredLeaves(supervisedLeaves);

    } catch (error) {
      console.error('Error fetching leaves:', error);
      toast.error('Failed to load leave applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, leaves]);

  const applyFilters = () => {
    let filtered = [...leaves];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(leave => {
        const staffName = `${leave.staff?.firstName || ''} ${leave.staff?.lastName || ''}`.toLowerCase();
        return (
          staffName.includes(searchLower) ||
          leave.staff?.employeeId?.toLowerCase().includes(searchLower) ||
          leave.leaveType?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(leave => leave.status === filters.status);
    }

    // Leave type filter
    if (filters.leaveType) {
      filtered = filtered.filter(leave => leave.leaveType === filters.leaveType);
    }

    // Date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(leave => new Date(leave.startDate) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filtered = filtered.filter(leave => new Date(leave.endDate) <= endDate);
    }

    setFilteredLeaves(filtered);
  };

  const handleUpdateStatus = async () => {
    if (!selectedLeave) return;

    try {
      setUpdating(true);

      await staffService.updateLeaveStatus(selectedLeave._id, {
        status: actionData.status,
        rejectionReason: actionData.status === 'rejected' ? actionData.rejectionReason : ''
      });

      toast.success(`Leave ${actionData.status} successfully`);
      setShowActionModal(false);
      setSelectedLeave(null);
      setActionData({ status: '', rejectionReason: '' });
      fetchLeaves(); // Refresh data

    } catch (error) {
      console.error('Error updating leave status:', error);
      toast.error('Failed to update leave status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-gradient-to-r from-mustard-100 to-mustard-200 text-mustard-800 dark:from-mustard-900/50 dark:to-mustard-800/50 dark:text-mustard-300';
      case 'rejected':
        return 'bg-gradient-to-r from-scarlet-100 to-scarlet-200 text-scarlet-800 dark:from-scarlet-900/50 dark:to-scarlet-800/50 dark:text-scarlet-300';
      case 'pending':
        return 'bg-gradient-to-r from-royal-100 to-royal-200 text-royal-800 dark:from-royal-900/50 dark:to-royal-800/50 dark:text-royal-300';
      case 'cancelled':
        return 'bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-800 dark:from-neutral-900/50 dark:to-neutral-800/50 dark:text-neutral-300';
      default:
        return 'bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-800 dark:from-neutral-900/50 dark:to-neutral-800/50 dark:text-neutral-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected': return <XCircleIcon className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      default: return <InformationCircleIcon className="h-4 w-4" />;
    }
  };

  const getUniqueLeaveTypes = () => {
    const types = new Set();
    leaves.forEach(leave => {
      if (leave.leaveType) types.add(leave.leaveType);
    });
    return Array.from(types);
  };

  const getStats = () => {
    const total = leaves.length;
    const pending = leaves.filter(l => l.status === 'pending').length;
    const approved = leaves.filter(l => l.status === 'approved').length;
    const rejected = leaves.filter(l => l.status === 'rejected').length;

    return { total, pending, approved, rejected };
  };

  const stats = getStats();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const openActionModal = (leave, action) => {
    setSelectedLeave(leave);
    setActionData({
      status: action,
      rejectionReason: ''
    });
    setShowActionModal(true);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      leaveType: '',
      startDate: '',
      endDate: ''
    });
  };

  const handleRefresh = async () => {
    await fetchLeaves();
    toast.success('Leave list refreshed');
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-mustard-500 via-scarlet-500 to-royal-500 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Leave Management</h1>
            <p className="mt-2 opacity-90">
              Review and manage leave applications from your team
            </p>
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <span className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {leaves.length} total applications
              </span>
              <span className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2" />
                {stats.pending} pending approval
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <CalendarIcon className="h-12 w-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-royal-100 dark:border-royal-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Leaves</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-royal-100 to-royal-200 dark:from-royal-900/50 dark:to-royal-800/50 rounded-xl">
              <CalendarIcon className="h-6 w-6 text-royal-600 dark:text-royal-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-royal-100 dark:border-royal-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Pending</p>
              <p className="text-2xl font-bold text-royal-600 dark:text-royal-400 mt-1">{stats.pending}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-royal-100 to-royal-200 dark:from-royal-900/50 dark:to-royal-800/50 rounded-xl">
              <ClockIcon className="h-6 w-6 text-royal-600 dark:text-royal-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Approved</p>
              <p className="text-2xl font-bold text-mustard-600 dark:text-mustard-400 mt-1">{stats.approved}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-mustard-100 to-mustard-200 dark:from-mustard-900/50 dark:to-mustard-800/50 rounded-xl">
              <CheckCircleIcon className="h-6 w-6 text-mustard-600 dark:text-mustard-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-scarlet-100 dark:border-scarlet-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Rejected</p>
              <p className="text-2xl font-bold text-scarlet-600 dark:text-scarlet-400 mt-1">{stats.rejected}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-scarlet-100 to-scarlet-200 dark:from-scarlet-900/50 dark:to-scarlet-800/50 rounded-xl">
              <XCircleIcon className="h-6 w-6 text-scarlet-600 dark:text-scarlet-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center">
            <FunnelIcon className="h-5 w-5 text-mustard-500 mr-2" />
            Filters
          </h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Showing {filteredLeaves.length} of {leaves.length} leaves
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center text-sm text-scarlet-600 hover:text-scarlet-700 dark:text-scarlet-400 dark:hover:text-scarlet-300 px-3 py-1.5 rounded-lg hover:bg-scarlet-50 dark:hover:bg-scarlet-900/30 transition-all duration-200"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1.5" />
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-mustard-500" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                className="pl-10 w-full px-4 py-2.5 border border-mustard-200 dark:border-mustard-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-500 focus:border-transparent bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white placeholder-royal-400 dark:placeholder-royal-500 transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Status
            </label>
            <select
              className="w-full px-4 py-2.5 border border-mustard-200 dark:border-mustard-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-500 focus:border-transparent bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Leave Type
            </label>
            <select
              className="w-full px-4 py-2.5 border border-mustard-200 dark:border-mustard-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-500 focus:border-transparent bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
              value={filters.leaveType}
              onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
            >
              <option value="">All Types</option>
              {getUniqueLeaveTypes().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              From Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-2.5 border border-mustard-200 dark:border-mustard-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-500 focus:border-transparent bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              To Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-2.5 border border-mustard-200 dark:border-mustard-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-500 focus:border-transparent bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Leaves Table */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-mustard-100 dark:border-mustard-900/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-mustard-100 dark:border-mustard-900/30">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Leave Applications</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-mustard-600"></div>
            <p className="mt-3 text-neutral-600 dark:text-neutral-400">Loading leave applications...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarIcon className="h-16 w-16 mx-auto text-mustard-400 dark:text-mustard-500 mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">No leave applications found</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-mustard-100 dark:divide-mustard-900/30">
              <thead className="bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 dark:bg-neutral-800/50 divide-y divide-mustard-100 dark:divide-mustard-900/30">
                {filteredLeaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gradient-to-r from-mustard-50/50 to-mustard-100/30 dark:hover:from-mustard-900/10 dark:hover:to-mustard-800/10 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-mustard-100 to-scarlet-100 dark:from-mustard-900/30 dark:to-scarlet-900/30 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-mustard-600 dark:text-mustard-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {leave.staff?.firstName} {leave.staff?.lastName}
                          </div>
                          <div className="text-sm text-royal-600 dark:text-royal-400">
                            {leave.staff?.employeeId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1.5 text-xs rounded-full bg-gradient-to-r from-royal-100 to-royal-200 text-royal-800 dark:from-royal-900/50 dark:to-royal-800/50 dark:text-royal-300 font-medium">
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900 dark:text-white">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                      {calculateDays(leave.startDate, leave.endDate)} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                        {getStatusIcon(leave.status)}
                        <span className="ml-1.5 capitalize">{leave.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {leave.status === 'pending' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => openActionModal(leave, 'approved')}
                            className="px-3 py-1.5 bg-gradient-to-r from-mustard-100 to-mustard-200 text-mustard-700 dark:from-mustard-900/50 dark:to-mustard-800/50 dark:text-mustard-300 rounded-lg hover:shadow-md transition-all duration-200 font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openActionModal(leave, 'rejected')}
                            className="px-3 py-1.5 bg-gradient-to-r from-scarlet-100 to-scarlet-200 text-scarlet-700 dark:from-scarlet-900/50 dark:to-scarlet-800/50 dark:text-scarlet-300 rounded-lg hover:shadow-md transition-all duration-200 font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {leave.status !== 'pending' && (
                        <span className="text-neutral-500 dark:text-neutral-400 px-3 py-1.5 bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-neutral-900/30 dark:to-neutral-800/30 rounded-lg">
                          No actions
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-neutral-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full border border-mustard-100 dark:border-mustard-900/30">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {actionData.status === 'approved' ? 'Approve Leave' : 'Reject Leave'}
                </h3>
                {actionData.status === 'approved' ? (
                  <CheckCircleIcon className="h-6 w-6 text-mustard-500" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-scarlet-500" />
                )}
              </div>

              {selectedLeave && (
                <div className="mb-6 p-4 bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10 rounded-xl border border-royal-200 dark:border-royal-800">
                  <p className="font-medium text-neutral-900 dark:text-white">{selectedLeave.staff?.firstName} {selectedLeave.staff?.lastName}</p>
                  <p className="text-sm text-royal-600 dark:text-royal-400">
                    {selectedLeave.leaveType} • {calculateDays(selectedLeave.startDate, selectedLeave.endDate)} days
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)}
                  </p>
                  {selectedLeave.reason && (
                    <div className="mt-3 pt-3 border-t border-royal-200 dark:border-royal-800">
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Reason:</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{selectedLeave.reason}</p>
                    </div>
                  )}
                </div>
              )}

              {actionData.status === 'rejected' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Rejection Reason (Optional)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-mustard-200 dark:border-mustard-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-500 focus:border-transparent bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white placeholder-royal-400 dark:placeholder-royal-500 transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                    rows="3"
                    placeholder="Enter reason for rejection..."
                    value={actionData.rejectionReason}
                    onChange={(e) => setActionData({ ...actionData, rejectionReason: e.target.value })}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6 border-t border-mustard-100 dark:border-mustard-900/30">
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedLeave(null);
                    setActionData({ status: '', rejectionReason: '' });
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-gradient-to-r from-neutral-100 to-neutral-200 dark:hover:from-neutral-900/30 dark:hover:to-neutral-800/30 rounded-xl transition-all duration-200 border border-mustard-200 dark:border-mustard-800"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  className={`px-4 py-2.5 text-sm font-medium text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${actionData.status === 'approved'
                    ? 'bg-gradient-to-r from-mustard-500 to-mustard-600 hover:from-mustard-600 hover:to-mustard-700'
                    : 'bg-gradient-to-r from-scarlet-500 to-scarlet-600 hover:from-scarlet-600 hover:to-scarlet-700'
                    }`}
                  disabled={updating}
                >
                  {updating ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </span>
                  ) : actionData.status === 'approved' ? 'Approve Leave' : 'Reject Leave'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default SupervisorLeaves;