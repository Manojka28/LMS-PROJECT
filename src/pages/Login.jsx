import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { validateEmailField } from '../utils/validation';
import { getDashboardPath } from '../utils/navigation';
import MagneticButton from '../components/MagneticButton';

function resolveRedirectPath(user, from) {
  // If no specific page was requested, always go to the role home
  if (!from || from === '/' || from === '/login' || from === '/register') {
    return getDashboardPath(user.role);
  }

  // Block student from instructor routes
  if (from.startsWith('/instructor') && user.role === 'student') {
    return ROLE_HOME[user.role];
  }
  // Block student from admin routes
  if (from.startsWith('/admin') && user.role !== 'admin') {
    return ROLE_HOME[user.role];
  }
  // Block admin from student-only routes
  if (from === '/my-courses' && user.role !== 'student') {
    return ROLE_HOME[user.role];
  }

  return from;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const validate = () => {
    const next = {};
    const emailError = validateEmailField(email);
    if (emailError) next.email = emailError;
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const loggedInUser = await login(email.trim(), password);
      navigate(resolveRedirectPath(loggedInUser, from), { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Login failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-back">
          <i className="ri-arrow-left-line" /> Back to home
        </Link>
        <img src="/logos/iiitl-logo.svg" alt="IIITL" className="auth-logo" />
        <h1>Sign In</h1>
        <p className="auth-subtitle">Access your IIITL Coding School account</p>

        {formError && <div className="form-alert form-alert-error">{formError}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
          <MagneticButton type="submit" className="green-btn check-btn ripple-btn" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </MagneticButton>
        </form>

        <p className="auth-footer-text">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
