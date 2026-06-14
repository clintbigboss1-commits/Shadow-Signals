'use client';

import { useState } from 'react';
import API from '../lib/api';

interface Props {
  userName?: string;
  onDone: () => void;
}

const Q1_OPTIONS = [
  { id: 'ev',   label: 'Value / EV betting',       icon: '📈' },
  { id: 'arb',  label: 'Arbitrage (risk-free)',     icon: '⚖️' },
  { id: 'multi', label: 'Multis / Accas',           icon: '🔗' },
  { id: 'sgm',  label: 'Same-game multis',          icon: '🎯' },
  { id: 'fixed', label: 'Fixed odds singles',       icon: '💡' },
  { id: 'unsure', label: 'Not sure yet',            icon: '🤔' },
];

const Q2_OPTIONS = [
  { id: 'afl',    label: 'AFL',            icon: '🏈' },
  { id: 'nrl',    label: 'NRL',            icon: '🏉' },
  { id: 'racing', label: 'Horse racing',   icon: '🐎' },
  { id: 'grey',   label: 'Greyhounds',     icon: '🐕' },
  { id: 'nba',    label: 'NBA',            icon: '🏀' },
  { id: 'soccer', label: 'Soccer',         icon: '⚽' },
  { id: 'ufc',    label: 'UFC / MMA',      icon: '🥊' },
  { id: 'cricket', label: 'Cricket',       icon: '🏏' },
];

const Q3_OPTIONS = [
  { id: 'u50',     label: 'Under $50',     desc: 'Casual punter' },
  { id: '50_200',  label: '$50 – $200',    desc: 'Regular bettor' },
  { id: '200_500', label: '$200 – $500',   desc: 'Serious player' },
  { id: '500p',    label: '$500+',         desc: 'High stakes' },
];

const Q4_OPTIONS = [
  { id: 'sportsbet',  label: 'Sportsbet'  },
  { id: 'tab',        label: 'TAB'        },
  { id: 'ladbrokes',  label: 'Ladbrokes'  },
  { id: 'bet365',     label: 'Bet365'     },
  { id: 'neds',       label: 'Neds'       },
  { id: 'betfair',    label: 'Betfair'    },
  { id: 'pointsbet',  label: 'PointsBet'  },
  { id: 'bluebet',    label: 'BlueBet'    },
];

type Selections = {
  bet_types: string[];
  sports: string[];
  stake_range: string;
  platforms: string[];
};

const EMPTY: Selections = { bet_types: [], sports: [], stake_range: '', platforms: [] };

function toggle(arr: string[], id: string) {
  return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
}

const CHIP_BASE: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '9px 14px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,.1)',
  background: 'rgba(255,255,255,.04)',
  cursor: 'pointer', fontSize: 13, fontWeight: 600,
  fontFamily: 'Inter, sans-serif', color: '#9eb1c8',
  transition: 'all .18s', userSelect: 'none',
};

const CHIP_ON: React.CSSProperties = {
  ...CHIP_BASE,
  border: '1px solid #2979ff',
  background: 'rgba(41,121,255,.14)',
  color: '#fff',
};

