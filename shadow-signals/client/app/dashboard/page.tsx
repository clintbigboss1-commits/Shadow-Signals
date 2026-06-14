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
import EventCard, { type GameEvent } from '../../components/EventCard';

/* ─── types ──────────────────────────────────────────────── */
interface Bet {
  id: string; event_name: string; selection: string;
  bookie: string; odds_taken: number|string;
  profit_aud: number|string; placed_at: string; result: string;
}
type EVPick = {
  selection: string; bookie: string; bookie_odds: number;
  fair_odds: number; ev_percent: number; kelly_percent: number;
  event_name: string; event_id: string; sport_key: string; commence_time: string;
};

/* ─── sport config ───────────────────────────────────────── */
const SPORT_LABEL: Record<string,string> = {
  aussierules_afl:'AFL', rugbyleague_nrl:'NRL', soccer_a_league:'A-League',
  soccer_epl:'EPL', basketball_nba:'NBA', mma_ufc:'UFC', cricket_t20:'T20',
  horse_racing_au:'Racing', horse_racing_gb:'UK Racing', horse_racing_ire:'IRE Racing',
  horse_racing_us:'US Racing', greyhound_racing_au:'Greyhounds',
  greyhound_racing_ire:'IRE Greyhounds',
};
const SPORT_ICON: Record<string,string> = {
  aussierules_afl:'🏈', rugbyleague_nrl:'🏉', soccer_a_league:'⚽', soccer_epl:'⚽',
  basketball_nba:'🏀', mma_ufc:'🥊', horse_racing_gb:'🐎', horse_racing_ire:'🐎',
  horse_racing_au:'🐎', horse_racing_us:'🐎', greyhound_racing_au:'🐕', cricket_t20:'🏏',
};
const BOOKIE_LABEL: Record<string,string> = {
  sportsbet:'Sportsbet', tab:'TAB', bet365:'Bet365', ladbrokes:'Ladbrokes',
  neds:'Neds', pointsbet:'PointsBet', bluebet:'BlueBet', betfair_ex_au:'Betfair',
  betfair:'Betfair', williamhill:'William Hill', unibet:'Unibet',
};
const SPORTS_NAV_CFG = [
  { key:'aussierules_afl',  label:'AFL',       icon:'🏈', accent:'#FFD700',  grad:'linear-gradient(135deg,#003087,#FFD700)' },
  { key:'rugbyleague_nrl',  label:'NRL',       icon:'🏉', accent:'#00e676',  grad:'linear-gradient(135deg,#00843D,#00B140)' },
  { key:'horse_racing_gb',  label:'UK Racing', icon:'🐎', accent:'#ff6b35',  grad:'linear-gradient(135deg,#200800,#c0392b)' },
  { key:'horse_racing_ire', label:'IRE Racing',icon:'🐎', accent:'#2ecc71',  grad:'linear-gradient(135deg,#001a00,#2ecc71)' },
  { key:'basketball_nba',   label:'NBA',       icon:'🏀', accent:'#f26522',  grad:'linear-gradient(135deg,#17408b,#f26522)' },
  { key:'soccer_a_league',  label:'A-League',  icon:'⚽', accent:'#e94560',  grad:'linear-gradient(135deg,#1a1a2e,#e94560)' },
  { key:'mma_ufc',          label:'UFC',       icon:'🥊', accent:'#ff1744',  grad:'linear-gradient(135deg,#0d0d0d,#d4001a)' },
  { key:'cricket_t20',      label:'Cricket',   icon:'🏏', accent:'#2ecc71',  grad:'linear-gradient(135deg,#1a2a1a,#2ecc71)' },
];

