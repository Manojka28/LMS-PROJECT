import React, { useState, useEffect } from 'react';
import './index.css';
import MagneticButton from './components/MagneticButton';
import TiltCard from './components/TiltCard';

function App() {
  const [loading, setLoading] = useState(true);
  const [searchActive, setSearchActive] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          if(entry.target.classList.contains('reveal-stagger')) {
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
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => setLoading(false), 500);
        }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => {
         const newCount = prev.length + 1;
         return [{ id: Date.now(), text: `New Notification ${newCount}` }, ...prev];
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if(el) {
        const headerOffset = 90;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div id="preloader" style={{opacity: loading ? 1 : 0, visibility: loading ? 'visible' : 'hidden'}}>
        <div className="loader-content">
            <h2>IIITL</h2>
            <div className="loading-bar"></div>
        </div>
      </div>

      <div className="noise-overlay"></div>
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <nav>
        <div className="nav1">
            <img src="https://ik.imagekit.io/sheryians/light-logo_lNzGXRRlQ.png" alt="logo" />
            <h4 className="magnetic-text">IIITL <br /> Coding School</h4>
        </div>
        <div className="nav2">
            <h4 onClick={() => handleScrollTo('hero')}>Home</h4>
            <h4 onClick={() => handleScrollTo('courses-section')}>Courses</h4>
            <h4 onClick={() => handleScrollTo('faq-section')}>FAQ</h4>
            <h4 onClick={() => handleScrollTo('contact-section')}>Contact</h4>
            <h4 className="coming-soon" onClick={() => setShowModal(true)}>Cohort 2.0</h4>
            <MagneticButton className="signin-btn coming-soon" onClick={() => setShowModal(true)}>Sign In</MagneticButton>
            <div className="nav-icons">
                <div className={`search-container ${searchActive ? 'active' : ''}`}>
                    <input type="text" id="search-input" placeholder="Search..." />
                    <i className="ri-search-line" id="search-icon" onClick={() => setSearchActive(!searchActive)}></i>
                </div>
                <div className="notification-container">
                    <i className="ri-notification-2-fill" id="notif-bell" onClick={() => setShowNotifDropdown(!showNotifDropdown)}></i>
                    {notifications.length > 0 && <div className="badge">{notifications.length}</div>}
                    {showNotifDropdown && (
                        <div className="notif-dropdown">
                            {notifications.length === 0 ? <p className="empty-msg">No new notifications</p> : notifications.map(n => (
                                <div key={n.id} className="notif-item" onClick={() => setNotifications(notifications.filter(item => item.id !== n.id))}>{n.text}</div>
                            ))}
                        </div>
                    )}
                </div>
                <img src="https://ik.imagekit.io/sheryians/light-logo_lNzGXRRlQ.png?updatedAt=1701272916848" alt="Profile" />
            </div>
        </div>
        <div className="nav3">
            <h4><i className="ri-search-line"></i></h4>
            <button className="signin-btn-mobile" onClick={() => setShowModal(true)}>Sign In</button>
            <h4><i className="ri-menu-3-fill"></i></h4>
        </div>
      </nav>

      <div className="floating-explore-btn" onClick={() => handleScrollTo('courses-section')}>
        <i className="ri-compass-discover-fill"></i> Explore
      </div>

      <main id="hero">
        <section className="hero-section">
            <div className="left reveal-stagger">
                <h1>2.0 Job Ready AI Powered Cohort: <br/>Complete Web Development + <br/>DSA + Gen-AI + Aptitude</h1>
                <div className="tags">
                    <h4>MERN Stack</h4><h4>DSA with JS</h4><h4>AI Powered</h4><h4>Placement Focused</h4>
                </div>
                <h3>Price <span>₹ 5999</span> <span className="cut-price">₹ 11999</span> (+GST)</h3>
                <div className="btns">
                    <MagneticButton className="green-btn ripple-btn">Buy Now</MagneticButton>
                    <MagneticButton className="ripple-btn">View Syllabus</MagneticButton>
                </div>
                <h6>Batch Starts on <span>15th September</span></h6>
                <div className="bottom-text">
                    <h1 className="shimmer-text">Get Placed.</h1>
                    <p>With Job Ready AI Powered Cohort</p>
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
                        <div><h5>Language</h5><h4>Hinglish</h4></div>
                        <div><h5>Certification</h5><h4 className="green">Yes</h4></div>
                        <div><h5>Schedule</h5><h4>Mon–Sat (8:30 PM)</h4></div>
                        <div><h5>Total Content</h5><h4 className="green">250+</h4></div>
                    </div>
                </TiltCard>
                <a href="https://www.youtube.com" target="_blank" className="youtube-btn magnetic-btn">
                    <i className="ri-play-circle-fill"></i> Watch Intro Video
                </a>
            </div>
        </section>

        <div className="marquee-container reveal-on-scroll">
            <h4>Our students work at:</h4>
            <div className="marquee-wrapper">
                <div className="marquee-content">
                     {[...Array(2)].map((_, i) => (
                        <React.Fragment key={i}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/2560px-Google_2015_logo.svg.png" alt="Google" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/IBM_logo.svg/2560px-IBM_logo.svg.png" alt="IBM" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/2560px-Microsoft_logo_%282012%29.svg.png" alt="Microsoft" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/2560px-Netflix_2015_logo.svg.png" alt="Netflix" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png" alt="Amazon" />
                        </React.Fragment>
                     ))}
                </div>
            </div>
        </div>

        <section id="classroom-section" className="section-column reveal-on-scroll">
            <div className="section-header center-header" style={{textAlign:'center', width:'100%'}}>
                <h4 className="green">THE IIITIANS ENVIRONMENT</h4>
                <h1>Digital Classrooms & Labs</h1>
            </div>
            <div className="classroom-grid">
                <TiltCard className="classroom-card" style={{backgroundImage: "url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070')"}}>
                    <div className="classroom-overlay"><h3>DSA Lab</h3><p>Live coding environments.</p></div>
                </TiltCard>
                <TiltCard className="classroom-card" style={{backgroundImage: "url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070')"}}>
                    <div className="classroom-overlay"><h3>Dev Hub</h3><p>Build complex MERN apps.</p></div>
                </TiltCard>
                <TiltCard className="classroom-card" style={{backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070')"}}>
                    <div className="classroom-overlay"><h3>AI Center</h3><p>High-level architecture.</p></div>
                </TiltCard>
            </div>
        </section>

        <section id="courses-section" className="section-column reveal-on-scroll">
            <div className="section-header"><h4 className="green">EXPLORE OUR COURSES</h4><h1>Outcome Driven Programs</h1></div>
            <div className="courses-grid">
                <TiltCard className="course-card">
                    <div className="course-img"><img src="/r1.png" alt="Course" /></div>
                    <div className="course-details">
                        <div className="course-tags"><span>ML</span><span>AI</span></div>
                        <h2>Master Machine Learning</h2>
                        <div className="course-footer"><div className="price"><h3>₹ 4999</h3></div><MagneticButton className="green-btn-sm ripple-btn">Details</MagneticButton></div>
                    </div>
                </TiltCard>
                <TiltCard className="course-card">
                    <div className="course-img"><img src="/r2.png" alt="Course" /></div>
                    <div className="course-details">
                        <div className="course-tags"><span>MERN</span><span>Web</span></div>
                        <h2>Full Stack Web Dev</h2>
                        <div className="course-footer"><div className="price"><h3>₹ 5999</h3></div><MagneticButton className="green-btn-sm ripple-btn">Details</MagneticButton></div>
                    </div>
                </TiltCard>
                <TiltCard className="course-card">
                    <div className="course-img"><img src="/r3.png" alt="Course" /></div>
                    <div className="course-details">
                        <div className="course-tags"><span>DSA</span><span>Java</span></div>
                        <h2>Data Structures & Algo</h2>
                        <div className="course-footer"><div className="price"><h3>₹ 3999</h3></div><MagneticButton className="green-btn-sm ripple-btn">Details</MagneticButton></div>
                    </div>
                </TiltCard>
            </div>
        </section>

        <section id="faq-section" className="section-column reveal-on-scroll">
             <div className="section-header center-header" style={{textAlign:'center', width:'100%'}}><h4 className="green">COMMON QUERIES</h4><h1>Frequently Asked Questions</h1></div>
            <div className="faq-container">
                {[{q: "Who can join this cohort?", a: "Anyone with a basic understanding of computers can join. We start from scratch."},
                  {q: "Is placement guaranteed?", a: "We provide 100% placement assistance, resume building, and mock interviews."},
                  {q: "Can I access recordings later?", a: "Yes, you get lifetime access to all live class recordings on our LMS."}
                ].map((item, idx) => (
                    <div key={idx} className={`faq-item ${faqOpen === idx ? 'active' : ''}`} onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}>
                        <div className="faq-question"><h3>{item.q}</h3><i className="ri-arrow-down-s-line"></i></div>
                        <div className="faq-answer"><p>{item.a}</p></div>
                    </div>
                ))}
            </div>
        </section>

        <section id="contact-section" className="contact-container reveal-on-scroll">
            <div className="contact-left">
                <h1>Get in touch with us.</h1><p>Have questions about our cohorts or need career guidance?</p>
                <div className="contact-info-item" style={{display:'flex', gap:'15px', marginTop:'20px'}}><i className="ri-mail-fill green" style={{fontSize:'24px'}}></i><div><h5>Email Us</h5><h4>hello@iiitians.com</h4></div></div>
                <div className="contact-info-item" style={{display:'flex', gap:'15px', marginTop:'20px'}}><i className="ri-phone-fill green" style={{fontSize:'24px'}}></i><div><h5>Call Us</h5><h4>+91 99999 88888</h4></div></div>
            </div>
            <div className="contact-right">
                <TiltCard className="contact-form-wrapper">
                    <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
                        <div className="form-group"><label>Name</label><input type="text" placeholder="John Doe" /></div>
                        <div className="form-group"><label>Email</label><input type="email" placeholder="john@example.com" /></div>
                        <MagneticButton className="green-btn check-btn ripple-btn">Send Message</MagneticButton>
                    </form>
                </TiltCard>
            </div>
        </section>
      </main>

      <footer><div className="footer-content"><p>copyright @ 2026 iiitians .pvt.limited all rights reserved</p></div></footer>

      {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <TiltCard className="modal-content" onClick={(e) => e.stopPropagation()}>
                <i className="ri-close-line close-modal" onClick={() => setShowModal(false)}></i>
                <i className="ri-rocket-2-fill modal-icon" style={{fontSize:'50px', color:'#00D26A', marginBottom:'15px'}}></i>
                <h2>Coming Soon!</h2><p style={{margin:'15px 0'}}>We are working hard to bring this feature to you.</p>
                <MagneticButton className="green-btn close-modal-btn" onClick={() => setShowModal(false)}>Got it</MagneticButton>
            </TiltCard>
          </div>
      )}
    </>
  );
}

export default App;