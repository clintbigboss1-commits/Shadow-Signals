'use client';

import { useState } from 'react';
import API from '../lib/api';

interface Props {
  userName?: string;
  onDone: () => void;
}

const STEPS = [
  {
    icon: '⚡',
    heading: 'Welcome to Shadow Signals.',
    body: 'We scan 12 Australian bookmakers in real time and surface every bet where the maths is on your side. No gut feels — pure edge.',
    cta: 'Show me how it works →',
  },
  {
    icon: '📊',
    heading: 'Every signal has a confidence score.',
    body: 'Our model converts raw EV into a 0–100% confidence score. Green means back it. Red means leave it. No jargon, no noise.',
    cta: 'What is CLV? →',
  },
  {
    icon: '🎯',
    heading: 'CLV is the only metric that matters.',
    body: 'Closing Line Value proves you found real edge — not just lucky wins. Beat the closing price consistently and long-term profit follows. We track it for every bet you log.',
    cta: 'Take me to my dashboard →',
  },
];

export default function OnboardingModal({ userName, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  async function advance() {
    if (isLast) {
      setSaving(true);
      try {
        await API.patch('/users/me/preferences', { onboarding_done: true });
      } catch { /* non-blocking */ }
      setSaving(false);
      onDone();
    } else {
      setStep(s => s + 1);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(3,7,17,.85)', backdropFilter: 'blur(6px)',
      display: 'grid', placeItems: 'center', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 460,
        background: '#0d1829',
        border: '1px solid rgba(41,121,255,.25)',
        borderRadius: 20,
        padding: 36,
        boxShadow: '0 32px 80px rgba(0,0,0,.7)',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginBottom: 30 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 20 : 7, height: 7, borderRadius: 99, background: i === step ? '#2979ff' : 'rgba(255,255,255,.15)', transition: 'all .3s' }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{ textAlign: 'center', fontSize: 44, marginBottom: 20 }}>{current.icon}</div>

        {/* Heading */}
        <h2 style={{ fontSize: 22, fontWeight: 900, textAlign: 'center', letterSpacing: -.5, marginBottom: 14, lineHeight: 1.2 }}>
          {step === 0 && userName ? `G'day, ${userName.split(' ')[0]}. ` : ''}
          {current.heading}
        </h2>

        {/* Body */}
        <p style={{ fontSize: 15, color: '#9eb1c8', lineHeight: 1.7, textAlign: 'center', marginBottom: 28 }}>
          {current.body}
        </p>

        {/* CTA */}
        <button
          onClick={advance}
          disabled={saving}
          style={{
            width: '100%', padding: '13px', borderRadius: 11,
            background: isLast ? 'linear-gradient(135deg,#00e676,#00c853)' : 'linear-gradient(135deg,#2979ff,#1e63d9)',
            border: 'none',
            color: isLast ? '#030711' : '#fff',
            fontWeight: 800, fontSize: 15, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {saving ? 'Loading...' : current.cta}
        </button>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={async () => {
              try { await API.patch('/users/me/preferences', { onboarding_done: true }); } catch { /* ok */ }
              onDone();
            }}
            style={{ display: 'block', width: '100%', marginTop: 12, background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  );
}
