/**
 * HARMONIC insight 価格戦略定義
 *
 * ============================================================================
 * 【価格設計方針】全製品＝法人向け（B2B Only）＝ 価格は個別見積もり
 * ============================================================================
 *
 * 全製品をコンサルティング案件の一環として法人向けに提供。
 * コンサルタントがクライアント企業に導入するツール群。
 * 直販またはパートナー（代理店）経由で販売。
 * 個人向け（B2C）販売は行わない。
 *
 * ## 価格方針
 *
 * 全製品の価格はパートナー（販売代理店）との協議により決定。
 * Webサイト等での価格公開は行わない。
 * 見積もりはパートナー経由または直接のお問い合わせで対応。
 *
 * ## 製品ティア
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ Tier 1: 業務変革ツール                                         │
 * │ INCA / INBT / IVIN                                            │
 * ├──────────────────────────────────────────────────────────────────┤
 * │ Tier 2: AI活用ツール                                           │
 * │ INMV / INIG                                                    │
 * ├──────────────────────────────────────────────────────────────────┤
 * │ Tier 3: Insight Business Suite（導入ツール）                     │
 * │ INSS / IOSH / IOSD / INPY                                     │
 * ├──────────────────────────────────────────────────────────────────┤
 * │ Tier 4: Insight Senior Office（社会貢献ツール）                 │
 * │ ISOF                                                           │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * ## 決済
 * - Stripe（自社サイト）／請求書払い
 */

