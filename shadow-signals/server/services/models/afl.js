'use strict';
const { db } = require('../../db');
const squiggle = require('../data/squiggle');
const { applyEloUpdate, expectedScore, weightedRollingMean } = require('./shared/elo');
const { bestMatch, norm } = require('./shared/normalise');

const SPORT_KEY = 'aussierules_afl';
const K_BASE = 20;
const HOME_ADVANTAGE = 35;
const FORM_WINDOW = 5;

// ── Internal caches (avoid N+1 per EV cycle) ─────────────────────────────────
let _teamCache = null;
let _teamCacheTime = 0;
let _ratingsCache = null;
let _ratingsCacheTime = 0;

async function getTeamCache() {
  if (_teamCache && Date.now() - _teamCacheTime < 30 * 60 * 1000) return _teamCache;
  try {
    const { rows } = await db.query(`SELECT id, name, abbrev FROM afl_teams`);
    _teamCache = rows;
    _teamCacheTime = Date.now();
  } catch (_) { return _teamCache || []; }
  return _teamCache;
}

async function getRatingsCache() {
  if (_ratingsCache && Date.now() - _ratingsCacheTime < 10 * 60 * 1000) return _ratingsCache;
  try {
    const { rows } = await db.query(`SELECT team_id, elo, form_adjustment FROM afl_power_ratings`);
    _ratingsCache = new Map(rows.map(r => [r.team_id, r]));
    _ratingsCacheTime = Date.now();
  } catch (_) { return _ratingsCache || new Map(); }
  return _ratingsCache;
}

function invalidateCaches() {
  _teamCache = null;
  _ratingsCache = null;
}

// ── Data ingestion ────────────────────────────────────────────────────────────
async function ingestData() {
  const { teams } = await squiggle.getTeams();
  for (const t of teams) {
    await db.query(
      `INSERT INTO afl_teams (id, name, abbrev) VALUES ($1,$2,$3)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, abbrev=EXCLUDED.abbrev`,
      [t.id, t.name, t.abbrev]
    );
  }
  invalidateCaches();

  const thisYear = new Date().getFullYear();
  const { rows: [{ n }] } = await db.query(`SELECT COUNT(*)::int AS n FROM afl_results`);
  const startYear = Number(n) === 0 ? thisYear - 4 : thisYear;

  for (let y = startYear; y <= thisYear; y++) {
    const { games } = await squiggle.getResults(y);
    for (const g of games) {
      if (!g.hteamid || !g.ateamid) continue;
      const margin = (g.hscore || 0) - (g.ascore || 0);
      const winnerId = margin === 0 ? null : margin > 0 ? g.hteamid : g.ateamid;
      await db.query(
        `INSERT INTO afl_results
           (id, year, round, date, venue, home_team_id, away_team_id,
            home_score, away_score, margin, winner_team_id, is_final)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO UPDATE
           SET home_score=EXCLUDED.home_score, away_score=EXCLUDED.away_score,
               margin=EXCLUDED.margin, winner_team_id=EXCLUDED.winner_team_id`,
        [g.id, g.year, g.round, new Date(g.date + '+10:00'), g.venue,
         g.hteamid, g.ateamid, g.hscore, g.ascore, margin, winnerId, Boolean(g.is_final)]
      );
    }
  }

  const { games: upcoming } = await squiggle.getFixtures(thisYear);
  for (const g of upcoming) {
    if (!g.hteamid || !g.ateamid) continue;
    await db.query(
      `INSERT INTO afl_fixtures
         (id, year, round, date, venue, home_team_id, away_team_id, last_synced_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (id) DO UPDATE SET date=EXCLUDED.date, last_synced_at=NOW()`,
      [g.id, g.year, g.round, new Date(g.date + '+10:00'), g.venue, g.hteamid, g.ateamid]
    );
  }
  // Remove fixtures that have now become results
  await db.query(`DELETE FROM afl_fixtures WHERE id IN (SELECT id FROM afl_results)`);

  return { synced: true, year: thisYear };
}

