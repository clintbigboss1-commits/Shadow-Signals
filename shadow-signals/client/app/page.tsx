import Link from 'next/link';
import ExitPopup from '../components/ExitPopup';
import Navbar from '../components/Navbar';
import { LogoMark } from '../components/Logo';

const BOOKIES = ['Sportsbet','TAB','Bet365 AU','Ladbrokes','Neds','PointsBet','BlueBet','Betfair Exchange'];

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" stroke="#00d4ff" strokeWidth="1.5" strokeOpacity="0.35"/><path d="M7 14 L11 10 L15 15 L19 9" stroke="#00d4ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="19" cy="9" r="2.5" fill="#00d4ff"/></svg>
    ),
    title: '+EV Scanner',
    desc: 'Every mispriced line across 12 AU bookies, ranked by edge. Sportsbet, TAB, Bet365 — all in one feed.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" stroke="#a855f7" strokeWidth="1.5" strokeOpacity="0.35"/><circle cx="14" cy="14" r="2.5" fill="#a855f7"/><circle cx="14" cy="14" r="6" stroke="#a855f7" strokeWidth="1.5" strokeOpacity="0.5"/><circle cx="14" cy="14" r="10" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.2"/><line x1="14" y1="4" x2="14" y2="7.5" stroke="#a855f7" strokeWidth="1.5"/><line x1="14" y1="20.5" x2="14" y2="24" stroke="#a855f7" strokeWidth="1.5"/><line x1="4" y1="14" x2="7.5" y2="14" stroke="#a855f7" strokeWidth="1.5"/><line x1="20.5" y1="14" x2="24" y2="14" stroke="#a855f7" strokeWidth="1.5"/></svg>
    ),
    title: 'Grade System',
    desc: 'S+, A, B confidence ratings on every market. Only bet when the grade matches your bankroll.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.35"/><rect x="7.5" y="11" width="13" height="9" rx="2" stroke="#22c55e" strokeWidth="1.5"/><path d="M10 11 L10 9 Q10 6 14 6 Q18 6 18 9 L18 11" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/><circle cx="14" cy="15.5" r="1.5" fill="#22c55e"/></svg>
    ),
    title: 'Arb Finder',
    desc: 'Guaranteed profit when bookmakers disagree. Built-in stake calculator. No variance.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.35"/><rect x="7" y="18" width="3" height="5" rx="1" fill="#f59e0b" fillOpacity="0.4"/><rect x="12.5" y="13" width="3" height="10" rx="1" fill="#f59e0b" fillOpacity="0.65"/><rect x="18" y="8" width="3" height="15" rx="1" fill="#f59e0b"/><path d="M6.5 19 L11 15 L16 17 L21.5 10" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
    title: 'CLV Tracker',
    desc: 'The only metric that proves long-term edge. Track every bet against the closing line.',
  },
];

