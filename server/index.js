import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { getJwtSecret } from './config/jwt.js';

import authRoutes from './routes/auth.js';
import contactRoutes from './routes/contact.js';
import courseRoutes from './routes/course.js';
import healthRoutes from './routes/health.js';
import userRoutes from './routes/user.js';
import progressRoutes from './routes/progress.js';
import instructorRoutes from './routes/instructor.js';
import studentRoutes from './routes/student.js';
import certificateRoutes from './routes/certificate.js';
import quizRoutes from './routes/quiz.js';
import assignmentRoutes from './routes/assignment.js';
import paymentRoutes from './routes/payment.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import discussionRoutes from './routes/discussion.js';
import notificationRoutes from './routes/notification.js';

import { notFound, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('INSTRUCTOR ROUTES LOADED');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

const isDev = process.env.NODE_ENV?.trim() === 'development';

const authLimiter = rateLimit({
  windowMs: isDev ? 1 * 60 * 1000 : 15 * 60 * 1000,
  max: isDev ? 1000 : 30,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
});

app.use('/api/contact', contactLimiter);

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/user', userRoutes);
app.use('/api/progress', progressRoutes);

app.use('/api/instructor', instructorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/certificate', certificateRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/assignment', assignmentRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/discussion', discussionRoutes);
app.use('/api/notification', notificationRoutes);
console.log('INSTRUCTOR ROUTE MOUNTED');

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    getJwtSecret();
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.error('Start MongoDB or set MONGODB_URI in .env');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

start();