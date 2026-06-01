'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import API from '../lib/api';

interface EVOpp {
  id: string;
  sport_key: string;
  event_name: string;
  selection: string;
  bookie: string;
  bookie_odds: number | string;
  fair_odds: number | string;
  ev_percent: number | string;
  kelly_percent: number | string;
  commence_time: string;
}

const SPORTS = [
  { key: 'all',                    label: 'All' },
  { key: 'aussierules_afl',        label: 'AFL' },
  { key: 'rugbyleague_nrl',        label: 'NRL' },
  { key: 'cricket_odi',            label: 'Cricket' },
  { key: 'soccer_a_league',        label: 'A-League' },
  { key: 'soccer_epl',             label: 'EPL' },
  { key: 'basketball_nbl',         label: 'NBL' },
  { key: 'mma_mixed_martial_arts', label: 'UFC' },
];

const EV_THRESHOLDS = [
  { label: 'All',  v: 0 },
  { label: '3%+',  v: 3 },
  { label: '5%+',  v: 5 },
  { label: '8%+',  v: 8 },
];

const BOOKIE_COL: Record<string, string> = {
  sportsbet: '#f97316', tab: '#06b6d4', bet365: '#22c55e',
  ladbrokes: '#ef4444', neds: '#8b5cf6', pointsbet: '#ec4899',
  bluebet: '#3b82f6', betfair_ex_au: '#f59e0b', unibet: '#10b981', betright: '#6366f1',
};

function fmt(d: string) {
  return new Date(d).toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function EVTable({ planLimit = 999 }: { planLimit?: number }) {
  const [data, setData]         = useState<EVOpp[]>([]);
  const [sport, setSport]       = useState('all');
  const [minEV, setMinEV]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [updated, setUpdated]   = useState(new Date());
  const [total, setTotal]       = useState(0);

  const fetch = useCallback(async () => {
    try {
      const res = await API.get('/ev', { params: { sport, minEV, limit: 100 } });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
      setUpdated(new Date());
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err.response?.status !== 401) console.error(e);
    } finally { setLoading(false); }
  }, [sport, minEV]);

  useEffect(() => { setLoading(true); fetch(); }, [fetch]);
  useEffect(() => { const t = setInterval(fetch, 45000); return () => clearInterval(t); }, [fetch]);

  const rows = data.slice(0, planLimit);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="section-label">Live +EV Scanner</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {loading ? 'Scanning...' : `${total} edges`}
            {!loading && planLimit < total && (
              <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b', marginLeft: 8 }}>
                (showing {rows.length} — <Link href="/pricing" style={{ color: '#22d3ee' }}>upgrade for all</Link>)
              </span>
            )}
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, paddingTop: 18 }}>
          <span className="dot-live" />
          {updated.toLocaleTimeString()}
        </div>
      </div>

      {/* Sport tabs */}
      <div className="tab-row" style={{ marginBottom: 10 }}>
        {SPORTS.map(s => (
          <button key={s.key} className={`tab${sport === s.key ? ' active' : ''}`} onClick={() => setSport(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* EV filter */}
      <div className="tab-row" style={{ marginBottom: 16 }}>
        {EV_THRESHOLDS.map(f => (
          <button key={f.v} className={`tab${minEV === f.v ? ' active' : ''}`} onClick={() => setMinEV(f.v)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Scanning bookmakers...
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
            No edges right now — try lowering the EV filter or check back when AU games are live.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th>Event / Sport</th>
                  <th>Selection</th>
                  <th>Bookie</th>
                  <th style={{ textAlign: 'right' }}>Odds</th>
                  <th style={{ textAlign: 'right' }}>Fair</th>
                  <th style={{ minWidth: 140 }}>Edge</th>
                  <th style={{ textAlign: 'right' }}>Kelly</th>
                  <th>Start</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const ev  = Number(row.ev_percent);
                  const col = BOOKIE_COL[row.bookie] || '#64748b';
                  return (
                    <tr key={row.id || i} className="fadein">
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{row.event_name}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {row.sport_key?.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{row.selection}</td>
                      <td>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: `${col}18`, color: col,
                          textTransform: 'capitalize',
                        }}>{row.bookie?.replace(/_/g, ' ')}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#10b981' }}>
                        ${Number(row.bookie_odds).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }}>
                        ${Number(row.fair_odds).toFixed(2)}
                      </td>
                      <td>
                        <div className="ev-bar">
                          <div className="ev-bar-track">
                            <div className="ev-bar-fill" style={{ width: `${Math.min(ev * 5, 100)}%` }} />
                          </div>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: '#10b981', whiteSpace: 'nowrap' }}>
                            +{ev.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#64748b' }}>
                        {Number(row.kelly_percent).toFixed(1)}%
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {row.commence_time ? fmt(row.commence_time) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
