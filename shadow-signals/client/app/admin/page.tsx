'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import API from '../../lib/api';
import { getUser } from '../../lib/auth';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  created_at: string;
}

const PLANS = ['free', 'starter', 'pro', 'elite'];
const PLAN_COL: Record<string, string> = {
  free: '#64748b', starter: '#2979ff', pro: '#00e676', elite: '#a78bfa',
};

export default function AdminPage() {
  const [me, setMe] = useState<ReturnType<typeof getUser>>(null);
  const [checked, setChecked] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<any>(null);

  // Invite form
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('pro');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    setMe(getUser());
    setChecked(true);
  }, []);

  useEffect(() => {
    if (!checked || me?.role !== 'admin') return;
    API.get('/auth/admin/users')
      .then(r => setUsers(r.data))
      .catch(() => setErr('Could not load users — log out and back in to refresh your admin access.'));
  }, [checked, me]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setMsg(''); setErr(''); setLoading(true);
    try {
      const r = await API.post('/auth/admin/invite', { email, name: name || undefined, plan });
      setMsg(r.data.created
        ? `✅ ${email} added on ${plan.toUpperCase()} — invite email sent, they set their own password.`
        : `✅ ${email} moved to ${plan.toUpperCase()} — invite email sent.`);
      setEmail(''); setName('');
      const list = await API.get('/auth/admin/users');
      setUsers(list.data);
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function forceRefresh() {
    setRefreshing(true); setRefreshResult(null); setMsg(''); setErr('');
    try {
      const r = await API.post('/admin/refresh');
      setRefreshResult(r.data);
      const total = Object.values(r.data.fetched as Record<string, any>).reduce((s: number, v: any) => s + (v.events || 0), 0);
      setMsg(`Refreshed: ${total} events fetched, ${r.data.ev_opportunities} EV opportunities found.`);
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }

  async function setUserPlan(u: UserRow, newPlan: string) {
    setMsg(''); setErr('');
    try {
      await API.post('/auth/admin/upgrade', { email: u.email, plan: newPlan });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, plan: newPlan } : x));
      setMsg(`✅ ${u.email} → ${newPlan.toUpperCase()}`);
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Plan change failed');
    }
  }

  if (!checked) return null;

  if (me?.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <div style={{ maxWidth: 480, margin: '80px auto', padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Admins only</h1>
          <p style={{ color: '#5e7390', fontSize: 14, marginBottom: 20 }}>
            This page needs an admin account. If you were just made an admin, log out and back in so your access refreshes.
          </p>
          <Link href="/login"><button className="btn btn-primary">Go to login →</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>

        <div className="ghost-eyebrow" style={{ marginBottom: 12 }}><span>Admin</span></div>
        <h1 className="ghost-hero-title" style={{ fontSize: 40, marginBottom: 6 }}>Member control</h1>
        <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 14, marginBottom: 28 }}>
          Add anyone on any plan, free of charge — they get an email invite and set their own password.
        </p>

        {/* Scanner controls */}
        <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Scanner</div>
            <div style={{ fontSize: 12, color: '#5e7390' }}>Force an immediate odds fetch + EV recompute across all in-season sports.</div>
          </div>
          <button onClick={forceRefresh} disabled={refreshing} className="btn btn-primary" style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
            {refreshing ? '⟳ Refreshing...' : '⟳ Refresh now'}
          </button>
          {refreshResult && (
            <div style={{ width: '100%', fontSize: 12, color: '#5e7390', marginTop: 4 }}>
              {Object.entries(refreshResult.fetched as Record<string, any>).map(([sport, r]: [string, any]) => (
                <span key={sport} style={{ marginRight: 12 }}>{sport}: {r.events ?? '?'} events ({r.source})</span>
              ))}
            </div>
          )}
        </div>

        {/* Invite form */}
        <form onSubmit={invite} className="card" style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 220px' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#5e7390', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Email</label>
            <input type="email" placeholder="friend@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#5e7390', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Name (optional)</label>
            <input type="text" placeholder="Their name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={{ flex: '0 1 130px' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#5e7390', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Plan</label>
            <select value={plan} onChange={e => setPlan(e.target.value)}>
              {PLANS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '11px 22px' }}>
            {loading ? 'Adding...' : '+ Add free member'}
          </button>
        </form>

        {msg && <div className="alert-success" style={{ marginBottom: 16 }}>{msg}</div>}
        {err && <div className="alert-error" style={{ marginBottom: 16 }}>{err}</div>}

        {/* Users table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
            Members <span style={{ color: '#5e7390', fontWeight: 500 }}>({users.length})</span>
          </div>
          {users.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--border2)', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                <div style={{ fontSize: 12, color: '#5e7390' }}>
                  {u.name || '—'} · joined {new Date(u.created_at).toLocaleDateString('en-AU')}
                </div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 4,
                background: `${PLAN_COL[u.plan] || '#64748b'}18`,
                color: PLAN_COL[u.plan] || '#64748b',
                textTransform: 'uppercase', letterSpacing: .8,
              }}>{u.plan}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {PLANS.filter(p => p !== u.plan).map(p => (
                  <button key={p} onClick={() => setUserPlan(u, p)} className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 9px', border: '1px solid var(--border)', borderRadius: 6 }}>
                    → {p}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#5e7390', fontSize: 13 }}>No members loaded yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
