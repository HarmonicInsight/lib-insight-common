/**
 * DC Admin Console — 型定義
 *
 * data-collection.ts から必要な型をポートしたもの。
 * Admin Console 固有の型も含む。
 */

// =============================================================================
// テンプレート
// =============================================================================

export type TemplateStatus = 'draft' | 'published' | 'archived';
export type TemplateSchedule = 'once' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type MappingFieldType = 'string' | 'number' | 'integer' | 'date' | 'boolean' | 'currency' | 'percentage';
export type ValidationRuleType = 'required' | 'min' | 'max' | 'range' | 'regex' | 'enum' | 'cross_field' | 'date_range';
export type SubmissionStatus = 'draft' | 'submitted' | 'accepted' | 'rejected' | 'pending_review';

export interface MappingField {
  namedRange: string;
  dbColumn: string;
  labelJa: string;
  label: string;
  type: MappingFieldType;
  required: boolean;
  defaultValue?: string | number | boolean;
  descriptionJa?: string;
  decimalPlaces?: number;
  currencyCode?: string;
  dateFormat?: string;
  aiTransferHints?: string[];
}

export interface AutoField {
  dbColumn: string;
  source: 'submitter_email' | 'submitted_at' | 'template_id' | 'template_version' | 'license_key' | 'tenant_id';
}

export interface TemplateMappingDefinition {
  version: number;
  targetTable: string;
  fields: MappingField[];
  autoFields: AutoField[];
}

export interface ValidationRule {
  id: string;
  targetField: string;
  type: ValidationRuleType;
  params: Record<string, unknown>;
  messageJa: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface SchemaField {
  key: string;
  label: string;
  labelJa: string;
  type: MappingFieldType;
  required: boolean;
  defaultValue?: unknown;
  descriptionJa?: string;
  decimalPlaces?: number;
  currencyCode?: string;
  dateFormat?: string;
}

export interface TemplateDataSchema {
  version: number;
  logicalTableName: string;
  logicalTableNameJa: string;
  fields: SchemaField[];
  uniqueKeys?: string[];
}

export interface DataCollectionTemplate {
  id: string;
  name: string;
  nameJa: string;
  category: string;
  description?: string;
  descriptionJa?: string;
  version: number;
  status: TemplateStatus;
  schedule: TemplateSchedule;
  deadline: string | null;
  templateFileUrl: string;
  mapping: TemplateMappingDefinition;
  schema: TemplateDataSchema;
  validationRules: ValidationRule[];
  tabColor: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

export interface DataCollectionSubmission {
  id: string;
  templateId: string;
  templateVersion: number;
  tenantId: string;
  submitterEmail: string;
  submitterName?: string;
  status: SubmissionStatus;
  data: Record<string, unknown>;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  aiValidationSnapshot?: unknown;
  aiTransferUsed: boolean;
}

// =============================================================================
// テナント管理（Admin Console 固有）
// =============================================================================

export type TenantStatus = 'active' | 'suspended' | 'decommissioned' | 'provisioning';

export interface Tenant {
  id: string;
  code: string;
  companyName: string;
  companyNameJa: string;
  status: TenantStatus;
  supabaseProjectRef: string;
  supabaseUrl: string;
  region: string;
  plan: 'FREE' | 'TRIAL' | 'BIZ' | 'ENT';
  templateCount: number;
  submissionCount: number;
  collectionRate: number;
  aiUsageThisMonth: number;
  storageUsedMb: number;
  createdAt: string;
  lastActivityAt: string;
  contactEmail: string;
  contactName: string;
}

export interface TenantCreateRequest {
  code: string;
  companyName: string;
  companyNameJa: string;
  plan: 'FREE' | 'TRIAL' | 'BIZ' | 'ENT';
  region: string;
  contactEmail: string;
  contactName: string;
  distributeInitialTemplates: boolean;
}

export interface TenantDetail extends Tenant {
  templates: DataCollectionTemplate[];
  recentSubmissions: DataCollectionSubmission[];
  aiUsageHistory: MonthlyUsage[];
  healthStatus: HealthStatus;
}

// =============================================================================
// Analytics
// =============================================================================

export interface DashboardStats {
  activeTenants: number;
  totalTemplates: number;
  overallCollectionRate: number;
  totalAiUsageThisMonth: number;
  totalSubmissionsThisMonth: number;
  tenantsNearDeadline: number;
}

export interface CollectionSummary {
  templateId: string;
  templateName: string;
  templateNameJa: string;
  deadline: string | null;
  totalExpected: number;
  submittedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
  draftCount: number;
  collectionRate: number;
}

export interface MonthlyUsage {
  month: string;
  aiTransferCount: number;
  aiValidateCount: number;
  submissionCount: number;
}

export interface HealthStatus {
  dbConnected: boolean;
  storageAvailable: boolean;
  apiResponseMs: number;
  lastCheckedAt: string;
  issues: string[];
}

export interface HealthCheckResult {
  tenantId: string;
  tenantCode: string;
  companyNameJa: string;
  status: TenantStatus;
  health: HealthStatus;
}

// =============================================================================
// Template Distribution
// =============================================================================

export interface DistributionRequest {
  templateId: string;
  targetTenantIds: string[];
  overwrite: boolean;
}

export interface DistributionStatus {
  requestId: string;
  templateId: string;
  templateNameJa: string;
  totalTenants: number;
  completedTenants: number;
  failedTenants: number;
  status: 'in_progress' | 'completed' | 'failed';
  results: DistributionResult[];
}

export interface DistributionResult {
  tenantId: string;
  tenantCode: string;
  success: boolean;
  error?: string;
}

// =============================================================================
// Migration
// =============================================================================

export interface MigrationRequest {
  targetTenantIds: string[] | 'all';
  migrationScript: string;
  dryRun: boolean;
}

export interface MigrationStatus {
  requestId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalTenants: number;
  completedTenants: number;
  failedTenants: number;
  logs: string[];
}
