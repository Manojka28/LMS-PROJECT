import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CoursePlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentLecture, setCurrentLecture] = useState(null);
  const [activeSectionId, setActiveSectionId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [courseRes, progressRes] = await Promise.all([
          api.get(`/course/${id}`),
          api.get(`/progress/${id}`)
        ]);

        if (cancelled) return;

        if (!courseRes.success) {
          setError('Failed to load course');
          return;
        }

        const fetchedCourse = courseRes.course;
        
        // 403 enforcement
        const isOwner = user?.role === 'instructor' && fetchedCourse.instructor?._id === user?._id;
        const isAdmin = user?.role === 'admin';
        if (!fetchedCourse.isEnrolled && !isOwner && !isAdmin) {
          setError('403');
          return;
        }

        setCourse(fetchedCourse);
        
        let prog = null;
        if (progressRes.success && progressRes.progress) {
          prog = progressRes.progress;
          setProgress(prog);
        }

        // Determine starting lecture
        if (fetchedCourse.sections && fetchedCourse.sections.length > 0) {
          let startingLecture = null;
          let startingSectionId = null;

          if (prog && prog.lastViewedLecture) {
            // Find last viewed lecture in the curriculum
            for (const section of fetchedCourse.sections) {
              const found = section.lectures?.find(l => l._id === prog.lastViewedLecture);
              if (found) {
                startingLecture = found;
                startingSectionId = section._id;
                break;
              }
            }
          }

          if (!startingLecture) {
            // Fallback to very first lecture
            const firstSectionWithLectures = fetchedCourse.sections.find(s => s.lectures && s.lectures.length > 0);
            if (firstSectionWithLectures) {
              startingLecture = firstSectionWithLectures.lectures[0];
              startingSectionId = firstSectionWithLectures._id;
            }
          }

          setCurrentLecture(startingLecture);
          setActiveSectionId(startingSectionId);
          
          if (startingLecture && (!prog || prog.lastViewedLecture !== startingLecture._id)) {
            // Optimistically set last viewed on backend
            api.post('/progress/update-last-viewed', { courseId: fetchedCourse._id, lectureId: startingLecture._id }).catch(console.error);
          }
        }
      } catch (err) {
        if (!cancelled) {
          // If 403 returned from progress endpoint
          if (err.status === 403) setError('403');
          else setError(err.message || 'Error loading course');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => { cancelled = true; };
  }, [id, user]);

  const selectLecture = (sectionId, lecture) => {
    setCurrentLecture(lecture);
    setActiveSectionId(sectionId);
    api.post('/progress/update-last-viewed', { courseId: course._id, lectureId: lecture._id }).catch(console.error);
  };

  const getNextLecture = () => {
    if (!course || !currentLecture) return null;
    let foundCurrent = false;
    for (const section of course.sections) {
      for (const lecture of section.lectures || []) {
        if (foundCurrent) return { sectionId: section._id, lecture };
        if (lecture._id === currentLecture._id) foundCurrent = true;
      }
    }
    return null;
  };

  const getPrevLecture = () => {
    if (!course || !currentLecture) return null;
    let prev = null;
    for (const section of course.sections) {
      for (const lecture of section.lectures || []) {
        if (lecture._id === currentLecture._id) return prev;
        prev = { sectionId: section._id, lecture };
      }
    }
    return null;
  };

  const handleMarkComplete = async () => {
    if (!currentLecture || !course) return;
    try {
      const res = await api.post('/progress/complete-lecture', {
        courseId: course._id,
        lectureId: currentLecture._id
      });
      if (res.success) {
        setProgress(res.progress);
        const next = getNextLecture();
        if (next) {
          selectLecture(next.sectionId, next.lecture);
        }
      }
    } catch (err) {
      console.error('Failed to mark complete', err);
      alert('Failed to save progress');
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="loader">Loading Course...</div></div>;
  }

  if (error === '403') {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center', color: '#fff' }}>
        <h2>Access Denied</h2>
        <p style={{ color: '#888', marginTop: '10px' }}>You must be enrolled to access this course.</p>
        <button onClick={() => navigate('/courses')} className="green-btn" style={{ marginTop: '20px' }}>Browse Courses</button>
      </div>
    );
  }

  if (error || !course) {
    return <div style={{ padding: '100px', textAlign: 'center', color: '#ff3b3b' }}>{error || 'Course not found'}</div>;
  }

  const completedSet = new Set(progress?.completedLectures || []);
  const nextLec = getNextLecture();
  const prevLec = getPrevLecture();

  // Simple YouTube to Embed URL converter
  const getEmbedUrl = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#000', paddingTop: '70px', flexDirection: 'column' }}>
      
      {/* Top Nav inside Player */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', background: '#111', borderBottom: '1px solid #333' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate('/student/dashboard')} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '20px' }}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 style={{ fontSize: '18px', margin: 0 }}>{course.title}</h2>
        </div>
        
        {progress && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '150px' }}>
              <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${progress.completionPercentage}%`, height: '100%', background: progress.completed ? '#10b981' : '#00D26A', transition: 'width 0.3s' }}></div>
              </div>
            </div>
            <span style={{ fontSize: '14px', color: '#aaa' }}>{progress.completionPercentage}%</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Video Player */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {!course.sections || course.sections.length === 0 ? (
             <div style={{ padding: '50px', textAlign: 'center', color: '#888' }}>This course has no curriculum yet.</div>
          ) : !currentLecture ? (
             <div style={{ padding: '50px', textAlign: 'center', color: '#888' }}>This section has no lectures.</div>
          ) : (
            <>
              <div style={{ width: '100%', backgroundColor: '#000', aspectRatio: '16/9' }}>
                <iframe
                  width="100%"
                  height="100%"
                  src={getEmbedUrl(currentLecture.videoUrl)}
                  title={currentLecture.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ display: 'block' }}
                ></iframe>
              </div>
              
              <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>{currentLecture.title}</h1>
                    {currentLecture.description && <p style={{ color: '#aaa', lineHeight: 1.6 }}>{currentLecture.description}</p>}
                  </div>
                  <button 
                    onClick={handleMarkComplete}
                    style={{
                      background: completedSet.has(currentLecture._id) ? '#10b98120' : '#00D26A',
                      color: completedSet.has(currentLecture._id) ? '#10b981' : '#000',
                      border: completedSet.has(currentLecture._id) ? '1px solid #10b98150' : 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {completedSet.has(currentLecture._id) ? <><i className="fas fa-check"></i> Completed</> : 'Mark Complete'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #333' }}>
                  <button 
                    disabled={!prevLec}
                    onClick={() => prevLec && selectLecture(prevLec.sectionId, prevLec.lecture)}
                    style={{ background: 'none', border: '1px solid #444', color: prevLec ? '#fff' : '#444', padding: '10px 20px', borderRadius: '8px', cursor: prevLec ? 'pointer' : 'not-allowed' }}
                  >
                    <i className="fas fa-chevron-left" style={{ marginRight: '8px' }}></i> Previous
                  </button>
                  <button 
                    disabled={!nextLec}
                    onClick={() => nextLec && selectLecture(nextLec.sectionId, nextLec.lecture)}
                    style={{ background: 'none', border: '1px solid #444', color: nextLec ? '#fff' : '#444', padding: '10px 20px', borderRadius: '8px', cursor: nextLec ? 'pointer' : 'not-allowed' }}
                  >
                    Next <i className="fas fa-chevron-right" style={{ marginLeft: '8px' }}></i>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Sidebar */}
        <div style={{ width: '350px', background: '#111', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #333' }}>
            <h3 style={{ fontSize: '18px' }}>Course Content</h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {course.sections && course.sections.map((section, sIdx) => (
              <div key={section._id} style={{ borderBottom: '1px solid #222' }}>
                <div 
                  onClick={() => setActiveSectionId(activeSectionId === section._id ? null : section._id)}
                  style={{ padding: '15px 20px', background: activeSectionId === section._id ? '#1a1a1a' : 'transparent', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ fontWeight: '500', fontSize: '15px' }}>{sIdx + 1}. {section.title}</div>
                  <i className={`fas fa-chevron-${activeSectionId === section._id ? 'up' : 'down'}`} style={{ fontSize: '12px', color: '#666' }}></i>
                </div>
                {activeSectionId === section._id && (
                  <div style={{ background: '#0a0a0a' }}>
                    {!section.lectures || section.lectures.length === 0 ? (
                      <div style={{ padding: '15px 20px', color: '#666', fontSize: '13px' }}>No lectures in this section</div>
                    ) : (
                      section.lectures.map((lec, lIdx) => {
                        const isActive = currentLecture && currentLecture._id === lec._id;
                        const isCompleted = completedSet.has(lec._id);
                        return (
                          <div 
                            key={lec._id} 
                            onClick={() => selectLecture(section._id, lec)}
                            style={{ padding: '12px 20px 12px 40px', cursor: 'pointer', background: isActive ? 'rgba(0, 210, 106, 0.1)' : 'transparent', borderLeft: isActive ? '3px solid #00D26A' : '3px solid transparent', display: 'flex', alignItems: 'flex-start', gap: '10px' }}
                          >
                            <div style={{ marginTop: '3px' }}>
                              {isCompleted ? (
                                <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '14px' }}></i>
                              ) : (
                                <i className="far fa-circle" style={{ color: '#555', fontSize: '14px' }}></i>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', color: isActive ? '#fff' : '#bbb', lineHeight: '1.4' }}>{sIdx + 1}.{lIdx + 1} {lec.title}</div>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                <i className="fas fa-play-circle" style={{ marginRight: '5px' }}></i> {lec.duration} min
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
