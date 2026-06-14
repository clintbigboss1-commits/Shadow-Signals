'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import API from '../lib/api';

interface EVOpp {
  id: string;
  sport_key: string;
  event_id?: string;
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
  { key: 'soccer_epl',             label: 'EPL' },
  { key: 'soccer_la_liga',         label: 'La Liga' },
  { key: 'soccer_bundesliga',      label: 'Bundesliga' },
  { key: 'soccer_serie_a',         label: 'Serie A' },
  { key: 'soccer_ucl',             label: 'UCL' },
  { key: 'basketball_nba',         label: 'NBA' },
  { key: 'basketball_nbl',         label: 'NBL' },
  { key: 'americanfootball_nfl',   label: 'NFL' },
  { key: 'baseball_mlb',           label: 'MLB' },
  { key: 'icehockey_nhl',          label: 'NHL' },
  { key: 'mma_ufc',                label: 'UFC' },
  { key: 'mma_boxing',             label: 'Boxing' },
  { key: 'tennis_atp',             label: 'Tennis' },
  { key: 'golf_pga',               label: 'Golf' },
];

const EV_THRESHOLDS = [
  { label: 'All',  v: 0 },
  { label: '3%+',  v: 3 },
  { label: '5%+',  v: 5 },
  { label: '8%+',  v: 8 },
];

const BOOKIE_COL: Record<string, string> = {
  sportsbet: '#f97316', tab: '#1e63d9', bet365: '#00e676',
  ladbrokes: '#ef4444', neds: '#8b5cf6', pointsbet: '#ec4899',
  bluebet: '#3b82f6', betfair_ex_au: '#ffab00', unibet: '#00c853', betright: '#6366f1',
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
                (showing {rows.length} — <Link href="/pricing" style={{ color: '#2979ff' }}>upgrade for all</Link>)
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
      <div style={{ background: '#fff', border: '2px solid #dde8f5', borderRadius: 14, padding: 0, overflow: 'hidden', boxShadow: '0 4px 24px rgba(7,17,32,.10)' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#6b8aaa' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Scanning bookmakers...
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#6b8aaa' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
            No edges right now — try lowering the EV filter or check back when AU games are live.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr style={{ background: '#f5f9ff' }}>
                  {['Event / Sport','Selection','Bookie','Odds','Fair','Edge','Kelly','Start'].map((h, i) => (
                    <th key={h} style={{ fontSize: 10, fontWeight: 700, color: '#5a7a9a', textTransform: 'uppercase', letterSpacing: 1, padding: '12px 14px', textAlign: i >= 3 && i <= 6 ? 'right' : 'left', borderBottom: '2px solid #dde8f5', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const ev  = Number(row.ev_percent);
                  const col = BOOKIE_COL[row.bookie] || '#475569';
                  return (
                    <tr key={row.id || i} className="fadein" style={{ borderBottom: i < rows.length - 1 ? '1px solid #edf3ff' : 'none' }}>
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        {row.event_id ? (
                          <Link href={`/match/${encodeURIComponent(row.event_id)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#071120' }}>{row.event_name} <span style={{ color: '#2979ff', fontSize: 11 }}>→</span></div>
                          </Link>
                        ) : (
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#071120' }}>{row.event_name}</div>
                        )}
                        <div style={{ fontSize: 11, color: '#6b8aaa', marginTop: 2 }}>
                          {row.sport_key?.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontWeight: 600, color: '#1e3a5f' }}>{row.selection}</td>
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 5,
                          background: `${col}18`, color: col,
                          textTransform: 'capitalize', border: `1px solid ${col}30`,
                        }}>{row.bookie?.replace(/_/g, ' ')}</span>
                      </td>
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#008a3d' }}>
                        ${Number(row.bookie_odds).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: '#6b8aaa' }}>
                        ${Number(row.fair_odds).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, background: 'rgba(7,17,32,.08)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(ev * 5, 100)}%`, background: 'linear-gradient(90deg,#2979ff,#00c853)', borderRadius: 99 }} />
                          </div>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: '#008a3d', whiteSpace: 'nowrap' }}>
                            +{ev.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#6b8aaa' }}>
                        {Number(row.kelly_percent).toFixed(1)}%
                      </td>
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontSize: 12, color: '#6b8aaa', whiteSpace: 'nowrap' }}>
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
