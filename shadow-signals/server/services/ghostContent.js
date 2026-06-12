'use strict';

// ── GHOST content library ───────────────────────────────────────────────────
// Mix: 40% wins/signals, 40% education, 20% testimonials+CTA.
// LEGAL: Australian gambling-advertising reforms — no odds numbers in any
// social post. Confidence percentages are fine; prices are not.

const SITE_URL = process.env.GHOST_LINK_URL || 'https://shadowsignals.app';

// Round-14 teasers, locked for the 72-hour test (P8 of the rebuild brief).
const SEED_TEASERS = [
  // AFL Round 14
  { kind: 'teaser', sport: 'AFL', text: 'Western Bulldogs vs Adelaide — Bulldogs locked in. Multi stacked tight. Tap →' },
  { kind: 'teaser', sport: 'AFL', text: 'Geelong vs Gold Coast — Gold Coast at big value. Algorithm sees it. 5-leg multi. See it →' },
  { kind: 'teaser', sport: 'AFL', text: 'Melbourne vs Essendon — Dees are the strongest pick. 7-leg multi locked. Tap →' },
  { kind: 'teaser', sport: 'AFL', text: 'North Melbourne vs West Coast — North at value. Algorithm found something. 5-leg multi. Tap →' },
  { kind: 'teaser', sport: 'AFL', text: 'Port Adelaide vs Sydney — Power statement game. Multi stacked. See it →' },
  { kind: 'teaser', sport: 'AFL', text: 'Richmond vs Brisbane — Richmond massive underdog value. 5-leg multi. Worth a look. Tap →' },
  { kind: 'teaser', sport: 'AFL', text: 'St Kilda vs GWS — St Kilda locked. Multi built. Tap →' },
  // NRL Round 14
  { kind: 'teaser', sport: 'NRL', text: 'Dolphins vs Roosters — Dolphins in form. Multi locked tight. Tap →' },
  { kind: 'teaser', sport: 'NRL', text: 'West Tigers vs Gold Coast Titans — Tigers value play. Algorithm agrees. 6-leg multi. See it →' },
  { kind: 'teaser', sport: 'NRL', text: 'Parramatta vs Canberra — Eels hungry. Multi stacked. Tap →' },
  { kind: 'teaser', sport: 'NRL', text: 'New Zealand Warriors vs Cronulla Sharks — Warriors favored but Sharks value. Multi found. See it →' },
];

const EDUCATION_POOL = [
  'Traditional betting platforms hide value on purpose. Their algorithms exist to take your money. Ours exists to beat the line. That\'s the whole difference. See how →',
  'What\'s a shadow signal? It\'s the gap between what a bookmaker thinks and what the market knows. We scan 12 AU bookies around the clock to find it. See the signals →',
  'Most punters bet on the team they like. Sharps bet when the price is wrong. The confidence score tells you which is which — green means back it, red means walk away →',
  'Closing Line Value is the only stat that proves real edge. If you consistently beat the closing price, you win long-term — regardless of any single result. We track it for you →',
  'When every bookmaker drops a price at the same moment, a syndicate just fired. By the time you spot it manually, it\'s gone. We catch it the second it happens →',
  'Here\'s what traditional platforms miss: the difference between a popular pick and a valuable one. Popularity moves prices. Value beats them. We find value →',
  'Your stake size matters as much as your pick. Our suggested stake tells you exactly what % of bankroll to put on every signal — sized by the maths, not the vibes →',
  'The bookies aren\'t guessing. Neither should you. Every Shadow Signals pick carries a 0–100% confidence score calibrated against real results →',
];

const TESTIMONIAL_POOL = [
  '"My CLV is consistently positive. The confidence score tells you exactly which bets are worth taking." — Matt, Melbourne. Your results could be next. Free trial →',
  '"The arb finder alone pays for itself 3x over every month." — Jake, Sydney. 7-day free trial, no card needed →',
  '"First value bet within an hour of signing up. Made the subscription back in week one." — Liam, Melbourne. Start free →',
  '7,410 Aussie sharps already get the signals. The edge doesn\'t wait. Start your 7-day free trial →',
  'Stop guessing. Start winning. See today\'s highest-confidence signals free →',
];

// ── Compliance ──────────────────────────────────────────────────────────────
// Reject anything that looks like a price: decimal odds (2.50), $-prefixed
// prices, or "odds of N". Confidence percentages ("87%") are allowed.
function violatesOddsRule(text) {
  if (/\$\s?\d+(\.\d+)?/.test(text)) return true;           // $2.50, $ 180
  if (/\b\d+\.\d{2}\b/.test(text)) return true;             // 2.50 decimal odds
  if (/\bodds?\s+(of\s+)?\d/i.test(text)) return true;      // "odds of 3"
  return false;
}

// Live signal post from an EV opportunity — confidence language, no prices.
function winPostFromOpportunity(opp, confidenceScore) {
  const matchName = opp.event_name;
  const pick = opp.selection;
  return `${matchName} — ${pick} at ${confidenceScore}% confidence. This is the kind of edge traditional platforms miss. See the full signal → ${SITE_URL}`;
}

function withLink(text) {
  return /https?:\/\//.test(text) ? text : `${text} ${SITE_URL}`;
}

module.exports = {
  SEED_TEASERS,
  EDUCATION_POOL,
  TESTIMONIAL_POOL,
  violatesOddsRule,
  winPostFromOpportunity,
  withLink,
  SITE_URL,
};
