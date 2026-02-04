/**
 * Harmonic Insight 価格戦略定義
 *
 * ============================================================================
 * 【価格設計方針】
 * ============================================================================
 *
 * ## 2つの販売チャネル
 *
 * ### A. コンサルティング連動型（Consulting-Bundled）
 * - コンサルティング案件（数千万円規模）の一部として提供
 * - 単体でも数百万円の価値がある業務ツール
 * - 大量販売は不要、コンサルフィーとの組み合わせで収益化
 * - 対象: RPA移行・ローコード解析・自動化ボット・面接分析等
 *
 * ### B. 個人・法人向け型（Individual）
 * - 3〜5万円帯でグローバルに大量販売
 * - Office系ツール（Excel/Word/PowerPoint操作）
 * - 単独でソフトウェア製品として成立する汎用ツール
 * - 対象: InsightOfficeSlide、InsightOfficeSheet、InsightOfficeDoc、InsightPy等
 *
 * ## 価格設定根拠
 * - コンサル連動型: 移行アセスメント1件で数百万〜数千万の案件価値
 * - 個人・法人向け型: グローバルSaaS/デスクトップツールの相場帯
 */

import type { ProductCode, PlanCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** 販売チャネル */
export type SalesChannel = 'consulting' | 'individual';

/** 通貨 */
export type Currency = 'JPY' | 'USD';

/** 価格情報 */
export interface PricingInfo {
  /** 年間ライセンス価格（税抜） */
  annualPrice: number;
  /** 通貨 */
  currency: Currency;
  /** 月額換算（参考値） */
  monthlyEquivalent: number;
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
// 価格定義
// =============================================================================

/**
 * 製品別価格表
 *
 * 【価格体系の全体像】
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  コンサルティング連動型（数百万円〜）                              │
 * │  INCA / INBT / INMV / INIG / IVIN                              │
 * │  → コンサル案件と一括提供、少量・高単価                           │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  個人・法人向け型（3〜5万円）                                     │
 * │  INSS / INPY / IOSH / IOSD                                     │
 * │  → 単独販売、グローバル展開、大量販売                             │
 * └──────────────────────────────────────────────────────────────────┘
 */
export const PRODUCT_PRICING: Record<ProductCode, ProductPricing> = {

  // =========================================================================
  // コンサルティング連動型（Consulting-Bundled）
  // =========================================================================

  /**
   * InsightNoCodeAnalyzer (INCA)
   * - RPA・ローコード移行アセスメントの中核ツール
   * - 移行案件1件あたり数千万円の案件価値に対する分析ツール
   * - 最も高単価：解析・変換・アセスメントレポートの自動生成
   */
  INCA: {
    productCode: 'INCA',
    channel: 'consulting',
    channelDescription: 'RPA・ローコード移行コンサルティング案件と連動',
    plans: {
      TRIAL: null, // 無料トライアル（1ヶ月）
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
      ENT: null, // 個別見積もり
    },
    notes: 'akaBot変換機能はPRO以上。移行アセスメント案件（数千万円規模）の分析ツールとして提供。',
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
    notes: '4K出力・字幕カスタマイズ・トランジションはPRO以上。',
  },

  /**
   * InsightImageGen (INIG)
   * - AI画像・音声生成ツール
   * - コンテンツ制作コンサルの付帯ツール
   */
  INIG: {
    productCode: 'INIG',
    channel: 'consulting',
    channelDescription: 'AI活用・コンテンツ制作コンサルティングと連動',
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
    notes: '高解像度出力・クラウド同期はPRO以上。',
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
      STD: null, // 個別見積もり
      PRO: null, // 個別見積もり
      ENT: null, // 個別見積もり
    },
    notes: '全プラン個別見積もり。採用コンサルとセットで提供。',
  },

  // =========================================================================
  // 個人・法人向け型（Individual）
  // =========================================================================

  /**
   * InsightOfficeSlide (INSS)
   * - PowerPointコンテンツ抽出・更新ツール
   * - グローバルで最も売れる可能性がある汎用ツール
   */
  INSS: {
    productCode: 'INSS',
    channel: 'individual',
    channelDescription: 'グローバル単独販売（InsightOfficeSlide - PowerPointユーザー向け）',
    plans: {
      FREE: {
        annualPrice: 0,
        currency: 'JPY',
        monthlyEquivalent: 0,
      },
      TRIAL: null,
      STD: {
        annualPrice: 39_800,
        currency: 'JPY',
        monthlyEquivalent: 3_317,
      },
      PRO: {
        annualPrice: 49_800,
        currency: 'JPY',
        monthlyEquivalent: 4_150,
      },
      ENT: null,
    },
    notes: 'FREE=AI 20回付(Sonnet)、STD=AIなし、PRO=AI 100回付(Sonnet)、Premiumアドオンで Opus利用可。グローバル展開の主力製品。',
  },

  /**
   * InsightPy (INPY)
   * - Python実行環境（Windows自動化）
   */
  INPY: {
    productCode: 'INPY',
    channel: 'individual',
    channelDescription: 'グローバル単独販売（Windows自動化ユーザー向け）',
    plans: {
      FREE: {
        annualPrice: 0,
        currency: 'JPY',
        monthlyEquivalent: 0,
      },
      TRIAL: null,
      STD: {
        annualPrice: 39_800,
        currency: 'JPY',
        monthlyEquivalent: 3_317,
      },
      PRO: {
        annualPrice: 49_800,
        currency: 'JPY',
        monthlyEquivalent: 4_150,
      },
      ENT: null,
    },
    notes: 'FREE=AI 20回付(Sonnet)、STD=AIなし、PRO=AI 100回付(Sonnet)、Premiumアドオンで Opus利用可。',
  },

  /**
   * InsightOfficeSheet (IOSH)
   * - Excelバージョン管理・チームコラボレーション
   */
  IOSH: {
    productCode: 'IOSH',
    channel: 'individual',
    channelDescription: 'グローバル単独販売（Excel業務ユーザー向け）',
    plans: {
      FREE: {
        annualPrice: 0,
        currency: 'JPY',
        monthlyEquivalent: 0,
      },
      TRIAL: null,
      STD: {
        annualPrice: 39_800,
        currency: 'JPY',
        monthlyEquivalent: 3_317,
      },
      PRO: {
        annualPrice: 49_800,
        currency: 'JPY',
        monthlyEquivalent: 4_150,
      },
      ENT: null,
    },
    notes: 'FREE=AI 20回付(Sonnet)、STD=AIなし、PRO=AI 100回付(Sonnet)、Premiumアドオンで Opus利用可。',
  },

  /**
   * InsightOfficeDoc (IOSD)
   * - Wordドキュメント操作・自動化
   */
  IOSD: {
    productCode: 'IOSD',
    channel: 'individual',
    channelDescription: 'グローバル単独販売（Word業務ユーザー向け）',
    plans: {
      FREE: {
        annualPrice: 0,
        currency: 'JPY',
        monthlyEquivalent: 0,
      },
      TRIAL: null,
      STD: {
        annualPrice: 39_800,
        currency: 'JPY',
        monthlyEquivalent: 3_317,
      },
      PRO: {
        annualPrice: 49_800,
        currency: 'JPY',
        monthlyEquivalent: 4_150,
      },
      ENT: null,
    },
    notes: 'FREE=AI 20回付(Sonnet)、STD=AIなし、PRO=AI 100回付(Sonnet)、Premiumアドオンで Opus利用可。',
  },
};

// =============================================================================
// USD参考価格（グローバル展開用）
// =============================================================================

/** USD参考レート（1 USD = 150 JPY で算出） */
export const USD_REFERENCE_RATE = 150;

/** グローバル展開向けUSD価格表 */
export const GLOBAL_USD_PRICING: Partial<Record<ProductCode, Partial<Record<PlanCode, number>>>> = {
  INSS: { STD: 265, PRO: 332 },
  INPY: { STD: 265, PRO: 332 },
  IOSH: { STD: 265, PRO: 332 },
  IOSD: { STD: 265, PRO: 332 },
};

// =============================================================================
// AI アドオンパック価格
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

/**
 * AI アドオンパック価格を取得
 */
export function getAddonPrice(packId: string, currency: Currency = 'JPY'): number | null {
  if (currency === 'USD') {
    return AI_ADDON_USD_PRICING[packId] ?? null;
  }
  const pack = AI_ADDON_PRICING[packId as keyof typeof AI_ADDON_PRICING];
  return pack?.price ?? null;
}

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 製品の販売チャネルを取得
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
      label = '無料トライアル（1ヶ月）';
    } else if (plan === 'FREE') {
      label = '無料（機能制限あり）';
    } else if (plan === 'ENT') {
      label = '個別見積もり';
    } else if (price) {
      label = `¥${price.annualPrice.toLocaleString()}/年`;
    } else {
      label = '—';
    }

    return { plan, price, label };
  });
}

/**
 * コンサルティング連動型の製品一覧を取得
 */
export function getConsultingProducts(): ProductCode[] {
  return (Object.keys(PRODUCT_PRICING) as ProductCode[])
    .filter(code => PRODUCT_PRICING[code].channel === 'consulting');
}

/**
 * 個人・法人向け型の製品一覧を取得
 */
export function getIndividualProducts(): ProductCode[] {
  return (Object.keys(PRODUCT_PRICING) as ProductCode[])
    .filter(code => PRODUCT_PRICING[code].channel === 'individual');
}

/**
 * USD参考価格を取得（グローバル展開製品のみ）
 */
export function getUsdPrice(productCode: ProductCode, planCode: PlanCode): number | null {
  const usdPricing = GLOBAL_USD_PRICING[productCode];
  if (!usdPricing) return null;
  return usdPricing[planCode] ?? null;
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
  getIndividualProducts,
  getUsdPrice,
  getAddonPrice,
};
