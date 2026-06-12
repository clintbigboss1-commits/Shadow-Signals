'use strict';
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { db } = require('../db');
const { pickNextPost, publish } = require('../services/ghostPoster');

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// GET /api/ghost/status — config + queue health + recent posts
router.get('/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const counts = await db.query(
      `SELECT status, COUNT(*)::int AS n FROM ghost_posts GROUP BY status`
    );
    const recent = await db.query(
      `SELECT id, kind, sport, body, status, posted_at, error
       FROM ghost_posts ORDER BY COALESCE(posted_at, created_at) DESC LIMIT 20`
    );
    res.json({
      configured: Boolean(process.env.META_PAGE_ID && process.env.META_PAGE_ACCESS_TOKEN),
      instagram: Boolean(process.env.META_IG_USER_ID && process.env.GHOST_IMAGE_URL),
      test_mode: process.env.GHOST_TEST_MODE === 'true',
      enabled: process.env.GHOST_ENABLED !== 'false',
      counts: Object.fromEntries(counts.rows.map(r => [r.status, r.n])),
      recent: recent.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ghost/queue — pending posts in order
router.get('/queue', requireAuth, requireAdmin, async (req, res) => {
  try {
    const r = await db.query(
      `SELECT id, kind, sport, body, created_at FROM ghost_posts
       WHERE status = 'queued' ORDER BY created_at ASC LIMIT 50`
    );
    res.json({ queue: r.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ghost/post-now — fire the next queued post immediately
router.post('/post-now', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!process.env.META_PAGE_ID || !process.env.META_PAGE_ACCESS_TOKEN) {
      return res.status(400).json({ error: 'Meta credentials not configured (META_PAGE_ID, META_PAGE_ACCESS_TOKEN)' });
    }
    const post = await pickNextPost();
    if (!post) return res.status(404).json({ error: 'Nothing queued' });
    const result = await publish(post);
    res.json({ post: post.body, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
