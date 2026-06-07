import express from 'express';
import { protect, roleProtect } from '../middleware/auth.js';
import {
  createOrder,
  verifyPayment,
  getPurchaseHistory,
  getInstructorRevenue,
  getAdminFinance,
  applyCoupon,
  requestRefund
} from '../controllers/commerceController.js';

const router = express.Router();

router.use(protect);

// Student Routes
router.post('/order/create', roleProtect('student'), createOrder);
router.post('/order/verify', roleProtect('student'), verifyPayment);
router.post('/order/coupon', roleProtect('student'), applyCoupon);
router.get('/history', roleProtect('student'), getPurchaseHistory);
router.post('/refund', roleProtect('student'), requestRefund);

// Instructor Routes
router.get('/instructor/revenue', roleProtect('instructor'), getInstructorRevenue);

// Admin Routes
router.get('/admin/finance', roleProtect('admin'), getAdminFinance);

export default router;
