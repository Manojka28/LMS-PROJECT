import express from 'express';
import { protect, roleProtect } from '../middleware/auth.js';
import { getCourseIntelligence, runAIAudit } from '../controllers/intelligenceController.js';

const router = express.Router();

router.use(protect, roleProtect('instructor'));

router.get('/course/:courseId', getCourseIntelligence);
router.post('/course/:courseId/audit', runAIAudit);

export default router;
