/**
 * Harmonic Insight 販売戦略定義
 *
 * ============================================================================
 * 【販売戦略の全体像】
 * ============================================================================
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                         販売マーケット                                 │
 * │                                                                        │
 * │  【A】コンサルティング連動型                                           │
 * │  ┌──────────────────────────────────────────────────────────────┐     │
 * │  │  市場: 日本国内 → 東南アジア（ベトナム等）                    │     │
 * │  │  販売: 直販（コンサル案件内）                                 │     │
 * │  │  顧客: 大手〜中堅企業のIT部門・DX推進部門                    │     │
 * │  │  KPI: 案件あたり単価 × コンサル案件数                        │     │
 * │  │  INCA / INBT / INMV / INIG                                  │     │
 * │  └──────────────────────────────────────────────────────────────┘     │
 * │                                                                        │
 * │  【B】グローバルスタンドアロン型                                       │
 * │  ┌──────────────────────────────────────────────────────────────┐     │
 * │  │  市場: 日本 → 北米 → 欧州 → アジア                          │     │
 * │  │  販売: オンライン（自社サイト + ストア + リセラー）           │     │
 * │  │  顧客: Office業務ユーザー（個人〜中小企業）                  │     │
 * │  │  KPI: MRR / ARR / チャーンレート / LTV                      │     │
 * │  │  IOSH / IODC / IOSL / INPY                                  │     │
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
  | 'US'       // 北米
  | 'EU'       // 欧州
  | 'SEA'      // 東南アジア（ベトナム・タイ等）
  | 'CN'       // 中国
  | 'KR'       // 韓国
  | 'GLOBAL';  // グローバル共通

/** 販売方法 */
export type SalesMethod =
  | 'direct_consulting'     // コンサル案件内での直接販売
  | 'own_website'           // 自社Webサイト（harmonicinsight.com）
  | 'microsoft_store'       // Microsoft Store
  | 'payment_platform'      // Paddle / Gumroad / FastSpring 等
  | 'reseller'              // リセラー・代理店
  | 'marketplace';          // その他マーケットプレイス

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
  companySize: 'individual' | 'small' | 'medium' | 'large' | 'enterprise';
  /** 推奨プラン */
  recommendedPlan: 'FREE' | 'STD' | 'PRO' | 'ENT';
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
// 【A】コンサルティング連動型 — 販売戦略
// =============================================================================

const CONSULTING_MARKETS: TargetMarket[] = [
  {
    region: 'JP',
    phase: 1,
    languages: ['ja'],
    currencies: ['JPY'],
    salesMethods: ['direct_consulting'],
    notes: '既存コンサル案件のクライアントに直接提案。新規営業コスト最小。',
  },
  {
    region: 'SEA',
    phase: 2,
    languages: ['en', 'vi'],
    currencies: ['USD', 'VND'],
    salesMethods: ['direct_consulting', 'reseller'],
    notes: 'ベトナム等のオフショア開発拠点経由。RPA移行需要が高い。',
  },
];

const CONSULTING_SEGMENTS: CustomerSegment[] = [
  {
    name: 'Enterprise IT Department',
    nameJa: '大手企業IT部門',
    description: '既存RPA・ローコードの移行・最適化を検討している大手企業',
    companySize: 'enterprise',
    recommendedPlan: 'ENT',
  },
  {
    name: 'Mid-size DX Division',
    nameJa: '中堅企業DX推進部門',
    description: 'DX推進の一環でRPA・自動化を導入・拡大したい中堅企業',
    companySize: 'medium',
    recommendedPlan: 'PRO',
  },
  {
    name: 'SI Partner',
    nameJa: 'SIパートナー',
    description: '自社のコンサル案件でツールを活用したいSIer・パートナー',
    companySize: 'large',
    recommendedPlan: 'PRO',
  },
];

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
    description: 'RPA移行・DX関連セミナーでの製品デモ・事例紹介',
  },
  {
    name: 'Partner Referral',
    type: 'partner',
    targetRegions: ['JP', 'SEA'],
    priority: 3,
    description: 'SIer・コンサルパートナーからの紹介・共同提案',
  },
];

// =============================================================================
// 【B】グローバルスタンドアロン型 — 販売戦略
// =============================================================================

