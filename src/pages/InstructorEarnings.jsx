import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function InstructorEarnings() {
  const [data, setData] = useState({
    payouts: [],
    metrics: { totalEarnings: 0, pendingEarnings: 0, totalSales: 0 },
    courseRevenue: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await api.get('/commerce/instructor/revenue');
      if (res.success) {
        setData({ payouts: res.payouts, metrics: res.metrics, courseRevenue: res.courseRevenue });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', padding: '50px' }}>Loading Earnings Data...</div>;

  const { metrics, payouts, courseRevenue } = data;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '36px', marginBottom: '40px', fontFamily: 'Space Grotesk, sans-serif' }}>Revenue & Payouts</h1>

      {/* METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: '#111', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '16px', marginBottom: '10px' }}>Total Lifetime Earnings</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#10b981' }}>${metrics.totalEarnings.toFixed(2)}</div>
        </div>
        <div style={{ background: '#111', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '16px', marginBottom: '10px' }}>Pending Payouts</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#f59e0b' }}>${metrics.pendingEarnings.toFixed(2)}</div>
        </div>
        <div style={{ background: '#111', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '16px', marginBottom: '10px' }}>Total Sales</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#3b82f6' }}>{metrics.totalSales}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* COURSE REVENUE */}
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Revenue by Course</h2>
          <div style={{ background: '#111', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
            {Object.keys(courseRevenue).length === 0 ? (
              <div className="empty-state" style={{ padding: '30px', border: 'none' }}>
                <i className="ri-shopping-bag-3-line empty-state-icon" style={{ fontSize: '36px' }}></i>
                <p className="empty-state-text">No sales yet.</p>
              </div>
            ) : (
              <div className="responsive-table-wrap">
                <table className="responsive-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th style={{ textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(courseRevenue).map(([title, amount]) => (
                      <tr key={title}>
                        <td>{title}</td>
                        <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>${amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PAYOUT HISTORY */}
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Payout History</h2>
          <div style={{ background: '#111', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
            {payouts.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px', border: 'none' }}>
                <i className="ri-bank-card-line empty-state-icon" style={{ fontSize: '36px' }}></i>
                <p className="empty-state-text">No payouts generated yet.</p>
              </div>
            ) : (
              <div className="responsive-table-wrap">
                <table className="responsive-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Amount</th>
                      <th style={{ textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map(p => (
                      <tr key={p._id}>
                        <td style={{ color: '#aaa' }}>{new Date(p.periodStart).toLocaleDateString()} - {new Date(p.periodEnd).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 'bold' }}>${p.amount.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`status-badge ${p.status === 'Paid' ? 'success' : 'warning'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
