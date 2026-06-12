'use strict';
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { db } = require('../db');

// Different source APIs assign different event_ids to the same fixture, so the
// feed can show the same match once per provider. Collapse copies by
// (sport, teams, ~3h start window) into one card carrying the best odds.
function normTeam(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function fixtureKey(game) {
  const teams = [normTeam(game.home_team), normTeam(game.away_team)].sort().join('|');
  return `${game.sport_key}|${teams}`;
}

function sameKickoff(a, b) {
  return Math.abs(new Date(a.commence_time) - new Date(b.commence_time)) <= 3 * 3600 * 1000;
}

function mergeFixture(into, dupe) {
  // Best price per selection across both copies (selection names matched loosely)
  for (const o of dupe.best_odds) {
    const existing = into.best_odds.find(e => normTeam(e.selection) === normTeam(o.selection));
    if (!existing) into.best_odds.push(o);
    else if (o.odds > existing.odds) {
      existing.odds = o.odds;
      existing.bookmaker = o.bookmaker;
    }
  }
  for (const [bookie, sels] of Object.entries(dupe.all_bookmakers)) {
    if (!into.all_bookmakers[bookie]) into.all_bookmakers[bookie] = sels;
  }
  into.bookmaker_count = Object.keys(into.all_bookmakers).length || into.bookmaker_count;
  if (dupe.ev_pick && (!into.ev_pick || dupe.ev_pick.ev_percent > into.ev_pick.ev_percent)) {
    into.ev_pick = dupe.ev_pick;
  }
}

function dedupeFixtures(games) {
  const byKey = new Map();
  const out = [];
  for (const game of games) {
    const key = fixtureKey(game);
    const candidates = byKey.get(key) || [];
    const match = candidates.find(c => sameKickoff(c, game));
    if (match) {
      // Keep the copy with deeper bookmaker coverage as the canonical card
      if (game.bookmaker_count > match.bookmaker_count) {
        mergeFixture(game, match);
        out[out.indexOf(match)] = game;
        candidates[candidates.indexOf(match)] = game;
      } else {
        mergeFixture(match, game);
      }
    } else {
      candidates.push(game);
      byKey.set(key, candidates);
      out.push(game);
    }
  }
  return out;
}

// GET /api/games — all upcoming events from odds cache, EV picks overlaid
router.get('/', requireAuth, async (req, res) => {
  try {
    const sport = req.query.sport || 'all';
    const limit = Math.min(parseInt(req.query.limit || '80', 10), 200);

    // One row per event_id, no matter how many metadata variants exist in the
    // cache (stale commence_time / team-name spelling differences between
    // bookmaker rows previously split the GROUP BY and produced duplicate
    // cards). The freshest row wins as the representative.
    let eventsQuery = `
      SELECT * FROM (
        SELECT DISTINCT ON (oc.event_id)
          oc.event_id,
          oc.sport_key,
          oc.home_team,
          oc.away_team,
          oc.commence_time,
          cnt.bookmaker_count
        FROM odds_cache oc
        JOIN (
          SELECT event_id, COUNT(DISTINCT bookmaker) AS bookmaker_count
          FROM odds_cache
          WHERE expires_at > NOW() AND market = 'h2h'
          GROUP BY event_id
        ) cnt ON cnt.event_id = oc.event_id
        WHERE oc.expires_at > NOW()
          AND oc.commence_time > NOW()
          AND oc.market = 'h2h'
          {{SPORT_FILTER}}
        ORDER BY oc.event_id, oc.fetched_at DESC
      ) ev
      ORDER BY ev.commence_time ASC
      LIMIT {{LIMIT}}
    `;
    const params = [];
    if (sport !== 'all') {
      params.push(sport);
      eventsQuery = eventsQuery.replace('{{SPORT_FILTER}}', `AND oc.sport_key = $${params.length}`);
    } else {
      eventsQuery = eventsQuery.replace('{{SPORT_FILTER}}', '');
    }
    params.push(limit);
    eventsQuery = eventsQuery.replace('{{LIMIT}}', `$${params.length}`);

    const eventsResult = await db.query(eventsQuery, params);
    if (eventsResult.rows.length === 0) {
      return res.json({ data: [], total: 0 });
    }

    const eventIds = eventsResult.rows.map(r => r.event_id);

    // Best h2h price per (event, selection) across all bookmakers
    const oddsResult = await db.query(
      `SELECT DISTINCT ON (event_id, selection)
         event_id, selection, bookmaker, odds
       FROM odds_cache
       WHERE event_id = ANY($1)
         AND market = 'h2h'
         AND expires_at > NOW()
       ORDER BY event_id, selection, odds DESC`,
      [eventIds]
    );

    // All bookmaker prices for h2h (for the odds comparison strip)
    const allOddsResult = await db.query(
      `SELECT DISTINCT ON (event_id, bookmaker, selection)
         event_id, bookmaker, selection, odds
       FROM odds_cache
       WHERE event_id = ANY($1)
         AND market = 'h2h'
         AND expires_at > NOW()
       ORDER BY event_id, bookmaker, selection, fetched_at DESC`,
      [eventIds]
    );

    // Best EV pick per event (if any)
    const evResult = await db.query(
      `SELECT DISTINCT ON (event_id)
         event_id, selection, bookie, bookie_odds, fair_odds,
         ev_percent, kelly_percent, market
       FROM ev_opportunities
       WHERE event_id = ANY($1)
         AND is_active = TRUE
         AND expires_at > NOW()
         AND commence_time > NOW()
       ORDER BY event_id, ev_percent DESC`,
      [eventIds]
    );

    // Index by event_id
    const bestOddsMap = {};
    for (const row of oddsResult.rows) {
      if (!bestOddsMap[row.event_id]) bestOddsMap[row.event_id] = [];
      bestOddsMap[row.event_id].push({
        selection: row.selection,
        bookmaker: row.bookmaker,
        odds: parseFloat(row.odds),
      });
    }

    const allOddsMap = {};
    for (const row of allOddsResult.rows) {
      if (!allOddsMap[row.event_id]) allOddsMap[row.event_id] = {};
      if (!allOddsMap[row.event_id][row.bookmaker]) allOddsMap[row.event_id][row.bookmaker] = {};
      allOddsMap[row.event_id][row.bookmaker][row.selection] = parseFloat(row.odds);
    }

    const evMap = {};
    for (const row of evResult.rows) {
      evMap[row.event_id] = {
        selection:     row.selection,
        bookie:        row.bookie,
        bookie_odds:   parseFloat(row.bookie_odds),
        fair_odds:     parseFloat(row.fair_odds),
        ev_percent:    parseFloat(row.ev_percent),
        kelly_percent: parseFloat(row.kelly_percent),
        market:        row.market,
      };
    }

    let data = eventsResult.rows.map(event => ({
      event_id:       event.event_id,
      sport_key:      event.sport_key,
      home_team:      event.home_team,
      away_team:      event.away_team,
      event_name:     `${event.home_team} v ${event.away_team}`,
      commence_time:  event.commence_time,
      bookmaker_count: parseInt(event.bookmaker_count),
      best_odds:      bestOddsMap[event.event_id] || [],
      all_bookmakers: allOddsMap[event.event_id] || {},
      ev_pick:        evMap[event.event_id] || null,
    }));

    data = dedupeFixtures(data);

    res.json({ data, total: data.length });
  } catch (err) {
    console.error('Games route error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
