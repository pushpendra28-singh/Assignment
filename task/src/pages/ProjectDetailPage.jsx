import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { projectApi } from '../api/projectApi';
import { taskApi } from '../api/taskApi';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { formatDate, getInitials, getAvatarColor, isOverdue } from '../utils/helpers';
import TaskFormModal from '../components/tasks/TaskFormModal';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import ProjectFormModal from '../components/projects/ProjectFormModal';
import ConfirmModal from '../components/common/ConfirmModal';
import AddMemberModal from '../components/projects/AddMemberModal';

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: '#8b9ab8', dot: '#4a5568',  accent: 'rgba(139,154,184,0.08)' },
  { id: 'in-progress', label: 'In Progress', color: '#38bdf8', dot: '#38bdf8',  accent: 'rgba(56,189,248,0.08)'  },
  { id: 'review',      label: 'In Review',   color: '#f59e0b', dot: '#f59e0b',  accent: 'rgba(245,158,11,0.08)'  },
  { id: 'done',        label: 'Done',        color: '#10b981', dot: '#10b981',  accent: 'rgba(16,185,129,0.08)'  },
];

const PRIORITY_COLOR  = { low: '#10b981', medium: '#38bdf8', high: '#f59e0b', critical: '#f43f5e' };
const PRIORITY_LABEL  = { low: 'Low',     medium: 'Medium',  high: 'High',    critical: 'Critical' };
const STATUS_LABEL    = { todo: 'To Do', 'in-progress': 'In Progress', review: 'In Review', done: 'Done' };

/* ── deterministic color helpers (same as ProjectsPage) ─────────── */
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
function avatarBg(name) { return AVATAR_COLORS[nameToIdx(name)]; }

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
  --violet:#a78bfa;--violet-d:rgba(167,139,250,0.12);
  --r:14px; --r-sm:8px; --r-lg:20px;
  --font-d:'Syne',sans-serif; --font-b:'DM Sans',sans-serif;
  --sh-card:0 4px 24px rgba(0,0,0,0.4),0 1px 0 rgba(255,255,255,0.04) inset;
  --sh-hover:0 12px 40px rgba(0,0,0,0.5),0 0 0 1px rgba(99,102,241,0.25),0 1px 0 rgba(255,255,255,0.06) inset;
  --ease:all 0.2s cubic-bezier(0.4,0,0.2,1);
}

.pd-page * { box-sizing:border-box; }
.pd-page { font-family:var(--font-b); color:var(--text); }

/* breadcrumb */
.pd-breadcrumb { display:flex; align-items:center; gap:8px; font-size:0.8rem; color:var(--text3); margin-bottom:20px; }
.pd-breadcrumb a { color:var(--text2); text-decoration:none; transition:var(--ease); }
.pd-breadcrumb a:hover { color:var(--text); }
.pd-breadcrumb-sep { color:var(--text3); }
.pd-breadcrumb-cur { color:var(--text2); font-weight:600; }

/* ── Project header card ── */
.pd-hero {
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:var(--r-lg);
  padding:24px;
  margin-bottom:20px;
  box-shadow:var(--sh-card);
  position:relative;
  overflow:hidden;
}
.pd-hero::before {
  content:'';
  position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);
}
.pd-hero-top { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:0; }
.pd-hero-left { display:flex; align-items:center; gap:16px; }
.pd-hero-avatar {
  width:52px; height:52px; border-radius:14px;
  display:flex; align-items:center; justify-content:center;
  font-family:var(--font-d); font-size:1.3rem; font-weight:800;
  color:#fff; flex-shrink:0; position:relative;
}
.pd-hero-avatar::after {
  content:''; position:absolute; inset:0; border-radius:inherit;
  box-shadow:inset 0 -2px 0 rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.2);
}
.pd-hero-name {
  font-family:var(--font-d); font-size:1.55rem; font-weight:800;
  letter-spacing:-0.03em; color:var(--text); line-height:1; margin:0 0 8px;
}
.pd-hero-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.pd-hero-actions { display:flex; align-items:center; gap:8px; }

