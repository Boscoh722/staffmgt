import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  IdentificationIcon,
  BriefcaseIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const SupervisorStaff = () => {
  useDocumentTitle('Team Management');
  const { user } = useSelector((state) => state.auth);
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    status: '',
    role: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await staffService.getSupervisedStaff();

      // Supervisor oversees all non-admin staff
      const allStaff = response.data.filter(employee =>
        employee.role !== 'admin' && employee.role !== 'supervisor'
      );

      setStaff(allStaff);
      setFilteredStaff(allStaff);

    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...staff];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(employee =>
        employee.firstName?.toLowerCase().includes(searchLower) ||
        employee.lastName?.toLowerCase().includes(searchLower) ||
        employee.employeeId?.toLowerCase().includes(searchLower) ||
        employee.email?.toLowerCase().includes(searchLower)
      );
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter(employee =>
        employee.department === filters.department ||
        employee.department?.name === filters.department
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(employee =>
        (filters.status === 'active' && employee.isActive) ||
        (filters.status === 'inactive' && !employee.isActive)
      );
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(employee => employee.role === filters.role);
    }

    setFilteredStaff(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, staff]);

  const getUniqueDepartments = () => {
    const departments = new Set();
    staff.forEach(employee => {
      if (employee.department) {
        if (typeof employee.department === 'object') {
          departments.add(employee.department.name);
        } else {
          departments.add(employee.department);
        }
      }
    });
    return Array.from(departments);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'clerk':
        return 'bg-gradient-to-r from-scarlet-100 to-scarlet-200 text-scarlet-800 dark:from-scarlet-900/50 dark:to-scarlet-800/50 dark:text-scarlet-300';
      case 'staff':
        return 'bg-gradient-to-r from-royal-100 to-royal-200 text-royal-800 dark:from-royal-900/50 dark:to-royal-800/50 dark:text-royal-300';
      default:
        return 'bg-gradient-to-r from-mustard-100 to-mustard-200 text-mustard-800 dark:from-mustard-900/50 dark:to-mustard-800/50 dark:text-mustard-300';
    }
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`px-3 py-1.5 text-xs rounded-full flex items-center w-fit font-medium ${isActive
        ? 'bg-gradient-to-r from-mustard-100 to-mustard-200 text-mustard-800 dark:from-mustard-900/50 dark:to-mustard-800/50 dark:text-mustard-300'
        : 'bg-gradient-to-r from-scarlet-100 to-scarlet-200 text-scarlet-800 dark:from-scarlet-900/50 dark:to-scarlet-800/50 dark:text-scarlet-300'
        }`}>
        {isActive ? (
          <>
            <CheckCircleIcon className="h-3 w-3 mr-1.5" />
            Active
          </>
        ) : (
          <>
            <XCircleIcon className="h-3 w-3 mr-1.5" />
            Inactive
          </>
        )}
      </span>
    );
  };

  const handleRefresh = async () => {
    await fetchStaff();
    toast.success('Staff list refreshed');
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-mustard-500 via-scarlet-500 to-royal-500 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Team Management</h1>
            <p className="mt-2 opacity-90">
              Manage all staff members under your supervision including clerks
            </p>
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <span className="flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-2" />
                {staff.length} total staff members
              </span>
              <span className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Updated: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <UserGroupIcon className="h-12 w-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Search Staff
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-mustard-200 dark:border-mustard-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-500 focus:border-transparent bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white placeholder-royal-400 dark:placeholder-royal-500 transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                placeholder="Name, ID, or email..."
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-mustard-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-4 py-2.5 border border-mustard-200 dark:border-mustard-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-500 focus:border-transparent bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
            >
              <option value="">All Departments</option>
              {getUniqueDepartments().map(dept => (
                <option key={dept} value={dept}>{dept}</option>
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
              className="w-full px-4 py-2.5 border border-mustard-200 dark:border-mustard-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-500 focus:border-transparent bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full px-4 py-2.5 border border-mustard-200 dark:border-mustard-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-500 focus:border-transparent bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
            >
              <option value="">All Roles</option>
              <option value="staff">Staff</option>
              <option value="clerk">Clerk</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center pt-4 border-t border-mustard-100 dark:border-mustard-900/30">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Showing <span className="font-semibold text-mustard-600 dark:text-mustard-400">{filteredStaff.length}</span> of <span className="font-semibold text-royal-600 dark:text-royal-400">{staff.length}</span> staff members
          </div>
          <button
            onClick={() => setFilters({ search: '', department: '', status: '', role: '' })}
            className="text-sm text-scarlet-600 hover:text-scarlet-700 dark:text-scarlet-400 dark:hover:text-scarlet-300 flex items-center px-3 py-1.5 rounded-lg hover:bg-scarlet-50 dark:hover:bg-scarlet-900/30 transition-all duration-200"
          >
            <FunnelIcon className="h-4 w-4 mr-1.5" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/50 dark:bg-neutral-900/50 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard-600 mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading staff data...</p>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-12 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-mustard-100 dark:border-mustard-900/30">
          <UserGroupIcon className="h-16 w-16 text-mustard-400 dark:text-mustard-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            No Staff Members Found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Try adjusting your filters or check back later
          </p>
          <button
            onClick={() => setFilters({ search: '', department: '', status: '', role: '' })}
            className="px-4 py-2 bg-gradient-to-r from-mustard-500 to-mustard-600 text-white rounded-xl text-sm font-medium hover:from-mustard-600 hover:to-mustard-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStaff.map((employee) => (
            <div key={employee._id} className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 border border-mustard-100 dark:border-mustard-900/30 overflow-hidden">
              {/* Employee Header */}
              <div className="p-6 border-b border-mustard-100 dark:border-mustard-900/30">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-mustard-100 to-scarlet-100 dark:from-mustard-900/30 dark:to-scarlet-900/30 flex items-center justify-center">
                    {employee.profileImage ? (
                      <img
                        src={employee.profileImage}
                        alt={`${employee.firstName} ${employee.lastName}`}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-medium text-mustard-700 dark:text-mustard-300">
                        {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-neutral-900 dark:text-white truncate">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-royal-600 dark:text-royal-400 truncate">
                      {employee.position}
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      {getStatusBadge(employee.isActive)}
                      <span className={`px-3 py-1.5 text-xs rounded-full ${getRoleBadgeColor(employee.role)}`}>
                        {employee.role?.charAt(0).toUpperCase() + employee.role?.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Details */}
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 text-royal-500 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Department</p>
                      <p className="text-neutral-900 dark:text-white truncate">
                        {employee.department?.name || employee.department || 'No department'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <EnvelopeIcon className="h-4 w-4 text-royal-500 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Email</p>
                      <p className="text-neutral-900 dark:text-white truncate">
                        {employee.email}
                      </p>
                    </div>
                  </div>

                  {employee.phoneNumber && (
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 text-royal-500 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Phone</p>
                        <p className="text-neutral-900 dark:text-white truncate">
                          {employee.phoneNumber}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 text-royal-500 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Joined</p>
                      <p className="text-neutral-900 dark:text-white">
                        {employee.dateOfJoining
                          ? new Date(employee.dateOfJoining).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Employee ID */}
                <div className="mt-6 pt-4 border-t border-mustard-100 dark:border-mustard-900/30">
                  <div className="flex items-center">
                    <IdentificationIcon className="h-4 w-4 text-mustard-500 mr-2" />
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Employee ID</p>
                      <p className="font-mono font-medium text-mustard-700 dark:text-mustard-300">
                        {employee.employeeId}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Team Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10 rounded-xl border border-royal-200 dark:border-royal-800 hover:shadow-lg transition-all duration-200">
            <div className="text-3xl font-bold text-royal-600 dark:text-royal-400">
              {staff.filter(s => s.isActive).length}
            </div>
            <div className="text-sm text-royal-700 dark:text-royal-300 mt-2">Active Staff</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-r from-scarlet-50 to-scarlet-100/50 dark:from-scarlet-900/20 dark:to-scarlet-900/10 rounded-xl border border-scarlet-200 dark:border-scarlet-800 hover:shadow-lg transition-all duration-200">
            <div className="text-3xl font-bold text-scarlet-600 dark:text-scarlet-400">
              {staff.filter(s => s.role === 'clerk').length}
            </div>
            <div className="text-sm text-scarlet-700 dark:text-scarlet-300 mt-2">Clerks</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/20 dark:to-mustard-900/10 rounded-xl border border-mustard-200 dark:border-mustard-800 hover:shadow-lg transition-all duration-200">
            <div className="text-3xl font-bold text-mustard-600 dark:text-mustard-400">
              {staff.filter(s => s.role === 'staff').length}
            </div>
            <div className="text-sm text-mustard-700 dark:text-mustard-300 mt-2">Regular Staff</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-r from-neutral-50 to-neutral-100/50 dark:from-neutral-900/20 dark:to-neutral-900/10 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:shadow-lg transition-all duration-200">
            <div className="text-3xl font-bold text-neutral-600 dark:text-neutral-400">
              {getUniqueDepartments().length}
            </div>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 mt-2">Departments</div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default SupervisorStaff;