const STANDALONE_MARKETS: TargetMarket[] = [
  {
    region: 'JP',
    phase: 1,
    languages: ['ja'],
    currencies: ['JPY'],
    salesMethods: ['own_website', 'payment_platform'],
    notes: '自社サイト + Paddle/Gumroad。日本市場でまず実績を作る。',
  },
  {
    region: 'US',
    phase: 2,
    languages: ['en'],
    currencies: ['USD'],
    salesMethods: ['own_website', 'payment_platform', 'microsoft_store'],
    notes: 'Paddle（MoR）でUSの税務処理を委託。Microsoft Store経由でも展開。',
  },
  {
    region: 'EU',
    phase: 2,
    languages: ['en', 'de', 'fr'],
    currencies: ['USD', 'EUR'],
    salesMethods: ['own_website', 'payment_platform'],
    notes: 'EU VAT処理はPaddle（MoR）に委託。英語UIで初期展開。',
  },
  {
    region: 'KR',
    phase: 3,
    languages: ['ko', 'en'],
    currencies: ['USD', 'KRW'],
    salesMethods: ['own_website', 'payment_platform', 'reseller'],
    notes: 'Office利用率が高い市場。韓国語ローカライズで差別化。',
  },
  {
    region: 'SEA',
    phase: 3,
    languages: ['en'],
    currencies: ['USD'],
    salesMethods: ['own_website', 'payment_platform'],
    notes: '英語圏として展開。価格帯は同一（USD基準）。',
  },
];

const STANDALONE_SEGMENTS: CustomerSegment[] = [
  {
    name: 'Individual Power User',
    nameJa: '個人パワーユーザー',
    description: 'Office業務を効率化したい個人ユーザー・フリーランス',
    companySize: 'individual',
    recommendedPlan: 'STD',
  },
  {
    name: 'Small Team',
    nameJa: '小規模チーム',
    description: '5〜20人規模のチームでOffice業務を効率化したい企業',
    companySize: 'small',
    recommendedPlan: 'PRO',
  },
  {
    name: 'Corporate Department',
    nameJa: '法人部門導入',
    description: '部門単位でツールを導入したい中堅〜大手企業',
    companySize: 'medium',
    recommendedPlan: 'PRO',
  },
  {
    name: 'Enterprise Volume',
    nameJa: 'エンタープライズ一括',
    description: '全社導入・API連携を含む大規模展開',
    companySize: 'enterprise',
    recommendedPlan: 'ENT',
  },
];

const STANDALONE_MARKETING: MarketingChannel[] = [
  {
    name: 'SEO / Content Marketing',
    type: 'organic',
    targetRegions: ['JP', 'US', 'EU', 'GLOBAL'],
    priority: 1,
    description: 'Office操作・自動化のハウツー記事・ブログ。長期的なリード獲得の基盤。',
  },
  {
    name: 'YouTube Product Demo',
    type: 'organic',
    targetRegions: ['JP', 'US', 'GLOBAL'],
    priority: 2,
    description: '製品デモ動画・チュートリアル。視覚的な訴求で転換率向上。',
  },
  {
    name: 'Product Hunt / Hacker News',
    type: 'organic',
    targetRegions: ['US', 'GLOBAL'],
    priority: 3,
    description: 'ローンチ時の初期ユーザー獲得。テックコミュニティでの認知拡大。',
  },
  {
    name: 'Microsoft Store',
    type: 'organic',
    targetRegions: ['US', 'EU', 'GLOBAL'],
    priority: 4,
    description: 'Microsoft Store経由の自然流入。Windowsユーザーへの直接リーチ。',
  },
  {
    name: 'Google Ads / Search Ads',
    type: 'paid',
    targetRegions: ['JP', 'US'],
    priority: 5,
    description: '「PowerPoint 自動化」「Excel バージョン管理」等のキーワード広告。',
  },
  {
    name: 'SNS (X / LinkedIn)',
    type: 'organic',
    targetRegions: ['JP', 'US', 'GLOBAL'],
    priority: 6,
    description: '製品アップデート・ユースケース紹介。LinkedInは法人向けリード獲得に有効。',
  },
  {
    name: 'Reseller / VAR Partner',
    type: 'partner',
    targetRegions: ['JP', 'KR', 'SEA'],
    priority: 7,
    description: '現地リセラー・VAR経由の販売。ローカルサポート提供。',
  },
];

// =============================================================================
// 製品別販売戦略
// =============================================================================

