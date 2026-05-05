import { useState, useEffect } from 'react';
import { userApi } from '../../api/userApi';
import { projectApi } from '../../api/projectApi';
import { getInitials, getAvatarColor } from '../../utils/helpers';

export default function AddMemberModal({ projectId, existingMembers, onClose, onAdded }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [role, setRole] = useState('member');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const existingIds = new Set(existingMembers?.map((m) => m.user?._id || m.user).filter(Boolean));

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await userApi.getAll();
        setUsers(res.data.users.filter((u) => !existingIds.has(u._id)));
      } catch {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await projectApi.addMember(projectId, { userId: selected._id, role });
      onAdded(res.data.project);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>Add Team Member</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <div className="flex flex-col gap-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="form-input pl-9"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-56 overflow-y-auto flex flex-col gap-1.5 rounded-[10px] border border-border p-2 bg-elevated">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-text-muted text-sm py-8">
                {users.length === 0 ? 'All users are already members.' : 'No users found.'}
              </div>
            ) : (
              filtered.map((u) => (
                <div
                  key={u._id}
                  onClick={() => setSelected(selected?._id === u._id ? null : u)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] cursor-pointer transition-all duration-150 ${
                    selected?._id === u._id
                      ? 'bg-accent/20 border border-accent/40'
                      : 'hover:bg-overlay'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: getAvatarColor(u.name) }}
                  >
                    {getInitials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate">{u.name}</div>
                    <div className="text-xs text-text-muted truncate">{u.email}</div>
                  </div>
                  <span className={`badge badge-${u.role} text-[0.65rem]`}>{u.role}</span>
                  {selected?._id === u._id && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-bright)" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              ))
            )}
          </div>

          {selected && (
            <div className="form-group">
              <label className="form-label">Assign Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!selected || submitting}
            onClick={handleAdd}
          >
            {submitting ? <><div className="spinner" style={{ width: 14, height: 14 }} />Adding…</> : `Add ${selected ? selected.name : 'Member'}`}
          </button>
        </div>
      </div>
    </div>
  );
}