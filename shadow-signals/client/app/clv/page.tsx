'use client';

import { useState, FormEvent } from 'react';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import CLVStats from '../../components/CLVStats';
import API from '../../lib/api';

interface Form {
  event_name: string; sport: string; selection: string; bookie: string;
  odds_taken: string; fair_odds: string; ev_percent: string;
  stake_aud: string; event_time: string; notes: string;
}

const EMPTY: Form = {
  event_name: '', sport: '', selection: '', bookie: '',
  odds_taken: '', fair_odds: '', ev_percent: '',
  stake_aud: '', event_time: '', notes: '',
};

const FIELDS: { key: keyof Form; label: string; placeholder: string; type?: string; required?: boolean }[] = [
  { key: 'event_name', label: 'Event *',     placeholder: 'Collingwood v Carlton', required: true },
  { key: 'sport',      label: 'Sport',        placeholder: 'AFL' },
  { key: 'selection',  label: 'Selection *',  placeholder: 'Collingwood', required: true },
  { key: 'bookie',     label: 'Bookie',       placeholder: 'Sportsbet' },
  { key: 'odds_taken', label: 'Odds *',       placeholder: '2.15', type: 'number', required: true },
  { key: 'fair_odds',  label: 'Fair odds',    placeholder: '1.97', type: 'number' },
  { key: 'ev_percent', label: 'EV %',         placeholder: '9.1',  type: 'number' },
  { key: 'stake_aud',  label: 'Stake AUD *',  placeholder: '100',  type: 'number', required: true },
  { key: 'event_time', label: 'Event time',   placeholder: '',     type: 'datetime-local' },
  { key: 'notes',      label: 'Notes',        placeholder: 'Optional notes...' },
];

export default function CLVPage() {
  const [form, setForm]         = useState<Form>(EMPTY);
  const [logging, setLogging]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');
  const [refresh, setRefresh]   = useState(0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLogging(true); setError('');
    try {
      await API.post('/bets', {
        ...form,
        odds_taken:  parseFloat(form.odds_taken),
        fair_odds:   form.fair_odds  ? parseFloat(form.fair_odds)  : null,
        ev_percent:  form.ev_percent ? parseFloat(form.ev_percent) : null,
        stake_aud:   parseFloat(form.stake_aud),
        event_time:  form.event_time || null,
        market:      'h2h',
      });
      setSuccess(true);
      setForm(EMPTY);
      setRefresh(r => r + 1);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to log bet');
    } finally { setLogging(false); }
  }

  return (
    <ProtectedRoute>
      <div className="page">
        <Navbar />
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px' }}>

          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>CLV Tracker</h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>Log every bet and track your closing line value over time.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

            {/* Form */}
            <div className="card" style={{ position: 'sticky', top: 70 }}>
              <div style={{ fontWeight: 700, marginBottom: 16 }}>📝 Log a bet</div>

              {success && <div className="alert-ok" style={{ marginBottom: 12 }}>✅ Bet logged</div>}
              {error   && <div className="alert-error" style={{ marginBottom: 12 }}>{error}</div>}

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {FIELDS.map(f => (
                  <div key={f.key}>
                    <label>{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      required={f.required}
                    />
                  </div>
                ))}
                <button type="submit" className="btn btn-primary" disabled={logging} style={{ marginTop: 4, justifyContent: 'center' }}>
                  {logging ? 'Logging...' : 'Log bet →'}
                </button>
              </form>
            </div>

            {/* Stats */}
            <div key={refresh}>
              <CLVStats />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
