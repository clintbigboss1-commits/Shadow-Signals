'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout, getUser, getToken, type User } from '../lib/auth';
import UpgradeBanner from './UpgradeBanner';
import API from '../lib/api';
import { getSocket, connectSocket } from '../lib/socket';

const NAV = [
  { href: '/markets',  label: 'Markets'  },
  { href: '/wins',     label: 'Wins'     },
  { href: '/reviews',  label: 'Reviews'  },
  { href: '/pricing',  label: 'Pricing'  },
];

const PLAN_COL: Record<string, string> = {
  free: '#64748b', starter: '#22d3ee', pro: '#22d3ee', elite: '#8b5cf6',
};

export default function Navbar() {
  const path = usePathname();
  const [user, setUser]           = useState<User | null>(null);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [unread, setUnread]       = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs]       = useState<{id:string;title:string;body:string|null;link:string|null;read:boolean;created_at:string}[]>([]);

  useEffect(() => {
    setUser(getUser());
    const token = getToken();
    if (!token) return;

    // Fetch initial unread count
    API.get('/notifications?limit=10').then(r => {
      setUnread(r.data.unread_count || 0);
      setNotifs(r.data.data || []);
    }).catch(() => {});

    // Subscribe to live notification pushes
    connectSocket(token);
    const s = getSocket();
    s.emit('subscribe:notifications');
    const onNew = (n: {id:string;title:string;body:string|null;link:string|null;read:boolean;created_at:string}) => {
      setNotifs(prev => [n, ...prev.slice(0, 9)]);
      setUnread(c => c + 1);
    };
    s.on('notification:new', onNew);
    return () => { s.off('notification:new', onNew); };
  }, []);

  function markAllRead() {
    API.patch('/notifications/read').catch(() => {});
    setUnread(0);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,17,30,.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}>
        <div className="navbar-container">

          {/* Logo */}
          <Link href="/markets" style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 101 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#22d3ee,#0891b2)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 17, color: '#030711', flexShrink: 0 }}>S</div>
            <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: -.3, color: '#e2e8f0' }}>
              SHADOW <span style={{ color: '#22d3ee' }}>ELITE</span>
            </span>
          </Link>

          {/* Hamburger toggle for mobile */}
          <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} style={{ position: 'relative', zIndex: 101 }}>
            {menuOpen ? '✕' : '☰'}
          </button>

          {/* Nav links (hidden on mobile, shown on desktop unless open) */}
          <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
            {NAV.map((l, i) => {
              const active = path === l.href;
              return (
                <Link key={i} href={l.href} onClick={() => setMenuOpen(false)} style={{
                  padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                  color: active ? '#e2e8f0' : '#64748b',
                  background: active ? 'rgba(255,255,255,.06)' : 'transparent',
                  transition: 'color .15s',
                }}>{l.label}</Link>
              );
            })}

            {/* Mobile actions (only visible when menu is open on mobile) */}
            {menuOpen && (
              <div className="navbar-right-mobile">
                {user ? (
                  <>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '6px 12px', borderRadius: 4,
                      background: `${PLAN_COL[user.plan] || '#64748b'}18`,
                      color: PLAN_COL[user.plan] || '#64748b',
                      textTransform: 'uppercase', letterSpacing: .8,
                      textAlign: 'center'
                    }}>{user.plan}</span>
                    <button onClick={() => { logout(); setMenuOpen(false); }} style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,.3)', background: 'transparent', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMenuOpen(false)} style={{ padding: '9px 16px', fontSize: 14, fontWeight: 500, color: '#94a3b8', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.02)', display: 'flex', justifyContent: 'center' }}>Sign In</Link>
                    <Link href="/signup" onClick={() => setMenuOpen(false)} style={{ padding: '10px 18px', borderRadius: 9, fontSize: 14, fontWeight: 700, color: '#030711', background: 'linear-gradient(135deg,#22d3ee,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      ⚡ Get Edge →
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right actions (desktop only) */}
          <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user ? (
              <>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                  background: `${PLAN_COL[user.plan] || '#64748b'}18`,
                  color: PLAN_COL[user.plan] || '#64748b',
                  textTransform: 'uppercase', letterSpacing: .8,
                }}>{user.plan}</span>

                {/* Notification bell */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => { setNotifOpen(o => !o); if (unread > 0) markAllRead(); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', position: 'relative', fontSize: 18, lineHeight: 1 }}
                    title="Notifications"
                  >
                    🔔
                    {unread > 0 && (
                      <span style={{
                        position: 'absolute', top: 0, right: 0,
                        background: '#ef4444', color: '#fff',
                        fontSize: 10, fontWeight: 800,
                        width: 16, height: 16, borderRadius: '50%',
                        display: 'grid', placeItems: 'center', lineHeight: 1,
                      }}>{unread > 9 ? '9+' : unread}</span>
                    )}
                  </button>

                  {notifOpen && (
                    <div style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 200,
                      width: 320, background: '#0d1526',
                      border: '1px solid rgba(255,255,255,.1)', borderRadius: 12,
                      boxShadow: '0 16px 48px rgba(0,0,0,.6)', overflow: 'hidden',
                    }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', fontWeight: 700, fontSize: 13 }}>
                        Notifications
                      </div>
                      {notifs.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>No notifications yet</div>
                      ) : notifs.map(n => (
                        <a key={n.id} href={n.link || '#'} onClick={() => setNotifOpen(false)} style={{
                          display: 'block', padding: '12px 16px',
                          borderBottom: '1px solid rgba(255,255,255,.04)',
                          background: n.read ? 'transparent' : 'rgba(34,211,238,.04)',
                          textDecoration: 'none', color: 'inherit',
                        }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0', marginBottom: 2 }}>{n.title}</div>
                          {n.body && <div style={{ fontSize: 12, color: '#64748b' }}>{n.body}</div>}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

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
