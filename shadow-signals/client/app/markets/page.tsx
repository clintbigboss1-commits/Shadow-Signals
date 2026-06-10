'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import API from '../../lib/api';
import { getSocket, connectSocket } from '../../lib/socket';
import { getToken } from '../../lib/auth';

interface EVOpp {
  id: string;
  sport_key: string;
  event_name: string;
  event_id: string;
  selection: string;
  bookie: string;
  bookie_odds: number | string;
  fair_odds:   number | string;
  ev_percent:  number | string;
  kelly_percent: number | string;
  commence_time: string;
  market?: string;
}

/* ─── helpers ─────────────────────────────────────────────────────────── */

function grade(ev: number) {
  if (ev >= 8) return { label: 'Grade S+', bg: '#22d3ee', color: '#030711' };
  if (ev >= 5) return { label: 'Grade A',  bg: '#10b981', color: '#030711' };
  if (ev >= 3) return { label: 'Grade B',  bg: '#f59e0b', color: '#030711' };
  return              { label: 'Grade C',  bg: '#64748b', color: '#fff'    };
}

function confidence(ev: number) {
  if (ev >= 8) return { label: 'VERY HIGH', color: '#22d3ee' };
  if (ev >= 5) return { label: 'HIGH',      color: '#10b981' };
  if (ev >= 3) return { label: 'MEDIUM',    color: '#f59e0b' };
  return              { label: 'LOW',       color: '#64748b' };
}

function sportBg(key: string) {
  const m: Record<string, string> = {
    aussierules_afl:        'linear-gradient(135deg,#1a2a1a,#0a1a0a)',
    rugbyleague_nrl:        'linear-gradient(135deg,#1a1a2a,#0a0a1a)',
    cricket_odi:            'linear-gradient(135deg,#2a1a0a,#1a0a00)',
    cricket_t20:            'linear-gradient(135deg,#2a1a0a,#1a0a00)',
    soccer_a_league:        'linear-gradient(135deg,#0a1a2a,#001a2a)',
    soccer_epl:             'linear-gradient(135deg,#1a002a,#0a0020)',
    mma_mixed_martial_arts: 'linear-gradient(135deg,#2a0a0a,#1a0000)',
    basketball_nbl:         'linear-gradient(135deg,#1a1000,#0a0800)',
  };
  return m[key] || 'linear-gradient(135deg,#111827,#0d1526)';
}

function sportEmoji(key: string) {
  const m: Record<string, string> = {
    aussierules_afl: '🏉', rugbyleague_nrl: '🏉',
    cricket_odi: '🏏', cricket_t20: '🏏', cricket_test_match: '🏏',
    soccer_a_league: '⚽', soccer_epl: '⚽',
    mma_mixed_martial_arts: '🥊', basketball_nbl: '🏀',
    tennis_atp_aus_open: '🎾',
  };
  return m[key] || '🏆';
}

function sportLabel(key: string) {
  const m: Record<string, string> = {
    aussierules_afl: 'AFL', rugbyleague_nrl: 'NRL',
    cricket_odi: 'ODI Cricket', cricket_t20: 'T20 Cricket',
    cricket_test_match: 'Test Cricket',
    soccer_a_league: 'A-League', soccer_epl: 'EPL',
    mma_mixed_martial_arts: 'UFC/MMA', basketball_nbl: 'NBL',
    tennis_atp_aus_open: 'Tennis',
  };
  return m[key] || key.replace(/_/g, ' ').toUpperCase();
}

function parseTeams(eventName: string) {
  const parts = eventName.split(' v ');
  return { home: parts[0] || '—', away: parts[1] || '—' };
}

function teamInitial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

