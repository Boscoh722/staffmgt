import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  EyeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const LeaveApproval = () => {
  useDocumentTitle('Leave Approval');
  const { user } = useSelector((state) => state.auth);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchPendingLeaves();
  }, []);

  const fetchPendingLeaves = async () => {
    try {
      // Get supervised staff first
      const staffResponse = await staffService.getStaff();
      const supervisedStaff = staffResponse.data.filter(s => {
        const supervisorId = s.supervisor?._id || s.supervisor;
        return supervisorId === user._id;
      });
      
      const supervisedStaffIds = supervisedStaff.map(s => s._id);
      
      // Get all leaves
      const response = await staffService.getAllLeaves();
      const leavesData = response.data?.leaves || response.data || [];
      
      // Filter to only pending leaves from supervised staff
      const pendingLeaves = leavesData.filter(leave => {
        const leaveStaffId = leave.staff?._id || leave.staff;
        return leave.status === 'pending' && supervisedStaffIds.includes(leaveStaffId);
      });
      
      setLeaves(pendingLeaves);
    } catch (error) {
      console.error('Error fetching pending leaves:', error);
      toast.error('Failed to fetch leave applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    try {
      await staffService.updateLeaveStatus(leaveId, { status: 'approved' });
      toast.success('Leave approved successfully');
      fetchPendingLeaves();
    } catch (error) {
      toast.error('Failed to approve leave');
    }
  };

  const handleReject = async (leaveId) => {
    const reason = prompt('Please enter rejection reason:');
    if (reason) {
      try {
        await staffService.updateLeaveStatus(leaveId, {
          status: 'rejected',
          rejectionReason: reason
        });
        toast.success('Leave rejected');
        fetchPendingLeaves();
      } catch (error) {
        toast.error('Failed to reject leave');
      }
    }
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      annual: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      sick: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      maternity: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      paternity: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      compassionate: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      study: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leave Approval</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and approve leave applications from your team
          </p>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{leaves.length}</span> pending applications
        </div>
      </div>

      {leaves.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No pending leave applications
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            All leave applications from your team have been processed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => (
            <div key={leave._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-4">
                    <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                      {leave.staff?.firstName?.charAt(0) || 'N'}{leave.staff?.lastName?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {leave.staff?.firstName || 'N/A'} {leave.staff?.lastName || ''}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {leave.staff?.employeeId || 'N/A'} • {leave.staff?.department || 'N/A'}
                    </p>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getLeaveTypeColor(leave.leaveType)}`}>
                        {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {leave.numberOfDays} day(s)
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedLeave(leave);
                      setShowDetails(true);
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                    title="View Details"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleApprove(leave._id)}
                    className="p-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    title="Approve"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleReject(leave._id)}
                    className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="Reject"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Reason:</span> {leave.reason}
                </p>
              </div>

              <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-4 w-4 mr-1" />
                Applied on {new Date(leave.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leave Details Modal */}
      {showDetails && selectedLeave && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Leave Application Details
            </h3>

            <div className="space-y-6">
              {/* Staff Information */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Staff Information</h4>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-4">
                    <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                      {selectedLeave.staff?.firstName?.charAt(0) || 'N'}{selectedLeave.staff?.lastName?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedLeave.staff?.firstName || 'N/A'} {selectedLeave.staff?.lastName || ''}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedLeave.staff?.employeeId || 'N/A'} • {selectedLeave.staff?.department || 'N/A'} • {selectedLeave.staff?.position || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Leave Type</h4>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <span className={`px-2 py-1 rounded-full ${getLeaveTypeColor(selectedLeave.leaveType)}`}>
                      {selectedLeave.leaveType.charAt(0).toUpperCase() + selectedLeave.leaveType.slice(1)}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Duration</h4>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p className="font-medium">{selectedLeave.numberOfDays} days</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Start Date</h4>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p className="font-medium">{new Date(selectedLeave.startDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">End Date</h4>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p className="font-medium">{new Date(selectedLeave.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Reason for Leave</h4>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">{selectedLeave.reason}</p>
                </div>
              </div>

              {/* Supporting Documents */}
              {selectedLeave.supportingDocuments && selectedLeave.supportingDocuments.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Supporting Documents</h4>
                  <div className="space-y-2">
                    {selectedLeave.supportingDocuments.map((doc, index) => (
                      <a
                        key={index}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Document {index + 1}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedLeave(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleApprove(selectedLeave._id);
                  setShowDetails(false);
                  setSelectedLeave(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Please enter rejection reason:');
                  if (reason) {
                    handleReject(selectedLeave._id);
                    setShowDetails(false);
                    setSelectedLeave(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApproval;