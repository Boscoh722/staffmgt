import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const MarkAttendance = () => {
  const { user, isAuthenticated } = useSelector((s) => s.auth || {});  // Add isAuthenticated
  useDocumentTitle('Mark Attendance');
  
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'department', 'supervised'

  useEffect(() => {
    fetchStaff();
    fetchDepartments();
  }, []);

  // Fetch all departments
  const fetchDepartments = async () => {
    try {
      const response = await staffService.getDepartments();
      if (response.data) {
        setDepartments(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchStaff = async () => {
  setLoading(true);
  setError(null);
  
  try {
    // Check if user is logged in
    if (!isAuthenticated) {  // Change to this
      setError('Please login to mark attendance');
      toast.error('Please login to mark attendance');
      return;
    }

      let staffData = [];
      
      // Determine which staff to show based on user role
      if (user.role === 'admin') {
        // Admin can see all staff
        console.log('Admin: Fetching all staff');
        const response = await staffService.getStaff();
        staffData = response.data || [];
        
      } else if (user.role === 'supervisor') {
        // Supervisor can see their supervised staff
        console.log('Supervisor: Fetching supervised staff');
        try {
          const response = await staffService.getSupervisedStaff();
          staffData = response.data || [];
        } catch (supervisorErr) {
          console.log('Supervised staff endpoint failed, falling back to all staff');
          const response = await staffService.getStaff();
          staffData = response.data || [];
        }
        
      } else if (user.role === 'clerk') {
        // Clerk can see all staff (or department-specific based on your requirements)
        console.log('Clerk: Fetching all staff');
        const response = await staffService.getStaff();
        staffData = response.data || [];
        
      } else if (user.role === 'staff') {
        // Regular staff can only see themselves
        console.log('Staff: Can only mark own attendance');
        setError('Regular staff cannot mark attendance for others');
        toast.error('You do not have permission to mark attendance for others');
        return;
        
      } else {
        // Unknown role
        setError('Unknown user role. Please contact administrator.');
        toast.error('Access denied. Invalid user role.');
        return;
      }

      console.log(`Fetched ${staffData.length} staff members`);
      
      // Filter staff based on selected department
      if (selectedDepartment) {
        staffData = staffData.filter(employee => 
          employee.department?._id === selectedDepartment || 
          employee.department === selectedDepartment
        );
      }
      
      setStaff(staffData);
      
      // Initialize attendance records
      const initialRecords = {};
      staffData.forEach(employee => {
        if (employee && employee._id) {
          initialRecords[employee._id] = {
            status: 'absent',
            checkIn: '',
            checkOut: '',
            notes: ''
          };
        }
      });
      setAttendanceRecords(initialRecords);
      
    } catch (err) {
      console.error('Error fetching staff:', err);
      
      let errorMessage = 'Failed to load staff data. ';
      
      if (err.response) {
        const status = err.response.status;
        
        if (status === 403) {
          errorMessage += 'Access denied. You may not have permission to view staff.';
        } else if (status === 401) {
          errorMessage += 'Session expired. Please login again.';
        } else {
          errorMessage += `Server error ${status}.`;
        }
      } else if (err.request) {
        errorMessage += 'Network error. Please check your connection.';
      } else {
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
      toast.error('Failed to load staff data.');
      
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(employee => {
    if (!employee) return false;
    const name = `${employee.firstName || ''} ${employee.lastName || ''}`.toLowerCase();
    const empId = (employee.employeeId || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return name.includes(search) || empId.includes(search);
  });

  const handleAttendanceChange = (staffId, field, value) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [field]: value
      }
    }));
  };

  const handleMarkAttendance = async () => {
    if (filteredStaff.length === 0) {
      toast.error('No staff members to mark attendance for');
      return;
    }

    setSaving(true);
    try {
      // Prepare attendance data (without date in each record for bulk endpoint)
      const attendanceArray = filteredStaff
        .filter(employee => attendanceRecords[employee._id])
        .map(employee => {
          const record = attendanceRecords[employee._id];
          return {
            staffId: employee._id,
            status: record.status,
            checkIn: record.checkIn || null,
            checkOut: record.checkOut || null,
            remarks: record.notes || '',
            markedBy: user._id,
            markedByRole: user.role
          };
        });

      const dateString = attendanceDate.toISOString().split('T')[0];
      console.log('📝 Sending bulk attendance for date:', dateString);
      console.log('📝 Attendance data:', attendanceArray);
      
      // Prepare bulk attendance payload with date (similar to supervisor)
      const bulkPayload = {
        date: dateString,
        attendanceData: attendanceArray
      };
      
      // Try bulk attendance using the same method as supervisor
      try {
        const response = await staffService.markAttendance(bulkPayload);
        console.log('✅ Bulk attendance response:', response);
        toast.success(`Attendance marked for ${attendanceArray.length} staff member(s)!`);
        
        // Refresh staff list to show updated attendance
        fetchStaff();
        
      } catch (bulkErr) {
        console.error('❌ Bulk marking failed:', bulkErr);
        console.log('🔄 Trying single marks as fallback...');
        
        // Fallback: Mark attendance individually with date
        const promises = attendanceArray.map(data => {
          const singlePayload = {
            ...data,
            date: dateString
          };
          return staffService.markSingleAttendance(singlePayload).catch(err => {
            console.error(`Failed to mark attendance for ${data.staffId}:`, err);
            return { success: false, error: err, staffId: data.staffId };
          });
        });
        
        const results = await Promise.all(promises);
        const successful = results.filter(r => r && !r.error).length;
        const failed = results.filter(r => r && r.error).length;
        
        if (successful > 0) {
          toast.success(`Attendance marked for ${successful} staff members${failed > 0 ? `, ${failed} failed` : ''}`);
          
          // Refresh staff list
          fetchStaff();
        } else {
          throw new Error('Could not mark attendance using any method');
        }
      }
      
    } catch (err) {
      console.error('Error marking attendance:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to mark attendance';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'absent': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'late': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'half-day': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
    }
  };

  const handleDepartmentChange = (deptId) => {
    setSelectedDepartment(deptId);
    // Refresh staff with department filter
    setTimeout(() => fetchStaff(), 0);
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      supervisor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      clerk: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      staff: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[role] || colors.staff}`}>
        {role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-mustard-200 border-t-mustard-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 font-medium">Loading staff data...</p>
          <p className="text-sm text-neutral-500 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  if (error && user.role !== 'staff') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-red-100">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ExclamationTriangleIcon className="w-10 h-10 text-red-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Cannot Load Staff</h3>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-red-700">{error}</p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={fetchStaff}
                  className="w-full px-6 py-3 bg-gradient-to-r from-mustard-500 to-mustard-600 text-white rounded-xl font-medium hover:from-mustard-600 hover:to-mustard-700 shadow-lg hover:shadow-xl transition-all"
                >
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 border border-mustard-300 text-neutral-700 rounded-xl font-medium hover:bg-mustard-50 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If regular staff tries to access, show them their own attendance only
  if (user.role === 'staff') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-mustard-100">
            <div className="text-center">
              <div className="w-20 h-20 bg-mustard-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserIcon className="w-10 h-10 text-mustard-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Mark Your Attendance</h3>
              
              <p className="text-neutral-600 mb-6">
                As a staff member, you can only mark your own attendance. Please use the self-service attendance portal.
              </p>
              
              <button
                onClick={() => window.location.href = '/my-attendance'}
                className="w-full px-6 py-3 bg-gradient-to-r from-mustard-500 to-mustard-600 text-white rounded-xl font-medium hover:from-mustard-600 hover:to-mustard-700 shadow-lg hover:shadow-xl transition-all"
              >
                Go to My Attendance
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Mark Attendance</h1>
          <div className="flex items-center space-x-3 mt-2">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-4 w-4 text-neutral-500" />
              <p className="text-neutral-600 dark:text-neutral-400">
                Logged in as: <span className="font-medium">{user?.firstName} {user?.lastName}</span>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {getRoleBadge(user?.role)}
              <span className="text-sm text-neutral-500">
                {staff.length} staff available
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-neutral-500" />
            <DatePicker
              selected={attendanceDate}
              onChange={(date) => setAttendanceDate(date)}
              className="px-4 py-2 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white"
              dateFormat="MMMM d, yyyy"
            />
          </div>
          
          <button
            onClick={handleMarkAttendance}
            disabled={saving || filteredStaff.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-mustard-500 to-mustard-600 text-white rounded-xl font-medium hover:from-mustard-600 hover:to-mustard-700 flex items-center shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Attendance...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Save Attendance ({filteredStaff.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Search Staff</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200"
                placeholder="Search by name or ID..."
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400 absolute left-4 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Filter by Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">View Mode</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('all')}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${viewMode === 'all' ? 'bg-mustard-100 text-mustard-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All Staff
              </button>
              {user.role === 'supervisor' && (
                <button
                  onClick={() => setViewMode('supervised')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${viewMode === 'supervised' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  My Team
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center text-sm">
          <div className="text-neutral-600 dark:text-neutral-400">
            Showing {filteredStaff.length} of {staff.length} staff members
            {selectedDepartment && ` in selected department`}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setSearchTerm('')}
              className="text-mustard-600 hover:text-mustard-700"
            >
              Clear Search
            </button>
            <button
              onClick={() => {
                setSelectedDepartment('');
                setSearchTerm('');
                fetchStaff();
              }}
              className="text-mustard-600 hover:text-mustard-700"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl p-4 border border-mustard-100 dark:border-mustard-900/30">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mr-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">To be Marked Present</p>
              <p className="text-lg font-semibold text-neutral-900">
                {Object.values(attendanceRecords).filter(r => r.status === 'present').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl p-4 border border-mustard-100 dark:border-mustard-900/30">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mr-3">
              <XCircleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">To be Marked Absent</p>
              <p className="text-lg font-semibold text-neutral-900">
                {Object.values(attendanceRecords).filter(r => r.status === 'absent').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl p-4 border border-mustard-100 dark:border-mustard-900/30">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center mr-3">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">To be Marked Late</p>
              <p className="text-lg font-semibold text-neutral-900">
                {Object.values(attendanceRecords).filter(r => r.status === 'late').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl p-4 border border-mustard-100 dark:border-mustard-900/30">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
              <UserGroupIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Total in List</p>
              <p className="text-lg font-semibold text-neutral-900">
                {filteredStaff.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-mustard-100 dark:border-mustard-900/30">
        {filteredStaff.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              No staff members found
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {searchTerm 
                ? 'Try a different search term' 
                : 'No staff members match your current filters'
              }
            </p>
            <button
              onClick={() => {
                setSelectedDepartment('');
                setSearchTerm('');
                fetchStaff();
              }}
              className="px-4 py-2 bg-mustard-600 text-white rounded-lg hover:bg-mustard-700 transition-colors"
            >
              Clear Filters
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
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mustard-200 dark:divide-mustard-900/30">
                {filteredStaff.map((employee) => (
                  <tr 
                    key={employee._id}
                    className="hover:bg-mustard-50/50 dark:hover:bg-mustard-900/20 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-mustard-100 to-royal-100 dark:from-mustard-900/50 dark:to-royal-900/50 flex items-center justify-center mr-3">
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">
                            {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-neutral-900 dark:text-white">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-neutral-500">{employee.position}</div>
                            {employee.role && employee.role !== 'staff' && (
                              <div className="text-xs">
                                {getRoleBadge(employee.role)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                      {employee.employeeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                      {employee.department?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={attendanceRecords[employee._id]?.status || 'absent'}
                        onChange={(e) => handleAttendanceChange(employee._id, 'status', e.target.value)}
                        className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-mustard-500 focus:border-transparent ${getStatusColor(attendanceRecords[employee._id]?.status || 'absent')}`}
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="half-day">Half Day</option>
                        <option value="leave">On Leave</option>
                        <option value="holiday">Holiday</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="time"
                        value={attendanceRecords[employee._id]?.checkIn || ''}
                        onChange={(e) => handleAttendanceChange(employee._id, 'checkIn', e.target.value)}
                        className="px-3 py-2 border border-mustard-200 rounded-lg focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900 dark:border-mustard-800 dark:text-white"
                        disabled={['absent', 'leave', 'holiday'].includes(attendanceRecords[employee._id]?.status)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="time"
                        value={attendanceRecords[employee._id]?.checkOut || ''}
                        onChange={(e) => handleAttendanceChange(employee._id, 'checkOut', e.target.value)}
                        className="px-3 py-2 border border-mustard-200 rounded-lg focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900 dark:border-mustard-800 dark:text-white"
                        disabled={['absent', 'leave', 'holiday'].includes(attendanceRecords[employee._id]?.status)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={attendanceRecords[employee._id]?.notes || ''}
                        onChange={(e) => handleAttendanceChange(employee._id, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-mustard-200 rounded-lg focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900 dark:border-mustard-800 dark:text-white"
                        placeholder="Notes..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Attendance Status Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { color: 'bg-green-500', label: 'Present', value: 'present' },
            { color: 'bg-red-500', label: 'Absent', value: 'absent' },
            { color: 'bg-yellow-500', label: 'Late', value: 'late' },
            { color: 'bg-blue-500', label: 'Half Day', value: 'half-day' },
            { color: 'bg-purple-500', label: 'On Leave', value: 'leave' }
          ].map((item) => (
            <div key={item.value} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full ${item.color} mr-3`}></div>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">{item.label}</span>
              </div>
              <span className="text-sm font-medium text-neutral-900">
                {Object.values(attendanceRecords).filter(r => r.status === item.value).length}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;