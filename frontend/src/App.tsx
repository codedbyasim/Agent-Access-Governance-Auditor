import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Sidebar } from './components/Layout/Sidebar';
import { DataHubBanner } from './components/DataHubBanner';
import { fetchHealthStatus, HealthStatus } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Dashboard } from './pages/Dashboard';
import { Datasets } from './pages/Datasets';
import { Agents } from './pages/Agents';
import { AuditRunner } from './pages/AuditRunner';
import { AuditLog } from './pages/AuditLog';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { GitHubCallback } from './pages/GitHubCallback';
import { User, LogOut, Github } from 'lucide-react';

const TopBarUserMenu: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Link
          to="/login"
          style={{
            fontSize: '0.85rem',
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: 600,
            padding: '0.4rem 0.85rem',
            backgroundColor: '#1e293b',
            borderRadius: '6px',
            border: '1px solid var(--border-color)'
          }}
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          style={{
            fontSize: '0.85rem',
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: 600,
            padding: '0.4rem 0.85rem',
            backgroundColor: '#2563eb',
            borderRadius: '6px'
          }}
        >
          Register
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#ffffff' }}>
        <div style={{ padding: '0.35rem', backgroundColor: '#1e293b', borderRadius: '50%', color: '#60a5fa', display: 'flex' }}>
          <User size={14} />
        </div>
        <span style={{ fontWeight: 600 }}>{user.email}</span>
        {user.has_github_connected && (
          <span className="badge badge-ok" style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem' }}>
            <Github size={10} /> @{user.github_username}
          </span>
        )}
      </div>

      <button
        onClick={logout}
        title="Sign Out"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.4rem 0.75rem',
          backgroundColor: '#1e293b',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 600
        }}
      >
        <LogOut size={14} />
        <span>Logout</span>
      </button>
    </div>
  );
};

const AppShell: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await fetchHealthStatus();
      setHealth(status);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <header className="top-bar">
          <DataHubBanner health={health} loading={loading} error={error} />
          <TopBarUserMenu />
        </header>

        <div className="content-area">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/github/callback" element={<GitHubCallback />} />

            <Route path="/" element={<ProtectedRoute><Dashboard health={health} loading={loading} onRefresh={loadHealth} /></ProtectedRoute>} />
            <Route path="/datasets" element={<ProtectedRoute><Datasets /></ProtectedRoute>} />
            <Route path="/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
            <Route path="/run-audit" element={<ProtectedRoute><AuditRunner /></ProtectedRoute>} />
            <Route path="/audit-log" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
