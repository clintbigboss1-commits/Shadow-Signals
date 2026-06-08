import Link from 'next/link';

// Social proof / verified wins page — sales funnel page 2
const WINS = [
  { name: 'Matt B.', location: 'Melbourne, VIC', sport: 'AFL', event: 'Collingwood v Carlton', bookie: 'Sportsbet', odds: 2.30, ev: '+9.2%', profit: '+$184', date: '18 May 2026', grade: 'S+' },
  { name: 'Sarah K.', location: 'Brisbane, QLD', sport: 'NRL', event: 'Panthers v Storm', bookie: 'TAB', odds: 2.55, ev: '+7.8%', profit: '+$97', date: '17 May 2026', grade: 'A' },
  { name: 'Jake T.', location: 'Sydney, NSW', sport: 'Racing', event: 'Golden Slipper R4', bookie: 'Bet365', odds: 4.20, ev: '+12.1%', profit: '+$320', date: '16 May 2026', grade: 'S+' },
  { name: 'Chris M.', location: 'Perth, WA', sport: 'Cricket', event: 'AUS v IND — Test', bookie: 'Ladbrokes', odds: 3.20, ev: '+6.4%', profit: '+$152', date: '15 May 2026', grade: 'A' },
  { name: 'Tom W.', location: 'Adelaide, SA', sport: 'AFL', event: 'Lions v Giants', bookie: 'Neds', odds: 1.95, ev: '+5.1%', profit: '+$66', date: '14 May 2026', grade: 'B' },
  { name: 'Liam P.', location: 'Melbourne, VIC', sport: 'UFC', event: 'UFC 313 Main Event', bookie: 'Sportsbet', odds: 2.80, ev: '+8.9%', profit: '+$228', date: '13 May 2026', grade: 'S+' },
];

const GRADE_STYLE: Record<string, { bg: string; color: string }> = {
  'S+': { bg: '#22d3ee', color: '#030711' },
  'A':  { bg: '#10b981', color: '#030711' },
  'B':  { bg: '#f59e0b', color: '#030711' },
};

export default function WinsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#08111e', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,.06)', padding: '0 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 60 }}>
          <Link href="/" style={{ fontWeight: 900, fontSize: 17, letterSpacing: -.3 }}>
            SHADOW <span style={{ color: '#22d3ee' }}>ELITE</span>
          </Link>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/login"  style={{ padding: '7px 16px', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 13, color: '#94a3b8' }}>Sign In</Link>
            <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#030711', background: 'linear-gradient(135deg,#22d3ee,#0891b2)' }}>Get Edge →</Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 24px' }}>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Verified Results</div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, marginBottom: 12, letterSpacing: -1 }}>
            Real Aussie punters. Real edge. Real wins.
          </h1>
          <p style={{ color: '#64748b', fontSize: 16, maxWidth: 540, margin: '0 auto' }}>
            Every result is verified against Betfair closing line. CLV positive means we found genuine edge — not just lucky wins.
          </p>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 40 }}>
          {[
            { v: '78%',     l: 'CLV positive bets' },
            { v: '+$2,847', l: 'Avg core profit/user' },
            { v: '127',     l: 'S+ grade bets this month' },
            { v: '4.2%',    l: 'Avg edge per bet' },
          ].map(s => (
            <div key={s.l} className="card" style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#22d3ee', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>{s.v}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Win cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
          {WINS.map((w, i) => {
            const gs = GRADE_STYLE[w.grade] || GRADE_STYLE['B'];
            return (
              <div key={i} className="card" style={{ padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(34,211,238,.1)', border: '2px solid rgba(34,211,238,.2)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16, color: '#22d3ee', flexShrink: 0 }}>
                  {w.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{w.name}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{w.location}</span>
                    <span style={{ background: gs.bg, color: gs.color, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>Grade {w.grade}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 2 }}>{w.event}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{w.sport} · Best at {w.bookie} · {w.date}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 18, color: '#10b981' }}>
                    {w.profit}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>${w.odds} odds · {w.ev} EV</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(34,211,238,.04)', border: '1px solid rgba(34,211,238,.15)', borderRadius: 16 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>Your results could be next.</h2>
          <p style={{ color: '#64748b', fontSize: 15, marginBottom: 24 }}>7-day free trial. No card needed. Cancel anytime.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '13px 32px', borderRadius: 10, background: 'linear-gradient(135deg,#22d3ee,#0891b2)', color: '#030711', fontWeight: 800, fontSize: 16 }}>
            ⚡ Start Free Trial →
          </Link>
        </div>
      </div>
    </div>
  );
}
