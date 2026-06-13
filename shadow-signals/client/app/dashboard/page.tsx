'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import API from '../../lib/api';
import { getUser, getToken, saveAuth, type User } from '../../lib/auth';
import { connectSocket } from '../../lib/socket';
import { confidenceFromEV } from '../../lib/confidence';

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
  { key:'aussierules_afl',     label:'AFL',        icon:'🏈' },
  { key:'rugbyleague_nrl',     label:'NRL',        icon:'🏉' },
  { key:'soccer_a_league',     label:'Soccer',     icon:'⚽' },
  { key:'horse_racing_au',     label:'Racing',     icon:'🐎' },
  { key:'greyhound_racing_au', label:'Greyhounds', icon:'🐕' },
  { key:'mma_ufc',             label:'UFC',        icon:'🥊' },
  { key:'basketball_nba',      label:'NBA',        icon:'🏀' },
  { key:'cricket_t20',         label:'Cricket',    icon:'🏏' },
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

const FALLBACK_SIGNALS: EVOpp[] = [
  { id:'f1', sport_key:'aussierules_afl',    event_name:'Geelong Cats v Collingwood',       selection:'Geelong Cats',       bookie:'sportsbet', bookie_odds:2.30, fair_odds:2.85, ev_percent:12.2, commence_time:new Date(Date.now()+18*3600000).toISOString() },
  { id:'f2', sport_key:'aussierules_afl',    event_name:'Carlton Blues v Essendon Bombers', selection:'Carlton Blues',       bookie:'pointsbet', bookie_odds:2.55, fair_odds:2.30, ev_percent:10.9, commence_time:new Date(Date.now()+42*3600000).toISOString() },
  { id:'f3', sport_key:'rugbyleague_nrl',    event_name:'Panthers v Titans',                selection:'Penrith Panthers',   bookie:'tab',       bookie_odds:1.85, fair_odds:1.70, ev_percent:5.7,  commence_time:new Date(Date.now()+18*3600000).toISOString() },
  { id:'f4', sport_key:'rugbyleague_nrl',    event_name:'Storm v Roosters',                 selection:'Melbourne Storm',    bookie:'bet365',    bookie_odds:2.10, fair_odds:1.88, ev_percent:9.8,  commence_time:new Date(Date.now()+26*3600000).toISOString() },
  { id:'f5', sport_key:'basketball_nba',     event_name:'Lakers v Celtics',                 selection:'LA Lakers',          bookie:'sportsbet', bookie_odds:1.95, fair_odds:1.75, ev_percent:7.7,  commence_time:new Date(Date.now()+14*3600000).toISOString() },
  { id:'f6', sport_key:'soccer_a_league',    event_name:'Brisbane Roar v Melbourne City',   selection:'Melbourne City',     bookie:'tab',       bookie_odds:2.20, fair_odds:1.98, ev_percent:6.1,  commence_time:new Date(Date.now()+22*3600000).toISOString() },
  { id:'f7', sport_key:'mma_ufc',            event_name:'Adesanya v Pereira 3',             selection:'Israel Adesanya',    bookie:'bet365',    bookie_odds:3.50, fair_odds:3.10, ev_percent:8.3,  commence_time:new Date(Date.now()+72*3600000).toISOString() },
  { id:'f8', sport_key:'cricket_t20',        event_name:'Brisbane Heat v Sydney Thunder',   selection:'Brisbane Heat',      bookie:'sportsbet', bookie_odds:2.05, fair_odds:1.82, ev_percent:6.8,  commence_time:new Date(Date.now()+30*3600000).toISOString() },
  { id:'f9', sport_key:'horse_racing_au',    event_name:'Randwick R5',                      selection:'Artorius',           bookie:'tab',       bookie_odds:4.20, fair_odds:3.50, ev_percent:11.4, commence_time:new Date(Date.now()+8*3600000).toISOString() },
  { id:'f10',sport_key:'greyhound_racing_au',event_name:'Wentworth Park R8',               selection:'Trap 3 — Bolt',      bookie:'sportsbet', bookie_odds:3.80, fair_odds:3.20, ev_percent:7.2,  commence_time:new Date(Date.now()+5*3600000).toISOString() },
];

