import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AssignmentGradingModal({ assignment, onClose }) {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await api.get(`/assignment/${assignment._id}/submissions`);
      if (res.success) {
        setSubmissions(res.submissions);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (subId, field, value) => {
    setSubmissions(submissions.map(sub => 
      sub._id === subId ? { ...sub, [field]: value } : sub
    ));
  };

  const submitGrade = async (sub) => {
    try {
      const res = await api.put(`/assignment/submission/${sub._id}/grade`, {
        marks: sub.marks,
        feedback: sub.feedback
      });
      if (res.success) {
        setSubmissions(submissions.map(s => s._id === sub._id ? res.submission : s));
        alert('Grade submitted!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit grade');
    }
  };

  const getFullUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }} onClick={onClose}>
      <div style={{ background: '#111', width: '90%', maxWidth: '1000px', height: '80vh', borderRadius: '12px', border: '1px solid #333', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a1a' }}>
          <div>
            <h2 style={{ margin: 0 }}>Submissions: {assignment.title}</h2>
            <p style={{ margin: '5px 0 0 0', color: '#888' }}>Max Marks: {assignment.maxMarks}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '24px' }}>
            <i className="ri-close-line" />
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>No submissions yet.</div>
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#222', color: '#888', borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '15px', fontWeight: 'normal' }}>Student</th>
                  <th style={{ padding: '15px', fontWeight: 'normal' }}>File</th>
                  <th style={{ padding: '15px', fontWeight: 'normal' }}>Status</th>
                  <th style={{ padding: '15px', fontWeight: 'normal', width: '100px' }}>Marks</th>
                  <th style={{ padding: '15px', fontWeight: 'normal' }}>Feedback</th>
                  <th style={{ padding: '15px', fontWeight: 'normal' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub._id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ color: '#fff', fontWeight: '500' }}>{sub.student?.name || 'Unknown'}</div>
                      <div style={{ color: '#888', fontSize: '12px' }}>{new Date(sub.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <a href={getFullUrl(sub.submissionUrl)} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <i className="ri-file-download-line"></i> Download
                      </a>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', background: sub.status === 'Reviewed' ? '#10b98120' : '#f59e0b20', color: sub.status === 'Reviewed' ? '#10b981' : '#f59e0b' }}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <input 
                        type="number" 
                        value={sub.marks !== undefined ? sub.marks : ''} 
                        onChange={(e) => handleGradeChange(sub._id, 'marks', Number(e.target.value))}
                        max={assignment.maxMarks}
                        style={{ width: '70px', padding: '8px', background: '#000', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                      />
                    </td>
                    <td style={{ padding: '15px' }}>
                      <input 
                        type="text" 
                        placeholder="Add feedback..."
                        value={sub.feedback || ''} 
                        onChange={(e) => handleGradeChange(sub._id, 'feedback', e.target.value)}
                        style={{ width: '100%', padding: '8px', background: '#000', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                      />
                    </td>
                    <td style={{ padding: '15px' }}>
                      <button 
                        onClick={() => submitGrade(sub)}
                        style={{ padding: '8px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          )}
        </div>
      </div>
    </div>
  );
}
