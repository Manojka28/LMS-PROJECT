import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MagneticButton from './MagneticButton';

export default function InstructorCourseTable({
  courses,
  total,
  currentPage,
  totalPages,
  onPageChange,
  onSearch,
  onFilterChange,
  onPublishToggle,
  onDelete,
  loading
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  const handleFilter = (e) => {
    setFilter(e.target.value);
    onFilterChange(e.target.value);
  };

  return (
    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0 }}>Course Management</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={handleSearch}
            className="dashboard-input"
            style={{ width: '250px', margin: 0 }}
          />
          <select value={filter} onChange={handleFilter} className="dashboard-input" style={{ width: '150px', margin: 0 }}>
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
              <th style={{ padding: '12px', fontWeight: 'normal' }}>Course</th>
              <th style={{ padding: '12px', fontWeight: 'normal' }}>Category</th>
              <th style={{ padding: '12px', fontWeight: 'normal' }}>Price</th>
              <th style={{ padding: '12px', fontWeight: 'normal' }}>Enrollments</th>
              <th style={{ padding: '12px', fontWeight: 'normal' }}>Status</th>
              <th style={{ padding: '12px', fontWeight: 'normal', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading courses...</td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No courses found.</td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course._id} style={{ borderBottom: '1px solid #222', transition: 'background 0.2s' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={course.thumbnail} alt={course.title} style={{ width: '50px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div>
                        <div style={{ fontWeight: '500' }}>{course.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{course.level}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: '#aaa' }}>{course.category}</td>
                  <td style={{ padding: '12px', color: '#aaa' }}>${course.price.toFixed(2)}</td>
                  <td style={{ padding: '12px', color: '#aaa' }}>{course.enrolledCount}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      background: course.isPublished ? '#10b98120' : '#f59e0b20',
                      color: course.isPublished ? '#10b981' : '#f59e0b',
                    }}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => navigate(`/instructor/edit-course/${course._id}`)}
                        className="ripple-btn"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#333' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onPublishToggle(course._id, !course.isPublished)}
                        className="ripple-btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          background: course.isPublished ? '#f59e0b30' : '#10b98130',
                          color: course.isPublished ? '#f59e0b' : '#10b981',
                          border: `1px solid ${course.isPublished ? '#f59e0b50' : '#10b98150'}`
                        }}
                      >
                        {course.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this course?')) {
                            onDelete(course._id);
                          }
                        }}
                        className="ripple-btn"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#ef444430', color: '#ef4444', border: '1px solid #ef444450' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '0.9rem' }}>
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, total)} of {total} courses
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="ripple-btn"
              style={{ padding: '8px 16px', background: '#333', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="ripple-btn"
              style={{ padding: '8px 16px', background: '#333', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
