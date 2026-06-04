import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../server/config/db.js';
import Course from '../server/models/Course.js';
import Section from '../server/models/Section.js';
import Lecture from '../server/models/Lecture.js';
import User from '../server/models/User.js';

const coursesData = [
  {
    title: 'MERN Stack Development',
    subtitle: 'Become a full-stack developer',
    description: 'Learn MongoDB, Express, React, and Node.js from scratch to build robust web applications.',
    category: 'Web Development',
    level: 'beginner',
    price: 49.99,
  },
  {
    title: 'Data Structures and Algorithms',
    subtitle: 'Ace your coding interviews',
    description: 'Master DS and algorithms in JavaScript to crack product-based company interviews.',
    category: 'Computer Science',
    level: 'intermediate',
    price: 59.99,
  },
  {
    title: 'React Mastery',
    subtitle: 'Advanced React techniques',
    description: 'Deep dive into hooks, state management, and performance optimization.',
    category: 'Frontend Development',
    level: 'advanced',
    price: 39.99,
  },
  {
    title: 'Node.js Backend Development',
    subtitle: 'Build scalable APIs',
    description: 'Learn backend architecture, REST APIs, and database integration.',
    category: 'Backend Development',
    level: 'intermediate',
    price: 44.99,
  },
  {
    title: 'Java Spring Boot',
    subtitle: 'Enterprise application development',
    description: 'Build enterprise-grade web applications using Java and Spring Boot framework.',
    category: 'Backend Development',
    level: 'intermediate',
    price: 54.99,
  },
  {
    title: 'System Design',
    subtitle: 'Design scalable distributed systems',
    description: 'Learn how to design scalable and reliable systems like Netflix, Uber, and Twitter.',
    category: 'Software Engineering',
    level: 'advanced',
    price: 69.99,
  },
  {
    title: 'Competitive Programming',
    subtitle: 'Master problem solving',
    description: 'Learn advanced algorithms and data structures for competitive programming.',
    category: 'Computer Science',
    level: 'advanced',
    price: 29.99,
  },
  {
    title: 'Generative AI',
    subtitle: 'Build LLM powered apps',
    description: 'Learn prompt engineering, LangChain, and OpenAI API integration.',
    category: 'Artificial Intelligence',
    level: 'intermediate',
    price: 79.99,
  },
  {
    title: 'Machine Learning Fundamentals',
    subtitle: 'Introduction to ML',
    description: 'Learn Python, Pandas, Scikit-Learn, and the basics of predictive modeling.',
    category: 'Data Science',
    level: 'beginner',
    price: 49.99,
  },
  {
    title: 'Database Management Systems',
    subtitle: 'SQL and NoSQL deep dive',
    description: 'Learn database design, SQL querying, MongoDB, and Redis.',
    category: 'Computer Science',
    level: 'beginner',
    price: 34.99,
  },
];

async function seed() {
  try {
    await connectDB();

    let instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      console.log('No instructor found. Creating a default instructor...');
      instructor = await User.create({
        name: 'Seed Instructor',
        email: 'instructor@seed.com',
        password: 'password123', // Will be hashed by pre-save hook
        role: 'instructor'
      });
    }

    console.log('Inserting courses...');
    for (const cData of coursesData) {
      const course = new Course({
        ...cData,
        instructor: instructor._id,
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f868dfd4d?q=80&w=800&auto=format&fit=crop',
      });
      await course.save();

      const lecture = new Lecture({
        title: `Introduction to ${cData.title}`,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: 15,
      });
      await lecture.save();

      const section = new Section({
        title: 'Getting Started',
        course: course._id,
        lectures: [lecture._id],
      });
      await section.save();

      course.sections.push(section._id);
      await course.save();
    }

    console.log('Successfully seeded 10 courses with sections and lectures.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seed();
