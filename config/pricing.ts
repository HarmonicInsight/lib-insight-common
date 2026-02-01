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
 * - AI込み・無制限（別課金なし）
 * - 対象: INCA / INBT / INMV / INIG
 *
 * ### B. グローバルスタンドアロン型（Global Standalone）
 * - ¥49,800/年/人（全製品横並び）
 * - ボリュームディスカウント: 10人〜¥39,800、100人〜¥29,800、1,000人〜¥19,800
 * - AI: 無料枠20回/月 + カウント追加購入（ゲーム課金モデル）
 * - 対象: IOSH / IODC / IOSL / INPY
 *
 * ## 廃止製品
 * INSS, INSP, FGIN, HMSH, HMDC, HMSL → 新コードに移行
 */

import type { ProductCode, PlanCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** 販売チャネル */
export type SalesChannel = 'consulting' | 'standalone';

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

/** ボリュームディスカウント段階 */
export interface VolumeDiscount {
  /** 最小ライセンス数 */
  minLicenses: number;
  /** 1ライセンスあたり年額（税抜） */
  pricePerLicense: number;
  /** 定価からの割引率 */
  discountRate: number;
  /** 備考 */
  notes?: string;
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
  /** ボリュームディスカウント（スタンドアロン型のみ） */
  volumeDiscounts?: VolumeDiscount[];
  /** AI提供方針 */
  aiPolicy: 'included_unlimited' | 'free_quota_plus_purchase';
  /** 備考 */
  notes?: string;
}

// =============================================================================
// ボリュームディスカウント定義（スタンドアロン型共通）
// =============================================================================

/**
 * ボリュームディスカウント段階
 *
 * 1人:      ¥49,800/年
 * 10人〜:   ¥39,800/年（20%OFF）
 * 100人〜:  ¥29,800/年（40%OFF） — 部署導入、部長決裁ライン
 * 1,000人〜: ¥19,800/年（60%OFF） — 全社導入、役員決裁ライン（年2,000万弱）
 * 10,000人〜: 個別見積（ENT）
 */
export const VOLUME_DISCOUNTS: VolumeDiscount[] = [
  {
    minLicenses: 1,
    pricePerLicense: 49_800,
    discountRate: 0,
    notes: '個人・小チーム',
  },
  {
    minLicenses: 10,
    pricePerLicense: 39_800,
    discountRate: 0.20,
    notes: '小チーム（10人〜）',
  },
  {
    minLicenses: 100,
    pricePerLicense: 29_800,
    discountRate: 0.40,
    notes: '部署導入（100人〜）',
  },
  {
    minLicenses: 1_000,
    pricePerLicense: 19_800,
    discountRate: 0.60,
    notes: '全社導入（1,000人〜）',
  },
  {
    minLicenses: 10_000,
    pricePerLicense: -1,  // 個別見積
    discountRate: -1,
    notes: '大企業（10,000人〜）→ ENT個別見積',
  },
];

// =============================================================================
// 価格定義
// =============================================================================

export const PRODUCT_PRICING: Record<ProductCode, ProductPricing> = {

  // =========================================================================
  // コンサルティング連動型（Consulting-Bundled）
  // AI込み・無制限
  // =========================================================================

  INCA: {
    productCode: 'INCA',
    channel: 'consulting',
    channelDescription: 'RPA・ローコード・Forguncy移行コンサルティング案件と連動（旧FGIN統合）',
    aiPolicy: 'included_unlimited',
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
      ENT: null, // 個別見積
    },
    notes: 'akaBot変換機能はPRO以上。移行アセスメント案件（数千万円規模）の分析ツール。AI（Opus）込み・無制限。',
  },

  INBT: {
    productCode: 'INBT',
    channel: 'consulting',
    channelDescription: '業務自動化コンサルティング案件と連動',
    aiPolicy: 'included_unlimited',
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
    notes: 'クラウド同期・JOB無制限はPRO以上。自動化コンサルとセットで提供。AI（Opus）込み・無制限。',
  },

  INMV: {
    productCode: 'INMV',
    channel: 'consulting',
    channelDescription: 'コンテンツ制作・研修動画コンサルティングと連動',
    aiPolicy: 'included_unlimited',
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
    notes: '4K出力・字幕カスタマイズ・トランジションはPRO以上。AI（Opus）込み・無制限。',
  },

  INIG: {
    productCode: 'INIG',
    channel: 'consulting',
    channelDescription: 'AI活用・コンテンツ制作コンサルティングと連動',
    aiPolicy: 'included_unlimited',
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
    notes: '高解像度出力・クラウド同期はPRO以上。AI（Opus）込み・無制限。',
  },

  // =========================================================================
  // グローバルスタンドアロン型（Global Standalone）
  // ¥49,800/年/人（横並び）+ AIカウント課金
  // =========================================================================

  IOSH: {
    productCode: 'IOSH',
    channel: 'standalone',
    channelDescription: 'グローバル単独販売（Excel業務ユーザー向け）',
    aiPolicy: 'free_quota_plus_purchase',
    plans: {
      TRIAL: null,  // 14日間全機能
      STD: {
        annualPrice: 49_800,
        currency: 'JPY',
        monthlyEquivalent: 4_150,
      },
      ENT: null,  // 個別見積
    },
    volumeDiscounts: VOLUME_DISCOUNTS,
    notes: '旧HarmonicSheet(HMSH)。¥49,800/年/人。AI無料枠20回/月+カウント追加購入。',
  },

  IODC: {
    productCode: 'IODC',
    channel: 'standalone',
    channelDescription: 'グローバル単独販売（Word業務ユーザー向け）',
    aiPolicy: 'free_quota_plus_purchase',
    plans: {
      TRIAL: null,
      STD: {
        annualPrice: 49_800,
        currency: 'JPY',
        monthlyEquivalent: 4_150,
      },
      ENT: null,
    },
    volumeDiscounts: VOLUME_DISCOUNTS,
    notes: '旧HarmonicDoc(HMDC)。¥49,800/年/人。AI無料枠20回/月+カウント追加購入。',
  },

  IOSL: {
    productCode: 'IOSL',
    channel: 'standalone',
    channelDescription: 'グローバル単独販売（PowerPoint業務ユーザー向け）',
    aiPolicy: 'free_quota_plus_purchase',
    plans: {
      TRIAL: null,
      STD: {
        annualPrice: 49_800,
        currency: 'JPY',
        monthlyEquivalent: 4_150,
      },
      ENT: null,
    },
    volumeDiscounts: VOLUME_DISCOUNTS,
    notes: '旧HarmonicSlide(HMSL) + InsightSlide(INSS) + InsightSlide Pro(INSP)統合。¥49,800/年/人。',
  },

  INPY: {
    productCode: 'INPY',
    channel: 'standalone',
    channelDescription: 'グローバル単独販売（Windows自動化ユーザー向け）',
    aiPolicy: 'free_quota_plus_purchase',
    plans: {
      TRIAL: null,
      STD: {
        annualPrice: 49_800,
        currency: 'JPY',
        monthlyEquivalent: 4_150,
      },
      ENT: null,
    },
    volumeDiscounts: VOLUME_DISCOUNTS,
    notes: '¥49,800/年/人。AI無料枠20回/月+カウント追加購入。開発者はAIカウントをガンガン使う想定。',
  },
};

