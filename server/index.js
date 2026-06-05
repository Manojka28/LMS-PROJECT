import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

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

import { notFound, errorHandler } from './middleware/errorHandler.js';

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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
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