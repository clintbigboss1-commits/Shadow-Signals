'use client';

import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';

const FAQS = [
  {
    q: 'What does the confidence score mean?',
    a: 'Every pick gets a 0–100% confidence score. Green (80%+) means we strongly back it, yellow (60–79%) is decent value, orange (40–59%) is a thin edge, and red (below 40%) means leave it alone. The score is calibrated against real results — if it says 80%, it should hit about 80% of the time.',
  },
  {
    q: 'What is the suggested stake?',
    a: 'It tells you what % of your bankroll to put on this bet — e.g. "0.3% of your bankroll". It\'s based on the professional Kelly sizing formula, capped at 5% per bet for safety. Bigger edge, bigger suggested stake.',
  },
  {
    q: 'What does "our odds vs market odds" mean?',
    a: 'We work out what the odds should be (fair odds), then compare them to what the bookie is offering. When the bookie pays better than fair, that gap is your edge — how much better you got paid than the true probability.',
  },
  {
    q: 'What\'s the difference between AFL and NRL?',
    a: 'AFL (Australian Rules Football) and NRL (Rugby League) are different codes. AFL is round-ball, NRL is league. Different teams, rules, and betting patterns.',
  },
  {
    q: 'Can I use this on my phone?',
    a: 'Yes! Shadow Signals works on mobile. The markets feed is optimized for swiping, and you can add bets to your slip on the go.',
  },
  {
    q: 'What sports does this cover?',
    a: 'We cover AFL, NRL, soccer (EPL, UCL, A-League), cricket, basketball, horse racing, and more. Check the sports menu on the dashboard.',
  },
  {
    q: 'Is this gambling advice?',
    a: 'No — we show odds and mathematical edges. Betting decisions are always yours. We\'re 18+. Gamble responsibly: 1800 858 858 or gamblinghelponline.org.au',
  },
];

export default function HelpPage() {
  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>Help &amp; Support</h1>
          <p style={{ color: 'var(--text-soft)', marginBottom: 32 }}>Common questions answered.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FAQS.map((faq, i) => (
              <details key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, cursor: 'pointer' }}>
                <summary style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                  {faq.q}
                </summary>
                <p style={{ color: 'var(--text-soft)', fontSize: 14, lineHeight: 1.6, marginTop: 12 }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>

          <div style={{ marginTop: 48, padding: '20px', background: 'rgba(41,121,255,.08)', border: '1px solid rgba(41,121,255,.2)', borderRadius: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: 0 }}>
              <strong style={{ color: 'var(--cyan)' }}>Still stuck?</strong> Email us at support@shadowsignals.app or hit us up on <a href="#" style={{ color: 'var(--cyan)', textDecoration: 'underline' }}>Discord</a>.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
