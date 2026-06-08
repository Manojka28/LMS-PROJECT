import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import {
  emptyCourseForm,
  formValuesToPayload,
  validateCourseForm,
} from '../utils/courseHelpers';
import CourseNavbar from '../components/CourseNavbar';
import CourseForm from '../components/CourseForm';
import { useToast } from '../components/common/ToastContext';

export default function CreateCoursePage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [values, setValues] = useState(() => emptyCourseForm());
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      const data = await api.post('/course', formValuesToPayload(values));
      showSuccess('Course created successfully!');
      navigate(`/courses/${data.course._id}`, { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create course.';
      setFormError(msg);
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="course-page-wrap">
      <div className="noise-overlay" />
      <div className="blob blob-2" />

      <CourseNavbar />

      <main className="course-page-main course-form-page">
        <Link to="/courses" className="auth-back course-back-link">
          <i className="ri-arrow-left-line" /> Back to courses
        </Link>
        <header className="course-page-header">
          <h4 className="green">INSTRUCTOR</h4>
          <h1>Create Course</h1>
          <p>Publish a new course to the catalog.</p>
        </header>

        <CourseForm
          values={values}
          errors={errors}
          onChange={setValues}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Create Course"
          formError={formError}
        />
      </main>
    </div>
  );
}