export default function OnboardingModal({ userName, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<Selections>(EMPTY);
  const [saving, setSaving] = useState(false);

  const first = userName?.split(' ')[0];
  const progress = ((step + 1) / 5) * 100;

  function canAdvance() {
    if (step === 0) return true;
    if (step === 1) return sel.bet_types.length > 0;
    if (step === 2) return sel.sports.length > 0;
    if (step === 3) return sel.stake_range !== '';
    if (step === 4) return sel.platforms.length > 0;
    return true;
  }

  async function advance() {
    if (step < 4) { setStep(s => s + 1); return; }
    setSaving(true);
    try {
      await API.patch('/users/me/preferences', {
        onboarding_done: true,
        onboarding_data: sel,
      });
    } catch { /* non-blocking */ }
    setSaving(false);
    onDone();
  }

  async function skip() {
    try { await API.patch('/users/me/preferences', { onboarding_done: true }); } catch { /* ok */ }
    onDone();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(3,7,17,.9)', backdropFilter: 'blur(8px)',
      display: 'grid', placeItems: 'center', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 500,
        background: '#0d1829',
        border: '1px solid rgba(41,121,255,.2)',
        borderRadius: 22,
        padding: '36px 36px 28px',
        boxShadow: '0 40px 100px rgba(0,0,0,.75)',
      }}>
        {/* Progress bar */}
        <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 99, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#2979ff,#6c63ff)', borderRadius: 99, transition: 'width .4s ease' }} />
        </div>

        {/* Step 0 — welcome */}
        {step === 0 && (
          <>
            <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 16 }}>👋</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, textAlign: 'center', marginBottom: 12, letterSpacing: -.5 }}>
              {first ? `G'day, ${first}.` : "G'day."} Welcome to Shadow Signals.
            </h2>
            <p style={{ fontSize: 15, color: '#9eb1c8', lineHeight: 1.7, textAlign: 'center', marginBottom: 28 }}>
              We scan 12 Australian bookmakers in real time and surface every bet where the maths is on your side. Four quick questions so we can personalise your dashboard.
            </p>
          </>
        )}

        {/* Step 1 — bet types */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6, letterSpacing: -.4 }}>What kind of bets do you place?</h2>
            <p style={{ fontSize: 13, color: '#5e7390', marginBottom: 20 }}>Select all that apply.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
              {Q1_OPTIONS.map(o => (
                <div key={o.id}
                  style={sel.bet_types.includes(o.id) ? CHIP_ON : CHIP_BASE}
                  onClick={() => setSel(s => ({ ...s, bet_types: toggle(s.bet_types, o.id) }))}
                >
                  <span>{o.icon}</span>{o.label}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step 2 — sports */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6, letterSpacing: -.4 }}>Which sports do you bet on?</h2>
            <p style={{ fontSize: 13, color: '#5e7390', marginBottom: 20 }}>Select all that apply.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
              {Q2_OPTIONS.map(o => (
                <div key={o.id}
                  style={sel.sports.includes(o.id) ? CHIP_ON : CHIP_BASE}
                  onClick={() => setSel(s => ({ ...s, sports: toggle(s.sports, o.id) }))}
                >
                  <span>{o.icon}</span>{o.label}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step 3 — stake size */}
        {step === 3 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6, letterSpacing: -.4 }}>What's your typical stake size?</h2>
            <p style={{ fontSize: 13, color: '#5e7390', marginBottom: 20 }}>Per bet, in AUD.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {Q3_OPTIONS.map(o => (
                <div key={o.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '13px 16px', borderRadius: 11, cursor: 'pointer',
                    border: sel.stake_range === o.id ? '1px solid #2979ff' : '1px solid rgba(255,255,255,.1)',
                    background: sel.stake_range === o.id ? 'rgba(41,121,255,.14)' : 'rgba(255,255,255,.03)',
                    transition: 'all .18s',
                  }}
                  onClick={() => setSel(s => ({ ...s, stake_range: o.id }))}
                >
                  <span style={{ fontWeight: 700, fontSize: 14, color: sel.stake_range === o.id ? '#fff' : '#9eb1c8' }}>{o.label}</span>
                  <span style={{ fontSize: 12, color: '#5e7390' }}>{o.desc}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step 4 — platforms */}
        {step === 4 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6, letterSpacing: -.4 }}>Which platforms do you use?</h2>
            <p style={{ fontSize: 13, color: '#5e7390', marginBottom: 20 }}>We'll highlight odds from your bookies first.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
              {Q4_OPTIONS.map(o => (
                <div key={o.id}
                  style={sel.platforms.includes(o.id) ? CHIP_ON : CHIP_BASE}
                  onClick={() => setSel(s => ({ ...s, platforms: toggle(s.platforms, o.id) }))}
                >
                  {o.label}
                </div>
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        <button
          onClick={advance}
          disabled={saving || !canAdvance()}
          style={{
            width: '100%', padding: '13px', borderRadius: 12,
            background: step === 4
              ? (canAdvance() ? 'linear-gradient(135deg,#00e676,#00c853)' : 'rgba(255,255,255,.06)')
              : (canAdvance() ? 'linear-gradient(135deg,#2979ff,#1e63d9)' : 'rgba(255,255,255,.06)'),
            border: 'none',
            color: step === 4 && canAdvance() ? '#030711' : (canAdvance() ? '#fff' : '#475569'),
            fontWeight: 800, fontSize: 15, cursor: canAdvance() ? 'pointer' : 'default',
            fontFamily: 'Inter, sans-serif', transition: 'all .2s',
          }}
        >
          {saving ? 'Setting up your dashboard...' : step === 0 ? 'Get started →' : step === 4 ? 'Take me to my dashboard →' : 'Next →'}
        </button>

        {step > 0 && (
          <button onClick={skip} style={{ display: 'block', width: '100%', marginTop: 10, background: 'none', border: 'none', color: '#475569', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
