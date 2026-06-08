'use strict';
const cron = require('node-cron');
const { fetchFromOddsAPI, fetchESPN } = require('./oddsService');
const { computeEVFromCache } = require('./evCalculator');
const { findArbs } = require('./arbFinder');
const { db } = require('../db');
const { API_BUDGETS } = require('./cacheManager');

let _io = null;
function setIO(io) { _io = io; }

function getAUHour() {
  return parseInt(
    new Date().toLocaleString('en-AU', {
      timeZone: 'Australia/Sydney',
      hour: 'numeric',
      hour12: false,
    })
  );
}

function isGameDay() {
  // Thu(4) Fri(5) Sat(6) Sun(0) = main AU game days
  return [0, 4, 5, 6].includes(new Date().getDay());
}

function isNBLActiveSeason() {
  // NBL season runs Oct-June in Australia
  const m = new Date().getMonth() + 1;
  return m >= 10 || m <= 6;
}

function isUFCActiveWeekend() {
  // UFC events typically Fri/Sat/Sun
  return [0, 5, 6].includes(new Date().getDay());
}

// Recompute EV + Arb from cache — ZERO API calls
async function recomputeAll() {
  try {
    const [evOpps, arbOpps] = await Promise.all([
      computeEVFromCache(),
      findArbs(),
    ]);

    if (_io) {
      _io.emit('ev:update', evOpps.slice(0, 50));
      if (arbOpps.length > 0) _io.emit('arb:update', arbOpps.slice(0, 20));
      const hot = evOpps.filter(e => e.ev_percent >= 8);
      if (hot.length > 0) _io.emit('ev:hot', hot.slice(0, 5));
    }
  } catch (err) {
    console.error('Recompute error:', err.message);
  }
}

async function cleanCache() {
  try {
    const r = await db.query(
      `DELETE FROM odds_cache WHERE expires_at < NOW() - INTERVAL '1 hour'`
    );
    await db.query(
      `UPDATE ev_opportunities SET is_active = FALSE WHERE expires_at < NOW() OR commence_time < NOW()`
    );
    await db.query(
      `UPDATE arb_opportunities SET is_active = FALSE WHERE found_at < NOW() - INTERVAL '2 hours'`
    );
    console.log(`🗑️  Cleaned ${r.rowCount} expired cache entries`);
  } catch (err) {
    console.error('Cache cleanup error:', err.message);
  }
}

function printBudget() {
  console.log('\n📊 API Budget Status:');
  for (const [name, b] of Object.entries(API_BUDGETS)) {
    if (b.soft_limit === Infinity) {
      console.log(`  ${name}: ♾️  Unlimited`);
    } else {
      const pct = ((b.used / b.soft_limit) * 100).toFixed(1);
      console.log(`  ${name}: ${b.used}/${b.soft_limit} (${pct}%)`);
    }
  }
  console.log('');
}

function initScheduler() {
  console.log('⏰ Initialising Smart Scheduler (BoltOdds)...');
  printBudget();

  // Recompute EV every 45s — FREE (reads DB only)
  cron.schedule('*/45 * * * * *', recomputeAll);

  // Top-tier sports — every 3 min on game days
  cron.schedule('*/3 * * * *', async () => {
    if (isGameDay()) {
      await fetchFromOddsAPI('soccer_epl');
      await fetchFromOddsAPI('basketball_nba');
      await fetchFromOddsAPI('americanfootball_nfl');
    }
  });

  // Soccer leagues — every 10 min
  cron.schedule('*/10 * * * *', async () => {
    await fetchFromOddsAPI('soccer_la_liga');
    await fetchFromOddsAPI('soccer_bundesliga');
    await fetchFromOddsAPI('soccer_serie_a');
    await fetchFromOddsAPI('soccer_ucl');
  });

  // Other soccer — every 20 min
  cron.schedule('*/20 * * * *', async () => {
    await fetchFromOddsAPI('soccer_europa');
    await fetchFromOddsAPI('soccer_ligue_1');
    await fetchFromOddsAPI('soccer_mls');
    await fetchFromOddsAPI('soccer_brazil');
  });

  // Baseball / Hockey — every 30 min
  cron.schedule('*/30 * * * *', async () => {
    await fetchFromOddsAPI('baseball_mlb');
    await fetchFromOddsAPI('icehockey_nhl');
  });

  // NBL (Australian basketball) — every 30 min in season
  cron.schedule('*/30 * * * *', async () => {
    if (isNBLActiveSeason()) {
      await fetchFromOddsAPI('basketball_nbl');
    }
  });

  // UFC / Boxing — every 20 min on event weekends
  cron.schedule('*/20 * * * *', async () => {
    if (isUFCActiveWeekend()) {
      await fetchFromOddsAPI('mma_ufc');
      await fetchFromOddsAPI('mma_boxing');
    }
  });

  // Tennis — every 30 min
  cron.schedule('*/30 * * * *', async () => {
    await fetchFromOddsAPI('tennis_atp');
  });

  // Golf — every 60 min (slower sport)
  cron.schedule('0 * * * *', async () => {
    await fetchFromOddsAPI('golf_pga');
  });

  // Daily cleanup at midnight AEST (2pm UTC)
  cron.schedule('0 14 * * *', async () => {
    await cleanCache();
    printBudget();
  });

  console.log('✅ Scheduler running (BoltOdds)');
}

module.exports = { initScheduler, setIO, recomputeAll, printBudget };