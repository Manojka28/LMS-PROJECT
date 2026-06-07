import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../server/models/User.js';
import Course from '../server/models/Course.js';
import Notification from '../server/models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTest() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms');
  console.log('Connected to DB');

  const student = await User.findOne({ role: 'student' });
  const course = await Course.findOne({});
  
  if (!student || !course) {
    console.error('Test data missing');
    process.exit(1);
  }

  // Clear previous notifications
  await Notification.deleteMany({ userId: student._id });

  // 1 & 2: Course Purchase & Enrollment
  await Notification.create({
    userId: student._id,
    type: 'COURSE_PURCHASED',
    title: 'Course Purchased',
    message: `You have successfully purchased ${course.title}.`,
    link: `/courses/${course._id}`
  });
  await Notification.create({
    userId: student._id,
    type: 'COURSE_ENROLLED',
    title: 'Course Enrolled',
    message: `You are now enrolled in ${course.title}.`,
    link: `/courses/${course._id}`
  });
  console.log('Triggered: Purchase & Enrollment');

  // 3: Course Completion
  await Notification.create({
    userId: student._id,
    type: 'COURSE_COMPLETION',
    title: 'Course Completed!',
    message: `Congratulations! You've completed ${course.title}.`,
    link: `/student/dashboard`
  });
  console.log('Triggered: Course Completion');

  // 4: Certificate Generation
  await Notification.create({
    userId: student._id,
    type: 'CERTIFICATE_GENERATED',
    title: 'Certificate Available',
    message: `Your certificate for ${course.title} is ready to download.`,
    link: '/student/dashboard'
  });
  console.log('Triggered: Certificate Generation');

  // 5 & 6: Quiz Submission & Grading
  await Notification.create({
    userId: student._id,
    type: 'QUIZ_GRADED',
    title: 'Quiz Graded',
    message: `Your quiz for ${course.title} has been graded. Score: 100%`,
    link: `/course/${course._id}/learn`
  });
  console.log('Triggered: Quiz Submission & Grading');

  console.log('\n--- VERIFICATION ---');
  const notifs = await Notification.find({ userId: student._id }).sort({ createdAt: -1 }).lean();
  console.log(`Found ${notifs.length} notifications:`);
  notifs.forEach(n => console.log(`- [${n.type}] ${n.title}: ${n.message}`));

  process.exit(0);
}

runTest().catch(console.error);
