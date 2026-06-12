'use client';

import { useEffect, useState } from 'react';

/**
 * Team badge from TheSportsDB (free tier), with the coloured letter-circle
 * as instant placeholder and permanent fallback when no badge exists.
 * Lookups are cached in localStorage so each team is fetched at most once.
 */

const CACHE_KEY = 'ss_team_logos_v1';
const NOT_FOUND = 'none';

function readCache(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}

function writeCache(name: string, url: string) {
  try {
    const c = readCache();
    c[name] = url;
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch { /* storage full — fine, fallback still works */ }
}

// One in-flight promise per team per page load, so a grid of cards
// doesn't fire the same lookup 12 times.
const inflight: Record<string, Promise<string>> = {};

async function lookupBadge(name: string): Promise<string> {
  if (!inflight[name]) {
    inflight[name] = (async () => {
      try {
        const r = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(name)}`);
        const j = await r.json();
        const badge = j?.teams?.[0]?.strBadge || j?.teams?.[0]?.strTeamBadge || NOT_FOUND;
        writeCache(name, badge);
        return badge;
      } catch {
        return NOT_FOUND; // network hiccup — don't cache, retry next page load
      }
    })();
  }
  return inflight[name];
}

export default function TeamLogo({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!name || name === '—') return;
    const cached = readCache()[name];
    if (cached) {
      if (cached !== NOT_FOUND) setSrc(cached);
      return;
    }
    let alive = true;
    lookupBadge(name).then(badge => {
      if (alive && badge !== NOT_FOUND) setSrc(badge);
    });
    return () => { alive = false; };
  }, [name]);

  if (src) {
    return (
      <img
        src={`${src}/tiny`}
        alt={name}
        width={size}
        height={size}
        style={{ borderRadius: '50%', objectFit: 'contain', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', flexShrink: 0 }}
        onError={() => { writeCache(name, NOT_FOUND); setSrc(null); }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '22', border: `2px solid ${color}`,
      display: 'grid', placeItems: 'center',
      fontWeight: 800, fontSize: size * 0.44, color, flexShrink: 0,
    }}>
      {name.trim().charAt(0).toUpperCase()}
    </div>
  );
}
