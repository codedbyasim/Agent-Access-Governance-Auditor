import React, { useState, useEffect } from 'react';
import {
  fetchAgents,
  fetchDatasets,
  evaluateAccessEvent,
  runBatchAuditSimulation,
  AgentPolicy,
  DatasetSummary,
  AuditEvaluationResult
} from '../services/api';
import { Play, Shield, Lock, Globe, AlertTriangle, CheckCircle, Zap, Bot, Tag, Github, FileText } from 'lucide-react';

export const AuditRunner: React.FC = () => {
  const [agents, setAgents] = useState<AgentPolicy[]>([]);
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);

  // Form State
  const [selectedAgent, setSelectedAgent] = useState<string>('CustomerSupportBot');
  const [customAgentName, setCustomAgentName] = useState<string>('UnknownRogueScraperBot');
  const [useCustomAgent, setUseCustomAgent] = useState<boolean>(false);
  const [selectedDataset, setSelectedDataset] = useState<string>('analytics.customer_pii');
  const [accessType, setAccessType] = useState<string>('read');
  const [isApproved, setIsApproved] = useState<boolean>(false);

  // Results State
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [latestResult, setLatestResult] = useState<AuditEvaluationResult | null>(null);
  const [batchResults, setBatchResults] = useState<AuditEvaluationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [aData, dData] = await Promise.all([fetchAgents(), fetchDatasets()]);
        setAgents(aData);
        setDatasets(dData);
        if (aData.length > 0) setSelectedAgent(aData[0].name);
        if (dData.length > 0) setSelectedDataset(dData[0].name);
      } catch (err: any) {
        setError(err.message || 'Failed to load options');
      }
    };
    loadOptions();
  }, []);

  const handleSingleEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEvaluating(true);
    setBatchResults([]);

    const agentName = useCustomAgent ? customAgentName.trim() : selectedAgent;

    try {
      const res = await evaluateAccessEvent({
        agent_name: agentName,
        dataset_name: selectedDataset,
        access_type: accessType,
        is_approved: isApproved
      });
      setLatestResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate access event');
    } finally {
      setEvaluating(false);
    }
  };

  const handleRunBatchSimulation = async () => {
    setError(null);
    setEvaluating(true);
    setLatestResult(null);

    try {
      const results = await runBatchAuditSimulation();
      setBatchResults(results);
    } catch (err: any) {
      setError(err.message || 'Failed to execute batch simulation');
    } finally {
      setEvaluating(false);
    }
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification.toLowerCase()) {
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>Access Event Auditing Engine</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Real-time compliance policy evaluator against DataHub metadata and agent registry rules (FR-12 to FR-19)
          </p>
        </div>

        <button
          onClick={handleRunBatchSimulation}
          disabled={evaluating}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            backgroundColor: '#8b5cf6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          <Zap size={16} />
          <span>Run Sample Compliance Scenarios (5 Tests)</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Evaluator Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Event Input Form */}
        <div style={{
          backgroundColor: '#151c2c',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Play size={18} style={{ color: '#60a5fa' }} />
            <span>Simulate AI Access Event (FR-12)</span>
          </h2>

          <form onSubmit={handleSingleEvaluation}>
            {/* Agent Select */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                Executing AI Agent Identity
              </label>

              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', marginRight: '1rem' }}>
                  <input
                    type="radio"
                    name="agentChoice"
                    checked={!useCustomAgent}
                    onChange={() => setUseCustomAgent(false)}
                  />
                  <span>Registered Agent</span>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#f87171', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="agentChoice"
                    checked={useCustomAgent}
                    onChange={() => setUseCustomAgent(true)}
                  />
                  <span>Unregistered Custom Agent (Test FR-19)</span>
                </label>
              </div>

              {!useCustomAgent ? (
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
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
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name} ({a.allowed_classifications.join(', ')})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={customAgentName}
                  onChange={(e) => setCustomAgentName(e.target.value)}
                  placeholder="e.g. RogueScraperBot"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#0f172a',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              )}
            </div>

            {/* Target Dataset Select */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                Target DataHub Dataset Entity
              </label>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
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
              >
                {datasets.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} [{d.classification.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>

            {/* Access Type & Is Approved */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                  Access Operation Type
                </label>
                <select
                  value={accessType}
                  onChange={(e) => setAccessType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#0f172a',
                    border: '1px solid #2a364f',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="read">read (Data Ingestion)</option>
                  <option value="query">query (SQL Execution)</option>
                  <option value="export">export (Bulk Extract)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                  Human Approval Status
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.85rem',
                  backgroundColor: '#0f172a',
                  border: '1px solid #2a364f',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  height: '42px'
                }}>
                  <input
                    type="checkbox"
                    checked={isApproved}
                    onChange={(e) => setIsApproved(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#22c55e' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isApproved ? '#34d399' : 'var(--text-muted)' }}>
                    {isApproved ? 'Approved' : 'Unapproved'}
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={evaluating}
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <Play size={16} />
              <span>{evaluating ? 'Evaluating Access Event...' : 'Evaluate Access Event (FR-12)'}</span>
            </button>
          </form>
        </div>

        {/* Live Evaluation Output */}
        <div style={{
          backgroundColor: '#151c2c',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} style={{ color: '#a855f7' }} />
              <span>Latest Evaluation Output</span>
            </h2>

            {latestResult ? (
              <div>
                <div style={{
                  padding: '1.25rem',
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  border: `1px solid ${latestResult.status === 'OK' ? '#10b981' : '#ef4444'}`,
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {latestResult.status === 'OK' ? (
                        <span className="badge badge-ok" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                          <CheckCircle size={15} />
                          <span>COMPLIANT (OK)</span>
                        </span>
                      ) : (
                        <span className="badge badge-flagged" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                          <AlertTriangle size={15} />
                          <span>POLICY VIOLATION (FLAGGED)</span>
                        </span>
                      )}
                    </div>
                    {getClassificationBadge(latestResult.dataset_classification)}
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#ffffff', marginBottom: '0.5rem' }}>
                    Agent: <strong style={{ color: '#60a5fa' }}>{latestResult.agent_name}</strong> &rarr; Target: <strong style={{ color: '#f1f5f9' }}>{latestResult.dataset_name}</strong> ({latestResult.access_type})
                  </div>

                  {latestResult.violation_reason ? (
                    <div style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      color: '#f87171',
                      fontSize: '0.825rem',
                      lineHeight: '1.5',
                      marginTop: '0.75rem'
                    }}>
                      <strong style={{ display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        VIOLATION REASON (FR-17)
                      </strong>
                      {latestResult.violation_reason}
                    </div>
                  ) : (
                    <div style={{ color: '#34d399', fontSize: '0.825rem', marginTop: '0.5rem' }}>
                      ✓ Access permitted. Dataset sensitivity level aligns with agent policies.
                    </div>
                  )}
                </div>

                {/* Triggers Execution Status */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{
                    padding: '0.5rem 0.85rem',
                    backgroundColor: latestResult.datahub_written ? 'rgba(59, 130, 246, 0.15)' : '#0f172a',
                    border: `1px solid ${latestResult.datahub_written ? '#3b82f6' : 'var(--border-color)'}`,
                    borderRadius: '6px',
                    color: latestResult.datahub_written ? '#60a5fa' : 'var(--text-muted)',
                    fontSize: '0.775rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <Tag size={13} />
                    <span>{latestResult.datahub_written ? '✓ Tagged on DataHub (governance-risk)' : 'No DataHub Write-Back needed'}</span>
                  </div>

                  <div style={{
                    padding: '0.5rem 0.85rem',
                    backgroundColor: latestResult.github_issue_created ? 'rgba(168, 85, 247, 0.15)' : '#0f172a',
                    border: `1px solid ${latestResult.github_issue_created ? '#a855f7' : 'var(--border-color)'}`,
                    borderRadius: '6px',
                    color: latestResult.github_issue_created ? '#c084fc' : 'var(--text-muted)',
                    fontSize: '0.775rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <Github size={13} />
                    <span>{latestResult.github_issue_created ? '✓ GitHub Issue Created' : 'GitHub Notification (Connect in Settings)'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Bot size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <div>Submit an access event or click "Run Sample Compliance Scenarios" to see live policy evaluation outputs.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Batch Simulation Results */}
      {batchResults.length > 0 && (
        <div style={{
          backgroundColor: '#151c2c',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '1.5rem',
          marginTop: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={18} style={{ color: '#a855f7' }} />
            <span>Scenario Test Suite Results ({batchResults.length} Events Evaluated)</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {batchResults.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: '#0f172a',
                  border: `1px solid ${item.status === 'OK' ? '#10b981' : '#ef4444'}`,
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    {item.status === 'OK' ? (
                      <span className="badge badge-ok">
                        <CheckCircle size={12} />
                        <span>OK</span>
                      </span>
                    ) : (
                      <span className="badge badge-flagged">
                        <AlertTriangle size={12} />
                        <span>FLAGGED</span>
                      </span>
                    )}

                    <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>{item.agent_name}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>&rarr;</span>
                    <strong style={{ color: '#60a5fa', fontSize: '0.9rem' }}>{item.dataset_name}</strong>
                    {getClassificationBadge(item.dataset_classification)}
                  </div>

                  {item.violation_reason ? (
                    <div style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                      {item.violation_reason}
                    </div>
                  ) : (
                    <div style={{ color: '#34d399', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      Compliant access permitted under policy rules.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                  {item.datahub_written && (
                    <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#1e293b', color: '#60a5fa', borderRadius: '4px', fontSize: '0.725rem', border: '1px solid var(--border-color)' }}>
                      ✓ DataHub Written
                    </span>
                  )}
                  {item.status === 'FLAGGED' && (
                    item.github_issue_created ? (
                      <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderRadius: '4px', fontSize: '0.725rem', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Github size={11} /> ✓ GitHub Issue Posted
                      </span>
                    ) : (
                      <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8', borderRadius: '4px', fontSize: '0.725rem', border: '1px solid rgba(148, 163, 184, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Zap size={11} /> ⚡ Simulated Alert Logged
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
