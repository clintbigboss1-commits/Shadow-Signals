'use strict';
require('dotenv').config();
const axios = require('axios');
const WebSocket = require('ws');
const {
  canCallAPI,
  recordAPICall,
  getL1,
  setL1,
  getL2Odds,
  setL2Odds,
} = require('./cacheManager');

const ODDS_API_PROVIDER = process.env.ODDS_API_PROVIDER || 'boltodds';
const BOLTODDS_KEY      = process.env.BOLTODDS_KEY || process.env.ODDS_API_KEY;
const BOLTODDS_WS_URL   = process.env.BOLTODDS_WS_URL  || 'wss://spro.agency/api';
const BOLTODDS_REST_URL = process.env.BOLTODDS_REST_URL || 'https://spro.agency/api';

const SGO_API_KEY    = process.env.SPORT_GAME_ODDS || '';
const SGO_BASE       = 'https://api.sportsgameodds.com/v2';

const ESPN_BASE     = 'https://site.api.espn.com/apis/site/v2/sports';
const SPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';
const BDL_BASE      = 'https://api.balldontlie.io/v1';

// ── SportGameOdds leagueID mapping ──────────────────────────────────────────
const SGO_LEAGUES = {
  'soccer_epl':           'EPL',
  'soccer_ucl':           'UEFA_CHAMPIONS_LEAGUE',
  'soccer_la_liga':       'LA_LIGA',
  'soccer_bundesliga':    'BUNDESLIGA',
  'soccer_serie_a':       'SERIE_A',
  'soccer_europa':        'UEFA_EUROPA_LEAGUE',
  'soccer_ligue_1':       'LIGUE_1',
  'soccer_mls':           'MLS',
  'soccer_brazil':        'BRASILEIRAO',
  'basketball_nba':       'NBA',
  'basketball_nbl':       'NBL',
  'americanfootball_nfl': 'NFL',
  'baseball_mlb':         'MLB',
  'icehockey_nhl':        'NHL',
  'mma_ufc':              'UFC',
  'tennis_atp':           'ATP',
  'golf_pga':             'PGA',
};

const BOLTODDS_SPORTS = {
  'EPL':                { key: 'soccer_epl',     name: 'EPL',           emoji: '⚽', priority: 1 },
  'La Liga':            { key: 'soccer_la_liga', name: 'La Liga',       emoji: '⚽', priority: 1 },
  'Bundesliga':         { key: 'soccer_bundesliga', name: 'Bundesliga', emoji: '⚽', priority: 1 },
  'Serie A':            { key: 'soccer_serie_a', name: 'Serie A',       emoji: '⚽', priority: 1 },
  'Champions League':   { key: 'soccer_ucl',     name: 'UCL',           emoji: '⚽', priority: 1 },
  'Europa League':      { key: 'soccer_europa',  name: 'Europa League', emoji: '⚽', priority: 2 },
  'Ligue 1':            { key: 'soccer_ligue_1', name: 'Ligue 1',       emoji: '⚽', priority: 2 },
  'MLS':                { key: 'soccer_mls',     name: 'MLS',           emoji: '⚽', priority: 2 },
  'Brazil Serie A':     { key: 'soccer_brazil',  name: 'Brazil Serie A',emoji: '⚽', priority: 2 },
  'NBA':                { key: 'basketball_nba', name: 'NBA',           emoji: '🏀', priority: 1 },
  'NFL':                { key: 'americanfootball_nfl', name: 'NFL',  emoji: '🏈', priority: 1 },
  'MLB':                { key: 'baseball_mlb',   name: 'MLB',           emoji: '⚾', priority: 2 },
  'NHL':                { key: 'icehockey_nhl',  name: 'NHL',           emoji: '🏒', priority: 2 },
  'Australian NBL':     { key: 'basketball_nbl', name: 'NBL',           emoji: '🏀', priority: 2 },
  'UFC':                { key: 'mma_ufc',        name: 'UFC',           emoji: '🥊', priority: 1 },
  'Boxing':             { key: 'mma_boxing',     name: 'Boxing',        emoji: '🥊', priority: 2 },
  'Tennis':             { key: 'tennis_atp',     name: 'Tennis',        emoji: '🎾', priority: 2 },
  'Golf':               { key: 'golf_pga',       name: 'Golf',          emoji: '⛳', priority: 3 },
};

