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

  // Run incremental migrations (idempotent — safe on every boot)
  const migratePath = path.join(__dirname, 'migrate.sql');
  if (fs.existsSync(migratePath)) {
    const migration = fs.readFileSync(migratePath, 'utf8');
    const mStmts = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    const mClient = await pool.connect();
    let mFailed = 0;
    try {
      await mClient.query("SET lock_timeout = '5s'");
      await mClient.query("SET statement_timeout = '20s'");
      for (const stmt of mStmts) {
        try { await mClient.query(stmt); }
        catch (err) {
          mFailed++;
          console.warn(`⚠️  Migration skipped (${err.message.slice(0, 80)})`);
        }
      }
    } finally {
      try { await mClient.query('RESET lock_timeout'); await mClient.query('RESET statement_timeout'); } catch (_) {}
      mClient.release();
    }
    if (mFailed === 0) console.log('✅ Migrations applied');
    else console.warn(`⚠️  Migrations: ${mFailed} statement(s) skipped`);
  }
}

module.exports = { db, initDB, pool };
