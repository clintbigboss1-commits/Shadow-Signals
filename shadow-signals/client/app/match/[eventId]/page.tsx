'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import ProtectedRoute from '../../../components/ProtectedRoute';
import SportIcon from '../../../components/SportIcon';
import API from '../../../lib/api';

/* ─── types (mirror GET /api/match/:eventId) ──────────────────────────── */

interface BetOption {
  market?: string;
  selection: string;
  bookie: string;
  odds: number;
  fair_odds: number | null;
  ev_percent: number;
  kelly_percent: number;
  confidence: number;
  win_prob?: number;
  tip_grade?: 'STRONG' | 'SOLID' | 'WEAK' | 'AVOID';
  reasoning?: string;
}

interface MultiLeg {
  event_name: string;
  sport_key: string;
  selection: string;
  bookie: string;
  odds: number;
  commence_time: string;
}

interface Multi {
  name: string;
  legs: MultiLeg[];
  combined_odds: number;
  ev_percent: number;
  kelly_percent: number;
  confidence: number;
}

interface MatchData {
  event: {
    event_id: string;
    sport_key: string;
    home_team: string;
    away_team: string;
    event_name: string;
    commence_time: string;
  };
  our_pick: BetOption | null;
  singles: BetOption[];
  multis: Multi[];
  player_props: BetOption[];
  other_bets: BetOption[];
  odds_grid: { bookmaker: string; prices: Record<string, number> }[];
  fair_odds: Record<string, number>;
}

/* ─── helpers (same conventions as markets page) ──────────────────────── */

function sportEmoji(key: string) {
  const m: Record<string, string> = {
    aussierules_afl: '🏉', rugbyleague_nrl: '🏉',
    cricket_odi: '🏏', cricket_t20: '🏏', cricket_test_match: '🏏', cricket_big_bash: '🏏',
    soccer_a_league: '⚽', soccer_epl: '⚽', soccer_la_liga: '⚽',
    soccer_bundesliga: '⚽', soccer_serie_a: '⚽', soccer_ucl: '⚽',
    mma_mixed_martial_arts: '🥊', mma_ufc: '🥊', mma_boxing: '🥊',
    basketball_nba: '🏀', basketball_nbl: '🏀',
    americanfootball_nfl: '🏈', baseball_mlb: '⚾', icehockey_nhl: '🏒',
    tennis_atp: '🎾', golf_pga: '⛳', horse_racing: '🐎',
  };
  return m[key] || '🏆';
}

function sportLabel(key: string) {
  const m: Record<string, string> = {
    aussierules_afl: 'AFL', rugbyleague_nrl: 'NRL',
    cricket_odi: 'ODI Cricket', cricket_t20: 'T20 Cricket',
    cricket_test_match: 'Test Cricket', cricket_big_bash: 'BBL',
    soccer_a_league: 'A-League', soccer_epl: 'EPL',
    mma_mixed_martial_arts: 'UFC/MMA', mma_ufc: 'UFC', mma_boxing: 'Boxing',
    basketball_nba: 'NBA', basketball_nbl: 'NBL',
    americanfootball_nfl: 'NFL', baseball_mlb: 'MLB', icehockey_nhl: 'NHL',
    tennis_atp: 'Tennis', golf_pga: 'Golf',
  };
  return m[key] || key.replace(/_/g, ' ').toUpperCase();
}

function teamColor(name: string) {
  const colors = ['#2979ff', '#00c853', '#ffab00', '#8b5cf6', '#ec4899', '#6366f1', '#ef4444', '#14b8a6'];
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

// Confidence colour: STRONG = gold, SOLID = green, WEAK = amber, AVOID = red
function confColor(c: number) {
  if (c >= 80) return '#ffab00';
  if (c >= 60) return '#00c853';
  if (c >= 40) return '#94a3b8';
  return '#ef4444';
}

function gradeStyle(grade: string | undefined) {
  switch (grade) {
    case 'STRONG': return { color: '#030711', bg: '#ffab00', border: 'rgba(255,171,0,.0)' };
    case 'SOLID':  return { color: '#030711', bg: '#00c853', border: 'rgba(0,200,83,.0)' };
    case 'WEAK':   return { color: '#94a3b8', bg: 'rgba(148,163,184,.12)', border: 'rgba(148,163,184,.2)' };
    case 'AVOID':  return { color: '#ef4444', bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.25)' };
    default:       return { color: '#64748b', bg: 'rgba(255,255,255,.06)', border: 'rgba(255,255,255,.08)' };
  }
}

function bookieLabel(b: string) {
  return (b || '').replace(/_/g, ' ');
}

/* ─── confidence bar (shared by every bet row) ────────────────────────── */

function ConfidenceBar({ value }: { value: number }) {
  const col = confColor(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}
      title="Confidence: how likely this bet is to land, based on fair win probability plus verified price edge">
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: `linear-gradient(90deg, ${col}88, ${col})`, borderRadius: 99, transition: 'width .5s' }} />
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 13, color: col, whiteSpace: 'nowrap' }}>
        {value}%
      </span>
    </div>
  );
}

