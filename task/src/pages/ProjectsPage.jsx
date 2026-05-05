import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { projectApi } from '../api/projectApi';
import { useAuth } from '../context/AuthContext';
import { formatDate, isOverdue } from '../utils/helpers';
import ProjectFormModal from '../components/projects/ProjectFormModal';
import ConfirmModal from '../components/common/ConfirmModal';

const STATUS_COLORS = {
  active: 'badge-active',
  completed: 'badge-completed',
  'on-hold': 'badge-on-hold',
  archived: 'badge-archived',
};

const PRIORITY_COLORS = {
  low: 'badge-low',
  medium: 'badge-medium',
  high: 'badge-high',
  critical: 'badge-critical',
};

/* ─── Inline premium styles injected once ─────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --bg: #080c14;
    --bg2: #0d1220;
    --surface: #111827;
    --surface2: #161f30;
    --border: rgba(255,255,255,0.07);
    --border-hover: rgba(255,255,255,0.14);
    --text: #f0f4ff;
    --text-2: #8b9ab8;
    --text-3: #4a5568;
    --accent: #6366f1;
    --accent2: #818cf8;
    --accent-glow: rgba(99,102,241,0.35);
    --green: #10b981;
    --green-dim: rgba(16,185,129,0.12);
    --amber: #f59e0b;
    --amber-dim: rgba(245,158,11,0.12);
    --rose: #f43f5e;
    --rose-dim: rgba(244,63,94,0.12);
    --sky: #38bdf8;
    --sky-dim: rgba(56,189,248,0.12);
    --violet: #a78bfa;
    --violet-dim: rgba(167,139,250,0.12);
    --radius: 14px;
    --radius-sm: 8px;
    --radius-lg: 20px;
    --font-display: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --shadow-card: 0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset;
    --shadow-hover: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.25), 0 1px 0 rgba(255,255,255,0.06) inset;
    --transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  }

  .pj-page * { box-sizing: border-box; }

  .pj-page {
    font-family: var(--font-body);
    color: var(--text);
    min-height: 100%;
    padding: 0;
  }

  /* ── Header ── */
  .pj-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 28px;
    gap: 16px;
    flex-wrap: wrap;
  }
  .pj-title-block {}
  .pj-title {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--text);
    line-height: 1;
    margin: 0 0 6px;
  }
  .pj-subtitle {
    font-size: 0.8rem;
    color: var(--text-3);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pj-subtitle::before {
    content: '';
    width: 4px; height: 4px;
    border-radius: 50%;
    background: var(--accent2);
    display: inline-block;
  }

  /* ── New Project btn ── */
  .btn-new-project {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: var(--radius-sm);
    padding: 10px 18px;
    font-family: var(--font-display);
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--transition);
    box-shadow: 0 0 0 0 var(--accent-glow);
  }
  .btn-new-project::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent 60%);
    pointer-events: none;
  }
  .btn-new-project:hover {
    background: #4f52e8;
    box-shadow: 0 0 20px var(--accent-glow), 0 4px 12px rgba(0,0,0,0.3);
    transform: translateY(-1px);
  }
  .btn-new-project:active { transform: translateY(0); }

  /* ── Filter bar ── */
  .pj-filters {
    display: flex;
    gap: 10px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .pj-search-wrap {
    position: relative;
    flex: 1;
    min-width: 220px;
  }
  .pj-search-icon {
    position: absolute;
    left: 13px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-3);
    pointer-events: none;
  }
  .pj-input {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 12px 10px 38px;
    color: var(--text);
    font-family: var(--font-body);
    font-size: 0.85rem;
    outline: none;
    transition: var(--transition);
  }
  .pj-input::placeholder { color: var(--text-3); }
  .pj-input:focus {
    border-color: var(--accent);
    background: var(--surface2);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }
  .pj-select {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 36px 10px 12px;
    color: var(--text-2);
    font-family: var(--font-body);
    font-size: 0.85rem;
    outline: none;
    cursor: pointer;
    transition: var(--transition);
    min-width: 140px;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a5568' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }
  .pj-select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }
  .pj-select option { background: var(--surface2); }

  /* ── Grid ── */
  .pj-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }

  /* ── Skeleton ── */
  .pj-skeleton {
    height: 260px;
    border-radius: var(--radius-lg);
    background: linear-gradient(90deg, var(--surface) 25%, var(--surface2) 50%, var(--surface) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
  }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* ── Empty state ── */
  .pj-empty {
    grid-column: 1/-1;
    text-align: center;
    padding: 80px 24px;
  }
  .pj-empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.4;
    filter: grayscale(1);
  }
  .pj-empty h3 {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-2);
    margin: 0 0 8px;
  }
  .pj-empty p { color: var(--text-3); font-size: 0.85rem; margin: 0 0 20px; }

  /* ── Card ── */
  .pj-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 0;
    cursor: default;
    transition: var(--transition);
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-card);
    animation: cardIn 0.4s ease both;
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pj-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
    pointer-events: none;
  }
  .pj-card:hover {
    border-color: var(--border-hover);
    transform: translateY(-3px);
    box-shadow: var(--shadow-hover);
  }
  .pj-card:hover .pj-card-actions { opacity: 1; }

  /* color strip */
  .pj-color-strip {
    position: absolute;
    top: 0; left: 0;
    width: 3px; height: 100%;
    border-radius: 4px 0 0 4px;
  }

  /* top row */
  .pj-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    padding-left: 12px;
  }
  .pj-card-meta { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .pj-avatar {
    width: 42px; height: 42px;
    border-radius: 10px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 800;
    color: #fff;
    position: relative;
    letter-spacing: -0.02em;
  }
  .pj-avatar::after {
    content: '';
    position: absolute; inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 -2px 0 rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2);
  }
  .pj-card-name {
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
    margin-bottom: 5px;
  }
  .pj-badges { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }

  /* badges */
  .pj-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 100px;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border: 1px solid transparent;
  }
  .pj-badge-active    { background: var(--green-dim); color: var(--green); border-color: rgba(16,185,129,0.2); }
  .pj-badge-completed { background: var(--sky-dim); color: var(--sky); border-color: rgba(56,189,248,0.2); }
  .pj-badge-on-hold   { background: var(--amber-dim); color: var(--amber); border-color: rgba(245,158,11,0.2); }
  .pj-badge-archived  { background: rgba(255,255,255,0.05); color: var(--text-3); border-color: var(--border); }
  .pj-badge-low       { background: var(--green-dim); color: var(--green); border-color: rgba(16,185,129,0.2); }
  .pj-badge-medium    { background: var(--sky-dim); color: var(--sky); border-color: rgba(56,189,248,0.2); }
  .pj-badge-high      { background: var(--amber-dim); color: var(--amber); border-color: rgba(245,158,11,0.2); }
  .pj-badge-critical  { background: var(--rose-dim); color: var(--rose); border-color: rgba(244,63,94,0.2); }

  /* action btns */
  .pj-card-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.15s;
    flex-shrink: 0;
  }
  .pj-icon-btn {
    width: 30px; height: 30px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text-2);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition);
  }
  .pj-icon-btn:hover { border-color: var(--border-hover); color: var(--text); background: rgba(255,255,255,0.06); }
  .pj-icon-btn.danger:hover { border-color: rgba(244,63,94,0.35); background: var(--rose-dim); color: var(--rose); }

  /* description */
  .pj-desc {
    font-size: 0.8rem;
    color: var(--text-3);
    line-height: 1.55;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    padding-left: 12px;
    margin-bottom: 16px;
  }

  /* stats row */
  .pj-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding-left: 12px;
    margin-bottom: 16px;
  }
  .pj-stat {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 8px;
    text-align: center;
  }
  .pj-stat-val {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 4px;
    letter-spacing: -0.02em;
  }
  .pj-stat-lbl {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
    color: var(--text-3);
  }
  .stat-danger { color: var(--rose); }
  .stat-normal { color: var(--text); }

  /* progress */
  .pj-progress-wrap {
    padding-left: 12px;
    margin-bottom: 16px;
  }
  .pj-progress-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 7px;
  }
  .pj-progress-label { font-size: 0.72rem; color: var(--text-3); font-weight: 500; }
  .pj-progress-pct {
    font-family: var(--font-display);
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--accent2);
  }
  .pj-track {
    height: 5px;
    background: rgba(255,255,255,0.06);
    border-radius: 100px;
    overflow: hidden;
  }
  .pj-fill {
    height: 100%;
    border-radius: 100px;
    background: linear-gradient(90deg, var(--accent), var(--violet));
    transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
    position: relative;
  }
  .pj-fill::after {
    content: '';
    position: absolute;
    right: 0; top: 0; bottom: 0;
    width: 8px;
    background: rgba(255,255,255,0.4);
    filter: blur(2px);
  }

  /* divider */
  .pj-divider {
    height: 1px;
    background: var(--border);
    margin: 0 0 14px;
    margin-left: 12px;
  }

  /* footer */
  .pj-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 12px;
  }
  .pj-members { display: flex; align-items: center; margin-right: 8px; }
  .pj-member-avatar {
    width: 24px; height: 24px;
    border-radius: 50%;
    border: 2px solid var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
    background: var(--accent);
    margin-left: -6px;
    transition: transform 0.15s;
  }
  .pj-members:hover .pj-member-avatar { transform: translateX(-2px); }
  .pj-member-avatar:first-child { margin-left: 0; }
  .pj-member-overflow {
    width: 24px; height: 24px;
    border-radius: 50%;
    border: 2px solid var(--surface);
    background: rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    color: var(--text-3);
    font-weight: 600;
    margin-left: -6px;
    flex-shrink: 0;
  }
  .pj-footer-right { display: flex; align-items: center; gap: 12px; }
  .pj-due {
    font-size: 0.7rem;
    color: var(--text-3);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .pj-due.overdue { color: var(--rose); }
  .pj-open-link {
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--accent2);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: var(--transition);
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid rgba(129,140,248,0.25);
    background: rgba(99,102,241,0.08);
  }
  .pj-open-link:hover {
    background: rgba(99,102,241,0.2);
    border-color: rgba(129,140,248,0.5);
    color: #fff;
    transform: translateX(2px);
  }
