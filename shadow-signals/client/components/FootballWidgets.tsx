'use client';

import { useEffect, useState } from 'react';

/* ─────────────────────────────────────────────────────────────
   API Sports Widgets — Football
   Embeds <api-sports-widget> web components from api-sports.io
   ───────────────────────────────────────────────────────────── */

const API_KEY = '484ff5bda13cf43a2e5df2ccfddeb739';
const SCRIPT_SRC = 'https://widgets.api-sports.io/3.1.0/widgets.js';

/* ─── Config wrapper (must be present once) ──────────────── */
export function WidgetConfig() {
  useEffect(() => {
    // Load the widget script
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
      data-sport="football"
      data-lang="en"
      data-theme="dark"
      data-show-logos="true"
      data-timezone="Australia/Sydney"
    />
  );
}

/* ─── Leagues Browser ─────────────────────────────────────── */
export function LeaguesWidget() {
  return (
    <div className="widget-card">
      <api-sports-widget
        data-type="leagues"
        data-target-league="#football-league-detail"
      />
      <div id="football-league-detail" />
    </div>
  );
}

/* ─── League Detail ──────────────────────────────────────── */
export function LeagueWidget({ leagueId, showStandings }: { leagueId: number; showStandings?: boolean }) {
  return (
    <div className="widget-card">
      <api-sports-widget
        data-type="league"
        data-league={String(leagueId)}
        data-standings={showStandings ? 'true' : 'false'}
        data-target-game="modal"
      />
    </div>
  );
}

/* ─── Games / Live Scores ────────────────────────────────── */
export function GamesWidget({ league, date, refresh }: {
  league?: number; date?: string; refresh?: number;
}) {
  const props: Record<string, string> = {
    'data-type': 'games',
    'data-show-toolbar': 'true',
    'data-refresh': String(refresh || 30),
    'data-target-game': 'modal',
    'data-standings': 'true',
  };
  if (league)  props['data-league'] = String(league);
  if (date)    props['data-date'] = date;

  return (
    <div className="widget-card">
      <api-sports-widget {...props} />
    </div>
  );
}

/* ─── Standings ──────────────────────────────────────────── */
export function StandingsWidget({ leagueId, season }: { leagueId: number; season: string }) {
  return (
    <div className="widget-card">
      <api-sports-widget
        data-type="standings"
        data-league={String(leagueId)}
        data-season={season}
        data-target-team="modal"
      />
    </div>
  );
}

/* ─── Player Profile ─────────────────────────────────────── */
export function PlayerWidget({ playerId, season, showStats, showTrophies, showInjuries }: {
  playerId: number; season?: string;
  showStats?: boolean; showTrophies?: boolean; showInjuries?: boolean;
}) {
  const props: Record<string, string> = {
    'data-type': 'player',
    'data-player-id': String(playerId),
    'data-player-statistics': showStats ? 'true' : 'false',
    'data-player-trophies': showTrophies ? 'true' : 'false',
  };
  if (season)      props['data-season'] = season;
  if (showInjuries) props['data-player-injuries'] = 'true';

  return (
    <div className="widget-card">
      <api-sports-widget {...props} />
    </div>
  );
}

/* ─── Team Profile ───────────────────────────────────────── */
export function TeamWidget({ teamId, showSquad, showStats }: {
  teamId: number; showSquad?: boolean; showStats?: boolean;
}) {
  const props: Record<string, string> = {
    'data-type': 'team',
    'data-team-id': String(teamId),
    'data-team-squad': showSquad ? 'true' : 'false',
    'data-team-statistics': showStats ? 'true' : 'false',
    'data-target-player': 'modal',
  };
  return (
    <div className="widget-card">
      <api-sports-widget {...props} />
    </div>
  );
}

/* ─── Head to Head ───────────────────────────────────────── */
export function H2HWidget({ team1Id, team2Id }: { team1Id: number; team2Id: number }) {
  return (
    <div className="widget-card">
      <api-sports-widget
        data-type="h2h"
        data-h2h={`${team1Id}-${team2Id}`}
        data-target-game="modal"
      />
    </div>
  );
}

/* ─── Popular Leagues Presets ────────────────────────────── */
export const POPULAR_LEAGUES = [
  { id: 39,  name: 'Premier League',    country: 'England',    season: '2024' },
  { id: 140, name: 'La Liga',           country: 'Spain',      season: '2024' },
  { id: 135, name: 'Serie A',           country: 'Italy',      season: '2024' },
  { id: 78,  name: 'Bundesliga',        country: 'Germany',    season: '2024' },
  { id: 61,  name: 'Ligue 1',           country: 'France',     season: '2024' },
  { id: 2,   name: 'UEFA Champions Lg', country: 'Europe',     season: '2024' },
  { id: 3,   name: 'UEFA Europa Lg',    country: 'Europe',     season: '2024' },
  { id: 253, name: 'A-League',          country: 'Australia',  season: '2024' },
];