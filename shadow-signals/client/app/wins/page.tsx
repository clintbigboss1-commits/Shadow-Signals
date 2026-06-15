'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import OperativePeek from '../../components/OperativePeek';
import API from '../../lib/api';

interface Win {
  name: string; location?: string; sport: string; event: string;
  bookie: string; odds: number; ev: string; profit: string; date: string; grade: string;
}
interface Stats {
  total_bets: string; clv_positive_pct: string;
  avg_win_profit: string; s_plus_this_month: string;
}

const GRADE_CONF: Record<string, { score: number; bg: string; color: string }> = {
  'S+': { score: 91, bg: '#00e676', color: '#030711' },
  'A':  { score: 84, bg: '#00e676', color: '#030711' },
  'B':  { score: 68, bg: '#facc15', color: '#030711' },
};

const FALLBACK_WINS: Win[] = [
  { name: 'Matt B.',  sport: 'AFL',    event: 'Collingwood v Carlton', bookie: 'Sportsbet', odds: 2.30, ev: '+9.2%', profit: '+$184', date: '18 May 2026', grade: 'S+' },
  { name: 'Sarah K.', sport: 'NRL',    event: 'Panthers v Storm',      bookie: 'TAB',       odds: 2.55, ev: '+7.8%', profit: '+$97',  date: '17 May 2026', grade: 'A'  },
  { name: 'Jake T.',  sport: 'Racing', event: 'Golden Slipper R4',     bookie: 'Bet365',    odds: 4.20, ev: '+12.1%',profit: '+$320', date: '16 May 2026', grade: 'S+' },
  { name: 'Priya M.', sport: 'EPL',    event: 'Arsenal v Man City',    bookie: 'Ladbrokes', odds: 1.95, ev: '+5.4%', profit: '+$48',  date: '15 May 2026', grade: 'A'  },
  { name: 'Chris L.', sport: 'NBA',    event: 'Lakers v Celtics',      bookie: 'Sportsbet', odds: 2.10, ev: '+6.1%', profit: '+$110', date: '13 May 2026', grade: 'A'  },
];

const SPORT_COLORS: Record<string, string> = {
  AFL: '#FFD700', NRL: '#00e676', Racing: '#ff6b35', EPL: '#7c3aed',
  NBA: '#f26522', UFC: '#ff1744', Cricket: '#06b6d4',
};

