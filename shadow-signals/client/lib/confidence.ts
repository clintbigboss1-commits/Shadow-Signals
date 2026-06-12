// Confidence score system — replaces letter grades (S+/A/B/C) everywhere.
// Maps the model's edge into a 0–100 score punters can read at a glance.
//
// Bands (per brand spec):
//   0–39   red     "don't back"
//   40–59  orange  "thin"
//   60–79  yellow  "decent"
//   80–100 green   "definitely back"

export function confidenceFromEV(evPercent: number): number {
  // Piecewise-linear map: 0% EV → 50, 3% → 62, 5% → 72, 8% → 85, 12%+ → 95 cap.
  // Negative EV decays toward 0.
  const pts: [number, number][] = [[-10, 5], [0, 50], [3, 62], [5, 72], [8, 85], [12, 95]];
  if (evPercent <= pts[0][0]) return pts[0][1];
  if (evPercent >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 1; i < pts.length; i++) {
    if (evPercent <= pts[i][0]) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      return Math.round(y0 + ((evPercent - x0) / (x1 - x0)) * (y1 - y0));
    }
  }
  return 50;
}

export function confidenceColor(score: number): string {
  if (score >= 80) return '#00e676'; // green — definitely back
  if (score >= 60) return '#facc15'; // yellow
  if (score >= 40) return '#fb923c'; // orange
  return '#ef4444';                  // red — don't back
}

export function confidenceLabel(score: number): string {
  if (score >= 80) return 'Strong play';
  if (score >= 60) return 'Decent value';
  if (score >= 40) return 'Thin edge';
  return "Don't back";
}

// "0.3% of your bankroll" — plain-language stake from the Kelly fraction.
export function suggestedStake(kellyPercent: number): string {
  if (!kellyPercent || kellyPercent <= 0) return 'No stake suggested';
  return `${kellyPercent.toFixed(1)}% of your bankroll`;
}

// Plain-language market names ("h2h" means nothing to a casual punter).
export function marketLabel(market: string): string {
  const m: Record<string, string> = {
    h2h: 'Head to head',
    spreads: 'Line',
    totals: 'Over/Under',
    outrights: 'Outright winner',
  };
  return m[market] || market.replace(/_/g, ' ');
}
