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

// GET /api/bets/wins — public leaderboard (anonymised)
router.get('/wins', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT
        COUNT(*)                                                                     AS total_bets,
        COUNT(CASE WHEN clv_percent > 0 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS clv_positive_pct,
        COALESCE(AVG(profit_aud) FILTER (WHERE result = 'win'), 0)                  AS avg_win_profit,
        COUNT(CASE WHEN ev_percent >= 8 AND DATE_TRUNC('month', placed_at) = DATE_TRUNC('month', NOW()) THEN 1 END) AS s_plus_this_month
      FROM bets WHERE result IN ('win','loss')
    `);

    const recent = await db.query(`
      SELECT
        u.name,
        b.sport, b.event_name, b.bookie, b.odds_taken, b.ev_percent, b.profit_aud, b.placed_at
      FROM bets b
      JOIN users u ON u.id = b.user_id
      WHERE b.result = 'win' AND b.profit_aud > 0 AND b.clv_percent > 0
      ORDER BY b.placed_at DESC
      LIMIT 12
    `);

    // Anonymise: "John Smith" → "John S."
    const wins = recent.rows.map(w => ({
      name:       w.name ? `${w.name.split(' ')[0]} ${(w.name.split(' ')[1] || '').charAt(0)}.`.trim() : 'Member',
      sport:      w.sport,
      event:      w.event_name,
      bookie:     w.bookie,
      odds:       Number(w.odds_taken),
      ev:         `+${Number(w.ev_percent).toFixed(1)}%`,
      profit:     `+$${Number(w.profit_aud).toFixed(0)}`,
      date:       new Date(w.placed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      grade:      Number(w.ev_percent) >= 8 ? 'S+' : Number(w.ev_percent) >= 5 ? 'A' : 'B',
    }));

    res.json({ stats: stats.rows[0], wins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Multi-bet (parlay) endpoints ──────────────────────────────────────────

// POST /api/bets/multi-odds — calculate combined odds + EV for a multi
router.post('/multi-odds', requireAuth, async (req, res) => {
  try {
    const { legs } = req.body;
    if (!legs || legs.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 legs' });
    }

    // Combined odds = product of all leg odds (parlay multiplication)
    const combinedOdds = legs.reduce((p, l) => p * l.odds, 1);

    // Combined EV: if all legs have fair_odds, compute
    // If independent, P(all win) = product of (1/fair_odds)
    // EV = (combined_odds / combined_fair_odds - 1) * 100
    let combinedEV = null;
    let combinedFairOdds = null;
    if (legs.every(l => l.fair_odds)) {
      combinedFairOdds = legs.reduce((p, l) => p * l.fair_odds, 1);
      combinedEV = (combinedOdds / combinedFairOdds - 1) * 100;
    }

    // Correlation detection: same game, same sport, overlapping selections
    let correlationScore = 0;
    const sameGame = legs.filter(l =>
      legs.some(o => o !== l && o.event_id === l.event_id && o.selection !== l.selection)
    );
    const sameSport = legs.filter(l =>
      legs.some(o => o !== l && o.sport_key === l.sport_key && o.event_id !== l.event_id)
    );
    const sameSelection = legs.filter(l =>
      legs.some(o => o !== l && o.selection === l.selection && o.event_id !== l.event_id)
    );

    if (sameGame.length > 0) correlationScore = 0.12;
    if (sameSelection.length > 0) correlationScore = Math.max(correlationScore, 0.08);
    if (sameSport.length > 0) correlationScore = Math.max(correlationScore, 0.03);

    res.json({
      combined_odds: Number(combinedOdds.toFixed(4)),
      combined_fair_odds: combinedFairOdds ? Number(combinedFairOdds.toFixed(4)) : null,
      combined_ev_percent: combinedEV !== null ? Number(combinedEV.toFixed(2)) : null,
      num_legs: legs.length,
      correlation_score: correlationScore,
      correlation_warning: correlationScore > 0.05
        ? `⚠️ Same-${sameGame.length > 0 ? 'game' : sameSelection.length > 0 ? 'selection' : 'sport'} correlation detected — true odds may be lower`
        : null,
      implied_probability: Number((1 / combinedOdds * 100).toFixed(2)),
      payout_multiplier: Number(combinedOdds.toFixed(4)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bets/multi — log a multi-bet
router.post('/multi', requireAuth, async (req, res) => {
  try {
    const { legs, total_stake, combined_ev } = req.body;
    if (!legs || legs.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 legs' });
    }

    const combinedOdds = legs.reduce((p, l) => p * l.odds, 1);
    const kellyFraction = combined_ev != null
      ? Math.min((combined_ev / 100) / (combinedOdds - 1) * 0.25, 0.25)
      : null;

    const multi = await db.query(
      `INSERT INTO multi_bets
         (user_id, combined_odds, combined_ev, total_stake, num_legs, kelly_fraction)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [req.user.userId, combinedOdds, combined_ev || null, total_stake, legs.length, kellyFraction]
    );

    for (const leg of legs) {
      await db.query(
        `INSERT INTO multi_legs
           (multi_id, event_id, event_name, sport_key, selection, bookie, odds_taken, fair_odds, ev_percent)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [multi.rows[0].id, leg.event_id, leg.event_name, leg.sport_key,
         leg.selection, leg.bookie, leg.odds, leg.fair_odds || null, leg.ev_percent || null]
      );
    }

    res.status(201).json(multi.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bets/multi — user's multi-bet history
router.get('/multi', requireAuth, async (req, res) => {
  try {
    const multis = await db.query(
      `SELECT * FROM multi_bets WHERE user_id = $1 ORDER BY placed_at DESC LIMIT 50`,
      [req.user.userId]
    );
    const result = [];
    for (const m of multis.rows) {
      const legs = await db.query(
        `SELECT * FROM multi_legs WHERE multi_id = $1 ORDER BY odds_taken DESC`,
        [m.id]
      );
      result.push({ ...m, legs: legs.rows });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
