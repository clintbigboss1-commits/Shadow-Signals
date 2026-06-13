'use strict';
const axios = require('axios');
const { db } = require('../db');

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4';
const REGIONS = process.env.THE_ODDS_API_REGIONS || 'au,eu';

// In-season sports we want results + history for
const RESULT_SPORTS = [
  'aussierules_afl',
  'rugbyleague_nrl',
  'rugbyleague_nrl_state_of_origin',
  'basketball_nba',
  'baseball_mlb',
  'icehockey_nhl',
  'americanfootball_nfl',
  'mma_mixed_martial_arts',
  'soccer_fifa_world_cup',
  'soccer_epl',
  'soccer_ucl',
  'soccer_conmebol_copa_libertadores',
  'soccer_mls',
  'cricket_international_t20',
  'cricket_odi',
];

function logCredits(res) {
  const rem = res.headers?.['x-requests-remaining'];
  const used = res.headers?.['x-requests-used'];
  if (rem !== undefined) console.log(`📊 Credits: ${used} used, ${rem} remaining`);
}

// ── Scores: fetch completed game results ────────────────────────────────────
// Cost: 2 credits per sport. Run daily.
async function fetchScoresForSport(sportKey, daysFrom = 3) {
  try {
    const r = await axios.get(`${BASE_URL}/sports/${sportKey}/scores`, {
      params: { apiKey: ODDS_API_KEY, daysFrom, dateFormat: 'iso' },
      timeout: 15000,
    });
    logCredits(r);
    const completed = (r.data || []).filter(g => g.completed);
    if (!completed.length) return 0;

    for (const game of completed) {
      const homeScore = game.scores?.find(s => s.name === game.home_team)?.score ?? null;
      const awayScore = game.scores?.find(s => s.name === game.away_team)?.score ?? null;
      const h = parseFloat(homeScore);
      const a = parseFloat(awayScore);
      const winner = (!isNaN(h) && !isNaN(a))
        ? (h > a ? 'home' : a > h ? 'away' : 'draw')
        : null;

      await db.query(
        `INSERT INTO game_results
           (event_id, sport_key, home_team, away_team, commence_time,
            home_score, away_score, winner, completed)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)
         ON CONFLICT (event_id) DO UPDATE SET
           winner     = EXCLUDED.winner,
           home_score = EXCLUDED.home_score,
           away_score = EXCLUDED.away_score,
           completed  = TRUE,
           fetched_at = NOW()`,
        [
          game.id, sportKey, game.home_team, game.away_team,
          game.commence_time, homeScore, awayScore, winner,
        ]
      );
    }
    console.log(`✅ Scores ${sportKey}: ${completed.length} results stored`);
    return completed.length;
  } catch (err) {
    console.error(`Scores fetch error [${sportKey}]:`, err.response?.data || err.message);
    return 0;
  }
}

// ── Historical odds: fetch odds snapshot at a specific ISO timestamp ─────────
// One call per (sport, timestamp) returns ALL games at that moment.
// Cost: 10 credits per call.
async function fetchHistoricalSnapshot(sportKey, isoTimestamp) {
  try {
    const r = await axios.get(`${BASE_URL}/historical/sports/${sportKey}/odds`, {
      params: {
        apiKey: ODDS_API_KEY,
        date: isoTimestamp,
        markets: 'h2h',
        regions: REGIONS,
        dateFormat: 'iso',
      },
      timeout: 20000,
    });
    logCredits(r);
    return r.data?.data || [];
  } catch (err) {
    if (err.response?.status === 422) return []; // no data at that timestamp — not an error
    console.error(`Historical fetch error [${sportKey} @ ${isoTimestamp}]:`, err.response?.data || err.message);
    return [];
  }
}

