import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';
import {
  canEditCourse,
  formatDuration,
  formatPrice,
  getEnrolledCount,
  isUserEnrolled,
} from '../utils/courseHelpers';
import { isSafeHttpUrl } from '../utils/url';
import CourseNavbar from '../components/CourseNavbar';
import MagneticButton from '../components/MagneticButton';
import ProgressBar from '../components/ProgressBar';
import { useWishlist } from '../context/WishlistContext';

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1516321318423-f06f868dfd4d?q=80&w=1200&auto=format&fit=crop';

export default function CourseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState('');
  const [progressError, setProgressError] = useState('');

  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const userId = user?.id || user?._id;
  const isEnrolled = course && user && isUserEnrolled(course, userId);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api.get(`/course/${id}`);
        if (!cancelled) setCourse(data.course);

        try {
          const revData = await api.get(`/course/${id}/reviews`);
          if (!cancelled) {
            setReviews(revData.reviews);
            const userRev = revData.reviews.find(r => r.user?._id === userId || r.user === userId);
            if (userRev) {
              setMyReview(userRev);
              setReviewForm({ rating: userRev.rating, review: userRev.review });
            }
          }
        } catch (e) {
          console.error('Failed to load reviews', e);
        }

        if (user && isUserEnrolled(data.course, userId)) {
          try {
            const progData = await api.get(`/progress/${id}`);
            if (!cancelled) {
              setProgress(progData.progress);
              setProgressError('');
            }
          } catch (err) {
            if (!cancelled) {
              setProgress(null);
              setProgressError(
                err instanceof ApiError ? err.message : 'Failed to load course progress.'
              );
            }
          }
        }
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
  }, [id, user, userId]);

  const editable = course && user && canEditCourse(user, course);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true); // already loaded
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (course.price > 0) {
      navigate('/student/checkout', { state: { course } });
      return;
    }

    setEnrolling(true);
    setEnrollError('');
    setEnrollSuccess('');

    try {
      // Free course enrollment
      await api.post(`/course/${id}/enroll`);
      setEnrollSuccess('Successfully enrolled in the course!');
      setCourse((prev) => ({
        ...prev,
        isEnrolled: true,
        enrolledCount: getEnrolledCount(prev) + 1,
      }));
      const progData = await api.get(`/progress/${id}`);
      setProgress(progData.progress);
    } catch (err) {
      setEnrollError(err instanceof ApiError ? err.message : 'Failed to process enrollment.');
    } finally {
      setEnrolling(false);
    }
  };


  const handleCompleteLecture = async (lectureId) => {
    if (!isEnrolled) return;
    setProgressError('');
    try {
      const data = await api.post('/progress/complete-lecture', {
        courseId: id,
        lectureId,
      });
      setProgress(data.progress);
    } catch (err) {
      setProgressError(
        err instanceof ApiError ? err.message : 'Failed to mark lecture complete.'
      );
    }
  };

  const handleViewLecture = async (lectureId) => {
    if (!isEnrolled) return;
    try {
      const data = await api.post('/progress/update-last-viewed', {
        courseId: id,
        lectureId,
      });
      setProgress(data.progress);
    } catch {
      // Non-blocking — viewing the lecture should not interrupt the user
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewError('');
    try {
      if (myReview) {
        const res = await api.put(`/course/${id}/review`, reviewForm);
        setMyReview(res.review);
        setReviews(reviews.map(r => r._id === res.review._id ? res.review : r));
      } else {
        const res = await api.post(`/course/${id}/review`, reviewForm);
        setMyReview(res.review);
        setReviews([res.review, ...reviews]);
      }
      const newCourseData = await api.get(`/course/${id}`);
      setCourse(newCourseData.course);
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await api.delete(`/course/${id}/review`);
      setMyReview(null);
      setReviewForm({ rating: 5, review: '' });
      setReviews(reviews.filter(r => r._id !== myReview._id));
      const newCourseData = await api.get(`/course/${id}`);
      setCourse(newCourseData.course);
    } catch (err) {
      alert('Failed to delete review');
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
                    <h4>{getEnrolledCount(course)}</h4>
                  </div>
                </div>

                {progressError && (
                  <p className="field-error" style={{ marginTop: '12px' }}>
                    {progressError}
                  </p>
                )}

                {progress && (
                  <div style={{ marginTop: '20px', marginBottom: '10px' }}>
                    <ProgressBar percentage={progress.completionPercentage} />
                    {progress.completed && (
                      <span className="form-alert-success" style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #00D26A', display: 'inline-block', marginTop: '10px' }}>
                        <i className="ri-medal-fill" /> Course Completed!
                      </span>
                    )}
                  </div>
                )}

                {editable && (
                  <MagneticButton
                    className="green-btn ripple-btn"
                    onClick={() => navigate(`/instructor/edit-course/${course._id}`)}
                  >
                    Edit Course
                  </MagneticButton>
                )}
                {!editable && user && isEnrolled && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {progress?.lastViewedLecture && (
                      <MagneticButton
                        className="green-btn ripple-btn"
                        onClick={() => {
                          const el = document.getElementById(`lecture-${progress.lastViewedLecture}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                      >
                        Resume Course
                      </MagneticButton>
                    )}
                    <MagneticButton
                      className="ripple-btn"
                      onClick={() => navigate('/my-courses')}
                      style={{ border: '1px solid #444' }}
                    >
                      Dashboard
                    </MagneticButton>
                  </div>
                )}
                {!editable && user && !isEnrolled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <MagneticButton
                      className="green-btn ripple-btn"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      {enrolling
                        ? enrollSuccess.includes('Processing') ? 'Simulating...' : 'Enrolling...'
                        : course.price > 0 ? `Buy Now — ₹${course.price}` : 'Enroll Now'}
                    </MagneticButton>
                    <button
                      className="ripple-btn"
                      onClick={() => toggleWishlist(course._id)}
                      style={{ 
                        background: 'transparent',
                        border: '1px solid #444', 
                        color: isWishlisted(course._id) ? '#ef4444' : '#fff',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontWeight: 'bold',
                        transition: 'border-color 0.2s, color 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = '#666'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = '#444'; }}
                    >
                      <i className={isWishlisted(course._id) ? "ri-heart-3-fill" : "ri-heart-3-line"} />
                      {isWishlisted(course._id) ? 'Remove from Wishlist' : 'Save to Wishlist'}
                    </button>
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
                          {section.lectures.map((lecture, lIdx) => {
                            const isLecCompleted = progress?.completedLectures?.some(
                              (lecId) => String(lecId) === String(lecture._id)
                            );
                            return (
                              <li key={lecture._id || lIdx} className="lecture-item" id={`lecture-${lecture._id}`}>
                                <div className="lecture-item-head">
                                  <i className="ri-play-circle-line" />
                                  <div style={{ flex: 1 }}>
                                    <h4>{lecture.title}</h4>
                                    {lecture.description && <p>{lecture.description}</p>}
                                  </div>
                                  <span className="lecture-duration">
                                    {formatDuration(lecture.duration)}
                                  </span>
                                  {isEnrolled && !isLecCompleted && (
                                    <button 
                                      className="green-btn-sm" 
                                      onClick={() => handleCompleteLecture(lecture._id)}
                                      style={{ marginLeft: '10px', padding: '4px 10px', fontSize: '12px' }}
                                    >
                                      Mark Complete
                                    </button>
                                  )}
                                  {isEnrolled && isLecCompleted && (
                                    <span style={{ marginLeft: '10px', color: '#00D26A', fontSize: '12px', fontWeight: 'bold' }}>
                                      <i className="ri-check-line" /> Completed
                                    </span>
                                  )}
                                </div>
                                {lecture.videoUrl && isSafeHttpUrl(lecture.videoUrl) && (
                                  <a
                                    href={lecture.videoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="lecture-video-link"
                                    onClick={() => handleViewLecture(lecture._id)}
                                  >
                                    Watch video
                                  </a>
                                )}
                                {lecture.resources?.length > 0 && (
                                  <ul className="lecture-resources">
                                    {lecture.resources.map((res) =>
                                      isSafeHttpUrl(res.fileUrl) ? (
                                        <li key={res._id || res.title}>
                                          <a href={res.fileUrl} target="_blank" rel="noreferrer">
                                            {res.title}
                                          </a>
                                        </li>
                                      ) : null
                                    )}
                                  </ul>
                                )}
                              </li>
                            );
                          })}
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