// ── Rating computation ────────────────────────────────────────────────────────
async function recomputeRatings() {
  await db.query(`
    INSERT INTO afl_power_ratings (team_id) SELECT id FROM afl_teams
    ON CONFLICT (team_id) DO UPDATE SET elo=1500, form_adjustment=0, games_played=0
  `);

  const { rows: games } = await db.query(
    `SELECT id, home_team_id, away_team_id, margin, is_final
     FROM afl_results ORDER BY date ASC`
  );

  const elos = new Map();
  const residuals = new Map();
  const gameCounts = new Map();

  for (const g of games) {
    const homeElo = elos.get(g.home_team_id) ?? 1500;
    const awayElo = elos.get(g.away_team_id) ?? 1500;
    const actual = g.margin === 0 ? 0.5 : g.margin > 0 ? 1 : 0;

    const { newEloA, newEloB, expected } = applyEloUpdate(
      homeElo, awayElo, actual,
      K_BASE * (g.is_final ? 1.5 : 1),
      g.margin, HOME_ADVANTAGE
    );

    elos.set(g.home_team_id, newEloA);
    elos.set(g.away_team_id, newEloB);

    const expectedMargin = (expected - 0.5) * 80;
    const residualHome = (g.margin || 0) - expectedMargin;
    pushResidual(residuals, g.home_team_id, residualHome);
    pushResidual(residuals, g.away_team_id, -residualHome);

    gameCounts.set(g.home_team_id, (gameCounts.get(g.home_team_id) || 0) + 1);
    gameCounts.set(g.away_team_id, (gameCounts.get(g.away_team_id) || 0) + 1);
  }

  for (const [teamId, elo] of elos) {
    const form = weightedRollingMean(residuals.get(teamId) || []);
    await db.query(
      `UPDATE afl_power_ratings
       SET elo=$2, form_adjustment=$3, games_played=$4, last_updated_at=NOW()
       WHERE team_id=$1`,
      [teamId, elo, form, gameCounts.get(teamId) || 0]
    );
  }

  invalidateCaches();
  return { teams: elos.size };
}

function pushResidual(map, id, r) {
  const arr = map.get(id) || [];
  arr.unshift(r);
  if (arr.length > FORM_WINDOW) arr.length = FORM_WINDOW;
  map.set(id, arr);
}

// ── Prediction ────────────────────────────────────────────────────────────────
async function predict(homeTeamId, awayTeamId) {
  const ratings = await getRatingsCache();
  const home = ratings.get(homeTeamId) || { elo: 1500, form_adjustment: 0 };
  const away = ratings.get(awayTeamId) || { elo: 1500, form_adjustment: 0 };
  const homeAdj = Number(home.elo) + Number(home.form_adjustment) * 1.5;
  const awayAdj = Number(away.elo) + Number(away.form_adjustment) * 1.5;
  const homeWin = expectedScore(homeAdj, awayAdj, HOME_ADVANTAGE);
  return {
    home_win_prob:    Number(homeWin.toFixed(4)),
    away_win_prob:    Number((1 - homeWin).toFixed(4)),
    predicted_margin: Number(((homeAdj + HOME_ADVANTAGE - awayAdj) / 6).toFixed(2)),
    home_elo:         Number(home.elo),
    away_elo:         Number(away.elo),
    home_form:        Number(home.form_adjustment),
    away_form:        Number(away.form_adjustment),
  };
}

async function generatePredictions() {
  const { rows: fixtures } = await db.query(
    `SELECT id, home_team_id, away_team_id FROM afl_fixtures
     WHERE date > NOW() AND date < NOW() + INTERVAL '14 days'`
  );
  for (const f of fixtures) {
    const p = await predict(f.home_team_id, f.away_team_id);
    await db.query(
      `INSERT INTO afl_predictions
         (fixture_id, home_win_prob, away_win_prob, predicted_margin,
          home_elo, away_elo, home_form, away_form)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [f.id, p.home_win_prob, p.away_win_prob, p.predicted_margin,
       p.home_elo, p.away_elo, p.home_form, p.away_form]
    );
  }
  return fixtures.length;
}

async function backfillOutcomes() {
  await db.query(`
    UPDATE afl_predictions p
    SET actual_winner_id = r.winner_team_id,
        actual_margin    = r.margin,
        settled_at       = NOW()
    FROM afl_results r
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
  displayName: 'AFL',
  isImplemented: true,
  ingestData,
  recomputeRatings,
  generatePredictions,
  predict,
  backfillOutcomes,
  resolveTeamFromOddsName,
};
