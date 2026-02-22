/**
 * HARMONIC insight 販売戦略定義
 *
 * ============================================================================
 * 【販売戦略の全体像】全製品 法人向け（B2B Only）
 * ============================================================================
 *
 * 全製品をコンサルティング案件の一環として法人向けに提供。
 * コンサルタントがクライアント企業に導入するツール群。
 * 直販またはパートナー（代理店）経由で販売。
 * 個人向け（B2C）販売は行わない。
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                         販売マーケット                                 │
 * │                                                                        │
 * │  Tier 1: 業務変革ツール                                               │
 * │  ┌──────────────────────────────────────────────────────────────┐     │
 * │  │  INCA / INBT / IVIN                                        │     │
 * │  │  コンサル案件の中核分析・自動化ツール                        │     │
 * │  │  価格は個別見積もり                                         │     │
 * │  └──────────────────────────────────────────────────────────────┘     │
 * │                                                                        │
 * │  Tier 2: AI活用ツール                                                 │
 * │  ┌──────────────────────────────────────────────────────────────┐     │
 * │  │  INMV / INIG                                                │     │
 * │  │  コンテンツ制作・研修動画作成コンサルの一環                  │     │
 * │  │  価格は個別見積もり                                         │     │
 * │  └──────────────────────────────────────────────────────────────┘     │
 * │                                                                        │
 * │  Tier 3: InsightOffice Suite（コンサル導入ツール）                     │
 * │  ┌──────────────────────────────────────────────────────────────┐     │
 * │  │  INSS / IOSH / IOSD / INPY                                 │     │
 * │  │  コンサル案件のクライアントに業務ツールとして導入            │     │
 * │  │  パートナー（代理店）経由での販売も可能                     │     │
 * │  │  価格は個別見積もり                                         │     │
 * │  └──────────────────────────────────────────────────────────────┘     │
 * └────────────────────────────────────────────────────────────────────────┘
 */

import type { ProductCode } from './products';
import type { SalesChannel } from './pricing';

// =============================================================================
// 型定義
// =============================================================================

/** 対象マーケット（地域） */
export type MarketRegion =
  | 'JP'       // 日本
  | 'SEA'      // 東南アジア（ベトナム・タイ等）
  | 'KR'       // 韓国
  | 'GLOBAL';  // グローバル共通

/** 販売方法 */
export type SalesMethod =
  | 'direct_consulting'     // コンサル案件内での直接販売
  | 'partner_reseller';     // パートナー（代理店）経由

/** マーケット展開フェーズ */
export type RolloutPhase = 1 | 2 | 3;

/** 対象マーケット情報 */
export interface TargetMarket {
  /** 地域 */
  region: MarketRegion;
  /** フェーズ（1=初期, 2=拡大, 3=成熟） */
  phase: RolloutPhase;
  /** 対応言語 */
  languages: string[];
  /** 対応通貨 */
  currencies: string[];
  /** 販売方法 */
  salesMethods: SalesMethod[];
  /** 備考 */
  notes?: string;
}

/** 顧客セグメント */
export interface CustomerSegment {
  /** セグメント名 */
  name: string;
  /** セグメント名（日本語） */
  nameJa: string;
  /** 説明 */
  description: string;
  /** ターゲット企業規模 */
  companySize: 'medium' | 'large' | 'enterprise';
  /** 推奨プラン */
  recommendedPlan: 'STD' | 'PRO' | 'ENT';
}

/** マーケティングチャネル */
export interface MarketingChannel {
  /** チャネル名 */
  name: string;
  /** チャネル種別 */
  type: 'organic' | 'paid' | 'partner' | 'direct';
  /** 対象リージョン */
  targetRegions: MarketRegion[];
  /** 優先度（1=最高） */
  priority: number;
  /** 説明 */
  description: string;
}

/** 製品別販売戦略 */
export interface ProductSalesStrategy {
  productCode: ProductCode;
  channel: SalesChannel;
  /** 対象マーケット（展開順） */
  targetMarkets: TargetMarket[];
  /** 顧客セグメント */
  customerSegments: CustomerSegment[];
  /** マーケティングチャネル */
  marketingChannels: MarketingChannel[];
  /** トライアル戦略 */
  trialStrategy: {
    /** トライアル期間（日） */
    durationDays: number;
    /** トライアル→有料への想定転換率 */
    expectedConversionRate: number;
    /** クレジットカード不要でトライアル開始可能か */
    noCreditCardRequired: boolean;
  };
  /** 競合・ポジショニング */
  positioning: string;
}

// =============================================================================
// 共通マーケット・セグメント・マーケティングチャネル定義
// =============================================================================

