/**
 * Harmonic Insight リセラー・販売代理店パートナープログラム
 *
 * ============================================================================
 * 【パートナープログラムの設計方針】
 * ============================================================================
 *
 * ## 概要
 * グローバルスタンドアロン型製品（INSS/INSP/INPY/HMSH/HMDC/HMSL）を
 * 販売代理店（リセラー/VAR）経由で展開するためのパートナープログラム。
 *
 * ## なぜリセラーが必要か
 * - 自社だけでは到達できない地域・業界へのリーチ拡大
 * - 現地語でのサポート・導入支援の提供
 * - 営業コストを変動費化（売れた分だけコミッション）
 * - ベンチャー企業との連携で営業力を補完
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
  | 'var'             // VAR: Value Added Reseller（再販+導入支援）
  | 'white_label';    // ホワイトラベル（自社ブランドで販売）

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
   * - 想定: 小規模IT企業、フリーランス、副業エンジニア
   * - まずはここから始めて実績を積む
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
    description: '誰でも参加可能。20%の仕入れ値引き。パートナーポータル・デモ環境・トレーニング提供。',
  },

  /**
   * Silver パートナー
   * - 参加障壁: 年間5件以上 or 年間100万円以上の販売実績
   * - 想定: 中小IT企業、Office導入支援企業
   * - 専任担当がつき、リードも共有
   */
  silver: {
    tier: 'silver',
    name: 'Silver Partner',
    nameJa: 'シルバーパートナー',
    minAnnualDeals: 5,
    minAnnualRevenue: 1_000_000,
    wholesaleDiscount: 0.30,
    referralCommission: 0.20,
    firstYearCommission: 0.30,
    renewalCommission: 0.15,
    exclusivityAvailable: false,
    dedicatedManager: true,
    coMarketingBudget: 200_000,
    leadSharing: true,
    portalAccess: true,
    trainingIncluded: true,
    demoEnvironment: true,
    description: '年間5件以上の実績で昇格。30%仕入れ値引き。専任担当・リード共有・共同マーケ予算あり。',
  },

  /**
   * Gold パートナー
   * - 参加障壁: 年間20件以上 or 年間500万円以上の販売実績
   * - 想定: 中堅IT企業、Office専門VAR
   * - 地域独占権の付与可能、共同マーケティング予算大
   */
  gold: {
    tier: 'gold',
    name: 'Gold Partner',
    nameJa: 'ゴールドパートナー',
    minAnnualDeals: 20,
    minAnnualRevenue: 5_000_000,
    wholesaleDiscount: 0.40,
    referralCommission: 0.25,
    firstYearCommission: 0.40,
    renewalCommission: 0.20,
    exclusivityAvailable: true,
    dedicatedManager: true,
    coMarketingBudget: 1_000_000,
    leadSharing: true,
    portalAccess: true,
    trainingIncluded: true,
    demoEnvironment: true,
    description: '年間20件以上で昇格。40%仕入れ値引き。地域独占権・大型共同マーケ予算。',
  },
};

// =============================================================================
// 契約条件
// =============================================================================

/**
 * パートナー契約の標準条件
 *
 * 【ベンチャー社長とのミーティングで合意すべき主要ポイント】
 *
 * 1. コミッション構造（仕入れ値引き or レベニューシェア）
 * 2. 最低販売コミットメント（ノルマの有無）
 * 3. 独占権の範囲（地域・業種）
 * 4. サポート責任分担（1次/2次）
 * 5. 顧客データの所有権
 * 6. 契約期間と解約条件
 */
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
 * リセラーが販売可能な製品と条件
 *
 * 【方針】
 * - コンサル連動型（INCA/INBT等）: リセラー販売 不可（自社コンサルと一体）
 * - スタンドアロン型: リセラー販売 可能
 */
