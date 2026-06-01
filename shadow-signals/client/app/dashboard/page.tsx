'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import API from '../../lib/api';
import { getUser, getToken, saveAuth, type User } from '../../lib/auth';
import { connectSocket } from '../../lib/socket';

/* ─────────────────────── types ──────────────────────────── */
interface EVOpp {
  id: string; sport_key: string; event_name: string;
  selection: string; bookie: string;
  bookie_odds: number|string; fair_odds: number|string;
  ev_percent: number|string; commence_time: string;
}
interface Bet {
  id: string; event_name: string; selection: string;
  bookie: string; odds_taken: number|string;
  profit_aud: number|string; placed_at: string;
  result: string;
}

/* ─────────────────────── helpers ─────────────────────────── */
function sportIcon(key: string) {
  const m: Record<string,string> = {
    aussierules_afl:'🏉', rugbyleague_nrl:'🏉',
    cricket_odi:'🏏', cricket_t20:'🏏', cricket_test_match:'🏏',
    soccer_a_league:'⚽', soccer_epl:'⚽',
    mma_mixed_martial_arts:'🥊', basketball_nbl:'🏀',
    basketball_nba:'🏀', american_football_nfl:'🏈',
  };
  return m[key] || '🎯';
}
function grade(ev: number) {
  if (ev >= 8) return { cls:'grade-sp', label:'Grade S+', color:'#22d3ee' };
  if (ev >= 5) return { cls:'grade-a',  label:'Grade A',  color:'#10b981' };
  return              { cls:'grade-b',  label:'Grade B',  color:'#f59e0b' };
}
function timeAgo(dt: string) {
  const diff = Date.now() - new Date(dt).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff/60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}
function fmtTime(dt: string) {
  return new Date(dt).toLocaleString('en-AU',{
    timeZone:'Australia/Sydney', weekday:'short',
    hour:'2-digit', minute:'2-digit',
  });
}

/* ─────────────────────── sidebar ─────────────────────────── */
const SPORTS_NAV = [
  { key:'rugbyleague_nrl',        label:'NRL',       icon:'🏉', live:true  },
  { key:'aussierules_afl',        label:'AFL',       icon:'🏉', live:true  },
  { key:'cricket_test_match',     label:'Cricket',   icon:'🏏', live:true  },
  { key:'basketball_nba',         label:'NBA',       icon:'🏀', live:false },
  { key:'american_football_nfl',  label:'NFL',       icon:'🏈', live:false },
  { key:'soccer_epl',             label:'EPL / Soccer', icon:'⚽', live:false },
  { key:'mma_mixed_martial_arts', label:'UFC / MMA', icon:'🥊', live:false },
];

