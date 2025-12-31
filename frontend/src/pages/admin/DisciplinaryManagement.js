import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import {
  ExclamationTriangleIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import useDocumentTitle from '../../hooks/useDocumentTitle';

const DisciplinaryManagement = () => {
  const { user } = useSelector((state) => state.auth);
  useDocumentTitle('Disciplinary Management');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    infractionType: '',
    startDate: '',
    endDate: ''
  });
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [newCase, setNewCase] = useState({
    staffId: '',
    description: '',
    infractionType: 'minor',
    dateOfInfraction: new Date(),
    reportedBy: user?._id || '',
    status: 'open'
  });

  useEffect(() => {
    fetchCases();
    fetchStaff();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await staffService.getDisciplinaryCases();
      setCases(response.data || response || []);
    } catch (error) {
      toast.error('Failed to fetch disciplinary cases');
      console.error('Fetch cases error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await staffService.getStaff();
      
      let staffData = [];
      
      if (Array.isArray(response)) {
        staffData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        staffData = response.data;
      } else if (response && Array.isArray(response.staff)) {
        staffData = response.staff;
      } else if (response && Array.isArray(response.users)) {
        staffData = response.users;
      } else {
        staffData = [];
      }
      
      const normalizedStaff = staffData.map(staff => {
        if (staff && typeof staff === 'object') {
          if (staff.name && !staff.firstName) {
            const nameParts = staff.name.split(' ');
            return {
              _id: staff._id || staff.id,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              employeeId: staff.code || staff.employeeId || 'N/A',
              department: staff.department || 'N/A',
              position: staff.position || 'N/A',
              original: staff
            };
          }
          return {
            _id: staff._id || staff.id,
            firstName: staff.firstName || '',
            lastName: staff.lastName || '',
            employeeId: staff.employeeId || staff.code || 'N/A',
            department: staff.department || 'N/A',
            position: staff.position || 'N/A',
            original: staff
          };
        }
        return {
          _id: 'unknown',
          firstName: 'Unknown',
          lastName: '',
          employeeId: 'N/A',
          department: 'N/A',
          position: 'N/A',
          original: staff
        };
      });
      
      setStaffList(normalizedStaff);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      toast.error('Failed to load staff list');
      setStaffList([]);
    }
  };

  const handleResolveCase = async (caseId) => {
    try {
      await staffService.updateCaseStatus(caseId, { status: 'resolved' });
      toast.success('Case marked as resolved');
      fetchCases();
    } catch (error) {
      toast.error('Failed to update case');
      console.error('Resolve case error:', error);
    }
  };

  const handleCreateCase = async () => {
  if (!newCase.staffId) {
    toast.error('Please select a staff member');
    return;
  }
  if (!newCase.description.trim()) {
    toast.error('Please enter a description');
    return;
  }

  try {
    setLoading(true);
    
    // Create case data matching the schema
    const caseData = {
      staff: newCase.staffId, // Changed from staffId to staff
      description: newCase.description,
      infractionType: newCase.infractionType,
      dateOfInfraction: newCase.dateOfInfraction.toISOString(),
      reportedBy: newCase.reportedBy,
      status: newCase.status
      // Remove evidence field as it's not in schema
      // evidence field is replaced by documents array
    };

    // If evidence is provided, add it to documents array
    if (newCase.evidence && newCase.evidence.trim()) {
      caseData.documents = [newCase.evidence];
    }

    console.log('Creating case with data:', JSON.stringify(caseData, null, 2));

    const response = await staffService.createCase(caseData);
    console.log('Create case response:', response);
    
    toast.success('Disciplinary case created successfully');
    setShowAddModal(false);
    resetNewCaseForm();
    fetchCases();
  } catch (error) {
    console.error('Create case error:', error);
    console.error('Error response:', error.response);
    console.error('Error data:', error.response?.data);
    
    const errorMessage = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message || 
                       'Failed to create disciplinary case';
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  const resetNewCaseForm = () => {
    setNewCase({
      staffId: '',
      description: '',
      infractionType: 'minor',
      dateOfInfraction: new Date(),
      reportedBy: user?._id || '',
      status: 'open'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-scarlet-100 text-scarlet-800 dark:bg-scarlet-900/50 dark:text-scarlet-300';
      case 'under-review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'resolved': return 'bg-mustard-100 text-mustard-800 dark:bg-mustard-900/50 dark:text-mustard-300';
      case 'appealed': return 'bg-royal-100 text-royal-800 dark:bg-royal-900/50 dark:text-royal-300';
      default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-300';
    }
  };

  const getInfractionColor = (type) => {
    switch (type) {
      case 'minor': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'major': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
      case 'severe': return 'bg-scarlet-100 text-scarlet-800 dark:bg-scarlet-900/50 dark:text-scarlet-300';
      default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-300';
    }
  };

  const filteredCases = cases.filter(caseItem => {
    const searchLower = filters.search.toLowerCase();
    const staffName = caseItem.staff 
      ? `${caseItem.staff.firstName || ''} ${caseItem.staff.lastName || ''}`.toLowerCase()
      : '';
    const staffId = caseItem.staff?.employeeId?.toLowerCase() || '';
    const description = caseItem.description?.toLowerCase() || '';
    
    const matchesSearch = staffName.includes(searchLower) || 
                         staffId.includes(searchLower) || 
                         description.includes(searchLower);

    const matchesStatus = !filters.status || caseItem.status === filters.status;
    const matchesInfraction = !filters.infractionType || caseItem.infractionType === filters.infractionType;

    const matchesDate = (!filters.startDate || new Date(caseItem.dateOfInfraction) >= new Date(filters.startDate)) &&
      (!filters.endDate || new Date(caseItem.dateOfInfraction) <= new Date(filters.endDate));

    return matchesSearch && matchesStatus && matchesInfraction && matchesDate;
  });

  const infractionTypes = ['minor', 'major', 'severe'];
  const statuses = ['open', 'under-review', 'resolved', 'appealed'];

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Disciplinary Management</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage staff disciplinary cases and sanctions
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-scarlet-500 to-scarlet-600 text-white rounded-xl text-sm font-medium hover:from-scarlet-600 hover:to-scarlet-700 flex items-center shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            New Case
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-scarlet-100 dark:border-scarlet-900/30">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-scarlet-100 dark:bg-scarlet-900/50 mr-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-scarlet-600 dark:text-scarlet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Open Cases</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {cases.filter(c => c.status === 'open').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-yellow-100 dark:border-yellow-900/30">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/50 mr-4">
              <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Under Review</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {cases.filter(c => c.status === 'under-review').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-mustard-100 dark:bg-mustard-900/50 mr-4">
              <CheckCircleIcon className="h-6 w-6 text-mustard-600 dark:text-mustard-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Resolved</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {cases.filter(c => c.status === 'resolved').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-royal-100 dark:border-royal-900/30">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-royal-100 dark:bg-royal-900/50 mr-4">
              <DocumentTextIcon className="h-6 w-6 text-royal-600 dark:text-royal-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Cases</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {cases.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-3 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700 placeholder-royal-400 dark:placeholder-royal-500"
                placeholder="Search cases..."
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Infraction Type
            </label>
            <select
              value={filters.infractionType}
              onChange={(e) => setFilters({ ...filters, infractionType: e.target.value })}
              className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
            >
              <option value="">All Types</option>
              {infractionTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              From Date
            </label>
            <DatePicker
              selected={filters.startDate ? new Date(filters.startDate) : null}
              onChange={(date) => setFilters({ ...filters, startDate: date ? date.toISOString() : '' })}
              className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
              placeholderText="Select date"
              isClearable
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              To Date
            </label>
            <DatePicker
              selected={filters.endDate ? new Date(filters.endDate) : null}
              onChange={(date) => setFilters({ ...filters, endDate: date ? date.toISOString() : '' })}
              className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700"
              placeholderText="Select date"
              isClearable
            />
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Showing {filteredCases.length} of {cases.length} disciplinary cases
          </div>
          <button
            onClick={() => setFilters({ search: '', status: '', infractionType: '', startDate: '', endDate: '' })}
            className="text-sm text-mustard-600 hover:text-mustard-700 dark:text-mustard-400 transition-colors duration-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-mustard-100 dark:border-mustard-900/30">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-mustard-200 dark:divide-mustard-900/30">
              <thead className="bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/30 dark:to-mustard-900/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Case Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Infraction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mustard-200 dark:divide-mustard-900/30">
                {filteredCases.map((caseItem) => (
                  <tr key={caseItem._id} className="hover:bg-mustard-50/50 dark:hover:bg-mustard-900/20 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">
                        {caseItem.description?.substring(0, 60)}...
                      </div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        Reported by: {caseItem.reportedBy?.firstName || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-mustard-100 to-royal-100 dark:from-mustard-900/50 dark:to-royal-900/50 flex items-center justify-center">
                            <span className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
                              {caseItem.staff?.firstName?.charAt(0) || '?'}{caseItem.staff?.lastName?.charAt(0) || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {caseItem.staff?.firstName || 'Unknown'} {caseItem.staff?.lastName || ''}
                          </div>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            {caseItem.staff?.employeeId || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getInfractionColor(caseItem.infractionType)}`}>
                        {caseItem.infractionType?.toUpperCase() || 'UNKNOWN'}
                      </span>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        {caseItem.sanction || 'No sanction'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(caseItem.status)}`}>
                        {caseItem.status?.replace('-', ' ').toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-300">
                      {caseItem.dateOfInfraction ? new Date(caseItem.dateOfInfraction).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCase(caseItem);
                            setShowDetailsModal(true);
                          }}
                          className="text-royal-600 hover:text-royal-700 dark:text-royal-400 dark:hover:text-royal-300 transition-colors duration-200"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCase(caseItem);
                          }}
                          className="text-mustard-600 hover:text-mustard-700 dark:text-mustard-400 dark:hover:text-mustard-300 transition-colors duration-200"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        {caseItem.status !== 'resolved' && (
                          <button
                            onClick={() => handleResolveCase(caseItem._id)}
                            className="text-mustard-600 hover:text-mustard-700 dark:text-mustard-400 dark:hover:text-mustard-300 transition-colors duration-200"
                            title="Mark Resolved"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDetailsModal && selectedCase && (
        <div className="fixed inset-0 bg-neutral-900/75 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-mustard-100 dark:border-mustard-900/30 shadow-2xl">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
              Disciplinary Case Details
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/30 dark:to-mustard-900/20 p-4 rounded-xl border border-mustard-200 dark:border-mustard-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Case Information</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Case ID</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{selectedCase._id?.substring(0, 8)}...</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Status</p>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCase.status)}`}>
                        {selectedCase.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Infraction Type</p>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getInfractionColor(selectedCase.infractionType)}`}>
                        {selectedCase.infractionType?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/30 dark:to-royal-900/20 p-4 rounded-xl border border-royal-200 dark:border-royal-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Dates</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Date of Infraction</p>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {selectedCase.dateOfInfraction ? new Date(selectedCase.dateOfInfraction).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Reported On</p>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {selectedCase.createdAt ? new Date(selectedCase.createdAt).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    {selectedCase.sanctionDate && (
                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Sanction Date</p>
                        <p className="font-medium text-neutral-900 dark:text-white">
                          {new Date(selectedCase.sanctionDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Staff Information</h4>
                <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-mustard-100 to-royal-100 dark:from-mustard-900/50 dark:to-royal-900/50 flex items-center justify-center mr-4">
                      <span className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
                        {selectedCase.staff?.firstName?.charAt(0) || '?'}{selectedCase.staff?.lastName?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {selectedCase.staff?.firstName || 'Unknown'} {selectedCase.staff?.lastName || ''}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {selectedCase.staff?.employeeId || 'N/A'} • {selectedCase.staff?.department || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Description</h4>
                <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl">
                  <p className="text-neutral-700 dark:text-neutral-300">{selectedCase.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Sanctions</h4>
                  <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl">
                    {selectedCase.sanction ? (
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{selectedCase.sanction}</p>
                        {selectedCase.sanctionDetails && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            {selectedCase.sanctionDetails}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-neutral-500 dark:text-neutral-400">No sanctions applied yet</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Remedial Measures</h4>
                  <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl">
                    {selectedCase.remedialMeasures ? (
                      <p className="text-neutral-700 dark:text-neutral-300">{selectedCase.remedialMeasures}</p>
                    ) : (
                      <p className="text-neutral-500 dark:text-neutral-400">No remedial measures specified</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedCase.staffResponse && (
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Staff Response</h4>
                  <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl">
                    <p className="text-neutral-700 dark:text-neutral-300">{selectedCase.staffResponse}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                      Submitted on: {selectedCase.responseDate ? new Date(selectedCase.responseDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {selectedCase.appeal?.hasAppealed && (
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Appeal Information</h4>
                  <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl">
                    <p className="text-neutral-700 dark:text-neutral-300">{selectedCase.appeal.appealDetails}</p>
                    <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                      <p>Appealed on: {selectedCase.appeal.appealDate ? new Date(selectedCase.appeal.appealDate).toLocaleDateString() : 'N/A'}</p>
                      {selectedCase.appeal.appealDecision && (
                        <p>Decision: {selectedCase.appeal.appealDecision}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedCase(null);
                }}
                className="px-4 py-2 border border-mustard-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-mustard-50 dark:border-mustard-600 dark:text-neutral-300 dark:hover:bg-mustard-900/30 transition-all duration-200"
              >
                Close
              </button>
              {selectedCase.status !== 'resolved' && (
                <button
                  onClick={() => {
                    handleResolveCase(selectedCase._id);
                    setShowDetailsModal(false);
                    setSelectedCase(null);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-mustard-500 to-mustard-600 text-white rounded-xl text-sm font-medium hover:from-mustard-600 hover:to-mustard-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Mark as Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-2xl p-6 max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto border border-mustard-100 dark:border-mustard-900/30 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                Create New Disciplinary Case
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetNewCaseForm();
                }}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Select Staff Member *
                </label>
                <select
                  value={newCase.staffId}
                  onChange={(e) => setNewCase({ ...newCase, staffId: e.target.value })}
                  className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200"
                  required
                >
                  <option value="">Select a staff member</option>
                  {staffList.length > 0 ? (
                    staffList.map(staff => {
                      if (!staff || typeof staff !== 'object' || !staff._id) {
                          return null;
                      }
                      
                      let displayName = 'Unknown';
                      if (staff.firstName && staff.lastName) {
                        displayName = `${staff.firstName} ${staff.lastName}`;
                      } else if (staff.original?.name) {
                        displayName = staff.original.name;
                      } else if (staff.original?.code) {
                        displayName = `Staff ${staff.original.code}`;
                      }
                      
                      const employeeId = staff.employeeId || staff.original?.code || 'N/A';
                      const department = staff.department || staff.original?.department || 'N/A';
                      
                      const optionContent = `${displayName} (${employeeId}) - ${department}`;
                      
                      return (
                        <option key={staff._id} value={staff._id}>
                          {optionContent}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>No staff members available</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Infraction Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {infractionTypes.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewCase({ ...newCase, infractionType: type })}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                        newCase.infractionType === type
                          ? type === 'minor'
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                            : type === 'major'
                            ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                            : 'border-scarlet-500 bg-scarlet-50 text-scarlet-700 dark:bg-scarlet-900/50 dark:text-scarlet-300'
                          : 'border-neutral-200 text-neutral-700 hover:border-mustard-300 dark:border-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Date of Infraction *
                </label>
                <DatePicker
                  selected={newCase.dateOfInfraction}
                  onChange={(date) => setNewCase({ ...newCase, dateOfInfraction: date })}
                  className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200"
                  maxDate={new Date()}
                  dateFormat="MMMM d, yyyy"
                  showPopperArrow={false}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 resize-none"
                  placeholder="Provide detailed description of the infraction..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Evidence/Supporting Notes
                </label>
                <textarea
                  value={newCase.documents?.[0] || ''}
                  onChange={(e) => setNewCase({ 
                    ...newCase, 
                    documents: e.target.value ? [e.target.value] : [] 
                  })}
                  rows={3}
                  className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200 resize-none"
                  placeholder="Any supporting documents, witness statements, or additional notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Initial Status
                </label>
                <select
                  value={newCase.status}
                  onChange={(e) => setNewCase({ ...newCase, status: e.target.value })}
                  className="w-full px-4 py-3 border border-mustard-200 rounded-xl focus:ring-2 focus:ring-mustard-500 focus:border-transparent dark:bg-neutral-900/70 dark:border-mustard-800 dark:text-white transition-all duration-200"
                >
                  <option value="open">Open</option>
                  <option value="under-review">Under Review</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetNewCaseForm();
                }}
                className="px-4 py-2 border border-mustard-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-mustard-50 dark:border-mustard-600 dark:text-neutral-300 dark:hover:bg-mustard-900/30 transition-all duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCase}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-scarlet-500 to-scarlet-600 text-white rounded-xl text-sm font-medium hover:from-scarlet-600 hover:to-scarlet-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Case'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisciplinaryManagement;