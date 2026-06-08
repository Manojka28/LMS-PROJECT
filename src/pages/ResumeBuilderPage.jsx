import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function ResumeBuilderPage() {
  const [profile, setProfile] = useState({
    fullName: '', email: '', phone: '', summary: '', linkedin: '', github: '', portfolio: '',
    skills: [], education: [], projects: [], certifications: [], achievements: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState('modern');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/resume');
      if (res.success && res.profile) {
        setProfile(res.profile);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/resume', profile);
      alert('Profile saved successfully!');
    } catch (err) {
      alert(err.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    window.open(`http://localhost:5000/api/resume/generate?template=${template}`, '_blank');
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (field, index, subfield, value) => {
    const updated = [...profile[field]];
    if (subfield === null) {
      updated[index] = value;
    } else {
      updated[index][subfield] = value;
    }
    setProfile({ ...profile, [field]: updated });
  };

  const addArrayItem = (field, defaultObj) => {
    setProfile({ ...profile, [field]: [...profile[field], defaultObj] });
  };

  const removeArrayItem = (field, index) => {
    const updated = [...profile[field]];
    updated.splice(index, 1);
    setProfile({ ...profile, [field]: updated });
  };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '32px' }}>Resume Builder</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <select 
            value={template} 
            onChange={(e) => setTemplate(e.target.value)}
            style={{ padding: '10px', background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
          >
            <option value="modern">Modern Template</option>
            <option value="ats">ATS Friendly Template</option>
            <option value="professional">Professional Template</option>
          </select>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="ripple-btn"
            style={{ padding: '10px 20px', background: '#10b981', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          <button 
            onClick={handleDownload}
            className="ripple-btn"
            style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}
          >
            Download PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Personal Info */}
        <div style={{ background: '#1a1a1a', padding: '25px', borderRadius: '12px', border: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <input name="fullName" value={profile.fullName} onChange={handleChange} placeholder="Full Name" style={inputStyle} />
            <input name="email" value={profile.email} onChange={handleChange} placeholder="Email" style={inputStyle} />
            <input name="phone" value={profile.phone} onChange={handleChange} placeholder="Phone Number" style={inputStyle} />
            <input name="linkedin" value={profile.linkedin} onChange={handleChange} placeholder="LinkedIn URL" style={inputStyle} />
            <input name="github" value={profile.github} onChange={handleChange} placeholder="GitHub URL" style={inputStyle} />
            <input name="portfolio" value={profile.portfolio} onChange={handleChange} placeholder="Portfolio URL" style={inputStyle} />
          </div>
        </div>

        {/* Summary */}
        <div style={{ background: '#1a1a1a', padding: '25px', borderRadius: '12px', border: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Professional Summary</h3>
          <textarea name="summary" value={profile.summary} onChange={handleChange} placeholder="A short summary about yourself..." rows={4} style={{...inputStyle, width: '100%', resize: 'vertical'}} />
        </div>

        {/* Skills */}
        <div style={{ background: '#1a1a1a', padding: '25px', borderRadius: '12px', border: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Skills</h3>
          {profile.skills.map((skill, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input value={skill} onChange={(e) => handleArrayChange('skills', index, null, e.target.value)} placeholder="e.g., React, Node.js, Python" style={inputStyle} />
              <button onClick={() => removeArrayItem('skills', index)} style={removeBtnStyle}>&times;</button>
            </div>
          ))}
          <button onClick={() => addArrayItem('skills', '')} style={addBtnStyle}>+ Add Skill</button>
        </div>

        {/* Education */}
        <div style={{ background: '#1a1a1a', padding: '25px', borderRadius: '12px', border: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Education</h3>
          {profile.education.map((edu, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
              <input value={edu.institution} onChange={(e) => handleArrayChange('education', index, 'institution', e.target.value)} placeholder="Institution" style={inputStyle} />
              <input value={edu.degree} onChange={(e) => handleArrayChange('education', index, 'degree', e.target.value)} placeholder="Degree" style={inputStyle} />
              <input value={edu.year} onChange={(e) => handleArrayChange('education', index, 'year', e.target.value)} placeholder="Year" style={{...inputStyle, width: '100px'}} />
              <input value={edu.grade} onChange={(e) => handleArrayChange('education', index, 'grade', e.target.value)} placeholder="Grade (optional)" style={{...inputStyle, width: '150px'}} />
              <button onClick={() => removeArrayItem('education', index)} style={removeBtnStyle}>&times;</button>
            </div>
          ))}
          <button onClick={() => addArrayItem('education', { institution: '', degree: '', year: '', grade: '' })} style={addBtnStyle}>+ Add Education</button>
        </div>

        {/* Projects */}
        <div style={{ background: '#1a1a1a', padding: '25px', borderRadius: '12px', border: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Projects</h3>
          {profile.projects.map((proj, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #222' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input value={proj.title} onChange={(e) => handleArrayChange('projects', index, 'title', e.target.value)} placeholder="Project Title" style={inputStyle} />
                <input value={proj.link} onChange={(e) => handleArrayChange('projects', index, 'link', e.target.value)} placeholder="Project Link" style={inputStyle} />
                <button onClick={() => removeArrayItem('projects', index)} style={removeBtnStyle}>&times;</button>
              </div>
              <textarea value={proj.description} onChange={(e) => handleArrayChange('projects', index, 'description', e.target.value)} placeholder="Project Description" rows={2} style={{...inputStyle, resize: 'vertical'}} />
            </div>
          ))}
          <button onClick={() => addArrayItem('projects', { title: '', description: '', link: '' })} style={addBtnStyle}>+ Add Project</button>
        </div>

        {/* Certifications */}
        <div style={{ background: '#1a1a1a', padding: '25px', borderRadius: '12px', border: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Certifications</h3>
          {profile.certifications.map((cert, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              <input value={cert.title} onChange={(e) => handleArrayChange('certifications', index, 'title', e.target.value)} placeholder="Certificate Title" style={inputStyle} />
              <input value={cert.issuer} onChange={(e) => handleArrayChange('certifications', index, 'issuer', e.target.value)} placeholder="Issuer" style={inputStyle} />
              <input value={cert.year} onChange={(e) => handleArrayChange('certifications', index, 'year', e.target.value)} placeholder="Year" style={{...inputStyle, width: '100px'}} />
              <button onClick={() => removeArrayItem('certifications', index)} style={removeBtnStyle}>&times;</button>
            </div>
          ))}
          <button onClick={() => addArrayItem('certifications', { title: '', issuer: '', year: '' })} style={addBtnStyle}>+ Add Certification</button>
        </div>

        {/* Achievements */}
        <div style={{ background: '#1a1a1a', padding: '25px', borderRadius: '12px', border: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Achievements</h3>
          {profile.achievements.map((ach, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input value={ach} onChange={(e) => handleArrayChange('achievements', index, null, e.target.value)} placeholder="e.g., 1st place in Hackathon" style={inputStyle} />
              <button onClick={() => removeArrayItem('achievements', index)} style={removeBtnStyle}>&times;</button>
            </div>
          ))}
          <button onClick={() => addArrayItem('achievements', '')} style={addBtnStyle}>+ Add Achievement</button>
        </div>

      </div>
    </div>
  );
}

// Inline styles for convenience without polluting global css
const inputStyle = {
  width: '100%',
  padding: '12px',
  background: '#000',
  color: '#fff',
  border: '1px solid #333',
  borderRadius: '6px',
  fontFamily: 'inherit'
};

const addBtnStyle = {
  background: 'transparent',
  color: '#3b82f6',
  border: '1px dashed #3b82f6',
  padding: '10px 15px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  marginTop: '10px'
};

const removeBtnStyle = {
  background: '#ef444420',
  color: '#ef4444',
  border: 'none',
  padding: '0 15px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '20px'
};
