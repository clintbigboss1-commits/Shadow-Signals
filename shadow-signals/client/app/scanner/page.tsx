'use client';

import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import EVTable from '../../components/EVTable';

export default function Scanner() {
  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', background: '#030711', fontFamily: 'Inter, sans-serif' }}>
        <Navbar />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>+EV Scanner</h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Full access — all edges across 12 AU bookies, updated every 45 seconds.
            </p>
          </div>
          <EVTable planLimit={999} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
