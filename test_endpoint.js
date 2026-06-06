import mongoose from 'mongoose';
import Course from './server/models/Course.js';
import Progress from './server/models/Progress.js';
import User from './server/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // get an instructor
  const instructor = await User.findOne({ role: 'instructor' });
  if (!instructor) {
    console.log('No instructor found');
    process.exit(1);
  }
  console.log('Instructor:', instructor.email);

  // get a course
  const course = await Course.findOne({ instructor: instructor._id });
  if (!course) {
    console.log('No course found');
    process.exit(1);
  }
  console.log('Course ID:', course._id);

  // find progresses
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
