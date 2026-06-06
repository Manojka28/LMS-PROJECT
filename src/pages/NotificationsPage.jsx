import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import CourseNavbar from '../components/CourseNavbar';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notification/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
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
          {notifications.some(n => !n.read) && (
            <button className="outline-btn" onClick={markAllAsRead} style={{ fontSize: '14px', padding: '8px 16px' }}>
              Mark All as Read
            </button>
          )}
        </header>

        {loading ? (
          <div className="page-loading">
            <div className="loading-bar" style={{ width: 200 }} />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="course-state-card">
            <i className="ri-notification-badge-line" style={{ fontSize: '40px', color: '#555' }} />
            <p>No notifications yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {notifications.map(n => (
              <div 
                key={n._id}
                style={{
                  background: n.read ? '#1a1a1a' : 'rgba(59, 130, 246, 0.1)',
                  border: `1px solid ${n.read ? '#333' : '#3b82f6'}`,
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  transition: 'background 0.3s'
                }}
              >
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#aaa', fontSize: '20px'
                  }}>
                    <i className="ri-notification-3-line" />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {n.title}
                      {!n.read && <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }} />}
                    </h3>
                    <p style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '0.95rem' }}>{n.message}</p>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      {n.link && (
                        <a href={n.link} style={{ color: '#3b82f6', fontSize: '13px', textDecoration: 'none' }}>View Details</a>
                      )}
                      {!n.read && (
                        <button onClick={() => markAsRead(n._id)} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '13px', cursor: 'pointer', padding: 0 }}>Mark as Read</button>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => deleteNotification(n._id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '20px', cursor: 'pointer', padding: '5px' }}
                  title="Delete"
                >
                  <i className="ri-delete-bin-line" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
