const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'supervisor', 'staff', 'clerk'], default: 'staff' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  position: { type: String, required: true },
  dateOfJoining: { type: Date, default: Date.now },
  phoneNumber: String,
  address: String,
  profileImage: String,
  isActive: { type: Boolean, default: true },
  supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' , default: null },

  qualifications: [
    {
      qualification: String,
      institution: String,
      yearObtained: Number,
      certificateFile: String
    }
  ],

  leaveBalance: {
    annual: { total: { type: Number, default: 21 }, taken: { type: Number, default: 0 }, remaining: { type: Number, default: 21 }, pending: { type: Number, default: 0 } },
    maternity: { total: { type: Number, default: 90 }, taken: { type: Number, default: 0 }, remaining: { type: Number, default: 90 }, pending: { type: Number, default: 0 } },
    paternity: { total: { type: Number, default: 14 }, taken: { type: Number, default: 0 }, remaining: { type: Number, default: 14 }, pending: { type: Number, default: 0 } },
    sick: { total: { type: Number, default: 30 }, taken: { type: Number, default: 0 }, remaining: { type: Number, default: 30 }, pending: { type: Number, default: 0 } },
    compassionate: { total: { type: Number, default: 7 }, taken: { type: Number, default: 0 }, remaining: { type: Number, default: 7 }, pending: { type: Number, default: 0 } },
    study: { total: { type: Number, default: 30 }, taken: { type: Number, default: 0 }, remaining: { type: Number, default: 30 }, pending: { type: Number, default: 0 } }
  }

}, { timestamps: true });

// 🔐 Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔐 Compare password
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
