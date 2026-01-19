/**
 * Harmonic Insight 製品・プラン定義
 *
 * 全製品で共通利用する製品コード、プラン、機能制限を定義
 *
 * ## 設計方針
 * - 機能は製品ごとに定義（PRODUCT_FEATURES）
 * - 数値制限はlimitValuesで表現
 * - ブール型機能はallowedPlansで制御
 * - 製品をまたいだ機能チェックを防止
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

/**
 * 機能定義
 * - type: 'boolean' = 有効/無効のみ、'limit' = 数値制限あり
 * - allowedPlans: この機能が有効なプラン一覧
 * - limitValues: 数値制限の場合、プラン別の値（-1 = 無制限）
 */
export interface FeatureDefinition {
  key: string;
  product: ProductCode;
  name: string;
  nameJa: string;
  type: 'boolean' | 'limit';
  allowedPlans: PlanCode[];
  limitValues?: Partial<Record<PlanCode, number>>;
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
// 製品別機能定義（標準化）
// =============================================================================

/**
 * 製品別の機能定義
 * - 各製品の機能を明確に定義
 * - type: 'boolean' | 'limit' で制御方法を統一
 * - limitValues で数値制限を表現
 */
export const PRODUCT_FEATURES: Record<ProductCode, FeatureDefinition[]> = {
  // ========================================
  // InsightSlide (INSS)
  // ========================================
  INSS: [
    {
      key: 'extract',
      product: 'INSS',
      name: 'Extract',
      nameJa: 'コンテンツ抽出',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'STD', 'PRO', 'ENT'],
    },
    {
      key: 'update',
      product: 'INSS',
      name: 'Update',
      nameJa: 'コンテンツ更新',
      type: 'limit',
      allowedPlans: ['FREE', 'TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { FREE: 3, TRIAL: -1, STD: -1, PRO: -1, ENT: -1 },
    },
    {
      key: 'json',
      product: 'INSS',
      name: 'JSON I/O',
      nameJa: 'JSON入出力',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
    },
    {
      key: 'batch',
      product: 'INSS',
      name: 'Batch Processing',
      nameJa: 'フォルダ一括処理',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
    },
    {
      key: 'compare',
      product: 'INSS',
      name: 'File Compare',
      nameJa: '2ファイル比較',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
    },
    {
      key: 'auto_backup',
      product: 'INSS',
      name: 'Auto Backup',
      nameJa: '自動バックアップ',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    },
  ],

  // ========================================
  // InsightSlide Pro (INSP) - INSSの上位版
  // ========================================
  INSP: [
    // INSSと同じ機能 + Pro専用機能を追加可能
  ],

  // ========================================
  // InsightPy (INPY)
  // ========================================
  INPY: [
    {
      key: 'execute',
      product: 'INPY',
      name: 'Code Execution',
      nameJa: 'コード実行',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'STD', 'PRO', 'ENT'],
    },
    {
      key: 'presets',
      product: 'INPY',
      name: 'Presets',
      nameJa: 'プリセット利用',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'STD', 'PRO', 'ENT'],
    },
    {
      key: 'scripts',
      product: 'INPY',
      name: 'Script Storage',
      nameJa: 'スクリプト保存数',
      type: 'limit',
      allowedPlans: ['FREE', 'TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { FREE: 3, TRIAL: -1, STD: 50, PRO: -1, ENT: -1 },
    },
    {
      key: 'cloud_sync',
      product: 'INPY',
      name: 'Cloud Sync',
      nameJa: 'クラウド同期',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    },
  ],

  // ========================================
  // ForguncyInsight (FGIN)
  // ========================================
  FGIN: [
    // 機能定義を追加
  ],

  // ========================================
  // InsightMovie (INMV)
  // ========================================
  INMV: [
    {
      key: 'generate',
      product: 'INMV',
      name: 'Video Generation',
      nameJa: '動画生成',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'STD', 'PRO', 'ENT'],
    },
    {
      key: 'subtitle',
      product: 'INMV',
      name: 'Subtitle',
      nameJa: '字幕',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    },
    {
      key: 'subtitle_style',
      product: 'INMV',
      name: 'Subtitle Style',
      nameJa: '字幕スタイル選択',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    },
    {
      key: 'transition',
      product: 'INMV',
      name: 'Transition',
      nameJa: 'トランジション',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    },
    {
      key: 'pptx_import',
      product: 'INMV',
      name: 'PPTX Import',
      nameJa: 'PPTX取込',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    },
  ],
};

// =============================================================================
// 共通機能（全製品共通）
// =============================================================================

