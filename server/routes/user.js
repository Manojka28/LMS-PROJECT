import express from 'express';
import { protect, attachUser } from '../middleware/auth.js';
import { getMyCourses } from '../controllers/userController.js';

const router = express.Router();

router.get('/my-courses', protect, attachUser, getMyCourses);

export default router;
