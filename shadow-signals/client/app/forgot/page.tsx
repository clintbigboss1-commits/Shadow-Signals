'use client';

import { useState } from 'react';
import Link from 'next/link';
import API from '../../lib/api';

export default function ForgotPage() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await API.post('/auth/forgot', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: '#ffffff' }}>Forgot password?</h1>
          <p style={{ color: '#5e7390', fontSize: 14 }}>
            Enter your email and we&apos;ll send you a link to choose a new one.
          </p>
        </div>

        {sent ? (
          <div>
            <div className="alert-success" style={{ marginBottom: 20 }}>
              ✅ If that email has an account, a reset link is on its way. Check your inbox (and spam folder) — the link works for 1 hour.
            </div>
            <Link href="/login">
              <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
                ← Back to login
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div className="alert-error">{error}</div>}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#5e7390', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Email</label>
              <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}>
              {loading ? 'Sending...' : 'Send reset link →'}
            </button>
            <Link href="/login" style={{ textAlign: 'center', fontSize: 13, color: '#5e7390' }}>← Back to login</Link>
          </form>
        )}
      </div>
    </div>
  );
}
