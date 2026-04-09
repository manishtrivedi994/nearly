import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { login, signup } from '../lib/api';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { login: storeLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = mode === 'login'
        ? await login(email.trim(), password)
        : await signup(email.trim(), password);
      storeLogin(token);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 12, padding: '28px 24px',
          width: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #eee' }}>
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              style={{
                flex: 1, background: 'none', border: 'none', padding: '8px 0',
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
                color: mode === m ? '#1a1a1a' : '#999',
                borderBottom: mode === m ? '2px solid #1a1a1a' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {m === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { void handleSubmit(e); }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                border: '1px solid #ddd', borderRadius: 6, fontSize: 14,
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                border: '1px solid #ddd', borderRadius: 6, fontSize: 14,
              }}
            />
            {mode === 'signup' && (
              <span style={{ fontSize: 11, color: '#aaa', marginTop: 4, display: 'block' }}>
                At least 8 characters
              </span>
            )}
          </label>

          {error && (
            <div style={{
              fontSize: 13, color: '#c0392b', background: '#fdf0ed',
              borderRadius: 6, padding: '7px 10px', marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '9px 0', background: '#1a1a1a',
              color: '#fff', border: 'none', borderRadius: 6, fontSize: 14,
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
