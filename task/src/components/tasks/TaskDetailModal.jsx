import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { taskApi } from '../../api/taskApi';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime, timeAgo, isOverdue, getInitials, getAvatarColor, STATUS_LABELS, PRIORITY_LABELS } from '../../utils/helpers';

const PRIORITY_CONFIG = {
  low:      { color: '#10d9a0', bg: 'rgba(16,217,160,0.10)', border: 'rgba(16,217,160,0.25)', dot: '#10d9a0' },
  medium:   { color: '#38bdf8', bg: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.25)', dot: '#38bdf8' },
  high:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', dot: '#f59e0b' },
  critical: { color: '#f43f5e', bg: 'rgba(244,63,94,0.10)',  border: 'rgba(244,63,94,0.25)',  dot: '#f43f5e' },
};

const STATUS_CONFIG = {
  'todo':        { label: 'To Do',       color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.2)' },
  'in-progress': { label: 'In Progress', color: '#818cf8', bg: 'rgba(129,140,248,0.10)', border: 'rgba(129,140,248,0.2)' },
  'review':      { label: 'In Review',   color: '#fb923c', bg: 'rgba(251,146,60,0.10)',  border: 'rgba(251,146,60,0.2)'  },
  'done':        { label: 'Done',        color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.2)'  },
};

function Avatar({ name, size = 28 }) {
  const initials = getInitials(name || 'U');
  const bg = getAvatarColor(name || '');
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: size * 0.34,
        fontWeight: 700, color: '#fff', flexShrink: 0,
        border: '1.5px solid rgba(255,255,255,0.12)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['todo'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
      textTransform: 'uppercase',
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG['medium'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
      textTransform: 'uppercase',
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
    }}>
      <svg width="9" height="9" viewBox="0 0 10 10" fill={cfg.color}>
        <polygon points="5,1 9,9 1,9" />
      </svg>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function MetaCard({ label, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '10px 14px',
      display: 'flex', flexDirection: 'column', gap: 5,
      transition: 'border-color 0.2s',
    }}>
      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
    </div>
  );
}

