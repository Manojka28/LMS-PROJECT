import React from 'react';

export default function StudentAnalyticsCards({ analytics }) {
  if (!analytics) return null;
  const cards = [
    { label: 'Enrolled Courses', value: analytics.totalEnrolled || 0, icon: 'ri-book-open-fill', color: '#3b82f6' },
    { label: 'Completed Courses', value: analytics.completedCourses || 0, icon: 'ri-checkbox-circle-fill', color: '#10b981' },
    { label: 'Average Progress', value: `${analytics.averageProgress || 0}%`, icon: 'ri-pie-chart-2-fill', color: '#8b5cf6' },
    { label: 'Total Learning', value: `${analytics.hoursStudied || 0} hrs`, icon: 'ri-time-fill', color: '#ec4899' },
    { label: 'Learning Streak', value: `${analytics.learningStreak || 0} Days`, icon: 'ri-fire-fill', color: '#f59e0b' },
    { label: 'Avg Quiz Score', value: `${analytics.averageQuizScore || 0}%`, icon: 'ri-percent-line', color: '#14b8a6' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
      {cards.map((card, i) => (
        <div key={i} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s, border-color 0.2s', cursor: 'default' }} onMouseOver={e => { e.currentTarget.style.borderColor = card.color; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseOut={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.transform = 'translateY(0)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, fontSize: '24px' }}>
            <i className={card.icon}></i>
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
