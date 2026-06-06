import express from 'express';
import { protect } from '../middleware/auth.js';
import { chat, getHistory, generateNotes, generateQuiz, healthCheck } from '../controllers/aiController.js';

const router = express.Router();

router.get('/health', healthCheck);

// All other AI routes require authentication
router.use(protect);

router.post('/chat', chat);
router.get('/history/:courseId', getHistory);
router.post('/notes', generateNotes);
router.post('/quiz', generateQuiz);

export default router;
