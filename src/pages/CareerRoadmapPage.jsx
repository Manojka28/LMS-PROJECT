import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

export default function CareerRoadmapPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [milestones, setMilestones] = useState([]);
  
  // Form State
  const [targetRole, setTargetRole] = useState('');
  const [currentSkills, setCurrentSkills] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [durationWeeks, setDurationWeeks] = useState(12);

  // AI Coach Review State
  const [coachReview, setCoachReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async (isSilentRefresh = false) => {
    if (!isSilentRefresh) setLoading(true);
    try {
      const res = await api.get('/roadmap');
      if (res.success && res.hasRoadmap) {
        setRoadmap(res.roadmap);
        setMilestones(res.milestones);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilentRefresh) setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const response = await api.post('/roadmap/generate', {
        targetRole, currentSkills, experienceLevel, durationWeeks
      });
      console.log("ROADMAP API RESPONSE", response);
      console.log("ROADMAP DATA", response.data);
      fetchRoadmap();
    } catch (err) {
      console.error("GENERATE CATCH ERROR:", err);
      alert(err.message || 'Error generating roadmap');
    } finally {
      setGenerating(false);
    }
  };

  const completeTask = async (taskId) => {
    try {
      await api.post('/roadmap/task/complete', { taskId });
      fetchRoadmap(true); // Silent refresh to update cascade percentages
    } catch (err) {
      alert('Error completing task');
    }
  };

  const loadCoachReview = async () => {
    setLoadingReview(true);
    try {
      const res = await api.get('/roadmap/coach-review');
      if (res.success) {
        setCoachReview(res.review);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReview(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete your career roadmap?")) {
      try {
        await api.delete('/roadmap');
        setRoadmap(null);
        setMilestones([]);
      } catch (err) {
        alert('Failed to delete roadmap');
      }
    }
  };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', padding: '50px' }}>Loading Roadmap...</div>;

  if (generating) return (
    <div style={{ color: '#fff', textAlign: 'center', padding: '100px 20px' }}>
      <div style={{ width: '80px', height: '80px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
      <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>AI is architecting your Career Roadmap...</h2>
      <p style={{ color: '#888', fontSize: '18px' }}>We are matching skills, dependencies, and generating a personalized {durationWeeks}-week plan.</p>
    </div>
  );

  if (!roadmap) {
    return (
      <div style={{ maxWidth: '800px', margin: '50px auto', padding: '40px', background: '#111', borderRadius: '16px', color: '#fff' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>Career Intelligence Engine</h1>
        <p style={{ color: '#aaa', fontSize: '18px', marginBottom: '40px' }}>Our AI acts as your personalized learning mentor. Tell us your goals, and we'll generate a highly customized week-by-week roadmap, mapping prerequisites to actual LMS courses.</p>
        
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>What is your Target Role? (e.g. MERN Developer, Data Scientist)</label>
            <input type="text" required value={targetRole} onChange={e => setTargetRole(e.target.value)} style={{ width: '100%', padding: '15px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '16px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>Current Skills (Comma separated)</label>
            <input type="text" placeholder="e.g. HTML, basic CSS" value={currentSkills} onChange={e => setCurrentSkills(e.target.value)} style={{ width: '100%', padding: '15px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '16px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>Experience Level</label>
              <select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)} style={{ width: '100%', padding: '15px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '16px' }}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>Timeline</label>
              <select value={durationWeeks} onChange={e => setDurationWeeks(Number(e.target.value))} style={{ width: '100%', padding: '15px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '16px' }}>
                <option value={12}>12 Weeks (Accelerated)</option>
                <option value={24}>24 Weeks (Standard)</option>
                <option value={36}>36 Weeks (Comprehensive)</option>
              </select>
            </div>
          </div>
          
          <button type="submit" style={{ marginTop: '20px', padding: '15px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
            Generate AI Roadmap
          </button>
        </form>
      </div>
    );
  }

  try {
    console.log("ROADMAP RECEIVED", roadmap);
  } catch(err) {
    console.error(err);
  }

  // Visual Roadmap Dashboard UI
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '36px', margin: '0 0 10px 0', fontFamily: 'Space Grotesk, sans-serif' }}>{roadmap.title}</h1>
          <p style={{ color: '#888', margin: 0, fontSize: '18px' }}>{roadmap.durationWeeks} Weeks • {roadmap.experienceLevel} Level</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={loadCoachReview} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #8b5cf6', color: '#a78bfa', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <i className="ri-robot-2-line"></i> AI Coach Review
          </button>
          <button onClick={handleDelete} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Delete Plan
          </button>
        </div>
      </div>

      {/* COACH REVIEW MODAL */}
      {coachReview && (
        <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '16px', border: '1px solid #8b5cf6', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#a78bfa', fontSize: '24px' }}>AI Mentor Feedback</h3>
            <button onClick={() => setCoachReview(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
          </div>
          <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>{coachReview.progressReview}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: '#0b0b0b', padding: '20px', borderRadius: '12px' }}>
              <h4 style={{ color: '#10b981', margin: '0 0 10px 0' }}>Strengths</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#ccc' }}>
                {coachReview.strengths.map((s,i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div style={{ background: '#0b0b0b', padding: '20px', borderRadius: '12px' }}>
              <h4 style={{ color: '#f59e0b', margin: '0 0 10px 0' }}>Areas for Growth</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#ccc' }}>
                {coachReview.weaknesses.map((w,i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>
          <div style={{ background: '#3b82f620', padding: '15px', borderRadius: '8px', color: '#93c5fd' }}>
            <strong>Recommendation:</strong> {coachReview.recommendedAdjustments}
          </div>
        </div>
      )}

      {/* DASHBOARD ANALYTICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '14px', marginBottom: '10px' }}>Overall Progress</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6' }}>{roadmap.completionPercentage}%</div>
        </div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '14px', marginBottom: '10px' }}>Job Readiness</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981' }}>{roadmap.jobReadiness}%</div>
        </div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '14px', marginBottom: '10px' }}>Interview Readiness</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f59e0b' }}>{roadmap.interviewReadiness}%</div>
        </div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '14px', marginBottom: '10px' }}>Learning Streak</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ef4444' }}>{roadmap.currentStreak} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#888' }}>Days (Peak: {roadmap.highestStreak})</span></div>
        </div>
      </div>

      {/* KANBAN / TIMELINE VIEW */}
      <div>
        <h2 style={{ fontSize: '28px', marginBottom: '20px', fontFamily: 'Space Grotesk, sans-serif' }}>Weekly Execution Plan</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {milestones.map((milestone) => (
            <div key={milestone._id} style={{ background: '#111', borderRadius: '16px', border: '1px solid #333', overflow: 'hidden' }}>
              <div style={{ padding: '20px', background: '#1a1a1a', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', color: milestone.status === 'Completed' ? '#10b981' : '#fff' }}>
                    Week {milestone.weekNumber}: {milestone.title}
                  </h3>
                  <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '14px' }}>{milestone.description}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '20px' }}>{milestone.completionPercentage}%</div>
                  <div style={{ color: '#666', fontSize: '12px' }}>{milestone.status}</div>
                </div>
              </div>
              
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {milestone.tasks && milestone.tasks.map(task => (
                  <div key={task._id} style={{ background: '#1a1a1a', padding: '15px', borderRadius: '12px', border: `1px solid ${task.completed ? '#10b98150' : '#333'}`, position: 'relative' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', background: '#333', color: '#aaa', textTransform: 'uppercase', fontWeight: 'bold' }}>{task.taskType}</span>
                      <span style={{ fontSize: '12px', color: '#666' }}>~{task.estimatedTime} hrs</span>
                    </div>

                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: task.completed ? '#aaa' : '#fff', textDecoration: task.completed ? 'line-through' : 'none' }}>
                      {task.taskTitle}
                    </h4>
                    <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#888' }}>{task.taskDescription}</p>

                    {task.targetSkills && task.targetSkills.length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '15px' }}>
                        {task.targetSkills.map((s,i) => <span key={i} style={{ fontSize: '10px', background: '#3b82f620', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px' }}>{s}</span>)}
                      </div>
                    )}

                    {task.lmsCourseId && (
                      <div style={{ marginBottom: '15px', padding: '10px', background: '#0b0b0b', borderRadius: '8px', border: '1px solid #222', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="ri-vidicon-line" style={{ color: '#8b5cf6' }}></i>
                        <Link to={`/courses/${task.lmsCourseId._id}`} style={{ color: '#a78bfa', fontSize: '14px', textDecoration: 'none' }}>
                          Matched Course: {task.lmsCourseId.title}
                        </Link>
                      </div>
                    )}

                    <button 
                      onClick={() => completeTask(task._id)}
                      style={{ width: '100%', padding: '10px', background: task.completed ? '#10b98120' : '#3b82f6', color: task.completed ? '#10b981' : '#fff', border: task.completed ? '1px solid #10b981' : 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                    >
                      {task.completed ? <><i className="ri-check-line"></i> Completed (Click to undo)</> : 'Mark Complete'}
                    </button>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
