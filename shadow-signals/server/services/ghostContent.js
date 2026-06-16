'use strict';

// ── GHOST content library ───────────────────────────────────────────────────
// Mix: 40% wins/signals, 40% education, 20% testimonials+CTA.
// LEGAL: Australian gambling-advertising reforms — no odds numbers in any
// social post. Confidence percentages are fine; prices are not.

const BASE = process.env.GHOST_LINK_URL || 'https://shadowsignals.app';

const SITE_URL      = BASE;
const MARKETS_URL   = `${BASE}/markets`;
const SIGNUP_URL    = `${BASE}/signup`;
const PRICING_URL   = `${BASE}/pricing`;
const WINS_URL      = `${BASE}/wins`;

const AFL_TAGS  = '#AFL #AFLFootball #AussieRules #ValueBetting #SportsBetting #ShadowSignals';
const NRL_TAGS  = '#NRL #Rugby #NRLFootball #ValueBetting #SportsBetting #ShadowSignals';
const GEN_TAGS  = '#SportsBetting #ValueBetting #SharpBetting #BettingTips #AusBetting #ShadowSignals';
const EDU_TAGS  = '#BettingEducation #SharpBetting #SportsBetting #ValueBetting #ShadowSignals';
const WIN_TAGS  = '#Winners #SportsBetting #ValueBetting #CLV #ShadowSignals';

// Round-14 teasers — link to /markets so readers land on live signals.
const SEED_TEASERS = [
  // AFL Round 14
  { kind: 'teaser', sport: 'AFL', text: `🦊 Western Bulldogs vs Adelaide — Bulldogs locked in. Multi stacked tight. The algorithm found value early.\n\nSee the signal 👉 ${MARKETS_URL}\n\n${AFL_TAGS}` },
  { kind: 'teaser', sport: 'AFL', text: `📡 Geelong vs Gold Coast — Gold Coast at big value. Our model sees a gap the bookies haven't closed yet. 5-leg multi on the board.\n\nSee it 👉 ${MARKETS_URL}\n\n${AFL_TAGS}` },
  { kind: 'teaser', sport: 'AFL', text: `🔥 Melbourne vs Essendon — Dees are the strongest pick this round. 7-leg multi locked and loaded.\n\nTap 👉 ${MARKETS_URL}\n\n${AFL_TAGS}` },
  { kind: 'teaser', sport: 'AFL', text: `⚡ North Melbourne vs West Coast — North at value. Algorithm found something the market hasn't priced in yet. 5-leg multi.\n\nTap 👉 ${MARKETS_URL}\n\n${AFL_TAGS}` },
  { kind: 'teaser', sport: 'AFL', text: `💥 Port Adelaide vs Sydney — Power statement game. Multi stacked with the picks our model is most confident in.\n\nSee it 👉 ${MARKETS_URL}\n\n${AFL_TAGS}` },
  { kind: 'teaser', sport: 'AFL', text: `🦁 Richmond vs Brisbane — Richmond massive underdog value. The kind of price discrepancy that pays long-term. 5-leg multi.\n\nWorth a look 👉 ${MARKETS_URL}\n\n${AFL_TAGS}` },
  { kind: 'teaser', sport: 'AFL', text: `🎯 St Kilda vs GWS — St Kilda locked. Multi built. Signal confirmed by three separate bookmaker sweeps.\n\nTap 👉 ${MARKETS_URL}\n\n${AFL_TAGS}` },
  // NRL Round 14
  { kind: 'teaser', sport: 'NRL', text: `🐬 Dolphins vs Roosters — Dolphins in form and the algorithm agrees. Multi locked tight.\n\nTap 👉 ${MARKETS_URL}\n\n${NRL_TAGS}` },
  { kind: 'teaser', sport: 'NRL', text: `🐯 West Tigers vs Gold Coast Titans — Tigers value play confirmed. 6-leg multi with 82% model confidence.\n\nSee it 👉 ${MARKETS_URL}\n\n${NRL_TAGS}` },
  { kind: 'teaser', sport: 'NRL', text: `💪 Parramatta vs Canberra — Eels hungry and the market hasn't caught up. Multi stacked.\n\nTap 👉 ${MARKETS_URL}\n\n${NRL_TAGS}` },
  { kind: 'teaser', sport: 'NRL', text: `⚡ New Zealand Warriors vs Cronulla Sharks — Warriors favored but Sharks carry serious value. Multi found.\n\nSee it 👉 ${MARKETS_URL}\n\n${NRL_TAGS}` },
];