const SPORTS = [
  {
    key: 'afl',
    label: 'AFL',
    sub: 'Australian Rules Football',
    markets: '280+ markets daily',
    accent: '#22c55e',
    bg: 'linear-gradient(135deg, #052e16 0%, #064e3b 65%, #065f46 100%)',
    icon: (
      <svg width="72" height="72" viewBox="0 0 64 64" fill="none" opacity="0.55">
        <ellipse cx="32" cy="32" rx="22" ry="14" stroke="#22c55e" strokeWidth="1.5" fill="rgba(34,197,94,0.08)"/>
        <path d="M32 18 Q40 32 32 46" stroke="#22c55e" strokeWidth="1.2" fill="none" strokeDasharray="3 2"/>
        <path d="M32 18 Q24 32 32 46" stroke="#22c55e" strokeWidth="1.2" fill="none" strokeDasharray="3 2"/>
        <line x1="10" y1="32" x2="54" y2="32" stroke="#22c55e" strokeWidth="0.8" strokeOpacity="0.4"/>
        <line x1="20" y1="8" x2="20" y2="18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
        <line x1="26" y1="6" x2="26" y2="18" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="38" y1="6" x2="38" y2="18" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="44" y1="8" x2="44" y2="18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'nrl',
    label: 'NRL',
    sub: 'Rugby League',
    markets: '140+ markets',
    accent: '#60a5fa',
    bg: 'linear-gradient(135deg, #0c1a45 0%, #1e3a8a 65%, #1e40af 100%)',
    icon: (
      <svg width="72" height="72" viewBox="0 0 64 64" fill="none" opacity="0.55">
        <ellipse cx="32" cy="32" rx="26" ry="16" stroke="#60a5fa" strokeWidth="1.5" fill="rgba(96,165,250,0.08)" transform="rotate(-18 32 32)"/>
        <path d="M18 24 Q32 28 46 20" stroke="#60a5fa" strokeWidth="1.2" fill="none"/>
        <path d="M18 44 Q32 36 46 44" stroke="#60a5fa" strokeWidth="1.2" fill="none"/>
        <line x1="32" y1="14" x2="32" y2="50" stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.4" transform="rotate(-18 32 32)"/>
      </svg>
    ),
  },
  {
    key: 'soccer',
    label: 'Soccer',
    sub: 'EPL · UCL · A-League',
    markets: '500+ markets',
    accent: '#00d4ff',
    bg: 'linear-gradient(135deg, #042f2e 0%, #0f4c5c 65%, #0e7490 100%)',
    photo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    icon: null,
  },
  {
    key: 'cricket',
    label: 'Cricket',
    sub: 'Test · ODI · T20',
    markets: '100+ markets',
    accent: '#fbbf24',
    bg: 'linear-gradient(135deg, #451a03 0%, #78350f 65%, #92400e 100%)',
    icon: (
      <svg width="72" height="72" viewBox="0 0 64 64" fill="none" opacity="0.55">
        <rect x="28" y="8" width="10" height="32" rx="5" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.5"/>
        <rect x="30" y="38" width="6" height="14" rx="3" fill="rgba(251,191,36,0.2)" stroke="#fbbf24" strokeWidth="1.5"/>
        <circle cx="18" cy="46" r="8" fill="rgba(251,191,36,0.08)" stroke="#fbbf24" strokeWidth="1.5"/>
        <path d="M12 44 Q18 40 24 44" stroke="#fbbf24" strokeWidth="1" fill="none"/>
        <path d="M12 48 Q18 52 24 48" stroke="#fbbf24" strokeWidth="1" fill="none"/>
      </svg>
    ),
  },
  {
    key: 'nba',
    label: 'Basketball',
    sub: 'NBA · NBL',
    markets: '200+ markets',
    accent: '#fb923c',
    bg: 'linear-gradient(135deg, #431407 0%, #7c2d12 65%, #9a3412 100%)',
    photo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    icon: null,
  },
  {
    key: 'racing',
    label: 'Horse Racing',
    sub: 'All AU Meets Daily',
    markets: '800+ races/wk',
    accent: '#c084fc',
    bg: 'linear-gradient(135deg, #2e1065 0%, #4a1d96 65%, #5b21b6 100%)',
    icon: (
      <svg width="72" height="72" viewBox="0 0 64 64" fill="none" opacity="0.55">
        <path d="M10 44 Q18 30 28 32 Q34 33 38 28 Q44 22 50 24 Q54 26 52 32 Q48 36 44 34 Q38 38 36 44 Q32 50 24 48 Q16 48 10 44 Z" fill="rgba(192,132,252,0.1)" stroke="#c084fc" strokeWidth="1.5"/>
        <circle cx="44" cy="22" r="4" fill="rgba(192,132,252,0.15)" stroke="#c084fc" strokeWidth="1.5"/>
        <line x1="44" y1="26" x2="42" y2="34" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M24 48 L20 58" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
        <path d="M30 48 L28 58" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
        <path d="M38 44 L40 56" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
        <path d="M44 42 L48 54" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const STATS = [
  { value: '127',     label: 'Signals today'          },
  { value: '78%',     label: 'CLV positive rate'       },
  { value: '+$2,847', label: 'Avg monthly profit AUD'  },
  { value: '12',      label: 'Bookmakers scanned'      },
];

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a1929', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>

      <ExitPopup />

      {/* RG bar */}
      <div style={{ background: '#060e1a', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '8px 24px', textAlign: 'center', fontSize: 12, color: '#5e7390' }}>
        <strong style={{ color: '#f59e0b' }}>18+ Only.</strong>{' '}Think about your choices. Call{' '}
        <a href="tel:1800858858" style={{ color: '#00d4ff', fontWeight: 700 }}>1800 858 858</a>
        {' '}• gamblinghelponline.org.au
      </div>

      <Navbar />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: '100px 24px 80px', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1920&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.08,
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #0a1929 0%, transparent 40%, #0a1929 100%)', zIndex: 0 }} />
        {/* Cyan glow orb */}
        <div style={{ position: 'absolute', top: -200, right: '10%', width: 600, height: 600, background: 'radial-gradient(ellipse, rgba(0,212,255,.07) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: '64px', alignItems: 'center' }}>

          {/* Left */}
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <LogoMark size={52} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(0,212,255,.3)', background: 'rgba(0,212,255,.06)', color: '#00d4ff', fontSize: 11, fontWeight: 800, letterSpacing: 1.2 }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 10px #00d4ff' }} />
                #1 BETTING INTELLIGENCE IN AUSTRALIA
              </div>
            </div>

            <h1 style={{ fontSize: 'clamp(52px,7vw,84px)', fontWeight: 900, lineHeight: 0.92, letterSpacing: -3, marginBottom: 22, textTransform: 'uppercase' }}>
              SHADOW<br />
              <span style={{ background: 'linear-gradient(135deg,#00d4ff 0%,#818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SIGNALS</span>
            </h1>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', letterSpacing: .3, marginBottom: 16 }}>
              STOP GUESSING. START <span style={{ color: '#00d4ff' }}>WINNING.</span>
            </p>
            <p style={{ fontSize: 16, color: '#9eb1c8', lineHeight: 1.65, maxWidth: 520, marginBottom: 36 }}>
              We scan 12+ Aussie bookies and Betfair Exchange to find the mathematical edge.
              Get <strong style={{ color: '#fff' }}>high-confidence signals</strong> and +EV bets delivered to your dashboard in real time.
            </p>

            <div style={{ display: 'flex', gap: 14, marginBottom: 40, flexWrap: 'wrap' }}>
              <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 12, fontSize: 16, fontWeight: 800, color: '#0a1929', background: 'linear-gradient(135deg,#00d4ff,#0099cc)', boxShadow: '0 10px 30px -5px rgba(0,212,255,.4)' }}>
                ⚡ Start 7-Day Free Trial
              </Link>
              <Link href="/markets" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 12, fontSize: 16, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.04)' }}>
                View Live Signals →
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '13px 18px', background: 'rgba(18,41,68,.6)', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', backdropFilter: 'blur(8px)' }}>
              <div style={{ display: 'flex' }}>
                {[
                  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop&crop=face',
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face',
                  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop&crop=face',
                ].map((src, i) => (
                  <img key={i} src={src} alt="" width={36} height={36} style={{ borderRadius: '50%', border: '2px solid #0a1929', marginLeft: i > 0 ? -9 : 0, objectFit: 'cover' }} />
                ))}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>7,416+ Aussie sharps signed up</div>
                <div style={{ fontSize: 12, color: '#9eb1c8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#f59e0b' }}>★★★★★</span> 4.9 / 5 rating
                </div>
              </div>
            </div>
          </div>

          {/* Right — Live signal card */}
          <div style={{ flex: '1 1 400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 440, background: 'linear-gradient(135deg, rgba(18,41,68,.95), rgba(10,25,41,.98))', border: '1px solid rgba(0,212,255,.2)', borderRadius: 20, padding: 28, boxShadow: '0 40px 80px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.06)', backdropFilter: 'blur(20px)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', color: '#0a1929', padding: '4px 16px', borderRadius: 20, fontWeight: 900, fontSize: 11, letterSpacing: 1, boxShadow: '0 4px 12px rgba(245,158,11,.4)', whiteSpace: 'nowrap' }}>
                ⭐ TODAY&apos;S TOP SIGNAL
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, marginTop: 12 }}>
                <span style={{ fontSize: 20 }}>🏀</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>LA Lakers @ Boston Celtics</div>
                  <div style={{ fontSize: 11, color: '#5e7390', fontWeight: 600 }}>NBA · Today, 10:30 AM AEST</div>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,.35)', borderRadius: 12, padding: '16px', border: '1px solid rgba(255,255,255,.05)', marginBottom: 14, marginTop: 14 }}>
                <div style={{ fontSize: 10, color: '#5e7390', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, fontWeight: 700 }}>Recommended Bet</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>Lakers Moneyline</span>
                  <div style={{ background: '#0a1929', padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(0,212,255,.25)', fontWeight: 800, fontSize: 18, color: '#00d4ff', fontFamily: 'JetBrains Mono, monospace' }}>
                    1.95
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{ background: 'rgba(34,197,94,.07)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Est. Win Prob</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>58.2%</div>
                </div>
                <div style={{ background: 'rgba(0,212,255,.07)', border: '1px solid rgba(0,212,255,.2)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#00d4ff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Math Edge</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>+13.4%</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ background: '#00d4ff', color: '#0a1929', fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 5, letterSpacing: .5 }}>GRADE S+</span>
                <span style={{ fontSize: 11, color: '#5e7390' }}>Highest confidence tier</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.15)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '28px 24px' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '0 16px', borderRight: i < 3 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 900, color: '#00d4ff', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#5e7390', marginTop: 6, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sports Coverage ────────────────────────────────── */}
      <section style={{ padding: '64px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Coverage</div>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, letterSpacing: -1 }}>Built for Australian sports</h2>
          <p style={{ color: '#9eb1c8', fontSize: 15, marginTop: 10 }}>AFL, NRL, Cricket, Racing — every market, every bookie, every day.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {SPORTS.map(s => (
            <div key={s.key} style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 190, border: '1px solid rgba(255,255,255,.07)', boxShadow: '0 8px 24px rgba(0,0,0,.4)', cursor: 'pointer' }}>
              {s.photo ? (
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${s.photo})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.4)' }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: s.bg }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top right, rgba(0,0,0,.65) 0%, transparent 55%)' }} />
              {s.icon && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>{s.icon}</div>}
              <div style={{ position: 'absolute', bottom: 16, left: 18 }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: -.4, lineHeight: 1 }}>{s.label}</div>
                <div style={{ color: s.accent, fontSize: 11, fontWeight: 700, marginTop: 3 }}>{s.sub}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 7, background: 'rgba(0,0,0,.45)', borderRadius: 5, padding: '2px 7px' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: s.accent, boxShadow: `0 0 5px ${s.accent}`, display: 'inline-block' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: s.accent }}>{s.markets}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bookie strip ───────────────────────────────────── */}
      <div style={{ padding: '8px 32px 56px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: '#2d4060', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 18 }}>Syncing odds live from</p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
            {BOOKIES.map(b => (
              <span key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(18,41,68,.4)', fontSize: 13, color: '#9eb1c8', fontWeight: 600 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 7px #00d4ff', display: 'inline-block', flexShrink: 0 }} />
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ───────────────────────────────────────── */}
      <section style={{ padding: '64px 32px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Platform</div>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900, letterSpacing: -1 }}>Everything you need to beat the line</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ padding: 26, background: 'rgba(18,41,68,.5)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>{f.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{f.title}</div>
                <div style={{ color: '#9eb1c8', fontSize: 14, lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing CTA ─────────────────────────────────────── */}
      <section style={{ padding: '64px 32px', borderTop: '1px solid rgba(255,255,255,.06)', textAlign: 'center' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Pricing</div>
          <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 900, marginBottom: 8 }}>Start free. Pay when winning.</h2>
          <p style={{ color: '#9eb1c8', marginBottom: 32, fontSize: 15 }}>7-day free trial. No credit card required.</p>
          <div style={{ background: 'rgba(18,41,68,.6)', border: '1px solid rgba(0,212,255,.2)', borderRadius: 20, padding: 32, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#00d4ff', marginBottom: 10, letterSpacing: .5 }}>PRO — MOST POPULAR</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 40, fontWeight: 900, marginBottom: 4 }}>$19.99</div>
            <div style={{ color: '#5e7390', fontSize: 13, marginBottom: 24 }}>AUD / month</div>
            <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Unlimited +EV scanner','All 12 AU bookmakers','Grade S+, A, B confidence ratings','Arb finder','CLV tracker','Live edge alerts'].map(f => (
                <li key={f} style={{ display: 'flex', gap: 10, fontSize: 14 }}>
                  <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" style={{ display: 'block', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700, color: '#0a1929', background: 'linear-gradient(135deg,#00d4ff,#0099cc)', textAlign: 'center' }}>
              ⚡ Start Free Trial →
            </Link>
          </div>
          <Link href="/pricing" style={{ fontSize: 14, color: '#5e7390' }}>See all plans →</Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '28px 32px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoMark size={26} />
          <span style={{ fontSize: 13, color: '#2d4060' }}>© 2026 Shadow Signals. 18+ Only.</span>
        </div>
        <p style={{ fontSize: 12, color: '#2d4060' }}>Help: <a href="tel:1800858858" style={{ color: '#00d4ff', fontWeight: 700 }}>1800 858 858</a> · gamblinghelponline.org.au</p>
      </footer>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } a { text-decoration: none; }`}</style>
    </div>
  );
}
