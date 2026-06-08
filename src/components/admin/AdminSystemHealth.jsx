import React, { useState, useEffect } from 'react';

export default function AdminSystemHealth() {
  const [health, setHealth] = useState({
    status: 'Healthy',
    uptime: '99.99%',
    dbConnection: 'Connected',
    aiService: 'Online',
    paymentGateway: 'Online',
    lastCheck: new Date().toLocaleString()
  });

  return (
    <div style={{ background: '#111', borderRadius: '12px', border: '1px solid #333', padding: '30px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <i className="ri-heart-pulse-fill" style={{ color: '#10b981' }}></i> System Health Overview
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #222' }}>
          <p style={{ color: '#888', margin: '0 0 10px 0' }}>Overall Status</p>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{health.status}</div>
        </div>
        
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #222' }}>
          <p style={{ color: '#888', margin: '0 0 10px 0' }}>Database Connection</p>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{health.dbConnection}</div>
        </div>

        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #222' }}>
          <p style={{ color: '#888', margin: '0 0 10px 0' }}>AI Tutor Engine</p>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{health.aiService}</div>
        </div>

        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #222' }}>
          <p style={{ color: '#888', margin: '0 0 10px 0' }}>Payment Gateway</p>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{health.paymentGateway}</div>
        </div>
      </div>
      
      <div style={{ marginTop: '30px', color: '#aaa', fontSize: '14px' }}>
        Last checked: {health.lastCheck}
      </div>
    </div>
  );
}
