'use client';

import { useEffect, useState, useRef } from 'react';
import { getSocket, connectSocket } from '../lib/socket';
import { getToken } from '../lib/auth';

interface Bucket { scans: number; edges: number }
interface PulseTick { buckets: Bucket[]; totals: { scans: number; edges: number }; window_ms: number }

// Real-time market activity histogram, driven entirely by pulse:* socket events.
// No synthetic data — if no scans have happened the panel is empty.
export default function MarketPulse() {
  const [buckets, setBuckets]   = useState<Bucket[]>([]);
  const [totals, setTotals]     = useState({ scans: 0, edges: 0 });
  const [recentEdges, setRecent] = useState<{ event: string; ev_percent: number; ts: number }[]>([]);
  const edgeRef = useRef(recentEdges);
  edgeRef.current = recentEdges;

  useEffect(() => {
    const token = getToken();
    if (token) connectSocket(token);
    const s = getSocket();

    const onTick = (data: PulseTick) => {
      setBuckets(data.buckets || []);
      setTotals(data.totals || { scans: 0, edges: 0 });
    };
    const onEdge = (data: { event: string; ev_percent: number; ts: number }) => {
      setRecent(prev => [data, ...prev].slice(0, 5));
    };

    s.on('pulse:tick', onTick);
    s.on('pulse:edge', onEdge);
    return () => { s.off('pulse:tick', onTick); s.off('pulse:edge', onEdge); };
  }, []);

  const maxScans = Math.max(1, ...buckets.map(b => b.scans + b.edges));

  if (buckets.length === 0 && totals.scans === 0) {
    return (
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>Market Pulse</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
          Waiting for scanner activity...
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 }}>Market Pulse</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Last 60 seconds</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 700 }}>{totals.scans} scans</div>
          {totals.edges > 0 && <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>{totals.edges} edges</div>}
        </div>
      </div>

      {/* Histogram */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48, marginBottom: 12 }}>
        {buckets.map((b, i) => {
          const h = Math.round(((b.scans + b.edges) / maxScans) * 100);
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
              {b.edges > 0 && (
                <div style={{ background: 'var(--green)', borderRadius: '2px 2px 0 0', height: `${Math.round((b.edges / maxScans) * 100)}%`, minHeight: 3 }} />
              )}
              {b.scans > 0 && (
                <div style={{ background: 'rgba(41,121,255,.4)', height: `${Math.round((b.scans / maxScans) * 100)}%`, minHeight: 2 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginBottom: recentEdges.length > 0 ? 12 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#64748b' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(41,121,255,.4)' }} /> Scans
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#64748b' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--green)' }} /> Edge found
        </div>
      </div>

      {/* Recent high-EV edges */}
      {recentEdges.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>Recent Edges</div>
          {recentEdges.slice(0, 3).map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < 2 ? '1px solid var(--border2)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{e.event}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--green)', flexShrink: 0 }}>+{e.ev_percent.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
