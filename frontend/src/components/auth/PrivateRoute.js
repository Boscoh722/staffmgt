import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ allowedRoles, roles }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [checking, setChecking] = useState(true);
  
  // Handle both prop names
  const authorizedRoles = allowedRoles || roles;
  
  useEffect(() => {
    console.log('🔐 PrivateRoute Check:');
    console.log('   Path:', window.location.pathname);
    console.log('   Redux Auth:', isAuthenticated);
    console.log('   User Role:', user?.role);
    console.log('   Authorized Roles:', authorizedRoles);
    console.log('   localStorage Token:', localStorage.getItem('token') ? 'YES' : 'NO');
    
    // Sync Redux with localStorage on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser && !isAuthenticated) {
      console.log('   ⚠️ Token in storage but Redux says not authenticated');
    }
    
    setChecking(false);
  }, [isAuthenticated, user, authorizedRoles]);

  if (checking) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  // Check authentication using localStorage as fallback
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  if (!token || !storedUser) {
    console.log('❌ No token or user in localStorage, redirecting to login');
    return <Navigate to="/login" />;
  }

  // Parse user from localStorage
  let parsedUser;
  try {
    parsedUser = JSON.parse(storedUser);
  } catch (error) {
    console.error('Failed to parse user from localStorage:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }

  // Check role
  if (authorizedRoles && !authorizedRoles.includes(parsedUser.role)) {
    console.log(`⛔ Role not allowed. User: ${parsedUser.role}, Allowed: ${authorizedRoles}`);
    
    // Redirect based on role
    switch(parsedUser.role) {
      case 'admin':
        return <Navigate to="/admin" />;
      case 'supervisor':
        return <Navigate to="/supervisor" />;
      case 'clerk':
        return <Navigate to="/clerk" />;
      case 'staff':
        return <Navigate to="/staff" />;
      default:
        return <Navigate to="/login" />;
    }
  }

  console.log('✅ Access granted to', window.location.pathname);
  return <Outlet />;
};

export default PrivateRoute;