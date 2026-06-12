'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import SportIcon from '../../components/SportIcon';
import OperativePeek from '../../components/OperativePeek';
import API from '../../lib/api';
import { getSocket, connectSocket } from '../../lib/socket';
import { getToken } from '../../lib/auth';
import { confidenceFromEV, confidenceColor } from '../../lib/confidence';

/* ─── Types ───────────────────────────────────────────────────────────── */

interface EVPick {
  selection: string;
  bookie: string;
  bookie_odds: number;
  fair_odds: number;
  ev_percent: number;
  kelly_percent: number;
  market: string;
}

interface Game {
  event_id: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  event_name: string;
  commence_time: string;
  bookmaker_count: number;
  best_odds: { selection: string; bookmaker: string; odds: number }[];
  all_bookmakers: Record<string, Record<string, number>>;
  ev_pick: EVPick | null;
}

/* ─── helpers ─────────────────────────────────────────────────────────── */

function confidenceBadge(ev: number) {
  const score = confidenceFromEV(ev);
  const color = confidenceColor(score);
  return { label: `${score}% CONFIDENCE`, bg: color, color: '#030711', score };
}

function sportMeta(key: string): { emoji: string; label: string; bg: string } {
  const m: Record<string, { emoji: string; label: string; bg: string }> = {
    aussierules_afl:      { emoji: '🏉', label: 'AFL',        bg: 'linear-gradient(135deg,#1a2a1a,#0a1400)' },
    rugbyleague_nrl:      { emoji: '🏉', label: 'NRL',        bg: 'linear-gradient(135deg,#1a1a2a,#080818)' },
    cricket_big_bash:     { emoji: '🏏', label: 'BBL',        bg: 'linear-gradient(135deg,#2a1a00,#180e00)' },
    cricket_odi:          { emoji: '🏏', label: 'Cricket',    bg: 'linear-gradient(135deg,#2a1a00,#180e00)' },
    soccer_a_league:      { emoji: '⚽', label: 'A-League',   bg: 'linear-gradient(135deg,#0a1a2a,#001020)' },
    soccer_epl:           { emoji: '⚽', label: 'EPL',        bg: 'linear-gradient(135deg,#1a002a,#0a0018)' },
    soccer_ucl:           { emoji: '⚽', label: 'UCL',        bg: 'linear-gradient(135deg,#1a1500,#0a0c00)' },
    soccer_la_liga:       { emoji: '⚽', label: 'La Liga',    bg: 'linear-gradient(135deg,#2a0a0a,#180000)' },
    soccer_bundesliga:    { emoji: '⚽', label: 'Bundesliga', bg: 'linear-gradient(135deg,#2a0a00,#180500)' },
    soccer_serie_a:       { emoji: '⚽', label: 'Serie A',    bg: 'linear-gradient(135deg,#00102a,#000818)' },
    soccer_mls:           { emoji: '⚽', label: 'MLS',        bg: 'linear-gradient(135deg,#001a2a,#001020)' },
    soccer_brazil:        { emoji: '⚽', label: 'Brasileirão',bg: 'linear-gradient(135deg,#0a2a0a,#041804)' },
    basketball_nba:       { emoji: '🏀', label: 'NBA',        bg: 'linear-gradient(135deg,#1a0800,#100500)' },
    basketball_nbl:       { emoji: '🏀', label: 'NBL',        bg: 'linear-gradient(135deg,#1a1000,#0a0800)' },
    americanfootball_nfl: { emoji: '🏈', label: 'NFL',        bg: 'linear-gradient(135deg,#001a10,#001008)' },
    baseball_mlb:         { emoji: '⚾', label: 'MLB',        bg: 'linear-gradient(135deg,#1a1a00,#0e0e00)' },
    icehockey_nhl:        { emoji: '🏒', label: 'NHL',        bg: 'linear-gradient(135deg,#00102a,#000818)' },
    mma_ufc:              { emoji: '🥊', label: 'UFC',        bg: 'linear-gradient(135deg,#2a0a0a,#180000)' },
    mma_boxing:           { emoji: '🥊', label: 'Boxing',     bg: 'linear-gradient(135deg,#2a0a0a,#180000)' },
    tennis_atp:           { emoji: '🎾', label: 'Tennis',     bg: 'linear-gradient(135deg,#001a0a,#001006)' },
    golf_pga:             { emoji: '⛳', label: 'Golf',       bg: 'linear-gradient(135deg,#001a0a,#000e04)' },
  };
  return m[key] || { emoji: '🏆', label: key.replace(/_/g, ' ').toUpperCase(), bg: 'linear-gradient(135deg,#111827,#0d1526)' };
}

