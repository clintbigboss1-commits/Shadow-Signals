'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import API from '../../lib/api';
import { saveAuth, type User } from '../../lib/auth';

const BENEFITS = [
  '12 AU bookmakers scanned in real-time',
  'Grade S+, A, B confidence on every bet',
  'Arb finder locks in guaranteed profit',
  'Betfair CLV tracking proves your edge',
];

const STATS = [
  { v: '7,416+', l: 'Active users' },
  { v: '78%',    l: 'CLV positive' },
  { v: '+$2.8k', l: 'Avg monthly gain' },
];

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return setError('Email and password required');
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/login', { email, password });
      saveAuth(res.data.token, res.data.user as User);
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Login failed — check your credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split" style={{ background: '#08111e', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Left brand panel ─────────────────────────── */}
      <div className="auth-brand" style={{
        background: 'linear-gradient(160deg, #040c1a 0%, #06111f 100%)',
        padding: 'clamp(40px,6vh,72px) clamp(36px,5vw,64px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        borderRight: '1px solid rgba(255,255,255,.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* background glow */}
        <div style={{ position: 'absolute', top: -120, right: -120, width: 480, height: 480, background: 'radial-gradient(circle, rgba(34,211,238,.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 320, height: 320, background: 'radial-gradient(circle, rgba(99,102,241,.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#22d3ee,#0891b2)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 17, color: '#030711' }}>S</div>
          <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: -.3, color: '#e2e8f0' }}>
            SHADOW <span style={{ color: '#22d3ee' }}>ELITE</span>
          </span>
        </Link>

        {/* Main message */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 18 }}>
            Australia&apos;s #1 betting intelligence
          </div>
          <h2 style={{ fontSize: 'clamp(30px,3.5vw,46px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: -1.5, marginBottom: 20, color: '#e2e8f0' }}>
            Your edge<br/>is waiting.
          </h2>

          {/* Live alert card */}
          <div style={{ background: 'rgba(34,211,238,.05)', border: '1px solid rgba(34,211,238,.18)', borderRadius: 14, padding: '16px 18px', marginBottom: 32, maxWidth: 360 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 8px #22d3ee' }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: 1.2 }}>Grade S+ Alert</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0', marginBottom: 6 }}>Manchester City v Arsenal</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Man City ML — Sportsbet</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: '#10b981', fontSize: 17 }}>+12.4%</span>
            </div>
          </div>

          {/* Benefits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <span style={{ color: '#10b981', fontWeight: 800, flexShrink: 0 }}>✓</span>
                <span style={{ color: '#94a3b8' }}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 28, position: 'relative', zIndex: 1 }}>
          {STATS.map(s => (
            <div key={s.l}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 20, color: '#22d3ee', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────── */}
      <div className="auth-form-panel">
        <div style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: '#e2e8f0' }}>Welcome back</h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>Log in to your Shadow Elite account</p>
          </div>

          {error && <div className="alert-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Email</label>
              <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Password</label>
                <span style={{ fontSize: 12, color: '#22d3ee', cursor: 'pointer' }}>Forgot password?</span>
              </div>
              <input type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 4 }}
            >
              {loading ? 'Logging in...' : 'Login →'}
            </button>
          </form>

          <div style={{ position: 'relative', margin: '24px 0', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,.06)' }} />
            <span style={{ position: 'relative', background: '#08111e', padding: '0 12px', fontSize: 12, color: '#475569' }}>No account?</span>
          </div>

          <Link href="/signup">
            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              Start 7-day free trial →
            </button>
          </Link>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#334155' }}>
            18+ only · Gambling Help: <a href="tel:1800858858" style={{ color: '#475569' }}>1800 858 858</a>
          </p>
        </div>
      </div>
    </div>
  );
}
