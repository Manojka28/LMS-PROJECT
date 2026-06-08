import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import ReactMarkdown from 'react-markdown';

export default function AITutor({ courseId, lectureId, initialQuery, onClose }) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'notes', 'quizzes'

  // Chat State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Notes State
  const [savedNotes, setSavedNotes] = useState([]);
  const [isFetchingNotes, setIsFetchingNotes] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [activeNote, setActiveNote] = useState(null);

  // Quiz State
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [isFetchingQuizzes, setIsFetchingQuizzes] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    fetchHistory().then(() => {
      if (initialQuery) {
        sendMessage(initialQuery);
      }
    });
  }, [courseId, initialQuery]);

  useEffect(() => {
    if (activeTab === 'notes') fetchNotes();
    if (activeTab === 'quizzes') {
      fetchQuizzes();
      fetchQuizAttempts();
    }
  }, [activeTab, courseId]);

  useEffect(() => {
    if (activeTab === 'chat') scrollToBottom();
  }, [messages, isTyping, activeTab]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- CHAT LOGIC ---
  const fetchHistory = async () => {
    try {
      const res = await api.get(`/ai/history/${courseId}`);
      if (res.success && res.messages) setMessages(res.messages);
    } catch (err) {
      console.error('[DEBUG] Failed to load chat history', err);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear chat history?')) return;
    try {
      await api.delete(`/ai/history/${courseId}`);
      setMessages([]);
    } catch (err) {
      alert('Failed to clear history');
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const newMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/ai/chat', { courseId, lectureId, message: text });
      if (res.success) {
        const contentStr = typeof res.message === 'string' ? res.message : JSON.stringify(res.message);
        setMessages(prev => [...prev, { role: 'model', content: contentStr }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: `**Error:** ${res.message || 'Unknown error'}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: '**Error:** Failed to connect to AI Tutor.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- NOTES LOGIC ---
  const fetchNotes = async () => {
    setIsFetchingNotes(true);
    try {
      const res = await api.get(`/ai/notes/${courseId}`);
      if (res.success) setSavedNotes(res.notes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingNotes(false);
    }
  };

  const handleGenerateNotes = async () => {
    setIsGeneratingNotes(true);
    setActiveNote(null);
    try {
      const res = await api.post('/ai/notes', { courseId, lectureId });
      if (res.success) {
        const notesStr = typeof res.notes === 'string' ? res.notes : JSON.stringify(res.notes, null, 2);
        const saveRes = await api.post('/ai/notes/save', { courseId, lectureId, content: notesStr });
        if (saveRes.success) {
          setSavedNotes(prev => [saveRes.note, ...prev]);
          setActiveNote(saveRes.note);
        }
      }
    } catch (err) {
      alert('Failed to generate notes');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.delete(`/ai/notes/${id}`);
      setSavedNotes(prev => prev.filter(n => n._id !== id));
      if (activeNote?._id === id) setActiveNote(null);
    } catch (err) {
      alert('Failed to delete note');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const downloadPdf = (id) => {
    const API_BASE = import.meta.env.VITE_API_URL || '/api';
    window.open(`${API_BASE}/ai/notes/${id}/pdf`, '_blank');
  };

  // --- QUIZ LOGIC ---
  const fetchQuizzes = async () => {
    setIsFetchingQuizzes(true);
    try {
      const res = await api.get(`/ai/quiz/${courseId}`);
      if (res.success) setSavedQuizzes(res.quizzes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingQuizzes(false);
    }
  };

  const fetchQuizAttempts = async () => {
    try {
      const res = await api.get(`/ai/quiz/attempts/${courseId}`);
      if (res.success) setQuizAttempts(res.attempts || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true);
    setActiveQuiz(null);
    setQuizAnswers({});
    setQuizResult(null);
    try {
      const res = await api.post('/ai/quiz', { courseId, lectureId });
      if (res.success) {
        let quizData = res.quiz;
        if (!Array.isArray(quizData)) {
          if (quizData && Array.isArray(quizData.quiz)) quizData = quizData.quiz;
          else if (quizData && Array.isArray(quizData.questions)) quizData = quizData.questions;
          else quizData = Object.values(quizData || {});
        }
        const questions = Array.isArray(quizData) ? quizData : [];
        
        const saveRes = await api.post('/ai/quiz/save', { courseId, lectureId, questions });
        if (saveRes.success) {
          setSavedQuizzes(prev => [saveRes.quiz, ...prev]);
          setActiveQuiz(saveRes.quiz);
        }
      }
    } catch (err) {
      alert('Failed to generate quiz');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    let score = 0;
    const answersArray = [];
    activeQuiz.questions.forEach((q, i) => {
      const selected = quizAnswers[i];
      answersArray.push(selected !== undefined ? selected : -1);
      if (selected === q.correctAnswer) score += 1;
    });

    const totalQuestions = activeQuiz.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    setQuizResult({ score, totalQuestions, percentage });

    try {
      const res = await api.post('/ai/quiz/attempt', {
        quizId: activeQuiz._id,
        courseId,
        answers: answersArray,
        score,
        totalQuestions,
        percentage
      });
      if (res.success) {
        setQuizAttempts(prev => [res.attempt, ...prev]);
      }
    } catch (err) {
      console.error('Failed to save attempt', err);
    }
  };

  return (
    <div className="ai-tutor-drawer">
      <div className="ai-header">
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <div className="ai-sparkle"><i className="ri-sparkling-fill" /></div>
          <h3 style={{margin: 0, fontSize: 16}}>AI Tutor</h3>
        </div>
        <button onClick={onClose} className="ai-close-btn"><i className="ri-close-line" /></button>
      </div>

      <div className="ai-tabs">
        <button className={`ai-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>Chat</button>
        <button className={`ai-tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Notes</button>
        <button className={`ai-tab ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>Quizzes</button>
      </div>

      <div className="ai-content-wrapper">
        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="ai-tab-content chat-tab">
            <div className="ai-quick-actions">
              <button onClick={() => sendMessage("Can you explain this simply?")}>Explain Simply</button>
              <button onClick={() => sendMessage("Give me a real-world example.")}>Give Example</button>
              <button onClick={handleClearHistory} style={{color: '#ff6b6b', borderColor: '#ff6b6b'}}>Clear History</button>
            </div>
            
            <div className="ai-chat-history">
              {messages.length === 0 && (
                <div className="ai-empty-state">
                  <i className="ri-robot-2-line" />
                  <p>Hi! I'm your AI Tutor. Ask me anything about this course!</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`ai-message ${m.role}`}>
                  <div className="ai-avatar">
                    {m.role === 'model' ? <i className="ri-robot-2-fill" /> : <i className="ri-user-fill" />}
                  </div>
                  <div className="ai-bubble">
                    <ReactMarkdown>{m?.content || ''}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="ai-message model">
                  <div className="ai-avatar"><i className="ri-robot-2-fill" /></div>
                  <div className="ai-bubble typing">
                    <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="ai-input-area">
              <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} style={{display: 'flex', gap: 10}}>
                <input 
                  type="text" 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={isTyping}
                />
                <button type="submit" disabled={isTyping || !input.trim()} className="ai-send-btn">
                  <i className="ri-send-plane-fill" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <div className="ai-tab-content notes-tab">
            <div className="ai-action-bar">
              <button onClick={handleGenerateNotes} disabled={isGeneratingNotes} className="ai-primary-btn">
                <i className="ri-magic-line" /> {isGeneratingNotes ? 'Generating...' : 'Generate New Notes'}
              </button>
            </div>
            
            {activeNote ? (
              <div className="ai-detail-view">
                <div className="ai-detail-header">
                  <button onClick={() => setActiveNote(null)} className="ai-back-btn"><i className="ri-arrow-left-line" /> Back</button>
                  <div className="ai-detail-actions">
                    <button onClick={() => copyToClipboard(activeNote.content)} title="Copy"><i className="ri-clipboard-line" /></button>
                    <button onClick={() => downloadPdf(activeNote._id)} title="Download PDF"><i className="ri-file-pdf-line" /></button>
                    <button onClick={() => handleDeleteNote(activeNote._id)} title="Delete" style={{color: '#ff6b6b'}}><i className="ri-delete-bin-line" /></button>
                  </div>
                </div>
                <div className="ai-generated-panel markdown-body">
                  <ReactMarkdown>{activeNote.content}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="ai-list-view">
                {isFetchingNotes ? (
                  <div className="ai-skeleton-list">
                    <div className="skeleton"></div>
                    <div className="skeleton"></div>
                    <div className="skeleton"></div>
                  </div>
                ) : savedNotes.length === 0 ? (
                  <div className="ai-empty-state">
                    <i className="ri-file-list-3-line" />
                    <p>No notes saved yet. Generate your first lecture notes!</p>
                  </div>
                ) : (
                  savedNotes.map(note => (
                    <div key={note._id} className="ai-card" onClick={() => setActiveNote(note)}>
                      <div className="ai-card-icon"><i className="ri-file-text-line" /></div>
                      <div className="ai-card-info">
                        <h4>Note - {new Date(note.createdAt).toLocaleDateString()}</h4>
                        <p>{new Date(note.createdAt).toLocaleTimeString()}</p>
                      </div>
                      <button className="ai-card-del" onClick={(e) => { e.stopPropagation(); handleDeleteNote(note._id); }} title="Delete Note"><i className="ri-close-line"/></button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* QUIZZES TAB */}
        {activeTab === 'quizzes' && (
          <div className="ai-tab-content quizzes-tab">
            <div className="ai-action-bar">
              <button onClick={handleGenerateQuiz} disabled={isGeneratingQuiz} className="ai-primary-btn">
                <i className="ri-magic-line" /> {isGeneratingQuiz ? 'Generating...' : 'Generate New Quiz'}
              </button>
            </div>
            
            {activeQuiz ? (
              <div className="ai-detail-view">
                <div className="ai-detail-header">
                  <button onClick={() => setActiveQuiz(null)} className="ai-back-btn"><i className="ri-arrow-left-line" /> Back</button>
                  {quizResult && <span className={`ai-badge ${quizResult.percentage >= 70 ? 'success' : 'danger'}`}>Score: {quizResult.percentage}%</span>}
                </div>
                <div className="ai-quiz-panel">
                  {activeQuiz.questions.map((q, i) => (
                    <div key={i} className="ai-quiz-q">
                      <p><strong>{i+1}. {q.question}</strong></p>
                      <div className="ai-quiz-options">
                        {q.options.map((opt, j) => {
                          let optClass = '';
                          if (quizResult) {
                            if (j === q.correctAnswer) optClass = 'correct';
                            else if (quizAnswers[i] === j) optClass = 'wrong';
                          } else if (quizAnswers[i] === j) {
                            optClass = 'selected';
                          }
                          
                          return (
                            <div 
                              key={j} 
                              className={`ai-quiz-opt ${optClass}`}
                              onClick={() => !quizResult && setQuizAnswers(prev => ({...prev, [i]: j}))}
                            >
                              {opt}
                              {quizResult && j === q.correctAnswer && <i className="ri-check-line float-right"/>}
                              {quizResult && quizAnswers[i] === j && j !== q.correctAnswer && <i className="ri-close-line float-right"/>}
                            </div>
                          );
                        })}
                      </div>
                      {quizResult && q.explanation && (
                        <div className="ai-quiz-exp">
                          <i>Explanation: {q.explanation}</i>
                        </div>
                      )}
                    </div>
                  ))}
                  {!quizResult && (
                    <button className="ai-primary-btn" onClick={submitQuiz} style={{width: '100%', marginTop: 20}}>
                      Submit Answers
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="ai-list-view">
                {isFetchingQuizzes ? (
                  <div className="ai-skeleton-list">
                    <div className="skeleton"></div>
                    <div className="skeleton"></div>
                  </div>
                ) : savedQuizzes.length === 0 ? (
                  <div className="ai-empty-state">
                    <i className="ri-questionnaire-line" />
                    <p>No quizzes saved yet. Generate one to test your knowledge!</p>
                  </div>
                ) : (
                  savedQuizzes.map(quiz => {
                    // Find highest attempt for this quiz
                    const attemptsForQuiz = quizAttempts.filter(a => a.quizId?._id === quiz._id || a.quizId === quiz._id);
                    const bestAttempt = attemptsForQuiz.sort((a,b) => b.percentage - a.percentage)[0];
                    
                    return (
                      <div key={quiz._id} className="ai-card" onClick={() => { setActiveQuiz(quiz); setQuizResult(null); setQuizAnswers({}); }}>
                        <div className="ai-card-icon"><i className="ri-question-answer-line" /></div>
                        <div className="ai-card-info">
                          <h4>Quiz - {new Date(quiz.createdAt).toLocaleDateString()}</h4>
                          {bestAttempt ? (
                            <p className={bestAttempt.percentage >= 70 ? 'text-green' : 'text-red'}>Best Score: {bestAttempt.percentage}%</p>
                          ) : (
                            <p className="text-muted">Not attempted yet</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
