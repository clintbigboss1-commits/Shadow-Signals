import Link from 'next/link';
import ExitPopup from '../components/ExitPopup';
import Navbar from '../components/Navbar';

const BOOKIES = ['Sportsbet','TAB','Bet365 AU','Ladbrokes','Neds','PointsBet','BlueBet','Betfair Exchange'];

const FEATURES = [
  { icon: '⚡', title: '+EV Scanner',   desc: 'Every mispriced line across 12 AU bookies, ranked by edge. Sportsbet, TAB, Bet365 — all in one place.' },
  { icon: '🎯', title: 'Grade System',  desc: 'S+, A, B, C confidence ratings on every market. Only bet when the grade is right for your bankroll.' },
  { icon: '🔒', title: 'Arb Finder',   desc: 'Guaranteed profit when bookmakers disagree. Built-in stake calculator. No variance, no luck.' },
  { icon: '📊', title: 'CLV Tracker',  desc: 'Track closing line value — the only metric that proves long-term edge without needing a thousand bets.' },
];

const STATS = [
  { icon: '🎯', value: '127',     label: 'High-confidence bets' },
  { icon: '📈', value: '78%',     label: 'CLV positive rate'    },
  { icon: '⚡', value: '+$2,847', label: 'Core profit AUD'      },
  { icon: '👥', value: '+$5,392', label: 'Syndicate profit'     },
];

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#08111e', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>

      <ExitPopup />

      {/* RG bar */}
      <div style={{ background: '#040a14', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '8px 24px', textAlign: 'center', fontSize: 12, color: '#64748b' }}>
        <strong style={{ color: '#f59e0b' }}>18+ Only.</strong>{' '}Think about your choices. Call{' '}
        <a href="tel:1800858858" style={{ color: '#22d3ee', fontWeight: 700 }}>1800 858 858</a>
        {' '}• gamblinghelponline.org.au
      </div>

      {/* Nav */}
      <Navbar />

      {/* Hero */}
      <section style={{ position: 'relative', padding: '80px 24px 64px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 60% 0%,rgba(34,211,238,.07),transparent 70%)', pointerEvents: 'none' }} />
        <div className="landing-hero-grid" style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* Left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(34,211,238,.3)', background: 'rgba(34,211,238,.06)', color: '#22d3ee', fontSize: 12, fontWeight: 700, marginBottom: 28, letterSpacing: .5 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }} />
              LIVE • 12 AU BOOKIES + BETFAIR EX SYNCED
            </div>

            <h1 style={{ fontSize: 'clamp(52px,7vw,84px)', fontWeight: 900, lineHeight: .92, letterSpacing: -3, marginBottom: 20, textTransform: 'uppercase' }}>
              SHADOW<br />
              <span style={{ background: 'linear-gradient(135deg,#22d3ee 0%,#818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SIGNALS</span>
            </h1>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>
              Beat the closing line <span style={{ color: '#22d3ee' }}>every time</span>
            </p>
            <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, maxWidth: 480, marginBottom: 36 }}>
              We compare every Aussie bookie and Betfair Exchange against the true no-vig price. When Sportsbet, TAB or Ladbrokes lag behind sharp money, we surface that{' '}
              <strong style={{ color: '#e2e8f0' }}>mispriced bet</strong> to you — a price-comparison engine for punters, in decimal odds.
            </p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 36, flexWrap: 'wrap' }}>
              <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 10, fontSize: 15, fontWeight: 700, color: '#030711', background: 'linear-gradient(135deg,#22d3ee,#0891b2)' }}>
                ⚡ Find My Edge in 60s
              </Link>
              <Link href="/markets" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 10, fontSize: 15, fontWeight: 600, color: '#e2e8f0', border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.04)' }}>
                📊 Live Dashboard
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex' }}>
                {['🎯','🏆','⚡','💰','🎰'].map((e, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e293b', border: '2px solid #0f172a', display: 'grid', placeItems: 'center', fontSize: 14, marginLeft: i > 0 ? -8 : 0 }}>{e}</div>
                ))}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>7,416 <span style={{ color: '#22d3ee' }}>Aussie sharps</span></div>
                <div style={{ fontSize: 12, color: '#64748b' }}>beat the line this week</div>
              </div>
            </div>
          </div>

          {/* Right — live stats card */}
          <div>
            <div style={{ background: 'linear-gradient(135deg,#0f2a3d,#0d1f2d)', border: '1px solid rgba(34,211,238,.15)', borderRadius: 20, padding: 24, boxShadow: '0 40px 80px rgba(0,0,0,.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(34,211,238,.15)', border: '1px solid rgba(34,211,238,.3)', display: 'grid', placeItems: 'center', fontSize: 9 }}>✓</span>
                  Verified Edge
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#22d3ee', fontWeight: 700 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }} />
                  LIVE NOW
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {STATS.map((s, i) => {
                  const cols = ['#6366f1','#22d3ee','#10b981','#8b5cf6'];
                  const bgs  = ['rgba(99,102,241,.12)','rgba(34,211,238,.1)','rgba(16,185,129,.1)','rgba(139,92,246,.12)'];
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: bgs[i], border: `1px solid ${cols[i]}22` }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${cols[i]}20`, display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
                      <div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: cols[i], fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: .8, marginTop: 3 }}>{s.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GET YOUR EDGE */}
      <div style={{ padding: '24px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 900, letterSpacing: -2, textTransform: 'uppercase', background: 'linear-gradient(135deg,#22d3ee,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          GET YOUR EDGE
        </div>
      </div>

      {/* Bookie strip */}
      <div style={{ padding: '8px 32px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center', marginBottom: 14 }}>Synced with</p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
            {BOOKIES.map(b => (
              <span key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.03)', fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', display: 'inline-block' }} />{b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <section style={{ padding: '56px 32px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Platform</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: -1 }}>Everything you need to beat the line</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ padding: 24, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16 }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{f.title}</div>
                <div style={{ color: '#64748b', fontSize: 14, lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section style={{ padding: '56px 32px', borderTop: '1px solid rgba(255,255,255,.05)', textAlign: 'center' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Pricing</div>
          <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 900, marginBottom: 8 }}>Start free. Pay when winning.</h2>
          <p style={{ color: '#64748b', marginBottom: 32, fontSize: 15 }}>7-day free trial. No credit card required.</p>
          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(34,211,238,.2)', borderRadius: 20, padding: 32, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#22d3ee', marginBottom: 10 }}>PRO — MOST POPULAR</div>
            <div style={{ fontSize: 44, fontWeight: 900, marginBottom: 4 }}>$19.99</div>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>AUD / month</div>
            <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Unlimited +EV scanner','All 12 AU bookmakers','Grade S+, A, B confidence ratings','Arb finder','CLV tracker','Live edge alerts'].map(f => (
                <li key={f} style={{ display: 'flex', gap: 10, fontSize: 14 }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" style={{ display: 'block', padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700, color: '#030711', background: 'linear-gradient(135deg,#22d3ee,#0891b2)', textAlign: 'center' }}>
              Start Free Trial →
            </Link>
          </div>
          <Link href="/pricing" style={{ fontSize: 14, color: '#64748b' }}>See all plans →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.05)', padding: '28px 32px', textAlign: 'center', fontSize: 12, color: '#475569' }}>
        <p style={{ marginBottom: 6 }}>© 2026 Shadow Syndicate. 18+ Only. Gambling involves significant financial risk.</p>
        <p>Help: <a href="tel:1800858858" style={{ color: '#22d3ee', fontWeight: 700 }}>1800 858 858</a> · gamblinghelponline.org.au</p>
      </footer>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } a { text-decoration: none; }`}</style>
    </div>
  );
}
