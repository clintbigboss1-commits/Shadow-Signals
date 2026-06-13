'use strict';
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.user = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',').map(e => e.trim()).filter(Boolean);
  // Check email from JWT payload first (fast path)
  if (req.user.email && adminEmails.includes(req.user.email)) return next();
  // Fallback: look up email in DB by userId
  try {
    const { db } = require('../db');
    const { rows } = await db.query('SELECT email FROM users WHERE id = $1', [req.user.userId]);
    if (rows.length && adminEmails.includes(rows[0].email)) return next();
  } catch (_) {}
  return res.status(403).json({ error: 'Admin access required' });
}

module.exports = { requireAuth, requireAdmin };
