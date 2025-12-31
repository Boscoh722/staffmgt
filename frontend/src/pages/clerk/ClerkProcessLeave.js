import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'; 
import { staffService } from '../../services/staffService';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const ClerkProcessLeave = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch(); 
  useDocumentTitle('Process Leave');
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [action, setAction] = useState('');

  useEffect(() => {
    console.log('🚀 [ClerkProcessLeave] Component MOUNTED');
    console.log('   User:', user);
    console.log('   Token in localStorage:', localStorage.getItem('token') ? 'YES' : 'NO');
    
    // Check token validity
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('   Token payload:', payload);
        const expiry = new Date(payload.exp * 1000);
        console.log('   Token expires:', expiry);
        console.log('   Is token valid?', expiry > new Date() ? 'YES' : 'NO');
      } catch (e) {
        console.error('   Could not decode token:', e.message);
      }
    }
    
    fetchLeaves();
    
    return () => {
      console.log('🚀 [ClerkProcessLeave] Component UNMOUNTED');
    };
  }, []);

  const fetchLeaves = async () => {
  try {
    setLoading(true);
    console.log('🔄 [ClerkProcessLeave] Fetching leaves...');
    console.log('🔑 Current Token:', localStorage.getItem('token'));
    console.log('👤 Current User:', localStorage.getItem('user'));
    
    // Log the exact API call
    console.log('📡 Calling: GET /leaves');
    
    const response = await staffService.getAllLeaves();
    console.log('✅ [ClerkProcessLeave] Leaves Response:', response);
    console.log('📊 Response data:', response.data);
    
    const pendingLeaves = (response.data?.leaves || response.data || [])
      .filter(leave => leave.status === 'pending');
    
    console.log(`📋 Found ${pendingLeaves.length} pending leaves`);
    setLeaves(pendingLeaves);
    
  } catch (error) {
    console.error('❌ [ClerkProcessLeave] Error fetching leaves:');
    console.error('   Error object:', error);
    console.error('   Response status:', error.response?.status);
    console.error('   Response data:', error.response?.data);
    console.error('   Response headers:', error.response?.headers);
    
    if (error.response?.status === 401) {
      console.error('🚨 401 Unauthorized! Checking token...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('🚨 No token in localStorage');
      } else {
        console.error('🚨 Token exists:', token.substring(0, 20) + '...');
        // Check if token is expired
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const expiry = new Date(payload.exp * 1000);
          const now = new Date();
          console.log('🔍 Token payload:', payload);
          console.log('⏰ Token expires at:', expiry);
          console.log('⏰ Current time:', now);
          console.log('⏳ Token expired?', expiry < now ? 'YES' : 'NO');
        } catch (e) {
          console.error('🔍 Could not decode token:', e.message);
        }
      }
    }
    
    toast.error('Failed to fetch leave applications: ' + (error.response?.data?.error || error.message));
  } finally {
    setLoading(false);
  }
};

  const handleLeaveAction = async () => {
    if (!selectedLeave) return;

    try {
      await staffService.updateLeaveStatus(selectedLeave._id, {
        status: action,
        rejectionReason: action === 'rejected' ? 'Rejected by clerk' : ''
      });
      toast.success(`Leave ${action} successfully`);
      setShowActionModal(false);
      setSelectedLeave(null);
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to process leave');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-mustard-800 bg-mustard-100 dark:bg-mustard-900/50 dark:text-mustard-300';
      case 'rejected': return 'text-scarlet-800 bg-scarlet-100 dark:bg-scarlet-900/50 dark:text-scarlet-300';
      case 'pending': return 'text-yellow-800 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300';
      default: return 'text-neutral-800 bg-neutral-100 dark:bg-neutral-900/50 dark:text-neutral-300';
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Process Leave Applications</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Review and process pending leave applications
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard-600"></div>
        </div>
      ) : leaves.length === 0 ? (
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center border border-mustard-100 dark:border-mustard-900/30">
          <CalendarIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            No Pending Leaves
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            There are no pending leave applications to process.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {leaves.map((leave) => (
            <div key={leave._id} className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30 hover:shadow-xl transition-all duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-neutral-400 mr-2" />
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {leave.staff?.firstName} {leave.staff?.lastName}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 ml-7">
                    {leave.staff?.employeeId} • {leave.staff?.department?.name || leave.staff?.department}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(leave.status)}`}>
                  {leave.status}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Leave Type</p>
                  <p className="font-medium text-neutral-900 dark:text-white capitalize">
                    {leave.leaveType}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Dates</p>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 text-neutral-400 mr-2" />
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </span>
                    <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">
                      ({leave.numberOfDays} days)
                    </span>
                  </div>
                </div>

                {leave.reason && (
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Reason</p>
                    <p className="text-neutral-900 dark:text-white">{leave.reason}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Applied On</p>
                  <p className="text-neutral-900 dark:text-white">
                    {new Date(leave.createdAt).toLocaleDateString()} at {new Date(leave.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="pt-4 border-t border-mustard-200 dark:border-mustard-900/30">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setSelectedLeave(leave);
                        setAction('approved');
                        setShowActionModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-mustard-500 to-mustard-600 text-white rounded-xl hover:from-mustard-600 hover:to-mustard-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLeave(leave);
                        setAction('rejected');
                        setShowActionModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-scarlet-500 to-scarlet-600 text-white rounded-xl hover:from-scarlet-600 hover:to-scarlet-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedLeave && (
        <div className="fixed inset-0 bg-neutral-900/75 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full mx-4 border border-mustard-100 dark:border-mustard-900/30 shadow-2xl">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
              {action === 'approved' ? 'Approve' : 'Reject'} Leave
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Are you sure you want to {action} the leave application for{' '}
              <span className="font-semibold text-neutral-900 dark:text-white">
                {selectedLeave.staff?.firstName} {selectedLeave.staff?.lastName}
              </span>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedLeave(null);
                }}
                className="px-4 py-2 border border-mustard-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-mustard-50 dark:border-mustard-600 dark:text-neutral-300 dark:hover:bg-mustard-900/30 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveAction}
                className={`px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200 ${action === 'approved'
                  ? 'bg-gradient-to-r from-mustard-500 to-mustard-600 hover:from-mustard-600 hover:to-mustard-700'
                  : 'bg-gradient-to-r from-scarlet-500 to-scarlet-600 hover:from-scarlet-600 hover:to-scarlet-700'
                  }`}
              >
                Confirm {action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClerkProcessLeave;
