import React, { useState } from 'react';
import { DatasetDetail, ClassificationLevel, updateDatasetClassification, remediateDatasetViolation } from '../services/api';
import { X, Shield, Lock, Globe, AlertTriangle, Database, Check, Edit3, Tag, FileText, ShieldCheck } from 'lucide-react';

interface Props {
  dataset: DatasetDetail;
  onClose: () => void;
  onUpdated: () => void;
}

export const DatasetDetailModal: React.FC<Props> = ({ dataset, onClose, onUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [selectedClassification, setSelectedClassification] = useState<ClassificationLevel>(dataset.classification);
  const [submitting, setSubmitting] = useState(false);
  const [remediating, setRemediating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSaveClassification = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await updateDatasetClassification(dataset.name, selectedClassification);
      setEditing(false);
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update classification tag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemediate = async () => {
    setError(null);
    setRemediating(true);
    try {
      await remediateDatasetViolation(dataset.name);
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to remediate dataset risk tag');
    } finally {
      setRemediating(false);
    }
  };

  const copyUrn = () => {
    navigator.clipboard.writeText(dataset.urn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getClassificationBadge = (level: ClassificationLevel) => {
    switch (level) {
      case 'pii':
        return (
          <span className="badge badge-pii">
            <Shield size={13} />
            <span>PII Sensitive</span>
          </span>
        );
      case 'confidential':
        return (
          <span className="badge badge-confidential">
            <Lock size={13} />
            <span>Confidential</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-public">
            <Globe size={13} />
            <span>Public Data</span>
          </span>
        );
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem'
    }}>
      <div style={{
        backgroundColor: '#151c2c',
        border: '1px solid #2a364f',
        borderRadius: '10px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.6rem', backgroundColor: '#0f172a', borderRadius: '8px', color: '#60a5fa', border: '1px solid #2a364f' }}>
            <Database size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>
                {dataset.name}
              </h2>
              {getClassificationBadge(dataset.classification)}
              {dataset.has_governance_violation && (
                <span className="badge badge-flagged">
                  <AlertTriangle size={13} />
                  <span>FLAGGED (Governance Risk)</span>
                </span>
              )}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Domain: <strong style={{ color: '#ffffff' }}>{dataset.domain || 'Analytics'}</strong> | Platform: <strong style={{ color: '#ffffff' }}>{dataset.platform || 'Snowflake'}</strong>
            </div>
          </div>
        </div>

        {/* DataHub URN Block */}
        <div style={{
          backgroundColor: '#0f172a',
          padding: '0.85rem 1rem',
          borderRadius: '6px',
          border: '1px solid #2a364f',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              DATAHUB ENTITY URN
            </div>
            <code className="code-tag" style={{ fontSize: '0.775rem' }}>
              {dataset.urn}
            </code>
          </div>
          <button
            onClick={copyUrn}
            style={{
              padding: '0.35rem 0.65rem',
              backgroundColor: '#1e293b',
              color: copied ? '#34d399' : 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              flexShrink: 0
            }}
          >
            {copied ? 'Copied!' : 'Copy URN'}
          </button>
        </div>

        {/* Description & Metadata */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Description
          </h3>
          <p style={{ color: '#f1f5f9', fontSize: '0.9rem', lineHeight: '1.6' }}>
            {dataset.description || 'No description provided in DataHub metadata.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Data Asset Owner
            </h3>
            <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9rem' }}>
              {dataset.owner || 'Unassigned'}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Catalog Tags
            </h3>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {dataset.tags.map((t, idx) => (
                <span key={idx} style={{
                  padding: '0.2rem 0.55rem',
                  backgroundColor: '#1e293b',
                  color: t === 'governance-risk' ? '#f87171' : '#93c5fd',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Tag size={10} />
                  <span>{t}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Classification Tag Editor (FR-6) */}
        <div style={{
          padding: '1.25rem',
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit3 size={16} style={{ color: '#60a5fa' }} />
              <span>DataHub Classification Level Tag (FR-6)</span>
            </h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '0.35rem 0.75rem',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}
              >
                Edit Classification
              </button>
            )}
          </div>

          {editing ? (
            <div>
              {error && (
                <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <select
                  value={selectedClassification}
                  onChange={(e) => setSelectedClassification(e.target.value as ClassificationLevel)}
                  style={{
                    padding: '0.5rem 0.85rem',
                    backgroundColor: '#1e293b',
                    color: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="public">PUBLIC (Non-sensitive)</option>
                  <option value="confidential">CONFIDENTIAL (Internal restricted)</option>
                  <option value="pii">PII (Personally Identifiable Information)</option>
                </select>

                <button
                  onClick={handleSaveClassification}
                  disabled={submitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  <Check size={14} />
                  <span>{submitting ? 'Writing to DataHub...' : 'Save & Write-Back'}</span>
                </button>

                <button
                  onClick={() => setEditing(false)}
                  style={{
                    padding: '0.5rem 0.85rem',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Current sensitivity classification: <strong style={{ color: '#ffffff' }}>{dataset.classification.toUpperCase()}</strong>. Authorized officers can reclassify datasets to trigger automated policy evaluation rules.
            </p>
          )}
        </div>

        {/* Remediation Action Card (FR-22) */}
        {dataset.has_governance_violation && (
          <div style={{
            padding: '1.25rem',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <AlertTriangle size={16} />
                <span>Governance Risk Flagged on DataHub (FR-20)</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                This dataset currently carries a <code className="code-tag" style={{ color: '#f87171' }}>governance-risk</code> tag in DataHub due to an access policy violation. Authorized officers can clear this tag upon remediation.
              </p>
            </div>

            <button
              onClick={handleRemediate}
              disabled={remediating}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                flexShrink: 0
              }}
            >
              <ShieldCheck size={16} />
              <span>{remediating ? 'Clearing Tag on DataHub...' : 'Remediate & Clear Tag (FR-22)'}</span>
            </button>
          </div>
        )}

        {/* Audit Notes Log */}
        {dataset.audit_notes && dataset.audit_notes.length > 0 && (
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={14} />
              <span>DataHub Governance Audit Notes</span>
            </h3>
            <div style={{ backgroundColor: '#0f172a', borderRadius: '6px', padding: '0.75rem 1rem', border: '1px solid var(--border-color)' }}>
              {dataset.audit_notes.map((note, idx) => (
                <div key={idx} style={{ fontSize: '0.8rem', color: '#f87171', fontFamily: 'JetBrains Mono, monospace', padding: '0.35rem 0', borderBottom: idx < dataset.audit_notes.length - 1 ? '1px solid #1e293b' : 'none' }}>
                  {note}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
