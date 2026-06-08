import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

export default function InterviewCenter() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(location.state?.session || null);
  const [currentQuestion, setCurrentQuestion] = useState(location.state?.question || null);
  
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  
  const [report, setReport] = useState(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await api.get(`/placement/interview/session/${sessionId}`);
        setSession(res.session);
        
        if (res.session.status === 'Completed') {
          const reportRes = await api.get(`/placement/report/${sessionId}`);
          setReport(reportRes.report);
          return;
        }

        const answered = res.questions.filter(q => q.answeredAt);
        const unanswered = res.questions.find(q => !q.answeredAt);
        
        const loadedHistory = answered.map(q => ({
          ...q,
          isCurrent: false,
          evaluation: { score: q.score, feedback: q.feedback, missedConcepts: q.missedConcepts }
        }));

        setHistory(loadedHistory);
        if (unanswered) {
          setCurrentQuestion(unanswered);
        } else if (answered.length > 0) {
           // If somehow all are answered but not completed
           handleEnd(true);
        }
      } catch (err) {
        console.error('Failed to load session');
      }
    };

    if (!session && sessionId) {
      loadSession();
    }
  }, [sessionId, session]);

  useEffect(() => {
    if (currentQuestion && !history.find(h => h._id === currentQuestion._id)) {
      setHistory(prev => [...prev, { ...currentQuestion, isCurrent: true }]);
    }
  }, [currentQuestion]);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/placement/interview/answer', {
        questionId: currentQuestion._id,
        studentAnswer: answer
      });
      
      // Update history with feedback
      setHistory(prev => prev.map(h => {
        if (h._id === currentQuestion._id) {
          return { ...h, studentAnswer: answer, evaluation: res.evaluation, isCurrent: false };
        }
        return h;
      }));
      
      setAnswer('');
      
      if (res.isComplete) {
        await handleEnd(true);
      } else {
        setCurrentQuestion(res.nextQuestion);
      }
      
    } catch (err) {
      alert('Error submitting answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnd = async (force = false) => {
    if (!force && !window.confirm("End interview and generate report?")) return;
    setSubmitting(true);
    try {
      const res = await api.post('/placement/interview/end', { sessionId });
      setReport(res.report);
      setSession(res.session);
    } catch (err) {
      alert('Error ending interview');
    } finally {
      setSubmitting(false);
    }
  };

  if (report) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '40px', background: '#111', borderRadius: '16px', color: '#fff' }}>
        <h1 style={{ fontSize: '32px', textAlign: 'center', marginBottom: '10px' }}>Interview Complete</h1>
        <div style={{ textAlign: 'center', fontSize: '48px', fontWeight: 'bold', color: session.overallScore >= 75 ? '#10b981' : '#ef4444', marginBottom: '40px' }}>
          {session.overallScore} <span style={{ fontSize: '20px', color: '#888' }}>/ 100</span>
          <div style={{ fontSize: '18px', color: '#ccc', marginTop: '10px' }}>Recommendation: {report.hiringRecommendation}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ color: '#10b981', margin: '0 0 10px 0' }}>Strengths</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#ccc' }}>
              {report.strengths.map((s,i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ color: '#ef4444', margin: '0 0 10px 0' }}>Weaknesses</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#ccc' }}>
              {report.weaknesses.map((w,i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>

        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
          <h3 style={{ color: '#3b82f6', margin: '0 0 10px 0' }}>Knowledge Gaps</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#ccc' }}>
            {report.knowledgeGaps.map((k,i) => <li key={i}>{k}</li>)}
          </ul>
        </div>
        
        <button onClick={() => navigate('/student/placement')} style={{ width: '100%', padding: '15px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#111', borderRadius: '12px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>{session?.interviewType} Interview</h2>
          <div style={{ color: '#888', fontSize: '14px' }}>Adaptive AI Engine • Difficulty: {currentQuestion?.difficulty}</div>
        </div>
        <button onClick={handleEnd} style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          End Interview
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: '#0b0b0b', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid #333' }}>
        {history.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '30px' }}>
            {/* Interviewer Question */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>AI</div>
              <div style={{ background: '#1a1a1a', padding: '15px 20px', borderRadius: '2px 16px 16px 16px', border: '1px solid #333', fontSize: '16px', lineHeight: '1.5' }}>
                {item.questionText}
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>Tags: {item.expectedConcepts?.join(', ')}</div>
              </div>
            </div>

            {/* Student Answer */}
            {item.studentAnswer && (
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginBottom: '15px' }}>
                <div style={{ background: '#10b98120', border: '1px solid #10b98150', padding: '15px 20px', borderRadius: '16px 2px 16px 16px', fontSize: '16px', lineHeight: '1.5', maxWidth: '80%' }}>
                  {item.studentAnswer}
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000', flexShrink: 0 }}>ME</div>
              </div>
            )}

            {/* AI Feedback */}
            {item.evaluation && (
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', opacity: 0.8 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>SYS</div>
                <div style={{ background: '#111', padding: '10px 15px', borderRadius: '8px', border: '1px dashed #555', fontSize: '14px', width: '100%' }}>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '5px' }}>
                    <span style={{ color: item.evaluation.score >= 70 ? '#10b981' : '#ef4444' }}>Score: {item.evaluation.score}/100</span>
                  </div>
                  <div style={{ color: '#aaa' }}>{item.evaluation.feedback}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: '#111', padding: '20px', borderRadius: '12px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Type your answer here... (Speak your thought process, approach, and code)"
          style={{ flex: 1, height: '120px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '15px', color: '#fff', fontSize: '16px', resize: 'none', fontFamily: 'monospace' }}
        />
        <button 
          onClick={handleSubmit} 
          disabled={submitting || !answer.trim()}
          style={{ height: '120px', padding: '0 30px', background: submitting ? '#3b82f650' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer' }}
        >
          {submitting ? 'Evaluating...' : 'Submit Answer'}
        </button>
      </div>

    </div>
  );
}
