'use strict';
const crypto = require('crypto');

// ── In-Memory L1 Cache ─────────────────────────────────────────────────────
const L1 = new Map();

// ── API Budget Tracker ─────────────────────────────────────────────────────
const API_BUDGETS = {
  // 100k credits/month plan; h2h = 1 credit per sport, props = 1-3 per event
  'theoddsapi':     { free_limit: 90000, soft_limit: 85000, used: 0, month: new Date().getMonth() },
  'sportsgameodds': { free_limit: Infinity, soft_limit: Infinity, used: 0, month: new Date().getMonth() },
  'thesportsdb':    { free_limit: Infinity, soft_limit: Infinity, used: 0, month: new Date().getMonth() },
  'balldontlie':    { free_limit: Infinity, soft_limit: Infinity, used: 0, month: new Date().getMonth() },
  'espn':           { free_limit: Infinity, soft_limit: Infinity, used: 0, month: new Date().getMonth() },
};

function checkMonthReset() {
  const now = new Date().getMonth();
  for (const api of Object.values(API_BUDGETS)) {
    if (api.month !== now) {
      api.used = 0;
      api.month = now;
    }
  }
}

function canCallAPI(name) {
  checkMonthReset();
  const b = API_BUDGETS[name];
  return b ? b.used < b.soft_limit : false;
}

async function recordAPICall(name, endpoint, remaining = null) {
  checkMonthReset();
  if (API_BUDGETS[name]) API_BUDGETS[name].used++;

  try {
    const { db } = require('../db');
    const monthYear = new Date().toISOString().slice(0, 7);
    await db.query(
      'INSERT INTO api_call_log (api_name, endpoint, quota_remaining, month_year) VALUES ($1,$2,$3,$4)',
      [name, endpoint, remaining, monthYear]
    );
  } catch (_) { /* non-fatal */ }

  const b = API_BUDGETS[name];
  if (b && b.soft_limit !== Infinity) {
    const left = b.soft_limit - b.used;
    if (left <= 50) console.warn(`⚠️  ${name}: Only ${left} calls left this month!`);
  }
}

// ── L1 Memory Cache ────────────────────────────────────────────────────────
function setL1(key, data, ttlSeconds) {
  L1.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function getL1(key) {
  const item = L1.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) { L1.delete(key); return null; }
  return item.data;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of L1.entries()) {
    if (now > v.expiresAt) L1.delete(k);
  }
}, 5 * 60 * 1000);

// ── Data Integrity ─────────────────────────────────────────────────────────
// Real odds are always >1.01 and < 200. Zero or null = malformed API response.
function isValidOdds(price) {
  return typeof price === 'number' && isFinite(price) && price > 1.01 && price < 200;
}

// ── Differential Storage (hash-based dedup) ────────────────────────────────
// Returns a 16-char hex hash of the price+point combination.
// If hash matches the existing row, the UPDATE is skipped entirely (WHERE clause).
function oddsHash(price, point) {
  return crypto
    .createHash('md5')
    .update(`${Number(price).toFixed(3)}|${point ?? 'null'}`)
    .digest('hex')
    .slice(0, 16);
}

// ── L2 DB Odds Cache ───────────────────────────────────────────────────────
async function getL2Odds(sportKey) {
  const { db } = require('../db');
  const result = await db.query(
    `SELECT * FROM odds_cache WHERE sport_key = $1 AND expires_at > NOW() ORDER BY fetched_at DESC`,
    [sportKey]
  );

  if (result.rows.length === 0) return null;

  const events = {};
  for (const row of result.rows) {
    if (!events[row.event_id]) {
      events[row.event_id] = {
        id: row.event_id,
        sport_key: row.sport_key,
        home_team: row.home_team,
        away_team: row.away_team,
        commence_time: row.commence_time,
        bookmakers: {},
      };
    }
    const e = events[row.event_id];
    if (!e.bookmakers[row.bookmaker]) {
      e.bookmakers[row.bookmaker] = { key: row.bookmaker, markets: {} };
    }
    const bm = e.bookmakers[row.bookmaker];
    if (!bm.markets[row.market]) {
      bm.markets[row.market] = { key: row.market, outcomes: [] };
    }
    bm.markets[row.market].outcomes.push({
      name: row.selection,
      price: parseFloat(row.odds),
      point: row.point != null ? parseFloat(row.point) : undefined,
    });
  }

  return Object.values(events).map(e => ({
    ...e,
    bookmakers: Object.values(e.bookmakers).map(b => ({
      ...b,
      markets: Object.values(b.markets),
    })),
  }));
}

