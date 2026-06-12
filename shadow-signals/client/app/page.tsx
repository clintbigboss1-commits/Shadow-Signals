import Link from 'next/link';
import ExitPopup from '../components/ExitPopup';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import OperativePeek from '../components/OperativePeek';
import TeamLogo from '../components/TeamLogo';
import ConfidenceBar from '../components/ConfidenceBar';
import { LogoMark } from '../components/Logo';

const BOOKIES = ['Sportsbet','TAB','Bet365 AU','Ladbrokes','Neds','PointsBet','BlueBet','Betfair Exchange'];

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" stroke="#2979ff" strokeWidth="1.5" strokeOpacity="0.35"/><path d="M7 14 L11 10 L15 15 L19 9" stroke="#2979ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="19" cy="9" r="2.5" fill="#2979ff"/></svg>
    ),
    title: '+EV Scanner',
    desc: 'Every mispriced line across 12 AU bookies, ranked by edge. Sportsbet, TAB, Bet365 — all in one feed.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" stroke="#a855f7" strokeWidth="1.5" strokeOpacity="0.35"/><circle cx="14" cy="14" r="2.5" fill="#a855f7"/><circle cx="14" cy="14" r="6" stroke="#a855f7" strokeWidth="1.5" strokeOpacity="0.5"/><circle cx="14" cy="14" r="10" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.2"/><line x1="14" y1="4" x2="14" y2="7.5" stroke="#a855f7" strokeWidth="1.5"/><line x1="14" y1="20.5" x2="14" y2="24" stroke="#a855f7" strokeWidth="1.5"/><line x1="4" y1="14" x2="7.5" y2="14" stroke="#a855f7" strokeWidth="1.5"/><line x1="20.5" y1="14" x2="24" y2="14" stroke="#a855f7" strokeWidth="1.5"/></svg>
    ),
    title: 'Confidence Score',
    desc: 'Every pick scored 0–100%. Green means back it, red means leave it. Calibrated against real results.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" stroke="#00e676" strokeWidth="1.5" strokeOpacity="0.35"/><rect x="7.5" y="11" width="13" height="9" rx="2" stroke="#00e676" strokeWidth="1.5"/><path d="M10 11 L10 9 Q10 6 14 6 Q18 6 18 9 L18 11" stroke="#00e676" strokeWidth="1.5" strokeLinecap="round"/><circle cx="14" cy="15.5" r="1.5" fill="#00e676"/></svg>
    ),
    title: 'Arb Finder',
    desc: 'Guaranteed profit when bookmakers disagree. Built-in stake calculator. No variance.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" stroke="#ffab00" strokeWidth="1.5" strokeOpacity="0.35"/><rect x="7" y="18" width="3" height="5" rx="1" fill="#ffab00" fillOpacity="0.4"/><rect x="12.5" y="13" width="3" height="10" rx="1" fill="#ffab00" fillOpacity="0.65"/><rect x="18" y="8" width="3" height="15" rx="1" fill="#ffab00"/><path d="M6.5 19 L11 15 L16 17 L21.5 10" stroke="#ffab00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
    title: 'CLV Tracker',
    desc: 'The only metric that proves long-term edge. Track every bet against the closing line.',
  },
];

