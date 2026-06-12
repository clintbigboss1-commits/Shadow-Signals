'use strict';
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getCachedEV } = require('../services/cacheManager');
const { computeEVFromCache } = require('../services/evCalculator');
const { fetchFromOddsAPI } = require('../services/oddsService');

const PLAN_LIMITS = { free: 3, starter: 5, pro: 999, elite: 999 };

// GET /api/ev
router.get('/', requireAuth, async (req, res) => {
  try {
    const { sport = 'all', minEV = 0, limit = 50 } = req.query;
    const planLimit = PLAN_LIMITS[req.user.plan] ?? 3;

    let { data, source } = await getCachedEV(sport, parseFloat(minEV));

    // Cache miss — trigger fresh compute
    if (!data || data.length === 0) {
      if (sport !== 'all') {
        await fetchFromOddsAPI(sport);
      }

      data = await computeEVFromCache(sport === 'all' ? null : sport);
      source = 'freshly-computed';

      // If compute still yields nothing, force a second odds fetch so that
      // provider failures don't leave the UI empty (demo fallback lives in oddsService).
      if (!data || data.length === 0) {
        if (sport !== 'all') {
          await fetchFromOddsAPI(sport);
        }
        data = await computeEVFromCache(sport === 'all' ? null : sport);
        source = 'freshly-computed-after-empty';
      }
    }

    const limited = data.slice(0, Math.min(planLimit, parseInt(limit)));

    res.json({
      data: limited,
      total: data.length,
      shown: limited.length,
      plan_limit: planLimit,
      source,
      plan: req.user.plan,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
