'use strict';
require('dotenv').config();
const { initDB, pool } = require('../server/db');

console.log('\n🗄️  Initialising Shadow Signals database...\n');

initDB()
  .then(async () => {
    // Verify tables were created
    const result = await pool.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    console.log('\n📋 Tables ready:');
    result.rows.forEach(r => console.log(`   • ${r.tablename}`));
    console.log('\n✅ Database ready!');
    console.log('Next step: node scripts/stripeSetup.js\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed:', err.message);
    console.log('\nCheck your DATABASE_URL in .env');
    console.log('Get it from: supabase.com → project → settings → database → URI (include password)\n');
    process.exit(1);
  });
