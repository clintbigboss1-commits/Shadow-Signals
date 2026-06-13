'use strict';
const router      = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { db }      = require('../db');

// GET /api/users/me/preferences
router.get('/me/preferences', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT onboarding_done, email_alerts, push_alerts, alert_min_ev, default_stake_aud
       FROM user_preferences WHERE user_id = $1`,
      [req.user.userId]
    );
    if (rows.length === 0) {
      return res.json({ onboarding_done: false, email_alerts: true, push_alerts: true, alert_min_ev: 5, default_stake_aud: null });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/me/preferences
router.patch('/me/preferences', requireAuth, async (req, res) => {
  const allowed = ['onboarding_done', 'email_alerts', 'push_alerts', 'alert_min_ev', 'default_stake_aud'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields' });

  try {
    const setClauses = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = [req.user.userId, ...Object.values(updates)];
    await db.query(
      `INSERT INTO user_preferences (user_id, ${Object.keys(updates).join(', ')}, updated_at)
       VALUES ($1, ${Object.keys(updates).map((_, i) => `$${i + 2}`).join(', ')}, NOW())
       ON CONFLICT (user_id) DO UPDATE SET ${setClauses}, updated_at = NOW()`,
      values
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/me — profile summary for settings page
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, email, plan, role, created_at FROM users WHERE id = $1`,
      [req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const prefs = await db.query(
      `SELECT onboarding_done, email_alerts, push_alerts, alert_min_ev, default_stake_aud FROM user_preferences WHERE user_id = $1`,
      [req.user.userId]
    );
    res.json({ ...rows[0], preferences: prefs.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
