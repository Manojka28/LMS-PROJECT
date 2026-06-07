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

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [continueCourse, setContinueCourse] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
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

      } catch (err) {
        console.error('Failed to fetch student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loader">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="course-page-wrap" style={{ minHeight: '100vh', background: '#0b0b0b' }}>
      <CourseNavbar />
      
      <div style={{ padding: '60px 5% 50px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', marginBottom: '10px' }}>My Learning Space</h1>
            <p style={{ color: '#888', margin: 0 }}>Welcome back, {user?.name} ({user?.role})</p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={() => navigate('/student/placement')}
              className="ripple-btn"
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)' }}
            >
              <i className="ri-briefcase-4-fill" style={{ fontSize: '20px' }}></i>
              Mock Interviews
            </button>
            <button 
              onClick={() => navigate('/student/roadmap')}
              className="ripple-btn"
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)' }}
            >
              <i className="ri-road-map-fill" style={{ fontSize: '20px' }}></i>
              AI Roadmap
            </button>
            <button 
              onClick={() => navigate('/student/ai-coach')}
              className="ripple-btn"
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #ec4899, #be185d)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)' }}
            >
              <i className="ri-robot-2-fill" style={{ fontSize: '20px' }}></i>
              AI Coach
            </button>
            <button 
              onClick={() => navigate('/student/resume')}
              className="ripple-btn"
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
            >
              <i className="ri-file-user-fill" style={{ fontSize: '20px' }}></i>
              Resume Builder
            </button>
          </div>
        </div>

        {analytics && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '50px' }}>
            <StudentAnalyticsCards analytics={analytics} />
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              
              <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h3 style={{ margin: '0', fontSize: '16px' }}>Learning Activity</h3>
                    <div style={{ display: 'flex', background: '#222', borderRadius: '6px', overflow: 'hidden' }}>
                      <button 
                        onClick={() => setActivityRange('weekly')}
                        style={{ padding: '4px 10px', fontSize: '12px', border: 'none', background: activityRange === 'weekly' ? '#3b82f6' : 'transparent', color: activityRange === 'weekly' ? '#fff' : '#888', cursor: 'pointer' }}>
                        7 Days
                      </button>
                      <button 
                        onClick={() => setActivityRange('monthly')}
                        style={{ padding: '4px 10px', fontSize: '12px', border: 'none', background: activityRange === 'monthly' ? '#3b82f6' : 'transparent', color: activityRange === 'monthly' ? '#fff' : '#888', cursor: 'pointer' }}>
                        30 Days
                      </button>
                    </div>
                  </div>
                  {analytics.mostActiveDay && analytics.mostActiveDay.date !== '-' && (
                    <span style={{ fontSize: '12px', color: '#888', background: '#222', padding: '4px 8px', borderRadius: '12px' }}>
                      Most Active: <strong>{new Date(analytics.mostActiveDay.date).toLocaleDateString('en-US', { weekday: 'short' })}</strong> ({analytics.mostActiveDay.hours} hrs)
                    </span>
                  )}
                </div>
                <div style={{ height: '250px' }}>
                  {(activityRange === 'weekly' ? analytics.weeklyProgress : analytics.monthlyProgress)?.every(d => d.hours === 0) ? (
                    <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888'}}>
                       <i className="ri-bar-chart-2-line" style={{fontSize: '32px', marginBottom: '10px'}}/>
                       <p>No activity data available</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityRange === 'weekly' ? analytics.weeklyProgress : analytics.monthlyProgress} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} axisLine={false} interval={activityRange === 'monthly' ? 4 : 0} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="hours" name="Hours" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHours)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Course Completion</h3>
                <div style={{ height: '250px' }}>
                  {analytics.totalEnrolled === 0 ? (
                    <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888'}}>
                       <i className="ri-pie-chart-line" style={{fontSize: '32px', marginBottom: '10px'}}/>
                       <p>No enrolled courses</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.courseCompletionChart || []}
                          cx="50%" cy="50%"
                          innerRadius={60} outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#3b82f6" />
                        </Pie>
                        <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>

            {quizStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Quizzes Attempted</h3>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff' }}>{quizStats.totalQuizzesAttempted}</div>
                </div>
                <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #3b82f630' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#3b82f6', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Passed Quizzes</h3>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6' }}>{quizStats.passedQuizzes || 0}</div>
                </div>
                <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #ef444430' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#ef4444', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Failed Quizzes</h3>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ef4444' }}>{quizStats.failedQuizzes || 0}</div>
                </div>
              </div>
            )}

            {analytics.quizTrends && analytics.quizTrends.length > 0 && (
              <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Quiz Score Trends</h3>
                <div style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.quizTrends} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="score" name="Score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {assignmentStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '10px' }}>
                <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Assignments Submitted</h3>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff' }}>{assignmentStats.totalSubmitted}</div>
                </div>
                <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #eab30830' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#eab308', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Reviews</h3>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#eab308' }}>{assignmentStats.pendingReviews}</div>
                </div>
                <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Average Marks</h3>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981' }}>{assignmentStats.averageMarks}</div>
                </div>
              </div>
            )}

            {analytics.assignmentTrends && analytics.assignmentTrends.length > 0 && (
              <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333', marginTop: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Assignment Score Trends</h3>
                <div style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.assignmentTrends} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 'dataMax']} />
                      <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="score" name="Marks" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {continueCourse && continueCourse.course && (
          <div style={{ marginBottom: '50px' }}>
            <ContinueLearningCard progressData={continueCourse} />
          </div>
        )}

        <div style={{ marginBottom: '50px', background: 'linear-gradient(145deg, #1a1a1a, #111)', borderRadius: '24px', border: '1px solid #ec489950', display: 'flex', padding: '40px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '30px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', background: '#ec4899', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%' }}></div>
          <div style={{ zIndex: 1 }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', margin: '0 0 10px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="ri-robot-2-fill" style={{ color: '#ec4899' }}></i> Your Personal AI Career Coach
            </h2>
            <p style={{ color: '#ccc', fontSize: '16px', margin: '0 0 20px 0', maxWidth: '600px', lineHeight: '1.6' }}>
              Get a personalized weekly review of your learning journey. Our AI analyzes your progress, identifies your strengths, highlights areas for improvement, and sets your goals for next week.
            </p>
            <button 
              onClick={() => navigate('/student/ai-coach')}
              className="ripple-btn"
              style={{ padding: '12px 30px', background: '#ec4899', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
            >
              Get Weekly Review
            </button>
          </div>
          <div style={{ zIndex: 1, display: 'flex', gap: '15px' }}>
             <div style={{ background: '#111', padding: '15px 20px', borderRadius: '12px', border: '1px solid #333', textAlign: 'center' }}>
               <i className="ri-sword-fill" style={{ fontSize: '24px', color: '#10b981' }}></i>
               <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>Strengths</div>
             </div>
             <div style={{ background: '#111', padding: '15px 20px', borderRadius: '12px', border: '1px solid #333', textAlign: 'center' }}>
               <i className="ri-focus-2-line" style={{ fontSize: '24px', color: '#f59e0b' }}></i>
               <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>Goals</div>
             </div>
          </div>
        </div>

        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', marginBottom: '20px' }}>My Courses</h2>
          <StudentCourseGrid courses={enrolledCourses} />
        </div>

        {paymentHistory && paymentHistory.length > 0 && (
          <div style={{ marginBottom: '50px' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', marginBottom: '20px' }}>Purchase History</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#1a1a1a', borderRadius: '12px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: '#222', color: '#aaa', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <th style={{ padding: '15px 20px', borderBottom: '1px solid #333' }}>Course Name</th>
                    <th style={{ padding: '15px 20px', borderBottom: '1px solid #333' }}>Amount</th>
                    <th style={{ padding: '15px 20px', borderBottom: '1px solid #333' }}>Date</th>
                    <th style={{ padding: '15px 20px', borderBottom: '1px solid #333' }}>Status</th>
                    <th style={{ padding: '15px 20px', borderBottom: '1px solid #333' }}>Payment ID</th>
                    <th style={{ padding: '15px 20px', borderBottom: '1px solid #333' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map(payment => (
                    <tr key={payment._id} style={{ borderBottom: '1px solid #333' }}>
                      <td style={{ padding: '15px 20px', color: '#fff' }}>{payment.courseTitle || (payment.course && payment.course.title)}</td>
                      <td style={{ padding: '15px 20px', color: '#3b82f6', fontWeight: 'bold' }}>₹{payment.amount}</td>
                      <td style={{ padding: '15px 20px', color: '#888' }}>{new Date(payment.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: (payment.paymentStatus === 'paid' || payment.paymentStatus === 'enrolledAfterPayment') ? '#10b98120' : '#ef444420',
                          color: (payment.paymentStatus === 'paid' || payment.paymentStatus === 'enrolledAfterPayment') ? '#10b981' : '#ef4444'
                        }}>
                          {payment.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '15px 20px', color: '#888', fontFamily: 'monospace' }}>{payment.razorpayPaymentId || 'N/A'}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <button 
                          onClick={() => setSelectedPayment(payment)}
                          style={{ background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {certificates && certificates.length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', marginBottom: '20px' }}>My Certificates</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {certificates.map(cert => (
                <div key={cert._id} style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333', position: 'relative' }}>
                  {cert.isRevoked && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                      REVOKED
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ width: '50px', height: '50px', background: '#3b82f620', color: '#3b82f6', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>
                      <i className="ri-award-fill"></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0' }}>{cert.courseTitle || (cert.courseId && cert.courseId.title)}</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>ID: {cert.certificateId}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Issued: {new Date(cert.issuedAt || cert.issueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button 
                      onClick={() => window.open(`http://localhost:5000${cert.generatedPdfPath || cert.pdfUrl}`, '_blank')}
                      className="ripple-btn"
                      disabled={cert.isRevoked}
                      style={{ width: '100%', padding: '10px', background: cert.isRevoked ? '#333' : '#3b82f6', color: cert.isRevoked ? '#666' : '#fff', border: 'none', borderRadius: '6px', cursor: cert.isRevoked ? 'not-allowed' : 'pointer' }}
                    >
                      <i className="ri-download-2-line" style={{ marginRight: '5px' }}></i> Download PDF
                    </button>
                    
                    {!cert.isRevoked && cert.qrVerificationUrl && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(cert.qrVerificationUrl); alert('Verification Link Copied!'); }}
                          style={{ padding: '8px', background: 'transparent', border: '1px solid #333', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          <i className="ri-links-line"></i> Copy Link
                        </button>
                        <button 
                          onClick={() => window.open(`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.courseTitle || cert.courseId?.title)}&organizationName=LMS%20Coding%20School&issueYear=${new Date(cert.issuedAt).getFullYear()}&issueMonth=${new Date(cert.issuedAt).getMonth()+1}&certUrl=${encodeURIComponent(cert.qrVerificationUrl)}&certId=${cert.certificateId}`, '_blank')}
                          style={{ padding: '8px', background: '#0077b5', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                        >
                          <i className="ri-linkedin-fill"></i> LinkedIn
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ReceiptModal 
        isOpen={!!selectedPayment} 
        onClose={() => setSelectedPayment(null)} 
        payment={selectedPayment}
        studentName={user?.name}
      />
    </div>
  );
}
