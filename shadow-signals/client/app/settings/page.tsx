'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import { getUser, logout } from '../../lib/auth';
import type { User } from '../../lib/auth';
import API from '../../lib/api';

const PLAN_COLORS: Record<string, string> = {
  free: '#64748b', starter: '#2979ff', pro: '#2979ff', elite: '#8b5cf6',
  recruit: '#2979ff', commander: '#8b5cf6', syndicate: '#ec4899',
};


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#0d1829', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', fontWeight: 800, fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
        {title}
      </div>
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
      <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#e2e8f0' }}>{children}</span>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: desc ? 3 : 0 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: '#475569' }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
          background: checked ? '#2979ff' : 'rgba(255,255,255,.1)',
          position: 'relative', transition: 'background .2s', flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: '50%',
          background: checked ? '#fff' : '#64748b',
          transition: 'left .2s', display: 'block',
        }} />
      </button>
    </div>
  );
}

function SettingsInner() {
  const router = useRouter();
  const [user, setUser]           = useState<User | null>(null);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts]   = useState(true);
  const [digest, setDigest]           = useState(true);
  const [saved, setSaved]             = useState(false);

  useEffect(() => {
    setUser(getUser());
    API.get('/users/me/preferences').then(r => {
      if (r.data.email_alerts !== undefined) setEmailAlerts(r.data.email_alerts);
      if (r.data.push_alerts  !== undefined) setPushAlerts(r.data.push_alerts);
    }).catch(() => {});
  }, []);

  async function savePrefs() {
    try {
      await API.patch('/users/me/preferences', { email_alerts: emailAlerts, push_alerts: pushAlerts });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
  }

  function handleLogout() {
    logout();
    router.push('/');
  }

  if (!user) return null;
  const planColor = PLAN_COLORS[user.plan] || '#64748b';
  const isPaidTop = user.plan === 'elite' || user.plan === 'syndicate' || user.plan === 'commander';

  return (
    <div style={{ minHeight: '100vh', background: '#060d1a', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 80px' }}>

        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6, color: '#fff' }}>Settings</h1>
        <p style={{ color: '#475569', fontSize: 14, marginBottom: 32 }}>Manage your account and preferences</p>

        {/* Plan card */}
        <div style={{ background: `linear-gradient(135deg, ${planColor}10, rgba(255,255,255,.02))`, border: `1px solid ${planColor}30`, borderRadius: 14, padding: '20px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: planColor, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Current Plan</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', textTransform: 'capitalize', letterSpacing: -0.5 }}>{user.plan}</div>
            {!isPaidTop && (
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                Upgrade to unlock more signals and features
              </div>
            )}
          </div>
          {!isPaidTop ? (
            <Link href="/pricing" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 10,
              background: 'linear-gradient(135deg,#2979ff,#1e63d9)',
              color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none',
            }}>
              ⚡ Upgrade plan →
            </Link>
          ) : (
            <span style={{ fontSize: 12, color: planColor, fontWeight: 700 }}>Max tier ✓</span>
          )}
        </div>

        {/* Account */}
        <Section title="Account">
          <Row label="Email">{user.email}</Row>
          <Row label="Name">{user.name || <span style={{ color: '#334155' }}>Not set</span>}</Row>
          <Row label="Plan"><span style={{ color: planColor, fontWeight: 700, textTransform: 'capitalize' }}>{user.plan}</span></Row>
          <div style={{ paddingTop: 16 }}>
            <Link href="/forgot" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700,
              border: '1px solid rgba(255,255,255,.1)', color: '#94a3b8',
              background: 'rgba(255,255,255,.03)', textDecoration: 'none',
            }}>
              Change password →
            </Link>
          </div>
        </Section>

        {/* Alerts */}
        <Section title="Alerts">
          <Toggle
            label="Email alerts"
            desc="Receive high-EV signals directly to your inbox"
            checked={emailAlerts}
            onChange={setEmailAlerts}
          />
          <Toggle
            label="Push alerts"
            desc="Live browser notifications for shadow picks (8%+ EV)"
            checked={pushAlerts}
            onChange={setPushAlerts}
          />
          <Toggle
            label="Weekly digest"
            desc="Top signals and CLV summary every Sunday"
            checked={digest}
            onChange={setDigest}
          />
          <div style={{ paddingTop: 16 }}>
            <button
              onClick={savePrefs}
              style={{
                padding: '9px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
                background: saved ? '#00c853' : 'linear-gradient(135deg,#2979ff,#1e63d9)',
                color: saved ? '#030711' : '#fff', transition: 'background .2s',
              }}
            >
              {saved ? '✓ Saved' : 'Save preferences'}
            </button>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Session">
          <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
            Sign out of Shadow Signals on this device.
          </p>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)',
              color: '#ef4444', fontFamily: 'Inter, sans-serif',
            }}
          >
            Sign out
          </button>
        </Section>

        {/* Support links */}
        <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 12, color: '#334155' }}>
          <Link href="/help"    style={{ color: '#475569' }}>Help centre</Link>
          <Link href="/privacy" style={{ color: '#475569' }}>Privacy policy</Link>
          <a href="mailto:support@shadowsignals.app" style={{ color: '#475569' }}>Contact support</a>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsInner />
    </ProtectedRoute>
  );
}
