const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Disciplinary = require('../models/Disciplinary');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// Get all staff route - Update to populate department
router.get('/', auth, authorize('admin', 'clerk', 'supervisor'), async (req, res) => {  // Add 'clerk'
  try {
    const staff = await User.find({ role: 'staff', isActive: true })
      .select('-password')
      .populate('supervisor', 'firstName lastName')
      .populate('department', 'name code')
      .sort({ firstName: 1 });

    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get staff supervised by logged-in supervisor
router.get('/supervised', auth, authorize('supervisor'), async (req, res) => {
  try {
    const staff = await User.find({
      role: 'staff',
      supervisor: req.user._id,
      isActive: true
    })
      .select('-password')
      .populate('department', 'name code')
      .populate('supervisor', 'firstName lastName')
      .sort({ firstName: 1 });

    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get(
  '/supervisors',
  auth,
  authorize('admin'),
  async (req, res) => {
    try {
      const supervisors = await User.find({
        role: 'supervisor',
        isActive: true
      }).select('_id firstName lastName');

      res.json(supervisors);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch supervisors' });
    }
  }
);

// Staff dashboard data
router.get('/dashboard', auth, authorize('staff'), async (req, res) => {
  try {
    const userId = req.user._id;
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Attendance stats
    const attendanceRecords = await Attendance.find({
      staff: userId,
      date: { $gte: currentMonth, $lt: nextMonth }
    });

    const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
    const totalDays = attendanceRecords.length;
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Leave stats
    const leaves = await Leave.find({ staff: userId });
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
    const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
    const takenLeaves = leaves.filter(l => l.status === 'approved' && new Date(l.endDate) < new Date()).length;
    const user = await User.findById(userId);
    const balance = user.leaveBalance.annual.remaining;

    // Disciplinary cases
    const disciplinaryCases = await Disciplinary.find({ staff: userId }).countDocuments();

    res.json({
      attendance: {
        present: presentDays,
        absent: totalDays - presentDays,
        late: attendanceRecords.filter(a => a.status === 'late').length,
        totalDays,
        percentage
      },
      leaves: {
        pending: pendingLeaves,
        approved: approvedLeaves,
        rejected: leaves.filter(l => l.status === 'rejected').length,
        taken: takenLeaves,
        balance
      },
      disciplinary: disciplinaryCases
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Get staff profile
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('supervisor', 'firstName lastName')
      .populate('department', 'name code') 
      .populate('qualifications');
    
    if (!user) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    if (req.user.role === 'staff' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Assign supervisor to staff (ADMIN ONLY)
router.put('/:staffId/assign-supervisor', auth, authorize('admin'), async (req, res) => {
  try {
    const { supervisorId } = req.body;

    const supervisor = await User.findOne({
      _id: supervisorId,
      role: 'supervisor'
    });

    if (!supervisor) {
      return res.status(400).json({ error: 'Invalid supervisor' });
    }

    const staff = await User.findOneAndUpdate(
      { _id: req.params.staffId, role: 'staff' },
      { supervisor: supervisorId },
      { new: true }
    )
      .select('-password')
      .populate('supervisor', 'firstName lastName');

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch(
  '/:id/assign-supervisor',
  auth,
  authorize('admin'),
  async (req, res) => {
    const { supervisorId } = req.body;

    try {
      const supervisor = await User.findOne({
        _id: supervisorId,
        role: 'supervisor',
        isActive: true
      });

      if (!supervisor) {
        return res.status(400).json({ error: 'Invalid supervisor' });
      }

      const staff = await User.findByIdAndUpdate(
        req.params.id,
        { supervisor: supervisorId },
        { new: true }
      );

      res.json(staff);
    } catch (err) {
      res.status(500).json({ error: 'Failed to assign supervisor' });
    }
  }
);



// Update staff profile
router.put('/profile/:id', auth, upload.single('profileImage'), async (req, res) => {
  try {
    const updates = req.body;
    
    if (req.file) {
      updates.profileImage = `/uploads/${req.file.filename}`;
    }

    // Staff can only update their own profile
    if (req.user.role === 'staff' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add qualification
router.post('/qualifications/:id', auth, upload.single('certificate'), async (req, res) => {
  try {
    const { qualification, institution, yearObtained } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    const qual = {
      qualification,
      institution,
      yearObtained,
      certificateFile: req.file ? `/uploads/${req.file.filename}` : null
    };

    user.qualifications.push(qual);
    await user.save();

    res.status(201).json(user.qualifications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
