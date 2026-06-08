import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import * as adminController from '../server/controllers/adminController.js';
import User from '../server/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verify() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms');
  console.log('Connected to DB');

  // We need to bypass auth, so we mock req and res
  const createMockRes = (name) => {
    return {
      status: function(s) { this.statusCode = s; return this; },
      json: function(d) { 
        console.log(`\n--- Response for ${name} ---`);
        console.log(JSON.stringify(d, null, 2).substring(0, 500) + '... (truncated)');
        this.data = d; 
        return this; 
      }
    };
  };

  const mockReq = { 
    user: { role: 'admin', _id: new mongoose.Types.ObjectId() },
    query: {}
  };

  const mockNext = (err) => { console.error('Next called with error:', err); };

  // 1. Analytics
  let resAnalytics = createMockRes('getAnalytics');
  await adminController.getAnalytics(mockReq, resAnalytics, mockNext);

  // 2. Users
  let resUsers = createMockRes('getUsers');
  await adminController.getUsers({ ...mockReq, query: { limit: 50 } }, resUsers, mockNext);

  // 3. Courses
  let resCourses = createMockRes('getCourses');
  await adminController.getCourses({ ...mockReq, query: { limit: 50 } }, resCourses, mockNext);

  // 4. Payments
  let resPayments = createMockRes('getPayments');
  await adminController.getPayments({ ...mockReq, query: { limit: 100 } }, resPayments, mockNext);

  // 5. Instructors
  let resInstructors = createMockRes('getInstructors');
  await adminController.getInstructors(mockReq, resInstructors, mockNext);

  console.log('\n--- SUCCESS: Script completed ---');
  process.exit(0);
}

verify().catch(console.error);