export const PRODUCT_SALES_STRATEGY: Record<ProductCode, ProductSalesStrategy> = {

  // =========================================================================
  // コンサルティング連動型
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
    positioning: 'BizRobo/UiPath等のRPA移行アセスメント + Forguncy解析を自動化する唯一のツール。AI（Opus）搭載。',
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
  // グローバルスタンドアロン型
  // =========================================================================

  IOSH: {
    productCode: 'IOSH',
    channel: 'standalone',
    targetMarkets: STANDALONE_MARKETS,
    customerSegments: STANDALONE_SEGMENTS,
    marketingChannels: STANDALONE_MARKETING,
    trialStrategy: {
      durationDays: 30,
      expectedConversionRate: 0.10,
      noCreditCardRequired: true,
    },
    positioning: 'Excelに「Gitのようなバージョン管理」を。セル単位の変更追跡・差分比較・チームコラボレーション。AI搭載。',
  },

  IODC: {
    productCode: 'IODC',
    channel: 'standalone',
    targetMarkets: STANDALONE_MARKETS,
    customerSegments: STANDALONE_SEGMENTS,
    marketingChannels: STANDALONE_MARKETING,
    trialStrategy: {
      durationDays: 30,
      expectedConversionRate: 0.07,
      noCreditCardRequired: true,
    },
    positioning: 'Word操作を自動化。テンプレートからの大量文書生成、PDF変換、マクロ実行をワンストップで。AI搭載。',
  },

  IOSL: {
    productCode: 'IOSL',
    channel: 'standalone',
    targetMarkets: STANDALONE_MARKETS,
    customerSegments: STANDALONE_SEGMENTS,
    marketingChannels: STANDALONE_MARKETING,
    trialStrategy: {
      durationDays: 30,
      expectedConversionRate: 0.10,
      noCreditCardRequired: true,
    },
    positioning: 'PowerPointのコンテンツ抽出・一括更新・プレゼンテーション自動化。多言語対応。AI搭載。',
  },

  INPY: {
    productCode: 'INPY',
    channel: 'standalone',
    targetMarkets: STANDALONE_MARKETS,
    customerSegments: STANDALONE_SEGMENTS,
    marketingChannels: STANDALONE_MARKETING,
    trialStrategy: {
      durationDays: 30,
      expectedConversionRate: 0.06,
      noCreditCardRequired: true,
    },
    positioning: 'Windows業務をPythonで自動化する実行環境。環境構築不要で即座にPythonスクリプトを実行。AI搭載。',
  },
};

// =============================================================================
// 決済プラットフォーム設定
// =============================================================================

/** 決済プラットフォーム */
export interface PaymentPlatform {
  /** プラットフォーム名 */
  name: string;
  /** 種別 */
  type: 'mor' | 'payment_gateway' | 'store';
  /** 対応地域 */
  regions: MarketRegion[];
  /** 手数料率（概算） */
  feeRate: number;
  /** Merchant of Record（税務処理代行）か */
  isMerchantOfRecord: boolean;
  /** 備考 */
  notes: string;
}

export const PAYMENT_PLATFORMS: PaymentPlatform[] = [
  {
    name: 'Paddle',
    type: 'mor',
    regions: ['JP', 'US', 'EU', 'GLOBAL'],
    feeRate: 0.05,
    isMerchantOfRecord: true,
    notes: 'グローバル展開の主力。MoRとしてVAT/消費税の申告・納付を代行。サブスクリプション管理機能あり。',
  },
  {
    name: 'Gumroad',
    type: 'mor',
    regions: ['US', 'GLOBAL'],
    feeRate: 0.10,
    isMerchantOfRecord: true,
    notes: '初期展開・テスト販売向け。手数料は高いがセットアップが簡単。',
  },
  {
    name: 'Microsoft Store',
    type: 'store',
    regions: ['US', 'EU', 'GLOBAL'],
    feeRate: 0.12,
    isMerchantOfRecord: true,
    notes: 'Windowsデスクトップアプリの自然流入チャネル。ストア手数料12%。',
  },
  {
    name: 'Stripe',
    type: 'payment_gateway',
    regions: ['JP'],
    feeRate: 0.036,
    isMerchantOfRecord: false,
    notes: '日本国内向け自社サイト決済。税務処理は自社対応。コンサル連動型にも使用。',
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
};
