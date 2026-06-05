import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';
import {
  canEditCourse,
  courseToFormValues,
  formValuesToPayload,
  validateCourseForm,
} from '../utils/courseHelpers';
import CourseNavbar from '../components/CourseNavbar';
import CourseForm from '../components/CourseForm';
import MagneticButton from '../components/MagneticButton';

export default function EditCoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError('');
      setForbidden(false);
      try {
        const data = await api.get(`/course/${id}`);
        if (cancelled) return;

        if (!canEditCourse(user, data.course)) {
          setForbidden(true);
          return;
        }

        setValues(courseToFormValues(data.course));
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError ? err.message : 'Failed to load course for editing.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!user) {
      if (!cancelled) setLoading(false);
      return undefined;
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const validationErrors = validateCourseForm(values);
    setErrors(validationErrors);
    if (validationErrors.sections) {
      setFormError(validationErrors.sections);
    }
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.put(`/course/${id}`, formValuesToPayload(values));
      navigate(`/courses/${id}`, { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to update course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this course permanently? This cannot be undone.')) return;

    setDeleting(true);
    setFormError('');
    try {
      await api.delete(`/course/${id}`);
      navigate('/courses', { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to delete course.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="course-page-wrap">
      <div className="noise-overlay" />
      <div className="blob blob-3" />

      <CourseNavbar />

      <main className="course-page-main course-form-page">
        <Link to={`/courses/${id}`} className="auth-back course-back-link">
          <i className="ri-arrow-left-line" /> Back to course
        </Link>
        <header className="course-page-header">
          <h4 className="green">INSTRUCTOR</h4>
          <h1>Edit Course</h1>
          <p>Update course details and curriculum.</p>
        </header>

        {loading && (
          <div className="page-loading">
            <div className="loading-bar" style={{ width: 200 }} />
            <p>Loading course...</p>
          </div>
        )}

        {!loading && forbidden && (
          <div className="course-state-card course-state-error">
            <i className="ri-lock-line" />
            <p>You are not allowed to edit this course.</p>
            <Link to="/courses" className="green-btn-sm">
              Back to courses
            </Link>
          </div>
        )}

        {!loading && loadError && (
          <div className="course-state-card course-state-error">
            <i className="ri-error-warning-line" />
            <p>{loadError}</p>
            <button type="button" className="green-btn" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {!loading && !loadError && !forbidden && values && (
          <>
            <CourseForm
              values={values}
              errors={errors}
              onChange={setValues}
              onSubmit={handleSubmit}
              submitting={submitting}
              submitLabel="Save Changes"
              formError={formError}
            />
            <div className="course-delete-zone">
              <h3>Danger zone</h3>
              <p>Permanently remove this course and all its sections and lectures.</p>
              <MagneticButton
                className="danger-btn ripple-btn"
                onClick={handleDelete}
                disabled={deleting || submitting}
              >
                {deleting ? 'Deleting...' : 'Delete Course'}
              </MagneticButton>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
