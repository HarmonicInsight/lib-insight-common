/**
 * HARMONIC insight 販売戦略定義
 *
 * ============================================================================
 * 【販売戦略の全体像】�E製品E法人向け�E�E2B Only�E�E
 * ============================================================================
 *
 * 全製品をコンサルチE��ング案件の一環として法人向けに提供、E
 * コンサルタントがクライアント企業に導�EするチE�Eル群、E
 * 直販また�Eパ�Eトナー�E�代琁E��）経由で販売、E
 * 個人向け�E�E2C�E�販売は行わなぁE��E
 *
 * ┌────────────────────────────────────────────────────────────────────────━E
 * ━E                        販売マ�EケチE��                                 ━E
 * ━E                                                                       ━E
 * ━E Tier 1: 業務変革チE�Eル                                               ━E
 * ━E ┌──────────────────────────────────────────────────────────────━E    ━E
 * ━E ━E INCA / INBT / IVIN                                        ━E    ━E
 * ━E ━E コンサル案件の中核刁E��・自動化チE�Eル                        ━E    ━E
 * ━E ━E 価格は個別見積もめE                                        ━E    ━E
 * ━E └──────────────────────────────────────────────────────────────━E    ━E
 * ━E                                                                       ━E
 * ━E Tier 2: AI活用チE�Eル                                                 ━E
 * ━E ┌──────────────────────────────────────────────────────────────━E    ━E
 * ━E ━E INMV / INIG                                                ━E    ━E
 * ━E ━E コンチE��チE��作�E研修動画作�Eコンサルの一環                  ━E    ━E
 * ━E ━E 価格は個別見積もめE                                        ━E    ━E
 * ━E └──────────────────────────────────────────────────────────────━E    ━E
 * ━E                                                                       ━E
 * ━E Tier 3: InsightOffice Suite�E�コンサル導�EチE�Eル�E�E                    ━E
 * ━E ┌──────────────────────────────────────────────────────────────━E    ━E
 * ━E ━E INSS / IOSH / IOSD / INPY                                 ━E    ━E
 * ━E ━E コンサル案件のクライアントに業務ツールとして導�E            ━E    ━E
 * ━E ━E パ�Eトナー�E�代琁E��）経由での販売も可能                     ━E    ━E
 * ━E ━E 価格は個別見積もめE                                        ━E    ━E
 * ━E └──────────────────────────────────────────────────────────────━E    ━E
 * └────────────────────────────────────────────────────────────────────────━E
 */

import type { ProductCode } from './products';
import type { SalesChannel } from './pricing';

// =============================================================================
// 型定義
// =============================================================================

/** 対象マ�EケチE���E�地域！E*/
export type MarketRegion =
  | 'JP'       // 日本
  | 'SEA'      // 東南アジア�E��Eトナム・タイ等！E
  | 'KR'       // 韓国
  | 'GLOBAL';  // グローバル共送E

/** 販売方況E*/
export type SalesMethod =
  | 'direct_consulting'     // コンサル案件冁E��の直接販売
  | 'partner_reseller';     // パ�Eトナー�E�代琁E��）経由

/** マ�EケチE��展開フェーズ */
export type RolloutPhase = 1 | 2 | 3;

/** 対象マ�EケチE��惁E�� */
export interface TargetMarket {
  /** 地埁E*/
  region: MarketRegion;
  /** フェーズ�E�E=初期, 2=拡大, 3=成�E�E�E*/
  phase: RolloutPhase;
  /** 対応言誁E*/
  languages: string[];
  /** 対応通貨 */
  currencies: string[];
  /** 販売方況E*/
  salesMethods: SalesMethod[];
  /** 備老E*/
  notes?: string;
}

/** 顧客セグメンチE*/
export interface CustomerSegment {
  /** セグメント名 */
  name: string;
  /** セグメント名�E�日本語！E*/
  nameJa: string;
  /** 説昁E*/
  description: string;
  /** ターゲチE��企業規模 */
  companySize: 'medium' | 'large' | 'enterprise';
  /** 推奨プラン */
  recommendedPlan: 'STD' | 'PRO' | 'ENT';
}

