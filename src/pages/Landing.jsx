import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';
import { COURSES } from '../data/courses';
import MagneticButton from '../components/MagneticButton';
import TiltCard from '../components/TiltCard';

export default function Landing() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showCohortModal, setShowCohortModal] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);

  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactErrors, setContactErrors] = useState({});
  const [contactStatus, setContactStatus] = useState('idle');

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COURSES;
    return COURSES.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.keywords.includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          if (entry.target.classList.contains('reveal-stagger')) {
            const children = entry.target.children;
            Array.from(children).forEach((child, index) => {
              child.style.opacity = '0';
              child.style.animation = `fadeUp 0.5s ease forwards ${index * 0.1}s`;
            });
          }
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.reveal-on-scroll, .reveal-stagger');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const loader = document.getElementById('preloader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => setLoading(false), 500);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleScrollTo = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 90;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleSignIn = () => {
    setMobileMenuOpen(false);
    navigate(isAuthenticated ? '/dashboard' : '/login');
  };

  const handleNotifBell = () => {
    setShowNotifDropdown((v) => !v);
    if (notifications.length === 0) {
      setNotifications([
        { id: Date.now(), text: 'Welcome to IIITL Coding School! Sign in to unlock your dashboard.' },
      ]);
    }
  };

  const validateContact = () => {
    const next = {};
    if (contactForm.name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (!contactForm.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) next.email = 'Enter a valid email';
    setContactErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!validateContact()) return;

    setContactStatus('loading');
    try {
      await api.post('/contact', {
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        message: contactForm.message.trim(),
      });
      setContactStatus('success');
      setContactForm({ name: '', email: '', message: '' });
      setContactErrors({});
    } catch (err) {
      setContactStatus('error');
      if (err instanceof ApiError && err.data?.message) {
        setContactErrors({ form: err.data.message });
      } else {
        setContactErrors({ form: 'Could not send message. Is the server running?' });
      }
    }
  };

  const navLinks = [
    { id: 'hero-top', label: 'Home' },
    { to: '/courses', label: 'All Courses', route: true },
    { id: 'courses-section', label: 'Programs' },
    { id: 'faq-section', label: 'FAQ' },
    { id: 'contact-section', label: 'Contact' },
  ];

  return (
    <>
      <div id="preloader" style={{ opacity: loading ? 1 : 0, visibility: loading ? 'visible' : 'hidden' }}>
        <div className="loader-content">
          <h2>IIITL</h2>
          <div className="loading-bar" />
        </div>
      </div>

      <div className="noise-overlay" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <nav>
        <div className="nav1">
          <img src="/logos/iiitl-logo.svg" alt="IIITL Coding School logo" />
          <h4 className="magnetic-text">
            IIITL <br /> Coding School
          </h4>
        </div>
        <div className="nav2">
          {navLinks.map((link) =>
            link.route ? (
              <Link key={link.to} to={link.to}>
                <h4>{link.label}</h4>
              </Link>
            ) : (
              <h4 key={link.id} onClick={() => handleScrollTo(link.id)}>
                {link.label}
              </h4>
            )
          )}
          <h4 className="coming-soon" onClick={() => setShowCohortModal(true)}>
            Cohort 2.0
          </h4>
          <MagneticButton className="signin-btn" onClick={handleSignIn}>
            {isAuthenticated ? 'Dashboard' : 'Sign In'}
          </MagneticButton>
          <div className="nav-icons">
            <div className={`search-container ${searchActive ? 'active' : ''}`}>
              <input
                type="search"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search courses"
              />
              <i
                className="ri-search-line"
                role="button"
                tabIndex={0}
                aria-label="Toggle search"
                onClick={() => setSearchActive(!searchActive)}
                onKeyDown={(e) => e.key === 'Enter' && setSearchActive(!searchActive)}
              />
            </div>
            <div className="notification-container">
              <i
                className="ri-notification-2-fill"
                role="button"
                tabIndex={0}
                aria-label="Notifications"
                onClick={handleNotifBell}
              />
              {notifications.length > 0 && <div className="badge">{notifications.length}</div>}
              {showNotifDropdown && (
                <div className="notif-dropdown">
                  {notifications.length === 0 ? (
                    <p className="empty-msg">No new notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="notif-item"
                        onClick={() => setNotifications(notifications.filter((item) => item.id !== n.id))}
                      >
                        {n.text}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {isAuthenticated ? (
              <div className="nav-avatar" title={user.name}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <img src="/logos/iiitl-logo.svg" alt="Guest" />
            )}
          </div>
        </div>
        <div className="nav3">
          <h4
            role="button"
            tabIndex={0}
            aria-label="Search"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          >
            <i className="ri-search-line" />
          </h4>
          <button type="button" className="signin-btn-mobile" onClick={handleSignIn}>
            {isAuthenticated ? 'Dashboard' : 'Sign In'}
          </button>
          <h4
            role="button"
            tabIndex={0}
            aria-label="Menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <i className="ri-menu-3-fill" />
          </h4>
        </div>
      </nav>

      {mobileSearchOpen && (
        <div className="mobile-search-bar">
          <input
            type="search"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            aria-label="Mobile search"
          />
          <button type="button" onClick={() => setMobileSearchOpen(false)} aria-label="Close search">
            <i className="ri-close-line" />
          </button>
        </div>
      )}

      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}>
        <div className="mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <i className="ri-close-line" />
          </button>
          {navLinks.map((link) =>
            link.route ? (
              <Link
                key={link.to}
                to={link.to}
                className="mobile-menu-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ) : (
              <button
                key={link.id}
                type="button"
                className="mobile-menu-link"
                onClick={() => handleScrollTo(link.id)}
              >
                {link.label}
              </button>
            )
          )}
          <button type="button" className="mobile-menu-link" onClick={() => { setMobileMenuOpen(false); setShowCohortModal(true); }}>
            Cohort 2.0
          </button>
          <button type="button" className="mobile-menu-link green" onClick={handleSignIn}>
            {isAuthenticated ? 'Dashboard' : 'Sign In'}
          </button>
        </div>
      </div>

      <div className="floating-explore-btn" onClick={() => handleScrollTo('courses-section')}>
        <i className="ri-compass-discover-fill" /> Explore
      </div>

      <main>
        <section id="hero-top" className="hero-section">
          <div className="left reveal-stagger">
            <h1>
              The Ultimate AI-Powered Cohort 2.0 <br />
              Master Full-Stack, DSA & <br />
              Generative AI
            </h1>
            <div className="tags">
              <h4>MERN Stack</h4>
              <h4>Advanced DSA</h4>
              <h4>Gen-AI Tools</h4>
              <h4>100% Placement Support</h4>
            </div>
            <h3>
              Special Offer <span>₹ 4999</span> <span className="cut-price">₹ 12999</span> (+GST)
            </h3>
            <div className="btns">
              <MagneticButton className="green-btn ripple-btn" onClick={() => handleScrollTo('contact-section')}>
                Enroll Now
              </MagneticButton>
              <MagneticButton className="ripple-btn" onClick={() => handleScrollTo('courses-section')}>
                Explore Syllabus
              </MagneticButton>
            </div>
            <h6>
              Next Batch Starts on <span>15th September</span>
            </h6>
            <div className="bottom-text">
              <h1 className="shimmer-text">Launch Your Career.</h1>
              <p>Join the elite Job-Ready AI Cohort</p>
            </div>
          </div>
          <div className="right">
            <TiltCard className="card">
              <div className="img-part">
                <img src="/1st.png" alt="Instructor" />
                <div className="badge web">Websites</div>
                <div className="badge dsa">DSA</div>
              </div>
              <div className="info-part">
                <div>
                  <h5>Language</h5>
                  <h4>Hinglish</h4>
                </div>
                <div>
                  <h5>Certification</h5>
                  <h4 className="green">Yes</h4>
                </div>
                <div>
                  <h5>Schedule</h5>
                  <h4>Mon–Sat (8:30 PM)</h4>
                </div>
                <div>
                  <h5>Total Content</h5>
                  <h4 className="green">250+</h4>
                </div>
              </div>
            </TiltCard>
            <a href="https://www.youtube.com" target="_blank" rel="noreferrer" className="youtube-btn magnetic-btn">
              <i className="ri-play-circle-fill" /> Watch Intro Video
            </a>
          </div>
        </section>

        <div className="marquee-container reveal-on-scroll">
          <h4>Our students work at:</h4>
          <div className="marquee-wrapper">
            <div className="marquee-content">
              {[...Array(2)].map((_, i) => (
                <React.Fragment key={i}>
                  <img src="/logos/google.svg" alt="Google" />
                  <img src="/logos/ibm.svg" alt="IBM" />
                  <img src="/logos/microsoft.svg" alt="Microsoft" />
                  <img src="/logos/netflix.svg" alt="Netflix" />
                  <img src="/logos/amazon.svg" alt="Amazon" />
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <section id="classroom-section" className="section-column reveal-on-scroll">
          <div className="section-header center-header">
            <h4 className="green">THE IIITIANS ENVIRONMENT</h4>
            <h1>Digital Classrooms & Labs</h1>
          </div>
          <div className="classroom-grid">
            <TiltCard
              className="classroom-card"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070')" }}
            >
              <div className="classroom-overlay">
                <h3>DSA Lab</h3>
                <p>Live coding environments.</p>
              </div>
            </TiltCard>
            <TiltCard
              className="classroom-card"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070')" }}
            >
              <div className="classroom-overlay">
                <h3>Dev Hub</h3>
                <p>Build complex MERN apps.</p>
              </div>
            </TiltCard>
            <TiltCard
              className="classroom-card"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070')" }}
            >
              <div className="classroom-overlay">
                <h3>AI Center</h3>
                <p>High-level architecture.</p>
              </div>
            </TiltCard>
          </div>
        </section>

        <section id="courses-section" className="section-column reveal-on-scroll">
          <div className="section-header">
            <h4 className="green">EXPLORE OUR COURSES</h4>
            <h1>Outcome Driven Programs</h1>
            {searchQuery.trim() && (
              <p className="search-hint">
                {filteredCourses.length} result(s) for &quot;{searchQuery.trim()}&quot;
              </p>
            )}
          </div>
          <div className="courses-grid">
            {filteredCourses.length === 0 ? (
              <p className="search-empty">No courses match your search.</p>
            ) : (
              filteredCourses.map((course) => (
                <TiltCard key={course.id} className="course-card">
                  <div className="course-img">
                    <img src={course.img} alt={course.title} />
                  </div>
                  <div className="course-details">
                    <div className="course-tags">
                      {course.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <h2>{course.title}</h2>
                    <div className="course-footer">
                      <div className="price">
                        <h3>{course.price}</h3>
                      </div>
                      <MagneticButton
                        className="green-btn-sm ripple-btn"
                        onClick={() => handleScrollTo('contact-section')}
                      >
                        Details
                      </MagneticButton>
                    </div>
                  </div>
                </TiltCard>
              ))
            )}
          </div>
        </section>

        <section id="faq-section" className="section-column reveal-on-scroll">
          <div className="section-header center-header">
            <h4 className="green">COMMON QUERIES</h4>
            <h1>Frequently Asked Questions</h1>
          </div>
          <div className="faq-container">
            {[
              {
                q: 'Who can join this cohort?',
                a: 'Anyone with a basic understanding of computers can join. We start from scratch.',
              },
              {
                q: 'Is placement guaranteed?',
                a: 'We provide 100% placement assistance, resume building, and mock interviews.',
              },
              {
                q: 'Can I access recordings later?',
                a: 'Yes, you get lifetime access to all live class recordings on our LMS.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`faq-item ${faqOpen === idx ? 'active' : ''}`}
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
              >
                <div className="faq-question">
                  <h3>{item.q}</h3>
                  <i className="ri-arrow-down-s-line" />
                </div>
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="contact-section" className="contact-container reveal-on-scroll">
          <div className="contact-left">
            <h1>Get in touch with us.</h1>
            <p>Have questions about our cohorts or need career guidance?</p>
            <div className="contact-info-item">
              <i className="ri-mail-fill green" />
              <div>
                <h5>Email Us</h5>
                <h4>hello@iiitians.com</h4>
              </div>
            </div>
            <div className="contact-info-item">
              <i className="ri-phone-fill green" />
              <div>
                <h5>Call Us</h5>
                <h4>+91 99999 88888</h4>
              </div>
            </div>
          </div>
          <div className="contact-right">
            <TiltCard className="contact-form-wrapper">
              <form className="contact-form" onSubmit={handleContactSubmit} noValidate>
                {contactStatus === 'success' && (
                  <div className="form-alert form-alert-success">Message sent! We&apos;ll get back to you soon.</div>
                )}
                {contactErrors.form && <div className="form-alert form-alert-error">{contactErrors.form}</div>}
                <div className="form-group">
                  <label htmlFor="contact-name">Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="John Doe"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className={contactErrors.name ? 'input-error' : ''}
                  />
                  {contactErrors.name && <span className="field-error">{contactErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="contact-email">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="john@example.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className={contactErrors.email ? 'input-error' : ''}
                  />
                  {contactErrors.email && <span className="field-error">{contactErrors.email}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="contact-message">Message (optional)</label>
                  <textarea
                    id="contact-message"
                    rows={3}
                    placeholder="Your question..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  />
                </div>
                <MagneticButton type="submit" className="green-btn check-btn ripple-btn" disabled={contactStatus === 'loading'}>
                  {contactStatus === 'loading' ? 'Sending...' : 'Send Message'}
                </MagneticButton>
              </form>
            </TiltCard>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-content">
          <p>copyright @ 2026 iiitians .pvt.limited all rights reserved</p>
        </div>
      </footer>

      {showCohortModal && (
        <div className="modal-overlay" onClick={() => setShowCohortModal(false)}>
          <TiltCard className="modal-content" onClick={(e) => e.stopPropagation()}>
            <i className="ri-close-line close-modal" onClick={() => setShowCohortModal(false)} />
            <i className="ri-rocket-2-fill modal-icon" />
            <h2>Coming Soon!</h2>
            <p>Cohort 2.0 enrollment opens soon. <Link to="/register">Create an account</Link> to get notified.</p>
            <MagneticButton className="green-btn close-modal-btn" onClick={() => setShowCohortModal(false)}>
              Got it
            </MagneticButton>
          </TiltCard>
        </div>
      )}
    </>
  );
}
