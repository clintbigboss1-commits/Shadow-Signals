'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUser, getToken, type User } from '../lib/auth';
import { connectSocket, getSocket } from '../lib/socket';
import API from '../lib/api';

const SPORT_NAV = [
  { key: 'aussierules_afl',           label: 'AFL',        icon: '🏈' },
  { key: 'rugbyleague_nrl',           label: 'NRL',        icon: '🏉' },
  { key: 'horse_racing_gb',            label: 'UK Racing',  icon: '🐎' },
  { key: 'horse_racing_ire',           label: 'IRE Racing', icon: '🐎' },
  { key: 'basketball_nba',            label: 'NBA',        icon: '🏀' },
  { key: 'soccer_epl',                label: 'EPL',        icon: '⚽' },
  { key: 'soccer_a_league',           label: 'A-League',   icon: '⚽' },
  { key: 'mma_mixed_martial_arts',    label: 'MMA',        icon: '🥊' },
  { key: 'cricket_international_t20', label: 'T20I',       icon: '🏏' },
  { key: 'baseball_mlb',              label: 'MLB',        icon: '⚾' },
];

const PLAN_COLOR: Record<string, string> = {
  free: '#64748b', starter: '#2979ff', pro: '#2979ff', elite: '#8b5cf6',
};

interface Props {
  children: React.ReactNode;
  activeSport?: string;
  onSportChange?: (key: string) => void;
}

export default function AppShell({ children, activeSport, onSportChange }: Props) {
  const path = usePathname();
  const [user, setUser]     = useState<User | null>(() => getUser());
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<{ id: string; title: string; body: string | null; read: boolean; created_at: string }[]>([]);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (!u) return;
    const token = getToken();
    if (!token) return;
    connectSocket(token);
    API.get('/notifications?limit=10').then(r => {
      setUnread(r.data.unread_count || 0);
      setNotifs(r.data.data || []);
    }).catch(() => {});
    const s = getSocket();
    s.emit('subscribe:notifications');
    const onNew = (n: any) => {
      setNotifs(prev => [n, ...prev.slice(0, 9)]);
      setUnread(c => c + 1);
    };
    s.on('notification:new', onNew);
    return () => { s.off('notification:new', onNew); };
  }, []);

  function markRead() {
    API.patch('/notifications/read').catch(() => {});
    setUnread(0);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  const planCol = PLAN_COLOR[user?.plan || 'free'];

  const NAV_ITEMS: { href: string; label: string; icon: React.ReactNode }[] = [
    { href: '/dashboard', label: 'Dashboard', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    )},
    { href: '/markets', label: 'Markets', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    )},
    { href: '/scanner', label: 'Signals', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
      </svg>
    )},
    { href: '/wins', label: 'My Wins', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    )},
    { href: '/settings', label: 'Settings', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
      </svg>
    )},
  ];

  return (
    <div className="app-shell">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#2979ff,#1e63d9)', display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>⚡</div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: .5 }}>SHADOW</div>
              <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: .5, color: '#2979ff' }}>SIGNALS</div>
            </div>
          </Link>
        </div>

        {/* User block */}
        {user && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${planCol}22`, border: `2px solid ${planCol}`, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 15, color: planCol, flexShrink: 0 }}>
              {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.email?.split('@')[0]}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: planCol, textTransform: 'uppercase', letterSpacing: 1 }}>{user.plan}</div>
            </div>
            {/* Notification bell */}
            <button
              onClick={() => { setNotifOpen(o => !o); if (unread > 0) markRead(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', fontSize: 16, padding: 4 }}
              title="Notifications"
            >
              🔔
              {unread > 0 && (
                <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, width: 14, height: 14, borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Notification dropdown */}
        {notifOpen && (
          <div style={{ position: 'absolute', left: 220, top: 80, zIndex: 300, width: 300, background: '#0d1526', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,.6)', overflow: 'hidden' }}>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,.06)', fontWeight: 700, fontSize: 13 }}>Notifications</div>
            {notifs.length === 0
              ? <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>No notifications</div>
              : notifs.map(n => (
                <div key={n.id} style={{ padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,.04)', background: n.read ? 'transparent' : 'rgba(41,121,255,.04)' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: '#e2e8f0', marginBottom: 2 }}>{n.title}</div>
                  {n.body && <div style={{ fontSize: 11, color: '#64748b' }}>{n.body}</div>}
                </div>
              ))
            }
          </div>
        )}

        {/* Main nav */}
        <nav style={{ padding: '8px 0', flex: 1, overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href}>
              <button className={`nav-item${path === item.href ? ' active' : ''}`}>
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </button>
            </Link>
          ))}

          {/* Sport sub-nav — only shown when onSportChange is wired */}
          {onSportChange && (
            <>
              <div style={{ padding: '14px 16px 6px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.2 }}>Sports</div>
              {SPORT_NAV.map(s => (
                <button
                  key={s.key}
                  className={`nav-item${activeSport === s.key ? ' active' : ''}`}
                  onClick={() => onSportChange(s.key)}
                  style={{ justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontSize: 14 }}>{s.icon}</span>
                    <span>{s.label}</span>
                  </div>
                  {activeSport === s.key && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)', display: 'inline-block' }} />}
                </button>
              ))}
            </>
          )}
        </nav>

        {/* Upgrade CTA */}
        <div style={{ padding: '12px 12px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {user?.plan === 'free' && (
            <Link href="/pricing">
              <button style={{ width: '100%', padding: '10px 0', borderRadius: 9, background: 'linear-gradient(135deg,#2979ff,#1e63d9)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                Unlock all signals →
              </button>
            </Link>
          )}
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', padding: '4px 0' }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="main-area">
        {children}
      </div>
    </div>
  );
}
