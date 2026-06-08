import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

export default function PlacementDashboard() {
  const [profile, setProfile] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profRes, intRes] = await Promise.all([
        api.get('/placement/profile'),
        api.get('/placement/interviews')
      ]);
      if (profRes.success) setProfile(profRes.profile);
      if (intRes.success) setInterviews(intRes.sessions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async (type, company, round) => {
    try {
      const res = await api.post('/placement/interview/start', {
        interviewType: type,
        companyTarget: company,
        round
      });
      if (res.success) {
        navigate(`/student/interview/${res.session._id}`, { state: { question: res.question, session: res.session } });
      }
    } catch (err) {
      alert('Failed to start interview');
    }
  };

  if (loading) return (
    <div className="page-loading">
      <div className="loading-bar" style={{ width: 200 }} />
      <p>Loading Placement Data...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '36px', margin: '0 0 10px 0', fontFamily: 'Space Grotesk, sans-serif' }}>Placement Intelligence</h1>
          <p style={{ color: '#888', margin: 0 }}>Target: {profile.targetCompanyType} | Interviews Taken: {profile.totalInterviewsTaken}</p>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '40px' }}>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '14px', marginBottom: '10px' }}>Placement Readiness</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6' }}>{profile.placementReadinessScore}%</div>
        </div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '14px', marginBottom: '10px' }}>Interview Readiness</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#a855f7' }}>{profile.interviewReadinessScore}%</div>
        </div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '14px', marginBottom: '10px' }}>Technical Readiness</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981' }}>{profile.technicalReadinessScore}%</div>
        </div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '14px', marginBottom: '10px' }}>Communication Avg</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f59e0b' }}>{profile.avgCommunicationScore}</div>
        </div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '14px', marginBottom: '10px' }}>Interview Streak</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ef4444' }}>{profile.currentInterviewStreak} <span style={{ fontSize: '14px', color: '#888', fontWeight: 'normal' }}>Days</span></div>
        </div>
      </div>

      <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Start Mock Interview</h2>
      <div className="dashboard-grid" style={{ marginBottom: '40px' }}>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #4ade8050', cursor: 'pointer' }} onClick={() => startInterview('MERN Stack', profile.targetCompanyType, 2)}>
          <h3 style={{ margin: '0 0 10px 0', color: '#4ade80' }}><i className="ri-code-s-slash-line"></i> MERN Stack (Round 2)</h3>
          <p style={{ color: '#888', fontSize: '14px' }}>Technical round focusing on React, Node, Express, MongoDB.</p>
        </div>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #60a5fa50', cursor: 'pointer' }} onClick={() => startInterview('System Design', profile.targetCompanyType, 5)}>
          <h3 style={{ margin: '0 0 10px 0', color: '#60a5fa' }}><i className="ri-server-line"></i> System Design (Round 5)</h3>
          <p style={{ color: '#888', fontSize: '14px' }}>Scaling, architecture, and database design concepts.</p>
        </div>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #f472b650', cursor: 'pointer' }} onClick={() => startInterview('Behavioral', profile.targetCompanyType, 6)}>
          <h3 style={{ margin: '0 0 10px 0', color: '#f472b6' }}><i className="ri-team-line"></i> Behavioral (Round 6)</h3>
          <p style={{ color: '#888', fontSize: '14px' }}>Leadership, conflict resolution, and culture fit.</p>
        </div>
      </div>

      <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Past Interviews</h2>
      {interviews.length === 0 ? (
        <div className="empty-state">
          <i className="ri-mic-2-line empty-state-icon"></i>
          <h3 className="empty-state-title">No Interviews Taken</h3>
          <p className="empty-state-text">Start a mock interview above to practice!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {interviews.map(int => (
            <div key={int._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{int.interviewType} <span style={{ fontSize: '12px', color: '#888', fontWeight: 'normal' }}>Round {int.round} • {int.difficulty}</span></h4>
                <div style={{ color: '#aaa', fontSize: '14px' }}>{new Date(int.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: int.overallScore >= 75 ? '#10b981' : int.overallScore >= 50 ? '#f59e0b' : '#ef4444' }}>{int.overallScore} / 100</div>
                <div style={{ color: '#888', fontSize: '12px' }}>{int.recommendation || int.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
