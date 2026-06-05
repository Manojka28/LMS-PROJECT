import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StudentAnalyticsCards from '../components/StudentAnalyticsCards';
import ContinueLearningCard from '../components/ContinueLearningCard';
import StudentCourseGrid from '../components/StudentCourseGrid';

export default function StudentDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [continueCourse, setContinueCourse] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, continueRes, coursesRes] = await Promise.all([
          api.get('/student/dashboard/analytics'),
          api.get('/student/courses/continue'),
          api.get('/student/courses')
        ]);

        if (analyticsRes.success) setAnalytics(analyticsRes.analytics);
        if (continueRes.success) setContinueCourse(continueRes.course);
        if (coursesRes.success) setEnrolledCourses(coursesRes.courses);

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
    <div style={{ minHeight: '100vh', background: '#0b0b0b', padding: '100px 5% 50px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', marginBottom: '10px' }}>My Learning Space</h1>
        <p style={{ color: '#888', marginBottom: '40px' }}>Track your progress and continue where you left off.</p>

        {analytics && (
          <StudentAnalyticsCards 
            totalEnrolled={analytics.totalEnrolled} 
            completedCourses={analytics.completedCourses} 
            averageProgress={analytics.averageProgress} 
          />
        )}

        {continueCourse && continueCourse.course && (
          <div style={{ marginBottom: '50px' }}>
            <ContinueLearningCard progressData={continueCourse} />
          </div>
        )}

        <div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', marginBottom: '20px' }}>My Courses</h2>
          <StudentCourseGrid courses={enrolledCourses} />
        </div>
      </div>
    </div>
  );
}
