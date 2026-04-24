import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      addToast('Google sign-in failed. Please try again.', 'error');
      navigate('/login');
      return;
    }

    // Store token, then fetch user info
    localStorage.setItem('token', token);
    api.get('/auth/me')
      .then(res => {
        login(token, res.data);
        addToast(`Welcome, ${res.data.name || res.data.email}! 🎉`, 'success');
        navigate('/dashboard');
      })
      .catch(() => {
        addToast('Authentication failed. Please try again.', 'error');
        navigate('/login');
      });
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" />
      <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>Completing sign-in…</p>
    </div>
  );
}
