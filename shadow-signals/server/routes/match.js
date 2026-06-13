'use strict';
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { db } = require('../db');
const {
  calcEVPercent, kellyFraction, removeVig, getSharpPrice, median,
} = require('../services/evCalculator');

// Leg confidence: fair win probability is the base, a verified price edge
// adds conviction. Capped well below 100 — nothing in betting is certain.
function confidenceScore(winProb, evPercent = 0) {
  const raw = winProb * 100 + Math.min(Math.max(evPercent, 0), 12) * 2;
  return Math.round(Math.min(96, Math.max(5, raw)));
}

// Tiered grade for display: anchored on win prob + EV combined confidence.
// 80-96 = STRONG, 60-79 = SOLID, 40-59 = WEAK, <40 = AVOID
function tipGrade(conf) {
  if (conf >= 80) return 'STRONG';
  if (conf >= 60) return 'SOLID';
  if (conf >= 40) return 'WEAK';
  return 'AVOID';
}

// Single-sentence reasoning punters can read in 2 seconds.
function tipReasoning(winProb, evPct, conf, bookie, signalSource) {
  const winPct = Math.round(winProb * 100);
  const isSharp = signalSource && signalSource.startsWith('model_');
  const bookName = (bookie || '').replace(/_/g, ' ').split(' ')[0];

  if (conf >= 80) {
    if (evPct >= 8) return `${winPct}% win probability — ${bookName} is pricing this ${evPct.toFixed(1)}% above fair value. ${isSharp ? 'Our model agrees.' : 'Strong consensus across books.'}`;
    return `${winPct}% win probability with consistent pricing across bookmakers. ${isSharp ? 'Model-backed pick.' : 'High-confidence consensus.'}`;
  }
  if (conf >= 60) {
    if (evPct >= 3) return `${winPct}% implied win chance. Mild price edge of +${evPct.toFixed(1)}% at ${bookName} — worth considering at reduced stake.`;
    return `${winPct}% implied win chance. No price edge, but solid underlying probability.`;
  }
  if (conf >= 40) {
    return `${winPct}% win probability — below the threshold for a confident recommendation. Marginal or no price edge.`;
  }
  return `${winPct}% implied win chance — market prices this as an underdog. No edge detected; avoid or pass.`;
}

const MULTI_NAMES = { 2: 'Power Double', 3: 'Treble', 4: '4-Leg Multi', 5: '5-Leg Multi' };

