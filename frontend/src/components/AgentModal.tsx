import React, { useState } from 'react';
import { AgentPolicy, ClassificationLevel, createAgent, updateAgent } from '../services/api';
import { X, Bot, Shield, Lock, Globe, Check, AlertCircle } from 'lucide-react';

interface Props {
  agent?: AgentPolicy | null;
  onClose: () => void;
  onSaved: () => void;
}

export const AgentModal: React.FC<Props> = ({ agent, onClose, onSaved }) => {
  const [name, setName] = useState(agent?.name || '');
  const [purpose, setPurpose] = useState(agent?.declared_purpose || '');
  const [allowed, setAllowed] = useState<ClassificationLevel[]>(agent?.allowed_classifications || ['public']);
  const [requiresApproval, setRequiresApproval] = useState<boolean>(agent?.requires_approval || false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleClassification = (level: ClassificationLevel) => {
    if (allowed.includes(level)) {
      setAllowed(allowed.filter(c => c !== level));
    } else {
      setAllowed([...allowed, level]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Agent name is required.');
      return;
    }
    if (!purpose.trim()) {
      setError('Declared operational purpose is required.');
      return;
    }
    if (allowed.length === 0) {
      setError('Policy Error (FR-10): Agent must be allowed at least one classification level (public, confidential, or pii).');
      return;
    }

    setError(null);
    setSubmitting(true);

    const payload = {
      name: name.trim(),
      declared_purpose: purpose.trim(),
      allowed_classifications: allowed,
      requires_approval: requiresApproval
    };

    try {
      if (agent) {
        await updateAgent(agent.id, payload);
      } else {
        await createAgent(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save agent policy');
    } finally {
      setSubmitting(false);
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
        maxWidth: '560px',
        width: '100%',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.5rem', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', borderRadius: '8px' }}>
            <Bot size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
              {agent ? 'Edit Agent Policy' : 'Register New AI Agent'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Configure declared operational purpose and sensitivity access rules (FR-7 to FR-11)
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '0.75rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '0.4rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              AI Agent Unique Identifier Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DataScienceExplorerBot"
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#0f172a',
                border: '1px solid #2a364f',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '0.4rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Declared Operational Purpose
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Describe the agent's tasks, workflow triggers, and authorized access bounds..."
              rows={3}
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#0f172a',
                border: '1px solid #2a364f',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Allowed Classification Levels (FR-10 Validation)
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.85rem',
                backgroundColor: '#0f172a',
                border: `1px solid ${allowed.includes('public') ? '#3b82f6' : '#2a364f'}`,
                borderRadius: '6px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={allowed.includes('public')}
                  onChange={() => toggleClassification('public')}
                  style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                />
                <Globe size={16} style={{ color: '#94a3b8' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff' }}>PUBLIC Data</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Non-sensitive public cataloged assets</div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.85rem',
                backgroundColor: '#0f172a',
                border: `1px solid ${allowed.includes('confidential') ? '#8b5cf6' : '#2a364f'}`,
                borderRadius: '6px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={allowed.includes('confidential')}
                  onChange={() => toggleClassification('confidential')}
                  style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                />
                <Lock size={16} style={{ color: '#c084fc' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff' }}>CONFIDENTIAL Data</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Internal enterprise datasets, financial ledgers, HR records</div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.85rem',
                backgroundColor: '#0f172a',
                border: `1px solid ${allowed.includes('pii') ? '#f59e0b' : '#2a364f'}`,
                borderRadius: '6px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={allowed.includes('pii')}
                  onChange={() => toggleClassification('pii')}
                  style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }}
                />
                <Shield size={16} style={{ color: '#fbbf24' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff' }}>PII Sensitive Data</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Personally Identifiable Information (SSNs, EHR health records, banking)</div>
                </div>
              </label>
            </div>
          </div>

          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: '#0f172a',
            border: '1px solid #2a364f',
            borderRadius: '6px',
            marginBottom: '1.75rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
              />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff' }}>
                  Mandatory Prior Approval Required (FR-11)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  If checked, every access event by this agent will trigger a violation unless explicitly flagged as approved.
                </div>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.25rem',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1.25rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <Check size={16} />
              <span>{submitting ? 'Saving Policy...' : (agent ? 'Update Policy' : 'Register Agent')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