function teamColor(name: string) {
  const colors = ['#2979ff','#00c853','#ffab00','#8b5cf6','#ec4899','#6366f1','#ef4444','#14b8a6','#f97316','#06b6d4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function fmtTime(dt: string) {
  const d = new Date(dt);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const time = d.toLocaleString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit' });
  if (isToday)    return `Today ${time}`;
  if (isTomorrow) return `Tomorrow ${time}`;
  return d.toLocaleString('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function msUntil(dt: string) {
  return new Date(dt).getTime() - Date.now();
}

function countdown(dt: string) {
  const ms = msUntil(dt);
  if (ms < 0) return 'LIVE';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h === 0) return `${m}m`;
  if (h < 24) return `${h}h ${m}m`;
  return `${Math.floor(h / 24)}d`;
}

const SPORT_TABS = [
  { key: 'all',                    label: 'All',         emoji: '🏆' },
  { key: 'aussierules_afl',        label: 'AFL',         emoji: '🏉' },
  { key: 'rugbyleague_nrl',        label: 'NRL',         emoji: '🏉' },
  { key: 'soccer_a_league',        label: 'A-League',    emoji: '⚽' },
  { key: 'cricket_big_bash',       label: 'BBL',         emoji: '🏏' },
  { key: 'soccer_epl',             label: 'EPL',         emoji: '⚽' },
  { key: 'soccer_la_liga',         label: 'La Liga',     emoji: '⚽' },
  { key: 'soccer_bundesliga',      label: 'Bundesliga',  emoji: '⚽' },
  { key: 'soccer_serie_a',         label: 'Serie A',     emoji: '⚽' },
  { key: 'soccer_ucl',             label: 'UCL',         emoji: '⚽' },
  { key: 'basketball_nba',         label: 'NBA',         emoji: '🏀' },
  { key: 'basketball_nbl',         label: 'NBL',         emoji: '🏀' },
  { key: 'americanfootball_nfl',   label: 'NFL',         emoji: '🏈' },
  { key: 'baseball_mlb',           label: 'MLB',         emoji: '⚾' },
  { key: 'icehockey_nhl',          label: 'NHL',         emoji: '🏒' },
  { key: 'mma_ufc',                label: 'UFC',         emoji: '🥊' },
  { key: 'tennis_atp',             label: 'Tennis',      emoji: '🎾' },
  { key: 'golf_pga',               label: 'Golf',        emoji: '⛳' },
];

/* ─── Bet Slip types ──────────────────────────────────────────────────── */
interface SlipItem {
  event_id: string;
  event_name: string;
  sport_key: string;
  selection: string;
  bookie: string;
  odds: number;
  fair_odds?: number;
  ev_percent?: number;
  kelly_percent?: number;
  commence_time: string;
}

/* ─── Game Card ───────────────────────────────────────────────────────── */
function GameCard({
  game, onOpen, onAddToSlip, inSlip,
}: {
  game: Game;
  onOpen: () => void;
  onAddToSlip: (item: SlipItem) => void;
  inSlip: (sel: string) => boolean;
}) {
  const meta = sportMeta(game.sport_key);
  const ev = game.ev_pick;
  const hColor = teamColor(game.home_team);
  const aColor = teamColor(game.away_team);
  const ms = msUntil(game.commence_time);
  const isLive = ms < 0;
  const isSoon = ms > 0 && ms < 3600000;

  // Best odds for home / away from best_odds array
  const homeBest = game.best_odds.find(o => o.selection === game.home_team);
  const awayBest = game.best_odds.find(o => o.selection === game.away_team);
  const drawBest = game.best_odds.find(o => o.selection === 'Draw');

  const g = ev ? confidenceBadge(ev.ev_percent) : null;

  return (
    <div
      onClick={onOpen}
      style={{
        background: '#0d1526',
        border: `1px solid ${ev && ev.ev_percent >= 5 ? 'rgba(41,121,255,.22)' : ev ? 'rgba(0,200,83,.14)' : 'rgba(255,255,255,.07)'}`,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform .15s, box-shadow .15s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,.4)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Sport header strip */}
      <div style={{
        background: meta.bg,
        padding: '10px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 15 }}>{meta.emoji}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 1 }}>{meta.label}</span>
          {isLive && <span style={{ fontSize: 10, fontWeight: 800, color: '#ff1744', background: 'rgba(255,23,68,.12)', border: '1px solid rgba(255,23,68,.3)', padding: '1px 7px', borderRadius: 4, letterSpacing: .5 }}>LIVE</span>}
          {isSoon && !isLive && <span style={{ fontSize: 10, fontWeight: 800, color: '#ffab00', background: 'rgba(255,171,0,.1)', border: '1px solid rgba(255,171,0,.25)', padding: '1px 7px', borderRadius: 4 }}>SOON</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {g && (
            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 5, background: g.bg, color: g.color, letterSpacing: .5 }}>
              {g.label}
            </span>
          )}
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>
            {countdown(game.commence_time)}
          </span>
        </div>
      </div>

      {/* Teams */}
      <div style={{ padding: '14px 14px 10px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {[
          { team: game.home_team, color: hColor, bestOdds: homeBest },
          { team: game.away_team, color: aColor, bestOdds: awayBest },
        ].map(({ team, color, bestOdds }) => {
          const isPick = ev?.selection === team;
          return (
            <div key={team} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SportIcon sportKey={game.sport_key} name={team} color={color} size={30} />
              <span style={{ flex: 1, fontWeight: isPick ? 800 : 600, fontSize: 14, color: isPick ? '#fff' : '#94a3b8' }}>{team}</span>
              {isPick && (
                <span style={{ fontSize: 9, fontWeight: 800, color: '#00e676', background: 'rgba(0,230,118,.1)', border: '1px solid rgba(0,230,118,.25)', padding: '2px 7px', borderRadius: 10, letterSpacing: .5 }}>
                  OUR PICK
                </span>
              )}
              {bestOdds && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onAddToSlip({
                      event_id: game.event_id,
                      event_name: game.event_name,
                      sport_key: game.sport_key,
                      selection: team,
                      bookie: bestOdds.bookmaker,
                      odds: bestOdds.odds,
                      fair_odds: ev?.selection === team ? ev.fair_odds : undefined,
                      ev_percent: ev?.selection === team ? ev.ev_percent : undefined,
                      kelly_percent: ev?.selection === team ? ev.kelly_percent : undefined,
                      commence_time: game.commence_time,
                    });
                  }}
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 800,
                    fontSize: 15,
                    color: inSlip(team) ? '#2979ff' : isPick ? '#00e676' : '#fff',
                    background: inSlip(team) ? 'rgba(41,121,255,.1)' : isPick ? 'rgba(0,230,118,.07)' : 'rgba(255,255,255,.05)',
                    border: `1px solid ${inSlip(team) ? 'rgba(41,121,255,.3)' : isPick ? 'rgba(0,230,118,.2)' : 'rgba(255,255,255,.08)'}`,
                    borderRadius: 8,
                    padding: '4px 11px',
                    cursor: 'pointer',
                    transition: 'all .15s',
                    minWidth: 56,
                    textAlign: 'center',
                  }}
                  title={`${bestOdds.bookmaker} — tap to add to slip`}
                >
                  {bestOdds.odds.toFixed(2)}
                </button>
              )}
            </div>
          );
        })}

        {/* Draw odds for soccer */}
        {drawBest && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.06)', display: 'grid', placeItems: 'center', fontSize: 12, color: '#475569' }}>≡</div>
            <span style={{ flex: 1, fontWeight: 500, fontSize: 13, color: '#64748b' }}>Draw</span>
            <button
              onClick={e => {
                e.stopPropagation();
                onAddToSlip({
                  event_id: game.event_id,
                  event_name: game.event_name,
                  sport_key: game.sport_key,
                  selection: 'Draw',
                  bookie: drawBest.bookmaker,
                  odds: drawBest.odds,
                  commence_time: game.commence_time,
                });
              }}
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 800, fontSize: 15,
                color: inSlip('Draw') ? '#2979ff' : '#94a3b8',
                background: inSlip('Draw') ? 'rgba(41,121,255,.1)' : 'rgba(255,255,255,.04)',
                border: `1px solid ${inSlip('Draw') ? 'rgba(41,121,255,.3)' : 'rgba(255,255,255,.07)'}`,
                borderRadius: 8, padding: '4px 11px',
                cursor: 'pointer', minWidth: 56, textAlign: 'center',
              }}
            >
              {drawBest.odds.toFixed(2)}
            </button>
          </div>
        )}
      </div>

      {/* EV row — only when we have a pick */}
      {ev && (
        <div style={{ margin: '0 14px 12px', padding: '9px 12px', background: 'rgba(0,200,83,.06)', border: '1px solid rgba(0,200,83,.15)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            🎯 <b style={{ color: '#fff' }}>{ev.selection}</b>
            <span style={{ color: '#475569', marginLeft: 6, fontSize: 11, textTransform: 'capitalize' }}>via {ev.bookie?.replace(/_/g, ' ')}</span>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 14, color: '#00c853' }}>+{ev.ev_percent.toFixed(1)}%</div>
              <div style={{ fontSize: 10, color: '#475569' }}>your edge</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: '#2979ff' }}>{ev.kelly_percent.toFixed(1)}%</div>
              <div style={{ fontSize: 10, color: '#475569' }}>suggested stake</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer: time + book count + explore link */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.04)', padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#475569' }}>
          {fmtTime(game.commence_time)} AEST
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#334155' }}>{game.bookmaker_count} books</span>
          <span style={{ fontSize: 12, color: '#2979ff', fontWeight: 700 }}>Full analysis →</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Bet Slip ────────────────────────────────────────────────────────── */
