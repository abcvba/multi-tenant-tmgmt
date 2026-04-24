import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AvatarEl } from '../components/Layout';

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Update via /auth/me would need a PATCH, for now we just show the concept
      // In a full impl you'd add PATCH /api/users/me — here we notify as demo
      addToast('Profile saved (backend PATCH /users/me not implemented in demo)', 'info');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="page-header-sub">Manage your account and workspace</p>
        </div>
      </div>

      {/* Profile */}
      <div className="section-card">
        <div className="section-card-title">Profile</div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
          <AvatarEl name={user?.name} url={user?.avatarUrl} size="lg" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user?.name || user?.email}</div>
            <div style={{ fontSize: '0.83rem', color: 'var(--color-text-dim)', marginTop: 2 }}>{user?.email}</div>
            <span className={`pill ${user?.role === 'ADMIN' ? 'pill-admin' : 'pill-member'}`} style={{ marginTop: 6, display: 'inline-flex' }}>
              {user?.role}
            </span>
          </div>
        </div>
        <form onSubmit={handleSaveName} style={{ maxWidth: 360 }}>
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <button type="submit" className="btn btn-secondary" disabled={saving}>
            {saving ? <span className="spinner spinner-sm" /> : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Organization */}
      <div className="section-card">
        <div className="section-card-title">Organization</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 400 }}>
          <div>
            <div className="form-label">Name</div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>{user?.organization?.name || '—'}</div>
          </div>
          <div>
            <div className="form-label">Slug</div>
            <div style={{ fontWeight: 600, marginTop: 4, fontFamily: 'monospace', fontSize: '0.85rem' }}>{user?.organization?.slug || '—'}</div>
          </div>
          <div>
            <div className="form-label">Your Role</div>
            <div style={{ marginTop: 4 }}>
              <span className={`pill ${user?.role === 'ADMIN' ? 'pill-admin' : 'pill-member'}`}>{user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication */}
      <div className="section-card">
        <div className="section-card-title">Authentication</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-dim)', marginBottom: 16 }}>
          {user?.avatarUrl ? '✓ Signed in with Google OAuth' : '✓ Signed in with email and password'}
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>Sign Out</button>
      </div>

      {/* Danger Zone */}
      <div className="section-card" style={{ borderColor: 'rgba(248,113,113,0.2)' }}>
        <div className="section-card-title" style={{ color: 'var(--color-danger)' }}>Danger Zone</div>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-dim)', marginBottom: 16 }}>
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button className="btn btn-danger btn-sm" onClick={() => addToast('Account deletion is not implemented in this demo', 'info')}>
          Delete Account
        </button>
      </div>
    </>
  );
}
