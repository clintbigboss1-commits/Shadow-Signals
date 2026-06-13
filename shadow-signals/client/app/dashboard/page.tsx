'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import API from '../../lib/api';
import { getUser, getToken, type User } from '../../lib/auth';
import { connectSocket } from '../../lib/socket';
import { confidenceFromEV } from '../../lib/confidence';
import AppShell from '../../components/AppShell';
import OnboardingModal from '../../components/OnboardingModal';
import MarketPulse from '../../components/MarketPulse';

/* ─── types ──────────────────────────────────────────────── */
interface EVOpp {
  id: string; sport_key: string; event_name: string;
  selection: string; bookie: string;
  bookie_odds: number|string; fair_odds: number|string;
  ev_percent: number|string; commence_time: string;
}
interface Bet {
  id: string; event_name: string; selection: string;
  bookie: string; odds_taken: number|string;
  profit_aud: number|string; placed_at: string; result: string;
}

/* ─── constants ──────────────────────────────────────────── */
const SPORTS_NAV = [
  { key:'aussierules_afl',     label:'AFL',        icon:'🏈', grad:'linear-gradient(135deg,#003087 0%,#FFD700 100%)', accent:'#FFD700',  bg:'rgba(0,48,135,.25)',  img:'/sports/afl.jpg'        },
  { key:'rugbyleague_nrl',     label:'NRL',        icon:'🏉', grad:'linear-gradient(135deg,#00843D 0%,#00B140 100%)', accent:'#00e676',  bg:'rgba(0,132,61,.25)',  img:'/sports/nrl.jpg'        },
  { key:'soccer_a_league',     label:'A-League',   icon:'⚽', grad:'linear-gradient(135deg,#1a1a2e 0%,#e94560 100%)', accent:'#e94560',  bg:'rgba(233,69,96,.2)',  img:'/sports/soccer.jpg'     },
  { key:'horse_racing_au',     label:'Racing',     icon:'🐎', grad:'linear-gradient(135deg,#1a0a00 0%,#c0392b 100%)', accent:'#ff6b35',  bg:'rgba(192,57,43,.2)',  img:'/sports/racing.jpg'     },
  { key:'greyhound_racing_au', label:'Greyhounds', icon:'🐕', grad:'linear-gradient(135deg,#0d0d0d 0%,#6c63ff 100%)', accent:'#6c63ff',  bg:'rgba(108,99,255,.2)', img:'/sports/greyhounds.jpg' },
  { key:'mma_ufc',             label:'UFC',        icon:'🥊', grad:'linear-gradient(135deg,#0d0d0d 0%,#d4001a 100%)', accent:'#ff1744',  bg:'rgba(212,0,26,.2)',   img:'/sports/ufc.jpg'        },
  { key:'basketball_nba',      label:'NBA',        icon:'🏀', grad:'linear-gradient(135deg,#17408b 0%,#f26522 100%)', accent:'#f26522',  bg:'rgba(242,101,34,.2)', img:'/sports/nba.jpg'        },
  { key:'cricket_t20',         label:'Cricket',    icon:'🏏', grad:'linear-gradient(135deg,#1a2a1a 0%,#2ecc71 100%)', accent:'#2ecc71',  bg:'rgba(46,204,113,.2)', img:'/sports/cricket.jpg'    },
  { key:'surfing',             label:'Surfing',    icon:'🏄', grad:'linear-gradient(135deg,#0077b6 0%,#00b4d8 100%)', accent:'#00b4d8',  bg:'rgba(0,180,216,.2)',  img:'/sports/surfing.jpg'    },
];

const SPORT_LABEL: Record<string, string> = {
  aussierules_afl:'AFL', rugbyleague_nrl:'NRL', soccer_a_league:'A-League',
  soccer_epl:'EPL', basketball_nba:'NBA', mma_ufc:'UFC', cricket_t20:'BBL',
  horse_racing_au:'Racing', greyhound_racing_au:'Greyhounds',
};

const BOOKIE_LABEL: Record<string, string> = {
  sportsbet:'Sportsbet', tab:'TAB', bet365:'Bet365', ladbrokes:'Ladbrokes',
  neds:'Neds', pointsbet:'PointsBet', bluebet:'BlueBet', betfair:'Betfair',
};


