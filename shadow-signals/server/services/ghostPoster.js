'use strict';

// ── GHOST automation — autonomous FB + IG poster ───────────────────────────
// Cadence:
//   GHOST_TEST_MODE=true  → one post every hour (72-hour testing phase)
//   otherwise             → 12 posts/day, 80% inside AU peak windows
//                           (7–9 AM, 12–1 PM, 6–9 PM Sydney), 20% off-peak
// Posting requires Meta Graph API credentials:
//   META_PAGE_ID, META_PAGE_ACCESS_TOKEN          → Facebook page feed
//   META_IG_USER_ID (+ GHOST_IMAGE_URL)           → Instagram (needs an image)
// Without credentials the engine stays in dry-run: it logs what it WOULD
// post without consuming the queue, so seeded content survives until go-live.

const cron = require('node-cron');
const axios = require('axios');
const {
  SEED_TEASERS, EDUCATION_POOL, TESTIMONIAL_POOL,
  violatesOddsRule, winPostFromOpportunity, withLink, SITE_URL,
} = require('./ghostContent');

const GRAPH = 'https://graph.facebook.com/v19.0';

// Mirrors client confidence mapping (lib/confidence.ts).
function confidenceFromEV(ev) {
  const pts = [[-10, 5], [0, 50], [3, 62], [5, 72], [8, 85], [12, 95]];
  if (ev <= pts[0][0]) return pts[0][1];
  if (ev >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 1; i < pts.length; i++) {
    if (ev <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      return Math.round(y0 + ((ev - x0) / (x1 - x0)) * (y1 - y0));
    }
  }
  return 50;
}

function isConfigured() {
  return Boolean(process.env.META_PAGE_ID && process.env.META_PAGE_ACCESS_TOKEN);
}

function sydneyHour() {
  return parseInt(new Date().toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney', hour: 'numeric', hour12: false,
  }), 10);
}

function isPeakWindow() {
  const h = sydneyHour();
  return (h >= 7 && h < 9) || (h >= 12 && h < 13) || (h >= 18 && h < 21);
}

async function ensureTable() {
  const { db } = require('../db');
  await db.query(`
    CREATE TABLE IF NOT EXISTS ghost_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      kind VARCHAR(20) NOT NULL,           -- teaser | win | education | testimonial
      sport VARCHAR(50),
      body TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'queued', -- queued | posted | failed | blocked
      fb_post_id VARCHAR(100),
      ig_post_id VARCHAR(100),
      error TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      posted_at TIMESTAMPTZ,
      UNIQUE (body)
    )
  `);
}

async function seedTeasers() {
  const { db } = require('../db');
  for (const t of SEED_TEASERS) {
    await db.query(
      `INSERT INTO ghost_posts (kind, sport, body) VALUES ($1, $2, $3)
       ON CONFLICT (body) DO NOTHING`,
      [t.kind, t.sport, withLink(t.text)]
    );
  }
}

// 40% wins, 40% education, 20% testimonial — teasers jump the queue while
// any remain (they're time-boxed round content).
async function pickNextPost() {
  const { db } = require('../db');

  const teaser = await db.query(
    `SELECT * FROM ghost_posts WHERE status = 'queued' AND kind = 'teaser'
     ORDER BY created_at ASC LIMIT 1`
  );
  if (teaser.rows.length) return teaser.rows[0];

  const roll = Math.random();
  if (roll < 0.4) {
    // Live win/signal post from the strongest current opportunity
    const opp = await db.query(
      `SELECT * FROM ev_opportunities
       WHERE is_active = TRUE AND expires_at > NOW() AND commence_time > NOW()
         AND ev_percent BETWEEN 5 AND 20
       ORDER BY ev_percent DESC LIMIT 1`
    );
    if (opp.rows.length) {
      const o = opp.rows[0];
      const body = winPostFromOpportunity(o, confidenceFromEV(parseFloat(o.ev_percent)));
      const ins = await db.query(
        `INSERT INTO ghost_posts (kind, sport, body) VALUES ('win', $1, $2)
         ON CONFLICT (body) DO NOTHING RETURNING *`,
        [o.sport_key, body]
      );
      if (ins.rows.length) return ins.rows[0];
    }
  }

  // Education / testimonial from the pools — rotate by least-recently used
  const pool = roll < 0.8 ? EDUCATION_POOL : TESTIMONIAL_POOL;
  const kind = roll < 0.8 ? 'education' : 'testimonial';
  for (const text of pool) {
    const body = withLink(text);
    const recent = await db.query(
      `SELECT 1 FROM ghost_posts WHERE body = $1 AND (status = 'queued' OR posted_at > NOW() - INTERVAL '7 days')`,
      [body]
    );
    if (!recent.rows.length) {
      const ins = await db.query(
        `INSERT INTO ghost_posts (kind, body) VALUES ($1, $2)
         ON CONFLICT (body) DO UPDATE SET status = 'queued', posted_at = NULL
         RETURNING *`,
        [kind, body]
      );
      return ins.rows[0];
    }
  }
  return null;
}

