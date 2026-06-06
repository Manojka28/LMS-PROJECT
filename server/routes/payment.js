import express from 'express';
import { protect, attachUser } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  createOrder,
  devPurchase,
  verifyPayment,
  getPurchaseHistory,
  getPaymentMode
} from '../controllers/paymentController.js';

const router = express.Router();

// Informational — no auth needed
router.get('/mode', getPaymentMode);

// All other payment routes require auth + student role
router.use(protect, attachUser);

router.post('/create-order', authorize('student'), createOrder);
router.post('/dev-purchase', authorize('student'), devPurchase);   // DEV MODE only
router.post('/verify', authorize('student'), verifyPayment);
router.get('/history', authorize('student'), getPurchaseHistory);

export default router;
