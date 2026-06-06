import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import CourseNavbar from '../components/CourseNavbar';
import TiltCard from '../components/TiltCard';
import { formatPrice } from '../utils/courseHelpers';

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1516321318423-f06f868dfd4d?q=80&w=800&auto=format&fit=crop';

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useWishlist();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredWishlist = wishlist.filter((item) => {
    if (!item.course) return false;
    const title = item.course.title || '';
    const category = item.course.category || '';
    const q = searchTerm.toLowerCase();
    return title.toLowerCase().includes(q) || category.toLowerCase().includes(q);
  });

  return (
    <div className="course-page-wrap">
      <div className="noise-overlay" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <CourseNavbar />

      <main className="course-page-main">
        <header className="course-page-header">
          <h4 className="green">YOUR SAVED COURSES</h4>
          <h1>Wishlist</h1>
          <p>Courses you've saved for later.</p>
        </header>

        {wishlist.length > 0 && (
          <div style={{ marginBottom: '30px', maxWidth: '400px' }}>
            <div style={{ position: 'relative' }}>
              <i className="ri-search-line" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}></i>
              <input
                type="text"
                placeholder="Search your wishlist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 15px 12px 40px',
                  background: '#151515',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '15px'
                }}
              />
            </div>
          </div>
        )}

        {wishlist.length === 0 ? (
          <div className="course-state-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', color: '#333', marginBottom: '20px' }}>
              <i className="ri-heart-add-line" />
            </div>
            <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Your Wishlist is Empty</h2>
            <p style={{ color: '#888', marginBottom: '30px' }}>
              Explore our catalog and save courses you're interested in taking later.
            </p>
            <button onClick={() => navigate('/courses')} className="green-btn ripple-btn">
              Browse Courses
            </button>
          </div>
        ) : filteredWishlist.length === 0 ? (
          <div className="course-state-card">
            <i className="ri-search-eye-line" />
            <p>No wishlisted courses match your search.</p>
          </div>
        ) : (
          <div className="courses-grid">
            {filteredWishlist.map((item) => {
              const course = item.course;
              return (
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
                      color: '#ef4444',
                      fontSize: '20px',
                      transition: 'transform 0.2s'
                    }}
                    title="Remove from Wishlist"
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <i className="ri-heart-3-fill" />
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
                        Enroll Now
                      </Link>
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
