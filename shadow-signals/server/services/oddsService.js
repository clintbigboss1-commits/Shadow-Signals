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

const SGO_API_KEY    = process.env.SPORT_GAME_ODDS || '';
const SGO_BASE       = 'https://api.sportsgameodds.com/v2';

// The Odds API (the-odds-api.com) — primary paid source (100k credits/month)
const TOA_API_KEY  = process.env.ODDS_API_KEY || '';
const TOA_BASE     = 'https://api.the-odds-api.com/v4';
const TOA_REGIONS  = process.env.THE_ODDS_API_REGIONS || 'au,eu';
const TOA_MARKETS  = 'h2h,spreads,totals';

// Only sports where our internal key differs from The Odds API key
const TOA_KEY_OVERRIDES = {
  'soccer_ucl':      'soccer_uefa_champs_league',
  'soccer_la_liga':  'soccer_spain_la_liga',
  'soccer_bundesliga': 'soccer_germany_bundesliga',
  'soccer_serie_a':  'soccer_italy_serie_a',
  'soccer_europa':   'soccer_uefa_europa_league',
  'soccer_ligue_1':  'soccer_france_ligue_one',
  'soccer_mls':      'soccer_usa_mls',
  'soccer_brazil':   'soccer_brazil_campeonato',
  'soccer_a_league': 'soccer_australia_aleague',
};

// Resolve internal sportKey → The Odds API key
function toaKey(sportKey) {
  return TOA_KEY_OVERRIDES[sportKey] || sportKey;
}

const ESPN_BASE     = 'https://site.api.espn.com/apis/site/v2/sports';
const SPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';
const BDL_BASE      = 'https://api.balldontlie.io/v1';

// ── SportGameOdds leagueID mapping ──────────────────────────────────────────
const SGO_LEAGUES = {
  'soccer_epl':                  'EPL',
  'soccer_ucl':                  'UEFA_CHAMPIONS_LEAGUE',
  'soccer_la_liga':              'LA_LIGA',
  'soccer_bundesliga':           'BUNDESLIGA',
  'soccer_serie_a':              'SERIE_A',
  'soccer_europa':               'UEFA_EUROPA_LEAGUE',
  'soccer_ligue_1':              'LIGUE_1',
  'soccer_mls':                  'MLS',
  'soccer_brazil':               'BRASILEIRAO',
  'basketball_nba':              'NBA',
  'basketball_nbl':              'NBL',
  'americanfootball_nfl':        'NFL',
  'baseball_mlb':                'MLB',
  'icehockey_nhl':               'NHL',
  'mma_mixed_martial_arts':      'UFC',
  'aussierules_afl':             'AFL',
  'rugbyleague_nrl':             'NRL',
};