// =============================================================================
// USD参考価格（グローバル展開用）
// =============================================================================

/** USD参考レート（1 USD = 150 JPY で算出） */
export const USD_REFERENCE_RATE = 150;

/** グローバル展開向けUSD価格表 */
export const GLOBAL_USD_PRICING: Partial<Record<ProductCode, {
  STD: number;
  volumeDiscounts: Array<{ minLicenses: number; pricePerLicense: number }>;
}>> = {
  IOSH: {
    STD: 330,
    volumeDiscounts: [
      { minLicenses: 1, pricePerLicense: 330 },
      { minLicenses: 10, pricePerLicense: 265 },
      { minLicenses: 100, pricePerLicense: 200 },
      { minLicenses: 1_000, pricePerLicense: 130 },
    ],
  },
  IODC: {
    STD: 330,
    volumeDiscounts: [
      { minLicenses: 1, pricePerLicense: 330 },
      { minLicenses: 10, pricePerLicense: 265 },
      { minLicenses: 100, pricePerLicense: 200 },
      { minLicenses: 1_000, pricePerLicense: 130 },
    ],
  },
  IOSL: {
    STD: 330,
    volumeDiscounts: [
      { minLicenses: 1, pricePerLicense: 330 },
      { minLicenses: 10, pricePerLicense: 265 },
      { minLicenses: 100, pricePerLicense: 200 },
      { minLicenses: 1_000, pricePerLicense: 130 },
    ],
  },
  INPY: {
    STD: 330,
    volumeDiscounts: [
      { minLicenses: 1, pricePerLicense: 330 },
      { minLicenses: 10, pricePerLicense: 265 },
      { minLicenses: 100, pricePerLicense: 200 },
      { minLicenses: 1_000, pricePerLicense: 130 },
    ],
  },
};

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
 * ボリュームディスカウント適用後の1ライセンス単価を取得
 */
