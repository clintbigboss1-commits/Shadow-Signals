'use client';

import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import ArbTable from '../../components/ArbTable';

export default function ArbPage() {
  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', background: '#030711', fontFamily: 'Inter, sans-serif' }}>
        <Navbar />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="pulse-dot" style={{ background: '#f59e0b', boxShadow: '0 0 10px #f59e0b' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Arbitrage Finder
              </span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>Guaranteed Profit Opportunities</h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              When two bookies disagree, the gap is your guaranteed profit. No risk, no variance.
            </p>
          </div>
          <ArbTable />
        </div>
      </div>
    </ProtectedRoute>
  );
}
