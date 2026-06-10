'use strict';
const { db } = require('../db');

let _io = null;
function setIO(io) { _io = io; }

async function createNotification(userId, type, title, body = null, link = null) {
  try {
    const result = await db.query(
      `INSERT INTO notifications (user_id, type, title, body, link)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, type, title, body, link]
    );
    const notif = result.rows[0];
    if (_io) _io.to(`user:${userId}`).emit('notification:new', notif);
    return notif;
  } catch (err) {
    console.error('Notification create error:', err.message);
  }
}

module.exports = { createNotification, setIO };
