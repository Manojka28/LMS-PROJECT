import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MagneticButton from './MagneticButton';
import { api } from '../services/api';
import QuizManagementModal from './QuizManagementModal.jsx';
import InstructorQuizAnalyticsModal from './InstructorQuizAnalyticsModal.jsx';
import AssignmentManagementModal from './AssignmentManagementModal.jsx';
import InstructorAssignmentAnalyticsModal from './InstructorAssignmentAnalyticsModal.jsx';

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

  const [studentModalCourse, setStudentModalCourse] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [reviewsModalCourse, setReviewsModalCourse] = useState(null);
  const [reviewsList, setReviewsList] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [quizModalCourse, setQuizModalCourse] = useState(null);
  const [quizAnalyticsCourse, setQuizAnalyticsCourse] = useState(null);

  const [assignmentModalCourse, setAssignmentModalCourse] = useState(null);
  const [assignmentAnalyticsCourse, setAssignmentAnalyticsCourse] = useState(null);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  const handleFilter = (e) => {
    setFilter(e.target.value);
    onFilterChange(e.target.value);
  };

  const handleViewStudents = async (course) => {
    setStudentModalCourse(course);
    setLoadingStudents(true);
    try {
      const res = await api.get(`/instructor/course/${course._id}/students`);
      if (res.success) {
        setStudentsList(res.students);
      }
    } catch (err) {
      console.error('API Error in handleViewStudents:', err);
      alert('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const closeStudentModal = () => {
    setStudentModalCourse(null);
    setStudentsList([]);
  };

  const handleViewReviews = async (course) => {
    setReviewsModalCourse(course);
    setLoadingReviews(true);
    try {
      const res = await api.get(`/instructor/course/${course._id}/reviews`);
      if (res.success) {
        setReviewsList(res.reviews);
      }
    } catch (err) {
      console.error('API Error in handleViewReviews:', err);
      alert('Failed to load reviews');
    } finally {
      setLoadingReviews(false);
    }
  };

  const closeReviewsModal = () => {
    setReviewsModalCourse(null);
    setReviewsList([]);
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

      <div className="responsive-table-wrap">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Category</th>
              <th>Price</th>
              <th>Enrolled Students</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px 0' }}>
                  <div className="loading-state" style={{ minHeight: 'auto', padding: '20px' }}>
                    <div className="loading-spinner" style={{ width: '30px', height: '30px' }} />
                    <span className="loading-state-text">Loading courses...</span>
                  </div>
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: 0 }}>
                  <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
                    <i className="ri-book-open-line empty-state-icon" />
                    <h3 className="empty-state-title">No Courses Found</h3>
                    <p className="empty-state-text">You haven't created any courses that match this filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={course.thumbnail} alt={course.title} style={{ width: '50px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div>
                        <div style={{ fontWeight: '500', color: '#fff' }}>{course.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{course.level}</div>
                      </div>
                    </div>
                  </td>
                  <td>{course.category}</td>
                  <td>${course.price.toFixed(2)}</td>
                  <td>{course.enrolledCount}</td>
                  <td>
                    <span className={`status-badge ${course.isPublished ? 'success' : 'warning'}`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleViewStudents(course)}
                        className="btn btn-sm"
                        style={{ background: '#3b82f630', color: '#3b82f6', border: '1px solid #3b82f650' }}
                      >
                        Students
                      </button>
                      <button
                        onClick={() => handleViewReviews(course)}
                        className="btn btn-sm"
                        style={{ background: '#8b5cf630', color: '#8b5cf6', border: '1px solid #8b5cf650' }}
                      >
                        Reviews
                      </button>
                      <button
                        onClick={() => setQuizModalCourse(course)}
                        className="btn btn-sm"
                        style={{ background: '#ec489930', color: '#ec4899', border: '1px solid #ec489950' }}
                      >
                        Quizzes
                      </button>
                      <button
                        onClick={() => setQuizAnalyticsCourse(course)}
                        className="btn btn-sm"
                        style={{ background: '#06b6d430', color: '#06b6d4', border: '1px solid #06b6d450' }}
                      >
                        Quiz Stats
                      </button>
                      <button
                        onClick={() => setAssignmentModalCourse(course)}
                        className="btn btn-sm"
                        style={{ background: '#eab30830', color: '#eab308', border: '1px solid #eab30850' }}
                      >
                        Assignments
                      </button>
                      <button
                        onClick={() => setAssignmentAnalyticsCourse(course)}
                        className="btn btn-sm"
                        style={{ background: '#14b8a630', color: '#14b8a6', border: '1px solid #14b8a650' }}
                      >
                        Asgn Stats
                      </button>
                      <button
                        onClick={() => navigate(`/instructor/edit-course/${course._id}`)}
                        className="btn btn-sm"
                        style={{ background: '#333' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => navigate(`/instructor/course-intelligence/${course._id}`)}
                        className="btn btn-sm"
                        style={{ background: '#3b82f6', color: '#fff', border: '1px solid #2563eb' }}
                      >
                        <i className="ri-radar-line" style={{ marginRight: '4px' }}></i> AI Intelligence
                      </button>
                      <button
                        onClick={() => onPublishToggle(course._id, !course.isPublished)}
                        className="btn btn-sm"
                        style={{
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
                        className="btn btn-sm"
                        style={{ background: '#ef444430', color: '#ef4444', border: '1px solid #ef444450' }}
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

      {studentModalCourse && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}
          onClick={closeStudentModal}
        >
          <div 
            style={{ 
              background: '#111', padding: '30px', borderRadius: '12px', border: '1px solid #333',
              width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: '0 0 5px 0' }}>{studentModalCourse.title}</h2>
                <p style={{ margin: 0, color: '#888' }}>{studentsList.length} Total Students Enrolled</p>
              </div>
              <button 
                onClick={closeStudentModal}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '24px' }}
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {loadingStudents ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <span className="loading-state-text">Loading students...</span>
              </div>
            ) : studentsList.length === 0 ? (
              <div className="empty-state">
                <i className="ri-user-unfollow-line empty-state-icon" />
                <h3 className="empty-state-title">No Students</h3>
                <p className="empty-state-text">No students have enrolled in this course yet.</p>
              </div>
            ) : (
              <div className="responsive-table-wrap">
                <table className="responsive-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Progress</th>
                      <th>Lectures Completed</th>
                      <th>Enrollment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map((student) => (
                      <tr key={student._id}>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '150px' }}>
                            <div style={{ flex: 1, background: '#333', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${student.completionPercentage}%`, background: '#10b981', height: '100%' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#888', minWidth: '35px' }}>{Math.round(student.completionPercentage)}%</span>
                          </div>
                        </td>
                        <td>{student.completedLectures}</td>
                        <td>{new Date(student.enrollmentDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {reviewsModalCourse && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}
          onClick={closeReviewsModal}
        >
          <div 
            style={{ 
              background: '#111', padding: '30px', borderRadius: '12px', border: '1px solid #333',
              width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: '0 0 5px 0' }}>{reviewsModalCourse.title}</h2>
                <p style={{ margin: 0, color: '#888' }}>{reviewsModalCourse.rating || 0} Average Rating • {reviewsModalCourse.totalReviews || 0} Total Reviews</p>
              </div>
              <button 
                onClick={closeReviewsModal}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '24px' }}
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {loadingReviews ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <span className="loading-state-text">Loading reviews...</span>
              </div>
            ) : reviewsList.length === 0 ? (
              <div className="empty-state">
                <i className="ri-star-line empty-state-icon" />
                <h3 className="empty-state-title">No Reviews</h3>
                <p className="empty-state-text">This course hasn't received any reviews yet.</p>
              </div>
            ) : (
              <div className="responsive-table-wrap">
                <table className="responsive-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewsList.map((review) => (
                      <tr key={review._id}>
                        <td>{review.student?.name || 'Unknown'}</td>
                        <td>
                          <span style={{ color: '#fbbf24' }}>
                            {'★'.repeat(Math.round(review.rating))}
                            {'☆'.repeat(5 - Math.round(review.rating))}
                          </span>
                          <span style={{ marginLeft: '8px', color: '#fff' }}>{review.rating}</span>
                        </td>
                        <td style={{ maxWidth: '300px', whiteSpace: 'normal' }}>{review.comment || '-'}</td>
                        <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {quizModalCourse && (
        <QuizManagementModal 
          course={quizModalCourse} 
          onClose={() => setQuizModalCourse(null)} 
        />
      )}

      {quizAnalyticsCourse && (
        <InstructorQuizAnalyticsModal 
          course={quizAnalyticsCourse} 
          onClose={() => setQuizAnalyticsCourse(null)} 
        />
      )}

      {assignmentModalCourse && (
        <AssignmentManagementModal
          course={assignmentModalCourse}
          onClose={() => setAssignmentModalCourse(null)}
        />
      )}

      {assignmentAnalyticsCourse && (
        <InstructorAssignmentAnalyticsModal
          course={assignmentAnalyticsCourse}
          onClose={() => setAssignmentAnalyticsCourse(null)}
        />
      )}
    </div>
  );
}
