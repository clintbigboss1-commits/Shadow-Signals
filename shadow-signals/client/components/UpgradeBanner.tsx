'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUser } from '../lib/auth';

/**
 * Persistent soft upgrade nudge shown to free/starter users inside the app.
 * Not aggressive — one line, dismissible, comes back after 24h.
 */
export default function UpgradeBanner() {
  const [show, setShow]   = useState(false);
  const [plan, setPlan]   = useState('free');

  useEffect(() => {
    const user = getUser();
    if (!user || !['free', 'starter'].includes(user.plan)) return;
    setPlan(user.plan);

    const dismissed = localStorage.getItem('upgrade_banner_dismissed');
    if (dismissed) {
      const ago = Date.now() - parseInt(dismissed);
      if (ago < 24 * 60 * 60 * 1000) return; // 24h cooldown
    }
    setShow(true);
  }, []);

  if (!show) return null;

  function dismiss() {
    setShow(false);
    localStorage.setItem('upgrade_banner_dismissed', String(Date.now()));
  }

  const msg = plan === 'free'
    ? 'You\'re on Free — seeing 3 of all live edges.'
    : 'You\'re on Starter — upgrade for arb finder + unlimited scanner.';

  return (
    <div style={{
      background: 'linear-gradient(90deg,#0f2a1a,#0a1f35)',
      borderBottom: '1px solid rgba(41,121,255,.15)',
      padding: '9px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      fontSize: 13,
    }}>
      <span style={{ color: '#94a3b8' }}>{msg}</span>
      <Link
        href="/pricing"
        style={{ fontWeight: 700, color: '#2979ff', textDecoration: 'none', whiteSpace: 'nowrap', padding: '4px 12px', border: '1px solid rgba(41,121,255,.3)', borderRadius: 6, fontSize: 12 }}
      >
        Upgrade →
      </Link>
      <button
        onClick={dismiss}
        style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}
      >×</button>
    </div>
  );
}