// marketsFilter: string[] of market keys to expire (null = expire all for sport).
// Pass marketsFilter when storing props so h2h data is not touched.
async function setL2Odds(sportKey, events, ttlSeconds, sourceApi, marketsFilter = null) {
  const { db } = require('../db');
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    if (marketsFilter && marketsFilter.length > 0) {
      await client.query(
        'UPDATE odds_cache SET expires_at = NOW() WHERE sport_key = $1 AND market = ANY($2)',
        [sportKey, marketsFilter]
      );
    } else {
      await client.query(
        'UPDATE odds_cache SET expires_at = NOW() WHERE sport_key = $1',
        [sportKey]
      );
    }

    let stored = 0, skipped = 0;

    for (const event of events) {
      const bookmakers = Array.isArray(event.bookmakers)
        ? event.bookmakers
        : Object.values(event.bookmakers || {});

      for (const bookie of bookmakers) {
        const bookieKey = bookie.key || bookie.title || '';
        for (const market of (bookie.markets || [])) {
          for (const outcome of (market.outcomes || [])) {
            const price = parseFloat(outcome.price);
            const point = outcome.point != null ? parseFloat(outcome.point) : null;

            // Integrity guard — reject malformed prices immediately
            if (!isValidOdds(price)) {
              skipped++;
              continue;
            }

            const hash = oddsHash(price, point);

            // Build selection key: for props combine name + description ("LeBron James Over")
            const selection = outcome.description
              ? `${outcome.name} ${outcome.description}`
              : outcome.name;

            await client.query(
              `INSERT INTO odds_cache
               (sport_key, event_id, home_team, away_team, commence_time,
                bookmaker, market, selection, odds, point, odds_hash, source_api, expires_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
               ON CONFLICT (event_id, bookmaker, market, selection)
               DO UPDATE SET
                 odds        = EXCLUDED.odds,
                 point       = EXCLUDED.point,
                 odds_hash   = EXCLUDED.odds_hash,
                 home_team   = EXCLUDED.home_team,
                 away_team   = EXCLUDED.away_team,
                 commence_time = EXCLUDED.commence_time,
                 fetched_at  = NOW(),
                 expires_at  = EXCLUDED.expires_at,
                 source_api  = EXCLUDED.source_api
               WHERE odds_cache.odds_hash IS DISTINCT FROM EXCLUDED.odds_hash`,
              [
                sportKey,
                event.id,
                event.home_team,
                event.away_team,
                event.commence_time,
                bookieKey,
                market.key,
                selection,
                price,
                point,
                hash,
                sourceApi,
                expiresAt,
              ]
            );
            stored++;
          }
        }
      }
    }

    await client.query('COMMIT');
    if (skipped > 0) console.warn(`⚠️  ${sportKey}: skipped ${skipped} malformed odds rows`);
    return { stored, skipped };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── EV Cache ───────────────────────────────────────────────────────────────
async function getCachedEV(sportKey = 'all', minEV = 0) {
  const key = `ev:${sportKey}:${minEV}`;
  const l1 = getL1(key);
  if (l1) return { data: l1, source: 'L1-memory' };

  const { db } = require('../db');
  let query = `
    SELECT DISTINCT ON (event_id, market, selection)
      *
    FROM ev_opportunities
    WHERE is_active = TRUE
      AND ev_percent >= $1
      AND ev_percent <= 20
      AND expires_at > NOW()
  `;
  const params = [minEV];
  if (sportKey !== 'all') {
    query += ' AND sport_key = $2';
    params.push(sportKey);
  }
  query += ' ORDER BY event_id, market, selection, ev_percent DESC LIMIT 100';

  const result = await db.query(query, params);
  if (result.rows.length > 0) {
    setL1(key, result.rows, 30);
    return { data: result.rows, source: 'L2-db' };
  }
  return { data: [], source: 'empty' };
}

// ── Arb Cache ──────────────────────────────────────────────────────────────
async function getCachedArbs() {
  const key = 'arbs:all';
  const l1 = getL1(key);
  if (l1) return { data: l1, source: 'L1-memory' };

  const { db } = require('../db');
  const result = await db.query(
    `SELECT * FROM arb_opportunities WHERE is_active = TRUE AND profit_percent <= 8 ORDER BY profit_percent DESC LIMIT 50`
  );
  if (result.rows.length > 0) {
    setL1(key, result.rows, 20);
    return { data: result.rows, source: 'L2-db' };
  }
  return { data: [], source: 'empty' };
}

module.exports = {
  canCallAPI,
  recordAPICall,
  setL1,
  getL1,
  getL2Odds,
  setL2Odds,
  getCachedEV,
  getCachedArbs,
  API_BUDGETS,
  isValidOdds,
  oddsHash,
};