/** マ�EケチE��ングチャネル */
export interface MarketingChannel {
  /** チャネル吁E*/
  name: string;
  /** チャネル種別 */
  type: 'organic' | 'paid' | 'partner' | 'direct';
  /** 対象リージョン */
  targetRegions: MarketRegion[];
  /** 優先度�E�E=最高！E*/
  priority: number;
  /** 説昁E*/
  description: string;
}

/** 製品別販売戦略 */
export interface ProductSalesStrategy {
  productCode: ProductCode;
  channel: SalesChannel;
  /** 対象マ�EケチE���E�展開頁E��E*/
  targetMarkets: TargetMarket[];
  /** 顧客セグメンチE*/
  customerSegments: CustomerSegment[];
  /** マ�EケチE��ングチャネル */
  marketingChannels: MarketingChannel[];
  /** トライアル戦略 */
  trialStrategy: {
    /** トライアル期間�E�日�E�E*/
    durationDays: number;
    /** トライアル→有料への想定転換率 */
    expectedConversionRate: number;
    /** クレジチE��カード不要でトライアル開始可能ぁE*/
    noCreditCardRequired: boolean;
  };
  /** 競合�Eポジショニング */
  positioning: string;
}

// =============================================================================
// 共通�EーケチE��・セグメント�Eマ�EケチE��ングチャネル定義
// =============================================================================

/**
 * 全製品�E通�EターゲチE��マ�EケチE��
 * Phase 1: 日本国冁E��実績構篁E
 * Phase 2: 東南アジア�E��Eトナムオフショア経由�E�E
 * Phase 3: 韓国・そ�E他アジア
 */
const CONSULTING_MARKETS: TargetMarket[] = [
  {
    region: 'JP',
    phase: 1,
    languages: ['ja'],
    currencies: ['JPY'],
    salesMethods: ['direct_consulting', 'partner_reseller'],
    notes: '既存コンサル案件のクライアントに直接提案。パートナー経由での法人導�Eも推進、E,
  },
  {
    region: 'SEA',
    phase: 2,
    languages: ['en', 'vi'],
    currencies: ['USD', 'VND'],
    salesMethods: ['direct_consulting', 'partner_reseller'],
    notes: 'ベトナム等�Eオフショア開発拠点経由。RPA移行需要�E業務効玁E��需要が高い、E,
  },
  {
    region: 'KR',
    phase: 3,
    languages: ['ko', 'en'],
    currencies: ['USD', 'KRW'],
    salesMethods: ['partner_reseller'],
    notes: 'Office利用玁E��高い市場。現地パ�Eトナー経由での法人導�E、E,
  },
];

/** 全製品�E通�E顧客セグメンチE*/
const CONSULTING_SEGMENTS: CustomerSegment[] = [
  {
    name: 'Enterprise IT Department',
    nameJa: '大手企業IT部門',
    description: '既存RPA・ローコード�E移行�E最適化、また�E業務効玁E��を推進する大手企業',
    companySize: 'enterprise',
    recommendedPlan: 'ENT',
  },
  {
    name: 'Mid-size DX Division',
    nameJa: '中堁E��業DX推進部門',
    description: 'DX推進の一環でチE�Eル導�E・業務効玁E��を進めたぁE��堁E��業',
    companySize: 'medium',
    recommendedPlan: 'PRO',
  },
  {
    name: 'SI Partner / Consulting Firm',
    nameJa: 'SIパ�Eトナー・コンサルファーム',
    description: '自社のコンサル案件でクライアントにチE�Eルを導�EしたいSIer・コンサルファーム',
    companySize: 'large',
    recommendedPlan: 'PRO',
  },
];