function Sidebar({ user, activeSport, setActiveSport }: {
  user: User|null; activeSport: string; setActiveSport: (s:string)=>void;
}) {
  const planCol: Record<string,string> = {
    free:'#64748b', recruit:'#22d3ee', commander:'#22d3ee', syndicate:'#8b5cf6'
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding:'18px 16px 12px', borderBottom:'1px solid var(--border)' }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#22d3ee,#0891b2)',display:'grid',placeItems:'center',fontWeight:900,fontSize:16,color:'#030711',flexShrink:0 }}>S</div>
          <span style={{ fontWeight:900,fontSize:15,letterSpacing:-.3 }}>SHADOW <span style={{ color:'#22d3ee' }}>SYNDICATE</span></span>
        </Link>
      </div>

      {/* User profile */}
      <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38,height:38,borderRadius:'50%',background:`${planCol[user?.plan||'free']}22`,border:`2px solid ${planCol[user?.plan||'free']}`,display:'grid',placeItems:'center',fontWeight:800,fontSize:16,color:planCol[user?.plan||'free'],flexShrink:0 }}>
            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:700,fontSize:13,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
              {user?.name || user?.email?.split('@')[0] || 'Sharp Punter'}
            </div>
            <div style={{ fontSize:11,color:'var(--cyan)',fontWeight:600,textTransform:'capitalize' }}>
              {user?.plan || 'Free'} &nbsp;<span style={{ color:'var(--muted)' }}>· 85 $BREAKER</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div style={{ padding:'8px 0', flex:1 }}>
        <Link href="/dashboard">
          <button className="nav-item active">
            <span>🏠</span> Dashboard
          </button>
        </Link>
        <Link href="/markets">
          <button className="nav-item">
            <span>📡</span> Live Radar
            <span className="badge">3</span>
          </button>
        </Link>

        {/* Sports section */}
        <div style={{ padding:'12px 16px 6px', fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1.2 }}>
          Sports
        </div>

        {SPORTS_NAV.map(s => (
          <button
            key={s.key}
            className={`nav-item ${activeSport === s.key ? 'active' : ''}`}
            onClick={() => setActiveSport(s.key)}
            style={{ justifyContent:'space-between' }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <span style={{ fontSize:15 }}>{s.icon}</span>
              <span>{s.label}</span>
            </div>
            {s.live && (
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span className="dot-live" style={{ width:5,height:5 }} />
                <span style={{ fontSize:11, color:'var(--green)' }}>▾</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{ borderTop:'1px solid var(--border)', padding:'8px 0' }}>
        <Link href="/pricing">
          <button className="nav-item"><span>💳</span> Subscription</button>
        </Link>
        <button className="nav-item"><span>⚙️</span> Settings</button>
        <button className="nav-item"><span>❓</span> Help &amp; Support</button>
        <button className="nav-item" onClick={() => { localStorage.clear(); window.location.href='/login'; }}>
          <span>↗</span> Sign Out
        </button>
      </div>
    </aside>
  );
}

/* ─────────────────────── topbar ──────────────────────────── */
function TopBar({ user }: { user:User|null }) {
  const planCol: Record<string,string> = {
    free:'#64748b', recruit:'#22d3ee', commander:'#22d3ee', syndicate:'#8b5cf6'
  };
  return (
    <div className="topbar">
      {/* Search */}
      <div className="search-bar" style={{ flex:1, maxWidth:400 }}>
        <span style={{ color:'var(--muted)', flexShrink:0 }}>🔍</span>
        <input placeholder="Search markets, teams, or races..." />
      </div>

      <div style={{ flex:1 }} />

      {/* Notifications */}
      <div style={{ position:'relative', cursor:'pointer' }}>
        <div style={{ width:36,height:36,borderRadius:10,background:'rgba(255,255,255,.06)',border:'1px solid var(--border)',display:'grid',placeItems:'center',fontSize:16 }}>🔔</div>
        <div style={{ position:'absolute',top:-4,right:-4,width:18,height:18,background:'var(--cyan)',borderRadius:'50%',fontSize:10,fontWeight:800,color:'#030711',display:'grid',placeItems:'center' }}>3</div>
      </div>

      {/* User chip */}
      <div style={{ display:'flex',alignItems:'center',gap:9,padding:'6px 12px',background:'rgba(255,255,255,.04)',border:'1px solid var(--border)',borderRadius:10,cursor:'pointer' }}>
        <div style={{ width:28,height:28,borderRadius:'50%',background:`${planCol[user?.plan||'free']}22`,border:`2px solid ${planCol[user?.plan||'free']}`,display:'grid',placeItems:'center',fontWeight:800,fontSize:13,color:planCol[user?.plan||'free'] }}>
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div>
          <div style={{ fontSize:12,fontWeight:700,color:'var(--text)',lineHeight:1 }}>{user?.name || 'Sharp Punter'}</div>
          <div style={{ fontSize:11,color:'var(--muted)',lineHeight:1,marginTop:2,textTransform:'capitalize' }}>{user?.plan || 'Free'}</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── stat cards row ──────────────────── */
function StatCards({ bets }: { bets: Bet[] }) {
  const settled   = bets.filter(b => b.result !== 'pending');
  const wins      = settled.filter(b => b.result === 'win');
  const winRate   = settled.length ? ((wins.length/settled.length)*100).toFixed(0) : '—';
  const profit    = bets.reduce((a,b) => a + Number(b.profit_aud||0), 0);
  const greenLights = bets.filter(b => Number(b.profit_aud||0) > 0).length;

  const cards = [
    { icon:'🎯', value: String(greenLights),       label:'GREEN LIGHTS', change:'+2 today',  color:'var(--cyan)'  },
    { icon:'🛡️', value: '1',                        label:'TRAPS BLOCKED', change:'',          color:'var(--green)' },
    { icon:'📈', value: `${winRate}%`,              label:'CLV BEAT RATE', change:'+3%',        color:'var(--purple)'},
    { icon:'🏆', value: `${winRate}%`,              label:'WIN RATE',      change:'Last 30d',   color:'var(--gold)'  },
    { icon:'💰', value: `+$${Math.abs(profit).toFixed(0)}`, label:'PROFIT (AUD)', change:'+12%', color:'var(--green)' },
    { icon:'⚡', value: '85',                       label:'$BREAKER',      change:'Tokens',     color:'var(--cyan)'  },
  ];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:18 }}>
      {cards.map((c,i) => (
        <div key={i} className="stat-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <span style={{ fontSize:20 }}>{c.icon}</span>
            {c.change && <span style={{ fontSize:11, fontWeight:700, color:'var(--green)' }}>{c.change}</span>}
          </div>
          <div className="value" style={{ color: c.color, fontSize:22 }}>{c.value}</div>
          <div className="label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────── tool cards ─────────────────────── */
function ToolCards() {
  const tools = [
    { icon:'📡', title:'Live Radar',      sub:'6 active targets',   href:'/markets',    glow:'#22d3ee' },
    { icon:'🏇', title:'Racing Signals',  sub:'3 picks today',      href:'/markets',    glow:'#f59e0b' },
    { icon:'🧮', title:'OmniCalc',        sub:'Free EV calculator', href:'/clv',        glow:'#10b981' },
    { icon:'🏅', title:'Leaderboard',     sub:'CLV rankings',       href:'/wins',       glow:'#8b5cf6' },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:18 }}>
      {tools.map((t,i) => (
        <Link key={i} href={t.href}>
          <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'center',gap:12,cursor:'pointer',transition:'border-color .15s' }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor=t.glow+'55'}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor='var(--border)'}
          >
            <div style={{ width:38,height:38,borderRadius:10,background:`${t.glow}14`,display:'grid',placeItems:'center',fontSize:18,flexShrink:0 }}>{t.icon}</div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontWeight:700,fontSize:13,color:'var(--text)' }}>{t.title}</div>
              <div style={{ fontSize:11,color:'var(--muted)',marginTop:2 }}>{t.sub}</div>
            </div>
            <span style={{ color:'var(--muted)',fontSize:16 }}>›</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ─────────────────────── live radar panel ─────────────────── */
function LiveRadarPanel({ evOpps }: { evOpps: EVOpp[] }) {
  const top5 = evOpps.slice(0, 5);
  return (
    <div className="card" style={{ padding:0,overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'14px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:9,background:'rgba(34,211,238,.1)',display:'grid',placeItems:'center',fontSize:17 }}>📡</div>
          <div>
            <div style={{ fontWeight:700,fontSize:14 }}>Live Radar</div>
            <div style={{ fontSize:11,color:'var(--muted)' }}>Real-time +EV targets</div>
          </div>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:5,background:'rgba(34,211,238,.08)',border:'1px solid rgba(34,211,238,.2)',padding:'4px 10px',borderRadius:99,fontSize:11,fontWeight:700,color:'var(--cyan)' }}>
          <span className="dot-cyan" style={{ width:5,height:5 }} />
          {top5.length} ACTIVE
        </div>
      </div>

      {/* Events */}
      {top5.length === 0 ? (
        <div style={{ padding:32,textAlign:'center',color:'var(--muted)',fontSize:13 }}>
          <div style={{ fontSize:28,marginBottom:8 }}>📡</div>
          No active targets right now
        </div>
      ) : (
        top5.map((ev, i) => {
          const evNum  = Number(ev.ev_percent);
          const g      = grade(evNum);
          const teams  = ev.event_name.split(' v ');
          return (
            <div key={ev.id||i} className="radar-event">
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                <div>
                  <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:4 }}>
                    <span style={{ fontSize:13 }}>{sportIcon(ev.sport_key)}</span>
                    <span style={{ fontWeight:700,fontSize:13,color:'var(--text)' }}>{ev.event_name}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:11,color:'var(--muted)' }}>
                      {ev.sport_key?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                    </span>
                    {i === 0 && (
                      <span style={{ background:'rgba(239,68,68,.15)',border:'1px solid rgba(239,68,68,.3)',color:'#ef4444',fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:4 }}>
                        ● LIVE
                      </span>
                    )}
                  </div>
                </div>
                <span className={g.cls}>{g.label}</span>
              </div>

              {/* Best pick */}
              <div style={{ background:'var(--bg3)',borderRadius:8,padding:'9px 12px',marginBottom:6 }}>
                <div style={{ fontSize:10,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8,marginBottom:4 }}>Best Pick</div>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <span style={{ color:'var(--cyan)',fontWeight:800,fontFamily:'var(--mono)',fontSize:14 }}>
                    {teams[0]} @ {Number(ev.bookie_odds).toFixed(2)}
                  </span>
                  <div style={{ background:'rgba(16,185,129,.12)',border:'1px solid rgba(16,185,129,.2)',padding:'3px 10px',borderRadius:6,fontSize:12,fontWeight:700,color:'var(--green)' }}>
                    EDGE +{evNum.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <span style={{ fontSize:11,color:'var(--muted)',display:'flex',alignItems:'center',gap:4 }}>
                  ⏰ {fmtTime(ev.commence_time)} AEST
                </span>
                <span style={{ fontSize:11,color:'var(--muted)',textTransform:'capitalize' }}>
                  via {ev.bookie?.replace(/_/g,' ')}
                </span>
              </div>
            </div>
          );
        })
      )}

      <div style={{ padding:'12px 16px',borderTop:'1px solid var(--border)' }}>
        <Link href="/markets">
          <button className="btn btn-outline" style={{ width:'100%',justifyContent:'center',fontSize:13 }}>
            View all markets →
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────── recent wins ─────────────────────── */
function RecentWins({ bets }: { bets: Bet[] }) {
  const wins = bets.filter(b => Number(b.profit_aud||0) > 0).slice(0, 6);
  return (
    <div className="card">
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
        <span style={{ fontWeight:700,fontSize:15 }}>Your Recent Wins</span>
        <Link href="/clv" style={{ fontSize:13,color:'var(--cyan)' }}>View all →</Link>
      </div>

      {wins.length === 0 ? (
        <div style={{ padding:'24px 0',textAlign:'center',color:'var(--muted)',fontSize:13 }}>
          <div style={{ fontSize:28,marginBottom:8 }}>🎯</div>
          No wins logged yet — start adding bets in CLV Tracker
        </div>
      ) : (
        wins.map((b,i) => {
          const sportGuess = b.event_name.toLowerCase().includes('vs') ||
            b.event_name.toLowerCase().includes(' v ') ? '🏉' : '🎯';
          return (
            <div key={b.id||i} className="win-row">
              <div style={{ width:32,height:32,borderRadius:9,background:'rgba(249,115,22,.12)',border:'1px solid rgba(249,115,22,.2)',display:'grid',placeItems:'center',fontSize:16,flexShrink:0 }}>
                {sportGuess}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontWeight:600,fontSize:13,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{b.event_name}</div>
                <div style={{ fontSize:11,color:'var(--muted)',marginTop:1 }}>
                  {b.selection} @ {Number(b.odds_taken).toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign:'right',flexShrink:0 }}>
                <div style={{ fontFamily:'var(--mono)',fontWeight:700,fontSize:14,color:'var(--green)' }}>
                  +${Number(b.profit_aud).toFixed(0)}
                </div>
                <div style={{ fontSize:11,color:'var(--muted)',marginTop:1 }}>{timeAgo(b.placed_at)}</div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ─────────────────────── upgrade poller ─────────────────── */
function UpgradePoller({ onUpgrade }: { onUpgrade:(plan:string)=>void }) {
  const params = useSearchParams();
  useEffect(() => {
    if (params.get('upgraded') !== 'true') return;
    window.history.replaceState({}, '', '/dashboard');
    let n = 0;
    const t = setInterval(async () => {
      try {
        const r = await API.get('/payments/status');
        if (r.data.plan && r.data.plan !== 'free') {
          onUpgrade(r.data.plan); clearInterval(t);
        }
      } catch { /* ignore */ }
      if (++n >= 12) clearInterval(t);
    }, 5000);
    return () => clearInterval(t);
  }, [params, onUpgrade]);
  return null;
}

/* ─────────────────────── main dashboard ─────────────────── */
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
      API.get('/ev', { params: { limit: 20 } }),
      API.get('/bets'),
    ]).then(([evRes, betRes]) => {
      setEvOpps(evRes.data.data || []);
      setBets(betRes.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = useCallback((plan: string) => {
    const token = getToken();
    const u = getUser();
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

  return (
    <div className="app-shell">
      <Sidebar user={user} activeSport={activeSport} setActiveSport={setActiveSport} />

      <div className="main-area">
        <TopBar user={user} />

        <div className="content">
          {/* Upgrade banner */}
          {upgraded && (
            <div className="alert-success fadein" style={{ marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>✅ Plan upgraded! Full access unlocked.</span>
              <button onClick={() => setUpgraded(false)} style={{ background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:18 }}>×</button>
            </div>
          )}

          {/* Stat cards */}
          <StatCards bets={bets} />

          {/* Tool cards */}
          <ToolCards />

          {/* GET TODAY'S BEST PICK */}
          <Link href="/markets">
            <div style={{ background:'linear-gradient(135deg,#0a3d20,#053a2a)',border:'1px solid rgba(16,185,129,.3)',borderRadius:14,padding:'20px 28px',marginBottom:18,cursor:'pointer',textAlign:'center',transition:'filter .15s' }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.filter='brightness(1.1)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.filter='brightness(1)'}
            >
              <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:6 }}>
                <span style={{ fontSize:22 }}>⚡</span>
                <span style={{ fontWeight:900,fontSize:20,color:'#fff',letterSpacing:-.3 }}>GET TODAY&apos;S BEST PICK</span>
              </div>
              <div style={{ fontSize:14,color:'rgba(255,255,255,.6)' }}>
                One-click green light from our algorithm
              </div>
            </div>
          </Link>

          {/* Two column: wins + radar */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <RecentWins bets={bets} />
            <LiveRadarPanel evOpps={evOpps} />
          </div>

          {/* Free user upgrade nudge */}
          {user?.plan === 'free' && (
            <div style={{ marginTop:16,padding:'14px 18px',background:'linear-gradient(90deg,rgba(34,211,238,.05),rgba(99,102,241,.05))',border:'1px solid rgba(34,211,238,.15)',borderRadius:12,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12 }}>
              <div>
                <div style={{ fontWeight:700,fontSize:14,marginBottom:3 }}>Upgrade to Commander</div>
                <div style={{ fontSize:13,color:'var(--muted)' }}>Unlock all live edges, arb finder, CLV tracker & alerts</div>
              </div>
              <Link href="/pricing">
                <button className="btn btn-primary" style={{ fontSize:13 }}>Upgrade — $19.99/mo →</button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh',display:'grid',placeItems:'center',background:'#080d18' }}>
        <div className="spinner" />
      </div>
    }>
      <UpgradePoller onUpgrade={() => {}} />
      <DashboardInner />
    </Suspense>
  );
}
