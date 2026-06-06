import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import { formatPrice } from '../utils/courseHelpers';
import { useWishlist } from '../context/WishlistContext';
import CourseNavbar from '../components/CourseNavbar';
import TiltCard from '../components/TiltCard';

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1516321318423-f06f868dfd4d?q=80&w=800&auto=format&fit=crop';

export default function CoursesPage() {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api.get('/course');
        if (!cancelled) setCourses(data.courses || []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Failed to load courses. Is the API server running?'
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
  }, []);

  return (
    <div className="course-page-wrap">
      <div className="noise-overlay" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <CourseNavbar />

      <main className="course-page-main">
        <header className="course-page-header">
          <h4 className="green">LEARNING CATALOG</h4>
          <h1>All Courses</h1>
          <p>Browse programs from our instructors.</p>
        </header>

        {loading && (
          <div className="page-loading">
            <div className="loading-bar" style={{ width: 200 }} />
            <p>Loading courses...</p>
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
          <div className="course-state-card">
            <i className="ri-book-open-line" />
            <p>No courses published yet.</p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="courses-grid">
            {courses.map((course) => (
              <TiltCard key={course._id} className="course-card" style={{ position: 'relative' }}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWishlist(course._id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    zIndex: 10,
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                    color: isWishlisted(course._id) ? '#ef4444' : '#fff',
                    fontSize: '20px',
                    transition: 'transform 0.2s, color 0.2s'
                  }}
                  title={isWishlisted(course._id) ? "Remove from Wishlist" : "Add to Wishlist"}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <i className={isWishlisted(course._id) ? "ri-heart-3-fill" : "ri-heart-3-line"} />
                </button>
                <div className="course-img">
                  <img
                    src={course.thumbnail || PLACEHOLDER_IMG}
                    alt={course.title}
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER_IMG;
                    }}
                  />
                </div>
                <div className="course-details">
                  <div className="course-tags">
                    <span>{course.category}</span>
                    <span>{course.level}</span>
                  </div>
                  <h2>{course.title}</h2>
                  {course.subtitle && <p className="course-card-subtitle">{course.subtitle}</p>}
                  <p className="course-card-instructor">
                    <i className="ri-user-star-line" />{' '}
                    {course.instructor?.name || 'Instructor'}
                  </p>
                  <div className="course-footer">
                    <div className="price">
                      <h3>{formatPrice(course.price)}</h3>
                    </div>
                    <Link to={`/courses/${course._id}`} className="green-btn-sm ripple-btn">
                      View Details
                    </Link>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