// Each sport gets a piece of GHOST surveillance gear — radar, binoculars,
// listening kit — because we're watching the market, not playing the game.
const SPORTS = [
  {
    key: 'afl',
    label: 'AFL',
    sub: 'Australian Rules Football',
    markets: '280+ markets daily',
    accent: '#00e676',
    bg: 'linear-gradient(135deg, #052e16 0%, #064e3b 65%, #065f46 100%)',
    icon: ( // radar screen, mid-sweep, two blips on the move
      <svg width="76" height="76" viewBox="0 0 64 64" fill="none" opacity="0.6">
        <circle cx="30" cy="32" r="20" stroke="#00e676" strokeWidth="1.5" fill="rgba(0,230,118,0.06)"/>
        <circle cx="30" cy="32" r="12" stroke="#00e676" strokeWidth="0.8" strokeOpacity="0.5"/>
        <line x1="10" y1="32" x2="50" y2="32" stroke="#00e676" strokeWidth="0.6" strokeOpacity="0.5"/>
        <line x1="30" y1="12" x2="30" y2="52" stroke="#00e676" strokeWidth="0.6" strokeOpacity="0.5"/>
        <path d="M30 32 L46 20 A20 20 0 0 0 30 12 Z" fill="rgba(0,230,118,0.22)"/>
        <circle cx="38" cy="40" r="2.2" fill="#00e676"/>
        <circle cx="22" cy="26" r="1.6" fill="#00e676" fillOpacity="0.7"/>
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
    icon: ( // listening headset picking up market chatter
      <svg width="76" height="76" viewBox="0 0 64 64" fill="none" opacity="0.6">
        <path d="M14 38 A18 18 0 0 1 50 38" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round"/>
        <rect x="10" y="36" width="9" height="14" rx="3.5" fill="rgba(96,165,250,0.12)" stroke="#60a5fa" strokeWidth="1.5"/>
        <rect x="45" y="36" width="9" height="14" rx="3.5" fill="rgba(96,165,250,0.12)" stroke="#60a5fa" strokeWidth="1.5"/>
        <path d="M58 34 q4 7 0 14" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M62 31 q6 10 0 20" stroke="#60a5fa" strokeWidth="0.9" strokeOpacity="0.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'soccer',
    label: 'Soccer',
    sub: 'EPL · UCL · A-League',
    markets: '500+ markets',
    accent: '#2979ff',
    bg: 'linear-gradient(135deg, #042f2e 0%, #0f4c5c 65%, #0e7490 100%)',
    photo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    icon: ( // binoculars on the line movement
      <svg width="76" height="76" viewBox="0 0 64 64" fill="none" opacity="0.65">
        <path d="M19 32 L21 17 h7 l1 14" stroke="#7db4ff" strokeWidth="1.5" fill="rgba(41,121,255,0.1)"/>
        <path d="M45 32 L43 17 h-7 l-1 14" stroke="#7db4ff" strokeWidth="1.5" fill="rgba(41,121,255,0.1)"/>
        <circle cx="22" cy="40" r="10" stroke="#7db4ff" strokeWidth="1.6" fill="rgba(41,121,255,0.1)"/>
        <circle cx="42" cy="40" r="10" stroke="#7db4ff" strokeWidth="1.6" fill="rgba(41,121,255,0.1)"/>
        <rect x="29" y="36" width="6" height="6" rx="1.5" stroke="#7db4ff" strokeWidth="1.3" fill="rgba(41,121,255,0.15)"/>
        <circle cx="22" cy="40" r="4" stroke="#7db4ff" strokeWidth="1" strokeOpacity="0.7"/>
        <circle cx="42" cy="40" r="4" stroke="#7db4ff" strokeWidth="1" strokeOpacity="0.7"/>
      </svg>
    ),
  },
  {
    key: 'cricket',
    label: 'Cricket',
    sub: 'Test · ODI · T20',
    markets: '100+ markets',
    accent: '#fbbf24',
    bg: 'linear-gradient(135deg, #451a03 0%, #78350f 65%, #92400e 100%)',
    icon: ( // magnifying glass over a price blip
      <svg width="76" height="76" viewBox="0 0 64 64" fill="none" opacity="0.6">
        <circle cx="27" cy="26" r="15" stroke="#fbbf24" strokeWidth="1.6" fill="rgba(251,191,36,0.07)"/>
        <line x1="38" y1="37" x2="53" y2="52" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M19 20 q5 -6 13 -3" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.6" fill="none"/>
        <circle cx="26" cy="27" r="2.2" fill="#fbbf24"/>
        <circle cx="31" cy="31" r="1.4" fill="#fbbf24" fillOpacity="0.6"/>
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
    icon: ( // satellite beaming odds home
      <svg width="76" height="76" viewBox="0 0 64 64" fill="none" opacity="0.65">
        <rect x="25" y="25" width="14" height="14" rx="2.5" stroke="#fdba74" strokeWidth="1.6" fill="rgba(251,146,60,0.1)" transform="rotate(45 32 32)"/>
        <rect x="4" y="28" width="14" height="8" rx="1.5" stroke="#fdba74" strokeWidth="1.3" fill="rgba(251,146,60,0.12)"/>
        <rect x="46" y="28" width="14" height="8" rx="1.5" stroke="#fdba74" strokeWidth="1.3" fill="rgba(251,146,60,0.12)"/>
        <line x1="18" y1="32" x2="25" y2="32" stroke="#fdba74" strokeWidth="1.4"/>
        <line x1="39" y1="32" x2="46" y2="32" stroke="#fdba74" strokeWidth="1.4"/>
        <line x1="32" y1="22" x2="32" y2="14" stroke="#fdba74" strokeWidth="1.2"/>
        <circle cx="32" cy="12" r="2" fill="#fdba74"/>
        <path d="M26 48 q6 4 12 0" stroke="#fdba74" strokeWidth="1" strokeOpacity="0.6" fill="none"/>
        <path d="M23 53 q9 6 18 0" stroke="#fdba74" strokeWidth="0.8" strokeOpacity="0.4" fill="none"/>
      </svg>
    ),
  },
  {
    key: 'racing',
    label: 'Horse Racing',
    sub: 'All AU Meets Daily',
    markets: '800+ races/wk',
    accent: '#c084fc',
    bg: 'linear-gradient(135deg, #2e1065 0%, #4a1d96 65%, #5b21b6 100%)',
    icon: ( // the GHOST itself, transmitting
      <svg width="76" height="76" viewBox="0 0 64 64" fill="none" opacity="0.6">
        <path d="M17 52 V30 a14 14 0 0 1 28 0 v22 l-4.7 -4.2 -4.6 4.2 -4.7 -4.2 -4.6 4.2 -4.7 -4.2 -4.7 4.2 Z"
          stroke="#c084fc" strokeWidth="1.6" fill="rgba(192,132,252,0.09)" strokeLinejoin="round"/>
        <circle cx="25" cy="30" r="2.4" fill="#c084fc"/>
        <circle cx="37" cy="30" r="2.4" fill="#c084fc"/>
        <path d="M49 20 q5 4 4 11" stroke="#c084fc" strokeWidth="1.1" strokeOpacity="0.7" strokeLinecap="round" fill="none"/>
        <path d="M53 15 q8 7 6 18" stroke="#c084fc" strokeWidth="0.9" strokeOpacity="0.45" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
];

const STATS = [
  { value: '127',     label: 'Signals today',         color: '#00e676' },
  { value: '78%',     label: 'CLV positive rate',     color: '#ffab00' },
  { value: '+$2,847', label: 'Avg monthly profit AUD', color: '#ffffff' },
  { value: '12',      label: 'Bookmakers scanned',    color: '#a78bfa' },
];

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a1929', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>

      <ExitPopup />

      {/* RG bar */}
      <div style={{ background: '#060e1a', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '8px 24px', textAlign: 'center', fontSize: 12, color: '#5e7390' }}>
        <strong style={{ color: '#ffab00' }}>18+ Only.</strong>{' '}Think about your choices. Call{' '}
        <a href="tel:1800858858" style={{ color: '#2979ff', fontWeight: 700 }}>1800 858 858</a>
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
        <div style={{ position: 'absolute', top: -200, right: '10%', width: 600, height: 600, background: 'radial-gradient(ellipse, rgba(41,121,255,.07) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: '64px', alignItems: 'center' }}>

          {/* Left */}
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <LogoMark size={52} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(41,121,255,.3)', background: 'rgba(41,121,255,.06)', color: '#2979ff', fontSize: 11, fontWeight: 800, letterSpacing: 1.2 }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#2979ff', boxShadow: '0 0 10px #2979ff' }} />
                #1 BETTING INTELLIGENCE IN AUSTRALIA
              </div>
            </div>

            <h1 style={{ fontSize: 'clamp(48px,6.5vw,80px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: -3, marginBottom: 22, textTransform: 'uppercase' }}>
              STOP GUESSING,<br />
              <span style={{ background: 'linear-gradient(135deg,#2979ff 0%,#00e676 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>START WINNING</span>
            </h1>
            <p style={{ fontSize: 16, color: '#9eb1c8', lineHeight: 1.65, maxWidth: 520, marginBottom: 36 }}>
              We scan 12+ Aussie bookies and Betfair Exchange around the clock and tell you
              exactly which side to back — with a <strong style={{ color: '#fff' }}>confidence score</strong> on
              every signal, delivered in real time.
            </p>

            <div style={{ display: 'flex', gap: 14, marginBottom: 40, flexWrap: 'wrap' }}>
              <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 12, fontSize: 16, fontWeight: 800, color: '#0a1929', background: 'linear-gradient(135deg,#2979ff,#0099cc)', boxShadow: '0 10px 30px -5px rgba(41,121,255,.4)' }}>
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
                <div style={{ fontWeight: 700, fontSize: 14 }}>7,410 Aussie sharps signed up</div>
                <div style={{ fontSize: 12, color: '#9eb1c8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#ffab00' }}>★★★★★</span> 4.9 / 5 rating
                </div>
              </div>
            </div>
          </div>

          {/* Right — Phone mockup: live NRL signal */}
          <div style={{ flex: '1 1 380px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{
              width: 320, borderRadius: 42, padding: 12,
              background: 'linear-gradient(160deg, #1a2940, #060e1a)',
              border: '1px solid rgba(255,255,255,.12)',
              boxShadow: '0 50px 100px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.1)',
              position: 'relative',
            }}>
              {/* notch */}
              <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 110, height: 24, borderRadius: 14, background: '#060e1a', zIndex: 3 }} />

              <div style={{ borderRadius: 32, overflow: 'hidden', background: '#0a1929', border: '1px solid rgba(255,255,255,.06)', paddingTop: 44, paddingBottom: 22 }}>
                {/* app header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LogoMark size={22} />
                    <span style={{ fontWeight: 900, fontSize: 12, letterSpacing: 1.5 }}>SHADOW SIGNALS</span>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 800, color: '#00e676' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676', display: 'inline-block' }} />
                    LIVE SIGNAL
                  </span>
                </div>

                {/* match card */}
                <div style={{ margin: '0 14px', borderRadius: 16, background: 'rgba(18,41,68,.6)', border: '1px solid rgba(41,121,255,.18)', overflow: 'hidden' }}>
                  <div style={{ padding: '9px 14px', background: 'linear-gradient(135deg,#0c1a45,#1e3a8a)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.75)', letterSpacing: 1 }}>🏉 NRL · ROUND 14</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)' }}>Sat 7:35 PM</span>
                  </div>

                  {/* OUR PICK side */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', background: 'rgba(0,230,118,.07)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                    <TeamLogo name="Gold Coast Titans" color="#00bcd4" size={34} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: 14, color: '#fff' }}>Titans</div>
                      <div style={{ fontSize: 10, color: '#9eb1c8' }}>Gold Coast</div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#030711', background: '#00e676', padding: '3px 9px', borderRadius: 10, letterSpacing: .5, boxShadow: '0 0 14px rgba(0,230,118,.5)' }}>
                      OUR PICK
                    </span>
                  </div>

                  {/* PASS side */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', opacity: .45 }}>
                    <TeamLogo name="Penrith Panthers" color="#475569" size={34} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#94a3b8' }}>Panthers</div>
                      <div style={{ fontSize: 10, color: '#5e7390' }}>Penrith</div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#64748b', border: '1px solid rgba(255,255,255,.15)', padding: '3px 9px', borderRadius: 10, letterSpacing: .5 }}>
                      PASS
                    </span>
                  </div>

                  {/* confidence + stake */}
                  <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
                    <ConfidenceBar score={87} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11 }}>
                      <span style={{ color: '#5e7390' }}>Suggested stake</span>
                      <span style={{ color: '#fff', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>0.8% of bankroll</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11 }}>
                      <span style={{ color: '#5e7390' }}>Your edge</span>
                      <span style={{ color: '#00e676', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>+6.2%</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 14, fontSize: 10, color: '#5e7390', fontWeight: 600 }}>
                  This is what every signal looks like.
                </div>
              </div>
            </div>
            {/* Operative peeking at the mockup — drops in when the asset lands in /public/operatives/ */}
            <OperativePeek page="landing" side="right" width={170} bottom={-40} />
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.15)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '28px 24px' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '0 16px', borderRight: i < 3 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#5e7390', marginTop: 6, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Education: what are shadow signals? ───────────── */}
      <section style={{ padding: '72px 24px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#2979ff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>The Edge</div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, letterSpacing: -1, marginBottom: 20 }}>
            What are shadow signals?
          </h2>
          <p style={{ fontSize: 17, color: '#9eb1c8', lineHeight: 1.75, marginBottom: 16 }}>
            Traditional betting platforms are built to hide value. Their algorithms exist to take
            your money. <strong style={{ color: '#fff' }}>Shadow signals are the edges nobody else talks
            about</strong> — the mispriced lines, the slow-moving odds, the gaps between what a bookmaker
            thinks and what the market knows.
          </p>
          <p style={{ fontSize: 17, color: '#9eb1c8', lineHeight: 1.75 }}>
            We find them. <strong style={{ color: '#00e676' }}>You profit.</strong>
          </p>
        </div>
      </section>

      {/* ── Walkthrough ────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.15)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2979ff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, letterSpacing: -1, marginBottom: 12 }}>
              Most platforms use algorithms to take your money.
            </h2>
            <p style={{ color: '#9eb1c8', fontSize: 16 }}>We use ours to help you beat the line. Here&apos;s how we find shadow signals.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
            {[
              { n: '01', title: 'The markets feed', desc: 'Every fixture across AFL, NRL, cricket and more — one card per match, best odds across 12 bookies.' },
              { n: '02', title: 'Spot the signal', desc: 'The confidence score tells you instantly: green means back it, red means walk away. No jargon.' },
              { n: '03', title: 'The arb finder', desc: 'When bookmakers disagree, lock in guaranteed profit regardless of the result.' },
              { n: '04', title: 'The CLV tracker', desc: 'Proof of long-term edge. Every bet tracked against the closing line — the only metric that matters.' },
            ].map(s => (
              <div key={s.n} style={{ padding: 26, background: 'rgba(18,41,68,.5)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 800, color: '#2979ff', marginBottom: 12 }}>{s.n}</div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>{s.title}</div>
                <div style={{ color: '#9eb1c8', fontSize: 14, lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sports Coverage ────────────────────────────────── */}
      <section style={{ padding: '64px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#2979ff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Coverage</div>
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
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2979ff', boxShadow: '0 0 7px #2979ff', display: 'inline-block', flexShrink: 0 }} />
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
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2979ff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Platform</div>
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

      {/* ── Pricing — all 4 tiers ───────────────────────────── */}
      <section style={{ padding: '64px 32px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2979ff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Pricing</div>
            <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 900, marginBottom: 10 }}>Start free. Pay when winning.</h2>
            <p style={{ color: '#9eb1c8', fontSize: 15, maxWidth: 620, margin: '0 auto 36px', lineHeight: 1.65 }}>
              These tiers should cost 5–10x more. We&apos;re charging next to nothing just to keep the
              lights on — professional-grade edge detection for pocket change.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { name: 'FREE', price: '$0', sub: 'forever', accent: '#94a3b8', features: ['One sport', 'See the signal', 'Stats blurred', 'Basic access'], popular: false },
              { name: 'STARTER', price: '$4.99', sub: 'first month, then $9.99', accent: '#60a5fa', features: ['All sports unlocked', 'Reasoning visible', 'Email alerts', 'Stake blurred'], popular: false },
              { name: 'PRO', price: '$19.99', sub: '/month', accent: '#2979ff', features: ['Everything visible', 'Live alerts', 'Full CLV tracker', 'Arb finder', 'All 12 bookmakers'], popular: true },
              { name: 'ELITE', price: '$49.99', sub: '/month', accent: '#c084fc', features: ['Everything in Pro', 'API access', 'Multi-account tools', 'Private Discord', 'Priority support'], popular: false },
            ].map(t => (
              <div key={t.name} style={{
                position: 'relative',
                background: 'rgba(18,41,68,.5)',
                border: `1px solid ${t.popular ? '#2979ff' : 'rgba(255,255,255,.08)'}`,
                boxShadow: t.popular ? '0 0 0 1px rgba(41,121,255,.25), 0 16px 40px rgba(41,121,255,.12)' : 'none',
                borderRadius: 18, padding: 24,
                display: 'flex', flexDirection: 'column',
              }}>
                {t.popular && (
                  <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#2979ff', color: '#030711', fontSize: 10, fontWeight: 900, letterSpacing: 1.5, padding: '3px 14px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontSize: 12, fontWeight: 800, color: t.accent, letterSpacing: 1.5, marginBottom: 10 }}>{t.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 30, fontWeight: 900 }}>{t.price}</span>
                  <span style={{ fontSize: 11, color: '#5e7390' }}>{t.sub}</span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, flex: 1 }}>
                  {t.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#9eb1c8' }}>
                      <span style={{ color: '#00e676', fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={t.name === 'FREE' ? '/signup' : '/pricing'} style={{
                  display: 'block', padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 800, textAlign: 'center',
                  color: t.popular ? '#0a1929' : '#fff',
                  background: t.popular ? 'linear-gradient(135deg,#2979ff,#0099cc)' : 'rgba(255,255,255,.05)',
                  border: t.popular ? 'none' : '1px solid rgba(255,255,255,.12)',
                }}>
                  {t.name === 'FREE' ? 'Start free →' : 'Start free trial →'}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#5e7390' }}>
            7-day free trial on every paid plan · Cancel anytime · <Link href="/pricing" style={{ color: '#2979ff' }}>Compare all plans →</Link>
          </p>
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────── */}
      <section style={{ padding: '80px 32px', borderTop: '1px solid rgba(255,255,255,.06)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -150, left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(0,230,118,.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, letterSpacing: -1, marginBottom: 14 }}>
            Your results could be next.
          </h2>
          <p style={{ color: '#9eb1c8', fontSize: 16, marginBottom: 32, lineHeight: 1.65 }}>
            Join the punters who stopped guessing and started backing signals with a real edge.
          </p>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '17px 38px', borderRadius: 12, fontSize: 17, fontWeight: 800, color: '#0a1929', background: 'linear-gradient(135deg,#00e676,#00c853)', boxShadow: '0 10px 36px -5px rgba(0,230,118,.4)', marginBottom: 28 }}>
            ⚡ Start free trial now
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ display: 'flex' }}>
              {[
                'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop&crop=face',
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face',
                'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop&crop=face',
              ].map((src, i) => (
                <img key={i} src={src} alt="" width={32} height={32} style={{ borderRadius: '50%', border: '2px solid #0a1929', marginLeft: i > 0 ? -8 : 0, objectFit: 'cover' }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: '#9eb1c8', fontWeight: 600 }}>7,410 Aussie sharps signed up</span>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } a { text-decoration: none; }`}</style>
    </div>
  );
}
