import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { staffService } from '../../services/staffService';
import { useNavigate } from 'react-router-dom';
import {
  ShieldExclamationIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  XCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const DisciplinaryAppeal = () => {
  useDocumentTitle('Submit Appeal');
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    caseId: '',
    appealReason: '',
    supportingDocuments: [],
    appealType: 'disciplinary'
  });
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    fetchActiveCases();
  }, []);

  const fetchActiveCases = async () => {
    try {
      const response = await staffService.getDisciplinaryCases();
      const activeCases = response.data.filter(caseItem =>
        caseItem.status === 'active' || caseItem.status === 'warning'
      );
      setCases(activeCases);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const handleCaseSelect = (caseItem) => {
    setSelectedCase(caseItem);
    setFormData(prev => ({
      ...prev,
      caseId: caseItem._id,
      appealType: caseItem.type || 'disciplinary'
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024); // 5MB
    if (oversizedFiles.length > 0) {
      toast.error('Some files exceed 5MB limit');
      return;
    }

    setFormData(prev => ({
      ...prev,
      supportingDocuments: [...prev.supportingDocuments, ...files]
    }));
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      supportingDocuments: prev.supportingDocuments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.caseId) {
      toast.error('Please select a case to appeal');
      return;
    }

    if (!formData.appealReason.trim()) {
      toast.error('Please provide a detailed appeal reason');
      return;
    }

    try {
      setLoading(true);

      const appealData = {
        caseId: formData.caseId,
        reason: formData.appealReason,
        documents: formData.supportingDocuments,
        appealType: formData.appealType,
        submittedBy: user._id
      };

      await staffService.fileAppeal(appealData);
      toast.success('Appeal submitted successfully');
      navigate('/staff');
    } catch (error) {
      console.error('Appeal submission error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit appeal');
    } finally {
      setLoading(false);
    }
  };

  const appealTypes = [
    { value: 'disciplinary', label: 'Disciplinary Action', color: 'from-scarlet-50 to-scarlet-100/50', border: 'border-scarlet-200' },
    { value: 'warning', label: 'Official Warning', color: 'from-yellow-50 to-yellow-100/50', border: 'border-yellow-200' },
    { value: 'suspension', label: 'Suspension', color: 'from-royal-50 to-royal-100/50', border: 'border-royal-200' },
    { value: 'termination', label: 'Termination', color: 'from-neutral-50 to-neutral-100/50', border: 'border-neutral-200' }
  ];

  const getAppealTypeColor = (type) => {
    const typeConfig = appealTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.color : 'from-neutral-50 to-neutral-100/50';
  };

  const getAppealTypeBorder = (type) => {
    const typeConfig = appealTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.border : 'border-neutral-200';
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/30 dark:to-royal-900/20 text-royal-700 dark:text-royal-300 rounded-xl hover:shadow-lg transition-all duration-200 border border-royal-200 dark:border-royal-800"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center">
              <ShieldExclamationIcon className="h-6 w-6 mr-2 text-scarlet-500" />
              Submit Appeal
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Appeal against disciplinary decisions and actions
            </p>
          </div>
        </div>

        <div className="flex items-center text-sm text-royal-600 dark:text-royal-400">
          <InformationCircleIcon className="h-5 w-5 mr-2" />
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Active Cases */}
        <div className="lg:col-span-1">
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-scarlet-100 dark:border-scarlet-900/30">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
              <DocumentIcon className="h-5 w-5 mr-2 text-scarlet-500" />
              Active Cases
            </h3>

            {cases.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-12 w-12 text-mustard-400 dark:text-mustard-500 mx-auto" />
                <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                  No active disciplinary cases
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cases.map((caseItem) => (
                  <button
                    key={caseItem._id}
                    onClick={() => handleCaseSelect(caseItem)}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 border ${selectedCase?._id === caseItem._id
                      ? `${getAppealTypeColor(caseItem.type)} dark:${getAppealTypeColor(caseItem.type).replace('50', '900/30').replace('100/50', '900/20')} border-mustard-300 dark:border-mustard-700 shadow-lg scale-[1.02]`
                      : `bg-white/50 dark:bg-neutral-900/50 ${getAppealTypeBorder(caseItem.type)} dark:border-neutral-700 hover:shadow-md hover:scale-[1.01]`
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <ShieldExclamationIcon className="h-4 w-4 mr-2 text-scarlet-500" />
                          <span className="font-medium text-neutral-900 dark:text-white">
                            Case #{caseItem.caseNumber || caseItem._id.slice(-6)}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          {caseItem.type?.charAt(0).toUpperCase() + caseItem.type?.slice(1)} • {caseItem.severity}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 line-clamp-2">
                          {caseItem.description}
                        </p>
                      </div>
                      {selectedCase?._id === caseItem._id && (
                        <CheckCircleIcon className="h-5 w-5 text-mustard-500" />
                      )}
                    </div>
                    <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                      Issued: {new Date(caseItem.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Important Information */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10 border border-royal-200 dark:border-royal-800">
              <h4 className="font-medium text-neutral-900 dark:text-white mb-2 flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-2 text-royal-500" />
                Important Notes
              </h4>
              <ul className="text-sm text-neutral-700 dark:text-neutral-300 space-y-2">
                <li className="flex items-start">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-scarlet-500 mt-0.5" />
                  <span>Submit appeals within 7 days of decision</span>
                </li>
                <li className="flex items-start">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-scarlet-500 mt-0.5" />
                  <span>Provide detailed reasons and evidence</span>
                </li>
                <li className="flex items-start">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-scarlet-500 mt-0.5" />
                  <span>Appeals are reviewed within 14 business days</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column - Appeal Form */}
        <div className="lg:col-span-2">
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-mustard-100 dark:border-mustard-900/30">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
              <ArrowUpTrayIcon className="h-5 w-5 mr-2 text-mustard-500" />
              Appeal Form
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Selected Case Display */}
                {selectedCase && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-mustard-50 to-mustard-100/50 dark:from-mustard-900/20 dark:to-mustard-900/10 border border-mustard-200 dark:border-mustard-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-white">
                          Selected Case: #{selectedCase.caseNumber || selectedCase._id.slice(-6)}
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          Type: {selectedCase.type?.charAt(0).toUpperCase() + selectedCase.type?.slice(1)}
                          • Severity: {selectedCase.severity}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                          {selectedCase.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCase(null);
                          setFormData(prev => ({ ...prev, caseId: '' }));
                        }}
                        className="p-2 text-scarlet-600 dark:text-scarlet-400 hover:text-scarlet-700 dark:hover:text-scarlet-300"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Appeal Type */}
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4">
                    Appeal Type *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {appealTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, appealType: type.value })}
                        className={`p-4 rounded-xl text-left transition-all duration-200 border-2 ${formData.appealType === type.value
                          ? `${type.color} dark:${type.color.replace('50', '900/30').replace('100/50', '900/20')} border-mustard-300 dark:border-mustard-700 shadow-lg scale-[1.02]`
                          : `bg-white/50 dark:bg-neutral-900/50 ${type.border} dark:border-neutral-700 hover:shadow-md hover:scale-[1.01]`
                          }`}
                      >
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${type.color.split(' ')[0]} ${type.color.split(' ')[1]} mr-3`}>
                            <ShieldExclamationIcon className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900 dark:text-white">
                              {type.label}
                            </div>
                            <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                              Appeal against {type.label.toLowerCase()}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Appeal Reason */}
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                    Appeal Reason *
                  </label>
                  <textarea
                    value={formData.appealReason}
                    onChange={(e) => setFormData({ ...formData, appealReason: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-neutral-800/80 border border-royal-200 dark:border-royal-800 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 dark:focus:ring-royal-600 dark:focus:border-royal-600 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
                    placeholder="Please provide a detailed explanation of why you are appealing this decision. Include any relevant facts, evidence, or circumstances..."
                    required
                  />
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Minimum 50 characters. Be specific and provide supporting details.
                  </p>
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
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <label
                      htmlFor="file-upload"
                      className="mt-3 inline-flex items-center px-4 py-2 bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/30 dark:to-royal-900/20 text-royal-700 dark:text-royal-300 rounded-xl text-sm font-medium hover:shadow-lg hover:from-royal-100 hover:to-royal-200/50 dark:hover:from-royal-800/30 dark:hover:to-royal-800/20 transition-all duration-200 border border-royal-200 dark:border-royal-800 cursor-pointer"
                    >
                      Browse Files
                    </label>

                    {formData.supportingDocuments.length > 0 && (
                      <div className="mt-6">
                        <h5 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">
                          Selected Files ({formData.supportingDocuments.length}/5)
                        </h5>
                        <div className="space-y-2">
                          {formData.supportingDocuments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-neutral-900/30 rounded-lg border border-neutral-200 dark:border-neutral-700">
                              <div className="flex items-center">
                                <FolderIcon className="h-5 w-5 mr-3 text-royal-500" />
                                <div>
                                  <p className="text-sm text-neutral-900 dark:text-white truncate max-w-xs">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeDocument(index)}
                                className="p-1 text-scarlet-600 dark:text-scarlet-400 hover:text-scarlet-700 dark:hover:text-scarlet-300"
                              >
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB each, max 5 files)
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.caseId}
                    className={`px-6 py-3 rounded-xl text-sm font-medium flex items-center shadow-lg hover:shadow-xl transition-all duration-200 ${loading || !formData.caseId
                      ? 'bg-neutral-400 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-scarlet-500 to-scarlet-600 hover:from-scarlet-600 hover:to-scarlet-700 text-white'
                      }`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Submitting Appeal...
                      </>
                    ) : (
                      <>
                        <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                        Submit Appeal
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Appeal Process Info */}
          <div className="mt-6 bg-gradient-to-r from-royal-50 to-royal-100/50 dark:from-royal-900/20 dark:to-royal-900/10 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-royal-200 dark:border-royal-800">
            <h4 className="font-medium text-neutral-900 dark:text-white mb-4 flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-2 text-royal-500" />
              Appeal Process Timeline
            </h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-mustard-100 dark:bg-mustard-900/50 mr-3">
                  <span className="text-sm font-medium text-mustard-700 dark:text-mustard-300">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">Submission</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Appeal submitted and acknowledged</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-royal-100 dark:bg-royal-900/50 mr-3">
                  <span className="text-sm font-medium text-royal-700 dark:text-royal-300">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">Review</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Case reviewed by HR committee (1-7 days)</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-scarlet-100 dark:bg-scarlet-900/50 mr-3">
                  <span className="text-sm font-medium text-scarlet-700 dark:text-scarlet-300">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">Decision</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Final decision communicated (14 business days)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default DisciplinaryAppeal;