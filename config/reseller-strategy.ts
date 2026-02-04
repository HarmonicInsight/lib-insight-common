/**
 * Harmonic Insight リセラー・販売代理店パートナープログラム
 *
 * ============================================================================
 * 【パートナープログラムの設計方針】全製品 法人向け（B2B Only）
 * ============================================================================
 *
 * ## 概要
 * 全製品を販売代理店（リセラー/VAR）経由で法人向けに展開するためのパートナープログラム。
 * コンサルティング案件と連動した法人向け販売を補完するチャネル。
 *
 * ## なぜリセラーが必要か
 * - 自社だけでは到達できない地域・業界へのリーチ拡大
 * - 現地語でのサポート・導入支援の提供
 * - 営業コストを変動費化（売れた分だけコミッション）
 * - パートナー企業との連携で営業力を補完
 *
 * ## パートナー種別
 *
 * ┌───────────────────────────────────────────────────────────────┐
 * │  Registered        Silver            Gold                     │
 * │  ──────────        ──────            ────                     │
 * │  誰でも参加可      年間 5件以上       年間 20件以上            │
 * │  仕入値引 20%     仕入値引 30%      仕入値引 40%             │
 * │  非独占            非独占            地域独占可               │
 * │  セルフサーブ      専任担当          専任担当+共同マーケ      │
 * └───────────────────────────────────────────────────────────────┘
 *
 * ## リセラー対象製品
 * 全製品がパートナー経由で販売可能。
 * ただし Tier 1（INCA/INBT/IVIN）は Gold パートナーのみ。
 */

