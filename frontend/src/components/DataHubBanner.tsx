import React from 'react';
import { Database, CheckCircle2, AlertTriangle } from 'lucide-react';
import { HealthStatus } from '../services/api';

interface Props {
  health: HealthStatus | null;
  loading: boolean;
  error: string | null;
}

export const DataHubBanner: React.FC<Props> = ({ health, loading, error }) => {
  if (loading) {
    return (
      <div className="status-banner connected" style={{ opacity: 0.7 }}>
        <Database size={14} />
        <span>Checking DataHub connection...</span>
      </div>
    );
  }

  if (error || !health?.datahub_connected) {
    return (
      <div className="status-banner disconnected">
        <AlertTriangle size={14} />
        <span>DataHub Disconnected ({health?.datahub_url || 'http://localhost:8080'})</span>
      </div>
    );
  }

  return (
    <div className="status-banner connected">
      <CheckCircle2 size={14} />
      <span>DataHub Connected ({health.datahub_url})</span>
    </div>
  );
};
