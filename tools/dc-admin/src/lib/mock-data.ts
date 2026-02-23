/**
 * DC Admin Console — モックデータ
 *
 * API サーバー接続前の開発・デモ用。
 * NEXT_PUBLIC_USE_MOCK=true で有効化。
 */

import type {
  Tenant,
  TenantDetail,
  DashboardStats,
  CollectionSummary,
  HealthCheckResult,
  DataCollectionTemplate,
  DataCollectionSubmission,
  MonthlyUsage,
} from '@/types';

// =============================================================================
// Dashboard
// =============================================================================

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  activeTenants: 12,
  totalTemplates: 45,
  overallCollectionRate: 78,
  totalAiUsageThisMonth: 1234,
  totalSubmissionsThisMonth: 356,
  tenantsNearDeadline: 3,
};

// =============================================================================
// Tenants
// =============================================================================

export const MOCK_TENANTS: Tenant[] = [
  {
    id: 'tenant-001',
    code: 'ACME',
    companyName: 'ACME Corporation',
    companyNameJa: 'ACMEコーポレーション',
    status: 'active',
    supabaseProjectRef: 'acme-dc-prod',
    supabaseUrl: 'https://acme-dc-prod.supabase.co',
    region: 'ap-northeast-1',
    plan: 'ENT',
    templateCount: 8,
    submissionCount: 245,
    collectionRate: 92,
    aiUsageThisMonth: 340,
    storageUsedMb: 156,
    createdAt: '2025-06-15T09:00:00Z',
    lastActivityAt: '2026-02-23T03:15:00Z',
    contactEmail: 'it-admin@acme.co.jp',
    contactName: '田中太郎',
  },
  {
    id: 'tenant-002',
    code: 'GLOBEX',
    companyName: 'Globex Industries',
    companyNameJa: 'グローベックス工業',
    status: 'active',
    supabaseProjectRef: 'globex-dc-prod',
    supabaseUrl: 'https://globex-dc-prod.supabase.co',
    region: 'ap-northeast-1',
    plan: 'PRO',
    templateCount: 5,
    submissionCount: 128,
    collectionRate: 65,
    aiUsageThisMonth: 120,
    storageUsedMb: 82,
    createdAt: '2025-09-01T09:00:00Z',
    lastActivityAt: '2026-02-22T14:30:00Z',
    contactEmail: 'dx@globex.co.jp',
    contactName: '鈴木花子',
  },
  {
    id: 'tenant-003',
    code: 'INITECH',
    companyName: 'Initech Ltd.',
    companyNameJa: 'イニテック株式会社',
    status: 'suspended',
    supabaseProjectRef: 'initech-dc-prod',
    supabaseUrl: 'https://initech-dc-prod.supabase.co',
    region: 'ap-northeast-1',
    plan: 'STD',
    templateCount: 3,
    submissionCount: 45,
    collectionRate: 0,
    aiUsageThisMonth: 0,
    storageUsedMb: 24,
    createdAt: '2025-11-10T09:00:00Z',
    lastActivityAt: '2026-01-15T10:00:00Z',
    contactEmail: 'admin@initech.co.jp',
    contactName: '佐藤一郎',
  },
  {
    id: 'tenant-004',
    code: 'STARK',
    companyName: 'Stark Industries Japan',
    companyNameJa: 'スターク・インダストリーズ・ジャパン',
    status: 'active',
    supabaseProjectRef: 'stark-dc-prod',
    supabaseUrl: 'https://stark-dc-prod.supabase.co',
    region: 'ap-northeast-1',
    plan: 'ENT',
    templateCount: 12,
    submissionCount: 567,
    collectionRate: 88,
    aiUsageThisMonth: 450,
    storageUsedMb: 312,
    createdAt: '2025-04-20T09:00:00Z',
    lastActivityAt: '2026-02-23T08:00:00Z',
    contactEmail: 'pepper@stark.co.jp',
    contactName: '山本明美',
  },
  {
    id: 'tenant-005',
    code: 'WAYNE',
    companyName: 'Wayne Enterprises Japan',
    companyNameJa: 'ウェイン・エンタープライズ・ジャパン',
    status: 'provisioning',
    supabaseProjectRef: 'wayne-dc-prod',
    supabaseUrl: 'https://wayne-dc-prod.supabase.co',
    region: 'ap-northeast-1',
    plan: 'PRO',
    templateCount: 0,
    submissionCount: 0,
    collectionRate: 0,
    aiUsageThisMonth: 0,
    storageUsedMb: 0,
    createdAt: '2026-02-20T09:00:00Z',
    lastActivityAt: '2026-02-20T09:00:00Z',
    contactEmail: 'lucius@wayne.co.jp',
    contactName: '中村正義',
  },
];

