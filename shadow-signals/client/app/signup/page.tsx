'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import API from '../../lib/api';
import { saveAuth, isLoggedIn, type User } from '../../lib/auth';
import Logo from '../../components/Logo';

const WINS = [
  { user: 'Jake T.', loc: 'Sydney', result: '+$1,240', detail: 'AFL arb — Round 18' },
  { user: 'Matt B.', loc: 'Melbourne', result: '+4.2%', detail: 'CLV avg · 2 months' },
  { user: 'Liam P.', loc: 'Melbourne', result: '+340%', detail: 'ROI in week one' },
];

const FEATURES = [
  'Unlimited +EV scanner across 12 AU bookies',
  '0–100% confidence score on every bet',
  'Arb finder locks in guaranteed profit',
  'Betfair CLV tracker proves your edge',
  'Suggested stake — right size every bet',
];

export default function Signup() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const router = useRouter();

  useEffect(() => {
    // B1: redirect already-logged-in users
    if (isLoggedIn()) router.replace('/dashboard');
  }, [router]);

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
    <div className="auth-split" style={{ background: '#0a1929', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Left brand panel ─────────────────────────── */}
      <div className="auth-brand" style={{
        background: 'linear-gradient(160deg, #060e1a 0%, #0a1929 100%)',
        padding: 'clamp(40px,6vh,72px) clamp(36px,5vw,64px)',
        borderRight: '1px solid rgba(255,255,255,.06)',
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        {/* background glows */}
        <div style={{ position: 'absolute', top: -120, left: -80, width: 420, height: 420, background: 'radial-gradient(circle, rgba(168,85,247,.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 320, height: 320, background: 'radial-gradient(circle, rgba(41,121,255,.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Logo href="/" size={36} />
        </div>

        {/* Main message */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 18 }}>
            7-day free trial · No credit card
          </div>
          <h2 style={{ fontSize: 'clamp(30px,3.5vw,46px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: -1.5, marginBottom: 20, color: '#ffffff' }}>
            Start winning<br/>from day one.
          </h2>

          {/* Recent wins ticker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
            {WINS.map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(34,197,94,.05)', border: '1px solid rgba(34,197,94,.14)', borderRadius: 10, padding: '11px 14px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(34,197,94,.12)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, color: '#00e676', flexShrink: 0 }}>
                  {w.user[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{w.user} <span style={{ color: '#5e7390', fontWeight: 400, fontSize: 12 }}>· {w.loc}</span></div>
                  <div style={{ fontSize: 12, color: '#5e7390' }}>{w.detail}</div>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 16, color: '#00e676', flexShrink: 0 }}>{w.result}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <span style={{ color: '#2979ff', fontWeight: 800, flexShrink: 0 }}>✓</span>
                <span style={{ color: '#9eb1c8' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust row — static brand values (not fake user stats) */}
        <div style={{ display: 'flex', gap: 24, position: 'relative', zIndex: 1 }}>
          {[['12', 'AU bookies scanned'], ['7-day', 'Free trial'], ['0–100%', 'Confidence score']].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 18, color: '#2979ff', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 11, color: '#5e7390', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────── */}
      <div className="auth-form-panel">
        <div style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: '#ffffff' }}>Create your account</h1>
            <p style={{ color: '#5e7390', fontSize: 14 }}>7-day free trial — no credit card required</p>
          </div>

          {error && <div className="alert-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#5e7390', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Name (optional)</label>
              <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#5e7390', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Email</label>
              <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#5e7390', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Password</label>
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
            <span style={{ position: 'relative', background: '#0a1929', padding: '0 12px', fontSize: 12, color: '#2d4060' }}>Have an account?</span>
          </div>

          <Link href="/login">
            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              Log in →
            </button>
          </Link>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#2d4060' }}>
            18+ only · Gambling Help: <a href="tel:1800858858" style={{ color: '#5e7390' }}>1800 858 858</a>
          </p>
        </div>
      </div>
    </div>
  );
}
