import React from 'react';

const CARDS = [
  { key: 'totalUsers',               label: 'Total Users',               icon: 'ri-group-fill',          color: '#3b82f6' },
  { key: 'totalStudents',            label: 'Students',                  icon: 'ri-user-fill',           color: '#8b5cf6' },
  { key: 'totalInstructors',         label: 'Instructors',               icon: 'ri-user-star-fill',      color: '#06b6d4' },
  { key: 'totalCourses',             label: 'Courses',                   icon: 'ri-book-fill',           color: '#f59e0b' },
  { key: 'totalEnrollments',         label: 'Enrollments',               icon: 'ri-graduation-cap-fill', color: '#10b981' },
  { key: 'totalRevenue',             label: 'Total Revenue (₹)',         icon: 'ri-money-rupee-circle-fill', color: '#22c55e', prefix: '₹' },
  { key: 'totalPayments',            label: 'Total Payments',            icon: 'ri-bank-card-fill',      color: '#f43f5e' },
  { key: 'totalCertificates',        label: 'Certificates Issued',       icon: 'ri-award-fill',          color: '#eab308' },
  { key: 'totalAssignmentSubmissions', label: 'Assignment Submissions',  icon: 'ri-file-upload-fill',    color: '#64748b' },
  { key: 'totalQuizAttempts',        label: 'Quiz Attempts',             icon: 'ri-questionnaire-fill',  color: '#ec4899' },
];

export default function AdminAnalyticsCards({ analytics }) {
  if (!analytics) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px', marginBottom: '40px' }}>
      {CARDS.map(card => (
        <div key={card.key} style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)',
          border: `1px solid ${card.color}30`,
          borderRadius: '14px', padding: '22px',
          display: 'flex', flexDirection: 'column', gap: '10px',
          boxShadow: `0 4px 20px ${card.color}15`
        }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${card.color}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: card.color }}>
            <i className={card.icon} />
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>{card.label}</p>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#fff' }}>
            {card.prefix || ''}{analytics[card.key] ?? 0}
          </p>
        </div>
      ))}
    </div>
  );
}