async function postToFacebook(body) {
  const res = await axios.post(`${GRAPH}/${process.env.META_PAGE_ID}/feed`, null, {
    params: {
      message: body,
      link: SITE_URL,
      access_token: process.env.META_PAGE_ACCESS_TOKEN,
    },
    timeout: 15000,
  });
  return res.data.id;
}

// Instagram needs an image: create a media container, then publish it.
async function postToInstagram(body) {
  const igUser = process.env.META_IG_USER_ID;
  const imageUrl = process.env.GHOST_IMAGE_URL;
  if (!igUser || !imageUrl) return null;

  const container = await axios.post(`${GRAPH}/${igUser}/media`, null, {
    params: { image_url: imageUrl, caption: body, access_token: process.env.META_PAGE_ACCESS_TOKEN },
    timeout: 20000,
  });
  const publish = await axios.post(`${GRAPH}/${igUser}/media_publish`, null, {
    params: { creation_id: container.data.id, access_token: process.env.META_PAGE_ACCESS_TOKEN },
    timeout: 20000,
  });
  return publish.data.id;
}

async function publish(post) {
  const { db } = require('../db');

  if (violatesOddsRule(post.body)) {
    await db.query(`UPDATE ghost_posts SET status = 'blocked', error = 'odds-number compliance' WHERE id = $1`, [post.id]);
    console.warn(`👻 GHOST blocked (compliance): ${post.body.slice(0, 60)}...`);
    return { blocked: true };
  }

  try {
    const fbId = await postToFacebook(post.body);
    let igId = null;
    try { igId = await postToInstagram(post.body); }
    catch (e) { console.warn('👻 GHOST IG post failed:', e.response?.data?.error?.message || e.message); }

    await db.query(
      `UPDATE ghost_posts SET status = 'posted', fb_post_id = $2, ig_post_id = $3, posted_at = NOW() WHERE id = $1`,
      [post.id, fbId, igId]
    );
    console.log(`👻 GHOST posted [${post.kind}]: ${post.body.slice(0, 70)}...`);
    return { fbId, igId };
  } catch (e) {
    const msg = e.response?.data?.error?.message || e.message;
    await db.query(`UPDATE ghost_posts SET status = 'failed', error = $2 WHERE id = $1`, [post.id, msg]);
    console.error('👻 GHOST post failed:', msg);
    return { error: msg };
  }
}

async function lastPostedAt() {
  const { db } = require('../db');
  const r = await db.query(`SELECT MAX(posted_at) AS t FROM ghost_posts WHERE status = 'posted'`);
  return r.rows[0].t ? new Date(r.rows[0].t) : null;
}

async function shouldPostNow() {
  const last = await lastPostedAt();
  const minsSince = last ? (Date.now() - last.getTime()) / 60000 : Infinity;

  if (process.env.GHOST_TEST_MODE === 'true') {
    return minsSince >= 58; // hourly during the 72-hour test
  }
  // Steady state: ~12/day. Peak windows post on a 2h gap; off-peak stretches
  // to 4h so ~80% of volume lands in peak.
  return isPeakWindow() ? minsSince >= 110 : minsSince >= 235;
}

async function tick() {
  try {
    if (process.env.GHOST_ENABLED === 'false') return;
    if (!isConfigured()) {
      // Dry-run: surface what WOULD go out, but never consume the queue.
      if (!tick._warned || Date.now() - tick._warned > 3600000) {
        tick._warned = Date.now();
        console.log('👻 GHOST dry-run (set META_PAGE_ID + META_PAGE_ACCESS_TOKEN to go live)');
      }
      return;
    }
    if (!(await shouldPostNow())) return;
    const post = await pickNextPost();
    if (post) await publish(post);
  } catch (e) {
    console.error('👻 GHOST tick error:', e.message);
  }
}

async function initGhost() {
  try {
    await ensureTable();
    await seedTeasers();
    cron.schedule('*/5 * * * *', tick); // check every 5 min; cadence gates above
    const mode = process.env.GHOST_TEST_MODE === 'true' ? 'TEST (hourly)' : 'steady (12/day, peak-weighted)';
    console.log(`👻 GHOST automation ready — ${isConfigured() ? 'LIVE' : 'dry-run'} · ${mode} · ${SEED_TEASERS.length} teasers seeded`);
  } catch (e) {
    console.error('👻 GHOST init failed:', e.message);
  }
}

module.exports = { initGhost, pickNextPost, publish, tick, confidenceFromEV };
