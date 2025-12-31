import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import toast from 'react-hot-toast';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const ClerkViewStaff = () => {
  const { user } = useSelector((state) => state.auth);
  useDocumentTitle('View Staff');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await staffService.getStaff();
      setStaff(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(employee => {
    const searchLower = search.toLowerCase();
    return (
      employee.firstName?.toLowerCase().includes(searchLower) ||
      employee.lastName?.toLowerCase().includes(searchLower) ||
      employee.employeeId?.toLowerCase().includes(searchLower) ||
      employee.department?.name?.toLowerCase().includes(searchLower) ||
      employee.position?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">View Staff</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          View all staff members and their details
        </p>
      </div>

      {/* Search */}
      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700 placeholder-royal-400 dark:placeholder-royal-500"
            placeholder="Search staff by name, ID, department, or position..."
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400 absolute left-3 top-3.5" />
        </div>
        <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          Showing {filteredStaff.length} of {staff.length} staff members
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((employee) => (
            <div key={employee._id} className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
              <div className="flex items-start space-x-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-mustard-100 to-royal-100 dark:from-mustard-900/50 dark:to-royal-900/50 flex items-center justify-center flex-shrink-0">
                  {employee.profileImage ? (
                    <img src={employee.profileImage} alt="" className="h-16 w-16 rounded-full" />
                  ) : (
                    <span className="text-2xl font-medium text-neutral-700 dark:text-neutral-300">
                      {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{employee.position}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{employee.employeeId}</p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                      <BuildingOfficeIcon className="h-4 w-4 mr-2 text-royal-600 dark:text-royal-400" />
                      {employee.department?.name || employee.department || 'No department'}
                    </div>
                    <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400 truncate">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-mustard-600 dark:text-mustard-400 flex-shrink-0" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    {employee.phoneNumber && (
                      <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                        <PhoneIcon className="h-4 w-4 mr-2 text-scarlet-600 dark:text-scarlet-400" />
                        {employee.phoneNumber}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${employee.isActive
                    ? 'bg-mustard-100 text-mustard-800 dark:bg-mustard-900/50 dark:text-mustard-300'
                    : 'bg-scarlet-100 text-scarlet-800 dark:bg-scarlet-900/50 dark:text-scarlet-300'
                    }`}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredStaff.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-mustard-100 dark:border-mustard-900/30">
          <UsersIcon className="h-16 w-16 text-neutral-400 mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">No staff members found</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default ClerkViewStaff;
