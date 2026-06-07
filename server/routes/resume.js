import express from 'express';
import { protect, roleProtect } from '../middleware/auth.js';
import { getProfile, updateProfile, generateResume } from '../controllers/resumeController.js';

const router = express.Router();

router.use(protect, roleProtect('student'));

router.get('/', getProfile);
router.put('/', updateProfile);
router.get('/generate', generateResume);
router.post('/download', generateResume);

export default router;
