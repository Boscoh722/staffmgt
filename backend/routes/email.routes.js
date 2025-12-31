const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const EmailTemplate = require('../models/EmailTemplate');
const User = require('../models/User');
const { sendEmail, sendTemplateEmail } = require('../utils/emailService');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/email-attachments/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, and images are allowed.'));
    }
  }
});

// Send email to individual staff
router.post('/send', auth, authorize('supervisor', 'admin', 'clerk'), upload.array('attachments'), async (req, res) => {
  try {
    const { to, subject, message, category, templateId, staffId } = req.body;
    
    let recipient;
    if (staffId) {
      // Get staff by ID
      recipient = await User.findById(staffId);
      if (!recipient) {
        return res.status(404).json({ error: 'Staff not found' });
      }
    } else if (to) {
      // Use provided email
      recipient = { email: to, firstName: 'Staff', lastName: 'Member' };
    } else {
      return res.status(400).json({ error: 'Either staffId or email address is required' });
    }

    let htmlContent = message;
    let emailSubject = subject;
    
    // Use template if specified
    if (templateId) {
      const template = await EmailTemplate.findById(templateId);
      if (template) {
        emailSubject = template.subject;
        
        // Replace template variables
        htmlContent = template.body;
        const staff = await User.findById(staffId);
        if (staff) {
          htmlContent = htmlContent
            .replace(/{{staffName}}/g, `${staff.firstName} ${staff.lastName}`)
            .replace(/{{employeeId}}/g, staff.employeeId)
            .replace(/{{department}}/g, staff.department)
            .replace(/{{position}}/g, staff.position);
        }
        
        // Replace additional variables from request
        Object.keys(req.body).forEach(key => {
          if (key.startsWith('var_')) {
            const varName = key.replace('var_', '');
            const regex = new RegExp(`{{${varName}}}`, 'g');
            htmlContent = htmlContent.replace(regex, req.body[key]);
          }
        });
      }
    }

    // Prepare attachments
    const attachments = req.files ? req.files.map(file => ({
      filename: file.originalname,
      path: file.path,
      contentType: file.mimetype
    })) : [];

    // Send email
    const result = await sendEmail(
      recipient.email,
      emailSubject,
      htmlContent,
      attachments
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to send email', details: result.error });
    }

    // Log the email
    await createEmailLog({
      sender: req.user._id,
      recipient: recipient._id || staffId,
      email: recipient.email,
      subject: emailSubject,
      category: category || 'informational',
      templateUsed: templateId,
      status: 'sent',
      messageId: result.messageId,
      attachments: req.files ? req.files.map(f => f.filename) : []
    });

    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send email to multiple staff (bulk)
router.post('/send-bulk', auth, authorize('supervisor', 'admin'), upload.array('attachments'), async (req, res) => {
  try {
    const { staffIds, department, role, subject, message, category, templateId } = req.body;
    
    let recipients;
    
    // Determine recipients based on filters
    if (staffIds && staffIds.length > 0) {
      recipients = await User.find({ _id: { $in: staffIds }, isActive: true });
    } else if (department) {
      recipients = await User.find({ department, isActive: true });
    } else if (role) {
      recipients = await User.find({ role, isActive: true });
    } else {
      return res.status(400).json({ error: 'Specify staffIds, department, or role' });
    }

    if (recipients.length === 0) {
      return res.status(404).json({ error: 'No recipients found' });
    }

    // Prepare attachments
    const attachments = req.files ? req.files.map(file => ({
      filename: file.originalname,
      path: file.path,
      contentType: file.mimetype
    })) : [];

    const results = [];
    const template = templateId ? await EmailTemplate.findById(templateId) : null;

    for (const recipient of recipients) {
      try {
        let htmlContent = message;
        let emailSubject = subject;

        // Use template if specified
        if (template) {
          emailSubject = template.subject;
          htmlContent = template.body;
          
          // Replace variables
          htmlContent = htmlContent
            .replace(/{{staffName}}/g, `${recipient.firstName} ${recipient.lastName}`)
            .replace(/{{employeeId}}/g, recipient.employeeId)
            .replace(/{{department}}/g, recipient.department)
            .replace(/{{position}}/g, recipient.position);

          // Replace additional variables
          Object.keys(req.body).forEach(key => {
            if (key.startsWith('var_')) {
              const varName = key.replace('var_', '');
              const regex = new RegExp(`{{${varName}}}`, 'g');
              htmlContent = htmlContent.replace(regex, req.body[key]);
            }
          });
        }

        const result = await sendEmail(
          recipient.email,
          emailSubject,
          htmlContent,
          attachments
        );

        // Log each email
        await createEmailLog({
          sender: req.user._id,
          recipient: recipient._id,
          email: recipient.email,
          subject: emailSubject,
          category: category || 'informational',
          templateUsed: templateId,
          status: result.success ? 'sent' : 'failed',
          messageId: result.messageId,
          attachments: req.files ? req.files.map(f => f.filename) : [],
          error: result.success ? null : result.error
        });

        results.push({
          staffId: recipient._id,
          name: `${recipient.firstName} ${recipient.lastName}`,
          email: recipient.email,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        });
      } catch (error) {
        results.push({
          staffId: recipient._id,
          name: `${recipient.firstName} ${recipient.lastName}`,
          email: recipient.email,
          success: false,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      total: results.length,
      successful,
      failed,
      results
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send email based on category (disciplinary, warning, informational)
router.post('/send-by-category', auth, authorize('supervisor', 'admin'), async (req, res) => {
  try {
    const { category, staffId, additionalData } = req.body;
    
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // Get template by category
    const template = await EmailTemplate.findOne({ 
      category,
      isActive: true 
    });

    if (!template) {
      return res.status(404).json({ error: `No template found for category: ${category}` });
    }

    // Prepare variables
    const variables = {
      staffName: `${staff.firstName} ${staff.lastName}`,
      employeeId: staff.employeeId,
      department: staff.department,
      position: staff.position,
      ...additionalData
    };

    // Send email using template
    const result = await sendTemplateEmail(template, staff, variables);

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to send email', details: result.error });
    }

    // Log the email
    await createEmailLog({
      sender: req.user._id,
      recipient: staff._id,
      email: staff.email,
      subject: template.subject,
      category: template.category,
      templateUsed: template._id,
      status: 'sent',
      messageId: result.messageId,
      variables: additionalData
    });

    res.json({
      success: true,
      message: `${category} email sent successfully`,
      messageId: result.messageId
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get sent emails
router.get('/sent', auth, authorize('supervisor', 'admin'), async (req, res) => {
  try {
    const { startDate, endDate, category, recipient, limit = 50 } = req.query;
    
    const query = {};
    
    if (startDate && endDate) {
      query.sentAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (recipient) {
      query.recipient = recipient;
    }

    const EmailLog = require('../models/EmailLog');
    const emails = await EmailLog.find(query)
      .populate('sender', 'firstName lastName email')
      .populate('recipient', 'firstName lastName employeeId')
      .sort({ sentAt: -1 })
      .limit(parseInt(limit));

    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get email statistics
router.get('/stats', auth, authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const EmailLog = require('../models/EmailLog');
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const stats = await EmailLog.aggregate([
      {
        $match: {
          sentAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          total: { $sum: '$count' },
          byStatus: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      }
    ]);

    // Get top senders
    const topSenders = await EmailLog.aggregate([
      {
        $match: {
          sentAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$sender',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'senderInfo'
        }
      },
      {
        $unwind: '$senderInfo'
      },
      {
        $project: {
          senderId: '$_id',
          name: { $concat: ['$senderInfo.firstName', ' ', '$senderInfo.lastName'] },
          email: '$senderInfo.email',
          count: 1
        }
      }
    ]);

    res.json({
      period,
      startDate,
      endDate: new Date(),
      stats,
      topSenders,
      summary: {
        totalEmails: stats.reduce((sum, cat) => sum + cat.total, 0),
        categories: stats.map(cat => ({ category: cat._id, total: cat.total }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get email templates
router.get('/templates', auth, authorize('supervisor', 'admin'), async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const templates = await EmailTemplate.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1 });

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create email template
router.post('/templates', auth, authorize('admin'), async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      createdBy: req.user._id
    };

    const template = new EmailTemplate(templateData);
    await template.save();

    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update email template
router.put('/templates/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName');

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Toggle template status
router.put('/templates/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Preview template with variables
router.post('/templates/:id/preview', auth, async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const { variables = {} } = req.body;
    let previewContent = template.body;
    let previewSubject = template.subject;

    // Replace variables in preview
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewContent = previewContent.replace(regex, variables[key]);
      previewSubject = previewSubject.replace(regex, variables[key]);
    });

    // Replace default staff variables with sample data
    previewContent = previewContent
      .replace(/{{staffName}}/g, 'John Doe')
      .replace(/{{employeeId}}/g, 'EMP23001')
      .replace(/{{department}}/g, 'Administration')
      .replace(/{{position}}/g, 'Administrative Assistant');

    previewSubject = previewSubject
      .replace(/{{staffName}}/g, 'John Doe')
      .replace(/{{employeeId}}/g, 'EMP23001');

    res.json({
      subject: previewSubject,
      body: previewContent,
      variables: template.variables
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get email delivery status
router.get('/status/:messageId', auth, authorize('supervisor', 'admin'), async (req, res) => {
  try {
    const EmailLog = require('../models/EmailLog');
    
    const email = await EmailLog.findOne({ messageId: req.params.messageId })
      .populate('sender', 'firstName lastName')
      .populate('recipient', 'firstName lastName employeeId');

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(email);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resend failed email
router.post('/resend/:id', auth, authorize('supervisor', 'admin'), async (req, res) => {
  try {
    const EmailLog = require('../models/EmailLog');
    
    const emailLog = await EmailLog.findById(req.params.id)
      .populate('recipient');

    if (!emailLog) {
      return res.status(404).json({ error: 'Email log not found' });
    }

    if (!emailLog.recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Resend the email
    const result = await sendEmail(
      emailLog.recipient.email,
      emailLog.subject,
      emailLog.content || 'Content not saved',
      []
    );

    // Update log
    emailLog.status = result.success ? 'resent' : 'failed';
    emailLog.sentAt = new Date();
    emailLog.messageId = result.messageId || emailLog.messageId;
    emailLog.error = result.success ? null : result.error;
    
    await emailLog.save();

    res.json({
      success: result.success,
      message: result.success ? 'Email resent successfully' : 'Failed to resend email',
      messageId: result.messageId
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get recipients for bulk email
router.get('/recipients', auth, authorize('supervisor', 'admin'), async (req, res) => {
  try {
    const { department, role, supervisorId } = req.query;
    
    const query = { isActive: true };
    
    if (department) query.department = department;
    if (role) query.role = role;
    if (supervisorId) query.supervisor = supervisorId;

    const recipients = await User.find(query)
      .select('firstName lastName email employeeId department position')
      .sort('firstName');

    res.json(recipients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to create email log
async function createEmailLog(emailData) {
  const EmailLog = require('../models/EmailLog');
  
  const log = new EmailLog({
    ...emailData,
    sentAt: new Date()
  });
  
  await log.save();
  return log;
}

module.exports = router;
