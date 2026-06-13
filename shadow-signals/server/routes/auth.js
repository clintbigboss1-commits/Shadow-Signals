'use strict';
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');
const emails = require('../services/emails');
const { createNotification } = require('../services/notifications');

const ADMIN_EMAILS = [
  'clintbigboss1@gmail.com', // owner — always admin
  ...(process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean),
];

// Reset tokens live here, not on users — idempotent bootstrap on startup.
// users.id is a UUID; drop any earlier table created with an integer column.
(async () => {
  try {
    await db.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='password_resets' AND column_name='user_id'
                   AND data_type='integer') THEN
          DROP TABLE password_resets;
        END IF;
      END $$;
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        token_hash VARCHAR(64) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error('password_resets bootstrap failed:', err.message);
  }
})();

const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be 8+ characters' });
    
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length > 0)
      return res.status(400).json({ error: 'Email already registered' });
    
    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, name, plan)
       VALUES ($1,$2,$3,'free') RETURNING id, email, name, plan, created_at`,
      [email.toLowerCase(), hash, name || email.split('@')[0]]
    );
    
    const user = result.rows[0];
    const role = ADMIN_EMAILS.includes(user.email.toLowerCase()) ? 'admin' : 'customer';
    const token = jwt.sign(
      { userId: user.id, plan: user.plan, email: user.email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    emails.sendWelcome(user).catch(() => {});
    createNotification(user.id, 'welcome', 'Welcome to Shadow Elite! 🎯', 'Your 7-day free trial has started. Find your first edge in Markets.', '/markets').catch(() => {});
    res.status(201).json({ token, user: { ...user, role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });
    
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' });
    
    const role = ADMIN_EMAILS.includes(user.email.toLowerCase()) ? 'admin' : 'customer';
    
    // Auto-grant Elite to Admins
    if (role === 'admin') {
      user.plan = 'elite';
    }

    const token = jwt.sign(
      { userId: user.id, plan: user.plan, email: user.email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    const { password_hash, ...safeUser } = user;
    safeUser.role = role;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/forgot — request a reset link
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Always answer ok so the endpoint can't be used to probe which emails exist
    const result = await db.query('SELECT id, email, name FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const token = crypto.randomBytes(32).toString('hex');
      await db.query('DELETE FROM password_resets WHERE user_id = $1', [user.id]);
      await db.query(
        `INSERT INTO password_resets (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
        [user.id, hashToken(token)]
      );
      emails.sendPasswordReset(user, token).catch(() => {});
    }
    res.json({ ok: true, message: 'If that email has an account, a reset link is on its way.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset — set a new password using the emailed token
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ error: 'Token and new password required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be 8+ characters' });

    const result = await db.query(
      `SELECT user_id FROM password_resets
       WHERE token_hash = $1 AND expires_at > NOW()`,
      [hashToken(token)]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ error: 'Reset link is invalid or has expired. Request a new one.' });

    const userId = result.rows[0].user_id;
    const hash = await bcrypt.hash(password, 12);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
    await db.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);

    res.json({ ok: true, message: 'Password updated. You can log in now.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, plan, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found' });
    
    const user = result.rows[0];
    user.role = ADMIN_EMAILS.includes(user.email.toLowerCase()) ? 'admin' : 'customer';
    if (user.role === 'admin') {
      user.plan = 'elite';
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/admin/users (Admin only) — list all accounts
router.get('/admin/users', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admins only' });
    }
    const result = await db.query(
      `SELECT id, email, name, plan, created_at FROM users ORDER BY created_at DESC LIMIT 500`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/admin/invite (Admin only) — add someone on any plan for free.
// Creates the account if needed and emails them a link to set their password.
router.post('/admin/invite', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admins only' });
    }

    const { email, plan, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const validPlans = ['free', 'starter', 'pro', 'elite'];
    const targetPlan = (plan || 'pro').toLowerCase();
    if (!validPlans.includes(targetPlan)) {
      return res.status(400).json({ error: 'Invalid plan tier' });
    }

    const existing = await db.query('SELECT id, email, name, plan FROM users WHERE email = $1', [email.toLowerCase()]);
    let user;
    let created = false;

    if (existing.rows.length > 0) {
      const r = await db.query(
        'UPDATE users SET plan = $1 WHERE email = $2 RETURNING id, email, name, plan',
        [targetPlan, email.toLowerCase()]
      );
      user = r.rows[0];
    } else {
      // New account with an unguessable password — they set their own via the invite link
      const randomPassword = crypto.randomBytes(24).toString('hex');
      const hash = await bcrypt.hash(randomPassword, 12);
      const r = await db.query(
        `INSERT INTO users (email, password_hash, name, plan)
         VALUES ($1,$2,$3,$4) RETURNING id, email, name, plan`,
        [email.toLowerCase(), hash, name || email.split('@')[0], targetPlan]
      );
      user = r.rows[0];
      created = true;
    }

    // Invite link doubles as a password (re)set — valid 7 days
    const token = crypto.randomBytes(32).toString('hex');
    await db.query('DELETE FROM password_resets WHERE user_id = $1', [user.id]);
    await db.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, hashToken(token)]
    );
    emails.sendAdminInvite(user, token, targetPlan).catch(() => {});

    res.json({ ok: true, created, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/admin/upgrade (Admin only)
router.post('/admin/upgrade', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admins only' });
    }
    
    const { email, plan } = req.body;
    if (!email || !plan) {
      return res.status(400).json({ error: 'Email and plan are required' });
    }
    
    const validPlans = ['free', 'starter', 'pro', 'elite'];
    if (!validPlans.includes(plan.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid plan tier' });
    }
    
    const result = await db.query(
      'UPDATE users SET plan = $1 WHERE email = $2 RETURNING id, email, plan',
      [plan.toLowerCase(), email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
