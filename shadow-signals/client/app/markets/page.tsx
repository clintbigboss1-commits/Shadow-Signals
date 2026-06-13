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
  ev_picks: EVPick[];
  shadow_pick: boolean;
}

/* ─── helpers ─────────────────────────────────────────────────────────── */


function sportMeta(key: string): { emoji: string; label: string } {
  const m: Record<string, { emoji: string; label: string }> = {
    aussierules_afl:                       { emoji: '🏉', label: 'AFL' },
    rugbyleague_nrl:                       { emoji: '🏉', label: 'NRL' },
    rugbyleague_nrl_state_of_origin:       { emoji: '🏉', label: 'State of Origin' },
    cricket_international_t20:             { emoji: '🏏', label: 'T20I' },
    cricket_odi:                           { emoji: '🏏', label: 'ODI' },
    cricket_test_match:                    { emoji: '🏏', label: 'Test Cricket' },
    cricket_big_bash:                      { emoji: '🏏', label: 'BBL' },
    soccer_a_league:                       { emoji: '⚽', label: 'A-League' },
    soccer_epl:                            { emoji: '⚽', label: 'EPL' },
    soccer_ucl:                            { emoji: '⚽', label: 'UCL' },
    soccer_la_liga:                        { emoji: '⚽', label: 'La Liga' },
    soccer_bundesliga:                     { emoji: '⚽', label: 'Bundesliga' },
    soccer_serie_a:                        { emoji: '⚽', label: 'Serie A' },
    soccer_europa:                         { emoji: '⚽', label: 'Europa League' },
    soccer_ligue_1:                        { emoji: '⚽', label: 'Ligue 1' },
    soccer_mls:                            { emoji: '⚽', label: 'MLS' },
    soccer_brazil:                         { emoji: '⚽', label: 'Brasileirão' },
    soccer_brazil_serie_b:                 { emoji: '⚽', label: 'Brazil B' },
    soccer_fifa_world_cup:                 { emoji: '⚽', label: 'World Cup' },
    soccer_fifa_world_cup_winner:          { emoji: '⚽', label: 'WC Winner' },
    soccer_conmebol_copa_libertadores:     { emoji: '⚽', label: 'Copa Lib' },
    soccer_conmebol_copa_sudamericana:     { emoji: '⚽', label: 'Copa Sud' },
    soccer_germany_dfb_pokal:              { emoji: '⚽', label: 'DFB-Pokal' },
    soccer_norway_eliteserien:             { emoji: '⚽', label: 'Eliteserien' },
    soccer_sweden_allsvenskan:             { emoji: '⚽', label: 'Allsvenskan' },
    soccer_sweden_superettan:              { emoji: '⚽', label: 'Superettan' },
    soccer_finland_veikkausliiga:          { emoji: '⚽', label: 'Finland Liga' },
    soccer_spain_segunda_division:         { emoji: '⚽', label: 'La Liga 2' },
    soccer_chile_campeonato:               { emoji: '⚽', label: 'Chile Liga' },
    soccer_china_superleague:              { emoji: '⚽', label: 'China SL' },
    soccer_league_of_ireland:              { emoji: '⚽', label: 'Ireland League' },
    basketball_nba:                        { emoji: '🏀', label: 'NBA' },
    basketball_nba_championship_winner:    { emoji: '🏀', label: 'NBA Title' },
    basketball_nbl:                        { emoji: '🏀', label: 'NBL' },
    basketball_wnba:                       { emoji: '🏀', label: 'WNBA' },
    americanfootball_nfl:                  { emoji: '🏈', label: 'NFL' },
    americanfootball_nfl_preseason:        { emoji: '🏈', label: 'NFL Preseason' },
    americanfootball_nfl_super_bowl_winner:{ emoji: '🏈', label: 'Super Bowl' },
    americanfootball_ncaaf:                { emoji: '🏈', label: 'NCAAF' },
    americanfootball_cfl:                  { emoji: '🏈', label: 'CFL' },
    americanfootball_ufl:                  { emoji: '🏈', label: 'UFL' },
    baseball_mlb:                          { emoji: '⚾', label: 'MLB' },
    baseball_mlb_world_series_winner:      { emoji: '⚾', label: 'World Series' },
    baseball_milb:                         { emoji: '⚾', label: 'MiLB' },
    baseball_kbo:                          { emoji: '⚾', label: 'KBO' },
    baseball_npb:                          { emoji: '⚾', label: 'NPB' },
    baseball_ncaa:                         { emoji: '⚾', label: 'NCAA Baseball' },
    icehockey_nhl:                         { emoji: '🏒', label: 'NHL' },
    icehockey_nhl_championship_winner:     { emoji: '🏒', label: 'Stanley Cup' },
    icehockey_ahl:                         { emoji: '🏒', label: 'AHL' },
    mma_mixed_martial_arts:                { emoji: '🥊', label: 'MMA' },
    mma_ufc:                               { emoji: '🥊', label: 'MMA' },
    boxing_boxing:                         { emoji: '🥊', label: 'Boxing' },
    mma_boxing:                            { emoji: '🥊', label: 'Boxing' },
    tennis_wta_queens_club_champ:          { emoji: '🎾', label: 'WTA Tennis' },
    tennis_atp:                            { emoji: '🎾', label: 'Tennis' },
    golf_the_open_championship_winner:     { emoji: '⛳', label: 'The Open' },
    golf_us_open_winner:                   { emoji: '⛳', label: 'US Open Golf' },
    golf_pga:                              { emoji: '⛳', label: 'Golf' },
    lacrosse_pll:                          { emoji: '🥍', label: 'PLL' },
    politics_us_presidential_election_winner: { emoji: '🗳️', label: 'US Election' },
  };
  return m[key] || { emoji: '🏆', label: key.replace(/_/g, ' ').toUpperCase() };
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
  { key: 'all',                              label: 'All',         emoji: '🏆' },
  // AU
  { key: 'aussierules_afl',                  label: 'AFL',         emoji: '🏉' },
  { key: 'rugbyleague_nrl',                  label: 'NRL',         emoji: '🏉' },
  { key: 'rugbyleague_nrl_state_of_origin',  label: 'Origin',      emoji: '🏉' },
  // Cricket
  { key: 'cricket_international_t20',        label: 'T20I',        emoji: '🏏' },
  { key: 'cricket_odi',                      label: 'ODI',         emoji: '🏏' },
  { key: 'cricket_test_match',               label: 'Tests',       emoji: '🏏' },
  // Basketball
  { key: 'basketball_nba',                   label: 'NBA',         emoji: '🏀' },
  { key: 'basketball_wnba',                  label: 'WNBA',        emoji: '🏀' },
  { key: 'basketball_nbl',                   label: 'NBL',         emoji: '🏀' },
  // Baseball
  { key: 'baseball_mlb',                     label: 'MLB',         emoji: '⚾' },
  { key: 'baseball_kbo',                     label: 'KBO',         emoji: '⚾' },
  { key: 'baseball_npb',                     label: 'NPB',         emoji: '⚾' },
  // Ice Hockey
  { key: 'icehockey_nhl',                    label: 'NHL',         emoji: '🏒' },
  // American Football
  { key: 'americanfootball_nfl',             label: 'NFL',         emoji: '🏈' },
  { key: 'americanfootball_cfl',             label: 'CFL',         emoji: '🏈' },
  // Combat
  { key: 'mma_mixed_martial_arts',           label: 'MMA',         emoji: '🥊' },
  { key: 'boxing_boxing',                    label: 'Boxing',      emoji: '🥊' },
  // Soccer
  { key: 'soccer_fifa_world_cup',            label: 'World Cup',   emoji: '⚽' },
  { key: 'soccer_conmebol_copa_libertadores',label: 'Copa Lib',    emoji: '⚽' },
  { key: 'soccer_conmebol_copa_sudamericana',label: 'Copa Sud',    emoji: '⚽' },
  { key: 'soccer_mls',                       label: 'MLS',         emoji: '⚽' },
  { key: 'soccer_brazil',                    label: 'Brazil',      emoji: '⚽' },
  { key: 'soccer_norway_eliteserien',        label: 'Eliteserien', emoji: '⚽' },
  { key: 'soccer_sweden_allsvenskan',        label: 'Allsvenskan', emoji: '⚽' },
  { key: 'soccer_epl',                       label: 'EPL',         emoji: '⚽' },
  { key: 'soccer_ucl',                       label: 'UCL',         emoji: '⚽' },
  { key: 'soccer_la_liga',                   label: 'La Liga',     emoji: '⚽' },
  { key: 'soccer_bundesliga',                label: 'Bundesliga',  emoji: '⚽' },
  { key: 'soccer_serie_a',                   label: 'Serie A',     emoji: '⚽' },
  // Tennis / Golf
  { key: 'tennis_wta_queens_club_champ',     label: 'Tennis',      emoji: '🎾' },
  { key: 'golf_us_open_winner',              label: 'Golf',        emoji: '⛳' },
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
  const picks = game.ev_picks || [];
  const isShadowPick = game.shadow_pick;
  const hasEdge = picks.length > 0;
  const ms = msUntil(game.commence_time);
  const isLive = ms < 0;
  const isSoon = ms > 0 && ms < 3600000;
  const isTwoWay = !game.best_odds.some(o => o.selection === 'Draw');

  // Per-outcome signals
  const homePick = picks.find(p => p.selection === game.home_team);
  const awayPick = picks.find(p => p.selection === game.away_team);
  const drawPick = picks.find(p => p.selection === 'Draw');
  const drawBest = game.best_odds.find(o => o.selection === 'Draw');

  // Derive win probabilities from fair odds
  let homeWinProb: number | null = homePick ? Math.round(100 / homePick.fair_odds) : null;
  let awayWinProb: number | null = awayPick ? Math.round(100 / awayPick.fair_odds) : null;
  if (homeWinProb !== null && awayWinProb === null && isTwoWay) awayWinProb = 100 - homeWinProb;
  if (awayWinProb !== null && homeWinProb === null && isTwoWay) homeWinProb = 100 - awayWinProb;

  const accentLeft = isShadowPick ? '3px solid #ffab00' : hasEdge ? '3px solid #00e676' : '3px solid transparent';
  const cardBorder = isShadowPick ? '1px solid rgba(255,171,0,.3)' : hasEdge ? '1px solid rgba(0,230,118,.2)' : '1px solid rgba(255,255,255,.07)';

  const outcomes: { team: string; pick: EVPick | undefined; winProb: number | null }[] = [
    { team: game.home_team, pick: homePick, winProb: homeWinProb },
    { team: game.away_team, pick: awayPick, winProb: awayWinProb },
  ];

  return (
    <div
      onClick={onOpen}
      style={{
        background: '#0d1829',
        border: cardBorder,
        borderLeft: accentLeft,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform .15s, box-shadow .15s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,.5)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      {/* SHADOW PICK banner */}
      {isShadowPick && (
        <div style={{ background: 'linear-gradient(90deg,rgba(255,171,0,.18),rgba(255,171,0,.04))', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,171,0,.2)' }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#ffab00', letterSpacing: 1 }}>⚡ SHADOW PICK</span>
          <span style={{ fontSize: 10, color: 'rgba(255,171,0,.55)' }}>Signals aligned · high confidence</span>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '9px 14px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>{meta.emoji}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: .8 }}>{meta.label}</span>
          {isLive  && <span style={{ fontSize: 10, fontWeight: 800, color: '#ff1744', background: 'rgba(255,23,68,.12)', border: '1px solid rgba(255,23,68,.3)', padding: '1px 7px', borderRadius: 4 }}>LIVE</span>}
          {isSoon && !isLive && <span style={{ fontSize: 10, fontWeight: 800, color: '#ffab00', background: 'rgba(255,171,0,.1)', border: '1px solid rgba(255,171,0,.25)', padding: '1px 7px', borderRadius: 4 }}>SOON</span>}
        </div>
        <span style={{ fontSize: 11, color: '#2d3f5c', fontWeight: 600 }}>{countdown(game.commence_time)}</span>
      </div>

      {/* Outcome rows — one per team */}
      {outcomes.map(({ team, pick, winProb }, idx) => {
        const bestOdds = game.best_odds.find(o => o.selection === team);
        const color = teamColor(team);
        const isInSlip = inSlip(team);
        const evPct = pick?.ev_percent ?? 0;
        const barColor = evPct >= 8 ? '#ffab00' : '#00e676';

        return (
          <div key={team} style={{ padding: '11px 14px', borderBottom: idx === 0 ? '1px solid rgba(255,255,255,.04)' : 'none', background: pick ? 'rgba(0,230,118,.025)' : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SportIcon sportKey={game.sport_key} name={team} color={color} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Team name + win prob + EV badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: pick ? 5 : 0 }}>
                  <span style={{ fontWeight: pick ? 800 : 600, fontSize: 13, color: pick ? '#fff' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>{team}</span>
                  {winProb !== null && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#334155', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>
                      {winProb}% win
                    </span>
                  )}
                  {pick && (
                    <span style={{ fontSize: 10, fontWeight: 900, color: evPct >= 8 ? '#ffab00' : '#00e676', flexShrink: 0 }}>
                      +{evPct.toFixed(1)}% EV
                    </span>
                  )}
                </div>

                {/* Confidence bar + bookie name */}
                {pick && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(evPct / 12 * 100, 100)}%`, background: barColor, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 9, color: '#334155', flexShrink: 0, textTransform: 'capitalize' }}>
                      {pick.bookie?.replace(/_/g, ' ').replace('betfair ex au', 'betfair').split(' ')[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Best odds button */}
              {bestOdds && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onAddToSlip({
                      event_id: game.event_id, event_name: game.event_name,
                      sport_key: game.sport_key, selection: team,
                      bookie: bestOdds.bookmaker, odds: bestOdds.odds,
                      fair_odds: pick?.fair_odds,
                      ev_percent: pick?.ev_percent,
                      kelly_percent: pick?.kelly_percent,
                      commence_time: game.commence_time,
                    });
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 16,
                    color: isInSlip ? '#2979ff' : pick ? (evPct >= 8 ? '#ffab00' : '#00e676') : '#94a3b8',
                    background: isInSlip ? 'rgba(41,121,255,.12)' : pick ? `rgba(${evPct >= 8 ? '255,171,0' : '0,230,118'},.1)` : 'rgba(255,255,255,.05)',
                    border: `1px solid ${isInSlip ? 'rgba(41,121,255,.3)' : pick ? `rgba(${evPct >= 8 ? '255,171,0' : '0,230,118'},.25)` : 'rgba(255,255,255,.08)'}`,
                    borderRadius: 9, padding: '6px 12px', cursor: 'pointer', minWidth: 64, textAlign: 'center', flexShrink: 0,
                  }}
                >
                  {bestOdds.odds.toFixed(2)}
                  <span style={{ fontSize: 8, fontWeight: 600, color: '#334155', textTransform: 'capitalize', marginTop: 2 }}>
                    {bestOdds.bookmaker?.replace(/_/g, ' ').split(' ')[0]}
                  </span>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Draw row for soccer */}
      {drawBest && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,.04)', background: drawPick ? 'rgba(0,230,118,.025)' : 'transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.04)', display: 'grid', placeItems: 'center', fontSize: 12, color: '#334155', flexShrink: 0 }}>≡</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: drawPick ? 5 : 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Draw</span>
                {drawPick && <span style={{ fontSize: 10, fontWeight: 900, color: '#00e676' }}>+{drawPick.ev_percent.toFixed(1)}% EV</span>}
              </div>
              {drawPick && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(drawPick.ev_percent / 12 * 100, 100)}%`, background: '#00e676', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 9, color: '#334155', flexShrink: 0, textTransform: 'capitalize' }}>{drawPick.bookie?.replace(/_/g, ' ').split(' ')[0]}</span>
                </div>
              )}
            </div>
            <button
              onClick={e => { e.stopPropagation(); onAddToSlip({ event_id: game.event_id, event_name: game.event_name, sport_key: game.sport_key, selection: 'Draw', bookie: drawBest.bookmaker, odds: drawBest.odds, fair_odds: drawPick?.fair_odds, ev_percent: drawPick?.ev_percent, kelly_percent: drawPick?.kelly_percent, commence_time: game.commence_time }); }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 16, color: inSlip('Draw') ? '#2979ff' : '#64748b', background: inSlip('Draw') ? 'rgba(41,121,255,.12)' : 'rgba(255,255,255,.05)', border: `1px solid ${inSlip('Draw') ? 'rgba(41,121,255,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 9, padding: '6px 12px', cursor: 'pointer', minWidth: 64, textAlign: 'center', flexShrink: 0 }}
            >
              {drawBest.odds.toFixed(2)}
              <span style={{ fontSize: 8, fontWeight: 600, color: '#334155', marginTop: 2 }}>Draw</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,.2)' }}>
        <span style={{ fontSize: 11, color: '#1e3a5f' }}>{fmtTime(game.commence_time)} AEST</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#1e3a5f' }}>{game.bookmaker_count} books</span>
          {picks.length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 800, color: isShadowPick ? '#ffab00' : '#00e676', background: isShadowPick ? 'rgba(255,171,0,.1)' : 'rgba(0,230,118,.1)', padding: '1px 7px', borderRadius: 4 }}>
              {picks.length} signal{picks.length > 1 ? 's' : ''}
            </span>
          )}
          <span style={{ fontSize: 11, color: '#2979ff', fontWeight: 700 }}>Analyse →</span>
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

  const displayed = filter === 'edge' ? data.filter(g => g.ev_picks.length > 0) : data;
  const edgeCount = data.filter(g => g.ev_picks.length > 0).length;

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
          <OperativePeek page="markets" side="right" width={200} bottom={0} />
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
