'use client';

import { useEffect, useState, useCallback } from 'react';
import API from '../lib/api';

interface Summary {
  total_bets: number; wins: number; losses: number;
  total_profit: number; avg_ev: number; avg_clv: number;
  total_staked: number; roi: number;
}
interface ByBookie { bookie: string; bets: number; profit: number; avg_clv: number; }
interface BySport  { sport: string;  bets: number; profit: number; avg_ev: number;  }
interface CLVData  { summary: Summary; byBookie: ByBookie[]; bySport: BySport[]; }

function pnlColour(v: number) { return v >= 0 ? '#10b981' : '#ef4444'; }
function pnlFmt(v: number)    { return `${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(2)}`; }

export default function CLVStats() {
  const [data, setData]     = useState<CLVData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try { const r = await API.get('/bets/clv'); setData(r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return (
    <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
      <div className="spinner" style={{ margin: '0 auto 12px' }} />Loading stats...
    </div>
  );

  const s = data?.summary;
  const total = Number(s?.total_bets || 0);
  const winRate = total > 0 ? ((Number(s?.wins || 0) / total) * 100).toFixed(1) : '—';

  if (total === 0) return (
    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>📊</div>
      <p style={{ color: '#64748b', fontSize: 14 }}>No bets logged yet. Use the form to record your first bet.</p>
    </div>
  );

  const stats = [
    { label: 'P&L',       value: pnlFmt(Number(s?.total_profit || 0)), color: pnlColour(Number(s?.total_profit)), mono: true },
    { label: 'Bets',      value: String(total),                         color: '#e2e8f0', mono: false },
    { label: 'Win rate',  value: `${winRate}%`,                         color: '#f59e0b', mono: true },
    { label: 'Avg EV',    value: `+${Number(s?.avg_ev || 0).toFixed(2)}%`, color: '#10b981', mono: true },
    { label: 'Avg CLV',   value: `+${Number(s?.avg_clv || 0).toFixed(2)}%`, color: '#10b981', mono: true },
    { label: 'ROI',       value: `${Number(s?.roi || 0).toFixed(2)}%`,  color: pnlColour(Number(s?.roi)), mono: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        {stats.map(c => (
          <div key={c.label} className="card" style={{ padding: 16 }}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-val" style={{ color: c.color, fontFamily: c.mono ? 'JetBrains Mono, monospace' : 'inherit', fontSize: 22 }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* By bookie */}
      {data?.byBookie && data.byBookie.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e2d45', fontWeight: 700 }}>By bookie</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Bookie</th>
                <th style={{ textAlign: 'right' }}>Bets</th>
                <th style={{ textAlign: 'right' }}>P&L</th>
                <th style={{ textAlign: 'right' }}>Avg CLV</th>
              </tr>
            </thead>
            <tbody>
              {data.byBookie.map((b, i) => (
                <tr key={i}>
                  <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{b.bookie?.replace(/_/g, ' ')}</td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>{b.bets}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: pnlColour(Number(b.profit)) }}>
                    {pnlFmt(Number(b.profit))}
                  </td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>+{Number(b.avg_clv).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* By sport */}
      {data?.bySport && data.bySport.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e2d45', fontWeight: 700 }}>By sport</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Sport</th>
                <th style={{ textAlign: 'right' }}>Bets</th>
                <th style={{ textAlign: 'right' }}>P&L</th>
                <th style={{ textAlign: 'right' }}>Avg EV</th>
              </tr>
            </thead>
            <tbody>
              {data.bySport.map((s, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{s.sport || '—'}</td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>{s.bets}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: pnlColour(Number(s.profit)) }}>
                    {pnlFmt(Number(s.profit))}
                  </td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>+{Number(s.avg_ev).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
