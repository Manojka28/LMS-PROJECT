import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../server/config/db.js';
import Course from '../server/models/Course.js';
import Section from '../server/models/Section.js';
import Lecture from '../server/models/Lecture.js';
import Progress from '../server/models/Progress.js';
import User from '../server/models/User.js';

async function clear() {
  try {
    await connectDB();
    console.log('Clearing courses, sections, lectures, progress, and enrollment refs...');

    await Course.deleteMany({});
    await Section.deleteMany({});
    await Lecture.deleteMany({});
    await Progress.deleteMany({});
    await User.updateMany({}, { $set: { purchasedCourses: [] } });

    console.log('Successfully cleared all course data.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error clearing data:', err);
    process.exit(1);
  }
}

clear();
