'use strict';
const { db } = require('../../db');
const bdl = require('../data/balldontlie');
const { applyEloUpdate, expectedScore } = require('./shared/elo');
const { bestMatch } = require('./shared/normalise');

const SPORT_KEY = 'basketball_nba';
const K_BASE = 16;
const HOME_ADVANTAGE = 60; // ~3-4 points of margin

let _teamCache = null;
let _teamCacheTime = 0;
let _ratingsCache = null;
let _ratingsCacheTime = 0;

async function getTeamCache() {
  if (_teamCache && Date.now() - _teamCacheTime < 30 * 60 * 1000) return _teamCache;
  try {
    const { rows } = await db.query(`SELECT id, name, abbrev, city FROM nba_teams`);
    _teamCache = rows.map(r => ({ id: r.id, name: `${r.city} ${r.name}`, abbrev: r.abbrev }));
    _teamCacheTime = Date.now();
  } catch (_) { return _teamCache || []; }
  return _teamCache;
}

async function getRatingsCache() {
  if (_ratingsCache && Date.now() - _ratingsCacheTime < 10 * 60 * 1000) return _ratingsCache;
  try {
    const { rows } = await db.query(`SELECT team_id, elo FROM nba_power_ratings`);
    _ratingsCache = new Map(rows.map(r => [r.team_id, r]));
    _ratingsCacheTime = Date.now();
  } catch (_) { return _ratingsCache || new Map(); }
  return _ratingsCache;
}

function invalidateCaches() { _teamCache = null; _ratingsCache = null; }

async function ingestData() {
  const { data: teams } = await bdl.getTeams();
  for (const t of teams) {
    await db.query(
      `INSERT INTO nba_teams (id, name, abbrev, conference, division, city)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE
         SET name=EXCLUDED.name, abbrev=EXCLUDED.abbrev,
             conference=EXCLUDED.conference, division=EXCLUDED.division, city=EXCLUDED.city`,
      [t.id, t.full_name, t.abbreviation, t.conference, t.division, t.city]
    );
  }
  invalidateCaches();

  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const season = today.getUTCMonth() >= 8 ? yyyy : yyyy - 1;

  const { rows: [{ n }] } = await db.query(`SELECT COUNT(*)::int AS n FROM nba_results`);
  const seasons = Number(n) === 0
    ? [season - 3, season - 2, season - 1, season]
    : [season];

  for (const s of seasons) {
    const games = await bdl.getGames(s, `${s}-10-01`, `${s + 1}-07-01`);
    for (const g of games) {
      if (g.status !== 'Final' || !g.home_team_score || !g.visitor_team_score) {
        await db.query(
          `INSERT INTO nba_fixtures (id, season, date, home_team_id, away_team_id, last_synced_at)
           VALUES ($1,$2,$3,$4,$5,NOW())
           ON CONFLICT (id) DO UPDATE SET date=EXCLUDED.date, last_synced_at=NOW()`,
          [g.id, g.season, new Date(g.date), g.home_team.id, g.visitor_team.id]
        );
        continue;
      }
      const margin = g.home_team_score - g.visitor_team_score;
      const winnerId = margin > 0 ? g.home_team.id : g.visitor_team.id;
      await db.query(
        `INSERT INTO nba_results
           (id, season, date, home_team_id, away_team_id,
            home_score, away_score, margin, winner_team_id, is_postseason)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE
           SET home_score=EXCLUDED.home_score, away_score=EXCLUDED.away_score,
               margin=EXCLUDED.margin, winner_team_id=EXCLUDED.winner_team_id`,
        [g.id, g.season, new Date(g.date), g.home_team.id, g.visitor_team.id,
         g.home_team_score, g.visitor_team_score, margin, winnerId, g.postseason || false]
      );
    }
  }
  await db.query(`DELETE FROM nba_fixtures WHERE id IN (SELECT id FROM nba_results)`);
  return { synced: true, season };
}

async function recomputeRatings() {
  await db.query(`
    INSERT INTO nba_power_ratings (team_id) SELECT id FROM nba_teams
    ON CONFLICT (team_id) DO UPDATE SET elo=1500, games_played=0
  `);
  const { rows: games } = await db.query(
    `SELECT home_team_id, away_team_id, margin, is_postseason
     FROM nba_results ORDER BY date ASC`
  );
  const elos = new Map();
  for (const g of games) {
    const h = elos.get(g.home_team_id) ?? 1500;
    const a = elos.get(g.away_team_id) ?? 1500;
    const actual = g.margin > 0 ? 1 : 0;
    const { newEloA, newEloB } = applyEloUpdate(
      h, a, actual, K_BASE * (g.is_postseason ? 1.4 : 1), g.margin, HOME_ADVANTAGE
    );
    elos.set(g.home_team_id, newEloA);
    elos.set(g.away_team_id, newEloB);
  }
  for (const [id, elo] of elos) {
    await db.query(
      `UPDATE nba_power_ratings SET elo=$2, last_updated_at=NOW() WHERE team_id=$1`,
      [id, elo]
    );
  }
  invalidateCaches();
  return { teams: elos.size };
}

async function predict(homeTeamId, awayTeamId) {
  const ratings = await getRatingsCache();
  const h = ratings.get(homeTeamId) || { elo: 1500 };
  const a = ratings.get(awayTeamId) || { elo: 1500 };
  const homeWin = expectedScore(Number(h.elo), Number(a.elo), HOME_ADVANTAGE);
  return {
    home_win_prob:    Number(homeWin.toFixed(4)),
    away_win_prob:    Number((1 - homeWin).toFixed(4)),
    predicted_margin: Number(((Number(h.elo) + HOME_ADVANTAGE - Number(a.elo)) / 28).toFixed(2)),
    home_elo: Number(h.elo),
    away_elo: Number(a.elo),
  };
}

async function generatePredictions() {
  const { rows: fixtures } = await db.query(
    `SELECT id, home_team_id, away_team_id FROM nba_fixtures
     WHERE date > NOW() AND date < NOW() + INTERVAL '14 days'`
  );
  for (const f of fixtures) {
    const p = await predict(f.home_team_id, f.away_team_id);
    await db.query(
      `INSERT INTO nba_predictions
         (fixture_id, home_win_prob, away_win_prob, predicted_margin, home_elo, away_elo)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [f.id, p.home_win_prob, p.away_win_prob, p.predicted_margin, p.home_elo, p.away_elo]
    );
  }
  return fixtures.length;
}

async function backfillOutcomes() {
  await db.query(`
    UPDATE nba_predictions p
    SET actual_winner_id = r.winner_team_id,
        actual_margin    = r.margin,
        settled_at       = NOW()
    FROM nba_results r
    WHERE p.fixture_id = r.id AND p.settled_at IS NULL
  `);
}

async function resolveTeamFromOddsName(name) {
  const teams = await getTeamCache();
  const m = bestMatch(name, teams);
  return m ? m.id : null;
}

module.exports = {
  sportKey: SPORT_KEY,
  displayName: 'NBA',
  isImplemented: true,
  ingestData,
  recomputeRatings,
  generatePredictions,
  predict,
  backfillOutcomes,
  resolveTeamFromOddsName,
};
