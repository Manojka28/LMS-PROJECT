import React from 'react';

export default function AnalyticsCards({ analytics }) {
  if (!analytics) return null;

  const { totalCourses, publishedCourses, draftCourses, totalEnrollments, totalStudents } = analytics;

  const cards = [
    { label: 'Total Courses', value: totalCourses, color: '#4f46e5' },
    { label: 'Published', value: publishedCourses, color: '#10b981' },
    { label: 'Drafts', value: draftCourses, color: '#f59e0b' },
    { label: 'Total Enrollments', value: totalEnrollments, color: '#8b5cf6' },
    { label: 'Total Students', value: totalStudents, color: '#ec4899' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '30px' }}>
      {cards.map((card, index) => (
        <div key={index} style={{
          background: '#1a1a1a',
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid ${card.color}40`,
          borderTop: `4px solid ${card.color}`,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h4 className="muted" style={{ marginBottom: '10px', fontSize: '0.9rem' }}>{card.label}</h4>
          <h2 style={{ color: card.color, fontSize: '2.5rem', margin: 0 }}>{card.value}</h2>
        </div>
      ))}
    </div>
  );
}
