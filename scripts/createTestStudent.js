import 'dotenv/config';
import { connectDB } from '../server/config/db.js';
import Course from '../server/models/Course.js';
import User from '../server/models/User.js';
import Progress from '../server/models/Progress.js';

async function createTestStudent() {
  try {
    await connectDB();

    const email = 'student@test.com';
    let student = await User.findOne({ email });
    
    if (!student) {
      console.log(`Creating test student account: ${email}`);
      student = await User.create({
        name: 'Test Student',
        email: email,
        password: 'password123',
        role: 'student'
      });
    } else {
      console.log(`Test student account ${email} already exists.`);
    }

    const courses = await Course.find({ isPublished: true }).limit(5);

    if (courses.length === 0) {
      console.log('No published courses available to enroll.');
      process.exit(0);
    }

    let enrolledCount = 0;

    for (const course of courses) {
      const alreadyEnrolled = student.purchasedCourses.includes(course._id);
      
      if (!alreadyEnrolled) {
        student.purchasedCourses.push(course._id);
        
        if (!course.enrolledStudents.includes(student._id)) {
          course.enrolledStudents.push(student._id);
          if (course.enrolledCount !== undefined) {
             course.enrolledCount += 1;
          }
          await course.save();
        }

        // Create Progress document so it appears in the Student Dashboard
        const existingProgress = await Progress.findOne({ user: student._id, course: course._id });
        if (!existingProgress) {
          await Progress.create({
            user: student._id,
            course: course._id,
            completionPercentage: 0,
            completedLectures: []
          });
        }
        
        enrolledCount++;
      }
    }

    await student.save();

    console.log(`Student Email: ${student.email}`);
    console.log(`Newly Enrolled Course Count: ${enrolledCount}`);
    console.log(`Total Purchased Courses for Student: ${student.purchasedCourses.length}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating test student:', err);
    process.exit(1);
  }
}

createTestStudent();
