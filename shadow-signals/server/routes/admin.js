'use strict';
const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { db } = require('../db');
const { MODELS } = require('../services/models');

// GET /api/admin/models/status — all models + recent run log
router.get('/models/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows: runs } = await db.query(`
      SELECT DISTINCT ON (sport_key, action)
        sport_key, action, status, duration_ms, details, error, created_at
      FROM model_runs
      ORDER BY sport_key, action, created_at DESC
    `);
    res.json({
      models: MODELS.map(m => ({
        sport_key:      m.sportKey,
        display_name:   m.displayName,
        is_implemented: m.isImplemented,
      })),
      recent_runs: runs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/models/:sport/calibration — Brier score + reliability diagram
router.get('/models/:sport/calibration', requireAuth, requireAdmin, async (req, res) => {
  const sport = req.params.sport;
  const supported = ['afl', 'nba'];
  if (!supported.includes(sport)) {
    return res.status(400).json({ error: `Calibration not yet available for ${sport}` });
  }
  try {
    const fixTable  = `${sport}_fixtures`;
    const predTable = `${sport}_predictions`;
    const { rows: buckets } = await db.query(`
      SELECT
        ROUND(home_win_prob::numeric * 10) / 10 AS bucket,
        COUNT(*)::int AS n,
        AVG(home_win_prob)::float AS predicted,
        AVG(CASE WHEN actual_winner_id = (
          SELECT home_team_id FROM ${fixTable} WHERE id = p.fixture_id
        ) THEN 1.0 ELSE 0.0 END)::float AS actual
      FROM ${predTable} p
      WHERE settled_at IS NOT NULL
      GROUP BY bucket
      ORDER BY bucket
    `);
    const { rows: summary } = await db.query(`
      SELECT
        COUNT(*)::int AS n,
        AVG(
          CASE
            WHEN actual_winner_id = (SELECT home_team_id FROM ${fixTable} WHERE id = p.fixture_id)
              THEN POWER(1 - home_win_prob, 2)
            ELSE POWER(home_win_prob, 2)
          END
        )::float AS brier_score
      FROM ${predTable} p
      WHERE settled_at IS NOT NULL
    `);
    res.json({ sport, buckets, summary: summary[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/models/:sport/predictions — upcoming predictions
router.get('/models/:sport/predictions', requireAuth, requireAdmin, async (req, res) => {
  const sport = req.params.sport;
  const supported = ['afl', 'nba'];
  if (!supported.includes(sport)) {
    return res.json({ sport, predictions: [] });
  }
  try {
    const teamTable = `${sport}_teams`;
    const fixTable  = `${sport}_fixtures`;
    const predTable = `${sport}_predictions`;
    const { rows } = await db.query(`
      SELECT
        p.id, p.home_win_prob, p.away_win_prob, p.predicted_margin,
        p.generated_at, f.date, f.round, f.venue,
        ht.name AS home_team, at.name AS away_team
      FROM ${predTable} p
      JOIN ${fixTable} f  ON f.id = p.fixture_id
      JOIN ${teamTable} ht ON ht.id = f.home_team_id
      JOIN ${teamTable} at ON at.id = f.away_team_id
      WHERE p.settled_at IS NULL AND f.date > NOW()
      ORDER BY f.date ASC
      LIMIT 50
    `);
    res.json({ sport, predictions: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/models/runs — recent run log (any sport)
router.get('/models/runs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT sport_key, action, status, duration_ms, error, created_at
       FROM model_runs ORDER BY created_at DESC LIMIT 100`
    );
    res.json({ runs: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
