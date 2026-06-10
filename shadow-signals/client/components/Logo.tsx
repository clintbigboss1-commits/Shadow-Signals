import Link from 'next/link';

interface Props {
  size?: number;
  wordmark?: boolean;
  href?: string | null;
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="lm-hex" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
        <linearGradient id="lm-bolt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.75" />
        </linearGradient>
        <filter id="lm-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Hexagon body */}
      <polygon
        points="38,20 29,4.5 11,4.5 2,20 11,35.5 29,35.5"
        fill="url(#lm-hex)"
        filter="url(#lm-glow)"
      />
      {/* Lightning bolt */}
      <path
        d="M23.5 7 L11.5 23 L19.5 23 L17.5 33 L28.5 17 L20.5 17 Z"
        fill="url(#lm-bolt)"
      />
    </svg>
  );
}

export default function Logo({ size = 36, wordmark = true, href = '/' }: Props) {
  const inner = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, userSelect: 'none' }}>
      <LogoMark size={size} />
      {wordmark && (
        <span style={{ lineHeight: 1.1 }}>
          <span style={{
            display: 'block',
            fontWeight: 900,
            fontSize: Math.round(size * 0.47),
            letterSpacing: -0.4,
            color: '#e2e8f0',
            fontFamily: 'Inter, sans-serif',
          }}>SHADOW</span>
          <span style={{
            display: 'block',
            fontWeight: 900,
            fontSize: Math.round(size * 0.33),
            letterSpacing: Math.round(size * 0.055),
            color: '#22d3ee',
            fontFamily: 'Inter, sans-serif',
          }}>ELITE</span>
        </span>
      )}
    </span>
  );

  if (href === null) return <span>{inner}</span>;
  return (
    <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
      {inner}
    </Link>
  );
}