export default function TaskDetailModal({ task, onClose, onEdit, onDelete, onStatusChange, onTaskUpdated, isProjectAdmin }) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localTask, setLocalTask] = useState(task);

  const over = isOverdue(localTask.dueDate, localTask.status);

  const handleStatusChange = async (newStatus) => {
    await onStatusChange(localTask._id, newStatus);
    setLocalTask((t) => ({ ...t, status: newStatus }));
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await taskApi.addComment(localTask._id, commentText.trim());
      const updated = { ...localTask, comments: res.data.comments };
      setLocalTask(updated);
      onTaskUpdated(updated);
      setCommentText('');
      toast.success('Comment added.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const priCfg = PRIORITY_CONFIG[localTask.priority] || PRIORITY_CONFIG['medium'];

  return (
    <>
      {/* Overlay */}
      <div
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(2,6,23,0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          animation: 'fadeInOverlay 0.18s ease',
        }}
      >
        {/* Modal shell */}
        <div
          style={{
            width: '100%', maxWidth: 660,
            maxHeight: '92vh', overflowY: 'auto',
            background: 'linear-gradient(145deg, #0f1629 0%, #0b1120 100%)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 20,
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
            animation: 'slideUpModal 0.22s cubic-bezier(0.34,1.56,0.64,1)',
            position: 'relative',
            overflowX: 'hidden',
          }}
        >
          {/* Priority accent bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, transparent, ${priCfg.color}, transparent)`,
            opacity: 0.8,
            borderRadius: '20px 20px 0 0',
          }} />

          <div style={{ padding: '28px 28px 24px' }}>

            {/* ── HEADER ── */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 22 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Badges row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  <StatusBadge status={localTask.status} />
                  <PriorityBadge priority={localTask.priority} />
                  {over && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 20,
                      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      background: 'rgba(244,63,94,0.12)', color: '#f43f5e',
                      border: '1px solid rgba(244,63,94,0.3)',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f43f5e', animation: 'pulse 1.4s infinite' }} />
                      Overdue
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 style={{
                  margin: 0, fontSize: '1.18rem', fontWeight: 800,
                  color: '#f1f5f9', lineHeight: 1.35,
                  letterSpacing: '-0.01em',
                }}>
                  {localTask.title}
                </h2>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {isProjectAdmin && (
                  <>
                    <button
                      onClick={onEdit}
                      title="Edit task"
                      style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: 'rgba(129,140,248,0.10)',
                        border: '1px solid rgba(129,140,248,0.2)',
                        color: '#818cf8', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.18s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.2)'; e.currentTarget.style.borderColor = 'rgba(129,140,248,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.10)'; e.currentTarget.style.borderColor = 'rgba(129,140,248,0.2)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={onDelete}
                      title="Delete task"
                      style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: 'rgba(244,63,94,0.08)',
                        border: '1px solid rgba(244,63,94,0.18)',
                        color: '#f43f5e', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.18s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.18)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.35)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.18)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                      </svg>
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#64748b', cursor: 'pointer', fontSize: '0.85rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#f1f5f9'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#64748b'; }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* ── DESCRIPTION ── */}
            {localTask.description && (
              <div style={{
                marginBottom: 22, padding: '14px 16px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                borderLeft: `3px solid ${priCfg.color}44`,
              }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.7 }}>
                  {localTask.description}
                </p>
              </div>
            )}

            {/* ── META GRID ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
              {/* Status */}
              <MetaCard label="Status">
                <select
                  value={localTask.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: STATUS_CONFIG[localTask.status]?.color || '#f1f5f9',
                    fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                    padding: 0, appearance: 'none', WebkitAppearance: 'none',
                    width: '100%',
                  }}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </MetaCard>

              {/* Due Date */}
              <MetaCard label="Due Date">
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: over ? '#f43f5e' : '#f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {over && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  )}
                  {formatDate(localTask.dueDate)}
                </span>
              </MetaCard>

              {/* Assigned To */}
              <MetaCard label="Assigned To">
                {localTask.assignedTo ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={localTask.assignedTo.name} size={24} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9' }}>{localTask.assignedTo.name}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.875rem', color: '#475569', fontStyle: 'italic' }}>Unassigned</span>
                )}
              </MetaCard>

              {/* Created By */}
              <MetaCard label="Created By">
                {localTask.createdBy ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={localTask.createdBy.name} size={24} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9' }}>{localTask.createdBy.name}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.875rem', color: '#475569' }}>—</span>
                )}
              </MetaCard>

              {/* Est. Hours */}
              <MetaCard label="Est. Hours">
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {localTask.estimatedHours ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {localTask.estimatedHours}h
                    </>
                  ) : '—'}
                </span>
              </MetaCard>

              {/* Created */}
              <MetaCard label="Created">
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8' }}>
                  {timeAgo(localTask.createdAt)}
                </span>
              </MetaCard>
            </div>

            {/* ── TAGS ── */}
            {localTask.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22 }}>
                {localTask.tags.map((t) => (
                  <span key={t} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 20,
                    fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.03em',
                    background: 'rgba(129,140,248,0.08)',
                    border: '1px solid rgba(129,140,248,0.2)',
                    color: '#a5b4fc',
                  }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                      <line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* ── DIVIDER ── */}
            <div style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
              marginBottom: 22,
            }} />

            {/* ── COMMENTS ── */}
            <div>
              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#cbd5e1', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Comments
                </span>
                {localTask.comments?.length > 0 && (
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700,
                    background: 'rgba(129,140,248,0.15)',
                    border: '1px solid rgba(129,140,248,0.25)',
                    color: '#818cf8', padding: '2px 8px', borderRadius: 20,
                  }}>
                    {localTask.comments.length}
                  </span>
                )}
              </div>

              {/* Comment list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                {!localTask.comments?.length ? (
                  <div style={{
                    textAlign: 'center', padding: '24px 0',
                    color: '#334155', fontSize: '0.82rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px dashed rgba(255,255,255,0.06)',
                    borderRadius: 12,
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" style={{ margin: '0 auto 8px', display: 'block' }}>
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    No comments yet. Be the first!
                  </div>
                ) : (
                  localTask.comments.map((c) => (
                    <div key={c._id} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                      <Avatar name={c.user?.name} size={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0' }}>{c.user?.name}</span>
                          <span style={{ fontSize: '0.68rem', color: '#475569' }}>{timeAgo(c.createdAt)}</span>
                        </div>
                        <div style={{
                          fontSize: '0.85rem', color: '#94a3b8',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: '4px 12px 12px 12px',
                          padding: '10px 14px', lineHeight: 1.65,
                        }}>
                          {c.text}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment input */}
              <div style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '12px 14px',
                transition: 'border-color 0.2s',
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Avatar name={user?.name} size={30} />
                  <textarea
                    rows={2}
                    placeholder="Add a comment…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment();
                    }}
                    onFocus={(e) => { e.currentTarget.closest('div[style]').style.borderColor = 'rgba(129,140,248,0.35)'; }}
                    onBlur={(e) => { e.currentTarget.closest('div[style]').style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      resize: 'none', color: '#e2e8f0', fontSize: '0.875rem', lineHeight: 1.6,
                      fontFamily: 'inherit', caretColor: '#818cf8',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.68rem', color: '#334155' }}>
                    Ctrl+Enter to submit
                  </span>
                  <button
                    disabled={!commentText.trim() || submittingComment}
                    onClick={handleAddComment}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 16px', borderRadius: 9,
                      background: commentText.trim() && !submittingComment
                        ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                        : 'rgba(255,255,255,0.05)',
                      border: commentText.trim() && !submittingComment
                        ? '1px solid rgba(129,140,248,0.4)'
                        : '1px solid rgba(255,255,255,0.07)',
                      color: commentText.trim() && !submittingComment ? '#fff' : '#475569',
                      fontSize: '0.8rem', fontWeight: 700, cursor: commentText.trim() && !submittingComment ? 'pointer' : 'not-allowed',
                      transition: 'all 0.18s',
                      boxShadow: commentText.trim() && !submittingComment ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                    }}
                  >
                    {submittingComment ? (
                      <>
                        <span style={{
                          width: 12, height: 12, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          animation: 'spin 0.7s linear infinite',
                          display: 'inline-block',
                        }} />
                        Posting…
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                        Comment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUpModal  { from { opacity:0; transform: translateY(18px) scale(0.97) } to { opacity:1; transform: translateY(0) scale(1) } }
        @keyframes spin          { to { transform: rotate(360deg) } }
        @keyframes pulse         { 0%,100%{ opacity:1 } 50%{ opacity:0.3 } }
      `}</style>
    </>
  );
}