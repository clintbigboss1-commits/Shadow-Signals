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
const { setIO: setNotifIO }    = require('./services/notifications');
const { initPulse }            = require('./services/pulse');

const authRoutes          = require('./routes/auth');
const evRoutes            = require('./routes/ev');
const arbRoutes           = require('./routes/arb');
const betsRoutes          = require('./routes/bets');
const matchRoutes         = require('./routes/match');
const gamesRoutes         = require('./routes/games');
const paymentsRoutes      = require('./routes/payments');
const notificationsRoutes = require('./routes/notifications');
const ghostRoutes         = require('./routes/ghost');
const backtestRoutes      = require('./routes/backtest');
const adminRoutes         = require('./routes/admin');
const usersRoutes         = require('./routes/users');
const statsRoutes         = require('./routes/stats');
const { webhookHandler }  = require('./routes/payments');
const { initGhost }       = require('./services/ghostPoster');

const app    = express();
const server = http.createServer(app);
const FRONTEND = process.env.FRONTEND_URL || 'https://shadowsignals.app';

// All origins the browser may call the API from. FRONTEND_URL may be a
// comma-separated list; the production domains are always included so a
// missing env var can never lock users out of login again.
const ALLOWED_ORIGINS = [...new Set([
  ...FRONTEND.split(',').map(s => s.trim()).filter(Boolean),
  'https://shadowsignals.app',
  'https://www.shadowsignals.app',
  'https://shadow-signals.vercel.app',
  'http://localhost:3000',
])];

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
});
setIO(io);
setNotifIO(io);
initPulse(io);

app.set('trust proxy', 1);

// ── Healthcheck FIRST — before all middleware so Railway never times out ──────
app.get('/api/health', (req, res) => {
  const sk = process.env.STRIPE_SECRET_KEY || '';
  res.json({
    status:   'ok',
    time:     new Date().toISOString(),
    stripe: {
      mode:           sk.startsWith('sk_live') ? 'LIVE OK' : sk.startsWith('sk_test') ? 'TEST' : 'NOT SET',
      secret_key:     sk ? 'set OK' : 'NOT SET',
      webhook_secret: process.env.STRIPE_WEBHOOK_SECRET ? 'set OK' : 'NOT SET',
      price_starter:  process.env.STRIPE_PRICE_STARTER_MONTH || 'NOT SET',
      price_pro:      process.env.STRIPE_PRICE_PRO_MONTH     || 'NOT SET',
      price_elite:    process.env.STRIPE_PRICE_ELITE_MONTH   || 'NOT SET',
    },
    database:  process.env.DATABASE_URL   ? 'set OK' : 'NOT SET',
    odds_api: (process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY) ? 'set OK' : 'NOT SET',
    email:     process.env.RESEND_API_KEY ? 'set OK' : 'not set',
    ghost: {
      facebook:  (process.env.META_PAGE_ID && process.env.META_PAGE_ACCESS_TOKEN) ? 'set OK' : 'NOT SET',
      instagram: (process.env.META_IG_USER_ID && process.env.GHOST_IMAGE_URL) ? 'set OK' : 'not set',
      mode:      process.env.GHOST_TEST_MODE === 'true' ? 'TEST' : 'LIVE',
    },
    jwt: process.env.JWT_SECRET ? 'set OK' : 'NOT SET',
  });
});

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STRIPE WEBHOOK — raw body BEFORE express.json()
// This is why "plan doesn't update after payment":
// express.json() destroys the raw Buffer Stripe needs to verify signatures.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
app.use('/api/auth',          authRoutes);
app.use('/api/ev',            evRoutes);
app.use('/api/arb',           arbRoutes);
app.use('/api/bets',          betsRoutes);
app.use('/api/match',         matchRoutes);
app.use('/api/games',         gamesRoutes);
app.use('/api/payments',      paymentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/ghost',         ghostRoutes);
app.use('/api/backtest',      backtestRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/users',         usersRoutes);
app.use('/api/stats',         statsRoutes);


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
  socket.on('subscribe:ev',            () => socket.join('ev:feed'));
  socket.on('subscribe:arb',           () => socket.join('arb:feed'));
  socket.on('subscribe:notifications', () => {
    if (socket.data.user) socket.join(`user:${socket.data.user.userId}`);
  });
});

// Start
const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  const sk = process.env.STRIPE_SECRET_KEY || '';
  const wh = process.env.STRIPE_WEBHOOK_SECRET;

  // Listen immediately so Railway healthcheck passes while migrations run in background
  server.listen(PORT, () => {
    console.log(`\nShadow Syndicate API -> port ${PORT}`);
    console.log(`   Stripe:  ${sk.startsWith('sk_live') ? 'LIVE' : sk.startsWith('sk_test') ? 'TEST' : 'NOT SET'}`);
    console.log(`   Webhook: ${wh ? 'set' : 'NOT SET - plans wont update after payment'}`);
    console.log(`   DB:      ${process.env.DATABASE_URL ? 'set' : 'NOT SET'}`);
    console.log(`   Visit /api/health to see full config status\n`);
  });

  // Run DB migrations + scheduler in background after port is open
  try {
    await initDB();
    initScheduler();
    initGhost();
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
}

start();