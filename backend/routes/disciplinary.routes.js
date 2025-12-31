const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Disciplinary = require('../models/Disciplinary');
const User = require('../models/User');
const { sendTemplateEmail } = require('../utils/emailService');
const EmailTemplate = require('../models/EmailTemplate');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

// Create disciplinary case (Supervisor/Admin)
router.post('/', auth, authorize('supervisor', 'admin'), upload.array('documents'), async (req, res) => {
  try {
    const disciplinaryData = {
      ...req.body,
      reportedBy: req.user._id,
      dateOfInfraction: new Date(req.body.dateOfInfraction)
    };

    if (req.files) {
      disciplinaryData.documents = req.files.map(file => `/uploads/${file.filename}`);
    }

    const disciplinary = new Disciplinary(disciplinaryData);
    await disciplinary.save();

    // Send email to staff
    const staff = await User.findById(req.body.staff);
    if (staff) {
      const template = await EmailTemplate.findOne({ name: 'disciplinary_warning' });
      if (template) {
        await sendTemplateEmail(template, staff, {
          infractionType: disciplinary.infractionType,
          description: disciplinary.description,
          dateOfInfraction: new Date(disciplinary.dateOfInfraction).toLocaleDateString(),
          sanction: disciplinary.sanction || 'Pending',
          sanctionDetails: disciplinary.sanctionDetails || 'To be determined'
        });
      }
    }

    res.status(201).json(disciplinary);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all disciplinary cases (Admin/Supervisor)
router.get('/', auth, authorize('admin', 'supervisor'), async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'supervisor') {
      // Get staff under supervisor
      const supervisedStaff = await User.find({ 
        supervisor: req.user._id 
      }).select('_id');
      
      const staffIds = supervisedStaff.map(staff => staff._id);
      query.staff = { $in: staffIds };
    }

    const cases = await Disciplinary.find(query)
      .populate('staff', 'firstName lastName employeeId department')
      .populate('reportedBy', 'firstName lastName')
      .populate('actionTakenBy', 'firstName lastName')
      .populate('appeal.appealDecidedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get staff's disciplinary cases (Staff)
router.get('/my-cases', auth, authorize('staff'), async (req, res) => {
  try {
    const cases = await Disciplinary.find({ staff: req.user._id })
      .populate('reportedBy', 'firstName lastName')
      .populate('actionTakenBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific case
router.get('/:id', auth, async (req, res) => {
  try {
    const disciplinary = await Disciplinary.findById(req.params.id)
      .populate('staff', 'firstName lastName employeeId department')
      .populate('reportedBy', 'firstName lastName')
      .populate('actionTakenBy', 'firstName lastName')
      .populate('appeal.appealDecidedBy', 'firstName lastName');

    if (!disciplinary) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check permissions
    if (req.user.role === 'staff' && disciplinary.staff._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(disciplinary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update case (Supervisor/Admin)
router.put('/:id', auth, authorize('supervisor', 'admin'), upload.array('documents'), async (req, res) => {
  try {
    const updates = req.body;
    
    // Check permissions for supervisor
    if (req.user.role === 'supervisor') {
      const disciplinary = await Disciplinary.findById(req.params.id);
      if (!disciplinary) {
        return res.status(404).json({ error: 'Case not found' });
      }
      
      const staff = await User.findById(disciplinary.staff);
      if (staff.supervisor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to update this case' });
      }
    }

    if (req.files) {
      updates.$push = { documents: { $each: req.files.map(file => `/uploads/${file.filename}`) } };
    }

    const disciplinary = await Disciplinary.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    // Send update email if status changed
    if (updates.status && updates.status === 'resolved') {
      const staff = await User.findById(disciplinary.staff);
      const template = await EmailTemplate.findOne({ name: 'disciplinary_resolved' });
      
      if (template && staff) {
        await sendTemplateEmail(template, staff, {
          caseId: disciplinary._id,
          actionTaken: disciplinary.actionTaken,
          resolutionDate: new Date().toLocaleDateString()
        });
      }
    }

    res.json(disciplinary);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add staff response
router.post('/:id/response', auth, authorize('staff'), async (req, res) => {
  try {
    const { response } = req.body;
    
    const disciplinary = await Disciplinary.findOne({
      _id: req.params.id,
      staff: req.user._id
    });

    if (!disciplinary) {
      return res.status(404).json({ error: 'Case not found' });
    }

    disciplinary.staffResponse = response;
    disciplinary.responseDate = new Date();
    disciplinary.status = 'under-review';
    
    await disciplinary.save();

    res.json(disciplinary);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// File appeal (Staff)
router.post('/:id/appeal', auth, authorize('staff'), async (req, res) => {
  try {
    const { appealDetails } = req.body;
    
    const disciplinary = await Disciplinary.findOne({
      _id: req.params.id,
      staff: req.user._id
    });

    if (!disciplinary) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (disciplinary.appeal && disciplinary.appeal.hasAppealed) {
      return res.status(400).json({ error: 'Appeal already filed' });
    }

    disciplinary.appeal = {
      hasAppealed: true,
      appealDetails,
      appealDate: new Date()
    };
    
    disciplinary.status = 'appealed';
    
    await disciplinary.save();

    res.json({ message: 'Appeal filed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Process appeal (Admin/Supervisor)
router.post('/:id/appeal/decision', auth, authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const { decision, decisionDetails } = req.body;
    
    const disciplinary = await Disciplinary.findById(req.params.id);

    if (!disciplinary) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (!disciplinary.appeal.hasAppealed) {
      return res.status(400).json({ error: 'No appeal filed for this case' });
    }

    disciplinary.appeal.appealDecision = decision;
    disciplinary.appeal.appealDecisionDetails = decisionDetails;
    disciplinary.appeal.appealDecidedBy = req.user._id;
    disciplinary.appeal.appealDecisionDate = new Date();
    
    if (decision === 'upheld') {
      disciplinary.status = 'resolved';
      // Reverse sanctions if appeal upheld
      disciplinary.sanction = 'none';
      disciplinary.sanctionDetails = 'Reversed due to successful appeal';
    }

    await disciplinary.save();

    res.json(disciplinary);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add sanction
router.post('/:id/sanction', auth, authorize('supervisor', 'admin'), async (req, res) => {
  try {
    const { sanction, sanctionDetails } = req.body;
    
    const disciplinary = await Disciplinary.findById(req.params.id);

    if (!disciplinary) {
      return res.status(404).json({ error: 'Case not found' });
    }

    disciplinary.sanction = sanction;
    disciplinary.sanctionDetails = sanctionDetails;
    disciplinary.sanctionDate = new Date();
    
    await disciplinary.save();

    // Send sanction notification
    const staff = await User.findById(disciplinary.staff);
    const template = await EmailTemplate.findOne({ name: 'sanction_notice' });
    
    if (template && staff) {
      await sendTemplateEmail(template, staff, {
        sanction,
        sanctionDetails,
        effectiveDate: new Date().toLocaleDateString()
      });
    }

    res.json(disciplinary);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get statistics
router.get('/stats/summary', auth, authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const cases = await Disciplinary.find();
    
    const stats = {
      total: cases.length,
      open: cases.filter(c => c.status === 'open').length,
      underReview: cases.filter(c => c.status === 'under-review').length,
      resolved: cases.filter(c => c.status === 'resolved').length,
      appealed: cases.filter(c => c.status === 'appealed').length,
      byInfractionType: {},
      bySanction: {},
      byDepartment: {}
    };

    // Calculate by infraction type
    cases.forEach(caseItem => {
      // By infraction type
      if (!stats.byInfractionType[caseItem.infractionType]) {
        stats.byInfractionType[caseItem.infractionType] = 0;
      }
      stats.byInfractionType[caseItem.infractionType]++;
      
      // By sanction
      const sanction = caseItem.sanction || 'none';
      if (!stats.bySanction[sanction]) {
        stats.bySanction[sanction] = 0;
      }
      stats.bySanction[sanction]++;
    });

    // Calculate by department
    for (const caseItem of cases) {
      const staff = await User.findById(caseItem.staff).select('department');
      if (staff) {
        if (!stats.byDepartment[staff.department]) {
          stats.byDepartment[staff.department] = 0;
        }
        stats.byDepartment[staff.department]++;
      }
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
