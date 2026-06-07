import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Order from '../server/models/Order.js';
import User from '../server/models/User.js';
import Course from '../server/models/Course.js';
import Coupon from '../server/models/Coupon.js';
import Invoice from '../server/models/Invoice.js';
import Transaction from '../server/models/Transaction.js';
import InstructorPayout from '../server/models/InstructorPayout.js';
import Progress from '../server/models/Progress.js';
import Notification from '../server/models/Notification.js';

import { createOrder, verifyPayment } from '../server/controllers/commerceController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTest() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms');
  console.log('Connected to DB');

  const student = await User.findOne({ role: 'student' });
  const course = await Course.findOne({ price: { $gt: 0 } });
  const instructor = await User.findById(course.instructor);

  console.log(`\n--- TEST SETUP ---`);
  console.log(`Student: ${student.email}`);
  console.log(`Course: ${course.title} (Price: $${course.price})`);
  console.log(`Instructor: ${instructor.email}`);

  await Coupon.deleteMany({ code: 'TEST10' });
  const coupon = await Coupon.create({
    code: 'TEST10',
    discountType: 'Percentage',
    discountValue: 10,
    isActive: true
  });
  console.log(`Coupon created: TEST10 (10% off)`);

  const mockRes = () => {
    const res = {};
    res.status = () => res;
    res.json = (data) => { res.data = data; return res; };
    return res;
  };

  // 1. CREATE ORDER
  console.log(`\n--- 1. CREATE ORDER ---`);
  const reqCreate = {
    user: { id: student._id },
    body: { courseId: course._id, couponCode: 'TEST10' }
  };
  const resCreate = mockRes();
  await createOrder(reqCreate, resCreate);
  console.log('Order Response:', resCreate.data);
  
  if (!resCreate.data.success) {
    console.error('Failed to create order');
    process.exit(1);
  }

  // 2. VERIFY PAYMENT
  console.log(`\n--- 2. VERIFY PAYMENT ---`);
  const reqVerify = {
    body: {
      orderId: resCreate.data.order._id,
      razorpay_order_id: resCreate.data.order.gatewayOrderId,
      razorpay_payment_id: `mock_pay_${Date.now()}`,
      razorpay_signature: `mock_sig_${Date.now()}`
    }
  };
  const resVerify = mockRes();
  await verifyPayment(reqVerify, resVerify);
  console.log('Verify Response:', resVerify.data);

  // 3. GATHER EVIDENCE
  console.log(`\n--- 3. EVIDENCE GATHERING ---`);
  
  const finalOrder = await Order.findById(resCreate.data.order._id).lean();
  console.log('\n[EVIDENCE: Order Document]');
  console.log(finalOrder);

  const updatedStudent = await User.findById(student._id).lean();
  console.log(`\n[EVIDENCE: Enrollment]`);
  console.log(`purchasedCourses includes courseId?`, updatedStudent.purchasedCourses.map(id => id.toString()).includes(course._id.toString()));

  const progress = await Progress.findOne({ user: student._id, course: course._id }).lean();
  console.log(`\n[EVIDENCE: Progress Document]`);
  console.log(progress);

  const invoice = await Invoice.findOne({ orderId: finalOrder._id }).lean();
  console.log(`\n[EVIDENCE: Invoice Document]`);
  console.log(invoice);

  const payout = await InstructorPayout.findOne({ instructorId: instructor._id }).sort({ createdAt: -1 }).lean();
  console.log(`\n[EVIDENCE: Instructor Revenue Updated]`);
  console.log(payout);

  const notifications = await Notification.find({ userId: student._id }).sort({ createdAt: -1 }).limit(2).lean();
  console.log(`\n[EVIDENCE: Notifications Sent]`);
  console.log(notifications);

  process.exit(0);
}

runTest().catch(console.error);
