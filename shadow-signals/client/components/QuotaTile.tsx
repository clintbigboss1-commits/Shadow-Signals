'use client';

import { useEffect, useState } from 'react';
import API from '../lib/api';

interface QuotaData {
  the_odds_api: {
    remaining: number | null;
    used: number | null;
    monthly_limit: number;
    soft_limit: number;
    last_call_at: string | null;
    status: 'ok' | 'warning' | 'critical' | 'unknown';
  };
  calls_24h: number;
  cache_size: number;
}

const STATUS_COLOR: Record<string, string> = {
  ok: '#00e676', warning: '#ffab00', critical: '#ef4444', unknown: '#64748b',
};

export default function QuotaTile() {
  const [data, setData]     = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    API.get('/admin/quota')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, minHeight: 100, display: 'grid', placeItems: 'center' }}>
        <div className="spinner" style={{ width: 20, height: 20 }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ background: 'var(--bg2)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 12, color: '#ef4444' }}>{error || 'No quota data'}</div>
      </div>
    );
  }

  const { the_odds_api, calls_24h, cache_size } = data;
  const used       = the_odds_api.used ?? 0;
  const remaining  = the_odds_api.remaining ?? the_odds_api.monthly_limit;
  const pct        = Math.round((used / the_odds_api.monthly_limit) * 100);
  const barColor   = STATUS_COLOR[the_odds_api.status];

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14 }}>
        The Odds API — Monthly Quota
      </div>

      {/* Bar */}
      <div style={{ height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: 99, transition: 'width .4s' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9eb1c8', marginBottom: 16 }}>
        <span style={{ color: barColor, fontWeight: 700 }}>{pct}% used</span>
        <span>{remaining.toLocaleString()} credits remaining</span>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { label: 'Used this month', value: used.toLocaleString() },
          { label: 'Calls last 24h',  value: calls_24h.toString() },
          { label: 'Cached events',   value: cache_size.toLocaleString() },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,.02)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 16, color: '#e2e8f0', marginBottom: 3 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {the_odds_api.last_call_at && (
        <div style={{ fontSize: 11, color: '#334155', marginTop: 12 }}>
          Last API call: {new Date(the_odds_api.last_call_at).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}
        </div>
      )}

      {the_odds_api.status !== 'ok' && (
        <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: `${barColor}14`, border: `1px solid ${barColor}30`, fontSize: 12, color: barColor }}>
          {the_odds_api.status === 'critical' ? '⚠ Critical: under 1,000 credits. Top up now.' : '⚡ Warning: approaching soft limit.'}
        </div>
      )}
    </div>
  );
}
