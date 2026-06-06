import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import ReactMarkdown from 'react-markdown';

export default function AITutor({ courseId, lectureId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  
  const [generatedNotes, setGeneratedNotes] = useState(null);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, [courseId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/ai/history/${courseId}`);
      if (res.success && res.messages) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    const newMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/ai/chat', {
        courseId,
        lectureId,
        message: text
      });
      
      if (res.success) {
        setMessages(prev => [...prev, { role: 'model', content: res.message }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: '**Error:** Failed to connect to AI Tutor.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateNotes = async () => {
    setIsGeneratingNotes(true);
    setGeneratedNotes(null);
    try {
      const res = await api.post('/ai/notes', { courseId, lectureId });
      if (res.success) {
        setGeneratedNotes(res.notes);
      }
    } catch (err) {
      alert('Failed to generate notes');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true);
    setGeneratedQuiz(null);
    try {
      const res = await api.post('/ai/quiz', { courseId, lectureId });
      if (res.success) {
        setGeneratedQuiz(res.quiz);
      }
    } catch (err) {
      alert('Failed to generate quiz');
    } finally {
      setIsGeneratingQuiz(false);
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

      <div className="ai-quick-actions">
        <button onClick={() => sendMessage("Can you explain this simply?")}>Explain Simply</button>
        <button onClick={() => sendMessage("Give me a real-world example of this concept.")}>Give Example</button>
        <button onClick={handleGenerateNotes} disabled={isGeneratingNotes}>
          {isGeneratingNotes ? 'Generating...' : 'Generate Notes'}
        </button>
        <button onClick={handleGenerateQuiz} disabled={isGeneratingQuiz}>
          {isGeneratingQuiz ? 'Generating...' : 'Generate Quiz'}
        </button>
      </div>

      <div className="ai-content-area">
        {generatedNotes && (
          <div className="ai-generated-panel">
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 15}}>
              <h4 style={{margin: 0, color: '#10b981'}}><i className="ri-file-list-3-fill"/> Lecture Notes</h4>
              <button onClick={() => setGeneratedNotes(null)} style={{background: 'none', border: 'none', color: '#888', cursor: 'pointer'}}>Close</button>
            </div>
            <div className="markdown-body">
              <ReactMarkdown>{generatedNotes}</ReactMarkdown>
            </div>
          </div>
        )}

        {generatedQuiz && (
          <div className="ai-generated-panel">
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 15}}>
              <h4 style={{margin: 0, color: '#8b5cf6'}}><i className="ri-question-answer-fill"/> Knowledge Check</h4>
              <button onClick={() => setGeneratedQuiz(null)} style={{background: 'none', border: 'none', color: '#888', cursor: 'pointer'}}>Close</button>
            </div>
            {generatedQuiz.map((q, i) => (
              <div key={i} style={{marginBottom: 20}}>
                <p style={{fontWeight: 600, marginBottom: 10}}>{i+1}. {q.question}</p>
                {q.options.map((opt, j) => (
                  <div key={j} style={{padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 6, marginBottom: 5, fontSize: 13}}>
                    {opt}
                    {j === q.correctAnswer && <span style={{color: '#10b981', float: 'right'}}><i className="ri-check-line"/> Correct</span>}
                  </div>
                ))}
                <p style={{fontSize: 12, color: '#888', marginTop: 8}}><i>Explanation: {q.explanation}</i></p>
              </div>
            ))}
          </div>
        )}

        <div className="ai-chat-history">
          {messages.length === 0 && (
            <div style={{textAlign: 'center', color: '#666', marginTop: 40}}>
              <i className="ri-robot-2-line" style={{fontSize: 40, marginBottom: 10, display: 'block'}} />
              <p>Hi! I'm your AI Tutor. Ask me anything about this course!</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`ai-message ${m.role}`}>
              <div className="ai-avatar">
                {m.role === 'model' ? <i className="ri-robot-2-fill" /> : <i className="ri-user-fill" />}
              </div>
              <div className="ai-bubble">
                <ReactMarkdown>{m.content}</ReactMarkdown>
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
  );
}
