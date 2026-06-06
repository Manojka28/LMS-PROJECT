import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

const NAV_ITEMS = [
  { id: 'overview',     label: 'Overview',     icon: 'ri-dashboard-3-line' },
  { id: 'users',        label: 'Users',        icon: 'ri-team-line' },
  { id: 'courses',      label: 'Courses',      icon: 'ri-book-3-line' },
  { id: 'payments',     label: 'Payments',     icon: 'ri-bank-card-line' },
  { id: 'instructors',  label: 'Instructors',  icon: 'ri-user-star-line' },
];

export default function AdminLayout({ activeTab, onTabSelect, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const activeLabel = NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Dashboard';

  return (
    <div className="admin-root">
      {/* ─── MOBILE SIDEBAR OVERLAY ─── */}
      {sidebarOpen && (
        <div 
          className="admin-sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* ─── LEFT SIDEBAR ─── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-logo">
            <i className="ri-shield-star-fill" />
          </div>
          <div className="admin-brand-text">
            <h2>LMS Admin</h2>
            <p>Control Center</p>
          </div>
        </div>

        <div className="admin-nav-group">
          <p className="admin-nav-label">Main Menu</p>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                onTabSelect(item.id);
                setSidebarOpen(false); // close on mobile
              }}
            >
              <i className={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="admin-sidebar-footer">
          <button className="admin-btn-logout" onClick={handleLogout}>
            <i className="ri-logout-box-r-line" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT WRAPPER ─── */}
      <div className="admin-main-wrapper">
        
        {/* TOP NAVBAR */}
        <header className="admin-header">
          <div className="admin-header-left">
            {/* Mobile menu toggle */}
            <button 
              className="admin-btn-icon" 
              style={{ display: window.innerWidth <= 992 ? 'flex' : 'none', fontSize: 24 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="ri-menu-line" />
            </button>
            <h1 className="admin-page-title">{activeLabel}</h1>
          </div>
          
          <div className="admin-header-right">
            <div className="admin-date-picker">
              <i className="ri-calendar-event-line" />
              <span>{today}</span>
            </div>
            
            <div className="admin-profile-badge">
              <div className="admin-avatar">
                {user?.name?.charAt(0) || <i className="ri-user-settings-line" />}
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <main className="admin-content-scroll">
          {children}
        </main>

      </div>
    </div>
  );
}
