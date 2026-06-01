'use strict';
require('dotenv').config();

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const jwt        = require('jsonwebtoken');

const { initDB }               = require('./db');
const { initScheduler, setIO } = require('./services/scheduler');

const authRoutes     = require('./routes/auth');
const evRoutes       = require('./routes/ev');
const arbRoutes      = require('./routes/arb');
const betsRoutes     = require('./routes/bets');
const paymentsRoutes = require('./routes/payments');
const { webhookHandler } = require('./routes/payments');

const app    = express();
const server = http.createServer(app);
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';

const io = new Server(server, {
  cors: { origin: FRONTEND, credentials: true },
});
setIO(io);

app.set('trust proxy', 1);
app.use(cors({ origin: FRONTEND, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STRIPE WEBHOOK — raw body BEFORE express.json()
// This is why "plan doesn't update after payment":
// express.json() destroys the raw Buffer Stripe needs to verify signatures.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler
);

// JSON body parser — after webhook
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests.' },
}));
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { error: 'Too many auth attempts.' },
}));

// Routes
app.use('/api/auth',     authRoutes);
app.use('/api/ev',       evRoutes);
app.use('/api/arb',      arbRoutes);
app.use('/api/bets',     betsRoutes);
app.use('/api/payments', paymentsRoutes);

// ── /api/health — diagnose your config instantly ──────────────────────────
app.get('/api/health', (req, res) => {
  const sk = process.env.STRIPE_SECRET_KEY || '';
  const checks = {
    status:   'ok',
    time:     new Date().toISOString(),
    stripe: {
      mode:           sk.startsWith('sk_live') ? 'LIVE ✅' : sk.startsWith('sk_test') ? 'TEST ⚠️ (payments wont charge real cards)' : 'NOT SET ❌',
      secret_key:     sk ? 'set ✅' : 'NOT SET ❌',
      webhook_secret: process.env.STRIPE_WEBHOOK_SECRET ? 'set ✅' : 'NOT SET ❌ — this is why plans dont update after payment',
      price_recruit:  process.env.STRIPE_PRICE_RECRUIT_MONTH   || 'NOT SET ❌',
      price_commander:process.env.STRIPE_PRICE_COMMANDER_MONTH || 'NOT SET ❌',
      price_syndicate:process.env.STRIPE_PRICE_SYNDICATE_MONTH || 'NOT SET ❌',
    },
    database:  process.env.DATABASE_URL   ? 'set ✅' : 'NOT SET ❌',
    odds_api:  process.env.ODDS_API_KEY   ? 'set ✅' : 'NOT SET ❌',
    email:     process.env.RESEND_API_KEY ? 'set ✅' : 'not set (emails wont send)',
    frontend:  FRONTEND,
    jwt:       process.env.JWT_SECRET     ? 'set ✅' : 'NOT SET ❌',
  };
  const hasErrors = Object.values(checks.stripe).some(v => String(v).includes('NOT SET'));
  res.status(hasErrors ? 200 : 200).json(checks);
});

app.use('/api/', (req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// WebSocket
io.on('connection', (socket) => {
  socket.on('auth', (token) => {
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.user = user;
      socket.join(`user:${user.userId}`);
      socket.emit('auth:ok', { plan: user.plan });
    } catch { socket.emit('auth:error', 'Invalid token'); }
  });
  socket.on('subscribe:ev',  () => socket.join('ev:feed'));
  socket.on('subscribe:arb', () => socket.join('arb:feed'));
});

// Start
const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  try {
    await initDB();
    initScheduler();
    server.listen(PORT, () => {
      const sk = process.env.STRIPE_SECRET_KEY || '';
      const wh = process.env.STRIPE_WEBHOOK_SECRET;
      console.log(`\n🚀 Shadow Syndicate API → port ${PORT}`);
      console.log(`   Stripe:  ${sk.startsWith('sk_live') ? '🟢 LIVE' : sk.startsWith('sk_test') ? '🟡 TEST' : '❌ NOT SET'}`);
      console.log(`   Webhook: ${wh ? '✅ set' : '❌ NOT SET — plans wont update after payment'}`);
      console.log(`   DB:      ${process.env.DATABASE_URL ? '✅ set' : '❌ NOT SET'}`);
      console.log(`   Visit /api/health to see full config status\n`);
    });
  } catch (err) {
    console.error('❌ Startup failed:', err.message);
    process.exit(1);
  }
}

start();
