import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../server/config/db.js';
import Course from '../server/models/Course.js';
import Section from '../server/models/Section.js';
import Lecture from '../server/models/Lecture.js';
import User from '../server/models/User.js';
import Progress from '../server/models/Progress.js';

const coursesData = [
  // Original 10
  { title: 'MERN Stack Development', subtitle: 'Become a full-stack developer', description: 'Learn MongoDB, Express, React, and Node.js from scratch to build robust web applications.', category: 'Web Development', level: 'beginner', price: 49.99 },
  { title: 'Data Structures and Algorithms', subtitle: 'Ace your coding interviews', description: 'Master DS and algorithms in JavaScript to crack product-based company interviews.', category: 'Computer Science', level: 'intermediate', price: 59.99 },
  { title: 'React Mastery', subtitle: 'Advanced React techniques', description: 'Deep dive into hooks, state management, and performance optimization.', category: 'Web Development', level: 'advanced', price: 39.99 },
  { title: 'Node.js Backend Development', subtitle: 'Build scalable APIs', description: 'Learn backend architecture, REST APIs, and database integration.', category: 'Backend Development', level: 'intermediate', price: 44.99 },
  { title: 'Java Spring Boot', subtitle: 'Enterprise application development', description: 'Build enterprise-grade web applications using Java and Spring Boot framework.', category: 'Backend Development', level: 'intermediate', price: 54.99 },
  { title: 'System Design', subtitle: 'Design scalable distributed systems', description: 'Learn how to design scalable and reliable systems like Netflix, Uber, and Twitter.', category: 'Backend Development', level: 'advanced', price: 69.99 },
  { title: 'Competitive Programming', subtitle: 'Master problem solving', description: 'Learn advanced algorithms and data structures for competitive programming.', category: 'Competitive Programming', level: 'advanced', price: 29.99 },
  { title: 'Generative AI', subtitle: 'Build LLM powered apps', description: 'Learn prompt engineering, LangChain, and OpenAI API integration.', category: 'Artificial Intelligence', level: 'intermediate', price: 79.99 },
  { title: 'Machine Learning Fundamentals', subtitle: 'Introduction to ML', description: 'Learn Python, Pandas, Scikit-Learn, and the basics of predictive modeling.', category: 'Data Science', level: 'beginner', price: 49.99 },
  { title: 'Database Management Systems', subtitle: 'SQL and NoSQL deep dive', description: 'Learn database design, SQL querying, MongoDB, and Redis.', category: 'Backend Development', level: 'beginner', price: 34.99 },

  // New 20
  { title: 'Python for Data Science', subtitle: 'Master data analysis', description: 'Comprehensive guide to Python for data science, covering Pandas, NumPy, and Matplotlib.', category: 'Data Science', level: 'beginner', price: 45.99 },
  { title: 'Advanced Computer Vision', subtitle: 'Image processing and deep learning', description: 'Learn CNNs, object detection, and image segmentation using PyTorch and OpenCV.', category: 'Artificial Intelligence', level: 'advanced', price: 89.99 },
  { title: 'DevOps Bootcamp', subtitle: 'CI/CD and Infrastructure as Code', description: 'Master Docker, Kubernetes, Jenkins, and Terraform to automate your deployments.', category: 'DevOps', level: 'intermediate', price: 64.99 },
  { title: 'Flutter Mobile Development', subtitle: 'Build cross-platform apps', description: 'Create beautiful, natively compiled applications for mobile from a single codebase.', category: 'Mobile Development', level: 'beginner', price: 49.99 },
  { title: 'iOS Development with Swift', subtitle: 'Build native iOS apps', description: 'Learn Swift and SwiftUI to create stunning iOS applications from scratch.', category: 'Mobile Development', level: 'intermediate', price: 54.99 },
  { title: 'Android App Development', subtitle: 'Kotlin masterclass', description: 'Comprehensive guide to Android development using Kotlin and Jetpack Compose.', category: 'Mobile Development', level: 'beginner', price: 44.99 },
  { title: 'Natural Language Processing', subtitle: 'Text analysis and generation', description: 'Build NLP models for sentiment analysis, translation, and chatbots.', category: 'Artificial Intelligence', level: 'advanced', price: 74.99 },
  { title: 'Cloud Computing with AWS', subtitle: 'AWS Solutions Architect', description: 'Prepare for the AWS certification and learn to architect cloud solutions.', category: 'DevOps', level: 'intermediate', price: 59.99 },
  { title: 'Full Stack Next.js', subtitle: 'Modern React framework', description: 'Build SEO-friendly, server-rendered React applications using Next.js 14.', category: 'Web Development', level: 'intermediate', price: 55.99 },
  { title: 'GraphQL Mastery', subtitle: 'Modern API design', description: 'Learn how to build and consume GraphQL APIs using Apollo and Node.js.', category: 'Backend Development', level: 'intermediate', price: 49.99 },
  { title: 'Data Engineering Pipelines', subtitle: 'ETL and Big Data', description: 'Design robust data pipelines using Apache Spark, Kafka, and Airflow.', category: 'Data Science', level: 'advanced', price: 84.99 },
  { title: 'Vue.js Framework', subtitle: 'Progressive JavaScript framework', description: 'Build interactive web interfaces with Vue 3 and the Composition API.', category: 'Web Development', level: 'beginner', price: 39.99 },
  { title: 'Go Programming Language', subtitle: 'High-performance backend', description: 'Learn Golang for building scalable and concurrent backend services.', category: 'Backend Development', level: 'intermediate', price: 49.99 },
  { title: 'Reinforcement Learning', subtitle: 'AI that learns by doing', description: 'Deep dive into RL algorithms like Q-learning, PPO, and Deep Q Networks.', category: 'Artificial Intelligence', level: 'advanced', price: 94.99 },
  { title: 'Microservices Architecture', subtitle: 'Scalable distributed systems', description: 'Design, build, and deploy microservices using Spring Boot and Docker.', category: 'Backend Development', level: 'advanced', price: 79.99 },
  { title: 'React Native for Mobile', subtitle: 'Cross-platform mobile apps', description: 'Use your React knowledge to build native mobile apps for iOS and Android.', category: 'Mobile Development', level: 'intermediate', price: 59.99 },
  { title: 'Competitive Math and Logic', subtitle: 'Foundation for CP', description: 'Number theory, combinatorics, and discrete math for competitive programming.', category: 'Competitive Programming', level: 'intermediate', price: 34.99 },
  { title: 'Deep Learning Specialization', subtitle: 'Neural Networks from scratch', description: 'Understand the math and intuition behind deep neural networks.', category: 'Artificial Intelligence', level: 'intermediate', price: 69.99 },
  { title: 'Cybersecurity Fundamentals', subtitle: 'Protect your applications', description: 'Learn ethical hacking, penetration testing, and securing web applications.', category: 'DevOps', level: 'beginner', price: 49.99 },
  { title: 'Advanced Graph Algorithms', subtitle: 'Master complex data structures', description: 'Learn shortest paths, network flow, and advanced graph traversals.', category: 'Competitive Programming', level: 'advanced', price: 54.99 }
];

