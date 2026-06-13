'use strict';
const { db } = require('../../db');
const bdl = require('../data/balldontlie');
const { norm, bestMatch } = require('./shared/normalise');

// ── Normal distribution ────────────────────────────────────────────────────
function erf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
    - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

function normalCDF(x, mean, std) {
  if (std <= 0) return x < mean ? 0 : 1;
  return 0.5 * (1 + erf((x - mean) / (std * Math.SQRT2)));
}

function stdDev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// Exponentially weighted average — recent games count more
function ewma(values, decay = 0.85) {
  let sum = 0, weight = 0;
  for (let i = 0; i < values.length; i++) {
    const w = Math.pow(decay, i);
    sum += values[i] * w;
    weight += w;
  }
  return weight > 0 ? sum / weight : null;
}

// ── Module-level caches ────────────────────────────────────────────────────
let _playerCache = null;       // { id -> player row } — 30 min TTL
let _playerCacheAt = 0;
let _opponentCache = new Map(); // teamId -> factor — 15 min TTL
let _opponentCacheAt = 0;

const PLAYER_CACHE_TTL  = 30 * 60 * 1000;
const OPPONENT_CACHE_TTL = 15 * 60 * 1000;

function invalidateCaches() {
  _playerCache = null;
  _playerCacheAt = 0;
  _opponentCache = new Map();
  _opponentCacheAt = 0;
}

async function getPlayerCache() {
  if (_playerCache && Date.now() - _playerCacheAt < PLAYER_CACHE_TTL) return _playerCache;
  const { rows } = await db.query(
    'SELECT id, first_name, last_name, position, team_id FROM nba_players WHERE active = TRUE'
  );
  _playerCache = new Map(rows.map(r => [r.id, r]));
  _playerCacheAt = Date.now();
  return _playerCache;
}

// Returns league-normalized defensive factor for an opponent team.
// > 1.0 = weak defence (concedes more), < 1.0 = strong defence.
// Separate by stat type (pts / reb / ast).
async function getOpponentFactor(opponentTeamId, statType = 'pts') {
  if (Date.now() - _opponentCacheAt > OPPONENT_CACHE_TTL) {
    _opponentCache = new Map();
    _opponentCacheAt = Date.now();
  }
  const cacheKey = `${opponentTeamId}:${statType}`;
  if (_opponentCache.has(cacheKey)) return _opponentCache.get(cacheKey);

  try {
    // Average stat allowed by this team in last 20 home + away games
    const col = statType === 'pts' ? 'away_score' : null;
    if (!col) { _opponentCache.set(cacheKey, 1.0); return 1.0; }

    const { rows: oppRows } = await db.query(`
      SELECT AVG(${col})::float AS avg_conceded
      FROM nba_results
      WHERE (home_team_id = $1 OR away_team_id = $1)
        AND date > NOW() - INTERVAL '60 days'
    `, [opponentTeamId]);

    const { rows: leagueRows } = await db.query(`
      SELECT AVG((home_score + away_score) / 2.0)::float AS league_avg
      FROM nba_results
      WHERE date > NOW() - INTERVAL '60 days'
    `);

    const oppAvg   = oppRows[0]?.avg_conceded || null;
    const leagueAvg = leagueRows[0]?.league_avg || null;

    const factor = (oppAvg && leagueAvg && leagueAvg > 0)
      ? Math.min(1.3, Math.max(0.75, oppAvg / leagueAvg))
      : 1.0;

    _opponentCache.set(cacheKey, factor);
    return factor;
  } catch (_) {
    _opponentCache.set(cacheKey, 1.0);
    return 1.0;
  }
}

// ── Player resolution ──────────────────────────────────────────────────────
// Resolves an Odds API name like "LeBron James" to an nba_players.id.
// First tries player_mapping table (covers manual and auto-generated aliases),
// then falls back to fuzzy match against roster cache and writes the result.
async function resolvePlayerFromOddsName(oddsName) {
  const normName = norm(oddsName);

  // 1. Check player_mapping table
  const { rows: mapped } = await db.query(
    `SELECT canonical_id FROM player_mapping
     WHERE sport_key = 'basketball_nba' AND lower(alias) = lower($1)`,
    [oddsName]
  );
  if (mapped.length) return parseInt(mapped[0].canonical_id, 10);

  // 2. Fuzzy match against roster
  const players = await getPlayerCache();
  const candidates = [...players.values()].map(p => ({
    id: p.id,
    name: `${p.first_name} ${p.last_name}`,
    normName: norm(`${p.first_name} ${p.last_name}`),
  }));

  let match = candidates.find(c => c.normName === normName);

  if (!match) {
    const hit = bestMatch(normName, candidates.map(c => c.normName));
    if (hit) match = candidates.find(c => c.normName === hit);
  }

  if (!match) return null;

  // 3. Auto-write to player_mapping so next lookup is instant
  await db.query(
    `INSERT INTO player_mapping (canonical_id, sport_key, alias, source)
     VALUES ($1,'basketball_nba',$2,'auto')
     ON CONFLICT (sport_key, alias) DO NOTHING`,
    [String(match.id), oddsName]
  ).catch(() => {});

  return match.id;
}

