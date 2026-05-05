import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { taskApi } from '../api/taskApi';
import { useAuth } from '../context/AuthContext';
import { formatDate, getInitials, getAvatarColor, isOverdue, STATUS_LABELS, PRIORITY_LABELS } from '../utils/helpers';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import ConfirmModal from '../components/common/ConfirmModal';

const PRIORITY_COLOR = { low: '#10b981', medium: '#38bdf8', high: '#f59e0b', critical: '#f43f5e' };
const PRIORITY_GLOW  = { low: 'rgba(16,185,129,0.5)', medium: 'rgba(56,189,248,0.5)', high: 'rgba(245,158,11,0.5)', critical: 'rgba(244,63,94,0.5)' };

/* ═══════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

:root {
  --bg:#080c14; --bg2:#0d1220;
  --surface:#111827; --surface2:#161f30; --elevated:#0f1623;
  --border:rgba(255,255,255,0.07); --border-h:rgba(255,255,255,0.13);
  --text:#f0f4ff; --text2:#8b9ab8; --text3:#4a5568;
  --accent:#6366f1; --accent2:#818cf8; --accent-glow:rgba(99,102,241,0.3);
  --green:#10b981; --green-d:rgba(16,185,129,0.12);
  --amber:#f59e0b; --amber-d:rgba(245,158,11,0.12);
  --rose:#f43f5e;  --rose-d:rgba(244,63,94,0.12);
  --sky:#38bdf8;   --sky-d:rgba(56,189,248,0.12);
  --violet:#a78bfa;
  --r:14px; --r-sm:8px; --r-lg:20px;
  --font-d:'Syne',sans-serif; --font-b:'DM Sans',sans-serif;
  --sh-card:0 4px 24px rgba(0,0,0,0.4),0 1px 0 rgba(255,255,255,0.04) inset;
  --sh-hover:0 8px 32px rgba(0,0,0,0.45),0 0 0 1px rgba(99,102,241,0.2);
  --ease:all 0.2s cubic-bezier(0.4,0,0.2,1);
}

.tk-page * { box-sizing:border-box; }
.tk-page { font-family:var(--font-b); color:var(--text); display:flex; flex-direction:column; gap:24px; }

/* ── header ── */
.tk-header { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:12px; }
.tk-title { font-family:var(--font-d); font-size:2rem; font-weight:800; letter-spacing:-0.03em; color:var(--text); line-height:1; margin:0 0 6px; }
.tk-subtitle { font-size:0.78rem; color:var(--text3); letter-spacing:0.06em; text-transform:uppercase; font-weight:600; display:flex; align-items:center; gap:7px; }
.tk-subtitle::before { content:''; width:4px; height:4px; border-radius:50%; background:var(--accent2); display:inline-block; }

/* overdue toggle */
.tk-overdue-btn {
  display:inline-flex; align-items:center; gap:7px;
  border-radius:var(--r-sm); padding:8px 14px; cursor:pointer;
  font-family:var(--font-d); font-size:0.8rem; font-weight:700;
  letter-spacing:0.02em; border:1px solid; transition:var(--ease);
}
.tk-overdue-btn.off {
  background:var(--surface); border-color:var(--border); color:var(--text2);
}
.tk-overdue-btn.off:hover { border-color:var(--border-h); color:var(--text); }
.tk-overdue-btn.on {
  background:var(--rose-d); border-color:rgba(244,63,94,0.35); color:var(--rose);
}
.tk-overdue-btn.on:hover { background:rgba(244,63,94,0.2); border-color:rgba(244,63,94,0.5); }
.tk-od-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.tk-od-dot.active { background:var(--rose); box-shadow:0 0 6px var(--rose); }
.tk-od-dot.inactive { background:var(--text3); }

