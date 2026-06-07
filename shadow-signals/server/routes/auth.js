'use strict';
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');
const emails = require('../services/emails');

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

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
    
    // emails.sendWelcome(user).catch(() => {});
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
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;