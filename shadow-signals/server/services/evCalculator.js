'use strict';
const { db } = require('../db');
const { getModel } = require('./models');
const { norm } = require('./models/shared/normalise');
const { recordSignal } = require('./clvTracker');
const pulse = require('./pulse');

// Remove bookmaker margin — return array of fair probabilities
function removeVig(oddsArray) {
  const probs = oddsArray.map(o => 1 / o);
  const total = probs.reduce((a, b) => a + b, 0);
  return probs.map(p => p / total);
}

// Calculate EV as a percentage
function calcEVPercent(bookedOdds, fairOdds) {
  const winProb = 1 / fairOdds;
  return ((bookedOdds - 1) * winProb - (1 - winProb)) * 100;
}

// Fractional Kelly criterion
function kellyFraction(bookedOdds, fairOdds, fraction = 0.25) {
  const winProb = 1 / fairOdds;
  const b = bookedOdds - 1;
  if (b <= 0) return 0;
  const k = (b * winProb - (1 - winProb)) / b;
  return parseFloat((Math.max(0, k * fraction) * 100).toFixed(3));
}

// Genuine bookmaker edges sit between 3-15%. Below 3% is margin noise.
// Above 20% is stale/broken data — discard both ends.
const EV_MIN_PERCENT = 3.0;
const EV_MAX_PERCENT = 20;
// Price more than 2.2x market median = stale or error price, discard.
const OUTLIER_RATIO = 2.2;
// Need at least 4 books pricing a selection to estimate fair value reliably.
const MIN_BOOKS_PER_SELECTION = 4;

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
}

// Get the sharpest available price for a selection
function getSharpPrice(bookmakerMap, selection) {
  const SHARP_PRIORITY = ['betfair_ex_au', 'pinnacle', 'bet365', 'bet365_au', 'unibet'];
  for (const sharp of SHARP_PRIORITY) {
    if (bookmakerMap[sharp] && bookmakerMap[sharp][selection]) {
      return bookmakerMap[sharp][selection];
    }
  }
  // Fallback: median of all available prices
  const prices = Object.values(bookmakerMap)
    .map(b => b[selection])
    .filter(Boolean);
  return median(prices);
}

