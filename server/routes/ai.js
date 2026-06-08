import express from 'express';
import { protect } from '../middleware/auth.js';
import { 
  chat, 
  getHistory, 
  generateNotes, 
  generateQuiz, 
  healthCheck,
  saveNote,
  getNotes,
  deleteNote,
  generateNotePdf,
  saveQuiz,
  getQuizzes,
  saveQuizAttempt,
  getQuizAttempts,
  clearChatHistory
} from '../controllers/aiController.js';

const router = express.Router();

router.get('/health', healthCheck);

// All other AI routes require authentication
router.use(protect);

// Chat
router.post('/chat', chat);
router.get('/history/:courseId', getHistory);
router.delete('/history/:courseId', clearChatHistory);

// AI Generation
router.post('/notes', generateNotes);
router.post('/quiz', generateQuiz);

// Notes Management
router.post('/notes/save', saveNote);
router.get('/notes/:courseId', getNotes);
router.delete('/notes/:id', deleteNote);
router.get('/notes/:id/pdf', generateNotePdf);

// Quiz Management
router.post('/quiz/save', saveQuiz);
router.get('/quiz/:courseId', getQuizzes);
router.post('/quiz/attempt', saveQuizAttempt);
router.get('/quiz/attempts/:courseId', getQuizAttempts);

export default router;