import type { ProductCode, PlanCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** 販売チャネル ＝全製品＝consulting */
export type SalesChannel = 'consulting';

/** 通貨 */
export type Currency = 'JPY' | 'USD';

/** 価格単位 */
export type PricingUnit = 'per_company' | 'per_user';

/** 製品ティア */
export type ProductTier = 1 | 2 | 3 | 4;

/** 参考価格帯（社内用・公開禁止） */
export interface ReferencePriceRange {
  /** 初期ライセンス（円） */
  initialLicense: number;
  /** 年間保守（円） */
  annualMaintenance: number;
  /** 備考 */
  notes?: string;
}

/** 製品別販売情報（価格は個別見積もり） */
export interface ProductSalesInfo {
  /** 製品コード */
  productCode: ProductCode;
  /** 販売チャネル */
  channel: SalesChannel;
  /** チャネル説明 */
  channelDescription: string;
  /** 製品ティア */
  tier: ProductTier;
  /** 価格単位（per_company or per_user） */
  pricingUnit: PricingUnit;
  /** 参考価格帯（社内用・公開禁止） */
  referencePricing?: Partial<Record<PlanCode, ReferencePriceRange>>;
  /** 備考 */
  notes?: string;
}

/** スイートバンドル定義 */
export interface SuiteBundleDefinition {
  /** バンドル ID */
  id: string;
  /** バンドル名 */
  name: string;
  /** バンドル名（日本語） */
  nameJa: string;
  /** 対象部門 */
  targetDepartmentJa: string;
  /** 含まれる製品 */
  products: ProductCode[];
  /** 参考価格帯（円） */
  referencePriceRange: { min: number; max: number };
  /** 年間保守参考（円） */
  referenceMaintenanceRange: { min: number; max: number };
}

/** 割引条件 */
export interface DiscountCondition {
  /** 割引 ID */
  id: string;
  /** 説明（日本語） */
  descriptionJa: string;
  /** 割引率 (0.0〜1.0) */
  rate: number;
  /** 適用条件 */
  condition: string;
}

// =============================================================================
// 製品販売情報（価格は個別見積もり＝パートナーと協議の上決定）
// =============================================================================

export const PRODUCT_SALES_INFO: Record<ProductCode, ProductSalesInfo> = {

  // =========================================================================
  // Tier 1: 業務変革ツール
  // =========================================================================

  INCA: {
    productCode: 'INCA',
    channel: 'consulting',
    channelDescription: 'RPA・ローコード移行コンサルティング案件と連動',
    tier: 1,
    pricingUnit: 'per_company',
    notes: '移行アセスメント案件の中核ツールとして提供。コンサルフィーに含める形が基本。BYOK。',
  },

  INBT: {
    productCode: 'INBT',
    channel: 'consulting',
    channelDescription: '業務自動化コンサルティング案件と連動',
    tier: 1,
    pricingUnit: 'per_company',
    notes: '自動化コンサルとセットで提供。Orchestrator + Agent 管理は ENT のみ。BYOK。',
  },

  IVIN: {
    productCode: 'IVIN',
    channel: 'consulting',
    channelDescription: '採用・面接コンサルティング案件と連動',
    tier: 1,
    pricingUnit: 'per_company',
    notes: '採用コンサルとセットで提供。価格は個別見積もり。',
  },

  // =========================================================================
  // Tier 2: AI活用ツール
  // =========================================================================

  INMV: {
    productCode: 'INMV',
    channel: 'consulting',
    channelDescription: 'コンテンツ制作・研修動画コンサルティングと連動',
    tier: 2,
    pricingUnit: 'per_company',
    referencePricing: {
      BIZ: { initialLicense: 800_000, annualMaintenance: 160_000, notes: '1080p / 200MB 制限' },
      ENT: { initialLicense: 2_000_000, annualMaintenance: 400_000, notes: '4K / 無制限 / 字幕・トランジション・PPTX取込' },
    },
    notes: 'BYOK（AIキーはクライアント自社購入）。',
  },

  INIG: {
    productCode: 'INIG',
    channel: 'consulting',
    channelDescription: 'AI活用・コンテンツ制作コンサルティングと連動',
    tier: 2,
    pricingUnit: 'per_company',
    notes: '価格は個別見積もり。BYOK（AIキーはクライアント自社購入）。',
  },

  // =========================================================================
  // Tier 3: Insight Business Suite（コンサル導入ツール）
  // =========================================================================

  INSS: {
    productCode: 'INSS',
    channel: 'consulting',
    channelDescription: 'コンサル案件のクライアントにOffice業務ツールとして導入',
    tier: 3,
    pricingUnit: 'per_user',
    referencePricing: {
      BIZ: { initialLicense: 1_200_000, annualMaintenance: 240_000, notes: 'AI レビュー・抽出・一括更新' },
      ENT: { initialLicense: 3_000_000, annualMaintenance: 600_000, notes: '+ カスタム辞書・API/SSO/監査ログ' },
    },
    notes: 'FREE/TRIAL/BIZ/ENT。パートナー販売可。BYOK（制限なし）。',
  },

  IOSH: {
    productCode: 'IOSH',
    channel: 'consulting',
    channelDescription: 'コンサル案件のクライアントにOffice業務ツールとして導入',
    tier: 3,
    pricingUnit: 'per_user',
    referencePricing: {
      BIZ: { initialLicense: 3_000_000, annualMaintenance: 600_000, notes: 'バージョン管理・差分比較・AI アシスタント' },
      ENT: { initialLicense: 5_000_000, annualMaintenance: 1_000_000, notes: '+ ピボット・条件付き書式・Orchestrator 連携' },
    },
    notes: 'FREE/TRIAL/BIZ/ENT。パートナー販売可。BYOK（制限なし）。建設業特化版あり（ENT 価格帯）。',
  },

  IOSD: {
    productCode: 'IOSD',
    channel: 'consulting',
    channelDescription: 'コンサル案件のクライアントにOffice業務ツールとして導入',
    tier: 3,
    pricingUnit: 'per_user',
    referencePricing: {
      BIZ: { initialLicense: 1_500_000, annualMaintenance: 300_000, notes: '文書作成・AI 校正・参考資料' },
      ENT: { initialLicense: 3_000_000, annualMaintenance: 600_000, notes: '+ 変更履歴・差し込み印刷・バッチ処理' },
    },
    notes: 'FREE/TRIAL/BIZ/ENT。パートナー販売可。BYOK（制限なし）。',
  },

  INPY: {
    productCode: 'INPY',
    channel: 'consulting',
    channelDescription: 'コンサル案件のクライアントに業務自動化ツールとして導入',
    tier: 3,
    pricingUnit: 'per_user',
    notes: 'FREE/TRIAL/BIZ/ENT。パートナー販売可。BYOK（制限なし）。INBT/IOSH と組み合わせて提案。',
  },

  // =========================================================================
  // Tier 4: Insight Senior Office（シニア向け社会貢献ツール）
  // =========================================================================

  ISOF: {
    productCode: 'ISOF',
    channel: 'consulting',
    channelDescription: '地方創生・デジタルディバイド解消コンサル案件、企業のシニア社員向けツールとして導入',
    tier: 4,
    pricingUnit: 'per_user',
    notes: 'FREE/BIZ/ENT（TRIALあり）。価格は個別見積もり。BYOK（AIキーはクライアント自社購入・制限なし）。',
  },
};

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 製品の販売チャネルを取得（全製品＝consulting）
 */
export function getSalesChannel(productCode: ProductCode): SalesChannel {
  return PRODUCT_SALES_INFO[productCode].channel;
}

/**
 * 製品の販売情報を取得
 */
export function getProductSalesInfo(productCode: ProductCode): ProductSalesInfo {
  return PRODUCT_SALES_INFO[productCode];
}

/**
 * 製品のティアを取得
 */
export function getProductTier(productCode: ProductCode): ProductTier {
  return PRODUCT_SALES_INFO[productCode].tier;
}

/**
 * 指定ティアの製品一覧を取得
 */
export function getProductsByTier(tier: ProductTier): ProductCode[] {
  return (Object.keys(PRODUCT_SALES_INFO) as ProductCode[]).filter(
    code => PRODUCT_SALES_INFO[code].tier === tier,
  );
}

/**
 * 全製品一覧を取得（全製品コンサルティング連動型）
 */
export function getConsultingProducts(): ProductCode[] {
  return Object.keys(PRODUCT_SALES_INFO) as ProductCode[];
}

// =============================================================================
// スイートバンドル定義（参考価格帯・社内用）
// =============================================================================

export const SUITE_BUNDLES: SuiteBundleDefinition[] = [
  {
    id: 'starter',
    name: 'Starter Suite',
    nameJa: 'スタータースイート',
    targetDepartmentJa: 'コンサル部門・DX 部門',
    products: ['INSS', 'IOSD'],
    referencePriceRange: { min: 3_000_000, max: 4_000_000 },
    referenceMaintenanceRange: { min: 600_000, max: 800_000 },
  },
  {
    id: 'management',
    name: 'Management Suite',
    nameJa: 'マネジメントスイート',
    targetDepartmentJa: '経営企画・管理会計部門',
    products: ['IOSH', 'IOSD'],
    referencePriceRange: { min: 5_000_000, max: 7_000_000 },
    referenceMaintenanceRange: { min: 1_000_000, max: 1_400_000 },
  },
  {
    id: 'full',
    name: 'Full Suite',
    nameJa: 'フルスイート',
    targetDepartmentJa: '全社 DX 基盤',
    products: ['INSS', 'IOSH', 'IOSD', 'INMV'],
    referencePriceRange: { min: 8_000_000, max: 8_000_000 },
    referenceMaintenanceRange: { min: 1_600_000, max: 1_600_000 },
  },
];

// =============================================================================
// 割引条件（社内ガイドライン）
// =============================================================================

/** 導入初期インセンティブ（ケース数割引） */
export const EARLY_ADOPTER_DISCOUNTS: DiscountCondition[] = [
  { id: 'first_client', descriptionJa: '1社目（ファーストリファレンス）', rate: 0.50, condition: '導入事例化を条件' },
  { id: 'second_client', descriptionJa: '2社目', rate: 0.40, condition: '' },
  { id: 'third_client', descriptionJa: '3社目', rate: 0.30, condition: '' },
];

/** 条件付き割引 */
export const CONDITIONAL_DISCOUNTS: DiscountCondition[] = [
  { id: 'consulting_bundle', descriptionJa: 'コンサル契約併用', rate: 0.30, condition: 'コンサルフィー別途' },
  { id: 'full_suite', descriptionJa: '4製品同時導入（Full Suite）', rate: 0.40, condition: 'Full Suite 特別価格適用' },
  { id: 'first_year', descriptionJa: '初回導入企業', rate: 0.20, condition: '初年度のみ' },
];

// =============================================================================
// スイート・割引ヘルパー関数
// =============================================================================

/**
 * スイートバンドルを取得
 */
export function getSuiteBundle(suiteId: string): SuiteBundleDefinition | undefined {
  return SUITE_BUNDLES.find(s => s.id === suiteId);
}

/**
 * 製品が含まれるスイート一覧を取得
 */
export function getSuitesContainingProduct(productCode: ProductCode): SuiteBundleDefinition[] {
  return SUITE_BUNDLES.filter(s => s.products.includes(productCode));
}

/**
 * 参考価格帯を取得（社内用・公開禁止）
 */
export function getReferencePricing(productCode: ProductCode, plan: PlanCode): ReferencePriceRange | undefined {
  return PRODUCT_SALES_INFO[productCode].referencePricing?.[plan];
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  PRODUCT_SALES_INFO,
  SUITE_BUNDLES,
  EARLY_ADOPTER_DISCOUNTS,
  CONDITIONAL_DISCOUNTS,
  getSalesChannel,
  getProductSalesInfo,
  getProductTier,
  getProductsByTier,
  getConsultingProducts,
  getSuiteBundle,
  getSuitesContainingProduct,
  getReferencePricing,
};
