'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import API from '../../lib/api';
import { isLoggedIn } from '../../lib/auth';

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$9.99',
    trial: '7-day free trial',
    desc: 'For casual punters wanting a consistent edge.',
    features: ['Top 5 +EV plays daily', 'AFL & NRL focus', 'Email alerts', 'Basic CLV tracking'],
    highlight: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$19.99',
    trial: '7-day free trial',
    desc: 'Everything you need to beat the closing line.',
    features: [
      'Unlimited +EV scanner',
      'All 12 AU bookmakers',
      'Arb finder',
      'Full CLV dashboard',
      'Kelly staking on every bet',
      'Live push alerts',
      'All sports',
    ],
    highlight: true,
  },
  {
    key: 'elite',
    name: 'Elite',
    price: '$49.99',
    trial: '7-day free trial',
    desc: 'For operators running serious volume.',
    features: ['Everything in Pro', 'API access', 'Multi-account tools', 'Private Discord'],
    highlight: false,
  },
];

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const loggedIn = typeof window !== 'undefined' ? isLoggedIn() : false;

  async function subscribe(plan: string) {
    if (!isLoggedIn()) { window.location.href = '/signup'; return; }
    setLoading(plan);
    try {
      const res = await API.post('/payments/checkout', { plan });
      window.location.href = res.data.url;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error || 'Checkout failed — please try again');
    } finally { setLoading(null); }
  }

  return (
    <div className="page">
      {loggedIn && <Navbar />}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 20px' }}>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p className="section-label" style={{ marginBottom: 10 }}>Pricing — AUD</p>
          <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, marginBottom: 12 }}>
            Start free. Pay when winning.
          </h1>
          <p style={{ color: '#64748b', fontSize: 16 }}>
            7-day free trial on every plan. Cancel anytime. No lock-in.
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 40 }}>
          {PLANS.map(p => (
            <div key={p.key} className="card" style={{
              position: 'relative',
              borderColor: p.highlight ? '#22d3ee' : '#1e2d45',
              boxShadow: p.highlight ? '0 0 0 1px rgba(34,211,238,.2)' : 'none',
            }}>
              {p.highlight && (
                <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#22d3ee', color: '#030711', fontSize: 10, fontWeight: 900, letterSpacing: 1.5, padding: '3px 14px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                  MOST POPULAR
                </div>
              )}

              <div style={{ fontSize: 13, fontWeight: 700, color: p.highlight ? '#22d3ee' : '#94a3b8', marginBottom: 8 }}>
                {p.name}
              </div>

              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 900 }}>{p.price}</span>
                <span style={{ fontSize: 13, color: '#64748b' }}> AUD/mo</span>
              </div>

              <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginBottom: 14 }}>{p.trial}</div>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 18, lineHeight: 1.55 }}>{p.desc}</p>

              <ul style={{ listStyle: 'none', marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                    <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => subscribe(p.key)}
                disabled={loading === p.key}
                className={`btn ${p.highlight ? 'btn-primary' : 'btn-outline'}`}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading === p.key ? 'Loading...' : 'Start free trial →'}
              </button>
            </div>
          ))}
        </div>

        {/* No account CTA */}
        {!loggedIn && (
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 12 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#22d3ee', fontWeight: 600 }}>Log in</Link>
            </p>
          </div>
        )}

        {/* RG notice */}
        <div style={{ border: '1px solid rgba(245,158,11,.15)', borderRadius: 10, padding: '14px 18px', background: 'rgba(245,158,11,.03)', fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
          <strong style={{ color: '#f59e0b' }}>⚠ Responsible Gambling</strong> — Gambling involves risk.
          Positive EV does not guarantee profit on any single bet. 18+ only.
          Help: <a href="tel:1800858858" style={{ color: '#22d3ee' }}>1800 858 858</a> ·{' '}
          <a href="https://www.gamblinghelponline.org.au" target="_blank" rel="noreferrer" style={{ color: '#22d3ee' }}>gamblinghelponline.org.au</a>
        </div>
      </div>
    </div>
  );
}
