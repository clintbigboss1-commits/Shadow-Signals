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
    horse_racing_au:                       { emoji: '🏇', label: 'Horse Racing' },
    horse_racing_us:                       { emoji: '🏇', label: 'Horse Racing US' },
    greyhound_racing_au:                   { emoji: '🐕', label: 'Greyhounds AU' },
    greyhound_racing_gb:                   { emoji: '🐕', label: 'Greyhounds UK' },
    greyhound_racing_ire:                  { emoji: '🐕', label: 'Greyhounds IRE' },
    greyhound_racing_us:                   { emoji: '🐕', label: 'Greyhounds US' },
    horse_racing_gb:                       { emoji: '🏇', label: 'Horse Racing UK' },
    horse_racing_ire:                      { emoji: '🏇', label: 'Horse Racing IRE' },
  };
  return m[key] || { emoji: '🏆', label: key.replace(/_/g, ' ').toUpperCase() };
}

// Derive confidence score (mirrors server logic) so grade is consistent everywhere
function localConfidence(winProb: number, evPct: number) {
  return Math.round(Math.min(96, Math.max(5, winProb * 100 + Math.min(Math.max(evPct, 0), 12) * 2)));
}

function localGrade(conf: number) {
  if (conf >= 80) return 'STRONG';
  if (conf >= 60) return 'SOLID';
  if (conf >= 40) return 'WEAK';
  return 'AVOID';
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
  // Horse racing & greyhounds
  { key: 'horse_racing_au',                  label: 'Horses AU',   emoji: '🏇' },
  { key: 'horse_racing_gb',                  label: 'Horses UK',   emoji: '🏇' },
  { key: 'horse_racing_ire',                 label: 'Horses IRE',  emoji: '🏇' },
  { key: 'horse_racing_us',                  label: 'Horses US',   emoji: '🏇' },
  { key: 'greyhound_racing_au',              label: 'Dogs AU',     emoji: '🐕' },
  { key: 'greyhound_racing_gb',              label: 'Dogs UK',     emoji: '🐕' },
  { key: 'greyhound_racing_ire',             label: 'Dogs IRE',    emoji: '🐕' },
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

interface MultiOddsResult {
  combined_odds: number;
  combined_fair_odds: number | null;
  combined_ev_percent: number | null;
  num_legs: number;
  correlation_score: number;
  correlation_warning: string | null;
  implied_probability: number;
  payout_multiplier: number;
}

/* ─── Grade helpers shared across cards ────────────────────────────── */
const GRADE_COLORS: Record<string, [string, string]> = {
  STRONG: ['#ffab00', 'rgba(255,171,0,.15)'],
  SOLID:  ['#00c853', 'rgba(0,200,83,.12)'],
  WEAK:   ['#64748b', 'rgba(100,116,139,.1)'],
  AVOID:  ['#ef4444', 'rgba(239,68,68,.1)'],
};

function pickGrade(pick: EVPick): { grade: string; fg: string; bg: string } {
  const wp = pick.fair_odds > 0 ? 1 / pick.fair_odds : 0.5;
  const conf = localConfidence(wp, pick.ev_percent);
  const grade = localGrade(conf);
  const [fg, bg] = GRADE_COLORS[grade] || ['#64748b', 'rgba(255,255,255,.06)'];
  return { grade, fg, bg };
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
  const [signalTab, setSignalTab] = useState<'value' | 'prob'>('prob');

  const meta = sportMeta(game.sport_key);
  const picks = game.ev_picks || [];
  const isShadowPick = game.shadow_pick;
  const hasEdge = picks.length > 0;
  const ms = msUntil(game.commence_time);
  const isLive = ms < 0;
  const isSoon = ms > 0 && ms < 3600000;

  // All picks sorted by win probability (highest first)
  const picksByWinProb = [...picks].sort((a, b) => {
    const wA = a.fair_odds > 0 ? 1 / a.fair_odds : 0;
    const wB = b.fair_odds > 0 ? 1 / b.fair_odds : 0;
    return wB - wA;
  });

  // All picks sorted by EV% (highest first)
  const picksByEV = [...picks].sort((a, b) => b.ev_percent - a.ev_percent);

  // Featured pick = highest win probability signal
  const featuredPick = picksByWinProb[0] ?? null;
  const featuredWinProb = featuredPick && featuredPick.fair_odds > 0 ? Math.round(100 / featuredPick.fair_odds) : null;

  const accentLeft = isShadowPick ? '3px solid #ffab00' : hasEdge ? '3px solid #2979ff' : '3px solid transparent';
  const cardBorder = isShadowPick ? '1px solid rgba(255,171,0,.3)' : hasEdge ? '1px solid rgba(41,121,255,.25)' : '1px solid rgba(255,255,255,.07)';

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
      <div style={{ padding: '9px 14px 8px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>{meta.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: .8 }}>{meta.label}</span>
            {isLive && <span style={{ fontSize: 10, fontWeight: 800, color: '#ff1744', background: 'rgba(255,23,68,.12)', border: '1px solid rgba(255,23,68,.3)', padding: '1px 7px', borderRadius: 4 }}>LIVE</span>}
            {isSoon && !isLive && <span style={{ fontSize: 10, fontWeight: 800, color: '#ffab00', background: 'rgba(255,171,0,.1)', border: '1px solid rgba(255,171,0,.25)', padding: '1px 7px', borderRadius: 4 }}>SOON</span>}
          </div>
          <span style={{ fontSize: 11, color: '#2d3f5c', fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{countdown(game.commence_time)}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {game.event_name}
        </div>
      </div>

      {/* ── FEATURED: HIGHEST WIN PROBABILITY ─────────────────── */}
      {featuredPick && featuredWinProb !== null && (
        <div style={{
          background: 'linear-gradient(135deg,rgba(41,121,255,.12),rgba(12,20,40,.0))',
          borderBottom: '1px solid rgba(41,121,255,.18)',
          padding: '12px 14px',
        }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 9 }}>
            ⭐ Highest Win Probability
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#fff', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {featuredPick.selection}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 13, fontWeight: 900, color: '#2979ff',
                  background: 'rgba(41,121,255,.15)', border: '1px solid rgba(41,121,255,.35)',
                  padding: '3px 10px', borderRadius: 7,
                }}>
                  {featuredWinProb}% WIN
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#00e676' }}>+{featuredPick.ev_percent.toFixed(1)}% EV</span>
                {(() => {
                  const { grade, fg, bg } = pickGrade(featuredPick);
                  return <span style={{ fontSize: 9, fontWeight: 900, color: fg, background: bg, padding: '2px 7px', borderRadius: 4, letterSpacing: .8 }}>{grade}</span>;
                })()}
                <span style={{ fontSize: 10, color: '#475569' }}>{featuredPick.bookie?.replace(/_/g, ' ').split(' ')[0]}</span>
              </div>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                onAddToSlip({
                  event_id: game.event_id, event_name: game.event_name,
                  sport_key: game.sport_key, selection: featuredPick.selection,
                  bookie: featuredPick.bookie, odds: featuredPick.bookie_odds,
                  fair_odds: featuredPick.fair_odds, ev_percent: featuredPick.ev_percent,
                  kelly_percent: featuredPick.kelly_percent, commence_time: game.commence_time,
                });
              }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 19,
                color: inSlip(featuredPick.selection) ? '#2979ff' : '#fff',
                background: inSlip(featuredPick.selection) ? 'rgba(41,121,255,.2)' : 'rgba(41,121,255,.15)',
                border: '1px solid rgba(41,121,255,.4)',
                borderRadius: 10, padding: '8px 14px', cursor: 'pointer', flexShrink: 0, textAlign: 'center',
              }}
            >
              ${featuredPick.bookie_odds.toFixed(2)}
              <span style={{ fontSize: 8, fontWeight: 700, color: '#2979ff', letterSpacing: .5 }}>
                {inSlip(featuredPick.selection) ? '✓ ADDED' : '+ ADD'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── SIGNAL SECTIONS: tab toggle ───────────────────────── */}
      {picks.length > 0 && (
        <>
          {/* Tab row */}
          <div
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.15)' }}
          >
            <button
              onClick={e => { e.stopPropagation(); setSignalTab('prob'); }}
              style={{
                flex: 1, padding: '7px 0', fontSize: 10, fontWeight: 800,
                color: signalTab === 'prob' ? '#60a5fa' : '#334155',
                background: signalTab === 'prob' ? 'rgba(41,121,255,.08)' : 'transparent',
                border: 'none', borderBottom: signalTab === 'prob' ? '2px solid #2979ff' : '2px solid transparent',
                cursor: 'pointer', letterSpacing: .6,
              }}
            >
              📊 WIN PROBABILITY
            </button>
            <button
              onClick={e => { e.stopPropagation(); setSignalTab('value'); }}
              style={{
                flex: 1, padding: '7px 0', fontSize: 10, fontWeight: 800,
                color: signalTab === 'value' ? '#00e676' : '#334155',
                background: signalTab === 'value' ? 'rgba(0,230,118,.06)' : 'transparent',
                border: 'none', borderBottom: signalTab === 'value' ? '2px solid #00e676' : '2px solid transparent',
                cursor: 'pointer', letterSpacing: .6,
              }}
            >
              💰 VALUE BETS
            </button>
          </div>

          {/* WIN PROBABILITY tab — all signals by win prob */}
          {signalTab === 'prob' && picksByWinProb.map((p, i) => {
            const winProb = p.fair_odds > 0 ? Math.round(100 / p.fair_odds) : null;
            const { grade, fg, bg } = pickGrade(p);
            const isInSlip = inSlip(p.selection);
            const isTop = i === 0;
            return (
              <div
                key={`wp-${p.selection}-${i}`}
                onClick={e => e.stopPropagation()}
                style={{
                  padding: '8px 14px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  borderBottom: '1px solid rgba(255,255,255,.04)',
                  background: isTop ? 'rgba(41,121,255,.05)' : 'transparent',
                }}
              >
                {/* Win prob */}
                <div style={{ width: 42, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: isTop ? '#60a5fa' : '#334155', lineHeight: 1 }}>
                    {winProb !== null ? `${winProb}%` : '—'}
                  </div>
                  <div style={{ height: 2, background: 'rgba(255,255,255,.06)', borderRadius: 1, marginTop: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${winProb ?? 0}%`, background: isTop ? '#2979ff' : '#1e3a5f', borderRadius: 1 }} />
                  </div>
                </div>
                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: isTop ? 800 : 600, color: isTop ? '#fff' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.selection}
                  </div>
                  <div style={{ fontSize: 9, color: '#334155', marginTop: 1 }}>{p.bookie?.replace(/_/g, ' ').split(' ')[0]}</div>
                </div>
                {/* Grade */}
                <span style={{ fontSize: 9, fontWeight: 900, color: fg, background: bg, padding: '2px 6px', borderRadius: 4, letterSpacing: .7, flexShrink: 0 }}>{grade}</span>
                {/* EV% */}
                <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: p.ev_percent >= 5 ? '#00e676' : '#475569', flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
                  +{p.ev_percent.toFixed(1)}%
                </span>
                {/* Odds + add */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onAddToSlip({
                      event_id: game.event_id, event_name: game.event_name,
                      sport_key: game.sport_key, selection: p.selection,
                      bookie: p.bookie, odds: p.bookie_odds,
                      fair_odds: p.fair_odds, ev_percent: p.ev_percent,
                      kelly_percent: p.kelly_percent, commence_time: game.commence_time,
                    });
                  }}
                  style={{
                    fontFamily: 'monospace', fontWeight: 800, fontSize: 13,
                    color: isInSlip ? '#2979ff' : '#94a3b8',
                    background: isInSlip ? 'rgba(41,121,255,.12)' : 'rgba(255,255,255,.05)',
                    border: `1px solid ${isInSlip ? 'rgba(41,121,255,.3)' : 'rgba(255,255,255,.08)'}`,
                    borderRadius: 7, padding: '4px 9px', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  ${p.bookie_odds.toFixed(2)}
                </button>
              </div>
            );
          })}

          {/* VALUE BETS tab — all signals by EV% */}
          {signalTab === 'value' && picksByEV.map((p, i) => {
            const isInSlip = inSlip(p.selection);
            const evColor = p.ev_percent >= 8 ? '#ffab00' : '#00e676';
            const isTop = i === 0;
            return (
              <div
                key={`ev-${p.selection}-${i}`}
                onClick={e => e.stopPropagation()}
                style={{
                  padding: '8px 14px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  borderBottom: '1px solid rgba(255,255,255,.04)',
                  background: isTop ? 'rgba(0,230,118,.04)' : 'transparent',
                }}
              >
                {/* EV bar */}
                <div style={{ width: 42, flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: evColor, lineHeight: 1 }}>
                    +{p.ev_percent.toFixed(1)}%
                  </div>
                  <div style={{ height: 2, background: 'rgba(255,255,255,.06)', borderRadius: 1, marginTop: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(Math.max(p.ev_percent, 0) / 12 * 100, 100)}%`, background: evColor, borderRadius: 1 }} />
                  </div>
                </div>
                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: isTop ? 800 : 600, color: isTop ? '#fff' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.selection}
                  </div>
                  <div style={{ fontSize: 9, color: '#334155', marginTop: 1 }}>{p.bookie?.replace(/_/g, ' ').split(' ')[0]}</div>
                </div>
                {/* Grade */}
                {(() => {
                  const { grade, fg, bg } = pickGrade(p);
                  return <span style={{ fontSize: 9, fontWeight: 900, color: fg, background: bg, padding: '2px 6px', borderRadius: 4, letterSpacing: .7, flexShrink: 0 }}>{grade}</span>;
                })()}
                {/* Win prob */}
                {p.fair_odds > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#334155', flexShrink: 0, minWidth: 32, textAlign: 'right' }}>
                    {Math.round(100 / p.fair_odds)}%
                  </span>
                )}
                {/* Odds + add */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onAddToSlip({
                      event_id: game.event_id, event_name: game.event_name,
                      sport_key: game.sport_key, selection: p.selection,
                      bookie: p.bookie, odds: p.bookie_odds,
                      fair_odds: p.fair_odds, ev_percent: p.ev_percent,
                      kelly_percent: p.kelly_percent, commence_time: game.commence_time,
                    });
                  }}
                  style={{
                    fontFamily: 'monospace', fontWeight: 800, fontSize: 13,
                    color: isInSlip ? '#2979ff' : evColor,
                    background: isInSlip ? 'rgba(41,121,255,.12)' : `${evColor}18`,
                    border: `1px solid ${isInSlip ? 'rgba(41,121,255,.3)' : `${evColor}40`}`,
                    borderRadius: 7, padding: '4px 9px', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  ${p.bookie_odds.toFixed(2)}
                </button>
              </div>
            );
          })}
        </>
      )}

      {/* No signals fallback — show best odds for each outcome */}
      {picks.length === 0 && game.best_odds.length > 0 && (
        <div style={{ padding: '10px 14px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {game.best_odds.map(o => (
            <button
              key={o.selection}
              onClick={e => { e.stopPropagation(); onAddToSlip({ event_id: game.event_id, event_name: game.event_name, sport_key: game.sport_key, selection: o.selection, bookie: o.bookmaker, odds: o.odds, commence_time: game.commence_time }); }}
              style={{
                flex: '1 1 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '8px 10px', borderRadius: 9, cursor: 'pointer',
                background: inSlip(o.selection) ? 'rgba(41,121,255,.1)' : 'rgba(255,255,255,.04)',
                border: `1px solid ${inSlip(o.selection) ? 'rgba(41,121,255,.3)' : 'rgba(255,255,255,.08)'}`,
              }}
            >
              <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, textAlign: 'center', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.selection}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: '#e2e8f0' }}>${o.odds.toFixed(2)}</span>
              <span style={{ fontSize: 9, color: '#334155' }}>{o.bookmaker?.replace(/_/g, ' ').split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,.2)', marginTop: 'auto' }}>
        <span style={{ fontSize: 11, color: '#1e3a5f' }}>{fmtTime(game.commence_time)} AEST</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

/* ─── Racing helpers ─────────────────────────────────────────────── */

function isRacingSport(key: string) {
  return key.startsWith('horse_racing') || key.startsWith('greyhound_racing');
}

/* ─── Race Card — multi-runner layout for horse racing / greyhounds ── */
function RaceCard({
  game, onOpen, onAddToSlip, inSlip,
}: {
  game: Game;
  onOpen: () => void;
  onAddToSlip: (item: SlipItem) => void;
  inSlip: (sel: string) => boolean;
}) {
  const [signalTab, setSignalTab] = useState<'value' | 'prob'>('prob');
  const [showAll, setShowAll] = useState(false);

  const meta = sportMeta(game.sport_key);
  const picks = game.ev_picks || [];
  const ms = msUntil(game.commence_time);
  const isLive = ms < 0;
  const isSoon = ms > 0 && ms < 3600000;
  const hasEdge = picks.length > 0;
  const isShadowPick = picks.some(p => p.ev_percent >= 8);

  const raceName = game.home_team && game.away_team && game.home_team !== game.away_team
    ? game.home_team
    : (game.home_team || 'Race');

  const allRunners = game.best_odds;
  const sumInv = allRunners.reduce((acc, r) => acc + 1 / r.odds, 0);

  const runnersEnriched = allRunners.map(r => {
    const pick = picks.find(p => p.selection === r.selection);
    const rawProb = sumInv > 0 ? (1 / r.odds) / sumInv : 0;
    const winProb = pick && pick.fair_odds > 0
      ? Math.round((1 / pick.fair_odds) * 100)
      : Math.round(rawProb * 100);
    return { ...r, pick, winProb };
  });

  // Featured: runner with highest win probability among signals (or best odds)
  const pickedRunners = runnersEnriched.filter(r => r.pick);
  const featuredRunner = pickedRunners.length > 0
    ? [...pickedRunners].sort((a, b) => b.winProb - a.winProb)[0]
    : runnersEnriched.sort((a, b) => b.winProb - a.winProb)[0];

  // Sorted views for tabs
  const byWinProb = [...runnersEnriched].sort((a, b) => b.winProb - a.winProb);
  const byEV = picks.length > 0
    ? [...picks].sort((a, b) => b.ev_percent - a.ev_percent)
    : [];

  const MAX_SHOW = 6;
  const displayedByProb = showAll ? byWinProb : byWinProb.slice(0, MAX_SHOW);

  const accentLeft = isShadowPick ? '3px solid #ffab00' : hasEdge ? '3px solid #2979ff' : '3px solid transparent';
  const cardBorder = isShadowPick ? '1px solid rgba(255,171,0,.3)' : hasEdge ? '1px solid rgba(41,121,255,.25)' : '1px solid rgba(255,255,255,.07)';

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
      {/* Shadow pick banner */}
      {isShadowPick && (
        <div style={{ background: 'linear-gradient(90deg,rgba(255,171,0,.18),rgba(255,171,0,.04))', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,171,0,.2)' }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#ffab00', letterSpacing: 1 }}>⚡ SHADOW PICK</span>
          <span style={{ fontSize: 10, color: 'rgba(255,171,0,.55)' }}>Signals aligned · high confidence</span>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '9px 14px 8px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>{meta.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: .8 }}>{meta.label}</span>
            {isLive && <span style={{ fontSize: 10, fontWeight: 800, color: '#ff1744', background: 'rgba(255,23,68,.12)', border: '1px solid rgba(255,23,68,.3)', padding: '1px 7px', borderRadius: 4 }}>LIVE</span>}
            {isSoon && !isLive && <span style={{ fontSize: 10, fontWeight: 800, color: '#ffab00', background: 'rgba(255,171,0,.1)', border: '1px solid rgba(255,171,0,.25)', padding: '1px 7px', borderRadius: 4 }}>SOON</span>}
          </div>
          <span style={{ fontSize: 11, color: '#2d3f5c', fontWeight: 600 }}>{countdown(game.commence_time)}</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{raceName}</div>
        <div style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>{allRunners.length} runners · {game.bookmaker_count} books</div>
      </div>

      {/* ── FEATURED: HIGHEST WIN PROBABILITY ─────────────────── */}
      {featuredRunner && (
        <div style={{
          background: 'linear-gradient(135deg,rgba(41,121,255,.12),rgba(12,20,40,0))',
          borderBottom: '1px solid rgba(41,121,255,.18)',
          padding: '11px 14px',
        }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
            ⭐ Highest Win Probability
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#fff', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {featuredRunner.selection}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 13, fontWeight: 900, color: '#2979ff',
                  background: 'rgba(41,121,255,.15)', border: '1px solid rgba(41,121,255,.35)',
                  padding: '3px 10px', borderRadius: 7,
                }}>
                  {featuredRunner.winProb}% WIN
                </span>
                {featuredRunner.pick && (
                  <>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#00e676' }}>+{featuredRunner.pick.ev_percent.toFixed(1)}% EV</span>
                    {(() => {
                      const { grade, fg, bg } = pickGrade(featuredRunner.pick!);
                      return <span style={{ fontSize: 9, fontWeight: 900, color: fg, background: bg, padding: '2px 7px', borderRadius: 4, letterSpacing: .8 }}>{grade}</span>;
                    })()}
                  </>
                )}
                <span style={{ fontSize: 10, color: '#475569' }}>{featuredRunner.bookmaker?.replace(/_/g, ' ').split(' ')[0]}</span>
              </div>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                onAddToSlip({
                  event_id: game.event_id, event_name: raceName,
                  sport_key: game.sport_key, selection: featuredRunner.selection,
                  bookie: featuredRunner.pick?.bookie ?? featuredRunner.bookmaker,
                  odds: featuredRunner.pick?.bookie_odds ?? featuredRunner.odds,
                  fair_odds: featuredRunner.pick?.fair_odds,
                  ev_percent: featuredRunner.pick?.ev_percent,
                  kelly_percent: featuredRunner.pick?.kelly_percent,
                  commence_time: game.commence_time,
                });
              }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 19,
                color: inSlip(featuredRunner.selection) ? '#2979ff' : '#fff',
                background: inSlip(featuredRunner.selection) ? 'rgba(41,121,255,.2)' : 'rgba(41,121,255,.15)',
                border: '1px solid rgba(41,121,255,.4)',
                borderRadius: 10, padding: '8px 14px', cursor: 'pointer', flexShrink: 0, textAlign: 'center',
              }}
            >
              ${(featuredRunner.pick?.bookie_odds ?? featuredRunner.odds).toFixed(2)}
              <span style={{ fontSize: 8, fontWeight: 700, color: '#2979ff', letterSpacing: .5 }}>
                {inSlip(featuredRunner.selection) ? '✓ ADDED' : '+ ADD'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── SIGNAL SECTIONS tab toggle ────────────────────────── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.15)' }}
      >
        <button
          onClick={e => { e.stopPropagation(); setSignalTab('prob'); }}
          style={{
            flex: 1, padding: '7px 0', fontSize: 10, fontWeight: 800,
            color: signalTab === 'prob' ? '#60a5fa' : '#334155',
            background: signalTab === 'prob' ? 'rgba(41,121,255,.08)' : 'transparent',
            border: 'none', borderBottom: signalTab === 'prob' ? '2px solid #2979ff' : '2px solid transparent',
            cursor: 'pointer', letterSpacing: .6,
          }}
        >
          📊 WIN PROBABILITY
        </button>
        <button
          onClick={e => { e.stopPropagation(); setSignalTab('value'); }}
          style={{
            flex: 1, padding: '7px 0', fontSize: 10, fontWeight: 800,
            color: signalTab === 'value' ? '#00e676' : '#334155',
            background: signalTab === 'value' ? 'rgba(0,230,118,.06)' : 'transparent',
            border: 'none', borderBottom: signalTab === 'value' ? '2px solid #00e676' : '2px solid transparent',
            cursor: 'pointer', letterSpacing: .6,
          }}
        >
          💰 VALUE BETS {byEV.length > 0 && <span style={{ background: '#00e676', color: '#071120', fontSize: 8, fontWeight: 900, padding: '1px 5px', borderRadius: 10, marginLeft: 3 }}>{byEV.length}</span>}
        </button>
      </div>

      {/* WIN PROBABILITY tab — all runners sorted by win prob */}
      {signalTab === 'prob' && (
        <>
          {displayedByProb.map((runner, idx) => {
            const pick = runner.pick;
            const evPct = pick?.ev_percent ?? 0;
            const isInSlip = inSlip(runner.selection);
            const isTop = idx === 0;
            return (
              <div
                key={`wp-${runner.selection}-${idx}`}
                onClick={e => e.stopPropagation()}
                style={{
                  padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8,
                  borderBottom: '1px solid rgba(255,255,255,.03)',
                  background: pick ? 'rgba(0,230,118,.025)' : isTop ? 'rgba(41,121,255,.03)' : 'transparent',
                }}
              >
                {/* Position + win prob */}
                <div style={{ width: 42, flexShrink: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: isTop ? '#60a5fa' : '#1e3a5f', marginBottom: 1 }}>#{idx + 1}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: isTop ? '#60a5fa' : '#334155' }}>{runner.winProb}%</div>
                </div>
                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: pick ? 800 : 600, color: pick ? '#fff' : isTop ? '#cbd5e1' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {runner.selection}
                  </div>
                  {pick && (
                    <div style={{ fontSize: 9, color: evPct >= 8 ? '#ffab00' : '#00e676', fontWeight: 700, marginTop: 1 }}>
                      +{evPct.toFixed(1)}% EV · {pick.bookie?.replace(/_/g, ' ').split(' ')[0]}
                    </div>
                  )}
                </div>
                {/* Grade if has signal */}
                {pick && (() => {
                  const { grade, fg, bg } = pickGrade(pick);
                  return <span style={{ fontSize: 9, fontWeight: 900, color: fg, background: bg, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{grade}</span>;
                })()}
                {/* Odds button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onAddToSlip({
                      event_id: game.event_id, event_name: raceName,
                      sport_key: game.sport_key, selection: runner.selection,
                      bookie: pick?.bookie ?? runner.bookmaker,
                      odds: pick?.bookie_odds ?? runner.odds,
                      fair_odds: pick?.fair_odds, ev_percent: pick?.ev_percent,
                      kelly_percent: pick?.kelly_percent, commence_time: game.commence_time,
                    });
                  }}
                  style={{
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 13,
                    color: isInSlip ? '#2979ff' : pick ? (evPct >= 8 ? '#ffab00' : '#00e676') : '#475569',
                    background: isInSlip ? 'rgba(41,121,255,.12)' : pick ? `${evPct >= 8 ? 'rgba(255,171,0,.1)' : 'rgba(0,230,118,.1)'}` : 'rgba(255,255,255,.04)',
                    border: `1px solid ${isInSlip ? 'rgba(41,121,255,.3)' : pick ? (evPct >= 8 ? 'rgba(255,171,0,.25)' : 'rgba(0,230,118,.2)') : 'rgba(255,255,255,.07)'}`,
                    borderRadius: 7, padding: '4px 9px', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  ${(pick?.bookie_odds ?? runner.odds).toFixed(2)}
                </button>
              </div>
            );
          })}
          {byWinProb.length > MAX_SHOW && (
            <button
              onClick={e => { e.stopPropagation(); setShowAll(s => !s); }}
              style={{
                width: '100%', padding: '7px', background: 'rgba(255,255,255,.02)',
                border: 'none', borderTop: '1px solid rgba(255,255,255,.05)',
                fontSize: 11, color: '#2979ff', fontWeight: 700, cursor: 'pointer',
              }}
            >
              {showAll ? '↑ Show fewer' : `↓ Show all ${byWinProb.length} runners`}
            </button>
          )}
        </>
      )}

      {/* VALUE BETS tab — only EV signals sorted by EV% */}
      {signalTab === 'value' && (
        byEV.length === 0
          ? <div style={{ padding: '16px 14px', textAlign: 'center', fontSize: 12, color: '#334155' }}>No value signals found</div>
          : byEV.map((p, i) => {
            const isInSlip = inSlip(p.selection);
            const evColor = p.ev_percent >= 8 ? '#ffab00' : '#00e676';
            const isTop = i === 0;
            return (
              <div
                key={`ev-${p.selection}-${i}`}
                onClick={e => e.stopPropagation()}
                style={{
                  padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
                  borderBottom: '1px solid rgba(255,255,255,.04)',
                  background: isTop ? 'rgba(0,230,118,.04)' : 'transparent',
                }}
              >
                <div style={{ width: 42, flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: evColor }}>{p.ev_percent >= 0 ? '+' : ''}{p.ev_percent.toFixed(1)}%</div>
                  <div style={{ height: 2, background: 'rgba(255,255,255,.06)', borderRadius: 1, marginTop: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(Math.max(p.ev_percent, 0) / 12 * 100, 100)}%`, background: evColor, borderRadius: 1 }} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: isTop ? 800 : 600, color: isTop ? '#fff' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.selection}
                  </div>
                  <div style={{ fontSize: 9, color: '#334155', marginTop: 1 }}>{p.bookie?.replace(/_/g, ' ').split(' ')[0]} · {p.fair_odds > 0 ? `${Math.round(100 / p.fair_odds)}% win` : ''}</div>
                </div>
                {(() => {
                  const { grade, fg, bg } = pickGrade(p);
                  return <span style={{ fontSize: 9, fontWeight: 900, color: fg, background: bg, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{grade}</span>;
                })()}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onAddToSlip({
                      event_id: game.event_id, event_name: raceName,
                      sport_key: game.sport_key, selection: p.selection,
                      bookie: p.bookie, odds: p.bookie_odds,
                      fair_odds: p.fair_odds, ev_percent: p.ev_percent,
                      kelly_percent: p.kelly_percent, commence_time: game.commence_time,
                    });
                  }}
                  style={{
                    fontFamily: 'monospace', fontWeight: 800, fontSize: 13,
                    color: isInSlip ? '#2979ff' : evColor,
                    background: isInSlip ? 'rgba(41,121,255,.12)' : `${evColor}18`,
                    border: `1px solid ${isInSlip ? 'rgba(41,121,255,.3)' : `${evColor}40`}`,
                    borderRadius: 7, padding: '4px 9px', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  ${p.bookie_odds.toFixed(2)}
                </button>
              </div>
            );
          })
      )}

      {/* Footer */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,.2)', marginTop: 'auto' }}>
        <span style={{ fontSize: 11, color: '#1e3a5f' }}>{fmtTime(game.commence_time)} AEST</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

/* ─── Bet Slip — Singles + Multi mode ──────────────────────────────── */
function BetSlip({ items, onRemove, onClear }: { items: SlipItem[]; onRemove: (key: string) => void; onClear: () => void }) {
  const [stake, setStake]        = useState(50);
  const [logging, setLogging]    = useState(false);
  const [logged, setLogged]      = useState(false);
  const [multiMode, setMultiMode] = useState<'singles' | 'multi'>('singles');
  const [multiResult, setMultiResult] = useState<MultiOddsResult | null>(null);
  const [computingMulti, setComputingMulti] = useState(false);

  const canMulti = items.length >= 2;

  // Compute multi odds when mode switches or items change
  useEffect(() => {
    if (multiMode === 'multi' && canMulti) {
      setComputingMulti(true);
      API.post('/bets/multi-odds', {
        legs: items.map(i => ({
          event_id: i.event_id,
          event_name: i.event_name,
          sport_key: i.sport_key,
          selection: i.selection,
          bookie: i.bookie,
          odds: i.odds,
          fair_odds: i.fair_odds,
          ev_percent: i.ev_percent,
        }))
      })
        .then(r => setMultiResult(r.data))
        .catch(() => setMultiResult(null))
        .finally(() => setComputingMulti(false));
    } else {
      setMultiResult(null);
    }
  }, [multiMode, items.length, canMulti]);

  // Switch to singles when items drop below 2 while in multi mode
  useEffect(() => {
    if (multiMode === 'multi' && !canMulti) setMultiMode('singles');
  }, [items.length, multiMode, canMulti]);

  if (items.length === 0) return null;

  const avgKelly = items.filter(i => i.kelly_percent)
    .reduce((a, i) => a + (i.kelly_percent || 0), 0)
    / (items.filter(i => i.kelly_percent).length || 1);

  const isMulti = multiMode === 'multi' && canMulti;

  async function logBets() {
    setLogging(true);
    try {
      if (isMulti && multiResult) {
        // Log as a multi-bet
        await API.post('/bets/multi', {
          legs: items.map(i => ({
            event_id: i.event_id,
            event_name: i.event_name,
            sport_key: i.sport_key,
            selection: i.selection,
            bookie: i.bookie,
            odds: i.odds,
            fair_odds: i.fair_odds,
            ev_percent: i.ev_percent,
          })),
          total_stake: stake,
          combined_ev: multiResult.combined_ev_percent,
        });
      } else {
        // Log individual singles
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
      }
      setLogged(true);
      setTimeout(() => { onClear(); setLogged(false); setMultiResult(null); }, 1500);
    } catch (e) { console.error('Log failed', e); }
    finally { setLogging(false); }
  }

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 200,
      width: 360, background: '#0d1526',
      border: `1px solid ${isMulti ? 'rgba(255,171,0,.3)' : 'rgba(41,121,255,.3)'}`,
      borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,.7)',
      overflow: 'hidden',
    }}>
      {/* Header with mode toggle */}
      <div style={{ padding: '11px 16px', background: isMulti ? 'rgba(255,171,0,.07)' : 'rgba(41,121,255,.07)', borderBottom: `1px solid ${isMulti ? 'rgba(255,171,0,.15)' : 'rgba(41,121,255,.15)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: isMulti ? '#ffab00' : '#2979ff' }}>
            {isMulti ? '📊 Multi Picker' : '⚡ Bet Slip'} ({items.length})
          </span>
          {canMulti && (
            <div style={{ display: 'flex', background: 'rgba(255,255,255,.06)', borderRadius: 6, padding: 2 }}>
              <button
                onClick={() => setMultiMode('singles')}
                style={{
                  background: multiMode === 'singles' ? '#2979ff' : 'transparent',
                  border: 'none', color: multiMode === 'singles' ? '#fff' : '#64748b',
                  fontWeight: 700, fontSize: 10, padding: '3px 8px', borderRadius: 5, cursor: 'pointer',
                }}
              >
                1×
              </button>
              <button
                onClick={() => setMultiMode('multi')}
                style={{
                  background: multiMode === 'multi' ? '#ffab00' : 'transparent',
                  border: 'none',
                  color: multiMode === 'multi' ? '#030711' : '#64748b',
                  fontWeight: 700, fontSize: 10, padding: '3px 8px', borderRadius: 5, cursor: 'pointer',
                }}
              >
                Multi
              </button>
            </div>
          )}
        </div>
        <button onClick={onClear} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>Clear</button>
      </div>

      {/* Legs list */}
      <div style={{ maxHeight: isMulti ? 200 : 240, overflowY: 'auto' }}>
        {items.map(item => {
          const key = `${item.event_id}:${item.selection}`;
          return (
            <div key={key} style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.event_name}</div>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'capitalize' }}>
                  {item.selection} · {item.bookie?.replace(/_/g, ' ')}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8, minWidth: 60 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: item.ev_percent ? '#00c853' : '#fff', fontSize: 13, lineHeight: 1.2 }}>
                  ${item.odds.toFixed(2)}
                </div>
                <button onClick={() => onRemove(key)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 10, padding: 0, lineHeight: 1 }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi: combined odds display */}
      {isMulti && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.05)', background: 'rgba(255,171,0,.03)' }}>
          {computingMulti ? (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: 11 }}>Computing multi odds...</div>
          ) : multiResult ? (
            <>
              {/* Combined odds row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Combined odds</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 20, color: '#ffab00' }}>
                  ${multiResult.combined_odds.toFixed(2)}
                </span>
              </div>
              {/* Payout & probability */}
              <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#64748b', marginBottom: 6 }}>
                <span>Pays ${(stake * multiResult.combined_odds).toFixed(2)}</span>
                <span>·</span>
                <span>{multiResult.implied_probability.toFixed(1)}% implied</span>
                {multiResult.combined_ev_percent !== null && multiResult.combined_ev_percent >= 0 && (
                  <>
                    <span>·</span>
                    <span style={{ color: '#00c853', fontWeight: 700 }}>+{multiResult.combined_ev_percent.toFixed(1)}% EV</span>
                  </>
                )}
              </div>
              {/* Correlation warning */}
              {multiResult.correlation_warning && (
                <div style={{ fontSize: 10, color: '#ffab00', padding: '5px 8px', background: 'rgba(255,171,0,.08)', borderRadius: 6, marginTop: 2 }}>
                  {multiResult.correlation_warning}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#ff1744', fontSize: 11 }}>Could not compute multi odds</div>
          )}
        </div>
      )}

      {/* Singles: per-leg Kelly */}
      {!isMulti && avgKelly > 0 && (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,.04)', fontSize: 11, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
          <span>Avg Kelly: {avgKelly.toFixed(1)}% of bankroll</span>
          <span>Total: ${(stake * items.length).toFixed(0)}</span>
        </div>
      )}

      {/* Bottom: stake + log button */}
      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
            {isMulti ? 'Multi stake' : 'Stake per bet'}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: '#64748b', fontSize: 13 }}>$</span>
            <input
              type="number"
              min={1}
              max={10000}
              value={stake}
              onChange={e => setStake(Math.max(1, Number(e.target.value)))}
              style={{
                width: 72, fontSize: 14, padding: '4px 8px', textAlign: 'right',
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 6, color: '#fff', fontFamily: 'JetBrains Mono, monospace',
                outline: 'none',
              }}
            />
          </div>
        </div>
        {isMulti && multiResult && (
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 8, textAlign: 'center' }}>
            Payout if all legs win: <strong style={{ color: '#ffab00' }}>${(stake * multiResult.combined_odds).toFixed(2)}</strong>
          </div>
        )}
        <button
          onClick={logBets}
          disabled={logging || logged || (isMulti && !multiResult)}
          style={{
            width: '100%', padding: '11px', borderRadius: 10,
            background: logged ? '#00c853'
              : isMulti
                ? 'linear-gradient(135deg,#ffab00,#e69900)'
                : 'linear-gradient(135deg,#2979ff,#1e63d9)',
            border: 'none',
            color: logged ? '#030711' : isMulti ? '#030711' : '#fff',
            fontWeight: 800, fontSize: 14,
            cursor: (logging || (isMulti && !multiResult)) ? 'wait' : 'pointer',
            fontFamily: 'Inter, sans-serif',
            opacity: (isMulti && !multiResult && !computingMulti) ? 0.5 : 1,
          }}
        >
          {logged
            ? '✓ Logged'
            : logging
              ? 'Logging...'
              : isMulti
                ? `Log Multi (${items.length} legs) →`
                : `Log ${items.length} Bet${items.length > 1 ? 's' : ''} →`
          }
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
                    isRacingSport(game.sport_key) ? (
                      <RaceCard
                        key={game.event_id}
                        game={game}
                        onOpen={() => router.push(`/match/${encodeURIComponent(game.event_id)}`)}
                        onAddToSlip={addToSlip}
                        inSlip={sel => inSlip(game.event_id, sel)}
                      />
                    ) : (
                      <GameCard
                        key={game.event_id}
                        game={game}
                        onOpen={() => router.push(`/match/${encodeURIComponent(game.event_id)}`)}
                        onAddToSlip={addToSlip}
                        inSlip={sel => inSlip(game.event_id, sel)}
                      />
                    )
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
          @media (max-width: 480px) {
            .card-signal-row { padding: 6px 10px !important; gap: 5px !important; }
            .card-signal-row .odds-btn { font-size: 12px !important; padding: 4px 7px !important; }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