const INTERNAL_TO_BOLTODDS = {};
for (const [bname, info] of Object.entries(BOLTODDS_SPORTS)) {
  INTERNAL_TO_BOLTODDS[info.key] = bname;
}

const AU_SPORTS = {};
for (const info of Object.values(BOLTODDS_SPORTS)) {
  AU_SPORTS[info.key] = { name: info.name, emoji: info.emoji, priority: info.priority };
}

const DEFAULT_SPORTSBOOKS = [
  'draftkings', 'fanduel', 'betmgm', 'caesars',
  'espnbet', 'hardrock', 'betonline', 'bovada',
];
const DEFAULT_MARKETS = ['Moneyline', 'Spread', 'Total'];

function americanToDecimal(american) {
  if (american === null || american === undefined || american === '') return null;
  const a = parseInt(american, 10);
  if (isNaN(a) || a === 0) return null;
  if (a > 0) return parseFloat((1 + a / 100).toFixed(3));
  if (a < 0) return parseFloat((1 + 100 / Math.abs(a)).toFixed(3));
  return null;
}

function parseOutcomeName(outcomeName) {
  if (outcomeName.endsWith(' Moneyline')) {
    return { market: 'h2h', selection: outcomeName.replace(/ Moneyline$/, '').trim() };
  }
  if (/^(Over|Under) /i.test(outcomeName)) {
    return { market: 'totals', selection: outcomeName.trim() };
  }
  return { market: 'spreads', selection: outcomeName.trim() };
}

function fetchFromBoltOdds(boltSportName, opts = {}) {
  return new Promise((resolve) => {
    const sportsbooks = opts.sportsbooks || DEFAULT_SPORTSBOOKS;
    const markets     = opts.markets     || DEFAULT_MARKETS;
    const timeoutMs   = opts.timeoutMs   || 8000;
    let settled = false;
    const finish = (result) => { if (!settled) { settled = true; resolve(result); } };

    const deadline = setTimeout(() => {
      try { ws.terminate(); } catch (_) {}
      finish({ events: [], source: 'timeout', callsUsed: 0 });
    }, timeoutMs);

    const byBook = {};
    let socketConnected = false;
    const ws = new WebSocket(`${BOLTODDS_WS_URL}?key=${BOLTODDS_KEY}`);

    ws.on('message', (raw) => {
      let parsed;
      try { parsed = JSON.parse(raw.toString()); } catch { return; }
      const msgs = Array.isArray(parsed) ? parsed : [parsed];
      for (const msg of msgs) {
        if (msg.action === 'socket_connected') {
          socketConnected = true;
          ws.send(JSON.stringify({
            action: 'subscribe',
            filters: { sports: [boltSportName], sportsbooks, markets },
          }));
        } else if (msg.action === 'initial_state' && msg.data) {
          const d = msg.data;
          const book = (d.sportsbook || 'unknown').toLowerCase();
          if (!byBook[book]) byBook[book] = [];
          byBook[book].push(d);
        }
      }
    });

    ws.on('error', (err) => {
      clearTimeout(deadline);
      finish({ events: [], source: 'ws-error', callsUsed: 0 });
    });

    ws.on('close', () => {
      clearTimeout(deadline);
      if (!socketConnected) { finish({ events: [], source: 'no-ack', callsUsed: 0 }); return; }
      const gameMap = {};
      const internalKey = Object.keys(INTERNAL_TO_BOLTODDS).find(k => INTERNAL_TO_BOLTODDS[k] === boltSportName)
        || boltSportName.toLowerCase().replace(/\s+/g, '_');
      for (const [book, payloads] of Object.entries(byBook)) {
        for (const p of payloads) {
          const gameKey = p.game || (p.home_team + '__' + p.away_team);
          if (!gameMap[gameKey]) {
            gameMap[gameKey] = {
              id: gameKey,
              sport_key: internalKey,
              sport_title: boltSportName,
              home_team: p.home_team,
              away_team: p.away_team,
              commence_time: p.info && p.info.when ? new Date(p.info.when).toISOString() : new Date().toISOString(),
              bookmakers: {},
            };
          }
          const ev = gameMap[gameKey];
          if (!ev.bookmakers[book]) ev.bookmakers[book] = { key: book, title: book, markets: [] };
          const marketMap = {};
          for (const [outName, outData] of Object.entries(p.outcomes || {})) {
            if (!outData) continue;
            const decimalOdds = americanToDecimal(outData.odds);
            if (decimalOdds === null) continue;
            const parsed = parseOutcomeName(outName);
            if (!marketMap[parsed.market]) marketMap[parsed.market] = { key: parsed.market, outcomes: [] };
            marketMap[parsed.market].outcomes.push({ name: parsed.selection, price: decimalOdds });
          }
          for (const [mk, mv] of Object.entries(marketMap)) {
            ev.bookmakers[book].markets.push(mv);
          }
        }
      }
      const events = Object.values(gameMap);
      finish({ events, source: events.length ? 'boltodds-ws' : 'no-events', callsUsed: 1 });
    });
  });
}

