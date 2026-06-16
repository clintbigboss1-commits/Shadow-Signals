'use client';

import { useState } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface GameEvent {
  event_id: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  event_name: string;
  commence_time: string;
  bookmaker_count: number;
  best_odds: Array<{ selection: string; bookmaker: string; odds: number }>;
  all_bookmakers: Record<string, Record<string, number>>;
  ev_picks: Array<{
    selection: string; bookie: string; bookie_odds: number;
    fair_odds: number; ev_percent: number; kelly_percent: number;
  }>;
  shadow_pick: boolean;
}

// ─── Sport config ─────────────────────────────────────────────────────────────
const SPORT_CFG: Record<string, { icon: string; label: string; color: string }> = {
  aussierules_afl:       { icon: '🏈', label: 'AFL',        color: '#003087' },
  rugbyleague_nrl:       { icon: '🏉', label: 'NRL',        color: '#00843D' },
  soccer_a_league:       { icon: '⚽', label: 'A-League',   color: '#c0152a' },
  soccer_epl:            { icon: '⚽', label: 'EPL',        color: '#3d195b' },
  soccer_ucl:            { icon: '⚽', label: 'UCL',        color: '#0e1e5b' },
  soccer_bundesliga:     { icon: '⚽', label: 'Bundesliga', color: '#d00027' },
  soccer_serie_a:        { icon: '⚽', label: 'Serie A',    color: '#1a1f8e' },
  soccer_la_liga:        { icon: '⚽', label: 'La Liga',    color: '#ee8200' },
  basketball_nba:        { icon: '🏀', label: 'NBA',        color: '#c9082a' },
  basketball_nbl:        { icon: '🏀', label: 'NBL',        color: '#004b87' },
  mma_ufc:                    { icon: '🥊', label: 'UFC',         color: '#8b0000' },
  mma_mixed_martial_arts:     { icon: '🥊', label: 'UFC/MMA',     color: '#8b0000' },
  mma_boxing:                 { icon: '🥊', label: 'Boxing',      color: '#8b0000' },
  boxing_boxing:              { icon: '🥊', label: 'Boxing',      color: '#8b0000' },
  cricket_t20:                { icon: '🏏', label: 'Cricket',     color: '#1a4a1a' },
  cricket_international_t20:  { icon: '🏏', label: 'T20 Cricket', color: '#1a4a1a' },
  cricket_big_bash:           { icon: '🏏', label: 'BBL',         color: '#1a4a1a' },
  americanfootball_nfl:  { icon: '🏈', label: 'NFL',        color: '#013369' },
  baseball_mlb:          { icon: '⚾', label: 'MLB',        color: '#002d72' },
  icehockey_nhl:         { icon: '🏒', label: 'NHL',        color: '#041e42' },
  tennis_atp:            { icon: '🎾', label: 'Tennis',     color: '#1a5c1a' },
  golf_pga:              { icon: '⛳', label: 'Golf',       color: '#2e7d32' },
  horse_racing_au:       { icon: '🐎', label: 'AU Racing',  color: '#7c3500' },
  horse_racing_us:       { icon: '🐎', label: 'US Racing',  color: '#5c2d00' },
  horse_racing_gb:       { icon: '🐎', label: 'UK Racing',  color: '#6b1a00' },
  horse_racing_ire:      { icon: '🐎', label: 'IRE Racing', color: '#0a3d1a' },
  greyhound_racing_au:   { icon: '🐕', label: 'Greyhounds', color: '#2d1a5c' },
  greyhound_racing_us:   { icon: '🐕', label: 'Greyhounds', color: '#2d1a5c' },
  greyhound_racing_ire:  { icon: '🐕', label: 'IRE Greys',  color: '#1a0a3d' },
};

function getSportCfg(key: string) {
  return SPORT_CFG[key] || { icon: '🎯', label: key.split('_').pop()?.toUpperCase() || 'Sport', color: '#1e3a5f' };
}

