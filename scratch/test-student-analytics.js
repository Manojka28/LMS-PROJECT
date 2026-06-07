import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import * as studentController from '../server/controllers/studentController.js';
import User from '../server/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verify() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms');
  console.log('Connected to DB');

  const student = await User.findOne({ role: 'student' });
  if (!student) throw new Error('No student found');

  const createMockRes = (name) => {
    return {
      status: function(s) { this.statusCode = s; return this; },
      json: function(d) { 
        console.log(`\n--- Response for ${name} ---`);
        console.log(`Weekly Progress Length: ${d.analytics.weeklyProgress.length}`);
        console.log(`Monthly Progress Length: ${d.analytics.monthlyProgress?.length || 'MISSING'}`);
        console.log(`Sample Monthly Data:`, d.analytics.monthlyProgress?.slice(0, 3));
        this.data = d; 
        return this; 
      }
    };
  };

  const mockReq = { user: { _id: student._id } };
  const mockNext = (err) => { console.error('Next called with error:', err); };

  console.log(`Fetching Dashboard Analytics for student: ${student.email}`);
  let resAnalytics = createMockRes('getDashboardAnalytics');
  await studentController.getDashboardAnalytics(mockReq, resAnalytics, mockNext);

  console.log('\n--- SUCCESS ---');
  process.exit(0);
}

verify().catch(console.error);