// Main: compute EV from cached odds — ZERO API calls
async function computeEVFromCache(sportKey = null) {
  console.log(`🧮 Computing EV from cache${sportKey ? ` for ${sportKey}` : ''}...`);
  const t = Date.now();

  let query = `
    SELECT DISTINCT ON (event_id, selection, bookmaker)
      sport_key, event_id, home_team, away_team,
      commence_time, bookmaker, market, selection, odds
    FROM odds_cache
    WHERE expires_at > NOW() AND market = 'h2h'
  `;
  const params = [];
  if (sportKey) {
    query += ' AND sport_key = $1';
    params.push(sportKey);
  }
  query += ' ORDER BY event_id, selection, bookmaker, fetched_at DESC';

  const raw = await db.query(query, params);
  if (raw.rows.length === 0) {
    console.log('⚠️  No cached odds to compute EV from');
    return [];
  }

  // Group into events → bookmakers → selections → price
  const events = {};
  for (const row of raw.rows) {
    if (!events[row.event_id]) {
      events[row.event_id] = {
        sport_key: row.sport_key,
        event_id: row.event_id,
        event_name: `${row.home_team} v ${row.away_team}`,
        home_team: row.home_team,
        away_team: row.away_team,
        commence_time: row.commence_time,
        bookmakers: {},
      };
    }
    const e = events[row.event_id];
    if (!e.bookmakers[row.bookmaker]) e.bookmakers[row.bookmaker] = {};
    e.bookmakers[row.bookmaker][row.selection] = parseFloat(row.odds);
  }

  // Pre-resolve model predictions per event (uses module-level caches — 1 DB call/30 min per sport)
  const modelPredByEvent = new Map();
  for (const event of Object.values(events)) {
    const model = getModel(event.sport_key);
    if (!model || !model.isImplemented) continue;
    try {
      const homeId = await model.resolveTeamFromOddsName(event.home_team);
      const awayId = await model.resolveTeamFromOddsName(event.away_team);
      if (homeId && awayId) {
        const pred = await model.predict(homeId, awayId);
        if (pred) modelPredByEvent.set(event.event_id, { pred, homeId });
      }
    } catch (_) {}
  }

  const opportunities = [];
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Deactivate stale opportunities
    if (sportKey) {
      await client.query(
        'UPDATE ev_opportunities SET is_active = FALSE WHERE sport_key = $1',
        [sportKey]
      );
    } else {
      await client.query('UPDATE ev_opportunities SET is_active = FALSE');
    }

    for (const event of Object.values(events)) {
      // Skip games that already started — stale prices masquerade as edges
      if (event.commence_time && new Date(event.commence_time).getTime() < Date.now()) continue;

      // Collect all unique selections across all bookmakers
      const selections = [...new Set(
        Object.values(event.bookmakers).flatMap(b => Object.keys(b))
      )];
      if (selections.length < 2) continue;

      // Per-selection market medians — used to spot stale outlier prices
      const medians = {};
      let thinMarket = false;
      for (const sel of selections) {
        const prices = Object.values(event.bookmakers).map(b => b[sel]).filter(Boolean);
        if (prices.length < MIN_BOOKS_PER_SELECTION) { thinMarket = true; break; }
        medians[sel] = median(prices);
      }
      if (thinMarket) continue;

      // Proper no-vig over the FULL outcome set (handles 2-way and 3-way)
      const sharpVector = selections.map(sel => {
        const p = getSharpPrice(event.bookmakers, sel);
        // A "sharp" price that is itself an outlier is not sharp — fall back to median
        if (p && p > medians[sel] * OUTLIER_RATIO) return medians[sel];
        return p;
      });
      if (sharpVector.some(p => !p)) continue;
      const fairProbs = removeVig(sharpVector);

      // Model override: if we have a prediction for this event, use model prob as fair value
      const modelData = modelPredByEvent.get(event.event_id);

      // Best +EV per (event, selection) — one card per real opportunity
      for (let i = 0; i < selections.length; i++) {
        const sel = selections[i];
        const consensusFairOdds = 1 / fairProbs[i];

        // Determine fair odds and signal source
        let effectiveFairOdds = consensusFairOdds;
        let signalSource = 'consensus_v1';
        let modelConfidence = null;

        if (modelData) {
          const { pred, homeId } = modelData;
          const selN = norm(sel);
          const homeN = norm(event.home_team);
          const awayN = norm(event.away_team);
          const isHome = selN === homeN || homeN.includes(selN) || selN.includes(homeN)
            || (selN.length > 3 && homeN.length > 3 && (selN.startsWith(homeN.slice(0, 4)) || homeN.startsWith(selN.slice(0, 4))));
          const isAway = !isHome && (selN === awayN || awayN.includes(selN) || selN.includes(awayN));
          const modelProb = isHome ? pred.home_win_prob : (isAway ? pred.away_win_prob : null);
          if (modelProb && modelProb > 0.05 && modelProb < 0.95) {
            effectiveFairOdds = 1 / modelProb;
            signalSource = `model_${event.sport_key}_v1`;
            modelConfidence = modelProb;
          }
        }

        // Model signals require ≥5% EV (higher bar); consensus stays at 3%
        const evMin = modelConfidence !== null ? 5.0 : EV_MIN_PERCENT;

        let best = null;
        for (const [bookie, prices] of Object.entries(event.bookmakers)) {
          if (['betfair_ex_au', 'pinnacle'].includes(bookie)) continue;
          const bookedOdds = prices[sel];
          if (!bookedOdds) continue;
          if (bookedOdds > medians[sel] * OUTLIER_RATIO) continue;
          const ev = calcEVPercent(bookedOdds, effectiveFairOdds);
          if (ev < evMin) continue;
          if (ev > EV_MAX_PERCENT) continue;
          if (!best || ev > best.ev) best = { bookie, bookedOdds, ev };
        }

        if (!best) continue;

        const kelly = kellyFraction(best.bookedOdds, effectiveFairOdds);
        const expires = new Date(Date.now() + 2 * 3600 * 1000);

        const opp = {
          sport_key:       event.sport_key,
          event_id:        event.event_id,
          event_name:      event.event_name,
          market:          'h2h',
          selection:       sel,
          bookie:          best.bookie,
          bookie_odds:     best.bookedOdds,
          fair_odds:       parseFloat(effectiveFairOdds.toFixed(3)),
          ev_percent:      parseFloat(best.ev.toFixed(2)),
          kelly_percent:   kelly,
          commence_time:   event.commence_time,
          expires_at:      expires,
          source:          signalSource,
          model_confidence: modelConfidence,
        };

        opportunities.push(opp);
        recordSignal(opp); // best-effort, non-blocking
        if (opp.ev_percent >= 3) pulse.recordEdge(opp);

        await client.query(
          `INSERT INTO ev_opportunities
           (sport_key, event_id, event_name, market, selection, point, bookie,
            bookie_odds, fair_odds, ev_percent, kelly_percent,
            commence_time, expires_at, is_active, source, model_confidence)
           VALUES ($1,$2,$3,$4,$5,NULL,$6,$7,$8,$9,$10,$11,$12,TRUE,$13,$14)
           ON CONFLICT (event_id, market, selection)
           DO UPDATE SET
             sport_key        = EXCLUDED.sport_key,
             event_name       = EXCLUDED.event_name,
             point            = EXCLUDED.point,
             bookie           = EXCLUDED.bookie,
             bookie_odds      = EXCLUDED.bookie_odds,
             fair_odds        = EXCLUDED.fair_odds,
             ev_percent       = EXCLUDED.ev_percent,
             kelly_percent    = EXCLUDED.kelly_percent,
             commence_time    = EXCLUDED.commence_time,
             expires_at       = EXCLUDED.expires_at,
             found_at         = NOW(),
             is_active        = TRUE,
             source           = EXCLUDED.source,
             model_confidence = EXCLUDED.model_confidence`,
          [
            opp.sport_key, opp.event_id, opp.event_name,
            opp.market, opp.selection, opp.bookie,
            opp.bookie_odds, opp.fair_odds, opp.ev_percent,
            opp.kelly_percent, opp.commence_time, opp.expires_at,
            opp.source, opp.model_confidence,
          ]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('EV compute error:', err.message);
  } finally {
    client.release();
  }

  console.log(`✅ EV: ${opportunities.length} opportunities in ${Date.now() - t}ms (0 API calls)`);
  return opportunities.sort((a, b) => b.ev_percent - a.ev_percent);
}

// ── Props EV — player O/U markets ────────────────────────────────────────────
// Separate from computeEVFromCache: different market structure, different model.
const PROP_MARKET_KEYS = [
  'player_points', 'player_rebounds', 'player_assists', 'player_threes',
  'player_disposals', 'player_marks', 'player_goal_scorer_anytime',
  'player_try_scorer_anytime', 'player_try_scorer_first',
  'player_pass_tds', 'player_pass_yds', 'player_rush_yds', 'player_receptions',
  'player_shots_on_target',
];

// Map from market key → stat type string for nba_props model
const NBA_PROPS_STAT = {
  player_points: 'pts',
  player_rebounds: 'reb',
  player_assists: 'ast',
};

async function computePropsEVFromCache() {
  const t = Date.now();
  const raw = await db.query(`
    SELECT DISTINCT ON (event_id, market, selection, bookmaker)
      sport_key, event_id, home_team, away_team, commence_time,
      bookmaker, market, selection, odds, point
    FROM odds_cache
    WHERE expires_at > NOW() AND market = ANY($1)
    ORDER BY event_id, market, selection, bookmaker, fetched_at DESC
  `, [PROP_MARKET_KEYS]);

  if (raw.rows.length === 0) return [];

  // Build: event → market → playerBase → { point, bookmakers: { bookie: {Over,Under} } }
  const events = {};
  for (const row of raw.rows) {
    if (!events[row.event_id]) {
      events[row.event_id] = {
        sport_key: row.sport_key, event_id: row.event_id,
        home_team: row.home_team, away_team: row.away_team,
        commence_time: row.commence_time, markets: {},
      };
    }
    const mKey = row.market;
    if (!events[row.event_id].markets[mKey]) events[row.event_id].markets[mKey] = {};

    // "LeBron James Over" → base="LeBron James", dir="Over"
    const dirMatch = row.selection.match(/\s+(Over|Under)$/i);
    if (!dirMatch) continue;
    const dir = dirMatch[1];
    const base = row.selection.slice(0, row.selection.length - dir.length - 1).trim();

    const em = events[row.event_id].markets[mKey];
    if (!em[base]) em[base] = { point: null, bookmakers: {} };
    if (row.point != null) em[base].point = parseFloat(row.point);
    if (!em[base].bookmakers[row.bookmaker]) em[base].bookmakers[row.bookmaker] = {};
    em[base].bookmakers[row.bookmaker][dir] = parseFloat(row.odds);
  }

  const opportunities = [];
  const client = await db.getClient();

  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE ev_opportunities SET is_active = FALSE WHERE market = ANY($1)',
      [PROP_MARKET_KEYS]
    );

    for (const event of Object.values(events)) {
      if (event.commence_time && new Date(event.commence_time) < new Date()) continue;

      for (const [marketKey, players] of Object.entries(event.markets)) {
        for (const [playerBase, data] of Object.entries(players)) {
          const { point: line, bookmakers } = data;

          // Need ≥3 books with both sides to estimate fair value
          const complete = Object.entries(bookmakers)
            .filter(([, p]) => p.Over && p.Under && p.Over > 1.01 && p.Under > 1.01);
          if (complete.length < 3) continue;

          // Sharp anchor: Betfair → Pinnacle → bet365 → median
          const SHARPS = ['betfair_ex_au', 'pinnacle', 'bet365_au', 'bet365'];
          let anchorOver = null, anchorUnder = null;
          for (const sharp of SHARPS) {
            if (bookmakers[sharp]?.Over && bookmakers[sharp]?.Under) {
              anchorOver  = bookmakers[sharp].Over;
              anchorUnder = bookmakers[sharp].Under;
              break;
            }
          }
          if (!anchorOver) {
            const overs  = complete.map(([, p]) => p.Over).sort((a, b) => a - b);
            const unders = complete.map(([, p]) => p.Under).sort((a, b) => a - b);
            anchorOver  = overs[Math.floor(overs.length / 2)];
            anchorUnder = unders[Math.floor(unders.length / 2)];
          }

          // De-vig the O/U pair
          const rawO = 1 / anchorOver, rawU = 1 / anchorUnder;
          const tot = rawO + rawU;
          const fairProbOver  = rawO / tot;
          const fairProbUnder = rawU / tot;

          // NBA model override for pts/reb/ast
          let modelProbOver = null;
          const statType = NBA_PROPS_STAT[marketKey];
          if (statType && event.sport_key === 'basketball_nba' && line != null) {
            try {
              const nbaProps = require('./models/nba_props');
              const pred = await nbaProps.predictProp(playerBase, line, statType);
              if (pred && pred.prob_over > 0.05 && pred.prob_over < 0.95) {
                modelProbOver = pred.prob_over;
              }
            } catch (_) {}
          }

          for (const dir of ['Over', 'Under']) {
            const isOver    = dir === 'Over';
            const fairProb  = modelProbOver != null
              ? (isOver ? modelProbOver : 1 - modelProbOver)
              : (isOver ? fairProbOver  : fairProbUnder);
            const fairOdds  = 1 / fairProb;
            const signalSrc = modelProbOver != null
              ? `model_${event.sport_key}_props_v1` : 'consensus_v1';
            const modelConf = modelProbOver != null
              ? parseFloat((isOver ? modelProbOver : 1 - modelProbOver).toFixed(4)) : null;
            const evMin = modelConf != null ? 5.0 : EV_MIN_PERCENT;

            let best = null;
            for (const [bookie, prices] of Object.entries(bookmakers)) {
              if (['betfair_ex_au', 'pinnacle'].includes(bookie)) continue;
              const bookedOdds = prices[dir];
              if (!bookedOdds || bookedOdds <= 1.01) continue;
              const ev = calcEVPercent(bookedOdds, fairOdds);
              if (ev < evMin || ev > EV_MAX_PERCENT) continue;
              if (!best || ev > best.ev) best = { bookie, bookedOdds, ev };
            }
            if (!best) continue;

            const kelly   = kellyFraction(best.bookedOdds, fairOdds);
            const expires = new Date(Date.now() + 2 * 3600 * 1000);
            const selStr  = `${playerBase} ${dir}`;

            const opp = {
              sport_key: event.sport_key, event_id: event.event_id,
              event_name: `${event.home_team} v ${event.away_team}`,
              market: marketKey, selection: selStr, point: line,
              bookie: best.bookie, bookie_odds: best.bookedOdds,
              fair_odds: parseFloat(fairOdds.toFixed(3)),
              ev_percent: parseFloat(best.ev.toFixed(2)),
              kelly_percent: kelly, commence_time: event.commence_time,
              expires_at: expires, source: signalSrc, model_confidence: modelConf,
            };
            opportunities.push(opp);
            recordSignal(opp);

            await client.query(
              `INSERT INTO ev_opportunities
               (sport_key, event_id, event_name, market, selection, point, bookie,
                bookie_odds, fair_odds, ev_percent, kelly_percent,
                commence_time, expires_at, is_active, source, model_confidence)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,TRUE,$14,$15)
               ON CONFLICT (event_id, market, selection)
               DO UPDATE SET
                 sport_key = EXCLUDED.sport_key, event_name = EXCLUDED.event_name,
                 point = EXCLUDED.point, bookie = EXCLUDED.bookie,
                 bookie_odds = EXCLUDED.bookie_odds, fair_odds = EXCLUDED.fair_odds,
                 ev_percent = EXCLUDED.ev_percent, kelly_percent = EXCLUDED.kelly_percent,
                 commence_time = EXCLUDED.commence_time, expires_at = EXCLUDED.expires_at,
                 found_at = NOW(), is_active = TRUE,
                 source = EXCLUDED.source, model_confidence = EXCLUDED.model_confidence`,
              [
                opp.sport_key, opp.event_id, opp.event_name,
                opp.market, opp.selection, opp.point, opp.bookie,
                opp.bookie_odds, opp.fair_odds, opp.ev_percent,
                opp.kelly_percent, opp.commence_time, opp.expires_at,
                opp.source, opp.model_confidence,
              ]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Props EV compute error:', err.message);
  } finally {
    client.release();
  }

  if (opportunities.length > 0) {
    console.log(`✅ Props EV: ${opportunities.length} opportunities in ${Date.now() - t}ms`);
  }
  return opportunities.sort((a, b) => b.ev_percent - a.ev_percent);
}

module.exports = {
  computeEVFromCache,
  computePropsEVFromCache,
  calcEVPercent, kellyFraction, removeVig, getSharpPrice, median,
};