/* action buttons */
.pd-btn-sec {
  display:inline-flex; align-items:center; gap:6px;
  background:var(--surface2); border:1px solid var(--border);
  border-radius:var(--r-sm); padding:8px 14px;
  color:var(--text2); font-family:var(--font-d);
  font-size:0.8rem; font-weight:700; letter-spacing:0.02em;
  cursor:pointer; transition:var(--ease);
}
.pd-btn-sec:hover { border-color:var(--border-h); color:var(--text); background:rgba(255,255,255,0.06); }
.pd-btn-danger {
  display:inline-flex; align-items:center; gap:6px;
  background:var(--rose-d); border:1px solid rgba(244,63,94,0.25);
  border-radius:var(--r-sm); padding:8px 14px;
  color:var(--rose); font-family:var(--font-d);
  font-size:0.8rem; font-weight:700; letter-spacing:0.02em;
  cursor:pointer; transition:var(--ease);
}
.pd-btn-danger:hover { background:rgba(244,63,94,0.2); border-color:rgba(244,63,94,0.45); }

/* description */
.pd-desc { color:var(--text2); font-size:0.85rem; line-height:1.65; margin-top:16px; max-width:680px; }

/* divider */
.pd-hr { height:1px; background:var(--border); margin:20px 0; }

/* stats grid */
.pd-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
@media(max-width:640px){ .pd-stats{ grid-template-columns:repeat(2,1fr); } }
.pd-stat {
  background:rgba(255,255,255,0.025); border:1px solid var(--border);
  border-radius:var(--r-sm); padding:14px 12px; text-align:center;
  transition:var(--ease);
}
.pd-stat:hover { border-color:var(--border-h); }
.pd-stat-val {
  font-family:var(--font-d); font-size:1.6rem; font-weight:800;
  letter-spacing:-0.04em; line-height:1; margin-bottom:5px;
}
.pd-stat-lbl { font-size:0.62rem; text-transform:uppercase; letter-spacing:0.08em; font-weight:600; color:var(--text3); }

/* progress bar */
.pd-prog-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.pd-prog-lbl { font-size:0.75rem; color:var(--text3); font-weight:500; }
.pd-prog-pct { font-family:var(--font-d); font-size:0.82rem; font-weight:700; color:var(--accent2); }
.pd-track { height:6px; background:rgba(255,255,255,0.06); border-radius:100px; overflow:hidden; }
.pd-fill {
  height:100%; border-radius:100px;
  background:linear-gradient(90deg,var(--accent),var(--violet));
  transition:width 0.7s cubic-bezier(0.4,0,0.2,1);
  position:relative;
}
.pd-fill::after {
  content:''; position:absolute; right:0; top:0; bottom:0;
  width:10px; background:rgba(255,255,255,0.4); filter:blur(3px);
}

/* ── Tabs ── */
.pd-tab-bar {
  display:flex; align-items:center; justify-content:space-between;
  gap:12px; flex-wrap:wrap; margin-bottom:16px;
}
.pd-tabs {
  display:flex; align-items:center; gap:2px;
  background:var(--surface); border:1px solid var(--border);
  border-radius:10px; padding:4px;
}
.pd-tab {
  padding:7px 18px; border-radius:8px; border:none;
  font-family:var(--font-d); font-size:0.82rem; font-weight:700;
  letter-spacing:0.02em; text-transform:capitalize;
  cursor:pointer; transition:var(--ease); background:transparent;
  color:var(--text2);
}
.pd-tab:hover { color:var(--text); background:rgba(255,255,255,0.04); }
.pd-tab.active {
  background:var(--accent); color:#fff;
  box-shadow:0 0 12px var(--accent-glow),0 2px 4px rgba(0,0,0,0.3);
}
.pd-btn-primary {
  display:inline-flex; align-items:center; gap:7px;
  background:var(--accent); color:#fff; border:none;
  border-radius:var(--r-sm); padding:9px 16px;
  font-family:var(--font-d); font-size:0.82rem; font-weight:700;
  letter-spacing:0.02em; cursor:pointer; transition:var(--ease);
  position:relative; overflow:hidden;
}
.pd-btn-primary::before {
  content:''; position:absolute; inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,0.15),transparent 60%);
}
.pd-btn-primary:hover { background:#4f52e8; box-shadow:0 0 18px var(--accent-glow); transform:translateY(-1px); }
.pd-btn-primary:active { transform:translateY(0); }

/* ── Filter row ── */
.pd-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
.pd-sel {
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--r-sm); padding:8px 32px 8px 12px;
  color:var(--text2); font-family:var(--font-b); font-size:0.8rem;
  outline:none; cursor:pointer; transition:var(--ease);
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%234a5568' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 10px center;
}
.pd-sel:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-glow); }
.pd-sel option { background:var(--surface2); }

