import express from 'express';
import { protect, attachUser } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getDashboardAnalytics,
  getInstructorCourses,
  getCourseStudents,
  getCourseReviewsForInstructor,
  getCourseQuizAnalytics,
  getCourseAssignmentAnalytics,
} from '../controllers/instructorController.js';

const router = express.Router();

router.use(protect, attachUser, authorize('instructor', 'admin'));

router.get('/dashboard/analytics', getDashboardAnalytics);
router.get('/courses', getInstructorCourses);
router.get('/course/:courseId/students', getCourseStudents);
router.get('/course/:courseId/reviews', getCourseReviewsForInstructor);
router.get('/course/:courseId/quizzes/analytics', getCourseQuizAnalytics);
router.get('/course/:courseId/assignments/analytics', getCourseAssignmentAnalytics);

export default router;
