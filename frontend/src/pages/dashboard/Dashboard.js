import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { staffService } from "../../services/staffService";
import attendanceService from "../../services/attendanceService";
import reportService from "../../services/reportService";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import {
  UsersIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  DocumentChartBarIcon, 
  ArrowDownTrayIcon, 
  DocumentArrowDownIcon, 
} from "@heroicons/react/24/outline";

import toast from "react-hot-toast";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalStaff: 0,
      recentHires: 0,
      activeLeaves: 0,
      pendingLeaves: 0,
      todayPresent: 0,
      todayAbsent: 0,
      todayLate: 0,
      todayOnLeave: 0,
      approvalRate: 0,
    },
    monthlyLeaves: [],
    recentLeaves: [],
    reportStats: {},
  });

  /** ---------- HELPERS ---------- **/
  const generateFallbackMonthlyData = () => {
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000)
        .toISOString()
        .split("T")[0],
      approved: 0,
      pending: 0,
      rejected: 0,
      total: 0,
    }));
  };

  const processMonthlyLeaveData = (monthlyData) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split("T")[0];
    });

    const map = {};
    monthlyData?.forEach((i) => {
      if (i?.date) map[i.date] = i;
    });

    return last30Days.map((date) => ({
      date,
      approved: map[date]?.approved || 0,
      pending: map[date]?.pending || 0,
      rejected: map[date]?.rejected || 0,
      total:
        (map[date]?.approved || 0) +
        (map[date]?.pending || 0) +
        (map[date]?.rejected || 0),
    }));
  };

  /** ---------- REPORT DOWNLOAD FUNCTIONS ---------- **/
  const handleQuickAttendanceReport = async () => {
    setDownloadingReport('attendance');
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      
      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        format: 'excel',
        save: false
      };
      
      const response = await reportService.generateAttendanceReport(params);
      const filename = `attendance_report_${Date.now()}.xlsx`;
      reportService.handleBlobResponse(response.data, filename);
      
      toast.success('Attendance report downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading report: ' + error.message);
    } finally {
      setDownloadingReport(null);
    }
  };

  const handleQuickLeaveReport = async () => {
    setDownloadingReport('leave');
    try {
      const params = {
        status: 'approved',
        format: 'excel',
        save: false
      };
      
      const response = await reportService.generateLeaveReport(params);
      const filename = `leave_report_${Date.now()}.xlsx`;
      reportService.handleBlobResponse(response.data, filename);
      
      toast.success('Leave report downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading report: ' + error.message);
    } finally {
      setDownloadingReport(null);
    }
  };

  /** ---------- FETCH DASHBOARD DATA ---------- **/
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        staffResPromise,
        reportStatsPromise,
      ] = [
        staffService.getDashboardStats(),
        reportService.getReportStats(),
      ];

      const [
        staffRes,
        reportStatsRes,
      ] = await Promise.allSettled([
        staffResPromise,
        reportStatsPromise,
      ]);

      let stats = {};
      let monthlyLeaves = [];
      let recentLeaves = [];

      if (staffRes.status === "fulfilled" && staffRes.value && staffRes.value.data) {
        const data = staffRes.value.data;
        stats = data.stats || data;
        monthlyLeaves = processMonthlyLeaveData(data.monthlyLeaves || []);
        recentLeaves = data.recentLeaves || [];
      } else {
        monthlyLeaves = generateFallbackMonthlyData();
      }

      let reportStats = {};
      if (reportStatsRes.status === "fulfilled" && reportStatsRes.value) {
        reportStats = reportStatsRes.value.data ?? reportStatsRes.value;
      }

      setDashboardData((prev) => ({
        ...prev,
        stats: {
          totalStaff: (stats && stats.totalStaff) ?? prev.stats.totalStaff ?? 0,
          recentHires: (stats && stats.recentHires) ?? prev.stats.recentHires ?? 0,
          activeLeaves: (stats && stats.activeLeaves) ?? prev.stats.activeLeaves ?? 0,
          pendingLeaves: (stats && stats.pendingLeaves) ?? prev.stats.pendingLeaves ?? 0,
          approvalRate: (stats && stats.approvalRate) ?? prev.stats.approvalRate ?? 0,
          todayPresent: stats.todayPresent || 0,
          todayLate: stats.todayLate || 0,
          todayAbsent: stats.todayAbsent || 0,
          todayOnLeave: stats.todayOnLeave || 0,
        },
        monthlyLeaves: monthlyLeaves.length ? monthlyLeaves : generateFallbackMonthlyData(),
        recentLeaves,
        reportStats,
      }));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      toast.error("Failed to load dashboard");
      setError(err.message || "Failed to load dashboard data");
      setDashboardData((prev) => ({
        ...prev,
        monthlyLeaves: generateFallbackMonthlyData(),
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /** ---------- CHART CONFIG ---------- **/
  const leaveChartData = {
    labels: dashboardData.monthlyLeaves.map((d) => {
      const dt = new Date(d.date);
      return `${dt.getDate()}/${dt.getMonth() + 1}`;
    }),
    datasets: [
      {
        label: "Approved",
        data: dashboardData.monthlyLeaves.map((d) => d.approved),
        backgroundColor: "rgba(34, 197, 94, 0.6)",
        borderColor: "rgb(34, 197, 94)",
        borderWidth: 1,
      },
      {
        label: "Pending",
        data: dashboardData.monthlyLeaves.map((d) => d.pending),
        backgroundColor: "rgba(251, 191, 36, 0.6)",
        borderColor: "rgb(251, 191, 36)",
        borderWidth: 1,
      },
      {
        label: "Rejected",
        data: dashboardData.monthlyLeaves.map((d) => d.rejected),
        backgroundColor: "rgba(239, 68, 68, 0.6)",
        borderColor: "rgb(239, 68, 68)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: false,
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  /** ---------- UI STATES ---------- **/
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-dark-green-600 mx-auto rounded-full"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="mt-4 text-lg font-medium">Unable to load dashboard</h3>
          <p className="text-gray-500">{error}</p>
          <button onClick={fetchDashboardData} className="mt-4 px-4 py-2 bg-dark-green-600 text-white rounded">
            Retry
          </button>
        </div>
      </div>
    );
  }

  /** ---------- MAIN DASHBOARD RENDER ---------- **/
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName || "User"}! Here's what's happening today.</p>
        </div>
        <button
          onClick={() => navigate('/reports')}
          className="px-4 py-2 bg-dark-green-600 text-white rounded-lg hover:bg-dark-green-700 flex items-center gap-2"
        >
          <DocumentChartBarIcon className="h-5 w-5" />
          View Reports
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Staff */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold mt-2">{dashboardData.stats.totalStaff || 0}</p>
              <p className="text-green-600 text-sm">+{dashboardData.stats.recentHires || 0} this month</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Active Leaves */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Active Leaves</p>
              <p className="text-2xl font-bold mt-2">{dashboardData.stats.activeLeaves || 0}</p>
              <p className="text-yellow-600 text-sm">{dashboardData.stats.pendingLeaves || 0} pending</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Attendance */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Today's Attendance</p>
              <p className="text-2xl font-bold mt-2">
                {dashboardData.stats.todayPresent || 0}/{dashboardData.stats.totalStaff || 0}
              </p>
              <p className="text-red-600 text-sm">{dashboardData.stats.todayAbsent || 0} absent</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Report Stats */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Reports</p>
              <p className="text-2xl font-bold mt-2">{dashboardData.reportStats.totalReports ?? 0}</p>
              <p className="text-blue-600 text-sm">{dashboardData.reportStats.generatedToday ?? 0} generated today</p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS - REPORTS SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Attendance Report Card */}
          <div className="border rounded-lg p-4 hover:border-dark-green-500 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <DocumentChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium">Attendance Report</h4>
                <p className="text-sm text-gray-600">Last month's attendance</p>
              </div>
            </div>
            <button
              onClick={handleQuickAttendanceReport}
              disabled={downloadingReport === 'attendance'}
              className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {downloadingReport === 'attendance' ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Generating...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download Excel
                </>
              )}
            </button>
          </div>

          {/* Leave Report Card */}
          <div className="border rounded-lg p-4 hover:border-dark-green-500 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-medium">Leave Report</h4>
                <p className="text-sm text-gray-600">Approved leave records</p>
              </div>
            </div>
            <button
              onClick={handleQuickLeaveReport}
              disabled={downloadingReport === 'leave'}
              className="w-full mt-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {downloadingReport === 'leave' ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Generating...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download Excel
                </>
              )}
            </button>
          </div>

          {/* Reports Portal Card */}
          <div className="border rounded-lg p-4 hover:border-dark-green-500 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <DocumentArrowDownIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium">Reports Portal</h4>
                <p className="text-sm text-gray-600">All report types & history</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="w-full mt-2 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center justify-center gap-2"
            >
              <DocumentChartBarIcon className="h-4 w-4" />
              Go to Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;