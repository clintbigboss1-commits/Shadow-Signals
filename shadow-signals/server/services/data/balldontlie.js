'use strict';
const axios = require('axios');

const BASE = 'https://api.balldontlie.io/v1';
const DELAY_MS = 250; // stay under 5 req/min free tier

async function query(path, params = {}) {
  const r = await axios.get(`${BASE}${path}`, { params, timeout: 20000 });
  return r.data;
}

async function getAllPages(path, params = {}) {
  let all = [], cursor = null;
  do {
    const r = await query(path, { ...params, cursor, per_page: 100 });
    all = all.concat(r.data || []);
    cursor = r.meta && r.meta.next_cursor;
    if (cursor) await new Promise(s => setTimeout(s, DELAY_MS));
  } while (cursor);
  return all;
}

// Parse "MM:SS" or "M:SS" minutes string → decimal minutes
function parseMinutes(minStr) {
  if (!minStr || minStr === '0:00' || minStr === '00:00') return 0;
  const parts = minStr.split(':');
  const m = parseInt(parts[0], 10) || 0;
  const s = parseInt(parts[1], 10) || 0;
  return m + s / 60;
}

module.exports = {
  getTeams: () => query('/teams'),

  getGames: (season, startDate, endDate) =>
    getAllPages('/games', { 'seasons[]': season, start_date: startDate, end_date: endDate }),

  // All players (optionally filtered by team or search string)
  getPlayers: (params = {}) => getAllPages('/players', params),

  // Player season stats (season averages per player)
  getPlayerSeasonAverages: (playerIds, season) =>
    query('/season_averages', {
      'player_ids[]': playerIds,
      season,
    }),

  // Player game logs — returns raw stat rows
  getPlayerStats: async (playerIds, seasons) => {
    const rows = await getAllPages('/stats', {
      'player_ids[]': playerIds,
      'seasons[]': seasons,
    });
    // Parse minutes into decimal for all rows
    return rows.map(r => ({
      ...r,
      minutes_decimal: parseMinutes(r.min),
    }));
  },

  // Recent N games for a set of player IDs (current + prior season)
  getRecentPlayerStats: async (playerIds, nGames = 15) => {
    const now = new Date();
    const season = now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
    const rows = await getAllPages('/stats', {
      'player_ids[]': playerIds,
      'seasons[]': [season, season - 1],
      per_page: 100,
    });
    // Sort newest first, keep last nGames per player
    const byPlayer = {};
    for (const r of rows) {
      const pid = r.player && r.player.id;
      if (!pid) continue;
      if (!byPlayer[pid]) byPlayer[pid] = [];
      byPlayer[pid].push({ ...r, minutes_decimal: parseMinutes(r.min) });
    }
    for (const pid of Object.keys(byPlayer)) {
      byPlayer[pid].sort((a, b) => new Date(b.game.date) - new Date(a.game.date));
      byPlayer[pid] = byPlayer[pid].slice(0, nGames);
    }
    return byPlayer;
  },

  parseMinutes,
};
