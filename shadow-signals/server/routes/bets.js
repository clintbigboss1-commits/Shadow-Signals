'use strict';
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { db } = require('../db');

// POST /api/bets — log a bet
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      event_name, sport, market, selection, bookie,
      odds_taken, fair_odds, ev_percent, kelly_fraction,
      stake_aud, event_time, notes,
    } = req.body;

    if (!event_name || !selection || !odds_taken || !stake_aud) {
      return res.status(400).json({ error: 'event_name, selection, odds_taken and stake_aud are required' });
    }

    const result = await db.query(
      `INSERT INTO bets
       (user_id, event_name, sport, market, selection, bookie,
        odds_taken, fair_odds, ev_percent, kelly_fraction,
        stake_aud, event_time, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        req.user.userId, event_name, sport, market, selection, bookie,
        odds_taken, fair_odds || null, ev_percent || null, kelly_fraction || null,
        stake_aud, event_time || null, notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bets — all bets for user
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM bets WHERE user_id = $1 ORDER BY placed_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bets/clv — CLV stats
router.get('/clv', requireAuth, async (req, res) => {
  try {
    const summary = await db.query(
      `SELECT
        COUNT(*)                                                              AS total_bets,
        COUNT(CASE WHEN result = 'win'  THEN 1 END)                          AS wins,
        COUNT(CASE WHEN result = 'loss' THEN 1 END)                          AS losses,
        COALESCE(SUM(profit_aud), 0)                                          AS total_profit,
        COALESCE(AVG(ev_percent), 0)                                          AS avg_ev,
        COALESCE(AVG(clv_percent), 0)                                         AS avg_clv,
        COALESCE(SUM(stake_aud), 0)                                           AS total_staked,
        COALESCE(SUM(profit_aud) / NULLIF(SUM(stake_aud), 0) * 100, 0)       AS roi
       FROM bets WHERE user_id = $1`,
      [req.user.userId]
    );

    const byBookie = await db.query(
      `SELECT bookie,
        COUNT(*) AS bets,
        COALESCE(SUM(profit_aud), 0) AS profit,
        COALESCE(AVG(clv_percent), 0) AS avg_clv
       FROM bets WHERE user_id = $1
       GROUP BY bookie ORDER BY profit DESC`,
      [req.user.userId]
    );

    const bySport = await db.query(
      `SELECT sport,
        COUNT(*) AS bets,
        COALESCE(SUM(profit_aud), 0) AS profit,
        COALESCE(AVG(ev_percent), 0) AS avg_ev
       FROM bets WHERE user_id = $1
       GROUP BY sport ORDER BY profit DESC`,
      [req.user.userId]
    );

    res.json({
      summary: summary.rows[0],
      byBookie: byBookie.rows,
      bySport: bySport.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bets/:id — settle a bet
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { result, profit_aud, closing_odds } = req.body;

    let clv = null;
    if (closing_odds) {
      // CLV = how much better your odds were vs closing price
      const betRow = await db.query(
        'SELECT odds_taken FROM bets WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.userId]
      );
      if (betRow.rows.length > 0) {
        const taken = parseFloat(betRow.rows[0].odds_taken);
        clv = ((taken / parseFloat(closing_odds)) - 1) * 100;
      }
    }

    const updated = await db.query(
      `UPDATE bets SET
         result       = $1,
         profit_aud   = $2,
         closing_odds = $3,
         clv_percent  = $4,
         settled_at   = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [result, profit_aud, closing_odds || null, clv, req.params.id, req.user.userId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Bet not found' });
    }
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bets/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM bets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
