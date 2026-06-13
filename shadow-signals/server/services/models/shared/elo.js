'use strict';

function expectedScore(eloA, eloB, homeAdvantage = 0) {
  const diff = (eloA + homeAdvantage) - eloB;
  return 1 / (1 + Math.pow(10, -diff / 400));
}

function marginMultiplier(margin, eloDiff) {
  const abs = Math.abs(margin || 0);
  return Math.log(abs + 1) * (2.2 / ((Math.abs(eloDiff) * 0.001) + 2.2));
}

function applyEloUpdate(eloA, eloB, actualA, kBase, margin, homeAdvantage = 0) {
  const expected = expectedScore(eloA, eloB, homeAdvantage);
  const eloDiff = (eloA + homeAdvantage) - eloB;
  const k = kBase * marginMultiplier(margin, eloDiff);
  const delta = k * (actualA - expected);
  return { newEloA: eloA + delta, newEloB: eloB - delta, expected, delta };
}

function weightedRollingMean(values, decay = 0.7) {
  if (!values.length) return 0;
  let sum = 0, weight = 0, w = 1;
  for (const v of values) { sum += v * w; weight += w; w *= decay; }
  return sum / weight;
}

module.exports = { expectedScore, marginMultiplier, applyEloUpdate, weightedRollingMean };
