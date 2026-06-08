import React, { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { SlideUp, StaggerContainer, StaggerItem, HoverCard, FadeIn } from './../common/MotionWrapper';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981'];

function StatCard({ label, value, icon, color, prefix = '', trend }) {
  return (
    <HoverCard className="saas-card premium-glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ color: '#888', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>{label}</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
            {prefix}{typeof value === 'number' ? value.toLocaleString() : (value ?? 0)}
          </div>
        </div>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
          <i className={icon} />
        </div>
      </div>
      {trend && (
        <div style={{ fontSize: '12px', color: trend.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {trend.startsWith('+') ? <i className="ri-arrow-up-line" /> : <i className="ri-arrow-down-line" />}
          {trend} from last month
        </div>
      )}
    </HoverCard>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px', backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
      <p style={{ color: '#888', margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color || '#fff' }}></div>
          <span style={{ color: '#ccc', fontSize: '14px' }}>{p.name}:</span>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AdminOverview({ analytics, users, courses, payments }) {

  // Revenue Area Chart Data
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

  const recentUsers = useMemo(() =>
    [...(users || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [users]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
      
      {/* ROW 1: EXECUTIVE KPI CARDS */}
      <div>
        <FadeIn duration={0.8}>
          <h2 className="saas-heading" style={{ fontSize: '24px', marginBottom: '24px' }}>Executive Summary</h2>
        </FadeIn>
        <StaggerContainer style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <StaggerItem><StatCard label="Total Revenue" value={analytics?.totalRevenue} icon="ri-money-rupee-circle-fill" color="#10b981" prefix="₹" trend="+12.4%" /></StaggerItem>
          <StaggerItem><StatCard label="Active Students" value={analytics?.totalStudents} icon="ri-user-smile-fill" color="#3b82f6" trend="+5.2%" /></StaggerItem>
          <StaggerItem><StatCard label="Total Enrollments" value={analytics?.totalEnrollments} icon="ri-graduation-cap-fill" color="#8b5cf6" trend="+8.1%" /></StaggerItem>
          <StaggerItem><StatCard label="Live Courses" value={analytics?.totalCourses} icon="ri-book-open-fill" color="#f59e0b" trend="+2.0%" /></StaggerItem>
        </StaggerContainer>
      </div>

      {/* ROW 2: REVENUE GROWTH | ENROLLMENT VELOCITY */}
      <StaggerContainer style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
        <StaggerItem className="saas-card premium-glass-panel" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Revenue Growth</h3>
            <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>Monthly recurring and one-time payments</p>
          </div>
          <div style={{ height: '300px' }}>
            {revenueData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}><i className="ri-bar-chart-2-line" style={{ marginRight: '8px' }} /> No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} dx={-10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </StaggerItem>

        <StaggerItem className="saas-card premium-glass-panel" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Enrollment Velocity</h3>
            <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>Daily new enrollments over 30 days</p>
          </div>
          <div style={{ height: '300px' }}>
            {!analytics?.enrollmentTrends?.length ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}><i className="ri-bar-chart-2-line" style={{ marginRight: '8px' }} /> No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.enrollmentTrends} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" name="Enrollments" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#8b5cf6', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* ROW 3: USER DISTRIBUTION | COURSE ANALYTICS */}
      <StaggerContainer style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
        
        {/* User Roles */}
        <StaggerItem className="saas-card premium-glass-panel" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>User Distribution</h3>
            <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>Breakdown of platform users</p>
          </div>
          <div style={{ height: '250px' }}>
            {userRoleData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}><i className="ri-pie-chart-line" style={{ marginRight: '8px' }} /> No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userRoleData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {userRoleData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
            {userRoleData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#888' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                {d.name}
              </div>
            ))}
          </div>
        </StaggerItem>

        {/* Top Courses */}
        <StaggerItem className="saas-card premium-glass-panel" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Course Analytics</h3>
            <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>Top performing courses by enrollment</p>
          </div>
          <div style={{ height: '250px' }}>
            {courseBarData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}><i className="ri-bar-chart-fill" style={{ marginRight: '8px' }} /> No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseBarData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#888" fontSize={11} tickLine={false} axisLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="enrollments" name="Enrollments" radius={[0, 4, 4, 0]} barSize={20}>
                    {courseBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* ROW 4: SYSTEM HEALTH | RECENT ACTIVITY */}
      <StaggerContainer style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
        
        {/* System Health */}
        <StaggerItem className="saas-card premium-glass-panel" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>System Health</h3>
            <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>Live platform status and resources</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="ri-server-fill" style={{ color: '#10b981' }}></i> Server Uptime</span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>99.99%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '99.9%', height: '100%', background: '#10b981' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="ri-database-2-fill" style={{ color: '#3b82f6' }}></i> Database Load</span>
                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>24%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '24%', height: '100%', background: '#3b82f6' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="ri-rocket-2-fill" style={{ color: '#f59e0b' }}></i> API Latency</span>
                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>42ms</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '15%', height: '100%', background: '#f59e0b' }}></div>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Recent Activity */}
        <StaggerItem className="saas-card premium-glass-panel" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Recent Registrations</h3>
            <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>Latest users joined the platform</p>
          </div>
          {recentUsers.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}><i className="ri-user-add-line" /> No recent users</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentUsers.map(u => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>{u.role}</div>
                  </div>
                  <div style={{ color: '#666', fontSize: '11px' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </StaggerItem>
      </StaggerContainer>

    </div>
  );
}
