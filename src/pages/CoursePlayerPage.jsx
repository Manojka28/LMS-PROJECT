import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../utils/navigation';
import AITutor from '../components/AITutor';
import DiscussionForum from '../components/DiscussionForum';

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

  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const [quiz, setQuiz] = useState(null);
  const [quizLoaded, setQuizLoaded] = useState(false);
  const [showAITutor, setShowAITutor] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [quizMode, setQuizMode] = useState(false);
  const [studentAnswers, setStudentAnswers] = useState([]);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizAttemptResults, setQuizAttemptResults] = useState(null);

  const [assignment, setAssignment] = useState(null);
  const [assignmentSubmission, setAssignmentSubmission] = useState(null);
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [courseRes, progressRes, reviewsRes] = await Promise.all([
          api.get(`/course/${id}`),
          api.get(`/progress/${id}`),
          api.get(`/course/${id}/reviews`).catch(() => ({ success: false }))
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

        if (reviewsRes.success && reviewsRes.reviews) {
          setReviews(reviewsRes.reviews);
          const userId = user?._id || user?.id;
          const userRev = reviewsRes.reviews.find(r => r.user?._id === userId || r.user === userId);
          if (userRev) {
            setMyReview(userRev);
            setReviewForm({ rating: userRev.rating, review: userRev.review });
          }
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

  useEffect(() => {
    if (currentLecture) {
      setQuizMode(false);
      setQuiz(null);
      setQuizResults(null);
      setStudentAnswers([]);
      setQuizAttemptResults(null);
      setQuizLoaded(false);
      
      const fetchQuiz = async () => {
        try {
          console.log('[DEBUG] Fetching quiz for lecture:', currentLecture._id);
          const res = await api.get(`/quiz/${currentLecture._id}`);
          console.log('[DEBUG] /api/quiz response:', res);
          if (res.success && res.quiz) {
            console.log('[DEBUG] Setting quiz state to:', res.quiz);
            setQuiz(res.quiz);
            const res2 = await api.get(`/quiz/results/${res.quiz._id}`);
            console.log('[DEBUG] /api/quiz/results response:', res2);
            if (res2.success && res2.hasAttempted) {
              setQuizResults(res2);
            }
          }
        } catch (err) {
          console.error('[DEBUG] fetchQuiz Error:', err);
        } finally {
          setQuizLoaded(true);
        }
      };
      fetchQuiz();

      const fetchAssignment = async () => {
        setAssignment(null);
        setAssignmentSubmission(null);
        setAssignmentFile(null);
        try {
          const res = await api.get(`/assignment/${currentLecture._id}`);
          if (res.success && res.assignment) {
            setAssignment(res.assignment);
            if (res.submission) {
              setAssignmentSubmission(res.submission);
            }
          }
        } catch (err) {
          // No assignment
        }
      };
      fetchAssignment();
    }
  }, [currentLecture]);

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

  const handleQuizSubmit = async () => {
    // validate all questions answered
    if (studentAnswers.length !== quiz.questions.length || studentAnswers.includes(undefined)) {
      return alert('Please answer all questions before submitting.');
    }
    setSubmittingQuiz(true);
    try {
      const res = await api.post(`/quiz/${quiz._id}/submit`, { answers: studentAnswers });
      if (res.success) {
        setQuizAttemptResults(res);
        // refresh stats
        const res2 = await api.get(`/quiz/results/${quiz._id}`);
        if (res2.success && res2.hasAttempted) {
          setQuizResults(res2);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit quiz');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!assignmentFile) return alert('Please select a file to upload.');
    
    setSubmittingAssignment(true);
    const formData = new FormData();
    formData.append('file', assignmentFile);

    console.log('[Upload Frontend] Selected Filename:', assignmentFile.name);
    console.log('[Upload Frontend] FormData has file field:', formData.has('file'));

    try {
      const res = await api.post(`/assignment/${assignment._id}/submit`, formData);
      if (res.success) {
        setAssignmentSubmission(res.submission);
        setAssignmentFile(null);
        alert('Assignment submitted successfully!');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to submit assignment');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewError('');
    try {
      if (myReview) {
        const res = await api.put(`/course/${id}/review`, reviewForm);
        setMyReview(res.review);
        setReviews(reviews.map(r => r._id === res.review._id ? res.review : r));
      } else {
        const res = await api.post(`/course/${id}/review`, reviewForm);
        setMyReview(res.review);
        setReviews([res.review, ...reviews]);
      }
      const newCourseData = await api.get(`/course/${id}`);
      setCourse(newCourseData.course);
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await api.delete(`/course/${id}/review`);
      setMyReview(null);
      setReviewForm({ rating: 5, review: '' });
      setReviews(reviews.filter(r => r._id !== myReview._id));
      const newCourseData = await api.get(`/course/${id}`);
      setCourse(newCourseData.course);
    } catch (err) {
      alert('Failed to delete review');
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
          <button onClick={() => navigate(getDashboardPath(user?.role))} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '20px' }}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 style={{ fontSize: '18px', margin: 0 }}>{course.title}</h2>
        </div>
        
        {progress && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {progress.completed && (
              <button 
                onClick={() => window.open(`http://localhost:5000/api/certificate/${course._id}/download`, '_blank')}
                className="ripple-btn"
                style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <i className="ri-award-fill"></i> Certificate
              </button>
            )}
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

                {currentLecture.resources && currentLecture.resources.length > 0 && (
                  <div style={{ marginTop: '40px', padding: '20px', background: '#111', borderRadius: '8px', border: '1px solid #333' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="ri-folder-download-line" style={{ color: '#3b82f6' }}></i> Lecture Resources
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {currentLecture.resources.map((res, idx) => (
                        <a 
                          key={idx} 
                          href={res.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', background: '#1a1a1a', borderRadius: '6px', textDecoration: 'none', color: '#e5e5e5', border: '1px solid #222' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="ri-file-text-line" style={{ color: '#888' }}></i>
                            <span>{res.title}</span>
                          </div>
                          <i className="ri-download-2-line" style={{ color: '#3b82f6' }}></i>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {quizLoaded && !quiz && (
                  <div style={{ marginTop: '40px', padding: '30px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333', textAlign: 'center' }}>
                    <p style={{ color: '#aaa', margin: 0 }}>This lecture does not contain a quiz.</p>
                  </div>
                )}

                {console.log('[DEBUG] Render Quiz Check:', { quiz: !!quiz, quizMode, quizAttemptResults: !!quizAttemptResults })}
                {quiz && !quizMode && !quizAttemptResults && (
                  <div style={{ marginTop: '40px', padding: '30px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>Lecture Quiz</h3>
                    <p style={{ color: '#aaa', marginBottom: '20px' }}>Test your knowledge on this lecture's topics. {quiz.questions.length} questions.</p>
                    
                    {quizResults && (
                      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                        <div style={{ padding: '15px', background: '#222', borderRadius: '8px', flex: '1 1 150px' }}>
                          <p style={{ margin: '0 0 5px 0', color: '#888' }}>Attempts</p>
                          <h4 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>{quizResults.attempts || 1}</h4>
                        </div>
                        <div style={{ padding: '15px', background: '#222', borderRadius: '8px', flex: '1 1 150px' }}>
                          <p style={{ margin: '0 0 5px 0', color: '#888' }}>Latest Score</p>
                          <h4 style={{ margin: 0, fontSize: '20px', color: quizResults.latestPercentage >= 80 ? '#10b981' : '#ef4444' }}>
                            {quizResults.latestPercentage}%
                          </h4>
                        </div>
                        <div style={{ padding: '15px', background: '#222', borderRadius: '8px', flex: '1 1 150px' }}>
                          <p style={{ margin: '0 0 5px 0', color: '#888' }}>Your Best Score</p>
                          <h4 style={{ margin: 0, fontSize: '20px', color: quizResults.bestPercentage >= 80 ? '#10b981' : '#f59e0b' }}>
                            {quizResults.bestScore} / {quiz.questions.length} ({quizResults.bestPercentage}%)
                          </h4>
                        </div>
                      </div>
                    )}
                    <br />
                    <button 
                      onClick={() => { setQuizMode(true); setStudentAnswers(new Array(quiz.questions.length).fill(undefined)); }}
                      className="ripple-btn"
                      style={{ padding: '12px 30px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold' }}
                    >
                      {quizResults ? 'Retake Quiz' : 'Take Quiz'}
                    </button>
                  </div>
                )}

                {(quizMode || quizAttemptResults) && quiz && (
                  <div style={{ marginTop: '40px', padding: '30px', background: '#111', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                      <h3 style={{ fontSize: '24px', margin: 0 }}>Quiz Results & Review</h3>
                      {quizAttemptResults && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ padding: '10px 20px', background: quizAttemptResults.isPassed ? '#10b98120' : '#ef444420', color: quizAttemptResults.isPassed ? '#10b981' : '#ef4444', borderRadius: '8px', fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className={quizAttemptResults.isPassed ? "ri-checkbox-circle-fill" : "ri-close-circle-fill"}></i>
                            {quizAttemptResults.isPassed ? 'PASSED' : 'FAILED'}
                          </div>
                          <div style={{ padding: '10px 20px', background: '#222', color: '#fff', borderRadius: '8px', fontWeight: 'bold', fontSize: '18px' }}>
                            Score: {quizAttemptResults.score} / {quizAttemptResults.totalQuestions} ({quizAttemptResults.percentage}%)
                          </div>
                          <div style={{ padding: '10px 15px', background: '#10b98120', color: '#10b981', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                            {quizAttemptResults.score} Correct
                          </div>
                          <div style={{ padding: '10px 15px', background: '#ef444420', color: '#ef4444', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                            {quizAttemptResults.totalQuestions - quizAttemptResults.score} Incorrect
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                      {quiz.questions.map((q, idx) => {
                        const isSubmitted = !!quizAttemptResults;
                        const resultData = isSubmitted ? quizAttemptResults.results[idx] : null;
                        const studentAns = studentAnswers[idx];

                        return (
                          <div key={idx} style={{ padding: '20px', background: '#1a1a1a', borderRadius: '8px', border: `1px solid ${isSubmitted ? (resultData.isCorrect ? '#10b98150' : '#ef444450') : '#333'}` }}>
                            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#fff' }}>{idx + 1}. {q.questionText}</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {q.options.map((opt, oIdx) => {
                                let bg = '#222';
                                let border = '1px solid #444';
                                
                                if (isSubmitted) {
                                  if (resultData.correctAnswer === oIdx) {
                                    bg = '#10b98120'; border = '1px solid #10b981';
                                  } else if (studentAns === oIdx && !resultData.isCorrect) {
                                    bg = '#ef444420'; border = '1px solid #ef4444';
                                  }
                                } else if (studentAns === oIdx) {
                                  bg = '#3b82f630'; border = '1px solid #3b82f6';
                                }

                                return (
                                  <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: bg, border, borderRadius: '6px', cursor: isSubmitted ? 'default' : 'pointer', transition: 'all 0.2s' }}>
                                    <input 
                                      type="radio" 
                                      name={`q-${idx}`}
                                      checked={studentAns === oIdx}
                                      onChange={() => {
                                        if (!isSubmitted) {
                                          const newAns = [...studentAnswers];
                                          newAns[idx] = oIdx;
                                          setStudentAnswers(newAns);
                                        }
                                      }}
                                      disabled={isSubmitted}
                                    />
                                    <span style={{ color: '#ccc' }}>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                            
                            {isSubmitted && resultData.explanation && (
                              <div style={{ marginTop: '15px', padding: '15px', background: '#222', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
                                <strong style={{ color: '#fff', fontSize: '14px' }}>Explanation:</strong>
                                <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '14px', lineHeight: '1.5' }}>{resultData.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {!quizAttemptResults ? (
                      <div style={{ marginTop: '30px', textAlign: 'right' }}>
                        <button 
                          onClick={handleQuizSubmit} 
                          disabled={submittingQuiz}
                          className="ripple-btn"
                          style={{ padding: '12px 30px', background: '#10b981', color: '#000', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold' }}
                        >
                          {submittingQuiz ? 'Submitting...' : 'Submit Quiz'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginTop: '30px', textAlign: 'right' }}>
                        <button 
                          onClick={() => {
                            setQuizAttemptResults(null);
                            setQuizMode(false);
                          }} 
                          className="ripple-btn"
                          style={{ padding: '12px 30px', background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold' }}
                        >
                          Close Quiz
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {assignment && (
                  <div style={{ marginTop: '40px', padding: '30px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ fontSize: '24px', margin: 0 }}>Assignment: {assignment.title}</h3>
                      <span style={{ padding: '4px 12px', background: '#eab30820', color: '#eab308', borderRadius: '4px', fontWeight: 'bold' }}>Max Marks: {assignment.maxMarks}</span>
                    </div>
                    
                    <p style={{ color: '#ccc', lineHeight: '1.6', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
                      {assignment.description}
                    </p>

                    <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                      <div style={{ color: '#888', fontSize: '14px' }}>
                        <i className="ri-calendar-event-line"></i> Due: <strong style={{ color: '#fff' }}>{new Date(assignment.dueDate).toLocaleDateString()}</strong>
                      </div>
                      {assignment.attachmentUrl && (
                        <a href={assignment.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <i className="ri-attachment-line"></i> View Attachment
                        </a>
                      )}
                    </div>

                    <div style={{ background: '#111', padding: '20px', borderRadius: '8px', border: '1px solid #222' }}>
                      <h4 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Your Submission</h4>
                      
                      {assignmentSubmission ? (
                        <div>
                          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                            <div style={{ flex: 1, padding: '15px', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #333' }}>
                              <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Status</p>
                              <span style={{ fontWeight: 'bold', color: assignmentSubmission.status === 'Reviewed' ? '#10b981' : '#f59e0b' }}>
                                {assignmentSubmission.status}
                              </span>
                            </div>
                            <div style={{ flex: 1, padding: '15px', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #333' }}>
                              <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Marks</p>
                              <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '16px' }}>
                                {assignmentSubmission.marks !== undefined ? `${assignmentSubmission.marks} / ${assignment.maxMarks}` : 'Pending Grading'}
                              </span>
                            </div>
                            <div style={{ flex: 1, padding: '15px', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #333' }}>
                              <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Submitted File</p>
                              <a href={`http://localhost:5000${assignmentSubmission.submissionUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '200px' }}>
                                {assignmentSubmission.originalFilename || 'Download'}
                              </a>
                            </div>
                          </div>
                          
                          {assignmentSubmission.feedback && (
                            <div style={{ padding: '15px', background: '#1a1a1a', borderRadius: '6px', borderLeft: '4px solid #3b82f6', marginBottom: '20px' }}>
                              <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Instructor Feedback</p>
                              <p style={{ margin: 0, color: '#e5e5e5' }}>{assignmentSubmission.feedback}</p>
                            </div>
                          )}

                          {assignmentSubmission.status === 'Pending' && (
                            <div style={{ marginTop: '20px', borderTop: '1px dashed #333', paddingTop: '20px' }}>
                              <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '10px' }}>Need to update your submission?</p>
                              <form onSubmit={handleAssignmentSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input 
                                  type="file" 
                                  accept=".pdf,.zip"
                                  onChange={(e) => setAssignmentFile(e.target.files[0])}
                                  style={{ background: '#000', color: '#fff', border: '1px solid #333', padding: '8px', borderRadius: '4px', flex: 1 }}
                                />
                                <button 
                                  type="submit" 
                                  disabled={submittingAssignment || !assignmentFile}
                                  className="ripple-btn"
                                  style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', opacity: submittingAssignment || !assignmentFile ? 0.5 : 1 }}
                                >
                                  {submittingAssignment ? 'Uploading...' : 'Resubmit'}
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      ) : (
                        <form onSubmit={handleAssignmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>Upload your completed assignment file (.pdf or .zip). Max 10MB.</p>
                          <input 
                            type="file" 
                            accept=".pdf,.zip"
                            required
                            onChange={(e) => setAssignmentFile(e.target.files[0])}
                            style={{ background: '#000', color: '#fff', border: '1px dashed #444', padding: '20px', borderRadius: '6px', width: '100%' }}
                          />
                          <div>
                            <button 
                              type="submit" 
                              disabled={submittingAssignment || !assignmentFile}
                              className="ripple-btn"
                              style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', opacity: submittingAssignment || !assignmentFile ? 0.5 : 1 }}
                            >
                              {submittingAssignment ? 'Uploading...' : 'Submit Assignment'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '50px', padding: '30px', background: '#111', borderRadius: '8px', border: '1px solid #333' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '20px', margin: 0 }}>Course Reviews</h3>
                    <div style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 'bold' }}>
                      ★ {course.rating || 0} <span style={{ color: '#888', fontSize: '14px', fontWeight: 'normal' }}>({course.totalReviews || 0} reviews)</span>
                    </div>
                  </div>

                  <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #333' }}>
                    <h4 style={{ margin: '0 0 15px 0' }}>{myReview ? 'Edit Your Review' : 'Write a Review'}</h4>
                    <form onSubmit={handleReviewSubmit}>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '14px' }}>Rating</label>
                        <select 
                          value={reviewForm.rating} 
                          onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                          style={{ width: '100px', padding: '8px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
                        >
                          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                        </select>
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '14px' }}>Review</label>
                        <textarea 
                          value={reviewForm.review} 
                          onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                          required
                          rows="3"
                          placeholder="Tell others what you think about this course..."
                          style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '4px', resize: 'vertical' }}
                        ></textarea>
                      </div>
                      {reviewError && <p style={{ color: '#ff3b3b', fontSize: '14px', marginBottom: '15px' }}>{reviewError}</p>}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" disabled={submittingReview} style={{ padding: '8px 16px', background: '#10b981', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                          {submittingReview ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
                        </button>
                        {myReview && (
                          <button type="button" onClick={handleDeleteReview} style={{ padding: '8px 16px', background: '#ff3b3b20', color: '#ff3b3b', border: '1px solid #ff3b3b50', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Delete
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {reviews.length === 0 ? (
                    <p style={{ color: '#888' }}>No reviews yet. Be the first to review!</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {reviews.map(rev => (
                        <div key={rev._id} style={{ background: '#0a0a0a', padding: '15px', borderRadius: '6px', border: '1px solid #222' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ fontWeight: '500', color: '#fff', fontSize: '15px' }}>{rev.user?.name || 'Anonymous User'}</div>
                            <div style={{ color: '#f59e0b', fontSize: '12px' }}>
                              {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                            </div>
                          </div>
                          <p style={{ color: '#bbb', margin: 0, lineHeight: '1.5', fontSize: '14px' }}>{rev.review}</p>
                          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '40px 0' }} />

                <div style={{ padding: '0 0 50px 0' }}>
                  <h3 style={{ fontSize: '24px', marginBottom: '20px' }}>Discussion Forum</h3>
                  <p style={{ color: '#888', marginBottom: '30px' }}>Ask questions, share insights, and get help from instructors and peers.</p>
                  <DiscussionForum courseId={course._id} lectureId={currentLecture._id} />
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

      {/* AI Tutor FAB & Component */}
      {!showAITutor && (
        <button 
          onClick={() => setShowAITutor(true)}
          style={{
            position: 'fixed', bottom: '30px', right: '30px', zIndex: 900,
            width: '60px', height: '60px', borderRadius: '30px',
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            color: 'white', border: 'none', cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', transition: 'transform 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Open AI Tutor"
        >
          <i className="ri-sparkling-fill" />
        </button>
      )}

      {showAITutor && (
        <AITutor 
          courseId={course._id} 
          lectureId={currentLecture?._id} 
          onClose={() => setShowAITutor(false)} 
        />
      )}
    </div>
  );
}
