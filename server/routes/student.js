import express from 'express';
import { protect, attachUser } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getDashboardAnalytics,
  getEnrolledCourses,
  getContinueLearning,
  getQuizStats,
  getAssignmentStats,
  toggleWishlist,
  getWishlist
} from '../controllers/studentController.js';
import { getMyCertificates } from '../controllers/certificateController.js';

const router = express.Router();

router.use(protect, attachUser, authorize('student', 'admin', 'instructor')); // Giving all roles access in case instructors want to see their student view

router.get('/dashboard/analytics', getDashboardAnalytics);
router.get('/courses', getEnrolledCourses);
router.get('/courses/continue', getContinueLearning);
router.get('/certificates', getMyCertificates);
router.get('/quiz-stats', getQuizStats);
router.get('/assignment-stats', getAssignmentStats);
router.get('/wishlist', getWishlist);
router.post('/wishlist/toggle', toggleWishlist);

export default router;