/* ─── Back button with logged feedback ────────────────────────────────── */

function BackButton({ label, onBack }: { label: string; onBack: () => Promise<void> }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  return (
    <button
      onClick={async () => {
        if (state !== 'idle') return;
        setState('busy');
        try { await onBack(); setState('done'); setTimeout(() => setState('idle'), 2500); }
        catch { setState('idle'); }
      }}
      style={{
        padding: '8px 18px', borderRadius: 8, border: 'none', whiteSpace: 'nowrap',
        background: state === 'done' ? '#00c853' : 'linear-gradient(135deg,#2979ff,#1e63d9)',
        color: '#030711', fontWeight: 800, fontSize: 13, cursor: state === 'busy' ? 'wait' : 'pointer',
        fontFamily: 'Inter, sans-serif', opacity: state === 'busy' ? 0.7 : 1, flexShrink: 0,
      }}
    >
      {state === 'done' ? '✓ Logged' : state === 'busy' ? '...' : label}
    </button>
  );
}

/* ─── section wrapper: title + count chip ─────────────────────────────── */

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>
          {title}
        </h2>
        <span style={{ background: 'rgba(41,121,255,.12)', color: '#2979ff', fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 20 }}>
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ─── main page ───────────────────────────────────────────────────────── */

export default function MatchDetailPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [data, setData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bankroll, setBankroll] = useState(1000);

  const load = useCallback(async () => {
    try {
      const res = await API.get(`/match/${eventId}`);
      setData(res.data);
      setError(null);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { error?: string } } };
      if (err.response?.status === 404) setError('This match has finished or its odds have expired.');
      else if (err.response?.status !== 401) setError(err.response?.data?.error || 'Failed to load match.');
    } finally { setLoading(false); }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 45000); return () => clearInterval(t); }, [load]);

  function stakeFor(kellyPercent: number) {
    return Math.max(0, Math.round(bankroll * kellyPercent) / 100);
  }

  async function logBet(b: BetOption, eventName: string, eventTime: string, sport: string) {
    await API.post('/bets', {
      event_name: eventName,
      sport,
      market: b.market || 'h2h',
      selection: b.selection,
      bookie: b.bookie,
      odds_taken: b.odds,
      fair_odds: b.fair_odds,
      ev_percent: b.ev_percent,
      kelly_fraction: b.kelly_percent / 100,
      stake_aud: stakeFor(b.kelly_percent) || 10,
      event_time: eventTime,
    });
  }

  async function logMulti(m: Multi, eventTime: string, sport: string) {
    await API.post('/bets', {
      event_name: m.legs.map(l => l.event_name).join(' / '),
      sport,
      market: 'multi',
      selection: m.legs.map(l => `${l.selection} @ ${l.odds.toFixed(2)}`).join(' + '),
      bookie: 'multi',
      odds_taken: m.combined_odds,
      fair_odds: null,
      ev_percent: m.ev_percent,
      kelly_fraction: m.kelly_percent / 100,
      stake_aud: stakeFor(m.kelly_percent) || 5,
      event_time: eventTime,
    });
  }

  /* ── loading / error states ── */
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="page"><Navbar />
          <div style={{ padding: 100, textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            Loading match...
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  if (error || !data) {
    return (
      <ProtectedRoute>
        <div className="page"><Navbar />
          <div style={{ padding: 100, textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🏁</div>
            <h3 style={{ color: '#94a3b8', marginBottom: 8 }}>{error || 'Match not found'}</h3>
            <a href="/markets" style={{ color: '#2979ff', fontSize: 14 }}>← Back to markets</a>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const { event, our_pick, singles, multis, player_props, other_bets, odds_grid, fair_odds } = data;
  const selections = Array.from(new Set(odds_grid.flatMap(r => Object.keys(r.prices))));
  const bestPrice: Record<string, number> = {};
  for (const sel of selections) {
    bestPrice[sel] = Math.max(...odds_grid.map(r => r.prices[sel] || 0));
  }
  const hColor = teamColor(event.home_team);
  const aColor = teamColor(event.away_team);

  /* ── one bet row, used by singles / props / other ── */
  const betRow = (b: BetOption, i: number) => {
    const gs = gradeStyle(b.tip_grade);
    const shouldBack = b.tip_grade === 'STRONG' || b.tip_grade === 'SOLID';
    return (
      <div key={`${b.market || 'h2h'}-${b.selection}-${i}`} style={{
        padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.05)',
        background: b.tip_grade === 'STRONG' ? 'rgba(255,171,0,.03)' : 'transparent',
      }}>
        {/* Top row: grade + selection + odds */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          {/* Grade badge */}
          <div style={{
            background: gs.bg, color: gs.color, border: `1px solid ${gs.border}`,
            fontSize: 10, fontWeight: 900, letterSpacing: 1.2, padding: '3px 10px',
            borderRadius: 6, flexShrink: 0, alignSelf: 'flex-start', marginTop: 2,
          }}>
            {b.tip_grade || '—'}
          </div>

          {/* Selection name + bookie */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#e2e8f0', marginBottom: 3 }}>{b.selection}</div>
            <div style={{ fontSize: 11, color: '#475569', textTransform: 'capitalize' }}>
              {b.market && b.market !== 'h2h' ? `${b.market.replace(/_/g, ' ')} · ` : ''}Best price at {bookieLabel(b.bookie)}
            </div>
          </div>

          {/* Odds */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 20, color: shouldBack ? '#00e676' : '#94a3b8', lineHeight: 1 }}>
              {b.odds.toFixed(2)}
            </div>
            {b.fair_odds && (
              <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>fair {b.fair_odds.toFixed(2)}</div>
            )}
          </div>
        </div>

        {/* Reasoning */}
        {b.reasoning && (
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, lineHeight: 1.5, paddingLeft: 2 }}>
            {b.reasoning}
          </div>
        )}

        {/* Metrics row: EV + win prob + stake + confidence + action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: b.ev_percent > 0 ? '#00c853' : '#475569' }}>
                {b.ev_percent > 0 ? `+${b.ev_percent.toFixed(1)}%` : '—'}
              </div>
              <div style={{ fontSize: 10, color: '#334155' }}>edge</div>
            </div>
            {b.win_prob !== undefined && (
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: '#94a3b8' }}>
                  {b.win_prob.toFixed(0)}%
                </div>
                <div style={{ fontSize: 10, color: '#334155' }}>win prob</div>
              </div>
            )}
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: '#2979ff' }}>
                ${stakeFor(b.kelly_percent).toFixed(0)}
              </div>
              <div style={{ fontSize: 10, color: '#334155' }}>suggested</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <ConfidenceBar value={b.confidence} />
          </div>
          <BackButton label={shouldBack ? 'Back this' : 'Log anyway'} onBack={() => logBet(b, event.event_name, event.commence_time, event.sport_key)} />
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="page">
        <Navbar />

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,.06)', background: 'linear-gradient(135deg,#0d1526,#081120)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 20px 22px' }}>
            <a href="/markets" style={{ color: '#475569', fontSize: 13, textDecoration: 'none' }}>← All markets</a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SportIcon sportKey={event.sport_key} name={event.home_team} color={hColor} size={48} />
                <span style={{ fontWeight: 800, fontSize: 24 }}>{event.home_team}</span>
              </div>
              <span style={{ color: '#475569', fontWeight: 700, fontSize: 16 }}>vs</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SportIcon sportKey={event.sport_key} name={event.away_team} color={aColor} size={48} />
                <span style={{ fontWeight: 800, fontSize: 24 }}>{event.away_team}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
                {sportEmoji(event.sport_key)} {sportLabel(event.sport_key)}
              </span>
              <span style={{ color: '#334155' }}>·</span>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{fmtTime(event.commence_time)} AEST</span>
              {our_pick && (() => {
                const gs = gradeStyle(our_pick.tip_grade);
                return (
                  <span style={{
                    background: gs.bg, border: `1px solid ${gs.border}`,
                    color: gs.color, fontSize: 11, fontWeight: 900, letterSpacing: .8,
                    padding: '4px 14px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}>
                    {our_pick.tip_grade === 'STRONG' ? '⚡' : '✓'} {our_pick.tip_grade || 'PICK'}: {our_pick.selection} @ {our_pick.odds.toFixed(2)}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* ── BODY: main column + sidebar ────────────────────────────── */}
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '24px 20px 120px',
          display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 24,
        }} className="match-detail-grid">

          {/* ── MAIN ── */}
          <div style={{ minWidth: 0 }}>

            {/* Section 1: MULTIS */}
            {multis.length > 0 && (
              <Section title="Multis — our pick combined with today's best edges" count={multis.length}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {multis.map((m, i) => (
                    <div key={m.name + i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: 'rgba(41,121,255,.05)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: '#e2e8f0' }}>⚡ {m.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 18, color: '#00e676' }}>
                            @ {m.combined_odds.toFixed(2)}
                          </span>
                          <ConfidenceBar value={m.confidence} />
                        </div>
                      </div>
                      <div style={{ padding: '6px 16px' }}>
                        {m.legs.map((l, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: j < m.legs.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none', fontSize: 13, flexWrap: 'wrap' }}>
                            <span style={{ color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{j + 1}</span>
                            <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{l.selection}</span>
                            <span style={{ color: '#64748b', fontSize: 12, flex: 1, minWidth: 120 }}>
                              {sportEmoji(l.sport_key)} {l.event_name}
                            </span>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#94a3b8' }}>{l.odds.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: 18, fontSize: 12, color: '#64748b' }}>
                          <span>Edge <b style={{ color: '#00c853' }}>+{m.ev_percent.toFixed(1)}%</b></span>
                          <span>Suggested stake <b style={{ color: '#2979ff' }}>${stakeFor(m.kelly_percent).toFixed(0)}</b></span>
                        </div>
                        <BackButton label="Back this multi" onBack={() => logMulti(m, event.commence_time, event.sport_key)} />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Section 2: SINGLES */}
            <Section title="Singles — match winner" count={singles.length}>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {singles.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    No priced selections right now.
                  </div>
                ) : singles.map(betRow)}
              </div>
            </Section>

            {/* Section 3: PLAYER PROPS */}
            <Section title="Player props" count={player_props.length}>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {player_props.length === 0 ? (
                  <div style={{ padding: 28, textAlign: 'center', color: '#475569', fontSize: 13 }}>
                    No player prop markets priced for this match yet — they appear here when bookmakers open them.
                  </div>
                ) : player_props.map(betRow)}
              </div>
            </Section>

            {/* Section 4: OTHER BETS */}
            <Section title="Other bets — totals, lines & specials" count={other_bets.length}>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {other_bets.length === 0 ? (
                  <div style={{ padding: 28, textAlign: 'center', color: '#475569', fontSize: 13 }}>
                    No additional markets priced for this match yet.
                  </div>
                ) : other_bets.map(betRow)}
              </div>
            </Section>
          </div>

          {/* ── SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Bankroll — drives every suggested stake on the page */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#475569', marginBottom: 10 }}>
                Your bankroll
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#64748b', fontSize: 16 }}>$</span>
                <input
                  type="number"
                  value={bankroll}
                  onChange={e => setBankroll(Math.max(0, Number(e.target.value)))}
                  style={{ flex: 1, fontSize: 15, padding: '7px 10px' }}
                />
              </div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>
                Suggested stakes use quarter-Kelly sizing on this amount.
              </div>
            </div>

            {/* All odds you get */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#475569', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                All odds you get
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: '#475569', fontWeight: 700 }}>Book</th>
                      {selections.map(sel => (
                        <th key={sel} style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sel === event.home_team ? 'Home' : sel === event.away_team ? 'Away' : sel}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {odds_grid.map(row => (
                      <tr key={row.bookmaker} style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}>
                        <td style={{ padding: '7px 12px', color: '#94a3b8', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                          {bookieLabel(row.bookmaker)}
                        </td>
                        {selections.map(sel => {
                          const p = row.prices[sel];
                          const isBest = p && p === bestPrice[sel];
                          return (
                            <td key={sel} style={{
                              padding: '7px 12px', textAlign: 'right',
                              fontFamily: 'JetBrains Mono, monospace', fontWeight: isBest ? 800 : 500,
                              color: isBest ? '#00e676' : '#64748b',
                            }}>
                              {p ? p.toFixed(2) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Fair odds row */}
                    {Object.keys(fair_odds).length > 0 && (
                      <tr style={{ borderTop: '1px solid rgba(41,121,255,.25)', background: 'rgba(41,121,255,.04)' }}>
                        <td style={{ padding: '8px 12px', color: '#2979ff', fontWeight: 800 }}>Fair odds</td>
                        {selections.map(sel => (
                          <td key={sel} style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#2979ff' }}>
                            {fair_odds[sel] ? fair_odds[sel].toFixed(2) : '—'}
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Your edge */}
            {our_pick && our_pick.ev_percent > 0 && (
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#475569' }}>
                    Your edge on {our_pick.selection}
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 16, color: '#00c853' }}>
                    +{our_pick.ev_percent.toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${Math.min(our_pick.ev_percent * 6.5, 100)}%`, background: 'linear-gradient(90deg,#00c85388,#00c853)', borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  You get <b style={{ color: '#00e676' }}>{our_pick.odds.toFixed(2)}</b> at{' '}
                  <span style={{ textTransform: 'capitalize' }}>{bookieLabel(our_pick.bookie)}</span> — the fair
                  price is <b style={{ color: '#94a3b8' }}>{our_pick.fair_odds?.toFixed(2) ?? '—'}</b>.
                </div>
                <div style={{ marginTop: 12, display: 'flex' }}>
                  <BackButton
                    label={`Back ${our_pick.selection} — $${stakeFor(our_pick.kelly_percent).toFixed(0)}`}
                    onBack={() => logBet(our_pick, event.event_name, event.commence_time, event.sport_key)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse to one column on small screens */}
        <style>{`
          @media (max-width: 900px) {
            .match-detail-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
