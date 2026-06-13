'use strict';
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getBacktestSummary, runBacktest } = require('../services/backtester');
const { db } = require('../db');

// GET /api/backtest — full accuracy report (admin or pro/elite)
router.get('/', requireAuth, async (req, res) => {
  try {
    const sport = req.query.sport || null;
    const hours = parseInt(req.query.hours || '24', 10);

    const result = sport || hours !== 24
      ? await runBacktest({ sportKey: sport || null, hoursBeforeKickoff: hours })
      : await getBacktestSummary();

    res.json(result);
  } catch (err) {
    console.error('Backtest route error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/backtest/sample-count — how many games we have data on
router.get('/sample-count', requireAuth, async (req, res) => {
  try {
    const r = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE completed AND winner IS NOT NULL) AS results_with_winner,
         COUNT(*) FILTER (WHERE completed) AS completed_games,
         COUNT(DISTINCT ho.event_id) AS games_with_history
       FROM game_results gr
       LEFT JOIN historical_odds ho ON ho.event_id = gr.event_id`
    );
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
