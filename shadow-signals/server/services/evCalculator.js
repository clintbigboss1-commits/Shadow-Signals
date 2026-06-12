'use strict';
const { db } = require('../db');

// Remove bookmaker margin — return array of fair probabilities
function removeVig(oddsArray) {
  const probs = oddsArray.map(o => 1 / o);
  const total = probs.reduce((a, b) => a + b, 0);
  return probs.map(p => p / total);
}

// Calculate EV as a percentage
function calcEVPercent(bookedOdds, fairOdds) {
  const winProb = 1 / fairOdds;
  return ((bookedOdds - 1) * winProb - (1 - winProb)) * 100;
}

// Fractional Kelly criterion
function kellyFraction(bookedOdds, fairOdds, fraction = 0.25) {
  const winProb = 1 / fairOdds;
  const b = bookedOdds - 1;
  if (b <= 0) return 0;
  const k = (b * winProb - (1 - winProb)) / b;
  return parseFloat((Math.max(0, k * fraction) * 100).toFixed(3));
}

// A real edge is 2-15%. Anything above this is stale or broken source data,
// and publishing it destroys member trust — discard, never display.
const EV_MAX_PERCENT = 20;
// A price this far above the market median is a stale/error price.
const OUTLIER_RATIO = 2.5;
// Need a real market to estimate fair odds from.
const MIN_BOOKS_PER_SELECTION = 3;

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
}

// Get the sharpest available price for a selection
function getSharpPrice(bookmakerMap, selection) {
  const SHARP_PRIORITY = ['betfair_ex_au', 'pinnacle', 'bet365', 'bet365_au', 'unibet'];
  for (const sharp of SHARP_PRIORITY) {
    if (bookmakerMap[sharp] && bookmakerMap[sharp][selection]) {
      return bookmakerMap[sharp][selection];
    }
  }
  // Fallback: median of all available prices
  const prices = Object.values(bookmakerMap)
    .map(b => b[selection])
    .filter(Boolean);
  return median(prices);
}

