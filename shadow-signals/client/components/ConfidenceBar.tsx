import { confidenceColor, confidenceLabel } from '../lib/confidence';

// Pure presentational — safe in both server and client components.
export default function ConfidenceBar({
  score,
  showLabel = true,
  height = 6,
}: {
  score: number;
  showLabel?: boolean;
  height?: number;
}) {
  const color = confidenceColor(score);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
          Confidence
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 15, color }}>
          {score}%
        </span>
      </div>
      <div style={{
        height,
        borderRadius: height / 2,
        background: 'rgba(255,255,255,.07)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.max(2, Math.min(100, score))}%`,
          height: '100%',
          borderRadius: height / 2,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          boxShadow: `0 0 8px ${color}66`,
          transition: 'width .4s ease',
        }} />
      </div>
      {showLabel && (
        <div style={{ fontSize: 10, fontWeight: 700, color, marginTop: 4 }}>
          {confidenceLabel(score)}
        </div>
      )}
    </div>
  );
}