// ─── Bookie display ───────────────────────────────────────────────────────────
const BOOKIE_SHORT: Record<string, string> = {
  sportsbet: 'SB', tab: 'TAB', bet365: 'B365', ladbrokes: 'LADS',
  neds: 'NEDS', pointsbet: 'PB', bluebet: 'BLUE', betfair_ex_au: 'BF',
  betright: 'BR', unibet: 'UNI',
};
const BOOKIE_FULL: Record<string, string> = {
  sportsbet: 'Sportsbet', tab: 'TAB', bet365: 'Bet365', ladbrokes: 'Ladbrokes',
  neds: 'Neds', pointsbet: 'PointsBet', bluebet: 'BlueBet', betfair_ex_au: 'Betfair',
  betright: 'BetRight', unibet: 'Unibet',
};
const PREFERRED_BOOKIES = ['sportsbet', 'tab', 'bet365', 'ladbrokes', 'neds', 'pointsbet', 'bluebet', 'unibet'];

const BOOKIE_COLOR: Record<string, string> = {
  sportsbet:     '#f97316',
  tab:           '#2979ff',
  bet365:        '#00a843',
  ladbrokes:     '#ef4444',
  neds:          '#a78bfa',
  pointsbet:     '#ec4899',
  bluebet:       '#3b82f6',
  betfair_ex_au: '#f59e0b',
  betright:      '#6366f1',
  unibet:        '#00a843',
};

function shortBookie(key: string) { return BOOKIE_SHORT[key] || key.slice(0, 4).toUpperCase(); }
function fullBookie(key: string)  { return BOOKIE_FULL[key]  || key.replace(/_/g, ' '); }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isRacing(sportKey: string) { return sportKey.includes('racing'); }

function fmtCountdown(dt: string) {
  const diff = new Date(dt).getTime() - Date.now();
  if (diff <= 0) return 'LIVE';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return new Date(dt).toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney', weekday: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function fmtKickoff(dt: string) {
  return new Date(dt).toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney', weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function pickBookieCols(allBookmakers: Record<string, Record<string, number>>, evPicks: GameEvent['ev_picks']): string[] {
  const available = Object.keys(allBookmakers);
  const evBookies = evPicks.map(p => p.bookie);
  const ordered = Array.from(new Set([...evBookies, ...PREFERRED_BOOKIES])).filter(b => available.includes(b));
  return ordered.slice(0, 5);
}

