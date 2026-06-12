'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import OperativePeek from '../../components/OperativePeek';
import API from '../../lib/api';
import { isLoggedIn } from '../../lib/auth';

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    intro: null as string | null,
    trial: 'Free forever',
    desc: 'See the signals. Decide if you want the reasoning.',
    features: [
      'Live signals on one sport',
      'Confidence score on every pick',
      'Stats & reasoning blurred',
      'Basic dashboard access',
    ],
    highlight: false,
  },
  {
    key: 'starter',
    name: 'Starter',
    monthlyPrice: 9.99,
    annualPrice: 7.99,
    intro: '$4.99 first month',
    trial: '7-day free trial',
    desc: 'For casual punters wanting a consistent edge.',
    features: [
      'All sports unlocked',
      'Full reasoning on every signal',
      'Email alerts',
      'Basic CLV tracking',
      'Suggested stake blurred',
    ],
    highlight: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    monthlyPrice: 19.99,
    annualPrice: 15.99,
    intro: null as string | null,
    trial: '7-day free trial',
    desc: 'Everything you need to beat the closing line.',
    features: [
      'Everything visible — no blur',
      'Unlimited +EV scanner',
      'All 12 AU bookmakers',
      'Arb finder',
      'Full CLV dashboard',
      'Suggested stake on every bet',
      'Live push alerts',
    ],
    highlight: true,
  },
  {
    key: 'elite',
    name: 'Elite',
    monthlyPrice: 49.99,
    annualPrice: 39.99,
    intro: null as string | null,
    trial: '7-day free trial',
    desc: 'For operators running serious volume.',
    features: [
      'Everything in Pro',
      'API access',
      'Multi-account tools',
      'Private Discord',
      'Priority support',
    ],
    highlight: false,
  },
];

export default function Pricing() {
  const [annual, setAnnual]   = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const loggedIn = typeof window !== 'undefined' ? isLoggedIn() : false;

  async function subscribe(plan: string) {
    if (plan === 'free') { window.location.href = isLoggedIn() ? '/dashboard' : '/signup'; return; }
    if (!isLoggedIn()) { window.location.href = '/signup'; return; }
    setLoading(plan);
    try {
      const res = await API.post('/payments/checkout', { plan, billing: annual ? 'annual' : 'monthly' });
      window.location.href = res.data.url;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error || 'Checkout failed — please try again');
    } finally { setLoading(null); }
  }

  return (
    <div className="page">
      {loggedIn && <Navbar />}

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 20px', position: 'relative' }}>
        <OperativePeek page="pricing" side="left" width={150} bottom={40} />

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p className="section-label" style={{ marginBottom: 10 }}>Pricing — AUD</p>
          <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, marginBottom: 12 }}>
            Start free. Pay when winning.
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 16, marginBottom: 8, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            These tiers should cost 5–10x more. We&apos;re charging next to nothing just to keep
            the lights on — professional-grade edge detection for pocket change.
          </p>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
            7-day free trial on every paid plan. Cancel anytime. No lock-in.
          </p>

          {/* Billing toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 99, padding: '6px 8px 6px 18px' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: annual ? '#64748b' : '#e2e8f0' }}>Monthly</span>
            <button
              onClick={() => setAnnual(a => !a)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: annual ? '#2979ff' : 'rgba(255,255,255,.12)',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s',
                flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: annual ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%',
                background: annual ? '#030711' : '#64748b',
                transition: 'left .2s',
                display: 'block',
              }} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: annual ? '#e2e8f0' : '#64748b' }}>Annual</span>
            {annual && (
              <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', color: '#00c853', padding: '3px 10px', borderRadius: 99 }}>
                SAVE 20%
              </span>
            )}
          </div>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 40 }}>
          {PLANS.map(p => {
            const price = annual ? p.annualPrice : p.monthlyPrice;
            const saving = annual && p.monthlyPrice > 0 ? Math.round((1 - p.annualPrice / p.monthlyPrice) * 100) : 0;
            const isFree = p.key === 'free';
            return (
              <div key={p.key} className="card" style={{
                position: 'relative',
                borderColor: p.highlight ? '#2979ff' : '#1e2d45',
                boxShadow: p.highlight ? '0 0 0 1px rgba(41,121,255,.2)' : 'none',
                display: 'flex', flexDirection: 'column',
              }}>
                {p.highlight && (
                  <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#2979ff', color: '#030711', fontSize: 10, fontWeight: 900, letterSpacing: 1.5, padding: '3px 14px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                    MOST POPULAR
                  </div>
                )}

                <div style={{ fontSize: 13, fontWeight: 700, color: p.highlight ? '#2979ff' : '#94a3b8', marginBottom: 8 }}>
                  {p.name}
                </div>

                <div style={{ marginBottom: 2, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 900 }}>{isFree ? '$0' : `$${price.toFixed(2)}`}</span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>AUD/mo</span>
                  {annual && !isFree && (
                    <span style={{ fontSize: 11, color: '#64748b', textDecoration: 'line-through' }}>${p.monthlyPrice.toFixed(2)}</span>
                  )}
                </div>

                {p.intro && !annual && (
                  <div style={{ fontSize: 12, color: '#ffab00', fontWeight: 800, marginBottom: 4 }}>
                    {p.intro} — then ${p.monthlyPrice.toFixed(2)}/mo
                  </div>
                )}

                {annual && !isFree && (
                  <div style={{ fontSize: 11, color: '#00c853', fontWeight: 700, marginBottom: 4 }}>
                    Save {saving}% · billed annually
                  </div>
                )}

                <div style={{ fontSize: 12, color: '#00c853', fontWeight: 600, marginBottom: 14 }}>{p.trial}</div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 18, lineHeight: 1.55 }}>{p.desc}</p>

                <ul style={{ listStyle: 'none', marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                      <span style={{ color: '#00c853', fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => subscribe(p.key)}
                  disabled={loading === p.key}
                  className={`btn ${p.highlight ? 'btn-primary' : 'btn-outline'}`}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading === p.key ? 'Loading...'
                    : isFree ? (loggedIn ? 'Go to dashboard →' : 'Start free →')
                    : loggedIn ? 'Upgrade now →' : 'Start free trial →'}
                </button>
              </div>
            );
          })}
        </div>

        {/* No account CTA */}
        {!loggedIn && (
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 12 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#2979ff', fontWeight: 600 }}>Log in</Link>
            </p>
          </div>
        )}

        {/* RG notice */}
        <div style={{ border: '1px solid rgba(245,158,11,.15)', borderRadius: 10, padding: '14px 18px', background: 'rgba(245,158,11,.03)', fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
          <strong style={{ color: '#ffab00' }}>⚠ Responsible Gambling</strong> — Gambling involves risk.
          Positive EV does not guarantee profit on any single bet. 18+ only.
          Help: <a href="tel:1800858858" style={{ color: '#2979ff' }}>1800 858 858</a> ·{' '}
          <a href="https://www.gamblinghelponline.org.au" target="_blank" rel="noreferrer" style={{ color: '#2979ff' }}>gamblinghelponline.org.au</a>
        </div>
      </div>
    </div>
  );
}
