import React from 'react';

export default function AnalyticsCards({ analytics }) {
  if (!analytics) return null;

  const { 
    totalCourses, publishedCourses, draftCourses, 
    totalEnrollments, totalStudents, totalRevenue, monthlyRevenue, totalWishlists,
    revenueData, enrollmentData, completionRate, avgQuizScore, avgAssignmentScore
  } = analytics;

  const cards = [
    { label: 'Total Revenue', value: totalRevenue !== undefined ? `₹${totalRevenue}` : '₹0', color: '#10b981' },
    { label: 'Monthly Revenue', value: revenueData?.monthly !== undefined ? `₹${revenueData.monthly}` : (monthlyRevenue !== undefined ? `₹${monthlyRevenue}` : '₹0'), color: '#3b82f6' },
    { label: 'Weekly Revenue', value: revenueData?.weekly !== undefined ? `₹${revenueData.weekly}` : '₹0', color: '#6366f1' },
    { label: 'Daily Revenue', value: revenueData?.daily !== undefined ? `₹${revenueData.daily}` : '₹0', color: '#8b5cf6' },
    
    { label: 'Total Enrollments', value: totalEnrollments, color: '#ec4899' },
    { label: 'Monthly Enrollments', value: enrollmentData?.monthly || 0, color: '#f43f5e' },
    { label: 'Weekly Enrollments', value: enrollmentData?.weekly || 0, color: '#f59e0b' },
    { label: 'Daily Enrollments', value: enrollmentData?.daily || 0, color: '#eab308' },

    { label: 'Completion Rate', value: completionRate !== undefined ? `${completionRate}%` : '0%', color: '#14b8a6' },
    { label: 'Avg Quiz Score', value: avgQuizScore !== undefined ? `${avgQuizScore}%` : '0%', color: '#0ea5e9' },
    { label: 'Avg Assignment Score', value: avgAssignmentScore !== undefined ? `${avgAssignmentScore}` : '0', color: '#64748b' },
    
    { label: 'Total Wishlists', value: totalWishlists || 0, color: '#ef4444' },
    { label: 'Total Students', value: totalStudents, color: '#ec4899' },
    { label: 'Total Courses', value: totalCourses, color: '#4f46e5' },
    { label: 'Published', value: publishedCourses, color: '#10b981' },
    { label: 'Drafts', value: draftCourses, color: '#f59e0b' },
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
