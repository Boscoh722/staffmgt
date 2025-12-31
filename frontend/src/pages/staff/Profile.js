import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  PencilIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  MapPinIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const Profile = () => {
  useDocumentTitle('My Profile');
  const { user } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showQualificationModal, setShowQualificationModal] = useState(false);
  const [newQualification, setNewQualification] = useState({
    qualification: '',
    institution: '',
    yearObtained: '',
    specialization: '',
    certificateFile: null
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await staffService.getProfile(user._id);
      setProfile(response.data);
      setFormData({
        phoneNumber: response.data.phoneNumber || '',
        address: response.data.address || '',
        emergencyContact: response.data.emergencyContact || '',
        gender: response.data.gender || '',
        dateOfBirth: response.data.dateOfBirth || ''
      });
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await staffService.updateProfile(user._id, formData);
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleAddQualification = async () => {
    try {
      await staffService.addQualification(user._id, newQualification);
      toast.success('Qualification added successfully');
      setShowQualificationModal(false);
      setNewQualification({
        qualification: '',
        institution: '',
        yearObtained: '',
        specialization: '',
        certificateFile: null
      });
      fetchProfile();
    } catch (error) {
      toast.error('Failed to add qualification');
    }
  };

  const handleRemoveQualification = async (qualificationId) => {
    if (window.confirm('Are you sure you want to remove this qualification?')) {
      try {
        await staffService.removeQualification(user._id, qualificationId);
        toast.success('Qualification removed successfully');
        fetchProfile();
      } catch (error) {
        toast.error('Failed to remove qualification');
      }
    }
  };

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size should be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('profileImage', file);

      await staffService.uploadProfileImage(user._id, formData);
      toast.success('Profile image updated successfully');
      fetchProfile();
    } catch (error) {
      toast.error('Failed to upload profile image');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusColor = (isActive) => {
    return isActive
      ? 'bg-mustard-100 text-mustard-800 border-mustard-200 dark:bg-mustard-900/50 dark:text-mustard-300 dark:border-mustard-800'
      : 'bg-scarlet-100 text-scarlet-800 border-scarlet-200 dark:bg-scarlet-900/50 dark:text-scarlet-300 dark:border-scarlet-800';
  };

  const getStatusIcon = (isActive) => {
    return isActive
      ? <CheckCircleIcon className="h-5 w-5" />
      : <XCircleIcon className="h-5 w-5" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center">
            <UserCircleIcon className="h-6 w-6 mr-2 text-mustard-500" />
            My Profile
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            View and update your personal information
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-royal-600 dark:text-royal-400">
            <ClockIcon className="h-5 w-5 mr-2" />
            Last updated: {new Date().toLocaleDateString()}
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/30 dark:to-mustard-900/20 text-mustard-700 dark:text-mustard-300 rounded-xl text-sm font-medium hover:shadow-lg hover:from-mustard-100 hover:to-mustard-200/50 dark:hover:from-mustard-800/30 dark:hover:to-mustard-800/20 transition-all duration-200 border border-mustard-200 dark:border-mustard-800 flex items-center"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-all duration-200 flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card & Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="h-40 w-40 rounded-full bg-gradient-to-r from-mustard-100 to-scarlet-100 dark:from-mustard-900/30 dark:to-scarlet-900/30 flex items-center justify-center mb-6 overflow-hidden">
                  {profile?.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt="Profile"
                      className="h-40 w-40 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-40 w-40 rounded-full bg-gradient-to-r from-mustard-100 to-scarlet-100 dark:from-mustard-900/30 dark:to-scarlet-900/30 flex items-center justify-center">
                      <span className="text-4xl font-bold text-mustard-700 dark:text-mustard-300">
                        {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
                      </span>
                    </div>
                  )}
                  {editing && (
                    <label className="absolute inset-0 bg-black/50 dark:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        disabled={isUploading}
                      />
                      <div className="text-center">
                        <CameraIcon className="h-8 w-8 text-white mx-auto mb-2" />
                        <span className="text-white text-sm">
                          {isUploading ? 'Uploading...' : 'Change Photo'}
                        </span>
                      </div>
                    </label>
                  )}
                </div>

                <div className="text-center">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {profile?.firstName} {profile?.lastName}
                  </h2>
                  <p className="text-royal-600 dark:text-royal-400 mt-1">{profile?.position}</p>

                  <div className="mt-4 flex items-center justify-center">
                    <div className={`px-3 py-1.5 rounded-full flex items-center ${getStatusColor(profile?.isActive)}`}>
                      <div className="mr-2">
                        {getStatusIcon(profile?.isActive)}
                      </div>
                      <span className="text-sm font-medium">
                        {profile?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10 p-4 rounded-xl border border-royal-200 dark:border-royal-800 text-center">
                <div className="text-2xl font-bold text-royal-700 dark:text-royal-300">15</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Leaves Taken</div>
              </div>
              <div className="bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/20 dark:to-mustard-900/10 p-4 rounded-xl border border-mustard-200 dark:border-mustard-800 text-center">
                <div className="text-2xl font-bold text-mustard-700 dark:text-mustard-300">220</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Days Present</div>
              </div>
            </div>

            {/* Employee ID */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-neutral-50 to-neutral-100/50 dark:from-neutral-900/20 dark:to-neutral-900/10 border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center">
                <IdentificationIcon className="h-5 w-5 mr-2 text-neutral-500" />
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Employee ID</p>
                  <p className="font-medium text-neutral-900 dark:text-white">{profile?.employeeId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Supervisor Info */}
          {profile?.supervisor && (
            <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-royal-100 dark:border-royal-900/30">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2 text-royal-500" />
                Supervisor
              </h3>
              <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10 border border-royal-200 dark:border-royal-800">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-royal-100 to-royal-200 dark:from-royal-900/30 dark:to-royal-900/20 flex items-center justify-center mr-4">
                  <span className="text-lg font-medium text-royal-700 dark:text-royal-300">
                    {profile.supervisor.firstName.charAt(0)}{profile.supervisor.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-neutral-900 dark:text-white">
                    {profile.supervisor.firstName} {profile.supervisor.lastName}
                  </h4>
                  <p className="text-sm text-royal-600 dark:text-royal-400">{profile.supervisor.position}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-mustard-500" />
                Personal Information
              </h3>
              {editing && (
                <button
                  onClick={handleUpdateProfile}
                  className="px-4 py-2 bg-gradient-to-r from-mustard-500 to-mustard-600 text-white rounded-xl text-sm font-medium hover:from-mustard-600 hover:to-mustard-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Save Changes
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Email Address
                </label>
                <div className="p-3 rounded-xl bg-gradient-to-r from-neutral-50 to-neutral-100/50 dark:from-neutral-900/20 dark:to-neutral-900/10 border border-neutral-200 dark:border-neutral-800 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 mr-2 text-royal-500" />
                  <p className="text-neutral-900 dark:text-white">{profile?.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Phone Number
                </label>
                {editing ? (
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-royal-500" />
                    <input
                      type="tel"
                      value={formData.phoneNumber || ''}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white"
                      placeholder="Enter phone number"
                    />
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-neutral-50 to-neutral-100/50 dark:from-neutral-900/20 dark:to-neutral-900/10 border border-neutral-200 dark:border-neutral-800 flex items-center">
                    <PhoneIcon className="h-5 w-5 mr-2 text-royal-500" />
                    <p className="text-neutral-900 dark:text-white">
                      {profile?.phoneNumber || 'Not provided'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Date of Joining
                </label>
                <div className="p-3 rounded-xl bg-gradient-to-r from-neutral-50 to-neutral-100/50 dark:from-neutral-900/20 dark:to-neutral-900/10 border border-neutral-200 dark:border-neutral-800 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-royal-500" />
                  <p className="text-neutral-900 dark:text-white">
                    {formatDate(profile?.dateOfJoining)}
                  </p>
                </div>
              </div>

              {formData.dateOfBirth && (
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                    Date of Birth
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white"
                    />
                  ) : (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-neutral-50 to-neutral-100/50 dark:from-neutral-900/20 dark:to-neutral-900/10 border border-neutral-200 dark:border-neutral-800">
                      <p className="text-neutral-900 dark:text-white">
                        {formatDate(profile?.dateOfBirth)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Department
                </label>
                <div className="p-3 rounded-xl bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10 border border-royal-200 dark:border-royal-800 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 mr-2 text-royal-500" />
                  <p className="text-neutral-900 dark:text-white">{profile?.department?.name || profile?.department || 'Not assigned'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Position
                </label>
                <div className="p-3 rounded-xl bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/20 dark:to-mustard-900/10 border border-mustard-200 dark:border-mustard-800 flex items-center">
                  <BriefcaseIcon className="h-5 w-5 mr-2 text-mustard-500" />
                  <p className="text-neutral-900 dark:text-white">{profile?.position}</p>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Address
                </label>
                {editing ? (
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-royal-500" />
                    <textarea
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full pl-10 pr-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white"
                      placeholder="Enter your address"
                    />
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-neutral-50 to-neutral-100/50 dark:from-neutral-900/20 dark:to-neutral-900/10 border border-neutral-200 dark:border-neutral-800 flex items-start">
                    <MapPinIcon className="h-5 w-5 mr-2 text-royal-500 mt-0.5" />
                    <p className="text-neutral-900 dark:text-white">
                      {profile?.address || 'Not provided'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Qualifications */}
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-royal-100 dark:border-royal-900/30">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center">
                <AcademicCapIcon className="h-5 w-5 mr-2 text-royal-500" />
                Qualifications
              </h3>
              <button
                onClick={() => setShowQualificationModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/30 dark:to-royal-900/20 text-royal-700 dark:text-royal-300 rounded-xl text-sm font-medium hover:shadow-lg hover:from-royal-100 hover:to-royal-200/50 dark:hover:from-royal-800/30 dark:hover:to-royal-800/20 transition-all duration-200 border border-royal-200 dark:border-royal-800 flex items-center"
              >
                <PlusCircleIcon className="h-4 w-4 mr-2" />
                Add Qualification
              </button>
            </div>

            {profile?.qualifications && profile.qualifications.length > 0 ? (
              <div className="space-y-4">
                {profile.qualifications.map((qual, index) => (
                  <div key={index} className="p-4 rounded-xl bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10 border border-royal-200 dark:border-royal-800">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="font-medium text-neutral-900 dark:text-white">
                            {qual.qualification}
                          </h4>
                          {qual.specialization && (
                            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/20 dark:to-mustard-900/10 text-mustard-700 dark:text-mustard-300 border border-mustard-200 dark:border-mustard-800">
                              {qual.specialization}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          <span className="font-medium">{qual.institution}</span> • {qual.yearObtained}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {qual.certificateFile && (
                          <a
                            href={qual.certificateFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-royal-600 hover:text-royal-700 dark:text-royal-400 dark:hover:text-royal-300 hover:bg-royal-50 dark:hover:bg-royal-900/30 rounded-lg transition-colors duration-200"
                            title="View Certificate"
                          >
                            <DocumentTextIcon className="h-5 w-5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleRemoveQualification(qual._id)}
                          className="p-2 text-scarlet-600 hover:text-scarlet-700 dark:text-scarlet-400 dark:hover:text-scarlet-300 hover:bg-scarlet-50 dark:hover:bg-scarlet-900/30 rounded-lg transition-colors duration-200"
                          title="Remove Qualification"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AcademicCapIcon className="h-12 w-12 text-neutral-400 dark:text-neutral-500 mx-auto" />
                <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                  No qualifications added yet
                </p>
                <button
                  onClick={() => setShowQualificationModal(true)}
                  className="mt-3 px-4 py-2 bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/30 dark:to-royal-900/20 text-royal-700 dark:text-royal-300 rounded-xl text-sm font-medium hover:shadow-lg hover:from-royal-100 hover:to-royal-200/50 dark:hover:from-royal-800/30 dark:hover:to-royal-800/20 transition-all duration-200 border border-royal-200 dark:border-royal-800 flex items-center mx-auto"
                >
                  <PlusCircleIcon className="h-4 w-4 mr-2" />
                  Add Your First Qualification
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Qualification Modal */}
      {showQualificationModal && (
        <div className="fixed inset-0 bg-neutral-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto border border-mustard-100 dark:border-mustard-900/30 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center">
                <AcademicCapIcon className="h-6 w-6 mr-2 text-royal-500" />
                Add Qualification
              </h3>
              <button
                onClick={() => setShowQualificationModal(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Qualification *
                </label>
                <input
                  type="text"
                  value={newQualification.qualification}
                  onChange={(e) => setNewQualification({ ...newQualification, qualification: e.target.value })}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white"
                  placeholder="e.g., Bachelor of Science"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Institution *
                </label>
                <input
                  type="text"
                  value={newQualification.institution}
                  onChange={(e) => setNewQualification({ ...newQualification, institution: e.target.value })}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white"
                  placeholder="e.g., University of Nairobi"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                    Year Obtained *
                  </label>
                  <input
                    type="number"
                    value={newQualification.yearObtained}
                    onChange={(e) => setNewQualification({ ...newQualification, yearObtained: e.target.value })}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white"
                    placeholder="e.g., 2020"
                    min="1900"
                    max={new Date().getFullYear()}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={newQualification.specialization || ''}
                    onChange={(e) => setNewQualification({ ...newQualification, specialization: e.target.value })}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white"
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Certificate (Optional)
                </label>
                <input
                  type="file"
                  onChange={(e) => setNewQualification({ ...newQualification, certificateFile: e.target.files[0] })}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  Max file size: 5MB. Supported formats: PDF, JPG, PNG
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-mustard-100 dark:border-mustard-900/30 flex justify-end space-x-3">
              <button
                onClick={() => setShowQualificationModal(false)}
                className="px-4 py-2 border border-mustard-300 dark:border-mustard-700 rounded-xl text-sm font-medium text-mustard-700 dark:text-mustard-300 hover:bg-mustard-50 dark:hover:bg-mustard-900/30 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQualification}
                className="px-4 py-2 bg-gradient-to-r from-royal-500 to-royal-600 text-white rounded-xl text-sm font-medium hover:from-royal-600 hover:to-royal-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Add Qualification
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default Profile;