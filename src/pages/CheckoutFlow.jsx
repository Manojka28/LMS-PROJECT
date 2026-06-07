import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function CheckoutFlow() {
  const location = useLocation();
  const navigate = useNavigate();
  const course = location.state?.course;

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);

  if (!course) {
    return <div style={{ color: '#fff', padding: '50px', textAlign: 'center' }}>No course selected for checkout. <button onClick={() => navigate('/courses')}>Go to Courses</button></div>;
  }

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await api.post('/commerce/order/coupon', { code: couponCode, courseId: course._id });
      if (res.success) {
        if (res.coupon.discountType === 'Percentage') {
          setDiscount((course.price * res.coupon.discountValue) / 100);
        } else {
          setDiscount(res.coupon.discountValue);
        }
        setCouponApplied(true);
        alert('Coupon applied successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid coupon');
      setCouponApplied(false);
      setDiscount(0);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // 1. Create Order
      const orderRes = await api.post('/commerce/order/create', { courseId: course._id, couponCode: couponApplied ? couponCode : null });
      if (!orderRes.success) throw new Error('Failed to create order');

      // 2. Load Razorpay (Mocking the UI if no key)
      const options = {
        key: orderRes.key, // Enter the Key ID generated from the Dashboard
        amount: Math.round((course.price - discount) * 100),
        currency: "USD",
        name: "Enterprise LMS",
        description: `Purchase: ${course.title}`,
        order_id: orderRes.order.orderId.startsWith('mock_') ? undefined : orderRes.order.orderId, // This is a sample Order ID. Pass the `id` obtained in the response of create order
        handler: async function (response) {
          // 3. Verify Payment
          try {
            const verifyRes = await api.post('/commerce/order/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderRes.order._id
            });
            
            if (verifyRes.success) {
              alert('Payment Successful!');
              navigate('/student/dashboard');
            }
          } catch (err) {
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: "Student",
          email: "student@example.com",
        },
        theme: {
          color: "#3b82f6"
        }
      };

      if (orderRes.order.orderId.startsWith('mock_')) {
        // Bypass razorpay popup if mocking
        options.handler({
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_order_id: orderRes.order.orderId,
          razorpay_signature: `mock_sig_${Date.now()}`
        });
      } else {
        const rzp1 = new window.Razorpay(options);
        rzp1.open();
      }

    } catch (err) {
      console.error(err);
      alert('Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const finalPrice = Math.max(0, course.price - discount);
  const tax = finalPrice * 0.18;
  const total = finalPrice + tax;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '40px', background: '#111', borderRadius: '16px', color: '#fff', border: '1px solid #333', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '30px', fontFamily: 'Space Grotesk, sans-serif' }}>Secure Checkout</h1>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', background: '#1a1a1a', padding: '20px', borderRadius: '12px' }}>
        <img src={course.thumbnail} alt={course.title} style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
        <div>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{course.title}</h2>
          <p style={{ color: '#888', margin: 0 }}>By {course.instructor?.name || 'Instructor'}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Enter Coupon Code" 
          value={couponCode} 
          onChange={e => setCouponCode(e.target.value)}
          disabled={couponApplied}
          style={{ flex: 1, padding: '15px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
        />
        <button 
          onClick={handleApplyCoupon}
          disabled={couponApplied || !couponCode}
          style={{ padding: '0 20px', background: couponApplied ? '#10b981' : '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: couponApplied ? 'default' : 'pointer' }}
        >
          {couponApplied ? 'Applied' : 'Apply'}
        </button>
      </div>

      <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '18px' }}>
          <span style={{ color: '#aaa' }}>Course Price</span>
          <span>${course.price.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '18px', color: '#10b981' }}>
            <span>Discount Applied</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '18px' }}>
          <span style={{ color: '#aaa' }}>Subtotal</span>
          <span>${finalPrice.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '18px' }}>
          <span style={{ color: '#aaa' }}>Estimated Tax (18%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #333', fontSize: '24px', fontWeight: 'bold' }}>
          <span>Total</span>
          <span style={{ color: '#3b82f6' }}>${total.toFixed(2)}</span>
        </div>
      </div>

      <button 
        onClick={handleCheckout} 
        disabled={loading}
        style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}
      >
        {loading ? 'Processing...' : `Pay $${total.toFixed(2)} Securely`}
      </button>
    </div>
  );
}
