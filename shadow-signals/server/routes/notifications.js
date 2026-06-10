'use strict';
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { db } = require('../db');

// GET /api/notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20'), 50);
    const unreadOnly = req.query.unread === 'true';

    let sql = 'SELECT * FROM notifications WHERE user_id = $1';
    if (unreadOnly) sql += ' AND read = FALSE';
    sql += ' ORDER BY created_at DESC LIMIT $2';

    const [rows, countRow] = await Promise.all([
      db.query(sql, [req.user.userId, limit]),
      db.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = FALSE', [req.user.userId]),
    ]);

    res.json({ data: rows.rows, unread_count: parseInt(countRow.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/read — mark all read
router.patch('/read', requireAuth, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET read = TRUE WHERE user_id = $1', [req.user.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
