import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import * as intelligenceController from '../server/controllers/intelligenceController.js';
import Course from '../server/models/Course.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verify() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms');
  console.log('Connected to DB');

  // Find a course to test
  const course = await Course.findOne({});
  if (!course) throw new Error('No course found to audit');

  const createMockRes = (name) => {
    return {
      status: function(s) { this.statusCode = s; return this; },
      json: function(d) { 
        console.log(`\n--- Response for ${name} ---`);
        console.log(JSON.stringify(d, null, 2).substring(0, 1000) + '... (truncated)');
        this.data = d; 
        return this; 
      }
    };
  };

  const mockReq = { 
    user: { id: course.instructor },
    params: { courseId: course._id }
  };
  
  console.log(`Running AI Audit for course: ${course.title}...`);
  let resAudit = createMockRes('runAIAudit');
  await intelligenceController.runAIAudit(mockReq, resAudit);

  console.log(`\nFetching Intelligence Data...`);
  let resGet = createMockRes('getCourseIntelligence');
  await intelligenceController.getCourseIntelligence(mockReq, resGet);

  console.log('\n--- SUCCESS ---');
  process.exit(0);
}

verify().catch(console.error);
