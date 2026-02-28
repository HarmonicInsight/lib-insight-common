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
  /** 備考 */
  notes?: string;
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
    notes: '移行アセスメント案件の中核ツールとして提供。価格は個別見積もり。BYOK（AIキーはクライアント自社購入）。',
  },

  INBT: {
    productCode: 'INBT',
    channel: 'consulting',
    channelDescription: '業務自動化コンサルティング案件と連動',
    tier: 1,
    pricingUnit: 'per_company',
    notes: '自動化コンサルとセットで提供。価格は個別見積もり。BYOK（AIキーはクライアント自社購入）。',
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
    notes: '価格は個別見積もり。BYOK（AIキーはクライアント自社購入）。',
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
    notes: 'FREE/TRIAL/BIZ/ENT。パートナー販売可。価格は個別見積もり。BYOK（AIキーはクライアント自社購入・制限なし）。',
  },

  IOSH: {
    productCode: 'IOSH',
    channel: 'consulting',
    channelDescription: 'コンサル案件のクライアントにOffice業務ツールとして導入',
    tier: 3,
    pricingUnit: 'per_user',
    notes: 'FREE/TRIAL/BIZ/ENT。パートナー販売可。価格は個別見積もり。BYOK（AIキーはクライアント自社購入・制限なし）。',
  },

  IOSD: {
    productCode: 'IOSD',
    channel: 'consulting',
    channelDescription: 'コンサル案件のクライアントにOffice業務ツールとして導入',
    tier: 3,
    pricingUnit: 'per_user',
    notes: 'FREE/TRIAL/BIZ/ENT。パートナー販売可。価格は個別見積もり。BYOK（AIキーはクライアント自社購入・制限なし）。',
  },

  INPY: {
    productCode: 'INPY',
    channel: 'consulting',
    channelDescription: 'コンサル案件のクライアントに業務自動化ツールとして導入',
    tier: 3,
    pricingUnit: 'per_user',
    notes: 'FREE/TRIAL/BIZ/ENT。パートナー販売可。価格は個別見積もり。BYOK（AIキーはクライアント自社購入・制限なし）。',
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
// エクスポート
// =============================================================================

export default {
  PRODUCT_SALES_INFO,
  getSalesChannel,
  getProductSalesInfo,
  getProductTier,
  getProductsByTier,
  getConsultingProducts,
};
