'use strict';
require('dotenv').config();
const axios = require('axios');
const {
  canCallAPI,
  recordAPICall,
  getL1,
  setL1,
  getL2Odds,
  setL2Odds,
} = require('./cacheManager');

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const ESPN_BASE     = 'https://site.api.espn.com/apis/site/v2/sports';
const SPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';
const BDL_BASE      = 'https://api.balldontlie.io/v1';

const AU_BOOKMAKERS = [
  'sportsbet', 'tab', 'bet365', 'ladbrokes',
  'neds', 'pointsbet', 'bluebet', 'betfair_ex_au',
  'unibet', 'betright',
];

const AU_SPORTS = {
  'aussierules_afl':        { name: 'AFL',      emoji: '🏉', priority: 1 },
  'rugbyleague_nrl':        { name: 'NRL',      emoji: '🏉', priority: 1 },
  'cricket_odi':            { name: 'Cricket',  emoji: '🏏', priority: 2 },
  'cricket_t20':            { name: 'T20',      emoji: '🏏', priority: 2 },
  'soccer_a_league':        { name: 'A-League', emoji: '⚽', priority: 2 },
  'soccer_epl':             { name: 'EPL',      emoji: '⚽', priority: 3 },
  'tennis_atp_aus_open':    { name: 'Tennis',   emoji: '🎾', priority: 3 },
  'basketball_nbl':         { name: 'NBL',      emoji: '🏀', priority: 3 },
  'mma_mixed_martial_arts': { name: 'UFC',      emoji: '🥊', priority: 3 },
};

// ── 1. The Odds API ────────────────────────────────────────────────────────
async function fetchFromOddsAPI(sportKey) {
  const l1Key = `oddsapi:${sportKey}`;

  // L1 check
  const l1 = getL1(l1Key);
  if (l1) return { events: l1, source: 'L1-memory', callsUsed: 0 };

  // L2 check
  const l2 = await getL2Odds(sportKey);
  if (l2 && l2.length > 0) {
    const ttl = parseInt(process.env.CACHE_ODDS_TTL || '45');
    setL1(l1Key, l2, ttl);
    return { events: l2, source: 'L2-db', callsUsed: 0 };
  }

  // Budget check
  if (!canCallAPI('the-odds-api')) {
    console.warn('❌ Odds API budget exhausted for this month');
    return { events: [], source: 'budget-exceeded', callsUsed: 0 };
  }

  // Real API call
  console.log(`🌐 Calling Odds API: ${sportKey}`);
  try {
    const res = await axios.get(`${ODDS_API_BASE}/sports/${sportKey}/odds`, {
      params: {
        apiKey: process.env.ODDS_API_KEY,
        regions: 'au',
        markets: 'h2h,spreads,totals',
        bookmakers: AU_BOOKMAKERS.join(','),
        oddsFormat: 'decimal',
        dateFormat: 'iso',
      },
      timeout: 10000,
    });

    const remaining = parseInt(res.headers['x-requests-remaining'] || '0');
    await recordAPICall('the-odds-api', `/sports/${sportKey}/odds`, remaining);

    const events = res.data || [];
    const ttl = parseInt(process.env.CACHE_ODDS_TTL || '45');
    setL1(l1Key, events, ttl);
    await setL2Odds(sportKey, events, ttl * 6, 'the-odds-api');

    console.log(`✅ Odds API: ${events.length} events for ${sportKey} | ${remaining} calls left`);
    return { events, source: 'odds-api', callsUsed: 1, remaining };

  } catch (err) {
    if (err.response?.status === 401) {
      console.error('❌ Odds API: Invalid API key');
    } else if (err.response?.status === 422) {
      console.warn(`⚠️  Odds API: Sport not available: ${sportKey}`);
    } else {
      console.error(`❌ Odds API error (${sportKey}):`, err.message);
    }
    return { events: [], source: 'error', callsUsed: 0 };
  }
}

// ── 2. ESPN (Free, Unlimited) ──────────────────────────────────────────────
const ESPN_PATHS = {
  afl:     'australian-football/afl',
  nrl:     'rugby-league/nrl',
  aleague: 'soccer/aus.1',
  nbl:     'basketball/nbl',
  cricket: 'cricket/bbl',
};

async function fetchESPN(sport) {
  const espnPath = ESPN_PATHS[sport];
  if (!espnPath) return [];

  const key = `espn:${sport}`;
  const cached = getL1(key);
  if (cached) return cached;

  try {
    const res = await axios.get(`${ESPN_BASE}/${espnPath}/scoreboard`, {
      params: { limit: 100 },
      timeout: 6000,
      headers: { 'User-Agent': 'ShadowSignals/1.0' },
    });
    const events = res.data?.events || [];
    setL1(key, events, 300); // 5 min
    return events;
  } catch (err) {
    console.error(`ESPN error (${sport}):`, err.message);
    return [];
  }
}

// ── 3. TheSportsDB (Free, Unlimited) ──────────────────────────────────────
async function fetchSportsDB(leagueId) {
  const key = `sportsdb:${leagueId}`;
  const cached = getL1(key);
  if (cached) return cached;

  try {
    const res = await axios.get(
      `${SPORTSDB_BASE}/eventsnextleague.php?id=${leagueId}`,
      { timeout: 6000 }
    );
    const events = res.data?.events || [];
    setL1(key, events, 1800); // 30 min
    return events;
  } catch (err) {
    return [];
  }
}

// ── 4. BallDontLie NBA (Free, Unlimited) ──────────────────────────────────
async function fetchNBA() {
  const today = new Date().toISOString().split('T')[0];
  const key = `bdl:${today}`;
  const cached = getL1(key);
  if (cached) return cached;

  try {
    const res = await axios.get(`${BDL_BASE}/games`, {
      params: { 'dates[]': today, per_page: 20 },
      timeout: 6000,
    });
    const games = res.data?.data || [];
    setL1(key, games, 1800);
    return games;
  } catch (err) {
    return [];
  }
}

// ── Active Sports selector ─────────────────────────────────────────────────
async function getActiveSports() {
  const key = 'active-sports';
  const cached = getL1(key);
  if (cached) return cached;

  if (!canCallAPI('the-odds-api')) {
    return ['aussierules_afl', 'rugbyleague_nrl'];
  }

  try {
    const res = await axios.get(`${ODDS_API_BASE}/sports`, {
      params: { apiKey: process.env.ODDS_API_KEY, all: false },
      timeout: 6000,
    });
    await recordAPICall('the-odds-api', '/sports');

    const active = res.data
      .filter(s => AU_SPORTS[s.key])
      .map(s => s.key);

    setL1(key, active, 6 * 3600); // 6 hours
    console.log(`✅ Active AU sports: ${active.join(', ')}`);
    return active;
  } catch (err) {
    return Object.keys(AU_SPORTS);
  }
}

module.exports = {
  fetchFromOddsAPI,
  fetchESPN,
  fetchSportsDB,
  fetchNBA,
  getActiveSports,
  AU_SPORTS,
  AU_BOOKMAKERS,
};
