'use strict';
const cron = require('node-cron');
const { fetchFromOddsAPI, fetchESPN } = require('./oddsService');
const { computeEVFromCache } = require('./evCalculator');
const { findArbs } = require('./arbFinder');
const { db } = require('../db');
const { API_BUDGETS } = require('./cacheManager');
const emails = require('./emails');
const { createNotification } = require('./notifications');

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

function monthIn(months) {
  const m = new Date().getMonth() + 1;
  return months.includes(m);
}

// ── Season-aware fetch schedule ──────────────────────────────────────────────
// Off-season sports are skipped entirely (a 0-event poll still costs credits).
// Cadence in minutes; game days (Thu-Sun) poll faster. AU winter codes lead.
const SPORT_SCHEDULE = [
  // Australian winter — the headline content Mar-Sep
  { key: 'aussierules_afl',      inSeason: () => monthIn([3,4,5,6,7,8,9]),              gameDayMin: 15, offDayMin: 45 },
  { key: 'rugbyleague_nrl',      inSeason: () => monthIn([3,4,5,6,7,8,9,10]),           gameDayMin: 15, offDayMin: 45 },
  // US majors
  { key: 'basketball_nba',       inSeason: () => monthIn([10,11,12,1,2,3,4,5,6]),       gameDayMin: 30, offDayMin: 30 },
  { key: 'baseball_mlb',         inSeason: () => monthIn([4,5,6,7,8,9,10]),             gameDayMin: 30, offDayMin: 30 },
  { key: 'icehockey_nhl',        inSeason: () => monthIn([10,11,12,1,2,3,4,5,6]),       gameDayMin: 30, offDayMin: 60 },
  { key: 'americanfootball_nfl', inSeason: () => monthIn([9,10,11,12,1,2]),             gameDayMin: 15, offDayMin: 30 },
  // Australian summer
  { key: 'basketball_nbl',       inSeason: () => monthIn([10,11,12,1,2,3]),             gameDayMin: 30, offDayMin: 60 },
  { key: 'soccer_a_league',      inSeason: () => monthIn([10,11,12,1,2,3,4,5]),         gameDayMin: 30, offDayMin: 60 },
  { key: 'cricket_big_bash',     inSeason: () => monthIn([12,1]),                       gameDayMin: 30, offDayMin: 60 },
  // European soccer (Aug-May)
  { key: 'soccer_epl',           inSeason: () => monthIn([8,9,10,11,12,1,2,3,4,5]),     gameDayMin: 15, offDayMin: 30 },
  { key: 'soccer_ucl',           inSeason: () => monthIn([9,10,11,12,1,2,3,4,5,6]),     gameDayMin: 30, offDayMin: 60 },
  { key: 'soccer_la_liga',       inSeason: () => monthIn([8,9,10,11,12,1,2,3,4,5]),     gameDayMin: 30, offDayMin: 60 },
  { key: 'soccer_bundesliga',    inSeason: () => monthIn([8,9,10,11,12,1,2,3,4,5]),     gameDayMin: 30, offDayMin: 60 },
  { key: 'soccer_serie_a',       inSeason: () => monthIn([8,9,10,11,12,1,2,3,4,5]),     gameDayMin: 30, offDayMin: 60 },
  { key: 'soccer_europa',        inSeason: () => monthIn([9,10,11,12,1,2,3,4,5]),       gameDayMin: 30, offDayMin: 60 },
  { key: 'soccer_ligue_1',       inSeason: () => monthIn([8,9,10,11,12,1,2,3,4,5]),     gameDayMin: 30, offDayMin: 60 },
  // Year-round-ish leagues
  { key: 'soccer_mls',           inSeason: () => monthIn([2,3,4,5,6,7,8,9,10,11]),      gameDayMin: 60, offDayMin: 60 },
  { key: 'soccer_brazil',        inSeason: () => monthIn([4,5,6,7,8,9,10,11,12]),       gameDayMin: 60, offDayMin: 60 },
  // Event-driven
  { key: 'mma_ufc',              inSeason: () => [0, 5, 6].includes(new Date().getDay()), gameDayMin: 30, offDayMin: 30 },
];

const _lastFetch = {};

async function fetchDueSports() {
  const now = Date.now();
  for (const s of SPORT_SCHEDULE) {
    if (!s.inSeason()) continue;
    const cadenceMin = isGameDay() ? s.gameDayMin : s.offDayMin;
    if (_lastFetch[s.key] && now - _lastFetch[s.key] < cadenceMin * 60 * 1000) continue;
    _lastFetch[s.key] = now;
    try { await fetchFromOddsAPI(s.key); } catch (_) {}
  }
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

    // Send edge alert emails + notifications to Pro/Elite users for new Grade S+ opportunities
    const unalertedHot = evOpps.filter(e => e.ev_percent >= 8 && !e.alert_sent);
    if (unalertedHot.length > 0) {
      await sendHotEdgeAlerts(unalertedHot.slice(0, 3));
    }
  } catch (err) {
    console.error('Recompute error:', err.message);
  }
}

async function sendHotEdgeAlerts(hotEdges) {
  try {
    const users = await db.query(
      `SELECT id, email, name FROM users WHERE plan IN ('pro', 'elite') AND subscription_status = 'active'`
    );
    if (!users.rows.length) return;

    const topEdge = hotEdges[0];

    for (const user of users.rows) {
      emails.sendEdgeAlert(user, topEdge).catch(() => {});
      createNotification(
        user.id, 'hot_edge',
        `🔥 ${Number(topEdge.ev_percent).toFixed(1)}% edge — ${topEdge.event_name}`,
        `${topEdge.selection} @ $${Number(topEdge.bookie_odds).toFixed(2)} on ${topEdge.bookie?.replace(/_/g,' ')}`,
        '/markets'
      ).catch(() => {});
    }

    // Mark these opportunities as alerted so we don't re-send
    const ids = hotEdges.map(e => e.id).filter(Boolean);
    if (ids.length) {
      await db.query(
        `UPDATE ev_opportunities SET alert_sent = TRUE WHERE id = ANY($1::uuid[])`,
        [ids]
      );
    }
  } catch (err) {
    console.error('Edge alert error:', err.message);
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
  console.log('⏰ Initialising Smart Scheduler (The Odds API, season-aware)...');
  printBudget();

  // Recompute EV every 45s — FREE (reads DB only)
  cron.schedule('*/45 * * * * *', recomputeAll);

  // ── Immediate initial fetch: every in-season sport, AU codes first ───────
  setTimeout(async () => {
    const inSeason = SPORT_SCHEDULE.filter(s => s.inSeason()).map(s => s.key);
    console.log(`🔄 Initial fetch (in season now): ${inSeason.join(', ')}`);
    const now = Date.now();
    for (const sport of inSeason) {
      _lastFetch[sport] = now;
      try { await fetchFromOddsAPI(sport); } catch (_) {}
    }
    console.log('✅ Initial fetch complete — computing EV...');
    await recomputeAll();
  }, 2000);

  // One engine: every minute, fetch whatever is due per its season + cadence
  cron.schedule('* * * * *', fetchDueSports);

  // Daily cleanup at midnight AEST (2pm UTC)
  cron.schedule('0 14 * * *', async () => {
    await cleanCache();
    printBudget();
  });

  const active = SPORT_SCHEDULE.filter(s => s.inSeason()).length;
  console.log(`✅ Scheduler running — ${active}/${SPORT_SCHEDULE.length} sports in season`);
}

module.exports = { initScheduler, setIO, recomputeAll, printBudget };