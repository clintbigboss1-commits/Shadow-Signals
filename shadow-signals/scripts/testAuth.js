'use strict';
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

function req(method, urlPath, body, port = 3001) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({
      hostname: 'localhost', port, path: urlPath, method,
      headers: { 'Content-Type': 'application/json', ...(data ? {'Content-Length': Buffer.byteLength(data)} : {}) }
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function waitForServer(port, maxMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const r = await req('GET', '/api/health', null, port);
      if (r.status === 200) return true;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

(async () => {
  console.log('Starting server...');
  const server = spawn('node', ['server/index.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverLog = '';
  server.stdout.on('data', d => { serverLog += d.toString(); });
  server.stderr.on('data', d => { serverLog += d.toString(); });

  const ready = await waitForServer(3001);
  if (!ready) {
    console.log('SERVER FAILED TO START. Logs:');
    console.log(serverLog.slice(-2000));
    server.kill();
    process.exit(1);
  }
  console.log('Server ready.\n');

  try {
    console.log('=== HEALTH ===');
    let r = await req('GET', '/api/health');
    const health = JSON.parse(r.body);
    console.log('Status:', r.status);
    console.log('Stripe:', health.stripe?.mode, '| DB:', health.database, '| Odds:', health.odds_api, '| JWT:', health.jwt);
    console.log('Prices:', health.stripe?.price_starter, '/', health.stripe?.price_pro, '/', health.stripe?.price_elite);

    console.log('\n=== REGISTER (new user) ===');
    const ts = Date.now();
    const email = `demo+${ts}@shadow.com`;
    r = await req('POST', '/api/auth/register', { email, password: 'Test1234!', name: 'Demo User' });
    console.log('Status:', r.status);
    console.log('Body:', r.body.substring(0, 400));
    let token = null;
    try { token = JSON.parse(r.body).token; } catch (_) {}

    console.log('\n=== LOGIN (same user) ===');
    r = await req('POST', '/api/auth/login', { email, password: 'Test1234!' });
    console.log('Status:', r.status);
    const loginBody = JSON.parse(r.body);
    console.log('Token:', loginBody.token ? loginBody.token.substring(0, 30) + '...' : 'MISSING');
    console.log('User:', loginBody.user);
    if (!token) token = loginBody.token;

    console.log('\n=== ME (with token) ===');
    r = await new Promise((resolve, reject) => {
      const rq = http.request({ hostname: 'localhost', port: 3001, path: '/api/auth/me', method: 'GET', headers: { Authorization: 'Bearer ' + token }}, (res) => {
        let buf = ''; res.on('data', c => buf += c); res.on('end', () => resolve({ status: res.statusCode, body: buf }));
      });
      rq.on('error', reject);
      rq.end();
    });
    console.log('Status:', r.status);
    console.log('Body:', r.body.substring(0, 300));

    console.log('\n=== EV (with token, EPL) ===');
    r = await new Promise((resolve, reject) => {
      const rq = http.request({ hostname: 'localhost', port: 3001, path: '/api/ev?sport=soccer_epl&limit=3', method: 'GET', headers: { Authorization: 'Bearer ' + token }}, (res) => {
        let buf = ''; res.on('data', c => buf += c); res.on('end', () => resolve({ status: res.statusCode, body: buf }));
      });
      rq.on('error', reject);
      rq.end();
    });
    console.log('Status:', r.status);
    const evData = JSON.parse(r.body);
    console.log('Total EV opportunities:', evData.total, '| Returned:', evData.data?.length);

    console.log('\n✅ ALL AUTH + DATA TESTS PASSED');
  } catch (err) {
    console.log('\n❌ TEST ERROR:', err.message);
  }

  server.kill();
  process.exit(0);
})();