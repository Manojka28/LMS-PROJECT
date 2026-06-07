import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useParams, Link } from 'react-router-dom';

export default function CourseIntelligenceCenter() {
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [data, setData] = useState({
    insight: null,
    bottlenecks: [],
    recommendations: [],
    lectureInsights: []
  });

  useEffect(() => {
    fetchIntelligence();
  }, [courseId]);

  const fetchIntelligence = async () => {
    try {
      const res = await api.get(`/intelligence/course/${courseId}`);
      if (res.success) {
        setData({
          insight: res.insight,
          bottlenecks: res.bottlenecks,
          recommendations: res.recommendations,
          lectureInsights: res.lectureInsights
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runAudit = async () => {
    setAuditing(true);
    try {
      await api.post(`/intelligence/course/${courseId}/audit`);
      await fetchIntelligence();
    } catch (err) {
      alert('Failed to run AI Audit');
    } finally {
      setAuditing(false);
    }
  };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', padding: '50px' }}>Loading Intelligence Data...</div>;

  const { insight, bottlenecks, recommendations } = data;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <Link to="/instructor/dashboard" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px', marginBottom: '10px', display: 'inline-block' }}>&larr; Back to Dashboard</Link>
          <h1 style={{ fontSize: '36px', margin: '0 0 5px 0', fontFamily: 'Space Grotesk, sans-serif' }}>Course Intelligence Center</h1>
          <p style={{ color: '#888', margin: 0 }}>Predictive AI analysis & bottleneck detection</p>
        </div>
        <button 
          onClick={runAudit} 
          disabled={auditing}
          style={{ padding: '15px 30px', background: auditing ? '#3b82f650' : 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', borderRadius: '8px', cursor: auditing ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          {auditing ? <><div style={{ width: '20px', height: '20px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div> AI Auditing...</> : <><i className="ri-radar-line"></i> Run Deep AI Audit</>}
        </button>
      </div>

      {insight && insight.courseQualityScore > 0 ? (
        <>
          {/* AI EXECUTIVE SUMMARY */}
          <div style={{ background: '#111', padding: '30px', borderRadius: '16px', border: '1px solid #3b82f6', marginBottom: '40px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px' }}><i className="ri-robot-2-line"></i> AI Executive Summary</h3>
            <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#ccc', margin: 0 }}>{insight.executiveSummary}</p>
          </div>

          {/* METRIC GAUGES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
              <div style={{ color: '#888', fontSize: '14px', marginBottom: '10px' }}>Course Quality</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: insight.courseQualityScore >= 80 ? '#10b981' : '#f59e0b' }}>{insight.courseQualityScore}/100</div>
            </div>
            <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
              <div style={{ color: '#888', fontSize: '14px', marginBottom: '10px' }}>Engagement Score</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6' }}>{insight.engagementScore}/100</div>
            </div>
            <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
              <div style={{ color: '#888', fontSize: '14px', marginBottom: '10px' }}>Completion Rate</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#8b5cf6' }}>{insight.completionRatePercentage}%</div>
            </div>
            <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
              <div style={{ color: '#888', fontSize: '14px', marginBottom: '10px' }}>Drop-off Risk</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: insight.dropOffPredictionRisk === 'Critical' || insight.dropOffPredictionRisk === 'High' ? '#ef4444' : '#10b981' }}>{insight.dropOffPredictionRisk}</div>
            </div>
          </div>

          {/* BOTTLENECKS & RECOMMENDATIONS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
            {/* BOTTLENECKS */}
            <div style={{ background: '#111', borderRadius: '16px', padding: '30px', border: '1px solid #333' }}>
              <h3 style={{ fontSize: '24px', margin: '0 0 20px 0', color: '#ef4444' }}><i className="ri-error-warning-line"></i> Critical Learning Bottlenecks</h3>
              {bottlenecks.length === 0 ? <div style={{ color: '#888' }}>No bottlenecks detected. Course is healthy!</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {bottlenecks.map(b => (
                    <div key={b._id} style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <strong style={{ color: '#fff' }}>{b.bottleneckType}</strong>
                        <span style={{ fontSize: '12px', color: '#ef4444', background: '#ef444420', padding: '2px 8px', borderRadius: '4px' }}>{b.affectedStudentsPercentage}% Affected</span>
                      </div>
                      <p style={{ color: '#aaa', margin: '0 0 10px 0', fontSize: '14px' }}>{b.description}</p>
                      <div style={{ fontSize: '12px', color: '#666' }}>Concept: <span style={{ color: '#fff' }}>{b.relatedConcept}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RECOMMENDATIONS */}
            <div style={{ background: '#111', borderRadius: '16px', padding: '30px', border: '1px solid #333' }}>
              <h3 style={{ fontSize: '24px', margin: '0 0 20px 0', color: '#10b981' }}><i className="ri-lightbulb-flash-line"></i> AI Optimization Recommendations</h3>
              {recommendations.length === 0 ? <div style={{ color: '#888' }}>No optimizations recommended currently.</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {recommendations.map(r => (
                    <div key={r._id} style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <strong style={{ color: '#fff' }}>{r.title}</strong>
                        <span style={{ fontSize: '12px', color: '#10b981', background: '#10b98120', padding: '2px 8px', borderRadius: '4px' }}>+{r.expectedImpactScore} Impact</span>
                      </div>
                      <p style={{ color: '#aaa', margin: '0 0 10px 0', fontSize: '14px' }}>{r.description}</p>
                      <div style={{ fontSize: '12px', color: '#666' }}>Action Type: <span style={{ color: '#fff' }}>{r.recommendationType}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ background: '#111', padding: '60px', textAlign: 'center', borderRadius: '16px', border: '1px dashed #333' }}>
          <i className="ri-bar-chart-2-line" style={{ fontSize: '64px', color: '#3b82f6', marginBottom: '20px', display: 'block' }}></i>
          <h2 style={{ fontSize: '28px', marginBottom: '10px' }}>No Intelligence Data Available</h2>
          <p style={{ color: '#888', fontSize: '18px', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
            Click the "Run Deep AI Audit" button to unleash the Intelligence Engine. It will analyze all student behaviors, drop-off rates, and quiz performances to generate actionable insights for your course.
          </p>
        </div>
      )}

    </div>
  );
}
