'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import OperativePeek from '../../components/OperativePeek';
import { getUser } from '../../lib/auth';

/* ─── GHOST signal data ───────────────────────────────────────────────── */

interface WhenRow { c: string; bg: string; html: string }
interface Signal {
  c: string;        // signal colour
  pct: number;      // confidence %
  pips: number;     // strength 1-4
  icon: string;
  tag: string;
  name: string;
  plain: string;    // one-line plain English
  explain: string;  // what it means
  analogy: string;
  when: WhenRow[];
  script: string;   // 30-second video script
}

const SIGNALS: Signal[] = [
  {
    c: '#00e676', pct: 94, pips: 4, icon: '👻', tag: 'Most Powerful',
    name: 'Sharp Money Alert',
    plain: 'The big professional gamblers just quietly bet on this.',
    explain: 'When odds drop fast but most punters back something else — professionals have quietly fired serious money on it. These people win more than they lose. We track where their money goes so you can follow it.',
    analogy: '"The people who work at Apple are quietly buying Apple shares — while the public buys Samsung. Which group do you follow?"',
    when: [
      { c: '#00e676', bg: '#e6fff2', html: '<b>Bet now</b> — sharp money firing is your strongest signal' },
      { c: '#ffd600', bg: '#fffde7', html: '<b>Watch it</b> if the move is small — wait for confirmation' },
      { c: '#ff1744', bg: '#fff0f1', html: '<b>Skip it</b> when public and sharp money agree — no edge left' },
    ],
    script: 'Hey — Shadow Signals here. This is our most powerful signal: the Sharp Money Alert.\n\nProfessional gamblers just quietly backed this horse. Not the crowd. The people who do this for a living.\n\nGreen signal. That\'s your cue.\n\nShadow Signals. We see what the market misses.',
  },
  {
    c: '#c6ff00', pct: 82, pips: 4, icon: '⚡', tag: 'Act Fast',
    name: 'Steam Move',
    plain: 'Every bookmaker just dropped the odds at exactly the same time.',
    explain: 'When price drops 10%+ across Sportsbet, Tab, Neds, and Ladbrokes all within 60 seconds — a large syndicate fired simultaneously. By the time you spot it manually the window is already closed. We catch it the moment it happens.',
    analogy: '"Every supermarket pulls milk off the shelves at the same time. Something the public doesn\'t know about is happening."',
    when: [
      { c: '#00e676', bg: '#e6fff2', html: '<b>Bet immediately</b> — this window closes in minutes' },
      { c: '#ffd600', bg: '#fffde7', html: '<b>Check</b> if only one bookie moved — could be an error' },
      { c: '#ff1744', bg: '#fff0f1', html: '<b>Too late</b> if it happened more than 10 minutes ago' },
    ],
    script: 'Shadow Signals. Steam Move — speed is everything.\n\nA large syndicate fired across every bookmaker simultaneously. Sportsbet, Tab, Neds, Ladbrokes — all at once.\n\nWe catch it the second it happens. Small window. Big edge.\n\nShadow Signals. Faster than the market.',
  },
  {
    c: '#ffd600', pct: 74, pips: 3, icon: '⏱️', tag: 'Long Game',
    name: 'Closing Line Value',
    plain: 'We got you better odds than the final price — a win even if the horse lost.',
    explain: 'The final odds right before a race are the most accurate probability the market produces. If we found you $4.00 on a horse that closed at $2.80 — you had a real mathematical edge. Over hundreds of bets that edge makes money regardless of individual results.',
    analogy: '"You bought a house worth $700k for $500k. The moment you signed was the good decision."',
    when: [
      { c: '#00e676', bg: '#e6fff2', html: '<b>Trust the process</b> — track this over 50+ bets minimum' },
      { c: '#ffd600', bg: '#fffde7', html: '<b>Green sign</b> if you consistently beat the closing price' },
      { c: '#ff1744', bg: '#fff0f1', html: '<b>Red flag</b> if you\'re always getting worse odds than close' },
    ],
    script: 'Shadow Signals. This one changes how you think about betting forever.\n\nIf we got you $4.00 on a horse that closed at $2.80 — that\'s a genuine mathematical edge. A win — even if the horse finished third.\n\nConsistently beating the closing line is how professionals make long-term profit.\n\nShadow Signals.',
  },
  {
    c: '#ff9100', pct: 61, pips: 3, icon: '👥', tag: 'Hidden Stat',
    name: 'Power Pair',
    plain: 'This exact jockey and trainer have a secret winning record together.',
    explain: 'Nobody tracks the specific combination — jockey AND trainer at a specific track in specific conditions. James McDonald riding for Chris Waller at Flemington on a soft 1200m has a completely different strike rate than McDonald riding for anyone else.',
    analogy: '"Chef A and Sous Chef B together produce Michelin-star food. Separately they\'re just good. The combination is the secret."',
    when: [
      { c: '#00e676', bg: '#e6fff2', html: '<b>Strong signal</b> when the pair strike rate is above 28%' },
      { c: '#ffd600', bg: '#fffde7', html: '<b>Worth noting</b> between 18-28% — factor it in' },
      { c: '#ff1744', bg: '#fff0f1', html: '<b>Ignore it</b> below 18% — not a meaningful edge' },
    ],
    script: 'Shadow Signals. The Power Pair.\n\nWe track the specific combination of jockey and trainer at this exact track in these exact conditions.\n\nWhen that combination hits above 28 percent strike rate — we flag it.\n\nYou won\'t find this anywhere else. Shadow Signals.',
  },
  {
    c: '#a78bfa', pct: 55, pips: 2, icon: '📈', tag: 'Speed Edge',
    name: 'Late Charger',
    plain: 'This horse always runs fastest at the finish. The market hasn\'t noticed.',
    explain: 'We analyse every horse\'s last 5 races comparing first-half versus second-half speed. A horse that consistently finishes faster than it starts is underrated every time — punters focus on early speed and miss the finishers.',
    analogy: '"The kid who jogs the first lap then sprints past everyone at the end. The crowd always bets on whoever looks fastest at the start."',
    when: [
      { c: '#00e676', bg: '#e6fff2', html: '<b>Bet it</b> in races 1400m and over — finishing speed dominates' },
      { c: '#ffd600', bg: '#fffde7', html: '<b>Consider it</b> at 1200m if drawn a wide barrier' },
      { c: '#ff1744', bg: '#fff0f1', html: '<b>Skip it</b> at 1000m — not enough track for the kick' },
    ],
    script: 'Shadow Signals. The Late Charger.\n\nThe crowd bets on early speed — so late chargers get ignored and their odds stay long.\n\nLong odds. Hidden speed. Overlooked by everyone else.\n\nThat\'s a Shadow Signals edge.',
  },
  {
    c: '#22d3ee', pct: 48, pips: 2, icon: '🕶️', tag: 'Market Intel',
    name: 'Soft Market',
    plain: 'The bookmakers are being more generous than usual right now.',
    explain: 'Every race has a hidden bookmaker margin — normally 112-115% total probability. When it drops below 108% the books are competing hard and offering better value across the whole race. Same horses, same race — better price.',
    analogy: '"A store sale. The products are the same but the price is better. If you were going to buy anyway — now is the smarter time."',
    when: [
      { c: '#00e676', bg: '#e6fff2', html: '<b>Better time to bet</b> — market is below 108% right now' },
      { c: '#ffd600', bg: '#fffde7', html: '<b>Normal conditions</b> — between 108-115%' },
      { c: '#ff1744', bg: '#fff0f1', html: '<b>Bookmaker advantage</b> above 115% — wait for better value' },
    ],
    script: 'Shadow Signals. The Soft Market.\n\nWhen the bookmaker margin drops below 108 percent — same horses, same race — better odds.\n\nWe track this in real time and tell you when the market is softest.\n\nShadow Signals. Bet smarter, not harder.',
  },
  {
    c: '#f472b6', pct: 88, pips: 4, icon: '🔥', tag: 'Most Unique',
    name: 'Exchange Divergence',
    plain: 'Real punters and bookmakers are betting opposite ways. We know who\'s right.',
    explain: 'When a horse drifts on Betfair while corporate bookmakers shorten it simultaneously — the books are betting against their own customers. And the smart exchange money agrees with them. This convergence is the single most reliable signal we\'ve ever found in racing.',
    analogy: '"Two stock markets. Amateurs are buying. Hedge funds are selling. When both exchanges agree against the public — you follow the hedge funds."',
    when: [
      { c: '#00e676', bg: '#e6fff2', html: '<b>Highest confidence</b> — exchange drifts AND corporates shorten' },
      { c: '#ffd600', bg: '#fffde7', html: '<b>Interesting</b> — only one side moving, keep watching' },
      { c: '#ff1744', bg: '#fff0f1', html: '<b>No edge</b> — both exchange and corporates agree publicly' },
    ],
    script: 'Shadow Signals. Exchange Divergence — almost nobody knows this exists.\n\nWhen a horse drifts on Betfair but the corporates shorten simultaneously — the bookmakers are betting against their own customers. And the exchange agrees.\n\nWe\'re the only platform tracking both at once.\n\nShadow Signals. This is why we exist.',
  },
];

