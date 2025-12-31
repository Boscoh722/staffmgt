import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import {
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const StaffOverview = () => {
  useDocumentTitle('Staff Overview');
  const { user } = useSelector((state) => state.auth);
  const [staff, setStaff] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchSupervisedStaff();
  }, []);

  const fetchSupervisedStaff = async () => {
    try {
      setLoading(true);
      const response = await staffService.getStaff();
      const supervisedStaff = response.data.filter(s =>
        s.supervisor?._id === user._id || s.supervisor === user._id
      );
      setStaff(supervisedStaff);
      
      // Fetch today's attendance for all supervised staff
      await fetchTodayAttendance(supervisedStaff);
    } catch (error) {
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async (staffList) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const staffIds = staffList.map(s => s._id);
      
      const response = await staffService.getAttendance({ date: today });
      const attendance = Array.isArray(response.data) ? response.data : [];
      
      // Create a map of staffId -> attendance status
      const map = {};
      attendance.forEach(record => {
        const staffId = record.staff?._id || record.staff;
        if (staffIds.includes(staffId)) {
          map[staffId] = record.status;
        }
      });
      
      // Set default status for staff without attendance records
      staffIds.forEach(id => {
        if (!map[id]) {
          map[id] = 'absent';
        }
      });
      
      setAttendanceMap(map);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      // Set all to absent on error
      const map = {};
      staff.forEach(s => {
        map[s._id] = 'absent';
      });
      setAttendanceMap(map);
    }
  };

  const getAttendanceStatus = (staffId) => {
    return attendanceMap[staffId] || 'absent';
  };

  const getStatusColor = (status) => {
    return status === 'present'
      ? 'bg-mustard-100 text-mustard-800 dark:bg-mustard-900/50 dark:text-mustard-300'
      : 'bg-scarlet-100 text-scarlet-800 dark:bg-scarlet-900/50 dark:text-scarlet-300';
  };

  const getStatusIcon = (status) => {
    return status === 'present'
      ? <CheckCircleIcon className="h-5 w-5" />
      : <XCircleIcon className="h-5 w-5" />;
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Team Overview</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage staff under your supervision ({staff.length} members)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-royal-600 dark:text-royal-400">
            Last updated: {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-royal-100 dark:border-royal-900/30 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-royal-100 dark:bg-royal-900/50 mr-4">
              <UserGroupIcon className="h-6 w-6 text-royal-600 dark:text-royal-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Team</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{staff.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-mustard-100 dark:bg-mustard-900/50 mr-4">
              <CheckCircleIcon className="h-6 w-6 text-mustard-600 dark:text-mustard-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Present Today</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {staff.filter(s => {
                  const status = getAttendanceStatus(s._id);
                  return status === 'present' || status === 'on-duty';
                }).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-royal-100 dark:border-royal-900/30 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-royal-100 dark:bg-royal-900/50 mr-4">
              <CalendarIcon className="h-6 w-6 text-royal-600 dark:text-royal-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">On Leave</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {staff.filter(s => {
                  const status = getAttendanceStatus(s._id);
                  return status === 'leave' || status === 'on-leave';
                }).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-scarlet-100 dark:border-scarlet-900/30 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-scarlet-100 dark:bg-scarlet-900/50 mr-4">
              <XCircleIcon className="h-6 w-6 text-scarlet-600 dark:text-scarlet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Absent Today</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {staff.filter(s => getAttendanceStatus(s._id) === 'absent').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => {
          const attendanceStatus = getAttendanceStatus(member._id);

          return (
            <div key={member._id} className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-r from-mustard-100 to-scarlet-100 dark:from-mustard-900/30 dark:to-scarlet-900/30 flex items-center justify-center mr-4">
                    <span className="text-lg font-medium text-mustard-700 dark:text-mustard-300">
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="text-sm text-royal-600 dark:text-royal-400">{member.position}</p>
                  </div>
                </div>
                <div className={`p-2 rounded-xl ${getStatusColor(attendanceStatus)}`}>
                  {getStatusIcon(attendanceStatus)}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                  <EnvelopeIcon className="h-4 w-4 mr-2 text-royal-500" />
                  {member.email}
                </div>
                {member.phoneNumber && (
                  <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                    <PhoneIcon className="h-4 w-4 mr-2 text-royal-500" />
                    {member.phoneNumber}
                  </div>
                )}
                <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                  <IdentificationIcon className="h-4 w-4 mr-2 text-mustard-500" />
                  Employee ID: {member.employeeId}
                </div>
                {member.department && (
                  <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                    <BriefcaseIcon className="h-4 w-4 mr-2 text-scarlet-500" />
                    {member.department}
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedStaff(member);
                    setShowDetails(true);
                  }}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/30 dark:to-mustard-900/20 text-mustard-700 dark:text-mustard-300 rounded-xl text-sm font-medium hover:shadow-lg hover:from-mustard-100 hover:to-mustard-200/50 dark:hover:from-mustard-800/30 dark:hover:to-mustard-800/20 transition-all duration-200 flex items-center justify-center border border-mustard-200 dark:border-mustard-800"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View Details
                </button>
                <button className="flex-1 px-3 py-2 bg-gradient-to-r from-royal-500 to-royal-600 text-white rounded-xl text-sm font-medium hover:from-royal-600 hover:to-royal-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Message
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Staff Details Modal */}
      {showDetails && selectedStaff && (
        <div className="fixed inset-0 bg-neutral-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-2xl p-6 max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto border border-mustard-100 dark:border-mustard-900/30 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                Staff Details
              </h3>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedStaff(null);
                }}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="flex items-start">
                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-mustard-100 to-scarlet-100 dark:from-mustard-900/30 dark:to-scarlet-900/30 flex items-center justify-center mr-6">
                  <span className="text-2xl font-medium text-mustard-700 dark:text-mustard-300">
                    {selectedStaff.firstName.charAt(0)}{selectedStaff.lastName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {selectedStaff.firstName} {selectedStaff.lastName}
                  </h4>
                  <p className="text-royal-600 dark:text-royal-400">{selectedStaff.position}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10 p-3 rounded-xl">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Employee ID</p>
                      <p className="font-medium text-royal-700 dark:text-royal-300">{selectedStaff.employeeId}</p>
                    </div>
                    <div className="bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/20 dark:to-mustard-900/10 p-3 rounded-xl">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Department</p>
                      <p className="font-medium text-mustard-700 dark:text-mustard-300">{selectedStaff.department}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10 p-6 rounded-xl border border-royal-200 dark:border-royal-800">
                <h5 className="font-medium text-neutral-900 dark:text-white mb-4 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 mr-2 text-royal-500" />
                  Contact Information
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Email</p>
                    <p className="font-medium text-royal-700 dark:text-royal-300">{selectedStaff.email}</p>
                  </div>
                  {selectedStaff.phoneNumber && (
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Phone</p>
                      <p className="font-medium text-royal-700 dark:text-royal-300">{selectedStaff.phoneNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Date Joined</p>
                    <p className="font-medium text-mustard-700 dark:text-mustard-300 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {new Date(selectedStaff.dateOfJoining).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Status</p>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${selectedStaff.isActive
                      ? 'bg-gradient-to-r from-mustard-100 to-mustard-200 text-mustard-800 dark:from-mustard-900/50 dark:to-mustard-800/50 dark:text-mustard-300'
                      : 'bg-gradient-to-r from-scarlet-100 to-scarlet-200 text-scarlet-800 dark:from-scarlet-900/50 dark:to-scarlet-800/50 dark:text-scarlet-300'
                      }`}>
                      {selectedStaff.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Qualifications */}
              {selectedStaff.qualifications && selectedStaff.qualifications.length > 0 && (
                <div className="bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/20 dark:to-mustard-900/10 p-6 rounded-xl border border-mustard-200 dark:border-mustard-800">
                  <h5 className="font-medium text-neutral-900 dark:text-white mb-4 flex items-center">
                    <AcademicCapIcon className="h-5 w-5 mr-2 text-mustard-500" />
                    Qualifications
                  </h5>
                  <div className="space-y-3">
                    {selectedStaff.qualifications.map((qual, index) => (
                      <div key={index} className="bg-white/50 dark:bg-neutral-900/30 p-4 rounded-xl">
                        <p className="font-medium text-neutral-900 dark:text-white">{qual.qualification}</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          {qual.institution} • {qual.yearObtained}
                        </p>
                        {qual.specialization && (
                          <p className="text-xs text-royal-600 dark:text-royal-400 mt-1">
                            Specialization: {qual.specialization}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="grid grid-cols-2 gap-4">
                {selectedStaff.dateOfBirth && (
                  <div className="bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10 p-4 rounded-xl">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Date of Birth</p>
                    <p className="font-medium text-royal-700 dark:text-royal-300">
                      {new Date(selectedStaff.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedStaff.gender && (
                  <div className="bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/20 dark:to-mustard-900/10 p-4 rounded-xl">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Gender</p>
                    <p className="font-medium text-mustard-700 dark:text-mustard-300">{selectedStaff.gender}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-mustard-100 dark:border-mustard-900/30 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedStaff(null);
                }}
                className="px-4 py-2 border border-mustard-300 dark:border-mustard-700 rounded-xl text-sm font-medium text-mustard-700 dark:text-mustard-300 hover:bg-mustard-50 dark:hover:bg-mustard-900/30 transition-all duration-200"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-royal-500 to-royal-600 text-white rounded-xl text-sm font-medium hover:from-royal-600 hover:to-royal-700 shadow-lg hover:shadow-xl transition-all duration-200">
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default StaffOverview;