function teamColor(name: string) {
  const colors = ['#22d3ee','#10b981','#f59e0b','#8b5cf6','#ec4899','#6366f1','#ef4444','#14b8a6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function fmtTime(dt: string) {
  return new Date(dt).toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// AFL/NRL/Cricket/A-League removed — BoltOdds API does not carry these sports
const SPORT_TABS = [
  { key: 'all',                    label: 'All Markets' },
  { key: 'soccer_epl',             label: '⚽ EPL' },
  { key: 'soccer_la_liga',         label: '⚽ La Liga' },
  { key: 'soccer_bundesliga',      label: '⚽ Bundesliga' },
  { key: 'soccer_serie_a',         label: '⚽ Serie A' },
  { key: 'soccer_ucl',             label: '⚽ UCL' },
  { key: 'basketball_nba',         label: '🏀 NBA' },
  { key: 'basketball_nbl',         label: '🏀 NBL' },
  { key: 'americanfootball_nfl',   label: '🏈 NFL' },
  { key: 'baseball_mlb',           label: '⚾ MLB' },
  { key: 'icehockey_nhl',          label: '🏒 NHL' },
  { key: 'mma_ufc',                label: '🥊 UFC' },
  { key: 'mma_boxing',             label: '🥊 Boxing' },
  { key: 'tennis_atp',             label: '🎾 Tennis' },
  { key: 'golf_pga',               label: '⛳ Golf' },
];

/* ─── Slip (bet slip state) ───────────────────────────────────────────── */
interface SlipItem { ev: EVOpp; }

/* ─── Event Card ──────────────────────────────────────────────────────── */
function EventCard({
  ev, onAddToSlip, inSlip,
}: {
  ev: EVOpp;
  onAddToSlip: (ev: EVOpp) => void;
  inSlip: boolean;
}) {
  const evNum  = Number(ev.ev_percent);
  const g      = grade(evNum);
  const conf   = confidence(evNum);
  const teams  = parseTeams(ev.event_name);
  const barW   = Math.min((evNum / 15) * 100, 100);
  const hColor = teamColor(teams.home);
  const aColor = teamColor(teams.away);
  const odds   = Number(ev.bookie_odds);
  const fair   = Number(ev.fair_odds);

  return (
    <div style={{
      background: '#0d1526',
      border: `1px solid ${evNum >= 8 ? 'rgba(34,211,238,.25)' : 'rgba(255,255,255,.07)'}`,
      borderRadius: 16,
      overflow: 'hidden',
      transition: 'border-color .2s, transform .15s',
      cursor: 'default',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
    >
      {/* Card header — sport image strip */}
      <div style={{
        background: sportBg(ev.sport_key),
        padding: '12px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 52,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Grade badge */}
        <span style={{
          background: g.bg, color: g.color,
          fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
          letterSpacing: .5, position: 'relative', zIndex: 1,
        }}>{g.label}</span>

        {/* Time + live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
            {fmtTime(ev.commence_time)} AEST
          </span>
        </div>
      </div>

      {/* Sport label */}
      <div style={{ padding: '8px 14px 0', fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .8 }}>
        {sportEmoji(ev.sport_key)} {sportLabel(ev.sport_key)}
      </div>

      {/* Teams */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: hColor + '22', border: `2px solid ${hColor}`, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14, color: hColor, flexShrink: 0 }}>
            {teamInitial(teams.home)}
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{teams.home}</span>
          <span style={{ color: ev.selection === teams.home ? '#22d3ee' : '#475569', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 18 }}>—</span>
        </div>
        <div style={{ paddingLeft: 8, marginBottom: 10, color: '#475569', fontSize: 11, fontWeight: 600 }}>vs</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: aColor + '22', border: `2px solid ${aColor}`, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14, color: aColor, flexShrink: 0 }}>
            {teamInitial(teams.away)}
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{teams.away}</span>
          <span style={{ color: ev.selection === teams.away ? '#22d3ee' : '#475569', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 18 }}>—</span>
        </div>
      </div>

      {/* Odds rows */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', margin: '0 14px' }} />
      <div style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: .8 }}>H2H</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#475569', marginBottom: 2, textTransform: 'uppercase' }}>{teams.home.split(' ')[0]}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 15, color: ev.selection === teams.home ? '#22d3ee' : '#94a3b8' }}>
                {odds.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#475569', marginBottom: 2, textTransform: 'uppercase' }}>{teams.away.split(' ')[0]}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 15, color: ev.selection === teams.away ? '#22d3ee' : '#94a3b8' }}>
                {fair.toFixed(2)} <span style={{ fontSize: 10, color: '#22d3ee', fontWeight: 700 }}>BEST</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
          <span>KELLY</span>
          <span style={{ color: '#22d3ee', fontWeight: 700 }}>{Number(ev.kelly_percent).toFixed(1)}%</span>
        </div>
      </div>

      {/* Edge bar */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: .8 }}>Edge vs Fair Price</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 14, color: '#10b981' }}>+{evNum.toFixed(1)}%</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', width: `${barW}%`, background: evNum >= 8 ? 'linear-gradient(90deg,#22d3ee,#06b6d4)' : evNum >= 5 ? '#10b981' : '#f59e0b', borderRadius: 99, transition: 'width .5s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
          <span style={{ color: '#475569' }}>Best at <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{ev.bookie?.replace(/_/g,' ')}</span></span>
          <span style={{ color: conf.color, fontWeight: 700 }}>● {conf.label}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => onAddToSlip(ev)}
          style={{
            flex: 1, padding: '13px 16px', background: inSlip ? 'rgba(34,211,238,.08)' : 'transparent',
            border: 'none', color: inSlip ? '#22d3ee' : '#94a3b8',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {inSlip ? '✓ In Slip' : '+ Add to Slip'}
        </button>
        <div style={{ width: 1, height: 44, background: 'rgba(255,255,255,.05)' }} />
        <button style={{ padding: '13px 16px', background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16 }} title="Bookmark">🔖</button>
        <div style={{ width: 1, height: 44, background: 'rgba(255,255,255,.05)' }} />
        <button style={{ padding: '13px 16px', background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16 }} title="Share">↗</button>
      </div>
    </div>
  );
}

/* ─── Bet Slip sidebar ────────────────────────────────────────────────── */
function BetSlip({ items, onRemove, onClear }: { items: SlipItem[]; onRemove: (id: string) => void; onClear: () => void }) {
  const [stake, setStake]   = useState(50);
  const [logging, setLogging] = useState(false);
  const [logged, setLogged]   = useState(false);
  if (items.length === 0) return null;

  const totalKelly = items.reduce((a, i) => a + Number(i.ev.kelly_percent), 0) / items.length;

  async function logAllBets() {
    setLogging(true);
    try {
      await Promise.all(items.map(({ ev }) =>
        API.post('/bets', {
          event_name:     ev.event_name,
          sport:          ev.sport_key,
          market:         ev.market || 'h2h',
          selection:      ev.selection,
          bookie:         ev.bookie,
          odds_taken:     Number(ev.bookie_odds),
          fair_odds:      Number(ev.fair_odds),
          ev_percent:     Number(ev.ev_percent),
          kelly_fraction: Number(ev.kelly_percent) / 100,
          stake_aud:      stake,
          event_time:     ev.commence_time,
        })
      ));
      setLogged(true);
      setTimeout(() => { onClear(); setLogged(false); }, 1500);
    } catch {
      // silently fail — user can retry
    } finally {
      setLogging(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 200,
      width: 320, background: '#0d1526',
      border: '1px solid rgba(34,211,238,.25)',
      borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,.6)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px', background: 'rgba(34,211,238,.06)', borderBottom: '1px solid rgba(34,211,238,.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: 14, color: '#22d3ee' }}>⚡ Bet Slip ({items.length})</span>
        <button onClick={onClear} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>Clear all</button>
      </div>

      <div style={{ maxHeight: 260, overflowY: 'auto', padding: '8px 0' }}>
        {items.map(({ ev }) => (
          <div key={ev.id} style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>{ev.event_name}</div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>
                {ev.selection} · {ev.bookie?.replace(/_/g,' ')}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#10b981', fontSize: 14 }}>
                ${Number(ev.bookie_odds).toFixed(2)}
              </div>
              <button onClick={() => onRemove(ev.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 11 }}>remove</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, margin: 0, textTransform: 'none', letterSpacing: 0 }}>Stake per bet:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#64748b', fontSize: 14 }}>$</span>
            <input
              type="number"
              value={stake}
              onChange={e => setStake(Number(e.target.value))}
              style={{ width: 70, fontSize: 14, padding: '5px 8px', textAlign: 'right' }}
            />
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
          <span>Avg Kelly: {totalKelly.toFixed(1)}%</span>
          <span>Total: ${(stake * items.length).toFixed(0)}</span>
        </div>
        <button
          onClick={logAllBets}
          disabled={logging || logged}
          style={{ width: '100%', padding: '11px', borderRadius: 10, background: logged ? '#10b981' : 'linear-gradient(135deg,#22d3ee,#0891b2)', border: 'none', color: '#030711', fontWeight: 800, fontSize: 14, cursor: logging ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: logging ? 0.7 : 1 }}
        >
          {logged ? '✓ Logged to CLV Tracker' : logging ? 'Logging...' : `Log ${items.length} Bet${items.length > 1 ? 's' : ''} →`}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */
export default function MarketsPage() {
  const [data, setData]       = useState<EVOpp[]>([]);
  const [sport, setSport]     = useState('all');
  const [minEV, setMinEV]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState(new Date());
  const [slip, setSlip]       = useState<SlipItem[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await API.get('/ev', { params: { sport, minEV, limit: 100 } });
      setData(res.data.data || []);
      setUpdated(new Date());
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err.response?.status !== 401) console.error(e);
    } finally { setLoading(false); }
  }, [sport, minEV]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 45000); return () => clearInterval(t); }, [load]);

  // WebSocket — mount once, independent of sport/filter changes
  useEffect(() => {
    const token = getToken();
    if (token) connectSocket(token);
    const s = getSocket();
    const onEV = (evs: EVOpp[]) => { if (evs?.length) { setData(evs); setUpdated(new Date()); } };
    s.on('ev:update', onEV);
    return () => { s.off('ev:update', onEV); };
  }, []);

  function addToSlip(ev: EVOpp) {
    setSlip(prev => prev.find(i => i.ev.id === ev.id) ? prev.filter(i => i.ev.id !== ev.id) : [...prev, { ev }]);
  }

  return (
    <ProtectedRoute>
      <div className="page">
        <Navbar />

        {/* Top bar */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,.05)', padding: '10px 20px', background: 'rgba(8,17,30,.8)', backdropFilter: 'blur(8px)', position: 'sticky', top: 52, zIndex: 90 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>

            {/* Sport tabs */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
              {SPORT_TABS.map(s => (
                <button key={s.key} onClick={() => setSport(s.key)}
                  className={`tab${sport === s.key ? ' active' : ''}`}
                  style={{ fontSize: 13, padding: '6px 14px' }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Right controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[{ label: 'All', v: 0 }, { label: '3%+', v: 3 }, { label: '5%+', v: 5 }, { label: '8%+', v: 8 }].map(f => (
                  <button key={f.v} onClick={() => setMinEV(f.v)}
                    className={`tab${minEV === f.v ? ' active' : ''}`}
                    style={{ fontSize: 12, padding: '5px 12px' }}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                <span className="dot-live" />
                {updated.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* Tip bar */}
        <div style={{ background: 'rgba(34,211,238,.04)', borderBottom: '1px solid rgba(34,211,238,.08)', padding: '8px 20px', textAlign: 'center', fontSize: 12, color: '#475569' }}>
          Tap any decimal price to add it to your slip. We only show markets with confirmed edge.
        </div>

        {/* Grid */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 120px' }}>
          {loading ? (
            <div style={{ padding: 80, textAlign: 'center', color: '#64748b' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p>Scanning bookmakers for edge...</p>
            </div>
          ) : data.length === 0 ? (
            <div style={{ padding: 80, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#94a3b8' }}>No markets with edge right now</h3>
              <p style={{ fontSize: 14 }}>Try lowering the EV filter or check back when AU games go live.</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{data.length}</span> markets with confirmed edge
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {data.map(ev => (
                  <EventCard
                    key={ev.id || ev.event_id}
                    ev={ev}
                    onAddToSlip={addToSlip}
                    inSlip={slip.some(i => i.ev.id === ev.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bet slip */}
        <BetSlip
          items={slip}
          onRemove={id => setSlip(prev => prev.filter(i => i.ev.id !== id))}
          onClear={() => setSlip([])}
        />
      </div>
    </ProtectedRoute>
  );
}