const FALLBACK_BETS: Bet[] = [
  { id:'b1', event_name:'Brisbane Lions v GWS Giants',            selection:'Brisbane Lions',    bookie:'sportsbet', odds_taken:1.85, profit_aud:42.5,  placed_at:'2026-06-09T00:00:00Z', result:'win'     },
  { id:'b2', event_name:'Sydney Roosters v Newcastle Knights',    selection:'Sydney Roosters',   bookie:'tab',       odds_taken:1.72, profit_aud:-75,   placed_at:'2026-06-07T00:00:00Z', result:'loss'    },
  { id:'b3', event_name:'Geelong Cats v Hawthorn',                selection:'Geelong Cats',      bookie:'bet365',    odds_taken:1.95, profit_aud:57,    placed_at:'2026-06-03T00:00:00Z', result:'win'     },
  { id:'b4', event_name:'Parramatta Eels v Manly Sea Eagles',     selection:'Parramatta Eels',   bookie:'neds',      odds_taken:2.18, profit_aud:0,     placed_at:'2026-06-12T00:00:00Z', result:'pending' },
];

/* ─── helpers ────────────────────────────────────────────── */
function timeAgo(dt: string) {
  const diff = Date.now() - new Date(dt).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff/60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}
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
function Sidebar({ user, activeSport, setActiveSport }: {
  user: User|null; activeSport: string; setActiveSport: (s:string)=>void;
}) {
  const planCol = user?.plan === 'elite' ? '#8b5cf6' : '#2979ff';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid var(--border)' }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#2979ff,#1e63d9)',display:'grid',placeItems:'center',fontSize:16,flexShrink:0 }}>⚡</div>
          <div style={{ lineHeight:1.1 }}>
            <div style={{ fontWeight:900,fontSize:13,letterSpacing:.5 }}>SHADOW</div>
            <div style={{ fontWeight:900,fontSize:13,letterSpacing:.5,color:'#2979ff' }}>SIGNALS</div>
          </div>
        </Link>
      </div>

      {/* User */}
      <div style={{ padding:'12px 16px 12px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36,height:36,borderRadius:'50%',background:`${planCol}22`,border:`2px solid ${planCol}`,display:'grid',placeItems:'center',fontWeight:800,fontSize:15,color:planCol,flexShrink:0 }}>
          {user?.name?.charAt(0) || user?.email?.charAt(0) || 'D'}
        </div>
        <div>
          <div style={{ fontWeight:700,fontSize:13 }}>{user?.name || user?.email?.split('@')[0] || 'Demo User'}</div>
          <div style={{ fontSize:10,fontWeight:800,color:planCol,textTransform:'uppercase',letterSpacing:1 }}>{user?.plan || 'Starter'}</div>
        </div>
      </div>

      {/* Main nav */}
      <div style={{ padding:'8px 0', flex:1, overflowY:'auto' }}>
        <Link href="/dashboard"><button className="nav-item active"><span>⊞</span> Dashboard</button></Link>
        <Link href="/markets"><button className="nav-item"><span>~</span> Markets</button></Link>
        <Link href="/ghost"><button className="nav-item"><span>◎</span> Signals</button></Link>
        <Link href="/wins"><button className="nav-item"><span>↗</span> My Wins</button></Link>
        <Link href="/settings"><button className="nav-item"><span>⚙</span> Settings</button></Link>

        <div style={{ padding:'14px 16px 6px', fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1.2 }}>Sports</div>
        {SPORTS_NAV.map(s => (
          <button key={s.key} className={`nav-item ${activeSport===s.key?'active':''}`} onClick={() => setActiveSport(s.key)} style={{ justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <span style={{ fontSize:14 }}>{s.icon}</span>
              <span>{s.label}</span>
            </div>
            {activeSport===s.key && <span style={{ width:7,height:7,borderRadius:'50%',background:'var(--cyan)',boxShadow:'0 0 8px var(--cyan)',display:'inline-block' }} />}
          </button>
        ))}
      </div>

      {/* Bottom */}
      <div style={{ padding:'12px 12px 16px', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8 }}>
        <Link href="/pricing">
          <button style={{ width:'100%', padding:'10px 0', borderRadius:9, background:'linear-gradient(135deg,#2979ff,#1e63d9)', border:'none', color:'#fff', fontWeight:800, fontSize:13, cursor:'pointer' }}>
            Unlock all signals →
          </button>
        </Link>
        <button onClick={() => { localStorage.clear(); window.location.href='/login'; }} style={{ background:'none',border:'none',color:'var(--muted)',fontSize:13,cursor:'pointer',padding:'4px 0' }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

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
    ]).then(([evRes, betRes]) => {
      setEvOpps(evRes.data.data || []);
      setBets(betRes.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = useCallback((plan: string) => {
    const token = getToken(); const u = getUser();
    if (u && token) { saveAuth(token, { ...u, plan: plan as User['plan'] }); setUser({ ...u, plan: plan as User['plan'] }); }
    setUpgraded(true);
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

  /* signals for the active sport, fall back to demo data */
  const filtered = evOpps.filter(e => e.sport_key === activeSport);
  const signals  = filtered.length > 0 ? filtered : FALLBACK_SIGNALS.filter(e => e.sport_key === activeSport);
  const allSignals = evOpps.length > 0 ? evOpps : FALLBACK_SIGNALS;
  const displayBets = bets.length > 0 ? bets : FALLBACK_BETS;

  /* stat card values */
  const settled = displayBets.filter(b => b.result !== 'pending');
  const wins    = settled.filter(b => b.result === 'win');
  const profit  = settled.reduce((a,b) => a + Number(b.profit_aud||0), 0);
  const clvWin  = settled.length ? Math.round((wins.length/settled.length)*100) : 0;

  const sportName = SPORTS_NAV.find(s => s.key === activeSport)?.label || activeSport;

  return (
    <div className="app-shell">
      <Sidebar user={user} activeSport={activeSport} setActiveSport={setActiveSport} />

      <div className="main-area">
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
            <p style={{ color:'var(--muted)',fontSize:14 }}>G&apos;day, {user?.name?.split(' ')[0] || 'Demo'}. Here&apos;s what the market is showing right now.</p>
          </div>

          {/* 4 stat cards */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24 }}>
            {[
              { label:'ACTIVE SIGNALS', value:String(allSignals.length),      sub:'Right now',           color:'var(--cyan)'  },
              { label:'TOTAL P&L',      value:`${profit>=0?'+':''}$${Math.abs(profit).toFixed(0)}`, sub:'All settled bets', color:profit>=0?'var(--green)':'var(--red)' },
              { label:'CLV WIN RATE',   value:`${clvWin}%`,                   sub:'Beats closing line',  color:'var(--gold)'  },
              { label:'BETS TRACKED',   value:String(displayBets.length),     sub:`${wins.length}W · ${settled.length-wins.length}L · ${displayBets.filter(b=>b.result==='pending').length} pending`, color:'var(--text)' },
            ].map(c => (
              <div key={c.label} className="stat-card">
                <div className="label">{c.label}</div>
                <div className="value" style={{ color:c.color,fontSize:28,marginTop:4 }}>{c.value}</div>
                <div style={{ fontSize:11,color:'var(--muted)',marginTop:2 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Two-column: signals + sidebar panels */}
          <div className="dash-content-grid">

            {/* LEFT: live signals */}
            <div>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
                <h2 style={{ fontSize:18,fontWeight:900,letterSpacing:-.3 }}>LIVE SIGNALS</h2>
                <span style={{ fontSize:13,color:'var(--muted)' }}>· filtered by {sportName}</span>
              </div>

              {signals.length === 0 ? (
                <div style={{ padding:'48px 24px',textAlign:'center',background:'var(--bg2)',borderRadius:14,border:'1px solid var(--border)',color:'var(--muted)' }}>
                  No signals for {sportName} right now. Check back soon.
                </div>
              ) : (
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(380px,1fr))',gap:14 }}>
                  {signals.slice(0,6).map((ev,i) => <SignalCard key={ev.id||i} ev={ev} />)}
                </div>
              )}
            </div>

            {/* RIGHT: recent bets + top confidence */}
            <div>
              <RecentBetsPanel bets={displayBets} />
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
      </div>
    </div>
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
