import React from 'react';
import { AuditEvaluationResult } from '../services/api';
import { X, Shield, Lock, Globe, AlertTriangle, CheckCircle, Github, Database, FileText, Calendar } from 'lucide-react';

interface Props {
  entry: AuditEvaluationResult;
  onClose: () => void;
}

export const AuditLogDetailModal: React.FC<Props> = ({ entry, onClose }) => {
  const getClassificationBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'pii':
        return (
          <span className="badge badge-pii">
            <Shield size={12} />
            <span>PII Sensitive</span>
          </span>
        );
      case 'confidential':
        return (
          <span className="badge badge-confidential">
            <Lock size={12} />
            <span>Confidential</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-public">
            <Globe size={12} />
            <span>Public Data</span>
          </span>
        );
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <header className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '0.5rem',
              backgroundColor: entry.status === 'OK' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              borderRadius: '8px',
              color: entry.status === 'OK' ? '#10b981' : '#ef4444',
              display: 'flex'
            }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Audit Event Detail</h2>
              <code style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{entry.event_id}</code>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </header>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Status Banner */}
          <div style={{
            padding: '1rem 1.25rem',
            backgroundColor: entry.status === 'OK' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${entry.status === 'OK' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {entry.status === 'OK' ? (
                <span className="badge badge-ok" style={{ fontSize: '0.85rem' }}>
                  <CheckCircle size={14} /> Permitted Access (OK)
                </span>
              ) : (
                <span className="badge badge-flagged" style={{ fontSize: '0.85rem' }}>
                  <AlertTriangle size={14} /> Flagged Policy Violation
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} />
              <span>{new Date(entry.timestamp).toUTCString()}</span>
            </div>
          </div>

          {/* Grid Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div style={{ padding: '0.85rem 1rem', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Executing AI Agent</span>
              <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>{entry.agent_name}</strong>
            </div>

            <div style={{ padding: '0.85rem 1rem', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Target Dataset</span>
              <strong style={{ fontSize: '0.95rem', color: '#60a5fa' }}>{entry.dataset_name}</strong>
            </div>

            <div style={{ padding: '0.85rem 1rem', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Operation Access Type</span>
              <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>{entry.access_type.toUpperCase()}</span>
            </div>

            <div style={{ padding: '0.85rem 1rem', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Dataset Sensitivity Tag</span>
              {getClassificationBadge(entry.dataset_classification)}
            </div>
          </div>

          {/* Violation Details Box */}
          {entry.violation_reason && (
            <div style={{ padding: '1rem', backgroundColor: '#0f172a', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>Compliance Policy Violation Reason</span>
              <p style={{ fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.5, margin: 0 }}>
                {entry.violation_reason}
              </p>
            </div>
          )}

          {/* Write-Back Integration Status */}
          <div style={{ padding: '1rem', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Automated Write-Back & Notification Triggers</span>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{
                padding: '0.35rem 0.75rem',
                backgroundColor: entry.datahub_written ? 'rgba(37, 99, 235, 0.15)' : '#1e293b',
                color: entry.datahub_written ? '#60a5fa' : 'var(--text-muted)',
                borderRadius: '4px',
                fontSize: '0.8rem',
                border: '1px solid var(--border-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <Database size={13} />
                <span>{entry.datahub_written ? '✓ DataHub Tag & Note Written' : 'DataHub Write-Back Skipped'}</span>
              </span>

              <span style={{
                padding: '0.35rem 0.75rem',
                backgroundColor: entry.github_issue_created ? 'rgba(34, 197, 94, 0.15)' : '#1e293b',
                color: entry.github_issue_created ? '#4ade80' : 'var(--text-muted)',
                borderRadius: '4px',
                fontSize: '0.8rem',
                border: '1px solid var(--border-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <Github size={13} />
                <span>{entry.github_issue_created ? '✓ GitHub Issue Alert Created' : '⚡ Local Alert Logged'}</span>
              </span>
            </div>
          </div>
        </div>

        <footer className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close Inspector
          </button>
        </footer>
      </div>
    </div>
  );
};
