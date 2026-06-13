'use strict';
const cron = require('node-cron');
const { fetchFromOddsAPI, fetchESPN } = require('./oddsService');
const { computeEVFromCache } = require('./evCalculator');
const { findArbs } = require('./arbFinder');
const { db } = require('../db');
const { API_BUDGETS } = require('./cacheManager');
const emails = require('./emails');
const { createNotification } = require('./notifications');
const { fetchAllScores, backfillHistoricalOdds } = require('./historicalFetcher');
const { runBacktest } = require('./backtester');
const { activeModels } = require('./models');
const { captureClosingLines } = require('./clvTracker');

let _io = null;
function setIO(io) { _io = io; }

async function logModelRun(sportKey, action, fn) {
  const start = Date.now();
  try {
    const details = await fn();
    await db.query(
      `INSERT INTO model_runs (sport_key, action, status, duration_ms, details)
       VALUES ($1,$2,'success',$3,$4)`,
      [sportKey, action, Date.now() - start, details ? JSON.stringify(details) : null]
    );
  } catch (e) {
    await db.query(
      `INSERT INTO model_runs (sport_key, action, status, duration_ms, error)
       VALUES ($1,$2,'error',$3,$4)`,
      [sportKey, action, Date.now() - start, e.message]
    ).catch(() => {});
    console.error(`Model ${sportKey} ${action} failed:`, e.message);
  }
}

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
  // ── AU codes — top priority ──────────────────────────────────────────────
  { key: 'aussierules_afl',                  inSeason: () => monthIn([3,4,5,6,7,8,9]),          gameDayMin: 7,  offDayMin: 20 },
  { key: 'rugbyleague_nrl',                  inSeason: () => monthIn([3,4,5,6,7,8,9,10]),        gameDayMin: 7,  offDayMin: 20 },
  { key: 'rugbyleague_nrl_state_of_origin',  inSeason: () => monthIn([5,6,7]),                   gameDayMin: 7,  offDayMin: 30 },
  // ── Cricket ─────────────────────────────────────────────────────────────
  { key: 'cricket_international_t20',        inSeason: () => true,                              gameDayMin: 15, offDayMin: 30 },
  { key: 'cricket_odi',                      inSeason: () => true,                              gameDayMin: 15, offDayMin: 30 },
  { key: 'cricket_test_match',               inSeason: () => true,                              gameDayMin: 30, offDayMin: 60 },
  { key: 'cricket_big_bash',                 inSeason: () => monthIn([12,1]),                    gameDayMin: 15, offDayMin: 30 },
  // ── Basketball ──────────────────────────────────────────────────────────
  { key: 'basketball_nba',                   inSeason: () => monthIn([10,11,12,1,2,3,4,5,6]),   gameDayMin: 10, offDayMin: 20 },
  { key: 'basketball_wnba',                  inSeason: () => monthIn([5,6,7,8,9,10]),            gameDayMin: 15, offDayMin: 30 },
  { key: 'basketball_nbl',                   inSeason: () => monthIn([10,11,12,1,2,3]),          gameDayMin: 15, offDayMin: 30 },
  // ── Baseball ────────────────────────────────────────────────────────────
  { key: 'baseball_mlb',                     inSeason: () => monthIn([4,5,6,7,8,9,10]),          gameDayMin: 15, offDayMin: 20 },
  { key: 'baseball_kbo',                     inSeason: () => monthIn([3,4,5,6,7,8,9,10]),        gameDayMin: 30, offDayMin: 60 },
  { key: 'baseball_npb',                     inSeason: () => monthIn([3,4,5,6,7,8,9,10]),        gameDayMin: 30, offDayMin: 60 },
  // ── Ice Hockey ──────────────────────────────────────────────────────────
  { key: 'icehockey_nhl',                    inSeason: () => monthIn([10,11,12,1,2,3,4,5,6]),   gameDayMin: 10, offDayMin: 30 },
  // ── American Football ───────────────────────────────────────────────────
  { key: 'americanfootball_nfl',             inSeason: () => monthIn([9,10,11,12,1,2]),          gameDayMin: 7,  offDayMin: 20 },
  { key: 'americanfootball_nfl_preseason',   inSeason: () => monthIn([8]),                       gameDayMin: 15, offDayMin: 30 },
  { key: 'americanfootball_ncaaf',           inSeason: () => monthIn([8,9,10,11,12,1]),          gameDayMin: 15, offDayMin: 30 },
  { key: 'americanfootball_cfl',             inSeason: () => monthIn([6,7,8,9,10,11]),           gameDayMin: 15, offDayMin: 30 },
  { key: 'americanfootball_ufl',             inSeason: () => monthIn([3,4,5,6]),                 gameDayMin: 15, offDayMin: 30 },
  // ── Combat sports — event-driven ────────────────────────────────────────
  { key: 'mma_mixed_martial_arts',           inSeason: () => [0,5,6].includes(new Date().getDay()), gameDayMin: 10, offDayMin: 20 },
  { key: 'boxing_boxing',                    inSeason: () => [0,5,6].includes(new Date().getDay()), gameDayMin: 10, offDayMin: 30 },
  // ── Soccer: always-on competitions ──────────────────────────────────────
  { key: 'soccer_fifa_world_cup',            inSeason: () => monthIn([6,7]),                     gameDayMin: 7,  offDayMin: 15 },
  { key: 'soccer_conmebol_copa_libertadores',inSeason: () => monthIn([2,3,4,5,6,7,8,9,10,11]),  gameDayMin: 15, offDayMin: 30 },
  { key: 'soccer_conmebol_copa_sudamericana',inSeason: () => monthIn([3,4,5,6,7,8,9,10,11]),    gameDayMin: 15, offDayMin: 30 },
  { key: 'soccer_mls',                       inSeason: () => monthIn([2,3,4,5,6,7,8,9,10,11]),  gameDayMin: 20, offDayMin: 30 },
  { key: 'soccer_brazil',                    inSeason: () => monthIn([4,5,6,7,8,9,10,11,12]),   gameDayMin: 20, offDayMin: 30 },
  { key: 'soccer_brazil_serie_b',            inSeason: () => monthIn([4,5,6,7,8,9,10,11,12]),   gameDayMin: 30, offDayMin: 60 },
  { key: 'soccer_norway_eliteserien',        inSeason: () => monthIn([4,5,6,7,8,9,10,11]),      gameDayMin: 30, offDayMin: 60 },
  { key: 'soccer_sweden_allsvenskan',        inSeason: () => monthIn([4,5,6,7,8,9,10,11]),      gameDayMin: 30, offDayMin: 60 },
  { key: 'soccer_sweden_superettan',         inSeason: () => monthIn([4,5,6,7,8,9,10,11]),      gameDayMin: 30, offDayMin: 60 },
  { key: 'soccer_finland_veikkausliiga',     inSeason: () => monthIn([4,5,6,7,8,9,10]),         gameDayMin: 30, offDayMin: 60 },
  { key: 'soccer_chile_campeonato',          inSeason: () => monthIn([2,3,4,5,6,7,8,9,10,11,12]), gameDayMin: 30, offDayMin: 60 },
  { key: 'soccer_china_superleague',         inSeason: () => monthIn([3,4,5,6,7,8,9,10,11]),    gameDayMin: 30, offDayMin: 60 },
  { key: 'soccer_league_of_ireland',         inSeason: () => monthIn([3,4,5,6,7,8,9,10]),       gameDayMin: 30, offDayMin: 60 },
  { key: 'soccer_germany_dfb_pokal',         inSeason: () => monthIn([8,9,10,11,12,1,2,3,4,5,6]), gameDayMin: 30, offDayMin: 60 },
  // ── Soccer: European (Aug-May) ───────────────────────────────────────────
  { key: 'soccer_a_league',                  inSeason: () => monthIn([10,11,12,1,2,3,4,5]),     gameDayMin: 15, offDayMin: 30 },
  { key: 'soccer_epl',                       inSeason: () => monthIn([8,9,10,11,12,1,2,3,4,5]), gameDayMin: 7,  offDayMin: 20 },
  { key: 'soccer_ucl',                       inSeason: () => monthIn([9,10,11,12,1,2,3,4,5,6]), gameDayMin: 10, offDayMin: 30 },
  { key: 'soccer_la_liga',                   inSeason: () => monthIn([8,9,10,11,12,1,2,3,4,5]), gameDayMin: 15, offDayMin: 30 },
  { key: 'soccer_bundesliga',                inSeason: () => monthIn([8,9,10,11,12,1,2,3,4,5]), gameDayMin: 15, offDayMin: 30 },
  { key: 'soccer_serie_a',                   inSeason: () => monthIn([8,9,10,11,12,1,2,3,4,5]), gameDayMin: 15, offDayMin: 30 },
  { key: 'soccer_europa',                    inSeason: () => monthIn([9,10,11,12,1,2,3,4,5]),   gameDayMin: 15, offDayMin: 30 },
  { key: 'soccer_ligue_1',                   inSeason: () => monthIn([8,9,10,11,12,1,2,3,4,5]), gameDayMin: 15, offDayMin: 30 },
  { key: 'soccer_spain_segunda_division',    inSeason: () => monthIn([8,9,10,11,12,1,2,3,4,5,6]), gameDayMin: 30, offDayMin: 60 },
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

  // Daily scores sweep at 8am AEST (10pm UTC prev day) — 2 credits per sport
  cron.schedule('0 22 * * *', async () => {
    try { await fetchAllScores(); } catch (err) { console.error('Score sweep error:', err.message); }
  });

  // Weekly historical odds backfill — Sunday 3am AEST (5pm UTC Sat)
  cron.schedule('0 17 * * 6', async () => {
    try {
      await backfillHistoricalOdds();
      const summary = await runBacktest();
      console.log(`📈 Backtest: ${summary.signals} signals, ${summary.winRate}% hit rate, ${summary.roi}% ROI`);
    } catch (err) {
      console.error('Backfill/backtest error:', err.message);
    }
  });

  // Daily 23:00 UTC (= 09:00 AEST): ingest results + recompute ratings + generate predictions
  cron.schedule('0 23 * * *', async () => {
    for (const m of activeModels()) {
      await logModelRun(m.sportKey, 'ingest',    () => m.ingestData());
      await logModelRun(m.sportKey, 'recompute', () => m.recomputeRatings());
      await logModelRun(m.sportKey, 'backfill',  () => m.backfillOutcomes());
      await logModelRun(m.sportKey, 'predict',   () => m.generatePredictions());
    }
    console.log('🤖 Daily model cycle complete');
  });

  // Every 4 hours: refresh predictions only (ratings unchanged between daily runs)
  cron.schedule('0 */4 * * *', async () => {
    for (const m of activeModels()) {
      await logModelRun(m.sportKey, 'predict', () => m.generatePredictions());
    }
  });

  // CLV closing line capture — every 5 minutes, captures sharp prices for games about to start
  cron.schedule('*/5 * * * *', async () => {
    try { await captureClosingLines(); } catch (e) {
      console.error('CLV capture error:', e.message);
    }
  });

  // First-boot: if no model data exists, run full ingest + compute for each active model
  setTimeout(async () => {
    for (const m of activeModels()) {
      try {
        await logModelRun(m.sportKey, 'ingest',    () => m.ingestData());
        await logModelRun(m.sportKey, 'recompute', () => m.recomputeRatings());
        await logModelRun(m.sportKey, 'predict',   () => m.generatePredictions());
      } catch (e) {
        console.error(`Boot init ${m.sportKey} failed:`, e.message);
      }
    }
    console.log('🤖 Boot model init complete');
  }, 5000);

  const active = SPORT_SCHEDULE.filter(s => s.inSeason()).length;
  console.log(`✅ Scheduler running — ${active}/${SPORT_SCHEDULE.length} sports in season`);
}

module.exports = { initScheduler, setIO, recomputeAll, printBudget };