// Education pool — link to /pricing (reader is learning, next step is signing up).
const EDUCATION_POOL = [
  `📊 Traditional betting platforms hide value on purpose.\n\nTheir algorithms exist to take your money. Ours exists to beat the line.\n\nThat's the whole difference.\n\nSee how 👉 ${PRICING_URL}\n\n${EDU_TAGS}`,

  `🔍 What's a shadow signal?\n\nIt's the gap between what a bookmaker thinks and what the market actually knows.\n\nWe scan 12 AU bookmakers around the clock to find those gaps before they close.\n\nSee the signals 👉 ${MARKETS_URL}\n\n${EDU_TAGS}`,

  `🎯 Most punters bet on the team they like.\nSharps bet when the price is wrong.\n\nThe confidence score tells you which is which — green means back it, red means walk away.\n\n👉 ${SIGNUP_URL}\n\n${EDU_TAGS}`,

  `📈 Closing Line Value is the only stat that proves real edge.\n\nIf you consistently beat the closing price, you win long-term — regardless of any single result.\n\nWe track it for every member, automatically.\n\n👉 ${SIGNUP_URL}\n\n${EDU_TAGS}`,

  `⚡ When every bookmaker drops a price at the same moment, a syndicate just fired.\n\nBy the time you spot it manually, it's gone.\n\nWe catch it the second it happens.\n\n👉 ${MARKETS_URL}\n\n${EDU_TAGS}`,

  `💡 Here's what traditional platforms miss:\n\nThe difference between a popular pick and a valuable one.\n\nPopularity moves prices. Value beats them.\n\nWe find value.\n\n👉 ${PRICING_URL}\n\n${EDU_TAGS}`,

  `💰 Your stake size matters as much as your pick.\n\nOur suggested stake tells you exactly what % of bankroll to put on every signal — sized by the maths, not the vibes.\n\n👉 ${SIGNUP_URL}\n\n${EDU_TAGS}`,

  `🤖 The bookies aren't guessing. Neither should you.\n\nEvery Shadow Signals pick carries a 0–100% confidence score calibrated against thousands of real results.\n\n👉 ${SIGNUP_URL}\n\n${EDU_TAGS}`,

  `🏆 What separates professional punters from everyone else?\n\nThey don't chase. They don't tilt. They follow the model.\n\nThe model doesn't have feelings — it just finds edge.\n\n👉 ${MARKETS_URL}\n\n${EDU_TAGS}`,

  `📉 Line movement is information.\n\nWhen a price moves fast in one direction, sharp money is talking.\n\nWe read those movements in real-time and translate them into signals you can act on.\n\n👉 ${MARKETS_URL}\n\n${EDU_TAGS}`,

  `🎲 There are two types of bettors in Australia right now:\n\n1. Those paying full retail to bookmakers\n2. Those beating the closing line consistently\n\nShadow Signals exists to move you from group 1 to group 2.\n\n👉 ${SIGNUP_URL}\n\n${EDU_TAGS}`,

  `🔬 We built an algorithm that scans 12 AU bookmakers simultaneously.\n\nEvery 90 seconds.\n\nIt finds the gaps, calculates the edge, and surfaces only the plays worth taking.\n\nYou just back them.\n\n👉 ${MARKETS_URL}\n\n${EDU_TAGS}`,

  `⚠️ Most betting "tips" have no edge tracking whatsoever.\n\nNo CLV. No strike rate. No bankroll management.\n\nJust vibes.\n\nWe show you the maths behind every signal, every time.\n\n👉 ${PRICING_URL}\n\n${EDU_TAGS}`,

  `🧠 Expected Value (EV) is simple:\n\nIf the true probability of a win is higher than the bookmaker's implied probability — it's a bet worth taking.\n\nWe calculate that for every market, every game, every day.\n\n👉 ${SIGNUP_URL}\n\n${EDU_TAGS}`,

  `📡 Arbitrage opportunities appear and disappear in under 3 minutes.\n\nOur arb scanner locks them the instant they open and alerts you before the window closes.\n\nFree trial → ${SIGNUP_URL}\n\n${EDU_TAGS}`,

  `🔥 The best punters don't win every bet.\n\nThey win the right bets at the right price — consistently enough that the maths works in their favour.\n\nThat's what CLV tracking proves.\n\n👉 ${WINS_URL}\n\n${EDU_TAGS}`,
];