async function seed() {
  try {
    await connectDB();

    let instructor = await User.findOne({ role: 'instructor' }).sort({ createdAt: 1 });
    
    if (instructor) {
      console.log(`Found existing instructor: ${instructor.email}. Assigning seeded courses to this account.`);
    } else {
      console.log('No instructor found. Creating a default instructor...');
      instructor = await User.create({
        name: 'Seed Instructor',
        email: 'instructor@seed.com',
        password: 'password123',
        role: 'instructor'
      });
    }

    console.log('Clearing existing courses, sections, lectures, and progress for force reseed...');
    await Course.deleteMany({});
    await Section.deleteMany({});
    await Lecture.deleteMany({});
    await Progress.deleteMany({});

    console.log('Inserting courses...');
    let addedCount = 0;

    const coursesToInsert = [];
    const sectionsToInsert = [];
    const lecturesToInsert = [];

    for (const cData of coursesData) {
      const courseId = new mongoose.Types.ObjectId();

      const randomPriceModifier = (Math.random() * 10 - 5);
      let finalPrice = Math.max(9.99, cData.price + randomPriceModifier);
      finalPrice = Math.round(finalPrice * 100) / 100;

      const isPublished = Math.random() > 0.2;

      const levels = ['beginner', 'intermediate', 'advanced', 'all levels'];
      let finalLevel = cData.level;
      if (Math.random() > 0.7) {
        finalLevel = levels[Math.floor(Math.random() * levels.length)];
      }

      // Curriculum Generator
      const generateCurriculum = (title) => {
        if (title === 'Database Management Systems') {
          return [
            { title: 'Section 1', lectures: ['Introduction to DBMS', 'ER Models', 'Relational Model', 'Keys and Constraints', 'SQL Basics'] },
            { title: 'Section 2', lectures: ['Normalization', 'Joins', 'Transactions', 'Indexing', 'Views'] },
            { title: 'Section 3', lectures: ['Query Optimization', 'Stored Procedures', 'Triggers', 'NoSQL Introduction', 'Project'] }
          ];
        }
        if (title.includes('MERN')) {
          return [
            { title: 'Frontend (React)', lectures: ['Intro to React', 'JSX & Components', 'State & Hooks', 'React Router', 'Frontend Project'] },
            { title: 'Backend (Node & Express)', lectures: ['Intro to Node', 'Express Basics', 'REST APIs', 'Middleware', 'Backend Project'] },
            { title: 'Database & Integration', lectures: ['MongoDB Basics', 'Mongoose Models', 'Connecting React to API', 'Authentication (JWT)', 'Deployment'] }
          ];
        }
        if (title.includes('Data Structures')) {
          return [
            { title: 'Basic Structures', lectures: ['Arrays & Strings', 'Linked Lists', 'Stacks & Queues', 'Time Complexity (Big O)', 'Space Complexity'] },
            { title: 'Trees & Graphs', lectures: ['Binary Trees', 'Binary Search Trees', 'Graph Representations', 'BFS & DFS', 'Advanced Graphs'] },
            { title: 'Algorithms', lectures: ['Sorting Algorithms', 'Searching Algorithms', 'Dynamic Programming', 'Greedy Algorithms', 'Interview Practice'] }
          ];
        }
        // Fallback generic but topic-aware curriculum
        const topic = title.split(' ')[0] || 'Topic';
        return [
          {
            title: `Introduction to ${topic}`,
            lectures: [`What is ${title}?`, `Setting up your environment for ${topic}`, `${topic} Architecture`, 'Core Concepts', 'First Steps & Hello World']
          },
          {
            title: `Intermediate ${topic}`,
            lectures: ['Deep dive into core features', 'Best practices and design patterns', 'Handling errors and edge cases', `Working with data in ${topic}`, `Intermediate ${topic} Project`]
          },
          {
            title: `Advanced ${topic}`,
            lectures: ['Advanced architectural patterns', 'Performance optimization', 'Security considerations', 'Scaling and Deployment', 'Final Course Project']
          }
        ];
      };

      const curriculum = generateCurriculum(cData.title);
      
      const educationalVideos = [
        'https://www.youtube.com/watch?v=F3zIbskRma8',
        'https://www.youtube.com/watch?v=1SnPKhCdlsU',
        'https://www.youtube.com/watch?v=yfoY53QXEnI',
        'https://www.youtube.com/watch?v=NW1RIV9L4yQ',
        'https://www.youtube.com/watch?v=zQnKQG7I1nI',
        'https://www.youtube.com/watch?v=t2CEgPsws3U',
        'https://www.youtube.com/watch?v=pKd0Rpw7O48'
      ];

      const courseSectionIds = [];

      for (const [sIndex, sec] of curriculum.entries()) {
        const sectionId = new mongoose.Types.ObjectId();
        const sectionLectureIds = [];

        for (const [lIndex, lecTitle] of sec.lectures.entries()) {
          const lectureId = new mongoose.Types.ObjectId();
          const videoUrl = educationalVideos[(sIndex * 5 + lIndex) % educationalVideos.length];
          const duration = Math.floor(Math.random() * 20) + 10; // 10 to 30 mins
          
          lecturesToInsert.push({
            _id: lectureId,
            title: lecTitle,
            videoUrl: videoUrl,
            duration: duration,
          });
          
          sectionLectureIds.push(lectureId);
        }

        sectionsToInsert.push({
          _id: sectionId,
          title: sec.title,
          course: courseId,
          lectures: sectionLectureIds,
        });

        courseSectionIds.push(sectionId);
      }

      coursesToInsert.push({
        ...cData,
        _id: courseId,
        price: finalPrice,
        level: finalLevel,
        instructor: instructor._id,
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f868dfd4d?q=80&w=800&auto=format&fit=crop',
        isPublished: isPublished,
        sections: courseSectionIds,
      });

      addedCount++;
    }

    console.log(`Inserting ${lecturesToInsert.length} lectures...`);
    await Lecture.insertMany(lecturesToInsert);
    
    console.log(`Inserting ${sectionsToInsert.length} sections...`);
    await Section.insertMany(sectionsToInsert);
    
    console.log(`Inserting ${coursesToInsert.length} courses...`);
    await Course.insertMany(coursesToInsert);

    // Recreate progress records for the specific test student
    let progressCount = 0;
    const student = await User.findOne({ email: 'student@test.com' });
    
    if (student) {
      // Clear out old broken refs for all users just in case
      await User.updateMany({}, { $set: { purchasedCourses: [] } });
      student.purchasedCourses = [];
      
      const coursesToEnroll = coursesToInsert.slice(0, 5);
      for (const c of coursesToEnroll) {
        student.purchasedCourses.push(c._id);
        
        // Add student to the actual DB course record
        await Course.findByIdAndUpdate(c._id, { $push: { enrolledStudents: student._id } });
        
        await Progress.create({
          user: student._id,
          course: c._id,
          completionPercentage: 0,
          completedLectures: []
        });
        progressCount++;
      }
      await student.save();
      console.log(`Enrolled student@test.com into ${progressCount} courses`);
    } else {
      console.log('Test student student@test.com not found, skipped enrollment.');
    }

    console.log(`Successfully seeded ${addedCount} new courses from scratch.`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seed();
