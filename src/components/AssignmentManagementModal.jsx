import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import AssignmentGradingModal from './AssignmentGradingModal';

export default function AssignmentManagementModal({ course, onClose }) {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  
  const [activeLecture, setActiveLecture] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxMarks: 100,
    attachmentUrl: ''
  });

  const [showGradingModal, setShowGradingModal] = useState(false);

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

  const handleManageAssignment = async (lecture) => {
    setActiveLecture(lecture);
    setLoading(true);
    try {
      const res = await api.get(`/assignment/${lecture._id}`);
      if (res.success && res.assignment) {
        setAssignment(res.assignment);
        setFormData({
          title: res.assignment.title,
          description: res.assignment.description,
          dueDate: new Date(res.assignment.dueDate).toISOString().split('T')[0],
          maxMarks: res.assignment.maxMarks,
          attachmentUrl: res.assignment.attachmentUrl || ''
        });
      } else {
        setAssignment(null);
        resetForm();
      }
    } catch (err) {
      if (err.status === 404 || (err.response && err.response.status === 404)) {
        setAssignment(null);
        resetForm();
      } else {
        console.error(err);
        alert('Failed to load assignment');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      maxMarks: 100,
      attachmentUrl: ''
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (assignment) {
        const res = await api.put(`/assignment/${assignment._id}`, formData);
        setAssignment(res.assignment);
        alert('Assignment updated successfully!');
      } else {
        const res = await api.post('/assignment', { ...formData, courseId: course._id, lectureId: activeLecture._id });
        setAssignment(res.assignment);
        alert('Assignment created successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this assignment and all its submissions?')) return;
    setSaving(true);
    try {
      await api.delete(`/assignment/${assignment._id}`);
      setAssignment(null);
      resetForm();
      alert('Assignment deleted.');
    } catch (err) {
      console.error(err);
      alert('Failed to delete assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#111', width: '90%', maxWidth: '1200px', height: '90vh', borderRadius: '12px', border: '1px solid #333', display: 'flex', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Left Sidebar: Curriculum */}
        <div style={{ width: '300px', background: '#1a1a1a', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #333' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Assignments</h3>
            <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '13px' }}>Select a lecture to manage its assignment.</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
            {loading && !activeLecture ? (
              <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Loading...</div>
            ) : sections.map((sec, sIdx) => (
              <div key={sec._id} style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#aaa', textTransform: 'uppercase' }}>Section {sIdx + 1}: {sec.title}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {sec.lectures.map((lec, lIdx) => (
                    <button
                      key={lec._id}
                      onClick={() => handleManageAssignment(lec)}
                      style={{
                        textAlign: 'left',
                        padding: '10px',
                        background: activeLecture?._id === lec._id ? '#3b82f620' : 'transparent',
                        color: activeLecture?._id === lec._id ? '#3b82f6' : '#ccc',
                        border: '1px solid',
                        borderColor: activeLecture?._id === lec._id ? '#3b82f6' : 'transparent',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {lIdx + 1}. {lec.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Area: Assignment Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '24px' }}>
            <i className="ri-close-line" />
          </button>

          {loading && activeLecture ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
              Loading assignment...
            </div>
          ) : !activeLecture ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#555', flexDirection: 'column' }}>
              <i className="ri-file-edit-line" style={{ fontSize: '48px', marginBottom: '15px' }}></i>
              <p>Select a lecture from the left sidebar to create or edit an assignment.</p>
            </div>
          ) : (
            <div style={{ padding: '40px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                  <h2 style={{ margin: '0 0 10px 0' }}>{assignment ? 'Edit Assignment' : 'Create Assignment'}</h2>
                  <p style={{ margin: 0, color: '#aaa' }}>For lecture: <strong style={{ color: '#fff' }}>{activeLecture.title}</strong></p>
                </div>
                {assignment && (
                  <button 
                    onClick={() => setShowGradingModal(true)}
                    className="ripple-btn"
                    style={{ padding: '10px 20px', background: '#10b981', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}
                  >
                    <i className="ri-file-list-3-line"></i> View Submissions
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Assignment Title *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Max Marks *</label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      value={formData.maxMarks}
                      onChange={e => setFormData({...formData, maxMarks: Number(e.target.value)})}
                      style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Description / Instructions *</label>
                  <textarea 
                    required 
                    rows="6"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '6px', resize: 'vertical' }}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Due Date *</label>
                    <input 
                      type="date" 
                      required 
                      value={formData.dueDate}
                      onChange={e => setFormData({...formData, dueDate: e.target.value})}
                      style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Attachment URL (Optional)</label>
                    <input 
                      type="url" 
                      placeholder="e.g., Google Drive link to template"
                      value={formData.attachmentUrl}
                      onChange={e => setFormData({...formData, attachmentUrl: e.target.value})}
                      style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <button type="submit" disabled={saving} style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {saving ? 'Saving...' : assignment ? 'Update Assignment' : 'Create Assignment'}
                  </button>
                  {assignment && (
                    <button type="button" onClick={handleDelete} disabled={saving} style={{ padding: '12px 24px', background: 'transparent', color: '#ef4444', border: '1px solid #ef444450', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Delete Assignment
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {showGradingModal && (
        <AssignmentGradingModal 
          assignment={assignment} 
          onClose={() => setShowGradingModal(false)} 
        />
      )}
    </div>
  );
}