// GET /api/match/:eventId — everything the match detail page needs
router.get('/:eventId', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;

    // All live cached odds for this event, every market and bookmaker
    const oddsRows = await db.query(
      `SELECT DISTINCT ON (bookmaker, market, selection)
         sport_key, event_id, home_team, away_team, commence_time,
         bookmaker, market, selection, odds
       FROM odds_cache
       WHERE event_id = $1 AND expires_at > NOW()
       ORDER BY bookmaker, market, selection, fetched_at DESC`,
      [eventId]
    );
    if (oddsRows.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found or odds expired' });
    }

    const first = oddsRows.rows[0];
    const event = {
      event_id: eventId,
      sport_key: first.sport_key,
      home_team: first.home_team,
      away_team: first.away_team,
      event_name: `${first.home_team} v ${first.away_team}`,
      commence_time: first.commence_time,
    };

    // bookmakers[book][selection] = price, h2h only (the priced match-winner market)
    const bookmakers = {};
    const otherMarkets = {}; // market -> selection -> { book: price }
    for (const row of oddsRows.rows) {
      const price = parseFloat(row.odds);
      if (row.market === 'h2h') {
        if (!bookmakers[row.bookmaker]) bookmakers[row.bookmaker] = {};
        bookmakers[row.bookmaker][row.selection] = price;
      } else {
        if (!otherMarkets[row.market]) otherMarkets[row.market] = {};
        if (!otherMarkets[row.market][row.selection]) otherMarkets[row.market][row.selection] = {};
        otherMarkets[row.market][row.selection][row.bookmaker] = price;
      }
    }

    const selections = [...new Set(Object.values(bookmakers).flatMap(b => Object.keys(b)))];

    // Fair odds over the full h2h outcome set (same maths as the EV scanner)
    let fairBySelection = {};
    if (selections.length >= 2) {
      const medians = {};
      for (const sel of selections) {
        const prices = Object.values(bookmakers).map(b => b[sel]).filter(Boolean);
        medians[sel] = median(prices);
      }
      const sharpVector = selections.map(sel => {
        const p = getSharpPrice(bookmakers, sel);
        if (p && medians[sel] && p > medians[sel] * 2.5) return medians[sel];
        return p;
      });
      if (sharpVector.every(Boolean)) {
        const fairProbs = removeVig(sharpVector);
        selections.forEach((sel, i) => { fairBySelection[sel] = 1 / fairProbs[i]; });
      }
    }

    // Resolve signal source for each selection (model vs consensus)
    const signalSourceMap = {};
    try {
      const evRows = await db.query(
        `SELECT DISTINCT ON (selection) selection, source
         FROM ev_opportunities
         WHERE event_id = $1 AND is_active = TRUE AND expires_at > NOW()
         ORDER BY selection, ev_percent DESC`,
        [eventId]
      );
      for (const r of evRows.rows) signalSourceMap[r.selection] = r.source;
    } catch (_) {}

    // Singles: best price per selection, EV against fair
    const singles = selections.map(sel => {
      let best = null;
      for (const [book, prices] of Object.entries(bookmakers)) {
        if (['betfair_ex_au', 'pinnacle'].includes(book)) continue;
        if (prices[sel] && (!best || prices[sel] > best.odds)) best = { bookie: book, odds: prices[sel] };
      }
      if (!best) return null;
      const fair = fairBySelection[sel] || null;
      const ev = fair ? calcEVPercent(best.odds, fair) : 0;
      const winProb = fair ? 1 / fair : 1 / best.odds;
      const conf = confidenceScore(winProb, ev);
      const src = signalSourceMap[sel] || 'consensus_v1';
      return {
        selection: sel,
        bookie: best.bookie,
        odds: best.odds,
        fair_odds: fair ? parseFloat(fair.toFixed(3)) : null,
        ev_percent: parseFloat(ev.toFixed(2)),
        kelly_percent: fair ? kellyFraction(best.odds, fair) : 0,
        confidence: conf,
        win_prob: parseFloat((winProb * 100).toFixed(1)),
        tip_grade: tipGrade(conf),
        reasoning: tipReasoning(winProb, ev, conf, best.bookie, src),
      };
    }).filter(Boolean).sort((a, b) => b.ev_percent - a.ev_percent);

    // Our pick: best positive-EV selection, else the market favourite
    const ourPick = singles.find(s => s.ev_percent >= 2)
      || [...singles].sort((a, b) => b.win_prob - a.win_prob)[0]
      || null;

    // Multis: anchor our pick with the best verified edges from OTHER matches.
    // Same-game h2h legs are mutually exclusive, so legs must come from elsewhere.
    let multis = [];
    if (ourPick) {
      const others = await db.query(
        `SELECT DISTINCT ON (event_id)
           event_id, event_name, sport_key, selection, bookie,
           bookie_odds, fair_odds, ev_percent, commence_time
         FROM ev_opportunities
         WHERE is_active = TRUE AND expires_at > NOW()
           AND commence_time > NOW() AND event_id <> $1
         ORDER BY event_id, ev_percent DESC`,
        [eventId]
      );
      const legPool = others.rows
        .sort((a, b) => b.ev_percent - a.ev_percent)
        .slice(0, 4)
        .map(r => ({
          event_name: r.event_name,
          sport_key: r.sport_key,
          selection: r.selection,
          bookie: r.bookie,
          odds: parseFloat(r.bookie_odds),
          fair_odds: parseFloat(r.fair_odds),
          ev_percent: parseFloat(r.ev_percent),
          commence_time: r.commence_time,
        }));

      const anchorLeg = {
        event_name: event.event_name,
        sport_key: event.sport_key,
        selection: ourPick.selection,
        bookie: ourPick.bookie,
        odds: ourPick.odds,
        fair_odds: ourPick.fair_odds || ourPick.odds,
        ev_percent: ourPick.ev_percent,
        commence_time: event.commence_time,
      };

      for (let k = 2; k <= Math.min(5, legPool.length + 1); k++) {
        const legs = [anchorLeg, ...legPool.slice(0, k - 1)];
        const combinedOdds = legs.reduce((a, l) => a * l.odds, 1);
        const combinedProb = legs.reduce((a, l) => a * (1 / l.fair_odds), 1);
        const ev = (combinedOdds * combinedProb - 1) * 100;
        const fairCombined = 1 / combinedProb;
        multis.push({
          name: MULTI_NAMES[k],
          legs,
          combined_odds: parseFloat(combinedOdds.toFixed(2)),
          ev_percent: parseFloat(ev.toFixed(2)),
          kelly_percent: kellyFraction(combinedOdds, fairCombined),
          confidence: confidenceScore(combinedProb, ev),
        });
      }
      multis = multis.filter(m => m.ev_percent > 0);
    }

    // Non-h2h markets, split into player props vs other bets.
    // Two-outcome groups (Over/Under, Yes/No) get a proper no-vig fair price.
    const playerProps = [];
    const otherBets = [];
    for (const [market, selMap] of Object.entries(otherMarkets)) {
      const sels = Object.keys(selMap);
      let fairProbs = null;
      if (sels.length === 2) {
        const meds = sels.map(s => median(Object.values(selMap[s])));
        if (meds.every(Boolean)) fairProbs = removeVig(meds);
      }
      sels.forEach((sel, i) => {
        const prices = selMap[sel];
        const best = Object.entries(prices).reduce(
          (a, [book, p]) => (!a || p > a.odds ? { bookie: book, odds: p } : a), null
        );
        if (!best) return;
        const fair = fairProbs ? 1 / fairProbs[i] : null;
        const ev = fair ? calcEVPercent(best.odds, fair) : 0;
        const winProb = fair ? 1 / fair : 1 / best.odds;
        const conf = confidenceScore(winProb, ev);
        const bet = {
          market, selection: sel,
          bookie: best.bookie, odds: best.odds,
          fair_odds: fair ? parseFloat(fair.toFixed(3)) : null,
          ev_percent: parseFloat(ev.toFixed(2)),
          kelly_percent: fair ? kellyFraction(best.odds, fair) : 0,
          confidence: conf,
          win_prob: parseFloat((winProb * 100).toFixed(1)),
          tip_grade: tipGrade(conf),
          reasoning: tipReasoning(winProb, ev, conf, best.bookie, null),
        };
        if (/player|anytime|scorer|disposal|goal_scorer|try/i.test(market)) playerProps.push(bet);
        else otherBets.push(bet);
      });
    }

    // Sidebar: full odds grid, every book × every h2h selection
    const oddsGrid = Object.entries(bookmakers)
      .map(([book, prices]) => ({ bookmaker: book, prices }))
      .sort((a, b) => a.bookmaker.localeCompare(b.bookmaker));

    res.json({
      event,
      our_pick: ourPick,
      singles,
      multis,
      player_props: playerProps.sort((a, b) => b.ev_percent - a.ev_percent),
      other_bets: otherBets.sort((a, b) => b.ev_percent - a.ev_percent),
      odds_grid: oddsGrid,
      fair_odds: Object.fromEntries(
        Object.entries(fairBySelection).map(([s, f]) => [s, parseFloat(f.toFixed(3))])
      ),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
