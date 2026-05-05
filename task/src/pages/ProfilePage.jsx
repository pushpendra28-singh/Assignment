import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor, formatDate } from '../utils/helpers';

const inputBase = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 10, color: '#e2e8f0',
  fontSize: '0.875rem', outline: 'none',
  padding: '10px 14px',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: 'inherit',
};

const inputError = {
  borderColor: 'rgba(244,63,94,0.5)',
  background: 'rgba(244,63,94,0.05)',
};

const inputDisabled = {
  opacity: 0.45, cursor: 'not-allowed',
  background: 'rgba(255,255,255,0.02)',
};

function FormField({ label, hint, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
      {hint && !error && <span style={{ fontSize: '0.72rem', color: '#334155' }}>{hint}</span>}
      {error && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#f43f5e' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </span>
      )}
    </div>
  );
}

function PasswordInput({ name, value, onChange, placeholder, hasError }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ ...inputBase, paddingRight: 42, ...(hasError ? inputError : {}) }}
        onFocus={e => { e.target.style.borderColor = 'rgba(129,140,248,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(129,140,248,0.1)'; }}
        onBlur={e => { e.target.style.borderColor = hasError ? 'rgba(244,63,94,0.5)' : 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center',
        }}
      >
        {show ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((p) => ({ ...p, [name]: value }));
    if (profileErrors[name]) setProfileErrors((p) => ({ ...p, [name]: '' }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((p) => ({ ...p, [name]: value }));
    if (passwordErrors[name]) setPasswordErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!profileForm.name.trim() || profileForm.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (Object.keys(errs).length) return setProfileErrors(errs);
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile(profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!passwordForm.currentPassword) errs.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) errs.newPassword = 'New password must be at least 6 characters';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) return setPasswordErrors(errs);
    setSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const avatarBg = getAvatarColor(user?.name || '');

  // Password strength
  const pw = passwordForm.newPassword;
  const strength = pw.length === 0 ? 0 : pw.length < 6 ? 1 : pw.length < 10 ? 2 : /[A-Z]/.test(pw) && /[0-9]/.test(pw) ? 4 : 3;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', '#f43f5e', '#f59e0b', '#38bdf8', '#34d399'];

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to { transform: rotate(360deg) } }
        .profile-input:focus { border-color: rgba(129,140,248,0.5) !important; box-shadow: 0 0 0 3px rgba(129,140,248,0.10) !important; }
        .tab-btn { transition: all 0.15s ease; }
        .save-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.4) !important; }
        .save-btn { transition: all 0.18s ease; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 680, animation: 'fadeUp 0.3s ease' }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.1))',
                border: '1px solid rgba(129,140,248,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h1 style={{ margin: 0, fontSize: '1.55rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                Profile
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>Manage your account settings</p>
          </div>
        </div>

        {/* ── USER CARD ── */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 18, padding: '22px 24px',
          display: 'flex', alignItems: 'center', gap: 20,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute', top: -30, left: -30, width: 160, height: 160,
            borderRadius: '50%', background: `${avatarBg}22`, filter: 'blur(40px)', pointerEvents: 'none',
          }} />

          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: avatarBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 800, color: '#fff',
              border: '3px solid rgba(255,255,255,0.12)',
              boxShadow: `0 0 0 4px ${avatarBg}33, 0 8px 24px rgba(0,0,0,0.35)`,
              overflow: 'hidden',
            }}>
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : getInitials(user?.name)
              }
            </div>
            <span style={{
              position: 'absolute', bottom: 2, right: 2,
              width: 13, height: 13, borderRadius: '50%',
              background: '#34d399', border: '2.5px solid rgba(15,22,41,0.95)',
            }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em', marginBottom: 3 }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '0.855rem', color: '#475569', marginBottom: 10 }}>{user?.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                ...(user?.role === 'admin'
                  ? { background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }
                  : { background: 'rgba(56,189,248,0.10)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.22)' }),
              }}>
                {user?.role === 'admin'
                  ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                }
                {user?.role}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Joined {formatDate(user?.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{
          display: 'flex', gap: 4,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 4, width: 'fit-content',
        }}>
          {[
            { key: 'profile', label: 'Edit Profile', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
            { key: 'security', label: 'Security', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
          ].map((tab) => (
            <button
              key={tab.key}
              className="tab-btn"
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 9, border: 'none',
                fontSize: '0.835rem', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
                ...(activeTab === tab.key
                  ? { background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }
                  : { background: 'transparent', color: '#475569' }),
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE FORM ── */}
        {activeTab === 'profile' && (
          <div style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18, overflow: 'hidden',
            animation: 'fadeUp 0.2s ease',
          }}>
            {/* Card header */}
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#e2e8f0' }}>Edit Profile</h2>
            </div>

            <form onSubmit={handleSaveProfile} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Name */}
              <FormField label="Full Name" error={profileErrors.name}>
                <input
                  type="text" name="name"
                  className="profile-input"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  placeholder="Your full name"
                  style={{ ...inputBase, ...(profileErrors.name ? inputError : {}) }}
                />
              </FormField>

              {/* Email */}
              <FormField label="Email Address" hint="Email cannot be changed.">
                <div style={{ position: 'relative' }}>
                  <input type="email" value={user?.email} disabled
                    style={{ ...inputBase, ...inputDisabled, paddingLeft: 38 }} />
                  <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#334155' }}
                    width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
              </FormField>

              {/* Role */}
              <FormField label="Role" hint="Role can only be changed by an admin.">
                <div style={{ position: 'relative' }}>
                  <input type="text" value={user?.role} disabled
                    style={{ ...inputBase, ...inputDisabled, paddingLeft: 38, textTransform: 'capitalize' }} />
                  <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#334155' }}
                    width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
              </FormField>

              {/* Avatar URL */}
              <FormField label="Avatar URL (optional)">
                <div style={{ position: 'relative' }}>
                  <input
                    type="url" name="avatar"
                    className="profile-input"
                    value={profileForm.avatar}
                    onChange={handleProfileChange}
                    placeholder="https://example.com/avatar.jpg"
                    style={{ ...inputBase, paddingLeft: 38 }}
                  />
                  <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#334155' }}
                    width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                {profileForm.avatar && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <img
                      src={profileForm.avatar} alt="Preview"
                      style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.12)', flexShrink: 0 }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span style={{ fontSize: '0.78rem', color: '#475569' }}>Avatar preview</span>
                  </div>
                )}
              </FormField>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={savingProfile}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '9px 22px', borderRadius: 10, border: 'none',
                    background: savingProfile ? 'rgba(129,140,248,0.4)' : 'linear-gradient(135deg, #6366f1, #818cf8)',
                    color: '#fff', fontSize: '0.855rem', fontWeight: 700,
                    cursor: savingProfile ? 'wait' : 'pointer',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                    fontFamily: 'inherit',
                  }}
                >
                  {savingProfile ? (
                    <>
                      <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── SECURITY FORM ── */}
        {activeTab === 'security' && (
          <div style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18, overflow: 'hidden',
            animation: 'fadeUp 0.2s ease',
          }}>
            {/* Card header */}
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </div>
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#e2e8f0' }}>Change Password</h2>
            </div>

            <form onSubmit={handleChangePassword} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Current Password */}
              <FormField label="Current Password" error={passwordErrors.currentPassword}>
                <PasswordInput
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  hasError={!!passwordErrors.currentPassword}
                />
              </FormField>

              {/* New Password */}
              <FormField label="New Password" error={passwordErrors.newPassword}>
                <PasswordInput
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Min. 6 characters"
                  hasError={!!passwordErrors.newPassword}
                />
                {/* Strength bar */}
                {passwordForm.newPassword.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 4,
                          background: i <= strength ? strengthColor[strength] : 'rgba(255,255,255,0.08)',
                          transition: 'background 0.25s',
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: strengthColor[strength] }}>
                      {strengthLabel[strength]} password
                    </span>
                  </div>
                )}
              </FormField>

              {/* Confirm Password */}
              <FormField label="Confirm New Password" error={passwordErrors.confirmPassword}>
                <PasswordInput
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Re-enter new password"
                  hasError={!!passwordErrors.confirmPassword}
                />
                {/* Match indicator */}
                {passwordForm.confirmPassword.length > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', marginTop: 4,
                    color: passwordForm.newPassword === passwordForm.confirmPassword ? '#34d399' : '#f43f5e',
                  }}>
                    {passwordForm.newPassword === passwordForm.confirmPassword ? (
                      <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Passwords match</>
                    ) : (
                      <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Passwords do not match</>
                    )}
                  </span>
                )}
              </FormField>

              {/* Tips box */}
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'rgba(129,140,248,0.06)',
                border: '1px solid rgba(129,140,248,0.15)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
                  Use at least 6 characters. Mix uppercase, numbers, and symbols for a stronger password.
                </p>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={savingPassword}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '9px 22px', borderRadius: 10, border: 'none',
                    background: savingPassword ? 'rgba(244,63,94,0.4)' : 'linear-gradient(135deg, #e11d48, #f43f5e)',
                    color: '#fff', fontSize: '0.855rem', fontWeight: 700,
                    cursor: savingPassword ? 'wait' : 'pointer',
                    boxShadow: '0 4px 16px rgba(244,63,94,0.25)',
                    fontFamily: 'inherit',
                  }}
                >
                  {savingPassword ? (
                    <>
                      <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Updating…
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}