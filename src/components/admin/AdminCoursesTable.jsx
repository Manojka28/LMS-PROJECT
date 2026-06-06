import React, { useState } from 'react';
import { api } from '../../services/api';

export default function AdminCoursesTable({ courses, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filtered = courses.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.instructor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const togglePublish = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unpublish' : 'publish'} this course?`)) return;
    setIsProcessing(true);
    try {
      await api.patch(`/admin/courses/${id}/publish`, { isPublished: !currentStatus });
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm('Delete this course permanently? This will remove all enrollments and cannot be undone.')) return;
    setIsProcessing(true);
    try {
      await api.delete(`/admin/courses/${id}`);
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2 className="admin-panel-title">Course Management</h2>
          <p className="admin-panel-sub">Manage platform courses and visibility</p>
        </div>
        <div className="admin-date-picker">
          <i className="ri-search-line" />
          <input 
            type="text" 
            placeholder="Search courses..." 
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
              <th>Course</th>
              <th>Instructor</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th style={{textAlign: 'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c._id}>
                <td>
                  <div className="admin-flex-col">
                    <span style={{fontWeight: 500}}>{c.title?.length > 40 ? c.title.slice(0,40)+'...' : c.title}</span>
                    <span className="admin-text-small">{c.enrollmentCount || 0} students</span>
                  </div>
                </td>
                <td>{c.instructor?.name || 'Unknown'}</td>
                <td><span className="admin-badge info">{c.category}</span></td>
                <td style={{fontWeight: 600}}>₹{c.price}</td>
                <td>
                  <span className={`admin-badge ${c.isPublished ? 'success' : 'warning'}`}>
                    {c.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td style={{textAlign: 'right'}}>
                  <div className="admin-flex-row" style={{justifyContent: 'flex-end'}}>
                    <button 
                      disabled={isProcessing}
                      onClick={() => togglePublish(c._id, c.isPublished)}
                      className={`admin-badge ${c.isPublished ? 'warning' : 'success'}`}
                      style={{cursor: isProcessing ? 'not-allowed' : 'pointer'}}
                    >
                      {c.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button 
                      disabled={isProcessing}
                      onClick={() => deleteCourse(c._id)}
                      className="admin-badge danger"
                      style={{cursor: isProcessing ? 'not-allowed' : 'pointer'}}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{padding: '24px', textAlign: 'center', color: '#888'}}>No courses found.</p>}
      </div>
    </div>
  );
}
