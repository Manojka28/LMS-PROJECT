import React from 'react';

export default function LoadingSpinner({ size = '40px', text = 'Loading...' }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div 
        className="loading-spinner" 
        style={{ width: size, height: size }}
      ></div>
      {text && <span className="loading-state-text">{text}</span>}
    </div>
  );
}
