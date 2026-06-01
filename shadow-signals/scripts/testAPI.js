'use strict';
require('dotenv').config();
const axios = require('axios');

async function test() {
  console.log('\n🧪 Shadow Signals — API Tests\n');
  let allOk = true;

  // ── 1. Odds API ─────────────────────────────────────────────────────────
  console.log('1. The Odds API (the-odds-api.com)...');
  if (!process.env.ODDS_API_KEY || process.env.ODDS_API_KEY === 'your_odds_api_key_here') {
    console.log('   ⚠️  ODDS_API_KEY not set in .env — skipping');
    allOk = false;
  } else {
    try {
      const r = await axios.get('https://api.the-odds-api.com/v4/sports', {
        params: { apiKey: process.env.ODDS_API_KEY },
        timeout: 8000,
      });
      const remaining = r.headers['x-requests-remaining'];
      const used      = r.headers['x-requests-used'];
      const au = r.data.filter(s =>
        ['aussierules_afl','rugbyleague_nrl','cricket_odi','cricket_t20','soccer_a_league'].includes(s.key)
      );
      console.log(`   ✅ Connected | Used: ${used} | Remaining: ${remaining}/month`);
      console.log(`   AU sports: ${au.map(s => s.title).join(', ')}\n`);
    } catch (e) {
      console.log(`   ❌ ${e.response?.data?.message || e.message}\n`);
      allOk = false;
    }
  }

  // ── 2. ESPN ─────────────────────────────────────────────────────────────
  console.log('2. ESPN (free, unlimited)...');
  try {
    const r = await axios.get(
      'https://site.api.espn.com/apis/site/v2/sports/australian-football/afl/scoreboard',
      { timeout: 5000 }
    );
    console.log(`   ✅ ${r.data?.events?.length || 0} AFL events | Cost: $0\n`);
  } catch (e) {
    console.log(`   ⚠️  ${e.message} (non-critical)\n`);
  }

  // ── 3. TheSportsDB ──────────────────────────────────────────────────────
  console.log('3. TheSportsDB (free, unlimited)...');
  try {
    const r = await axios.get(
      'https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?c=Australia',
      { timeout: 5000 }
    );
    const count = r.data?.countrys?.length || 0;
    console.log(`   ✅ ${count} AU leagues | Cost: $0\n`);
  } catch (e) {
    console.log(`   ⚠️  ${e.message} (non-critical)\n`);
  }

  // ── 4. Database ─────────────────────────────────────────────────────────
  console.log('4. Database (Supabase)...');
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[YOUR-PASSWORD]')) {
    console.log('   ⚠️  DATABASE_URL not set in .env');
    console.log('   Get from: supabase.com → project → settings → database → URI\n');
    allOk = false;
  } else {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });
      const r = await pool.query('SELECT NOW()');
      console.log(`   ✅ Connected | DB time: ${r.rows[0].now}\n`);
      await pool.end();
    } catch (e) {
      console.log(`   ❌ ${e.message}\n`);
      allOk = false;
    }
  }

  // ── 5. Stripe ───────────────────────────────────────────────────────────
  console.log('5. Stripe...');
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_your_key_here') {
    console.log('   ⚠️  STRIPE_SECRET_KEY not set in .env\n');
  } else {
    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
      await stripe.paymentMethods.list({ limit: 1 });
      const mode = process.env.STRIPE_SECRET_KEY.includes('test') ? 'TEST ✅' : 'LIVE ⚠️';
      console.log(`   ✅ Connected | Mode: ${mode}\n`);
    } catch (e) {
      console.log(`   ❌ ${e.message}\n`);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════');
  if (allOk) {
    console.log('✅ All critical checks passed!');
    console.log('Next: node scripts/initDB.js');
  } else {
    console.log('⚠️  Fix the issues above then run again.');
    console.log('Minimum needed: ODDS_API_KEY + DATABASE_URL');
  }
  console.log('');
}

test().catch(console.error);