export const RESELLER_PRODUCT_TERMS: Record<ProductCode, ResellerProductTerms> = {
  // スタンドアロン型 — リセラー販売可能
  INSS: {
    productCode: 'INSS',
    resellerEnabled: true,
    pricingFlexibility: 'floor_price',
    minimumSellingPriceRatio: 0.80,
    demoLicenses: 5,
    nfrLicenses: 2,
    notes: 'グローバル展開の主力。リセラー最も注力すべき製品。',
  },
  INSP: {
    productCode: 'INSP',
    resellerEnabled: true,
    pricingFlexibility: 'floor_price',
    minimumSellingPriceRatio: 0.80,
    demoLicenses: 3,
    nfrLicenses: 2,
    notes: 'INSS上位版。法人向け提案に有効。',
  },
  INPY: {
    productCode: 'INPY',
    resellerEnabled: true,
    pricingFlexibility: 'floor_price',
    minimumSellingPriceRatio: 0.80,
    demoLicenses: 5,
    nfrLicenses: 2,
    notes: 'Python自動化。技術系リセラーに適する。',
  },
  HMSH: {
    productCode: 'HMSH',
    resellerEnabled: true,
    pricingFlexibility: 'floor_price',
    minimumSellingPriceRatio: 0.80,
    demoLicenses: 5,
    nfrLicenses: 2,
    notes: 'Excel業務ユーザー向け。チーム導入案件はPROを推奨。',
  },
  HMDC: {
    productCode: 'HMDC',
    resellerEnabled: true,
    pricingFlexibility: 'floor_price',
    minimumSellingPriceRatio: 0.80,
    demoLicenses: 5,
    nfrLicenses: 2,
    notes: 'Word自動化。ドキュメント管理案件に有効。',
  },
  HMSL: {
    productCode: 'HMSL',
    resellerEnabled: true,
    pricingFlexibility: 'floor_price',
    minimumSellingPriceRatio: 0.80,
    demoLicenses: 5,
    nfrLicenses: 2,
    notes: 'PowerPoint自動化。INSS/INSPとの組合せ提案も有効。',
  },

  // コンサル連動型 — リセラー販売不可
  INCA: {
    productCode: 'INCA',
    resellerEnabled: false,
    pricingFlexibility: 'fixed',
    minimumSellingPriceRatio: 1.0,
    demoLicenses: 0,
    nfrLicenses: 0,
    notes: 'コンサル案件と一体。リセラー販売不可。',
  },
  INBT: {
    productCode: 'INBT',
    resellerEnabled: false,
    pricingFlexibility: 'fixed',
    minimumSellingPriceRatio: 1.0,
    demoLicenses: 0,
    nfrLicenses: 0,
    notes: 'コンサル案件と一体。リセラー販売不可。',
  },
  FGIN: {
    productCode: 'FGIN',
    resellerEnabled: false,
    pricingFlexibility: 'fixed',
    minimumSellingPriceRatio: 1.0,
    demoLicenses: 0,
    nfrLicenses: 0,
    notes: 'コンサル案件と一体。リセラー販売不可。',
  },
  INMV: {
    productCode: 'INMV',
    resellerEnabled: false,
    pricingFlexibility: 'fixed',
    minimumSellingPriceRatio: 1.0,
    demoLicenses: 0,
    nfrLicenses: 0,
    notes: 'コンサル案件と一体。リセラー販売不可。',
  },
  INIG: {
    productCode: 'INIG',
    resellerEnabled: false,
    pricingFlexibility: 'fixed',
    minimumSellingPriceRatio: 1.0,
    demoLicenses: 0,
    nfrLicenses: 0,
    notes: 'コンサル案件と一体。リセラー販売不可。',
  },
};

// =============================================================================
// ベンチャー社長ミーティング向け — 提案シナリオ
// =============================================================================

/**
 * 初回ミーティングでの提案パッケージ
 *
 * 【想定シナリオ】
 * ベンチャー企業が自社の営業チャネルを使ってHarmonic Insight製品を
 * 再販したいケース。まずはRegistered or Silverで開始。
 *
 * 【提案のポイント】
 * 1. 初期投資ゼロ — 在庫リスクなし（ライセンスキー発行モデル）
 * 2. 初年度はノルマなし — まず売ってみて手応えを確認
 * 3. 20〜30%の仕入れ値引き — 十分な利益率を確保
 * 4. NFR + デモライセンス提供 — 自社で使って価値を体感してから販売
 * 5. トレーニング・販促素材の提供 — 営業をすぐ開始できる
 */
export interface MeetingProposal {
  /** シナリオ名 */
  name: string;
  /** 提案ティア */
  proposedTier: PartnerTier;
  /** 対象製品 */
  targetProducts: ProductCode[];
  /** 初期提供内容 */
  initialPackage: string[];
  /** 期待成果（初年度） */
  firstYearExpectation: string;
  /** エスカレーションパス（成功時の次ステップ） */
  escalationPath: string;
}

