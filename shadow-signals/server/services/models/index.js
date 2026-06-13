'use strict';
const afl        = require('./afl');
const nba        = require('./nba');
const nrl        = require('./nrl');
const soccer     = require('./soccer');
const nfl        = require('./nfl');
const cricket    = require('./cricket');
const ufc        = require('./ufc');
const horse      = require('./horse_racing');
const greyhounds = require('./greyhounds');

const MODELS = [afl, nba, nrl, soccer, nfl, cricket, ufc, horse, greyhounds];
const BY_SPORT_KEY = Object.fromEntries(MODELS.map(m => [m.sportKey, m]));

function getModel(sportKey) {
  return BY_SPORT_KEY[sportKey] || null;
}

function activeModels() {
  return MODELS.filter(m => m.isImplemented);
}

module.exports = { MODELS, getModel, activeModels };
