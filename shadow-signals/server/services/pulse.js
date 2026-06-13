'use strict';

// Market Pulse — 60-second rolling window of scan + edge events.
// Emits pulse:scan (every scan), pulse:edge (high-EV find), pulse:tick (every 5s histogram).
// No fake data — only real activity from oddsService + evCalculator hooks.

let _io = null;
const WINDOW_MS  = 60 * 1000;
const TICK_MS    = 5  * 1000;

// Rolling buffer: { ts, type, event, ev_percent }
const _buffer = [];

let _tickTimer = null;

function initPulse(io) {
  _io = io;
  _tickTimer = setInterval(_emitTick, TICK_MS);
}

function _prune() {
  const cutoff = Date.now() - WINDOW_MS;
  while (_buffer.length > 0 && _buffer[0].ts < cutoff) _buffer.shift();
}

function _emitTick() {
  if (!_io) return;
  _prune();
  // Histogram: 12 buckets × 5s = 60s window
  const buckets = Array.from({ length: 12 }, (_, i) => {
    const from = Date.now() - WINDOW_MS + i * TICK_MS;
    const to   = from + TICK_MS;
    const slice = _buffer.filter(e => e.ts >= from && e.ts < to);
    return { scans: slice.filter(e => e.type === 'scan').length, edges: slice.filter(e => e.type === 'edge').length };
  });
  _io.emit('pulse:tick', {
    buckets,
    totals: {
      scans: _buffer.filter(e => e.type === 'scan').length,
      edges: _buffer.filter(e => e.type === 'edge').length,
    },
    window_ms: WINDOW_MS,
  });
}

function recordScan(sportKey) {
  _prune();
  const entry = { ts: Date.now(), type: 'scan', sport: sportKey };
  _buffer.push(entry);
  if (_io) _io.emit('pulse:scan', { sport: sportKey, ts: entry.ts });
}

function recordEdge(opp) {
  _prune();
  const entry = { ts: Date.now(), type: 'edge', event: opp.event_name, ev_percent: opp.ev_percent };
  _buffer.push(entry);
  if (_io) _io.emit('pulse:edge', { event: opp.event_name, ev_percent: opp.ev_percent, ts: entry.ts });
}

module.exports = { initPulse, recordScan, recordEdge };