/* ─── helpers ────────────────────────────────────────────── */
function fmtKickoff(dt: string) {
  return new Date(dt).toLocaleString('en-AU', {
    timeZone:'Australia/Sydney', weekday:'short', hour:'2-digit', minute:'2-digit',
  });
}
function bookieLabel(b: string) {
  return BOOKIE_LABEL[b?.toLowerCase()] || b?.replace(/_/g,' ') || '—';
}
function confLabel(score: number) {
  if (score >= 80) return 'Strong play';
  if (score >= 65) return 'Decent value';
  return 'Watch line';
}
function confColor(score: number) {
  if (score >= 80) return '#00e676';
  if (score >= 65) return '#ffab00';
  return '#64748b';
}

/* ─── sidebar ────────────────────────────────────────────── */
/* ─── signal card ────────────────────────────────────────── */
function SignalCard({ ev }: { ev: EVOpp }) {
  const [expanded, setExpanded] = useState(false);
  const [tracked, setTracked]   = useState(false);

  const evNum    = Number(ev.ev_percent);
  const oddsNum  = Number(ev.bookie_odds);
  const fairNum  = Number(ev.fair_odds);
  const score    = confidenceFromEV(evNum);
  const isHot    = evNum >= 8;
  const label    = confLabel(score);
  const color    = confColor(score);
  const stake    = ((score / 100) * 2).toFixed(1);
  const sportLbl = SPORT_LABEL[ev.sport_key] || ev.sport_key?.split('_').pop()?.toUpperCase() || '—';

  async function trackBet() {
    if (tracked) return;
    try {
      await API.post('/bets', {
        event_name: ev.event_name, selection: ev.selection,
        bookie: ev.bookie, odds_taken: ev.bookie_odds, stake_aud: 50,
      });
    } catch { /* optimistic */ }
    setTracked(true);
  }

  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px', borderLeft: isHot ? '3px solid #f97316' : '3px solid transparent' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ fontSize:11,fontWeight:800,color:'#fff',background:'rgba(41,121,255,.15)',padding:'3px 10px',borderRadius:6 }}>{sportLbl}</span>
          {isHot && <span style={{ fontSize:11,fontWeight:800,color:'#fff',background:'linear-gradient(135deg,#f97316,#dc2626)',padding:'3px 10px',borderRadius:6 }}>🔥 HOT EDGE</span>}
        </div>
        <span style={{ fontFamily:'var(--mono)',fontWeight:900,fontSize:16,color:'#00e676' }}>+{evNum.toFixed(1)}%</span>
      </div>

      {/* Event name */}
      <div style={{ fontWeight:800,fontSize:17,marginBottom:14,color:'var(--text)' }}>{ev.event_name}</div>

      {/* 4-col info */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14 }}>
        {[
          { lbl:'Our Pick',   val:ev.selection,            style:{ fontWeight:700,fontSize:13 } },
          { lbl:'Best Price', val:`$${oddsNum.toFixed(2)}`, style:{ fontWeight:800,fontSize:14,color:'#2979ff',fontFamily:'var(--mono)' } },
          { lbl:'At',         val:bookieLabel(ev.bookie),  style:{ fontWeight:600,fontSize:12 } },
          { lbl:'Kickoff',    val:fmtKickoff(ev.commence_time), style:{ fontWeight:600,fontSize:11 } },
        ].map(c => (
          <div key={c.lbl}>
            <div style={{ fontSize:9,color:'#64748b',textTransform:'uppercase',letterSpacing:1,marginBottom:4 }}>{c.lbl}</div>
            <div style={c.style as React.CSSProperties}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Confidence bar */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
          <span style={{ fontSize:9,color:'#64748b',textTransform:'uppercase',letterSpacing:1 }}>Confidence</span>
          <span style={{ fontSize:13,fontWeight:700 }}><span style={{ color }}>{score}%</span> · {label}</span>
        </div>
        <div style={{ height:6,background:'rgba(255,255,255,.06)',borderRadius:99,overflow:'hidden' }}>
          <div style={{ height:'100%',width:`${score}%`,background:color,borderRadius:99 }} />
        </div>
      </div>

      {/* Stake / fair odds */}
      <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'#9eb1c8',marginBottom:14 }}>
        <span>Suggested stake: <strong style={{ color:'#fff' }}>{stake}% of bankroll</strong></span>
        <span>Fair odds: <strong style={{ color:'#9eb1c8' }}>${fairNum.toFixed(2)}</strong></span>
      </div>

      {/* Maths panel */}
      {expanded && (
        <div style={{ background:'rgba(7,17,32,.6)',borderRadius:10,padding:'12px 14px',marginBottom:14,fontSize:12,color:'#9eb1c8' }}>
          <div style={{ fontSize:9,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:1.2,marginBottom:8 }}>Fair Value Calculation</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
            <div>Our fair probability: <strong style={{ color:'#fff' }}>{(100/fairNum).toFixed(1)}%</strong></div>
            <div>Bookie implied prob: <strong style={{ color:'#fff' }}>{(100/oddsNum).toFixed(1)}%</strong></div>
            <div>Mathematical edge: <strong style={{ color:'#00e676' }}>+{evNum.toFixed(1)}%</strong></div>
            <div>Kelly stake: <strong style={{ color:'#fff' }}>{stake}% of bankroll</strong></div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <button onClick={() => setExpanded(!expanded)} style={{ background:'none',border:'none',color:'#2979ff',fontWeight:700,fontSize:13,cursor:'pointer',padding:0 }}>
          Show maths {expanded ? '↑' : '↓'}
        </button>
        <button onClick={trackBet} style={{ padding:'9px 20px',borderRadius:9,background:tracked?'rgba(0,230,118,.12)':'linear-gradient(135deg,#2979ff,#1e63d9)',border:tracked?'1px solid rgba(0,230,118,.3)':'none',color:tracked?'#00e676':'#fff',fontWeight:700,fontSize:13,cursor:'pointer' }}>
          {tracked ? '✓ Tracked' : 'Track this bet'}
        </button>
      </div>
    </div>
  );
}

/* ─── recent bets panel ──────────────────────────────────── */
function RecentBetsPanel({ bets }: { bets: Bet[] }) {
  const resultDot: Record<string, string> = { win:'#00e676', loss:'#ef4444', pending:'#ffab00' };
  const profitFmt = (b: Bet) => {
    const n = Number(b.profit_aud);
    if (b.result === 'pending') return '—';
    return `${n >= 0 ? '+' : ''}$${Math.abs(n).toFixed(1)}`;
  };
  const profitColor = (b: Bet) => {
    if (b.result === 'pending') return '#64748b';
    return Number(b.profit_aud) >= 0 ? '#00e676' : '#ef4444';
  };

  if (bets.length === 0) return (
    <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:14,padding:0,overflow:'hidden' }}>
      <div style={{ padding:'14px 16px',borderBottom:'1px solid var(--border)',fontWeight:700,fontSize:14 }}>Recent Bets</div>
      <div style={{ padding:'32px 16px',textAlign:'center',color:'var(--muted)',fontSize:13 }}>
        No bets logged yet.<br />
        <span style={{ fontSize:12,marginTop:4,display:'block' }}>Place a bet and track it from the Wins page.</span>
      </div>
      <div style={{ padding:'10px 16px' }}>
        <Link href="/wins" style={{ fontSize:12,color:'var(--cyan)',fontWeight:700 }}>Go to Wins →</Link>
      </div>
    </div>
  );

  return (
    <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:14,padding:0,overflow:'hidden' }}>
      <div style={{ padding:'14px 16px',borderBottom:'1px solid var(--border)',fontWeight:700,fontSize:14 }}>Recent Bets</div>
      {bets.slice(0,4).map((b,i) => (
        <div key={b.id||i} style={{ padding:'12px 16px',borderBottom:i<3?'1px solid var(--border2)':'none',display:'flex',alignItems:'center',gap:10 }}>
          <span style={{ width:8,height:8,borderRadius:'50%',background:resultDot[b.result]||'#64748b',flexShrink:0,marginTop:2 }} />
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontWeight:600,fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{b.event_name}</div>
            <div style={{ fontSize:11,color:'var(--muted)',marginTop:1 }}>{b.selection} · {bookieLabel(b.bookie)}</div>
          </div>
          <div style={{ textAlign:'right',flexShrink:0 }}>
            <div style={{ fontFamily:'var(--mono)',fontWeight:700,fontSize:13,color:profitColor(b) }}>{profitFmt(b)}</div>
          </div>
        </div>
      ))}
      <div style={{ padding:'10px 16px' }}>
        <Link href="/wins" style={{ fontSize:12,color:'var(--cyan)',fontWeight:700 }}>View all bets →</Link>
      </div>
    </div>
  );
}

