import React from 'react';

export default function StudentAnalyticsCards({ totalEnrolled, completedCourses, averageProgress }) {
  const cards = [
    { label: 'Total Enrolled', value: totalEnrolled, icon: 'fa-book-open', color: '#3b82f6' },
    { label: 'Completed Courses', value: completedCourses, icon: 'fa-certificate', color: '#10b981' },
    { label: 'Average Progress', value: `${averageProgress}%`, icon: 'fa-chart-line', color: '#8b5cf6' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
      {cards.map((card, i) => (
        <div key={i} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, fontSize: '24px' }}>
            <i className={`fas ${card.icon}`}></i>
          </div>
          <div>
            <div style={{ color: '#888', fontSize: '14px', marginBottom: '4px' }}>{card.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '600' }}>{card.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
