/**
 * Harmonic Insight 製品・プラン定義
 *
 * 全製品で共通利用する製品コード、プラン、機能制限を定義
 */

// =============================================================================
// 型定義
// =============================================================================

export type ProductCode = 'INSS' | 'INSP' | 'INPY' | 'FGIN' | 'INMV';
export type PlanCode = 'FREE' | 'TRIAL' | 'STD' | 'PRO' | 'ENT';

export interface ProductInfo {
  code: ProductCode;
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
}

export interface PlanInfo {
  code: PlanCode;
  name: string;
  nameJa: string;
  priority: number; // 高いほど上位プラン
}

export interface PlanLimits {
  /** 月間利用上限（-1 = 無制限） */
  monthlyLimit: number;
  /** 最大ファイルサイズ (MB) */
  maxFileSizeMB: number;
  /** 最大保存数 */
  maxStorageItems: number;
  /** 最大解像度（動画系） */
  maxResolution?: '720p' | '1080p' | '4K';
  /** ウォーターマーク有無 */
  hasWatermark: boolean;
  /** バッチ処理可能 */
  batchEnabled: boolean;
  /** API利用可能 */
  apiEnabled: boolean;
  /** 優先処理 */
  priorityProcessing: boolean;
}

// =============================================================================
// 製品定義
// =============================================================================

export const PRODUCTS: Record<ProductCode, ProductInfo> = {
  INSS: {
    code: 'INSS',
    name: 'InsightSlide Standard',
    nameJa: 'InsightSlide スタンダード',
    description: 'AI-powered slide creation tool',
    descriptionJa: 'AIによるスライド作成ツール',
  },
  INSP: {
    code: 'INSP',
    name: 'InsightSlide Pro',
    nameJa: 'InsightSlide プロ',
    description: 'Advanced AI slide creation with professional features',
    descriptionJa: 'プロ向け機能搭載のAIスライド作成ツール',
  },
  INPY: {
    code: 'INPY',
    name: 'InsightPy',
    nameJa: 'InsightPy',
    description: 'Python learning platform with AI assistance',
    descriptionJa: 'AI支援付きPython学習プラットフォーム',
  },
  FGIN: {
    code: 'FGIN',
    name: 'ForguncyInsight',
    nameJa: 'ForguncyInsight',
    description: 'Forguncy integration and analytics',
    descriptionJa: 'Forguncy連携・分析ツール',
  },
  INMV: {
    code: 'INMV',
    name: 'InsightMovie',
    nameJa: 'InsightMovie',
    description: 'AI video creation from images, text, and PowerPoint',
    descriptionJa: '画像・テキスト・PPTからAI動画作成',
  },
};

// =============================================================================
// プラン定義
// =============================================================================

export const PLANS: Record<PlanCode, PlanInfo> = {
  FREE: {
    code: 'FREE',
    name: 'Free',
    nameJa: 'フリー',
    priority: 0,
  },
  TRIAL: {
    code: 'TRIAL',
    name: 'Trial',
    nameJa: 'トライアル',
    priority: 1,
  },
  STD: {
    code: 'STD',
    name: 'Standard',
    nameJa: 'スタンダード',
    priority: 2,
  },
  PRO: {
    code: 'PRO',
    name: 'Pro',
    nameJa: 'プロ',
    priority: 3,
  },
  ENT: {
    code: 'ENT',
    name: 'Enterprise',
    nameJa: 'エンタープライズ',
    priority: 4,
  },
};

// =============================================================================
// プラン別制限（デフォルト）
// =============================================================================

export const DEFAULT_PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  FREE: {
    monthlyLimit: 10,
    maxFileSizeMB: 10,
    maxStorageItems: 5,
    maxResolution: '720p',
    hasWatermark: true,
    batchEnabled: false,
    apiEnabled: false,
    priorityProcessing: false,
  },
  TRIAL: {
    monthlyLimit: 20,
    maxFileSizeMB: 50,
    maxStorageItems: 10,
    maxResolution: '1080p',
    hasWatermark: true,
    batchEnabled: true,
    apiEnabled: false,
    priorityProcessing: false,
  },
  STD: {
    monthlyLimit: 100,
    maxFileSizeMB: 100,
    maxStorageItems: 50,
    maxResolution: '1080p',
    hasWatermark: false,
    batchEnabled: true,
    apiEnabled: false,
    priorityProcessing: false,
  },
  PRO: {
    monthlyLimit: -1, // 無制限
    maxFileSizeMB: 500,
    maxStorageItems: 500,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: true,
    apiEnabled: false,
    priorityProcessing: true,
  },
  ENT: {
    monthlyLimit: -1,
    maxFileSizeMB: 2000,
    maxStorageItems: -1,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: true,
    apiEnabled: true,
    priorityProcessing: true,
  },
};