/** 全製品�E通�Eマ�EケチE��ングチャネル */
const CONSULTING_MARKETING: MarketingChannel[] = [
  {
    name: 'Existing Client Upsell',
    type: 'direct',
    targetRegions: ['JP'],
    priority: 1,
    description: '既存コンサル案件のクライアントへの追加提案（最もROIが高い�E�E,
  },
  {
    name: 'Seminar / Webinar',
    type: 'direct',
    targetRegions: ['JP', 'SEA'],
    priority: 2,
    description: 'RPA移行�EDX・業務効玁E��関連セミナーでの製品デモ・事例紹仁E,
  },
  {
    name: 'Partner Referral',
    type: 'partner',
    targetRegions: ['JP', 'SEA', 'KR'],
    priority: 3,
    description: 'SIer・コンサルパ�Eトナー・代琁E��から�E紹介�E共同提桁E,
  },
  {
    name: 'SEO / Content Marketing',
    type: 'organic',
    targetRegions: ['JP', 'GLOBAL'],
    priority: 4,
    description: '業務効玁E��・RPA移行�EハウチE�E記事。法人向けリード獲得�E基盤、E,
  },
  {
    name: 'LinkedIn / SNS',
    type: 'organic',
    targetRegions: ['JP', 'GLOBAL'],
    priority: 5,
    description: '法人向けリード獲得。事例紹介�E製品アチE�EチE�Eト情報の発信、E,
  },
];

// =============================================================================
// 製品別販売戦略�E��E製品コンサルチE��ング連動型�E�E
// =============================================================================

export const PRODUCT_SALES_STRATEGY: Record<ProductCode, ProductSalesStrategy> = {

  // =========================================================================
  // Tier 1: 業務変革チE�Eル�E�高単価�E�E
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
    positioning: 'BizRobo/UiPath等�ERPA移行アセスメントを自動化する唯一のチE�Eル。コンサル案件の提案精度と速度を劇皁E��向上、E,
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
    positioning: 'Python ÁERPAで、既存�ERPAチE�Eルでは実現できなぁE��軟な業務�E動化を実現。コンサル案件の自動化基盤、E,
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
    positioning: '面接プロセスをAIで解析�E最適化。採用コンサルチE��ング案件の中核チE�Eルとして活用、E,
  },

  // =========================================================================
  // Tier 2: AI活用チE�Eル�E�中単価�E�E
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
    positioning: 'PowerPoint・画像からAI動画を�E動生成。研修・マニュアル動画の冁E��化コンサルの中核チE�Eル、E,
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
    positioning: 'Stable Diffusion + VOICEVOXを業務利用可能な形でパッケージ化。コンチE��チE��作�E冁E��化を支援、E,
  },

  // =========================================================================
  // Tier 3: InsightOffice Suite�E�コンサル導�EチE�Eル�E�E
  // パ�Eトナー�E�代琁E��）経由での販売も可能
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
    positioning: 'MS Office不要�EプレゼンチE�Eション作�E・編雁E��ール。コンサル案件でクライアント�EOffice業務を効玁E��、E,
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
    positioning: 'MS Office不要�EスプレチE��シート作�E・編雁E��ール。バージョン管琁E�EAIアシスタントでクライアント�EExcel業務を効玁E��、E,
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
    positioning: 'MS Office不要�Eドキュメント作�E・編雁E��ール。コンサル案件でクライアント�EWord業務を効玁E��、E,
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
    positioning: 'Windows業務をPythonで自動化する実行環墁E��コンサル案件でクライアント�E業務調査・チE�Eタ収集を�E動化、E,
  },

  // =========================================================================
  // Tier 4: Insight Senior Office�E�シニア向け社会貢献チE�Eル�E�E
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
        notes: '地方創生�EチE��タルチE��イド解消コンサル案件。�E治体DX予算�E総務省デジタル活用支援推進事業と連動。企業のシニア社員向け導�E、E,
      },
      {
        region: 'SEA',
        phase: 3,
        languages: ['en'],
        currencies: ['USD'],
        salesMethods: ['partner_reseller'],
        notes: '東南アジアの高齢化対応需要。現地パ�Eトナー経由、E,
      },
    ],
    customerSegments: [
      {
        name: 'Municipal DX Department',
        nameJa: '自治体DX推進部門',
        description: 'チE��タルチE��イド解消�E住民向けIT講座で使用するチE�Eル導�E',
        companySize: 'large',
        recommendedPlan: 'ENT',
      },
      {
        name: 'Welfare & Care Facilities',
        nameJa: '福祉法人・介護施設',
        description: 'Office未導�Eの施設でExcel報告書を扱ぁE�E員向け',
        companySize: 'medium',
        recommendedPlan: 'STD',
      },
      {
        name: 'Enterprise HR / General Affairs',
        nameJa: '企業 人事�E総務部門',
        description: 'Office操作が困難なシニア社員向けの代替チE�Eル',
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
        description: '地方創生コンサル案件への絁E��込み提案（最もROIが高い�E�E,
      },
      {
        name: 'Municipal DX Proposal',
        type: 'direct',
        targetRegions: ['JP'],
        priority: 2,
        description: '自治体DX推進・チE��タルチE��イド解消事業への提桁E,
      },
      {
        name: 'Existing Client Senior Division',
        type: 'direct',
        targetRegions: ['JP'],
        priority: 3,
        description: '既存コンサル案件のクライアント企業のシニア社員部門への追加提桁E,
      },
      {
        name: 'Welfare Partner Referral',
        type: 'partner',
        targetRegions: ['JP'],
        priority: 4,
        description: '福祉系パ�Eトナー経由での介護施設・福祉法人への導�E',
      },
    ],
    trialStrategy: {
      durationDays: 14,
      expectedConversionRate: 0.50,
      noCreditCardRequired: true,
    },
    positioning: 'Office不要でExcelファイルを扱えるシニア向け統合ツール、EIが操作を手伝い、iPhoneのメールもPCで見られる。デジタルチE��イド解消�E刁E��札、E,
  },
};

