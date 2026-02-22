/**
 * DC API client for the admin console.
 *
 * All admin endpoints require a Firebase ID token in the Authorization header.
 */

const API_BASE = process.env.NEXT_PUBLIC_DC_API_URL ?? 'http://localhost:9500';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { total: number; limit: number; offset: number };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  return res.json() as Promise<ApiResponse<T>>;
}

// ---------------------------------------------------------------------------
// Tenant Management
// ---------------------------------------------------------------------------

export interface Tenant {
  id: string;
  tenant_name: string;
  tenant_code: string;
  supabase_url: string;
  status: string;
  license_key: string | null;
  provisioned_by: string;
  provisioned_at: string;
  notes: string | null;
}

export async function listTenants(token: string, status?: string) {
  const params = status ? `?status=${status}` : '';
  return request<Tenant[]>(`/admin/tenants${params}`, {}, token);
}

export async function getTenant(token: string, tenantId: string) {
  return request<Tenant>(`/admin/tenants/${tenantId}`, {}, token);
}

export async function createTenant(token: string, body: Record<string, unknown>) {
  return request<Tenant>('/admin/tenants', { method: 'POST', body: JSON.stringify(body) }, token);
}

export async function suspendTenant(token: string, tenantId: string) {
  return request(`/admin/tenants/${tenantId}/suspend`, { method: 'POST' }, token);
}

export async function resumeTenant(token: string, tenantId: string) {
  return request(`/admin/tenants/${tenantId}/resume`, { method: 'POST' }, token);
}

// ---------------------------------------------------------------------------
// Provisioning
// ---------------------------------------------------------------------------

export async function provisionTenant(token: string, body: Record<string, unknown>) {
  return request('/admin/provisioning/provision', { method: 'POST', body: JSON.stringify(body) }, token);
}

export async function runMigration(token: string, tenantIds?: string[]) {
  return request('/admin/provisioning/migrate', {
    method: 'POST',
    body: JSON.stringify({ tenantIds }),
  }, token);
}

export async function healthCheck(token: string) {
  return request('/admin/provisioning/health', {}, token);
}

// ---------------------------------------------------------------------------
// Template Distribution
// ---------------------------------------------------------------------------

export async function distributeTemplate(
  token: string,
  templateData: Record<string, unknown>,
  tenantIds: string[],
) {
  return request('/admin/templates/distribute', {
    method: 'POST',
    body: JSON.stringify({ templateData, tenantIds }),
  }, token);
}

export async function getDistributionStatus(token: string) {
  return request('/admin/templates/distribute/status', {}, token);
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface CollectionSummary {
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  publishedTemplates: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
}

export interface AiUsageSummary {
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  aiTransfers: number;
  aiValidations: number;
  totalAiCalls: number;
}

export async function getCollectionSummary(token: string) {
  return request<CollectionSummary[]>('/admin/analytics/collection', {}, token);
}

export async function getAiUsageSummary(token: string, month?: string) {
  const params = month ? `?month=${month}` : '';
  return request<AiUsageSummary[]>(`/admin/analytics/ai-usage${params}`, {}, token);
}
