import express from 'express';
import { protect, attachUser } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { 
  generateCertificate, 
  getStudentCertificates, 
  getCertificate, 
  downloadCertificate,
  verifyCertificate,
  revokeCertificate,
  getInstructorCertificateAnalytics
} from '../controllers/certificateController.js';

const router = express.Router();

// Public route for verifying certificates via QR Code or URL
router.get('/verify/:token', verifyCertificate);

// Protected routes
router.use(protect, attachUser);

// Student routes
router.post('/generate/:courseId', authorize('student'), generateCertificate);
router.get('/', authorize('student'), getStudentCertificates);
router.get('/:courseId/download', authorize('student'), downloadCertificate);
router.get('/:courseId', authorize('student'), getCertificate);

// Instructor / Admin routes
router.post('/revoke', authorize('instructor', 'admin'), revokeCertificate);
router.get('/instructor/analytics', authorize('instructor', 'admin'), getInstructorCertificateAnalytics);

export default router;
