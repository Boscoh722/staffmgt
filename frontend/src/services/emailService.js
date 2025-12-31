import api from './api';

export const emailService = {
  // Send individual email
  sendEmail: (data) => {
    const formData = new FormData();
    
    // Append text fields
    Object.keys(data).forEach(key => {
      if (key !== 'attachments') {
        formData.append(key, data[key]);
      }
    });
    
    // Append files
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    return api.post('/email/send', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Send bulk email
  sendBulkEmail: (data) => {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (key !== 'attachments') {
        if (Array.isArray(data[key])) {
          data[key].forEach(item => {
            formData.append(key, item);
          });
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    return api.post('/email/send-bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Send email by category
  sendCategoryEmail: (data) => api.post('/email/send-by-category', data),
  
  // Get sent emails
  getSentEmails: (params) => api.get('/email/sent', { params }),
  
  // Get email statistics
  getEmailStats: (params) => api.get('/email/stats', { params }),
  
  // Get email templates
  getTemplates: (params) => api.get('/email/templates', { params }),
  
  // Create template
  createTemplate: (data) => api.post('/email/templates', data),
  
  // Update template
  updateTemplate: (id, data) => api.put(`/email/templates/${id}`, data),
  
  // Toggle template status
  toggleTemplateStatus: (id, isActive) => 
    api.put(`/email/templates/${id}/status`, { isActive }),
  
  // Preview template
  previewTemplate: (id, variables) => 
    api.post(`/email/templates/${id}/preview`, { variables }),
  
  // Get email status
  getEmailStatus: (messageId) => api.get(`/email/status/${messageId}`),
  
  // Resend email
  resendEmail: (id) => api.post(`/email/resend/${id}`),
  
  // Get recipients
  getRecipients: (params) => api.get('/email/recipients', { params }),
};
