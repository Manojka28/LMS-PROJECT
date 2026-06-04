import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../server/config/db.js';
import Course from '../server/models/Course.js';
import Section from '../server/models/Section.js';
import Lecture from '../server/models/Lecture.js';

async function clear() {
  try {
    await connectDB();
    console.log('Clearing courses, sections, and lectures...');
    
    await Course.deleteMany({});
    await Section.deleteMany({});
    await Lecture.deleteMany({});
    
    console.log('Successfully cleared all course data.');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing data:', err);
    process.exit(1);
  }
}

clear();
