'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout, getUser, type User } from '../lib/auth';
import UpgradeBanner from './UpgradeBanner';

const NAV = [
  { href: '/markets',  label: 'Markets'      },
  { href: '/wins',     label: 'Wins'         },
  { href: '/pricing',  label: 'Find My Plan' },
  { href: '/reviews',  label: 'Reviews'      },
  { href: '/pricing',  label: 'Pricing'      },
];

const PLAN_COL: Record<string, string> = {
  free: '#64748b', starter: '#22d3ee', pro: '#22d3ee', elite: '#8b5cf6',
};

export default function Navbar() {
  const path = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => { setUser(getUser()); }, []);

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,17,30,.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

          {/* Logo */}
          <Link href="/markets" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#22d3ee,#0891b2)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 17, color: '#030711', flexShrink: 0 }}>S</div>
            <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: -.3, color: '#e2e8f0' }}>
              SHADOW <span style={{ color: '#22d3ee' }}>ELITE</span>
            </span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: 2 }}>
            {NAV.map((l, i) => {
              const active = path === l.href;
              return (
                <Link key={i} href={l.href} style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                  color: active ? '#e2e8f0' : '#64748b',
                  background: active ? 'rgba(255,255,255,.06)' : 'transparent',
                  transition: 'color .15s',
                }}>{l.label}</Link>
              );
            })}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user ? (
              <>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                  background: `${PLAN_COL[user.plan] || '#64748b'}18`,
                  color: PLAN_COL[user.plan] || '#64748b',
                  textTransform: 'uppercase', letterSpacing: .8,
                }}>{user.plan}</span>
                <button onClick={logout} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,.3)', background: 'transparent', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" style={{ padding: '7px 16px', fontSize: 14, fontWeight: 500, color: '#94a3b8', borderRadius: 8 }}>Sign In</Link>
                <Link href="/signup" style={{ padding: '8px 18px', borderRadius: 9, fontSize: 14, fontWeight: 700, color: '#030711', background: 'linear-gradient(135deg,#22d3ee,#0891b2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ⚡ Get Edge →
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Upgrade banner — only for free/starter users */}
      <UpgradeBanner />
    </>
  );
}
