'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import { getUser } from '../../lib/auth';
import type { User } from '../../lib/auth';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 28 }}>Settings</h1>

          {user && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Account section */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Account</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase' }}>Email</label>
                    <div style={{ fontSize: 14, color: 'var(--text)' }}>{user.email}</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase' }}>Name</label>
                    <div style={{ fontSize: 14, color: 'var(--text)' }}>{user.name}</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase' }}>Plan</label>
                    <div style={{ fontSize: 14, color: 'var(--cyan)', fontWeight: 600, textTransform: 'capitalize' }}>{user.plan}</div>
                  </div>
                </div>
              </div>

              {/* Security section */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Security</h2>
                <button style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Change password
                </button>
              </div>

              {/* Notifications section */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Notifications</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                  <span style={{ fontSize: 14 }}>Edge alerts (live signals)</span>
                  <input type="checkbox" defaultChecked style={{ cursor: 'pointer', width: 18, height: 18 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                  <span style={{ fontSize: 14 }}>Confidence changes (when a signal improves)</span>
                  <input type="checkbox" defaultChecked style={{ cursor: 'pointer', width: 18, height: 18 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                  <span style={{ fontSize: 14 }}>Weekly digest (top opportunities)</span>
                  <input type="checkbox" defaultChecked style={{ cursor: 'pointer', width: 18, height: 18 }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
