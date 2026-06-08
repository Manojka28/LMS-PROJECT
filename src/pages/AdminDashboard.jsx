import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

import AdminLayout from '../components/admin/AdminLayout';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsersTable from '../components/admin/AdminUsersTable';
import AdminCoursesTable from '../components/admin/AdminCoursesTable';
import AdminPaymentsTable from '../components/admin/AdminPaymentsTable';
import AdminInstructorsTable from '../components/admin/AdminInstructorsTable';
import AdminAuditLogsTable from '../components/admin/AdminAuditLogsTable';
import AdminSystemHealth from '../components/admin/AdminSystemHealth';
import { useToast } from '../components/common/ToastContext';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { FadeIn } from '../components/common/MotionWrapper';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [instructors, setInstructors] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsRes, usersRes, coursesRes, paymentsRes, instructorsRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users?limit=50'),
        api.get('/admin/courses?limit=50'),
        api.get('/admin/payments?limit=100'),
        api.get('/admin/instructors'),
      ]);
      
      if (analyticsRes.success) setAnalytics(analyticsRes.analytics);
      if (usersRes.success) setUsers(usersRes.users);
      if (coursesRes.success) setCourses(coursesRes.courses);
      if (paymentsRes.success) setPayments(paymentsRes.payments);
      if (instructorsRes.success) setInstructors(instructorsRes.instructors);
    } catch (err) {
      showError(err.message || 'Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <AdminLayout activeTab={activeTab} onTabSelect={setActiveTab}>
      
      {error && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
          <span><i className="ri-error-warning-line" /> {error}</span>
          <button onClick={fetchAll} style={{ color: '#ef4444', textDecoration: 'underline' }}>Retry</button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '20px' }}>
          <SkeletonLoader type="card" count={3} />
        </div>
      ) : (
        <FadeIn key={activeTab}>
          {activeTab === 'overview' && (
            <AdminOverview 
              analytics={analytics} 
              users={users} 
              courses={courses} 
              payments={payments} 
            />
          )}
          {activeTab === 'users' && (
            <AdminUsersTable users={users} onRefresh={fetchAll} />
          )}
          {activeTab === 'courses' && (
            <AdminCoursesTable courses={courses} onRefresh={fetchAll} />
          )}
          {activeTab === 'payments' && (
            <AdminPaymentsTable payments={payments} />
          )}
          {activeTab === 'instructors' && (
            <AdminInstructorsTable instructors={instructors} />
          )}
          {activeTab === 'auditlogs' && (
            <AdminAuditLogsTable />
          )}
          {activeTab === 'systemhealth' && (
            <AdminSystemHealth />
          )}
        </FadeIn>
      )}

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </AdminLayout>
  );
}