const AU_SPORTS = {
  // AU — top priority
  'aussierules_afl':                       { name: 'AFL',              emoji: '🏉', priority: 1 },
  'rugbyleague_nrl':                       { name: 'NRL',              emoji: '🏉', priority: 1 },
  'rugbyleague_nrl_state_of_origin':       { name: 'State of Origin',  emoji: '🏉', priority: 1 },
  // Cricket
  'cricket_international_t20':             { name: 'T20I',             emoji: '🏏', priority: 2 },
  'cricket_odi':                           { name: 'ODI',              emoji: '🏏', priority: 2 },
  'cricket_test_match':                    { name: 'Test Cricket',     emoji: '🏏', priority: 2 },
  // American Football
  'americanfootball_nfl':                  { name: 'NFL',              emoji: '🏈', priority: 1 },
  'americanfootball_nfl_preseason':        { name: 'NFL Preseason',    emoji: '🏈', priority: 3 },
  'americanfootball_nfl_super_bowl_winner':{ name: 'Super Bowl',       emoji: '🏈', priority: 3 },
  'americanfootball_ncaaf':                { name: 'NCAAF',            emoji: '🏈', priority: 2 },
  'americanfootball_ncaaf_championship_winner': { name: 'NCAAF Title', emoji: '🏈', priority: 3 },
  'americanfootball_cfl':                  { name: 'CFL',              emoji: '🏈', priority: 3 },
  'americanfootball_ufl':                  { name: 'UFL',              emoji: '🏈', priority: 3 },
  // Basketball
  'basketball_nba':                        { name: 'NBA',              emoji: '🏀', priority: 1 },
  'basketball_nba_championship_winner':    { name: 'NBA Title',        emoji: '🏀', priority: 3 },
  'basketball_nbl':                        { name: 'NBL',              emoji: '🏀', priority: 2 },
  'basketball_wnba':                       { name: 'WNBA',             emoji: '🏀', priority: 2 },
  // Baseball
  'baseball_mlb':                          { name: 'MLB',              emoji: '⚾', priority: 2 },
  'baseball_mlb_world_series_winner':      { name: 'World Series',     emoji: '⚾', priority: 3 },
  'baseball_milb':                         { name: 'MiLB',             emoji: '⚾', priority: 3 },
  'baseball_ncaa':                         { name: 'NCAA Baseball',    emoji: '⚾', priority: 3 },
  'baseball_kbo':                          { name: 'KBO',              emoji: '⚾', priority: 3 },
  'baseball_npb':                          { name: 'NPB',              emoji: '⚾', priority: 3 },
  // Ice Hockey
  'icehockey_nhl':                         { name: 'NHL',              emoji: '🏒', priority: 2 },
  'icehockey_nhl_championship_winner':     { name: 'Stanley Cup',      emoji: '🏒', priority: 3 },
  'icehockey_ahl':                         { name: 'AHL',              emoji: '🏒', priority: 3 },
  // Combat
  'mma_mixed_martial_arts':                { name: 'MMA',              emoji: '🥊', priority: 1 },
  'boxing_boxing':                         { name: 'Boxing',           emoji: '🥊', priority: 2 },
  // Soccer — active now
  'soccer_fifa_world_cup':                 { name: 'World Cup',        emoji: '⚽', priority: 1 },
  'soccer_fifa_world_cup_winner':          { name: 'World Cup Winner', emoji: '⚽', priority: 2 },
  'soccer_conmebol_copa_libertadores':     { name: 'Copa Lib',         emoji: '⚽', priority: 2 },
  'soccer_conmebol_copa_sudamericana':     { name: 'Copa Sud',         emoji: '⚽', priority: 2 },
  'soccer_germany_dfb_pokal':              { name: 'DFB-Pokal',        emoji: '⚽', priority: 2 },
  'soccer_brazil_serie_b':                 { name: 'Brazil Série B',   emoji: '⚽', priority: 3 },
  'soccer_chile_campeonato':               { name: 'Chile Liga',       emoji: '⚽', priority: 3 },
  'soccer_china_superleague':              { name: 'China SL',         emoji: '⚽', priority: 3 },
  'soccer_norway_eliteserien':             { name: 'Eliteserien',      emoji: '⚽', priority: 3 },
  'soccer_sweden_allsvenskan':             { name: 'Allsvenskan',      emoji: '⚽', priority: 3 },
  'soccer_sweden_superettan':              { name: 'Superettan',       emoji: '⚽', priority: 3 },
  'soccer_finland_veikkausliiga':          { name: 'Finland Liga',     emoji: '⚽', priority: 3 },
  'soccer_spain_segunda_division':         { name: 'La Liga 2',        emoji: '⚽', priority: 3 },
  'soccer_league_of_ireland':              { name: 'Ireland League',   emoji: '⚽', priority: 3 },
  // Soccer — seasonal (back Aug/Sep)
  'soccer_epl':                            { name: 'EPL',              emoji: '⚽', priority: 1 },
  'soccer_ucl':                            { name: 'UCL',              emoji: '⚽', priority: 1 },
  'soccer_la_liga':                        { name: 'La Liga',          emoji: '⚽', priority: 1 },
  'soccer_bundesliga':                     { name: 'Bundesliga',       emoji: '⚽', priority: 1 },
  'soccer_serie_a':                        { name: 'Serie A',          emoji: '⚽', priority: 1 },
  'soccer_europa':                         { name: 'Europa League',    emoji: '⚽', priority: 2 },
  'soccer_ligue_1':                        { name: 'Ligue 1',          emoji: '⚽', priority: 2 },
  'soccer_mls':                            { name: 'MLS',              emoji: '⚽', priority: 2 },
  'soccer_brazil':                         { name: 'Brazil Série A',   emoji: '⚽', priority: 2 },
  'soccer_a_league':                       { name: 'A-League',         emoji: '⚽', priority: 1 },
  // Tennis
  'tennis_wta_queens_club_champ':          { name: "WTA Queen's",      emoji: '🎾', priority: 3 },
  // Golf
  'golf_the_open_championship_winner':     { name: 'The Open',         emoji: '⛳', priority: 3 },
  'golf_us_open_winner':                   { name: 'US Open Golf',     emoji: '⛳', priority: 3 },
  // Other
  'lacrosse_pll':                          { name: 'PLL',              emoji: '🥍', priority: 3 },
  'politics_us_presidential_election_winner': { name: 'US Election',   emoji: '🗳️', priority: 3 },
};

function americanToDecimal(american) {
  if (american === null || american === undefined || american === '') return null;
  const a = parseInt(american, 10);
  if (isNaN(a) || a === 0) return null;
  if (a > 0) return parseFloat((1 + a / 100).toFixed(3));
  if (a < 0) return parseFloat((1 + 100 / Math.abs(a)).toFixed(3));
  return null;
}

// Demo odds — fallback when no live API data is available.
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
  const sportTitle = AU_SPORTS[sportKey]?.name || sportKey;

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

