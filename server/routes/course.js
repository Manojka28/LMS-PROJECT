import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { protect, attachUser } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollInCourse,
} from '../controllers/courseController.js';

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
}

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
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Lecture video URL is required'),
  body('sections.*.lectures.*.duration')
    .optional()
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
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
  body('totalReviews')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total reviews must be a non-negative integer'),
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

router.get('/', getCourses);

router.get('/:id', param('id').isMongoId().withMessage('Invalid course ID'), handleValidation, getCourseById);

router.put(
  '/:id',
  protect,
  attachUser,
  param('id').isMongoId().withMessage('Invalid course ID'),
  updateCourseRules,
  handleValidation,
  updateCourse
);

router.delete(
  '/:id',
  protect,
  attachUser,
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

export default router;