export function getVolumePrice(productCode: ProductCode, licenseCount: number): {
  pricePerLicense: number;
  totalPrice: number;
  discountRate: number;
  isEnterprise: boolean;
} {
  const pricing = PRODUCT_PRICING[productCode];
  if (!pricing.volumeDiscounts) {
    // コンサル連動型にはボリュームディスカウントなし
    const stdPrice = pricing.plans.STD;
    return {
      pricePerLicense: stdPrice?.annualPrice ?? 0,
      totalPrice: (stdPrice?.annualPrice ?? 0) * licenseCount,
      discountRate: 0,
      isEnterprise: false,
    };
  }

  // 適用可能な最大の段階を探す
  let applicableTier = pricing.volumeDiscounts[0];
  for (const tier of pricing.volumeDiscounts) {
    if (licenseCount >= tier.minLicenses) {
      applicableTier = tier;
    }
  }

  if (applicableTier.pricePerLicense === -1) {
    // ENT個別見積
    return {
      pricePerLicense: -1,
      totalPrice: -1,
      discountRate: -1,
      isEnterprise: true,
    };
  }

  return {
    pricePerLicense: applicableTier.pricePerLicense,
    totalPrice: applicableTier.pricePerLicense * licenseCount,
    discountRate: applicableTier.discountRate,
    isEnterprise: false,
  };
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
 * グローバルスタンドアロン型の製品一覧を取得
 */
export function getStandaloneProducts(): ProductCode[] {
  return (Object.keys(PRODUCT_PRICING) as ProductCode[])
    .filter(code => PRODUCT_PRICING[code].channel === 'standalone');
}

/**
 * USD参考価格を取得（グローバル展開製品のみ）
 */
export function getUsdPrice(productCode: ProductCode, licenseCount: number = 1): number | null {
  const usdPricing = GLOBAL_USD_PRICING[productCode];
  if (!usdPricing) return null;

  if (licenseCount <= 1) return usdPricing.STD;

  let applicablePrice = usdPricing.STD;
  for (const tier of usdPricing.volumeDiscounts) {
    if (licenseCount >= tier.minLicenses) {
      applicablePrice = tier.pricePerLicense;
    }
  }
  return applicablePrice;
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  PRODUCT_PRICING,
  VOLUME_DISCOUNTS,
  GLOBAL_USD_PRICING,
  USD_REFERENCE_RATE,
  getSalesChannel,
  getPrice,
  getVolumePrice,
  getPricingTable,
  getConsultingProducts,
  getStandaloneProducts,
  getUsdPrice,
};
