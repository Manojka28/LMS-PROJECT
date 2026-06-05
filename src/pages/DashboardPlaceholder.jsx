import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import MagneticButton from '../components/MagneticButton';
import ProgressBar from '../components/ProgressBar';

export default function DashboardPlaceholder() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'instructor' || user?.role === 'admin') {
      navigate('/instructor/dashboard', { replace: true });
      return;
    }
    if (user?.role === 'student') {
      navigate('/student/dashboard', { replace: true });
      return;
    }
    setLoading(false);
  }, [user]);

  const totalCourses = progressList.length;
  const completedCourses = progressList.filter(p => p.completed).length;
  const avgProgress = totalCourses > 0 
    ? Math.round(progressList.reduce((acc, curr) => acc + curr.completionPercentage, 0) / totalCourses)
    : 0;

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '600px', width: '100%' }}>
        <img src="/logos/iiitl-logo.svg" alt="IIITL" className="auth-logo" />
        <h1>Welcome, {user?.name}</h1>
        
        <p className="auth-subtitle">
          Role: <span className="green">{user?.role}</span>
        </p>

        {!loading && user?.role === 'student' && (
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', margin: '20px 0', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '15px' }}>Your Learning Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: '#222', padding: '15px', borderRadius: '8px' }}>
                <h4 className="muted">Enrolled Courses</h4>
                <h2 className="green" style={{ fontSize: '2rem' }}>{totalCourses}</h2>
              </div>
              <div style={{ background: '#222', padding: '15px', borderRadius: '8px' }}>
                <h4 className="muted">Completed Courses</h4>
                <h2 className="green" style={{ fontSize: '2rem' }}>{completedCourses}</h2>
              </div>
            </div>
            <div>
              <h4 className="muted" style={{ marginBottom: '10px' }}>Average Completion</h4>
              <ProgressBar percentage={avgProgress} />
            </div>
          </div>
        )}

        <div className="auth-actions" style={{ marginTop: '20px' }}>
          {user?.role === 'student' ? (
            <Link to="/my-courses">
              <MagneticButton className="green-btn ripple-btn">My Courses</MagneticButton>
            </Link>
          ) : (
            <Link to="/courses">
              <MagneticButton className="green-btn ripple-btn">Browse Courses</MagneticButton>
            </Link>
          )}
          {(user?.role === 'instructor' || user?.role === 'admin') && (
            <Link to="/instructor/create-course">
              <MagneticButton className="ripple-btn">Create Course</MagneticButton>
            </Link>
          )}
          <Link to="/">
            <MagneticButton className="ripple-btn">Back to Home</MagneticButton>
          </Link>
          <MagneticButton
            className="green-btn ripple-btn"
            style={{ border: '1px solid #444', background: 'transparent' }}
            onClick={async () => {
              await logout();
              window.location.href = '/';
            }}
          >
            Log Out
          </MagneticButton>
        </div>
      </div>
    </div>
  );
}
