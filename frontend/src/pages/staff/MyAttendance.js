import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import {
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
import useDocumentTitle from '../../hooks/useDocumentTitle';

const MyAttendance = () => {
  useDocumentTitle('My Attendance');
  const { user } = useSelector((state) => state.auth);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date()
  });
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'

  useEffect(() => {
    fetchAttendance();
    fetchStats();
  }, [filters.startDate, filters.endDate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await staffService.getMyAttendance({
        startDate: filters.startDate.toISOString().split('T')[0],
        endDate: filters.endDate.toISOString().split('T')[0]
      });
      setAttendance(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await staffService.getAttendanceStats({
        startDate: filters.startDate.toISOString().split('T')[0],
        endDate: filters.endDate.toISOString().split('T')[0],
        staffId: user._id
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'bg-mustard-100 text-mustard-800 border-mustard-200 dark:bg-mustard-900/50 dark:text-mustard-300 dark:border-mustard-800',
      absent: 'bg-scarlet-100 text-scarlet-800 border-scarlet-200 dark:bg-scarlet-900/50 dark:text-scarlet-300 dark:border-scarlet-800',
      late: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
      leave: 'bg-royal-100 text-royal-800 border-royal-200 dark:bg-royal-900/50 dark:text-royal-300 dark:border-royal-800',
      'off-duty': 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-900/50 dark:text-neutral-300 dark:border-neutral-800',
      sick: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800'
    };
    return colors[status] || colors.present;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircleIcon className="h-5 w-5" />;
      case 'absent': return <XCircleIcon className="h-5 w-5" />;
      case 'late': return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'leave': return <ClockIcon className="h-5 w-5" />;
      case 'sick': return <ExclamationTriangleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  const chartData = {
    labels: ['Present', 'Absent', 'Late', 'Leave', 'Off Duty', 'Sick'],
    datasets: [{
      label: 'Days',
      data: [
        attendance.filter(a => a.status === 'present').length,
        attendance.filter(a => a.status === 'absent').length,
        attendance.filter(a => a.status === 'late').length,
        attendance.filter(a => a.status === 'leave').length,
        attendance.filter(a => a.status === 'off-duty').length,
        attendance.filter(a => a.status === 'sick').length
      ],
      backgroundColor: [
        'rgba(234, 179, 8, 0.8)',    // mustard
        'rgba(220, 38, 38, 0.8)',    // scarlet
        'rgba(245, 158, 11, 0.8)',   // yellow
        'rgba(30, 64, 175, 0.8)',    // royal
        'rgba(156, 163, 175, 0.8)',  // neutral
        'rgba(147, 51, 234, 0.8)'    // purple
      ],
      borderColor: [
        'rgb(234, 179, 8)',
        'rgb(220, 38, 38)',
        'rgb(245, 158, 11)',
        'rgb(30, 64, 175)',
        'rgb(156, 163, 175)',
        'rgb(147, 51, 234)'
      ],
      borderWidth: 1
    }]
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#1f2937',
          padding: 20,
          font: {
            size: 12
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#1f2937',
          font: {
            size: 12
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  const handleExport = () => {
    // Export functionality
    const csvContent = [
      ['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Hours Worked', 'Remarks'],
      ...attendance.map(record => [
        new Date(record.date).toLocaleDateString(),
        new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }),
        record.status,
        record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        record.hoursWorked ? `${record.hoursWorked.toFixed(2)}` : 'N/A',
        record.remarks || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${filters.startDate.toISOString().split('T')[0]}_to_${filters.endDate.toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const quickFilters = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 3 Months', days: 90 },
    { label: 'This Year', year: new Date().getFullYear() }
  ];

  const applyQuickFilter = (filter) => {
    const endDate = new Date();
    const startDate = new Date();

    if (filter.days) {
      startDate.setDate(startDate.getDate() - filter.days);
    } else if (filter.year) {
      startDate.setFullYear(filter.year, 0, 1);
      startDate.setHours(0, 0, 0, 0);
    }

    setFilters({ startDate, endDate });
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center">
            <CalendarDaysIcon className="h-6 w-6 mr-2 text-mustard-500" />
            My Attendance
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Track your attendance records and statistics
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-royal-600 dark:text-royal-400">
            <InformationCircleIcon className="h-5 w-5 mr-2" />
            Last updated: {new Date().toLocaleDateString()}
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/30 dark:to-mustard-900/20 text-mustard-700 dark:text-mustard-300 rounded-xl text-sm font-medium hover:shadow-lg hover:from-mustard-100 hover:to-mustard-200/50 dark:hover:from-mustard-800/30 dark:hover:to-mustard-800/20 transition-all duration-200 border border-mustard-200 dark:border-mustard-800 flex items-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Present Days</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                {stats.present || 0}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {attendance.length > 0 ? `${Math.round((stats.present / attendance.length) * 100)}% of total` : 'No data'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-mustard-100 dark:bg-mustard-900/50">
              <CheckCircleIcon className="h-6 w-6 text-mustard-600 dark:text-mustard-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-scarlet-100 dark:border-scarlet-900/30 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Absent Days</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                {stats.absent || 0}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {attendance.length > 0 ? `${Math.round((stats.absent / attendance.length) * 100)}% of total` : 'No data'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-scarlet-100 dark:bg-scarlet-900/50">
              <XCircleIcon className="h-6 w-6 text-scarlet-600 dark:text-scarlet-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-yellow-100 dark:border-yellow-900/30 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Late Arrivals</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                {stats.late || 0}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {stats.present ? `${Math.round((stats.late / stats.present) * 100)}% of present days` : 'No data'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/50">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-royal-100 dark:border-royal-900/30 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Attendance Rate</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                {stats.attendancePercentage || 0}%
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Overall performance
              </p>
            </div>
            <div className="p-3 rounded-xl bg-royal-100 dark:bg-royal-900/50">
              <ChartBarIcon className="h-6 w-6 text-royal-600 dark:text-royal-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-royal-100 dark:border-royal-900/30">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2 text-royal-500" />
              Filter Records
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Date Range
                </label>
                <div className="space-y-4">
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-royal-500" />
                    <DatePicker
                      selected={filters.startDate}
                      onChange={(date) => setFilters({ ...filters, startDate: date })}
                      maxDate={filters.endDate}
                      className="w-full pl-10 pr-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white"
                    />
                  </div>

                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-royal-500" />
                    <DatePicker
                      selected={filters.endDate}
                      onChange={(date) => setFilters({ ...filters, endDate: date })}
                      minDate={filters.startDate}
                      maxDate={new Date()}
                      className="w-full pl-10 pr-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
                  Quick Filters
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {quickFilters.map((filter) => (
                    <button
                      key={filter.label}
                      onClick={() => applyQuickFilter(filter)}
                      className="px-3 py-2 bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10 text-royal-700 dark:text-royal-300 rounded-xl text-sm font-medium hover:shadow-lg hover:from-royal-100 hover:to-royal-200/50 dark:hover:from-royal-800/20 dark:hover:to-royal-800/10 transition-all duration-200 border border-royal-200 dark:border-royal-800"
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={fetchAttendance}
                disabled={loading}
                className="w-full px-4 py-2 bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/20 dark:to-mustard-900/10 text-mustard-700 dark:text-mustard-300 rounded-xl text-sm font-medium hover:shadow-lg hover:from-mustard-100 hover:to-mustard-200/50 dark:hover:from-mustard-800/20 dark:hover:to-mustard-800/10 transition-all duration-200 border border-mustard-200 dark:border-mustard-800 flex items-center justify-center"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh Data'}
              </button>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/20 dark:to-mustard-900/10 border border-mustard-200 dark:border-mustard-800">
              <h4 className="font-medium text-neutral-900 dark:text-white mb-3 flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-2 text-mustard-500" />
                Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Total Days:</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{stats.totalDays || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Working Days:</span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {(stats.present || 0) + (stats.late || 0) + (stats.leave || 0) + (stats.offDuty || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Average Hours:</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{stats.averageHours || 0} hrs/day</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Total Hours:</span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {stats.totalHours ? `${stats.totalHours.toFixed(2)} hrs` : '0 hrs'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-scarlet-100 dark:border-scarlet-900/30">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
              <UserCircleIcon className="h-5 w-5 mr-2 text-scarlet-500" />
              Employee Info
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Name</p>
                <p className="font-medium text-neutral-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Employee ID</p>
                <p className="font-medium text-mustard-700 dark:text-mustard-300">{user?.employeeId}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Department</p>
                <p className="font-medium text-royal-700 dark:text-royal-300">
                  {user?.department?.name || user?.department || 'Not assigned'}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Date of Joining</p>
                <p className="font-medium text-neutral-900 dark:text-white">
                  {user?.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Chart and Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center">
                <ChartPieIcon className="h-5 w-5 mr-2 text-mustard-500" />
                Attendance Overview
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${chartType === 'bar' ? 'bg-mustard-100 text-mustard-700 dark:bg-mustard-900/50 dark:text-mustard-300' : 'text-neutral-600 dark:text-neutral-400'}`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setChartType('pie')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${chartType === 'pie' ? 'bg-mustard-100 text-mustard-700 dark:bg-mustard-900/50 dark:text-mustard-300' : 'text-neutral-600 dark:text-neutral-400'}`}
                >
                  Pie
                </button>
              </div>
            </div>
            <div className="h-80">
              {chartType === 'bar' ? (
                <Bar data={chartData} options={barChartOptions} />
              ) : (
                <Pie data={chartData} options={pieChartOptions} />
              )}
            </div>
          </div>

          {/* Attendance Records */}
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-royal-100 dark:border-royal-900/30">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-royal-500" />
                Attendance Records
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10 text-royal-700 dark:text-royal-300 border border-royal-200 dark:border-royal-800">
                  {attendance.length} records
                </span>
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Showing records from {filters.startDate.toLocaleDateString()} to {filters.endDate.toLocaleDateString()}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard-600"></div>
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDaysIcon className="h-12 w-12 text-neutral-400 dark:text-neutral-500 mx-auto" />
                <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                  No attendance records found for the selected period
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                  <thead className="bg-gradient-to-r from-royal-50 to-mustard-50 dark:from-royal-900/30 dark:to-mustard-900/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Day
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Check In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Check Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Hours
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {attendance.map((record) => (
                      <tr key={record._id} className="hover:bg-gradient-to-r hover:from-mustard-50/30 hover:to-scarlet-50/30 dark:hover:from-mustard-900/10 dark:hover:to-scarlet-900/10 transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {new Date(record.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`p-1.5 rounded-lg ${getStatusColor(record.status)}`}>
                              {getStatusIcon(record.status)}
                            </div>
                            <span className={`ml-2 text-sm font-medium capitalize ${getStatusColor(record.status)} px-3 py-1 rounded-full`}>
                              {record.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-bold ${record.hoursWorked >= 8 ? 'text-mustard-600 dark:text-mustard-400' : 'text-scarlet-600 dark:text-scarlet-400'}`}>
                            {record.hoursWorked ? `${record.hoursWorked.toFixed(2)} hrs` : 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default MyAttendance;