/**
 * 全製品共通のターゲットマーケット
 * Phase 1: 日本国内で実績構築
 * Phase 2: 東南アジア（ベトナムオフショア経由）
 * Phase 3: 韓国・その他アジア
 */
const CONSULTING_MARKETS: TargetMarket[] = [
  {
    region: 'JP',
    phase: 1,
    languages: ['ja'],
    currencies: ['JPY'],
    salesMethods: ['direct_consulting', 'partner_reseller'],
    notes: '既存コンサル案件のクライアントに直接提案。パートナー経由での法人導入も推進。',
  },
  {
    region: 'SEA',
    phase: 2,
    languages: ['en', 'vi'],
    currencies: ['USD', 'VND'],
    salesMethods: ['direct_consulting', 'partner_reseller'],
    notes: 'ベトナム等のオフショア開発拠点経由。RPA移行需要・業務効率化需要が高い。',
  },
  {
    region: 'KR',
    phase: 3,
    languages: ['ko', 'en'],
    currencies: ['USD', 'KRW'],
    salesMethods: ['partner_reseller'],
    notes: 'Office利用率が高い市場。現地パートナー経由での法人導入。',
  },
];

/** 全製品共通の顧客セグメント */
const CONSULTING_SEGMENTS: CustomerSegment[] = [
  {
    name: 'Enterprise IT Department',
    nameJa: '大手企業IT部門',
    description: '既存RPA・ローコードの移行・最適化、または業務効率化を推進する大手企業',
    companySize: 'enterprise',
    recommendedPlan: 'ENT',
  },
  {
    name: 'Mid-size DX Division',
    nameJa: '中堅企業DX推進部門',
    description: 'DX推進の一環でツール導入・業務効率化を進めたい中堅企業',
    companySize: 'medium',
    recommendedPlan: 'PRO',
  },
  {
    name: 'SI Partner / Consulting Firm',
    nameJa: 'SIパートナー・コンサルファーム',
    description: '自社のコンサル案件でクライアントにツールを導入したいSIer・コンサルファーム',
    companySize: 'large',
    recommendedPlan: 'PRO',
  },
];

/** 全製品共通のマーケティングチャネル */
const CONSULTING_MARKETING: MarketingChannel[] = [
  {
    name: 'Existing Client Upsell',
    type: 'direct',
    targetRegions: ['JP'],
    priority: 1,
    description: '既存コンサル案件のクライアントへの追加提案（最もROIが高い）',
  },
  {
    name: 'Seminar / Webinar',
    type: 'direct',
    targetRegions: ['JP', 'SEA'],
    priority: 2,
    description: 'RPA移行・DX・業務効率化関連セミナーでの製品デモ・事例紹介',
  },
  {
    name: 'Partner Referral',
    type: 'partner',
    targetRegions: ['JP', 'SEA', 'KR'],
    priority: 3,
    description: 'SIer・コンサルパートナー・代理店からの紹介・共同提案',
  },
  {
    name: 'SEO / Content Marketing',
    type: 'organic',
    targetRegions: ['JP', 'GLOBAL'],
    priority: 4,
    description: '業務効率化・RPA移行のハウツー記事。法人向けリード獲得の基盤。',
  },
  {
    name: 'LinkedIn / SNS',
    type: 'organic',
    targetRegions: ['JP', 'GLOBAL'],
    priority: 5,
    description: '法人向けリード獲得。事例紹介・製品アップデート情報の発信。',
  },
];

// =============================================================================
// 製品別販売戦略（全製品コンサルティング連動型）
// =============================================================================