// =============================================================================
// Templates
// =============================================================================

const MOCK_TEMPLATES: DataCollectionTemplate[] = [
  {
    id: 'tmpl-001',
    name: 'Monthly Sales Report',
    nameJa: '月次売上報告',
    category: '経理',
    descriptionJa: '各部門の月次売上を報告するテンプレート',
    version: 3,
    status: 'published',
    schedule: 'monthly',
    deadline: '2026-02-28T23:59:59Z',
    templateFileUrl: '/storage/templates/monthly-sales-v3.xlsx',
    mapping: { version: 1, targetTable: 'monthly_sales', fields: [], autoFields: [] },
    schema: { version: 1, logicalTableName: 'monthly_sales', logicalTableNameJa: '月次売上', fields: [] },
    validationRules: [],
    tabColor: '#2563EB',
    createdBy: 'admin@harmonicinsight.com',
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    tenantId: 'tenant-001',
  },
  {
    id: 'tmpl-002',
    name: 'Expense Report',
    nameJa: '経費精算書',
    category: '経理',
    descriptionJa: '従業員の経費精算テンプレート',
    version: 2,
    status: 'published',
    schedule: 'monthly',
    deadline: '2026-03-05T23:59:59Z',
    templateFileUrl: '/storage/templates/expense-v2.xlsx',
    mapping: { version: 1, targetTable: 'expenses', fields: [], autoFields: [] },
    schema: { version: 1, logicalTableName: 'expenses', logicalTableNameJa: '経費', fields: [] },
    validationRules: [],
    tabColor: '#16A34A',
    createdBy: 'admin@harmonicinsight.com',
    createdAt: '2025-07-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    tenantId: 'tenant-001',
  },
  {
    id: 'tmpl-003',
    name: 'Headcount Planning',
    nameJa: '人員計画',
    category: '人事',
    descriptionJa: '部門別の人員計画テンプレート',
    version: 1,
    status: 'draft',
    schedule: 'quarterly',
    deadline: null,
    templateFileUrl: '/storage/templates/headcount-v1.xlsx',
    mapping: { version: 1, targetTable: 'headcount', fields: [], autoFields: [] },
    schema: { version: 1, logicalTableName: 'headcount', logicalTableNameJa: '人員計画', fields: [] },
    validationRules: [],
    tabColor: '#D97706',
    createdBy: 'admin@harmonicinsight.com',
    createdAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-02-10T00:00:00Z',
    tenantId: 'tenant-001',
  },
];

// =============================================================================
// Submissions
// =============================================================================

const MOCK_SUBMISSIONS: DataCollectionSubmission[] = [
  {
    id: 'sub-001', templateId: 'tmpl-001', templateVersion: 3, tenantId: 'tenant-001',
    submitterEmail: 'yamada@acme.co.jp', submitterName: '山田太郎',
    status: 'accepted', data: { revenue: 15000000, cost: 8000000, department: '営業部' },
    submittedAt: '2026-02-20T10:30:00Z', reviewedAt: '2026-02-21T09:00:00Z', reviewedBy: 'admin', aiTransferUsed: true,
  },
  {
    id: 'sub-002', templateId: 'tmpl-001', templateVersion: 3, tenantId: 'tenant-001',
    submitterEmail: 'suzuki@acme.co.jp', submitterName: '鈴木花子',
    status: 'submitted', data: { revenue: 12000000, cost: 6500000, department: 'マーケティング部' },
    submittedAt: '2026-02-22T14:00:00Z', aiTransferUsed: false,
  },
  {
    id: 'sub-003', templateId: 'tmpl-002', templateVersion: 2, tenantId: 'tenant-001',
    submitterEmail: 'tanaka@acme.co.jp', submitterName: '田中一郎',
    status: 'rejected', data: { amount: 50000, category: '交通費' },
    submittedAt: '2026-02-19T16:00:00Z', reviewedAt: '2026-02-20T11:00:00Z', reviewedBy: 'admin',
    rejectionReason: '領収書が添付されていません', aiTransferUsed: false,
  },
];

