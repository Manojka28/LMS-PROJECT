import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MagneticButton from '../components/MagneticButton';

export default function DashboardPlaceholder() {
  const { user, logout } = useAuth();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src="/logos/iiitl-logo.svg" alt="IIITL" className="auth-logo" />
        <h1>Welcome, {user?.name}</h1>
        <p className="auth-subtitle">
          Role: <span className="green">{user?.role}</span> — Full dashboard coming in Phase 2.
        </p>
        <div className="auth-actions">
          <Link to="/courses">
            <MagneticButton className="green-btn ripple-btn">Browse Courses</MagneticButton>
          </Link>
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
