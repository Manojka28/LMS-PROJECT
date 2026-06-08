import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function QuizManagementModal({ course, onClose }) {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  
  const [activeLecture, setActiveLecture] = useState(null); // The lecture currently selected for quiz editing
  const [quiz, setQuiz] = useState(null); // the existing quiz or null
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, []);

  const fetchCourseDetails = async () => {
    try {
      const res = await api.get(`/course/${course._id}`);
      if (res.success) {
        setSections(res.course.sections);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleManageQuiz = async (lecture) => {
    setActiveLecture(lecture);
    setLoading(true);
    try {
      const res = await api.get(`/quiz/${lecture._id}`);
      if (res.success && res.quiz) {
        setQuiz(res.quiz);
        setQuestions(res.quiz.questions);
      } else {
        setQuiz(null);
        setQuestions([]);
      }
    } catch (err) {
      if (err.status === 404) {
        // No quiz exists
        setQuiz(null);
        setQuestions([]);
      } else {
        console.error(err);
        alert('Failed to load quiz');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }
    ]);
  };

  const handleQuestionChange = (idx, field, value) => {
    const updated = [...questions];
    if (field === 'option') {
      updated[idx].options[value.optIdx] = value.text;
    } else {
      updated[idx][field] = value;
    }
    setQuestions(updated);
  };

  const handleRemoveQuestion = (idx) => {
    const updated = [...questions];
    updated.splice(idx, 1);
    setQuestions(updated);
  };

  const handleSaveQuiz = async () => {
    if (questions.length === 0) {
      return alert('Add at least one question.');
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText) return alert(`Question ${i + 1} text is required.`);
      if (q.options.some(opt => !opt)) return alert(`All options for question ${i + 1} are required.`);
    }

    try {
      setSaving(true);
      if (quiz) {
        // update
        await api.put(`/quiz/${quiz._id}`, { questions });
        alert('Quiz updated successfully!');
      } else {
        // create
        const res = await api.post('/quiz', { courseId: course._id, lectureId: activeLecture._id, questions });
        setQuiz(res.quiz);
        alert('Quiz created successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quiz) return;
    if (!window.confirm('Are you sure you want to delete this quiz completely?')) return;
    setSaving(true);
    try {
      await api.delete(`/quiz/${quiz._id}`);
      setQuiz(null);
      setQuestions([]);
      alert('Quiz deleted successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to delete quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#111', padding: '30px', borderRadius: '12px', border: '1px solid #333', width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Quiz Management: {course.title}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '24px' }}>
            <i className="ri-close-line" />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', flex: 1, minHeight: 0 }}>
            {/* Left: Lectures List */}
            <div style={{ flex: '1 1 250px', background: '#1a1a1a', borderRadius: '8px', padding: '15px', overflowY: 'auto', border: '1px solid #333' }}>
              <h3 style={{ marginTop: 0, fontSize: '16px' }}>Select Lecture</h3>
              {sections.map((sec, sIdx) => (
                <div key={sec._id} style={{ marginBottom: '15px' }}>
                  <div style={{ fontWeight: 'bold', color: '#aaa', marginBottom: '8px', fontSize: '14px' }}>Section {sIdx + 1}: {sec.title}</div>
                  {sec.lectures.map((lec, lIdx) => (
                    <div 
                      key={lec._id} 
                      onClick={() => handleManageQuiz(lec)}
                      style={{
                        padding: '10px', 
                        background: activeLecture?._id === lec._id ? '#3b82f630' : '#222',
                        color: activeLecture?._id === lec._id ? '#3b82f6' : '#fff',
                        border: `1px solid ${activeLecture?._id === lec._id ? '#3b82f650' : '#333'}`,
                        borderRadius: '6px',
                        marginBottom: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {lIdx + 1}. {lec.title}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Right: Quiz Editor */}
            <div style={{ flex: 1, background: '#1a1a1a', borderRadius: '8px', padding: '20px', overflowY: 'auto', border: '1px solid #333' }}>
              {!activeLecture ? (
                <div style={{ textAlign: 'center', color: '#888', marginTop: '100px' }}>Select a lecture from the left to manage its quiz</div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>{quiz ? 'Edit Quiz' : 'Create Quiz'} for: {activeLecture.title}</h3>
                    {quiz && (
                      <button onClick={handleDeleteQuiz} disabled={saving} style={{ padding: '6px 12px', background: '#ef444430', color: '#ef4444', border: '1px solid #ef444450', borderRadius: '4px', cursor: 'pointer' }}>
                        Delete Quiz
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {questions.map((q, idx) => (
                      <div key={idx} style={{ background: '#222', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <strong style={{ color: '#fff' }}>Question {idx + 1}</strong>
                          <button onClick={() => handleRemoveQuestion(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><i className="ri-delete-bin-line"></i></button>
                        </div>
                        <input 
                          value={q.questionText} 
                          onChange={(e) => handleQuestionChange(idx, 'questionText', e.target.value)}
                          placeholder="Enter question..."
                          style={{ width: '100%', padding: '10px', background: '#000', color: '#fff', border: '1px solid #444', borderRadius: '4px', marginBottom: '15px' }}
                        />
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input 
                                type="radio" 
                                name={`correct-${idx}`} 
                                checked={q.correctAnswer === oIdx} 
                                onChange={() => handleQuestionChange(idx, 'correctAnswer', oIdx)}
                              />
                              <input 
                                value={opt} 
                                onChange={(e) => handleQuestionChange(idx, 'option', { optIdx: oIdx, text: e.target.value })}
                                placeholder={`Option ${oIdx + 1}`}
                                style={{ flex: 1, padding: '8px', background: '#000', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                              />
                            </div>
                          ))}
                        </div>

                        <input 
                          value={q.explanation} 
                          onChange={(e) => handleQuestionChange(idx, 'explanation', e.target.value)}
                          placeholder="Explanation (Optional)..."
                          style={{ width: '100%', padding: '10px', background: '#000', color: '#aaa', border: '1px solid #444', borderRadius: '4px' }}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                    <button onClick={handleAddQuestion} style={{ flex: 1, padding: '12px', background: '#3b82f630', color: '#3b82f6', border: '1px solid #3b82f650', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                      + Add Question
                    </button>
                    <button onClick={handleSaveQuiz} disabled={saving} style={{ flex: 1, padding: '12px', background: '#10b981', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                      {saving ? 'Saving...' : 'Save Quiz'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
