'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import API from '../../lib/api';
import { saveAuth, type User } from '../../lib/auth';

const WINS = [
  { user: 'Jake T.', loc: 'Sydney', result: '+$1,240', detail: 'AFL arb — Round 18' },
  { user: 'Matt B.', loc: 'Melbourne', result: '+4.2%', detail: 'CLV avg · 2 months' },
  { user: 'Liam P.', loc: 'Melbourne', result: '+340%', detail: 'ROI in week one' },
];

const FEATURES = [
  'Unlimited +EV scanner across 12 AU bookies',
  'Grade S+ / A / B confidence on every bet',
  'Arb finder locks in guaranteed profit',
  'Betfair CLV tracker proves your edge',
  'Kelly staking — right size every bet',
];

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
    <div className="auth-split" style={{ background: '#08111e', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Left brand panel ─────────────────────────── */}
      <div className="auth-brand" style={{
        background: 'linear-gradient(160deg, #040c1a 0%, #06111f 100%)',
        padding: 'clamp(40px,6vh,72px) clamp(36px,5vw,64px)',
        borderRight: '1px solid rgba(255,255,255,.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* background glows */}
        <div style={{ position: 'absolute', top: -120, left: -80, width: 420, height: 420, background: 'radial-gradient(circle, rgba(139,92,246,.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 320, height: 320, background: 'radial-gradient(circle, rgba(34,211,238,.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#22d3ee,#0891b2)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 17, color: '#030711' }}>S</div>
          <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: -.3, color: '#e2e8f0' }}>
            SHADOW <span style={{ color: '#22d3ee' }}>ELITE</span>
          </span>
        </Link>

        {/* Main message */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 18 }}>
            7-day free trial · No credit card
          </div>
          <h2 style={{ fontSize: 'clamp(30px,3.5vw,46px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: -1.5, marginBottom: 20, color: '#e2e8f0' }}>
            Start winning<br/>from day one.
          </h2>

          {/* Recent wins ticker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
            {WINS.map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(16,185,129,.05)', border: '1px solid rgba(16,185,129,.14)', borderRadius: 10, padding: '11px 14px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(16,185,129,.12)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, color: '#10b981', flexShrink: 0 }}>
                  {w.user[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{w.user} <span style={{ color: '#64748b', fontWeight: 400, fontSize: 12 }}>· {w.loc}</span></div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{w.detail}</div>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 16, color: '#10b981', flexShrink: 0 }}>{w.result}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <span style={{ color: '#22d3ee', fontWeight: 800, flexShrink: 0 }}>✓</span>
                <span style={{ color: '#94a3b8' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust row */}
        <div style={{ display: 'flex', gap: 24, position: 'relative', zIndex: 1 }}>
          {[['7,416+', 'Active users'], ['78%', 'CLV positive'], ['+$2.8k', 'Avg monthly']].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 18, color: '#22d3ee', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────── */}
      <div className="auth-form-panel">
        <div style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: '#e2e8f0' }}>Create your account</h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>7-day free trial — no credit card required</p>
          </div>

          {error && <div className="alert-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Name (optional)</label>
              <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Email</label>
              <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Password</label>
              <input type="password" placeholder="8+ characters" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 4 }}
            >
              {loading ? 'Creating account...' : '⚡ Start Free Trial →'}
            </button>
          </form>

          <div style={{ position: 'relative', margin: '24px 0', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,.06)' }} />
            <span style={{ position: 'relative', background: '#08111e', padding: '0 12px', fontSize: 12, color: '#475569' }}>Have an account?</span>
          </div>

          <Link href="/login">
            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              Log in →
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
