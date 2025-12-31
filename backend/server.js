const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth.routes');
const staffRoutes = require('./routes/staff.routes');
const leaveRoutes = require('./routes/leave.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const disciplinaryRoutes = require('./routes/disciplinary.routes');
const adminRoutes = require('./routes/admin.routes');
const emailRoutes = require('./routes/email.routes');
const reportRoutes = require('./routes/report.routes');
const auditRoutes = require('./routes/audit.routes');
const departmentRoutes = require('./routes/department.routes');
const noticeRoutes = require('./routes/noticeRoutes');



app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/disciplinary', disciplinaryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/notices', noticeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
