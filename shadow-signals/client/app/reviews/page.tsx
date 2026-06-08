import Link from 'next/link';

const REVIEWS = [
  { name: 'Matt B.', loc: 'Melbourne', plan: 'Pro', stars: 5, text: 'Been using it for 2 months. My CLV is consistently positive. The grade system tells you exactly which bets are worth taking — I only bet Grade A and above now.', badge: 'CLV +4.2% avg' },
  { name: 'Sarah K.', loc: 'Brisbane', plan: 'Pro', stars: 5, text: 'Finally a product built for AU bookies. Not some US site with DraftKings odds. Real Sportsbet, real TAB, real Ladbrokes prices. Love it.', badge: '3 months verified' },
  { name: 'Jake T.', loc: 'Sydney', plan: 'Elite', stars: 5, text: 'The arb finder alone pays for itself 3x over every month. Found a 2.8% arb on AFL Round 18 that I\'d never have spotted manually.', badge: 'Arb: +$1,240 profit' },
  { name: 'Chris M.', loc: 'Perth', plan: 'Pro', stars: 5, text: 'I was sceptical about EV betting but the CLV tracker showed me I\'m genuinely beating the market. The data doesn\'t lie.', badge: 'CLV positive 74% of bets' },
  { name: 'Tom W.', loc: 'Adelaide', plan: 'Starter', stars: 4, text: 'Great for AFL season. The Grade S+ alerts are the real value — when something is flagged S+ it\'s almost always there at that price for less than an hour.', badge: 'AFL specialist' },
  { name: 'Liam P.', loc: 'Melbourne', plan: 'Pro', stars: 5, text: 'Setup took 5 minutes. First +EV bet within an hour. Made my subscription cost back in week one. Should have found this years ago.', badge: 'Week 1 ROI: +340%' },
];

export default function ReviewsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#08111e', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>

      <nav style={{ borderBottom: '1px solid rgba(255,255,255,.06)', padding: '0 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 60 }}>
          <Link href="/" style={{ fontWeight: 900, fontSize: 17 }}>
            SHADOW <span style={{ color: '#22d3ee' }}>ELITE</span>
          </Link>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/login"  style={{ padding: '7px 16px', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 13, color: '#94a3b8' }}>Sign In</Link>
            <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#030711', background: 'linear-gradient(135deg,#22d3ee,#0891b2)' }}>Get Edge →</Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 24px' }}>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Reviews</div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, marginBottom: 12, letterSpacing: -1 }}>
            What Aussie punters say
          </h1>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {'★★★★★'.split('').map((s, i) => <span key={i} style={{ color: '#f59e0b', fontSize: 24 }}>{s}</span>)}
          </div>
          <p style={{ color: '#64748b', fontSize: 14 }}>4.9/5 · 312 verified reviews</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 48 }}>
          {REVIEWS.map((r, i) => (
            <div key={i} className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{r.loc} · {r.plan}</div>
                </div>
                <span style={{ fontSize: 14, color: '#f59e0b' }}>{'★'.repeat(r.stars)}</span>
              </div>

              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.65, margin: 0, flex: 1 }}>
                &ldquo;{r.text}&rdquo;
              </p>

              <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 6, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', color: '#10b981', fontSize: 11, fontWeight: 700, alignSelf: 'flex-start' }}>
                {r.badge}
              </span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(34,211,238,.04)', border: '1px solid rgba(34,211,238,.15)', borderRadius: 16 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>Join 7,416 Aussie sharps.</h2>
          <p style={{ color: '#64748b', fontSize: 15, marginBottom: 24 }}>7-day free trial. No credit card. Cancel anytime.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '13px 32px', borderRadius: 10, background: 'linear-gradient(135deg,#22d3ee,#0891b2)', color: '#030711', fontWeight: 800, fontSize: 16 }}>
            ⚡ Start Free Trial →
          </Link>
        </div>
      </div>
    </div>
  );
}