// =============================================================================
// InsightMovie 専用制限
// =============================================================================

export const INMV_PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  FREE: {
    monthlyLimit: -1,       // 無制限
    maxFileSizeMB: 100,
    maxStorageItems: -1,
    maxResolution: '1080p',
    hasWatermark: false,
    batchEnabled: false,
    apiEnabled: false,
    priorityProcessing: false,
  },
  TRIAL: {
    monthlyLimit: -1,
    maxFileSizeMB: 100,
    maxStorageItems: -1,
    maxResolution: '1080p',
    hasWatermark: false,
    batchEnabled: false,
    apiEnabled: false,
    priorityProcessing: false,
  },
  STD: {
    monthlyLimit: -1,
    maxFileSizeMB: 200,
    maxStorageItems: -1,
    maxResolution: '1080p',
    hasWatermark: false,
    batchEnabled: false,
    apiEnabled: false,
    priorityProcessing: false,
  },
  PRO: {
    monthlyLimit: -1,
    maxFileSizeMB: 1000,
    maxStorageItems: -1,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: false,
    apiEnabled: false,
    priorityProcessing: false,
  },
  ENT: {
    monthlyLimit: -1,
    maxFileSizeMB: -1,
    maxStorageItems: -1,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: false,
    apiEnabled: true,
    priorityProcessing: false,
  },
};

// =============================================================================
// 製品別制限マッピング
// =============================================================================

export const PRODUCT_PLAN_LIMITS: Partial<Record<ProductCode, Record<PlanCode, PlanLimits>>> = {
  INMV: INMV_PLAN_LIMITS,
};

/**
 * 製品・プランの制限を取得
 */
export function getPlanLimits(productCode: ProductCode, planCode: PlanCode): PlanLimits {
  const productLimits = PRODUCT_PLAN_LIMITS[productCode];
  if (productLimits && productLimits[planCode]) {
    return productLimits[planCode];
  }
  return DEFAULT_PLAN_LIMITS[planCode];
}

// =============================================================================
// 機能マトリクス
// =============================================================================

export const FEATURE_MATRIX: Record<string, PlanCode[]> = {
  // ========================================
  // 共通機能
  // ========================================
  'basic': ['FREE', 'TRIAL', 'STD', 'PRO', 'ENT'],
  'export_pdf': ['STD', 'PRO', 'ENT'],
  'export_excel': ['STD', 'PRO', 'ENT'],
  'cloud_sync': ['STD', 'PRO', 'ENT'],
  'batch_process': ['PRO', 'ENT'],
  'advanced_filter': ['PRO', 'ENT'],
  'priority_support': ['PRO', 'ENT'],
  'api_access': ['ENT'],
  'sso': ['ENT'],
  'audit_log': ['ENT'],
  'custom_branding': ['ENT'],

  // ========================================
  // InsightMovie (INMV) 専用機能
  // ========================================
  // 基本機能（全プラン）
  'video_generate': ['FREE', 'TRIAL', 'STD', 'PRO', 'ENT'],  // 基本動画生成

  // Pro以上のみ
  'subtitle': ['PRO', 'ENT'],              // 字幕機能
  'subtitle_style': ['PRO', 'ENT'],        // 字幕スタイル選択
  'transition': ['PRO', 'ENT'],            // トランジション効果
  'pptx_import': ['PRO', 'ENT'],           // PPTX取込
};

/**
 * 機能が利用可能かチェック
 */
export function canAccessFeature(feature: string, planCode: PlanCode): boolean {
  const allowedPlans = FEATURE_MATRIX[feature];
  if (!allowedPlans) {
    // 未定義の機能はデフォルト許可（安全側）
    console.warn(`Unknown feature: ${feature} - allowing by default`);
    return true;
  }
  return allowedPlans.includes(planCode);
}

/**
 * プランが別のプラン以上かチェック
 */
export function isPlanAtLeast(userPlan: PlanCode, requiredPlan: PlanCode): boolean {
  return PLANS[userPlan].priority >= PLANS[requiredPlan].priority;
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  PRODUCTS,
  PLANS,
  DEFAULT_PLAN_LIMITS,
  INMV_PLAN_LIMITS,
  FEATURE_MATRIX,
  getPlanLimits,
  canAccessFeature,
  isPlanAtLeast,
};
