'use strict';
const router = require('express').Router();
const { db } = require('../db');

// GET /api/stats/public — real aggregate stats for landing page + wins page
// No auth required — public marketing data.
// Falls back to safe zeroes if DB has no data yet.
router.get('/public', async (req, res) => {
  try {
    const [evRow, betRow, clvRow] = await Promise.all([
      // Active signals today
      db.query(`
        SELECT COUNT(*)::int AS count
        FROM ev_opportunities
        WHERE is_active = TRUE
          AND found_at > NOW() - INTERVAL '24 hours'
          AND ev_percent >= 3
      `),
      // Settled bets this month
      db.query(`
        SELECT
          COUNT(*)::int AS total_bets,
          COUNT(*) FILTER (WHERE result = 'win')::int AS wins,
          COALESCE(SUM(profit_aud) FILTER (WHERE result = 'win'), 0)::float AS total_win_profit,
          COALESCE(AVG(profit_aud) FILTER (WHERE result = 'win'), 0)::float AS avg_win_profit
        FROM bets
        WHERE result IN ('win','loss')
          AND placed_at > NOW() - INTERVAL '30 days'
      `),
      // CLV positive rate
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE clv_percent > 0)::int AS clv_positive,
          COUNT(*)::int AS total
        FROM clv_tracking
        WHERE recorded_at > NOW() - INTERVAL '30 days'
      `),
    ]);

    const ev    = evRow.rows[0];
    const bets  = betRow.rows[0];
    const clv   = clvRow.rows[0];

    const total        = bets.total_bets || 0;
    const wins         = bets.wins || 0;
    const winRate      = total > 0 ? Math.round((wins / total) * 100) : 0;
    const avgWinProfit = Math.round(bets.avg_win_profit || 0);
    const clvPosRate   = clv.total > 0 ? Math.round((clv.clv_positive / clv.total) * 100) : 0;

    res.json({
      signals_today:       ev.count || 0,
      clv_positive_pct:    clvPosRate,
      avg_win_profit_aud:  avgWinProfit,
      win_rate_pct:        winRate,
      total_bets_month:    total,
      bookmakers_scanned:  12,
    });
  } catch (err) {
    // Return safe fallback so landing page never breaks
    console.warn('Stats error:', err.message);
    res.json({
      signals_today:      0,
      clv_positive_pct:   0,
      avg_win_profit_aud: 0,
      win_rate_pct:       0,
      total_bets_month:   0,
      bookmakers_scanned: 12,
    });
  }
});

module.exports = router;
