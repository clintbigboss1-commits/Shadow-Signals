'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUser, type User } from '../../lib/auth';
import { WidgetConfig, GamesWidget, LeaguesWidget, StandingsWidget, PlayerWidget, TeamWidget, H2HWidget, POPULAR_LEAGUES } from '../../components/FootballWidgets';

type Tab = 'live' | 'leagues' | 'standings' | 'players';

export default function FootballPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('live');
  const [selectedLeague, setSelectedLeague] = useState<number>(39); // Default: PL
  const [playerId, setPlayerId] = useState<number | null>(null);

  useEffect(() => { setUser(getUser()); }, []);

  const leagues = POPULAR_LEAGUES;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <WidgetConfig />

      {/* ─── Top Nav ──────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,17,30,.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#22d3ee,#0891b2)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 16, color: '#030711', flexShrink: 0 }}>S</div>
            <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: -.3, color: '#e2e8f0' }}>
              SHADOW <span style={{ color: '#22d3ee' }}>ELITE</span>
            </span>
          </Link>

          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/dashboard" style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>← Dashboard</Link>
            {user && (
              <Link href="/pricing" style={{ fontSize: 13, fontWeight: 500, color: '#22d3ee' }}>
                {user.plan === 'free' ? 'Upgrade' : 'Plan'}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(34,211,238,.08),rgba(8,17,30,1) 60%)',
        borderBottom: '1px solid var(--border)', padding: '28px 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: -.5 }}>
            ⚽ Football Hub
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 6 }}>
            Live scores, stats, standings & player data powered by API-Sports
          </p>
        </div>
      </div>

      {/* ─── Tabs ─────────────────────────────── */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,.02)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 0, padding: '0 24px' }}>
          {[
            { key: 'live' as Tab,      label: '📡 Live Scores'  },
            { key: 'leagues' as Tab,   label: '🏆 Leagues'      },
            { key: 'standings' as Tab, label: '📊 Standings'    },
            { key: 'players' as Tab,   label: '👤 Players'      },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: 'transparent', border: 'none',
                color: activeTab === tab.key ? '#22d3ee' : '#64748b',
                borderBottom: activeTab === tab.key ? '2px solid #22d3ee' : '2px solid transparent',
                transition: 'all .15s', fontFamily: 'Inter, sans-serif',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content ──────────────────────── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>

        {/* ── LIVE SCORES ─────────────────────── */}
        {activeTab === 'live' && (
          <div>
            {/* League filter chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              <button
                onClick={() => setSelectedLeague(0)}
                style={{
                  padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  background: selectedLeague === 0 ? 'rgba(34,211,238,.15)' : 'rgba(255,255,255,.05)',
                  border: selectedLeague === 0 ? '1px solid rgba(34,211,238,.3)' : '1px solid var(--border)',
                  color: selectedLeague === 0 ? '#22d3ee' : '#94a3b8',
                }}
              >All Leagues</button>
              {leagues.map(l => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLeague(l.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    background: selectedLeague === l.id ? 'rgba(34,211,238,.15)' : 'rgba(255,255,255,.05)',
                    border: selectedLeague === l.id ? '1px solid rgba(34,211,238,.3)' : '1px solid var(--border)',
                    color: selectedLeague === l.id ? '#22d3ee' : '#94a3b8',
                  }}
                >{l.name}</button>
              ))}
            </div>

            <GamesWidget
              league={selectedLeague || undefined}
              refresh={20}
            />
          </div>
        )}

        {/* ── LEAGUES ─────────────────────────── */}
        {activeTab === 'leagues' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* League browser */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#e2e8f0' }}>
                Browse Leagues
              </h2>
              <div className="widget-card">
                <LeaguesWidget />
              </div>
            </div>

            {/* Quick league cards */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#e2e8f0' }}>
                Quick Access
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {leagues.slice(0, 8).map(l => (
                  <button
                    key={l.id}
                    onClick={() => { setActiveTab('standings'); setSelectedLeague(l.id); }}
                    style={{
                      padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                      textAlign: 'left', fontFamily: 'Inter, sans-serif',
                      background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)',
                      transition: 'border-color .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#22d3ee44'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{l.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{l.country}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STANDINGS ───────────────────────── */}
        {activeTab === 'standings' && (
          <div>
            {/* League selector */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {leagues.map(l => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLeague(l.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    background: selectedLeague === l.id ? 'rgba(34,211,238,.15)' : 'rgba(255,255,255,.05)',
                    border: selectedLeague === l.id ? '1px solid rgba(34,211,238,.3)' : '1px solid var(--border)',
                    color: selectedLeague === l.id ? '#22d3ee' : '#94a3b8',
                  }}
                >{l.name}</button>
              ))}
            </div>

            {selectedLeague > 0 && (
              <StandingsWidget
                leagueId={selectedLeague}
                season={leagues.find(l => l.id === selectedLeague)?.season || '2024'}
              />
            )}
          </div>
        )}

        {/* ── PLAYERS ─────────────────────────── */}
        {activeTab === 'players' && (
          <div>
            {/* Player search / ID input */}
            <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>
                  Player ID
                </label>
                <input
                  type="number"
                  placeholder="e.g. 141 (M. Wagué), 868 (S. Khedira)..."
                  value={playerId || ''}
                  onChange={e => setPlayerId(Number(e.target.value) || null)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)',
                    color: '#e2e8f0', fontSize: 14, fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Quick player buttons (from the CSV data you provided) */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                Quick Select (from your data)
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { id: 141, name: 'M. Wagué' },
                  { id: 868, name: 'S. Khedira' },
                  { id: 878, name: 'M. Mandžukić' },
                  { id: 2751, name: 'M. Leckie' },
                  { id: 19243, name: 'M. Obi' },
                  { id: 1220, name: 'Y. Zhirkov' },
                  { id: 18921, name: 'R. Brady' },
                  { id: 6796, name: 'T. Velaphi' },
                  { id: 6873, name: 'J. Elsey' },
                  { id: 7034, name: 'J. Clisby' },
                  { id: 21571, name: 'Hilton' },
                  { id: 22155, name: 'Y. Sanogo' },
                  { id: 179492, name: 'Edmilson' },
                  { id: 285193, name: 'R. Pazos' },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPlayerId(p.id)}
                    style={{
                      padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      background: playerId === p.id ? 'rgba(34,211,238,.15)' : 'rgba(255,255,255,.05)',
                      border: playerId === p.id ? '1px solid rgba(34,211,238,.3)' : '1px solid var(--border)',
                      color: playerId === p.id ? '#22d3ee' : '#94a3b8',
                    }}
                  >{p.name}</button>
                ))}
              </div>
            </div>

            {/* Player widget */}
            {playerId ? (
              <PlayerWidget
                playerId={playerId}
                season="2024"
                showStats
                showTrophies
                showInjuries
              />
            ) : (
              <div style={{
                padding: 40, textAlign: 'center', borderRadius: 12,
                border: '1px dashed var(--border)', background: 'rgba(255,255,255,.02)',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                  Select a player to view their profile
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  Pick from the quick select buttons above or enter a Player ID
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}