// =============================================================================
// Collection
// =============================================================================

export const MOCK_COLLECTION_SUMMARY: CollectionSummary[] = [
  {
    templateId: 'tmpl-001', templateName: 'Monthly Sales Report', templateNameJa: '月次売上報告',
    deadline: '2026-02-28T23:59:59Z', totalExpected: 15, submittedCount: 10, acceptedCount: 8,
    rejectedCount: 1, pendingCount: 1, draftCount: 3, collectionRate: 67,
  },
  {
    templateId: 'tmpl-002', templateName: 'Expense Report', templateNameJa: '経費精算書',
    deadline: '2026-03-05T23:59:59Z', totalExpected: 50, submittedCount: 42, acceptedCount: 38,
    rejectedCount: 2, pendingCount: 2, draftCount: 5, collectionRate: 84,
  },
];

// =============================================================================
// Health
// =============================================================================

export const MOCK_HEALTH: HealthCheckResult[] = [
  {
    tenantId: 'tenant-001', tenantCode: 'ACME', companyNameJa: 'ACMEコーポレーション', status: 'active',
    health: { dbConnected: true, storageAvailable: true, apiResponseMs: 45, lastCheckedAt: '2026-02-23T08:00:00Z', issues: [] },
  },
  {
    tenantId: 'tenant-002', tenantCode: 'GLOBEX', companyNameJa: 'グローベックス工業', status: 'active',
    health: { dbConnected: true, storageAvailable: true, apiResponseMs: 62, lastCheckedAt: '2026-02-23T08:00:00Z', issues: [] },
  },
  {
    tenantId: 'tenant-003', tenantCode: 'INITECH', companyNameJa: 'イニテック株式会社', status: 'suspended',
    health: { dbConnected: false, storageAvailable: true, apiResponseMs: -1, lastCheckedAt: '2026-02-23T08:00:00Z', issues: ['DB接続タイムアウト'] },
  },
  {
    tenantId: 'tenant-004', tenantCode: 'STARK', companyNameJa: 'スターク・インダストリーズ・ジャパン', status: 'active',
    health: { dbConnected: true, storageAvailable: true, apiResponseMs: 38, lastCheckedAt: '2026-02-23T08:00:00Z', issues: [] },
  },
];

// =============================================================================
// AI Usage
// =============================================================================

export const MOCK_AI_USAGE = {
  tenants: MOCK_TENANTS.filter(t => t.status === 'active').map(t => ({
    tenantId: t.id,
    tenantCode: t.code,
    companyNameJa: t.companyNameJa,
    usage: [
      { month: '2025-09', aiTransferCount: 45, aiValidateCount: 30, submissionCount: 28 },
      { month: '2025-10', aiTransferCount: 52, aiValidateCount: 38, submissionCount: 35 },
      { month: '2025-11', aiTransferCount: 60, aiValidateCount: 45, submissionCount: 42 },
      { month: '2025-12', aiTransferCount: 48, aiValidateCount: 35, submissionCount: 30 },
      { month: '2026-01', aiTransferCount: 65, aiValidateCount: 50, submissionCount: 48 },
      { month: '2026-02', aiTransferCount: Math.round(t.aiUsageThisMonth * 0.6), aiValidateCount: Math.round(t.aiUsageThisMonth * 0.4), submissionCount: Math.round(t.submissionCount * 0.08) },
    ] satisfies MonthlyUsage[],
  })),
};

// =============================================================================
// Tenant Detail
// =============================================================================

export function getMockTenantDetail(tenantId: string): TenantDetail | null {
  const tenant = MOCK_TENANTS.find(t => t.id === tenantId);
  if (!tenant) return null;
  return {
    ...tenant,
    templates: MOCK_TEMPLATES.filter(t => t.tenantId === tenantId),
    recentSubmissions: MOCK_SUBMISSIONS.filter(s => s.tenantId === tenantId),
    aiUsageHistory: MOCK_AI_USAGE.tenants.find(t => t.tenantId === tenantId)?.usage || [],
    healthStatus: MOCK_HEALTH.find(h => h.tenantId === tenantId)?.health || {
      dbConnected: true, storageAvailable: true, apiResponseMs: 50, lastCheckedAt: new Date().toISOString(), issues: [],
    },
  };
}
