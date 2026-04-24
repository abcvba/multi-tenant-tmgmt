import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';

const GOOGLE_ENABLED = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', name: '', organizationName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.token, res.data.user);
      addToast('Account created! Welcome to Tempo 🎉', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-blob" style={{ width: 500, height: 500, background: '#818cf8', top: -200, right: -200 }} />
      <div className="auth-bg-blob" style={{ width: 400, height: 400, background: '#6EE7B7', bottom: -150, left: -100 }} />

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">⚡</div>
          <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>Tempo</span>
        </div>

        <h1 className="auth-title">Create your workspace</h1>
        <p className="auth-subtitle">Set up your team in seconds</p>

        {GOOGLE_ENABLED && (
          <>
            <a href={`${API_BASE}/api/auth/google`} className="btn btn-google">
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 4 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </a>
            <div className="auth-divider">or</div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-input-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input id="name" className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input id="reg-email" className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Organization Name *</label>
            <input id="org-name" className="form-input" value={form.organizationName} onChange={e => set('organizationName', e.target.value)} placeholder="Acme Corp" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input id="reg-password" className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" required />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button id="register-btn" type="submit" className="btn btn-primary btn-block" style={{ marginTop: 20 }} disabled={loading}>
            {loading ? <span className="spinner spinner-sm" /> : 'Create Workspace'}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
