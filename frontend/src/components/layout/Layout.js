import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BellIcon,
  CogIcon,
  ArrowLeftStartOnRectangleIcon,
  UserCircleIcon,
  ChevronDownIcon,
  ShieldExclamationIcon,
  BuildingOfficeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getNavigation = () => {
    const baseNav = [
      { name: 'Dashboard', href: `/${user?.role}`, icon: HomeIcon, color: 'text-mustard-500' },
    ];

    if (user?.role === 'admin') {
      return [
        ...baseNav,
        { name: 'Staff Management', href: '/admin/staff', icon: UserGroupIcon, color: 'text-royal-500' },
        { name: 'Leave Management', href: '/admin/leaves', icon: CalendarIcon, color: 'text-mustard-500' },
        { name: 'Attendance', href: '/admin/attendance', icon: ChartBarIcon, color: 'text-scarlet-500' },
        { name: 'Disciplinary', href: '/admin/disciplinary', icon: ShieldExclamationIcon, color: 'text-purple-500' },
        { name: 'Reports', href: '/admin/reports', icon: DocumentTextIcon, color: 'text-green-500' },
      ];
    }

    if (user?.role === 'supervisor') {
      return [
        ...baseNav,
        { name: 'Staff Overview', href: '/supervisor/staff', icon: UserGroupIcon, color: 'text-royal-500' },
        { name: 'Mark Attendance', href: '/supervisor/attendance', icon: ChartBarIcon, color: 'text-mustard-500' },
        { name: 'Leave Approval', href: '/supervisor/leaves', icon: CalendarIcon, color: 'text-scarlet-500' }
      ];
    }

    if (user?.role === 'staff') {
      return [
        ...baseNav,
        { name: 'Profile', href: '/staff/profile', icon: UserCircleIcon, color: 'text-royal-500' },
        { name: 'Apply Leave', href: '/staff/apply-leave', icon: CalendarIcon, color: 'text-mustard-500' },
        { name: 'My Attendance', href: '/staff/attendance', icon: ChartBarIcon, color: 'text-scarlet-500' },
        { name: 'Appeals', href: '/staff/disciplinary-appeal', icon: ShieldExclamationIcon, color: 'text-purple-500' },
      ];
    }

    if (user?.role === 'clerk') {
      return [
        ...baseNav,
        { name: 'Mark Attendance', href: '/clerk/attendance', icon: ChartBarIcon, color: 'text-mustard-500' },
        { name: 'View Staff', href: '/clerk/viewstaff', icon: UserGroupIcon, color: 'text-royal-500' },
      ];
    }

    return baseNav;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'from-royal-500 to-royal-600',
      supervisor: 'from-mustard-500 to-mustard-600',
      staff: 'from-scarlet-500 to-scarlet-600',
      clerk: 'from-green-500 to-green-600'
    };
    return colors[role] || 'from-neutral-500 to-neutral-600';
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'Admin',
      supervisor: 'Supervisor',
      staff: 'Staff',
      clerk: 'Clerk'
    };
    return badges[role] || role;
  };

  const navigation = getNavigation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 font-sans">

      <nav className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm shadow-lg border-b border-mustard-200 dark:border-mustard-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-mustard-100 to-scarlet-100 dark:from-mustard-900/30 dark:to-scarlet-900/30 flex items-center justify-center mr-3">
                    <BuildingOfficeIcon className="h-6 w-6 text-mustard-600 dark:text-mustard-400" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-neutral-900 dark:text-white">Makongeni Ward</h1>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Staff Management System</p>
                  </div>
                </div>
              </div>

              <div className="hidden md:block ml-10">
                <div className="flex items-center space-x-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center ${
                          isActive
                            ? `bg-gradient-to-r ${item.color.replace('text-', 'from-').replace('-500', '-100')} ${item.color.replace('text-', 'to-').replace('-500', '-100/50')} dark:${item.color.replace('text-', 'from-').replace('-500', '-900/30')} dark:${item.color.replace('text-', 'to-').replace('-500', '-900/20')} ${item.color}`
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-gradient-to-r hover:from-neutral-50 hover:to-neutral-100/50 dark:hover:from-neutral-900/30 dark:hover:to-neutral-900/20'
                        }`}
                      >
                        <item.icon className={`h-4 w-4 mr-2 ${isActive ? item.color : 'text-neutral-500 dark:text-neutral-400'}`} />
                        {item.name}
                        {isActive && <div className="ml-2 h-1.5 w-1.5 rounded-full bg-current" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-xl bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/30 dark:to-royal-900/20 text-royal-700 dark:text-royal-300 border border-royal-200 dark:border-royal-800 relative">
                <BellIcon className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-scarlet-500 rounded-full border-2 border-white dark:border-neutral-800"></span>
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-xl bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/30 dark:to-mustard-900/20 border border-mustard-200 dark:border-mustard-800"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-mustard-100 to-scarlet-100 dark:from-mustard-900/30 dark:to-scarlet-900/30 flex items-center justify-center">
                    <span className="text-sm font-medium text-mustard-700 dark:text-mustard-300">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {getRoleBadge(user?.role)}
                    </p>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-2xl shadow-xl border border-mustard-100 dark:border-mustard-900/30 overflow-hidden z-[9999]">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-mustard-100 to-scarlet-100 dark:from-mustard-900/30 dark:to-scarlet-900/30 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-mustard-700 dark:text-mustard-300">
                            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            {user?.employeeId}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <Link
                        to="/staff/profile"
                        className="flex items-center px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-gradient-to-r hover:from-mustard-50 hover:to-mustard-100/50 dark:hover:from-mustard-900/20 dark:hover:to-mustard-900/10 rounded-lg"
                      >
                        <UserCircleIcon className="h-4 w-4 mr-2 text-royal-500" />
                        View Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-gradient-to-r hover:from-royal-50 hover:to-royal-100/50 dark:hover:from-royal-900/20 dark:hover:to-royal-900/10 rounded-lg"
                      >
                        <CogIcon className="h-4 w-4 mr-2 text-royal-500" />
                        Settings
                      </Link>
                    </div>

                    <div className="p-2 border-t border-neutral-200 dark:border-neutral-700">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-3 py-2 text-sm bg-gradient-to-r from-scarlet-50 to-scarlet-100/50 dark:from-scarlet-900/30 dark:to-scarlet-900/20 text-scarlet-700 dark:text-scarlet-300 rounded-lg border border-scarlet-200 dark:border-scarlet-800"
                      >
                        <ArrowLeftStartOnRectangleIcon className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-gradient-to-r from-neutral-50 to-neutral-100/50 dark:from-neutral-900/30 dark:to-neutral-900/20 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-lg text-base font-medium ${
                      isActive
                        ? `bg-gradient-to-r ${item.color.replace('text-', 'from-').replace('-500', '-100')} ${item.color.replace('text-', 'to-').replace('-500', '-100/50')} dark:${item.color.replace('text-', 'from-').replace('-500', '-900/30')} dark:${item.color.replace('text-', 'to-').replace('-500', '-900/20')} ${item.color}`
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-gradient-to-r hover:from-neutral-50 hover:to-neutral-100/50 dark:hover:from-neutral-900/30 dark:hover:to-neutral-900/20'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 mr-3 ${isActive ? item.color : 'text-neutral-500 dark:text-neutral-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="mt-8 border-t border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">

            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-mustard-100 to-scarlet-100 dark:from-mustard-900/30 dark:to-scarlet-900/30 flex items-center justify-center mr-3">
                <BuildingOfficeIcon className="h-4 w-4 text-mustard-600 dark:text-mustard-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-900 dark:text-white">Makongeni Ward Staff Management System</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  © {new Date().getFullYear()} | Version 1.0.0
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <a
                href="https://makongeniwelfare.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-royal-600 hover:text-royal-700 dark:text-royal-400 dark:hover:text-royal-300 flex items-center"
              >
                Staff Welfare Portal
                <svg className="ml-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                <ClockIcon className="h-4 w-4 mr-2" />
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>

              <div className="flex items-center">
                <div className={`px-2 py-1 text-xs rounded-full bg-gradient-to-r ${getRoleColor(user?.role)} text-white`}>
                  {getRoleBadge(user?.role)}
                </div>
              </div>

            </div>

          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