import type { ProductCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** パートナーティア */
export type PartnerTier = 'registered' | 'silver' | 'gold';

/** パートナー種別 */
export type PartnerType =
  | 'reseller'        // リセラー（仕入れ→再販）
  | 'referral'        // 紹介パートナー（リード紹介のみ）
  | 'var';            // VAR: Value Added Reseller（再販+導入支援）

/** コミッションモデル */
export type CommissionModel =
  | 'wholesale_discount'   // 仕入れ値引きモデル（リセラー）
  | 'revenue_share'        // レベニューシェアモデル（紹介）
  | 'margin_based';        // マージンモデル（VAR）

/** パートナーティア定義 */
export interface PartnerTierDefinition {
  tier: PartnerTier;
  name: string;
  nameJa: string;
  /** 年間最低販売件数 */
  minAnnualDeals: number;
  /** 年間最低販売額（JPY） */
  minAnnualRevenue: number;
  /** 仕入れ値引率（0.20 = 20%引き） */
  wholesaleDiscount: number;
  /** 紹介コミッション率（レベニューシェア） */
  referralCommission: number;
  /** 初年度コミッション率 */
  firstYearCommission: number;
  /** 更新時コミッション率（2年目以降） */
  renewalCommission: number;
  /** 地域独占権の付与可否 */
  exclusivityAvailable: boolean;
  /** 専任パートナーマネージャー */
  dedicatedManager: boolean;
  /** 共同マーケティング予算（JPY/年） */
  coMarketingBudget: number;
  /** リード提供 */
  leadSharing: boolean;
  /** パートナーポータルアクセス */
  portalAccess: boolean;
  /** 販売・技術トレーニング */
  trainingIncluded: boolean;
  /** デモ環境の提供 */
  demoEnvironment: boolean;
  /** 説明 */
  description: string;
}

/** パートナー契約条件 */
export interface PartnerAgreementTerms {
  /** 契約期間（月） */
  contractDurationMonths: number;
  /** 自動更新 */
  autoRenewal: boolean;
  /** 解約予告期間（月） */
  terminationNoticePeriod: number;
  /** 支払サイト（日） */
  paymentTermsDays: number;
  /** 最低販売保証（未達時の措置） */
  minimumCommitment: string;
  /** 顧客の所有権 */
  customerOwnership: string;
  /** サポート責任分担 */
  supportResponsibility: string;
  /** 価格拘束力 */
  priceProtection: string;
}

/** リセラー対象製品の条件 */
export interface ResellerProductTerms {
  productCode: ProductCode;
  /** リセラー販売可能か */
  resellerEnabled: boolean;
  /** 販売に必要な最低パートナーティア */
  minimumTier: PartnerTier;
  /** 推奨小売価格（エンド価格）の設定自由度 */
  pricingFlexibility: 'fixed' | 'floor_price' | 'free';
  /** 最低販売価格（定価の何%以上） */
  minimumSellingPriceRatio: number;
  /** デモライセンス提供数（パートナーあたり） */
  demoLicenses: number;
  /** NFR（Not For Resale）ライセンス提供数 */
  nfrLicenses: number;
  /** 備考 */
  notes: string;
}

// =============================================================================
// パートナーティア定義
// =============================================================================

export const PARTNER_TIERS: Record<PartnerTier, PartnerTierDefinition> = {

  /**
   * Registered パートナー
   * - 参加障壁: なし（申請→審査→承認）
   * - 想定: 中小IT企業、フリーランスコンサルタント
   * - InsightOffice Suite（Tier 3）のみ販売可能
   */
  registered: {
    tier: 'registered',
    name: 'Registered Partner',
    nameJa: '登録パートナー',
    minAnnualDeals: 0,
    minAnnualRevenue: 0,
    wholesaleDiscount: 0.20,
    referralCommission: 0.15,
    firstYearCommission: 0.20,
    renewalCommission: 0.10,
    exclusivityAvailable: false,
    dedicatedManager: false,
    coMarketingBudget: 0,
    leadSharing: false,
    portalAccess: true,
    trainingIncluded: true,
    demoEnvironment: true,
    description: '誰でも参加可能。20%の仕入れ値引き。Tier 3製品（InsightOffice Suite）のみ販売可能。',
  },

  /**
   * Silver パートナー
   * - 参加障壁: 年間5件以上 or 年間500万円以上の販売実績
   * - 想定: 中堅IT企業、コンサルファーム
   * - InsightOffice Suite + Tier 2（INMV/INIG）が販売可能
   */
  silver: {
    tier: 'silver',
    name: 'Silver Partner',
    nameJa: 'シルバーパートナー',
    minAnnualDeals: 5,
    minAnnualRevenue: 5_000_000,
    wholesaleDiscount: 0.30,
    referralCommission: 0.20,
    firstYearCommission: 0.30,
    renewalCommission: 0.15,
    exclusivityAvailable: false,
    dedicatedManager: true,
    coMarketingBudget: 500_000,
    leadSharing: true,
    portalAccess: true,
    trainingIncluded: true,
    demoEnvironment: true,
    description: '年間5件以上で昇格。30%仕入れ値引き。Tier 2+3製品が販売可能。専任担当・リード共有・共同マーケ予算あり。',
  },

  /**
   * Gold パートナー
   * - 参加障壁: 年間20件以上 or 年間2,000万円以上の販売実績
   * - 想定: 大手SIer、コンサルファーム
   * - 全製品（Tier 1含む）が販売可能、地域独占権あり
   */
  gold: {
    tier: 'gold',
    name: 'Gold Partner',
    nameJa: 'ゴールドパートナー',
    minAnnualDeals: 20,
    minAnnualRevenue: 20_000_000,
    wholesaleDiscount: 0.40,
    referralCommission: 0.25,
    firstYearCommission: 0.40,
    renewalCommission: 0.20,
    exclusivityAvailable: true,
    dedicatedManager: true,
    coMarketingBudget: 2_000_000,
    leadSharing: true,
    portalAccess: true,
    trainingIncluded: true,
    demoEnvironment: true,
    description: '年間20件以上で昇格。40%仕入れ値引き。全製品販売可能。地域独占権・大型共同マーケ予算。',
  },
};

// =============================================================================
// 契約条件
// =============================================================================

export const STANDARD_AGREEMENT_TERMS: PartnerAgreementTerms = {
  contractDurationMonths: 12,
  autoRenewal: true,
  terminationNoticePeriod: 3,
  paymentTermsDays: 30,
  minimumCommitment:
    '初年度はノルマなし。2年目以降、Silver維持には年間5件以上が必要。' +
    '未達の場合はRegisteredに降格（値引き率が下がるのみ、契約解除ではない）。',
  customerOwnership:
    'エンドユーザーとのライセンス契約はHarmonic Insightが直接締結。' +
    'パートナーは販売代理として紹介・導入支援を行う。' +
    '顧客リストはパートナーと共有し、更新時のコミッションを保証。',
  supportResponsibility:
    '1次サポート（操作方法・FAQ）: パートナーが対応（トレーニング提供）。' +
    '2次サポート（バグ・技術的問題）: Harmonic Insightが対応。' +
    'パートナーポータル経由でエスカレーション。',
  priceProtection:
    'エンドユーザーへの販売価格は定価の80%以上を維持すること（ダンピング防止）。' +
    '値引きが必要な大型案件は個別協議。',
};

// =============================================================================
// 製品別リセラー条件
// =============================================================================

/**
 * 全製品のリセラー販売条件
 *
 * 【方針】
 * - Tier 1（INCA/INBT/IVIN）: Gold パートナーのみ販売可能
 * - Tier 2（INMV/INIG）: Silver 以上で販売可能
 * - Tier 3（INSS/IOSH/IOSD/INPY）: 全パートナーが販売可能
 */
export const RESELLER_PRODUCT_TERMS: Record<ProductCode, ResellerProductTerms> = {

  // =========================================================================
  // Tier 1: 業務変革ツール — Gold パートナーのみ
  // =========================================================================

  INCA: {
    productCode: 'INCA',
    resellerEnabled: true,
    minimumTier: 'gold',
    pricingFlexibility: 'floor_price',
    minimumSellingPriceRatio: 0.85,
    demoLicenses: 2,
    nfrLicenses: 1,
    notes: 'RPA移行アセスメントツール。Goldパートナーのみ。コンサル案件と連動した提案が前提。',
  },
  INBT: {
    productCode: 'INBT',
    resellerEnabled: true,
    minimumTier: 'gold',
    pricingFlexibility: 'floor_price',
    minimumSellingPriceRatio: 0.85,
    demoLicenses: 2,
    nfrLicenses: 1,
    notes: '業務自動化RPAツール。Goldパートナーのみ。自動化コンサルとセットでの提案が前提。',
  },
  IVIN: {
    productCode: 'IVIN',
    resellerEnabled: true,
    minimumTier: 'gold',
    pricingFlexibility: 'fixed',
    minimumSellingPriceRatio: 1.0,
    demoLicenses: 1,
    nfrLicenses: 1,
    notes: '面接分析・採用支援ツール。Goldパートナーのみ。全プラン個別見積もり。',
  },

  // =========================================================================
  // Tier 2: AI活用ツール — Silver 以上
  // =========================================================================

  INMV: {
    productCode: 'INMV',
    resellerEnabled: true,
    minimumTier: 'silver',
    pricingFlexibility: 'floor_price',
    minimumSellingPriceRatio: 0.80,
    demoLicenses: 3,
    nfrLicenses: 1,
    notes: 'AI動画作成ツール。Silver以上のパートナーが販売可能。研修・マニュアル動画案件に有効。',
  },
  INIG: {
    productCode: 'INIG',
    resellerEnabled: true,
    minimumTier: 'silver',
    pricingFlexibility: 'floor_price',
    minimumSellingPriceRatio: 0.80,
    demoLicenses: 3,
    nfrLicenses: 1,
    notes: 'AI画像・音声生成ツール。Silver以上のパートナーが販売可能。',
  },

  // =========================================================================
  // Tier 3: InsightOffice Suite — 全パートナーが販売可能
  // =========================================================================

  INSS: {
    productCode: 'INSS',
    resellerEnabled: true,
    minimumTier: 'registered',
    pricingFlexibility: 'floor_price',
    minimumSellingPriceRatio: 0.80,
    demoLicenses: 5,
    nfrLicenses: 2,
    notes: 'PowerPointツール。全パートナーが販売可能。法人導入の主力製品。',
  },
  IOSH: {
    productCode: 'IOSH',
    resellerEnabled: true,
    minimumTier: 'registered',
    pricingFlexibility: 'floor_price',
    minimumSellingPriceRatio: 0.80,
    demoLicenses: 5,
    nfrLicenses: 2,
    notes: 'Excel管理ツール。全パートナーが販売可能。チーム導入案件はPROを推奨。',
  },
  IOSD: {
    productCode: 'IOSD',
    resellerEnabled: true,
    minimumTier: 'registered',
    pricingFlexibility: 'floor_price',
    minimumSellingPriceRatio: 0.80,
    demoLicenses: 5,
    nfrLicenses: 2,
    notes: 'Word文書管理ツール。全パートナーが販売可能。ドキュメント管理案件に有効。',
  },
  INPY: {
    productCode: 'INPY',
    resellerEnabled: true,
    minimumTier: 'registered',
    pricingFlexibility: 'floor_price',
    minimumSellingPriceRatio: 0.80,
    demoLicenses: 5,
    nfrLicenses: 2,
    notes: 'Python実行基盤。全パートナーが販売可能。業務自動化案件に有効。',
  },
};

// =============================================================================
// パートナー提案シナリオ
// =============================================================================

export interface MeetingProposal {
  name: string;
  proposedTier: PartnerTier;
  targetProducts: ProductCode[];
  initialPackage: string[];
  firstYearExpectation: string;
  escalationPath: string;
}

export const MEETING_PROPOSALS: MeetingProposal[] = [
  {
    name: 'スタンダード開始プラン',
    proposedTier: 'registered',
    targetProducts: ['INSS', 'IOSH', 'IOSD', 'INPY'],
    initialPackage: [
      'NFRライセンス各2本（パートナー社内利用）',
      'デモライセンス各5本（顧客デモ用）',
      '販売トレーニング（オンライン、2時間）',
      '販促資料一式（日本語）',
      'パートナーポータルアクセス',
      '仕入れ値引き: 20%',
    ],
    firstYearExpectation:
      '3〜5件の販売（¥150万〜¥500万の売上）。' +
      '製品理解を深め、顧客の反応を確認するフェーズ。',
    escalationPath:
      '5件達成でSilverに昇格 → 値引き30%・専任担当・Tier 2製品も販売可能に。',
  },
  {
    name: 'アグレッシブ開始プラン',
    proposedTier: 'silver',
    targetProducts: ['INSS', 'IOSH', 'IOSD', 'INPY', 'INMV', 'INIG'],
    initialPackage: [
      'NFRライセンス全Tier 2+3製品各1〜2本',
      'デモライセンス各3〜5本',
      '販売トレーニング（対面、半日）',
      '技術トレーニング（オンライン、4時間）',
      '販促資料一式 + 共同ブランド資料作成',
      '仕入れ値引き: 30%',
      '共同マーケティング予算: ¥500,000',
      '専任パートナーマネージャー',
    ],
    firstYearExpectation:
      '10〜15件の販売（¥500万〜¥1,500万の売上）。' +
      '初年度からSilverティアで本格的に法人営業。',
    escalationPath:
      '20件達成でGoldに昇格 → 値引き40%・全製品販売可能・地域独占権の協議開始。',
  },
];

// =============================================================================
// コミッション計算例（法人向け価格ベース）
// =============================================================================

export interface CommissionExample {
  productCode: ProductCode;
  plan: string;
  listPrice: number;
  tier: PartnerTier;
  discount: number;
  wholesalePrice: number;
  partnerProfit: number;
  scenario: string;
}

export const COMMISSION_EXAMPLES: CommissionExample[] = [
  {
    productCode: 'INSS',
    plan: 'STD',
    listPrice: 480_000,
    tier: 'registered',
    discount: 0.20,
    wholesalePrice: 384_000,
    partnerProfit: 96_000,
    scenario: '年間10件販売 → 粗利 ¥960,000',
  },
  {
    productCode: 'INSS',
    plan: 'PRO',
    listPrice: 980_000,
    tier: 'silver',
    discount: 0.30,
    wholesalePrice: 686_000,
    partnerProfit: 294_000,
    scenario: '年間10件販売 → 粗利 ¥2,940,000',
  },
  {
    productCode: 'INMV',
    plan: 'STD',
    listPrice: 980_000,
    tier: 'silver',
    discount: 0.30,
    wholesalePrice: 686_000,
    partnerProfit: 294_000,
    scenario: '年間5件販売 → 粗利 ¥1,470,000',
  },
  {
    productCode: 'INCA',
    plan: 'STD',
    listPrice: 1_980_000,
    tier: 'gold',
    discount: 0.40,
    wholesalePrice: 1_188_000,
    partnerProfit: 792_000,
    scenario: '年間5件販売 → 粗利 ¥3,960,000',
  },
];

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * パートナーティアの条件を取得
 */
export function getPartnerTier(tier: PartnerTier): PartnerTierDefinition {
  return PARTNER_TIERS[tier];
}

/**
 * 指定ティアで販売可能な製品一覧を取得
 */
export function getResellerProducts(tier?: PartnerTier): ProductCode[] {
  const tierPriority: Record<PartnerTier, number> = {
    registered: 0,
    silver: 1,
    gold: 2,
  };

  return (Object.keys(RESELLER_PRODUCT_TERMS) as ProductCode[]).filter(code => {
    const terms = RESELLER_PRODUCT_TERMS[code];
    if (!terms.resellerEnabled) return false;
    if (!tier) return true;
    return tierPriority[tier] >= tierPriority[terms.minimumTier];
  });
}

/**
 * 仕入れ価格を計算
 */
export function calculateWholesalePrice(
  listPrice: number,
  tier: PartnerTier,
): { wholesalePrice: number; partnerProfit: number; discount: number } {
  const discount = PARTNER_TIERS[tier].wholesaleDiscount;
  const wholesalePrice = Math.round(listPrice * (1 - discount));
  return {
    wholesalePrice,
    partnerProfit: listPrice - wholesalePrice,
    discount,
  };
}

/**
 * ティア昇格に必要な条件を取得
 */
export function getUpgradeRequirements(currentTier: PartnerTier): {
  nextTier: PartnerTier | null;
  minDeals: number;
  minRevenue: number;
} | null {
  if (currentTier === 'gold') return null;

  const nextTier: PartnerTier = currentTier === 'registered' ? 'silver' : 'gold';
  const tierDef = PARTNER_TIERS[nextTier];

  return {
    nextTier,
    minDeals: tierDef.minAnnualDeals,
    minRevenue: tierDef.minAnnualRevenue,
  };
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  PARTNER_TIERS,
  STANDARD_AGREEMENT_TERMS,
  RESELLER_PRODUCT_TERMS,
  MEETING_PROPOSALS,
  COMMISSION_EXAMPLES,
  getPartnerTier,
  getResellerProducts,
  calculateWholesalePrice,
  getUpgradeRequirements,
};
