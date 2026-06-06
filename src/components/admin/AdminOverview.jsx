import React, { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const METRICS = [
  { key: 'totalUsers',               label: 'Total Users',       icon: 'ri-group-fill',              color: 'var(--admin-accent-blue)' },
  { key: 'totalStudents',            label: 'Students',          icon: 'ri-user-fill',               color: 'var(--admin-accent-purple)' },
  { key: 'totalInstructors',         label: 'Instructors',       icon: 'ri-user-star-fill',          color: 'var(--admin-accent-green)' },
  { key: 'totalCourses',             label: 'Courses',           icon: 'ri-book-3-fill',             color: 'var(--admin-accent-orange)' },
  { key: 'totalRevenue',             label: 'Revenue',           icon: 'ri-money-rupee-circle-fill', color: 'var(--admin-accent-green)', prefix: '₹' },
  { key: 'totalEnrollments',         label: 'Enrollments',       icon: 'ri-graduation-cap-fill',     color: 'var(--admin-accent-blue)' },
  { key: 'totalPayments',            label: 'Payments',          icon: 'ri-bank-card-2-fill',        color: 'var(--admin-accent-red)' },
  { key: 'totalCertificates',        label: 'Certificates',      icon: 'ri-award-fill',              color: 'var(--admin-accent-orange)' },
  { key: 'totalQuizAttempts',        label: 'Quiz Attempts',     icon: 'ri-questionnaire-fill',      color: 'var(--admin-accent-purple)' },
  { key: 'totalAssignmentSubmissions', label: 'Assignments',     icon: 'ri-file-upload-fill',        color: 'var(--admin-text-secondary)' },
  { key: 'totalWishlists',           label: 'Wishlists',         icon: 'ri-heart-3-fill',            color: '#ef4444' },
];

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981'];

function StatCard({ label, value, icon, color, prefix = '' }) {
  return (
    <div className="admin-metric-card">
      <div className="admin-metric-header">
        <span className="admin-metric-title">{label}</span>
        <div className="admin-metric-icon" style={{ backgroundColor: `${color}15`, color }}>
          <i className={icon} />
        </div>
      </div>
      <div className="admin-metric-value">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : (value ?? 0)}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#111', border: '1px solid #333', borderRadius: 8, padding: '12px', fontSize: 12 }}>
      <p style={{ color: '#888', margin: '0 0 8px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#fff', margin: '4px 0', fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminOverview({ analytics, users, courses, payments }) {

  // Revenue Line Chart Data
  const revenueData = useMemo(() => {
    if (!payments?.length) return [];
    const months = {};
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    payments.forEach(p => {
      if (!['paid','enrolledAfterPayment'].includes(p.paymentStatus)) return;
      const d = new Date(p.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      months[key] = (months[key] || 0) + (p.amount || 0);
    });
    return Object.entries(months).slice(-6).map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));
  }, [payments]);

  // User Pie Chart
  const userRoleData = useMemo(() => {
    if (!analytics) return [];
    return [
      { name: 'Students',    value: analytics.totalStudents    || 0 },
      { name: 'Instructors', value: analytics.totalInstructors || 0 },
      { name: 'Admins',      value: analytics.totalUsers - analytics.totalStudents - analytics.totalInstructors || 0 },
    ].filter(d => d.value > 0);
  }, [analytics]);

  // Payment Status Bar Chart
  const paymentStatusData = useMemo(() => {
    if (!payments?.length) return [];
    const map = {};
    payments.forEach(p => {
      const label = p.paymentStatus === 'enrolledAfterPayment' ? 'Enrolled' : p.paymentStatus;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [payments]);

  // Top Courses by Enrollment
  const topCourses = useMemo(() =>
    [...(courses || [])]
      .sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
      .slice(0, 5),
    [courses]
  );

  const courseBarData = topCourses.map(c => ({
    name: c.title?.length > 16 ? c.title.slice(0, 16) + '…' : c.title,
    enrollments: c.enrollmentCount || 0
  }));

  const wishlistBarData = useMemo(() => {
    if (!analytics?.topWishlistedCourses) return [];
    return analytics.topWishlistedCourses.map(c => ({
      name: c.title?.length > 16 ? c.title.slice(0, 16) + '…' : c.title,
      wishlists: c.count || 0
    }));
  }, [analytics]);

  const recentUsers = useMemo(() =>
    [...(users || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6),
    [users]
  );

  return (
    <>
      <div className="admin-metrics-grid">
        {METRICS.map(m => (
          <StatCard key={m.key} label={m.label} value={analytics?.[m.key]} icon={m.icon} color={m.color} prefix={m.prefix} />
        ))}
      </div>

      <div className="admin-charts-grid">
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3 className="admin-panel-title">Revenue Overview</h3>
              <p className="admin-panel-sub">Monthly revenue from paid enrollments</p>
            </div>
          </div>
          <div className="admin-chart-container">
            {revenueData.length === 0 ? (
              <div className="chart-empty"><i className="ri-line-chart-line" /><p>No data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--admin-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: 'var(--admin-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--admin-accent-blue)" strokeWidth={3} dot={{ fill: 'var(--admin-accent-blue)', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3 className="admin-panel-title">Enrollment Trends</h3>
              <p className="admin-panel-sub">New enrollments over 30 days</p>
            </div>
          </div>
          <div className="admin-chart-container">
            {!analytics?.enrollmentTrends?.length ? (
              <div className="chart-empty"><i className="ri-graduation-cap-line" /><p>No data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.enrollmentTrends} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'var(--admin-text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: 'var(--admin-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" name="Enrollments" stroke="var(--admin-accent-purple)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="admin-charts-grid equal" style={{ marginTop: '24px' }}>
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3 className="admin-panel-title">User Growth</h3>
              <p className="admin-panel-sub">New users over 30 days</p>
            </div>
          </div>
          <div className="admin-chart-container">
            {!analytics?.userTrends?.length ? (
              <div className="chart-empty"><i className="ri-user-add-line" /><p>No data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.userTrends} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'var(--admin-text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: 'var(--admin-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="New Users" fill="var(--admin-accent-green)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3 className="admin-panel-title">Users by Role</h3>
              <p className="admin-panel-sub">Distribution of user types</p>
            </div>
          </div>
          <div className="admin-chart-container" style={{ display: 'flex', alignItems: 'center' }}>
            {userRoleData.length === 0 ? (
              <div className="chart-empty" style={{width: '100%'}}><i className="ri-pie-chart-line" /><p>No data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userRoleData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                    {userRoleData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="admin-charts-grid equal">
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3 className="admin-panel-title">Top Courses</h3>
              <p className="admin-panel-sub">By enrollment count</p>
            </div>
          </div>
          <div className="admin-chart-container">
            {courseBarData.length === 0 ? (
              <div className="chart-empty"><i className="ri-bar-chart-fill" /><p>No data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseBarData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--admin-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: 'var(--admin-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="enrollments" name="Enrollments" fill="var(--admin-accent-purple)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3 className="admin-panel-title">Recent Activity</h3>
              <p className="admin-panel-sub">Latest registered users</p>
            </div>
          </div>
          <div className="admin-table-wrapper" style={{ flex: 1 }}>
            <table className="admin-table">
              <tbody>
                {recentUsers.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="admin-flex-row">
                        <div className="admin-avatar" style={{width: 32, height: 32}}>
                          {u.name.charAt(0)}
                        </div>
                        <div className="admin-flex-col">
                          <span style={{fontWeight: 500}}>{u.name}</span>
                          <span className="admin-text-small">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{textAlign: 'right'}}>
                      <span className={`admin-badge ${u.role === 'admin' ? 'danger' : u.role === 'instructor' ? 'warning' : 'info'}`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentUsers.length === 0 && <p className="admin-text-small" style={{textAlign:'center', marginTop: 20}}>No users found</p>}
          </div>
        </div>
      </div>

      <div className="admin-charts-grid equal" style={{ marginTop: '24px' }}>
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3 className="admin-panel-title">Most Wishlisted Courses</h3>
              <p className="admin-panel-sub">By number of students</p>
            </div>
          </div>
          <div className="admin-chart-container">
            {wishlistBarData.length === 0 ? (
              <div className="chart-empty"><i className="ri-heart-3-line" /><p>No data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wishlistBarData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--admin-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'var(--admin-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="wishlists" name="Wishlists" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3 className="admin-panel-title">Top Revenue Courses</h3>
              <p className="admin-panel-sub">By total sales</p>
            </div>
          </div>
          <div className="admin-chart-container">
            {!analytics?.topPurchasedCourses?.length ? (
              <div className="chart-empty"><i className="ri-money-rupee-circle-line" /><p>No data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topPurchasedCourses.map(c => ({ name: c.title?.slice(0, 15) + '...', revenue: c.totalRevenue }))} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--admin-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'var(--admin-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill="var(--admin-accent-green)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