export const MEETING_PROPOSALS: MeetingProposal[] = [
  {
    name: 'スタンダード開始プラン',
    proposedTier: 'registered',
    targetProducts: ['INSS', 'HMSH', 'HMDC', 'HMSL'],
    initialPackage: [
      'NFRライセンス各2本（パートナー社内利用）',
      'デモライセンス各5本（顧客デモ用）',
      '販売トレーニング（オンライン、2時間）',
      '販促資料一式（日本語）',
      'パートナーポータルアクセス',
      '仕入れ値引き: 20%',
    ],
    firstYearExpectation:
      '3〜5件の販売（¥150,000〜¥500,000の売上）。' +
      '製品理解を深め、顧客の反応を確認するフェーズ。',
    escalationPath:
      '5件達成でSilverに昇格 → 値引き30%・専任担当・リード共有開始。',
  },
  {
    name: 'アグレッシブ開始プラン',
    proposedTier: 'silver',
    targetProducts: ['INSS', 'INSP', 'HMSH', 'HMDC', 'HMSL', 'INPY'],
    initialPackage: [
      'NFRライセンス全製品各2本',
      'デモライセンス全製品各5本',
      '販売トレーニング（対面、半日）',
      '技術トレーニング（オンライン、4時間）',
      '販促資料一式 + 共同ブランド資料作成',
      '仕入れ値引き: 30%（初年度特別）',
      '共同マーケティング予算: ¥200,000',
      '専任パートナーマネージャー',
    ],
    firstYearExpectation:
      '10〜15件の販売（¥500,000〜¥1,500,000の売上）。' +
      '初年度からSilverティアで本格的に営業。5件のコミットメント。',
    escalationPath:
      '20件達成でGoldに昇格 → 値引き40%・地域独占権の協議開始。',
  },
];

// =============================================================================
// コミッション計算例
// =============================================================================

/**
 * 仕入れ値引きモデルでのコミッション計算例
 *
 * 例: INSS STD（定価 ¥49,800/年）をSilverパートナーが販売
 *
 *   定価:               ¥49,800
 *   仕入れ値（30%引き）: ¥34,860
 *   パートナー利益:      ¥14,940 / 件
 *
 *   月10件販売の場合:     ¥149,400 / 月 の粗利
 *   年間120件:            ¥1,792,800 / 年 の粗利
 *
 * 例: HMSH PRO（定価 ¥118,000/年）をGoldパートナーが5名チームに販売
 *
 *   定価:               ¥118,000
 *   仕入れ値（40%引き）: ¥70,800
 *   パートナー利益:      ¥47,200 / 件
 *
 *   月5件販売の場合:      ¥236,000 / 月 の粗利
 *   年間60件:             ¥2,832,000 / 年 の粗利
 */

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
    listPrice: 49_800,
    tier: 'registered',
    discount: 0.20,
    wholesalePrice: 39_840,
    partnerProfit: 9_960,
    scenario: '年間10件販売 → 粗利 ¥99,600',
  },
  {
    productCode: 'INSS',
    plan: 'STD',
    listPrice: 49_800,
    tier: 'silver',
    discount: 0.30,
    wholesalePrice: 34_860,
    partnerProfit: 14_940,
    scenario: '年間30件販売 → 粗利 ¥448,200',
  },
  {
    productCode: 'HMSH',
    plan: 'PRO',
    listPrice: 118_000,
    tier: 'silver',
    discount: 0.30,
    wholesalePrice: 82_600,
    partnerProfit: 35_400,
    scenario: '年間20件販売 → 粗利 ¥708,000',
  },
  {
    productCode: 'HMSH',
    plan: 'PRO',
    listPrice: 118_000,
    tier: 'gold',
    discount: 0.40,
    wholesalePrice: 70_800,
    partnerProfit: 47_200,
    scenario: '年間60件販売 → 粗利 ¥2,832,000',
  },
  {
    productCode: 'INSP',
    plan: 'PRO',
    listPrice: 148_000,
    tier: 'gold',
    discount: 0.40,
    wholesalePrice: 88_800,
    partnerProfit: 59_200,
    scenario: '年間30件販売 → 粗利 ¥1,776,000',
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
 * リセラー販売可能な製品一覧を取得
 */
export function getResellerProducts(): ProductCode[] {
  return (Object.keys(RESELLER_PRODUCT_TERMS) as ProductCode[])
    .filter(code => RESELLER_PRODUCT_TERMS[code].resellerEnabled);
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