async function storeHistoricalOdds(games, snapshotTime) {
  let stored = 0;
  for (const game of games) {
    for (const bookie of (game.bookmakers || [])) {
      for (const market of (bookie.markets || [])) {
        if (market.key !== 'h2h') continue;
        for (const outcome of (market.outcomes || [])) {
          const hbk = (new Date(game.commence_time) - new Date(snapshotTime)) / 3_600_000;
          try {
            await db.query(
              `INSERT INTO historical_odds
                 (event_id, sport_key, snapshot_time, bookmaker, market,
                  selection, odds, hours_before_kickoff)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
               ON CONFLICT (event_id, snapshot_time, bookmaker, market, selection)
               DO NOTHING`,
              [
                game.id, game.sport_key, snapshotTime,
                bookie.key, market.key, outcome.name, outcome.price, hbk,
              ]
            );
            stored++;
          } catch (_) {}
        }
      }
    }
  }
  return stored;
}

// ── Backfill: for each completed game we don't have history on, fetch it ────
// Looks back at most 14 days. Runs weekly.
// Strategy: group completed games by sport → find unique snapshot times
// (game_start - 24h, game_start - 6h) → one API call per unique timestamp.
async function backfillHistoricalOdds() {
  console.log('📦 Starting historical odds backfill...');
  const cutoff = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();

  const results = await db.query(
    `SELECT event_id, sport_key, commence_time FROM game_results
     WHERE completed = TRUE AND commence_time > $1`,
    [cutoff]
  );
  if (!results.rows.length) {
    console.log('No completed games to backfill.');
    return;
  }

  // Group by sport
  const bySport = {};
  for (const row of results.rows) {
    if (!bySport[row.sport_key]) bySport[row.sport_key] = [];
    bySport[row.sport_key].push(row);
  }

  let totalCalls = 0;
  let totalRows = 0;

  for (const [sportKey, games] of Object.entries(bySport)) {
    if (!RESULT_SPORTS.includes(sportKey)) continue;

    // Build unique snapshot timestamps: 24h and 6h before each game
    const snapshotSet = new Set();
    for (const game of games) {
      const kick = new Date(game.commence_time).getTime();
      // Round to nearest hour to batch games kicking off close together
      snapshotSet.add(new Date(kick - 24 * 3600_000).toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00.000Z'));
      snapshotSet.add(new Date(kick - 6 * 3600_000).toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00.000Z'));
    }

    for (const snap of snapshotSet) {
      // Skip if in the future
      if (new Date(snap) > new Date()) continue;

      // Check if we already have data for this sport+snapshot
      const existing = await db.query(
        `SELECT 1 FROM historical_odds WHERE sport_key = $1 AND snapshot_time = $2 LIMIT 1`,
        [sportKey, snap]
      );
      if (existing.rows.length) continue;

      const games = await fetchHistoricalSnapshot(sportKey, snap);
      totalCalls++;
      if (games.length) {
        const n = await storeHistoricalOdds(games, snap);
        totalRows += n;
      }

      // Brief pause to avoid hammering the API
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`✅ Backfill complete: ${totalCalls} API calls (${totalCalls * 10} credits), ${totalRows} rows stored`);
}

// ── Daily score sweep across all result sports ───────────────────────────────
async function fetchAllScores() {
  console.log('📋 Fetching scores for in-season sports...');
  const now = new Date().getMonth() + 1;

  // Only fetch sports that could have recent completed games
  const active = RESULT_SPORTS.filter(s => {
    // Rough in-season checks — avoid wasting credits on off-season sports
    if (s.includes('nba') && ![10,11,12,1,2,3,4,5,6].includes(now)) return false;
    if (s.includes('nfl') && ![9,10,11,12,1,2].includes(now)) return false;
    if (s.includes('nhl') && ![10,11,12,1,2,3,4,5,6].includes(now)) return false;
    if (s.includes('mlb') && ![4,5,6,7,8,9,10].includes(now)) return false;
    if (s.includes('epl') && ![8,9,10,11,12,1,2,3,4,5].includes(now)) return false;
    if (s.includes('world_cup') && ![6,7].includes(now)) return false;
    return true;
  });

  let total = 0;
  for (const sport of active) {
    total += await fetchScoresForSport(sport, 3);
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`✅ Scores sweep: ${total} results across ${active.length} sports`);
}

module.exports = { fetchAllScores, backfillHistoricalOdds, fetchScoresForSport };
