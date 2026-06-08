import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import AnalyticsCards from '../components/AnalyticsCards';
import InstructorCourseTable from '../components/InstructorCourseTable';
import MagneticButton from '../components/MagneticButton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/ToastContext';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import { FadeIn, SlideUp, StaggerContainer, StaggerItem, HoverCard } from '../components/common/MotionWrapper';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';

// Placeholder data for premium SaaS visual upgrades
const revenueTrendData = [
  { name: 'Week 1', revenue: 4000 },
  { name: 'Week 2', revenue: 3000 },
  { name: 'Week 3', revenue: 5000 },
  { name: 'Week 4', revenue: 8000 },
  { name: 'Week 5', revenue: 6000 },
  { name: 'Week 6', revenue: 9000 },
  { name: 'Week 7', revenue: 12000 },
];

export default function InstructorDashboard() {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
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
      showError('Failed to load instructor analytics');
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
      showError('Failed to load courses');
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
      showSuccess(`Course ${action}ed successfully`);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update publish status');
    }
  };

  const handleDelete = async (courseId) => {
    try {
      await api.delete(`/course/${courseId}`);
      fetchCourses();
      fetchAnalytics();
      showSuccess('Course deleted successfully');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete course');
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
      showSuccess('Certificate revoked successfully');
      fetchAnalytics(); // Refresh
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to revoke certificate');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <FadeIn duration={0.8} yOffset={20}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 className="saas-heading" style={{ margin: 0, fontSize: '2.5rem' }}>Instructor Dashboard</h1>
            <p className="muted" style={{ margin: '5px 0 0 0', fontSize: '16px' }}>Welcome back, {user?.name}. Here's how your courses are performing.</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button 
              onClick={handleLogout} 
              className="saas-card" 
              style={{ padding: '10px 20px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', borderRadius: '8px', cursor: 'pointer', height: 'fit-content' }}>
              Logout
            </button>
            <Link to="/instructor/create-course">
              <MagneticButton className="green-btn ripple-btn" style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '15px' }}>+ Create New Course</MagneticButton>
            </Link>
          </div>
        </div>
      </FadeIn>

      {!analytics && loading ? (
        <SkeletonLoader type="card" count={2} />
      ) : (
        analytics && (
          <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <StaggerItem>
              <AnalyticsCards analytics={analytics} />
            </StaggerItem>

            {/* REVENUE TRENDS & TOP COURSES WIDGETS */}
            <StaggerItem className="dashboard-grid-2col" style={{ gridTemplateColumns: '2fr 1fr' }}>
              
              {/* REVENUE TREND AREA CHART */}
              <div className="saas-card premium-glass-panel" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="ri-line-chart-line" style={{ color: '#00D26A' }}></i> Revenue Trend
                  </h3>
                  <div style={{ background: 'rgba(0,210,106,0.1)', color: '#00D26A', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(0,210,106,0.2)' }}>
                    ↑ 14% This Month
                  </div>
                </div>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00D26A" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#00D26A" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} dx={-10} tickFormatter={(value) => `₹${value/1000}k`} />
                      <Tooltip 
                        contentStyle={{ background: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ color: '#00D26A', fontWeight: 'bold' }}
                        formatter={(value) => [`₹${value}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#00D26A" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* COURSE PERFORMANCE BAR CHART */}
              <div className="saas-card premium-glass-panel" style={{ padding: '32px' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ri-bar-chart-grouped-line" style={{ color: '#3b82f6' }}></i> Top Performing
                </h3>
                <div style={{ height: '300px' }}>
                  {!analytics.revenuePerCourse || analytics.revenuePerCourse.length === 0 ? (
                    <EmptyState icon="ri-bar-chart-2-line" title="No Sales Yet" description="Your course sales will appear here." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.revenuePerCourse.slice(0,4)} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="courseTitle" type="category" stroke="#888" fontSize={11} tickLine={false} axisLine={false} width={100} />
                        <Tooltip 
                          contentStyle={{ background: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          formatter={(value) => [`₹${value}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={20}>
                          {analytics.revenuePerCourse.slice(0,4).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][index % 4]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </StaggerItem>

            {/* STUDENT ENGAGEMENT SUMMARY */}
            <StaggerItem className="dashboard-grid">
              <HoverCard className="saas-card" style={{ padding: '24px', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#888', fontSize: '14px', textTransform: 'uppercase' }}>Active Students</h3>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>{analytics?.totalStudents || 0}</div>
                  </div>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', fontSize: '24px' }}>
                    <i className="ri-user-smile-fill"></i>
                  </div>
                </div>
              </HoverCard>

              {discussionAnalytics && (
                <>
                  <HoverCard className="saas-card" style={{ padding: '24px', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', color: '#888', fontSize: '14px', textTransform: 'uppercase' }}>Unanswered Q&A</h3>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>{discussionAnalytics.unansweredQuestions}</div>
                      </div>
                      <div style={{ width: '48px', height: '48px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '24px' }}>
                        <i className="ri-question-answer-fill"></i>
                      </div>
                    </div>
                  </HoverCard>
                  <HoverCard className="saas-card" style={{ padding: '24px', borderLeft: '4px solid #10b981' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', color: '#888', fontSize: '14px', textTransform: 'uppercase' }}>Resolved Queries</h3>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>{discussionAnalytics.resolvedQuestions}</div>
                      </div>
                      <div style={{ width: '48px', height: '48px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '24px' }}>
                        <i className="ri-check-double-line"></i>
                      </div>
                    </div>
                  </HoverCard>
                </>
              )}
            </StaggerItem>

            {certificateAnalytics && (
              <StaggerItem>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 className="saas-heading" style={{ fontSize: '1.5rem', margin: 0 }}>Certificate Engine</h2>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '14px' }}>
                      Issued: <strong style={{ color: '#fff' }}>{certificateAnalytics.totalIssued}</strong>
                    </div>
                    <div style={{ background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: '8px', fontSize: '14px', color: '#10b981' }}>
                      Valid: <strong>{certificateAnalytics.validCertificates}</strong>
                    </div>
                  </div>
                </div>

                <div className="dashboard-grid-2col">
                  <div className="saas-card premium-glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '20px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Certificates Per Course</h3>
                    {certificateAnalytics.certificatesPerCourse.length === 0 ? (
                      <EmptyState icon="ri-medal-line" title="No certificates" description="No certificates issued yet." />
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {certificateAnalytics.certificatesPerCourse.map((c, i) => (
                          <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ color: '#ddd' }}>{c.name}</span>
                            <span style={{ fontWeight: 'bold', color: '#00D26A' }}>{c.count}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="saas-card premium-glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '20px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Graduates</h3>
                    {certificateAnalytics.recentIssuances.length === 0 ? (
                      <EmptyState icon="ri-graduation-cap-line" title="No graduates" description="No recent graduates." />
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {certificateAnalytics.recentIssuances.slice(0, 4).map((c, i) => (
                          <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="ri-user-fill"></i>
                              </div>
                              <div>
                                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>{c.studentName}</div>
                                <div style={{ color: '#888', fontSize: '12px' }}>{c.courseTitle}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: c.status === 'Valid' ? '#10b981' : '#ef4444', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', border: `1px solid ${c.status === 'Valid' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                {c.status.toUpperCase()}
                              </div>
                              <div style={{ color: '#555', fontSize: '12px' }}>{new Date(c.issuedAt).toLocaleDateString()}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </StaggerItem>
            )}

            {analytics?.topWishlistedCourses && analytics.topWishlistedCourses.length > 0 && (
              <StaggerItem>
                <h2 className="saas-heading" style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Market Demand (Wishlists)</h2>
                <div className="saas-card responsive-table-wrap" style={{ overflow: 'hidden' }}>
                  <table className="responsive-table">
                    <thead>
                      <tr>
                        <th>Course Title</th>
                        <th style={{ textAlign: 'right' }}>Wishlist Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topWishlistedCourses.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ color: '#ddd' }}>{item.title}</td>
                          <td style={{ color: '#ef4444', fontWeight: 'bold', textAlign: 'right' }}>
                            {item.count} <i className="ri-heart-3-fill" style={{ marginLeft: '4px' }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </StaggerItem>
            )}

            <StaggerItem>
              <h2 className="saas-heading" style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Course Management</h2>
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
            </StaggerItem>

          </StaggerContainer>
        )
      )}
    </div>
  );
}
