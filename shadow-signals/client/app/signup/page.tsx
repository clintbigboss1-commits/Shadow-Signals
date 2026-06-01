'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import API from '../../lib/api';
import { saveAuth, type User } from '../../lib/auth';

export default function Signup() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return setError('Email and password required');
    if (password.length < 8) return setError('Password must be 8+ characters');

    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/register', { name, email, password });
      saveAuth(res.data.token, res.data.user as User);
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Signup failed — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030711', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#22d3ee,#06b6d4)', display: 'grid', placeItems: 'center', color: '#030711', fontWeight: 900, fontSize: 22, margin: '0 auto 16px' }}>S</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Create your account</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>7-day free trial — no credit card required</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                NAME (optional)
              </label>
              <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                EMAIL *
              </label>
              <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                PASSWORD *
              </label>
              <input type="password" placeholder="8+ characters" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 6 }}>
              {loading ? 'Creating account...' : 'Start Free Trial →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#64748b' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#22d3ee', fontWeight: 700, textDecoration: 'none' }}>Login</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#475569', marginTop: 16 }}>
          18+ only. Gambling Help: 1800 858 858
        </p>
      </div>
    </div>
  );
}
