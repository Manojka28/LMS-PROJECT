import express from 'express';
import { protect, attachUser } from '../middleware/auth.js';
import {
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  getQuizResults
} from '../controllers/quizController.js';

const router = express.Router();

router.use(protect, attachUser);


router.post('/', createQuiz);

// Put specific routes BEFORE parameterized routes to avoid shadowing!
router.post('/:quizId/submit', submitQuiz);
router.get('/results/:quizId', getQuizResults);

router.get('/:lectureId', getQuiz);
router.put('/:quizId', updateQuiz);
router.delete('/:quizId', deleteQuiz);

export default router;
