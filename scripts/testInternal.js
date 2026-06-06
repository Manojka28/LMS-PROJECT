import request from 'supertest';
import app from './server/index.js';
import mongoose from 'mongoose';
import Course from './server/models/Course.js';
import User from './server/models/User.js';

async function runTests() {
  try {
    const student = await User.findOne({ email: 'student@test.com' });
    const instructor = await User.findOne({ email: 'instructor@seed.com' });
    
    // Simulate login for cookies (or just generate tokens if needed, but easier to use login route)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@test.com', password: 'password123' });
    const studentCookie = loginRes.headers['set-cookie'];

    const instLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'instructor@seed.com', password: 'password123' });
    const instCookie = instLoginRes.headers['set-cookie'];

    const course = await Course.findOne({ price: { $gt: 0 } });
    
    if (!course) {
      console.log('No priced courses found.');
      process.exit(0);
    }
    console.log('Testing with Course:', course.title, course.price);

    // Initial Analytics
    const initAnalytics = await request(app)
      .get('/api/instructor/dashboard/analytics')
      .set('Cookie', instCookie);
    console.log('Initial Revenue:', initAnalytics.body.analytics?.totalRevenue);

    // Create Order
    const orderRes = await request(app)
      .post('/api/payment/create-order')
      .set('Cookie', studentCookie)
      .send({ courseId: course._id });
    
    console.log('Order Res:', orderRes.body);

    // Verify Success Payment
    const verifyRes = await request(app)
      .post('/api/payment/verify')
      .set('Cookie', studentCookie)
      .send({
        razorpay_order_id: orderRes.body.orderId,
        razorpay_payment_id: 'pay_test_123',
        razorpay_signature: 'dummy_sig', // Bypass since we use dummy keys
        courseId: course._id
      });
    
    console.log('Verify Res:', verifyRes.body);

    // History
    const histRes = await request(app)
      .get('/api/payment/history')
      .set('Cookie', studentCookie);
    console.log('History Count:', histRes.body.history?.length);
    console.log('Latest History Status:', histRes.body.history?.[0]?.paymentStatus);

    // Final Analytics
    const finalAnalytics = await request(app)
      .get('/api/instructor/dashboard/analytics')
      .set('Cookie', instCookie);
    console.log('Final Revenue:', finalAnalytics.body.analytics?.totalRevenue);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Since app might be listening already, it doesn't matter for supertest, it binds to ephemeral port if not bound
// But server/index.js calls app.listen. Let's see if it works
setTimeout(runTests, 2000);