// ─── EventCard ────────────────────────────────────────────────────────────────
export default function EventCard({ event }: { event: GameEvent }) {
  const [showAllRunners, setShowAllRunners] = useState(false);

  const cfg     = getSportCfg(event.sport_key);
  const racing  = isRacing(event.sport_key);
  const evMap   = new Map(event.ev_picks.map(p => [p.selection, p]));
  const countdown = fmtCountdown(event.commence_time);
  const isLive  = countdown === 'LIVE';

  // Best EV pick for the shadow pick banner
  const topPick = event.ev_picks.length > 0
    ? [...event.ev_picks].sort((a, b) => b.ev_percent - a.ev_percent)[0]
    : null;

  // Outcomes: racing sorted fav-first, limited to 10 unless expanded
  const allOutcomes = racing
    ? [...event.best_odds].sort((a, b) => a.odds - b.odds)
    : event.best_odds;
  const RACING_PREVIEW = 10;
  const outcomes = racing && !showAllRunners ? allOutcomes.slice(0, RACING_PREVIEW) : allOutcomes;

  // Bookie columns
  const hasMultiBook = Object.keys(event.all_bookmakers).length >= 2;
  const bookieCols   = hasMultiBook ? pickBookieCols(event.all_bookmakers, event.ev_picks) : [];
  const showGrid     = bookieCols.length >= 2;

  const colTemplate  = showGrid ? `1fr ${bookieCols.map(() => '74px').join(' ')}` : '1fr';

  return (
    <div style={{
      background: event.shadow_pick
        ? 'linear-gradient(135deg,rgba(0,168,78,.08),rgba(12,18,36,.95))'
        : 'rgba(255,255,255,.04)',
      border: `1.5px solid ${event.shadow_pick ? 'rgba(0,230,118,.3)' : 'rgba(255,255,255,.09)'}`,
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: event.shadow_pick
        ? '0 4px 24px rgba(0,168,78,.12)'
        : '0 2px 8px rgba(0,0,0,.3)',
    }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(120deg, ${cfg.color}cc 0%, #071120 100%)`,
        padding: '11px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
          background: 'rgba(255,255,255,.15)', color: '#fff',
          padding: '3px 9px', borderRadius: 20, flexShrink: 0,
        }}>{cfg.icon} {cfg.label}</span>

        <span style={{
          fontWeight: 700, fontSize: 14, color: '#fff', flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{event.event_name}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isLive ? (
            <span style={{ fontSize: 10, fontWeight: 800, background: '#ef4444', color: '#fff', padding: '2px 9px', borderRadius: 20 }}>● LIVE</span>
          ) : (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', fontWeight: 600 }}>⏱ {countdown}</span>
          )}
          {event.shadow_pick && (
            <span style={{ fontSize: 9, fontWeight: 800, background: 'linear-gradient(135deg,#00e676,#00a843)', color: '#071120', padding: '3px 10px', borderRadius: 20, letterSpacing: .5 }}>
              ⚡ SHADOW PICK
            </span>
          )}
          {event.bookmaker_count > 1 && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', fontWeight: 600 }}>{event.bookmaker_count} books</span>
          )}
        </div>
      </div>

      {/* ── Shadow Pick banner ───────────────────────────────── */}
      {event.shadow_pick && topPick && (
        <div style={{
          background: 'linear-gradient(90deg,rgba(0,168,78,.12),rgba(0,230,118,.06))',
          borderBottom: '1px solid rgba(0,230,118,.15)',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#00e676', textTransform: 'uppercase', letterSpacing: 1 }}>
              Top Pick
            </span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>{topPick.selection}</span>
          <span style={{
            fontFamily: 'DM Mono, monospace', fontWeight: 900, fontSize: 15, color: '#fff',
            background: 'rgba(41,121,255,.2)', border: '1px solid rgba(41,121,255,.35)',
            padding: '3px 10px', borderRadius: 7,
          }}>${topPick.bookie_odds.toFixed(2)}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{fullBookie(topPick.bookie)}</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'DM Mono, monospace', fontWeight: 900, fontSize: 18, color: '#00e676' }}>
            +{topPick.ev_percent.toFixed(1)}% EV
          </span>
        </div>
      )}

      {/* ── Odds grid (multi-bookie) ─────────────────────────── */}
      {showGrid && (
        <>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: colTemplate,
            background: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.07)',
            padding: '7px 16px', gap: 4,
          }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              {racing ? 'Runner' : 'Outcome'}
            </div>
            {bookieCols.map(b => {
              const col = BOOKIE_COLOR[b] || '#60a5fa';
              return (
                <div key={b} style={{ textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 7px', borderRadius: 5,
                    fontSize: 9, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase',
                    color: col, background: `${col}1a`, border: `1px solid ${col}30`,
                  }}>{shortBookie(b)}</span>
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {outcomes.map((o, i) => {
            const pick = evMap.get(o.selection);
            const hasEV = !!pick;
            return (
              <div key={o.selection + i} style={{
                display: 'grid', gridTemplateColumns: colTemplate, gap: 4,
                padding: '9px 16px',
                borderBottom: i < outcomes.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none',
                background: hasEV ? 'rgba(0,168,78,.06)' : 'transparent',
                alignItems: 'center',
              }}>
                {/* Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                  {hasEV && <div style={{ width: 3, height: 28, background: '#00e676', borderRadius: 2, flexShrink: 0 }} />}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: hasEV ? 800 : 600, fontSize: 13, color: hasEV ? '#ffffff' : 'rgba(255,255,255,.8)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {racing && <span style={{ color: 'rgba(255,255,255,.3)', marginRight: 4 }}>{i + 1}.</span>}
                      {o.selection}
                    </div>
                    {hasEV && pick && (
                      <div style={{ fontSize: 10, color: '#00e676', fontWeight: 700, marginTop: 1 }}>
                        +{pick.ev_percent.toFixed(1)}% EV · {fullBookie(pick.bookie)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Per-bookie odds cells */}
                {bookieCols.map(bookie => {
                  const price = event.all_bookmakers[bookie]?.[o.selection];
                  const isBest   = price !== undefined && price >= o.odds - 0.005;
                  const isEVCell = hasEV && pick?.bookie === bookie;

                  return (
                    <div key={bookie} style={{ textAlign: 'center' }}>
                      {price !== undefined ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '5px 6px',
                          borderRadius: 7,
                          fontFamily: 'DM Mono, JetBrains Mono, monospace',
                          fontWeight: 700, fontSize: 13,
                          minWidth: 54,
                          background: isEVCell ? 'rgba(0,230,118,.15)' : isBest ? 'rgba(41,121,255,.12)' : 'rgba(255,255,255,.04)',
                          color:      isEVCell ? '#00e676'              : isBest ? '#60a5fa'              : 'rgba(255,255,255,.5)',
                          border:     isEVCell ? '1px solid rgba(0,230,118,.35)' : isBest ? '1px solid rgba(41,121,255,.25)' : '1px solid transparent',
                        }}>
                          ${price.toFixed(2)}
                        </span>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,.15)', fontSize: 12 }}>—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Show more runners */}
          {racing && allOutcomes.length > RACING_PREVIEW && (
            <button
              onClick={() => setShowAllRunners(!showAllRunners)}
              style={{
                width: '100%', padding: '9px 16px',
                background: 'rgba(255,255,255,.03)',
                border: 'none', borderTop: '1px solid rgba(255,255,255,.06)', cursor: 'pointer',
                fontSize: 12, color: '#60a5fa', fontWeight: 700, textAlign: 'center',
              }}
            >
              {showAllRunners ? '↑ Show fewer runners' : `↓ Show all ${allOutcomes.length} runners`}
            </button>
          )}
        </>
      )}

      {/* ── Simple pills fallback (no multi-bookie data) ──────── */}
      {!showGrid && allOutcomes.length > 0 && (
        <div style={{ padding: '14px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {allOutcomes.map(o => {
            const pick = evMap.get(o.selection);
            return (
              <div key={o.selection} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 16px', borderRadius: 10, flex: '1 1 90px', minWidth: 90,
                background: pick ? 'rgba(0,230,118,.1)' : 'rgba(255,255,255,.04)',
                border: `1.5px solid ${pick ? 'rgba(0,230,118,.3)' : 'rgba(255,255,255,.09)'}`,
              }}>
                <span style={{ fontSize: 11, color: pick ? '#00e676' : 'rgba(255,255,255,.5)', fontWeight: 600, textAlign: 'center' }}>{o.selection}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, color: pick ? '#00e676' : '#e2e8f0' }}>
                  ${o.odds.toFixed(2)}
                </span>
                <span style={{ fontSize: 10, color: pick ? '#00e676' : 'rgba(255,255,255,.35)', fontWeight: 600 }}>
                  {pick ? `+${pick.ev_percent.toFixed(1)}% EV` : fullBookie(o.bookmaker)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <div style={{
        padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(255,255,255,.02)',
      }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{fmtKickoff(event.commence_time)}</span>
        <Link href={`/match/${encodeURIComponent(event.event_id)}`} style={{ fontSize: 12, color: '#60a5fa', fontWeight: 700 }}>
          Full analysis →
        </Link>
      </div>
    </div>
  );
}