// Demo odds — fallback when API plan doesn't include real odds (Trial plan).
// The shape matches what the EV calculator + UI expect, so real odds slot in seamlessly.
// TO REPLACE: upgrade BoltOdds to a paid plan, or integrate API-FOOTBALL.
const DEMO_GAMES = {
  soccer_epl: [
    { home: 'Arsenal',           away: 'Chelsea',         commenceOffsetH: 4 },
    { home: 'Manchester City',   away: 'Liverpool',       commenceOffsetH: 6 },
    { home: 'Tottenham',         away: 'Manchester Utd',  commenceOffsetH: 22 },
    { home: 'Newcastle',         away: 'Aston Villa',     commenceOffsetH: 26 },
    { home: 'Brighton',          away: 'West Ham',        commenceOffsetH: 30 },
    { home: 'Bournemouth',       away: 'Wolves',          commenceOffsetH: 48 },
  ],
  soccer_la_liga: [
    { home: 'Real Madrid',       away: 'Barcelona',       commenceOffsetH: 8 },
    { home: 'Atletico Madrid',   away: 'Sevilla',         commenceOffsetH: 24 },
    { home: 'Real Sociedad',     away: 'Villarreal',      commenceOffsetH: 30 },
    { home: 'Athletic Bilbao',   away: 'Real Betis',      commenceOffsetH: 48 },
  ],
  soccer_bundesliga: [
    { home: 'Bayern Munich',     away: 'Borussia Dortmund', commenceOffsetH: 5 },
    { home: 'RB Leipzig',        away: 'Bayer Leverkusen',  commenceOffsetH: 28 },
  ],
  soccer_serie_a: [
    { home: 'Inter Milan',       away: 'AC Milan',        commenceOffsetH: 7 },
    { home: 'Juventus',          away: 'Napoli',          commenceOffsetH: 30 },
  ],
  soccer_ucl: [
    { home: 'PSG',               away: 'Man City',        commenceOffsetH: 36 },
    { home: 'Real Madrid',       away: 'Bayern',          commenceOffsetH: 48 },
  ],
  basketball_nba: [
    { home: 'LA Lakers',         away: 'Boston Celtics',  commenceOffsetH: 3 },
    { home: 'Golden State',      away: 'Denver Nuggets',  commenceOffsetH: 5 },
    { home: 'Milwaukee',         away: 'Phoenix',         commenceOffsetH: 7 },
    { home: 'Miami Heat',        away: 'Dallas Mavericks',commenceOffsetH: 22 },
    { home: 'Philadelphia',      away: 'New York Knicks', commenceOffsetH: 26 },
    { home: 'Cleveland',         away: 'Indiana',         commenceOffsetH: 30 },
  ],
  americanfootball_nfl: [
    { home: 'Kansas City',       away: 'Buffalo',         commenceOffsetH: 72 },
    { home: 'San Francisco',     away: 'Dallas Cowboys',  commenceOffsetH: 96 },
    { home: 'Philadelphia',      away: 'Green Bay',       commenceOffsetH: 120 },
  ],
  baseball_mlb: [
    { home: 'NY Yankees',        away: 'LA Dodgers',      commenceOffsetH: 4 },
    { home: 'Houston Astros',    away: 'Atlanta Braves',  commenceOffsetH: 6 },
    { home: 'San Diego Padres',  away: 'Philadelphia',    commenceOffsetH: 8 },
    { home: 'Toronto Blue Jays', away: 'Baltimore',       commenceOffsetH: 24 },
  ],
  icehockey_nhl: [
    { home: 'Edmonton Oilers',   away: 'Florida Panthers',commenceOffsetH: 5 },
    { home: 'Toronto Maple Lfs', away: 'Boston Bruins',   commenceOffsetH: 22 },
  ],
  mma_ufc: [
    { home: 'Islam Makhachev',   away: 'Arman Tsarukyan', commenceOffsetH: 96 },
    { home: 'Alex Pereira',      away: 'Jiri Prochazka',  commenceOffsetH: 120 },
  ],
  tennis_atp: [
    { home: 'Carlos Alcaraz',    away: 'Jannik Sinner',   commenceOffsetH: 12 },
    { home: 'Novak Djokovic',    away: 'Daniil Medvedev', commenceOffsetH: 36 },
  ],
  basketball_nbl: [
    { home: 'Sydney Kings',      away: 'Melbourne United',commenceOffsetH: 12 },
    { home: 'Brisbane Bullets',  away: 'Perth Wildcats',  commenceOffsetH: 30 },
  ],
  golf_pga: [
    { home: 'Scottie Scheffler', away: 'Rory McIlroy',    commenceOffsetH: 48 },
  ],
  mma_boxing: [
    { home: 'Tyson Fury',        away: 'Oleksandr Usyk',  commenceOffsetH: 168 },
  ],
};

