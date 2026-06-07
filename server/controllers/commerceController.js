import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Transaction from '../models/Transaction.js';
import Invoice from '../models/Invoice.js';
import Coupon from '../models/Coupon.js';
import Course from '../models/Course.js';
import InstructorPayout from '../models/InstructorPayout.js';
import CommissionRule from '../models/CommissionRule.js';
import RefundRequest from '../models/RefundRequest.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Notification from '../models/Notification.js';

const DEV_PAYMENT_MODE = process.env.DEV_PAYMENT_MODE === 'true';

// Fallback mock if Razorpay keys are missing
const isMock = !process.env.RAZORPAY_KEY_ID;
const razorpay = isMock ? null : new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const applyCoupon = async (req, res) => {
  try {
    const { code, courseId } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or inactive coupon' });
    if (coupon.expiryDate && coupon.expiryDate < new Date()) return res.status(400).json({ success: false, message: 'Coupon expired' });
    if (coupon.timesUsed >= coupon.usageLimit) return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    if (coupon.couponType === 'Course-Specific' && coupon.targetCourseId.toString() !== courseId) {
      return res.status(400).json({ success: false, message: 'Coupon not valid for this course' });
    }

    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error applying coupon' });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { courseId, couponCode } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    let finalAmount = course.price;
    let discountApplied = 0;
    let appliedCouponId = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        if (coupon.discountType === 'Percentage') {
          discountApplied = (finalAmount * coupon.discountValue) / 100;
        } else {
          discountApplied = coupon.discountValue;
        }
        finalAmount = Math.max(0, finalAmount - discountApplied);
        appliedCouponId = coupon._id;
      }
    }

    // Amount in minimum currency unit (e.g., paisa/cents)
    const amountInCents = Math.round(finalAmount * 100);

    let gatewayOrderId = `mock_order_${Date.now()}`;
    
    if (!isMock && amountInCents > 0) {
      const rpOrder = await razorpay.orders.create({
        amount: amountInCents,
        currency: 'USD',
        receipt: `rcpt_${req.user.id}_${Date.now()}`
      });
      gatewayOrderId = rpOrder.id;
    }

    const order = await Order.create({
      orderId: gatewayOrderId,
      studentId: req.user.id,
      courseId: course._id,
      instructorId: course.instructor,
      amount: finalAmount,
      discountApplied,
      couponId: appliedCouponId,
      gatewayOrderId
    });

    res.status(201).json({ success: true, order, key: process.env.RAZORPAY_KEY_ID || 'mock_key', devMode: DEV_PAYMENT_MODE });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    let isAuthentic = false;

    if (DEV_PAYMENT_MODE || isMock) {
      isAuthentic = true; // Trust mock
    } else {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
      isAuthentic = expectedSignature === razorpay_signature;
    }

    if (!isAuthentic) {
      order.status = 'Failed';
      await order.save();
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Success flow
    order.status = 'Successful';
    order.completedAt = new Date();
    await order.save();

    await Transaction.create({
      transactionId: razorpay_payment_id || `mock_txn_${Date.now()}`,
      orderId: order._id,
      amount: order.amount,
      status: 'Success',
      signatureVerification: true
    });

    // Invoice Generation
    const taxRate = 18; // 18% tax
    const taxAmount = (order.amount * taxRate) / 100;
    const subtotal = order.amount - taxAmount;

    const invoice = await Invoice.create({
      invoiceNumber: `INV-${Date.now()}`,
      orderId: order._id,
      studentId: order.studentId,
      subtotal,
      taxAmount,
      taxRate,
      totalAmount: order.amount
    });

    // Commission Split & Payout Generation
    let commRule = await CommissionRule.findOne({ instructorId: order.instructorId });
    if (!commRule) commRule = await CommissionRule.findOne({ instructorId: null }); // Global default

    const instructorSharePercent = commRule ? commRule.instructorSharePercentage : 70;
    const instructorEarning = (subtotal * instructorSharePercent) / 100;

    await InstructorPayout.create({
      instructorId: order.instructorId,
      amount: instructorEarning,
      periodStart: new Date(),
      periodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)) // Standard monthly period
    });

    // Update coupon usage
    if (order.couponId) {
      await Coupon.findByIdAndUpdate(order.couponId, { $inc: { timesUsed: 1 } });
    }

    // Add student to course enrolled
    await Course.findByIdAndUpdate(order.courseId, { 
      $addToSet: { enrolledStudents: order.studentId },
      $inc: { enrolledCount: 1 } 
    });

    // ─── ADD ENROLLMENT LOGIC ───
    const user = await User.findById(order.studentId);
    if (user) {
      const alreadyEnrolled = user.purchasedCourses.some((c) => c.toString() === order.courseId.toString());
      if (!alreadyEnrolled) {
        user.purchasedCourses.push(order.courseId);
        await user.save();
        
        await Progress.findOneAndUpdate(
          { user: user._id, course: order.courseId },
          { $setOnInsert: { completedLectures: [], completionPercentage: 0, completed: false } },
          { upsert: true, new: true }
        );
      }
    }

    const courseObj = await Course.findById(order.courseId);
    if (courseObj) {
      await Notification.create({
        userId: order.studentId,
        type: 'COURSE_PURCHASED',
        title: 'Course Purchased',
        message: `You have successfully purchased ${courseObj.title}.`,
        link: `/courses/${courseObj._id}`
      });
      await Notification.create({
        userId: order.studentId,
        type: 'COURSE_ENROLLED',
        title: 'Course Enrolled',
        message: `You are now enrolled in ${courseObj.title}.`,
        link: `/courses/${courseObj._id}`
      });
    }

    res.json({ success: true, message: 'Payment successful', invoice });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Verification error' });
  }
};

