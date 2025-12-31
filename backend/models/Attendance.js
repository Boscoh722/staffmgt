const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'off-duty', 'leave', 'late'],
    required: true
  },
  checkInTime: Date,
  checkOutTime: Date,
  hoursWorked: Number,
  remarks: String,
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: String,
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: [Number]
  }
}, { timestamps: true });

attendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