const DEMO_BOOKS = [
  { key: 'draftkings', title: 'DraftKings',  margin: 0.040 },
  { key: 'fanduel',    title: 'FanDuel',     margin: 0.045 },
  { key: 'betmgm',     title: 'BetMGM',      margin: 0.050 },
  { key: 'caesars',    title: 'Caesars',     margin: 0.055 },
];

function seededRandom(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function generateDemoOdds(sportKey) {
  const games = DEMO_GAMES[sportKey] || [];
  const events = [];
  const sportTitle = BOLTODDS_SPORTS[Object.keys(BOLTODDS_SPORTS).find(k => BOLTODDS_SPORTS[k].key === sportKey)]?.name || sportKey;

  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    const seed = sportKey + '-' + g.home + '-' + g.away + '-' + i;
    const homeWinProb = 0.35 + seededRandom(seed) * 0.30;
    const awayWinProb = 1 - homeWinProb;
    const commence_time = new Date(Date.now() + g.commenceOffsetH * 3600 * 1000).toISOString();

    const event = {
      id: sportKey + '-' + i,
      sport_key: sportKey,
      sport_title: sportTitle,
      home_team: g.home,
      away_team: g.away,
      commence_time: commence_time,
      bookmakers: {},
    };

    for (const book of DEMO_BOOKS) {
      const bookSeed = seed + '-' + book.key;
      const jitter = (seededRandom(bookSeed) - 0.5) * 0.04;
      let homeP = Math.max(0.05, Math.min(0.95, homeWinProb + jitter));
      let awayP = 1 - homeP;
      homeP = homeP * (1 + book.margin / 2);
      awayP = awayP * (1 + book.margin / 2);
      const homeOdds = parseFloat((1 / homeP).toFixed(3));
      const awayOdds = parseFloat((1 / awayP).toFixed(3));
      event.bookmakers[book.key] = {
        key: book.key,
        title: book.title,
        markets: [
          { key: 'h2h', outcomes: [
            { name: g.home, price: homeOdds },
            { name: g.away, price: awayOdds },
          ]},
        ],
      };
    }
    events.push(event);
  }
  return events;
}