`;

function InjectStyles() {
  useEffect(() => {
    if (document.getElementById('pj-premium-styles')) return;
    const el = document.createElement('style');
    el.id = 'pj-premium-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
  return null;
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await projectApi.getAll();
      setProjects(res.data.projects);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSaved = (saved, isEdit) => {
    if (isEdit) {
      setProjects((p) => p.map((x) => (x._id === saved._id ? saved : x)));
      toast.success('Project updated!');
    } else {
      setProjects((p) => [saved, ...p]);
      toast.success('Project created!');
    }
    setShowForm(false);
    setEditProject(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await projectApi.delete(deleteTarget._id);
      setProjects((p) => p.filter((x) => x._id !== deleteTarget._id));
      toast.success('Project deleted.');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? p.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="pj-page">
      <InjectStyles />

      {/* ── Header ── */}
      <div className="pj-header">
        <div className="pj-title-block">
          <h1 className="pj-title">Projects</h1>
          <p className="pj-subtitle">{projects.length} total projects</p>
        </div>
        {isAdmin && (
          <button
            className="btn-new-project"
            onClick={() => { setEditProject(null); setShowForm(true); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Project
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="pj-filters">
        <div className="pj-search-wrap">
          <svg className="pj-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="pj-input"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="pj-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="pj-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="pj-skeleton" style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="pj-grid">
          <div className="pj-empty">
            <div className="pj-empty-icon">📁</div>
            <h3>No projects found</h3>
            <p>
              {search || filterStatus
                ? 'Try adjusting your filters.'
                : isAdmin
                  ? 'Create your first project to get started.'
                  : 'You have no projects assigned yet.'}
            </p>
            {isAdmin && !search && !filterStatus && (
              <button className="btn-new-project" onClick={() => setShowForm(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create Project
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="pj-grid">
          {filtered.map((project, idx) => (
            <ProjectCard
              key={project._id}
              project={project}
              isAdmin={isAdmin}
              index={idx}
              onEdit={() => { setEditProject(project); setShowForm(true); }}
              onDelete={() => setDeleteTarget(project)}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {showForm && (
        <ProjectFormModal
          project={editProject}
          onClose={() => { setShowForm(false); setEditProject(null); }}
          onSaved={handleSaved}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Project"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This will permanently delete all tasks within this project.`}
          confirmLabel="Delete Project"
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

