'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import EventCard, { type GameEvent } from '../../components/EventCard';
import API from '../../lib/api';

const SPORT_TABS = [
  { key: 'all',              label: 'All Sports',   icon: '⚡', color: '#2979ff' },
  { key: 'aussierules_afl',  label: 'AFL',          icon: '🏈', color: '#FFD700' },
  { key: 'rugbyleague_nrl',  label: 'NRL',          icon: '🏉', color: '#00e676' },
  { key: 'soccer_a_league',  label: 'A-League',     icon: '⚽', color: '#e94560' },
  { key: 'soccer_epl',       label: 'EPL',          icon: '⚽', color: '#7c3aed' },
  { key: 'basketball_nba',   label: 'NBA',          icon: '🏀', color: '#f26522' },
  { key: 'mma_ufc',          label: 'UFC',          icon: '🥊', color: '#ff1744' },
  { key: 'horse_racing_gb',  label: 'UK Racing',    icon: '🐎', color: '#ff6b35' },
  { key: 'horse_racing_ire', label: 'IRE Racing',   icon: '🐎', color: '#2ecc71' },
];

const EV_FILTERS = [
  { label: 'All Events', v: 0,    color: '#64748b' },
  { label: 'Any Edge',   v: 0.01, color: '#2979ff' },
  { label: '3%+ EV',     v: 3,    color: '#ffab00' },
  { label: '5%+ EV',     v: 5,    color: '#f97316' },
  { label: '8%+ EV',     v: 8,    color: '#ef4444' },
];

function ScannerInner() {
  const [games, setGames]     = useState<GameEvent[]>([]);
  const [sport, setSport]     = useState('all');
  const [minEV, setMinEV]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { limit: 100 };
      if (sport !== 'all') params.sport = sport;
      const res = await API.get('/games', { params });
      setGames(res.data.data || []);
      setUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 45000); return () => clearInterval(t); }, [load]);

  const filtered = minEV === 0
    ? games
    : games.filter(g =>
        minEV < 0.1
          ? g.ev_picks.length > 0
          : g.ev_picks.some(p => p.ev_percent >= minEV)
      );

  const allEdges  = filtered.flatMap(g => g.ev_picks);
  const hotPicks  = allEdges.filter(p => p.ev_percent >= 8);
  const bestEdge  = [...allEdges].sort((a, b) => b.ev_percent - a.ev_percent)[0] ?? null;

  return (
    <div style={{ minHeight: '100vh', background: '#060d1a', fontFamily: 'Inter, sans-serif', color: '#e2e8f0' }}>
      <Navbar />

      {/* Hot picks alert bar */}
      {!loading && hotPicks.length > 0 && (
        <div style={{ background: 'linear-gradient(90deg,rgba(249,115,22,.12),rgba(220,38,38,.08))', borderBottom: '1px solid rgba(249,115,22,.25)', padding: '9px 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#f97316', textTransform: 'uppercase', letterSpacing: 1.5, flexShrink: 0 }}>
              🔥 {hotPicks.length} HOT EDGE{hotPicks.length !== 1 ? 'S' : ''}
            </span>
            {hotPicks.slice(0, 4).map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(249,115,22,.1)', border: '1px solid rgba(249,115,22,.22)', borderRadius: 8, padding: '3px 10px' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{p.selection}</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#fb923c', fontFamily: 'monospace' }}>+{p.ev_percent.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: -0.5, margin: 0 }}>+EV Scanner</h1>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: '#00e676', background: 'rgba(0,230,118,.08)', border: '1px solid rgba(0,230,118,.2)', borderRadius: 20, padding: '3px 10px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                LIVE
              </span>
            </div>
            <p style={{ color: '#5e7390', fontSize: 13, margin: 0 }}>
              {loading ? 'Scanning bookmakers…' : `${filtered.length} event${filtered.length !== 1 ? 's' : ''} · ${allEdges.length} edge${allEdges.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <div style={{ fontSize: 11, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
            Updated {updated.toLocaleTimeString()}
          </div>
        </div>

        {/* Stats strip */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
            {[
              { label: 'EVENTS',     value: String(filtered.length), color: '#2979ff' },
              { label: 'TOTAL EDGES', value: String(allEdges.length), color: allEdges.length > 0 ? '#00e676' : '#64748b' },
              bestEdge
                ? { label: 'BEST EDGE', value: `+${bestEdge.ev_percent.toFixed(1)}%`, sub: bestEdge.selection, color: '#00e676' }
                : { label: 'BEST EDGE', value: '—', color: '#64748b' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 24, color: s.color, lineHeight: 1 }}>{s.value}</div>
                {'sub' in s && s.sub && <div style={{ fontSize: 11, color: '#5e7390', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Sport tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 8 }}>
          {SPORT_TABS.map(s => {
            const active = sport === s.key;
            return (
              <button key={s.key} onClick={() => setSport(s.key)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', flexShrink: 0, transition: 'all .15s',
                background: active ? s.color : 'rgba(255,255,255,.05)',
                color: active ? (s.key === 'all' ? '#fff' : '#000') : '#64748b',
                border: `1px solid ${active ? s.color : 'rgba(255,255,255,.08)'}`,
              }}>
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* EV filter row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap' }}>
          {EV_FILTERS.map(f => {
            const active = minEV === f.v;
            return (
              <button key={f.v} onClick={() => setMinEV(f.v)} style={{
                padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: 'all .15s',
                background: active ? `${f.color}20` : 'transparent',
                color: active ? f.color : '#334155',
                border: `1px solid ${active ? f.color : 'rgba(255,255,255,.07)'}`,
              }}>
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#334155' }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(41,121,255,.15)', borderTopColor: '#2979ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            Scanning {SPORT_TABS.find(s => s.key === sport)?.label || 'all'} markets…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', background: 'rgba(255,255,255,.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🔍</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 6 }}>No events match this filter</div>
            <div style={{ fontSize: 13, color: '#5e7390' }}>Try "All Events" or a different sport. Markets refresh every 45s.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(ev => <EventCard key={ev.event_id} event={ev} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Scanner() {
  return (
    <ProtectedRoute>
      <ScannerInner />
    </ProtectedRoute>
  );
}
