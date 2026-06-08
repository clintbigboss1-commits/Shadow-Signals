'use client';

import { useEffect } from 'react';

const API_KEY = '484ff5bda13cf43a2e5df2ccfddeb739';
const SCRIPT_SRC = 'https://widgets.api-sports.io/3.1.0/widgets.js';

/* ─── Config (reuses script if already loaded) ──────────── */
export function MMAWidgetConfig() {
  useEffect(() => {
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.type = 'module';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <api-sports-widget
      data-type="config"
      data-key={API_KEY}
      data-sport="mma"
      data-lang="en"
      data-theme="dark"
      data-show-logos="true"
      data-timezone="Australia/Sydney"
    />
  );
}

/* ─── Fights List ───────────────────────────────────────── */
export function FightsWidget({ refresh, showToolbar }: {
  refresh?: number; showToolbar?: boolean;
}) {
  return (
    <div className="widget-card">
      <api-sports-widget
        data-type="fights"
        data-refresh={String(refresh || 30)}
        data-show-toolbar={showToolbar ? 'true' : 'false'}
        data-target-fight="modal"
        data-games-style="1"
      />
    </div>
  );
}

/* ─── Fight Detail ──────────────────────────────────────── */
export function FightWidget({ fightId, showResult, showStats }: {
  fightId: number; showResult?: boolean; showStats?: boolean;
}) {
  const props: Record<string, string> = {
    'data-type': 'fight',
    'data-fight-id': String(fightId),
  };
  if (showResult) props['data-fight-result'] = 'true';
  if (showStats)  props['data-statistics'] = 'true';

  return (
    <div className="widget-card">
      <api-sports-widget {...props} data-target-fighter="modal" />
    </div>
  );
}

/* ─── Fighter Profile ───────────────────────────────────── */
export function FighterWidget({ fighterId }: { fighterId: number }) {
  return (
    <div className="widget-card">
      <api-sports-widget
        data-type="fighter"
        data-fighter-id={String(fighterId)}
      />
    </div>
  );
}