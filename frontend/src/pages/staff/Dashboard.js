import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  ShieldExclamationIcon,
  ChevronRightIcon,
  ChartBarIcon,
  AcademicCapIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const StaffDashboard = () => {
  useDocumentTitle('Dashboard');
  const { user, token } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    attendance: {
      present: 0,
      absent: 0,
      late: 0,
      totalDays: 0,
      percentage: 0
    },
    leaves: {
      pending: 0,
      approved: 0,
      rejected: 0,
      taken: 0,
      balance: 0
    },
    disciplinary: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivities();
    fetchUpcomingLeaves();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch attendance stats
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const [attendanceResponse, leavesResponse, disciplinaryResponse] = await Promise.all([
        staffService.getMyAttendance({
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0]
        }),
        staffService.getMyLeaves(),
        staffService.getMyCases()
      ]);

      const attendance = Array.isArray(attendanceResponse.data) ? attendanceResponse.data : [];
      const leaves = Array.isArray(leavesResponse.data) ? leavesResponse.data : [];
      const cases = Array.isArray(disciplinaryResponse.data) ? disciplinaryResponse.data : [];

      // Calculate attendance stats
      const present = attendance.filter(a => a.status === 'present' || a.status === 'on-duty').length;
      const absent = attendance.filter(a => a.status === 'absent').length;
      const late = attendance.filter(a => a.status === 'late').length;
      const totalDays = attendance.length;
      const percentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

      // Calculate leave stats
      const pending = leaves.filter(l => l.status === 'pending').length;
      const approved = leaves.filter(l => l.status === 'approved').length;
      const rejected = leaves.filter(l => l.status === 'rejected').length;
      const taken = approved;
      const balance = 21 - taken; // Assuming 21 days annual leave

      setStats({
        attendance: { present, absent, late, totalDays, percentage },
        leaves: { pending, approved, rejected, taken, balance },
        disciplinary: cases.filter(c => c.status !== 'resolved').length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const [attendanceResponse, leavesResponse, casesResponse] = await Promise.all([
        staffService.getMyAttendance({ limit: 5 }),
        staffService.getMyLeaves(),
        staffService.getMyCases()
      ]);

      const activities = [];
      const now = new Date();

      // Add recent attendance
      const attendance = Array.isArray(attendanceResponse.data) ? attendanceResponse.data.slice(0, 3) : [];
      attendance.forEach(record => {
        const date = new Date(record.date);
        const hoursAgo = Math.floor((now - date) / (1000 * 60 * 60));
        const timeStr = hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`;
        
        activities.push({
          id: `att-${record._id}`,
          type: 'attendance',
          action: `Marked ${record.status}`,
          time: timeStr,
          status: record.status === 'present' || record.status === 'on-duty' ? 'success' : 
                  record.status === 'late' ? 'warning' : 'info'
        });
      });

      // Add recent leaves
      const leaves = Array.isArray(leavesResponse.data) ? leavesResponse.data.slice(0, 2) : [];
      leaves.forEach(leave => {
        const date = new Date(leave.createdAt);
        const hoursAgo = Math.floor((now - date) / (1000 * 60 * 60));
        const timeStr = hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`;
        
        activities.push({
          id: `leave-${leave._id}`,
          type: 'leave',
          action: `Leave application ${leave.status}`,
          time: timeStr,
          status: leave.status === 'approved' ? 'success' : 
                  leave.status === 'rejected' ? 'warning' : 'info'
        });
      });

      // Sort by time (most recent first)
      activities.sort((a, b) => {
        const aHours = parseInt(a.time);
        const bHours = parseInt(b.time);
        return aHours - bHours;
      });

      setRecentActivities(activities.slice(0, 4));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const fetchUpcomingLeaves = async () => {
    try {
      const response = await staffService.getMyLeaves();
      const leaves = Array.isArray(response.data) ? response.data : [];
      
      const now = new Date();
      const upcoming = leaves
        .filter(leave => {
          const startDate = new Date(leave.startDate);
          return startDate >= now && (leave.status === 'approved' || leave.status === 'pending');
        })
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 5)
        .map(leave => ({
          id: leave._id,
          type: leave.type || 'annual',
          startDate: leave.startDate,
          endDate: leave.endDate,
          status: leave.status
        }));

      setUpcomingLeaves(upcoming);
    } catch (error) {
      console.error('Error fetching upcoming leaves:', error);
    }
  };

  const statCards = [
    {
      title: 'Attendance Rate',
      value: `${stats.attendance.percentage || 0}%`,
      icon: ChartBarIcon,
      color: 'bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/30 dark:to-mustard-900/20',
      border: 'border-mustard-200 dark:border-mustard-800',
      iconColor: 'text-mustard-600 dark:text-mustard-400',
      subtitle: `${stats.attendance.present || 0} of ${stats.attendance.totalDays || 0} days`
    },
    {
      title: 'Leave Balance',
      value: `${stats.leaves.balance || 0} days`,
      icon: CalendarDaysIcon,
      color: 'bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/30 dark:to-royal-900/20',
      border: 'border-royal-200 dark:border-royal-800',
      iconColor: 'text-royal-600 dark:text-royal-400',
      subtitle: `${stats.leaves.taken || 0} days taken`
    },
    {
      title: 'Pending Requests',
      value: stats.leaves.pending || 0,
      icon: ClockIcon,
      color: 'bg-gradient-to-r from-yellow-50 to-yellow-100/50 dark:from-yellow-900/30 dark:to-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      subtitle: 'Awaiting approval'
    },
    {
      title: 'Active Cases',
      value: stats.disciplinary || 0,
      icon: ShieldExclamationIcon,
      color: 'bg-gradient-to-r from-scarlet-50 to-scarlet-100/50 dark:from-scarlet-900/30 dark:to-scarlet-900/20',
      border: 'border-scarlet-200 dark:border-scarlet-800',
      iconColor: 'text-scarlet-600 dark:text-scarlet-400',
      subtitle: 'Disciplinary matters'
    },
  ];

  const quickActions = [
    {
      title: 'Apply for Leave',
      description: 'Submit leave application',
      icon: DocumentTextIcon,
      color: 'from-royal-500 to-royal-600',
      hoverColor: 'from-royal-600 to-royal-700',
      onClick: () => navigate('/staff/apply-leave')
    },
    {
      title: 'View Attendance',
      description: 'Check attendance records',
      icon: CalendarDaysIcon,
      color: 'from-mustard-500 to-mustard-600',
      hoverColor: 'from-mustard-600 to-mustard-700',
      onClick: () => navigate('/staff/attendance')
    },
    {
      title: 'Submit Appeal',
      description: 'File disciplinary appeal',
      icon: ArrowUpTrayIcon,
      color: 'from-scarlet-500 to-scarlet-600',
      hoverColor: 'from-scarlet-600 to-scarlet-700',
      onClick: () => navigate('/staff/disciplinary-appeal')
    },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircleIcon className="h-5 w-5 text-mustard-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'info': return <ClockIcon className="h-5 w-5 text-royal-500" />;
      default: return <ClockIcon className="h-5 w-5 text-neutral-500" />;
    }
  };

  const getLeaveStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-mustard-100 text-mustard-800 dark:bg-mustard-900/50 dark:text-mustard-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'rejected': return 'bg-scarlet-100 text-scarlet-800 dark:bg-scarlet-900/50 dark:text-scarlet-300';
      default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-300';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const departmentName = user?.department?.name || user?.department || "No Department";

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      {/* Welcome Banner */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Welcome back, <span className="text-mustard-600 dark:text-mustard-400">{user?.firstName}!</span>
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2 flex items-center">
              <IdentificationIcon className="h-5 w-5 mr-2 text-royal-500" />
              Employee ID: {user?.employeeId}
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1 flex items-center">
              <AcademicCapIcon className="h-5 w-5 mr-2 text-scarlet-500" />
              Department: {departmentName}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/30 dark:to-mustard-900/20 text-mustard-700 dark:text-mustard-300 rounded-xl text-sm font-medium border border-mustard-200 dark:border-mustard-800">
              <CalendarDaysIcon className="h-5 w-5 mr-2" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.title}
            className={`bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border ${stat.border} hover:shadow-xl transition-all duration-200`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {stat.subtitle}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
              <ArrowRightIcon className="h-5 w-5 mr-2 text-mustard-500" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={action.onClick}
                  className={`p-4 bg-gradient-to-r ${action.color} hover:${action.hoverColor} text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center text-center`}
                >
                  <action.icon className="h-8 w-8 mb-2" />
                  <span className="font-semibold">{action.title}</span>
                  <span className="text-xs opacity-90 mt-1">{action.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upcoming Leaves */}
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-royal-100 dark:border-royal-900/30">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
              <CalendarDaysIcon className="h-5 w-5 mr-2 text-royal-500" />
              Upcoming Leaves
            </h3>
            {upcomingLeaves.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDaysIcon className="h-12 w-12 text-neutral-400 dark:text-neutral-500 mx-auto" />
                <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                  No upcoming leaves scheduled
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingLeaves.map((leave) => (
                  <div key={leave.id}
                    className="p-4 bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10 rounded-xl border border-royal-200 dark:border-royal-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                            {leave.type} Leave
                          </span>
                          <span className={`ml-3 px-2 py-1 text-xs rounded-full ${getLeaveStatusColor(leave.status)}`}>
                            {leave.status}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                        </p>
                      </div>
                      <ChevronRightIcon className="h-5 w-5 text-royal-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Recent Activities */}
        <div className="lg:col-span-1">
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-scarlet-100 dark:border-scarlet-900/30 h-full">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-scarlet-500" />
              Recent Activities
            </h3>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/50 mr-3">
                    {getStatusIcon(activity.status)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Attendance Summary */}
            <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">
                Attendance Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Present</span>
                  <span className="font-medium text-mustard-600 dark:text-mustard-400">
                    {stats.attendance.present || 0} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Absent</span>
                  <span className="font-medium text-scarlet-600 dark:text-scarlet-400">
                    {stats.attendance.absent || 0} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Late Arrivals</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    {stats.attendance.late || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;