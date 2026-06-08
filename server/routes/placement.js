import express from 'express';
import { protect, roleProtect } from '../middleware/auth.js';
import {
  getProfile,
  startInterview,
  submitAnswer,
  endInterview,
  getPastInterviews,
  getReport,
  getSessionState
} from '../controllers/placementController.js';

const router = express.Router();

router.use(protect, roleProtect('student'));

router.get('/profile', getProfile);
router.post('/interview/start', startInterview);
router.post('/interview/answer', submitAnswer);
router.post('/interview/end', endInterview);
router.get('/interview/session/:sessionId', getSessionState);
router.get('/interviews', getPastInterviews);
router.get('/report/:sessionId', getReport);

export default router;
