import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import useDocumentTitle from '../../hooks/useDocumentTitle';

const LeaveManagement = () => {
  const { user } = useSelector((state) => state.auth);
  useDocumentTitle('Leave Management');
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    leaveType: '',
    startDate: '',
    endDate: ''
  });
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    rejectionReason: ''
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

      // Ensure it's an array
      if (Array.isArray(leavesData)) {
        setLeaves(leavesData);
      } else {
        console.error('Leaves data is not an array:', leavesData);
        setLeaves([]);
        toast.error('Invalid data format received');
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      toast.error('Failed to fetch leaves');
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  // Safe filtering function
  const filteredLeaves = Array.isArray(leaves) ? leaves.filter(leave => {
    if (!leave) return false;

    const searchLower = filters.search.toLowerCase();
    const matchesSearch =
      (leave.staff?.firstName?.toLowerCase() || '').includes(searchLower) ||
      (leave.staff?.lastName?.toLowerCase() || '').includes(searchLower) ||
      (leave.staff?.employeeId?.toLowerCase() || '').includes(searchLower);

    const matchesStatus = !filters.status || leave.status === filters.status;
    const matchesType = !filters.leaveType || leave.leaveType === filters.leaveType;

    // Date filtering
    let matchesDate = true;
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      const leaveStartDate = new Date(leave.startDate);
      matchesDate = matchesDate && leaveStartDate >= startDate;
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      const leaveEndDate = new Date(leave.endDate);
      matchesDate = matchesDate && leaveEndDate <= endDate;
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  }) : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-mustard-100 text-mustard-800 dark:bg-mustard-900/50 dark:text-mustard-300';
      case 'rejected': return 'bg-scarlet-100 text-scarlet-800 dark:bg-scarlet-900/50 dark:text-scarlet-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'cancelled': return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-300';
      default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="h-5 w-5" />;
      case 'rejected': return <XCircleIcon className="h-5 w-5" />;
      case 'pending': return <ClockIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  const handleStatusUpdate = async () => {
    try {
      if (!selectedLeave) return;

      await staffService.updateLeaveStatus(selectedLeave._id, statusUpdate);
      toast.success(`Leave ${statusUpdate.status} successfully`);
      setShowStatusModal(false);
      setSelectedLeave(null);
      setStatusUpdate({ status: '', rejectionReason: '' });
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to update leave status');
    }
  };

  const leaveTypes = [...new Set(leaves.map(leave => leave.leaveType).filter(Boolean))];
  const statusOptions = ['pending', 'approved', 'rejected', 'cancelled'];

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Leave Management</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage and approve staff leave applications
          </p>
        </div>
        <button
          onClick={fetchLeaves}
          className="px-4 py-2 border border-mustard-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-mustard-50 dark:border-mustard-600 dark:text-neutral-300 dark:hover:bg-mustard-900/30 flex items-center transition-all duration-200"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-3 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700 placeholder-royal-400 dark:placeholder-royal-500"
                placeholder="Search by name or employee ID..."
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Leave Type
            </label>
            <select
              value={filters.leaveType}
              onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
              className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
            >
              <option value="">All Types</option>
              {leaveTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Start Date
            </label>
            <DatePicker
              selected={filters.startDate ? new Date(filters.startDate) : null}
              onChange={(date) => setFilters({ ...filters, startDate: date ? date.toISOString() : '' })}
              className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
              placeholderText="From date"
              isClearable
            />
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Showing {filteredLeaves.length} of {leaves.length} leave applications
          </div>
          <button
            onClick={() => setFilters({
              search: '',
              status: '',
              leaveType: '',
              startDate: '',
              endDate: ''
            })}
            className="text-sm text-mustard-600 hover:text-mustard-700 dark:text-mustard-400 transition-colors duration-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-mustard-100 dark:border-mustard-900/30">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard-600"></div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <ClockIcon className="h-16 w-16 text-neutral-400 mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">No leave applications found</p>
            <button
              onClick={fetchLeaves}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-mustard-500 to-mustard-600 text-white rounded-xl hover:from-mustard-600 hover:to-mustard-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Refresh Data
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-mustard-200 dark:divide-mustard-900/30">
              <thead className="bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/30 dark:to-mustard-900/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Leave Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Applied On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mustard-200 dark:divide-mustard-900/30">
                {filteredLeaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-mustard-50/50 dark:hover:bg-mustard-900/20 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {leave.staff?.profileImage ? (
                            <img className="h-10 w-10 rounded-full" src={leave.staff.profileImage} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-mustard-100 to-royal-100 dark:from-mustard-900/50 dark:to-royal-900/50 flex items-center justify-center">
                              <span className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
                                {leave.staff?.firstName?.charAt(0) || 'N'}{leave.staff?.lastName?.charAt(0) || 'A'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {leave.staff?.firstName || 'N/A'} {leave.staff?.lastName || ''}
                          </div>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            {leave.staff?.employeeId || 'N/A'}
                          </div>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            {leave.staff?.department?.name || leave.staff?.department || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                        {leave.leaveType}
                      </div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        {leave.numberOfDays} day(s)
                      </div>
                      {leave.reason && (
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          {leave.reason.substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900 dark:text-white">
                        {new Date(leave.startDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        to
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-white">
                        {new Date(leave.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                          <span className="mr-1">
                            {getStatusIcon(leave.status)}
                          </span>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                      </div>
                      {leave.approvedBy && (
                        <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                          By: {leave.approvedBy?.firstName || 'Admin'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-300">
                      {new Date(leave.createdAt).toLocaleDateString()}
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        {new Date(leave.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {leave.status === 'pending' && (user.role === 'admin' || user.role === 'supervisor') && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedLeave(leave);
                                setStatusUpdate({ status: 'approved', rejectionReason: '' });
                                setShowStatusModal(true);
                              }}
                              className="text-mustard-600 hover:text-mustard-700 dark:text-mustard-400 dark:hover:text-mustard-300 transition-colors duration-200"
                              title="Approve"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedLeave(leave);
                                setStatusUpdate({ status: 'rejected', rejectionReason: '' });
                                setShowStatusModal(true);
                              }}
                              className="text-scarlet-600 hover:text-scarlet-700 dark:text-scarlet-400 dark:hover:text-scarlet-300 transition-colors duration-200"
                              title="Reject"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedLeave && (
        <div className="fixed inset-0 bg-neutral-900/75 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full mx-4 border border-mustard-100 dark:border-mustard-900/30 shadow-2xl">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
              {statusUpdate.status === 'approved' ? 'Approve' : 'Reject'} Leave Application
            </h3>

            <div className="mb-4">
              <p className="text-neutral-600 dark:text-neutral-400">
                You are about to <span className="font-semibold">{statusUpdate.status}</span> the leave application for:
              </p>
              <p className="font-medium text-neutral-900 dark:text-white mt-2">
                {selectedLeave.staff?.firstName} {selectedLeave.staff?.lastName}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {selectedLeave.leaveType} - {selectedLeave.numberOfDays} day(s)
              </p>
            </div>

            {statusUpdate.status === 'rejected' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Reason for Rejection
                </label>
                <textarea
                  value={statusUpdate.rejectionReason}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, rejectionReason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  placeholder="Provide reason for rejection..."
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedLeave(null);
                  setStatusUpdate({ status: '', rejectionReason: '' });
                }}
                className="px-4 py-2 border border-mustard-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-mustard-50 dark:border-mustard-600 dark:text-neutral-300 dark:hover:bg-mustard-900/30 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                className={`px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200 ${statusUpdate.status === 'approved'
                  ? 'bg-gradient-to-r from-mustard-500 to-mustard-600 hover:from-mustard-600 hover:to-mustard-700'
                  : 'bg-gradient-to-r from-scarlet-500 to-scarlet-600 hover:from-scarlet-600 hover:to-scarlet-700'
                  }`}
              >
                {statusUpdate.status === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;