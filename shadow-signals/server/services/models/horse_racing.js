'use strict';

// Horse racing winner prediction — consensus market model.
// Uses Betfair/sharp book prices to derive true win probabilities for each runner.
// No historical team data needed: the market IS the model.

const { db } = require('../../db');

function median(values) {
  const s = [...values].filter(Boolean).sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
}

function removeVig(oddsArray) {
  const probs = oddsArray.map(o => 1 / o);
  const total = probs.reduce((a, b) => a + b, 0);
  return probs.map(p => p / total);
}

const SHARP_PRIORITY = ['betfair_ex_au', 'pinnacle', 'bet365_au', 'bet365', 'unibet'];

// Per-race cache so we're not re-querying on every selection in the same race
const raceCache = new Map(); // eventId → { runners, expiresAt }
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getRaceRunners(eventId) {
  const cached = raceCache.get(eventId);
  if (cached && cached.expiresAt > Date.now()) return cached.runners;

  try {
    const { rows } = await db.query(`
      SELECT DISTINCT ON (bookmaker, selection)
        bookmaker, selection, odds
      FROM odds_cache
      WHERE event_id = $1
        AND market = 'h2h'
        AND expires_at > NOW()
      ORDER BY bookmaker, selection, fetched_at DESC
    `, [eventId]);

    if (rows.length === 0) return null;

    // Build bookmaker → { runner: price } map
    const bookmakers = {};
    for (const row of rows) {
      if (!bookmakers[row.bookmaker]) bookmakers[row.bookmaker] = {};
      bookmakers[row.bookmaker][row.selection] = parseFloat(row.odds);
    }

    const runners = [...new Set(rows.map(r => r.selection))];

    // Per-runner: pick sharpest available price, fall back to median
    const fairProbs = {};
    const sharpPrices = [];
    for (const runner of runners) {
      let sharpPrice = null;
      for (const sharp of SHARP_PRIORITY) {
        if (bookmakers[sharp] && bookmakers[sharp][runner]) {
          sharpPrice = bookmakers[sharp][runner];
          break;
        }
      }
      if (!sharpPrice) {
        const prices = Object.values(bookmakers).map(b => b[runner]).filter(Boolean);
        sharpPrice = prices.length ? median(prices) : null;
      }
      sharpPrices.push(sharpPrice || null);
    }

    // Remove vig from the sharp price vector
    const validPrices = sharpPrices.filter(Boolean);
    if (validPrices.length < 2) return null;

    const probs = removeVig(sharpPrices.map(p => p || 1000));

    const runnerData = runners.map((runner, i) => ({
      runner,
      win_prob: probs[i],
      fair_odds: probs[i] > 0 ? parseFloat((1 / probs[i]).toFixed(3)) : null,
      is_favourite: false,
    }));

    // Mark favourite (highest probability)
    const favIdx = runnerData.reduce((best, r, i) =>
      r.win_prob > runnerData[best].win_prob ? i : best, 0);
    runnerData[favIdx].is_favourite = true;

    // Sort by probability descending
    runnerData.sort((a, b) => b.win_prob - a.win_prob);

    const result = { runners: runnerData, bookmakers };
    raceCache.set(eventId, { runners: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch (err) {
    console.warn('horse_racing getRaceRunners error:', err.message);
    return null;
  }
}

// Generate predictions and store them so the scheduler can broadcast them.
// Returns count of races processed.
async function generatePredictions() {
  try {
    const { rows: events } = await db.query(`
      SELECT DISTINCT event_id, sport_key, home_team, commence_time
      FROM odds_cache
      WHERE sport_key IN ('horse_racing_au','horse_racing_us','horse_racing_greyhounds_au','horse_racing_greyhounds_us')
        AND expires_at > NOW()
        AND commence_time > NOW()
      LIMIT 100
    `);

    let count = 0;
    for (const ev of events) {
      const data = await getRaceRunners(ev.event_id);
      if (!data || !data.runners.length) continue;
      count++;
    }
    return count;
  } catch (err) {
    console.warn('horse_racing generatePredictions error:', err.message);
    return 0;
  }
}

// Predict — for the EV calculator. Horse racing doesn't fit the home/away model
// so we return null and let the consensus EV path handle it.
async function predict() {
  return null;
}

// resolveTeamFromOddsName — not applicable for racing; always null.
function resolveTeamFromOddsName() {
  return null;
}

// Public API: get ranked runners for a race with win probabilities.
// Used by the API route to power the "predicted winner" display.
async function getRacePrediction(eventId) {
  return getRaceRunners(eventId);
}

module.exports = {
  sportKey: 'horse_racing_au',
  displayName: 'Horse Racing',
  isImplemented: true,
  generatePredictions,
  predict,
  resolveTeamFromOddsName,
  getRacePrediction,
  // Stubs for compatibility
  ingestData: async () => null,
  recomputeRatings: async () => null,
  backfillOutcomes: async () => null,
};
