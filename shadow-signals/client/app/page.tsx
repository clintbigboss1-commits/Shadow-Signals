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
      <section style={{ position: 'relative', padding: '100px 24px 80px', overflow: 'hidden' }}>
        {/* Deep sports background overlay */}
        <div style={{ 
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1920&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15, mixBlendMode: 'luminosity' 
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #08111e 0%, transparent 40%, #08111e 100%)', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 60% 0%,rgba(34,211,238,.1),transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        
        <div className="landing-hero-grid" style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: '60px' }}>

          {/* Left Text */}
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(34,211,238,.3)', background: 'rgba(34,211,238,.06)', color: '#22d3ee', fontSize: 12, fontWeight: 800, marginBottom: 24, letterSpacing: 1 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 10px #22d3ee' }} />
              #1 BETTING TOOL IN AUSTRALIA
            </div>

            <h1 style={{ fontSize: 'clamp(64px,8vw,96px)', fontWeight: 900, lineHeight: 0.9, letterSpacing: -4, marginBottom: 20, textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              SHADOW<br />
              <span style={{ background: 'linear-gradient(135deg,#22d3ee 0%,#818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SIGNALS</span>
            </h1>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', letterSpacing: 1, marginBottom: 20 }}>
              STOP GUESSING. START <span style={{ color: '#22d3ee' }}>WINNING.</span>
            </p>
            <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.6, maxWidth: 520, marginBottom: 36, fontWeight: 500 }}>
              We scan 12+ Aussie bookies and Betfair Exchange to find the mathematical edge. 
              Get <strong style={{ color: '#fff' }}>high-win-probability picks</strong> and +EV bets delivered straight to your dashboard.
            </p>

            <div style={{ display: 'flex', gap: 14, marginBottom: 40, flexWrap: 'wrap' }}>
              <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 12, fontSize: 18, fontWeight: 800, color: '#030711', background: 'linear-gradient(135deg,#22d3ee,#0891b2)', boxShadow: '0 10px 25px -5px rgba(34,211,238,0.4)', transition: 'transform 0.2s', cursor: 'pointer' }}>
                Start 7-Day Free Trial
              </Link>
              <Link href="/markets" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 12, fontSize: 18, fontWeight: 700, color: '#fff', border: '2px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.05)', backdropFilter: 'blur(10px)' }}>
                View Live Picks
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'rgba(0,0,0,0.3)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', maxWidth: 'max-content' }}>
              <div style={{ display: 'flex' }}>
                {['https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop','https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop','https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop'].map((src, i) => (
                  <img key={i} src={src} alt="User" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #08111e', marginLeft: i > 0 ? -12 : 0, objectFit: 'cover' }} />
                ))}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>Joined by 7,416+ Aussie sharps</div>
                <div style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#f59e0b' }}>★★★★★</span> 4.9/5 Rating
                </div>
              </div>
            </div>
          </div>

          {/* Right — Showcase Bet Card */}
          <div style={{ flex: '1 1 400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 440, background: 'linear-gradient(135deg, rgba(15,35,55,0.9), rgba(10,20,35,0.95))', border: '1px solid rgba(34,211,238,.3)', borderRadius: 24, padding: 30, boxShadow: '0 40px 100px rgba(0,0,0,.8), inset 0 1px 1px rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', position: 'relative' }}>
              
              {/* Top Picks Badge */}
              <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', color: '#000', padding: '6px 16px', borderRadius: 20, fontWeight: 900, fontSize: 13, letterSpacing: 1, boxShadow: '0 4px 10px rgba(245,158,11,0.4)' }}>
                ⭐ TODAY'S TOP PICK
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>🏀</span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>LA Lakers @ Boston Celtics</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>NBA • Today, 10:30 AM AEST</div>
                </div>
              </div>

              {/* The Pick Details */}
              <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: '20px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>Recommended Bet</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>Lakers Moneyline</span>
                  <div style={{ background: '#08111e', padding: '6px 14px', borderRadius: 8, border: '1px solid #334155', fontWeight: 800, fontSize: 20, color: '#22d3ee' }}>
                    1.95
                  </div>
                </div>
              </div>

              {/* Win Probability & EV (Transparency) */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Est. Win Prob</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>58.2%</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(34,211,238,.1)', border: '1px solid rgba(34,211,238,.3)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#22d3ee', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Mathematical Edge</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>+13.4%</div>
                </div>
              </div>

              <div style={{ marginTop: 24, fontSize: 12, color: '#64748b', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                Highest Probability + EV Grade S+
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Photo Grid */}
      <section style={{ padding: '20px 24px 60px', maxWidth: 1280, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, color: '#e2e8f0' }}>Unmatched Global Coverage</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
          {[
            { title: 'Football', img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80', sub: 'EPL, UCL, La Liga & More' },
            { title: 'Basketball', img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80', sub: 'NBA & NBL' },
            { title: 'UFC & MMA', img: 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=600&q=80', sub: 'Main Events & Fight Nights' },
            { title: 'NFL & MLB', img: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=600&q=80', sub: 'American Majors' }
          ].map(s => (
            <div key={s.title} style={{ 
              position: 'relative', height: 160, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 10px 20px rgba(0,0,0,0.3)', cursor: 'pointer'
            }}>
              <div style={{ 
                position: 'absolute', inset: 0, backgroundImage: `url(${s.img})`, backgroundSize: 'cover', backgroundPosition: 'center',
                transition: 'transform 0.4s', filter: 'brightness(0.6)'
              }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 20, left: 20, pointerEvents: 'none' }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: 0.5 }}>{s.title}</div>
                <div style={{ color: '#22d3ee', fontSize: 13, fontWeight: 700 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bookie strip */}
      <div style={{ padding: '24px 32px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 20 }}>Syncing Odds Live From</p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
            {BOOKIES.map(b => (
              <span key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,.05)', background: 'rgba(255,255,255,.02)', fontSize: 14, color: '#cbd5e1', fontWeight: 700, backdropFilter: 'blur(5px)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3ee', display: 'inline-block', boxShadow: '0 0 8px #22d3ee' }} />{b}
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
