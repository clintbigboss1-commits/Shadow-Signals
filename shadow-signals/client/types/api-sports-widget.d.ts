declare namespace JSX {
  interface IntrinsicElements {
    'api-sports-widget': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        'data-type'?: string;
        'data-key'?: string;
        'data-sport'?: string;
        'data-lang'?: string;
        'data-theme'?: string;
        'data-show-logos'?: string;
        'data-timezone'?: string;
        'data-target-league'?: string;
        'data-league'?: string;
        'data-season'?: string;
        'data-standings'?: string;
        'data-target-game'?: string;
        'data-show-toolbar'?: string;
        'data-refresh'?: string;
        'data-date'?: string;
        'data-tab'?: string;
        'data-games-style'?: string;
        'data-country'?: string;
        'data-target-team'?: string;
        'data-target-player'?: string;
        'data-target-standings'?: string;
        'data-player-id'?: string;
        'data-player-statistics'?: string;
        'data-player-trophies'?: string;
        'data-player-injuries'?: string;
        'data-team-id'?: string;
        'data-team-squad'?: string;
        'data-team-statistics'?: string;
        'data-h2h'?: string;
        'data-game-id'?: string;
        'data-game-tab'?: string;
        'data-show-errors'?: string;
        'data-favorite'?: string;

        // MMA-specific
        'data-fights-style'?: string;
        'data-fight-id'?: string;
        'data-fight-result'?: string;
        'data-statistics'?: string;
        'data-target-fight'?: string;
        'data-target-fighter'?: string;
        'data-fighter-id'?: string;
      },
      HTMLElement
    >;
  }
}
