import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AdminFinanceCenter() {
  const [data, setData] = useState({
    orders: [],
    refunds: [],
    metrics: { platformTotal: 0, recentTransactions: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinance();
  }, []);

  const fetchFinance = async () => {
    try {
      const res = await api.get('/commerce/admin/finance');
      if (res.success) {
        setData({ orders: res.orders, refunds: res.refunds, metrics: res.metrics });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="admin-loading-state">
      <div className="admin-loading-spinner" />
      <p>Loading Finance Data...</p>
    </div>
  );

  const { orders, refunds, metrics } = data;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '36px', marginBottom: '40px', fontFamily: 'Space Grotesk, sans-serif' }}>Enterprise Finance Center</h1>

      {/* METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: '#111', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '16px', marginBottom: '10px' }}>Total Platform Transaction Volume</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#10b981' }}>${metrics.platformTotal.toFixed(2)}</div>
        </div>
        <div style={{ background: '#111', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '16px', marginBottom: '10px' }}>Recent Transactions</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#3b82f6' }}>{metrics.recentTransactions}</div>
        </div>
        <div style={{ background: '#111', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '16px', marginBottom: '10px' }}>Pending Refunds</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#ef4444' }}>{refunds.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
        
        {/* RECENT TRANSACTIONS */}
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Recent Successful Orders</h2>
          <div className="admin-table-wrapper" style={{ border: '1px solid #333' }}>
            {orders.length === 0 ? (
              <div className="admin-empty-state">
                <i className="ri-shopping-cart-line" />
                <p>No transactions.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Gateway ID</th>
                    <th>Course</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td style={{ fontFamily: 'monospace', color: '#aaa' }}>{o.orderId}</td>
                      <td>{o.courseId?.title}</td>
                      <td style={{ color: '#aaa' }}>{new Date(o.createdAt).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>${o.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* PENDING REFUNDS */}
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Pending Refund Requests</h2>
          <div className="admin-table-wrapper" style={{ border: '1px solid #333' }}>
            {refunds.length === 0 ? (
              <div className="admin-empty-state">
                <i className="ri-refund-2-line" />
                <p>No pending refunds.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Reason</th>
                    <th>Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map(r => (
                    <tr key={r._id}>
                      <td>{r.studentId?.name}</td>
                      <td style={{ color: '#aaa' }}>{r.reason}</td>
                      <td style={{ color: '#ef4444', fontWeight: 'bold' }}>${r.refundAmount.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="admin-badge success" style={{ cursor: 'pointer', marginRight: '10px' }}>Approve</button>
                        <button className="admin-badge danger" style={{ cursor: 'pointer' }}>Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