/* ─── top confidence panel ───────────────────────────────── */
function TopConfidencePanel({ signals }: { signals: EVOpp[] }) {
  const top = [...signals].sort((a,b) => Number(b.ev_percent)-Number(a.ev_percent)).slice(0,3);
  return (
    <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:14,padding:0,overflow:'hidden',marginTop:14 }}>
      <div style={{ padding:'14px 16px',borderBottom:'1px solid var(--border)',fontWeight:700,fontSize:14 }}>Top Confidence Today</div>
      {top.map((ev,i) => {
        const score = confidenceFromEV(Number(ev.ev_percent));
        const color = confColor(score);
        return (
          <div key={ev.id||i} style={{ padding:'11px 16px',borderBottom:i<2?'1px solid var(--border2)':'none' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4 }}>
              <div>
                <div style={{ fontWeight:600,fontSize:12,marginBottom:2 }}>{ev.event_name}</div>
                <div style={{ fontSize:11,color:'var(--muted)' }}>{ev.selection}</div>
              </div>
              <span style={{ fontFamily:'var(--mono)',fontWeight:800,fontSize:14,color,flexShrink:0,marginLeft:8 }}>{score}%</span>
            </div>
            <div style={{ height:3,background:'rgba(255,255,255,.06)',borderRadius:99,overflow:'hidden' }}>
              <div style={{ height:'100%',width:`${score}%`,background:color,borderRadius:99 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── upgrade poller ─────────────────────────────────────── */
function UpgradePoller({ onUpgrade }: { onUpgrade:(plan:string)=>void }) {
  const params = useSearchParams();
  useEffect(() => {
    if (params.get('upgraded') !== 'true') return;
    window.history.replaceState({}, '', '/dashboard');
    let n = 0;
    const t = setInterval(async () => {
      try {
        const r = await API.get('/payments/status');
        if (r.data.plan && r.data.plan !== 'free') { onUpgrade(r.data.plan); clearInterval(t); }
      } catch { /* ignore */ }
      if (++n >= 12) clearInterval(t);
    }, 5000);
    return () => clearInterval(t);
  }, [params, onUpgrade]);
  return null;
}

/* ─── main dashboard ─────────────────────────────────────── */
function DashboardInner() {
  const [user, setUser]         = useState<User|null>(null);
  const [evOpps, setEvOpps]     = useState<EVOpp[]>([]);
  const [bets, setBets]         = useState<Bet[]>([]);
  const [loading, setLoading]   = useState(true);
  const [upgraded, setUpgraded] = useState(false);
  const [activeSport, setActiveSport] = useState('aussierules_afl');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) { window.location.href = '/login'; return; }
    setUser(u);
    const token = getToken();
    if (token) {
      const s = connectSocket(token);
      s.on('ev:update', (data: EVOpp[]) => setEvOpps(data));
    }
    Promise.all([
      API.get('/ev', { params:{ limit:40 } }),
      API.get('/bets'),
      API.get('/users/me/preferences'),
    ]).then(([evRes, betRes, prefRes]) => {
      setEvOpps(evRes.data.data || []);
      setBets(betRes.data || []);
      if (!prefRes.data.onboarding_done) setShowOnboarding(true);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight:'100vh',display:'grid',placeItems:'center',background:'var(--bg)' }}>
        <div style={{ textAlign:'center' }}>
          <div className="spinner" style={{ margin:'0 auto 16px' }} />
          <p style={{ color:'var(--muted)',fontSize:14 }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  /* group all signals by sport, sorted by EV descending within each sport */
  const allSignals = evOpps;
  const signalsBySport = SPORTS_NAV
    .map(s => ({ sport: s, signals: evOpps.filter(e => e.sport_key === s.key).sort((a,b) => Number(b.ev_percent) - Number(a.ev_percent)) }))
    .filter(g => g.signals.length > 0);
  /* stat card values */
  const settled = bets.filter(b => b.result !== 'pending');
  const wins    = settled.filter(b => b.result === 'win');
  const profit  = settled.reduce((a,b) => a + Number(b.profit_aud||0), 0);
  const clvWin  = settled.length ? Math.round((wins.length/settled.length)*100) : 0;

  return (
    <>
      {showOnboarding && (
        <OnboardingModal userName={user?.name} onDone={() => setShowOnboarding(false)} />
      )}

      <AppShell activeSport={activeSport} onSportChange={setActiveSport}>
        <div className="content" style={{ maxWidth:1400 }}>

          {/* Upgrade banner */}
          {upgraded && (
            <div className="alert-success fadein" style={{ marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span>✅ Plan upgraded! Full access unlocked.</span>
              <button onClick={() => setUpgraded(false)} style={{ background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:18 }}>×</button>
            </div>
          )}

          {/* Header */}
          <div style={{ marginBottom:24 }}>
            <h1 style={{ fontSize:28,fontWeight:900,letterSpacing:-0.5,marginBottom:4 }}>DASHBOARD</h1>
            <p style={{ color:'var(--muted)',fontSize:14 }}>G&apos;day, {user?.name?.split(' ')[0] || 'there'}. Here&apos;s what the market is showing right now.</p>
          </div>

          {/* 4 stat cards */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24 }}>
            {[
              { label:'ACTIVE SIGNALS', value:String(allSignals.length),      sub:'Right now',           color:'var(--cyan)'  },
              { label:'TOTAL P&L',      value:`${profit>=0?'+':''}$${Math.abs(profit).toFixed(0)}`, sub:'All settled bets', color:profit>=0?'var(--green)':'var(--red)' },
              { label:'CLV WIN RATE',   value:settled.length ? `${clvWin}%` : '—',  sub:'Beats closing line',  color:'var(--gold)'  },
              { label:'BETS TRACKED',   value:String(bets.length),     sub:`${wins.length}W · ${settled.length-wins.length}L · ${bets.filter(b=>b.result==='pending').length} pending`, color:'var(--text)' },
            ].map(c => (
              <div key={c.label} className="stat-card">
                <div className="label">{c.label}</div>
                <div className="value" style={{ color:c.color,fontSize:28,marginTop:4 }}>{c.value}</div>
                <div style={{ fontSize:11,color:'var(--muted)',marginTop:2 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Two-column: signals + right panels */}
          <div className="dash-content-grid">

            {/* LEFT: live signals — all sports grouped */}
            <div>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
                <h2 style={{ fontSize:18,fontWeight:900,letterSpacing:-.3 }}>LIVE SIGNALS</h2>
                <span style={{ fontSize:13,color:'var(--muted)' }}>· {allSignals.length} across all sports</span>
              </div>

              {allSignals.length === 0 ? (
                <div style={{ padding:'48px 24px',textAlign:'center',background:'var(--bg2)',borderRadius:14,border:'1px solid var(--border)',color:'var(--muted)' }}>
                  <div style={{ fontSize:32,marginBottom:12 }}>📡</div>
                  <div style={{ fontWeight:700,marginBottom:6 }}>Scanner is warming up</div>
                  <div style={{ fontSize:13 }}>Signals appear here as soon as the scanner finds value. AFL &amp; NRL scan every 7 min on game days.</div>
                </div>
              ) : (
                <div style={{ display:'flex',flexDirection:'column',gap:32 }}>
                  {signalsBySport.map(({ sport, signals: sportSignals }) => {
                    const topEV = Number(sportSignals[0]?.ev_percent || 0);
                    return (
                    <div key={sport.key}>
                      {/* Sport banner header */}
                      <div style={{ position:'relative', borderRadius:16, overflow:'hidden', marginBottom:14, border:`1px solid ${sport.accent}30` }}>
                        {/* Real sport photo */}
                        <div style={{ position:'absolute',inset:0, backgroundImage:`url(${sport.img})`, backgroundSize:'cover', backgroundPosition:'center', filter:'brightness(0.35) saturate(1.2)' }} />
                        {/* Gradient overlay */}
                        <div style={{ position:'absolute',inset:0, background:`linear-gradient(90deg, rgba(5,13,24,.95) 0%, rgba(5,13,24,.6) 60%, transparent 100%)` }} />
                        {/* Animated shimmer */}
                        <div style={{ position:'absolute',inset:0, background:'linear-gradient(105deg,transparent 40%,rgba(255,255,255,.03) 50%,transparent 60%)', backgroundSize:'200% 100%', animation:'shimmer 3s infinite linear' }} />
                        {/* Content */}
                        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                            {/* Big sport icon with glow */}
                            <div style={{ width:52, height:52, borderRadius:14, background:`${sport.accent}18`, border:`1.5px solid ${sport.accent}40`, display:'grid', placeItems:'center', fontSize:26, boxShadow:`0 0 20px ${sport.accent}30`, flexShrink:0 }}>
                              {sport.icon}
                            </div>
                            <div>
                              <div style={{ fontWeight:900, fontSize:20, letterSpacing:.5, textTransform:'uppercase', color:'#fff', lineHeight:1 }}>{sport.label}</div>
                              <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:3 }}>
                                {sportSignals.length} active signal{sportSignals.length !== 1 ? 's' : ''} · best edge +{topEV.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          {/* Right: signal count badge + top EV pill */}
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            {topEV >= 8 && (
                              <span style={{ fontSize:11, fontWeight:800, color:'#fff', background:'linear-gradient(135deg,#f97316,#dc2626)', padding:'4px 12px', borderRadius:20, letterSpacing:.5, boxShadow:'0 2px 12px rgba(249,115,22,.4)', animation:'pulse 2s infinite' }}>
                                🔥 HOT
                              </span>
                            )}
                            <div style={{ textAlign:'center', background:`${sport.accent}15`, border:`1px solid ${sport.accent}35`, borderRadius:12, padding:'8px 16px' }}>
                              <div style={{ fontFamily:'var(--mono)', fontWeight:900, fontSize:22, color:sport.accent, lineHeight:1 }}>{sportSignals.length}</div>
                              <div style={{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginTop:2 }}>SIGNALS</div>
                            </div>
                          </div>
                        </div>
                        {/* Bottom accent line */}
                        <div style={{ height:2, background:sport.grad, opacity:.6 }} />
                      </div>
                      {/* Signal cards grid */}
                      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:12 }}>
                        {sportSignals.slice(0,6).map((ev,i) => <SignalCard key={ev.id||i} ev={ev} />)}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT: Market Pulse + recent bets + top confidence */}
            <div>
              <div style={{ marginBottom:14 }}>
                <MarketPulse />
              </div>
              <RecentBetsPanel bets={bets} />
              <TopConfidencePanel signals={allSignals} />
            </div>
          </div>

          {/* Admin panel */}
          {(user as any)?.role === 'admin' && (
            <div style={{ marginTop:24,padding:'20px',background:'rgba(139,92,246,.05)',border:'1px solid rgba(139,92,246,.3)',borderRadius:12 }}>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:12 }}>
                <span style={{ fontSize:20 }}>👑</span>
                <span style={{ fontWeight:800,fontSize:16,color:'var(--purple)' }}>Owner Control Panel</span>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const email = fd.get('email') as string;
                if (!email) return;
                try { await API.post('/auth/admin/upgrade', { email, plan:'elite' }); alert(`Upgraded ${email} to Elite!`); (e.target as HTMLFormElement).reset(); }
                catch (err: any) { alert(`Failed: ${err.response?.data?.error || err.message}`); }
              }} style={{ display:'flex',gap:10,maxWidth:400 }}>
                <input name="email" type="email" placeholder="friend@example.com" required />
                <button type="submit" className="btn btn-primary" style={{ background:'var(--purple)' }}>Upgrade to Elite</button>
              </form>
            </div>
          )}

        </div>
      </AppShell>
    </>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh',display:'grid',placeItems:'center',background:'#080d18' }}><div className="spinner" /></div>}>
      <UpgradePoller onUpgrade={() => {}} />
      <DashboardInner />
    </Suspense>
  );
}
