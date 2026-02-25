/**
 * DC Admin Console — API クライアント
 *
 * data-collection.ts の TENANT_ADMIN_CONSOLE.adminApi エンドポイントに対応。
 * Hono サーバーの /admin/* エンドポイントを呼び出す。
 */

import type {
  Tenant,
  TenantCreateRequest,
  TenantDetail,
  DashboardStats,
  CollectionSummary,
  HealthCheckResult,
  MonthlyUsage,
  DistributionRequest,
  DistributionStatus,
  MigrationRequest,
  MigrationStatus,
  DataCollectionTemplate,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_DC_API_URL || 'http://localhost:9500';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }

  return res.json();
}

// =============================================================================
// Dashboard
// =============================================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchApi<DashboardStats>('/admin/analytics/dashboard');
}

// =============================================================================
// Tenants
// =============================================================================

export async function getTenants(): Promise<Tenant[]> {
  return fetchApi<Tenant[]>('/admin/tenants');
}

export async function getTenant(tenantId: string): Promise<TenantDetail> {
  return fetchApi<TenantDetail>(`/admin/tenants/${tenantId}`);
}

export async function createTenant(data: TenantCreateRequest): Promise<Tenant> {
  return fetchApi<Tenant>('/admin/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTenant(tenantId: string, data: Partial<Tenant>): Promise<Tenant> {
  return fetchApi<Tenant>(`/admin/tenants/${tenantId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function suspendTenant(tenantId: string): Promise<void> {
  await fetchApi(`/admin/tenants/${tenantId}/suspend`, { method: 'POST' });
}

export async function resumeTenant(tenantId: string): Promise<void> {
  await fetchApi(`/admin/tenants/${tenantId}/resume`, { method: 'POST' });
}

export async function decommissionTenant(tenantId: string): Promise<void> {
  await fetchApi(`/admin/tenants/${tenantId}/decommission`, { method: 'POST' });
}

// =============================================================================
// Templates
// =============================================================================

export async function getTemplates(tenantId?: string): Promise<DataCollectionTemplate[]> {
  const query = tenantId ? `?tenantId=${tenantId}` : '';
  return fetchApi<DataCollectionTemplate[]>(`/admin/templates${query}`);
}

export async function distributeTemplate(data: DistributionRequest): Promise<DistributionStatus> {
  return fetchApi<DistributionStatus>('/admin/templates/distribute', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDistributionStatus(): Promise<DistributionStatus[]> {
  return fetchApi<DistributionStatus[]>('/admin/templates/distribute/status');
}

// =============================================================================
// Analytics
// =============================================================================

export async function getCollectionSummary(): Promise<CollectionSummary[]> {
  return fetchApi<CollectionSummary[]>('/admin/analytics/collection');
}

export async function getAiUsageSummary(): Promise<{ tenants: Array<{ tenantId: string; tenantCode: string; companyNameJa: string; usage: MonthlyUsage[] }> }> {
  return fetchApi('/admin/analytics/ai-usage');
}

export async function getStorageSummary(): Promise<Array<{ tenantId: string; tenantCode: string; companyNameJa: string; storageUsedMb: number; storageLimitMb: number }>> {
  return fetchApi('/admin/analytics/storage');
}

// =============================================================================
// Health
// =============================================================================

export async function getHealthCheck(): Promise<HealthCheckResult[]> {
  return fetchApi<HealthCheckResult[]>('/admin/provisioning/health');
}

// =============================================================================
// Migration
// =============================================================================

export async function runMigration(data: MigrationRequest): Promise<MigrationStatus> {
  return fetchApi<MigrationStatus>('/admin/provisioning/migrate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// =============================================================================
// Provisioning
// =============================================================================

export async function provisionTenant(data: TenantCreateRequest): Promise<{ tenantId: string; supabaseProjectRef: string }> {
  return fetchApi('/admin/provisioning/provision', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
