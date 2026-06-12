'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import API from '../../lib/api';

function ResetForm() {
  const params = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords don’t match'); return; }
    if (password.length < 8)  { setError('Password must be 8+ characters'); return; }
    setLoading(true);
    try {
      await API.post('/auth/reset', { token, password });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div>
        <div className="alert-error" style={{ marginBottom: 20 }}>
          This page needs a reset link from your email. Request one below.
        </div>
        <Link href="/forgot">
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            Request reset link →
          </button>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div>
        <div className="alert-success" style={{ marginBottom: 20 }}>
          ✅ Password updated. Log in with your new password.
        </div>
        <Link href="/login">
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            Go to login →
          </button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <div className="alert-error">{error}</div>}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#5e7390', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>New password</label>
        <input type="password" placeholder="8+ characters" value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#5e7390', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Confirm password</label>
        <input type="password" placeholder="Same password again" value={confirm} onChange={e => setConfirm(e.target.value)} required />
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}>
        {loading ? 'Saving...' : 'Set new password →'}
      </button>
    </form>
  );
}

export default function ResetPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: '#ffffff' }}>Choose a new password</h1>
          <p style={{ color: '#5e7390', fontSize: 14 }}>Your Shadow Signals account password will be replaced.</p>
        </div>
        <Suspense fallback={null}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