export const getPurchaseHistory = async (req, res) => {
  try {
    const orders = await Order.find({ studentId: req.user.id })
      .populate('courseId', 'title thumbnail')
      .sort({ createdAt: -1 });
    
    const invoices = await Invoice.find({ studentId: req.user.id });
    
    const history = orders.map(o => ({
      _id: o._id,
      courseTitle: o.courseId?.title,
      amount: o.amount,
      createdAt: o.createdAt,
      paymentStatus: o.status === 'Successful' ? 'paid' : o.status,
      razorpayPaymentId: o.gatewayOrderId
    }));
    
    res.json({ success: true, orders, invoices, history });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

export const getInstructorRevenue = async (req, res) => {
  try {
    const payouts = await InstructorPayout.find({ instructorId: req.user.id }).sort({ createdAt: -1 });
    
    // Aggregate total earnings
    let totalEarnings = 0;
    let pendingEarnings = 0;
    payouts.forEach(p => {
      if (p.status === 'Paid') totalEarnings += p.amount;
      if (p.status === 'Pending') pendingEarnings += p.amount;
    });

    // Get Course wise revenue
    const orders = await Order.find({ instructorId: req.user.id, status: 'Successful' }).populate('courseId', 'title');
    const courseRevenue = {};
    orders.forEach(o => {
      if (!courseRevenue[o.courseId.title]) courseRevenue[o.courseId.title] = 0;
      courseRevenue[o.courseId.title] += o.amount;
    });

    res.json({ 
      success: true, 
      payouts, 
      metrics: { totalEarnings, pendingEarnings, totalSales: orders.length },
      courseRevenue 
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

export const requestRefund = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const order = await Order.findOne({ _id: orderId, studentId: req.user.id });
    
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'Successful') return res.status(400).json({ success: false, message: 'Order is not eligible for refund' });

    const existingRefund = await RefundRequest.findOne({ orderId: order._id });
    if (existingRefund) return res.status(400).json({ success: false, message: 'Refund request already exists for this order' });

    const refund = await RefundRequest.create({
      orderId: order._id,
      studentId: req.user.id,
      reason,
      refundAmount: order.amount
    });

    res.json({ success: true, refund });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

export const getAdminFinance = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Successful' }).sort({ createdAt: -1 }).limit(50).populate('courseId', 'title');
    const refunds = await RefundRequest.find({ status: 'Pending' }).populate('studentId', 'name');
    
    let platformTotal = 0;
    orders.forEach(o => platformTotal += o.amount);

    res.json({
      success: true,
      orders,
      refunds,
      metrics: { platformTotal, recentTransactions: orders.length }
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};
