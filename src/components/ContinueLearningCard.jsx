import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ContinueLearningCard({ progressData }) {
  const navigate = useNavigate();

  if (!progressData || !progressData.course) {
    return (
      <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#888' }}>
        You haven't started any courses yet.
      </div>
    );
  }

  const { course, completionPercentage, lastViewedLecture } = progressData;

  const handleResume = () => {
    navigate(`/course/${course._id}/learn`);
  };

  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <img src={course.thumbnail} alt={course.title} style={{ width: '300px', height: '200px', objectFit: 'cover' }} />
        <div style={{ padding: '30px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ color: '#00D26A', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Continue Learning</h4>
          <h2 style={{ fontSize: '24px', marginBottom: '12px', fontFamily: 'Space Grotesk, sans-serif' }}>{course.title}</h2>
          
          <div style={{ margin: '15px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#aaa', marginBottom: '8px' }}>
              <span>Progress</span>
              <span>{completionPercentage}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${completionPercentage}%`, height: '100%', background: '#00D26A', borderRadius: '3px', transition: 'width 0.5s ease-out' }}></div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#888', fontSize: '14px' }}>
              {lastViewedLecture ? `Up next: ${lastViewedLecture.title}` : 'Ready to begin'}
            </span>
            <button onClick={handleResume} className="ripple-btn" style={{ background: '#00D26A', color: 'black', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              Resume Course
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