// =============================================================================
// 決済�EラチE��フォーム設定（法人向け�E�E
// =============================================================================

/** 決済�EラチE��フォーム */
export interface PaymentPlatform {
  /** プラチE��フォーム吁E*/
  name: string;
  /** 種別 */
  type: 'payment_gateway' | 'invoice';
  /** 対応地埁E*/
  regions: MarketRegion[];
  /** 手数料率�E�概算！E*/
  feeRate: number;
  /** 備老E*/
  notes: string;
}

export const PAYMENT_PLATFORMS: PaymentPlatform[] = [
  {
    name: 'Stripe',
    type: 'payment_gateway',
    regions: ['JP', 'GLOBAL'],
    feeRate: 0.036,
    notes: '自社サイト決済。法人向けクレジチE��カード�E銀行振込対応、E,
  },
  {
    name: '請求書払い',
    type: 'invoice',
    regions: ['JP'],
    feeRate: 0,
    notes: '法人向け請求書払い。大手企業・官�E庁向け、E,
  },
];

// =============================================================================
// ヘルパ�E関数
// =============================================================================

/**
 * 製品�E販売戦略を取征E
 */
export function getSalesStrategy(productCode: ProductCode): ProductSalesStrategy {
  return PRODUCT_SALES_STRATEGY[productCode];
}

/**
 * 持E��リージョンで販売可能な製品を取征E
 */
export function getProductsByRegion(region: MarketRegion): ProductCode[] {
  return (Object.keys(PRODUCT_SALES_STRATEGY) as ProductCode[]).filter(code => {
    const strategy = PRODUCT_SALES_STRATEGY[code];
    return strategy.targetMarkets.some(m => m.region === region);
  });
}

/**
 * 持E��フェーズのマ�EケチE��を取征E
 */
export function getMarketsByPhase(productCode: ProductCode, phase: RolloutPhase): TargetMarket[] {
  const strategy = PRODUCT_SALES_STRATEGY[productCode];
  return strategy.targetMarkets.filter(m => m.phase <= phase);
}

/**
 * 製品�Eポジショニング斁E��取征E
 */
export function getPositioning(productCode: ProductCode): string {
  return PRODUCT_SALES_STRATEGY[productCode].positioning;
}

/**
 * 全製品一覧を取得（�E製品コンサルチE��ング連動型�E�E
 */
export function getConsultingProducts(): ProductCode[] {
  return Object.keys(PRODUCT_SALES_STRATEGY) as ProductCode[];
}

// =============================================================================
// エクスポ�EチE
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
