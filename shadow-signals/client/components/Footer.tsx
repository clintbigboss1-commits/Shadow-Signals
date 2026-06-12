'use client';

import Link from 'next/link';
import Logo from './Logo';

const COLS = [
  {
    head: 'Platform',
    links: [
      { href: '/ghost',    label: 'GHOST Signals' },
      { href: '/markets',  label: 'Live Markets' },
      { href: '/arb',      label: 'Arb Finder' },
      { href: '/clv',      label: 'CLV Tracker' },
      { href: '/wins',     label: 'Wins' },
    ],
  },
  {
    head: 'Company',
    links: [
      { href: '/pricing',  label: 'Pricing' },
      { href: '/reviews',  label: 'Reviews' },
      { href: '/signup',   label: 'Start free trial' },
      { href: '/login',    label: 'Log in' },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ background: '#050d18', borderTop: '1px solid rgba(255,255,255,.07)', marginTop: 'auto' }}>
      {/* signal stripe */}
      <div className="ghost-stripe" />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 28px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between' }}>

          {/* Brand */}
          <div style={{ flex: '2 1 260px', minWidth: 240 }}>
            <Logo href="/" size={36} />
            <p style={{ color: '#5e7390', fontSize: 13, lineHeight: 1.7, marginTop: 14, maxWidth: 300 }}>
              We see what the market misses. Betting intelligence across 12 AU bookmakers —
              signals, edges and closing line value, in plain English.
            </p>
          </div>

          {/* Link columns */}
          {COLS.map(col => (
            <div key={col.head} style={{ flex: '1 1 130px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#9eb1c8', marginBottom: 14 }}>{col.head}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {col.links.map(l => (
                  <Link key={l.href} href={l.href} style={{ color: '#5e7390', fontSize: 13, transition: 'color .15s' }}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Responsible gambling */}
          <div style={{ flex: '1 1 220px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#ffab00', marginBottom: 14 }}>Gamble Responsibly</div>
            <p style={{ color: '#5e7390', fontSize: 12, lineHeight: 1.7 }}>
              <strong style={{ color: '#9eb1c8' }}>18+ only.</strong> Think about your choices.<br />
              Gambling Help: <a href="tel:1800858858" style={{ color: '#2979ff', fontWeight: 700 }}>1800 858 858</a><br />
              <a href="https://www.gamblinghelponline.org.au" target="_blank" rel="noopener noreferrer" style={{ color: '#5e7390', textDecoration: 'underline' }}>gamblinghelponline.org.au</a><br />
              <a href="https://www.betstop.gov.au" target="_blank" rel="noopener noreferrer" style={{ color: '#5e7390', textDecoration: 'underline' }}>BetStop — self-exclusion register</a>
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', marginTop: 36, paddingTop: 20, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#2d4060', fontSize: 12 }}>© {new Date().getFullYear()} Shadow Signals. All rights reserved.</span>
          <span style={{ color: '#2d4060', fontSize: 12 }}>
            Information only — not financial advice. Odds move; always check the bookmaker price.
          </span>
        </div>
      </div>
    </footer>
  );
}
