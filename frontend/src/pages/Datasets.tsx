import React, { useState, useEffect } from 'react';
import { fetchDatasets, fetchDatasetDetail, refreshDatasets, DatasetSummary, DatasetDetail } from '../services/api';
import { DatasetDetailModal } from '../components/DatasetDetailModal';
import { Database, Search, RefreshCw, Shield, Lock, Globe, AlertTriangle, ArrowUpDown, ChevronRight } from 'lucide-react';

export const Datasets: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Filter, Sort state
  const [search, setSearch] = useState<string>('');
  const [classificationFilter, setClassificationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Selected Dataset Modal state
  const [selectedDetail, setSelectedDetail] = useState<DatasetDetail | null>(null);

  const loadCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDatasets(search, classificationFilter, sortBy);
      setDatasets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cataloged datasets from DataHub');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const data = await refreshDatasets();
      setDatasets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh datasets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [search, classificationFilter, sortBy]);

  const handleRowClick = async (name: string) => {
    try {
      const detail = await fetchDatasetDetail(name);
      setSelectedDetail(detail);
    } catch (err: any) {
      alert(`Could not load dataset details: ${err.message}`);
    }
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification.toLowerCase()) {
      case 'pii':
        return (
          <span className="badge badge-pii">
            <Shield size={12} />
            <span>PII</span>
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
            <span>Public</span>
          </span>
        );
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>Datasets Catalog</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Cataloged DataHub assets, classification sensitivity levels, and owner assignments (FR-1 to FR-6)
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1.1rem',
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
          <span>Refresh DataHub Metadata (FR-5)</span>
        </button>
      </div>

      {/* Filter and Search Bar Header */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        backgroundColor: '#151c2c',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}>
        {/* Search Input */}
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search datasets by name, owner, or tags..."
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

        {/* Classification Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CLASSIFICATION:</span>
          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          >
            <option value="all">All Classifications</option>
            <option value="pii">PII Only</option>
            <option value="confidential">Confidential Only</option>
            <option value="public">Public Only</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowUpDown size={14} style={{ color: 'var(--text-muted)' }} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          >
            <option value="name">Sort by Name</option>
            <option value="classification">Sort by Classification</option>
            <option value="owner">Sort by Owner</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Datasets Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Dataset Entity Name</th>
              <th>Sensitivity Classification (NFR-17)</th>
              <th>Data Asset Owner (FR-1)</th>
              <th>Risk Status</th>
              <th style={{ width: '60px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading cataloged dataset metadata from DataHub...
                </td>
              </tr>
            ) : datasets.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Database size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                  <div>No cataloged datasets matched your search filters.</div>
                </td>
              </tr>
            ) : (
              datasets.map((d) => (
                <tr
                  key={d.name}
                  onClick={() => handleRowClick(d.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '380px' }}>
                      {d.description || 'No description'}
                    </div>
                  </td>
                  <td>
                    {getClassificationBadge(d.classification)}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {d.owner || 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    {d.has_governance_violation ? (
                      <span className="badge badge-flagged">
                        <AlertTriangle size={12} />
                        <span>FLAGGED</span>
                      </span>
                    ) : (
                      <span className="badge badge-ok">
                        <span>Compliant</span>
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-dim)' }}>
                    <ChevronRight size={18} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dataset Detail Modal */}
      {selectedDetail && (
        <DatasetDetailModal
          dataset={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onUpdated={() => {
            loadCatalog();
            handleRowClick(selectedDetail.name);
          }}
        />
      )}
    </div>
  );
};