/* ─── ProjectCard ──────────────────────────────────────────────────── */
const STATUS_BADGE = {
  active: 'pj-badge pj-badge-active',
  completed: 'pj-badge pj-badge-completed',
  'on-hold': 'pj-badge pj-badge-on-hold',
  archived: 'pj-badge pj-badge-archived',
};
const PRIORITY_BADGE = {
  low: 'pj-badge pj-badge-low',
  medium: 'pj-badge pj-badge-medium',
  high: 'pj-badge pj-badge-high',
  critical: 'pj-badge pj-badge-critical',
};

/* Deterministic color per project based on name */
const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#818cf8)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#f43f5e,#fb7185)',
  'linear-gradient(135deg,#38bdf8,#7dd3fc)',
  'linear-gradient(135deg,#a78bfa,#c4b5fd)',
  'linear-gradient(135deg,#ec4899,#f472b6)',
];
const STRIP_COLORS = ['#6366f1','#10b981','#f59e0b','#f43f5e','#38bdf8','#a78bfa','#ec4899'];

function nameToIndex(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % AVATAR_COLORS.length;
}

function ProjectCard({ project, isAdmin, onEdit, onDelete, index }) {
  const progress = project.taskStats?.total > 0
    ? Math.round((project.taskStats.done / project.taskStats.total) * 100)
    : 0;

  const colorIdx = nameToIndex(project.name);
  const avatarBg = project.color ? project.color : AVATAR_COLORS[colorIdx];
  const stripColor = project.color ? project.color : STRIP_COLORS[colorIdx];

  return (
    <div
      className="pj-card"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* color strip */}
      <div className="pj-color-strip" style={{ background: stripColor }} />

      {/* top row */}
      <div className="pj-card-top">
        <div className="pj-card-meta">
          <div className="pj-avatar" style={{ background: avatarBg }}>
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="pj-card-name">{project.name}</div>
            <div className="pj-badges">
              <span className={STATUS_BADGE[project.status] || 'pj-badge'}>
                {project.status.replace('-', ' ')}
              </span>
              <span className={PRIORITY_BADGE[project.priority] || 'pj-badge'}>
                {project.priority}
              </span>
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="pj-card-actions">
            <button
              className="pj-icon-btn"
              onClick={(e) => { e.preventDefault(); onEdit(); }}
              title="Edit project"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              className="pj-icon-btn danger"
              onClick={(e) => { e.preventDefault(); onDelete(); }}
              title="Delete project"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* description */}
      {project.description && (
        <p className="pj-desc">{project.description}</p>
      )}

      {/* stats */}
      <div className="pj-stats">
        {[
          { label: 'Total', value: project.taskStats?.total || 0, danger: false },
          { label: 'Done', value: project.taskStats?.done || 0, danger: false },
          { label: 'Overdue', value: project.overdueCount || 0, danger: (project.overdueCount || 0) > 0 },
        ].map((s) => (
          <div key={s.label} className="pj-stat">
            <div className={`pj-stat-val ${s.danger ? 'stat-danger' : 'stat-normal'}`}>{s.value}</div>
            <div className="pj-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* progress */}
      <div className="pj-progress-wrap">
        <div className="pj-progress-row">
          <span className="pj-progress-label">Progress</span>
          <span className="pj-progress-pct">{progress}%</span>
        </div>
        <div className="pj-track">
          <div className="pj-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="pj-divider" />

      {/* footer */}
      <div className="pj-footer">
        <div className="pj-members">
          {project.members?.slice(0, 4).map((m, idx) => (
            <div
              key={m.user?._id || idx}
              className="pj-member-avatar"
              style={{
                background: AVATAR_COLORS[nameToIndex(m.user?.name || String(idx))],
                zIndex: 10 - idx,
              }}
              title={m.user?.name}
            >
              {m.user?.name?.charAt(0).toUpperCase()}
            </div>
          ))}
          {project.members?.length > 4 && (
            <div className="pj-member-overflow">+{project.members.length - 4}</div>
          )}
        </div>
        <div className="pj-footer-right">
          {project.dueDate && (
            <span className={`pj-due ${isOverdue(project.dueDate, project.status) ? 'overdue' : ''}`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(project.dueDate)}
            </span>
          )}
          <Link to={`/projects/${project._id}`} className="pj-open-link">
            Open
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}