export const PRODUCT_SALES_STRATEGY: Record<ProductCode, ProductSalesStrategy> = {

  // =========================================================================
  // Tier 1: 業務変革ツール（高単価）
  // =========================================================================

  INCA: {
    productCode: 'INCA',
    channel: 'consulting',
    targetMarkets: CONSULTING_MARKETS,
    customerSegments: CONSULTING_SEGMENTS,
    marketingChannels: CONSULTING_MARKETING,
    trialStrategy: {
      durationDays: 30,
      expectedConversionRate: 0.60,
      noCreditCardRequired: true,
    },
    positioning: 'BizRobo/UiPath等のRPA移行アセスメントを自動化する唯一のツール。コンサル案件の提案精度と速度を劇的に向上。',
  },

  INBT: {
    productCode: 'INBT',
    channel: 'consulting',
    targetMarkets: CONSULTING_MARKETS,
    customerSegments: CONSULTING_SEGMENTS,
    marketingChannels: CONSULTING_MARKETING,
    trialStrategy: {
      durationDays: 30,
      expectedConversionRate: 0.50,
      noCreditCardRequired: true,
    },
    positioning: 'Python × RPAで、既存のRPAツールでは実現できない柔軟な業務自動化を実現。コンサル案件の自動化基盤。',
  },

  IVIN: {
    productCode: 'IVIN',
    channel: 'consulting',
    targetMarkets: CONSULTING_MARKETS,
    customerSegments: CONSULTING_SEGMENTS,
    marketingChannels: CONSULTING_MARKETING,
    trialStrategy: {
      durationDays: 30,
      expectedConversionRate: 0.50,
      noCreditCardRequired: true,
    },
    positioning: '面接プロセスをAIで解析・最適化。採用コンサルティング案件の中核ツールとして活用。',
  },

  // =========================================================================
  // Tier 2: AI活用ツール（中単価）
  // =========================================================================

  INMV: {
    productCode: 'INMV',
    channel: 'consulting',
    targetMarkets: CONSULTING_MARKETS,
    customerSegments: CONSULTING_SEGMENTS,
    marketingChannels: CONSULTING_MARKETING,
    trialStrategy: {
      durationDays: 30,
      expectedConversionRate: 0.45,
      noCreditCardRequired: true,
    },
    positioning: 'PowerPoint・画像からAI動画を自動生成。研修・マニュアル動画の内製化コンサルの中核ツール。',
  },

  INIG: {
    productCode: 'INIG',
    channel: 'consulting',
    targetMarkets: CONSULTING_MARKETS,
    customerSegments: CONSULTING_SEGMENTS,
    marketingChannels: CONSULTING_MARKETING,
    trialStrategy: {
      durationDays: 30,
      expectedConversionRate: 0.40,
      noCreditCardRequired: true,
    },
    positioning: 'Stable Diffusion + VOICEVOXを業務利用可能な形でパッケージ化。コンテンツ制作の内製化を支援。',
  },

  // =========================================================================
  // Tier 3: InsightOffice Suite（コンサル導入ツール）
  // パートナー（代理店）経由での販売も可能
  // =========================================================================

  INSS: {
    productCode: 'INSS',
    channel: 'consulting',
    targetMarkets: CONSULTING_MARKETS,
    customerSegments: CONSULTING_SEGMENTS,
    marketingChannels: CONSULTING_MARKETING,
    trialStrategy: {
      durationDays: 14,
      expectedConversionRate: 0.40,
      noCreditCardRequired: true,
    },
    positioning: 'MS Office不要のプレゼンテーション作成・編集ツール。コンサル案件でクライアントのOffice業務を効率化。',
  },

  IOSH: {
    productCode: 'IOSH',
    channel: 'consulting',
    targetMarkets: CONSULTING_MARKETS,
    customerSegments: CONSULTING_SEGMENTS,
    marketingChannels: CONSULTING_MARKETING,
    trialStrategy: {
      durationDays: 14,
      expectedConversionRate: 0.45,
      noCreditCardRequired: true,
    },
    positioning: 'MS Office不要のスプレッドシート作成・編集ツール。バージョン管理・AIアシスタントでクライアントのExcel業務を効率化。',
  },

  IOSD: {
    productCode: 'IOSD',
    channel: 'consulting',
    targetMarkets: CONSULTING_MARKETS,
    customerSegments: CONSULTING_SEGMENTS,
    marketingChannels: CONSULTING_MARKETING,
    trialStrategy: {
      durationDays: 14,
      expectedConversionRate: 0.40,
      noCreditCardRequired: true,
    },
    positioning: 'MS Office不要のドキュメント作成・編集ツール。コンサル案件でクライアントのWord業務を効率化。',
  },

  INPY: {
    productCode: 'INPY',
    channel: 'consulting',
    targetMarkets: CONSULTING_MARKETS,
    customerSegments: CONSULTING_SEGMENTS,
    marketingChannels: CONSULTING_MARKETING,
    trialStrategy: {
      durationDays: 14,
      expectedConversionRate: 0.40,
      noCreditCardRequired: true,
    },
    positioning: 'Windows業務をPythonで自動化する実行環境。コンサル案件でクライアントの業務調査・データ収集を自動化。',
  },

  // =========================================================================
  // Tier 4: Insight Senior Office（シニア向け社会貢献ツール）
  // =========================================================================

  ISOF: {
    productCode: 'ISOF',
    channel: 'consulting',
    targetMarkets: [
      {
        region: 'JP',
        phase: 1,
        languages: ['ja'],
        currencies: ['JPY'],
        salesMethods: ['direct_consulting', 'partner_reseller'],
        notes: '地方創生・デジタルデバイド解消コンサル案件。自治体DX予算・総務省デジタル活用支援推進事業と連動。企業のシニア社員向け導入。',
      },
      {
        region: 'SEA',
        phase: 3,
        languages: ['en'],
        currencies: ['USD'],
        salesMethods: ['partner_reseller'],
        notes: '東南アジアの高齢化対応需要。現地パートナー経由。',
      },
    ],
    customerSegments: [
      {
        name: 'Municipal DX Department',
        nameJa: '自治体DX推進部門',
        description: 'デジタルデバイド解消・住民向けIT講座で使用するツール導入',
        companySize: 'large',
        recommendedPlan: 'ENT',
      },
      {
        name: 'Welfare & Care Facilities',
        nameJa: '福祉法人・介護施設',
        description: 'Office未導入の施設でExcel報告書を扱う職員向け',
        companySize: 'medium',
        recommendedPlan: 'STD',
      },
      {
        name: 'Enterprise HR / General Affairs',
        nameJa: '企業 人事・総務部門',
        description: 'Office操作が困難なシニア社員向けの代替ツール',
        companySize: 'large',
        recommendedPlan: 'STD',
      },
    ],
    marketingChannels: [
      {
        name: 'Regional Revitalization Consulting',
        type: 'direct',
        targetRegions: ['JP'],
        priority: 1,
        description: '地方創生コンサル案件への組み込み提案（最もROIが高い）',
      },
      {
        name: 'Municipal DX Proposal',
        type: 'direct',
        targetRegions: ['JP'],
        priority: 2,
        description: '自治体DX推進・デジタルデバイド解消事業への提案',
      },
      {
        name: 'Existing Client Senior Division',
        type: 'direct',
        targetRegions: ['JP'],
        priority: 3,
        description: '既存コンサル案件のクライアント企業のシニア社員部門への追加提案',
      },
      {
        name: 'Welfare Partner Referral',
        type: 'partner',
        targetRegions: ['JP'],
        priority: 4,
        description: '福祉系パートナー経由での介護施設・福祉法人への導入',
      },
    ],
    trialStrategy: {
      durationDays: 14,
      expectedConversionRate: 0.50,
      noCreditCardRequired: true,
    },
    positioning: 'Office不要でExcelファイルを扱えるシニア向け統合ツール。AIが操作を手伝い、iPhoneのメールもPCで見られる。デジタルデバイド解消の切り札。',
  },
};

