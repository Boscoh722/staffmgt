import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { staffService } from '../../services/staffService';
import attendanceService from '../../services/attendanceService';
import {
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
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
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
import useDocumentTitle from '../../hooks/useDocumentTitle';

const SupervisorDashboard = () => {
  useDocumentTitle('Dashboard');
  const { user, token } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    staffCount: 0,
    pendingLeaves: 0,
    attendanceRate: 0,
    openCases: 0,
  });

  const [attendanceData, setAttendanceData] = useState({
    labels: [],
    datasets: []
  });

  const [supervisedStaff, setSupervisedStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Memoize fetch functions
  const fetchSupervisorData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching supervisor data for user:', user?._id);

      // Fetch supervised staff with supervisor field
      const staffResponse = await staffService.getStaff();
      console.log('Raw staff response:', staffResponse);
      
      // Filter staff where supervisor matches current user
      const supervisedStaffList = staffResponse.data?.filter(s => {
        // Check both ways supervisor might be stored
        const supervisorId = s.supervisor?._id || s.supervisor;
        return supervisorId === user._id;
      }) || [];

      console.log('Filtered supervised staff:', supervisedStaffList);
      setSupervisedStaff(supervisedStaffList);

      if (supervisedStaffList.length === 0) {
        console.log('No staff found under this supervisor');
        setStats(prev => ({
          ...prev,
          staffCount: 0,
          pendingLeaves: 0,
          openCases: 0,
        }));
        
        // Set empty attendance data
        setAttendanceData({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Team Attendance',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(255, 191, 0, 0.2)'
          }]
        });
        
        setDataLoaded(true);
        setLoading(false);
        return;
      }

      // Fetch pending leaves for supervised staff
      let pendingLeaves = 0;
      try {
        const leavesResponse = await staffService.getAllLeaves();
        console.log('Leaves response:', leavesResponse);
        
        if (leavesResponse.data) {
          pendingLeaves = leavesResponse.data.filter(l => 
            l.status === 'pending' &&
            supervisedStaffList.some(s => s._id === l.staff?._id)
          ).length;
        }
        console.log('Pending leaves count:', pendingLeaves);
      } catch (error) {
        console.warn('Could not fetch leaves:', error);
      }

      // Fetch disciplinary cases
      let openCases = 0;
      try {
        if (typeof staffService.getDisciplinaryCases === 'function') {
          const casesResponse = await staffService.getDisciplinaryCases();
          console.log('Cases response:', casesResponse);
          
          if (casesResponse.data) {
            openCases = casesResponse.data.filter(c => 
              c.status === 'open' &&
              supervisedStaffList.some(s => s._id === c.staff?._id)
            ).length;
          }
        }
        console.log('Open cases count:', openCases);
      } catch (error) {
        console.warn('Could not fetch disciplinary cases:', error);
      }

      // Update initial stats
      setStats(prev => ({
        ...prev,
        staffCount: supervisedStaffList.length,
        pendingLeaves,
        openCases
      }));

      // Fetch attendance data
      await fetchAttendanceData(supervisedStaffList);

      setDataLoaded(true);

    } catch (error) {
      console.error('Error fetching supervisor data:', error);
      toast.error('Failed to load dashboard data');
      setDataLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  const fetchAttendanceData = useCallback(async (staffList) => {
    try {
      setAttendanceLoading(true);
      console.log('Fetching attendance for staff:', staffList.length);

      if (!staffList || staffList.length === 0) {
        console.log('No staff list provided for attendance');
        setAttendanceData({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Team Attendance (%)',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(255, 191, 0, 0.2)'
          }]
        });
        setStats(prev => ({ ...prev, attendanceRate: 0 }));
        return;
      }

      const staffIds = staffList.map(staff => staff._id);
      console.log('Staff IDs for attendance:', staffIds);

      // Get current week dates
      const weekDates = getCurrentWeekDates();
      console.log('Week dates for attendance:', weekDates);

      // Fetch attendance for each day of the week
      const weeklyData = [];
      let totalAttendance = 0;
      let totalPossibleAttendance = 0;

      for (const date of weekDates) {
        try {
          console.log(`Fetching attendance for date: ${date}`);
          
          // Create date range for single day
          const startDate = new Date(date);
          const endDate = new Date(date);
          endDate.setHours(23, 59, 59, 999);
          
          const response = await attendanceService.getAttendanceByDateRange(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          );
          
          console.log(`Attendance response for ${date}:`, response);
          
          let attendanceRecords = [];
          if (response && response.data) {
            attendanceRecords = response.data;
          } else if (Array.isArray(response)) {
            attendanceRecords = response;
          }
          
          // Filter records for supervised staff
          const dayAttendance = attendanceRecords.filter(record => {
            const recordStaffId = record.staff?._id || record.staff;
            return staffIds.includes(recordStaffId) && 
                   (record.status === 'present' || record.status === 'on-duty');
          });
          
          const attendancePercentage = staffIds.length > 0 
            ? Math.round((dayAttendance.length / staffIds.length) * 100)
            : 0;
          
          weeklyData.push(attendancePercentage);
          totalAttendance += dayAttendance.length;
          totalPossibleAttendance += staffIds.length;
          
        } catch (error) {
          console.warn(`Error fetching attendance for ${date}:`, error);
          weeklyData.push(0);
        }
      }

      console.log('Weekly attendance data:', weeklyData);
      console.log('Total attendance:', totalAttendance, 'Total possible:', totalPossibleAttendance);

      // Calculate overall attendance rate
      const overallRate = totalPossibleAttendance > 0 
        ? Math.round((totalAttendance / totalPossibleAttendance) * 100)
        : 0;

      console.log('Overall attendance rate:', overallRate);

      // Update stats
      setStats(prev => ({
        ...prev,
        attendanceRate: overallRate
      }));

      // Prepare chart labels (short weekday names)
      const chartLabels = weekDates.map(date =>
        new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
      );

      // Set chart data
      setAttendanceData({
        labels: chartLabels,
        datasets: [
          {
            label: 'Team Attendance (%)',
            data: weeklyData,
            backgroundColor: weeklyData.map((value, index) => 
              value >= 80 ? 'rgba(34, 197, 94, 0.8)' : // Green for good attendance
              value >= 60 ? 'rgba(234, 179, 8, 0.8)' : // Yellow for moderate
              'rgba(239, 68, 68, 0.8)' // Red for poor
            ),
            borderColor: weeklyData.map((value, index) => 
              value >= 80 ? 'rgba(34, 197, 94, 1)' :
              value >= 60 ? 'rgba(234, 179, 8, 1)' :
              'rgba(239, 68, 68, 1)'
            ),
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      });

    } catch (error) {
      console.error('Error in fetchAttendanceData:', error);
      toast.error('Failed to load attendance data');
      
      // Set default data on error
      setAttendanceData({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Team Attendance (%)',
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: 'rgba(255, 191, 0, 0.2)'
        }]
      });
      setStats(prev => ({ ...prev, attendanceRate: 0 }));
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  // Helper function to get current week's dates
  const getCurrentWeekDates = () => {
    const dates = [];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Start from Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  };

  // Initial data fetch
  useEffect(() => {
    if (user?._id) {
      fetchSupervisorData();
    } else {
      console.log('No user ID available, waiting...');
      setLoading(false);
      setDataLoaded(true);
    }
  }, [user?._id, fetchSupervisorData]);

  // Loading state component
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      <p className="text-neutral-600 dark:text-neutral-400">Loading dashboard data...</p>
    </div>
  );

  const statCards = [
    {
      title: 'Staff Under You',
      value: stats.staffCount,
      icon: UserGroupIcon,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      iconColor: 'text-blue-600 dark:text-blue-400',
      trend: stats.staffCount > 0 ? 'stable' : 'none',
      description: 'Total team members'
    },
    {
      title: 'Pending Leaves',
      value: stats.pendingLeaves,
      icon: CalendarIcon,
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      trend: stats.pendingLeaves > 5 ? 'up' : stats.pendingLeaves === 0 ? 'none' : 'down',
      description: 'Requiring your approval'
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendanceRate}%`,
      icon: ChartBarIcon,
      color: stats.attendanceRate >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 
             stats.attendanceRate >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 
             'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      iconColor: stats.attendanceRate >= 80 ? 'text-green-600 dark:text-green-400' : 
                 stats.attendanceRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 
                 'text-red-600 dark:text-red-400',
      trend: stats.attendanceRate >= 85 ? 'up' : stats.attendanceRate >= 75 ? 'stable' : 'down',
      description: 'This week average'
    },
    {
      title: 'Open Cases',
      value: stats.openCases,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      iconColor: 'text-red-600 dark:text-red-400',
      trend: stats.openCases > 3 ? 'up' : stats.openCases === 0 ? 'none' : 'down',
      description: 'Requiring attention'
    }
  ];

  const quickActions = [
    {
      title: 'Review Leaves',
      description: 'Approve or reject leave applications',
      icon: CalendarIcon,
      color: 'bg-yellow-500',
      link: '/supervisor/leaves',
      count: stats.pendingLeaves > 0 ? stats.pendingLeaves : undefined
    },
    {
      title: 'View Team',
      description: 'See all staff under your supervision',
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      link: '/supervisor/staff',
      count: stats.staffCount > 0 ? stats.staffCount : undefined
    },
    {
      title: 'Mark Attendance',
      description: 'Mark attendance for your team',
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      link: '/supervisor/attendance',
      count: stats.attendanceRate < 80 ? 'Low' : undefined
    },
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw}%`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
          font: {
            size: 12
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  // Main render
  if (loading && !dataLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-yellow-50 to-red-50 dark:from-neutral-900 dark:via-blue-900 dark:to-red-900 min-h-screen font-sans">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-yellow-500 via-red-500 to-blue-500 rounded-2xl shadow-xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold">Supervisor Dashboard</h1>
        <p className="mt-2 opacity-90 text-sm sm:text-base">
          Welcome, {user?.firstName || 'Supervisor'}. Manage your team effectively.
        </p>
        <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <span className="flex items-center">
            <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Last updated: {new Date().toLocaleDateString()}
          </span>
          <span className="flex items-center">
            <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Week {Math.ceil(new Date().getDate() / 7)}
          </span>
          <span className="flex items-center">
            <UserGroupIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            {stats.staffCount} team {stats.staffCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-yellow-100 dark:border-yellow-900/30 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  {stat.title}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mt-1 sm:mt-2">
                  {stat.value}
                </p>
                <div className="flex items-center mt-1 sm:mt-2">
                  {stat.trend === 'up' && (
                    <span className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                      {stat.description}
                    </span>
                  )}
                  {stat.trend === 'down' && (
                    <span className="flex items-center text-xs text-red-600 dark:text-red-400">
                      <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                      {stat.description}
                    </span>
                  )}
                  {stat.trend === 'stable' && (
                    <span className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                      <MinusIcon className="h-3 w-3 mr-1" />
                      {stat.description}
                    </span>
                  )}
                  {stat.trend === 'none' && (
                    <span className="flex items-center text-xs text-neutral-500 dark:text-neutral-500">
                      {stat.description}
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-2 sm:p-3 rounded-xl ${stat.color}`}>
                <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Attendance Chart */}
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-yellow-100 dark:border-yellow-900/30">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Team Attendance This Week
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => fetchSupervisorData()}
              disabled={attendanceLoading}
              className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {attendanceLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                  Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </button>
          </div>
          <div className="h-64 sm:h-72">
            {attendanceLoading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading attendance data...</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">Fetching from server</p>
              </div>
            ) : (
              <>
                <Bar data={attendanceData} options={chartOptions} />
                {stats.staffCount === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      No staff assigned to you yet
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-yellow-100 dark:border-yellow-900/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Average attendance: <span className={`font-semibold ${stats.attendanceRate >= 80 ? 'text-green-600 dark:text-green-400' : 
                    stats.attendanceRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 
                    'text-red-600 dark:text-red-400'}`}>{stats.attendanceRate}%</span>
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                  Based on {stats.staffCount} staff {stats.staffCount === 1 ? 'member' : 'members'}
                </p>
              </div>
              {stats.attendanceRate < 80 && stats.staffCount > 0 && (
                <div className="flex items-center gap-2">
                  {stats.attendanceRate < 60 && (
                    <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">
                      Needs immediate attention
                    </span>
                  )}
                  {stats.attendanceRate >= 60 && stats.attendanceRate < 80 && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded">
                      Could be better
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-yellow-100 dark:border-yellow-900/30">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.link}
                className="block p-3 sm:p-4 border border-yellow-200 dark:border-yellow-800 rounded-xl hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-white/50 to-white/30 dark:from-neutral-900/30 dark:to-neutral-800/30 hover:scale-[1.02] relative group"
              >
                {action.count !== undefined && (
                  <span className={`absolute -top-2 -right-2 text-xs px-2 py-1 rounded-full ${
                    action.title === 'Mark Attendance' && action.count === 'Low'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                      : action.title === 'Review Leaves'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                  }`}>
                    {action.count}
                  </span>
                )}
                <div className="flex items-center">
                  <div className={`p-2 sm:p-3 rounded-lg ${action.color} mr-3 group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-200 text-sm sm:text-base">
                      {action.title}
                    </p>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Team Overview */}
          <div className="mt-6 pt-4 border-t border-yellow-100 dark:border-yellow-900/30">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
              Team Overview
            </h4>
            <div className="space-y-3">
              {stats.staffCount === 0 ? (
                <div className="text-center py-3">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    No staff members assigned to you
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                    Contact admin to get team members assigned
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Team Members</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{stats.staffCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Pending Actions</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">{stats.pendingLeaves + stats.openCases}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Attendance Status</span>
                    <span className={`font-semibold ${
                      stats.attendanceRate >= 80 ? 'text-green-600 dark:text-green-400' :
                      stats.attendanceRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {stats.attendanceRate >= 80 ? 'Good' : 
                       stats.attendanceRate >= 60 ? 'Average' : 'Poor'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Status Bar */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-xl shadow p-3 sm:p-4 border border-yellow-100 dark:border-yellow-900/30">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${dataLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              Dashboard {dataLoaded ? 'data loaded' : 'loading data...'}
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">
              Last refresh: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={() => fetchSupervisorData()}
              disabled={loading || attendanceLoading}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || attendanceLoading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;