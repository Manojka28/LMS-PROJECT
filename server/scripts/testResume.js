import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import ResumeProfile from '../models/ResumeProfile.js';
import { updateProfile, generateResume } from '../controllers/resumeController.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  try {
    const student = await User.findOne({ role: 'student' });
    if (!student) {
      console.log('No student found');
      process.exit(0);
    }

    console.log(`Testing Resume Builder for: ${student.name}`);

    // Mock Express Request for updateProfile
    const mockReqUpdate = {
      user: { _id: student._id },
      body: {
        fullName: student.name,
        email: student.email,
        phone: '123-456-7890',
        summary: 'A highly motivated software engineering student passionate about full-stack development.',
        linkedin: 'linkedin.com/in/student',
        github: 'github.com/student',
        portfolio: 'student.dev',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'CSS'],
        education: [
          { institution: 'IIITL Coding School', degree: 'B.Tech Computer Science', year: '2024', grade: '9.0 CGPA' }
        ],
        projects: [
          { title: 'LMS Platform', description: 'Built a full-stack learning management system using MERN stack.', link: 'github.com/student/lms' }
        ],
        certifications: [
          { title: 'AWS Certified Cloud Practitioner', issuer: 'AWS', year: '2023' }
        ],
        achievements: [
          '1st Place in College Hackathon 2023'
        ]
      }
    };

    let updateResData = null;
    const mockResUpdate = {
      json: (data) => { updateResData = data; return mockResUpdate; },
      status: () => mockResUpdate
    };

    await updateProfile(mockReqUpdate, mockResUpdate);
    console.log('Profile update response:', updateResData.message);

    // Test PDF Generation for all 3 templates
    const templates = ['modern', 'ats', 'professional'];

    for (const template of templates) {
      console.log(`Testing template: ${template}...`);
      
      const outputPath = path.join(__dirname, `../uploads/test_resume_${template}.pdf`);
      const writeStream = fs.createWriteStream(outputPath);

      const mockReqGenerate = {
        user: { _id: student._id },
        query: { template }
      };

      const mockResGenerate = {
        setHeader: () => {},
        status: (code) => { console.log(`Status: ${code}`); return mockResGenerate; },
        json: (data) => { console.log(data); return mockResGenerate; },
        on: writeStream.on.bind(writeStream),
        once: writeStream.once.bind(writeStream),
        emit: writeStream.emit.bind(writeStream),
        write: writeStream.write.bind(writeStream),
        end: writeStream.end.bind(writeStream),
      };

      await generateResume(mockReqGenerate, mockResGenerate);
      console.log(`Generated ${template} template at: ${outputPath}`);
    }

  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    setTimeout(() => mongoose.disconnect(), 2000); // Wait for streams to close
  }
}

runTest();
