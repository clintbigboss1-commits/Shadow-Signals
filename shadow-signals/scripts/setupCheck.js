#!/usr/bin/env node
/**
 * SETUP CHECKER — run this after adding env vars
 * node scripts/setupCheck.js
 *
 * Checks EVERYTHING and tells you exactly what's missing
 * and what to do about it.
 */
'use strict';
const path = require('path');
const fs   = require('fs');

// Auto-locate .env — script may be run from project root or shadow-signals/
function loadEnv() {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      require('dotenv').config({ path: p });
      return p;
    }
  }
  require('dotenv').config();
  return null;
}
const envPath = loadEnv();

const https = require('https');
const http  = require('http');

const RED   = '\x1b[31m';
const GRN   = '\x1b[32m';
const YLW   = '\x1b[33m';
const CYN   = '\x1b[36m';
const RST   = '\x1b[0m';
const BOLD  = '\x1b[1m';

function ok(msg)   { console.log(`  ${GRN}✅ ${msg}${RST}`); }
function fail(msg) { console.log(`  ${RED}❌ ${msg}${RST}`); }
function warn(msg) { console.log(`  ${YLW}⚠️  ${msg}${RST}`); }
function info(msg) { console.log(`  ${CYN}ℹ️  ${msg}${RST}`); }
function head(msg) { console.log(`\n${BOLD}${msg}${RST}`); }

let issues = 0;
let warnings = 0;

function check(condition, passMsg, failMsg, isWarning = false) {
  if (condition) { ok(passMsg); }
  else if (isWarning) { warn(failMsg); warnings++; }
  else { fail(failMsg); issues++; }
}

