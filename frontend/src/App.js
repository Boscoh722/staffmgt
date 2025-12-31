import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';
import store from './store/store';


// Layout
import Layout from './components/layout/Layout';
import ReportsPage from './pages/admin/ReportsPage';
// Auth
import Login from './pages/auth/Login';

// Admin Pages
import Dashboard from './pages/dashboard/Dashboard';
import StaffManagement from './pages/admin/StaffManagement';
import LeaveManagement from './pages/admin/LeaveManagement';
import AttendanceTracking from './pages/admin/AttendanceTracking';
import DisciplinaryManagement from './pages/admin/DisciplinaryManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';



// Supervisor Pages
import SupervisorDashboard from './pages/supervisor/Dashboard';
import SupervisorLeaves from './pages/supervisor/Leaves';
import SupervisorStaff from './pages/supervisor/SupervisorStaff';
import SupervisorAttendance from './pages/supervisor/SupervisorAttendance';
import SendNotices from './pages/supervisor/SendNotices';
import LeaveApproval from './pages/supervisor/LeaveApproval';

// Staff Pages
import StaffDashboard from './pages/staff/Dashboard';
import Profile from './pages/staff/Profile';
import ApplyLeave from './pages/staff/ApplyLeave';
import MyAttendance from './pages/staff/MyAttendance';
import DisciplinaryAppeal from './pages/staff/DisciplinaryAppeal';

// Clerk Pages 
import ClerkDashboard from './pages/clerk/Dashboard';
import MarkAttendance from './pages/clerk/MarkAttendance';
import ClerkViewStaff from './pages/clerk/ClerkViewStaff';
import ClerkProcessLeave from './pages/clerk/ClerkProcessLeave';
import ClerkGenerateReports from './pages/clerk/ClerkGenerateReports';

// Shared
import PrivateRoute from './components/auth/PrivateRoute';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Toaster position="top-right" />

          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/reports" element={
  <PrivateRoute allowedRoles={['admin', 'supervisor', 'clerk']}>
    <ReportsPage />
  </PrivateRoute>
} />

            {/* Admin */}
            <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']} />}>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="staff" element={<StaffManagement />} />
                <Route path="leaves" element={<LeaveManagement />} />
                <Route path="attendance" element={<AttendanceTracking />} />
                <Route path="disciplinary" element={<DisciplinaryManagement />} />
                <Route path="departments" element={<DepartmentManagement />} />
                <Route path="reports" element={<ReportsPage />} />  
               
              </Route>
            </Route>

            {/* Supervisor */}
            <Route path="/supervisor" element={<PrivateRoute allowedRoles={['supervisor']} />}>
              <Route element={<Layout />}>
                <Route index element={<SupervisorDashboard />} />
                <Route path="staff" element={<SupervisorStaff />} />
                <Route path="leaves" element={<SupervisorLeaves />} />
                <Route path="attendance" element={<SupervisorAttendance />} />
                <Route path="notices" element={<SendNotices />} />
                <Route path="leave-approval/:id" element={<LeaveApproval />} />
              </Route>
            </Route>

            {/* Staff */}
            <Route path="/staff" element={<PrivateRoute allowedRoles={['staff']} />}>
              <Route element={<Layout />}>
                <Route index element={<StaffDashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="apply-leave" element={<ApplyLeave />} />
                <Route path="attendance" element={<MyAttendance />} />
                <Route path="disciplinary-appeal" element={<DisciplinaryAppeal />} />
              </Route>
            </Route>

            {/* Clerk */}
            <Route path="/clerk" element={<PrivateRoute allowedRoles={['clerk']} />}>
              <Route element={<Layout />}>
                <Route index element={<ClerkDashboard />} />
                <Route path="attendance" element={<MarkAttendance />} />
                <Route path="viewstaff" element={<ClerkViewStaff />} />
                <Route path="processleave" element={<ClerkProcessLeave />} />
                <Route path="generatereports" element={<ClerkGenerateReports />} />
              </Route>
            </Route>

            Redirects
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
