'use strict';
const axios = require('axios');
const { db } = require('../db');

const BASE_URL = 'https://api.theracingapi.com/v1';
const USERNAME = process.env.RACING_API_USERNAME || '';
const PASSWORD = process.env.RACING_API_PASSWORD || '';

// Normalise bookmaker names from The Racing API → Shadow Signals format
const BOOKIE_MAP = {
  'bet365':          'bet365',
  'betfair':         'betfair_ex_au',
  'betfair sp':      'betfair_sp',
  'william hill':    'williamhill',
  'ladbrokes':       'ladbrokes',
  'paddy power':     'paddypower',
  'coral':           'coral',
  'sky bet':         'skybet',
  'skybet':          'skybet',
  'unibet':          'unibet',
  'betway':          'betway',
  'betfred':         'betfred',
  'boylesports':     'boylesports',
  'betvictor':       'betvictor',
  '888sport':        '888sport',
  'sporting index':  'sportingindex',
  'spreadex':        'spreadex',
  'gentingbet':      'gentingbet',
  'tote':            'tote',
  'bet.co.za':       'betcoza',
};

function normBookie(name) {
  return BOOKIE_MAP[(name || '').toLowerCase()] || (name || '').toLowerCase().replace(/\s+/g, '_');
}

// Fetch today's UK/Irish racecards with odds (standard or basic plan)
async function fetchRacecards(regions = ['gb', 'ire']) {
  if (!USERNAME || !PASSWORD) {
    console.warn('⚠️  RACING_API_USERNAME/PASSWORD not set — skipping horse racing fetch');
    return [];
  }

  const regionParams = regions.map(r => `region_codes=${r}`).join('&');

  // Try standard first (includes odds inline), fall back to basic
  for (const tier of ['standard', 'basic', 'free']) {
    try {
      const url = `${BASE_URL}/racecards/${tier}?day=today&${regionParams}`;
      const res = await axios.get(url, {
        auth: { username: USERNAME, password: PASSWORD },
        timeout: 15000,
      });
      const cards = res.data.racecards || [];
      console.log(`🏇 Racing API (${tier}): ${cards.length} racecards`);
      return cards;
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.message;
      if (status === 401 || detail?.toLowerCase().includes('plan required')) {
        console.log(`🏇 Racing API: ${tier} plan not available, trying lower tier...`);
        continue;
      }
      console.error(`🏇 Racing API (${tier}) error: ${detail}`);
      return [];
    }
  }
  return [];
}

// Upsert race odds into odds_cache — same table/schema as The Odds API
async function upsertRaceOddsToCache(racecards) {
  if (!racecards.length) return 0;

  let inserted = 0;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    for (const race of racecards) {
      const {
        race_id,
        course,
        off_dt,
        off_time,
        race_name,
        region,
        runners = [],
      } = race;

      if (!race_id || !off_dt) continue;

      const commenceTime = new Date(off_dt);
      // Skip races that have already started
      if (commenceTime < new Date()) continue;

      const expiresAt = new Date(commenceTime.getTime() + 60 * 60 * 1000); // +1h after off
      const sportKey = region === 'gb' ? 'horse_racing_gb' : region === 'ire' ? 'horse_racing_ire' : 'horse_racing_intl';
      const homeTeam = `${off_time} ${course}`;
      const awayTeam = 'Field';
      const eventName = `${homeTeam} — ${race_name || 'Race'}`;

      for (const runner of runners) {
        const { horse, odds: runnerOdds = [] } = runner;
        if (!horse || !runnerOdds.length) continue;

        for (const odd of runnerOdds) {
          const decimalStr = odd.decimal;
          const bookmaker = normBookie(odd.bookmaker);
          if (!decimalStr || !bookmaker) continue;

          const decimalOdds = parseFloat(decimalStr);
          if (!decimalOdds || decimalOdds < 1.01) continue;

          const oddsHash = `${decimalOdds}`;

          await client.query(
            `INSERT INTO odds_cache
               (sport_key, event_id, home_team, away_team, commence_time,
                bookmaker, market, selection, odds, point, odds_hash, source_api, expires_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
             ON CONFLICT (event_id, bookmaker, market, selection)
             DO UPDATE SET
               odds          = EXCLUDED.odds,
               odds_hash     = EXCLUDED.odds_hash,
               home_team     = EXCLUDED.home_team,
               away_team     = EXCLUDED.away_team,
               commence_time = EXCLUDED.commence_time,
               fetched_at    = NOW(),
               expires_at    = EXCLUDED.expires_at,
               source_api    = EXCLUDED.source_api
             WHERE odds_cache.odds_hash IS DISTINCT FROM EXCLUDED.odds_hash`,
            [
              sportKey,
              race_id,
              homeTeam,
              awayTeam,
              commenceTime.toISOString(),
              bookmaker,
              'win',
              horse,
              decimalOdds,
              null,
              oddsHash,
              'racing_api',
              expiresAt.toISOString(),
            ]
          );
          inserted++;
        }
      }
    }

    await client.query('COMMIT');
    console.log(`🏇 Racing: upserted ${inserted} odds rows`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('🏇 Racing cache upsert error:', err.message);
  } finally {
    client.release();
  }

  return inserted;
}

async function fetchAndCacheRacing() {
  const racecards = await fetchRacecards(['gb', 'ire']);
  return upsertRaceOddsToCache(racecards);
}

module.exports = { fetchAndCacheRacing };
