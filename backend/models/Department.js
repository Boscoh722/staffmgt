const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { 
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  code: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true
  },
  description: { 
    type: String 
  },
  manager: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

departmentSchema.pre('save', function(next) {
  if (!this.code && this.name) {
    const words = this.name.split(' ');
    this.code = words.map(word => word.charAt(0)).join('').toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Department', departmentSchema);
