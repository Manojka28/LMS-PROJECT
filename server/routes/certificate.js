import express from 'express';
import { protect, attachUser } from '../middleware/auth.js';
import { getMyCertificates, downloadCertificate } from '../controllers/certificateController.js';

const router = express.Router();

router.use(protect, attachUser);

router.get('/', getMyCertificates);
router.get('/:courseId/download', downloadCertificate);

export default router;
