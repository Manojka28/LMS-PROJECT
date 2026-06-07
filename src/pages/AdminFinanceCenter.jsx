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

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', padding: '50px' }}>Loading Finance Data...</div>;

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
          <div style={{ background: '#111', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
            {orders.length === 0 ? <div style={{ padding: '20px', color: '#888' }}>No transactions.</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#1a1a1a', color: '#888' }}>
                    <th style={{ padding: '15px' }}>Gateway ID</th>
                    <th style={{ padding: '15px' }}>Course</th>
                    <th style={{ padding: '15px' }}>Date</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '15px', fontFamily: 'monospace', color: '#aaa' }}>{o.orderId}</td>
                      <td style={{ padding: '15px' }}>{o.courseId?.title}</td>
                      <td style={{ padding: '15px', color: '#aaa' }}>{new Date(o.createdAt).toLocaleString()}</td>
                      <td style={{ padding: '15px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>${o.amount.toFixed(2)}</td>
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
          <div style={{ background: '#111', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
            {refunds.length === 0 ? <div style={{ padding: '20px', color: '#888' }}>No pending refunds.</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#1a1a1a', color: '#888' }}>
                    <th style={{ padding: '15px' }}>Student</th>
                    <th style={{ padding: '15px' }}>Reason</th>
                    <th style={{ padding: '15px' }}>Amount</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map(r => (
                    <tr key={r._id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '15px' }}>{r.studentId?.name}</td>
                      <td style={{ padding: '15px', color: '#aaa' }}>{r.reason}</td>
                      <td style={{ padding: '15px', color: '#ef4444', fontWeight: 'bold' }}>${r.refundAmount.toFixed(2)}</td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        <button style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>Approve</button>
                        <button style={{ padding: '6px 12px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
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
