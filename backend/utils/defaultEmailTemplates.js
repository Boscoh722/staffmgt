const defaultTemplates = [
    {
      name: 'disciplinary_warning',
      category: 'disciplinary',
      subject: 'Disciplinary Warning - {{infractionType}}',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">DISCIPLINARY WARNING NOTICE</h2>
          <p>Dear {{staffName}},</p>
          <p>This email serves as a formal disciplinary warning regarding the following infraction:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #d32f2f; margin: 15px 0;">
            <p><strong>Infraction Type:</strong> {{infractionType}}</p>
            <p><strong>Date of Infraction:</strong> {{dateOfInfraction}}</p>
            <p><strong>Description:</strong> {{description}}</p>
            <p><strong>Sanction:</strong> {{sanction}}</p>
            <p><strong>Sanction Details:</strong> {{sanctionDetails}}</p>
          </div>
          <p>The following remedial measures are required:</p>
          <p>{{remedialMeasures}}</p>
          <p>You have 7 working days to submit a written response to this warning.</p>
          <p><strong>Failure to comply may result in further disciplinary action.</strong></p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an official communication from Makongeni Ward Administration.<br>
            Please direct any queries to your immediate supervisor.
          </p>
        </div>
      `,
      variables: ['infractionType', 'dateOfInfraction', 'description', 'sanction', 'sanctionDetails', 'remedialMeasures']
    },
    {
      name: 'leave_approval',
      category: 'leave',
      subject: 'Leave Application Approved - {{leaveType}}',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #388e3c;">LEAVE APPLICATION APPROVED</h2>
          <p>Dear {{staffName}},</p>
          <p>Your leave application has been <strong>APPROVED</strong> by the administration.</p>
          <div style="background-color: #f1f8e9; padding: 15px; border-left: 4px solid #388e3c; margin: 15px 0;">
            <p><strong>Leave Type:</strong> {{leaveType}}</p>
            <p><strong>Period:</strong> {{startDate}} to {{endDate}}</p>
            <p><strong>Number of Days:</strong> {{numberOfDays}}</p>
            <p><strong>Approval Date:</strong> {{approvalDate}}</p>
          </div>
          <p><strong>Important Notes:</strong></p>
          <ul>
            <li>Ensure all pending work is completed or handed over</li>
            <li>Update your out-of-office message</li>
            <li>Return all official items before proceeding on leave</li>
            <li>Report back on the first working day after your leave</li>
          </ul>
          <p>Wishing you a restful leave period.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            Makongeni Ward Administration<br>
            For queries, contact Human Resources
          </p>
        </div>
      `,
      variables: ['leaveType', 'startDate', 'endDate', 'numberOfDays', 'approvalDate']
    },
    {
      name: 'attendance_warning',
      category: 'warning',
      subject: 'Attendance Warning - {{warningType}}',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f57c00;">ATTENDANCE WARNING</h2>
          <p>Dear {{staffName}},</p>
          <p>This email serves as a formal warning regarding your attendance record.</p>
          <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #f57c00; margin: 15px 0;">
            <p><strong>Warning Type:</strong> {{warningType}}</p>
            <p><strong>Period:</strong> {{period}}</p>
            <p><strong>Issues Identified:</strong> {{issues}}</p>
            <p><strong>Required Improvement:</strong> {{improvement}}</p>
          </div>
          <p><strong>Required Action:</strong></p>
          <ol>
            <li>Improve attendance to meet the required standards</li>
            <li>Submit medical certificates for all sick leaves (if applicable)</li>
            <li>Follow proper leave application procedures</li>
            <li>Report any challenges affecting your attendance</li>
          </ol>
          <p><strong>Failure to show immediate improvement may result in disciplinary action.</strong></p>
          <p>Please schedule a meeting with your supervisor to discuss this matter.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            Makongeni Ward Human Resources<br>
            Employee ID: {{employeeId}}
          </p>
        </div>
      `,
      variables: ['warningType', 'period', 'issues', 'improvement']
    },
    {
      name: 'general_announcement',
      category: 'informational',
      subject: 'Announcement: {{announcementTitle}}',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">OFFICIAL ANNOUNCEMENT</h2>
          <p>Dear {{staffName}},</p>
          <p>{{announcementText}}</p>
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Important Details:</strong></p>
            <p>{{details}}</p>
            {{#if date}}<p><strong>Date:</strong> {{date}}</p>{{/if}}
            {{#if time}}<p><strong>Time:</strong> {{time}}</p>{{/if}}
            {{#if venue}}<p><strong>Venue:</strong> {{venue}}</p>{{/if}}
          </div>
          <p><strong>Action Required:</strong> {{actionRequired}}</p>
          <p>For more information, contact {{contactPerson}} at {{contactDetails}}.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            Makongeni Ward Administration<br>
            This announcement applies to all staff members
          </p>
        </div>
      `,
      variables: ['announcementTitle', 'announcementText', 'details', 'date', 'time', 'venue', 'actionRequired', 'contactPerson', 'contactDetails']
    },
    {
      name: 'performance_review',
      category: 'informational',
      subject: 'Performance Review Schedule - {{reviewPeriod}}',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7b1fa2;">PERFORMANCE REVIEW NOTIFICATION</h2>
          <p>Dear {{staffName}},</p>
          <p>This is to inform you that your performance review for {{reviewPeriod}} has been scheduled.</p>
          <div style="background-color: #f3e5f5; padding: 15px; border-left: 4px solid #7b1fa2; margin: 15px 0;">
            <p><strong>Review Period:</strong> {{reviewPeriod}}</p>
            <p><strong>Scheduled Date:</strong> {{reviewDate}}</p>
            <p><strong>Time:</strong> {{reviewTime}}</p>
            <p><strong>Venue:</strong> {{reviewVenue}}</p>
            <p><strong>Reviewer:</strong> {{reviewerName}}</p>
          </div>
          <p><strong>Preparation Required:</strong></p>
          <ol>
            <li>Complete the self-assessment form (attached)</li>
            <li>Prepare a list of your achievements</li>
            <li>Identify areas for improvement</li>
            <li>Prepare goals for the next period</li>
          </ol>
          <p>Please bring the following documents to the review:</p>
          <ul>
            <li>Completed self-assessment form</li>
            <li>Any supporting documents</li>
            <li>Previous review documents</li>
          </ul>
          <p>If you need to reschedule, contact {{contactPerson}} at least 48 hours in advance.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            Makongeni Ward Human Resources<br>
            Employee Development Division
          </p>
        </div>
      `,
      variables: ['reviewPeriod', 'reviewDate', 'reviewTime', 'reviewVenue', 'reviewerName', 'contactPerson']
    }
  ];
  
  module.exports = { defaultTemplates };
  