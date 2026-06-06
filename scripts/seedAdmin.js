/**
 * Seed Admin User
 * Run: node scripts/seedAdmin.js
 * Creates admin@lms.dev with role=admin if it doesn't already exist.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../server/models/User.js';

const MONGO_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = 'admin@lms.dev';
const ADMIN_PASSWORD = 'Admin@1234';
const ADMIN_NAME = 'LMS Admin';

async function seedAdmin() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      existing.isActive = true;
      await existing.save();
      console.log(`✓ Existing user promoted to admin: ${ADMIN_EMAIL}`);
    } else {
      console.log(`✓ Admin already exists: ${ADMIN_EMAIL}`);
    }
  } else {
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      isActive: true
    });
    console.log(`✓ Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seedAdmin().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
