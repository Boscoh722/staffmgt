import React, { useState, useEffect } from 'react';
import { departmentService } from '../../services/departmentService';
import { staffService } from '../../services/staffService';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const DepartmentManagement = () => {
  useDocumentTitle('Department Management');
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedDept, setSelectedDept] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    manager: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    budgetCode: '',
    color: '#FFBF00'
  });

  useEffect(() => {
    fetchDepartments();
    fetchManagers();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getDepartments();
      setDepartments(response.data);
    } catch {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await staffService.getStaff();
      setManagers(response.data);
    } catch {
      toast.error('Failed to load managers');
    }
  };

  const handleCreateDepartment = async () => {
    try {
      await departmentService.createDepartment(formData);
      toast.success('Department created successfully');
      setShowAddModal(false);
      resetForm();
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create department');
    }
  };

  const handleUpdateDepartment = async () => {
    try {
      await departmentService.updateDepartment(selectedDept._id, formData);
      toast.success('Department updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update department');
    }
  };

  const handleDeleteDepartment = async () => {
    try {
      await departmentService.deleteDepartment(selectedDept._id);
      toast.success('Department deactivated successfully');
      setShowDeleteModal(false);
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to deactivate department');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      manager: '',
      location: '',
      contactEmail: '',
      contactPhone: '',
      budgetCode: '',
      color: '#FFBF00'
    });
    setSelectedDept(null);
  };

  const openEditModal = (dept) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      manager: dept.manager?._id || '',
      location: dept.location || '',
      contactEmail: dept.contactEmail || '',
      contactPhone: dept.contactPhone || '',
      budgetCode: dept.budgetCode || '',
      color: dept.color || '#FFBF00'
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <BuildingOfficeIcon className="w-7 h-7 text-mustard-600 dark:text-mustard-400" />
          Department Management
        </h1>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-mustard-500 to-mustard-600 hover:from-mustard-600 hover:to-mustard-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <PlusIcon className="w-5 h-5" />
          Add Department
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden border border-mustard-100 dark:border-mustard-900/30">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/30 dark:to-mustard-900/20">
            <tr>
              <th className="p-4 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Name</th>
              <th className="p-4 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Code</th>
              <th className="p-4 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Manager</th>
              <th className="p-4 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Color</th>
              <th className="p-4 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Status</th>
              <th className="p-4 text-right text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mustard-200 dark:divide-mustard-900/30">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-6 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mustard-600"></div>
                  </div>
                </td>
              </tr>
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                  No departments found
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept._id} className="hover:bg-mustard-50/50 dark:hover:bg-mustard-900/20 transition-colors duration-200">
                  <td className="p-4 text-neutral-900 dark:text-white font-medium">{dept.name}</td>
                  <td className="p-4 text-neutral-600 dark:text-neutral-400">{dept.code}</td>
                  <td className="p-4 text-neutral-600 dark:text-neutral-400">
                    {dept.manager
                      ? `${dept.manager.firstName} ${dept.manager.lastName}`
                      : '—'}
                  </td>
                  <td className="p-4">
                    <span
                      className="px-3 py-1 rounded-lg text-white text-xs font-medium shadow-sm"
                      style={{ backgroundColor: dept.color }}
                    >
                      {dept.color}
                    </span>
                  </td>
                  <td className="p-4">
                    {dept.isActive ? (
                      <span className="px-2 py-1 bg-mustard-100 text-mustard-800 dark:bg-mustard-900/50 dark:text-mustard-300 rounded-full text-xs font-semibold">Active</span>
                    ) : (
                      <span className="px-2 py-1 bg-scarlet-100 text-scarlet-800 dark:bg-scarlet-900/50 dark:text-scarlet-300 rounded-full text-xs font-semibold">Inactive</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        className="text-royal-600 hover:text-royal-700 dark:text-royal-400 dark:hover:text-royal-300 transition-colors duration-200"
                        onClick={() => openEditModal(dept)}
                        title="Edit"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>

                      <button
                        className="text-scarlet-600 hover:text-scarlet-700 dark:text-scarlet-400 dark:hover:text-scarlet-300 transition-colors duration-200"
                        onClick={() => {
                          setSelectedDept(dept);
                          setShowDeleteModal(true);
                        }}
                        title="Deactivate"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD/EDIT MODAL */}
      {showAddModal || showEditModal ? (
        <div className="fixed inset-0 bg-neutral-900/75 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm p-6 rounded-2xl w-full max-w-lg space-y-4 border border-mustard-100 dark:border-mustard-900/30 shadow-2xl">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              {showEditModal ? 'Edit Department' : 'Add Department'}
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Department Name *</label>
                <input
                  type="text"
                  placeholder="Department Name"
                  className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Code *</label>
                <input
                  type="text"
                  placeholder="Code (e.g., HR, FIN, ICT)"
                  className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>

              {/* Manager */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Manager</label>
                <select
                  className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                >
                  <option value="">Select Manager (Optional)</option>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Description</label>
                <textarea
                  placeholder="Department Description"
                  className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Color</label>
                <input
                  type="color"
                  className="h-12 w-24 border border-mustard-200 rounded-xl cursor-pointer dark:border-mustard-800"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="px-4 py-2 border border-mustard-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-mustard-50 dark:border-mustard-600 dark:text-neutral-300 dark:hover:bg-mustard-900/30 transition-all duration-200"
              >
                Cancel
              </button>

              <button
                onClick={showEditModal ? handleUpdateDepartment : handleCreateDepartment}
                className="px-4 py-2 bg-gradient-to-r from-mustard-500 to-mustard-600 text-white rounded-xl text-sm font-medium hover:from-mustard-600 hover:to-mustard-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {showEditModal ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-neutral-900/75 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm p-6 rounded-2xl w-full max-w-md space-y-4 border border-mustard-100 dark:border-mustard-900/30 shadow-2xl">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Deactivate Department</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Are you sure you want to deactivate{' '}
              <strong className="text-neutral-900 dark:text-white">{selectedDept?.name}</strong>?
            </p>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-mustard-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-mustard-50 dark:border-mustard-600 dark:text-neutral-300 dark:hover:bg-mustard-900/30 transition-all duration-200"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteDepartment}
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

export default DepartmentManagement;
