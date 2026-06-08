import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';
import { getDashboardPath } from '../utils/navigation';
import { COURSES } from '../data/courses';
import { validateEmailField, validateNameField } from '../utils/validation';
import MagneticButton from '../components/MagneticButton';
import TiltCard from '../components/TiltCard';
import { FadeIn, SlideUp, StaggerContainer, StaggerItem, HoverCard } from '../components/common/MotionWrapper';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const growthData = [
  { name: 'Jan', students: 4000, placement: 2400 },
  { name: 'Feb', students: 5500, placement: 3100 },
  { name: 'Mar', students: 7800, placement: 4500 },
  { name: 'Apr', students: 11000, placement: 7800 },
  { name: 'May', students: 18000, placement: 12000 },
  { name: 'Jun', students: 28000, placement: 19000 },
  { name: 'Jul', students: 50000, placement: 45000 },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const loader = document.getElementById('preloader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => setLoading(false), 500);
      }
    }, 1000);
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
    navigate(isAuthenticated ? getDashboardPath(user?.role) : '/login');
  };

  const handleLogout = async () => {
    setShowUserDropdown(false);
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { id: 'hero-top', label: 'Home' },
    { to: '/courses', label: 'All Courses', route: true },
    { id: 'features-section', label: 'Platform' },
    { id: 'outcomes-section', label: 'Outcomes' },
    { id: 'contact-section', label: 'Contact' },
  ];

  return (
    <>
      <div id="preloader" style={{ opacity: loading ? 1 : 0, visibility: loading ? 'visible' : 'hidden' }}>
        <div className="loader-content">
          <h2>LMS</h2>
          <div className="loading-bar" />
        </div>
      </div>

      <div className="noise-overlay" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <nav>
        <div className="nav1">
          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg, #00D26A, #00984C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20, color: '#000' }}>L</div>
          <h4 className="magnetic-text" style={{ fontFamily: 'Space Grotesk', fontSize: 20, letterSpacing: '-0.5px', marginLeft: 10 }}>
            LMS Platform
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
          
          {isAuthenticated ? (
             <MagneticButton className="green-btn" onClick={() => navigate(getDashboardPath(user?.role))} style={{ padding: '10px 24px', borderRadius: '8px' }}>
                Dashboard
             </MagneticButton>
          ) : (
            <>
              <MagneticButton className="signin-btn" onClick={handleSignIn} style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff', padding: '10px 24px', borderRadius: '8px' }}>
                Sign In
              </MagneticButton>
              <MagneticButton className="green-btn" onClick={() => navigate('/register')} style={{ padding: '10px 24px', borderRadius: '8px' }}>
                Get Started
              </MagneticButton>
            </>
          )}

          <div className="nav-icons" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div className={`search-container ${searchActive ? 'active' : ''}`}>
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search courses"
              />
              <i
                className="ri-search-line"
                role="button"
                tabIndex={0}
                onClick={() => setSearchActive(!searchActive)}
                onKeyDown={(e) => e.key === 'Enter' && setSearchActive(!searchActive)}
              />
            </div>
            {isAuthenticated && (
              <div className="user-dropdown-container" style={{ position: 'relative', marginLeft: 15 }}>
                <div 
                  className="nav-avatar" 
                  title={user.name} 
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  style={{ cursor: 'pointer', background: '#00D26A', color: '#000' }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {showUserDropdown && (
                  <div className="user-dropdown" style={{ 
                    position: 'absolute', right: 0, top: '50px', background: 'rgba(20,20,20,0.95)', 
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', 
                    width: '220px', zIndex: 100, backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>{user.name}</h4>
                      <p style={{ margin: '5px 0 0', color: '#888', fontSize: '13px', wordBreak: 'break-all' }}>{user.email}</p>
                      <p style={{ margin: '5px 0 0', color: '#00D26A', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{user.role}</p>
                    </div>
                    <Link 
                      to={getDashboardPath(user?.role)} 
                      style={{ display: 'block', padding: '8px 0', color: '#ddd', textDecoration: 'none', fontSize: '14px' }}
                      onClick={() => setShowUserDropdown(false)}
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={handleLogout}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 0', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="nav3">
          <h4 role="button" tabIndex={0} onClick={() => setMobileSearchOpen(!mobileSearchOpen)}>
            <i className="ri-search-line" />
          </h4>
          <button type="button" className="signin-btn-mobile" style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }} onClick={handleSignIn}>
            {isAuthenticated ? 'Dashboard' : 'Sign In'}
          </button>
          <h4 role="button" tabIndex={0} onClick={() => setMobileMenuOpen(true)}>
            <i className="ri-menu-3-fill" />
          </h4>
        </div>
      </nav>

      {mobileSearchOpen && (
        <div className="mobile-search-bar">
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <button type="button" onClick={() => setMobileSearchOpen(false)}>
            <i className="ri-close-line" />
          </button>
        </div>
      )}

      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}>
        <div className="mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>
            <i className="ri-close-line" />
          </button>
          {navLinks.map((link) =>
            link.route ? (
              <Link key={link.to} to={link.to} className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>{link.label}</Link>
            ) : (
              <button key={link.id} type="button" className="mobile-menu-link" onClick={() => handleScrollTo(link.id)}>{link.label}</button>
            )
          )}
          {isAuthenticated ? (
            <button type="button" className="mobile-menu-link green" onClick={() => navigate(getDashboardPath(user?.role))}>Dashboard</button>
          ) : (
            <>
              <button type="button" className="mobile-menu-link" onClick={handleSignIn}>Sign In</button>
              <button type="button" className="mobile-menu-link green" onClick={() => navigate('/register')}>Get Started</button>
            </>
          )}
        </div>
      </div>

      <main style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* PREMIUM HERO SECTION */}
        <section id="hero-top" style={{ minHeight: '80vh', alignItems: 'center', marginTop: '40px', paddingTop: '40px' }}>
          <div className="left" style={{ zIndex: 10 }}>
            <FadeIn duration={1} yOffset={50}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', marginBottom: '24px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00D26A', boxShadow: '0 0 10px #00D26A' }}></span>
                <span style={{ fontSize: '13px', color: '#ccc' }}>LMS Platform 2.0 is now live</span>
              </div>
              <h1 style={{ fontSize: '72px', letterSpacing: '-0.04em', lineHeight: '1.05', marginBottom: '24px' }}>
                Master code. <br />
                <span className="premium-gradient-text">Build the future.</span>
              </h1>
              <p style={{ fontSize: '20px', color: '#888', maxWidth: '80%', lineHeight: '1.5', marginBottom: '40px' }}>
                The complete platform to learn full-stack development, ace technical interviews, and land your dream engineering role.
              </p>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                {isAuthenticated ? (
                  <>
                    <MagneticButton className="green-btn" onClick={() => navigate(getDashboardPath(user?.role))} style={{ padding: '16px 32px', fontSize: '16px', borderRadius: '12px' }}>
                      Continue Learning
                    </MagneticButton>
                    <MagneticButton className="btn btn-secondary" onClick={() => navigate('/courses')} style={{ padding: '16px 32px', fontSize: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                      Browse Courses
                    </MagneticButton>
                  </>
                ) : (
                  <>
                    <MagneticButton className="green-btn" onClick={() => navigate('/register')} style={{ padding: '16px 32px', fontSize: '16px', borderRadius: '12px' }}>
                      Start Building Free
                    </MagneticButton>
                    <MagneticButton className="btn btn-secondary" onClick={() => handleScrollTo('features-section')} style={{ padding: '16px 32px', fontSize: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                      Explore Platform
                    </MagneticButton>
                  </>
                )}
              </div>

              <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', width: '100%' }}>
                <div className="saas-card premium-glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', fontFamily: 'Space Grotesk' }}>50,000+</div>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.5px' }}>Students</div>
                </div>
                <div className="saas-card premium-glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', fontFamily: 'Space Grotesk' }}>1,200+</div>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.5px' }}>Courses</div>
                </div>
                <div className="saas-card premium-glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', fontFamily: 'Space Grotesk' }}>98%</div>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.5px' }}>Placement Rate</div>
                </div>
                <div className="saas-card premium-glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', fontFamily: 'Space Grotesk' }}>300+</div>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.5px' }}>Hiring Partners</div>
                </div>
                <div className="saas-card premium-glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', fontFamily: 'Space Grotesk' }}>24 LPA</div>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.5px' }}>Highest Package</div>
                </div>
              </div>
            </FadeIn>
          </div>
          
          <div className="right" style={{ perspective: '1000px', zIndex: 5 }}>
            <SlideUp delay={0.3} duration={1.2}>
              <motion.div 
                initial={{ rotateY: 15, rotateX: 5 }}
                animate={{ rotateY: -5, rotateX: 0 }}
                transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                className="hero-mock-ui"
              >
                <div className="hero-mock-header">
                  <div className="hero-mock-dot r"></div>
                  <div className="hero-mock-dot y"></div>
                  <div className="hero-mock-dot g"></div>
                  <div style={{ margin: '0 auto', fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>app.lms.dev/dashboard</div>
                </div>
                <div className="hero-mock-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '40%', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                    <div style={{ width: '20%', height: '24px', background: 'rgba(0,210,106,0.2)', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ width: '30%', height: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginBottom: '12px' }}></div>
                      <div style={{ width: '50%', height: '24px', background: 'rgba(255,255,255,0.8)', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ width: '30%', height: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginBottom: '12px' }}></div>
                      <div style={{ width: '50%', height: '24px', background: 'rgba(0,210,106,0.8)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                  <div style={{ height: '180px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.1)', position: 'absolute', top: '50%' }}></div>
                    <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.1)', position: 'absolute', top: '75%' }}></div>
                    <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%', position: 'absolute', bottom: 0, left: 0 }}>
                      <path d="M0 50 L10 40 L30 45 L50 20 L70 30 L90 5 L100 10" fill="none" stroke="#00D26A" strokeWidth="2" />
                      <path d="M0 50 L10 40 L30 45 L50 20 L70 30 L90 5 L100 10 L100 50 Z" fill="rgba(0,210,106,0.1)" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            </SlideUp>

            <SlideUp delay={0.5} duration={1.2}>
              <div className="saas-card premium-glass-panel" style={{ marginTop: '24px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '14px', color: '#888', textTransform: 'uppercase', margin: 0, letterSpacing: '1px' }}>Live Platform Activity</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                  <span style={{ color: '#ccc' }}><strong>Rahul M.</strong> completed <span style={{ color: '#fff' }}>Advanced React Patterns</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }}></div>
                  <span style={{ color: '#ccc' }}><strong>Priya S.</strong> earned <span style={{ color: '#fff' }}>System Design Certificate</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }}></div>
                  <span style={{ color: '#ccc' }}><strong>Amit K.</strong> scored <span style={{ color: '#fff' }}>95% in Mock Interview</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 8px #8b5cf6' }}></div>
                  <span style={{ color: '#ccc' }}><strong>Neha T.</strong> unlocked <span style={{ color: '#fff' }}>Backend Dev Roadmap</span></span>
                </div>
              </div>
            </SlideUp>
          </div>
        </section>

        {/* SOCIAL PROOF SECTION */}
        <section style={{ flexDirection: 'column', alignItems: 'center', margin: '0 0 40px 0', position: 'relative', zIndex: 10 }}>
          <FadeIn duration={1.2}>
            <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
              Trusted by engineers at top companies
            </p>
            <div className="social-proof-ticker">
              <div className="social-proof-track">
                {[...Array(3)].map((_, i) => (
                  <React.Fragment key={i}>
                    <img src="/logos/google.svg" alt="Google" className="social-logo" />
                    <img src="/logos/ibm.svg" alt="IBM" className="social-logo" />
                    <img src="/logos/microsoft.svg" alt="Microsoft" className="social-logo" />
                    <img src="/logos/netflix.svg" alt="Netflix" className="social-logo" />
                    <img src="/logos/amazon.svg" alt="Amazon" className="social-logo" />
                  </React.Fragment>
                ))}
              </div>
            </div>
          </FadeIn>
        </section>

        {/* PREMIUM DATA STORYTELLING SECTION */}
        <section style={{ flexDirection: 'column', width: '100%', maxWidth: '1200px', margin: '40px auto 80px', padding: '0 20px' }}>
          <SlideUp duration={1}>
            <div className="saas-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '24px', fontFamily: 'Space Grotesk', marginBottom: '8px' }}>Platform Growth</h3>
                  <p style={{ color: '#888', fontSize: '14px' }}>Accelerating tech careers globally</p>
                </div>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div>
                    <p style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>Total Enrolled</p>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>50,000+ <span style={{ color: '#00D26A', fontSize: '14px', marginLeft: '8px' }}>↑ 34%</span></p>
                  </div>
                  <div>
                    <p style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>Placement Rate</p>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>98.2% <span style={{ color: '#00D26A', fontSize: '14px', marginLeft: '8px' }}>↑ 2%</span></p>
                  </div>
                </div>
              </div>
              
              <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fff" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPlacement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D26A" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00D26A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(10px)' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="students" stroke="#fff" strokeWidth={2} fillOpacity={1} fill="url(#colorStudents)" />
                    <Area type="monotone" dataKey="placement" stroke="#00D26A" strokeWidth={2} fillOpacity={1} fill="url(#colorPlacement)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </SlideUp>
        </section>

        {/* BENTO GRID FEATURE SECTION */}
        <section id="features-section" style={{ flexDirection: 'column', gap: '40px', margin: '40px 0' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 40px' }}>
            <h4 className="premium-gradient-text-green" style={{ fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 'bold' }}>The Platform</h4>
            <h2 style={{ fontSize: '48px', fontFamily: 'Space Grotesk', letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '20px' }}>Everything you need to scale your career.</h2>
            <p style={{ color: '#888', fontSize: '18px' }}>We replaced fragmented tools with a single, deeply integrated platform designed for outcome-driven learning.</p>
          </div>

          <StaggerContainer className="bento-grid">
            <StaggerItem className="bento-item large">
              <div className="bento-content">
                <div className="bento-icon" style={{ color: '#00D26A' }}><i className="ri-robot-2-fill"></i></div>
                <h3 className="bento-title">Personal AI Coach</h3>
                <p className="bento-desc" style={{ maxWidth: '60%' }}>Stop getting stuck on bugs. Our AI coach analyzes your code in real-time, explains concepts, and provides hints without giving away the answer.</p>
              </div>
              <div className="bento-visual"></div>
            </StaggerItem>
            
            <StaggerItem className="bento-item">
              <div className="bento-content">
                <div className="bento-icon" style={{ color: '#3b82f6' }}><i className="ri-macbook-line"></i></div>
                <h3 className="bento-title">Interactive Labs</h3>
                <p className="bento-desc">Code directly in the browser with our instant, zero-setup environments.</p>
              </div>
            </StaggerItem>

            <StaggerItem className="bento-item">
              <div className="bento-content">
                <div className="bento-icon" style={{ color: '#f59e0b' }}><i className="ri-briefcase-4-fill"></i></div>
                <h3 className="bento-title">Mock Interviews</h3>
                <p className="bento-desc">Practice system design and DSA with real engineers from top tech companies.</p>
              </div>
            </StaggerItem>

            <StaggerItem className="bento-item large">
              <div className="bento-content">
                <div className="bento-icon" style={{ color: '#8b5cf6' }}><i className="ri-road-map-line"></i></div>
                <h3 className="bento-title">Dynamic Roadmaps</h3>
                <p className="bento-desc" style={{ maxWidth: '60%' }}>Never wonder what to learn next. Get a personalized, adaptive curriculum based on your dream role and current skill gaps.</p>
              </div>
              <div className="bento-visual" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0) 70%)' }}></div>
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* OUTCOMES SECTION */}
        <section id="outcomes-section" style={{ alignItems: 'center', margin: '80px auto' }}>
          <div className="left">
            <SlideUp duration={1}>
              <h4 className="premium-gradient-text-green" style={{ fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 'bold' }}>Proven Outcomes</h4>
              <h2 style={{ fontSize: '48px', fontFamily: 'Space Grotesk', letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '24px' }}>From zero to engineering offer.</h2>
              <p style={{ color: '#888', fontSize: '18px', marginBottom: '40px' }}>Our curriculum isn't just about writing code. It's about engineering systems, collaborating in teams, and passing elite technical bars.</p>
              
              <div className="outcomes-timeline">
                <div className="timeline-item">
                  <div className="timeline-dot">1</div>
                  <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>Master Fundamentals</h4>
                  <p style={{ color: '#888', fontSize: '14px' }}>Deep dive into DSA, System Design, and Modern Web Architecture.</p>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot">2</div>
                  <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>Build Portfolio</h4>
                  <p style={{ color: '#888', fontSize: '14px' }}>Deploy 5 production-grade applications using React, Node, and AWS.</p>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot">3</div>
                  <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>Interview Prep</h4>
                  <p style={{ color: '#888', fontSize: '14px' }}>Rigorous mock interviews and resume optimization with experts.</p>
                </div>
              </div>
            </SlideUp>
          </div>
          <div className="right">
            <SlideUp delay={0.2} duration={1}>
              <div className="premium-glass-panel" style={{ padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#00D26A', fontFamily: 'Space Grotesk', lineHeight: '1' }}>98%</div>
                  <div style={{ color: '#888', fontSize: '16px', marginTop: '8px' }}>Placement Rate within 6 months</div>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 0 32px 0' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>24 LPA</div>
                    <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>Highest Package</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>8.5 LPA</div>
                    <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>Average Package</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>300+</div>
                    <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>Hiring Partners</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>10k+</div>
                    <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>Alumni Network</div>
                  </div>
                </div>
              </div>
            </SlideUp>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section style={{ flexDirection: 'column', gap: '40px', margin: '40px 0' }}>
          <div style={{ textAlign: 'center', margin: '0 auto 20px' }}>
            <h2 style={{ fontSize: '40px', fontFamily: 'Space Grotesk', letterSpacing: '-0.03em' }}>Don't just take our word for it.</h2>
          </div>
          
          <SlideUp delay={0.1} duration={1}>
            <div className="testimonial-grid">
              {[
                { name: 'Sarah Jenkins', role: 'SDE II at Microsoft', img: '1', quote: 'The platform completely changed how I approached system design. The interactive architecture labs were mind-blowing. I went from struggling with basic Node.js apps to designing scalable microservices.' },
                { name: 'David Chen', role: 'Frontend Engineer at Stripe', img: '2', quote: 'I had been stuck in tutorial hell for 2 years. The AI Coach and dynamic roadmaps broke me out of it. It told me exactly what I was missing and the mock interviews prepared me for the real thing.' },
                { name: 'Priya Sharma', role: 'Software Engineer at Google', img: '3', quote: 'Worth every penny. The community is incredible and the instructors actually care about your success. The DSA patterns course is the best on the internet, hands down.' },
                { name: 'Michael Ross', role: 'Full Stack Dev at Vercel', img: '4', quote: 'The projects you build here are not toy applications. You are building real-world SaaS products with authentication, payments, and complex state management.' },
                { name: 'Alex Rivera', role: 'Backend Engineer at Amazon', img: '5', quote: 'I transitioned from a non-tech background. The structured timeline from fundamentals to interview prep is flawless.' }
              ].map((t, idx) => (
                <HoverCard key={idx} className="testimonial-card">
                  <div className="testimonial-header">
                    <img src={`https://i.pravatar.cc/100?img=${t.img}`} alt={t.name} className="testimonial-avatar" />
                    <div>
                      <h4 style={{ fontSize: '15px', color: '#fff', margin: 0 }}>{t.name}</h4>
                      <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0 0' }}>{t.role}</p>
                    </div>
                  </div>
                  <p className="testimonial-quote">"{t.quote}"</p>
                </HoverCard>
              ))}
            </div>
          </SlideUp>
        </section>

        {/* MODERN CTA SECTION */}
        <section id="contact-section" style={{ margin: '60px auto 100px' }}>
          <div className="premium-glass-panel" style={{ width: '100%', padding: '80px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50%', left: '20%', width: '60%', height: '200%', background: 'radial-gradient(ellipse, rgba(0,210,106,0.15) 0%, rgba(0,0,0,0) 70%)', transform: 'rotate(45deg)', pointerEvents: 'none' }}></div>
            <div style={{ position: 'relative', zIndex: 10 }}>
              <h2 style={{ fontSize: '56px', fontFamily: 'Space Grotesk', letterSpacing: '-0.04em', marginBottom: '24px' }}>
                {isAuthenticated ? 'Ready to resume your journey?' : 'Ready to start building?'}
              </h2>
              <p style={{ color: '#aaa', fontSize: '18px', maxWidth: '500px', margin: '0 auto 40px' }}>
                {isAuthenticated ? 'Pick up right where you left off and hit your next milestone.' : 'Join over 50,000 developers building the future. Start learning for free today.'}
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                {isAuthenticated ? (
                  <>
                    <MagneticButton className="green-btn" onClick={() => navigate(getDashboardPath(user?.role))} style={{ padding: '16px 36px', fontSize: '16px', borderRadius: '12px' }}>
                      Open Dashboard
                    </MagneticButton>
                    <MagneticButton className="btn btn-secondary" onClick={() => navigate('/my-courses')} style={{ padding: '16px 36px', fontSize: '16px', borderRadius: '12px' }}>
                      My Courses
                    </MagneticButton>
                  </>
                ) : (
                  <>
                    <MagneticButton className="green-btn" onClick={() => navigate('/register')} style={{ padding: '16px 36px', fontSize: '16px', borderRadius: '12px' }}>
                      Create Free Account
                    </MagneticButton>
                    <MagneticButton className="btn btn-secondary" onClick={() => navigate('/login')} style={{ padding: '16px 36px', fontSize: '16px', borderRadius: '12px' }}>
                      Sign In
                    </MagneticButton>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '60px 0', background: '#0b0b0b' }}>
        <div style={{ width: '90%', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16, color: '#fff' }}>L</div>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, color: '#fff' }}>LMS Platform</span>
          </div>
          <div style={{ display: 'flex', gap: '24px', color: '#888', fontSize: '14px' }}>
            <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
            <span style={{ cursor: 'pointer' }}>Terms of Service</span>
            <span style={{ cursor: 'pointer' }}>Contact</span>
          </div>
          <div style={{ color: '#666', fontSize: '13px' }}>
            &copy; 2026 LMS Platform Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
