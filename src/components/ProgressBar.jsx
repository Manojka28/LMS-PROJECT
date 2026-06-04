import React from 'react';

export default function ProgressBar({ percentage = 0, showText = true }) {
  const validPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="progress-bar-container" style={{ width: '100%', marginTop: '10px' }}>
      <div 
        style={{ 
          background: '#222', 
          borderRadius: '4px', 
          height: '6px', 
          width: '100%',
          overflow: 'hidden'
        }}
      >
        <div 
          style={{ 
            background: validPercentage === 100 ? '#FFD700' : '#00D26A', 
            width: `${validPercentage}%`, 
            height: '100%', 
            borderRadius: '4px',
            transition: 'width 0.5s ease-in-out'
          }} 
        />
      </div>
      {showText && (
        <p className="muted" style={{ fontSize: '11px', marginTop: '4px' }}>
          {validPercentage}% Complete
        </p>
      )}
    </div>
  );
}
