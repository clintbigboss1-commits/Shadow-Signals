'use strict';
const axios = require('axios');

const BASE = 'https://api.squiggle.com.au';
const UA = 'Shadow Signals (contact@shadowsignals.app)';

async function query(q) {
  const r = await axios.get(`${BASE}/?q=${q}`, {
    headers: { 'User-Agent': UA, 'Accept': 'application/json' },
    timeout: 20000,
  });
  return r.data;
}

module.exports = {
  getTeams:    ()     => query('teams'),
  getResults:  (year) => query(`games;year=${year};complete=100`),
  getFixtures: (year) => query(`games;year=${year};complete=0`),
};