/* ─── components ──────────────────────────────────────────────────────── */

function Ring({ pct, color, icon }: { pct: number; color: string; icon: string }) {
  const r = 21, ci = 2 * Math.PI * r, dash = ci * (pct / 100);
  return (
    <div style={{ width: 54, height: 54, position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 54 54" style={{ position: 'absolute', inset: 0, width: 54, height: 54 }}>
        <circle cx={27} cy={27} r={r} fill="none" stroke="#e3ecf8" strokeWidth={5} />
        <circle cx={27} cy={27} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={`${dash} ${ci - dash}`} transform="rotate(-90 27 27)" />
      </svg>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <span style={{ fontSize: 13, lineHeight: 1 }}>{icon}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, color }}>{pct}%</span>
      </div>
    </div>
  );
}

function Pips({ n, color }: { n: number; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
      {Array.from({ length: 4 }, (_, p) => (
        <div key={p} style={{ width: 5, borderRadius: 2, height: 9 + p * 4, background: p < n ? color : '#dde8f5' }} />
      ))}
    </div>
  );
}

function SignalCard({ s, isAdmin }: { s: Signal; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyScript(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(s.script).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="ghost-card fadein">
      <div style={{ height: 4, width: '100%', background: s.c }} />
      <div className="gtop" onClick={() => setOpen(o => !o)}>
        <Ring pct={s.pct} color={s.c} icon={s.icon} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="gname">
            {s.name}
            <span className="gtag" style={{ background: `${s.c}20`, color: s.c }}>{s.tag}</span>
          </div>
          <div className="gplain">{s.plain}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, flexShrink: 0 }}>
          <Pips n={s.pips} color={s.c} />
          <span className={`gchev${open ? ' open' : ''}`}>▼</span>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid #eef4ff' }}>
          <div className="gsec">
            <div className="gslbl">What it means</div>
            <div className="gexp">{s.explain}</div>
          </div>
          <div className="gsec">
            <div className="gslbl">Think of it like this</div>
            <div className="gana">{s.analogy}</div>
          </div>
          <div className="gsec">
            <div className="gslbl">When to act</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {s.when.map((w, i) => (
                <div key={i} className="gwrow" style={{ background: `${w.c}14`, border: `1px solid ${w.c}28` }}>
                  <div className="dot" style={{ background: w.c }} />
                  <div className="txt" dangerouslySetInnerHTML={{ __html: w.html }} />
                </div>
              ))}
            </div>
          </div>
          {isAdmin && (
          <div className="gsec">
            <div className="gslbl">30-second video script (admin)</div>
            <div className="ghost-script">
              <div className="hd">
                <div className="rec" />
                <span className="tit">{s.name}</span>
                <span className="dur">0:30</span>
              </div>
              {showScript && (
                <div className="body" dangerouslySetInnerHTML={{
                  __html: s.script
                    .replace(/\n\n/g, '<br/><br/>')
                    .replace(/(Shadow Signals)/g, '<b>$1</b>'),
                }} />
              )}
              <div className="btns">
                <div className="sbtn" onClick={(e) => { e.stopPropagation(); setShowScript(v => !v); }}>
                  {showScript ? 'Hide script' : 'Read script'}
                </div>
                <div className="sbtn go" style={{ background: s.c }} onClick={copyScript}>
                  {copied ? '✓ Copied' : 'Copy script'}
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── page ────────────────────────────────────────────────────────────── */

type Tab = 'all' | 'strongest';

export default function GhostPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const shown = tab === 'strongest' ? SIGNALS.filter(s => s.pct >= 80) : SIGNALS;

  useEffect(() => { setIsAdmin(getUser()?.role === 'admin'); }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ padding: '36px 24px 0', maxWidth: 900, margin: '0 auto', width: '100%', position: 'relative' }}>
        <OperativePeek page="ghost" side="right" width={140} bottom={-10} />
        <div className="ghost-eyebrow" style={{ marginBottom: 14 }}>
          <span>Exclusive Intelligence</span>
        </div>
        <h1 className="ghost-hero-title" style={{ marginBottom: 14 }}>
          7 signals the market <span style={{ color: 'var(--gold)' }}>never</span> shows you.
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.68)', lineHeight: 1.7, marginBottom: 22, maxWidth: 560 }}>
          Each one in plain English. Tap a signal to understand what it means, why it works,
          and exactly when to act on it.
        </p>
        <div className="ghost-stat-grid">
          <div className="ghost-stat"><div className="n" style={{ color: 'var(--green)' }}>7</div><div className="l">Signals</div></div>
          <div className="ghost-stat"><div className="n" style={{ color: 'var(--gold)' }}>0</div><div className="l">Other apps</div></div>
          <div className="ghost-stat"><div className="n" style={{ color: 'var(--cyan)' }}>12</div><div className="l">AU bookies</div></div>
          <div className="ghost-stat"><div className="n" style={{ color: 'var(--purple)' }}>24/7</div><div className="l">Scanning</div></div>
        </div>
        <div className="ghost-stripe" style={{ marginTop: 22 }} />
      </div>

      {/* Tabs */}
      <div className="ghost-tabs" style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <button className={`ghost-tab${tab === 'all' ? ' on' : ''}`} onClick={() => setTab('all')}>All Signals</button>
        <button className={`ghost-tab${tab === 'strongest' ? ' on' : ''}`} onClick={() => setTab('strongest')}>Strongest</button>
      </div>

      {/* Cards */}
      <div className="ghost-cards" style={{ flex: 1 }}>
        {shown.map(s => <SignalCard key={s.name} s={s} isAdmin={isAdmin} />)}
      </div>

      <Footer />
    </div>
  );
}
