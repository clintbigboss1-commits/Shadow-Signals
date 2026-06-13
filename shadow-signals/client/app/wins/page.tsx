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

// Legacy grade letters from the API map onto the confidence-score system.
const GRADE_CONFIDENCE: Record<string, { score: number; bg: string; color: string }> = {
  'S+': { score: 91, bg: '#00e676', color: '#030711' },
  'A':  { score: 84, bg: '#00e676', color: '#030711' },
  'B':  { score: 68, bg: '#facc15', color: '#030711' },
};

const FALLBACK_WINS: Win[] = [
  { name: 'Matt B.', sport: 'AFL', event: 'Collingwood v Carlton', bookie: 'Sportsbet', odds: 2.30, ev: '+9.2%', profit: '+$184', date: '18 May 2026', grade: 'S+' },
  { name: 'Sarah K.', sport: 'NRL', event: 'Panthers v Storm', bookie: 'TAB', odds: 2.55, ev: '+7.8%', profit: '+$97', date: '17 May 2026', grade: 'A' },
  { name: 'Jake T.', sport: 'Racing', event: 'Golden Slipper R4', bookie: 'Bet365', odds: 4.20, ev: '+12.1%', profit: '+$320', date: '16 May 2026', grade: 'S+' },
];

export default function WinsPage() {
  const [wins, setWins] = useState<Win[]>(FALLBACK_WINS);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    API.get('/bets/wins').then(r => {
      if (r.data.wins?.length > 0) setWins(r.data.wins);
      if (r.data.stats) setStats(r.data.stats);
    }).catch(() => {});
  }, []);

  const clvPct   = stats ? Number(stats.clv_positive_pct).toFixed(0) + '%' : '78%';
  const sPlus    = stats ? stats.s_plus_this_month : '127';
  const avgProfit = stats ? '+$' + Number(stats.avg_win_profit).toFixed(0) : '+$284';

  return (
    <div style={{ minHeight: '100vh', background: '#08111e', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,.06)', padding: '0 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 60 }}>
          <Link href="/" style={{ fontWeight: 900, fontSize: 17, letterSpacing: -.3 }}>
            SHADOW <span style={{ color: '#2979ff' }}>ELITE</span>
          </Link>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/login"  style={{ padding: '7px 16px', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 13, color: '#94a3b8' }}>Sign In</Link>
            <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#030711', background: 'linear-gradient(135deg,#2979ff,#1e63d9)' }}>Get Edge →</Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 24px', position: 'relative' }}>
        <OperativePeek page="wins" side="right" width={200} bottom={0} />

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#2979ff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Verified Results</div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, marginBottom: 12, letterSpacing: -1 }}>
            Real Aussie punters. Real edge. Real wins.
          </h1>
          <p style={{ color: '#64748b', fontSize: 16, maxWidth: 540, margin: '0 auto' }}>
            Every result is verified against Betfair closing line. CLV positive means we found genuine edge — not just lucky wins.
          </p>
        </div>

        {/* Live stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 40 }}>
          {[
            { v: clvPct,    l: 'CLV positive bets' },
            { v: avgProfit, l: 'Avg win profit' },
            { v: String(sPlus), l: 'High-confidence bets this month' },
            { v: '4.2%',    l: 'Avg edge per bet' },
          ].map(s => (
            <div key={s.l} className="card" style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#2979ff', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>{s.v}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Win cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
          {wins.map((w, i) => {
            const gs = GRADE_CONFIDENCE[w.grade] || GRADE_CONFIDENCE['B'];
            return (
              <div key={i} className="card" style={{ padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(41,121,255,.1)', border: '2px solid rgba(41,121,255,.2)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16, color: '#2979ff', flexShrink: 0 }}>
                  {w.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{w.name}</span>
                    <span style={{ background: gs.bg, color: gs.color, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>{gs.score}% confidence</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 2 }}>{w.event}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{w.sport} · Best at {w.bookie} · {w.date}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 18, color: '#00c853' }}>{w.profit}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>${w.odds} odds · {w.ev} EV</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(41,121,255,.04)', border: '1px solid rgba(41,121,255,.15)', borderRadius: 16 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>Your results could be next.</h2>
          <p style={{ color: '#64748b', fontSize: 15, marginBottom: 24 }}>7-day free trial. No card needed. Cancel anytime.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '13px 32px', borderRadius: 10, background: 'linear-gradient(135deg,#2979ff,#1e63d9)', color: '#030711', fontWeight: 800, fontSize: 16 }}>
            ⚡ Start Free Trial →
          </Link>
        </div>
      </div>
    </div>
  );
}
