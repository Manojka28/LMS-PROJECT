import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function AICoachPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState(null);
  const [error, setError] = useState(null);

  const fetchReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/roadmap/coach-review');
      if (res.success && res.review) {
        setReview(res.review);
      } else {
        setError('Failed to fetch AI Coach review.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while connecting to the AI Coach.');
    } finally {
      setLoading(false);
    }
  };

  // Optional: Auto-fetch on mount, but user wants explicit buttons: "Get Weekly Review", "Analyze Progress"
  // So we'll leave it empty.

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', color: '#fff', fontFamily: 'Inter, sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <button onClick={() => navigate('/student/dashboard')} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <i className="ri-arrow-left-line"></i> Back to Dashboard
            </button>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '36px', margin: '0 0 10px 0', background: 'linear-gradient(to right, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI Career Coach
            </h1>
            <p style={{ color: '#888', margin: 0, fontSize: '16px' }}>Your personal mentor for analyzing progress and achieving goals.</p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={fetchReview}
              disabled={loading}
              className="ripple-btn"
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)', opacity: loading ? 0.7 : 1 }}
            >
              <i className="ri-bar-chart-box-fill"></i> {loading ? 'Analyzing...' : 'Analyze Progress'}
            </button>
            <button 
              onClick={fetchReview}
              disabled={loading}
              className="ripple-btn"
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #ec4899, #be185d)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)', opacity: loading ? 0.7 : 1 }}
            >
              <i className="ri-calendar-check-fill"></i> Get Weekly Review
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#ef444420', border: '1px solid #ef4444', padding: '20px', borderRadius: '12px', color: '#fca5a5', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="ri-error-warning-fill" style={{ fontSize: '24px' }}></i> {error}
          </div>
        )}

        {loading && !review && (
           <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888', background: '#111', borderRadius: '16px', border: '1px solid #222' }}>
             <i className="ri-robot-2-line" style={{ fontSize: '48px', marginBottom: '20px', animation: 'pulse 2s infinite', color: '#ec4899' }}></i>
             <h2 style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Your AI Coach is analyzing your roadmap...</h2>
             <p>Generating personalized insights based on your recent activity.</p>
           </div>
        )}

        {!loading && !review && !error && (
          <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#555', background: '#111', borderRadius: '16px', border: '1px solid #222' }}>
            <i className="ri-magic-line" style={{ fontSize: '64px', marginBottom: '20px' }}></i>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Ready for your review?</h2>
            <p>Click "Analyze Progress" to let your AI Coach evaluate your learning journey.</p>
          </div>
        )}

        {review && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.5s ease-out' }}>
            
            {/* Progress Analysis Hero */}
            <div style={{ background: 'linear-gradient(145deg, #1a1a1a, #111)', padding: '40px', borderRadius: '24px', border: '1px solid #333', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: '#ec4899', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%' }}></div>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="ri-line-chart-fill" style={{ color: '#8b5cf6' }}></i> Progress Analysis
              </h2>
              <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#ccc', margin: 0 }}>
                {review.progressAnalysis || review.progressReview}
              </p>
            </div>

            {/* Strengths & Weaknesses Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
              <div style={{ background: '#111', padding: '30px', borderRadius: '20px', border: '1px solid #10b98130' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px' }}>
                  <i className="ri-sword-fill"></i> Strengths
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {review.strengths?.map((item, idx) => (
                    <li key={idx} style={{ color: '#ddd', lineHeight: '1.5' }}>{item}</li>
                  ))}
                </ul>
              </div>

              <div style={{ background: '#111', padding: '30px', borderRadius: '20px', border: '1px solid #ef444430' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px' }}>
                  <i className="ri-shield-cross-fill"></i> Areas to Improve
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {review.weaknesses?.map((item, idx) => (
                    <li key={idx} style={{ color: '#ddd', lineHeight: '1.5' }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actionable Insights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
              
              <div style={{ background: '#111', padding: '30px', borderRadius: '20px', border: '1px solid #333' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px' }}>
                  <i className="ri-lightbulb-flash-fill"></i> Improvement Suggestions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {review.improvementSuggestions?.map((item, idx) => (
                    <div key={idx} style={{ background: '#1a1a1a', padding: '15px', borderRadius: '12px', color: '#ccc', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <i className="ri-checkbox-circle-fill" style={{ color: '#3b82f6', marginTop: '2px' }}></i>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#111', padding: '30px', borderRadius: '20px', border: '1px solid #333' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px' }}>
                  <i className="ri-flag-fill"></i> Next Week Goals
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {review.nextWeekGoals?.map((item, idx) => (
                    <div key={idx} style={{ background: '#1a1a1a', padding: '15px', borderRadius: '12px', color: '#ccc', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <i className="ri-focus-2-line" style={{ color: '#f59e0b', marginTop: '2px' }}></i>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>

            {/* Recommended Courses */}
            {review.recommendedLMSCourses && review.recommendedLMSCourses.length > 0 && (
              <div style={{ background: 'linear-gradient(145deg, #111, #1a1a1a)', padding: '40px', borderRadius: '24px', border: '1px solid #8b5cf650' }}>
                <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="ri-book-open-fill" style={{ color: '#8b5cf6' }}></i> Recommended LMS Courses
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  {review.recommendedLMSCourses.map((course, idx) => (
                    <div key={idx} style={{ background: '#0b0b0b', padding: '20px', borderRadius: '16px', border: '1px solid #333', cursor: 'pointer', transition: 'all 0.3s ease' }} className="hover-lift" onClick={() => navigate('/courses')}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#8b5cf620', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', fontSize: '20px' }}>
                        <i className="ri-play-circle-fill"></i>
                      </div>
                      <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '16px', lineHeight: '1.4' }}>{course}</h4>
                      <p style={{ margin: 0, color: '#8b5cf6', fontSize: '14px', fontWeight: 'bold' }}>Browse Catalog <i className="ri-arrow-right-line"></i></p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .hover-lift:hover {
          transform: translateY(-5px);
          border-color: #8b5cf6;
          box-shadow: 0 10px 20px rgba(139, 92, 246, 0.1);
        }
      `}} />
    </div>
  );
}
