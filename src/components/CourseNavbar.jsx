import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MagneticButton from './MagneticButton';

export default function CourseNavbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const canManage = user && (user.role === 'instructor' || user.role === 'admin');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleSignIn = () => {
    setMobileMenuOpen(false);
    navigate(isAuthenticated ? '/dashboard' : '/login');
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <>
      <nav className="course-nav">
        <Link to="/" className="nav1 course-nav-brand">
          <img src="/logos/iiitl-logo.svg" alt="IIITL Coding School logo" />
          <h4>
            IIITL <br /> Coding School
          </h4>
        </Link>
        <div className="nav2">
          <Link to="/">Home</Link>
          <Link to="/courses">Courses</Link>
          {user && user.role === 'student' && <Link to="/my-courses">My Courses</Link>}
          {canManage && <Link to="/instructor/create-course">Create Course</Link>}
          <MagneticButton className="signin-btn" onClick={handleSignIn}>
            {isAuthenticated ? 'Dashboard' : 'Sign In'}
          </MagneticButton>
          {isAuthenticated && (
            <div className="nav-icons">
              <div className="nav-avatar" title={user.name}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                type="button"
                className="nav-logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
        <div className="nav3">
          <Link to="/courses" aria-label="Courses">
            <i className="ri-book-open-line" />
          </Link>
          <button type="button" className="signin-btn-mobile" onClick={handleSignIn}>
            {isAuthenticated ? 'Dashboard' : 'Sign In'}
          </button>
          <h4
            role="button"
            tabIndex={0}
            aria-label="Menu"
            onClick={() => setMobileMenuOpen(true)}
            style={{ marginLeft: '10px', cursor: 'pointer' }}
          >
            <i className="ri-menu-3-fill" />
          </h4>
        </div>
      </nav>

      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}>
        <div className="mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <i className="ri-close-line" />
          </button>
          
          <Link to="/" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link to="/courses" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
            Courses
          </Link>
          {user && user.role === 'student' && (
            <Link to="/my-courses" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
              My Courses
            </Link>
          )}
          {canManage && (
            <Link to="/instructor/create-course" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
              Create Course
            </Link>
          )}
          
          <button type="button" className="mobile-menu-link green" onClick={handleSignIn}>
            {isAuthenticated ? 'Dashboard' : 'Sign In'}
          </button>
          
          {isAuthenticated && (
            <button type="button" className="mobile-menu-link" onClick={handleLogout} style={{ color: '#ff6b6b', borderColor: '#ff3b3b' }}>
              Logout
            </button>
          )}
        </div>
      </div>
    </>
  );
}
