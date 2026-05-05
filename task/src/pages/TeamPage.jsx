import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { formatDate, timeAgo, getInitials, getAvatarColor } from '../utils/helpers';
import ConfirmModal from '../components/common/ConfirmModal';

function Avatar({ name, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: getAvatarColor(name || ''),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 800, color: '#fff', flexShrink: 0,
      border: '2px solid rgba(255,255,255,0.10)',
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      letterSpacing: '0.02em',
    }}>
      {getInitials(name || 'U')}
    </div>
  );
}

const STAT_ICONS = {
  'Total Users': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  'Admins': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  'Members': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  'Inactive': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  ),
};

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await userApi.getAll();
        setUsers(res.data.users);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load team');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      const res = await userApi.updateRole(userId, newRole);
      setUsers((u) => u.map((x) => (x._id === userId ? res.data.user : x)));
      toast.success('Role updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusToggle = async () => {
    if (!confirmAction) return;
    const { user, value } = confirmAction;
    setUpdatingId(user._id);
    try {
      const res = await userApi.updateStatus(user._id, value);
      setUsers((u) => u.map((x) => (x._id === user._id ? res.data.user : x)));
      toast.success(`User ${value ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
      setConfirmAction(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole ? u.role === filterRole : true;
    const matchStatus = filterStatus === 'active' ? u.isActive : filterStatus === 'inactive' ? !u.isActive : true;
    return matchSearch && matchRole && matchStatus;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    members: users.filter((u) => u.role === 'member').length,
    inactive: users.filter((u) => !u.isActive).length,
  };

  const statCards = [
    { label: 'Total Users', value: stats.total,    color: '#818cf8', glow: 'rgba(129,140,248,0.15)' },
    { label: 'Admins',      value: stats.admins,   color: '#f59e0b', glow: 'rgba(245,158,11,0.15)'  },
    { label: 'Members',     value: stats.members,  color: '#38bdf8', glow: 'rgba(56,189,248,0.15)'  },
    { label: 'Inactive',    value: stats.inactive, color: '#f43f5e', glow: 'rgba(244,63,94,0.15)'   },
  ];

  const inputBase = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 10, color: '#e2e8f0',
    fontSize: '0.855rem', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'inherit',
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .team-row { transition: background 0.15s; }
        .team-row:hover { background: rgba(255,255,255,0.025) !important; }
        .team-row:hover .row-actions { opacity: 1 !important; }
        .row-actions { opacity: 0.7; transition: opacity 0.15s; }
        .filter-input:focus { border-color: rgba(129,140,248,0.45) !important; box-shadow: 0 0 0 3px rgba(129,140,248,0.10) !important; }
        .stat-card { animation: fadeUp 0.4s ease both; }
        .skeleton-row { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 400px 100%; animation: shimmer 1.4s infinite; border-radius: 10px; height: 60px; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'fadeUp 0.3s ease' }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.1))',
                border: '1px solid rgba(129,140,248,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#818cf8',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <h1 style={{ margin: 0, fontSize: '1.55rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                Team Management
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>
              Manage roles and access for all team members
            </p>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: '0.78rem', fontWeight: 600, color: '#64748b',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
            {users.filter(u => u.isActive).length} online
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
          {statCards.map((s, i) => (
            <div
              key={s.label}
              className="stat-card"
              style={{
                animationDelay: `${i * 0.07}s`,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '18px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Accent glow */}
              <div style={{
                position: 'absolute', bottom: -20, right: -20,
                width: 80, height: 80, borderRadius: '50%',
                background: s.glow, filter: 'blur(20px)', pointerEvents: 'none',
              }} />
              <div style={{
                width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                background: `${s.color}18`,
                border: `1px solid ${s.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.color,
              }}>
                {STAT_ICONS[s.label]}
              </div>
              <div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.67rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── FILTERS ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="filter-input"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputBase, width: '100%', padding: '9px 12px 9px 36px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Role filter */}
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }}
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <select
              className="filter-input"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{ ...inputBase, padding: '9px 32px 9px 30px', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', paddingRight: 32 }}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
            <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }}
              width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          {/* Status filter */}
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }}
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
            </svg>
            <select
              className="filter-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ ...inputBase, padding: '9px 32px 9px 30px', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }}
              width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          {/* Result count chip */}
          {(search || filterRole || filterStatus) && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 20,
              background: 'rgba(129,140,248,0.1)',
              border: '1px solid rgba(129,140,248,0.2)',
              fontSize: '0.78rem', fontWeight: 600, color: '#818cf8',
            }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* ── TABLE / STATES ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton-row" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '56px 24px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: 18,
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>👥</div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>No users found</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18, overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                    {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                      <th key={h} style={{
                        textAlign: 'left', fontSize: '0.67rem', fontWeight: 800,
                        color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em',
                        padding: '12px 20px',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, idx) => {
                    const isSelf = u._id === currentUser?._id;
                    const isUpdating = updatingId === u._id;
                    return (
                      <tr
                        key={u._id}
                        className="team-row"
                        style={{
                          borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          background: isSelf ? 'rgba(129,140,248,0.04)' : 'transparent',
                        }}
                      >
                        {/* User cell */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ position: 'relative' }}>
                              <Avatar name={u.name} size={36} />
                              <span style={{
                                position: 'absolute', bottom: 0, right: 0,
                                width: 10, height: 10, borderRadius: '50%',
                                background: u.isActive ? '#34d399' : '#475569',
                                border: '2px solid rgba(15,22,41,0.9)',
                              }} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f1f5f9' }}>{u.name}</span>
                                {isSelf && (
                                  <span style={{
                                    fontSize: '0.62rem', fontWeight: 800,
                                    background: 'rgba(129,140,248,0.18)',
                                    border: '1px solid rgba(129,140,248,0.3)',
                                    color: '#818cf8', padding: '1px 7px', borderRadius: 20,
                                    letterSpacing: '0.04em', textTransform: 'uppercase',
                                  }}>
                                    You
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#475569' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role cell */}
                        <td style={{ padding: '14px 20px' }}>
                          {isSelf ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 10px', borderRadius: 20,
                              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              ...(u.role === 'admin'
                                ? { background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }
                                : { background: 'rgba(56,189,248,0.10)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.22)' }),
                            }}>
                              {u.role === 'admin' ? (
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                </svg>
                              ) : (
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                </svg>
                              )}
                              {u.role}
                            </span>
                          ) : (
                            <div style={{ position: 'relative', display: 'inline-flex' }}>
                              <select
                                value={u.role}
                                disabled={isUpdating}
                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: 8, color: '#e2e8f0',
                                  fontSize: '0.8rem', fontWeight: 600,
                                  padding: '5px 26px 5px 10px',
                                  appearance: 'none', WebkitAppearance: 'none',
                                  cursor: isUpdating ? 'wait' : 'pointer',
                                  outline: 'none', fontFamily: 'inherit',
                                  transition: 'border-color 0.2s',
                                  opacity: isUpdating ? 0.5 : 1,
                                }}
                              >
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                              </select>
                              <svg style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }}
                                width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            </div>
                          )}
                        </td>

                        {/* Status cell */}
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px', borderRadius: 20,
                            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                            ...(u.isActive
                              ? { background: 'rgba(52,211,153,0.10)', color: '#34d399', border: '1px solid rgba(52,211,153,0.22)' }
                              : { background: 'rgba(244,63,94,0.10)',  color: '#f43f5e', border: '1px solid rgba(244,63,94,0.22)' }),
                          }}>
                            <span style={{
                              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                              background: u.isActive ? '#34d399' : '#f43f5e',
                            }} />
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Joined cell */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>
                            {formatDate(u.createdAt)}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#334155', marginTop: 2 }}>
                            {timeAgo(u.createdAt)}
                          </div>
                        </td>

                        {/* Actions cell */}
                        <td style={{ padding: '14px 20px' }}>
                          {!isSelf && (
                            <button
                              className="row-actions"
                              disabled={isUpdating}
                              onClick={() => setConfirmAction({ user: u, value: !u.isActive })}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '6px 14px', borderRadius: 8,
                                fontSize: '0.78rem', fontWeight: 700,
                                cursor: isUpdating ? 'wait' : 'pointer',
                                border: '1px solid',
                                transition: 'all 0.18s',
                                fontFamily: 'inherit',
                                ...(u.isActive
                                  ? { background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.2)', color: '#f43f5e' }
                                  : { background: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.2)', color: '#34d399' }),
                                opacity: isUpdating ? 0.5 : 1,
                              }}
                            >
                              {isUpdating ? (
                                <span style={{
                                  width: 12, height: 12, borderRadius: '50%',
                                  border: '2px solid rgba(255,255,255,0.2)',
                                  borderTopColor: 'currentColor',
                                  animation: 'spin 0.7s linear infinite',
                                  display: 'inline-block',
                                }} />
                              ) : u.isActive ? (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                                  </svg>
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                                  </svg>
                                  Activate
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer row count */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '10px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.015)',
            }}>
              <span style={{ fontSize: '0.75rem', color: '#334155' }}>
                Showing <strong style={{ color: '#64748b' }}>{filtered.length}</strong> of <strong style={{ color: '#64748b' }}>{users.length}</strong> members
              </span>
            </div>
          </div>
        )}

        {/* ── CONFIRM MODAL ── */}
        {confirmAction && (
          <ConfirmModal
            title={confirmAction.value ? 'Activate User' : 'Deactivate User'}
            message={`Are you sure you want to ${confirmAction.value ? 'activate' : 'deactivate'} "${confirmAction.user.name}"?${!confirmAction.value ? ' They will lose access to the platform.' : ''}`}
            confirmLabel={confirmAction.value ? 'Activate' : 'Deactivate'}
            loading={updatingId === confirmAction.user._id}
            danger={!confirmAction.value}
            onConfirm={handleStatusToggle}
            onClose={() => setConfirmAction(null)}
          />
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
}