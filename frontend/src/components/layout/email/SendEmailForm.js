import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { emailService } from '../../services/emailService';
import { staffService } from '../../services/staffService';
import toast from 'react-hot-toast';

const SendEmailForm = ({ onClose, recipientId, category }) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    staffId: recipientId || '',
    subject: '',
    message: '',
    category: category || 'informational',
    templateId: '',
    attachments: []
  });

  useEffect(() => {
    loadStaff();
    loadTemplates();
  }, []);

  const loadStaff = async () => {
    try {
      const response = await staffService.getStaff();
      setStaffList(response.data);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await emailService.getTemplates({ isActive: true });
      setTemplates(response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleTemplateChange = (templateId) => {
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setFormData(prev => ({
        ...prev,
        templateId,
        subject: template.subject,
        message: template.body
      }));
    }
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      attachments: Array.from(e.target.files)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await emailService.sendEmail(formData);
      toast.success('Email sent successfully!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Send Email
        </h3>
        
        <form onSubmit={handleSubmit}>
          {/* Recipient Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipient
            </label>
            <select
              value={formData.staffId}
              onChange={(e) => setFormData(prev => ({ ...prev, staffId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
              required
            >
              <option value="">Select staff member</option>
              {staffList.map(staff => (
                <option key={staff._id} value={staff._id}>
                  {staff.firstName} {staff.lastName} ({staff.employeeId})
                </option>
              ))}
            </select>
          </div>

          {/* Template Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Use Template (Optional)
            </label>
            <select
              value={formData.templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
            >
              <option value="">Select template</option>
              {templates.map(template => (
                <option key={template._id} value={template._id}>
                  {template.name} ({template.category})
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
              required
            />
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
              required
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
            >
              <option value="informational">Informational</option>
              <option value="disciplinary">Disciplinary</option>
              <option value="warning">Warning</option>
              <option value="leave">Leave</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Attachments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attachments
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green-500"
            />
            {formData.attachments.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Selected files:</p>
                <ul className="list-disc pl-5 mt-1">
                  {formData.attachments.map((file, index) => (
                    <li key={index} className="text-sm text-gray-500">
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-dark-green-600 text-white rounded-md text-sm font-medium hover:bg-dark-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-green-500 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendEmailForm;