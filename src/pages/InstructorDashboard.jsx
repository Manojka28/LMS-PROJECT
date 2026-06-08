import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import AnalyticsCards from '../components/AnalyticsCards';
import InstructorCourseTable from '../components/InstructorCourseTable';
import MagneticButton from '../components/MagneticButton';
import { useAuth } from '../context/AuthContext';

export default function InstructorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [discussionAnalytics, setDiscussionAnalytics] = useState(null);
  const [certificateAnalytics, setCertificateAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const data = await api.get('/instructor/dashboard/analytics');
      if (data.success) {
        setAnalytics(data.analytics);
      }
      const discussionData = await api.get('/discussion/analytics/instructor');
      if (discussionData.success) {
        setDiscussionAnalytics(discussionData.analytics);
      }
      const certData = await api.get('/certificate/instructor/analytics').catch(() => ({ success: false }));
      if (certData && certData.success) {
        setCertificateAnalytics(certData.analytics);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/instructor/courses`, {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: filter
      });
      if (data.success) {
        setCourses(data.courses);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filter]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCourses();
    }, 300); // debounce search
    return () => clearTimeout(delayDebounceFn);
  }, [fetchCourses]);

  const handlePublishToggle = async (courseId, newStatus) => {
    try {
      const action = newStatus ? 'publish' : 'unpublish';
      await api.put(`/course/${courseId}/${action}`);
      fetchCourses(); // refresh table
      fetchAnalytics(); // refresh analytics
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update publish status');
    }
  };

  const handleDelete = async (courseId) => {
    try {
      await api.delete(`/course/${courseId}`);
      fetchCourses();
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRevoke = async (certificateId) => {
    const reason = prompt('Enter reason for revocation:');
    if (!reason) return;
    try {
      await api.post('/certificate/revoke', { certificateId, reason });
      alert('Certificate revoked successfully');
      fetchAnalytics(); // Refresh
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke certificate');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Instructor Dashboard</h1>
          <p className="muted" style={{ margin: '5px 0 0 0' }}>Welcome back, {user?.name} ({user?.role})</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button 
            onClick={handleLogout} 
            className="outline-btn" 
            style={{ padding: '8px 16px', border: '1px solid #333', background: 'transparent', color: '#fff', borderRadius: '8px', cursor: 'pointer', height: 'fit-content' }}>
            Logout
          </button>
          <Link to="/instructor/create-course">
            <MagneticButton className="green-btn ripple-btn">+ Create New Course</MagneticButton>
          </Link>
        </div>
      </div>

      {analytics && <AnalyticsCards analytics={analytics} />}

      {discussionAnalytics && (
        <div style={{ marginTop: '20px', background: '#111', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Discussion Q&A Analytics</h3>
          <div className="dashboard-grid">
            <div style={{ padding: '15px', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #222' }}>
              <div style={{ fontSize: '14px', color: '#888' }}>Total Questions</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{discussionAnalytics.totalQuestions}</div>
            </div>
            <div style={{ padding: '15px', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #222' }}>
              <div style={{ fontSize: '14px', color: '#888' }}>Unanswered</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{discussionAnalytics.unansweredQuestions}</div>
            </div>
            <div style={{ padding: '15px', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #222' }}>
              <div style={{ fontSize: '14px', color: '#888' }}>Resolved</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{discussionAnalytics.resolvedQuestions}</div>
            </div>
          </div>
        </div>
      )}

      {certificateAnalytics && (
        <div style={{ marginTop: '40px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Certificate Analytics</h2>
          
          <div className="dashboard-grid" style={{ marginBottom: '30px' }}>
            <div style={{ padding: '20px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>
              <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>Total Issued</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>{certificateAnalytics.totalIssued}</div>
            </div>
            <div style={{ padding: '20px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #10b98150' }}>
              <div style={{ fontSize: '14px', color: '#10b981', marginBottom: '10px' }}>Valid Certificates</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{certificateAnalytics.validCertificates}</div>
            </div>
            <div style={{ padding: '20px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #ef444450' }}>
              <div style={{ fontSize: '14px', color: '#ef4444', marginBottom: '10px' }}>Revoked</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{certificateAnalytics.revokedCount}</div>
            </div>
          </div>

          <div className="dashboard-grid-2col">
            <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '20px', border: '1px solid #333' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Certificates Per Course</h3>
              {certificateAnalytics.certificatesPerCourse.length === 0 ? (
                <p style={{ color: '#888' }}>No certificates issued yet.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {certificateAnalytics.certificatesPerCourse.map((c, i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #333' }}>
                      <span>{c.name}</span>
                      <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{c.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '20px', border: '1px solid #333' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Recent Graduates</h3>
              {certificateAnalytics.recentIssuances.length === 0 ? (
                <p style={{ color: '#888' }}>No recent graduates.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {certificateAnalytics.recentIssuances.map((c, i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #333' }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 'bold' }}>{c.studentName}</div>
                        <div style={{ color: '#888', fontSize: '12px' }}>{c.courseTitle}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: c.status === 'Valid' ? '#10b981' : '#ef4444', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>{c.status.toUpperCase()}</div>
                        <div style={{ color: '#555', fontSize: '12px', marginBottom: '5px' }}>{new Date(c.issuedAt).toLocaleDateString()}</div>
                        {c.status === 'Valid' && (
                          <button 
                            onClick={() => handleRevoke(c.certificateId)}
                            style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {analytics?.revenuePerCourse && analytics.revenuePerCourse.length > 0 && (
        <div style={{ marginTop: '40px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Top Selling Courses</h2>
          <div className="responsive-table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Paid Enrollments</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.revenuePerCourse.slice(0, 5).map((rev, idx) => (
                  <tr key={idx}>
                    <td>{rev.courseTitle}</td>
                    <td>{rev.paidEnrollments}</td>
                    <td style={{ color: '#10b981', fontWeight: 'bold' }}>₹{rev.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {analytics?.topWishlistedCourses && analytics.topWishlistedCourses.length > 0 && (
        <div style={{ marginTop: '40px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Top Wishlisted Courses</h2>
          <div className="responsive-table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Wishlist Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topWishlistedCourses.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.title}</td>
                    <td style={{ color: '#ef4444', fontWeight: 'bold' }}>{item.count} <i className="ri-heart-3-fill" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InstructorCourseTable
        courses={courses}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        onPageChange={setCurrentPage}
        onSearch={(term) => {
          setSearchTerm(term);
          setCurrentPage(1);
        }}
        onFilterChange={(f) => {
          setFilter(f);
          setCurrentPage(1);
        }}
        onPublishToggle={handlePublishToggle}
        onDelete={handleDelete}
      />
    </div>
  );
}
