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
  description: string;
  descriptionJa: string;
  defaultDurationMonths: number; // デフォルト有効期間（月）、-1は要相談
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
    name: 'InsightSlide',
    nameJa: 'InsightSlide',
    description: 'PowerPoint content extraction and update tool',
    descriptionJa: 'PowerPointコンテンツ抽出・更新ツール',
  },
  INSP: {
    code: 'INSP',
    name: 'InsightSlide Pro',
    nameJa: 'InsightSlide プロ',
    description: 'Advanced PowerPoint tool with professional features',
    descriptionJa: 'プロ向け機能搭載のPowerPointツール',
  },
  INPY: {
    code: 'INPY',
    name: 'InsightPy',
    nameJa: 'InsightPy',
    description: 'Python execution environment for Windows automation',
    descriptionJa: 'Windows自動化のためのPython実行環境',
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
    description: 'Basic features with limitations',
    descriptionJa: '機能制限あり',
    defaultDurationMonths: -1, // 無期限
  },
  TRIAL: {
    code: 'TRIAL',
    name: 'Trial',
    nameJa: 'トライアル',
    priority: 4, // 全機能使えるため最上位と同等
    description: 'Full features for evaluation',
    descriptionJa: '全機能利用可能（期間限定）',
    defaultDurationMonths: 1, // 標準1ヶ月、発行時に自由設定可
  },
  STD: {
    code: 'STD',
    name: 'Standard',
    nameJa: 'スタンダード',
    priority: 2,
    description: 'Standard features for regular use',
    descriptionJa: '標準機能',
    defaultDurationMonths: 12,
  },
  PRO: {
    code: 'PRO',
    name: 'Pro',
    nameJa: 'プロ',
    priority: 3,
    description: 'All features with priority support',
    descriptionJa: '全機能',
    defaultDurationMonths: 12,
  },
  ENT: {
    code: 'ENT',
    name: 'Enterprise',
    nameJa: 'エンタープライズ',
    priority: 4,
    description: 'Custom features and dedicated support',
    descriptionJa: 'カスタマイズ（要相談）',
    defaultDurationMonths: -1, // 要相談
  },
};

// =============================================================================
// プラン別制限（デフォルト）
// =============================================================================

export const DEFAULT_PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  FREE: {
    monthlyLimit: -1,
    maxFileSizeMB: 10,
    maxStorageItems: 5,
    maxResolution: '720p',
    hasWatermark: false,
    batchEnabled: false,
    apiEnabled: false,
    priorityProcessing: false,
  },
  TRIAL: {
    monthlyLimit: -1,
    maxFileSizeMB: -1,
    maxStorageItems: -1,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: true,
    apiEnabled: false,
    priorityProcessing: false,
  },
  STD: {
    monthlyLimit: -1,
    maxFileSizeMB: 100,
    maxStorageItems: 50,
    maxResolution: '1080p',
    hasWatermark: false,
    batchEnabled: true,
    apiEnabled: false,
    priorityProcessing: false,
  },
  PRO: {
    monthlyLimit: -1,
    maxFileSizeMB: -1,
    maxStorageItems: -1,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: true,
    apiEnabled: false,
    priorityProcessing: true,
  },
  ENT: {
    monthlyLimit: -1,
    maxFileSizeMB: -1,
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
    monthlyLimit: -1,
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
    maxFileSizeMB: -1,
    maxStorageItems: -1,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: true,
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
    maxFileSizeMB: -1,
    maxStorageItems: -1,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: true,
    apiEnabled: false,
    priorityProcessing: false,
  },
  ENT: {
    monthlyLimit: -1,
    maxFileSizeMB: -1,
    maxStorageItems: -1,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: true,
    apiEnabled: true,
    priorityProcessing: true,
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
  'api_access': ['ENT'],
  'sso': ['ENT'],
  'audit_log': ['ENT'],
  'custom_branding': ['ENT'],

  // ========================================
  // InsightSlide (INSS) 専用機能
  // ========================================
  'inss_extract': ['FREE', 'TRIAL', 'STD', 'PRO', 'ENT'],       // Extract機能
  'inss_update': ['FREE', 'TRIAL', 'STD', 'PRO', 'ENT'],        // Update機能（FREEは3スライド制限）
  'inss_update_unlimited': ['TRIAL', 'STD', 'PRO', 'ENT'],      // 無制限Update
  'inss_json': ['TRIAL', 'STD', 'PRO', 'ENT'],                  // JSON入出力
  'inss_batch': ['TRIAL', 'STD', 'PRO', 'ENT'],                 // フォルダ一括処理
  'inss_compare': ['TRIAL', 'STD', 'PRO', 'ENT'],               // 2ファイル比較
  'inss_auto_backup': ['TRIAL', 'PRO', 'ENT'],                  // 自動バックアップ

  // ========================================
  // InsightPy (INPY) 専用機能
  // ========================================
  'inpy_execute': ['FREE', 'TRIAL', 'STD', 'PRO', 'ENT'],       // コード実行
  'inpy_presets': ['FREE', 'TRIAL', 'STD', 'PRO', 'ENT'],       // プリセット利用
  'inpy_scripts_3': ['FREE'],                                    // 3スクリプト保存
  'inpy_scripts_50': ['STD'],                                    // 50スクリプト保存
  'inpy_scripts_unlimited': ['TRIAL', 'PRO', 'ENT'],            // 無制限スクリプト
  'inpy_cloud_sync': ['TRIAL', 'PRO', 'ENT'],                   // クラウド同期

  // ========================================
  // InsightMovie (INMV) 専用機能
  // ========================================
  'inmv_generate': ['FREE', 'TRIAL', 'STD', 'PRO', 'ENT'],      // 基本動画生成
  'inmv_subtitle': ['TRIAL', 'PRO', 'ENT'],                     // 字幕機能
  'inmv_subtitle_style': ['TRIAL', 'PRO', 'ENT'],               // 字幕スタイル選択
  'inmv_transition': ['TRIAL', 'PRO', 'ENT'],                   // トランジション効果
  'inmv_pptx_import': ['TRIAL', 'PRO', 'ENT'],                  // PPTX取込

  // ========================================
  // 後方互換性のための旧キー（非推奨）
  // ========================================
  'subtitle': ['TRIAL', 'PRO', 'ENT'],
  'subtitle_style': ['TRIAL', 'PRO', 'ENT'],
  'transition': ['TRIAL', 'PRO', 'ENT'],
  'pptx_import': ['TRIAL', 'PRO', 'ENT'],
  'video_generate': ['FREE', 'TRIAL', 'STD', 'PRO', 'ENT'],
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
 * 注意: TRIALは全機能使えるため特殊扱い
 */
export function isPlanAtLeast(userPlan: PlanCode, requiredPlan: PlanCode): boolean {
  // TRIALは全機能使えるので、どのプランが要求されても許可
  if (userPlan === 'TRIAL') {
    return true;
  }
  return PLANS[userPlan].priority >= PLANS[requiredPlan].priority;
}

/**
 * プラン表示名を取得
 */
export function getPlanDisplayName(plan: PlanCode, locale: 'en' | 'ja' = 'ja'): string {
  const planInfo = PLANS[plan];
  return locale === 'ja' ? planInfo.nameJa : planInfo.name;
}

/**
 * 製品表示名を取得
 */
export function getProductDisplayName(product: ProductCode, locale: 'en' | 'ja' = 'ja'): string {
  const productInfo = PRODUCTS[product];
  return locale === 'ja' ? productInfo.nameJa : productInfo.name;
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
  getPlanDisplayName,
  getProductDisplayName,
};
