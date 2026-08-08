export interface HealthStatus {
  status: string;
  version: string;
  timestamp: string;
  datahub_connected: boolean;
  datahub_url: string;
  database_connected: boolean;
}

export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  github_username?: string;
  has_github_connected: boolean;
  created_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type ClassificationLevel = 'pii' | 'confidential' | 'public';
export type AuditStatus = 'OK' | 'FLAGGED';

export interface DatasetSummary {
  urn: string;
  name: string;
  description?: string;
  classification: ClassificationLevel;
  owner?: string;
  tags: string[];
  has_governance_violation: boolean;
}

export interface DatasetDetail extends DatasetSummary {
  domain?: string;
  platform?: string;
  last_modified?: string;
  audit_notes: string[];
}

export interface AgentPolicy {
  id: number;
  name: string;
  declared_purpose: string;
  allowed_classifications: ClassificationLevel[];
  requires_approval: boolean;
  created_at: string;
}

export interface AgentCreatePayload {
  name: string;
  declared_purpose: string;
  allowed_classifications: ClassificationLevel[];
  requires_approval: boolean;
}

export interface AccessEventRequestPayload {
  agent_name: string;
  dataset_name: string;
  access_type?: string;
  is_approved?: boolean;
}

export interface AuditEvaluationResult {
  id: number;
  event_id: string;
  timestamp: string;
  agent_name: string;
  dataset_name: string;
  access_type: string;
  dataset_classification: string;
  dataset_owner?: string;
  is_approved: boolean;
  status: AuditStatus;
  violation_reason?: string;
  datahub_written: boolean;
  github_issue_created: boolean;
}

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchHealthStatus(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error(`Failed to fetch health check: ${response.statusText}`);
  }
  return response.json();
}

export async function signupApi(email: string, password: string, full_name?: string): Promise<AuthTokenResponse> {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Signup failed');
  }
  return data;
}

export async function loginApi(email: string, password: string): Promise<AuthTokenResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Invalid email or password');
  }
  return data;
}

export async function fetchMeApi(): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Unauthorized');
  }
  return data;
}

export async function fetchGitHubOAuthUrl(): Promise<string> {
  const response = await fetch(`${API_BASE}/auth/github/url`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch GitHub OAuth URL');
  }
  return data.url;
}

export async function callbackGitHubOAuth(code: string): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/github/callback`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ code })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'GitHub OAuth verification failed');
  }
  return data;
}

export async function disconnectGitHubOAuth(): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/github/disconnect`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to disconnect GitHub account');
  }
  return data;
}

/* Datasets API */
export async function fetchDatasets(search?: string, classification?: string, sort_by?: string): Promise<DatasetSummary[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (classification) params.append('classification', classification);
  if (sort_by) params.append('sort_by', sort_by);

  const response = await fetch(`${API_BASE}/datasets?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch datasets catalog');
  }
  return data;
}

export async function fetchDatasetDetail(identifier: string): Promise<DatasetDetail> {
  const response = await fetch(`${API_BASE}/datasets/${encodeURIComponent(identifier)}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || `Failed to fetch dataset detail for ${identifier}`);
  }
  return data;
}

export async function refreshDatasets(): Promise<DatasetSummary[]> {
  const response = await fetch(`${API_BASE}/datasets/refresh`, { method: 'POST' });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to refresh datasets');
  }
  return data;
}

export async function updateDatasetClassification(identifier: string, classification: ClassificationLevel): Promise<DatasetDetail> {
  const response = await fetch(`${API_BASE}/datasets/${encodeURIComponent(identifier)}/classification`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ classification })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to update classification');
  }
  return data;
}

/* Agent Registry API */
export async function fetchAgents(): Promise<AgentPolicy[]> {
  const response = await fetch(`${API_BASE}/agents`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch agent policies');
  }
  return data;
}

export async function createAgent(payload: AgentCreatePayload): Promise<AgentPolicy> {
  const response = await fetch(`${API_BASE}/agents`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to register new AI agent');
  }
  return data;
}

export async function updateAgent(id: number, payload: AgentCreatePayload): Promise<AgentPolicy> {
  const response = await fetch(`${API_BASE}/agents/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to update agent policy');
  }
  return data;
}

export async function deleteAgent(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/agents/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok && response.status !== 204) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to delete agent policy');
  }
}

/* Access Event Auditing Engine API */
export async function evaluateAccessEvent(payload: AccessEventRequestPayload): Promise<AuditEvaluationResult> {
  const response = await fetch(`${API_BASE}/audit/evaluate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to evaluate access event');
  }
  return data;
}

export async function runBatchAuditSimulation(): Promise<AuditEvaluationResult[]> {
  const response = await fetch(`${API_BASE}/audit/simulate-batch`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to execute scenario simulation test suite');
  }
  return data;
}

export async function remediateDatasetViolation(identifier: string): Promise<DatasetDetail> {
  const response = await fetch(`${API_BASE}/datasets/${encodeURIComponent(identifier)}/remediate`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to remediate dataset governance risk tag');
  }
  return data;
}

/* Feature 7 Audit Logs & Reporting */
export interface PaginatedAuditLogs {
  items: AuditEvaluationResult[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AuditMetrics {
  total_events: number;
  compliant_count: number;
  flagged_count: number;
  compliance_rate_percent: number;
  top_violating_agent: string;
}

export async function fetchAuditLogs(params: {
  search?: string;
  status?: string;
  agent?: string;
  classification?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedAuditLogs> {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.agent && params.agent !== 'all') query.append('agent', params.agent);
  if (params.classification && params.classification !== 'all') query.append('classification', params.classification);
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.page) query.append('page', params.page.toString());
  if (params.page_size) query.append('page_size', params.page_size.toString());

  const response = await fetch(`${API_BASE}/audit/logs?${query.toString()}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch audit trail logs');
  }
  return data;
}

export async function fetchAuditMetrics(): Promise<AuditMetrics> {
  const response = await fetch(`${API_BASE}/audit/metrics`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch audit metrics');
  }
  return data;
}

export function getAuditExportUrlCsv(params: { search?: string; status?: string; agent?: string; classification?: string; start_date?: string; end_date?: string; }): string {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.agent && params.agent !== 'all') query.append('agent', params.agent);
  if (params.classification && params.classification !== 'all') query.append('classification', params.classification);
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  return `${API_BASE}/audit/export/csv?${query.toString()}`;
}

export function getAuditExportUrlJson(params: { search?: string; status?: string; agent?: string; classification?: string; start_date?: string; end_date?: string; }): string {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.agent && params.agent !== 'all') query.append('agent', params.agent);
  if (params.classification && params.classification !== 'all') query.append('classification', params.classification);
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  return `${API_BASE}/audit/export/json?${query.toString()}`;
}
