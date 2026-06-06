import express from 'express';
import { body, param } from 'express-validator';

import { protect, attachUser, optionalAuth } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { handleValidation } from '../middleware/validate.js';

import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  publishCourse,
  unpublishCourse,
  getCourseReviews,
  addReview,
  updateReview,
  deleteReview,
} from '../controllers/courseController.js';

const router = express.Router();

const lectureRules = [
  body('sections.*.lectures.*.title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Lecture title must be 1–200 characters'),
  body('sections.*.lectures.*.description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Lecture description too long'),
  body('sections.*.lectures.*.videoUrl')
    .trim()
    .notEmpty()
    .isLength({ max: 500 })
    .withMessage('Lecture video URL is required'),
  body('sections.*.lectures.*.duration')
    .isFloat({ min: 0 })
    .withMessage('Lecture duration must be a non-negative number'),
  body('sections.*.lectures.*.resources')
    .optional()
    .isArray()
    .withMessage('Lecture resources must be an array'),
  body('sections.*.lectures.*.resources.*.title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('Resource title must be 1–120 characters'),
  body('sections.*.lectures.*.resources.*.fileUrl')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Resource file URL is required'),
];

const sectionRules = [
  body('sections').optional().isArray().withMessage('Sections must be an array'),
  body('sections.*.title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Section title must be 1–200 characters'),
  ...lectureRules,
];

const createCourseRules = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),
  body('subtitle').optional().trim().isLength({ max: 300 }).withMessage('Subtitle too long'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Description must be 10–10000 characters'),
  body('thumbnail').optional().trim().isLength({ max: 500 }).withMessage('Thumbnail URL too long'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('category').trim().isLength({ min: 2, max: 80 }).withMessage('Category must be 2–80 characters'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'all levels'])
    .withMessage('Level must be beginner, intermediate, advanced, or all levels'),
  body('instructor')
    .optional()
    .isMongoId()
    .withMessage('Instructor must be a valid user ID'),
  ...sectionRules,
];

const updateCourseRules = [
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),
  body('subtitle').optional().trim().isLength({ max: 300 }).withMessage('Subtitle too long'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Description must be 10–10000 characters'),
  body('thumbnail').optional().trim().isLength({ max: 500 }).withMessage('Thumbnail URL too long'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Category must be 2–80 characters'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'all levels'])
    .withMessage('Level must be beginner, intermediate, advanced, or all levels'),
  body('instructor')
    .optional()
    .isMongoId()
    .withMessage('Instructor must be a valid user ID'),
  ...sectionRules,
];

router.post(
  '/',
  protect,
  attachUser,
  authorize('instructor', 'admin'),
  createCourseRules,
  handleValidation,
  createCourse
);

router.get('/', optionalAuth, getCourses);

router.get(
  '/:id',
  optionalAuth,
  param('id').isMongoId().withMessage('Invalid course ID'),
  handleValidation,
  getCourseById
);

router.get('/:id/reviews', getCourseReviews);

router.post('/:id/review', protect, attachUser, addReview);
router.put('/:id/review', protect, attachUser, updateReview);
router.delete('/:id/review', protect, attachUser, deleteReview);

router.put(
  '/:id',
  param('id').isMongoId().withMessage('Invalid course ID'),
  updateCourseRules,
  handleValidation,
  updateCourse
);

router.delete(
  '/:id',
  protect,
  attachUser,
  authorize('instructor', 'admin'),
  param('id').isMongoId().withMessage('Invalid course ID'),
  handleValidation,
  deleteCourse
);

router.post(
  '/:id/enroll',
  protect,
  attachUser,
  param('id').isMongoId().withMessage('Invalid course ID'),
  handleValidation,
  enrollInCourse
);

router.put(
  '/:id/publish',
  protect,
  attachUser,
  authorize('instructor', 'admin'),
  param('id').isMongoId().withMessage('Invalid course ID'),
  handleValidation,
  publishCourse
);

router.put(
  '/:id/unpublish',
  protect,
  attachUser,
  authorize('instructor', 'admin'),
  param('id').isMongoId().withMessage('Invalid course ID'),
  handleValidation,
  unpublishCourse
);

export default router;
