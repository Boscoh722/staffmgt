export const disciplinaryTemplate = {
    name: 'disciplinary_warning',
    category: 'disciplinary',
    subject: 'Disciplinary Action Notification',
    body: `
      <h2>Disciplinary Action Notice</h2>
      <p>Dear {{staffName}},</p>
      <p>This email serves as formal notification of disciplinary action regarding:</p>
      <p><strong>Infraction:</strong> {{infractionType}}</p>
      <p><strong>Description:</strong> {{description}}</p>
      <p><strong>Date:</strong> {{dateOfInfraction}}</p>
      <p><strong>Sanction:</strong> {{sanction}}</p>
      <p>{{sanctionDetails}}</p>
      <p>You have the right to appeal this decision within 7 days.</p>
      <p>Sincerely,<br>Makongeni Ward Management</p>
    `,
    variables: ['infractionType', 'description', 'dateOfInfraction', 'sanction', 'sanctionDetails']
  };
  
  export const leaveApprovalTemplate = {
    name: 'leave_approval',
    category: 'leave',
    subject: 'Leave Application Approved',
    body: `
      <h2>Leave Application Approved</h2>
      <p>Dear {{staffName}},</p>
      <p>Your leave application has been approved.</p>
      <p><strong>Leave Type:</strong> {{leaveType}}</p>
      <p><strong>Period:</strong> {{startDate}} to {{endDate}}</p>
      <p><strong>Number of Days:</strong> {{numberOfDays}}</p>
      <p>Please ensure all pending work is completed before your leave.</p>
      <p>Sincerely,<br>Makongeni Ward Management</p>
    `,
    variables: ['leaveType', 'startDate', 'endDate', 'numberOfDays']
  };
  export const leaveRejectionTemplate = {
    name: 'leave_rejection',
    category: 'leave',
    subject: 'Leave Application Rejected',
    body: `
      <h2>Leave Application Rejected</h2>
      <p>Dear {{staffName}},</p>
      <p>Your leave application has been rejected.</p>
      <p><strong>Reason:</strong> {{rejectionReason}}</p>
      <p>Please contact your supervisor for further details.</p>
      <p>Sincerely,<br>Makongeni Ward Management</p>
    `,
    variables: ['rejectionReason']
  };
  