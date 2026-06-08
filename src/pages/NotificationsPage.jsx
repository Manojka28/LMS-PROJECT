import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import CourseNavbar from '../components/CourseNavbar';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notification');
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notification/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notification/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notification/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="course-page-wrap">
      <div className="noise-overlay" />
      <CourseNavbar />

      <main className="course-page-main" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <header className="course-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Notifications Center</h1>
            <p className="muted">Manage your alerts and activity history.</p>
          </div>
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={markAllAsRead}
              className="btn btn-sm"
              style={{ background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6' }}
            >
              Mark all as read
            </button>
          )}
        </header>

        {loading ? (
          <div className="page-loading">
            <div className="loading-bar" style={{ width: 200 }} />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <i className="ri-notification-off-line empty-state-icon" />
            <h3 className="empty-state-title">No notifications yet</h3>
            <p className="empty-state-text">You're all caught up!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {notifications.map(n => (
              <div 
                key={n._id}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '20px', 
                  background: n.isRead ? '#1a1a1a' : 'rgba(59, 130, 246, 0.1)', 
                  border: `1px solid ${n.isRead ? '#333' : '#3b82f6'}`,
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  cursor: n.link ? 'pointer' : 'default'
                }}
                onClick={(e) => {
                  if (n.link && !e.target.closest('button')) {
                    if (!n.isRead) markAsRead(n._id);
                    navigate(n.link);
                  }
                }}
              >
                <div style={{ display: 'flex', gap: '15px', flex: 1 }}>
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', height: 'fit-content' }}>
                    <i className="ri-notification-3-line" style={{ color: '#ccc', fontSize: '20px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>{n.title}</span>
                      {!n.isRead && <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }} />}
                    </div>
                    <p style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '0.95rem' }}>{n.message}</p>
                    <span style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {!n.isRead && (
                    <button onClick={() => markAsRead(n._id)} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '13px', cursor: 'pointer', padding: 0 }}>Mark as Read</button>
                  )}
                  <button 
                    onClick={() => deleteNotification(n._id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '20px', cursor: 'pointer', padding: '5px' }}
                    title="Delete"
                  >
                    <i className="ri-delete-bin-line" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
