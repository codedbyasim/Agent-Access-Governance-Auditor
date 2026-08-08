import React from 'react';
import { PlayCircle } from 'lucide-react';

export const RunAudit: React.FC = () => {
  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Run Access Audit</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Execute ad-hoc or batch compliance audits against DataHub dataset policies.
      </p>
      <div className="table-container" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <PlayCircle size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <p>Access Event Audit Engine module ready for Feature Phase 4.</p>
      </div>
    </div>
  );
};
