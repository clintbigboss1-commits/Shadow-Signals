import Link from 'next/link';
import ExitPopup from '../components/ExitPopup';
import Navbar from '../components/Navbar';
import { LogoMark } from '../components/Logo';

const BOOKIES = ['Sportsbet','TAB','Bet365 AU','Ladbrokes','Neds','PointsBet','BlueBet','Betfair Exchange'];

const FEATURES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.3"/><path d="M10 16 L14 12 L18 17 L22 11" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="22" cy="11" r="2.5" fill="#22d3ee"/></svg>
    ),
    title: '+EV Scanner',
    desc: 'Every mispriced line across 12 AU bookies, ranked by edge. Sportsbet, TAB, Bet365 — all in one place.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.3"/><circle cx="16" cy="16" r="3" fill="#8b5cf6"/><circle cx="16" cy="16" r="7" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.5"/><circle cx="16" cy="16" r="11" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.25"/><line x1="16" y1="5" x2="16" y2="9" stroke="#8b5cf6" strokeWidth="1.5"/><line x1="16" y1="23" x2="16" y2="27" stroke="#8b5cf6" strokeWidth="1.5"/><line x1="5" y1="16" x2="9" y2="16" stroke="#8b5cf6" strokeWidth="1.5"/><line x1="23" y1="16" x2="27" y2="16" stroke="#8b5cf6" strokeWidth="1.5"/></svg>
    ),
    title: 'Grade System',
    desc: 'S+, A, B, C confidence ratings on every market. Only bet when the grade is right for your bankroll.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.3"/><rect x="9" y="13" width="14" height="10" rx="2" stroke="#10b981" strokeWidth="1.5"/><path d="M12 13 L12 11 Q12 8 16 8 Q20 8 20 11 L20 13" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/><circle cx="16" cy="18" r="1.5" fill="#10b981"/></svg>
    ),
    title: 'Arb Finder',
    desc: 'Guaranteed profit when bookmakers disagree. Built-in stake calculator. No variance, no luck.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.3"/><rect x="9" y="20" width="3" height="6" rx="1" fill="#f59e0b" fillOpacity="0.4"/><rect x="14.5" y="15" width="3" height="11" rx="1" fill="#f59e0b" fillOpacity="0.65"/><rect x="20" y="10" width="3" height="16" rx="1" fill="#f59e0b"/><path d="M8 21 L13 17 L18 19 L24 12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
    title: 'CLV Tracker',
    desc: 'Track closing line value — the only metric that proves long-term edge without needing a thousand bets.',
  },
];

