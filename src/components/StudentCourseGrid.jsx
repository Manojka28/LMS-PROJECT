import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function StudentCourseGrid({ courses }) {
  const navigate = useNavigate();

  if (!courses || courses.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', color: '#888' }}>
        You haven't enrolled in any courses yet. Explore our catalog to get started!
        <div style={{ marginTop: '20px' }}>
          <button onClick={() => navigate('/courses')} className="green-btn" style={{ fontSize: '14px', padding: '10px 20px' }}>
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
      {courses.map((progressDoc) => {
        const { course, completionPercentage, completed } = progressDoc;
        
        // Handle cases where course might have been deleted but progress remains
        if (!course) return null;

        return (
          <div key={course._id} style={{ background: '#151515', border: '1px solid #222', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: '0.3s' }} className="course-card">
            <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
              <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {completed && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#10b981', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                  <i className="fas fa-check-circle" style={{ marginRight: '5px' }}></i>
                  Completed
                </div>
              )}
            </div>
            
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '8px', lineHeight: '1.4' }}>{course.title}</h3>
              <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {course.subtitle}
              </p>

              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>
                  <span>{completionPercentage}% Complete</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: '#333', borderRadius: '2px', marginBottom: '16px' }}>
                  <div style={{ width: `${completionPercentage}%`, height: '100%', background: completed ? '#10b981' : '#00D26A', borderRadius: '2px' }}></div>
                </div>

                <button 
                  onClick={() => navigate(`/course/${course._id}/learn`)}
                  style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', cursor: 'pointer', transition: '0.2s' }}
                  onMouseOver={(e) => e.target.style.background = '#333'}
                  onMouseOut={(e) => e.target.style.background = '#222'}
                >
                  {completed ? 'Review Course' : 'Continue Learning'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
