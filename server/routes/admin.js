import express from 'express';
import { protect, attachUser } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getAnalytics,
  getUsers,
  updateUserStatus,
  deleteUser,
  getCourses,
  updateCourseStatus,
  deleteCourse,
  getPayments,
  getInstructors,
  exportCSV
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, attachUser, authorize('admin'));

// Analytics
router.get('/analytics', getAnalytics);

// User management
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Course management
router.get('/courses', getCourses);
router.patch('/courses/:id/publish', updateCourseStatus);
router.delete('/courses/:id', deleteCourse);

// Payment management
router.get('/payments', getPayments);

// Instructor management
router.get('/instructors', getInstructors);

// CSV Export
router.get('/export/:type', exportCSV);

export default router;
