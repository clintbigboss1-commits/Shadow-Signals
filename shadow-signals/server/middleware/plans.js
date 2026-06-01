'use strict';
const PLAN_RANK = { free: 0, recruit: 1, commander: 2, syndicate: 3 };

function requirePlan(minPlan) {
  return (req, res, next) => {
    const userRank = PLAN_RANK[req.user?.plan] ?? 0;
    const required = PLAN_RANK[minPlan] ?? 0;
    if (userRank >= required) return next();
    res.status(403).json({
      error: 'Plan upgrade required',
      required: minPlan,
      current: req.user?.plan || 'free',
      upgradeUrl: '/pricing',
    });
  };
}

module.exports = { requirePlan };