// ── SportGameOdds REST API ──────────────────────────────────────────────────
async function fetchFromSportsGameOdds(sportKey) {
  if (!SGO_API_KEY) return { events: [], source: 'no-key', callsUsed: 0 };

  const leagueID = SGO_LEAGUES[sportKey];
  if (!leagueID) return { events: [], source: 'unsupported-league', callsUsed: 0 };

  const sportTitle = BOLTODDS_SPORTS[Object.keys(BOLTODDS_SPORTS).find(k => BOLTODDS_SPORTS[k].key === sportKey)]?.name || sportKey;

  try {
    const { data: resp } = await axios.get(`${SGO_BASE}/events`, {
      params: {
        leagueID,
        oddsAvailable: true,
        finalized: false,
      },
      headers: { 'x-api-key': SGO_API_KEY },
      timeout: 10000,
    });

    const rawEvents = resp && resp.data ? (Array.isArray(resp.data) ? resp.data : []) : [];
    if (rawEvents.length === 0) return { events: [], source: 'sgo-empty', callsUsed: 1 };

    const events = [];
    for (const ev of rawEvents) {
      if (!ev.teams || !ev.status) continue;
      if (ev.status.started || ev.status.ended || ev.status.completed) continue;

      // Team names are in teams.{home,away}.names.long
      const homeTeam = ev.teams.home?.names?.long || ev.teams.home?.teamID || 'Home';
      const awayTeam = ev.teams.away?.names?.long || ev.teams.away?.teamID || 'Away';
      const eventId  = ev.eventID || `${sportKey}-${homeTeam}-${awayTeam}`;
      const odds     = ev.odds || {};

      // Build bookmaker map from oddIDs
      const bookmakers = {};
      for (const oddID of Object.keys(odds)) {
        const oddData = odds[oddID];
        if (!oddData || !oddData.byBookmaker) continue;

        // Parse the oddID: {statID}-{statEntityID}-{periodID}-{betTypeID}-{sideID}
        // e.g. "points-home-game-ml-home" or "points-home-1h-sp-away"
        const parts = oddID.split('-');
        const betTypeID = oddData.betTypeID || (parts.length >= 4 ? parts[parts.length - 2] : null);
        const sideID    = oddData.sideID || (parts.length >= 5 ? parts[parts.length - 1] : null);
        const statEntity = oddData.statEntityID || (parts.length >= 2 ? parts[1] : 'all');
        const periodID = oddData.periodID || (parts.length >= 3 ? parts[parts.length - 3] : 'game');

        // Skip player props (statEntityID not in [home, away, all])
        if (statEntity !== 'home' && statEntity !== 'away' && statEntity !== 'all') continue;

        // Only full-game markets for now
        if (periodID !== 'game') continue;

        let market, selection;
        if (betTypeID === 'ml' || betTypeID === 'ml3way') {
          market = 'h2h';
          if (sideID === 'home') selection = homeTeam;
          else if (sideID === 'away') selection = awayTeam;
          else if (sideID === 'draw') selection = 'Draw';
          else continue;
        } else if (betTypeID === 'sp') {
          market = 'spreads';
          if (sideID === 'home') selection = homeTeam;
          else if (sideID === 'away') selection = awayTeam;
          else continue;
        } else if (betTypeID === 'ou') {
          market = 'totals';
          selection = sideID === 'over' ? 'Over' : sideID === 'under' ? 'Under' : sideID;
        } else {
          continue;
        }

        for (const [bookID, bookData] of Object.entries(oddData.byBookmaker)) {
          if (!bookData || !bookData.available || !bookData.odds) continue;
          const decimalOdds = americanToDecimal(bookData.odds);
          if (decimalOdds === null) continue;

          const bookKey = bookID.toLowerCase();
          if (!bookmakers[bookKey]) {
            bookmakers[bookKey] = { key: bookKey, title: bookID, markets: {} };
          }
          if (!bookmakers[bookKey].markets[market]) {
            bookmakers[bookKey].markets[market] = { key: market, outcomes: [] };
          }
          bookmakers[bookKey].markets[market].outcomes.push({ name: selection, price: decimalOdds });
        }
      }

      const bookmakersArr = Object.values(bookmakers).map(b => ({
        ...b,
        markets: Object.values(b.markets),
      }));

      // Only include events with at least 2 bookmakers (needed for EV calc)
      if (bookmakersArr.length < 2) continue;

      events.push({
        id: eventId,
        sport_key: sportKey,
        sport_title: sportTitle,
        home_team: homeTeam,
        away_team: awayTeam,
        commence_time: ev.status.startsAt ? new Date(ev.status.startsAt).toISOString() : new Date().toISOString(),
        bookmakers: bookmakersArr,
      });
    }

    return { events, source: 'sportsgameodds', callsUsed: 1 };
  } catch (err) {
    console.warn(`⚠️  SportGameOdds error for ${sportKey}:`, err.message);
    return { events: [], source: 'sgo-error', callsUsed: 1 };
  }
}

