import mongoose from 'mongoose';
import Course from './server/models/Course.js';
import Progress from './server/models/Progress.js';
import User from './server/models/User.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const course = await Course.findOne();
  console.log('Found course:', course.title, course._id);

  const progresses = await Progress.find({ course: course._id })
    .populate('user', 'name email')
    .lean();
  
  console.log('Found progresses:', progresses.length);
  const students = progresses.map(p => ({
    _id: p.user?._id,
    name: p.user?.name || 'Unknown User',
    email: p.user?.email || 'Unknown Email',
    completionPercentage: p.completionPercentage || 0,
    completedLectures: p.completedLectures?.length || 0,
    enrollmentDate: p.createdAt
  }));
  console.log('Mapped students:', students);

  process.exit(0);
}

test().catch(console.error);