// Main: compute EV from cached odds — ZERO API calls
async function computeEVFromCache(sportKey = null) {
  console.log(`🧮 Computing EV from cache${sportKey ? ` for ${sportKey}` : ''}...`);
  const t = Date.now();

  let query = `
    SELECT DISTINCT ON (event_id, selection, bookmaker)
      sport_key, event_id, home_team, away_team,
      commence_time, bookmaker, market, selection, odds
    FROM odds_cache
    WHERE expires_at > NOW() AND market = 'h2h'
  `;
  const params = [];
  if (sportKey) {
    query += ' AND sport_key = $1';
    params.push(sportKey);
  }
  query += ' ORDER BY event_id, selection, bookmaker, fetched_at DESC';

  const raw = await db.query(query, params);
  if (raw.rows.length === 0) {
    console.log('⚠️  No cached odds to compute EV from');
    return [];
  }

  // Group into events → bookmakers → selections → price
  const events = {};
  for (const row of raw.rows) {
    if (!events[row.event_id]) {
      events[row.event_id] = {
        sport_key: row.sport_key,
        event_id: row.event_id,
        event_name: `${row.home_team} v ${row.away_team}`,
        home_team: row.home_team,
        away_team: row.away_team,
        commence_time: row.commence_time,
        bookmakers: {},
      };
    }
    const e = events[row.event_id];
    if (!e.bookmakers[row.bookmaker]) e.bookmakers[row.bookmaker] = {};
    e.bookmakers[row.bookmaker][row.selection] = parseFloat(row.odds);
  }

  const opportunities = [];
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Deactivate stale opportunities
    if (sportKey) {
      await client.query(
        'UPDATE ev_opportunities SET is_active = FALSE WHERE sport_key = $1',
        [sportKey]
      );
    } else {
      await client.query('UPDATE ev_opportunities SET is_active = FALSE');
    }

    for (const event of Object.values(events)) {
      // Skip games that already started — stale prices masquerade as edges
      if (event.commence_time && new Date(event.commence_time).getTime() < Date.now()) continue;

      // Collect all unique selections across all bookmakers
      const selections = [...new Set(
        Object.values(event.bookmakers).flatMap(b => Object.keys(b))
      )];
      if (selections.length < 2) continue;

      // Per-selection market medians — used to spot stale outlier prices
      const medians = {};
      let thinMarket = false;
      for (const sel of selections) {
        const prices = Object.values(event.bookmakers).map(b => b[sel]).filter(Boolean);
        if (prices.length < MIN_BOOKS_PER_SELECTION) { thinMarket = true; break; }
        medians[sel] = median(prices);
      }
      if (thinMarket) continue;

      // Proper no-vig over the FULL outcome set (handles 2-way and 3-way)
      const sharpVector = selections.map(sel => {
        const p = getSharpPrice(event.bookmakers, sel);
        // A "sharp" price that is itself an outlier is not sharp — fall back to median
        if (p && p > medians[sel] * OUTLIER_RATIO) return medians[sel];
        return p;
      });
      if (sharpVector.some(p => !p)) continue;
      const fairProbs = removeVig(sharpVector);

      // Best +EV per (event, selection) — one card per real opportunity,
      // not one per bookmaker
      for (let i = 0; i < selections.length; i++) {
        const sel = selections[i];
        const fairOdds = 1 / fairProbs[i];
        let best = null;

        for (const [bookie, prices] of Object.entries(event.bookmakers)) {
          if (['betfair_ex_au', 'pinnacle'].includes(bookie)) continue;
          const bookedOdds = prices[sel];
          if (!bookedOdds) continue;

          // Stale/error price guard — a book miles off the market is not an edge
          if (bookedOdds > medians[sel] * OUTLIER_RATIO) continue;

          const ev = calcEVPercent(bookedOdds, fairOdds);
          if (ev < 2.0) continue;           // Minimum 2% threshold
          if (ev > EV_MAX_PERCENT) continue; // Data error, never display

          if (!best || ev > best.ev) best = { bookie, bookedOdds, ev };
        }

        if (!best) continue;

        const kelly = kellyFraction(best.bookedOdds, fairOdds);
        const expires = new Date(Date.now() + 2 * 3600 * 1000);

        const opp = {
          sport_key: event.sport_key,
          event_id: event.event_id,
          event_name: event.event_name,
          market: 'h2h',
          selection: sel,
          bookie: best.bookie,
          bookie_odds: best.bookedOdds,
          fair_odds: parseFloat(fairOdds.toFixed(3)),
          ev_percent: parseFloat(best.ev.toFixed(2)),
          kelly_percent: kelly,
          commence_time: event.commence_time,
          expires_at: expires,
        };

        opportunities.push(opp);

        // UPSERT to enforce single card per (event_id, market, selection)
        // (ev_opportunities now has UNIQUE(event_id, market, selection))
        await client.query(
          `INSERT INTO ev_opportunities
           (sport_key, event_id, event_name, market, selection, bookie,
            bookie_odds, fair_odds, ev_percent, kelly_percent,
            commence_time, expires_at, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,TRUE)
           ON CONFLICT (event_id, market, selection)
           DO UPDATE SET
             sport_key = EXCLUDED.sport_key,
             event_name = EXCLUDED.event_name,
             bookie = EXCLUDED.bookie,
             bookie_odds = EXCLUDED.bookie_odds,
             fair_odds = EXCLUDED.fair_odds,
             ev_percent = EXCLUDED.ev_percent,
             kelly_percent = EXCLUDED.kelly_percent,
             commence_time = EXCLUDED.commence_time,
             expires_at = EXCLUDED.expires_at,
             found_at = NOW(),
             is_active = TRUE`,
          [
            opp.sport_key, opp.event_id, opp.event_name,
            opp.market, opp.selection, opp.bookie,
            opp.bookie_odds, opp.fair_odds, opp.ev_percent,
            opp.kelly_percent, opp.commence_time, opp.expires_at,
          ]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('EV compute error:', err.message);
  } finally {
    client.release();
  }

  console.log(`✅ EV: ${opportunities.length} opportunities in ${Date.now() - t}ms (0 API calls)`);
  return opportunities.sort((a, b) => b.ev_percent - a.ev_percent);
}

module.exports = { computeEVFromCache, calcEVPercent, kellyFraction, removeVig, getSharpPrice, median };
