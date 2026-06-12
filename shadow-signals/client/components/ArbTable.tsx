'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import API from '../lib/api';
import { getSocket, connectSocket } from '../lib/socket';
import { getToken } from '../lib/auth';

interface Arb {
  id: string;
  sport_key: string;
  event_name: string;
  bookie_1: string;
  selection_1: string;
  odds_1: number | string;
  bookie_2: string;
  selection_2: string;
  odds_2: number | string;
  profit_percent: number | string;
  stake_1_percent: number | string;
  stake_2_percent: number | string;
}

export default function ArbTable() {
  const [data, setData]         = useState<Arb[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [stake, setStake]       = useState(500);

  const fetch = useCallback(async () => {
    try {
      const res = await API.get('/arb');
      setData(res.data.data || []);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      setError(e.response?.status === 403 ? 'upgrade' : 'error');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch();
    const t = setInterval(fetch, 30000);

    // Real-time arb updates via WebSocket
    const token = getToken();
    if (token) connectSocket(token);
    const s = getSocket();
    const onArb = (arbs: Arb[]) => { if (arbs?.length) setData(arbs); };
    s.on('arb:update', onArb);

    return () => { clearInterval(t); s.off('arb:update', onArb); };
  }, [fetch]);

  if (error === 'upgrade') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <h3 style={{ fontWeight: 800, marginBottom: 8 }}>PRO plan required</h3>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Arb finder is available on PRO ($19.99/mo) and above.</p>
        <Link href="/pricing" className="btn btn-primary">Upgrade →</Link>
      </div>
    );
  }

  if (loading) return (
    <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
      <div className="spinner" style={{ margin: '0 auto 12px' }} />
      Scanning for arbs...
    </div>
  );

  if (data.length === 0) return (
    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>🎯</div>
      <p style={{ color: '#64748b' }}>No arbs right now. Check back when more games are live.</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="section-label">Arbitrage Finder</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{data.length} opportunities</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'none', letterSpacing: 0, marginBottom: 0 }}>Stake:</label>
          <input type="number" value={stake} onChange={e => setStake(Number(e.target.value))} style={{ width: 100 }} />
        </div>
      </div>

      {/* Arb rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((arb, i) => {
          const profit = (stake * Number(arb.profit_percent)) / 100;
          const s1     = (stake * Number(arb.stake_1_percent)) / 100;
          const s2     = (stake * Number(arb.stake_2_percent)) / 100;

          return (
            <div key={arb.id || i} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3, textTransform: 'uppercase', letterSpacing: .7 }}>
                    {arb.sport_key?.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontWeight: 700 }}>{arb.event_name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#00c853' }}>+{Number(arb.profit_percent).toFixed(2)}%</div>
                  <div style={{ fontSize: 12, color: '#00c853' }}>+${profit.toFixed(2)} locked in</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                {[
                  { bookie: arb.bookie_1, sel: arb.selection_1, odds: arb.odds_1, s: s1 },
                  { bookie: arb.bookie_2, sel: arb.selection_2, odds: arb.odds_2, s: s2 },
                ].map((side, j) => (
                  <div key={j} style={{ background: '#0d1526', border: '1px solid #1e2d45', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize', marginBottom: 4 }}>
                      {side.bookie?.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>{side.sel}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#00c853', fontSize: 18 }}>
                        ${Number(side.odds).toFixed(2)}
                      </span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>Stake ${side.s.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 13, color: '#64748b', padding: '8px 12px', background: '#0d1526', borderRadius: 8 }}>
                Total in: <strong style={{ color: '#e2e8f0' }}>${stake.toFixed(2)}</strong> →
                Guaranteed out: <strong style={{ color: '#00c853' }}>${(stake + profit).toFixed(2)}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
