import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { staffService } from '../../services/staffService';
import {
  CheckCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const ClerkDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  useDocumentTitle('Dashboard');

  const [todayStats, setTodayStats] = useState({
    totalStaff: 0,
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
    offDuty: 0
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      console.log('📊 Fetching attendance for date:', today);
      
      // Fetch both attendance and total staff count
      const [attendanceResponse, staffResponse] = await Promise.all([
        staffService.getAttendance({ date: today }),
        staffService.getStaff().catch(() => ({ data: [] })) // Fallback if fails
      ]);

      console.log('📊 Attendance response:', attendanceResponse);
      console.log('📊 Staff response:', staffResponse);

      // Handle different response formats for attendance
      let attendance = [];
      if (Array.isArray(attendanceResponse.data)) {
        attendance = attendanceResponse.data;
      } else if (Array.isArray(attendanceResponse)) {
        attendance = attendanceResponse;
      } else if (attendanceResponse.data?.attendance && Array.isArray(attendanceResponse.data.attendance)) {
        attendance = attendanceResponse.data.attendance;
      } else if (attendanceResponse.data?.records && Array.isArray(attendanceResponse.data.records)) {
        attendance = attendanceResponse.data.records;
      }

      // Get total staff count (excluding admin and supervisor)
      const allStaff = Array.isArray(staffResponse.data) ? staffResponse.data : [];
      const totalStaffCount = allStaff.filter(s => 
        s.role !== 'admin' && s.role !== 'supervisor'
      ).length;

      console.log('📊 Processed attendance array:', attendance);
      console.log('📊 Attendance count:', attendance.length);
      console.log('📊 Total staff count:', totalStaffCount);

      // Calculate stats from attendance records
      const stats = {
        totalStaff: totalStaffCount || attendance.length, // Use total staff or fallback to attendance count
        present: attendance.filter(a => {
          const status = a.status?.toLowerCase();
          return status === 'present' || status === 'on-duty' || status === 'onduty';
        }).length,
        absent: attendance.filter(a => a.status?.toLowerCase() === 'absent').length,
        late: attendance.filter(a => a.status?.toLowerCase() === 'late').length,
        onLeave: attendance.filter(a => {
          const status = a.status?.toLowerCase();
          return status === 'leave' || status === 'on-leave';
        }).length,
        offDuty: attendance.filter(a => {
          const status = a.status?.toLowerCase();
          return status === 'off-duty' || status === 'offduty';
        }).length
      };

      console.log('📊 Calculated stats:', stats);
      setTodayStats(stats);

    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      console.error('   Error response:', error.response?.data);
      
      // Set empty stats on error
      setTodayStats({
        totalStaff: 0,
        present: 0,
        absent: 0,
        late: 0,
        onLeave: 0,
        offDuty: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Refresh when navigating back to dashboard
  useEffect(() => {
    if (location.pathname === '/clerk') {
      fetchDashboardData();
    }
  }, [location.pathname, fetchDashboardData]);

  // Refresh when window/tab comes into focus
  useEffect(() => {
    const handleFocus = () => {
      fetchDashboardData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchDashboardData]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">

      {/* Header */}
      <div className="bg-gradient-to-r from-mustard-500 via-scarlet-500 to-royal-500 rounded-2xl shadow-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Clerk Dashboard</h1>
        <p className="mt-2 opacity-90">
          Welcome, {user?.firstName}. Manage daily attendance and administrative tasks.
        </p>
        <div className="mt-4 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2" />
          <span>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Today's Attendance Summary */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Today's Attendance Summary
          </h3>
          <button
            onClick={fetchDashboardData}
            className="text-sm text-mustard-600 hover:text-mustard-700 dark:text-mustard-400 dark:hover:text-mustard-300 flex items-center transition-colors duration-200"
          >
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <SummaryCard label="Present" value={todayStats.present} color="mustard" />
          <SummaryCard label="Absent" value={todayStats.absent} color="scarlet" />
          <SummaryCard label="Late" value={todayStats.late} color="yellow" />
          <SummaryCard label="On Leave" value={todayStats.onLeave} color="royal" />
          <SummaryCard label="Off Duty" value={todayStats.offDuty} color="purple" />
          <SummaryCard label="Total Staff" value={todayStats.totalStaff} color="neutral" />
        </div>

        <div className="mt-6">
          <Link
            to="/clerk/attendance"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-mustard-500 to-mustard-600 text-white rounded-xl text-sm font-medium hover:from-mustard-600 hover:to-mustard-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Mark Today's Attendance
          </Link>
        </div>
      </div>

    </div>
  );
};

const SummaryCard = ({ label, value, color }) => {
  const colors = {
    mustard: 'bg-mustard-100 dark:bg-mustard-900/50 text-mustard-800 dark:text-mustard-300 border-mustard-200 dark:border-mustard-800',
    scarlet: 'bg-scarlet-100 dark:bg-scarlet-900/50 text-scarlet-800 dark:text-scarlet-300 border-scarlet-200 dark:border-scarlet-800',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    royal: 'bg-royal-100 dark:bg-royal-900/50 text-royal-800 dark:text-royal-300 border-royal-200 dark:border-royal-800',
    purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    neutral: 'bg-neutral-100 dark:bg-neutral-900/50 text-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
  };

  return (
    <div className={`p-4 rounded-xl border text-center transition-all duration-200 hover:shadow-md ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm mt-1">{label}</div>
    </div>
  );
};

export default ClerkDashboard;
