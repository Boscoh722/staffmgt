const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const departments = {
  ENVIRONMENT: '692fe87076a789c3f5a4c8fb',
  STORES: '692fe87076a789c3f5a4c8fc',
  LOGISTICS: '692fe87076a789c3f5a4c8fd',
  WELLNESS_AND_PERSONAL_GROWTH: '692fe87076a789c3f5a4c8fe',
  PUBLIC_RELATIONS: '692fe87076a789c3f5a4c8ff',
  WELFARE: '692fe87076a789c3f5a4c900',
};

// Fixed default leave balance to match schema (annual.remaining should be 28 to match total)
const defaultLeave = {
  annual: { total: 28, taken: 0, remaining: 28, pending: 0 },
  maternity: { total: 90, taken: 0, remaining: 90, pending: 0 },
  paternity: { total: 14, taken: 0, remaining: 14, pending: 0 },
  sick: { total: 30, taken: 0, remaining: 30, pending: 0 },
  compassionate: { total: 7, taken: 0, remaining: 7, pending: 0 },
  study: { total: 30, taken: 0, remaining: 30, pending: 0 },
};

const usersData = [
  // Admin user
  { 
    employeeId: '20230000000', 
    firstName: 'Makongeni', 
    lastName: 'Admin', 
    email: 'admin@makongeni.com', 
    password: 'admin16494344', 
    role: 'admin', 
    department: departments.ENVIRONMENT, 
    position: 'System Administrator' 
  },
  // Supervisor
  { 
    employeeId: '20230236536', 
    firstName: 'Boscoh', 
    lastName: 'Otieno', 
    email: 'boscobrilli8@gmail.com', 
    password: '715640443', 
    role: 'supervisor', 
    department: departments.ENVIRONMENT, 
    position: 'Environment Supervisor' 
  },
  // Clerk
  { 
    employeeId: '20230230000', 
    firstName: 'Felix', 
    lastName: 'Sudan', 
    email: 'felix123@gmail.com', 
    password: '703468256', 
    role: 'clerk', 
    department: departments.ENVIRONMENT, 
    position: 'Environment Clerk' 
  },
  // Staff members
  { 
    employeeId: '20230217508', 
    firstName: 'ANN', 
    lastName: 'NJOKI KAGURU', 
    email: 'annekaguru65@gmail.com', 
    password: '713250004', 
    role: 'staff', 
    department: departments.ENVIRONMENT, 
    position: 'Environment Staff' 
  },
  { 
    employeeId: '20230237304', 
    firstName: 'NELLY', 
    lastName: 'CHEPLETING', 
    email: 'chepletingnelly0@gmail.com', 
    password: '724982597', 
    role: 'staff', 
    department: departments.ENVIRONMENT, 
    position: 'Environment Staff' 
  },
  { 
    employeeId: '20230235792', 
    firstName: 'CONSTANCE', 
    lastName: 'MWENDE MUEMA', 
    email: 'conniemwesh17@gmail.com', 
    password: '708384184', 
    role: 'staff', 
    department: departments.ENVIRONMENT, 
    position: 'Environment Staff' 
  },
  { 
    employeeId: '20240194087', 
    firstName: 'SAMUEL', 
    lastName: 'GATHI CHEGE', 
    email: 'gathis160@gmail.com', 
    password: '768342438', 
    role: 'staff', 
    department: departments.ENVIRONMENT, 
    position: 'Environment Staff' 
  },
  { 
    employeeId: '20230239241', 
    firstName: 'LAZARUS', 
    lastName: 'JUMA OJIAMBO', 
    email: 'lazarusjuma8@gmail.com', 
    password: '719293847', 
    role: 'staff', 
    department: departments.ENVIRONMENT, 
    position: 'Environment Staff' 
  },
  { 
    employeeId: '20240126458', 
    firstName: 'STEPHEN', 
    lastName: 'OMUSULA', 
    email: 'omusullah@gmail.com', 
    password: '797276096', 
    role: 'staff', 
    department: departments.ENVIRONMENT, 
    position: 'Environment Staff' 
  },
  { 
    employeeId: '20230235124', 
    firstName: 'TAUSI', 
    lastName: 'OPATI ATEMO', 
    email: 'tausiopati@gmail.com', 
    password: '721516196', 
    role: 'staff', 
    department: departments.ENVIRONMENT, 
    position: 'Environment Staff' 
  },
  { 
    employeeId: '20230231201', 
    firstName: 'PRISCILLA', 
    lastName: 'MUTINDI NGWATU', 
    email: 'tishpriscilla@gmail.com', 
    password: '703705029', 
    role: 'staff', 
    department: departments.ENVIRONMENT, 
    position: 'Environment Staff' 
  },
  { 
    employeeId: '20230257100', 
    firstName: 'WINNIE', 
    lastName: 'IVY OCHIENG', 
    email: 'winnyivy4@gmail.com', 
    password: '114044729', 
    role: 'staff', 
    department: departments.ENVIRONMENT, 
    position: 'Environment Staff' 
  }
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    const currentDate = new Date();
    console.log(`Setting dateOfJoining to: ${currentDate.toDateString()}`);

    // Find or create admin user first
    const adminUser = new User({
      ...usersData[0],
      leaveBalance: defaultLeave,
      supervisor: null, // Admin has no supervisor
      dateOfJoining: currentDate
    });
    await adminUser.save();
    console.log(`Created admin user: ${adminUser.email}`);

    const createdUsers = [adminUser];

    // Create supervisor (Boscoh Otieno)
    const supervisorUser = new User({
      ...usersData[1],
      leaveBalance: defaultLeave,
      supervisor: adminUser._id, // Supervisor reports to admin
      dateOfJoining: currentDate
    });
    await supervisorUser.save();
    createdUsers.push(supervisorUser);
    console.log(`Created supervisor user: ${supervisorUser.email}`);

    // Create all other users (starting from index 2)
    for (let i = 2; i < usersData.length; i++) {
      const userData = usersData[i];
      
      // For staff members in Environment department, assign supervisor
      // All non-admin/supervisor users report to the supervisor
      const supervisorId = supervisorUser._id;

      const user = new User({
        ...userData,
        leaveBalance: defaultLeave,
        supervisor: supervisorId,
        // Add other optional fields with default values
        phoneNumber: userData.password, // Using password as phone number
        isActive: true,
        qualifications: [],
        // Set date of joining to current date
        dateOfJoining: currentDate
      });

      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.email} (${user.role})`);
    }

    console.log(`\n✅ Successfully seeded ${createdUsers.length} users`);
    console.log(`📊 Breakdown:`);
    console.log(`   Admin: ${createdUsers.filter(u => u.role === 'admin').length}`);
    console.log(`   Supervisor: ${createdUsers.filter(u => u.role === 'supervisor').length}`);
    console.log(`   Clerk: ${createdUsers.filter(u => u.role === 'clerk').length}`);
    console.log(`   Staff: ${createdUsers.filter(u => u.role === 'staff').length}`);

    // Display login credentials for testing
    console.log(`\n🔐 Test Login Credentials:`);
    console.log(`   Admin: email: admin@makongeni.com, password: admin16494344`);
    console.log(`   Supervisor: email: boscobrilli8@gmail.com, password: 715640443`);
    console.log(`   Clerk: email: felix123@gmail.com, password: 703468256`);
    console.log(`   Staff: email: annekaguru65@gmail.com, password: 713250004`);
    console.log(`\n📅 All users joined on: ${currentDate.toDateString()}`);

  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

seedUsers();