import { useState, useEffect } from 'react';
import { UserPlus, X, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';
import { AvatarEl } from '../components/Layout';

interface Member {
  id: string;
  email: string;
  name?: string | null;
  role: 'ADMIN' | 'MEMBER';
  avatarUrl?: string | null;
  createdAt: string;
}

interface InviteResult { user: Member; tempPassword: string; message: string; }

export default function Team() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'MEMBER' });
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [removing, setRemoving] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    api.get('/users').then(r => { setMembers(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await api.post('/users/invite', inviteForm);
      setMembers(prev => [...prev, res.data.user]);
      setInviteResult(res.data);
      setInviteForm({ email: '', name: '', role: 'MEMBER' });
      addToast('Member invited successfully', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Invite failed', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (m: Member, newRole: 'ADMIN' | 'MEMBER') => {
    try {
      const res = await api.patch(`/users/${m.id}/role`, { role: newRole });
      setMembers(prev => prev.map(x => x.id === m.id ? { ...x, role: res.data.role } : x));
      addToast('Role updated', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to update role', 'error');
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.delete(`/users/${removeTarget.id}`);
      setMembers(prev => prev.filter(m => m.id !== removeTarget.id));
      addToast('Member removed', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to remove member', 'error');
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Team</h1>
          <p className="page-header-sub">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" id="invite-btn" onClick={() => { setShowInvite(true); setInviteResult(null); }}>
            <UserPlus size={16} /> Invite Member
          </button>
        )}
      </div>

      <div className="section-card">
        <div className="section-card-title">Organization Members</div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div className="spinner" /></div>
        ) : (
          members.map(m => (
            <div key={m.id} className="member-card">
              <AvatarEl name={m.name} url={m.avatarUrl} size="md" />
              <div className="member-info">
                <div className="member-name">{m.name || m.email} {m.id === user?.id && <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>(you)</span>}</div>
                <div className="member-email">{m.email}</div>
              </div>
              <div className="member-actions">
                <span className={`pill ${m.role === 'ADMIN' ? 'pill-admin' : 'pill-member'}`}>
                  {m.role === 'ADMIN' ? <Shield size={10} /> : <User size={10} />} {m.role}
                </span>
                {isAdmin && m.id !== user?.id && (
                  <>
                    <select
                      className="filter-select"
                      style={{ fontSize: '0.78rem', padding: '4px 24px 4px 8px' }}
                      value={m.role}
                      onChange={e => handleRoleChange(m, e.target.value as 'ADMIN' | 'MEMBER')}
                      title="Change role"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                    </select>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}
                      onClick={() => setRemoveTarget(m)} title="Remove member">
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Invite Member</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowInvite(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input id="invite-email" className="form-input" type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} placeholder="colleague@company.com" required />
              </div>
              <div className="form-input-row">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))} placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              {inviteResult && (
                <div className="invite-result">
                  <div>✓ Invite created. Share this temporary password with <strong>{inviteResult.user.email}</strong>:</div>
                  <div className="invite-result-password">{inviteResult.tempPassword}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: 6 }}>In production this would be sent via email.</div>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowInvite(false)}>Close</button>
                <button type="submit" className="btn btn-primary" disabled={inviting}>
                  {inviting ? <span className="spinner spinner-sm" /> : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {removeTarget && (
        <ConfirmDialog
          title="Remove Member"
          message={`Remove ${removeTarget.name || removeTarget.email} from the organization? Their tasks will remain.`}
          onConfirm={handleRemove}
          onCancel={() => setRemoveTarget(null)}
          loading={removing}
          confirmLabel="Remove"
        />
      )}
    </>
  );
}