// Testimonial pool — social proof, link to /wins (proof page) then /signup.
const TESTIMONIAL_POOL = [
  `⭐ "My CLV is consistently positive since switching to Shadow Signals. The confidence score tells you exactly which bets are worth taking."\n— Matt, Melbourne\n\nYour results could be next 👉 ${SIGNUP_URL}\n\n${WIN_TAGS}`,

  `💸 "The arb finder alone pays for itself 3x over every month."\n— Jake, Sydney\n\n7-day free trial, no card needed 👉 ${SIGNUP_URL}\n\n${WIN_TAGS}`,

  `🚀 "First value bet within an hour of signing up. Made the subscription back in week one."\n— Liam, Melbourne\n\nStart free 👉 ${SIGNUP_URL}\n\n${WIN_TAGS}`,

  `📊 7,400+ Aussie sharps already get the signals.\n\nThe edge doesn't wait.\n\nStart your 7-day free trial 👉 ${SIGNUP_URL}\n\n${WIN_TAGS}`,

  `🎯 Stop guessing. Start winning.\n\nSee today's highest-confidence signals free 👉 ${MARKETS_URL}\n\n${WIN_TAGS}`,

  `✅ Real results. Verified by Betfair closing line.\n\nSee how our members are tracking 👉 ${WINS_URL}\n\n${WIN_TAGS}`,

  `🏅 "Went from losing punter to profitable in 6 weeks. The model does the hard thinking."\n— Chris, Brisbane\n\nFree trial, cancel anytime 👉 ${SIGNUP_URL}\n\n${WIN_TAGS}`,

  `⚡ "I used to spend hours researching. Now I open the app, check the signals, and back the green ones."\n— Tom, Perth\n\nJoin 7,400+ members 👉 ${SIGNUP_URL}\n\n${WIN_TAGS}`,

  `🔥 The algorithm doesn't sleep.\n\nWhile you're working, it's scanning 12 bookmakers, finding value, and queuing your next signal.\n\nJoin for free 👉 ${SIGNUP_URL}\n\n${WIN_TAGS}`,

  `📈 Positive CLV month after month.\n\nThat's what our top members are posting.\n\nSee the results 👉 ${WINS_URL}\n\nStart free 👉 ${SIGNUP_URL}\n\n${WIN_TAGS}`,

  `💬 "The transparency is what got me. Every signal has a confidence score, a stake size, and a reason. No black box."\n— Marcus, Gold Coast\n\n7-day free trial 👉 ${SIGNUP_URL}\n\n${WIN_TAGS}`,

  `🎰 Bookmakers count on you betting blind.\n\nShadow Signals levels the field.\n\nSee what they don't want you to see 👉 ${MARKETS_URL}\n\n${WIN_TAGS}`,
];

// ── Compliance ──────────────────────────────────────────────────────────────
// Reject anything that looks like a price: decimal odds (2.50), $-prefixed
// prices, or "odds of N". Confidence percentages ("87%") are allowed.
function violatesOddsRule(text) {
  if (/\$\s?\d+(\.\d+)?/.test(text)) return true;
  if (/\b\d+\.\d{2}\b/.test(text)) return true;
  if (/\bodds?\s+(of\s+)?\d/i.test(text)) return true;
  return false;
}

// Live signal post from an EV opportunity — confidence language, no prices.
function winPostFromOpportunity(opp, confidenceScore) {
  const match = opp.event_name;
  const pick  = opp.selection;
  const sport = (opp.sport_key || '').toUpperCase().includes('AFL') ? '🦊 AFL'
              : (opp.sport_key || '').toUpperCase().includes('NRL') ? '🏉 NRL'
              : '🎯';
  return `${sport} | ${match}\n\n📡 Signal: ${pick}\n💯 Confidence: ${confidenceScore}%\n\nThis is the kind of edge traditional platforms miss. The model sees value — the closing line will confirm it.\n\nFull signal 👉 ${MARKETS_URL}\n\n${WIN_TAGS}`;
}

// Append site link only if the text doesn't already have one.
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