async function run() {
  console.log(`\n${BOLD}${CYN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}`);
  console.log(`${BOLD}${CYN}   SHADOW SYNDICATE — Setup Checker${RST}`);
  console.log(`${BOLD}${CYN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}`);

  // ── 1. Environment variables ────────────────────────────────────────────
  head('1. Environment Variables');

  const DATABASE_URL   = process.env.DATABASE_URL;
  const ODDS_API_KEY   = process.env.ODDS_API_KEY;
  const STRIPE_SK      = process.env.STRIPE_SECRET_KEY;
  const STRIPE_WH      = process.env.STRIPE_WEBHOOK_SECRET;
  const JWT_SECRET     = process.env.JWT_SECRET;
  const FRONTEND_URL   = process.env.FRONTEND_URL;
  const PRICE_STARTER  = process.env.STRIPE_PRICE_STARTER_MONTH;
  const PRICE_PRO      = process.env.STRIPE_PRICE_PRO_MONTH;
  const PRICE_ELITE    = process.env.STRIPE_PRICE_ELITE_MONTH;

  check(DATABASE_URL && !DATABASE_URL.includes('[YOUR-PASSWORD]'),
    'DATABASE_URL is set',
    'DATABASE_URL missing — create Supabase at supabase.com → Settings → Database → URI');

  check(ODDS_API_KEY && ODDS_API_KEY !== 'your_odds_api_key_here',
    'ODDS_API_KEY is set',
    'ODDS_API_KEY missing — get from the-odds-api.com');

  if (STRIPE_SK) {
    if (STRIPE_SK.startsWith('sk_live')) ok('STRIPE_SECRET_KEY set — LIVE mode ✅');
    else { warn('STRIPE_SECRET_KEY is TEST mode (sk_test_...) — real payments won\'t work'); warnings++; }
  } else { fail('STRIPE_SECRET_KEY missing'); issues++; }

  check(STRIPE_WH && STRIPE_WH.startsWith('whsec_'),
    'STRIPE_WEBHOOK_SECRET is set',
    'STRIPE_WEBHOOK_SECRET missing — this is why plans don\'t update after payment!\n     → dashboard.stripe.com → Developers → Webhooks → Add endpoint → copy signing secret');

  check(JWT_SECRET && JWT_SECRET.length >= 32,
    'JWT_SECRET is set',
    'JWT_SECRET missing — run: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');

  check(FRONTEND_URL && !FRONTEND_URL.includes('localhost'),
    `FRONTEND_URL set: ${FRONTEND_URL}`,
    'FRONTEND_URL missing or still localhost — set to your Vercel URL',
    true);

  check(PRICE_STARTER && PRICE_STARTER.startsWith('price_'),
    'Stripe STARTER price ID set',
    'Stripe price IDs missing — run: node scripts/stripeSetup.js');
  check(PRICE_PRO && PRICE_PRO.startsWith('price_'),
    'Stripe PRO price ID set',
    'Stripe price IDs missing — run: node scripts/stripeSetup.js');
  check(PRICE_ELITE && PRICE_ELITE.startsWith('price_'),
    'Stripe ELITE price ID set',
    'Stripe price IDs missing — run: node scripts/stripeSetup.js');

  // ── 2. Database connection ──────────────────────────────────────────────
  head('2. Database Connection');
  if (DATABASE_URL && !DATABASE_URL.includes('[YOUR-PASSWORD]')) {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 6000,
      });
      const r = await pool.query('SELECT NOW()');
      ok(`Database connected — ${r.rows[0].now}`);

      // Check tables exist
      const tables = await pool.query(
        `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`
      );
      if (tables.rows.length === 0) {
        warn('No tables found — run: node scripts/initDB.js');
        warnings++;
      } else {
        ok(`Tables exist: ${tables.rows.map(r=>r.tablename).join(', ')}`);
      }
      await pool.end();
    } catch (err) {
      fail(`Database connection failed: ${err.message}`);
      info('Check your DATABASE_URL — password might be wrong');
      issues++;
    }
  } else {
    warn('Skipping DB check — DATABASE_URL not set');
  }

  // ── 3. The Odds API ──────────────────────────────────────────────────────
  head('3. The Odds API (the-odds-api.com)');
  if (process.env.THE_ODDS_API_KEY) {
    try {
      const axios = require('axios');
      const r = await axios.get('https://api.the-odds-api.com/v4/sports', {
        params: { apiKey: process.env.THE_ODDS_API_KEY },
        timeout: 8000,
      });
      const sports = Array.isArray(r.data) ? r.data : [];
      ok(`Connected — ${sports.length} sports available`);
    } catch (err) {
      fail(`The Odds API error: ${err.response?.data?.message || err.message}`);
      issues++;
    }
  } else {
    warn('Skipping The Odds API check — THE_ODDS_API_KEY not set');
  }

  // ── 4. Stripe ───────────────────────────────────────────────────────────
  head('4. Stripe');
  if (STRIPE_SK) {
    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(STRIPE_SK, { apiVersion: '2024-04-10' });
      await stripe.paymentMethods.list({ limit: 1 });
      ok(`Connected — mode: ${STRIPE_SK.startsWith('sk_live') ? 'LIVE' : 'TEST'}`);

      if (!STRIPE_WH) {
        fail('Webhook secret not set — this blocks plan upgrades after payment');
        info('  1. dashboard.stripe.com → Developers → Webhooks');
        info('  2. Add endpoint: https://YOUR-RAILWAY-URL/api/payments/webhook');
        info('  3. Copy signing secret → add to Railway as STRIPE_WEBHOOK_SECRET');
      }

      // Verify each price ID exists in Stripe
      const prices = [
        { id: PRICE_STARTER, label: 'Starter' },
        { id: PRICE_PRO,     label: 'Pro'     },
        { id: PRICE_ELITE,   label: 'Elite'   },
      ];

      for (const p of prices) {
        if (p.id && p.id !== 'price_xxx' && p.id.startsWith('price_')) {
          try {
            const price = await stripe.prices.retrieve(p.id);
            ok(`${p.label} price exists: ${price.nickname || price.id} ($${price.unit_amount/100} ${price.currency.toUpperCase()})`);
          } catch {
            fail(`${p.label} price ID invalid: ${p.id}`);
            info('Run: node scripts/stripeSetup.js to create prices');
            issues++;
          }
        } else {
          warn(`${p.label} price ID not set — run: node scripts/stripeSetup.js`);
          warnings++;
        }
      }
    } catch (err) {
      fail(`Stripe connection failed: ${err.message}`);
      issues++;
    }
  } else {
    warn('Skipping Stripe check — secret key not set');
  }

  // ── 5. Redis (Upstash) — NOT needed yet ────────────────────────────────
  head('5. Redis / Upstash');
  if (process.env.REDIS_URL) {
    info('Redis URL is set but NOT used in the current codebase');
    info('The system uses in-memory + PostgreSQL caching — Redis is for future scale');
    info('You can leave it disconnected for now');
  } else {
    ok('Redis not configured — not needed yet (using in-memory + DB cache)');
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log(`\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}`);
  if (issues === 0 && warnings === 0) {
    console.log(`${GRN}${BOLD}✅ ALL CHECKS PASSED — you're ready to go live!${RST}`);
  } else {
    if (issues > 0) {
      console.log(`${RED}${BOLD}❌ ${issues} critical issue${issues!==1?'s':''} to fix before going live${RST}`);
    }
    if (warnings > 0) {
      console.log(`${YLW}${BOLD}⚠️  ${warnings} warning${warnings!==1?'s':''} (non-blocking but worth fixing)${RST}`);
    }
    console.log(`\nFix the ❌ items first, then run this again.`);
  }
  console.log(`${'━'.repeat(41)}\n`);
}

run().catch(err => {
  console.error('Setup check error:', err.message);
  process.exit(1);
});