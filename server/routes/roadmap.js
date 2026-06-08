import express from 'express';
import { protect, roleProtect } from '../middleware/auth.js';
import { 
  generateRoadmap, 
  getStudentRoadmap, 
  completeTask, 
  getAICoachReview,
  deleteRoadmap
} from '../controllers/roadmapController.js';

const router = express.Router();

router.use(protect, roleProtect('student'));

router.post('/generate', generateRoadmap);
router.get('/', getStudentRoadmap);
router.post('/task/complete', completeTask);
router.get('/coach-review', getAICoachReview);
router.delete('/', deleteRoadmap);

export default router;
