// Built-in fetch will be used

async function testPayment() {
  try {
    // 1. Login as student
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@test.com', password: 'password123' })
    });
    const cookieHeader = loginRes.headers.get('set-cookie');
    const tokenCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
    console.log('Login Student Cookie:', !!tokenCookie);

    // 2. Login as instructor
    const instLoginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'instructor@seed.com', password: 'password123' })
    });
    const instCookie = instLoginRes.headers.get('set-cookie')?.split(';')[0];
    
    // Check initial revenue
    const initInstRes = await fetch('http://localhost:5000/api/instructor/dashboard/analytics', {
      headers: { 'Cookie': instCookie }
    });
    const initData = await initInstRes.json();
    console.log('Initial Revenue:', initData.analytics.totalRevenue);

    // 3. Find a course the student doesn't own
    const allRes = await fetch('http://localhost:5000/api/course');
    const allCourses = await allRes.json();
    
    const unownedCourse = allCourses.courses.find(c => c.price > 0 && !c.isEnrolled); // Not 100% accurate because isEnrolled is based on auth, but we'll try to find one
    if (!unownedCourse) {
      console.log('No unowned priced courses found.');
      return;
    }
    console.log('Found course:', unownedCourse.title, 'Price:', unownedCourse.price);

    // 4. Create Order
    const orderRes = await fetch('http://localhost:5000/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': tokenCookie },
      body: JSON.stringify({ courseId: unownedCourse._id })
    });
    const orderData = await orderRes.json();
    console.log('Create Order Result:', orderData);

    if (!orderData.success) throw new Error('Order creation failed');

    // 5. Verify Payment
    const verifyRes = await fetch('http://localhost:5000/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': tokenCookie },
      body: JSON.stringify({
        razorpay_order_id: orderData.orderId,
        razorpay_payment_id: 'pay_dummy123',
        razorpay_signature: 'dummy_sig', // Should succeed if RAZORPAY_KEY_ID contains 'dummy'
        courseId: unownedCourse._id
      })
    });
    const verifyData = await verifyRes.json();
    console.log('Verify Result:', verifyData);

    // 6. Check student history
    const histRes = await fetch('http://localhost:5000/api/payment/history', {
      headers: { 'Cookie': tokenCookie }
    });
    const histData = await histRes.json();
    console.log('Purchase History count:', histData.history.length);
    console.log('Latest history item status:', histData.history[0]?.paymentStatus);

    // 7. Check instructor revenue
    const finalInstRes = await fetch('http://localhost:5000/api/instructor/dashboard/analytics', {
      headers: { 'Cookie': instCookie }
    });
    const finalData = await finalInstRes.json();
    console.log('Final Revenue:', finalData.analytics.totalRevenue);

  } catch (err) {
    console.error(err);
  }
}

testPayment();
