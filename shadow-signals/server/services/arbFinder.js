'use strict';
const { db } = require('../db');

// Real arbs are 0.5-4%. Bigger "profit" means one price is stale/wrong —
// publishing it would send members chasing bets that no longer exist.
const ARB_MAX_PROFIT = 8;
const OUTLIER_RATIO = 2.5;

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
}

async function findArbs() {
  console.log('🔍 Scanning for arbitrage...');

  // Per-selection market medians — to reject stale outlier prices
  const allOdds = await db.query(`
    SELECT event_id, selection, odds FROM odds_cache
    WHERE expires_at > NOW() AND market = 'h2h'
  `);
  const priceMap = {};
  for (const r of allOdds.rows) {
    const k = `${r.event_id}|${r.selection}`;
    (priceMap[k] = priceMap[k] || []).push(parseFloat(r.odds));
  }
  const medians = {};
  for (const [k, prices] of Object.entries(priceMap)) medians[k] = median(prices);

  const result = await db.query(`
    SELECT
      a.event_id,
      a.home_team || ' v ' || a.away_team AS event_name,
      a.sport_key,
      a.bookmaker  AS bookie_1,
      a.selection  AS selection_1,
      a.odds       AS odds_1,
      b.bookmaker  AS bookie_2,
      b.selection  AS selection_2,
      b.odds       AS odds_2,
      a.commence_time
    FROM odds_cache a
    JOIN odds_cache b ON (
      a.event_id  = b.event_id
      AND a.market    = 'h2h'
      AND b.market    = 'h2h'
      AND a.bookmaker != b.bookmaker
      AND a.selection != b.selection
    )
    WHERE a.expires_at > NOW()
      AND b.expires_at > NOW()
      AND a.commence_time > NOW()
    ORDER BY a.event_id
  `);

  const arbs = [];
  const seen = new Set();

  for (const row of result.rows) {
    // Deduplicate: canonicalise bookie pair
    const pairKey = [row.event_id, row.bookie_1, row.bookie_2].sort().join(':');
    if (seen.has(pairKey)) continue;
    seen.add(pairKey);

    const o1 = parseFloat(row.odds_1);
    const o2 = parseFloat(row.odds_2);

    // Stale-price guard: a leg far above the market median is a phantom arb
    const m1 = medians[`${row.event_id}|${row.selection_1}`];
    const m2 = medians[`${row.event_id}|${row.selection_2}`];
    if (m1 && o1 > m1 * OUTLIER_RATIO) continue;
    if (m2 && o2 > m2 * OUTLIER_RATIO) continue;

    const implied = (1 / o1) + (1 / o2);
    const profitPct = ((1 / implied) - 1) * 100;
    if (profitPct > ARB_MAX_PROFIT) continue; // data error, never display

    if (implied < 1.0) {
      const profit    = ((1 / implied) - 1) * 100;
      const stake1pct = ((1 / o1) / implied) * 100;
      const stake2pct = ((1 / o2) / implied) * 100;

      const arb = {
        sport_key:       row.sport_key,
        event_name:      row.event_name,
        market:          'h2h',
        bookie_1:        row.bookie_1,
        selection_1:     row.selection_1,
        odds_1:          o1,
        bookie_2:        row.bookie_2,
        selection_2:     row.selection_2,
        odds_2:          o2,
        profit_percent:  parseFloat(profit.toFixed(3)),
        stake_1_percent: parseFloat(stake1pct.toFixed(2)),
        stake_2_percent: parseFloat(stake2pct.toFixed(2)),
        commence_time:   row.commence_time,
      };

      arbs.push(arb);

      try {
        await db.query(
          `INSERT INTO arb_opportunities
           (sport_key, event_name, market,
            bookie_1, selection_1, odds_1,
            bookie_2, selection_2, odds_2,
            profit_percent, stake_1_percent, stake_2_percent)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT DO NOTHING`,
          [
            arb.sport_key, arb.event_name, arb.market,
            arb.bookie_1, arb.selection_1, arb.odds_1,
            arb.bookie_2, arb.selection_2, arb.odds_2,
            arb.profit_percent, arb.stake_1_percent, arb.stake_2_percent,
          ]
        );
      } catch (_) { /* non-fatal */ }
    }
  }

  console.log(`✅ Arbs: ${arbs.length} found (0 API calls)`);
  return arbs.sort((a, b) => b.profit_percent - a.profit_percent);
}

module.exports = { findArbs };
