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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
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

      {analytics?.revenuePerCourse && analytics.revenuePerCourse.length > 0 && (
        <div style={{ marginTop: '40px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Top Selling Courses</h2>
          <div style={{ overflowX: 'auto', background: '#1a1a1a', borderRadius: '12px', padding: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px 10px' }}>Course Title</th>
                  <th style={{ padding: '12px 10px' }}>Paid Enrollments</th>
                  <th style={{ padding: '12px 10px' }}>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.revenuePerCourse.slice(0, 5).map((rev, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '12px 10px', color: '#fff' }}>{rev.courseTitle}</td>
                    <td style={{ padding: '12px 10px', color: '#fff' }}>{rev.paidEnrollments}</td>
                    <td style={{ padding: '12px 10px', color: '#10b981', fontWeight: 'bold' }}>₹{rev.revenue}</td>
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
          <div style={{ overflowX: 'auto', background: '#1a1a1a', borderRadius: '12px', padding: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px 10px' }}>Course Title</th>
                  <th style={{ padding: '12px 10px' }}>Wishlist Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topWishlistedCourses.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '12px 10px', color: '#fff' }}>{item.title}</td>
                    <td style={{ padding: '12px 10px', color: '#ef4444', fontWeight: 'bold' }}>{item.count} <i className="ri-heart-3-fill" /></td>
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
