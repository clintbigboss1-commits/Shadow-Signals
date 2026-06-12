'use client';

import TeamLogo from './TeamLogo';

/**
 * Sport-specific visual identity:
 *  - Greyhounds  → official AU trap/rug colours (1–8)
 *  - Horse races → saddlecloth-number badge in standard AU cloth colours
 *  - Cricket     → country flag when the team is a nation, else club badge
 *  - AFL / NRL / soccer / etc. → club badge via TeamLogo (TheSportsDB)
 *  - Boxing/UFC  → fighter initials, name stays prominent in the card
 */

// Official greyhound rug colours, boxes 1–8.
export const TRAP_COLOURS: Record<number, { bg: string; fg: string; stripe?: boolean }> = {
  1: { bg: '#e02020', fg: '#ffffff' },                 // red
  2: { bg: '#111111', fg: '#ffffff', stripe: true },   // black & white stripes
  3: { bg: '#ffffff', fg: '#111111' },                 // white
  4: { bg: '#1565c0', fg: '#ffffff' },                 // blue
  5: { bg: '#f57c00', fg: '#111111' },                 // orange
  6: { bg: '#111111', fg: '#ffffff' },                 // black
  7: { bg: '#9e9e9e', fg: '#111111' },                 // grey
  8: { bg: '#f48fb1', fg: '#111111' },                 // pink
};

// Standard AU saddlecloth colours by horse number (repeat past 12).
const SADDLECLOTH: { bg: string; fg: string }[] = [
  { bg: '#e02020', fg: '#fff' }, { bg: '#ffffff', fg: '#111' }, { bg: '#1565c0', fg: '#fff' },
  { bg: '#ffd600', fg: '#111' }, { bg: '#2e7d32', fg: '#fff' }, { bg: '#111111', fg: '#fff' },
  { bg: '#f57c00', fg: '#111' }, { bg: '#f48fb1', fg: '#111' }, { bg: '#00bcd4', fg: '#111' },
  { bg: '#7b1fa2', fg: '#fff' }, { bg: '#9e9e9e', fg: '#111' }, { bg: '#76ff03', fg: '#111' },
];

const CRICKET_FLAGS: Record<string, string> = {
  australia: '🇦🇺', england: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', india: '🇮🇳', pakistan: '🇵🇰',
  'south africa': '🇿🇦', 'new zealand': '🇳🇿', 'sri lanka': '🇱🇰',
  bangladesh: '🇧🇩', afghanistan: '🇦🇫', 'west indies': '🏏', ireland: '🇮🇪', zimbabwe: '🇿🇼',
};

// "3. Fast Dog" / "(5) Dancing Brave" → runner number
export function runnerNumber(selection: string): number | null {
  const m = selection.match(/^\(?(\d{1,2})[.)]?\s/);
  return m ? parseInt(m[1], 10) : null;
}

export function isGreyhoundSport(sportKey: string) {
  return /greyhound/i.test(sportKey);
}

export function isHorseSport(sportKey: string) {
  return /horse|racing_(au|nz|uk)|thoroughbred|harness/i.test(sportKey);
}

export function isCricketSport(sportKey: string) {
  return /cricket/i.test(sportKey);
}

export function isFighterSport(sportKey: string) {
  return /mma|boxing|ufc/i.test(sportKey);
}

function NumberBadge({ n, bg, fg, stripe, size }: { n: number; bg: string; fg: string; stripe?: boolean; size: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 7, flexShrink: 0,
      background: stripe
        ? `repeating-linear-gradient(90deg, ${bg} 0 ${size / 5}px, #ffffff ${size / 5}px ${size / 2.5}px)`
        : bg,
      border: '1px solid rgba(255,255,255,.25)',
      display: 'grid', placeItems: 'center',
      fontWeight: 900, fontSize: size * 0.5, color: fg,
      textShadow: stripe ? '0 0 3px #fff, 0 0 3px #fff' : 'none',
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      {n}
    </div>
  );
}

export default function SportIcon({
  sportKey,
  name,
  color = '#2979ff',
  size = 30,
}: {
  sportKey: string;
  name: string;   // selection / team / runner name
  color?: string;
  size?: number;
}) {
  // Greyhounds — trap colour badge
  if (isGreyhoundSport(sportKey)) {
    const n = runnerNumber(name);
    if (n && TRAP_COLOURS[n]) {
      const t = TRAP_COLOURS[n];
      return <NumberBadge n={n} bg={t.bg} fg={t.fg} stripe={t.stripe} size={size} />;
    }
  }

  // Horse racing — saddlecloth-number badge
  if (isHorseSport(sportKey)) {
    const n = runnerNumber(name);
    if (n) {
      const s = SADDLECLOTH[(n - 1) % SADDLECLOTH.length];
      return <NumberBadge n={n} bg={s.bg} fg={s.fg} size={size} />;
    }
  }

  // Cricket — country flag when it's a national side
  if (isCricketSport(sportKey)) {
    const flag = CRICKET_FLAGS[name.trim().toLowerCase()];
    if (flag) {
      return (
        <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', display: 'grid', placeItems: 'center', fontSize: size * 0.58, flexShrink: 0 }}>
          {flag}
        </div>
      );
    }
  }

  // Boxing / UFC — fighter initials, no team kit
  if (isFighterSport(sportKey)) {
    const initials = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return (
      <div style={{
        width: size, height: size, borderRadius: 8, flexShrink: 0,
        background: 'linear-gradient(135deg, #2a0a0a, #4a1010)',
        border: `2px solid ${color}`,
        display: 'grid', placeItems: 'center',
        fontWeight: 900, fontSize: size * 0.38, color: '#fff', letterSpacing: .5,
      }}>
        {initials}
      </div>
    );
  }

  // Team sports — club badge (AFL, NRL, soccer, cricket clubs, ...)
  return <TeamLogo name={name} color={color} size={size} />;
}