async function fetchFromOddsAPI(sportKey) {
  const l1Key = 'oddsapi:' + sportKey;
  const l1 = getL1(l1Key);
  if (l1) return { events: l1, source: 'L1-memory', callsUsed: 0 };

  const l2 = await getL2Odds(sportKey);
  if (l2 && l2.length > 0) {
    const ttl = parseInt(process.env.CACHE_ODDS_TTL || '45');
    setL1(l1Key, l2, ttl);
    return { events: l2, source: 'L2-db', callsUsed: 0 };
  }

  const ttl = parseInt(process.env.CACHE_ODDS_TTL || '45');
  const sportTitle = BOLTODDS_SPORTS[Object.keys(BOLTODDS_SPORTS).find(k => BOLTODDS_SPORTS[k].key === sportKey)]?.name || sportKey;

  // ── 1) SportGameOdds REST (primary source) ──────────────────────────────
  if (SGO_API_KEY && SGO_LEAGUES[sportKey]) {
    console.log(`🌐 Fetching SportGameOdds: ${sportTitle} (${sportKey})`);
    try {
      const result = await fetchFromSportsGameOdds(sportKey);
      if (result.events && result.events.length > 0) {
        await recordAPICall('sportsgameodds', result.source);
        setL1(l1Key, result.events, ttl);
        await setL2Odds(sportKey, result.events, ttl * 6, 'sportsgameodds');
        console.log(`✅ SportGameOdds: ${result.events.length} events for ${sportTitle}`);
        return { events: result.events, source: 'sportsgameodds', callsUsed: 1 };
      }
      console.log(`ℹ️  SportGameOdds: 0 events for ${sportTitle} (source: ${result.source})`);
    } catch (err) {
      console.warn(`⚠️  SportGameOdds error for ${sportTitle}:`, err.message);
    }
  }

  // ── 2) BoltOdds WebSocket (fallback) ─────────────────────────────────────
  const boltName = INTERNAL_TO_BOLTODDS[sportKey];
  if (boltName && canCallAPI('boltodds')) {
    console.log(`🌐 Trying BoltOdds WebSocket: ${boltName} (${sportKey})`);
    try {
      const result = await fetchFromBoltOdds(boltName);
      if (result.events && result.events.length > 0) {
        await recordAPICall('boltodds', 'ws:' + boltName);
        setL1(l1Key, result.events, ttl);
        await setL2Odds(sportKey, result.events, ttl * 6, 'boltodds');
        console.log(`✅ BoltOdds: ${result.events.length} events for ${boltName}`);
        return { events: result.events, source: 'boltodds', callsUsed: 1 };
      }
    } catch (err) {
      console.warn(`⚠️  BoltOdds error for ${boltName}:`, err.message);
    }
  }

  // ── 3) Demo data (last resort) ───────────────────────────────────────────
  const demoEvents = generateDemoOdds(sportKey);
  if (demoEvents.length > 0) {
    setL1(l1Key, demoEvents, ttl);
    try { await setL2Odds(sportKey, demoEvents, ttl * 6, 'demo'); } catch (_) {}
    console.log(`📊 Demo data: ${demoEvents.length} events for ${sportTitle}`);
    return { events: demoEvents, source: 'demo-fallback', callsUsed: 0 };
  }

  return { events: [], source: 'no-data', callsUsed: 0 };
}

