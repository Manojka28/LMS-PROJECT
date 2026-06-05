import express from 'express';
import { param, body } from 'express-validator';
import { protect, attachUser } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';
import {
  completeLecture,
  updateLastViewed,
  getCourseProgress,
  getAllProgress,
} from '../controllers/progressController.js';

const router = express.Router();

router.use(protect, attachUser);

router.get('/', getAllProgress);

router.post(
  '/complete-lecture',
  body('courseId').isMongoId().withMessage('Invalid course ID'),
  body('lectureId').isMongoId().withMessage('Invalid lecture ID'),
  handleValidation,
  completeLecture
);

router.post(
  '/update-last-viewed',
  body('courseId').isMongoId().withMessage('Invalid course ID'),
  body('lectureId').isMongoId().withMessage('Invalid lecture ID'),
  handleValidation,
  updateLastViewed
);

router.get(
  '/:courseId',
  param('courseId').isMongoId().withMessage('Invalid course ID'),
  handleValidation,
  getCourseProgress
);

export default router;
