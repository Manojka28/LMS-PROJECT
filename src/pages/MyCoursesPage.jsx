import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import CourseNavbar from '../components/CourseNavbar';
import TiltCard from '../components/TiltCard';
import MagneticButton from '../components/MagneticButton';
import ProgressBar from '../components/ProgressBar';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../components/common/ToastContext';

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1516321318423-f06f868dfd4d?q=80&w=800&auto=format&fit=crop';

export default function MyCoursesPage() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [courses, setCourses] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [courseRes, progressRes] = await Promise.all([
          api.get('/user/my-courses'),
          api.get('/progress')
        ]);
        
        if (!cancelled) {
          setCourses(courseRes.courses || []);
          
          const progMap = {};
          if (progressRes.progress) {
            progressRes.progress.forEach(p => {
              progMap[p.course._id || p.course] = p;
            });
          }
          setProgressData(progMap);
        }
      } catch (err) {
        if (!cancelled) {
          const errMsg = err instanceof ApiError ? err.message : 'Failed to load your courses and progress.';
          setError(errMsg);
          showError(errMsg, 5000, {
            label: 'Retry',
            onClick: () => window.location.reload()
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="course-page-wrap">
      <div className="noise-overlay" />
      <div className="blob blob-1" />
      <div className="blob blob-3" />

      <CourseNavbar />

      <main className="course-page-main">
        <header className="course-page-header">
          <h4 className="green">DASHBOARD</h4>
          <h1>My Courses</h1>
          <p>Continue your learning journey.</p>
        </header>

        {loading && (
          <div className="courses-grid" style={{ marginTop: '40px' }}>
             <SkeletonLoader type="card" count={1} />
             <SkeletonLoader type="card" count={1} />
             <SkeletonLoader type="card" count={1} />
          </div>
        )}

        {!loading && error && (
          <div className="course-state-card course-state-error">
            <i className="ri-error-warning-line" />
            <p>{error}</p>
            <button type="button" className="green-btn" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <EmptyState 
            icon="ri-book-open-line" 
            title="No enrolled courses" 
            description="You haven't enrolled in any courses yet." 
            action={
              <Link to="/courses" className="btn btn-primary">
                Browse Catalog
              </Link>
            }
          />
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="courses-grid">
            {courses.map((course) => {
              const prog = progressData[course._id];
              const isCompleted = prog?.completed;

              return (
                <TiltCard key={course._id} className="course-card">
                  <div className="course-img">
                    <img
                      src={course.thumbnail || PLACEHOLDER_IMG}
                      alt={course.title}
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_IMG;
                      }}
                    />
                    {isCompleted && (
                      <div style={{ position: 'absolute', top: 10, right: 10, background: '#FFD700', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        <i className="ri-medal-fill" /> Completed
                      </div>
                    )}
                  </div>
                  <div className="course-details">
                    <div className="course-tags">
                      <span>{course.category}</span>
                      <span>{course.level}</span>
                    </div>
                    <h2>{course.title}</h2>
                    <p className="course-card-instructor">
                      <i className="ri-user-star-line" />{' '}
                      {course.instructor?.name || 'Instructor'}
                    </p>
                    
                    <ProgressBar percentage={prog?.completionPercentage || 0} />

                    <div className="course-footer" style={{ justifyContent: 'flex-end', marginTop: '15px' }}>
                      <MagneticButton
                        className="green-btn-sm ripple-btn"
                        style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => navigate(`/courses/${course._id}`)}
                      >
                        <i className={isCompleted ? 'ri-refresh-line' : 'ri-play-circle-fill'} />
                        {isCompleted
                          ? 'Review Course'
                          : prog?.completionPercentage > 0
                            ? 'Continue Learning'
                            : 'Start Learning'}
                      </MagneticButton>
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