/* ── stats strip ── */
.tk-stats { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; }
@media(max-width:900px){ .tk-stats{ grid-template-columns:repeat(3,1fr); } }
@media(max-width:500px){ .tk-stats{ grid-template-columns:repeat(2,1fr); } }
.tk-stat {
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--r); padding:14px 10px; text-align:center;
  box-shadow:var(--sh-card); transition:var(--ease); cursor:default;
  position:relative; overflow:hidden;
}
.tk-stat::before {
  content:''; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent);
}
.tk-stat:hover { border-color:var(--border-h); transform:translateY(-2px); box-shadow:var(--sh-hover); }
.tk-stat-val { font-family:var(--font-d); font-size:1.55rem; font-weight:800; letter-spacing:-0.04em; line-height:1; margin-bottom:5px; }
.tk-stat-lbl { font-size:0.6rem; text-transform:uppercase; letter-spacing:0.09em; font-weight:700; color:var(--text3); }

/* ── filters ── */
.tk-filters { display:flex; gap:8px; flex-wrap:wrap; }
.tk-search-wrap { position:relative; flex:1; min-width:200px; }
.tk-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text3); pointer-events:none; }
.tk-input {
  width:100%; background:var(--surface); border:1px solid var(--border);
  border-radius:var(--r-sm); padding:9px 12px 9px 36px;
  color:var(--text); font-family:var(--font-b); font-size:0.82rem;
  outline:none; transition:var(--ease);
}
.tk-input::placeholder { color:var(--text3); }
.tk-input:focus { border-color:var(--accent); background:var(--surface2); box-shadow:0 0 0 3px var(--accent-glow); }
.tk-sel {
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--r-sm); padding:9px 30px 9px 11px;
  color:var(--text2); font-family:var(--font-b); font-size:0.82rem;
  outline:none; cursor:pointer; transition:var(--ease);
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%234a5568' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 9px center;
}
.tk-sel:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-glow); }
.tk-sel option { background:var(--surface2); }

/* ── skeleton ── */
.tk-skel {
  border-radius:var(--r-sm);
  background:linear-gradient(90deg,var(--surface) 25%,var(--surface2) 50%,var(--surface) 75%);
  background-size:200% 100%;
  animation:tk-shim 1.6s infinite;
}
@keyframes tk-shim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── empty ── */
.tk-empty {
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--r-lg); box-shadow:var(--sh-card);
  display:flex; flex-direction:column; align-items:center;
  justify-content:center; padding:72px 24px; gap:10px;
}
.tk-empty-icon { font-size:2.8rem; opacity:0.3; filter:grayscale(1); }
.tk-empty h3 { font-family:var(--font-d); font-size:1.05rem; font-weight:700; color:var(--text2); margin:0; }
.tk-empty p  { font-size:0.82rem; color:var(--text3); margin:0; }

/* ── table wrap ── */
.tk-table-wrap {
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--r-lg); overflow:hidden; box-shadow:var(--sh-card);
}
.tk-overflow { overflow-x:auto; }
.tk-table { width:100%; border-collapse:collapse; min-width:740px; }
.tk-table thead tr { border-bottom:1px solid var(--border); }
.tk-table th {
  text-align:left; font-family:var(--font-d); font-size:0.65rem;
  font-weight:700; text-transform:uppercase; letter-spacing:0.1em;
  color:var(--text3); padding:12px 16px; white-space:nowrap;
  background:rgba(255,255,255,0.01);
}
.tk-table tbody tr {
  border-bottom:1px solid rgba(255,255,255,0.035);
  transition:var(--ease); cursor:pointer; position:relative;
}
.tk-table tbody tr:last-child { border-bottom:none; }
.tk-table tbody tr:hover { background:rgba(255,255,255,0.025); }
.tk-table tbody tr:hover .tk-row-indicator { opacity:1; }
.tk-table td { padding:11px 16px; vertical-align:middle; }

/* row left indicator */
.tk-row-indicator {
  position:absolute; left:0; top:0; bottom:0;
  width:3px; border-radius:0 2px 2px 0;
  opacity:0; transition:opacity 0.2s;
}

