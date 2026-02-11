/**
 * HARMONIC insight 価格戦略定義
 *
 * ============================================================================
 * 【価格設計方針】全製品 法人向け（B2B Only）
 * ============================================================================
 *
 * 全製品をコンサルティング案件の一環として法人向けに提供。
 * コンサルタントがクライアント企業に導入するツール群。
 * 直販またはパートナー（代理店）経由で販売。
 * 個人向け（B2C）販売は行わない。
 *
 * ## 製品ティア
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  Tier 1: 業務変革ツール（高単価）                                │
 * │  INCA / INBT / IVIN                                            │
 * │  年額 98万円〜398万円                                           │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  Tier 2: AI活用ツール（中単価）                                  │
 * │  INMV / INIG                                                    │
 * │  年額 48万円〜198万円                                           │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  Tier 3: InsightOffice Suite（導入ツール）                       │
 * │  INSS / IOSH / IOSD / INPY                                     │
 * │  年額 ¥39,800〜¥49,800（1ユーザー/年）                          │
 * │  コンサル案件のクライアントに業務ツールとして導入                  │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * ## 決済
 * - Stripe（自社サイト）/ 請求書払い
 */

import type { ProductCode, PlanCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** 販売チャネル — 全製品 consulting */
export type SalesChannel = 'consulting';

/** 通貨 */
export type Currency = 'JPY' | 'USD';

/** 価格単位 */
export type PricingUnit = 'per_company' | 'per_user';

/** 価格情報 */
export interface PricingInfo {
  /** 年間ライセンス価格（税抜） */
  annualPrice: number;
  /** 通貨 */
  currency: Currency;
  /** 月額換算（参考値） */
  monthlyEquivalent: number;
  /** 価格単位（デフォルト: per_company） */
  unit?: PricingUnit;
}

/** 製品別価格定義 */
export interface ProductPricing {
  /** 製品コード */
  productCode: ProductCode;
  /** 販売チャネル */
  channel: SalesChannel;
  /** チャネル説明 */
  channelDescription: string;
  /** プラン別価格 */
  plans: Partial<Record<PlanCode, PricingInfo | null>>;
  /** 備考 */
  notes?: string;
}

// =============================================================================
// 価格定義（全製品 法人向けコンサルティング連動型）
// =============================================================================

export const PRODUCT_PRICING: Record<ProductCode, ProductPricing> = {

  // =========================================================================
  // Tier 1: 業務変革ツール（高単価）
  // =========================================================================

  /**
   * InsightNoCodeAnalyzer (INCA)
   * - RPA・ローコード移行アセスメントの中核ツール
   * - 移行案件1件あたり数千万円の案件価値に対する分析ツール
   */
  INCA: {
    productCode: 'INCA',
    channel: 'consulting',
    channelDescription: 'RPA・ローコード移行コンサルティング案件と連動',
    plans: {
      TRIAL: null,
      STD: {
        annualPrice: 1_980_000,
        currency: 'JPY',
        monthlyEquivalent: 165_000,
      },
      PRO: {
        annualPrice: 3_980_000,
        currency: 'JPY',
        monthlyEquivalent: 331_667,
      },
      ENT: null,
    },
    notes: 'akaBot変換機能はPRO以上。移行アセスメント案件の分析ツールとして提供。',
  },

  /**
   * InsightBot (INBT)
   * - Python RPA自動化ボット
   * - 業務自動化コンサルティングの一環として提供
   */
  INBT: {
    productCode: 'INBT',
    channel: 'consulting',
    channelDescription: '業務自動化コンサルティング案件と連動',
    plans: {
      TRIAL: null,
      STD: {
        annualPrice: 1_480_000,
        currency: 'JPY',
        monthlyEquivalent: 123_333,
      },
      PRO: {
        annualPrice: 2_980_000,
        currency: 'JPY',
        monthlyEquivalent: 248_333,
      },
      ENT: null,
    },
    notes: 'クラウド同期・JOB無制限はPRO以上。自動化コンサルとセットで提供。',
  },

  /**
   * InterviewInsight (IVIN)
   * - 面接分析・採用支援ツール
   * - 採用コンサルティングの一環として提供
   */
  IVIN: {
    productCode: 'IVIN',
    channel: 'consulting',
    channelDescription: '採用・面接コンサルティング案件と連動',
    plans: {
      TRIAL: null,
      STD: null,
      PRO: null,
      ENT: null,
    },
    notes: '全プラン個別見積もり。採用コンサルとセットで提供。',
  },

  // =========================================================================
  // Tier 2: AI活用ツール（中単価）
  // =========================================================================

  /**
   * InsightMovie (INMV)
   * - AI動画作成ツール
   * - コンテンツ制作・研修動画作成コンサルの一環
   */
  INMV: {
    productCode: 'INMV',
    channel: 'consulting',
    channelDescription: 'コンテンツ制作・研修動画コンサルティングと連動',
    plans: {
      TRIAL: null,
      STD: {
        annualPrice: 980_000,
        currency: 'JPY',
        monthlyEquivalent: 81_667,
      },
      PRO: {
        annualPrice: 1_980_000,
        currency: 'JPY',
        monthlyEquivalent: 165_000,
      },
      ENT: null,
    },
    notes: '4K出力・字幕カスタマイズ・トランジションはPRO以上。',
  },

  /**
   * InsightImageGen (INIG)
   * - AI画像・音声生成ツール
   */
  INIG: {
    productCode: 'INIG',
    channel: 'consulting',
    channelDescription: 'AI活用・コンテンツ制作コンサルティングと連動',
    plans: {
      TRIAL: null,
      STD: {
        annualPrice: 480_000,
        currency: 'JPY',
        monthlyEquivalent: 40_000,
      },
      PRO: {
        annualPrice: 980_000,
        currency: 'JPY',
        monthlyEquivalent: 81_667,
      },
      ENT: null,
    },
    notes: '高解像度出力・クラウド同期はPRO以上。',
  },

  // =========================================================================
  // Tier 3: InsightOffice Suite（コンサル導入ツール）
  // =========================================================================

  /**
   * InsightOfficeSlide (INSS)
   * - PowerPointコンテンツ抽出・レビュー・AIアシスタント
   * - コンサル案件でクライアントに業務ツールとして導入
   */
  INSS: {
    productCode: 'INSS',
    channel: 'consulting',
    channelDescription: 'コンサル案件のクライアントにOffice業務ツールとして導入',
    plans: {
      TRIAL: null,
      STD: {
        annualPrice: 39_800,
        currency: 'JPY',
        monthlyEquivalent: 3_317,
        unit: 'per_user',
      },
      PRO: {
        annualPrice: 49_800,
        currency: 'JPY',
        monthlyEquivalent: 4_150,
        unit: 'per_user',
      },
      ENT: null,
    },
    notes: 'STD=基本機能+AI月50回、PRO=全機能+AI月200回+コラボレーション。1ユーザー/年。パートナー販売可。',
  },

  /**
   * InsightOfficeSheet (IOSH)
   * - Excel バージョン管理・予実管理・AIアシスタント
   */
  IOSH: {
    productCode: 'IOSH',
    channel: 'consulting',
    channelDescription: 'コンサル案件のクライアントにOffice業務ツールとして導入',
    plans: {
      TRIAL: null,
      STD: {
        annualPrice: 39_800,
        currency: 'JPY',
        monthlyEquivalent: 3_317,
        unit: 'per_user',
      },
      PRO: {
        annualPrice: 49_800,
        currency: 'JPY',
        monthlyEquivalent: 4_150,
        unit: 'per_user',
      },
      ENT: null,
    },
    notes: 'STD=基本機能+AI月50回、PRO=全機能+AI月200回+コラボレーション。1ユーザー/年。パートナー販売可。',
  },

  /**
   * InsightOfficeDoc (IOSD)
   * - Word文書管理・参照資料・AIアシスタント
   */
  IOSD: {
    productCode: 'IOSD',
    channel: 'consulting',
    channelDescription: 'コンサル案件のクライアントにOffice業務ツールとして導入',
    plans: {
      TRIAL: null,
      STD: {
        annualPrice: 39_800,
        currency: 'JPY',
        monthlyEquivalent: 3_317,
        unit: 'per_user',
      },
      PRO: {
        annualPrice: 49_800,
        currency: 'JPY',
        monthlyEquivalent: 4_150,
        unit: 'per_user',
      },
      ENT: null,
    },
    notes: 'STD=基本機能+AI月50回、PRO=全機能+AI月200回+コラボレーション。1ユーザー/年。パートナー販売可。',
  },

  /**
   * InsightPy (INPY)
   * - Python実行基盤・業務調査・データ収集
   */
  INPY: {
    productCode: 'INPY',
    channel: 'consulting',
    channelDescription: 'コンサル案件のクライアントに業務自動化ツールとして導入',
    plans: {
      TRIAL: null,
      STD: {
        annualPrice: 39_800,
        currency: 'JPY',
        monthlyEquivalent: 3_317,
        unit: 'per_user',
      },
      PRO: {
        annualPrice: 49_800,
        currency: 'JPY',
        monthlyEquivalent: 4_150,
        unit: 'per_user',
      },
      ENT: null,
    },
    notes: 'STD=基本機能+AI月50回、PRO=全機能+AI月200回。1ユーザー/年。パートナー販売可。',
  },

  // =========================================================================
  // Tier 4: Insight Senior Office（シニア向け社会貢献ツール）
  // =========================================================================

  /**
   * InsightSeniorOffice (ISOF)
   * - シニア向け統合オフィスツール（表計算・文書・iCloudメール）
   * - 地方創生・デジタルデバイド解消案件と連動
   * - 社会貢献的価格設定（9,800円/人/年）
   */
  ISOF: {
    productCode: 'ISOF',
    channel: 'consulting',
    channelDescription: '地方創生・デジタルデバイド解消コンサル案件、企業のシニア社員向けツールとして導入',
    plans: {
      TRIAL: null,
      STD: {
        annualPrice: 9_800,
        currency: 'JPY',
        monthlyEquivalent: 817,
        unit: 'per_user',
      },
      PRO: null,
      ENT: null,
    },
    notes: 'STD=全機能+AI月50回（Haikuのみ）。1ユーザー/年。PROプランなし（シンプルさ重視）。自治体・福祉法人向けENTは個別見積。',
  },
};

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 製品の販売チャネルを取得（全製品 consulting）
 */
export function getSalesChannel(productCode: ProductCode): SalesChannel {
  return PRODUCT_PRICING[productCode].channel;
}

/**
 * 製品・プランの価格を取得
 * @returns 価格情報（null = 無料トライアル or 個別見積もり）
 */
export function getPrice(productCode: ProductCode, planCode: PlanCode): PricingInfo | null {
  const pricing = PRODUCT_PRICING[productCode];
  return pricing.plans[planCode] ?? null;
}

/**
 * 製品の価格一覧を取得（UI表示用）
 */
export function getPricingTable(productCode: ProductCode): Array<{
  plan: PlanCode;
  price: PricingInfo | null;
  label: string;
}> {
  const pricing = PRODUCT_PRICING[productCode];
  const entries = Object.entries(pricing.plans) as [PlanCode, PricingInfo | null][];

  return entries.map(([plan, price]) => {
    let label: string;
    if (plan === 'TRIAL') {
      label = '無料トライアル（14日間）';
    } else if (plan === 'ENT') {
      label = '個別見積もり';
    } else if (price) {
      const unitSuffix = price.unit === 'per_user' ? '/人/年' : '/年';
      label = `¥${price.annualPrice.toLocaleString()}${unitSuffix}`;
    } else {
      label = '個別見積もり';
    }

    return { plan, price, label };
  });
}

/**
 * 全製品一覧を取得（全製品コンサルティング連動型）
 */
export function getConsultingProducts(): ProductCode[] {
  return Object.keys(PRODUCT_PRICING) as ProductCode[];
}

// =============================================================================
// USD 参考価格（グローバル展開用）
// =============================================================================

/** USD 換算レート（参考） */
export const USD_REFERENCE_RATE = 150; // 1 USD = 150 JPY

/** グローバル USD 参考価格 */
export const GLOBAL_USD_PRICING: Partial<Record<ProductCode, Partial<Record<PlanCode, number>>>> = {
  INSS: { STD: 265, PRO: 332 },  // ¥39,800 / 150, ¥49,800 / 150
  IOSH: { STD: 265, PRO: 332 },
  IOSD: { STD: 265, PRO: 332 },
  INPY: { STD: 265, PRO: 332 },
  ISOF: { STD: 65 },             // ¥9,800 / 150
};

/** USD 価格を取得（参考価格） */
export function getUsdPrice(product: ProductCode, plan: PlanCode): number | null {
  return GLOBAL_USD_PRICING[product]?.[plan] ?? null;
}

// =============================================================================
// AI アドオンパック価格（pricing 側の参照定義）
// =============================================================================

/**
 * AI クレジット アドオンパック価格（2ティア制）
 *
 * - Standard: ¥10,000 / 200回（Sonnet まで）
 * - Premium: ¥20,000 / 200回（Opus 対応）
 * - 全プランで購入可能（STD でもアドオン購入で AI 利用可能に）
 * 詳細定義は config/usage-based-licensing.ts を参照
 */
export const AI_ADDON_PRICING = {
  /** Standard 200回パック — Sonnet まで */
  ai_credits_200_standard: {
    price: 10_000,
    currency: 'JPY' as Currency,
    credits: 200,
    pricePerCredit: 50,
    modelTier: 'standard' as const,
    descriptionJa: 'AI標準パック 200回（Sonnetまで）',
    descriptionEn: '200 AI Credits - Standard (up to Sonnet)',
  },
  /** Premium 200回パック — Opus 対応 */
  ai_credits_200_premium: {
    price: 20_000,
    currency: 'JPY' as Currency,
    credits: 200,
    pricePerCredit: 100,
    modelTier: 'premium' as const,
    descriptionJa: 'AIプレミアムパック 200回（Opus対応）',
    descriptionEn: '200 AI Credits - Premium (including Opus)',
  },
} as const;

/** AI アドオンパック USD 参考価格 */
export const AI_ADDON_USD_PRICING: Record<string, number> = {
  ai_credits_200_standard: 67,
  ai_credits_200_premium: 133,
};

/** アドオン価格を取得 */
export function getAddonPrice(packId: string): typeof AI_ADDON_PRICING[keyof typeof AI_ADDON_PRICING] | null {
  return (AI_ADDON_PRICING as Record<string, any>)[packId] ?? null;
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  PRODUCT_PRICING,
  GLOBAL_USD_PRICING,
  USD_REFERENCE_RATE,
  AI_ADDON_PRICING,
  AI_ADDON_USD_PRICING,
  getSalesChannel,
  getPrice,
  getPricingTable,
  getConsultingProducts,
  getUsdPrice,
  getAddonPrice,
};
