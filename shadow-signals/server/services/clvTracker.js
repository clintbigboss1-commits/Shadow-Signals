'use strict';
const { db } = require('../db');
const { getSharpPrice, removeVig, median } = require('./evCalculator');

const SHARP_BOOKS = ['betfair_ex_au', 'pinnacle'];
const OUTLIER_RATIO = 2.2;

// Called from evCalculator when a new EV opportunity is found.
// Inserts a CLV record with signal details; ON CONFLICT DO NOTHING
// so the first signal time is preserved if the signal re-fires.
async function recordSignal(opp) {
  try {
    await db.query(
      `INSERT INTO clv_tracking
       (event_id, sport_key, event_name, market, selection, bookie,
        signal_odds, signal_fair_odds, signal_ev_percent, signal_source,
        signal_at, commence_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),$11)
       ON CONFLICT (event_id, market, selection, bookie) DO NOTHING`,
      [
        opp.event_id, opp.sport_key, opp.event_name,
        opp.market, opp.selection, opp.bookie,
        opp.bookie_odds, opp.fair_odds, opp.ev_percent, opp.source,
        opp.commence_time,
      ]
    );
  } catch (_) {
    // CLV tracking is best-effort — never crash the main EV loop
  }
}

// Run every 5 minutes from scheduler.
// Finds CLV records for events starting within the next 30 minutes
// that haven't been closed yet, then captures the current sharp price
// from odds_cache as the closing line.
async function captureClosingLines() {
  const { rows: pending } = await db.query(`
    SELECT c.id, c.event_id, c.sport_key, c.market, c.selection
    FROM clv_tracking c
    WHERE c.closed_at IS NULL
      AND c.commence_time IS NOT NULL
      AND c.commence_time BETWEEN NOW() - INTERVAL '5 minutes'
                               AND NOW() + INTERVAL '30 minutes'
  `);

  if (pending.length === 0) return;

  let closed = 0;
  for (const row of pending) {
    // Pull current odds_cache for this event
    const { rows: cacheRows } = await db.query(`
      SELECT bookmaker, selection, odds
      FROM odds_cache
      WHERE event_id = $1 AND market = $2 AND expires_at > NOW()
    `, [row.event_id, row.market]);

    if (cacheRows.length === 0) continue;

    // Rebuild bookmaker map
    const bookmakerMap = {};
    for (const r of cacheRows) {
      if (!bookmakerMap[r.bookmaker]) bookmakerMap[r.bookmaker] = {};
      bookmakerMap[r.bookmaker][r.selection] = parseFloat(r.odds);
    }

    // Get all selections for this event
    const selections = [...new Set(cacheRows.map(r => r.selection))];
    if (selections.length < 2) continue;

    // Build median prices
    const medians = {};
    let thin = false;
    for (const sel of selections) {
      const prices = Object.values(bookmakerMap).map(b => b[sel]).filter(Boolean);
      if (prices.length < 2) { thin = true; break; }
      medians[sel] = median(prices);
    }
    if (thin) continue;

    // Get sharp closing price for the specific selection
    const closingRaw = getSharpPrice(bookmakerMap, row.selection);
    if (!closingRaw) continue;
    const closingOdds = (closingRaw > medians[row.selection] * OUTLIER_RATIO)
      ? medians[row.selection]
      : closingRaw;

    // Compute closing fair odds via de-vig over all selections
    const sharpVector = selections.map(sel => {
      const p = getSharpPrice(bookmakerMap, sel);
      if (!p) return medians[sel];
      return p > medians[sel] * OUTLIER_RATIO ? medians[sel] : p;
    });
    const fairProbs = removeVig(sharpVector);
    const selIdx = selections.indexOf(row.selection);
    if (selIdx === -1 || !fairProbs[selIdx]) continue;

    const closingFairOdds = parseFloat((1 / fairProbs[selIdx]).toFixed(4));

    // CLV% = (signal_odds / closing_fair_odds - 1) * 100
    // Positive = we beat the closing line
    const { rows: signalRows } = await db.query(
      'SELECT signal_odds FROM clv_tracking WHERE id = $1', [row.id]
    );
    if (!signalRows.length) continue;
    const signalOdds = parseFloat(signalRows[0].signal_odds);
    const clvPercent = parseFloat(((signalOdds / closingFairOdds - 1) * 100).toFixed(3));

    await db.query(
      `UPDATE clv_tracking
       SET closing_odds = $1, closing_fair_odds = $2, clv_percent = $3, closed_at = NOW()
       WHERE id = $4`,
      [closingOdds, closingFairOdds, clvPercent, row.id]
    );
    closed++;
  }

  if (closed > 0) console.log(`📊 CLV: captured closing lines for ${closed} signal(s)`);
}

// Admin summary: CLV beat rate + average, broken down by source and sport.
async function getCLVReport() {
  const { rows: overall } = await db.query(`
    SELECT
      COUNT(*)::int AS total_signals,
      COUNT(closed_at)::int AS closed,
      ROUND(AVG(clv_percent)::numeric, 2) AS avg_clv,
      ROUND(
        100.0 * COUNT(CASE WHEN clv_percent > 0 THEN 1 END)::numeric
        / NULLIF(COUNT(closed_at), 0), 1
      ) AS beat_rate_pct
    FROM clv_tracking
  `);

  const { rows: by_source } = await db.query(`
    SELECT
      signal_source,
      COUNT(*)::int AS n,
      COUNT(closed_at)::int AS closed,
      ROUND(AVG(clv_percent)::numeric, 2) AS avg_clv,
      ROUND(
        100.0 * COUNT(CASE WHEN clv_percent > 0 THEN 1 END)::numeric
        / NULLIF(COUNT(closed_at), 0), 1
      ) AS beat_rate_pct
    FROM clv_tracking
    GROUP BY signal_source
    ORDER BY n DESC
  `);

  const { rows: by_sport } = await db.query(`
    SELECT
      sport_key,
      COUNT(*)::int AS n,
      COUNT(closed_at)::int AS closed,
      ROUND(AVG(clv_percent)::numeric, 2) AS avg_clv,
      ROUND(
        100.0 * COUNT(CASE WHEN clv_percent > 0 THEN 1 END)::numeric
        / NULLIF(COUNT(closed_at), 0), 1
      ) AS beat_rate_pct
    FROM clv_tracking
    GROUP BY sport_key
    ORDER BY n DESC
  `);

  const { rows: recent } = await db.query(`
    SELECT
      event_name, selection, bookie, sport_key,
      signal_odds, signal_fair_odds, signal_ev_percent, signal_source,
      closing_fair_odds, clv_percent, signal_at, commence_time
    FROM clv_tracking
    WHERE closed_at IS NOT NULL
    ORDER BY closed_at DESC
    LIMIT 50
  `);

  return { overall: overall[0], by_source, by_sport, recent };
}

module.exports = { recordSignal, captureClosingLines, getCLVReport };
