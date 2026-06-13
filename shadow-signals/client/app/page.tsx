'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ExitPopup from '../components/ExitPopup';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import OperativePeek from '../components/OperativePeek';

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

const SPORTS = [
  { key: 'aussierules_afl',      label: 'AFL',        sub: 'Australian Football League',  photo: '/sports/afl.jpg' },
  { key: 'rugbyleague_nrl',      label: 'NRL',        sub: 'National Rugby League',       photo: '/sports/nrl.jpg' },
  { key: 'soccer_a_league',      label: 'Soccer',     sub: 'A-League · EPL · UCL',        photo: '/sports/soccer.jpg' },
  { key: 'horse_racing_au',      label: 'Racing',     sub: 'Every AU meet',               photo: '/sports/racing.jpg' },
  { key: 'greyhound_racing_au',  label: 'Greyhounds', sub: 'Every track, every night',    photo: '/sports/greyhounds.jpg' },
  { key: 'mma_ufc',              label: 'UFC / MMA',  sub: 'Every PPV + Fight Night',     photo: '/sports/ufc.jpg' },
  { key: 'basketball_nba',       label: 'NBA',        sub: 'NBA · NBL',                   photo: '/sports/nba.jpg' },
  { key: 'americanfootball_nfl', label: 'NFL',        sub: 'Regular + Playoffs',          photo: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&w=1200&q=85' },
  { key: 'cricket_t20',          label: 'Cricket',    sub: 'BBL · Tests · ODI · T20',     photo: '/sports/cricket.jpg' },
];

interface PublicStats {
  signals_today: number;
  clv_positive_pct: number;
  avg_win_profit_aud: number;
  bookmakers_scanned: number;
}

export default function Home() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    fetch('/api/stats/public')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d); })
      .catch(() => {});
  }, []);

  const STATS = [
    { value: stats?.signals_today ? String(stats.signals_today) : '—',     label: 'Signals today',          color: '#00e676' },
    { value: stats?.clv_positive_pct ? `${stats.clv_positive_pct}%` : '—', label: 'CLV positive rate',      color: '#ffab00' },
    { value: stats?.avg_win_profit_aud ? `+$${stats.avg_win_profit_aud.toLocaleString()}` : '—', label: 'Avg win profit AUD', color: '#ffffff' },
    { value: '12',                                                            label: 'Bookmakers scanned',     color: '#a78bfa' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a1929', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>

      <ExitPopup />

      {/* RG bar */}
      <div style={{ background: 'rgba(255,171,0,.08)', borderBottom: '1px solid rgba(255,171,0,.15)', padding: '8px 24px', textAlign: 'center', fontSize: 12, color: '#ffab00' }}>
        <strong>18+ Only.</strong>{' '}Think about your choices. Call{' '}
        <a href="tel:1800858858" style={{ color: '#ffab00', fontWeight: 700 }}>1800 858 858</a>
        {' '}· gamblinghelponline.org.au
      </div>

      <Navbar />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: 'clamp(60px,8vh,100px) 24px clamp(60px,8vh,100px)', overflow: 'hidden' }}>
        {/* Background orbs */}
        <div style={{ position: 'absolute', top: -300, left: '-5%', width: 700, height: 700, background: 'radial-gradient(ellipse, rgba(41,121,255,.06) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -100, right: '5%', width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(41,121,255,.08) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

        <div className="landing-hero-grid" style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1, gridTemplateColumns: '2fr 3fr' }}>

          {/* ── LEFT: headline + CTAs */}
          <div>
            {/* Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 99, border: '1px solid rgba(41,121,255,.3)', background: 'rgba(41,121,255,.06)', color: '#2979ff', fontSize: 11, fontWeight: 800, letterSpacing: 1.2, marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2979ff', boxShadow: '0 0 10px #2979ff', display: 'inline-block', flexShrink: 0 }} />
              #1 BETTING INTELLIGENCE IN AUSTRALIA
            </div>

            {/* Headline */}
            <h1 style={{ margin: '0 0 16px', padding: 0 }}>
              <span style={{ display: 'block', fontSize: 'clamp(80px,10vw,140px)', fontWeight: 900, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9, letterSpacing: '-3px' }}>SHADOW</span>
              <span style={{ display: 'block', fontSize: 'clamp(80px,10vw,140px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.9, letterSpacing: '-3px', background: 'linear-gradient(135deg,#2979ff 0%,#5b8cff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SIGNALS</span>
            </h1>

            {/* Sub-headline */}
            <p style={{ fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#9eb1c8', margin: '0 0 20px' }}>
              STOP GUESSING. START <span style={{ color: '#2979ff' }}>WINNING.</span>
            </p>

            {/* Paragraph */}
            <p style={{ fontSize: 16, color: '#9eb1c8', lineHeight: 1.65, maxWidth: 500, margin: '0 0 36px' }}>
              We scan 12+ Aussie bookies and Betfair Exchange to find the mathematical edge. Get{' '}
              <strong style={{ color: '#fff' }}>high-confidence signals</strong> and{' '}
              <strong style={{ color: '#fff' }}>+EV bets</strong> delivered to your dashboard in real time.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 32, flexWrap: 'wrap' }}>
              <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 28px', borderRadius: 12, fontSize: 16, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#2979ff,#1e63d9)', boxShadow: '0 10px 30px -5px rgba(41,121,255,.45)' }}>
                ⚡ Start 7-Day Free Trial
              </Link>
              <Link href="/markets" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 28px', borderRadius: 12, fontSize: 16, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,.12)', background: 'transparent' }}>
                View Live Signals →
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
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
                  <span style={{ color: '#ffab00' }}>★★★★★</span> 4.9 / 5 rating
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: phone mockup of dashboard */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 580, flex: 1 }}>
            {/* Glow behind phone */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 320, height: 320, background: 'radial-gradient(ellipse, rgba(41,121,255,.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Phone frame */}
            <div style={{
              position: 'relative', width: 270, height: 560,
              background: '#0c0f1a',
              borderRadius: 44,
              border: '2px solid rgba(255,255,255,.12)',
              boxShadow: '0 50px 120px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.04), inset 0 0 0 1px rgba(255,255,255,.05)',
              overflow: 'hidden',
              flexShrink: 0,
              zIndex: 3,
            }}>
              {/* Dynamic island */}
              <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 90, height: 26, background: '#000', borderRadius: 13, zIndex: 10 }} />

              {/* Screen */}
              <div style={{ position: 'absolute', inset: 0, background: '#050d18', padding: '52px 10px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 0 }}>

                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 900, color: '#fff', letterSpacing: .5 }}>DASHBOARD</div>
                    <div style={{ fontSize: 7, color: '#5e7390', marginTop: 1 }}>Live signals · 14 found today</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#2979ff,#00e676)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff' }}>C</div>
                </div>

                {/* Stat row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginBottom: 10 }}>
                  {[['14','Signals'],['68%','CLV Rate'],['+$312','P&L']].map(([v,l],i) => (
                    <div key={i} style={{ background: '#111827', borderRadius: 8, padding: '7px 6px', textAlign: 'center', border: '1px solid rgba(255,255,255,.06)' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 900, color: i===2?'#00e676':i===1?'#ffab00':'#fff' }}>{v}</div>
                      <div style={{ fontSize: 6.5, color: '#5e7390', marginTop: 2 }}>{l}</div>
                    </div>
                  ))}
                </div>

                {/* Signal cards */}
                <div style={{ fontSize: 8, fontWeight: 800, color: '#5e7390', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Live Signals</div>
                {[
                  { icon:'⚽', event:'AUS vs France', market:'AUS Win', ev:'+9.2%', odds:'3.40', bookie:'Bet365', conf:91, color:'#00e676' },
                  { icon:'🏉', event:'Storm vs Roosters', market:'Storm -4.5', ev:'+6.8%', odds:'1.95', bookie:'Sportsbet', conf:77, color:'#00e676' },
                  { icon:'🏈', event:'Collingwood vs GWS', market:'Collingwood ML', ev:'+5.1%', odds:'2.10', bookie:'TAB', conf:65, color:'#ffab00' },
                  { icon:'🏀', event:'Celtics vs Mavs', market:'Celtics ML', ev:'+4.3%', odds:'1.72', bookie:'Neds', conf:61, color:'#ffab00' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#111827', border: '1px solid rgba(255,255,255,.07)', borderRadius: 9, padding: '8px 9px', marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 11 }}>{s.icon}</span>
                        <div>
                          <div style={{ fontSize: 8, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{s.event}</div>
                          <div style={{ fontSize: 6.5, color: '#5e7390', marginTop: 1 }}>{s.market}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.ev}</div>
                        <div style={{ fontSize: 7, color: '#5e7390' }}>{s.odds}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 7, color: '#5e7390', background: 'rgba(255,255,255,.05)', padding: '2px 6px', borderRadius: 4 }}>{s.bookie}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 36, height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 2 }}>
                          <div style={{ width: `${s.conf}%`, height: '100%', background: s.color, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 7, color: s.color, fontWeight: 700 }}>{s.conf}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Home indicator */}
              <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 90, height: 4, background: 'rgba(255,255,255,.25)', borderRadius: 2 }} />
            </div>

            {/* Floating badge */}
            <div style={{ position: 'absolute', top: 60, right: 10, background: '#111827', border: '1px solid rgba(0,230,118,.3)', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,.5)', zIndex: 4 }}>
              <div style={{ fontSize: 10, color: '#5e7390', marginBottom: 3 }}>Today&apos;s top pick</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#00e676', fontFamily: 'monospace' }}>+9.2% EV ⚡</div>
              <div style={{ fontSize: 9, color: '#9eb1c8', marginTop: 2 }}>AUS vs France</div>
            </div>

            {/* Floating badge 2 */}
            <div style={{ position: 'absolute', bottom: 80, left: 0, background: '#111827', border: '1px solid rgba(41,121,255,.3)', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,.5)', zIndex: 4 }}>
              <div style={{ fontSize: 10, color: '#5e7390', marginBottom: 3 }}>CLV this week</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#2979ff', fontFamily: 'monospace' }}>68% positive</div>
              <div style={{ fontSize: 9, color: '#9eb1c8', marginTop: 2 }}>Beating the close</div>
            </div>
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
              <div key={s.n} style={{ padding: 26, background: '#111827', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16 }}>
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

        <div className="sport-grid">
          {SPORTS.map(s => (
            <Link key={s.key} href={`/markets?sport=${s.key}`} className="sport-card">
              <div>
                {/* Photo */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${s.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,17,32,.2) 0%, rgba(7,17,32,.92) 100%)' }} />
                {/* Green pip top-right */}
                <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676' }} />
                {/* Label bottom-left */}
                <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
                  <div style={{ fontFamily: 'Bebas Neue, var(--display)', fontSize: 28, color: '#fff', lineHeight: 1, letterSpacing: .5 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 3, fontWeight: 500 }}>{s.sub}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Bookie strip ───────────────────────────────────── */}
      <div style={{ padding: '8px 32px 56px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: '#2d4060', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 18 }}>Syncing odds live from</p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
            {BOOKIES.map(b => (
              <span key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)', background: '#111827', fontSize: 13, color: '#9eb1c8', fontWeight: 600 }}>
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
              <div key={i} style={{ padding: 26, background: '#111827', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                background: '#111827',
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
