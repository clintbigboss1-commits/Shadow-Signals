'use strict';
const WebSocket = require('ws');

const KEY = '9931efdd-26a8-488f-a4b5-0f0835c6810d';
const SPORT = process.argv[2] || 'EPL';

console.log(`Connecting to wss://spro.agency/api?key=${KEY.slice(0,8)}... for sport: ${SPORT}`);
const ws = new WebSocket(`wss://spro.agency/api?key=${KEY}`);

let ready = false;
let count = 0;
const books = {};

ws.on('open', () => console.log('OPEN'));

ws.on('message', (raw) => {
  const text = raw.toString();
  // BoltOdds sends messages as JSON ARRAYS
  let msgs;
  try { msgs = JSON.parse(text); } catch (_) { return; }
  if (!Array.isArray(msgs)) msgs = [msgs];

  for (const msg of msgs) {
    if (msg.action === 'socket_connected') {
      console.log(`CONNECTED — plan: ${msg.plan}`);
      ready = true;
      // Send subscribe AFTER socket_connected
      ws.send(JSON.stringify({
        action: 'subscribe',
        filters: {
          sports: [SPORT],
          sportsbooks: ['draftkings', 'fanduel', 'betmgm'],
          markets: ['Moneyline', 'Spread', 'Total'],
        },
      }));
    } else if (msg.action === 'subscription_updated') {
      console.log(`SUBSCRIBED — message: ${msg.message}`);
    } else if (msg.action === 'initial_state' && msg.data) {
      count++;
      const book = msg.data.sportsbook;
      books[book] = (books[book] || 0) + 1;
      if (count <= 3) {
        const out = msg.data.outcomes || {};
        console.log(`  [${book}] ${msg.data.home_team} vs ${msg.data.away_team} | ${Object.keys(out).length} outcomes`);
        Object.entries(out).slice(0, 3).forEach(([k, v]) => {
          console.log(`     ${k} = ${v.odds}`);
        });
      }
    } else if (msg.action === 'error') {
      console.log(`ERROR: ${msg.message}`);
    } else if (msg.action !== 'ping') {
      console.log(`OTHER: ${msg.action}`);
    }
  }
});

ws.on('error', (e) => console.log('ERROR:', e.message));
ws.on('close', (code, reason) => {
  console.log(`CLOSE code=${code} reason="${reason.toString()}"`);
  console.log(`RESULT: got ${count} initial_state events from ${Object.keys(books).length} sportsbooks: ${Object.entries(books).map(([k,v])=>`${k}=${v}`).join(', ')}`);
});

setTimeout(() => { try { ws.terminate(); } catch (_) {} process.exit(0); }, 12000);