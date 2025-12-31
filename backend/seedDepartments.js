// scripts/seedDepartmentsSimple.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Department = require('./models/Department');

dotenv.config();

const departments = [
  {
    name: 'ENVIRONMENT',
    code: 'ENV',
    description: 'Environmental management and sustainability initiatives',
    color: '#10B981',
    isActive: true
  },
  {
    name: 'STORES',
    code: 'STR',
    description: 'Inventory management and stock control',
    color: '#F59E0B',
    isActive: true
  },
  {
    name: 'LOGISTICS',
    code: 'LOG',
    description: 'Transportation and supply chain coordination',
    color: '#3B82F6',
    isActive: true
  },
  {
    name: 'WELLNESS AND PERSONAL GROWTH',
    code: 'WPG',
    description: 'Employee wellness and personal development programs',
    color: '#8B5CF6',
    isActive: true
  },
  {
    name: 'PUBLIC RELATIONS',
    code: 'PR',
    description: 'Media relations and company communications',
    color: '#EC4899',
    isActive: true
  },
  {
    name:  'WELFARE',
    code:  'WLF',
    description:  'Employee welfare and support services',
    color:  '#EF4444',
    isActive:  true
   }
];

async function seedDepartments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Upsert departments (create if doesn't exist, update if exists)
    for (const dept of departments) {
      await Department.findOneAndUpdate(
        { $or: [{ name: dept.name }, { code: dept.code }] },
        dept,
        { upsert: true, new: true }
      );
      console.log(`✅ Department "${dept.name}" seeded`);
    }

    console.log('\n🎉 All departments seeded successfully!');
    console.log('\n📋 Departments available:');
    const allDepts = await Department.find({ isActive: true });
    allDepts.forEach(d => console.log(`  • ${d.name} (${d.code})`));

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDepartments();