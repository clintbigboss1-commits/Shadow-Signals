'use strict';

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function bestMatch(needle, candidates) {
  const n = norm(needle);
  for (const c of candidates) {
    if (norm(c.name) === n || norm(c.abbrev) === n) return c;
  }
  for (const c of candidates) {
    if (n.includes(norm(c.name)) || norm(c.name).includes(n)) return c;
    if (n.includes(norm(c.abbrev))) return c;
  }
  return null;
}

function splitEventName(eventName) {
  const parts = String(eventName).split(/\s+v\.?\s+|\s+vs\.?\s+|\s+@\s+/i);
  if (parts.length !== 2) return null;
  return { home: parts[0].trim(), away: parts[1].trim() };
}

module.exports = { norm, bestMatch, splitEventName };
