import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { formatDate, timeAgo, isOverdue } from '../utils/helpers';
import './DashboardPage.css';

const StatCard = ({ label, value, icon, accent, sub }) => (
  <div className="stat-card" style={{ '--card-accent': accent }}>
    <div className="stat-card-icon" style={{ background: `${accent}18`, color: accent }}>
      {icon}
    </div>
    <div className="stat-card-body">
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  </div>
);

const StatusBar = ({ stats }) => {
  const total = (stats.todo || 0) + (stats['in-progress'] || 0) + (stats.review || 0) + (stats.done || 0);
  if (!total) return null;
  const pct = (n) => ((n / total) * 100).toFixed(1);

  return (
    <div className="status-bar-wrap">
      <div className="status-bar">
        {stats.todo > 0 && (
          <div className="status-bar-seg seg-todo" style={{ width: `${pct(stats.todo)}%` }} title={`To Do: ${stats.todo}`} />
        )}
        {stats['in-progress'] > 0 && (
          <div className="status-bar-seg seg-ip" style={{ width: `${pct(stats['in-progress'])}%` }} title={`In Progress: ${stats['in-progress']}`} />
        )}
        {stats.review > 0 && (
          <div className="status-bar-seg seg-review" style={{ width: `${pct(stats.review)}%` }} title={`Review: ${stats.review}`} />
        )}
        {stats.done > 0 && (
          <div className="status-bar-seg seg-done" style={{ width: `${pct(stats.done)}%` }} title={`Done: ${stats.done}`} />
        )}
      </div>
      <div className="status-legend">
        <span className="legend-item"><span className="legend-dot seg-todo" />To Do ({stats.todo || 0})</span>
        <span className="legend-item"><span className="legend-dot seg-ip" />In Progress ({stats['in-progress'] || 0})</span>
        <span className="legend-item"><span className="legend-dot seg-review" />Review ({stats.review || 0})</span>
        <span className="legend-item"><span className="legend-dot seg-done" />Done ({stats.done || 0})</span>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await userApi.getDashboardStats();
        setStats(res.data.stats);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>{getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Loading your workspace…</p>
        </div>
        <div className="grid grid-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1>{getGreeting()}, {user?.name?.split(' ')[0]}</h1>
        </div>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header dashboard-header">
        <div>
          <h1>{getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Here's what's happening in your workspace today.</p>
        </div>
        <div className="dashboard-header-actions">
          <Link to="/projects" className="btn btn-secondary btn-sm">View Projects</Link>
          <Link to="/tasks" className="btn btn-primary btn-sm">My Tasks</Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-4 gap-4" style={{ marginBottom: 28 }}>
        <StatCard
          label="Total Projects"
          value={stats.totalProjects}
          accent="var(--accent)"
          sub={`${stats.activeProjects} active`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2 7a2 2 0 012-2h4l2 3h10a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V7z" />
            </svg>
          }
        />
        <StatCard
          label="Total Tasks"
          value={stats.totalTasks}
          accent="var(--sky)"
          sub={`${stats.completionRate}% completed`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          }
        />
        <StatCard
          label="Overdue Tasks"
          value={stats.overdueTasks}
          accent="var(--rose)"
          sub={stats.overdueTasks > 0 ? 'Needs attention' : 'All on track!'}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          label={user?.role === 'admin' ? 'Done Tasks' : 'Assigned to Me'}
          value={user?.role === 'admin' ? (stats.tasksByStatus?.done || 0) : stats.myTasks}
          accent="var(--emerald)"
          sub={`${stats.tasksByStatus?.['in-progress'] || 0} in progress`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
      </div>

      {/* Task Status Overview */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3>Task Status Overview</h3>
            <Link to="/tasks" className="card-header-link">View All →</Link>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="completion-ring-row">
              <div className="completion-ring">
                <svg viewBox="0 0 100 100" width="100" height="100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-overlay)" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 40 * stats.completionRate / 100} ${2 * Math.PI * 40}`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                  />
                  <text x="50" y="54" textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="700" fontFamily="Syne">
                    {stats.completionRate}%
                  </text>
                </svg>
              </div>
              <div className="completion-details">
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
                  {stats.tasksByStatus?.done || 0} of {stats.totalTasks} tasks completed
                </p>
                <StatusBar stats={stats.tasksByStatus || {}} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Tasks</h3>
            <Link to="/tasks" className="card-header-link">View All →</Link>
          </div>
          <div className="recent-tasks">
            {stats.recentTasks?.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p>No tasks yet. Create your first task!</p>
              </div>
            ) : (
              stats.recentTasks?.map((task) => (
                <div key={task._id} className="recent-task-item">
                  <div className="recent-task-dot" style={{
                    background: task.status === 'done' ? 'var(--emerald)'
                      : task.status === 'in-progress' ? 'var(--sky)'
                      : task.status === 'review' ? 'var(--amber)'
                      : 'var(--text-muted)'
                  }} />
                  <div className="recent-task-info">
                    <span className="recent-task-title">{task.title}</span>
                    <span className="recent-task-meta">
                      {task.project?.name} · {timeAgo(task.createdAt)}
                      {isOverdue(task.dueDate, task.status) && (
                        <span className="overdue-pill">Overdue</span>
                      )}
                    </span>
                  </div>
                  <span className={`badge badge-${task.status}`}>
                    {task.status === 'in-progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : task.status === 'review' ? 'Review' : 'Done'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="quick-action-grid">
          <Link to="/projects" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M2 7a2 2 0 012-2h4l2 3h10a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V7z" />
              </svg>
            </div>
            <span>Manage Projects</span>
          </Link>
          <Link to="/tasks" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: 'var(--sky-dim)', color: 'var(--sky)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <span>All Tasks</span>
          </Link>
          <Link to="/tasks?overdue=true" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: 'var(--rose-dim)', color: 'var(--rose)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span>Overdue Tasks</span>
          </Link>
          <Link to="/profile" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: 'var(--emerald-dim)', color: 'var(--emerald)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}