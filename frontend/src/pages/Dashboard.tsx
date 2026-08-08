import React from 'react';
import { HealthStatus } from '../services/api';
import { ShieldCheck, AlertOctagon, Database, Bot, RefreshCw } from 'lucide-react';

interface Props {
  health: HealthStatus | null;
  loading: boolean;
  onRefresh: () => void;
}

export const Dashboard: React.FC<Props> = ({ health, loading, onRefresh }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>System Overview</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Real-time compliance monitoring and DataHub metadata governance status
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Health</span>
        </button>
      </div>

      <div className="card-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">DataHub Connection</div>
              <div className="stat-value" style={{ color: health?.datahub_connected ? '#34d399' : '#f87171' }}>
                {health?.datahub_connected ? 'Connected' : 'Unreachable'}
              </div>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', color: '#60a5fa' }}>
              <Database size={20} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            GMS: <span className="code-tag">{health?.datahub_url || 'http://localhost:8080'}</span>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">Backend Engine Status</div>
              <div className="stat-value" style={{ color: health?.database_connected ? '#34d399' : '#f87171' }}>
                {health?.status === 'healthy' ? 'Healthy' : 'Degraded'}
              </div>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', color: '#34d399' }}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            SQLite Persistence: <span style={{ color: '#34d399', fontWeight: 600 }}>Active</span>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">Registered AI Agents</div>
              <div className="stat-value">--</div>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(168, 85, 247, 0.1)', borderRadius: '6px', color: '#c084fc' }}>
              <Bot size={20} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Policies configured in database
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">Active Governance Flags</div>
              <div className="stat-value" style={{ color: '#f87171' }}>--</div>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', color: '#f87171' }}>
              <AlertOctagon size={20} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            DataHub write-back risk tags
          </div>
        </div>
      </div>

      <div className="table-container" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#ffffff' }}>
          Skeleton System Verification
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          This skeleton confirms end-to-end communication between the React frontend, FastAPI backend API, local SQLite store, and running Docker DataHub instance.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              BACKEND HEALTH RESPONSE
            </div>
            <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#93c5fd', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(health, null, 2)}
            </pre>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              DISCLOSURE OF SIMULATED VS. LIVE DATA (NFR-15)
            </div>
            <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', lineHeight: '1.6' }}>
              <li><strong>Live DataHub Reads:</strong> Catalog metadata, classifications, and ownership are pulled directly from DataHub GMS (`http://localhost:8080`).</li>
              <li><strong>Live DataHub Write-Back:</strong> Governance-risk tags and structured audit notes are written directly back into DataHub entities.</li>
              <li><strong>Simulated Data:</strong> AI agent access events are simulated for auditing walkthroughs per SRS §2.6.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
