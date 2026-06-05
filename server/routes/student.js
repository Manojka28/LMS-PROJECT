import express from 'express';
import { protect, attachUser } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getDashboardAnalytics,
  getEnrolledCourses,
  getContinueLearning
} from '../controllers/studentController.js';

const router = express.Router();

router.use(protect, attachUser, authorize('student', 'admin', 'instructor')); // Giving all roles access in case instructors want to see their student view

router.get('/dashboard/analytics', getDashboardAnalytics);
router.get('/courses/continue', getContinueLearning);
router.get('/courses', getEnrolledCourses);

export default router;
