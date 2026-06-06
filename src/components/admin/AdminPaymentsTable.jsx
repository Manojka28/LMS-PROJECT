import React, { useState } from 'react';

export default function AdminPaymentsTable({ payments }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = payments.filter(p => {
    const matchSearch = 
      p.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.studentId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.razorpayPaymentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'all' || p.paymentStatus === statusFilter;
    
    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2 className="admin-panel-title">Payment History</h2>
          <p className="admin-panel-sub">Track all platform transactions</p>
        </div>
        
        <div className="admin-flex-row">
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="admin-date-picker"
            style={{ outline: 'none' }}
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="enrolledAfterPayment">Enrolled</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          
          <div className="admin-date-picker">
            <i className="ri-search-line" />
            <input 
              type="text" 
              placeholder="Search payments..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none', width: '200px' }}
            />
          </div>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Transaction ID</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p._id}>
                <td>
                  <div className="admin-flex-col">
                    <span style={{fontWeight: 500}}>{p.studentId?.name || 'Unknown'}</span>
                    <span className="admin-text-small">{p.studentId?.email || 'N/A'}</span>
                  </div>
                </td>
                <td>{p.courseTitle?.length > 30 ? p.courseTitle.slice(0, 30) + '...' : p.courseTitle}</td>
                <td style={{fontWeight: 600}}>₹{p.amount}</td>
                <td>
                  <span className={`admin-badge ${
                    ['paid', 'enrolledAfterPayment'].includes(p.paymentStatus) ? 'success' : 
                    p.paymentStatus === 'failed' ? 'danger' : 'warning'
                  }`}>
                    {p.paymentStatus === 'enrolledAfterPayment' ? 'Enrolled' : p.paymentStatus}
                  </span>
                </td>
                <td style={{fontFamily: 'monospace', fontSize: 13, color: 'var(--admin-text-secondary)'}}>
                  {p.razorpayPaymentId || '-'}
                </td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{padding: '24px', textAlign: 'center', color: '#888'}}>No transactions found.</p>}
      </div>
    </div>
  );
}
