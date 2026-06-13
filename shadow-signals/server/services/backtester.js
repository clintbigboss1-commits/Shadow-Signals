'use strict';
const { db } = require('../db');
const { calcEVPercent, removeVig, getSharpPrice, median } = require('./evCalculator');

const EV_MIN = 3.0;
const EV_MAX = 20;
const OUTLIER = 2.2;
const MIN_BOOKS = 4;

// ── Run the EV algorithm over historical odds, compare to real outcomes ──────
// Returns accuracy breakdown by EV bucket + overall stats.
// hoursBeforeKickoff: which snapshot window to use (default 24h)
async function runBacktest({ sportKey = null, hoursBeforeKickoff = 24 } = {}) {
  console.log(`🔬 Backtesting EV signals (${hoursBeforeKickoff}h window)${sportKey ? ` for ${sportKey}` : ''}...`);

  // Pull completed games with known winners
  const resultsQ = await db.query(
    `SELECT event_id, sport_key, home_team, away_team, winner
     FROM game_results
     WHERE completed = TRUE AND winner IS NOT NULL
     ${sportKey ? 'AND sport_key = $1' : ''}
     ORDER BY commence_time DESC
     LIMIT 500`,
    sportKey ? [sportKey] : []
  );
  if (!resultsQ.rows.length) {
    return { signals: 0, wins: 0, winRate: null, roi: null, evBuckets: [], sampleSize: 0 };
  }

  const winnerByEvent = {};
  for (const r of resultsQ.rows) {
    winnerByEvent[r.event_id] = { winner: r.winner, home: r.home_team, away: r.away_team };
  }

  const eventIds = resultsQ.rows.map(r => r.event_id);
  const windowLow = hoursBeforeKickoff - 8;
  const windowHigh = hoursBeforeKickoff + 8;

  // Pull historical odds for those events in the target window
  const oddsQ = await db.query(
    `SELECT event_id, sport_key, bookmaker, selection, odds, snapshot_time, hours_before_kickoff
     FROM historical_odds
     WHERE event_id = ANY($1)
       AND hours_before_kickoff BETWEEN $2 AND $3
       AND market = 'h2h'`,
    [eventIds, windowLow, windowHigh]
  );

  if (!oddsQ.rows.length) {
    return { signals: 0, wins: 0, winRate: null, roi: null, evBuckets: [], sampleSize: resultsQ.rows.length };
  }

  // Group: event → bookmaker → selection → best price in window
  const events = {};
  for (const row of oddsQ.rows) {
    if (!events[row.event_id]) events[row.event_id] = { event_id: row.event_id, bookmakers: {} };
    if (!events[row.event_id].bookmakers[row.bookmaker])
      events[row.event_id].bookmakers[row.bookmaker] = {};
    const cur = events[row.event_id].bookmakers[row.bookmaker][row.selection];
    if (!cur || parseFloat(row.odds) > cur) {
      events[row.event_id].bookmakers[row.bookmaker][row.selection] = parseFloat(row.odds);
    }
  }

  const signals = [];

  for (const [eventId, event] of Object.entries(events)) {
    const result = winnerByEvent[eventId];
    if (!result) continue;

    const selections = [...new Set(
      Object.values(event.bookmakers).flatMap(b => Object.keys(b))
    )];
    if (selections.length < 2) continue;

    // Per-selection medians + thin market guard
    const medians = {};
    let thin = false;
    for (const sel of selections) {
      const prices = Object.values(event.bookmakers).map(b => b[sel]).filter(Boolean);
      if (prices.length < MIN_BOOKS) { thin = true; break; }
      medians[sel] = median(prices);
    }
    if (thin) continue;

    // Sharp consensus vector (same logic as live evCalculator)
    const sharpVector = selections.map(sel => {
      const p = getSharpPrice(event.bookmakers, sel);
      return (p && p > medians[sel] * OUTLIER) ? medians[sel] : p;
    });
    if (sharpVector.some(p => !p)) continue;
    const fairProbs = removeVig(sharpVector);

    for (let i = 0; i < selections.length; i++) {
      const sel = selections[i];
      const fairOdds = 1 / fairProbs[i];
      let best = null;

      for (const [bookie, prices] of Object.entries(event.bookmakers)) {
        if (['betfair_ex_au', 'pinnacle'].includes(bookie)) continue;
        const bookedOdds = prices[sel];
        if (!bookedOdds) continue;
        if (bookedOdds > medians[sel] * OUTLIER) continue;
        const ev = calcEVPercent(bookedOdds, fairOdds);
        if (ev < EV_MIN || ev > EV_MAX) continue;
        if (!best || ev > best.ev) best = { bookie, bookedOdds, ev };
      }
      if (!best) continue;

      // Map selection name to actual outcome
      const { winner, home, away } = result;
      let won = false;
      const selNorm = sel.toLowerCase().replace(/[^a-z0-9]/g, '');
      const homeNorm = home.toLowerCase().replace(/[^a-z0-9]/g, '');
      const awayNorm = away.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (winner === 'home' && (selNorm === homeNorm || homeNorm.includes(selNorm) || selNorm.includes(homeNorm))) won = true;
      if (winner === 'away' && (selNorm === awayNorm || awayNorm.includes(selNorm) || selNorm.includes(awayNorm))) won = true;
      if (winner === 'draw' && selNorm.includes('draw')) won = true;

      signals.push({
        eventId,
        selection: sel,
        ev_percent: parseFloat(best.ev.toFixed(2)),
        bookie_odds: best.bookedOdds,
        fair_odds: parseFloat(fairOdds.toFixed(3)),
        won,
      });
    }
  }

  if (!signals.length) {
    return { signals: 0, wins: 0, winRate: null, roi: null, evBuckets: [], sampleSize: resultsQ.rows.length };
  }

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const wins = signals.filter(s => s.won).length;
  const winRate = ((wins / signals.length) * 100).toFixed(1);

  // Simple flat-stake ROI: bet $100 each signal, collect odds if won, lose $100 if not
  const totalStaked = signals.length * 100;
  const totalReturned = signals.reduce((sum, s) => sum + (s.won ? s.bookie_odds * 100 : 0), 0);
  const roi = (((totalReturned - totalStaked) / totalStaked) * 100).toFixed(2);

  // EV buckets — proves the model: higher EV should = higher win rate + ROI
  const buckets = [
    { label: '3–5% EV',  min: 3,  max: 5  },
    { label: '5–8% EV',  min: 5,  max: 8  },
    { label: '8–12% EV', min: 8,  max: 12 },
    { label: '12%+ EV',  min: 12, max: 100 },
  ];

  const evBuckets = buckets.map(b => {
    const inBucket = signals.filter(s => s.ev_percent >= b.min && s.ev_percent < b.max);
    const bWins = inBucket.filter(s => s.won).length;
    const bStaked = inBucket.length * 100;
    const bReturned = inBucket.reduce((sum, s) => sum + (s.won ? s.bookie_odds * 100 : 0), 0);
    return {
      label: b.label,
      signals: inBucket.length,
      wins: bWins,
      winRate: inBucket.length ? ((bWins / inBucket.length) * 100).toFixed(1) : null,
      roi: inBucket.length ? (((bReturned - bStaked) / bStaked) * 100).toFixed(2) : null,
    };
  });

  console.log(`✅ Backtest: ${signals.length} signals, ${winRate}% win rate, ${roi}% ROI`);
  return {
    signals: signals.length,
    wins,
    winRate,
    roi,
    evBuckets,
    sampleSize: resultsQ.rows.length,
    hoursBeforeKickoff,
  };
}

// ── Quick summary for API response ──────────────────────────────────────────
async function getBacktestSummary() {
  const [overall, byWindow] = await Promise.all([
    runBacktest(),
    Promise.all([
      runBacktest({ hoursBeforeKickoff: 6 }),
      runBacktest({ hoursBeforeKickoff: 24 }),
    ]),
  ]);
  return {
    overall,
    windows: [
      { label: '6h before kickoff',  ...byWindow[0] },
      { label: '24h before kickoff', ...byWindow[1] },
    ],
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { runBacktest, getBacktestSummary };
