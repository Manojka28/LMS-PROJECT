import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function InstructorQuizAnalyticsModal({ course, onClose }) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(`/instructor/course/${course._id}/quizzes/analytics`);
      if (res.success) {
        setAnalytics(res.analytics);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load quiz analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#111', padding: '30px', borderRadius: '12px', border: '1px solid #333', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0' }}>Quiz Analytics: {course.title}</h2>
            {analytics && (
              <p style={{ margin: 0, color: '#888' }}>
                Total Attempts: {analytics.totalAttempts} | Avg Score: {analytics.averageScore}% | Highest: {analytics.highestScore}%
              </p>
            )}
            {analytics && analytics.totalAttempts > 0 && (
              <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#aaa' }}>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>Pass Rate: {analytics.passRate}%</span> &nbsp;|&nbsp; <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Fail Rate: {analytics.failRate}%</span>
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '24px' }}>
            <i className="ri-close-line" />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading analytics...</div>
        ) : !analytics || analytics.attempts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No quiz attempts recorded yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888', background: '#222' }}>
                <th style={{ padding: '12px', fontWeight: 'normal' }}>Student</th>
                <th style={{ padding: '12px', fontWeight: 'normal' }}>Lecture (Quiz)</th>
                <th style={{ padding: '12px', fontWeight: 'normal' }}>Score</th>
                <th style={{ padding: '12px', fontWeight: 'normal' }}>Attempt Date</th>
              </tr>
            </thead>
            <tbody>
              {analytics.attempts.map((attempt) => (
                <tr key={attempt._id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ color: '#fff', fontWeight: '500' }}>{attempt.student?.name || 'Unknown User'}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{attempt.student?.email}</div>
                  </td>
                  <td style={{ padding: '12px', color: '#aaa' }}>{attempt.lecture?.title || 'Unknown Lecture'}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ color: attempt.percentage >= 80 ? '#10b981' : attempt.percentage >= 50 ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}>
                      {attempt.score}/{attempt.totalQuestions} ({attempt.percentage}%)
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: '#aaa' }}>{new Date(attempt.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