export const COMMON_FEATURES: FeatureDefinition[] = [
  {
    key: 'api_access',
    product: 'INSS', // ダミー、共通なので実際には使用しない
    name: 'API Access',
    nameJa: 'API利用',
    type: 'boolean',
    allowedPlans: ['ENT'],
  },
  {
    key: 'sso',
    product: 'INSS',
    name: 'SSO',
    nameJa: 'シングルサインオン',
    type: 'boolean',
    allowedPlans: ['ENT'],
  },
  {
    key: 'audit_log',
    product: 'INSS',
    name: 'Audit Log',
    nameJa: '監査ログ',
    type: 'boolean',
    allowedPlans: ['ENT'],
  },
];

// =============================================================================
// 機能マトリクス（後方互換性 + フラット参照用）
// =============================================================================

/**
 * フラットな機能マトリクス
 * - 後方互換性のため維持
 * - 新規実装では PRODUCT_FEATURES を使用推奨
 */
export const FEATURE_MATRIX: Record<string, PlanCode[]> = (() => {
  const matrix: Record<string, PlanCode[]> = {};

  // 共通機能を追加
  for (const feature of COMMON_FEATURES) {
    matrix[feature.key] = feature.allowedPlans;
  }

  // 製品別機能を追加（プレフィックス付きとプレフィックスなし両方）
  for (const [productCode, features] of Object.entries(PRODUCT_FEATURES)) {
    for (const feature of features) {
      // プレフィックス付き: inmv_subtitle
      const prefixedKey = `${productCode.toLowerCase()}_${feature.key}`;
      matrix[prefixedKey] = feature.allowedPlans;

      // プレフィックスなし（後方互換性）: subtitle
      // 既存キーがなければ追加
      if (!matrix[feature.key]) {
        matrix[feature.key] = feature.allowedPlans;
      }
    }
  }

  return matrix;
})();

// =============================================================================
// 機能チェック関数（標準API）
// =============================================================================

/**
 * 製品の機能一覧を取得
 */
export function getProductFeatures(product: ProductCode): FeatureDefinition[] {
  return PRODUCT_FEATURES[product] || [];
}

/**
 * 製品の機能定義を取得
 */
export function getFeatureDefinition(product: ProductCode, featureKey: string): FeatureDefinition | null {
  const features = PRODUCT_FEATURES[product];
  return features?.find(f => f.key === featureKey) || null;
}

/**
 * 機能が利用可能かチェック（製品指定版・推奨）
 */
export function checkProductFeature(product: ProductCode, featureKey: string, plan: PlanCode): boolean {
  const feature = getFeatureDefinition(product, featureKey);
  if (!feature) {
    console.warn(`Unknown feature: ${product}/${featureKey} - allowing by default`);
    return true;
  }
  return feature.allowedPlans.includes(plan);
}

/**
 * 機能の数値制限を取得
 * @returns 制限値（-1 = 無制限、null = 制限機能ではない）
 */
export function getFeatureLimit(product: ProductCode, featureKey: string, plan: PlanCode): number | null {
  const feature = getFeatureDefinition(product, featureKey);
  if (!feature || feature.type !== 'limit') {
    return null;
  }
  return feature.limitValues?.[plan] ?? -1;
}

/**
 * 製品の機能可否一覧を取得（UI表示用）
 */
export function getProductFeatureMatrix(product: ProductCode, plan: PlanCode): Array<{
  key: string;
  name: string;
  nameJa: string;
  enabled: boolean;
  limit: number | null;
}> {
  const features = getProductFeatures(product);
  return features.map(feature => ({
    key: feature.key,
    name: feature.name,
    nameJa: feature.nameJa,
    enabled: feature.allowedPlans.includes(plan),
    limit: feature.type === 'limit' ? (feature.limitValues?.[plan] ?? -1) : null,
  }));
}

/**
 * 機能が利用可能かチェック（後方互換性用）
 * @deprecated 新規実装では checkProductFeature を使用
 */
export function canAccessFeature(feature: string, planCode: PlanCode): boolean {
  const allowedPlans = FEATURE_MATRIX[feature];
  if (!allowedPlans) {
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
  // 定義
  PRODUCTS,
  PLANS,
  PRODUCT_FEATURES,
  COMMON_FEATURES,
  FEATURE_MATRIX,
  DEFAULT_PLAN_LIMITS,
  INMV_PLAN_LIMITS,

  // 製品別機能チェック（推奨API）
  getProductFeatures,
  getFeatureDefinition,
  checkProductFeature,
  getFeatureLimit,
  getProductFeatureMatrix,

  // 汎用関数
  getPlanLimits,
  canAccessFeature,  // @deprecated
  isPlanAtLeast,
  getPlanDisplayName,
  getProductDisplayName,
};
