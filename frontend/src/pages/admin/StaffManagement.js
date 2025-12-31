import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import { departmentService } from '../../services/departmentService';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const StaffManagement = () => {
  const { user } = useSelector((s) => s.auth || {});
  useDocumentTitle('Staff Management');
  
  // State declarations - ADDED error state here
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [supervisors, setSupervisors] = useState([]); // ADDED supervisors state
  const [loading, setLoading] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [error, setError] = useState(null); // ADDED error state

  const [filters, setFilters] = useState({
    search: '',
    department: '',
    status: '',
    dateOfJoining: ''
  });

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeId: '',
    department: '',
    position: '',
    phoneNumber: '',
    dateOfJoining: new Date()
  });

  // Fixed useEffect - combined into one
  useEffect(() => {
    fetchStaff();
    fetchDepartments();
    fetchSupervisors(); // Call fetchSupervisors here
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    setError(null); // Reset error before fetching
    try {
      const res = await staffService.getStaff();
      setStaff(res.data || []);
    } catch (err) {
      setError('Failed to fetch staff');
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const res = await staffService.getSupervisors();
      setSupervisors(res.data || []);
    } catch (err) {
      setError('Failed to load supervisors');
      console.error('Error loading supervisors:', err);
    }
  };

  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const res = await departmentService.getDepartments();
      setDepartments(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch departments');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const filteredStaff = staff.filter((employee = {}) => {
    const searchLower = (filters.search || '').toLowerCase();
    const first = (employee.firstName || '').toLowerCase();
    const last = (employee.lastName || '').toLowerCase();
    const empId = (employee.employeeId || '').toLowerCase();
    const email = (employee.email || '').toLowerCase();

    const matchesSearch =
      !searchLower ||
      first.includes(searchLower) ||
      last.includes(searchLower) ||
      empId.includes(searchLower) ||
      email.includes(searchLower);

    const employeeDeptId = employee.department
      ? typeof employee.department === 'string'
        ? employee.department
        : employee.department._id || employee.department.id
      : '';

    const matchesDepartment = !filters.department || employeeDeptId === filters.department;

    const matchesStatus =
      !filters.status ||
      (filters.status === 'active' ? employee.isActive === true : employee.isActive === false);

    const matchesJoiningDate =
      !filters.dateOfJoining ||
      (employee.dateOfJoining && new Date(employee.dateOfJoining) >= new Date(filters.dateOfJoining));

    return matchesSearch && matchesDepartment && matchesStatus && matchesJoiningDate;
  });

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setError(null); // Reset error
    try {
      await staffService.createStaff(formData);
      toast.success('Staff member added successfully');
      setShowAddModal(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to add staff member';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    setError(null); // Reset error
    try {
      await staffService.updateStaff(selectedStaff._id, formData);
      toast.success('Staff member updated successfully');
      setShowEditModal(false);
      setSelectedStaff(null);
      resetForm();
      fetchStaff();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to update staff member';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDeleteStaff = async () => {
    setError(null); // Reset error
    try {
      await staffService.deleteStaff(selectedStaff._id);
      toast.success('Staff member deactivated successfully');
      setShowDeleteModal(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (error) {
      setError('Failed to deactivate staff member');
      toast.error('Failed to deactivate staff member');
    }
  };

  const handleActivateStaff = async (staffId) => {
    setError(null); // Reset error
    try {
      await staffService.activateStaff(staffId);
      toast.success('Staff member activated successfully');
      fetchStaff();
    } catch (error) {
      setError('Failed to activate staff member');
      toast.error('Failed to activate staff member');
    }
  };

  const handleAssignSupervisor = async (staffId, supervisorId) => {
    setError(null); // Reset error
    try {
      await staffService.assignSupervisor(staffId, supervisorId || null);
      toast.success('Supervisor assigned successfully');
      fetchStaff();
    } catch (err) {
      setError('Failed to assign supervisor');
      toast.error('Failed to assign supervisor');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      employeeId: '',
      department: '',
      position: '',
      phoneNumber: '',
      dateOfJoining: new Date()
    });
  };

  const openEditModal = (employee) => {
    setSelectedStaff(employee);
    setFormData({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      employeeId: employee.employeeId || '',
      department: typeof employee.department === 'string' ? employee.department : employee.department?._id || '',
      position: employee.position || '',
      phoneNumber: employee.phoneNumber || '',
      dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining) : new Date()
    });
    setShowEditModal(true);
  };

  const handleExport = () => {
    toast('Export functionality will be implemented');
  };

  const handleImport = () => {
    toast('Import functionality will be implemented');
  };

  if (loading) {
    return <div className="p-6">Loading staff...</div>;
  }

  // ADDED: Error display section
  if (error && !loading) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-lg font-medium text-red-800">Error</h3>
          <p className="text-red-700 mt-1">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchStaff();
            }}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Staff Management</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Manage all staff members in the system</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleImport}
            className="px-4 py-2 border border-mustard-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-mustard-50 dark:border-mustard-600 dark:text-neutral-300 dark:hover:bg-mustard-900/30 flex items-center transition-all duration-200"
          >
            <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
            Import
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2 border border-mustard-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-mustard-50 dark:border-mustard-600 dark:text-neutral-300 dark:hover:bg-mustard-900/30 flex items-center transition-all duration-200"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-mustard-500 to-mustard-600 text-white rounded-xl text-sm font-medium hover:from-mustard-600 hover:to-mustard-700 flex items-center shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Error Alert - ADDED */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Search</label>
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

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Joined After</label>
            <DatePicker
              selected={filters.dateOfJoining ? new Date(filters.dateOfJoining) : null}
              onChange={(date) => setFilters({ ...filters, dateOfJoining: date ? date.toISOString() : '' })}
              className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
              placeholderText="Select date"
              isClearable
            />
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Showing {filteredStaff.length} of {staff.length} staff members
          </div>
          <button
            onClick={() => setFilters({ search: '', department: '', status: '', dateOfJoining: '' })}
            className="text-sm text-mustard-600 hover:text-mustard-700 dark:text-mustard-400 transition-colors duration-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-mustard-100 dark:border-mustard-900/30">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-mustard-200 dark:divide-mustard-900/30">
              <thead className="bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/30 dark:to-mustard-900/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">ID & Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Actions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Supervisor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mustard-200 dark:divide-mustard-900/30">
                {filteredStaff.map((employee = {}) => (
                  <tr key={employee._id} className="hover:bg-mustard-50/50 dark:hover:bg-mustard-900/20 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-mustard-100 to-royal-100 dark:from-mustard-900/50 dark:to-royal-900/50 flex items-center justify-center">
                            <span className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
                              {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">{employee.position}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900 dark:text-white">{employee.employeeId}</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">{employee.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                      {employee.department?.name || employee.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.isActive
                        ? 'bg-mustard-100 text-mustard-800 dark:bg-mustard-900/50 dark:text-mustard-300'
                        : 'bg-scarlet-100 text-scarlet-800 dark:bg-scarlet-900/50 dark:text-scarlet-300'
                        }`}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                      {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(employee)}
                          className="text-royal-600 hover:text-royal-700 dark:text-royal-400 dark:hover:text-royal-300 transition-colors duration-200"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        {employee.isActive ? (
                          <button
                            onClick={() => {
                              setSelectedStaff(employee);
                              setShowDeleteModal(true);
                            }}
                            className="text-scarlet-600 hover:text-scarlet-700 dark:text-scarlet-400 dark:hover:text-scarlet-300 transition-colors duration-200"
                            title="Deactivate"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateStaff(employee._id)}
                            className="text-mustard-600 hover:text-mustard-700 dark:text-mustard-400 dark:hover:text-mustard-300 transition-colors duration-200"
                            title="Activate"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={employee.supervisor?._id || ''}
                        onChange={(e) => handleAssignSupervisor(employee._id, e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-mustard-200 rounded-lg focus:ring-1 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white"
                      >
                        <option value="">No Supervisor</option>
                        {supervisors.map((supervisor) => (
                          <option key={supervisor._id} value={supervisor._id}>
                            {supervisor.firstName} {supervisor.lastName}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-mustard-100 dark:border-mustard-900/30 shadow-2xl">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Add New Staff Member</h3>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Department *</label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                    disabled={loadingDepartments}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Position *</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Date of Joining</label>
                  <DatePicker
                    selected={formData.dateOfJoining}
                    onChange={(date) => setFormData({ ...formData, dateOfJoining: date })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-mustard-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-mustard-50 dark:border-mustard-600 dark:text-neutral-300 dark:hover:bg-mustard-900/30 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-mustard-500 to-mustard-600 text-white rounded-xl text-sm font-medium hover:from-mustard-600 hover:to-mustard-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-neutral-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-mustard-100 dark:border-mustard-900/30 shadow-2xl">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Edit Staff Member</h3>
            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Department *</label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                    disabled={loadingDepartments}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Position *</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Date of Joining</label>
                  <DatePicker
                    selected={formData.dateOfJoining}
                    onChange={(date) => setFormData({ ...formData, dateOfJoining: date })}
                    className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedStaff(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-mustard-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-mustard-50 dark:border-mustard-600 dark:text-neutral-300 dark:hover:bg-mustard-900/30 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-royal-500 to-royal-600 text-white rounded-xl text-sm font-medium hover:from-royal-600 hover:to-royal-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Update Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStaff && (
        <div className="fixed inset-0 bg-neutral-900/75 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full mx-4 border border-mustard-100 dark:border-mustard-900/30 shadow-2xl">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Deactivate Staff Member</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Are you sure you want to deactivate {selectedStaff.firstName} {selectedStaff.lastName}? They will no longer be able to access the system.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedStaff(null);
                }}
                className="px-4 py-2 border border-mustard-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-mustard-50 dark:border-mustard-600 dark:text-neutral-300 dark:hover:bg-mustard-900/30 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStaff}
                className="px-4 py-2 bg-gradient-to-r from-scarlet-500 to-scarlet-600 text-white rounded-xl text-sm font-medium hover:from-scarlet-600 hover:to-scarlet-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;