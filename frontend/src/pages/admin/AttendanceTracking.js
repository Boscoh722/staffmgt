import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import { departmentService } from '../../services/departmentService';
import {
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
import useDocumentTitle from '../../hooks/useDocumentTitle';

const AttendanceTracking = () => {
  const { user } = useSelector((state) => state.auth);
  useDocumentTitle('Attendance Tracking');
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    date: new Date(),
    department: '',
    status: '',
    search: ''
  });
  const [showStats, setShowStats] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchDepartments();
    fetchAttendance();
    fetchStats();
  }, [filters.date]);

  const fetchAttendance = async () => {
    try {
      const response = await staffService.getAttendance({
        date: filters.date.toISOString().split('T')[0],
        department: filters.department
      });
      setAttendance(response.data);
    } catch (error) {
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const startDate = new Date(filters.date);
      startDate.setDate(startDate.getDate() - 30);

      const response = await staffService.getAttendanceStats({
        startDate: startDate.toISOString().split('T')[0],
        endDate: filters.date.toISOString().split('T')[0]
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getDepartments();
      const deptList = Array.isArray(response.data) ? response.data : [];
      setDepartments(deptList);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const handleMarkAttendance = async (staffId, status) => {
    try {
      await staffService.markAttendance({
        staffId,
        date: filters.date.toISOString().split('T')[0],
        status
      });
      toast.success('Attendance marked successfully');
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to mark attendance');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-mustard-100 text-mustard-800 dark:bg-mustard-900/50 dark:text-mustard-300';
      case 'absent': return 'bg-scarlet-100 text-scarlet-800 dark:bg-scarlet-900/50 dark:text-scarlet-300';
      case 'late': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'leave': return 'bg-royal-100 text-royal-800 dark:bg-royal-900/50 dark:text-royal-300';
      case 'off-duty': return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-300';
      default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircleIcon className="h-5 w-5" />;
      case 'absent': return <XCircleIcon className="h-5 w-5" />;
      case 'late': return <ExclamationTriangleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  const filteredAttendance = attendance.filter(record => {
    if (!record || !record.staff) return false;
    
    const searchLower = filters.search.toLowerCase();
    const matchesSearch =
      (record.staff.firstName?.toLowerCase() || '').includes(searchLower) ||
      (record.staff.lastName?.toLowerCase() || '').includes(searchLower) ||
      (record.staff.employeeId?.toLowerCase() || '').includes(searchLower);

    const matchesStatus = !filters.status || record.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  // Helper function to get department name
  const getDepartmentName = (dept) => {
    if (!dept) return 'N/A';
    if (typeof dept === 'object') {
      return dept.name || dept._id;
    }
    // If it's a string (ID), find the department name from the departments list
    const foundDept = departments.find(d => d._id === dept || d.name === dept);
    return foundDept?.name || dept;
  };

  const chartData = {
    labels: ['Present', 'Absent', 'Late', 'Leave', 'Off-Duty'],
    datasets: [
      {
        label: 'Attendance Distribution',
        data: [
          attendance.filter(a => a.status === 'present').length,
          attendance.filter(a => a.status === 'absent').length,
          attendance.filter(a => a.status === 'late').length,
          attendance.filter(a => a.status === 'leave').length,
          attendance.filter(a => a.status === 'off-duty').length
        ],
        backgroundColor: [
          'rgba(255, 191, 0, 0.8)',   // mustard
          'rgba(255, 0, 0, 0.8)',      // scarlet
          'rgba(245, 158, 11, 0.8)',   // yellow
          'rgba(0, 102, 255, 0.8)',    // royal
          'rgba(156, 163, 175, 0.8)'   // neutral
        ],
        borderColor: [
          'rgba(255, 191, 0, 1)',
          'rgba(255, 0, 0, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(0, 102, 255, 1)',
          'rgba(156, 163, 175, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#374151',
          font: {
            family: "'Neulis Sans', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          family: "'Neulis Sans', sans-serif"
        },
        bodyFont: {
          family: "'Neulis Sans', sans-serif"
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#6B7280',
          font: {
            family: "'Neulis Sans', sans-serif"
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          color: '#6B7280',
          font: {
            family: "'Neulis Sans', sans-serif"
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Attendance Tracking</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Track and manage staff attendance
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 border border-mustard-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-mustard-50 dark:border-mustard-600 dark:text-neutral-300 dark:hover:bg-mustard-900/30 flex items-center transition-all duration-200"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
          <button
            onClick={() => {
              toast.success('Export functionality will be implemented');
            }}
            className="px-4 py-2 border border-mustard-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-mustard-50 dark:border-mustard-600 dark:text-neutral-300 dark:hover:bg-mustard-900/30 flex items-center transition-all duration-200"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && (
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Attendance Statistics (Last 30 Days)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/30 dark:to-mustard-900/20 rounded-xl border border-mustard-200 dark:border-mustard-800">
              <div className="text-3xl font-bold text-neutral-900 dark:text-white">
                {stats.attendancePercentage || 0}%
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Attendance Rate</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/30 dark:to-mustard-900/20 rounded-xl border border-mustard-200 dark:border-mustard-800">
              <div className="text-3xl font-bold text-mustard-600 dark:text-mustard-400">
                {stats.present || 0}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Present Days</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-scarlet-50 to-scarlet-100/50 dark:from-scarlet-900/30 dark:to-scarlet-900/20 rounded-xl border border-scarlet-200 dark:border-scarlet-800">
              <div className="text-3xl font-bold text-scarlet-600 dark:text-scarlet-400">
                {stats.absent || 0}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Absent Days</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/30 dark:to-royal-900/20 rounded-xl border border-royal-200 dark:border-royal-800">
              <div className="text-3xl font-bold text-royal-600 dark:text-royal-400">
                {stats.averageHours || 0}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Avg Hours/Day</div>
            </div>
          </div>
          <div className="mt-6 bg-white dark:bg-neutral-900/50 p-4 rounded-xl">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Date
            </label>
            <DatePicker
              selected={filters.date}
              onChange={(date) => setFilters({ ...filters, date })}
              className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
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
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="leave">Leave</option>
              <option value="off-duty">Off Duty</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-3 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700 placeholder-royal-400 dark:placeholder-royal-500"
                placeholder="Search staff..."
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400 absolute left-3 top-3.5" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {filteredAttendance.length} staff members for {filters.date.toLocaleDateString()}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setFilters({
                date: new Date(),
                department: '',
                status: '',
                search: ''
              })}
              className="text-sm text-mustard-600 hover:text-mustard-700 dark:text-mustard-400 transition-colors duration-200"
            >
              Clear Filters
            </button>
            <button
              onClick={() => {
                toast.success('Bulk marking functionality will be implemented');
              }}
              className="text-sm text-mustard-600 hover:text-mustard-700 dark:text-mustard-400 transition-colors duration-200"
            >
              Mark All Present
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-mustard-100 dark:border-mustard-900/30">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard-600"></div>
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
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Check In/Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Hours Worked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Remarks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mustard-200 dark:divide-mustard-900/30">
                {filteredAttendance.map((record) => (
                  <tr key={record._id} className="hover:bg-mustard-50/50 dark:hover:bg-mustard-900/20 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-mustard-100 to-royal-100 dark:from-mustard-900/50 dark:to-royal-900/50 flex items-center justify-center">
                            <span className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
                              {record.staff?.firstName?.charAt(0) || 'N'}{record.staff?.lastName?.charAt(0) || 'A'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {record.staff?.firstName || 'N/A'} {record.staff?.lastName || ''}
                          </div>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            {record.staff?.employeeId || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-300">
                      {getDepartmentName(record.staff?.department)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`p-1 rounded-full mr-2 ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                        </div>
                        <span className={`text-sm font-medium capitalize ${getStatusColor(record.status)} px-2 py-1 rounded-full`}>
                          {record.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900 dark:text-white">
                        {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '--:--'}
                      </div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '--:--'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-300">
                      {record.hoursWorked ? `${record.hoursWorked.toFixed(2)} hrs` : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-900 dark:text-neutral-300 max-w-xs truncate" title={record.remarks}>
                        {record.remarks || 'No remarks'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleMarkAttendance(record.staff?._id || record.staff, 'present')}
                          className="text-mustard-600 hover:text-mustard-700 dark:text-mustard-400 dark:hover:text-mustard-300 transition-colors duration-200"
                          title="Mark Present"
                          disabled={!record.staff?._id && !record.staff}
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(record.staff?._id || record.staff, 'absent')}
                          className="text-scarlet-600 hover:text-scarlet-700 dark:text-scarlet-400 dark:hover:text-scarlet-300 transition-colors duration-200"
                          title="Mark Absent"
                          disabled={!record.staff?._id && !record.staff}
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(record.staff?._id || record.staff, 'late')}
                          className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors duration-200"
                          title="Mark Late"
                          disabled={!record.staff?._id && !record.staff}
                        >
                          <ExclamationTriangleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            // View details
                          }}
                          className="text-royal-600 hover:text-royal-700 dark:text-royal-400 dark:hover:text-royal-300 transition-colors duration-200"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-mustard-100 dark:bg-mustard-900/50 mr-4">
              <CheckCircleIcon className="h-6 w-6 text-mustard-600 dark:text-mustard-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Present Today</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {attendance.filter(a => a.status === 'present').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-scarlet-100 dark:border-scarlet-900/30">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-scarlet-100 dark:bg-scarlet-900/50 mr-4">
              <XCircleIcon className="h-6 w-6 text-scarlet-600 dark:text-scarlet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Absent Today</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {attendance.filter(a => a.status === 'absent').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-yellow-100 dark:border-yellow-900/30">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/50 mr-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Late Today</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {attendance.filter(a => a.status === 'late').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-royal-100 dark:border-royal-900/30">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-royal-100 dark:bg-royal-900/50 mr-4">
              <ClockIcon className="h-6 w-6 text-royal-600 dark:text-royal-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">On Leave</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {attendance.filter(a => a.status === 'leave').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracking;