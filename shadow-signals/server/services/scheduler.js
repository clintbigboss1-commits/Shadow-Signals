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

function isAFLSeason() {
  const m = new Date().getMonth() + 1;
  return m >= 3 && m <= 9;
}

function isNRLSeason() {
  const m = new Date().getMonth() + 1;
  return m >= 3 && m <= 10;
}

function isCricketSeason() {
  const m = new Date().getMonth() + 1;
  return m >= 10 || m <= 3;
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
  console.log('⏰ Initialising Smart Scheduler...');
  printBudget();

  // Recompute EV every 45s — FREE (reads DB only)
  cron.schedule('*/45 * * * * *', recomputeAll);

  // AFL — every 3 min on game days in season
  cron.schedule('*/3 * * * *', async () => {
    if (isAFLSeason() && isGameDay()) {
      await fetchFromOddsAPI('aussierules_afl');
    }
  });

  // NRL — every 3 min on game days in season
  cron.schedule('*/3 * * * *', async () => {
    if (isNRLSeason() && isGameDay()) {
      await fetchFromOddsAPI('rugbyleague_nrl');
    }
  });

  // Racing — every 5 min during racing hours (10am-8pm AEST)
  cron.schedule('*/5 * * * *', async () => {
    const h = getAUHour();
    if (h >= 10 && h <= 20) {
      await fetchFromOddsAPI('horse_racing');
    }
  });

  // Cricket — every 10 min in season
  cron.schedule('*/10 * * * *', async () => {
    if (isCricketSeason()) {
      await fetchFromOddsAPI('cricket_t20');
      await fetchFromOddsAPI('cricket_odi');
    }
  });

  // Soccer — every 15 min, only if ESPN shows events today
  cron.schedule('*/15 * * * *', async () => {
    const espnEvents = await fetchESPN('aleague');
    if (espnEvents.length > 0) {
      await fetchFromOddsAPI('soccer_a_league');
    }
    if (API_BUDGETS['the-odds-api'].used < 300) {
      await fetchFromOddsAPI('soccer_epl');
    }
  });

  // Tennis/NBA/UFC — every 20 min if budget OK
  cron.schedule('*/20 * * * *', async () => {
    if (API_BUDGETS['the-odds-api'].used < 350) {
      await fetchFromOddsAPI('basketball_nbl');
      await fetchFromOddsAPI('mma_mixed_martial_arts');
    }
  });

  // Daily cleanup at midnight AEST (2pm UTC)
  cron.schedule('0 14 * * *', async () => {
    await cleanCache();
    printBudget();
  });

  console.log('✅ Scheduler running');
}

module.exports = { initScheduler, setIO, recomputeAll, printBudget };
