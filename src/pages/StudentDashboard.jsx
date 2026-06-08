import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import StudentAnalyticsCards from '../components/StudentAnalyticsCards';
import ContinueLearningCard from '../components/ContinueLearningCard';
import StudentCourseGrid from '../components/StudentCourseGrid';
import ReceiptModal from '../components/ReceiptModal';
import CourseNavbar from '../components/CourseNavbar';
import { useToast } from '../components/common/ToastContext';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import { FadeIn, SlideUp, StaggerContainer, StaggerItem, HoverCard } from '../components/common/MotionWrapper';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [continueCourse, setContinueCourse] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [quizStats, setQuizStats] = useState(null);
  const [assignmentStats, setAssignmentStats] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityRange, setActivityRange] = useState('weekly');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, continueRes, coursesRes, certsRes, quizStatsRes, assignmentStatsRes, paymentRes] = await Promise.all([
          api.get('/student/dashboard/analytics'),
          api.get('/student/courses/continue'),
          api.get('/student/courses'),
          api.get('/student/certificates'),
          api.get('/student/quiz-stats').catch(() => ({ success: false })),
          api.get('/student/assignment-stats').catch(() => ({ success: false })),
          api.get('/commerce/history').catch(() => ({ success: false }))
        ]);

        if (analyticsRes.success) setAnalytics(analyticsRes.analytics);
        if (continueRes.success) setContinueCourse(continueRes.course);
        if (coursesRes.success) setEnrolledCourses(coursesRes.courses);
        if (certsRes.success) setCertificates(certsRes.certificates);
        if (quizStatsRes && quizStatsRes.success) setQuizStats(quizStatsRes.stats);
        if (assignmentStatsRes && assignmentStatsRes.success) setAssignmentStats(assignmentStatsRes.stats);
        if (paymentRes && paymentRes.success) setPaymentHistory(paymentRes.history);

        // Fetch recommendations (silent fail if API doesn't exist yet)
        api.get('/student/courses/recommendations').then(res => {
          if (res.success) setRecommendedCourses(res.recommendations);
        }).catch(() => {
          // Fallback to empty if not implemented
          setRecommendedCourses([]);
        });

      } catch (err) {
        console.error('Failed to fetch student dashboard data:', err);
        showError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showError]);

  if (loading) {
    return (
      <div className="course-page-wrap" style={{ minHeight: '100vh', background: '#0b0b0b' }}>
        <CourseNavbar />
        <div style={{ padding: '60px 5% 50px', maxWidth: '1200px', margin: '0 auto' }}>
          <SkeletonLoader type="text" count={2} />
          <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
             <div style={{flex: 1}}><SkeletonLoader type="card" count={1} /></div>
             <div style={{flex: 1}}><SkeletonLoader type="card" count={1} /></div>
             <div style={{flex: 1}}><SkeletonLoader type="card" count={1} /></div>
          </div>
          <SkeletonLoader type="card" count={2} />
        </div>
      </div>
    );
  }

  // Placeholder data for new UI elements
  const streakDays = [
    { day: 'M', active: true },
    { day: 'T', active: true },
    { day: 'W', active: true },
    { day: 'T', active: false },
    { day: 'F', active: true },
    { day: 'S', active: true },
    { day: 'S', active: false },
  ];

  return (
    <div className="course-page-wrap" style={{ minHeight: '100vh', background: '#0b0b0b' }}>
      <CourseNavbar />
      
      <div style={{ padding: '40px 5% 80px', maxWidth: '1200px', margin: '0 auto' }}>
        <FadeIn duration={0.8} yOffset={20}>
          <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 className="saas-heading" style={{ fontSize: '32px', marginBottom: '10px' }}>My Learning Space</h1>
              <p style={{ color: '#888', margin: 0 }}>Welcome back, {user?.name} — let's crush some goals today.</p>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
               <button 
                onClick={handleLogout} 
                className="saas-card" 
                style={{ padding: '10px 20px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>
                Logout
              </button>
            </div>
          </div>
        </FadeIn>

        {continueCourse && continueCourse.course && (
          <SlideUp delay={0.1} duration={0.8} style={{ marginBottom: '30px' }}>
            <ContinueLearningCard progressData={continueCourse} />
          </SlideUp>
        )}

        {/* LEARNING STREAK & ACHIEVEMENTS WIDGET */}
        <SlideUp delay={0.2} duration={0.8} style={{ marginBottom: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            {/* Learning Streak */}
            <div className="saas-card premium-glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ri-fire-fill" style={{ color: '#ef4444' }}></i> 5 Day Streak
                </h3>
                <span style={{ fontSize: '12px', color: '#888', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>Weekly Goal: 3/5 Days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {streakDays.map((d, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', 
                      background: d.active ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${d.active ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: d.active ? '0 0 10px rgba(239,68,68,0.3)' : 'none'
                    }}>
                      {d.active && <i className="ri-check-line" style={{ color: '#ef4444', fontSize: '14px' }}></i>}
                    </div>
                    <span style={{ fontSize: '12px', color: d.active ? '#fff' : '#666' }}>{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievement Badges */}
            <div className="saas-card premium-glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ri-medal-fill" style={{ color: '#eab308' }}></i> Recent Badges
                </h3>
                <span style={{ fontSize: '12px', color: '#00D26A', cursor: 'pointer' }}>View All</span>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <i className="ri-vip-crown-fill" style={{ fontSize: '32px', color: '#eab308', filter: 'drop-shadow(0 0 10px rgba(234,179,8,0.4))' }}></i>
                  <div style={{ fontSize: '12px', marginTop: '8px', fontWeight: 'bold' }}>Top 10%</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <i className="ri-code-s-slash-fill" style={{ fontSize: '32px', color: '#3b82f6', filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.4))' }}></i>
                  <div style={{ fontSize: '12px', marginTop: '8px', fontWeight: 'bold' }}>Bug Hunter</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <i className="ri-rocket-2-fill" style={{ fontSize: '32px', color: '#ec4899', filter: 'drop-shadow(0 0 10px rgba(236,72,153,0.4))' }}></i>
                  <div style={{ fontSize: '12px', marginTop: '8px', fontWeight: 'bold' }}>Fast Starter</div>
                </div>
              </div>
            </div>

          </div>
        </SlideUp>

        {/* PREMIUM DASHBOARD FEATURE CARDS (RESTORED & UPGRADED) */}
        <SlideUp delay={0.3} duration={1} style={{ marginBottom: '50px' }}>
          <h2 className="saas-heading" style={{ fontSize: '24px', marginBottom: '20px' }}>Career Acceleration Tools</h2>
          <StaggerContainer style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            
            <StaggerItem>
              <HoverCard className="saas-card premium-glass-panel" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, rgba(20,20,20,0.8) 0%, rgba(20,20,20,0.95) 100%)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(190,24,93,0.2))', border: '1px solid rgba(236,72,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <i className="ri-robot-2-fill" style={{ fontSize: '24px', color: '#ec4899' }}></i>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff' }}>Personal AI Coach</h3>
                <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.5', flex: 1, marginBottom: '20px' }}>
                  Analyze your learning patterns and get personalized code reviews and weekly goals from your AI mentor.
                </p>
                <button onClick={() => navigate('/student/ai-coach')} className="btn" style={{ width: '100%', padding: '12px', background: 'rgba(236,72,153,0.1)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Launch AI Coach
                </button>
              </HoverCard>
            </StaggerItem>

            <StaggerItem>
              <HoverCard className="saas-card premium-glass-panel" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, rgba(20,20,20,0.8) 0%, rgba(20,20,20,0.95) 100%)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.2))', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <i className="ri-road-map-fill" style={{ fontSize: '24px', color: '#8b5cf6' }}></i>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff' }}>Dynamic AI Roadmap</h3>
                <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.5', flex: 1, marginBottom: '20px' }}>
                  Never wonder what to learn next. Get a personalized, adaptive curriculum based on your career goals.
                </p>
                <button onClick={() => navigate('/student/roadmap')} className="btn" style={{ width: '100%', padding: '12px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  View Roadmap
                </button>
              </HoverCard>
            </StaggerItem>

            <StaggerItem>
              <HoverCard className="saas-card premium-glass-panel" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, rgba(20,20,20,0.8) 0%, rgba(20,20,20,0.95) 100%)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.2))', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <i className="ri-briefcase-4-fill" style={{ fontSize: '24px', color: '#f59e0b' }}></i>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff' }}>Mock Interviews</h3>
                <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.5', flex: 1, marginBottom: '20px' }}>
                  Practice system design and DSA problems under real interview conditions to ace your technical rounds.
                </p>
                <button onClick={() => navigate('/student/placement')} className="btn" style={{ width: '100%', padding: '12px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Start Practice
                </button>
              </HoverCard>
            </StaggerItem>

            <StaggerItem>
              <HoverCard className="saas-card premium-glass-panel" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, rgba(20,20,20,0.8) 0%, rgba(20,20,20,0.95) 100%)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <i className="ri-file-user-fill" style={{ fontSize: '24px', color: '#10b981' }}></i>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff' }}>Resume Builder</h3>
                <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.5', flex: 1, marginBottom: '20px' }}>
                  Auto-generate ATS-friendly resumes populated directly from your course certificates and completed projects.
                </p>
                <button onClick={() => navigate('/student/resume')} className="btn" style={{ width: '100%', padding: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Build Resume
                </button>
              </HoverCard>
            </StaggerItem>

          </StaggerContainer>
        </SlideUp>

        {analytics && (
          <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '50px' }}>
            <StaggerItem>
              <StudentAnalyticsCards analytics={analytics} />
            </StaggerItem>
            
            <StaggerItem className="dashboard-grid">
              <div className="saas-card premium-glass-panel" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h3 style={{ margin: '0', fontSize: '18px' }}>Learning Timeline</h3>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <button 
                        onClick={() => setActivityRange('weekly')}
                        style={{ padding: '6px 12px', fontSize: '12px', border: 'none', background: activityRange === 'weekly' ? '#00D26A' : 'transparent', color: activityRange === 'weekly' ? '#000' : '#888', cursor: 'pointer', fontWeight: activityRange === 'weekly' ? 'bold' : 'normal' }}>
                        7 Days
                      </button>
                      <button 
                        onClick={() => setActivityRange('monthly')}
                        style={{ padding: '6px 12px', fontSize: '12px', border: 'none', background: activityRange === 'monthly' ? '#00D26A' : 'transparent', color: activityRange === 'monthly' ? '#000' : '#888', cursor: 'pointer', fontWeight: activityRange === 'monthly' ? 'bold' : 'normal' }}>
                        30 Days
                      </button>
                    </div>
                  </div>
                  {analytics.mostActiveDay && analytics.mostActiveDay.date !== '-' && (
                    <span style={{ fontSize: '12px', color: '#00D26A', background: 'rgba(0,210,106,0.1)', border: '1px solid rgba(0,210,106,0.2)', padding: '6px 12px', borderRadius: '12px' }}>
                      Peak: <strong>{new Date(analytics.mostActiveDay.date).toLocaleDateString('en-US', { weekday: 'short' })}</strong> ({analytics.mostActiveDay.hours} hrs)
                    </span>
                  )}
                </div>
                <div style={{ height: '300px' }}>
                  {(activityRange === 'weekly' ? analytics.weeklyProgress : analytics.monthlyProgress)?.every(d => d.hours === 0) ? (
                    <EmptyState 
                      icon="ri-bar-chart-2-line" 
                      title="No Activity Data" 
                      description="You haven't spent any time learning in this period." 
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityRange === 'weekly' ? analytics.weeklyProgress : analytics.monthlyProgress} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00D26A" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#00D26A" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} interval={activityRange === 'monthly' ? 4 : 0} dy={10} />
                        <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                        <Tooltip 
                          contentStyle={{ background: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(10px)' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="hours" name="Hours" stroke="#00D26A" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="saas-card premium-glass-panel" style={{ padding: '32px' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '18px' }}>Goal Completion</h3>
                <div style={{ height: '300px' }}>
                  {analytics.totalEnrolled === 0 ? (
                    <EmptyState 
                      icon="ri-pie-chart-line" 
                      title="No Enrolled Courses" 
                      description="Enroll in a course to see completion stats." 
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.courseCompletionChart || []}
                          cx="50%" cy="50%"
                          innerRadius={80} outerRadius={110}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#00D26A" />
                          <Cell fill="rgba(255,255,255,0.1)" />
                        </Pie>
                        <Tooltip contentStyle={{ background: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </StaggerItem>

            {quizStats && (
              <StaggerItem className="dashboard-grid" style={{ marginTop: '10px' }}>
                <HoverCard className="saas-card premium-glass-panel" style={{ padding: '24px', borderLeft: '4px solid #aaa' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Quizzes Attempted</h3>
                  <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#fff' }}>{quizStats.totalQuizzesAttempted}</div>
                </HoverCard>
                <HoverCard className="saas-card premium-glass-panel" style={{ padding: '24px', borderLeft: '4px solid #3b82f6' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#3b82f6', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Passed Quizzes</h3>
                  <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#3b82f6' }}>{quizStats.passedQuizzes || 0}</div>
                </HoverCard>
                <HoverCard className="saas-card premium-glass-panel" style={{ padding: '24px', borderLeft: '4px solid #ef4444' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#ef4444', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Failed Quizzes</h3>
                  <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#ef4444' }}>{quizStats.failedQuizzes || 0}</div>
                </HoverCard>
              </StaggerItem>
            )}
          </StaggerContainer>
        )}

        <SlideUp delay={0.3} duration={1} style={{ marginBottom: '50px' }}>
          <h2 className="saas-heading" style={{ fontSize: '24px', marginBottom: '20px' }}>My Enrolled Courses</h2>
          <StudentCourseGrid courses={enrolledCourses} />
        </SlideUp>

        {/* RESTORED AI RECOMMENDATIONS */}
        {recommendedCourses && recommendedCourses.length > 0 && (
          <SlideUp delay={0.4} duration={1} style={{ marginBottom: '50px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <i className="ri-sparkling-fill" style={{ color: '#8b5cf6', fontSize: '24px' }}></i>
              <h2 className="saas-heading" style={{ fontSize: '24px', margin: 0 }}>Smart Course Suggestions</h2>
            </div>
            <StudentCourseGrid courses={recommendedCourses} />
          </SlideUp>
        )}

        <SlideUp delay={0.5} duration={1}>
          <h2 className="saas-heading" style={{ fontSize: '24px', marginBottom: '20px' }}>My Certificates</h2>
          {certificates && certificates.length > 0 ? (
            <StaggerContainer style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {certificates.map(cert => (
                <StaggerItem key={cert._id}>
                  <HoverCard className="saas-card premium-glass-panel" style={{ padding: '24px', position: 'relative' }}>
                    {cert.isRevoked && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                      REVOKED
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ width: '50px', height: '50px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>
                      <i className="ri-award-fill"></i>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#fff' }}>{cert.courseTitle}</h4>
                      <div style={{ fontSize: '12px', color: '#888' }}>Issued: {new Date(cert.issueDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/certificates/${cert.certificateId}`)}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    View Certificate
                  </button>
                  </HoverCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <EmptyState 
              icon="ri-award-line" 
              title="No Certificates Yet" 
              description="Complete a course to earn your first certificate." 
            />
          )}
        </SlideUp>

      </div>

      {selectedPayment && (
        <ReceiptModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}
    </div>
  );
}
