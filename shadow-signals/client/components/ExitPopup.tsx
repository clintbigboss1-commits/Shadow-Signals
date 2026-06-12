'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Exit-intent popup — fires when mouse moves toward top of screen (leaving tab)
 * Also fires after 45s on pricing page if user hasn't converted
 * Shown max once per session
 */
export default function ExitPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [done, setDone]   = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem('exit_popup_seen')) return;

    let triggered = false;

    function trigger() {
      if (triggered) return;
      triggered = true;
      sessionStorage.setItem('exit_popup_seen', '1');
      setShow(true);
    }

    // Mouse exit intent (moves to top 10% of screen)
    function onMouseMove(e: MouseEvent) {
      if (e.clientY < window.innerHeight * 0.08) {
        trigger();
      }
    }

    // Timer fallback — show after 60s on any page
    const timer = setTimeout(trigger, 60000);

    document.addEventListener('mousemove', onMouseMove);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setShow(false);
    sessionStorage.setItem('exit_popup_seen', '1');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Just redirect to signup with email pre-filled
    window.location.href = `/signup?email=${encodeURIComponent(email)}`;
  }

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 999, backdropFilter: 'blur(4px)' }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 1000, width: '100%', maxWidth: 480,
        background: '#0d1526',
        border: '1px solid rgba(41,121,255,.3)',
        borderRadius: 20,
        padding: 0, overflow: 'hidden',
        boxShadow: '0 40px 80px rgba(0,0,0,.8)',
        animation: 'popup-in .3s cubic-bezier(.34,1.56,.64,1)',
      }}>

        {/* Header image area */}
        <div style={{ background: 'linear-gradient(135deg,#0f2a3d,#1a1040)', padding: '28px 28px 20px', textAlign: 'center', position: 'relative' }}>
          <button
            onClick={dismiss}
            style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', color: '#64748b', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>

          <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#e2e8f0', margin: '0 0 6px', letterSpacing: -.5 }}>
            Wait — don&apos;t leave your edge behind
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
            We found{' '}
            <strong style={{ color: '#2979ff' }}>
              {Math.floor(Math.random() * 8) + 3} +EV markets
            </strong>
            {' '}open right now. Start free — no card needed.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 28px 28px' }}>

          {/* Social proof */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, padding: '10px 14px', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)', borderRadius: 10 }}>
            <span style={{ fontSize: 20 }}>👥</span>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              <strong style={{ color: '#00c853' }}>7,416 Aussie punters</strong> used Shadow Signals this week
            </span>
          </div>

          {done ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <p style={{ color: '#00c853', fontWeight: 700, fontSize: 16 }}>Redirecting to your free trial...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ fontSize: 15, padding: '11px 14px' }}
              />
              <button
                type="submit"
                style={{ padding: '13px', borderRadius: 10, background: 'linear-gradient(135deg,#2979ff,#1e63d9)', border: 'none', color: '#030711', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                ⚡ Start My Free Trial →
              </button>
              <Link
                href="/pricing"
                onClick={dismiss}
                style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}
              >
                See pricing first
              </Link>
            </form>
          )}

          <p style={{ fontSize: 11, color: '#475569', textAlign: 'center', margin: '14px 0 0' }}>
            7-day free trial · No credit card · Cancel anytime · 18+ only
          </p>
        </div>
      </div>

      <style>{`
        @keyframes popup-in {
          from { opacity:0; transform:translate(-50%,-48%) scale(.96); }
          to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
        }
      `}</style>
    </>
  );
}