// ── Core prediction ────────────────────────────────────────────────────────
// statType: 'pts' | 'reb' | 'ast'
// line: the O/U line (e.g. 24.5)
// direction: 'Over' | 'Under'
async function predictProp(playerName, line, statType = 'pts', opponentTeamId = null) {
  const playerId = await resolvePlayerFromOddsName(playerName);
  if (!playerId) return null;

  // Pull last 12 games with meaningful minutes (≥8 min = not garbage time)
  const { rows: games } = await db.query(`
    SELECT pts, reb, ast, minutes, game_date, opponent_team_id, home_away
    FROM nba_player_stats
    WHERE player_id = $1
      AND minutes >= 8
    ORDER BY game_date DESC
    LIMIT 12
  `, [playerId]);

  if (games.length < 5) return null; // insufficient data

  const stat = statType === 'pts' ? 'pts' : statType === 'reb' ? 'reb' : 'ast';
  const values = games.map(g => Number(g[stat]) || 0);
  const minutesList = games.map(g => parseFloat(g.minutes) || 0).filter(m => m > 0);

  if (minutesList.length < 5) return null;

  // Per-minute rate (decay-weighted, newest first)
  const ratesPerMin = games
    .filter(g => parseFloat(g.minutes) >= 8)
    .map(g => (Number(g[stat]) || 0) / parseFloat(g.minutes));

  const statPerMin = ewma(ratesPerMin, 0.85);
  if (!statPerMin || statPerMin <= 0) return null;

  // Projected minutes = ewma of recent minutes
  const projMin = ewma(minutesList, 0.85);

  // Opponent factor
  const oppFactor = opponentTeamId
    ? await getOpponentFactor(opponentTeamId, statType)
    : 1.0;

  // Base projection
  const projected = statPerMin * projMin * oppFactor;

  // Standard deviation from recent raw values
  const sd = Math.max(stdDev(values), projected * 0.2); // floor at 20% of projection

  // Continuity correction: props are integer stats, line is typically x.5
  const probOver  = 1 - normalCDF(line, projected, sd);
  const probUnder = normalCDF(line, projected, sd);

  return {
    playerId,
    projected: parseFloat(projected.toFixed(2)),
    std_dev: parseFloat(sd.toFixed(2)),
    proj_min: parseFloat(projMin.toFixed(1)),
    prob_over: parseFloat(probOver.toFixed(4)),
    prob_under: parseFloat(probUnder.toFixed(4)),
    games_used: games.length,
    opp_factor: parseFloat(oppFactor.toFixed(3)),
  };
}

// ── Player stats ingestion ─────────────────────────────────────────────────
async function ingestPlayers() {
  let synced = 0;
  try {
    const data = await bdl.getPlayers();
    if (!data || !data.data) return 0;

    for (const p of data.data) {
      if (!p.team) continue;
      await db.query(
        `INSERT INTO nba_players (id, first_name, last_name, position, team_id, active, last_synced_at)
         VALUES ($1,$2,$3,$4,$5,TRUE,NOW())
         ON CONFLICT (id) DO UPDATE SET
           first_name = EXCLUDED.first_name,
           last_name  = EXCLUDED.last_name,
           position   = EXCLUDED.position,
           team_id    = EXCLUDED.team_id,
           active     = TRUE,
           last_synced_at = NOW()`,
        [p.id, p.first_name, p.last_name, p.position || null, p.team.id || null]
      );
      synced++;
    }
    invalidateCaches();
  } catch (e) {
    console.error('NBA player ingest error:', e.message);
  }
  return synced;
}

async function ingestPlayerStats(seasonOverride = null) {
  const now = new Date();
  const season = seasonOverride || (now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1);

  // Only fetch active players with minutes tracked (roster from DB)
  const { rows: players } = await db.query(
    'SELECT id FROM nba_players WHERE active = TRUE LIMIT 500'
  );
  if (players.length === 0) return 0;

  const playerIds = players.map(p => p.id);
  let stored = 0;

  // Batch in groups of 25 to stay under balldontlie rate limits
  for (let i = 0; i < playerIds.length; i += 25) {
    const batch = playerIds.slice(i, i + 25);
    try {
      const stats = await bdl.getPlayerStats(batch, [season]);
      for (const s of stats) {
        if (!s.player || !s.game || !s.game.id) continue;
        const min = s.minutes_decimal || 0;
        if (min === 0) continue; // DNP

        const isHome = s.game.home_team_id === s.team.id;
        const oppId = isHome ? s.game.visitor_team_id : s.game.home_team_id;

        await db.query(
          `INSERT INTO nba_player_stats
           (id, player_id, game_id, game_date, team_id, opponent_team_id, home_away,
            minutes, pts, reb, ast, fg3m, stl, blk, turnover)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
           ON CONFLICT (player_id, game_id) DO NOTHING`,
          [
            s.id, s.player.id, s.game.id,
            s.game.date ? new Date(s.game.date).toISOString().split('T')[0] : null,
            s.team.id, oppId,
            isHome ? 'H' : 'A',
            parseFloat(min.toFixed(2)),
            s.pts || 0, s.reb || 0, s.ast || 0,
            s.fg3m || 0, s.stl || 0, s.blk || 0, s.turnover || 0,
          ]
        );
        stored++;
      }
    } catch (e) {
      console.warn(`NBA player stats batch ${i} error:`, e.message);
    }
    await new Promise(r => setTimeout(r, 300)); // rate limit
  }

  return stored;
}

module.exports = {
  predictProp,
  resolvePlayerFromOddsName,
  ingestPlayers,
  ingestPlayerStats,
  invalidateCaches,
};
