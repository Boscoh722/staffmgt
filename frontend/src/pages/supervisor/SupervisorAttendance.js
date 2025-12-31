import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  MinusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import useDocumentTitle from '../../hooks/useDocumentTitle';


const SupervisorAttendance = () => {
  useDocumentTitle('Mark Attendance');
  const { user } = useSelector((state) => state.auth);
  const [staff, setStaff] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStaff, setFilteredStaff] = useState([]);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    // Filter staff based on department and search term
    let result = staff;

    if (departmentFilter !== 'all') {
      result = result.filter(employee =>
        employee.department?.name === departmentFilter ||
        employee.department === departmentFilter
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(employee =>
        employee.firstName?.toLowerCase().includes(term) ||
        employee.lastName?.toLowerCase().includes(term) ||
        employee.employeeId?.toLowerCase().includes(term)
      );
    }

    setFilteredStaff(result);
  }, [departmentFilter, searchTerm, staff]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await staffService.getStaff();
      const staffData = response.data || [];

      // Filter only supervised staff
      const supervisedStaff = staffData.filter(s =>
        s.supervisor?._id === user._id || s.supervisor === user._id
      );

      // Initialize attendance data for each staff member
      const initialAttendance = {};

      supervisedStaff.forEach(employee => {
        initialAttendance[employee._id] = {
          status: 'present', // Default status
          remarks: '',
          staffId: employee._id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          department: employee.department?.name || employee.department || 'Unknown',
          employeeId: employee.employeeId
        };
      });

      setStaff(supervisedStaff);
      setFilteredStaff(supervisedStaff);
      setAttendanceData(initialAttendance);

    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      setSaving(true);

      // Prepare data for bulk endpoint
      const attendanceArray = Object.values(attendanceData).map(data => ({
        staffId: data.staffId,
        status: data.status,
        remarks: data.remarks || ''
      }));

      console.log('Sending bulk attendance data for', attendanceArray.length, 'staff members');

      // Use bulk endpoint for marking multiple staff at once
      const response = await staffService.markAttendance({
        date: selectedDate.toISOString().split('T')[0],
        attendanceData: attendanceArray
      });

      console.log('Response:', response);
      toast.success(`Attendance marked for ${attendanceArray.length} staff members`);

      // Reset remarks after saving
      const resetAttendance = { ...attendanceData };
      Object.keys(resetAttendance).forEach(key => {
        resetAttendance[key].remarks = '';
      });
      setAttendanceData(resetAttendance);

    } catch (error) {
      console.error('Mark attendance error:', error);
      console.error('Error details:', error.response?.data);

      if (error.response?.data?.error?.includes('Missing required fields')) {
        toast.error('Error: Some staff members are missing required data. Please check all entries.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to mark attendance');
      }
    } finally {
      setSaving(false);
    }
  };

  const updateAttendance = (staffId, field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [field]: value
      }
    }));
  };

  const handleMarkAll = (status) => {
    const updatedData = { ...attendanceData };
    Object.keys(updatedData).forEach(staffId => {
      updatedData[staffId].status = status;
    });
    setAttendanceData(updatedData);
    toast.success(`All staff marked as ${status}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'bg-mustard-100 text-mustard-800 border-mustard-300 dark:bg-mustard-900/50 dark:text-mustard-300 dark:border-mustard-800',
      absent: 'bg-scarlet-100 text-scarlet-800 border-scarlet-300 dark:bg-scarlet-900/50 dark:text-scarlet-300 dark:border-scarlet-800',
      late: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
      leave: 'bg-royal-100 text-royal-800 border-royal-300 dark:bg-royal-900/50 dark:text-royal-300 dark:border-royal-800',
      'off-duty': 'bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-900/50 dark:text-neutral-300 dark:border-neutral-800',
      sick: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800'
    };
    return colors[status] || colors.present;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircleIcon className="h-5 w-5" />;
      case 'absent': return <XCircleIcon className="h-5 w-5" />;
      case 'late': return <ClockIcon className="h-5 w-5" />;
      case 'leave': return <CalendarIcon className="h-5 w-5" />;
      case 'sick': return <ExclamationCircleIcon className="h-5 w-5" />;
      default: return <CheckBadgeIcon className="h-5 w-5" />;
    }
  };

  const getStats = () => {
    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      'off-duty': 0,
      sick: 0
    };

    Object.values(attendanceData).forEach(record => {
      if (record.status in stats) {
        stats[record.status]++;
      }
    });

    return stats;
  };

  const stats = getStats();

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Mark Attendance</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Mark attendance for your supervised staff members
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          {/* Date Picker */}
          <div className="relative w-full sm:w-auto">
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Date
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-royal-500" />
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                max={new Date().toISOString().split('T')[0]}
                className="pl-10 pr-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white w-full sm:w-auto"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleMarkAll('present')}
              className="px-4 py-2 bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/30 dark:to-mustard-900/20 text-mustard-700 dark:text-mustard-300 rounded-xl text-sm font-medium hover:shadow-lg hover:from-mustard-100 hover:to-mustard-200/50 dark:hover:from-mustard-800/30 dark:hover:to-mustard-800/20 transition-all duration-200 border border-mustard-200 dark:border-mustard-800"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll('absent')}
              className="px-4 py-2 bg-gradient-to-r from-scarlet-50 to-scarlet-100/50 dark:from-scarlet-900/30 dark:to-scarlet-900/20 text-scarlet-700 dark:text-scarlet-300 rounded-xl text-sm font-medium hover:shadow-lg hover:from-scarlet-100 hover:to-scarlet-200/50 dark:hover:from-scarlet-800/30 dark:hover:to-scarlet-800/20 transition-all duration-200 border border-scarlet-200 dark:border-scarlet-800"
            >
              Mark All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
            Search Staff
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white w-full"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-royal-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
            Department
          </label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white w-full"
          >
            <option value="all">All Departments</option>
            {Array.from(new Set(staff.map(s => s.department?.name || s.department || 'Unknown')))
              .map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={fetchStaff}
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/30 dark:to-royal-900/20 text-royal-700 dark:text-royal-300 rounded-xl text-sm font-medium hover:shadow-lg hover:from-royal-100 hover:to-royal-200/50 dark:hover:from-royal-800/30 dark:hover:to-royal-800/20 transition-all duration-200 border border-royal-200 dark:border-royal-800 w-full"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh List ({staff.length} staff)
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(stats).map(([status, count]) => (
          <div key={status} className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-royal-100 dark:border-royal-900/30 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 capitalize">{status}</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{count}</p>
              </div>
              <div className={`p-2 rounded-xl ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard-600"></div>
        </div>
      ) : (
        <>
          {/* Attendance Table */}
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-mustard-100 dark:border-mustard-900/30">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                <thead className="bg-gradient-to-r from-royal-50 to-mustard-50 dark:from-royal-900/30 dark:to-mustard-900/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Quick Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredStaff.map((employee) => (
                    <tr key={employee._id} className="hover:bg-gradient-to-r hover:from-mustard-50/30 hover:to-scarlet-50/30 dark:hover:from-mustard-900/10 dark:hover:to-scarlet-900/10 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-mustard-100 to-scarlet-100 dark:from-mustard-900/30 dark:to-scarlet-900/30 flex items-center justify-center">
                            <span className="text-lg font-medium text-mustard-700 dark:text-mustard-300">
                              {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-neutral-900 dark:text-white">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-royal-600 dark:text-royal-400">
                              {employee.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs rounded-full bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10 text-royal-700 dark:text-royal-300 border border-royal-200 dark:border-royal-800">
                          {employee.department?.name || employee.department || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={attendanceData[employee._id]?.status || 'present'}
                          onChange={(e) => updateAttendance(employee._id, 'status', e.target.value)}
                          className={`px-3 py-2 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white w-full ${getStatusColor(attendanceData[employee._id]?.status || 'present')
                            }`}
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="leave">On Leave</option>
                          <option value="off-duty">Off Duty</option>
                          <option value="sick">Sick Leave</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={attendanceData[employee._id]?.remarks || ''}
                          onChange={(e) => updateAttendance(employee._id, 'remarks', e.target.value)}
                          placeholder="Add remarks..."
                          className="px-3 py-2 bg-white/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-mustard-500 dark:focus:ring-mustard-600 dark:focus:border-mustard-600 dark:text-white w-full placeholder-neutral-400 dark:placeholder-neutral-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {['present', 'absent', 'late', 'leave', 'off-duty', 'sick'].map(status => (
                            <button
                              key={status}
                              onClick={() => updateAttendance(employee._id, 'status', status)}
                              className={`p-1 rounded-lg ${attendanceData[employee._id]?.status === status
                                ? getStatusColor(status)
                                : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300'
                                }`}
                              title={status.charAt(0).toUpperCase() + status.slice(1)}
                            >
                              {getStatusIcon(status)}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStaff.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto h-16 w-16 bg-gradient-to-r from-mustard-100 to-scarlet-100 dark:from-mustard-900/30 dark:to-scarlet-900/30 rounded-full flex items-center justify-center mb-4">
                  <UserGroupIcon className="h-8 w-8 text-mustard-600 dark:text-mustard-400" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 dark:text-white">No staff found</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                  {searchTerm || departmentFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No staff members found under your supervision'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleMarkAttendance}
              disabled={saving || filteredStaff.length === 0}
              className={`px-6 py-3 rounded-xl text-sm font-medium flex items-center shadow-lg hover:shadow-xl transition-all duration-200 ${saving || filteredStaff.length === 0
                ? 'bg-neutral-400 cursor-not-allowed text-white'
                : 'bg-gradient-to-r from-mustard-500 to-mustard-600 hover:from-mustard-600 hover:to-mustard-700 text-white'
                }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <DocumentCheckIcon className="h-4 w-4 mr-2" />
                  Save Attendance for {filteredStaff.length} Staff
                </>
              )}
            </button>
          </div>


        </>
      )}
    </div>
  );
};

export default SupervisorAttendance;