function BetSlip({ items, onRemove, onClear }: { items: SlipItem[]; onRemove: (key: string) => void; onClear: () => void }) {
  const [stake, setStake]     = useState(50);
  const [logging, setLogging] = useState(false);
  const [logged, setLogged]   = useState(false);

  if (items.length === 0) return null;

  const avgKelly = items.filter(i => i.kelly_percent).reduce((a, i) => a + (i.kelly_percent || 0), 0) / (items.filter(i => i.kelly_percent).length || 1);

  async function logBets() {
    setLogging(true);
    try {
      await Promise.all(items.map(item =>
        API.post('/bets', {
          event_name:     item.event_name,
          sport:          item.sport_key,
          market:         'h2h',
          selection:      item.selection,
          bookie:         item.bookie,
          odds_taken:     item.odds,
          fair_odds:      item.fair_odds,
          ev_percent:     item.ev_percent,
          kelly_fraction: item.kelly_percent ? item.kelly_percent / 100 : null,
          stake_aud:      stake,
          event_time:     item.commence_time,
        })
      ));
      setLogged(true);
      setTimeout(() => { onClear(); setLogged(false); }, 1500);
    } catch { /* silently fail */ } finally { setLogging(false); }
  }

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 200,
      width: 330, background: '#0d1526',
      border: '1px solid rgba(41,121,255,.3)',
      borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,.7)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '13px 16px', background: 'rgba(41,121,255,.07)', borderBottom: '1px solid rgba(41,121,255,.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: 14, color: '#2979ff' }}>⚡ Bet Slip ({items.length})</span>
        <button onClick={onClear} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>Clear</button>
      </div>

      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {items.map(item => {
          const key = `${item.event_id}:${item.selection}`;
          return (
            <div key={key} style={{ padding: '9px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>{item.event_name}</div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>{item.selection} · {item.bookie?.replace(/_/g, ' ')}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: item.ev_percent ? '#00c853' : '#fff', fontSize: 14 }}>
                  ${item.odds.toFixed(2)}
                </div>
                <button onClick={() => onRemove(key)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 11 }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Stake per bet</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: '#64748b' }}>$</span>
            <input type="number" value={stake} onChange={e => setStake(Number(e.target.value))} style={{ width: 70, fontSize: 14, padding: '4px 8px', textAlign: 'right' }} />
          </div>
        </div>
        {avgKelly > 0 && (
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span>Avg suggested stake: {avgKelly.toFixed(1)}% of bankroll</span>
            <span>Total: ${(stake * items.length).toFixed(0)}</span>
          </div>
        )}
        <button
          onClick={logBets}
          disabled={logging || logged}
          style={{ width: '100%', padding: '11px', borderRadius: 10, background: logged ? '#00c853' : 'linear-gradient(135deg,#2979ff,#1e63d9)', border: 'none', color: logged ? '#030711' : '#fff', fontWeight: 800, fontSize: 14, cursor: logging ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          {logged ? '✓ Logged to CLV Tracker' : logging ? 'Logging...' : `Log ${items.length} Bet${items.length > 1 ? 's' : ''} →`}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */
export default function MarketsPage() {
  const router = useRouter();
  const [data, setData]       = useState<Game[]>([]);
  const [sport, setSport]     = useState('all');
  const [filter, setFilter]   = useState<'all' | 'edge'>('all');
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState(new Date());
  const [slip, setSlip]       = useState<SlipItem[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await API.get('/games', { params: { sport, limit: 80 } });
      setData(res.data.data || []);
      setUpdated(new Date());
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err.response?.status !== 401) console.error(e);
    } finally { setLoading(false); }
  }, [sport]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  useEffect(() => {
    const token = getToken();
    if (token) connectSocket(token);
    const s = getSocket();
    const onUpdate = () => load();
    s.on('ev:update', onUpdate);
    return () => { s.off('ev:update', onUpdate); };
  }, [load]);

  const displayed = filter === 'edge' ? data.filter(g => g.ev_pick) : data;
  const edgeCount = data.filter(g => g.ev_pick).length;

  function slipKey(eventId: string, sel: string) { return `${eventId}:${sel}`; }
  function addToSlip(item: SlipItem) {
    const key = slipKey(item.event_id, item.selection);
    setSlip(prev => prev.find(i => slipKey(i.event_id, i.selection) === key)
      ? prev.filter(i => slipKey(i.event_id, i.selection) !== key)
      : [...prev, item]);
  }
  function inSlip(eventId: string, sel: string) {
    return slip.some(i => slipKey(i.event_id, i.selection) === slipKey(eventId, sel));
  }

  // Group by date for "All" tab
  const grouped: Record<string, Game[]> = {};
  for (const g of displayed) {
    const d = new Date(g.commence_time);
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    let label: string;
    if (d.toDateString() === now.toDateString()) label = 'Today';
    else if (d.toDateString() === tomorrow.toDateString()) label = 'Tomorrow';
    else label = d.toLocaleString('en-AU', { timeZone: 'Australia/Sydney', weekday: 'long', month: 'long', day: 'numeric' });
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(g);
  }

  return (
    <ProtectedRoute>
      <div className="page">
        <Navbar />

        {/* Sticky sport tabs */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,.05)', background: 'rgba(8,17,30,.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 52, zIndex: 90 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>

            {/* Sport tabs row */}
            <div style={{ display: 'flex', gap: 2, overflowX: 'auto', paddingTop: 10, paddingBottom: 4, scrollbarWidth: 'none' }}>
              {SPORT_TABS.map(s => (
                <button
                  key={s.key}
                  onClick={() => setSport(s.key)}
                  className={`tab${sport === s.key ? ' active' : ''}`}
                  style={{ fontSize: 12, padding: '6px 13px', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>

            {/* Filter row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, paddingTop: 6 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setFilter('all')}
                  className={`tab${filter === 'all' ? ' active' : ''}`}
                  style={{ fontSize: 12, padding: '4px 12px' }}
                >
                  All {data.length > 0 && <span style={{ color: 'rgba(255,255,255,.4)', marginLeft: 4 }}>{data.length}</span>}
                </button>
                <button
                  onClick={() => setFilter('edge')}
                  className={`tab${filter === 'edge' ? ' active' : ''}`}
                  style={{ fontSize: 12, padding: '4px 12px' }}
                >
                  ⚡ Edge plays {edgeCount > 0 && <span style={{ background: '#2979ff', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10, marginLeft: 5 }}>{edgeCount}</span>}
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span className="dot-live" />
                {updated.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 140px', position: 'relative' }}>
          <OperativePeek page="markets" side="right" width={150} bottom={20} />
          {loading ? (
            <div style={{ padding: 80, textAlign: 'center', color: '#64748b' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p>Loading fixtures...</p>
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ padding: 80, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#94a3b8' }}>
                {filter === 'edge' ? 'No edge plays right now' : 'No upcoming fixtures'}
              </h3>
              <p style={{ fontSize: 14, marginBottom: 20 }}>
                {filter === 'edge'
                  ? 'Switch to "All" to browse all upcoming games — edges will appear as we find them.'
                  : 'Odds for this sport haven\'t loaded yet. Check back soon.'}
              </p>
              {filter === 'edge' && (
                <button onClick={() => setFilter('all')} className="btn btn-outline" style={{ display: 'inline-flex' }}>
                  Show all games
                </button>
              )}
            </div>
          ) : (
            Object.entries(grouped).map(([dateLabel, games]) => (
              <div key={dateLabel} style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 1.2 }}>{dateLabel}</h2>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)' }} />
                  <span style={{ fontSize: 11, color: '#334155' }}>{games.length} {games.length === 1 ? 'match' : 'matches'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
                  {games.map(game => (
                    <GameCard
                      key={game.event_id}
                      game={game}
                      onOpen={() => router.push(`/match/${encodeURIComponent(game.event_id)}`)}
                      onAddToSlip={addToSlip}
                      inSlip={sel => inSlip(game.event_id, sel)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <BetSlip
          items={slip}
          onRemove={key => setSlip(prev => prev.filter(i => `${i.event_id}:${i.selection}` !== key))}
          onClear={() => setSlip([])}
        />

        <style>{`
          div[style*="overflowX: auto"]::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