async function verifyBoltOddsKey() {
  try {
    const r = await axios.get(BOLTODDS_REST_URL + '/get_info', {
      params: { key: BOLTODDS_KEY },
      timeout: 8000,
    });
    return {
      ok: true,
      sports: r.data && r.data.sports ? r.data.sports : [],
      sportsbooks: r.data && r.data.sportsbooks ? r.data.sportsbooks : [],
    };
  } catch (err) {
    return { ok: false, error: (err.response && err.response.data && err.response.data.message) || err.message };
  }
}

const ESPN_PATHS = {
  nbl: 'basketball/nbl',
  cricket: 'cricket/bbl',
};

async function fetchESPN(sport) {
  const espnPath = ESPN_PATHS[sport];
  if (!espnPath) return [];
  const key = 'espn:' + sport;
  const cached = getL1(key);
  if (cached) return cached;
  try {
    const res = await axios.get(ESPN_BASE + '/' + espnPath + '/scoreboard', {
      params: { limit: 100 },
      timeout: 6000,
      headers: { 'User-Agent': 'ShadowSignals/1.0' },
    });
    const events = (res.data && res.data.events) || [];
    setL1(key, events, 300);
    return events;
  } catch (err) {
    return [];
  }
}

async function fetchSportsDB(leagueId) {
  const key = 'sportsdb:' + leagueId;
  const cached = getL1(key);
  if (cached) return cached;
  try {
    const res = await axios.get(SPORTSDB_BASE + '/eventsnextleague.php?id=' + leagueId, { timeout: 6000 });
    const events = (res.data && res.data.events) || [];
    setL1(key, events, 1800);
    return events;
  } catch (err) {
    return [];
  }
}

async function fetchNBA() {
  const today = new Date().toISOString().split('T')[0];
  const key = 'bdl:' + today;
  const cached = getL1(key);
  if (cached) return cached;
  try {
    const res = await axios.get(BDL_BASE + '/games', {
      params: { 'dates[]': today, per_page: 20 },
      timeout: 6000,
    });
    const games = (res.data && res.data.data) || [];
    setL1(key, games, 1800);
    return games;
  } catch (err) {
    return [];
  }
}

async function getActiveSports() {
  const key = 'active-sports';
  const cached = getL1(key);
  if (cached) return cached;
  const active = Object.keys(BOLTODDS_SPORTS).map(b => BOLTODDS_SPORTS[b].key);
  setL1(key, active, 6 * 3600);
  return active;
}

module.exports = {
  fetchFromOddsAPI,
  fetchESPN,
  fetchSportsDB,
  fetchNBA,
  getActiveSports,
  verifyBoltOddsKey,
  AU_SPORTS,
  BOLTODDS_SPORTS,
  americanToDecimal,
  generateDemoOdds,
};
