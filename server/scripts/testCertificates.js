import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import Section from '../models/Section.js';
import Certificate from '../models/Certificate.js';
import QuizAttempt from '../models/QuizAttempt.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import { generateCertificate } from '../controllers/certificateController.js';

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  try {
    const student = await User.findOne({ role: 'student' });
    const course = await Course.findOne().populate('instructor');

    if (!student || !course) {
      console.log('Need a student and course to test.');
      process.exit(0);
    }

    console.log(`Testing with Student: ${student.name}, Course: ${course.title}`);

    // Clean up old cert
    await Certificate.deleteMany({ userId: student._id, courseId: course._id });
    
    // Create completed progress
    let progress = await Progress.findOne({ user: student._id, course: course._id });
    if (!progress) {
      progress = await Progress.create({
        user: student._id,
        course: course._id,
        completedLectures: [],
        completionPercentage: 100,
        completed: true
      });
    }

    // Pass quizzes
    await QuizAttempt.updateMany({ student: student._id, course: course._id }, { isPassed: true });

    // Submit assignments
    await AssignmentSubmission.updateMany({ student: student._id, course: course._id }, { status: 'Reviewed', marks: 100 });

    // Mock Express req/res
    const req = {
      user: { id: student._id, name: student.name },
      params: { courseId: course._id }
    };

    let status = 200;
    let responseData = null;

    const res = {
      status: (code) => {
        status = code;
        return res;
      },
      json: (data) => {
        responseData = data;
        return res;
      }
    };

    await generateCertificate(req, res);

    console.log(`Response Status: ${status}`);
    console.log(`Response Data:`, responseData);

    if (responseData && responseData.success) {
      console.log('Certificate generated successfully!');
      console.log(`PDF URL: ${responseData.certificate.pdfUrl}`);
    } else {
      console.log('Failed to generate certificate:', responseData.message);
    }

  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    mongoose.disconnect();
  }
}

runTest();
