import React, { useState, useEffect } from 'react';
import {
  fetchAuditLogs,
  fetchAuditMetrics,
  fetchAgents,
  getAuditExportUrlCsv,
  getAuditExportUrlJson,
  AuditEvaluationResult,
  AuditMetrics,
  AgentPolicy
} from '../services/api';
import { AuditLogDetailModal } from '../components/AuditLogDetailModal';
import {
  Shield,
  Lock,
  Globe,
  AlertTriangle,
  CheckCircle,
  Search,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditEvaluationResult[]>([]);
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null);
  const [agents, setAgents] = useState<AgentPolicy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Pagination State (FR-29, FR-32)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Selected Detail Inspector State (FR-33)
  const [selectedEntry, setSelectedEntry] = useState<AuditEvaluationResult | null>(null);

  const loadAuditData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsRes, metricsRes, agentsRes] = await Promise.all([
        fetchAuditLogs({
          search: searchQuery,
          status: statusFilter,
          agent: agentFilter,
          page: page,
          page_size: pageSize
        }),
        fetchAuditMetrics(),
        fetchAgents()
      ]);

      setLogs(logsRes.items);
      setTotalRecords(logsRes.total);
      setTotalPages(logsRes.total_pages);
      setMetrics(metricsRes);
      setAgents(agentsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit trail logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, [searchQuery, statusFilter, agentFilter, page]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setAgentFilter('all');
    setPage(1);
  };

  const getClassificationBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'pii':
        return (
          <span className="badge badge-pii">
            <Shield size={11} />
            <span>PII</span>
          </span>
        );
      case 'confidential':
        return (
          <span className="badge badge-confidential">
            <Lock size={11} />
            <span>Confidential</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-public">
            <Globe size={11} />
            <span>Public</span>
          </span>
        );
    }
  };

  const exportCsvUrl = getAuditExportUrlCsv({
    search: searchQuery,
    status: statusFilter,
    agent: agentFilter
  });

  const exportJsonUrl = getAuditExportUrlJson({
    search: searchQuery,
    status: statusFilter,
    agent: agentFilter
  });

  return (
    <div className="audit-log-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem' }}>
            Governance Audit Trail & Reporting Engine
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Comprehensive immutable audit log of AI agent data access events, compliance metrics, and exportable reports (SRS §3.6).
          </p>
        </div>

        {/* Toolbar Download Buttons (FR-30, FR-34) */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a
            href={exportCsvUrl}
            download
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontSize: '0.85rem' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </a>
          <a
            href={exportJsonUrl}
            download
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontSize: '0.85rem' }}
          >
            <Download size={14} />
            <span>Export JSON</span>
          </a>
          <button onClick={loadAuditData} className="btn btn-secondary" title="Refresh Audit Trail">
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* KPI Metrics Dashboard Cards (FR-31) */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div style={{ padding: '1.1rem 1.25rem', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
              Total Evaluations
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ffffff' }}>
              {metrics.total_events}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '0.2rem' }}>
              Persistent Audit Records
            </div>
          </div>

          <div style={{ padding: '1.1rem 1.25rem', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
              Compliance Rate
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: metrics.compliance_rate_percent >= 80 ? '#10b981' : '#f87171' }}>
              {metrics.compliance_rate_percent}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {metrics.compliant_count} Compliant Accesses
            </div>
          </div>

          <div style={{ padding: '1.1rem 1.25rem', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
              Flagged Violations
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: metrics.flagged_count > 0 ? '#ef4444' : '#10b981' }}>
              {metrics.flagged_count}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              DataHub & GitHub Alerts Sent
            </div>
          </div>

          <div style={{ padding: '1.1rem 1.25rem', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
              Top Violating Agent
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {metrics.top_violating_agent}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              High-Risk Identity Monitor
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar (FR-29) */}
      <div style={{
        padding: '1rem 1.25rem',
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Search input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by Agent, Dataset, or Event ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem 0.55rem 2.4rem',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
        </div>

        {/* Status Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '0.55rem 0.85rem',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">All Statuses (OK & FLAGGED)</option>
            <option value="OK">Compliant Only (OK)</option>
            <option value="FLAGGED">Violations Only (FLAGGED)</option>
          </select>
        </div>

        {/* Agent Filter Dropdown */}
        <div>
          <select
            value={agentFilter}
            onChange={(e) => {
              setAgentFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '0.55rem 0.85rem',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">All Registered Agents</option>
            {agents.map((ag) => (
              <option key={ag.id} value={ag.name}>{ag.name}</option>
            ))}
          </select>
        </div>

        {(searchQuery || statusFilter !== 'all' || agentFilter !== 'all') && (
          <button
            onClick={handleClearFilters}
            style={{
              padding: '0.55rem 0.85rem',
              backgroundColor: 'transparent',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Audit Log Data Table */}
      <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {error && (
          <div style={{ padding: '1rem', color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderBottom: '1px solid var(--border-color)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading audit trail records...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No audit records match the selected filter criteria.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.775rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Event ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>Timestamp</th>
                <th style={{ padding: '0.85rem 1rem' }}>AI Agent Identity</th>
                <th style={{ padding: '0.85rem 1rem' }}>Target Dataset</th>
                <th style={{ padding: '0.85rem 1rem' }}>Operation</th>
                <th style={{ padding: '0.85rem 1rem' }}>Sensitivity</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedEntry(item)}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <code style={{ fontSize: '0.775rem', color: '#94a3b8' }}>{item.event_id}</code>
                  </td>

                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {new Date(item.timestamp).toLocaleString()}
                  </td>

                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#ffffff' }}>
                    {item.agent_name}
                  </td>

                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#60a5fa' }}>
                    {item.dataset_name}
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ fontSize: '0.775rem', padding: '0.2rem 0.5rem', backgroundColor: '#1e293b', borderRadius: '4px', color: '#e2e8f0' }}>
                      {item.access_type.toUpperCase()}
                    </span>
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    {getClassificationBadge(item.dataset_classification)}
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    {item.status === 'OK' ? (
                      <span className="badge badge-ok">
                        <CheckCircle size={12} /> Permitted
                      </span>
                    ) : (
                      <span className="badge badge-flagged">
                        <AlertTriangle size={12} /> Flagged Violation
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEntry(item);
                      }}
                      style={{
                        padding: '0.3rem 0.65rem',
                        backgroundColor: '#1e293b',
                        color: '#ffffff',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.775rem'
                      }}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination Bar Controls (FR-32) */}
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: '#1e293b',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            Showing Page <strong style={{ color: '#ffffff' }}>{page}</strong> of <strong style={{ color: '#ffffff' }}>{totalPages}</strong> ({totalRecords} Total Records)
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.35rem 0.75rem',
                backgroundColor: page === 1 ? '#0f172a' : '#0f172a',
                color: page === 1 ? 'var(--text-muted)' : '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.35rem 0.75rem',
                backgroundColor: page >= totalPages ? '#0f172a' : '#0f172a',
                color: page >= totalPages ? 'var(--text-muted)' : '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Audit Log Entry Detail Modal (FR-33) */}
      {selectedEntry && (
        <AuditLogDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
};
