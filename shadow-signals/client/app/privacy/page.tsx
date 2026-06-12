'use client';

import Link from 'next/link';
import Navbar from '../../components/Navbar';

const LAST_UPDATED = '12 June 2025';

const SECTIONS = [
  { id: 'overview',     title: '1. Overview' },
  { id: 'collection',   title: '2. Information We Collect' },
  { id: 'use',          title: '3. How We Use Your Information' },
  { id: 'disclosure',   title: '4. Disclosure to Third Parties' },
  { id: 'cookies',      title: '5. Cookies & Analytics' },
  { id: 'retention',    title: '6. Data Retention' },
  { id: 'security',     title: '7. Security' },
  { id: 'access',       title: '8. Access & Correction' },
  { id: 'children',     title: '9. Children\'s Privacy' },
  { id: 'complaints',   title: '10. Complaints' },
  { id: 'contact',      title: '11. Contact Us' },
];

export default function PrivacyPolicy() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'var(--font)' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(180deg, #060e1a 0%, var(--bg) 100%)',
        borderBottom: '1px solid var(--border)',
        padding: 'clamp(48px,8vh,96px) 24px 48px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
          Legal
        </div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, letterSpacing: -1.5, marginBottom: 14 }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--text-soft)', fontSize: 15, maxWidth: 560, margin: '0 auto 16px' }}>
          How Shadow Signals collects, uses, and protects your personal information under the
          Australian Privacy Act 1988 (Cth).
        </p>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Last updated: {LAST_UPDATED}</div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px 96px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 64, alignItems: 'start' }}>

        {/* Sticky TOC */}
        <nav style={{ position: 'sticky', top: 88 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)', marginBottom: 16 }}>
            Contents
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`} style={{
                fontSize: 13, color: 'var(--text-soft)', padding: '5px 10px',
                borderLeft: '2px solid var(--border)', display: 'block',
                transition: 'color .15s, border-color .15s',
              }}
                onMouseEnter={e => { (e.target as HTMLAnchorElement).style.color = '#fff'; (e.target as HTMLAnchorElement).style.borderLeftColor = 'var(--cyan)'; }}
                onMouseLeave={e => { (e.target as HTMLAnchorElement).style.color = 'var(--text-soft)'; (e.target as HTMLAnchorElement).style.borderLeftColor = 'var(--border)'; }}
              >
                {s.title}
              </a>
            ))}
          </div>
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <Link href="/terms" style={{ fontSize: 12, color: 'var(--cyan)', display: 'block', marginBottom: 8 }}>Terms & Conditions →</Link>
            <Link href="/" style={{ fontSize: 12, color: 'var(--muted)' }}>← Home</Link>
          </div>
        </nav>

        {/* Content */}
        <article style={{ color: 'var(--text-soft)', lineHeight: 1.8, fontSize: 15 }}>

          <Section id="overview" title="1. Overview">
            <p>
              Shadow Signals ("we", "us", "our") is an Australian-based sports analytics service operated
              at <strong style={{ color: '#fff' }}>shadowsignals.app</strong>. We are committed to protecting
              your privacy in accordance with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy
              Principles (APPs).
            </p>
            <p style={{ marginTop: 14 }}>
              This Policy explains what personal information we collect, why we collect it, how we use and
              disclose it, and how you can access or correct it. By using the Shadow Signals platform you
              agree to the practices described here.
            </p>
            <Callout>
              Shadow Signals provides analytical tools only. We are not a betting agency, do not hold
              an Australian gambling licence, and nothing on our platform constitutes financial or
              betting advice.
            </Callout>
          </Section>

          <Section id="collection" title="2. Information We Collect">
            <p>We collect personal information in the following ways:</p>
            <SubHead>Information you provide directly</SubHead>
            <ul>
              <li><strong style={{ color: '#fff' }}>Account registration</strong> — name, email address, and password (stored as a bcrypt hash).</li>
              <li><strong style={{ color: '#fff' }}>Subscription payments</strong> — billing details are collected and stored exclusively by Stripe, Inc. We never see or store full card numbers.</li>
              <li><strong style={{ color: '#fff' }}>Support communications</strong> — any information you include when contacting us by email.</li>
              <li><strong style={{ color: '#fff' }}>Bet tracker entries</strong> — wagers you voluntarily record inside the CLV dashboard (sport, odds, stake, result). This data is tied to your account and used solely to generate your personal analytics.</li>
            </ul>
            <SubHead>Information collected automatically</SubHead>
            <ul>
              <li><strong style={{ color: '#fff' }}>Usage data</strong> — pages visited, features used, session duration, device type, operating system, and browser type.</li>
              <li><strong style={{ color: '#fff' }}>IP address</strong> — logged for rate-limiting, fraud prevention, and rough geolocation (country/state level only).</li>
              <li><strong style={{ color: '#fff' }}>Authentication tokens</strong> — short-lived JWTs stored in your browser's local storage to maintain your session.</li>
            </ul>
            <SubHead>Information we do NOT collect</SubHead>
            <ul>
              <li>We do not collect government identifiers (e.g. Tax File Number, passport number).</li>
              <li>We do not collect sensitive information as defined by the APPs (health, racial origin, political opinions, etc.).</li>
            </ul>
          </Section>

          <Section id="use" title="3. How We Use Your Information">
            <p>We use collected information only for the purposes for which it was collected, or related purposes you would reasonably expect:</p>
            <ul>
              <li>To create and manage your account.</li>
              <li>To deliver the analytics services you have subscribed to.</li>
              <li>To process subscription payments and send receipts via Stripe and Resend.</li>
              <li>To send transactional emails — account confirmation, password reset, subscription status. We do not send marketing emails without your consent.</li>
              <li>To detect and prevent fraud, abuse, and violations of our Terms of Service.</li>
              <li>To improve the platform — aggregate, de-identified usage data helps us understand which features are most valuable.</li>
              <li>To comply with legal obligations under Australian law.</li>
            </ul>
            <p style={{ marginTop: 14 }}>
              We do not sell, rent, or trade your personal information to any third party for marketing purposes.
            </p>
          </Section>

          <Section id="disclosure" title="4. Disclosure to Third Parties">
            <p>We only disclose personal information to the following categories of third party, and only to the extent necessary to deliver our service:</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#fff', fontWeight: 700 }}>Service</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#fff', fontWeight: 700 }}>Purpose</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#fff', fontWeight: 700 }}>Location</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Stripe, Inc.', 'Payment processing and subscription management', 'USA (EU SCCs)'],
                  ['Resend', 'Transactional email delivery', 'USA'],
                  ['Railway', 'Cloud hosting and database infrastructure', 'Southeast Asia / USA'],
                  ['The Odds API', 'Live sports odds data (anonymised requests only)', 'USA'],
                ].map(([svc, purpose, loc], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border2)', background: i % 2 === 0 ? 'rgba(255,255,255,.02)' : 'transparent' }}>
                    <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>{svc}</td>
                    <td style={{ padding: '10px 12px' }}>{purpose}</td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--muted)' }}>{loc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginTop: 16 }}>
              Some of these providers are located outside Australia. Where we transfer personal information
              overseas, we take reasonable steps to ensure the recipient handles it in a manner consistent
              with the APPs.
            </p>
            <p style={{ marginTop: 12 }}>
              We may also disclose information when required to do so by Australian law or a court order,
              or where disclosure is reasonably necessary to enforce our Terms of Service.
            </p>
          </Section>

          <Section id="cookies" title="5. Cookies & Analytics">
            <p>
              Shadow Signals does not use third-party advertising cookies or cross-site tracking pixels.
              We use only the following:
            </p>
            <ul>
              <li><strong style={{ color: '#fff' }}>Essential cookies</strong> — required for authentication and session security. You cannot opt out of these while using the service.</li>
              <li><strong style={{ color: '#fff' }}>Local storage tokens</strong> — your authentication JWT is stored in <code style={{ fontFamily: 'var(--mono)', fontSize: 12, background: 'rgba(255,255,255,.06)', padding: '1px 5px', borderRadius: 3 }}>localStorage</code> to maintain your logged-in state. This is not shared with third parties.</li>
            </ul>
            <p style={{ marginTop: 14 }}>
              We do not currently use Google Analytics, Facebook Pixel, or any other third-party
              behavioural analytics provider.
            </p>
          </Section>

          <Section id="retention" title="6. Data Retention">
            <ul>
              <li><strong style={{ color: '#fff' }}>Account data</strong> — retained for the life of your account, and for up to 7 years after closure to meet Australian tax and financial record-keeping obligations.</li>
              <li><strong style={{ color: '#fff' }}>Bet tracker entries</strong> — retained until you delete them or close your account.</li>
              <li><strong style={{ color: '#fff' }}>Odds cache</strong> — live odds data is automatically purged after each event concludes (typically within 24 hours).</li>
              <li><strong style={{ color: '#fff' }}>Server logs</strong> — IP and request logs are retained for up to 90 days for security purposes, then deleted.</li>
            </ul>
            <p style={{ marginTop: 14 }}>
              You can request deletion of your account and associated personal data at any time by emailing{' '}
              <a href="mailto:privacy@shadowsignals.app" style={{ color: 'var(--cyan)' }}>privacy@shadowsignals.app</a>.
              Account closure requests are processed within 30 days. Note that we may retain a de-identified
              record for legal or fraud-prevention purposes.
            </p>
          </Section>

          <Section id="security" title="7. Security">
            <p>We implement the following technical and organisational measures to protect your information:</p>
            <ul>
              <li>All data in transit is encrypted using TLS 1.2+.</li>
              <li>Passwords are hashed using bcrypt with a work factor of 12 — we never store plaintext passwords.</li>
              <li>Authentication tokens are short-lived JWTs signed with a secret key stored as an environment variable.</li>
              <li>Database access is restricted to authenticated application servers; no public database endpoints are exposed.</li>
              <li>Payment card data is handled entirely by Stripe and is never transmitted to or stored on our servers.</li>
              <li>API endpoints are rate-limited to prevent brute-force attacks.</li>
            </ul>
            <p style={{ marginTop: 14 }}>
              No method of transmission over the internet is 100% secure. While we take reasonable steps
              to protect your information, we cannot guarantee absolute security. If you suspect
              unauthorised access to your account, contact us immediately at{' '}
              <a href="mailto:security@shadowsignals.app" style={{ color: 'var(--cyan)' }}>security@shadowsignals.app</a>.
            </p>
          </Section>

          <Section id="access" title="8. Access & Correction">
            <p>
              Under the Australian Privacy Act you have the right to request access to the personal
              information we hold about you, and to request that we correct any inaccuracies.
            </p>
            <p style={{ marginTop: 12 }}>
              Most of your information — name, email, and bet tracker history — is accessible and editable
              directly from your <Link href="/settings" style={{ color: 'var(--cyan)' }}>account settings</Link>.
            </p>
            <p style={{ marginTop: 12 }}>
              For a complete data export, or to request correction of information you cannot access yourself,
              email <a href="mailto:privacy@shadowsignals.app" style={{ color: 'var(--cyan)' }}>privacy@shadowsignals.app</a>.
              We will respond within 30 days. We may ask you to verify your identity before fulfilling the request.
            </p>
            <p style={{ marginTop: 12 }}>
              We may decline access in limited circumstances permitted by the Privacy Act (for example, if
              disclosure would unreasonably affect another individual's privacy), in which case we will
              provide written reasons.
            </p>
          </Section>

          <Section id="children" title="9. Children's Privacy">
            <p>
              Shadow Signals is strictly for users who are <strong style={{ color: '#fff' }}>18 years of age or older</strong>.
              We do not knowingly collect personal information from anyone under 18. If you believe we have
              inadvertently collected information from a minor, please contact us immediately at{' '}
              <a href="mailto:privacy@shadowsignals.app" style={{ color: 'var(--cyan)' }}>privacy@shadowsignals.app</a>{' '}
              and we will delete it promptly.
            </p>
          </Section>

          <Section id="complaints" title="10. Complaints">
            <p>
              If you have a complaint about how we have handled your personal information, we encourage you
              to contact us first so we can resolve it directly:
            </p>
            <ul>
              <li>Email: <a href="mailto:privacy@shadowsignals.app" style={{ color: 'var(--cyan)' }}>privacy@shadowsignals.app</a></li>
              <li>Response time: within 15 business days</li>
            </ul>
            <p style={{ marginTop: 14 }}>
              If you are not satisfied with our response, you may lodge a complaint with the Office of the
              Australian Information Commissioner (OAIC):
            </p>
            <ul>
              <li>Website: <a href="https://www.oaic.gov.au" style={{ color: 'var(--cyan)' }} target="_blank" rel="noreferrer">oaic.gov.au</a></li>
              <li>Phone: 1300 363 992</li>
            </ul>
          </Section>

          <Section id="contact" title="11. Contact Us">
            <p>For any privacy-related queries, requests, or concerns:</p>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', marginTop: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 4 }}>Shadow Signals</div>
              <div style={{ marginBottom: 8, color: 'var(--muted)', fontSize: 13 }}>Australia</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div><span style={{ color: 'var(--muted)', fontSize: 12, minWidth: 90, display: 'inline-block' }}>Privacy:</span> <a href="mailto:privacy@shadowsignals.app" style={{ color: 'var(--cyan)' }}>privacy@shadowsignals.app</a></div>
                <div><span style={{ color: 'var(--muted)', fontSize: 12, minWidth: 90, display: 'inline-block' }}>Security:</span> <a href="mailto:security@shadowsignals.app" style={{ color: 'var(--cyan)' }}>security@shadowsignals.app</a></div>
                <div><span style={{ color: 'var(--muted)', fontSize: 12, minWidth: 90, display: 'inline-block' }}>General:</span> <a href="mailto:support@shadowsignals.app" style={{ color: 'var(--cyan)' }}>support@shadowsignals.app</a></div>
              </div>
            </div>
            <p style={{ marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
              We may update this Privacy Policy from time to time. When we do, we will revise the "Last
              updated" date at the top of this page. Material changes will be communicated by email to
              registered users at least 14 days before they take effect. Continued use of Shadow Signals
              after that date constitutes acceptance of the updated policy.
            </p>
          </Section>

          {/* Bottom links */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32, marginTop: 48, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link href="/terms" style={{ color: 'var(--cyan)', fontSize: 13, fontWeight: 600 }}>Terms & Conditions →</Link>
            <Link href="/" style={{ color: 'var(--muted)', fontSize: 13 }}>← Back to Shadow Signals</Link>
          </div>
        </article>
      </div>

      <style>{`
        @media (max-width: 760px) {
          article { grid-column: 1 / -1; }
          nav[style] { display: none; }
          div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 56, scrollMarginTop: 100 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {children}
    </h3>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      margin: '20px 0', padding: '14px 18px',
      background: 'rgba(41,121,255,.08)', border: '1px solid rgba(41,121,255,.2)',
      borderRadius: 8, fontSize: 13, color: 'var(--text-soft)',
      borderLeft: '3px solid var(--cyan)',
    }}>
      {children}
    </div>
  );
}
