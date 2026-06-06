import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import Notification from '../models/Notification.js';

// ─── MODE DETECTION ──────────────────────────────────────────────────────────
const DEV_PAYMENT_MODE = process.env.DEV_PAYMENT_MODE === 'true';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const HAS_REAL_KEYS = !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

console.log('--- PAYMENT MODE STARTUP CHECK ---');
console.log('DEV_PAYMENT_MODE =', DEV_PAYMENT_MODE);
console.log('RAZORPAY_KEY_ID exists =', !!RAZORPAY_KEY_ID);
console.log('RAZORPAY_KEY_SECRET exists =', !!RAZORPAY_KEY_SECRET);
console.log('Active mode =', DEV_PAYMENT_MODE ? 'SIMULATED (no Razorpay API calls)' : (HAS_REAL_KEYS ? 'REAL RAZORPAY' : 'ERROR: No keys and DEV mode off'));
console.log('----------------------------------');

// ─── Lazy-load Razorpay only when real keys are present ──────────────────────
let razorpay = null;
if (HAS_REAL_KEYS && !DEV_PAYMENT_MODE) {
  const { default: Razorpay } = await import('razorpay');
  razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const EMPTY_PROGRESS = { completedLectures: [], completionPercentage: 0, completed: false };

function generateMockOrderId() {
  return `order_dev_${crypto.randomBytes(8).toString('hex')}`;
}

function generateMockPaymentId() {
  return `pay_dev_${crypto.randomBytes(8).toString('hex')}`;
}

// ─── Shared enrollment helper ─────────────────────────────────────────────────
async function doEnroll(user, courseId, payment) {
  const alreadyEnrolled = user.purchasedCourses.some(
    (c) => c.toString() === courseId.toString()
  );

  if (!alreadyEnrolled) {
    user.purchasedCourses.push(courseId);
    await user.save();
    await Course.findByIdAndUpdate(courseId, { $addToSet: { enrolledStudents: user._id } });
    await Progress.findOneAndUpdate(
      { user: user._id, course: courseId },
      { $setOnInsert: { ...EMPTY_PROGRESS } },
      { upsert: true, new: true }
    );
  }

  payment.razorpayPaymentId = payment.razorpayPaymentId || generateMockPaymentId();
  payment.paymentStatus = 'enrolledAfterPayment';
  await payment.save();

  // Create Notifications
  const course = await Course.findById(courseId);
  if (course) {
    await Notification.create({
      userId: user._id,
      type: 'COURSE_PURCHASED',
      title: 'Course Purchased',
      message: `You have successfully purchased ${course.title}.`,
      link: `/courses/${courseId}`
    });
    await Notification.create({
      userId: user._id,
      type: 'COURSE_ENROLLED',
      title: 'Course Enrolled',
      message: `You are now enrolled in ${course.title}.`,
      link: `/courses/${courseId}`
    });
  }
}

// ─── POST /api/payment/create-order ──────────────────────────────────────────
export async function createOrder(req, res, next) {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (!course.price || course.price <= 0) {
      return res.status(400).json({ success: false, message: 'Course is free. Use regular enrollment.' });
    }

    // Duplicate payment / enrollment check
    const alreadyEnrolled = req.user.purchasedCourses.some(
      (c) => c.toString() === courseId.toString()
    );
    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }

    // Check for an existing pending payment to prevent double-click duplicates
    const existingPending = await Payment.findOne({
      student: req.user._id,
      course: courseId,
      paymentStatus: 'created'
    });
    if (existingPending) {
      // Reuse existing pending order rather than creating a new one
      return res.status(200).json({
        success: true,
        devMode: DEV_PAYMENT_MODE,
        orderId: existingPending.razorpayOrderId,
        amount: Math.round(course.price * 100),
        currency: 'INR',
        key: RAZORPAY_KEY_ID
      });
    }

    const amountInPaise = Math.round(course.price * 100);

    // ── DEV MODE: skip Razorpay API ──────────────────────────────────────────
    if (DEV_PAYMENT_MODE) {
      const mockOrderId = generateMockOrderId();

      const payment = new Payment({
        student: req.user._id,
        course: courseId,
        courseTitle: course.title,
        amount: course.price,
        razorpayOrderId: mockOrderId,
        paymentMethod: 'dev_simulated',
        paymentStatus: 'created'
      });
      await payment.save();

      return res.status(200).json({
        success: true,
        devMode: true,
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: 'INR',
        key: 'dev_mode'
      });
    }

    // ── REAL RAZORPAY MODE ────────────────────────────────────────────────────
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Payment service is not configured. Set DEV_PAYMENT_MODE=true or provide Razorpay credentials.'
      });
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`
    });

    const payment = new Payment({
      student: req.user._id,
      course: courseId,
      courseTitle: course.title,
      amount: course.price,
      razorpayOrderId: order.id,
      paymentStatus: 'created'
    });
    await payment.save();

    return res.status(200).json({
      success: true,
      devMode: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: RAZORPAY_KEY_ID
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/payment/dev-purchase (DEV MODE only — direct enroll) ───────────
export async function devPurchase(req, res, next) {
  try {
    if (!DEV_PAYMENT_MODE) {
      return res.status(403).json({ success: false, message: 'Dev purchase is only available in DEV_PAYMENT_MODE.' });
    }

    const { orderId, courseId } = req.body;
    if (!orderId || !courseId) {
      return res.status(400).json({ success: false, message: 'orderId and courseId are required' });
    }

    const payment = await Payment.findOne({ razorpayOrderId: orderId, student: req.user._id });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Idempotency guard
    if (payment.paymentStatus === 'enrolledAfterPayment' || payment.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Already purchased and enrolled' });
    }

    await doEnroll(req.user, courseId, payment);

    return res.status(200).json({
      success: true,
      message: '[DEV] Payment simulated and enrollment completed successfully.',
      paymentId: payment.razorpayPaymentId,
      orderId: payment.razorpayOrderId
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/payment/verify (REAL Razorpay verify) ─────────────────────────
export async function verifyPayment(req, res, next) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId
    } = req.body;

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    if (payment.paymentStatus === 'enrolledAfterPayment' || payment.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Payment already verified' });
    }

    // Signature verification (only with real keys)
    if (HAS_REAL_KEYS && !DEV_PAYMENT_MODE) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(body).digest('hex');
      if (expected !== razorpay_signature) {
        payment.paymentStatus = 'failed';
        await payment.save();
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paymentStatus = 'paid';
    await payment.save();

    await doEnroll(req.user, courseId, payment);

    return res.status(200).json({ success: true, message: 'Payment verified and enrolled successfully' });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/payment/history ─────────────────────────────────────────────────
export async function getPurchaseHistory(req, res, next) {
  try {
    const history = await Payment.find({ student: req.user._id })
      .populate('course', 'title price')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, history });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/payment/mode (informational) ────────────────────────────────────
export async function getPaymentMode(req, res) {
  return res.status(200).json({
    success: true,
    devMode: DEV_PAYMENT_MODE,
    razorpayConfigured: HAS_REAL_KEYS
  });
}
