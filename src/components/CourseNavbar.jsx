import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../utils/navigation';
import { useWishlist } from '../context/WishlistContext';
import MagneticButton from './MagneticButton';
import { api } from '../services/api';

export default function CourseNavbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { wishlistIds } = useWishlist();
  const navigate = useNavigate();
  const canManage = user && (user.role === 'instructor' || user.role === 'admin');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notification');
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notification/${id}/read`);
      setUnreadCount(Math.max(0, unreadCount - 1));
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {}
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notification/mark-all-read');
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {}
  };

  const handleSignIn = () => {
    setMobileMenuOpen(false);
    navigate(isAuthenticated ? getDashboardPath(user?.role) : '/login');
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
        <div className="nav2" ref={dropdownRef}>
          <Link to="/">Home</Link>
          <Link to="/courses">Courses</Link>
          {user && user.role === 'student' && <Link to="/my-courses">My Courses</Link>}
          {canManage && <Link to="/instructor/create-course">Create Course</Link>}
          <MagneticButton className="signin-btn" onClick={handleSignIn}>
            {isAuthenticated ? 'Dashboard' : 'Sign In'}
          </MagneticButton>
          {isAuthenticated && (
            <div className="nav-icons" style={{ position: 'relative', display: 'flex', gap: '20px', alignItems: 'center' }}>
              {user.role === 'student' && (
                <Link to="/wishlist" 
                  className="nav-wishlist"
                  title="Wishlist"
                  style={{ position: 'relative', fontSize: '20px', color: '#ccc', textDecoration: 'none' }}
                >
                  <i className="ri-heart-3-line" />
                  {wishlistIds.size > 0 && (
                    <span style={{ position: 'absolute', top: '-5px', right: '-8px', background: '#ef4444', color: '#fff', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {wishlistIds.size > 9 ? '9+' : wishlistIds.size}
                    </span>
                  )}
                </Link>
              )}

              <div 
                className="nav-notification"
                onClick={() => { setShowNotifications(!showNotifications); setShowUserDropdown(false); }}
                style={{ cursor: 'pointer', position: 'relative', fontSize: '20px', color: '#ccc' }}
              >
                <i className="ri-notification-3-line" />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>

              {showNotifications && (
                <div className="notifications-dropdown" style={{ 
                  position: 'absolute', right: '50px', top: '50px', background: '#1a1a1a', 
                  border: '1px solid #333', borderRadius: '8px', width: '300px', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', maxHeight: '400px', display: 'flex', flexDirection: 'column'
                }}>
                  <div style={{ borderBottom: '1px solid #333', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: '15px' }}>Notifications</h4>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', cursor: 'pointer' }}>Mark all read</button>
                    )}
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '13px' }}>No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n._id}
                          onClick={() => { if (!n.isRead) markAsRead(n._id); if (n.link) navigate(n.link); setShowNotifications(false); }}
                          style={{ padding: '12px 15px', borderBottom: '1px solid #222', background: n.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseOut={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: n.isRead ? '#aaa' : '#fff' }}>{n.title}</span>
                            {!n.isRead && <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></span>}
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: '#888', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ borderTop: '1px solid #333', padding: '10px', textAlign: 'center' }}>
                    <Link to="/notifications" onClick={() => setShowNotifications(false)} style={{ color: '#3b82f6', fontSize: '13px', textDecoration: 'none' }}>View All Notifications</Link>
                  </div>
                </div>
              )}

              <div 
                className="nav-avatar" 
                title={user.name}
                onClick={() => { setShowUserDropdown(!showUserDropdown); setShowNotifications(false); }}
                style={{ cursor: 'pointer' }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              
              {showUserDropdown && (
                <div className="user-dropdown" style={{ 
                  position: 'absolute', right: 0, top: '50px', background: '#1a1a1a', 
                  border: '1px solid #333', borderRadius: '8px', padding: '15px', 
                  width: '220px', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                  <div style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>{user.name}</h4>
                    <p style={{ margin: '5px 0 0', color: '#888', fontSize: '13px', wordBreak: 'break-all' }}>{user.email}</p>
                    <p style={{ margin: '5px 0 0', color: '#27ae60', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{user.role}</p>
                  </div>
                  <Link 
                    to={getDashboardPath(user?.role)} 
                    style={{ display: 'block', padding: '8px 0', color: '#ddd', textDecoration: 'none', fontSize: '14px' }}
                    onClick={() => setShowUserDropdown(false)}
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 0', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
                  >
                    Logout
                  </button>
                </div>
              )}
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
          {user && user.role === 'student' && (
            <Link to="/wishlist" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
              Wishlist {wishlistIds.size > 0 && `(${wishlistIds.size})`}
            </Link>
          )}
          {isAuthenticated && (
            <Link to="/notifications" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
              Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
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
