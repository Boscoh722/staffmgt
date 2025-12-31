const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    const mailOptions = {
      from: `"Makongeni Ward" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

const sendTemplateEmail = async (template, staff, variables = {}) => {
  let html = template.body;
  
  // Replace variables in template
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, variables[key]);
  });

  // Replace staff-specific variables
  html = html.replace(/{{staffName}}/g, `${staff.firstName} ${staff.lastName}`);
  html = html.replace(/{{employeeId}}/g, staff.employeeId);

  return sendEmail(staff.email, template.subject, html);
};

module.exports = { sendEmail, sendTemplateEmail };