/* task title cell */
.tk-cell-task { display:flex; align-items:center; gap:8px; max-width:240px; }
.tk-pri-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.tk-task-name { font-size:0.84rem; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tk-overdue-dot { width:5px; height:5px; border-radius:50%; background:var(--rose); box-shadow:0 0 4px var(--rose); flex-shrink:0; }

/* project cell */
.tk-cell-proj { display:flex; align-items:center; gap:7px; }
.tk-proj-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.tk-proj-name { font-size:0.78rem; color:var(--text2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px; }
.tk-proj-none { font-size:0.78rem; color:var(--text3); }

/* status select cell */
.tk-status-wrap { display:flex; align-items:center; gap:7px; }
.tk-status-sel {
  background:transparent; border:none; outline:none; cursor:pointer;
  font-family:var(--font-b); font-size:0.78rem; color:var(--text2);
  padding:0; max-width:90px;
  appearance:none;
}
.tk-status-sel option { background:var(--surface2); }

/* badge */
.tk-badge {
  display:inline-flex; align-items:center; padding:2px 8px;
  border-radius:100px; font-size:0.66rem; font-weight:700;
  letter-spacing:0.05em; text-transform:uppercase; border:1px solid transparent;
  white-space:nowrap;
}
.bd-todo       { background:rgba(139,154,184,0.1); color:#8b9ab8; border-color:rgba(139,154,184,0.15); }
.bd-in-progress{ background:rgba(56,189,248,0.12); color:#38bdf8; border-color:rgba(56,189,248,0.2); }
.bd-review     { background:rgba(245,158,11,0.12); color:#f59e0b; border-color:rgba(245,158,11,0.2); }
.bd-done       { background:rgba(16,185,129,0.12); color:#10b981; border-color:rgba(16,185,129,0.2); }
.bd-low        { background:rgba(16,185,129,0.12); color:#10b981; border-color:rgba(16,185,129,0.2); }
.bd-medium     { background:rgba(56,189,248,0.12); color:#38bdf8; border-color:rgba(56,189,248,0.2); }
.bd-high       { background:rgba(245,158,11,0.12); color:#f59e0b; border-color:rgba(245,158,11,0.2); }
.bd-critical   { background:rgba(244,63,94,0.12);  color:#f43f5e; border-color:rgba(244,63,94,0.2); }

/* assignee cell */
.tk-cell-assignee { display:flex; align-items:center; gap:8px; }
.tk-assignee-avatar {
  width:26px; height:26px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:0.58rem; font-weight:700; color:#fff;
}
.tk-assignee-name { font-size:0.8rem; color:var(--text2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px; }
.tk-unassigned { font-size:0.78rem; color:var(--text3); font-style:italic; }

/* due date cell */
.tk-due { font-size:0.8rem; color:var(--text3); white-space:nowrap; }
.tk-due.overdue { color:var(--rose); font-weight:700; }

/* delete button */
.tk-del-btn {
  width:30px; height:30px; border-radius:var(--r-sm);
  border:1px solid var(--border); background:transparent;
  color:var(--text3); display:flex; align-items:center;
  justify-content:center; cursor:pointer; transition:var(--ease);
}
.tk-del-btn:hover { border-color:rgba(244,63,94,0.35); background:var(--rose-d); color:var(--rose); }

/* table footer count */
.tk-table-footer {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 16px; border-top:1px solid var(--border);
  background:rgba(255,255,255,0.01);
}
.tk-table-count { font-size:0.72rem; color:var(--text3); font-family:var(--font-d); font-weight:600; letter-spacing:0.04em; }

/* fade-in */
@keyframes tk-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
.tk-fadein { animation:tk-fadein 0.35s ease both; }
`;

/* ── avatar gradient helpers ── */
const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#818cf8)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#f43f5e,#fb7185)',
  'linear-gradient(135deg,#38bdf8,#7dd3fc)',
  'linear-gradient(135deg,#a78bfa,#c4b5fd)',
  'linear-gradient(135deg,#ec4899,#f472b6)',
];
function nameToIdx(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % AVATAR_COLORS.length;
}
function avatarGrad(name) { return AVATAR_COLORS[nameToIdx(name)]; }

function InjectStyles() {
  useEffect(() => {
    if (document.getElementById('tk-premium-styles')) return;
    const el = document.createElement('style');
    el.id = 'tk-premium-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
  return null;
}

/* STATUS_LABELS / PRIORITY_LABELS fallbacks if not exported from helpers */
const S_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', review: 'In Review', done: 'Done' };
const P_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

/* ═══════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════ */
export default function TasksPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [showOverdue, setShowOverdue]   = useState(searchParams.get('overdue') === 'true');
  const [viewTask, setViewTask]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [sortBy, setSortBy]             = useState('createdAt');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (showOverdue) params.overdue = 'true';
      const res = await taskApi.getAllTasks(params);
      setTasks(res.data.tasks);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [showOverdue]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await taskApi.updateStatus(taskId, newStatus);
      setTasks((t) => t.map((x) => (x._id === taskId ? res.data.task : x)));
      if (viewTask?._id === taskId) setViewTask(res.data.task);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await taskApi.delete(deleteTarget._id);
      setTasks((t) => t.filter((x) => x._id !== deleteTarget._id));
      setDeleteTarget(null);
      setViewTask(null);
      toast.success('Task deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  /* ── client-side filter + sort (unchanged logic) ── */
  const filtered = tasks
    .filter((t) => {
      if (search       && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus   && t.status        !== filterStatus)    return false;
      if (filterPriority && t.priority      !== filterPriority)  return false;
      if (filterAssignee === 'me'         && t.assignedTo?._id !== user?._id) return false;
      if (filterAssignee === 'unassigned' && t.assignedTo)                    return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate')  return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      if (sortBy === 'priority') {
        const o = { critical:3, high:2, medium:1, low:0 };
        return o[b.priority] - o[a.priority];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const statsBar = {
    total:      tasks.length,
    todo:       tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    review:     tasks.filter((t) => t.status === 'review').length,
    done:       tasks.filter((t) => t.status === 'done').length,
    overdue:    tasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
  };

  const sl = STATUS_LABELS   || S_LABELS;
  const pl = PRIORITY_LABELS || P_LABELS;

  return (
    <div className="tk-page">
      <InjectStyles />

      {/* ── Header ── */}
      <div className="tk-header tk-fadein">
        <div>
          <h1 className="tk-title">All Tasks</h1>
          <p className="tk-subtitle">{filtered.length} of {tasks.length} tasks</p>
        </div>
        <button
          className={`tk-overdue-btn ${showOverdue ? 'on' : 'off'}`}
          onClick={() => setShowOverdue((v) => !v)}
        >
          <div className={`tk-od-dot ${showOverdue ? 'active' : 'inactive'}`} />
          {showOverdue ? 'Showing Overdue' : 'Show Overdue'}
        </button>
      </div>

      {/* ── Stats strip ── */}
      <div className="tk-stats tk-fadein" style={{ animationDelay:'0.05s' }}>
        {[
          { label:'Total',       value:statsBar.total,      color:'var(--text)'  },
          { label:'To Do',       value:statsBar.todo,       color:'var(--text2)' },
          { label:'In Progress', value:statsBar.inProgress, color:'var(--sky)'   },
          { label:'Review',      value:statsBar.review,     color:'var(--amber)' },
          { label:'Done',        value:statsBar.done,       color:'var(--green)' },
          { label:'Overdue',     value:statsBar.overdue,    color:'var(--rose)'  },
        ].map((s) => (
          <div key={s.label} className="tk-stat">
            <div className="tk-stat-val" style={{ color:s.color }}>{s.value}</div>
            <div className="tk-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="tk-filters tk-fadein" style={{ animationDelay:'0.1s' }}>
        <div className="tk-search-wrap">
          <svg className="tk-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="tk-input"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="tk-sel" value={filterStatus}   onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {Object.entries(sl).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="tk-sel" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priority</option>
          {Object.entries(pl).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="tk-sel" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
          <option value="">All Assignees</option>
          <option value="me">Assigned to Me</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <select className="tk-sel" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="createdAt">Newest First</option>
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
        </select>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="tk-skel" style={{ height:52, animationDelay:`${i*0.07}s` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="tk-empty tk-fadein">
          <div className="tk-empty-icon">✅</div>
          <h3>No tasks found</h3>
          <p>Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="tk-table-wrap tk-fadein" style={{ animationDelay:'0.12s' }}>
          <div className="tk-overflow">
            <table className="tk-table">
              <thead>
                <tr>
                  {['Task','Project','Status','Priority','Assigned To','Due Date',''].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((task, idx) => {
                  const over = isOverdue(task.dueDate, task.status);
                  const priColor = PRIORITY_COLOR[task.priority] || '#8b9ab8';
                  return (
                    <tr
                      key={task._id}
                      style={{ animationDelay:`${idx * 0.025}s` }}
                      onClick={() => setViewTask(task)}
                    >
                      {/* left indicator strip */}
                      <td style={{ position:'relative', paddingLeft:20 }}>
                        <div
                          className="tk-row-indicator"
                          style={{ background: priColor, boxShadow:`0 0 6px ${PRIORITY_GLOW[task.priority]}` }}
                        />
                        <div className="tk-cell-task">
                          <div
                            className="tk-pri-dot"
                            style={{ background:priColor, boxShadow:`0 0 5px ${PRIORITY_GLOW[task.priority]}` }}
                          />
                          <span className="tk-task-name">{task.title}</span>
                          {over && <div className="tk-overdue-dot" />}
                        </div>
                      </td>

                      {/* project */}
                      <td>
                        {task.project ? (
                          <div className="tk-cell-proj">
                            <div className="tk-proj-dot" style={{ background: task.project.color || '#6366f1', boxShadow:`0 0 4px ${task.project.color || '#6366f1'}80` }} />
                            <span className="tk-proj-name">{task.project.name}</span>
                          </div>
                        ) : (
                          <span className="tk-proj-none">—</span>
                        )}
                      </td>

                      {/* status — inline select + badge */}
                      <td>
                        <div className="tk-status-wrap">
                          <select
                            className="tk-status-sel"
                            value={task.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => { e.stopPropagation(); handleStatusChange(task._id, e.target.value); }}
                          >
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                          </select>
                          <span className={`tk-badge bd-${task.status}`}>
                            {S_LABELS[task.status] || task.status}
                          </span>
                        </div>
                      </td>

                      {/* priority */}
                      <td>
                        <span className={`tk-badge bd-${task.priority}`}>
                          {P_LABELS[task.priority] || task.priority}
                        </span>
                      </td>

                      {/* assignee */}
                      <td>
                        {task.assignedTo ? (
                          <div className="tk-cell-assignee">
                            <div
                              className="tk-assignee-avatar"
                              style={{ background: avatarGrad(task.assignedTo.name) }}
                              title={task.assignedTo.name}
                            >
                              {getInitials(task.assignedTo.name)}
                            </div>
                            <span className="tk-assignee-name">{task.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="tk-unassigned">Unassigned</span>
                        )}
                      </td>

                      {/* due date */}
                      <td>
                        <span className={`tk-due${over ? ' overdue' : ''}`}>
                          {over && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight:4,verticalAlign:'middle'}}>
                              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>
                            </svg>
                          )}
                          {formatDate(task.dueDate)}
                        </span>
                      </td>

                      {/* delete */}
                      <td>
                        <button
                          className="tk-del-btn"
                          title="Delete task"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(task); }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* table footer count */}
          <div className="tk-table-footer">
            <span className="tk-table-count">
              {filtered.length} task{filtered.length !== 1 ? 's' : ''} shown
              {filtered.length !== tasks.length && ` · ${tasks.length - filtered.length} filtered out`}
            </span>
            {(filterStatus || filterPriority || filterAssignee || search) && (
              <button
                style={{ fontSize:'0.72rem', color:'var(--accent2)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-d)', fontWeight:700, letterSpacing:'0.03em' }}
                onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterAssignee(''); setSearch(''); }}
              >
                Clear filters ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Modals (logic unchanged) ── */}
      {viewTask && (
        <TaskDetailModal
          task={viewTask}
          onClose={() => setViewTask(null)}
          onEdit={() => {}}
          onDelete={() => { setDeleteTarget(viewTask); setViewTask(null); }}
          onStatusChange={handleStatusChange}
          onTaskUpdated={(updated) => {
            setTasks((t) => t.map((x) => (x._id === updated._id ? updated : x)));
            setViewTask(updated);
          }}
          isProjectAdmin={false}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Task"
          message={`Delete "${deleteTarget.title}"? This action cannot be undone.`}
          confirmLabel="Delete Task"
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}