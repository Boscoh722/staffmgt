const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Department = require('../models/Department');
const User = require('../models/User');

router.get('/', auth, authorize('admin', 'supervisor', 'clerk'), async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const departments = await Department.find(query)
      .populate('manager', 'firstName lastName email')
      .sort({ name: 1 });

    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/options', auth, authorize('admin', 'supervisor', 'clerk'), async (req, res) => {
  try {
    const departments = await Department.find({})
      .select('_id name code')
      .sort({ name: 1 });

    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, authorize('admin', 'supervisor', 'clerk'), async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('manager', 'firstName lastName email');

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const staffCount = await User.countDocuments({
      department: req.params.id,
      isActive: true
    });

    res.json({
      ...department.toObject(),
      staffCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const department = new Department(req.body);
    await department.save();

    const populatedDept = await Department.findById(department._id)
      .populate('manager', 'firstName lastName email');

    res.status(201).json(populatedDept);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Department name or code already exists' });
    }
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('manager', 'firstName lastName email');

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(department);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Department name or code already exists' });
    }
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const activeStaffCount = await User.countDocuments({
      department: req.params.id,
      isActive: true
    });

    if (activeStaffCount > 0) {
      return res.status(400).json({
        error: `Cannot delete department with ${activeStaffCount} active staff members.`
      });
    }

    const removed = await Department.findByIdAndDelete(req.params.id);

    if (!removed) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/staff', auth, authorize('admin', 'supervisor', 'clerk'), async (req, res) => {
  try {
    const staff = await User.find({
      department: req.params.id,
      isActive: true
    })
      .select('-password')
      .populate('supervisor', 'firstName lastName')
      .sort('firstName');

    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
