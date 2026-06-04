import express from 'express';
import { param, body, validationResult } from 'express-validator';
import { protect, attachUser } from '../middleware/auth.js';
import {
  completeLecture,
  updateLastViewed,
  getCourseProgress,
  getAllProgress,
} from '../controllers/progressController.js';

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

router.use(protect, attachUser);

router.get('/', getAllProgress);

router.get(
  '/:courseId',
  param('courseId').isMongoId().withMessage('Invalid course ID'),
  handleValidation,
  getCourseProgress
);

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

export default router;
