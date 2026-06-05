import express from 'express';
import { protect, attachUser } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getDashboardAnalytics,
  getInstructorCourses,
} from '../controllers/instructorController.js';

const router = express.Router();

router.use(protect, attachUser, authorize('instructor', 'admin'));

router.get('/dashboard/analytics', getDashboardAnalytics);
router.get('/courses', getInstructorCourses);

export default router;
