import React, { useEffect, useState } from 'react';

export default function PremiumLoadingScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Small delay to prevent flashing for very quick loads
    const timer = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      background: '#0b0b0b', zIndex: 99999,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <img 
          src="/logos/iiitl-logo.svg" 
          alt="LMS Logo" 
          style={{ width: '80px', height: '80px', animation: 'pulse 2s infinite ease-in-out' }} 
        />
        <div style={{ width: '240px', height: '4px', background: '#222', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, height: '100%', width: '100%',
            background: '#00D26A',
            transformOrigin: 'left',
            animation: 'loadingProgress 2s infinite ease-in-out'
          }}></div>
        </div>
        <p style={{ color: '#888', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'Space Grotesk, sans-serif' }}>
          Loading Experience...
        </p>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes loadingProgress {
          0% { transform: scaleX(0); transform-origin: left; }
          49% { transform: scaleX(1); transform-origin: left; }
          50% { transform: scaleX(1); transform-origin: right; }
          100% { transform: scaleX(0); transform-origin: right; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