/* ─── helpers ────────────────────────────────────────────── */
function bkLabel(b: string) { return BOOKIE_LABEL[b?.toLowerCase()] || b?.replace(/_/g,' ') || '—'; }
function cColor(score: number) {
  if (score >= 80) return '#00e676';
  if (score >= 65) return '#ffab00';
  return '#64748b';
}
function fmtCd(dt: string) {
  const diff = new Date(dt).getTime() - Date.now();
  if (diff <= 0) return 'LIVE';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
function fmtKo(dt: string) {
  return new Date(dt).toLocaleString('en-AU', {
    timeZone:'Australia/Sydney', weekday:'short', hour:'2-digit', minute:'2-digit',
  });
}

/* ─── Next-to-Jump racing strip ──────────────────────────── */
function NextToJumpStrip({ games }: { games: GameEvent[] }) {
  const [tab, setTab] = useState<'horses'|'greys'>('horses');

  const filter = tab === 'horses'
    ? (k: string) => k.startsWith('horse_racing')
    : (k: string) => k.startsWith('greyhound');

  const races = games
    .filter(g => filter(g.sport_key))
    .sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime())
    .slice(0, 16);

  const hasAny = games.some(g => g.sport_key.startsWith('horse_racing') || g.sport_key.startsWith('greyhound'));
  if (!hasAny) return null;

  const TABS: Array<[typeof tab, string]> = [['horses','🐎 Horses'],['greys','🐕 Greys']];

  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        <div style={{ width:3, height:18, background:'linear-gradient(#2979ff,#00e5ff)', borderRadius:2, flexShrink:0 }} />
        <span style={{ fontSize:12, fontWeight:900, letterSpacing:1.5, textTransform:'uppercase', color:'var(--text)' }}>
          Next to Jump
        </span>
        <div style={{ display:'flex', gap:3, marginLeft:'auto' }}>
          {TABS.map(([id, lbl]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer',
              background: tab === id ? '#2979ff' : 'rgba(255,255,255,.06)',
              color: tab === id ? '#fff' : 'var(--muted)',
              border: `1px solid ${tab === id ? '#2979ff' : 'rgba(255,255,255,.1)'}`,
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      {races.length === 0 ? (
        <div style={{ padding:'16px', textAlign:'center', color:'var(--muted)', fontSize:12, background:'rgba(255,255,255,.03)', borderRadius:12, border:'1px solid rgba(255,255,255,.06)' }}>
          No upcoming {tab === 'greys' ? 'greyhound' : 'horse'} races in feed — racing data loads every 10 min.
        </div>
      ) : (
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:6 }}>
          {races.map(race => {
            const cd       = fmtCd(race.commence_time);
            const live     = cd === 'LIVE';
            const best     = Math.max(0, ...race.ev_picks.map(p => p.ev_percent));
            const hasEdge  = best > 0;
            const top      = [...race.ev_picks].sort((a,b) => b.ev_percent - a.ev_percent)[0];
            const parts    = race.home_team?.split(' ') || [];
            const course   = parts.length > 1 ? parts.slice(1).join(' ') : (race.home_team || 'Race');
            const runners  = race.best_odds.length;

            return (
              <Link key={race.event_id} href={`/match/${encodeURIComponent(race.event_id)}`} style={{ textDecoration:'none', flexShrink:0 }}>
                <div style={{
                  width:118, borderRadius:12, padding:'11px 10px', cursor:'pointer',
                  background: hasEdge
                    ? 'linear-gradient(135deg,rgba(0,168,78,.12),rgba(0,40,20,.4))'
                    : 'rgba(255,255,255,.04)',
                  border:`1.5px solid ${hasEdge ? 'rgba(0,230,118,.35)' : 'rgba(255,255,255,.09)'}`,
                  transition:'transform .15s, border-color .15s',
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                    <span style={{
                      fontSize:10, fontWeight:800, borderRadius:20, padding:'2px 7px',
                      background: live ? 'rgba(239,68,68,.15)' : 'rgba(41,121,255,.13)',
                      color: live ? '#ef4444' : '#60a5fa',
                    }}>{live ? '● LIVE' : cd}</span>
                    {hasEdge && <span style={{ fontSize:9, color:'#00e676', fontWeight:900 }}>+EV</span>}
                  </div>
                  <div style={{ fontSize:13, fontWeight:800, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>{course}</div>
                  <div style={{ fontSize:10, color:'var(--muted)', marginBottom: hasEdge ? 7 : 0 }}>{runners} runner{runners !== 1 ? 's' : ''}</div>
                  {hasEdge && top && (
                    <div style={{ borderTop:'1px solid rgba(0,230,118,.18)', paddingTop:6 }}>
                      <div style={{ fontSize:11, color:'#00e676', fontWeight:900 }}>+{best.toFixed(1)}%</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{top.selection}</div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── OddsJam-style EV pick card ─────────────────────────── */
function OddsJamCard({ pick }: { pick: EVPick }) {
  const [exp, setExp]       = useState(false);
  const [tracked, setTracked] = useState(false);

  const ev    = pick.ev_percent;
  const odds  = pick.bookie_odds;
  const fair  = pick.fair_odds;
  const score = confidenceFromEV(ev);
  const hot   = ev >= 8;
  const icon  = SPORT_ICON[pick.sport_key] || '🎯';
  const lbl   = SPORT_LABEL[pick.sport_key] || pick.sport_key.split('_').pop()?.toUpperCase() || '';
  const kell  = ((score/100)*2).toFixed(1);

  async function track() {
    if (tracked) return;
    try {
      await API.post('/bets', {
        event_name: pick.event_name, selection: pick.selection,
        bookie: pick.bookie, odds_taken: pick.bookie_odds, stake_aud: 50,
      });
    } catch { /* optimistic */ }
    setTracked(true);
  }

  return (
    <div style={{
      background: hot ? 'linear-gradient(135deg,rgba(249,115,22,.09),rgba(12,18,36,.9))' : 'rgba(255,255,255,.04)',
      border:`1.5px solid ${hot ? 'rgba(249,115,22,.4)' : 'rgba(255,255,255,.1)'}`,
      borderRadius:16, padding:'16px 18px', position:'relative', overflow:'hidden',
    }}>
      {hot && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#f97316,#dc2626)' }} />}

      {/* top: sport badge + EV% */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, fontWeight:800, color:'#60a5fa', background:'rgba(41,121,255,.12)', padding:'2px 9px', borderRadius:20 }}>
            {icon} {lbl}
          </span>
          {hot && <span style={{ fontSize:10, fontWeight:800, color:'#fff', background:'linear-gradient(135deg,#f97316,#dc2626)', padding:'2px 9px', borderRadius:20 }}>🔥 HOT</span>}
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{
            fontFamily:'var(--mono)', fontWeight:900, fontSize:24, lineHeight:1,
            color: hot ? '#fb923c' : '#00e676',
            textShadow: hot ? '0 0 16px rgba(249,115,22,.5)' : '0 0 16px rgba(0,230,118,.4)',
          }}>+{ev.toFixed(1)}%</div>
          <div style={{ fontSize:8, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:1 }}>EV</div>
        </div>
      </div>

      {/* event name */}
      <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {pick.event_name}
      </div>

      {/* selection — main pick */}
      <div style={{ fontSize:17, fontWeight:900, color:'#fff', marginBottom:12, lineHeight:1.25 }}>
        {pick.selection}
      </div>

      {/* odds + bookie + CTA */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <div style={{
          fontFamily:'var(--mono)', fontWeight:900, fontSize:18, color:'#fff',
          background:'rgba(41,121,255,.18)', border:'1.5px solid rgba(41,121,255,.35)',
          padding:'5px 14px', borderRadius:9, flexShrink:0,
        }}>${odds.toFixed(2)}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.7)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{bkLabel(pick.bookie)}</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>Fair ${fair.toFixed(2)}</div>
        </div>
        <button onClick={track} style={{
          padding:'8px 14px', borderRadius:9, fontWeight:800, fontSize:12, cursor:'pointer',
          background: tracked ? 'rgba(0,168,78,.15)' : 'linear-gradient(135deg,#2979ff,#1e63d9)',
          border: `1.5px solid ${tracked ? '#00e676' : 'transparent'}`,
          color: tracked ? '#00e676' : '#fff', flexShrink:0,
        }}>{tracked ? '✓' : 'TRACK'}</button>
      </div>

      {/* confidence bar */}
      <div style={{ marginBottom: exp ? 12 : 0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ fontSize:9, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:1 }}>Confidence</span>
          <span style={{ fontSize:10, fontWeight:700, color:cColor(score) }}>{score}% · {kell}% kelly</span>
        </div>
        <div style={{ height:3, background:'rgba(255,255,255,.07)', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${score}%`, background:cColor(score), borderRadius:99 }} />
        </div>
      </div>

      {/* expanded maths */}
      {exp && (
        <div style={{ background:'rgba(255,255,255,.03)', borderRadius:10, padding:'10px 12px', marginTop:10, fontSize:11, color:'rgba(255,255,255,.45)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
          <div>Fair prob: <strong style={{ color:'rgba(255,255,255,.8)' }}>{(100/fair).toFixed(1)}%</strong></div>
          <div>Bookie prob: <strong style={{ color:'rgba(255,255,255,.8)' }}>{(100/odds).toFixed(1)}%</strong></div>
          <div>Edge: <strong style={{ color:'#00e676' }}>+{ev.toFixed(1)}%</strong></div>
          <div>Kelly: <strong style={{ color:'rgba(255,255,255,.8)' }}>{kell}%</strong></div>
        </div>
      )}

      <button onClick={() => setExp(!exp)} style={{ marginTop:8, background:'none', border:'none', color:'rgba(255,255,255,.25)', fontSize:11, cursor:'pointer', padding:0 }}>
        {exp ? '↑ hide maths' : '↓ show maths'}
      </button>
    </div>
  );
}

/* ─── Best Pick hero (OddsJam notification style) ────────── */
function BestPickHero({ picks }: { picks: EVPick[] }) {
  const best = picks[0];
  if (!best) return null;

  return (
    <div style={{
      background:'linear-gradient(135deg,#0a1628 0%,#050d1a 60%,#091220 100%)',
      border:'1.5px solid rgba(0,229,255,.2)', borderRadius:18, padding:'20px 24px',
      marginBottom:20, position:'relative', overflow:'hidden',
      boxShadow:'0 8px 40px rgba(0,229,255,.06)',
    }}>
      <div style={{ position:'absolute',inset:0,background:'linear-gradient(105deg,transparent 30%,rgba(0,229,255,.03) 50%,transparent 70%)',backgroundSize:'200% 100%',animation:'shimmer 5s infinite linear' }} />

      {/* live pill */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(0,229,255,.07)', border:'1px solid rgba(0,229,255,.2)', borderRadius:20, padding:'5px 14px' }}>
          <span className="dot-live" />
          <span style={{ fontSize:11, fontWeight:800, color:'#00e5ff', letterSpacing:.5 }}>Best Edge Right Now</span>
        </div>
        <span style={{ fontSize:10, color:'rgba(255,255,255,.3)', fontWeight:600 }}>
          {SPORT_ICON[best.sport_key] || '🎯'} {SPORT_LABEL[best.sport_key] || ''}
        </span>
        <div style={{ flex:1 }} />
        <span style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>{fmtKo(best.commence_time)}</span>
      </div>

      {/* pick grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:20, alignItems:'center', position:'relative' }}>
        <div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {best.event_name}
          </div>
          <div style={{ fontSize:22, fontWeight:900, color:'#fff', marginBottom:12, lineHeight:1.2 }}>
            {best.selection}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:22, fontWeight:900, color:'#fff', background:'rgba(41,121,255,.2)', border:'1.5px solid rgba(41,121,255,.4)', padding:'6px 18px', borderRadius:10 }}>
              ${best.bookie_odds.toFixed(2)}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,.7)' }}>{bkLabel(best.bookie)}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>Fair: ${best.fair_odds.toFixed(2)} · Kelly: {best.kelly_percent.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign:'center', flexShrink:0 }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:52, fontWeight:900, lineHeight:1, color:'#00e676', textShadow:'0 0 40px rgba(0,230,118,.35)' }}>
            +{best.ev_percent.toFixed(1)}%
          </div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:1.2, marginTop:3 }}>Expected Value</div>
          <Link href={`/match/${encodeURIComponent(best.event_id)}`} style={{
            display:'inline-flex', alignItems:'center', gap:5, marginTop:12,
            padding:'9px 18px', borderRadius:9,
            background:'rgba(0,168,78,.85)', color:'#fff',
            fontWeight:800, fontSize:13, border:'1px solid rgba(0,230,118,.3)', textDecoration:'none',
          }}>View Pick →</Link>
        </div>
      </div>

      {/* other picks strip */}
      {picks.length > 1 && (
        <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid rgba(255,255,255,.05)', display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', position:'relative' }}>
          <span style={{ fontSize:9, color:'rgba(255,255,255,.2)', fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>Also →</span>
          {picks.slice(1, 5).map((p, i) => (
            <div key={`strip-${i}`} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, padding:'4px 12px', fontSize:11, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontWeight:700, color:'rgba(255,255,255,.8)' }}>{p.selection}</span>
              <span style={{ color:'#00e676', fontWeight:900, fontSize:11, fontFamily:'var(--mono)' }}>+{p.ev_percent.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Recent bets panel ───────────────────────────────────── */
function RecentBets({ bets }: { bets: Bet[] }) {
  const rDot: Record<string,string> = { win:'#00e676', loss:'#ef4444', pending:'#ffab00' };
  const fmt = (b: Bet) => {
    if (b.result === 'pending') return '—';
    const n = Number(b.profit_aud);
    return `${n >= 0 ? '+' : ''}$${Math.abs(n).toFixed(1)}`;
  };
  const col = (b: Bet) => b.result === 'pending' ? '#64748b' : Number(b.profit_aud) >= 0 ? '#00e676' : '#ef4444';

  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
      <div style={{ padding:'13px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontWeight:700, fontSize:13 }}>Recent Bets</span>
        <Link href="/wins" style={{ fontSize:11, color:'var(--cyan)', fontWeight:700 }}>All →</Link>
      </div>
      {bets.length === 0
        ? <div style={{ padding:'28px 16px', textAlign:'center', color:'var(--muted)', fontSize:12 }}>No bets logged yet.<br /><span style={{ fontSize:11, marginTop:4, display:'block' }}>Track bets from Wins page.</span></div>
        : bets.slice(0,4).map((b,i) => (
          <div key={b.id||String(i)} style={{ padding:'10px 16px', borderBottom: i < 3 ? '1px solid var(--border2)' : 'none', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background: rDot[b.result]||'#64748b', flexShrink:0 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.event_name}</div>
              <div style={{ fontSize:10, color:'var(--muted)' }}>{b.selection} · {bkLabel(b.bookie)}</div>
            </div>
            <div style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:12, color:col(b), flexShrink:0 }}>{fmt(b)}</div>
          </div>
        ))
      }
    </div>
  );
}

/* ─── main dashboard ─────────────────────────────────────── */
function DashboardInner() {
  const params = useSearchParams();
  const [user, setUser]         = useState<User|null>(null);
  const [games, setGames]       = useState<GameEvent[]>([]);
  const [bets, setBets]         = useState<Bet[]>([]);
  const [loading, setLoading]   = useState(true);
  const [upgraded, setUpgraded] = useState(false);
  const [activeSport, setActiveSport] = useState('aussierules_afl');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (params.get('upgraded') !== 'true') return;
    window.history.replaceState({}, '', '/dashboard');
    let n = 0;
    const t = setInterval(async () => {
      try {
        const r = await API.get('/payments/status');
        if (r.data.plan && r.data.plan !== 'free') { setUpgraded(true); clearInterval(t); }
      } catch { /* ignore */ }
      if (++n >= 12) clearInterval(t);
    }, 5000);
    return () => clearInterval(t);
  }, [params]);

  useEffect(() => {
    const u = getUser();
    if (!u) { window.location.href = '/login'; return; }
    setUser(u);
    const token = getToken();
    if (token) {
      const s = connectSocket(token);
      s.on('ev:update', () => {
        API.get('/games', { params:{ limit:80 } }).then(r => setGames(r.data.data || [])).catch(() => {});
      });
    }
    Promise.all([
      API.get('/games', { params:{ limit:80 } }),
      API.get('/bets'),
      API.get('/users/me/preferences'),
    ]).then(([gR, bR, pR]) => {
      setGames(gR.data.data || []);
      setBets(bR.data || []);
      if (!pR.data.onboarding_done) setShowOnboarding(true);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'var(--bg)' }}>
      <div style={{ textAlign:'center' }}>
        <div className="spinner" style={{ margin:'0 auto 16px' }} />
        <p style={{ color:'var(--muted)', fontSize:14 }}>Loading your dashboard...</p>
      </div>
    </div>
  );

  /* derived data */
  const allPicks: EVPick[] = games
    .flatMap(g => g.ev_picks.map(p => ({
      ...p, event_name:g.event_name, event_id:g.event_id,
      sport_key:g.sport_key, commence_time:g.commence_time,
    })))
    .sort((a,b) => b.ev_percent - a.ev_percent);

  const totalSig  = allPicks.length;
  const hotCount  = allPicks.filter(p => p.ev_percent >= 8).length;
  const settled   = bets.filter(b => b.result !== 'pending');
  const wins      = settled.filter(b => b.result === 'win');
  const profit    = settled.reduce((a,b) => a + Number(b.profit_aud||0), 0);
  const winRate   = settled.length ? Math.round((wins.length/settled.length)*100) : 0;

  const gamesBySport = SPORTS_NAV_CFG
    .map(s => ({
      sport: s,
      events: games
        .filter(g => g.sport_key === s.key)
        .sort((a,b) => (b.shadow_pick ? 1 : 0) - (a.shadow_pick ? 1 : 0)),
    }))
    .filter(g => g.events.length > 0);

  const knownKeys  = new Set(SPORTS_NAV_CFG.map(s => s.key));
  const otherGames = games.filter(g => !knownKeys.has(g.sport_key));

  return (
    <>
      {showOnboarding && <OnboardingModal userName={user?.name} onDone={() => setShowOnboarding(false)} />}

      <AppShell activeSport={activeSport} onSportChange={setActiveSport} contentDark>
        <div className="content" style={{ maxWidth:1400 }}>

          {/* Upgrade banner */}
          {upgraded && (
            <div className="alert-success fadein" style={{ marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span>✅ Plan upgraded! Full access unlocked.</span>
              <button onClick={() => setUpgraded(false)} style={{ background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:18 }}>×</button>
            </div>
          )}

          {/* Header */}
          <div style={{ marginBottom:20, display:'flex', alignItems:'baseline', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
            <div>
              <h1 style={{ fontSize:26, fontWeight:900, letterSpacing:-0.5, marginBottom:2 }}>
                G&apos;day, {user?.name?.split(' ')[0] || 'there'}.
              </h1>
              <p style={{ color:'var(--muted)', fontSize:13 }}>
                {totalSig > 0
                  ? `${totalSig} edge${totalSig !== 1 ? 's' : ''} live across ${games.length} event${games.length !== 1 ? 's' : ''}.`
                  : 'Markets scanning — edges appear as odds update.'}
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--muted)' }}>
                <span className="dot-live" />Live
              </div>
              <Link href="/scanner" style={{ fontSize:12, color:'var(--cyan)', fontWeight:700 }}>All signals →</Link>
            </div>
          </div>

          {/* 4 stat pills */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
            {[
              { label:'LIVE EVENTS', value:String(games.length),   sub:`${totalSig} edges found`,   color:'#2979ff', dot:true  },
              { label:'HOT PICKS',   value:String(hotCount),        sub:'Signals ≥ 8% EV',           color:hotCount > 0 ? '#f97316' : 'var(--muted)', dot:false },
              { label:'TOTAL P&L',   value:`${profit>=0?'+':''}$${Math.abs(profit).toFixed(0)}`, sub:'All settled bets', color:profit>=0?'#00e676':'#ff1744', dot:false },
              { label:'WIN RATE',    value:`${winRate}%`,           sub:`${wins.length}W / ${settled.length - wins.length}L`, color:winRate>=55?'#00e676':winRate>=45?'#ffab00':'var(--muted)', dot:false },
            ].map(c => (
              <div key={c.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderTop:`3px solid ${c.color}`, borderRadius:12, padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ fontSize:9, fontWeight:800, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1.2 }}>{c.label}</div>
                  {c.dot && <span className="dot-live" />}
                </div>
                <div style={{ fontFamily:'var(--mono)', fontSize:28, fontWeight:900, color:c.color, lineHeight:1, marginBottom:4 }}>{c.value}</div>
                <div style={{ fontSize:11, color:'var(--muted)' }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Next to Jump racing strip */}
          <NextToJumpStrip games={games} />

          {/* Best Pick hero */}
          {allPicks.length > 0 && <BestPickHero picks={allPicks} />}

          {/* Two-column layout */}
          <div className="dash-content-grid">

            {/* LEFT: Expert Signals + Full Markets */}
            <div>

              {/* Expert Signals — OddsJam card grid */}
              {allPicks.length > 0 && (
                <div style={{ marginBottom:28 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                    <div style={{ width:3, height:18, background:'linear-gradient(#00e676,#00e5ff)', borderRadius:2 }} />
                    <h2 style={{ fontSize:13, fontWeight:900, letterSpacing:1, textTransform:'uppercase', margin:0 }}>Expert Signals</h2>
                    <span style={{ fontSize:12, color:'var(--muted)' }}>{allPicks.length} edge{allPicks.length !== 1 ? 's' : ''}</span>
                    <Link href="/scanner" style={{ marginLeft:'auto', fontSize:11, color:'var(--cyan)', fontWeight:700 }}>See all →</Link>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {allPicks.slice(0, 6).map((p, i) => (
                      <OddsJamCard key={`pick-${p.event_id}-${p.selection}-${i}`} pick={p} />
                    ))}
                  </div>
                </div>
              )}

              {/* Full markets by sport */}
              {games.length > 0 && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                    <div style={{ width:3, height:18, background:'linear-gradient(#2979ff,#8b5cf6)', borderRadius:2 }} />
                    <h2 style={{ fontSize:13, fontWeight:900, letterSpacing:1, textTransform:'uppercase', margin:0 }}>Live Markets</h2>
                    <span style={{ fontSize:12, color:'var(--muted)' }}>{games.length} events</span>
                  </div>

                  {games.length === 0 ? (
                    <div style={{ padding:'48px 24px', textAlign:'center', background:'var(--bg2)', borderRadius:14, border:'1px solid var(--border)', color:'var(--muted)' }}>
                      <div style={{ fontSize:32, marginBottom:12 }}>📡</div>
                      <div style={{ fontWeight:700, marginBottom:6 }}>Markets loading</div>
                      <div style={{ fontSize:13 }}>AFL &amp; NRL update every 7 min on game days.</div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
                      {gamesBySport.map(({ sport, events }) => {
                        const topEV = Math.max(0, ...events.flatMap(g => g.ev_picks.map(p => p.ev_percent)));
                        const edgeCount = events.flatMap(g => g.ev_picks).length;
                        return (
                          <div key={sport.key}>
                            {/* Sport banner */}
                            <div style={{ position:'relative', borderRadius:16, overflow:'hidden', marginBottom:12, border:`1px solid ${sport.accent}30` }}>
                              <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg,rgba(5,13,24,.95) 0%,rgba(5,13,24,.55) 60%,transparent 100%)` }} />
                              <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                                  <div style={{ width:44, height:44, borderRadius:12, background:`${sport.accent}18`, border:`1.5px solid ${sport.accent}40`, display:'grid', placeItems:'center', fontSize:22, flexShrink:0 }}>
                                    {sport.icon}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight:900, fontSize:16, letterSpacing:.5, textTransform:'uppercase', color:'#fff' }}>{sport.label}</div>
                                    <div style={{ fontSize:11, color:'rgba(255,255,255,.5)' }}>
                                      {events.length} event{events.length!==1?'s':''} · {edgeCount} edge{edgeCount!==1?'s':''}
                                      {topEV > 0 && ` · best +${topEV.toFixed(1)}%`}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  {topEV >= 8 && (
                                    <span style={{ fontSize:10, fontWeight:800, color:'#fff', background:'linear-gradient(135deg,#f97316,#dc2626)', padding:'3px 10px', borderRadius:20 }}>
                                      🔥 HOT
                                    </span>
                                  )}
                                  <div style={{ background:`${sport.accent}15`, border:`1px solid ${sport.accent}35`, borderRadius:10, padding:'6px 14px', textAlign:'center' }}>
                                    <div style={{ fontFamily:'var(--mono)', fontWeight:900, fontSize:20, color:sport.accent, lineHeight:1 }}>{events.length}</div>
                                    <div style={{ fontSize:8, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginTop:2 }}>EVENTS</div>
                                  </div>
                                </div>
                              </div>
                              <div style={{ height:2, background:sport.grad, opacity:.6 }} />
                            </div>

                            {/* Event cards */}
                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                              {events.slice(0,6).map(ev => <EventCard key={ev.event_id} event={ev} />)}
                            </div>
                          </div>
                        );
                      })}

                      {otherGames.length > 0 && (
                        <div>
                          <div style={{ fontWeight:800, fontSize:12, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>Other Markets</div>
                          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            {otherGames.map(ev => <EventCard key={ev.event_id} event={ev} />)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {games.length === 0 && allPicks.length === 0 && (
                <div style={{ padding:'48px 24px', textAlign:'center', background:'var(--bg2)', borderRadius:14, border:'1px solid var(--border)', color:'var(--muted)' }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>📡</div>
                  <div style={{ fontWeight:700, marginBottom:6 }}>Scanning markets...</div>
                  <div style={{ fontSize:13 }}>AFL, NRL &amp; UK Racing update automatically.</div>
                </div>
              )}
            </div>

            {/* RIGHT: Market Pulse + bets + confidence */}
            <div>
              <div style={{ marginBottom:14 }}>
                <MarketPulse />
              </div>
              <RecentBets bets={bets} />
              {allPicks.length > 0 && (
                <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', marginTop:14 }}>
                  <div style={{ padding:'13px 16px', borderBottom:'1px solid var(--border)', fontWeight:700, fontSize:13 }}>Top Confidence</div>
                  {allPicks.slice(0,4).map((p, i) => {
                    const sc = confidenceFromEV(p.ev_percent);
                    return (
                      <div key={`conf-${p.event_id}-${p.selection}`} style={{ padding:'10px 16px', borderBottom: i < 3 ? '1px solid var(--border2)' : 'none' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:600, fontSize:12, marginBottom:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.event_name}</div>
                            <div style={{ fontSize:10, color:'var(--muted)' }}>{p.selection} · +{p.ev_percent.toFixed(1)}% EV</div>
                          </div>
                          <span style={{ fontFamily:'var(--mono)', fontWeight:800, fontSize:13, color:cColor(sc), flexShrink:0, marginLeft:8 }}>{sc}%</span>
                        </div>
                        <div style={{ height:3, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${sc}%`, background:cColor(sc), borderRadius:99 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Admin panel */}
          {(user as any)?.role === 'admin' && (
            <div style={{ marginTop:24, padding:'20px', background:'rgba(139,92,246,.05)', border:'1px solid rgba(139,92,246,.3)', borderRadius:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <span style={{ fontSize:20 }}>👑</span>
                <span style={{ fontWeight:800, fontSize:16, color:'var(--purple)' }}>Owner Control Panel</span>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const email = fd.get('email') as string;
                if (!email) return;
                try { await API.post('/auth/admin/upgrade', { email, plan:'elite' }); alert(`Upgraded ${email} to Elite!`); (e.target as HTMLFormElement).reset(); }
                catch (err: any) { alert(`Failed: ${err.response?.data?.error || err.message}`); }
              }} style={{ display:'flex', gap:10, maxWidth:400 }}>
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
      <DashboardInner />
    </Suspense>
  );
}