const SPORTS = [
  {
    key: 'afl',
    label: 'AFL',
    sub: 'Australian Rules Football',
    markets: '280+ markets daily',
    accent: '#10b981',
    bg: 'linear-gradient(135deg, #052e16 0%, #064e3b 60%, #065f46 100%)',
    icon: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.6">
        {/* Oval AFL football */}
        <ellipse cx="32" cy="32" rx="22" ry="14" stroke="#10b981" strokeWidth="2" fill="rgba(16,185,129,0.1)"/>
        {/* Seam lines */}
        <path d="M32 18 Q40 32 32 46" stroke="#10b981" strokeWidth="1.5" fill="none" strokeDasharray="3 2"/>
        <path d="M32 18 Q24 32 32 46" stroke="#10b981" strokeWidth="1.5" fill="none" strokeDasharray="3 2"/>
        <line x1="10" y1="32" x2="54" y2="32" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4"/>
        {/* Goal posts */}
        <line x1="20" y1="8" x2="20" y2="18" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
        <line x1="26" y1="6" x2="26" y2="18" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="38" y1="6" x2="38" y2="18" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="44" y1="8" x2="44" y2="18" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'nrl',
    label: 'NRL',
    sub: 'Rugby League',
    markets: '140+ markets',
    accent: '#3b82f6',
    bg: 'linear-gradient(135deg, #0c1a45 0%, #1e3a8a 60%, #1e40af 100%)',
    icon: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.6">
        {/* Rugby ball — more elongated than AFL */}
        <ellipse cx="32" cy="32" rx="26" ry="16" stroke="#3b82f6" strokeWidth="2" fill="rgba(59,130,246,0.1)" transform="rotate(-20 32 32)"/>
        <path d="M18 24 Q32 28 46 20" stroke="#3b82f6" strokeWidth="1.5" fill="none"/>
        <path d="M18 44 Q32 36 46 44" stroke="#3b82f6" strokeWidth="1.5" fill="none"/>
        <line x1="32" y1="14" x2="32" y2="50" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.5" transform="rotate(-20 32 32)"/>
      </svg>
    ),
  },
  {
    key: 'soccer',
    label: 'Soccer',
    sub: 'EPL · UCL · A-League',
    markets: '500+ markets',
    accent: '#22d3ee',
    bg: 'linear-gradient(135deg, #042f2e 0%, #134e4a 60%, #0f766e 100%)',
    photo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    icon: null,
  },
  {
    key: 'cricket',
    label: 'Cricket',
    sub: 'Test · ODI · T20',
    markets: '100+ markets',
    accent: '#f59e0b',
    bg: 'linear-gradient(135deg, #451a03 0%, #78350f 60%, #92400e 100%)',
    icon: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.6">
        {/* Cricket bat */}
        <rect x="28" y="8" width="10" height="32" rx="5" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" strokeWidth="1.5"/>
        <rect x="30" y="38" width="6" height="14" rx="3" fill="rgba(245,158,11,0.25)" stroke="#f59e0b" strokeWidth="1.5"/>
        {/* Cricket ball */}
        <circle cx="18" cy="46" r="8" fill="rgba(245,158,11,0.1)" stroke="#f59e0b" strokeWidth="1.5"/>
        <path d="M12 44 Q18 40 24 44" stroke="#f59e0b" strokeWidth="1" fill="none"/>
        <path d="M12 48 Q18 52 24 48" stroke="#f59e0b" strokeWidth="1" fill="none"/>
      </svg>
    ),
  },
  {
    key: 'nba',
    label: 'Basketball',
    sub: 'NBA · NBL',
    markets: '200+ markets',
    accent: '#f97316',
    bg: 'linear-gradient(135deg, #431407 0%, #7c2d12 60%, #9a3412 100%)',
    photo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    icon: null,
  },
  {
    key: 'racing',
    label: 'Horse Racing',
    sub: 'All AU Meets Daily',
    markets: '800+ races/wk',
    accent: '#c084fc',
    bg: 'linear-gradient(135deg, #2e1065 0%, #4a1d96 60%, #5b21b6 100%)',
    icon: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.6">
        {/* Jockey + horse silhouette */}
        <path d="M10 44 Q18 30 28 32 Q34 33 38 28 Q44 22 50 24 Q54 26 52 32 Q48 36 44 34 Q38 38 36 44 Q32 50 24 48 Q16 48 10 44 Z" fill="rgba(192,132,252,0.15)" stroke="#c084fc" strokeWidth="1.5"/>
        {/* Jockey */}
        <circle cx="44" cy="22" r="4" fill="rgba(192,132,252,0.2)" stroke="#c084fc" strokeWidth="1.5"/>
        <line x1="44" y1="26" x2="42" y2="34" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Legs */}
        <path d="M24 48 L20 58" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
        <path d="M30 48 L28 58" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
        <path d="M38 44 L40 56" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
        <path d="M44 42 L48 54" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const STATS = [
  { value: '127',     label: 'High-confidence bets today' },
  { value: '78%',     label: 'CLV positive rate'          },
  { value: '+$2,847', label: 'Avg monthly profit AUD'     },
  { value: '12',      label: 'Bookmakers scanned'         },
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

      <Navbar />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: '100px 24px 80px', overflow: 'hidden' }}>
        {/* Background sport photo */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1920&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12,
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #08111e 0%, transparent 35%, #08111e 100%)', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 60% 0%, rgba(34,211,238,.1), transparent 70%)', zIndex: 0 }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: '60px', alignItems: 'center' }}>

          {/* Left — Text */}
          <div style={{ flex: '1 1 500px' }}>
            {/* Logo mark + live badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <LogoMark size={56} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(34,211,238,.3)', background: 'rgba(34,211,238,.06)', color: '#22d3ee', fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 10px #22d3ee', animation: 'pulse 2s infinite' }} />
                #1 BETTING TOOL IN AUSTRALIA
              </div>
            </div>

            <h1 style={{ fontSize: 'clamp(56px,7.5vw,88px)', fontWeight: 900, lineHeight: 0.92, letterSpacing: -3.5, marginBottom: 20, textTransform: 'uppercase' }}>
              SHADOW<br />
              <span style={{ background: 'linear-gradient(135deg,#22d3ee 0%,#818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SIGNALS</span>
            </h1>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', letterSpacing: .5, marginBottom: 16 }}>
              STOP GUESSING. START <span style={{ color: '#22d3ee' }}>WINNING.</span>
            </p>
            <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.65, maxWidth: 520, marginBottom: 36, fontWeight: 500 }}>
              We scan 12+ Aussie bookies and Betfair Exchange to find the mathematical edge.
              Get <strong style={{ color: '#fff' }}>high-win-probability picks</strong> and +EV bets delivered straight to your dashboard.
            </p>

            <div style={{ display: 'flex', gap: 14, marginBottom: 40, flexWrap: 'wrap' }}>
              <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 12, fontSize: 17, fontWeight: 800, color: '#030711', background: 'linear-gradient(135deg,#22d3ee,#0891b2)', boxShadow: '0 10px 30px -5px rgba(34,211,238,0.4)' }}>
                ⚡ Start 7-Day Free Trial
              </Link>
              <Link href="/markets" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 12, fontSize: 17, fontWeight: 700, color: '#fff', border: '2px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.04)' }}>
                View Live Picks →
              </Link>
            </div>

            {/* Social proof row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: 'rgba(0,0,0,.3)', borderRadius: 14, border: '1px solid rgba(255,255,255,.05)', maxWidth: 'max-content' }}>
              <div style={{ display: 'flex' }}>
                {[
                  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop&crop=face',
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face',
                  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop&crop=face',
                ].map((src, i) => (
                  <img key={i} src={src} alt="" width={38} height={38} style={{ borderRadius: '50%', border: '2px solid #08111e', marginLeft: i > 0 ? -10 : 0, objectFit: 'cover' }} />
                ))}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>Joined by 7,416+ Aussie sharps</div>
                <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#f59e0b' }}>★★★★★</span> 4.9 / 5 Rating
                </div>
              </div>
            </div>
          </div>

          {/* Right — Live pick card */}
          <div style={{ flex: '1 1 400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 440, background: 'linear-gradient(135deg, rgba(15,35,55,.92), rgba(8,17,30,.97))', border: '1px solid rgba(34,211,238,.25)', borderRadius: 24, padding: 30, boxShadow: '0 40px 100px rgba(0,0,0,.8), inset 0 1px 1px rgba(255,255,255,.06)', backdropFilter: 'blur(20px)', position: 'relative' }}>
              {/* Badge */}
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', color: '#000', padding: '5px 16px', borderRadius: 20, fontWeight: 900, fontSize: 12, letterSpacing: 1, boxShadow: '0 4px 12px rgba(245,158,11,.4)', whiteSpace: 'nowrap' }}>
                ⭐ TODAY&apos;S TOP PICK
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, marginTop: 12 }}>
                <span style={{ fontSize: 22 }}>🏀</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>LA Lakers @ Boston Celtics</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>NBA · Today, 10:30 AM AEST</div>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,.4)', borderRadius: 14, padding: '18px', border: '1px solid rgba(255,255,255,.05)', marginBottom: 18, marginTop: 16 }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>Recommended Bet</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>Lakers Moneyline</span>
                  <div style={{ background: '#08111e', padding: '5px 14px', borderRadius: 8, border: '1px solid #334155', fontWeight: 800, fontSize: 20, color: '#22d3ee', fontFamily: 'JetBrains Mono, monospace' }}>
                    1.95
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Est. Win Prob</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>58.2%</div>
                </div>
                <div style={{ background: 'rgba(34,211,238,.08)', border: '1px solid rgba(34,211,238,.25)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#22d3ee', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Math Edge</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>+13.4%</div>
                </div>
              </div>

              {/* Grade badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ background: '#22d3ee', color: '#030711', fontSize: 11, fontWeight: 900, padding: '4px 12px', borderRadius: 6, letterSpacing: .5 }}>GRADE S+</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Highest confidence tier</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', borderBottom: '1px solid rgba(255,255,255,.05)', background: 'rgba(0,0,0,.2)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '28px 24px' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '0 16px', borderRight: i < 3 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, color: '#22d3ee', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sports Coverage ────────────────────────────────── */}
      <section style={{ padding: '64px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Coverage</div>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 900, letterSpacing: -1 }}>Built for Australian sports</h2>
          <p style={{ color: '#64748b', fontSize: 15, marginTop: 10 }}>AFL, NRL, Cricket, Racing — every market, every bookie, every day.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {SPORTS.map(s => (
            <div
              key={s.key}
              style={{
                position: 'relative', borderRadius: 18, overflow: 'hidden',
                height: 200, border: '1px solid rgba(255,255,255,.07)',
                boxShadow: '0 10px 30px rgba(0,0,0,.4)',
                cursor: 'pointer',
              }}
            >
              {/* Background */}
              {s.photo ? (
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${s.photo})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  filter: 'brightness(0.45)',
                }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: s.bg }} />
              )}

              {/* Gradient overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top right, rgba(0,0,0,.7) 0%, transparent 60%)' }} />

              {/* SVG art (illustrated cards) */}
              {s.icon && (
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  {s.icon}
                </div>
              )}

              {/* Text */}
              <div style={{ position: 'absolute', bottom: 20, left: 20 }}>
                <div style={{ fontWeight: 900, fontSize: 22, color: '#fff', letterSpacing: -.5, lineHeight: 1 }}>{s.label}</div>
                <div style={{ color: s.accent, fontSize: 12, fontWeight: 700, marginTop: 3 }}>{s.sub}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, background: 'rgba(0,0,0,.4)', borderRadius: 6, padding: '3px 8px' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.accent, boxShadow: `0 0 6px ${s.accent}`, display: 'inline-block' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.accent }}>{s.markets}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: 2-col fallback via inline style on parent — handled by auto-fit below */}
        <style>{`@media(max-width:768px){.sports-grid{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:480px){.sports-grid{grid-template-columns:1fr!important}}`}</style>
      </section>

      {/* ── Bookie strip ───────────────────────────────────── */}
      <div style={{ padding: '8px 32px 56px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 18 }}>Syncing odds live from</p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
            {BOOKIES.map(b => (
              <span key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,.05)', background: 'rgba(255,255,255,.02)', fontSize: 13, color: '#94a3b8', fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 8px #22d3ee', display: 'inline-block', flexShrink: 0 }} />
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ───────────────────────────────────────── */}
      <section style={{ padding: '64px 32px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Platform</div>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 900, letterSpacing: -1 }}>Everything you need to beat the line</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ padding: 28, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>{f.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{f.title}</div>
                <div style={{ color: '#64748b', fontSize: 14, lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing CTA ─────────────────────────────────────── */}
      <section style={{ padding: '64px 32px', borderTop: '1px solid rgba(255,255,255,.05)', textAlign: 'center' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Pricing</div>
          <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 900, marginBottom: 8 }}>Start free. Pay when winning.</h2>
          <p style={{ color: '#64748b', marginBottom: 32, fontSize: 15 }}>7-day free trial. No credit card required.</p>
          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(34,211,238,.2)', borderRadius: 20, padding: 32, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#22d3ee', marginBottom: 10 }}>PRO — MOST POPULAR</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 42, fontWeight: 900, marginBottom: 4 }}>$19.99</div>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>AUD / month</div>
            <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Unlimited +EV scanner','All 12 AU bookmakers','Grade S+, A, B confidence ratings','Arb finder','CLV tracker','Live edge alerts'].map(f => (
                <li key={f} style={{ display: 'flex', gap: 10, fontSize: 14 }}>
                  <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" style={{ display: 'block', padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700, color: '#030711', background: 'linear-gradient(135deg,#22d3ee,#0891b2)', textAlign: 'center' }}>
              ⚡ Start Free Trial →
            </Link>
          </div>
          <Link href="/pricing" style={{ fontSize: 14, color: '#64748b' }}>See all plans →</Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.05)', padding: '32px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoMark size={28} />
          <span style={{ fontSize: 13, color: '#334155' }}>© 2026 Shadow Syndicate. 18+ Only.</span>
        </div>
        <p style={{ fontSize: 12, color: '#334155' }}>Help: <a href="tel:1800858858" style={{ color: '#22d3ee', fontWeight: 700 }}>1800 858 858</a> · gamblinghelponline.org.au</p>
      </footer>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } a { text-decoration: none; }`}</style>
    </div>
  );
}
