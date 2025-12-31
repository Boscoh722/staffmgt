import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import {
  CalendarIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  InformationCircleIcon,
  DocumentArrowUpIcon,
  ChevronRightIcon,
  PlusIcon,
  MinusIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const ApplyLeave = () => {
  useDocumentTitle('Apply Leave');
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'annual',
    startDate: new Date(),
    endDate: new Date(),
    reason: '',
    supportingDocuments: []
  });
  const [leaveBalance, setLeaveBalance] = useState({});
  const [myLeaves, setMyLeaves] = useState([]);

  useEffect(() => {
    fetchLeaveBalance();
    fetchMyLeaves();
  }, []);

  const fetchLeaveBalance = async () => {
    try {
      const response = await staffService.getLeaveStats(user._id);
      setLeaveBalance(response.data);
    } catch (error) {
      console.error('Failed to fetch leave balance:', error);
    }
  };

  const fetchMyLeaves = async () => {
    try {
      const response = await staffService.getMyLeaves();
      setMyLeaves(response.data);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    }
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const diffTime = Math.abs(formData.endDate - formData.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Inclusive of both days
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (calculateDays() <= 0) {
      toast.error('End date must be after start date');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Please provide a reason for leave');
      return;
    }

    setLoading(true);
    try {
      const leaveData = {
        ...formData,
        numberOfDays: calculateDays(),
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString()
      };

      await staffService.applyLeave(leaveData);
      toast.success('Leave application submitted successfully');

      // Reset form
      setFormData({
        leaveType: 'annual',
        startDate: new Date(),
        endDate: new Date(),
        reason: '',
        supportingDocuments: []
      });

      // Refresh data
      fetchMyLeaves();
      fetchLeaveBalance();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit leave application');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: 'text-mustard-600 dark:text-mustard-400 bg-mustard-100 dark:bg-mustard-900/50 border-mustard-200 dark:border-mustard-800',
      rejected: 'text-scarlet-600 dark:text-scarlet-400 bg-scarlet-100 dark:bg-scarlet-900/50 border-scarlet-200 dark:border-scarlet-800',
      pending: 'text-royal-600 dark:text-royal-400 bg-royal-100 dark:bg-royal-900/50 border-royal-200 dark:border-royal-800',
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="h-5 w-5" />;
      case 'rejected': return <XCircleIcon className="h-5 w-5" />;
      case 'pending': return <ClockIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave', description: 'Regular vacation leave', color: 'from-mustard-50 to-mustard-100/50', border: 'border-mustard-200' },
    { value: 'sick', label: 'Sick Leave', description: 'Medical leave with certificate', color: 'from-scarlet-50 to-scarlet-100/50', border: 'border-scarlet-200' },
    { value: 'maternity', label: 'Maternity Leave', description: 'For expecting mothers', color: 'from-royal-50 to-royal-100/50', border: 'border-royal-200' },
    { value: 'paternity', label: 'Paternity Leave', description: 'For new fathers', color: 'from-royal-50 to-royal-100/50', border: 'border-royal-200' },
    { value: 'compassionate', label: 'Compassionate Leave', description: 'Bereavement leave', color: 'from-neutral-50 to-neutral-100/50', border: 'border-neutral-200' },
    { value: 'study', label: 'Study Leave', description: 'For educational purposes', color: 'from-royal-50 to-royal-100/50', border: 'border-royal-200' }
  ];

  const getLeaveTypeColor = (type) => {
    const typeConfig = leaveTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.color : 'from-neutral-50 to-neutral-100/50';
  };

  const getLeaveTypeBorder = (type) => {
    const typeConfig = leaveTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.border : 'border-neutral-200';
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Apply for Leave</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Submit a leave application for approval
          </p>
        </div>
        <div className="flex items-center text-sm text-royal-600 dark:text-royal-400">
          <CalendarIcon className="h-5 w-5 mr-2" />
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Leave Balance */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-mustard-500" />
              Leave Balance
            </h3>

            <div className="space-y-4">
              {leaveTypes.map((type) => (
                <div key={type.value}
                  className={`p-4 rounded-xl border dark:border-neutral-700/50 ${type.color} dark:${type.color.replace('50', '900/30').replace('100/50', '900/20')}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{type.label}</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        {type.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-mustard-700 dark:text-mustard-300">
                        {leaveBalance[type.value]?.remaining || 0}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        of {leaveBalance[type.value]?.total || 0} days
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${type.color.split(' ')[0]} ${type.color.split(' ')[1]}`}
                        style={{ width: `${Math.min(((leaveBalance[type.value]?.remaining || 0) / (leaveBalance[type.value]?.total || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/30 dark:to-royal-900/20 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-royal-200 dark:border-royal-800">
            <h4 className="font-medium text-neutral-900 dark:text-white mb-4 flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-2 text-royal-500" />
              Important Notes
            </h4>
            <ul className="text-sm text-neutral-700 dark:text-neutral-300 space-y-2">
              <li className="flex items-start">
                <ExclamationCircleIcon className="h-4 w-4 mr-2 text-mustard-500 mt-0.5" />
                <span>Apply for leave at least 3 days in advance</span>
              </li>
              <li className="flex items-start">
                <ExclamationCircleIcon className="h-4 w-4 mr-2 text-scarlet-500 mt-0.5" />
                <span>Sick leave requires medical certificate</span>
              </li>
              <li className="flex items-start">
                <ExclamationCircleIcon className="h-4 w-4 mr-2 text-royal-500 mt-0.5" />
                <span>Maternity leave: 90 days maximum</span>
              </li>
              <li className="flex items-start">
                <ExclamationCircleIcon className="h-4 w-4 mr-2 text-royal-500 mt-0.5" />
                <span>Study leave: Proof of enrollment required</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column - Application Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
              <PaperAirplaneIcon className="h-5 w-5 mr-2 text-mustard-500" />
              Leave Application Form
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Leave Type */}
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4">
                    Select Leave Type *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {leaveTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, leaveType: type.value })}
                        className={`p-4 rounded-xl text-left transition-all duration-200 border-2 ${formData.leaveType === type.value
                          ? `${type.color} dark:${type.color.replace('50', '900/30').replace('100/50', '900/20')} border-mustard-300 dark:border-mustard-700 shadow-lg scale-[1.02]`
                          : `bg-white/50 dark:bg-neutral-900/50 ${type.border} dark:border-neutral-700 hover:shadow-md hover:scale-[1.01]`
                          }`}
                      >
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${type.color.split(' ')[0]} ${type.color.split(' ')[1]} mr-3`}>
                            <CalendarIcon className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900 dark:text-white">
                              {type.label}
                            </div>
                            <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                              {type.description}
                            </div>
                          </div>
                        </div>
                        {formData.leaveType === type.value && (
                          <ChevronRightIcon className="h-5 w-5 text-mustard-500 absolute top-4 right-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                      Start Date *
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-royal-500" />
                      <DatePicker
                        selected={formData.startDate}
                        onChange={(date) => setFormData({ ...formData, startDate: date })}
                        minDate={new Date()}
                        className="w-full pl-10 pr-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                      End Date *
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-royal-500" />
                      <DatePicker
                        selected={formData.endDate}
                        onChange={(date) => setFormData({ ...formData, endDate: date })}
                        minDate={formData.startDate}
                        className="w-full pl-10 pr-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Duration Display */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/20 dark:to-mustard-900/10 border border-mustard-200 dark:border-mustard-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Leave Days</p>
                      <p className="text-3xl font-bold text-mustard-700 dark:text-mustard-300">
                        {calculateDays()} days
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Period</p>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {formData.startDate.toLocaleDateString()} - {formData.endDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                    Reason for Leave *
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
                    placeholder="Please provide a detailed reason for your leave application..."
                    required
                  />
                </div>

                {/* Supporting Documents */}
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                    Supporting Documents (Optional)
                  </label>
                  <div className="border-2 border-dashed border-royal-200 dark:border-royal-800 rounded-xl p-6 text-center bg-white/50 dark:bg-neutral-900/30 hover:bg-white/70 dark:hover:bg-neutral-900/50 transition-all duration-200">
                    <ArrowUpTrayIcon className="h-12 w-12 text-royal-400 dark:text-royal-500 mx-auto" />
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                      Drag and drop files here, or click to browse
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setFormData({ ...formData, supportingDocuments: Array.from(e.target.files) })}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="mt-3 inline-flex items-center px-4 py-2 bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/30 dark:to-royal-900/20 text-royal-700 dark:text-royal-300 rounded-xl text-sm font-medium hover:shadow-lg hover:from-royal-100 hover:to-royal-200/50 dark:hover:from-royal-800/30 dark:hover:to-royal-800/20 transition-all duration-200 border border-royal-200 dark:border-royal-800 cursor-pointer"
                    >
                      Browse Files
                    </label>
                    {formData.supportingDocuments.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          Selected files:
                        </p>
                        <ul className="mt-2 space-y-1">
                          {formData.supportingDocuments.map((file, index) => (
                            <li key={index} className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center">
                              <DocumentTextIcon className="h-4 w-4 mr-2 text-royal-500" />
                              {file.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Supported formats: PDF, JPG, PNG (Max 5MB each)
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-3 rounded-xl text-sm font-medium flex items-center shadow-lg hover:shadow-xl transition-all duration-200 ${loading
                      ? 'bg-neutral-400 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-mustard-500 to-mustard-600 hover:from-mustard-600 hover:to-mustard-700 text-white'
                      }`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                        Submit Application
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Previous Applications */}
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-mustard-500" />
              Recent Leave Applications
            </h3>

            {myLeaves.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-neutral-400 dark:text-neutral-500 mx-auto" />
                <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                  No previous leave applications
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                  <thead className="bg-gradient-to-r from-royal-50 to-mustard-50 dark:from-royal-900/30 dark:to-mustard-900/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Days
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Applied On
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {myLeaves.slice(0, 5).map((leave) => (
                      <tr key={leave._id} className="hover:bg-gradient-to-r hover:from-mustard-50/30 hover:to-scarlet-50/30 dark:hover:from-mustard-900/10 dark:hover:to-scarlet-900/10 transition-all duration-200">
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs rounded-full bg-gradient-to-r ${getLeaveTypeColor(leave.leaveType)} dark:${getLeaveTypeColor(leave.leaveType).replace('50', '900/30').replace('100/50', '900/20')} text-neutral-700 dark:text-neutral-300 border ${getLeaveTypeBorder(leave.leaveType)} dark:border-neutral-700 capitalize`}>
                            {leave.leaveType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {new Date(leave.startDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            to {new Date(leave.endDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-lg font-bold text-mustard-700 dark:text-mustard-300">
                            {leave.numberOfDays}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`px-3 py-1.5 rounded-xl text-sm font-medium flex items-center w-fit ${getStatusColor(leave.status)}`}>
                            <div className="mr-2">
                              {getStatusIcon(leave.status)}
                            </div>
                            <span className="capitalize">
                              {leave.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                          {new Date(leave.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ApplyLeave;