// ── The Odds API REST (the-odds-api.com) ────────────────────────────────────
// Response shape already matches our internal event format almost exactly.
async function fetchFromTheOddsApi(sportKey) {
  if (!TOA_API_KEY) return { events: [], source: 'no-key', callsUsed: 0 };

  if (!AU_SPORTS[sportKey]) return { events: [], source: 'unsupported-league', callsUsed: 0 };

  const sportTitle = AU_SPORTS[sportKey]?.name || sportKey;

  try {
    const resp = await axios.get(`${TOA_BASE}/sports/${toaKey(sportKey)}/odds`, {
      params: {
        apiKey: TOA_API_KEY,
        regions: TOA_REGIONS,
        markets: TOA_MARKETS,
        oddsFormat: 'decimal',
        dateFormat: 'iso',
      },
      timeout: 12000,
    });

    const remaining = resp.headers['x-requests-remaining'];
    if (remaining !== undefined && Number(remaining) < 500) {
      console.warn(`⚠️  The Odds API: only ${remaining} credits left this month!`);
    }

    const rawEvents = Array.isArray(resp.data) ? resp.data : [];
    const now = Date.now();
    const events = [];

    for (const ev of rawEvents) {
      if (!ev.home_team || !ev.away_team || !Array.isArray(ev.bookmakers)) continue;
      // Skip games that already started
      if (ev.commence_time && new Date(ev.commence_time).getTime() < now) continue;
      // Need 2+ books for EV/arb math
      if (ev.bookmakers.length < 2) continue;

      events.push({
        id: ev.id,
        sport_key: sportKey,
        sport_title: sportTitle,
        home_team: ev.home_team,
        away_team: ev.away_team,
        commence_time: ev.commence_time,
        bookmakers: ev.bookmakers.map(b => ({
          key: b.key,
          title: b.title,
          markets: (b.markets || []).map(m => ({
            key: m.key,
            outcomes: (m.outcomes || []).map(o => ({ name: o.name, price: o.price, point: o.point })),
          })),
        })),
      });
    }

    return { events, source: 'theoddsapi', callsUsed: 1, remaining };
  } catch (err) {
    const status = err.response?.status;
    console.warn(`⚠️  The Odds API error for ${sportKey}:`, status ? `HTTP ${status}` : err.message);
    return { events: [], source: 'toa-error', callsUsed: 1 };
  }
}

// ── SportGameOdds REST API ──────────────────────────────────────────────────
async function fetchFromSportsGameOdds(sportKey) {
  if (!SGO_API_KEY) return { events: [], source: 'no-key', callsUsed: 0 };

  const leagueID = SGO_LEAGUES[sportKey];
  if (!leagueID) return { events: [], source: 'unsupported-league', callsUsed: 0 };

  const sportTitle = AU_SPORTS[sportKey]?.name || sportKey;

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
  const sportTitle = AU_SPORTS[sportKey]?.name || sportKey;

  // ── 0) The Odds API (primary paid source — 100k credits/month) ──────────
  if (TOA_API_KEY && AU_SPORTS[sportKey] && canCallAPI('theoddsapi')) {
    console.log(`🌐 Fetching The Odds API: ${sportTitle} (${sportKey})`);
    try {
      const result = await fetchFromTheOddsApi(sportKey);
      if (result.events && result.events.length > 0) {
        await recordAPICall('theoddsapi', sportKey, result.remaining ?? null);
        setL1(l1Key, result.events, ttl);
        await setL2Odds(sportKey, result.events, ttl * 6, 'theoddsapi');
        console.log(`✅ The Odds API: ${result.events.length} events for ${sportTitle} (${result.remaining ?? '?'} credits left)`);
        return { events: result.events, source: 'theoddsapi', callsUsed: 1 };
      }
      console.log(`ℹ️  The Odds API: 0 events for ${sportTitle} (source: ${result.source})`);
    } catch (err) {
      console.warn(`⚠️  The Odds API error for ${sportTitle}:`, err.message);
    }
  }

  // ── 1) SportGameOdds REST (fallback) ─────────────────────────────────────
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

  // ── 2) Demo data (last resort) ───────────────────────────────────────────
  const demoEvents = generateDemoOdds(sportKey);
  if (demoEvents.length > 0) {
    setL1(l1Key, demoEvents, ttl);
    try { await setL2Odds(sportKey, demoEvents, ttl * 6, 'demo'); } catch (_) {}
    console.log(`📊 Demo data: ${demoEvents.length} events for ${sportTitle}`);
    return { events: demoEvents, source: 'demo-fallback', callsUsed: 0 };
  }

  return { events: [], source: 'no-data', callsUsed: 0 };
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
  const active = Object.keys(AU_SPORTS);
  setL1(key, active, 6 * 3600);
  return active;
}

module.exports = {
  fetchFromOddsAPI,
  fetchESPN,
  fetchSportsDB,
  fetchNBA,
  getActiveSports,
  AU_SPORTS,
  americanToDecimal,
  generateDemoOdds,
};