/* ── Board ── */
.pd-board { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
@media(max-width:1200px){ .pd-board{ grid-template-columns:repeat(2,1fr); } }
@media(max-width:640px) { .pd-board{ grid-template-columns:1fr; } }

.pd-col {
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--r-lg); padding:16px;
  display:flex; flex-direction:column; gap:12px;
  min-height:320px; box-shadow:var(--sh-card);
}
.pd-col-header { display:flex; align-items:center; justify-content:space-between; }
.pd-col-title { display:flex; align-items:center; gap:8px; }
.pd-col-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.pd-col-label {
  font-family:var(--font-d); font-size:0.72rem;
  font-weight:700; text-transform:uppercase; letter-spacing:0.1em;
}
.pd-col-count {
  font-size:0.68rem; font-weight:700; padding:2px 8px;
  border-radius:100px; background:rgba(255,255,255,0.05);
  border:1px solid var(--border); color:var(--text3);
  font-family:var(--font-d);
}
.pd-col-body { display:flex; flex-direction:column; gap:8px; flex:1; }
.pd-col-empty {
  display:flex; align-items:center; justify-content:center;
  height:80px; border:1px dashed var(--border);
  border-radius:10px; color:var(--text3); font-size:0.75rem;
  font-family:var(--font-d); font-weight:600; letter-spacing:0.04em;
}

/* ── Task card ── */
.pd-task {
  background:var(--elevated); border:1px solid var(--border);
  border-radius:10px; padding:12px; cursor:pointer;
  transition:var(--ease); position:relative; overflow:hidden;
}
.pd-task::before {
  content:''; position:absolute; top:0; left:0; width:3px; height:100%;
  border-radius:3px 0 0 3px; opacity:0; transition:opacity 0.2s;
}
.pd-task:hover { border-color:var(--border-h); transform:translateX(2px); box-shadow:0 4px 16px rgba(0,0,0,0.3); }
.pd-task:hover::before { opacity:1; }
.pd-task-top { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:8px; }
.pd-task-title { font-size:0.83rem; font-weight:600; color:var(--text); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; flex:1; }
.pd-task-pri-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:3px; }
.pd-task-desc { font-size:0.72rem; color:var(--text3); line-height:1.4; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:10px; }
.pd-task-footer { display:flex; align-items:center; justify-content:space-between; }
.pd-task-assignee {
  width:22px; height:22px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:0.55rem; font-weight:700; color:#fff;
}
.pd-task-assignee-empty { width:22px; height:22px; border-radius:50%; border:1px dashed var(--border); flex-shrink:0; }
.pd-task-right { display:flex; align-items:center; gap:6px; }
.pd-task-due { font-size:0.65rem; color:var(--text3); }
.pd-task-due.overdue { color:var(--rose); font-weight:700; }
.overdue-dot-sm { width:5px; height:5px; border-radius:50%; background:var(--rose); flex-shrink:0; box-shadow:0 0 4px var(--rose); }
.pd-task-comments { display:flex; align-items:center; gap:4px; color:var(--text3); margin-top:6px; }
.pd-task-comments span { font-size:0.65rem; }

