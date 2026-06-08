import React from 'react';

export default function SkeletonLoader({ type = 'card', count = 1 }) {
  const skeletons = [];
  
  for (let i = 0; i < count; i++) {
    if (type === 'card') {
      skeletons.push(
        <div key={i} className="skeleton" style={{ height: '200px', width: '100%', borderRadius: '12px', marginBottom: '20px' }}></div>
      );
    } else if (type === 'text') {
      skeletons.push(
        <div key={i} className="skeleton" style={{ height: '20px', width: '100%', borderRadius: '4px', marginBottom: '10px' }}></div>
      );
    } else if (type === 'table') {
      skeletons.push(
         <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div className="skeleton" style={{ height: '40px', flex: 1, borderRadius: '4px' }}></div>
            <div className="skeleton" style={{ height: '40px', flex: 1, borderRadius: '4px' }}></div>
            <div className="skeleton" style={{ height: '40px', flex: 1, borderRadius: '4px' }}></div>
         </div>
      );
    }
  }

  return (
    <div aria-busy="true" aria-label="Loading content...">
      {skeletons}
    </div>
  );
}
