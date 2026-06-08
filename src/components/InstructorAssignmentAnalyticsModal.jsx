import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function InstructorAssignmentAnalyticsModal({ course, onClose }) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(`/instructor/course/${course._id}/assignments/analytics`);
      if (res.success) {
        setAnalytics(res.analytics);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load assignment analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#111', padding: '30px', borderRadius: '12px', border: '1px solid #333', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0' }}>Assignment Analytics: {course.title}</h2>
            {analytics && (
              <p style={{ margin: 0, color: '#888' }}>
                Total Assignments: {analytics.totalAssignments} | Submissions: {analytics.totalSubmissions} | Pending: {analytics.pendingReviews}
              </p>
            )}
            {analytics && analytics.reviewedCount > 0 && (
              <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#aaa' }}>
                Avg Marks: <span style={{ color: '#10b981', fontWeight: 'bold' }}>{analytics.averageMarks}</span> | Highest: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{analytics.highestMarks}</span> | Lowest: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{analytics.lowestMarks}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '24px' }}>
            <i className="ri-close-line" />
          </button>
        </div>

        {loading ? (
          <div className="loading-state" style={{ minHeight: '200px' }}>
            <div className="loading-spinner" />
            <span className="loading-state-text">Loading analytics...</span>
          </div>
        ) : !analytics || analytics.submissions.length === 0 ? (
          <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
            <i className="ri-file-chart-line empty-state-icon" />
            <p className="empty-state-text">No assignment submissions recorded yet.</p>
          </div>
        ) : (
          <div className="responsive-table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Assignment</th>
                  <th>Status</th>
                  <th>Marks</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {analytics.submissions.map((sub) => (
                  <tr key={sub._id}>
                    <td>
                      <div style={{ color: '#fff', fontWeight: '500' }}>{sub.student?.name || 'Unknown User'}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{sub.student?.email}</div>
                    </td>
                    <td>{sub.assignment?.title || 'Unknown Assignment'}</td>
                    <td>
                      <span className={`status-badge ${sub.status === 'Reviewed' ? 'success' : 'warning'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 'bold', color: sub.status === 'Reviewed' ? '#fff' : '#444' }}>
                      {sub.marks !== undefined ? sub.marks : '-'}
                    </td>
                    <td style={{ fontSize: '12px' }}>{new Date(sub.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
