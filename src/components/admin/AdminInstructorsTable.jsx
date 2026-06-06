import React, { useState } from 'react';

export default function AdminInstructorsTable({ instructors }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = instructors.filter(i => {
    const name = i.instructor?.name || 'Unknown Instructor';
    const email = i.instructor?.email || 'Unknown Email';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2 className="admin-panel-title">Instructor Analytics</h2>
          <p className="admin-panel-sub">Performance metrics by instructor</p>
        </div>
        
        <div className="admin-date-picker">
          <i className="ri-search-line" />
          <input 
            type="text" 
            placeholder="Search instructors..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none', width: '200px' }}
          />
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Instructor</th>
              <th>Courses Created</th>
              <th>Total Students</th>
              <th>Total Revenue Generated</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i, idx) => (
              <tr key={i.instructor?._id || idx}>
                <td>
                  <div className="admin-flex-row">
                    <div className="admin-avatar" style={{background: 'rgba(245, 158, 11, 0.2)', color: 'var(--admin-accent-orange)'}}>
                      {(i.instructor?.name || 'Unknown').charAt(0)}
                    </div>
                    <div className="admin-flex-col">
                      <span style={{fontWeight: 500}}>{i.instructor?.name || 'Unknown Instructor'}</span>
                      <span className="admin-text-small">{i.instructor?.email || 'Unknown Email'}</span>
                    </div>
                  </div>
                </td>
                <td><span className="admin-badge info">{i.totalCourses} Courses</span></td>
                <td style={{fontWeight: 600}}>{i.totalStudents} <i className="ri-user-line" style={{color: 'var(--admin-text-secondary)'}}/></td>
                <td style={{fontWeight: 600, color: 'var(--admin-accent-green)'}}>
                  ₹{(i.totalRevenue || 0).toLocaleString()}
                </td>
                <td>{i.instructor?.createdAt ? new Date(i.instructor.createdAt).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{padding: '24px', textAlign: 'center', color: '#888'}}>No instructors found.</p>}
      </div>
    </div>
  );
}
