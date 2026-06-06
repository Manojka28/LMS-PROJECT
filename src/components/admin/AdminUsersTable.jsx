import React, { useState } from 'react';
import { api } from '../../services/api';

export default function AdminUsersTable({ users, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'disable' : 'enable'} this user?`)) return;
    setIsProcessing(true);
    try {
      await api.patch(`/admin/users/${id}/status`, { isActive: !currentStatus });
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently? This cannot be undone.')) return;
    setIsProcessing(true);
    try {
      await api.delete(`/admin/users/${id}`);
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
          <h2 className="admin-panel-title">User Management</h2>
          <p className="admin-panel-sub">Manage platform users and roles</p>
        </div>
        <div className="admin-date-picker">
          <i className="ri-search-line" />
          <input 
            type="text" 
            placeholder="Search users..." 
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
              <th>User</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Status</th>
              <th style={{textAlign: 'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id}>
                <td>
                  <div className="admin-flex-row">
                    <div className="admin-avatar">{u.name.charAt(0)}</div>
                    <div className="admin-flex-col">
                      <span style={{fontWeight: 500}}>{u.name}</span>
                      <span className="admin-text-small">{u.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`admin-badge ${u.role === 'admin' ? 'danger' : u.role === 'instructor' ? 'warning' : 'info'}`}>
                    {u.role}
                  </span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <span className={`admin-badge ${u.isActive !== false ? 'success' : 'danger'}`}>
                    {u.isActive !== false ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td style={{textAlign: 'right'}}>
                  <div className="admin-flex-row" style={{justifyContent: 'flex-end'}}>
                    <button 
                      disabled={isProcessing || u.role === 'admin'}
                      onClick={() => toggleStatus(u._id, u.isActive !== false)}
                      className={`admin-badge ${u.isActive !== false ? 'warning' : 'success'}`}
                      style={{cursor: isProcessing || u.role === 'admin' ? 'not-allowed' : 'pointer'}}
                      title={u.role === 'admin' ? "Cannot disable admin" : ""}
                    >
                      {u.isActive !== false ? 'Disable' : 'Enable'}
                    </button>
                    <button 
                      disabled={isProcessing || u.role === 'admin'}
                      onClick={() => deleteUser(u._id)}
                      className="admin-badge danger"
                      style={{cursor: isProcessing || u.role === 'admin' ? 'not-allowed' : 'pointer'}}
                      title={u.role === 'admin' ? "Cannot delete admin" : ""}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{padding: '24px', textAlign: 'center', color: '#888'}}>No users found matching search.</p>}
      </div>
    </div>
  );
}
