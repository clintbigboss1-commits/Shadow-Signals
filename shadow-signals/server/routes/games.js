'use strict';
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { db } = require('../db');

// GET /api/games — all upcoming events from odds cache, EV picks overlaid
router.get('/', requireAuth, async (req, res) => {
  try {
    const sport = req.query.sport || 'all';
    const limit = Math.min(parseInt(req.query.limit || '80', 10), 200);

    // All upcoming events with at least 2 bookmakers in the cache
    let eventsQuery = `
      SELECT
        oc.event_id,
        oc.sport_key,
        oc.home_team,
        oc.away_team,
        oc.commence_time,
        COUNT(DISTINCT oc.bookmaker) FILTER (WHERE oc.market = 'h2h') AS bookmaker_count
      FROM odds_cache oc
      WHERE oc.expires_at > NOW()
        AND oc.commence_time > NOW()
        AND oc.market = 'h2h'
    `;
    const params = [];
    if (sport !== 'all') {
      params.push(sport);
      eventsQuery += ` AND oc.sport_key = $${params.length}`;
    }
    eventsQuery += `
      GROUP BY oc.event_id, oc.sport_key, oc.home_team, oc.away_team, oc.commence_time
      HAVING COUNT(DISTINCT oc.bookmaker) >= 1
      ORDER BY oc.commence_time ASC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);

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

    const data = eventsResult.rows.map(event => ({
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

    res.json({ data, total: data.length });
  } catch (err) {
    console.error('Games route error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
