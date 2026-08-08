import React, { useState, useEffect } from 'react';
import { fetchAgents, deleteAgent, AgentPolicy, ClassificationLevel } from '../services/api';
import { AgentModal } from '../components/AgentModal';
import { Bot, Plus, Search, Shield, Lock, Globe, Edit, Trash2, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';

export const Agents: React.FC = () => {
  const [agents, setAgents] = useState<AgentPolicy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingAgent, setEditingAgent] = useState<AgentPolicy | null>(null);

  // Delete confirmation State
  const [deletingAgentId, setDeletingAgentId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const loadAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAgents();
      setAgents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load agent policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await deleteAgent(id);
      setDeletingAgentId(null);
      loadAgents();
    } catch (err: any) {
      alert(`Failed to delete agent: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const filteredAgents = agents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.declared_purpose.toLowerCase().includes(search.toLowerCase())
  );

  const getClassificationBadge = (level: ClassificationLevel) => {
    switch (level) {
      case 'pii':
        return (
          <span className="badge badge-pii" key="pii">
            <Shield size={12} />
            <span>PII Sensitive</span>
          </span>
        );
      case 'confidential':
        return (
          <span className="badge badge-confidential" key="confidential">
            <Lock size={12} />
            <span>Confidential</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-public" key="public">
            <Globe size={12} />
            <span>Public</span>
          </span>
        );
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>Agent Policy Registry</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Registered AI agents, declared operational purposes, and classification access policies (FR-7 to FR-11)
          </p>
        </div>

        <button
          onClick={() => {
            setEditingAgent(null);
            setModalOpen(true);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          <Plus size={18} />
          <span>Register New AI Agent (FR-9)</span>
        </button>
      </div>

      {/* Search Header */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.25rem',
        alignItems: 'center',
        backgroundColor: '#151c2c',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AI agents by name or declared purpose..."
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem 0.55rem 2.4rem',
              backgroundColor: '#0f172a',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>

        <button
          onClick={loadAgents}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 0.85rem',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Agent Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading registered AI agent policies...
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="table-container" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Bot size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
          <div>No registered AI agents found matching your search.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              style={{
                backgroundColor: '#151c2c',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ padding: '0.45rem', backgroundColor: '#0f172a', color: '#c084fc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <Bot size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                        {agent.name}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Registered: {new Date(agent.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      onClick={() => {
                        setEditingAgent(agent);
                        setModalOpen(true);
                      }}
                      title="Edit Policy"
                      style={{
                        padding: '0.35rem',
                        backgroundColor: '#0f172a',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingAgentId(agent.id)}
                      title="Delete Agent"
                      style={{
                        padding: '0.35rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1.25rem', minHeight: '2.55rem' }}>
                  {agent.declared_purpose}
                </p>
              </div>

              <div>
                <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.85rem' }}>
                  <div style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                    ALLOWED CLASSIFICATIONS (FR-10)
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                    {agent.allowed_classifications.map((level) => getClassificationBadge(level))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                    {agent.requires_approval ? (
                      <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                        <AlertOctagon size={14} />
                        <span>Mandatory Approval Required (FR-11)</span>
                      </span>
                    ) : (
                      <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                        <CheckCircle2 size={14} />
                        <span>Auto-Permitted</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog for Create/Edit */}
      {modalOpen && (
        <AgentModal
          agent={editingAgent}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            loadAgents();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingAgentId !== null && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#151c2c',
            border: '1px solid #2a364f',
            borderRadius: '8px',
            maxWidth: '420px',
            width: '100%',
            padding: '1.75rem'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
              Confirm Delete Agent Policy?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              This will remove the agent policy entry from the registry database. Access events referencing this agent will be flagged as unknown agent violations (FR-19).
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setDeletingAgentId(null)}
                style={{
                  padding: '0.5rem 1rem',
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
              <button
                onClick={() => handleDelete(deletingAgentId!)}
                disabled={deleting}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                {deleting ? 'Deleting...' : 'Delete Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
