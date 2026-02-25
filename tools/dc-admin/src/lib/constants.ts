/**
 * DC Admin Console — 定数
 *
 * Cool Blue & Slate テーマに準拠。
 */

// =============================================================================
// Cool Blue & Slate カラー
// =============================================================================

export const COLORS = {
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  primaryLight: '#DBEAFE',

  background: '#F8FAFC',
  backgroundCard: '#FFFFFF',
  sidebar: '#1E293B',
  sidebarHover: '#334155',
  sidebarActive: '#0F172A',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textSidebar: '#94A3B8',
  textSidebarActive: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#0EA5E9',
  infoLight: '#E0F2FE',
} as const;

// =============================================================================
// テナントステータス
// =============================================================================

export const TENANT_STATUS_CONFIG = {
  active: { label: '稼働中', labelEn: 'Active', color: COLORS.success, bgColor: COLORS.successLight },
  suspended: { label: '停止中', labelEn: 'Suspended', color: COLORS.warning, bgColor: COLORS.warningLight },
  decommissioned: { label: '廃止', labelEn: 'Decommissioned', color: COLORS.error, bgColor: COLORS.errorLight },
  provisioning: { label: 'セットアップ中', labelEn: 'Provisioning', color: COLORS.info, bgColor: COLORS.infoLight },
} as const;

// =============================================================================
// テンプレートステータス
// =============================================================================

export const TEMPLATE_STATUS_CONFIG = {
  draft: { label: '下書き', labelEn: 'Draft', color: COLORS.textSecondary, bgColor: COLORS.borderLight },
  published: { label: '公開中', labelEn: 'Published', color: COLORS.success, bgColor: COLORS.successLight },
  archived: { label: 'アーカイブ', labelEn: 'Archived', color: COLORS.warning, bgColor: COLORS.warningLight },
} as const;

// =============================================================================
// 送信ステータス
// =============================================================================

export const SUBMISSION_STATUS_CONFIG = {
  draft: { label: '下書き', labelEn: 'Draft', color: COLORS.textSecondary, bgColor: COLORS.borderLight },
  submitted: { label: '送信済み', labelEn: 'Submitted', color: COLORS.primary, bgColor: COLORS.primaryLight },
  accepted: { label: '承認', labelEn: 'Accepted', color: COLORS.success, bgColor: COLORS.successLight },
  rejected: { label: '却下', labelEn: 'Rejected', color: COLORS.error, bgColor: COLORS.errorLight },
  pending_review: { label: 'レビュー待ち', labelEn: 'Pending Review', color: COLORS.warning, bgColor: COLORS.warningLight },
} as const;

// =============================================================================
// スケジュール
// =============================================================================

export const SCHEDULE_LABELS: Record<string, { ja: string; en: string }> = {
  once: { ja: '単発', en: 'One-time' },
  monthly: { ja: '月次', en: 'Monthly' },
  quarterly: { ja: '四半期', en: 'Quarterly' },
  yearly: { ja: '年次', en: 'Yearly' },
  custom: { ja: 'カスタム', en: 'Custom' },
};

// =============================================================================
// ナビゲーション
// =============================================================================

export const NAV_ITEMS = [
  { path: '/', label: 'ダッシュボード', labelEn: 'Dashboard', icon: 'grid' },
  { path: '/tenants', label: 'テナント管理', labelEn: 'Tenants', icon: 'building' },
  { path: '/templates/distribute', label: 'テンプレート配布', labelEn: 'Templates', icon: 'file-spreadsheet' },
  { path: '/collection', label: '回収状況', labelEn: 'Collection', icon: 'bar-chart' },
  { path: '/ai-usage', label: 'AI 利用量', labelEn: 'AI Usage', icon: 'cpu' },
  { path: '/migration', label: 'マイグレーション', labelEn: 'Migration', icon: 'database' },
  { path: '/health', label: 'ヘルスチェック', labelEn: 'Health', icon: 'heart-pulse' },
] as const;
