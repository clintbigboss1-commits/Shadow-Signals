'use client';

import { useState } from 'react';

// Spy-operative easter egg: a different operative peeks from a corner on each
// page. Renders nothing until the matching image exists in
// client/public/operatives/ (drop files in, no code change needed).
export default function OperativePeek({
  page,
  side = 'right',
  width = 180,
  bottom = 0,
}: {
  page: string;           // e.g. 'landing' → /operatives/landing.png
  side?: 'left' | 'right';
  width?: number;
  bottom?: number;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <img
      src={`/operatives/${page}.png`}
      alt=""
      aria-hidden
      onError={() => setHidden(true)}
      style={{
        position: 'absolute',
        bottom,
        [side]: -Math.round(width * 0.18),
        width,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 2,
        filter: 'drop-shadow(0 12px 30px rgba(0,0,0,.6))',
        maskImage: 'linear-gradient(to bottom, black 78%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 78%, transparent 100%)',
      }}
    />
  );
}