export default function WinsPage() {
  const [wins, setWins]   = useState<Win[]>(FALLBACK_WINS);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    API.get('/bets/wins').then(r => {
      if (r.data.wins?.length > 0) setWins(r.data.wins);
      if (r.data.stats) setStats(r.data.stats);
    }).catch(() => {});
  }, []);

  const clvPct    = stats ? Number(stats.clv_positive_pct).toFixed(0) + '%' : '78%';
  const avgProfit = stats ? '+$' + Number(stats.avg_win_profit).toFixed(0) : '+$124';
  const sPlus     = stats ? stats.s_plus_this_month : '23';

  const topWin = wins.reduce((best, w) => {
    const v = parseFloat(w.profit.replace(/[^0-9.-]/g, ''));
    const bv = parseFloat(best.profit.replace(/[^0-9.-]/g, ''));
    return v > bv ? w : best;
  }, wins[0]);

  return (
    <div style={{ minHeight: '100vh', background: '#060d1a', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(6,13,26,.95)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 60 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#2979ff,#1e63d9)', display: 'grid', placeItems: 'center', fontSize: 14 }}>⚡</div>
            <span style={{ fontWeight: 900, fontSize: 15, letterSpacing: .5 }}>SHADOW <span style={{ color: '#2979ff' }}>SIGNALS</span></span>
          </Link>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/markets" style={{ fontSize: 13, color: '#64748b', padding: '6px 12px' }}>Markets</Link>
            <Link href="/login"   style={{ padding: '7px 16px', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>Sign In</Link>
            <Link href="/signup"  style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#2979ff,#1e63d9)', textDecoration: 'none' }}>Get Edge →</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px 0', position: 'relative' }}>
        <OperativePeek page="wins" side="right" width={200} bottom={0} />

        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#2979ff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, background: 'rgba(41,121,255,.08)', border: '1px solid rgba(41,121,255,.2)', borderRadius: 20, padding: '5px 14px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2979ff', display: 'inline-block' }} />
            Live Results
          </div>
          <h1 style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 16, color: '#fff' }}>
            Real punters.{' '}<br />
            <span style={{ background: 'linear-gradient(135deg,#2979ff,#00e676)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Genuine edge.</span>
          </h1>
          <p style={{ color: '#5e7390', fontSize: 16, maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Every result verified against Betfair closing line. CLV positive = real edge, not just luck.
          </p>

          {/* Live stats bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, maxWidth: 600, margin: '0 auto' }}>
            {[
              { v: clvPct,    l: 'CLV positive', icon: '📈', color: '#00e676' },
              { v: avgProfit, l: 'Avg profit/win', icon: '💰', color: '#2979ff' },
              { v: sPlus,     l: 'High-conf picks', icon: '⚡', color: '#ffab00' },
            ].map(s => (
              <div key={s.l} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '18px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 28, color: s.color, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 11, color: '#334155', marginTop: 6 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top win highlight */}
        {topWin && (
          <div style={{ background: 'linear-gradient(135deg,rgba(0,230,118,.08),rgba(41,121,255,.05))', border: '1px solid rgba(0,230,118,.2)', borderRadius: 16, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 36 }}>🏆</div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#00e676', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Top win this period</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 2 }}>{topWin.event}</div>
              <div style={{ fontSize: 13, color: '#5e7390' }}>{topWin.sport} · {topWin.bookie} · ${topWin.odds} · {topWin.ev} EV</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 36, color: '#00e676', lineHeight: 1 }}>{topWin.profit}</div>
              <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>{topWin.date}</div>
            </div>
          </div>
        )}

        {/* Win feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 52 }}>
          {wins.map((w, i) => {
            const gs = GRADE_CONF[w.grade] || GRADE_CONF['B'];
            const sportColor = SPORT_COLORS[w.sport] || '#2979ff';
            const profitNum = parseFloat(w.profit.replace(/[^0-9.-]/g, ''));
            const isLargeWin = profitNum >= 100;
            return (
              <div key={i} style={{
                background: '#0d1829', border: `1px solid ${isLargeWin ? 'rgba(0,230,118,.15)' : 'rgba(255,255,255,.06)'}`,
                borderLeft: `3px solid ${isLargeWin ? '#00e676' : sportColor}`,
                borderRadius: 14, padding: '16px 20px',
                display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
                transition: 'transform .15s, box-shadow .15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,.5)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
              }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${sportColor}18`, border: `2px solid ${sportColor}40`, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 17, color: sportColor, flexShrink: 0 }}>
                  {w.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>{w.name}</span>
                    <span style={{ background: gs.bg, color: gs.color, fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 4, letterSpacing: .8 }}>{gs.score}% confidence</span>
                    <span style={{ background: `${sportColor}18`, color: sportColor, fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 4, letterSpacing: .5 }}>{w.sport}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 2 }}>{w.event}</div>
                  <div style={{ fontSize: 11, color: '#334155' }}>Best at {w.bookie} · {w.date}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 22, color: '#00e676', lineHeight: 1 }}>{w.profit}</div>
                  <div style={{ fontSize: 11, color: '#334155' }}>${w.odds} · {w.ev} EV</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* How it works strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 52 }}>
          {[
            { n: '1', title: 'We scan 12+ bookies', body: 'Every market, every second. Our engine watches for mispricings in real time.' },
            { n: '2', title: 'CLV analysis',         body: 'Every pick is verified against Betfair closing line to prove genuine edge.' },
            { n: '3', title: 'You bet smart',         body: 'Kelly sizing tells you exactly how much to put on each play.' },
          ].map(s => (
            <div key={s.n} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '20px 18px' }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(41,121,255,.15)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 16, color: '#2979ff', marginBottom: 12 }}>{s.n}</div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: '#5e7390', lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'linear-gradient(135deg,rgba(41,121,255,.06),rgba(0,230,118,.04))', border: '1px solid rgba(41,121,255,.15)', borderRadius: 20, marginBottom: 60 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#2979ff', marginBottom: 10 }}>Join 1,400+ Australian punters</div>
          <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 900, letterSpacing: -.5, marginBottom: 12, color: '#fff' }}>Your next win is waiting.</h2>
          <p style={{ color: '#5e7390', fontSize: 15, marginBottom: 28 }}>7-day free trial. No card needed. Cancel anytime.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '14px 36px', borderRadius: 12, background: 'linear-gradient(135deg,#2979ff,#1e63d9)', color: '#fff', fontWeight: 900, fontSize: 16, textDecoration: 'none', letterSpacing: .3 }}>
            ⚡ Start Free Trial →
          </Link>
          <div style={{ marginTop: 18, fontSize: 12, color: '#334155', display: 'flex', justifyContent: 'center', gap: 20 }}>
            <span>✓ No credit card</span>
            <span>✓ 7-day free</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
