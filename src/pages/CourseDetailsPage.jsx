import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';
import { canEditCourse, formatDuration, formatPrice } from '../utils/courseHelpers';
import CourseNavbar from '../components/CourseNavbar';
import MagneticButton from '../components/MagneticButton';

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1516321318423-f06f868dfd4d?q=80&w=1200&auto=format&fit=crop';

export default function CourseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api.get(`/course/${id}`);
        if (!cancelled) setCourse(data.course);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : 'Failed to load course details.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const editable = course && user && canEditCourse(user, course);
  const userId = user?.id || user?._id;
  const isEnrolled = course && user && course.enrolledStudents?.some(sId => String(sId) === String(userId));

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEnrolling(true);
    setEnrollError('');
    setEnrollSuccess('');
    try {
      await api.post(`/course/${id}/enroll`);
      setEnrollSuccess('Successfully enrolled in the course!');
      setCourse((prev) => ({
        ...prev,
        enrolledStudents: [...(prev.enrolledStudents || []), userId],
      }));
    } catch (err) {
      setEnrollError(err instanceof ApiError ? err.message : 'Failed to enroll.');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="course-page-wrap">
      <div className="noise-overlay" />
      <div className="blob blob-1" />
      <div className="blob blob-3" />

      <CourseNavbar />

      <main className="course-page-main">
        <Link to="/courses" className="auth-back course-back-link">
          <i className="ri-arrow-left-line" /> Back to courses
        </Link>

        {loading && (
          <div className="page-loading">
            <div className="loading-bar" style={{ width: 200 }} />
            <p>Loading course...</p>
          </div>
        )}

        {!loading && error && (
          <div className="course-state-card course-state-error">
            <i className="ri-error-warning-line" />
            <p>{error}</p>
            <Link to="/courses" className="green-btn-sm">
              Browse courses
            </Link>
          </div>
        )}

        {!loading && !error && course && (
          <article className="course-detail">
            <div className="course-detail-hero">
              <img
                src={course.thumbnail || PLACEHOLDER_IMG}
                alt={course.title}
                className="course-detail-thumb"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER_IMG;
                }}
              />
              <div className="course-detail-meta">
                <div className="course-tags">
                  <span>{course.category}</span>
                  <span>{course.level}</span>
                </div>
                <h1>{course.title}</h1>
                {course.subtitle && <p className="course-detail-subtitle">{course.subtitle}</p>}
                <p className="course-detail-description">{course.description}</p>
                <div className="course-detail-stats">
                  <div>
                    <h5>Price</h5>
                    <h4 className="green">{formatPrice(course.price)}</h4>
                  </div>
                  <div>
                    <h5>Instructor</h5>
                    <h4>{course.instructor?.name || '—'}</h4>
                    <p className="course-detail-email">{course.instructor?.email}</p>
                  </div>
                  <div>
                    <h5>Rating</h5>
                    <h4>
                      {course.rating ?? 0} <span className="muted">({course.totalReviews ?? 0} reviews)</span>
                    </h4>
                  </div>
                  <div>
                    <h5>Students</h5>
                    <h4>{course.enrolledStudents?.length ?? 0}</h4>
                  </div>
                </div>
                {editable && (
                  <MagneticButton
                    className="green-btn ripple-btn"
                    onClick={() => navigate(`/instructor/edit-course/${course._id}`)}
                  >
                    Edit Course
                  </MagneticButton>
                )}
                {!editable && user && isEnrolled && (
                  <MagneticButton
                    className="green-btn ripple-btn"
                    onClick={() => navigate('/my-courses')}
                  >
                    Go to My Courses
                  </MagneticButton>
                )}
                {!editable && user && !isEnrolled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <MagneticButton
                      className="green-btn ripple-btn"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      {enrolling ? 'Enrolling...' : 'Enroll Now'}
                    </MagneticButton>
                    {enrollError && <span className="field-error">{enrollError}</span>}
                    {enrollSuccess && <span className="form-alert-success" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #00D26A' }}>{enrollSuccess}</span>}
                  </div>
                )}
                {!editable && !user && (
                  <MagneticButton
                    className="green-btn ripple-btn"
                    onClick={() => navigate('/login')}
                  >
                    Sign in to Enroll
                  </MagneticButton>
                )}
              </div>
            </div>

            <section className="course-detail-curriculum">
              <h2>Curriculum</h2>
              {!course.sections?.length ? (
                <p className="muted">No sections added yet.</p>
              ) : (
                <div className="curriculum-list">
                  {course.sections.map((section, sIdx) => (
                    <div key={section._id || sIdx} className="curriculum-section">
                      <h3>
                        <span className="section-num">{sIdx + 1}</span> {section.title}
                      </h3>
                      {!section.lectures?.length ? (
                        <p className="muted section-empty">No lectures in this section.</p>
                      ) : (
                        <ul className="lecture-list">
                          {section.lectures.map((lecture, lIdx) => (
                            <li key={lecture._id || lIdx} className="lecture-item">
                              <div className="lecture-item-head">
                                <i className="ri-play-circle-line" />
                                <div>
                                  <h4>{lecture.title}</h4>
                                  {lecture.description && <p>{lecture.description}</p>}
                                </div>
                                <span className="lecture-duration">
                                  {formatDuration(lecture.duration)}
                                </span>
                              </div>
                              {lecture.videoUrl && (
                                <a
                                  href={lecture.videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="lecture-video-link"
                                >
                                  Watch video
                                </a>
                              )}
                              {lecture.resources?.length > 0 && (
                                <ul className="lecture-resources">
                                  {lecture.resources.map((res) => (
                                    <li key={res._id || res.title}>
                                      <a href={res.fileUrl} target="_blank" rel="noreferrer">
                                        {res.title}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </article>
        )}
      </main>
    </div>
  );
}
