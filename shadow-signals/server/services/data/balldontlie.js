'use strict';
const axios = require('axios');

const BASE = 'https://api.balldontlie.io/v1';

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
    if (cursor) await new Promise(s => setTimeout(s, 250)); // stay under 5 req/min
  } while (cursor);
  return all;
}

module.exports = {
  getTeams: () => query('/teams'),
  getGames: (season, startDate, endDate) =>
    getAllPages('/games', { 'seasons[]': season, start_date: startDate, end_date: endDate }),
};
