'use client';

import { useState } from 'react';

export default function OperativePeek({
  page,
  side = 'right',
  width = 180,
  bottom = 0,
  fixed = false,
  leftOffset,
}: {
  page: string;
  side?: 'left' | 'right';
  width?: number;
  bottom?: number;
  fixed?: boolean;
  leftOffset?: number;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  const sideValue = leftOffset !== undefined ? undefined : -Math.round(width * 0.18);

  return (
    <img
      src={`/operatives/${page}.png`}
      alt=""
      aria-hidden
      onError={() => setHidden(true)}
      className="operative-peek"
      style={{
        position: fixed ? 'fixed' : 'absolute',
        bottom,
        width,
        ...(leftOffset !== undefined
          ? { left: leftOffset }
          : { [side]: sideValue }),
      }}
    />
  );
}
