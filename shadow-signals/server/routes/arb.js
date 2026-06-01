'use strict';
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { requirePlan } = require('../middleware/plans');
const { getCachedArbs } = require('../services/cacheManager');
const { findArbs } = require('../services/arbFinder');

// GET /api/arb  — Commander plan required
router.get('/', requireAuth, requirePlan('commander'), async (req, res) => {
  try {
    let { data, source } = await getCachedArbs();

    if (!data || data.length === 0) {
      data = await findArbs();
      source = 'freshly-computed';
    }

    res.json({ data, total: data.length, source });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
