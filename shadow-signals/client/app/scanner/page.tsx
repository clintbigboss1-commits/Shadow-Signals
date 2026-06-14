'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import EventCard, { type GameEvent } from '../../components/EventCard';
import API from '../../lib/api';

const SPORT_TABS = [
  { key: 'all',                    label: 'All' },
  { key: 'aussierules_afl',        label: '🏈 AFL' },
  { key: 'rugbyleague_nrl',        label: '🏉 NRL' },
  { key: 'soccer_a_league',        label: '⚽ A-League' },
  { key: 'soccer_epl',             label: '⚽ EPL' },
  { key: 'basketball_nba',         label: '🏀 NBA' },
  { key: 'mma_ufc',                label: '🥊 UFC' },
  { key: 'horse_racing_au',        label: '🐎 Racing' },
  { key: 'greyhound_racing_au',    label: '🐕 Greyhounds' },
];

const EV_FILTERS = [
  { label: 'All Events', v: 0 },
  { label: 'Has Edge',   v: 0.01 },
  { label: '3%+ EV',     v: 3 },
  { label: '5%+ EV',     v: 5 },
  { label: '8%+ EV',     v: 8 },
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

  /* client-side EV filter */
  const filtered = minEV === 0
    ? games
    : games.filter(g =>
        minEV < 0.1
          ? g.ev_picks.length > 0
          : g.ev_picks.some(p => p.ev_percent >= minEV)
      );

  const allEdgesFlat = filtered.flatMap(g => g.ev_picks);
  const totalEdges = allEdgesFlat.length;
  const bestEdge = [...allEdgesFlat].sort((a, b) => b.ev_percent - a.ev_percent)[0] ?? null;

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f9', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#071120', marginBottom: 4, letterSpacing: -0.5 }}>+EV Scanner</h1>
              <p style={{ color: '#5a7a9a', fontSize: 13 }}>
                {loading ? 'Scanning bookmakers…' : `${filtered.length} events · ${totalEdges} edges`}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5a7a9a' }}>
              <span className="dot-live" />
              {updated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Summary strip */}
        {!loading && filtered.length > 0 && (
          <div style={{ background: '#ffffff', border: '1px solid #dde8f5', borderRadius: 12, padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 1px 4px rgba(7,17,32,.06)' }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#9eb1c8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Events</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontWeight: 900, fontSize: 20, color: '#071120' }}>{filtered.length}</div>
            </div>
            <div style={{ width: 1, height: 36, background: '#dde8f5' }} />
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#9eb1c8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Total Edges</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontWeight: 900, fontSize: 20, color: '#2979ff' }}>{totalEdges}</div>
            </div>
            {bestEdge && (
              <>
                <div style={{ width: 1, height: 36, background: '#dde8f5' }} />
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#9eb1c8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Best Edge</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 900, fontSize: 20, color: '#008a3d' }}>+{bestEdge.ev_percent.toFixed(1)}%</span>
                    <span style={{ fontSize: 12, color: '#5a7a9a', fontWeight: 600 }}>{bestEdge.selection}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sport tabs */}
        <div className="tab-row" style={{ marginBottom: 10 }}>
          {SPORT_TABS.map(s => (
            <button key={s.key} className={`tab${sport === s.key ? ' active' : ''}`} onClick={() => setSport(s.key)}>
              {s.label}
            </button>
          ))}
        </div>

        {/* EV filter */}
        <div className="tab-row" style={{ marginBottom: 20 }}>
          {EV_FILTERS.map(f => (
            <button key={f.v} className={`tab${minEV === f.v ? ' active' : ''}`} onClick={() => setMinEV(f.v)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Event cards */}
        {loading ? (
          <div style={{ padding: 64, textAlign: 'center', color: '#6b8aaa' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            Scanning bookmakers…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center', color: '#5a7a9a', background: '#ffffff', borderRadius: 14, border: '1px solid #dde8f5', boxShadow: '0 1px 4px rgba(7,17,32,.06)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#071120' }}>No events match this filter</div>
            <div style={{ fontSize: 13 }}>Try "All Events" or a different sport.</div>
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