/* ── Badges ── */
.pd-badge {
  display:inline-flex; align-items:center; gap:4px; padding:2px 8px;
  border-radius:100px; font-size:0.67rem; font-weight:700;
  letter-spacing:0.05em; text-transform:uppercase; border:1px solid transparent;
}
.bd-active    { background:rgba(16,185,129,0.12); color:#10b981; border-color:rgba(16,185,129,0.2); }
.bd-completed { background:rgba(56,189,248,0.12); color:#38bdf8; border-color:rgba(56,189,248,0.2); }
.bd-on-hold   { background:rgba(245,158,11,0.12); color:#f59e0b; border-color:rgba(245,158,11,0.2); }
.bd-archived  { background:rgba(255,255,255,0.05); color:#4a5568; border-color:rgba(255,255,255,0.07); }
.bd-low       { background:rgba(16,185,129,0.12); color:#10b981; border-color:rgba(16,185,129,0.2); }
.bd-medium    { background:rgba(56,189,248,0.12); color:#38bdf8; border-color:rgba(56,189,248,0.2); }
.bd-high      { background:rgba(245,158,11,0.12); color:#f59e0b; border-color:rgba(245,158,11,0.2); }
.bd-critical  { background:rgba(244,63,94,0.12);  color:#f43f5e; border-color:rgba(244,63,94,0.2); }
.bd-todo      { background:rgba(139,154,184,0.1); color:#8b9ab8; border-color:rgba(139,154,184,0.15); }
.bd-in-progress{ background:rgba(56,189,248,0.12); color:#38bdf8; border-color:rgba(56,189,248,0.2); }
.bd-review    { background:rgba(245,158,11,0.12); color:#f59e0b; border-color:rgba(245,158,11,0.2); }
.bd-done      { background:rgba(16,185,129,0.12); color:#10b981; border-color:rgba(16,185,129,0.2); }
.bd-viewer    { background:rgba(255,255,255,0.05); color:#8b9ab8; border-color:rgba(255,255,255,0.07); }
.bd-editor    { background:rgba(99,102,241,0.12); color:#818cf8; border-color:rgba(99,102,241,0.2); }
.bd-admin     { background:rgba(245,158,11,0.12); color:#f59e0b; border-color:rgba(245,158,11,0.2); }

/* ── List view ── */
.pd-table-wrap {
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--r-lg); overflow:hidden; box-shadow:var(--sh-card);
}
.pd-table { width:100%; border-collapse:collapse; }
.pd-table thead tr { border-bottom:1px solid var(--border); }
.pd-table th {
  text-align:left; font-size:0.67rem; font-weight:700;
  text-transform:uppercase; letter-spacing:0.1em;
  color:var(--text3); padding:12px 16px; font-family:var(--font-d);
  white-space:nowrap;
}
.pd-table tbody tr {
  border-bottom:1px solid rgba(255,255,255,0.04);
  transition:var(--ease); cursor:pointer;
}
.pd-table tbody tr:hover { background:rgba(255,255,255,0.03); }
.pd-table tbody tr:last-child { border-bottom:none; }
.pd-table td { padding:12px 16px; vertical-align:middle; }
.pd-trow-title { display:flex; align-items:center; gap:8px; }
.pd-trow-name { font-size:0.83rem; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:220px; }
.pd-trow-assignee { display:flex; align-items:center; gap:8px; }
.pd-trow-avatar {
  width:26px; height:26px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:0.6rem; font-weight:700; color:#fff; flex-shrink:0;
}
.pd-trow-aname { font-size:0.8rem; color:var(--text2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px; }
.pd-trow-unassigned { font-size:0.8rem; color:var(--text3); font-style:italic; }
.pd-trow-due { font-size:0.8rem; color:var(--text3); white-space:nowrap; }
.pd-trow-due.overdue { color:var(--rose); font-weight:700; }
.pd-edit-btn {
  width:30px; height:30px; border-radius:var(--r-sm); border:1px solid var(--border);
  background:transparent; color:var(--text3); display:flex; align-items:center;
  justify-content:center; cursor:pointer; transition:var(--ease);
}
.pd-edit-btn:hover { border-color:var(--border-h); color:var(--text); background:rgba(255,255,255,0.06); }

/* ── Team view ── */
.pd-team-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
@media(max-width:900px){ .pd-team-grid{ grid-template-columns:repeat(2,1fr); } }
@media(max-width:580px){ .pd-team-grid{ grid-template-columns:1fr; } }
.pd-member-card {
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--r-lg); padding:18px;
  display:flex; align-items:center; gap:14px;
  box-shadow:var(--sh-card); transition:var(--ease);
  position:relative; overflow:hidden;
}
.pd-member-card::before {
  content:''; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent);
}
.pd-member-card:hover { border-color:var(--border-h); box-shadow:var(--sh-hover); }
.pd-member-avatar {
  width:46px; height:46px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-family:var(--font-d); font-size:0.95rem; font-weight:800; color:#fff;
  position:relative;
}
.pd-member-avatar::after {
  content:''; position:absolute; inset:0; border-radius:50%;
  box-shadow:inset 0 -2px 0 rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.2);
}
.pd-member-info { flex:1; min-width:0; }
.pd-member-name { font-family:var(--font-d); font-weight:700; font-size:0.88rem; color:var(--text); margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pd-member-email { font-size:0.73rem; color:var(--text3); margin-bottom:7px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pd-member-tags { display:flex; align-items:center; gap:6px; }
.pd-owner-tag { font-size:0.62rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--amber); background:var(--amber-d); border:1px solid rgba(245,158,11,0.2); border-radius:100px; padding:2px 8px; }
.pd-remove-btn {
  width:28px; height:28px; border-radius:var(--r-sm); border:1px solid var(--border);
  background:transparent; color:var(--text3); display:flex; align-items:center;
  justify-content:center; cursor:pointer; transition:var(--ease); flex-shrink:0;
}
.pd-remove-btn:hover { border-color:rgba(244,63,94,0.35); background:var(--rose-d); color:var(--rose); }
.pd-remove-btn:disabled { opacity:0.4; cursor:not-allowed; }

/* spinner */
.pd-spin {
  width:12px; height:12px; border-radius:50%;
  border:2px solid rgba(255,255,255,0.1);
  border-top-color:var(--text2);
  animation:spin 0.7s linear infinite;
}
@keyframes spin { to { transform:rotate(360deg); } }

/* skeleton */
.pd-skel {
  border-radius:var(--r-lg);
  background:linear-gradient(90deg,var(--surface) 25%,var(--surface2) 50%,var(--surface) 75%);
  background-size:200% 100%;
  animation:shim 1.6s infinite;
}
@keyframes shim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* empty */
.pd-empty {
  display:flex; flex-direction:column; align-items:center;
  justify-content:center; padding:60px 24px; gap:10px;
}
.pd-empty-icon { font-size:2.5rem; opacity:0.35; filter:grayscale(1); }
.pd-empty h3 { font-family:var(--font-d); font-size:1rem; font-weight:700; color:var(--text2); margin:0; }
.pd-empty p  { font-size:0.82rem; color:var(--text3); margin:0; }

/* animate in */
@keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
.pd-fadein { animation:fadeUp 0.35s ease both; }
`;

function InjectStyles() {
  useEffect(() => {
    if (document.getElementById('pd-premium-styles')) return;
    const el = document.createElement('style');
    el.id = 'pd-premium-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
  return null;
}

/* ── small helper badge ─────────────────────────────────────────── */
function Badge({ type, children }) {
  return <span className={`pd-badge bd-${type}`}>{children}</span>;
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════ */
export default function ProjectDetailPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject]             = useState(null);
  const [tasks, setTasks]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('board');
  const [showTaskForm, setShowTaskForm]   = useState(false);
  const [editTask, setEditTask]           = useState(null);
  const [viewTask, setViewTask]           = useState(null);
  const [showEditProject, setShowEditProject] = useState(false);
  const [deleteProject, setDeleteProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  const isMember = project?.members?.some(
    (m) => m.user?._id === user?._id || m.user === user?._id
  );
  const isProjectAdmin =
    isAdmin || project?.owner?._id === user?._id || project?.owner === user?._id;

  const fetchAll = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        projectApi.getOne(id),
        taskApi.getProjectTasks(id),
      ]);
      setProject(projRes.data.project);
      setTasks(taskRes.data.tasks);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load project');
      if (err.response?.status === 404 || err.response?.status === 403) navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleTaskSaved = (saved, isEdit) => {
    if (isEdit) {
      setTasks((t) => t.map((x) => (x._id === saved._id ? saved : x)));
      toast.success('Task updated!');
    } else {
      setTasks((t) => [saved, ...t]);
      toast.success('Task created!');
    }
    setShowTaskForm(false);
    setEditTask(null);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await taskApi.updateStatus(taskId, newStatus);
      setTasks((t) => t.map((x) => (x._id === taskId ? res.data.task : x)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await taskApi.delete(taskId);
      setTasks((t) => t.filter((x) => x._id !== taskId));
      setViewTask(null);
      toast.success('Task deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleDeleteProject = async () => {
    setDeletingProject(true);
    try {
      await projectApi.delete(id);
      toast.success('Project deleted.');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
      setDeletingProject(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    setRemovingMember(userId);
    try {
      const res = await projectApi.removeMember(id, userId);
      setProject(res.data.project);
      toast.success('Member removed.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus   && t.status        !== filterStatus)    return false;
    if (filterPriority && t.priority      !== filterPriority)  return false;
    if (filterAssignee && t.assignedTo?._id !== filterAssignee) return false;
    return true;
  });

  const tasksByCol = (colId) => filteredTasks.filter((t) => t.status === colId);

  const progress = tasks.length > 0
    ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100)
    : 0;

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="pd-page" style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <InjectStyles />
        <div className="pd-skel" style={{ height:32, width:240 }} />
        <div className="pd-skel" style={{ height:200 }} />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="pd-skel" style={{ height:280 }} />)}
        </div>
      </div>
    );
  }

  if (!project) return null;

  /* avatar gradient */
  const heroGrad = project.color
    ? project.color
    : AVATAR_COLORS[nameToIdx(project.name)];

  return (
    <div className="pd-page">
      <InjectStyles />

      {/* ── Breadcrumb ── */}
      <div className="pd-breadcrumb">
        <Link to="/projects">Projects</Link>
        <span className="pd-breadcrumb-sep">/</span>
        <span className="pd-breadcrumb-cur">{project.name}</span>
      </div>

      {/* ══════════════════════════════
          Hero card
      ══════════════════════════════ */}
      <div className="pd-hero pd-fadein">
        <div className="pd-hero-top">
          <div className="pd-hero-left">
            <div className="pd-hero-avatar" style={{ background: heroGrad }}>
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="pd-hero-name">{project.name}</h1>
              <div className="pd-hero-meta">
                <Badge type={project.status}>{project.status.replace('-', ' ')}</Badge>
                <Badge type={project.priority}>{project.priority}</Badge>
                {project.dueDate && (
                  <span style={{
                    fontSize:'0.73rem',
                    color: isOverdue(project.dueDate, project.status) ? 'var(--rose)' : 'var(--text3)',
                    display:'flex', alignItems:'center', gap:4,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Due {formatDate(project.dueDate)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isProjectAdmin && (
            <div className="pd-hero-actions">
              <button className="pd-btn-sec" onClick={() => setShowEditProject(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
              <button className="pd-btn-danger" onClick={() => setDeleteProject(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>

        {project.description && (
          <p className="pd-desc">{project.description}</p>
        )}

        <div className="pd-hr" />

        {/* stats */}
        <div className="pd-stats" style={{ marginBottom:18 }}>
          {[
            { label:'Total Tasks',  value:tasks.length,                                          color:'var(--text)' },
            { label:'Completed',    value:tasks.filter((t)=>t.status==='done').length,            color:'var(--green)' },
            { label:'In Progress',  value:tasks.filter((t)=>t.status==='in-progress').length,     color:'var(--sky)' },
            { label:'Overdue',      value:tasks.filter((t)=>isOverdue(t.dueDate,t.status)).length, color:'var(--rose)' },
          ].map((s) => (
            <div key={s.label} className="pd-stat">
              <div className="pd-stat-val" style={{ color:s.color }}>{s.value}</div>
              <div className="pd-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* progress */}
        <div>
          <div className="pd-prog-row">
            <span className="pd-prog-lbl">Overall Progress</span>
            <span className="pd-prog-pct">{progress}%</span>
          </div>
          <div className="pd-track">
            <div className="pd-fill" style={{ width:`${progress}%` }} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          Tabs + New Task btn
      ══════════════════════════════ */}
      <div className="pd-tab-bar">
        <div className="pd-tabs">
          {['board','list','team'].map((tab) => (
            <button
              key={tab}
              className={`pd-tab${activeTab===tab?' active':''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'board' && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:5,verticalAlign:'middle'}}>
                  <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/>
                </svg>
              )}
              {tab === 'list' && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:5,verticalAlign:'middle'}}>
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <circle cx="3" cy="6" r="1.5" fill="currentColor"/><circle cx="3" cy="12" r="1.5" fill="currentColor"/><circle cx="3" cy="18" r="1.5" fill="currentColor"/>
                </svg>
              )}
              {tab === 'team' && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:5,verticalAlign:'middle'}}>
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
              )}
              {tab}
            </button>
          ))}
        </div>

        {(isMember || isAdmin) && activeTab !== 'team' && (
          <button className="pd-btn-primary" onClick={() => { setEditTask(null); setShowTaskForm(true); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Task
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      {activeTab !== 'team' && (
        <div className="pd-filters">
          <select className="pd-sel" value={filterStatus}   onChange={(e)=>setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="done">Done</option>
          </select>
          <select className="pd-sel" value={filterPriority} onChange={(e)=>setFilterPriority(e.target.value)}>
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select className="pd-sel" value={filterAssignee} onChange={(e)=>setFilterAssignee(e.target.value)}>
            <option value="">All Members</option>
            {project.members?.map((m) => m.user && (
              <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* ══════════════════════════════
          BOARD VIEW
      ══════════════════════════════ */}
      {activeTab === 'board' && (
        <div className="pd-board pd-fadein">
          {COLUMNS.map((col) => (
            <div key={col.id} className="pd-col">
              {/* column header */}
              <div className="pd-col-header">
                <div className="pd-col-title">
                  <div className="pd-col-dot" style={{ background:col.dot, boxShadow:`0 0 6px ${col.dot}60` }} />
                  <span className="pd-col-label" style={{ color:col.color }}>{col.label}</span>
                </div>
                <span className="pd-col-count">{tasksByCol(col.id).length}</span>
              </div>

              <div className="pd-col-body">
                {tasksByCol(col.id).length === 0 ? (
                  <div className="pd-col-empty">No tasks</div>
                ) : (
                  tasksByCol(col.id).map((task, i) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      index={i}
                      accentColor={col.dot}
                      onView={() => setViewTask(task)}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════
          LIST VIEW
      ══════════════════════════════ */}
      {activeTab === 'list' && (
        <div className="pd-table-wrap pd-fadein">
          {filteredTasks.length === 0 ? (
            <div className="pd-empty">
              <div className="pd-empty-icon">📋</div>
              <h3>No tasks found</h3>
              <p>Try adjusting your filters or create a new task.</p>
            </div>
          ) : (
            <table className="pd-table">
              <thead>
                <tr>
                  {['Task','Status','Priority','Assigned To','Due Date',''].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const over = isOverdue(task.dueDate, task.status);
                  return (
                    <tr key={task._id} onClick={() => setViewTask(task)}>
                      <td>
                        <div className="pd-trow-title">
                          <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background:PRIORITY_COLOR[task.priority] }} />
                          <span className="pd-trow-name">{task.title}</span>
                          {over && <div className="overdue-dot-sm" />}
                        </div>
                      </td>
                      <td><Badge type={task.status}>{STATUS_LABEL[task.status] || task.status}</Badge></td>
                      <td><Badge type={task.priority}>{PRIORITY_LABEL[task.priority] || task.priority}</Badge></td>
                      <td>
                        {task.assignedTo ? (
                          <div className="pd-trow-assignee">
                            <div className="pd-trow-avatar" style={{ background:avatarBg(task.assignedTo.name) }}>
                              {getInitials(task.assignedTo.name)}
                            </div>
                            <span className="pd-trow-aname">{task.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="pd-trow-unassigned">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <span className={`pd-trow-due${over?' overdue':''}`}>
                          {formatDate(task.dueDate)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="pd-edit-btn"
                          onClick={(e) => { e.stopPropagation(); setEditTask(task); setShowTaskForm(true); }}
                          title="Edit task"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ══════════════════════════════
          TEAM VIEW
      ══════════════════════════════ */}
      {activeTab === 'team' && (
        <div className="pd-fadein" style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {isProjectAdmin && (
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button className="pd-btn-primary" onClick={() => setShowAddMember(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>
                </svg>
                Add Member
              </button>
            </div>
          )}
          <div className="pd-team-grid">
            {project.members?.map((m) => {
              if (!m.user) return null;
              const isOwner = project.owner?._id === m.user._id || project.owner === m.user._id;
              return (
                <div key={m.user._id} className="pd-member-card">
                  <div className="pd-member-avatar" style={{ background:avatarBg(m.user.name) }}>
                    {getInitials(m.user.name)}
                  </div>
                  <div className="pd-member-info">
                    <div className="pd-member-name">{m.user.name}</div>
                    <div className="pd-member-email">{m.user.email}</div>
                    <div className="pd-member-tags">
                      <Badge type={m.role}>{m.role}</Badge>
                      {isOwner && <span className="pd-owner-tag">Owner</span>}
                    </div>
                  </div>
                  {isProjectAdmin && !isOwner && (
                    <button
                      className="pd-remove-btn"
                      onClick={() => handleRemoveMember(m.user._id)}
                      disabled={removingMember === m.user._id}
                      title="Remove member"
                    >
                      {removingMember === m.user._id
                        ? <div className="pd-spin" />
                        : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6"  y2="18"/>
                            <line x1="6"  y1="6" x2="18" y2="18"/>
                          </svg>
                        )
                      }
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          MODALS (all logic unchanged)
      ══════════════════════════════ */}
      {showTaskForm && (
        <TaskFormModal
          task={editTask}
          projectId={id}
          members={project.members}
          onClose={() => { setShowTaskForm(false); setEditTask(null); }}
          onSaved={handleTaskSaved}
        />
      )}
      {viewTask && (
        <TaskDetailModal
          task={viewTask}
          onClose={() => setViewTask(null)}
          onEdit={() => { setEditTask(viewTask); setViewTask(null); setShowTaskForm(true); }}
          onDelete={() => handleDeleteTask(viewTask._id)}
          onStatusChange={handleStatusChange}
          onTaskUpdated={(updated) => setTasks((t) => t.map((x) => (x._id === updated._id ? updated : x)))}
          isProjectAdmin={isProjectAdmin}
        />
      )}
      {showEditProject && (
        <ProjectFormModal
          project={project}
          onClose={() => setShowEditProject(false)}
          onSaved={(saved) => { setProject(saved); setShowEditProject(false); toast.success('Project updated!'); }}
        />
      )}
      {deleteProject && (
        <ConfirmModal
          title="Delete Project"
          message={`Delete "${project.name}"? All tasks will be permanently removed.`}
          confirmLabel="Delete Project"
          loading={deletingProject}
          onConfirm={handleDeleteProject}
          onClose={() => setDeleteProject(false)}
        />
      )}
      {showAddMember && (
        <AddMemberModal
          projectId={id}
          existingMembers={project.members}
          onClose={() => setShowAddMember(false)}
          onAdded={(updatedProject) => { setProject(updatedProject); setShowAddMember(false); toast.success('Member added!'); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TaskCard
═══════════════════════════════════════════════════════════════════ */
function TaskCard({ task, onView, onStatusChange, accentColor, index }) {
  const over = isOverdue(task.dueDate, task.status);

  return (
    <div
      className="pd-task"
      style={{ animationDelay:`${index*0.05}s`, '--accent-strip': accentColor }}
      onClick={onView}
    >
      {/* colored left strip on hover via ::before — color set via CSS var */}
      <style>{`.pd-task:hover::before { background: var(--accent-strip, var(--accent)); }`}</style>

      <div className="pd-task-top">
        <span className="pd-task-title">{task.title}</span>
        <div
          className="pd-task-pri-dot"
          style={{ background: PRIORITY_COLOR[task.priority], boxShadow:`0 0 5px ${PRIORITY_COLOR[task.priority]}60` }}
          title={PRIORITY_LABEL[task.priority]}
        />
      </div>

      {task.description && (
        <p className="pd-task-desc">{task.description}</p>
      )}

      <div className="pd-task-footer">
        {task.assignedTo ? (
          <div
            className="pd-task-assignee"
            style={{ background: avatarBg(task.assignedTo.name) }}
            title={task.assignedTo.name}
          >
            {getInitials(task.assignedTo.name)}
          </div>
        ) : (
          <div className="pd-task-assignee-empty" title="Unassigned" />
        )}
        <div className="pd-task-right">
          {over && <div className="overdue-dot-sm" />}
          {task.dueDate && (
            <span className={`pd-task-due${over?' overdue':''}`}>
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      {task.comments?.length > 0 && (
        <div className="pd-task-comments">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <span>{task.comments.length}</span>
        </div>
      )}
    </div>
  );
}