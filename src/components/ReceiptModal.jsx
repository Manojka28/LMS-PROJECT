import React from 'react';

export default function ReceiptModal({ isOpen, onClose, payment, studentName }) {
  if (!isOpen || !payment) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px', background: '#111', color: '#fff', padding: '30px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#3b82f6' }}>Payment Receipt</h2>
            <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>Date: {new Date(payment.createdAt).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Billed To:</span>
            <span style={{ fontWeight: '500' }}>{studentName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Course:</span>
            <span style={{ fontWeight: '500', textAlign: 'right' }}>{payment.courseTitle || (payment.course && payment.course.title)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Order ID:</span>
            <span style={{ fontWeight: '500', fontFamily: 'monospace' }}>{payment.razorpayOrderId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Payment ID:</span>
            <span style={{ fontWeight: '500', fontFamily: 'monospace' }}>{payment.razorpayPaymentId || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Status:</span>
            <span style={{ 
              fontWeight: 'bold', 
              color: payment.paymentStatus === 'enrolledAfterPayment' || payment.paymentStatus === 'paid' ? '#10b981' : '#ef4444' 
            }}>
              {payment.paymentStatus.toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #333', marginTop: '20px', paddingTop: '20px' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total Amount:</span>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>₹{payment.amount}</span>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button 
            className="ripple-btn"
            style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px' }}
            onClick={() => window.print()}
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
