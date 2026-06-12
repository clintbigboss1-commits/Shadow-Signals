require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('DB pool error:', err.message);
});

const db = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};

async function initDB() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  // Split on semicolons but preserve them, skip comments and blanks
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  // The schema is idempotent (runs on every boot). During a rolling deploy the
  // old instance holds locks on busy tables (odds_cache writes), so a single
  // statement timing out must not abort the whole boot — the objects already
  // exist. Bound lock waits and continue past per-statement failures.
  const client = await pool.connect();
  let failed = 0;
  try {
    await client.query("SET lock_timeout = '5s'");
    await client.query("SET statement_timeout = '20s'");
    for (const stmt of statements) {
      try {
        await client.query(stmt);
      } catch (err) {
        failed++;
        console.warn(`⚠️  Schema statement skipped (${err.message}): ${stmt.slice(0, 60)}...`);
      }
    }
  } finally {
    // The client returns to the pool — clear session settings so later
    // queries on this connection don't inherit the short init timeouts
    try { await client.query('RESET lock_timeout'); await client.query('RESET statement_timeout'); } catch (_) {}
    client.release();
  }

  if (failed === 0) console.log('✅ Database schema ready');
  else console.warn(`⚠️  Database schema ready with ${failed} skipped statement(s) — likely lock contention during deploy`);
}

module.exports = { db, initDB, pool };