// =============================================================================
// 決済プラットフォーム設定（法人向け）
// =============================================================================

/** 決済プラットフォーム */
export interface PaymentPlatform {
  /** プラットフォーム名 */
  name: string;
  /** 種別 */
  type: 'payment_gateway' | 'invoice';
  /** 対応地域 */
  regions: MarketRegion[];
  /** 手数料率（概算） */
  feeRate: number;
  /** 備考 */
  notes: string;
}

export const PAYMENT_PLATFORMS: PaymentPlatform[] = [
  {
    name: 'Stripe',
    type: 'payment_gateway',
    regions: ['JP', 'GLOBAL'],
    feeRate: 0.036,
    notes: '自社サイト決済。法人向けクレジットカード・銀行振込対応。',
  },
  {
    name: '請求書払い',
    type: 'invoice',
    regions: ['JP'],
    feeRate: 0,
    notes: '法人向け請求書払い。大手企業・官公庁向け。',
  },
];

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 製品の販売戦略を取得
 */
export function getSalesStrategy(productCode: ProductCode): ProductSalesStrategy {
  return PRODUCT_SALES_STRATEGY[productCode];
}

/**
 * 指定リージョンで販売可能な製品を取得
 */
export function getProductsByRegion(region: MarketRegion): ProductCode[] {
  return (Object.keys(PRODUCT_SALES_STRATEGY) as ProductCode[]).filter(code => {
    const strategy = PRODUCT_SALES_STRATEGY[code];
    return strategy.targetMarkets.some(m => m.region === region);
  });
}

/**
 * 指定フェーズのマーケットを取得
 */
export function getMarketsByPhase(productCode: ProductCode, phase: RolloutPhase): TargetMarket[] {
  const strategy = PRODUCT_SALES_STRATEGY[productCode];
  return strategy.targetMarkets.filter(m => m.phase <= phase);
}

/**
 * 製品のポジショニング文を取得
 */
export function getPositioning(productCode: ProductCode): string {
  return PRODUCT_SALES_STRATEGY[productCode].positioning;
}

/**
 * 全製品一覧を取得（全製品コンサルティング連動型）
 */
export function getConsultingProducts(): ProductCode[] {
  return Object.keys(PRODUCT_SALES_STRATEGY) as ProductCode[];
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  PRODUCT_SALES_STRATEGY,
  PAYMENT_PLATFORMS,
  getSalesStrategy,
  getProductsByRegion,
  getMarketsByPhase,
  getPositioning,
  getConsultingProducts,
};
