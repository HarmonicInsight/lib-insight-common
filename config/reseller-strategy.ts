/**
 * HARMONIC insight リセラー・販売代理店パートナープログラム
 *
 * ============================================================================
 * 【パートナープログラムの設計方針】全製品＝法人向け（B2B Only）
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
 * │ Registered        Silver            Gold                     │
 * │ ──────────        ──────            ────                     │
 * │ 誰でも参加可      年間所定件数以上   上位実績                  │
 * │ 非独占            非独占            地域独占可               │
 * │ セルフサーブ      専任担当          専任担当+共同マーケ      │
 * └───────────────────────────────────────────────────────────────┘
 *
 * ## リセラー対象製品
 * 全製品がパートナー経由で販売可能。
 * ただし Tier 1（INCA/INBT/IVIN）は Gold パートナーのみ。
 *
 * ## 価格・コミッション
 * 仕入れ値引率・コミッション率はパートナーとの個別協議により決定。
 * 本ファイルにはティア構造と販売条件の枠組みのみ定義。
 */

import type { ProductCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** パートナーティア */
export type PartnerTier = 'registered' | 'silver' | 'gold';

/** パートナー種別 */
export type PartnerType =
  | 'reseller'        // リセラー（仕入れ・再販）
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
  /** 地域独占権の付与可否 */
  exclusivityAvailable: boolean;
  /** 専任パートナーマネージャー */
  dedicatedManager: boolean;
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
  /** 顧客の所有権 */
  customerOwnership: string;
  /** サポート責任分担 */
  supportResponsibility: string;
}

/** リセラー対象製品の条件 */
export interface ResellerProductTerms {
  productCode: ProductCode;
  /** リセラー販売可能か */
  resellerEnabled: boolean;
  /** 販売に必要な最低パートナーティア */
  minimumTier: PartnerTier;
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
   * - 参加障壁＝なし（申請→審査→承認）
   * - 想定: 中小IT企業、フリーランスコンサルタント
   * - InsightOffice Suite（Tier 3）+ ISOF のみ販売可能
   */
  registered: {
    tier: 'registered',
    name: 'Registered Partner',
    nameJa: '登録パートナー',
    exclusivityAvailable: false,
    dedicatedManager: false,
    leadSharing: false,
    portalAccess: true,
    trainingIncluded: true,
    demoEnvironment: true,
    description: '誰でも参加可能。Tier 3+4 製品（InsightOffice Suite / ISOF）のみ販売可能。',
  },

  /**
   * Silver パートナー
   * - 想定: 中堅IT企業、コンサルファーム
   * - InsightOffice Suite + Tier 2（INMV/INIG）が販売可能
   */
  silver: {
    tier: 'silver',
    name: 'Silver Partner',
    nameJa: 'シルバーパートナー',
    exclusivityAvailable: false,
    dedicatedManager: true,
    leadSharing: true,
    portalAccess: true,
    trainingIncluded: true,
    demoEnvironment: true,
    description: '実績に基づき昇格。Tier 2+3+4 製品が販売可能。専任担当・リード共有あり。',
  },

  /**
   * Gold パートナー
   * - 想定: 大手SIer、コンサルファーム
   * - 全製品（Tier 1含む）が販売可能、地域独占権あり
   */
  gold: {
    tier: 'gold',
    name: 'Gold Partner',
    nameJa: 'ゴールドパートナー',
    exclusivityAvailable: true,
    dedicatedManager: true,
    leadSharing: true,
    portalAccess: true,
    trainingIncluded: true,
    demoEnvironment: true,
    description: '上位実績で昇格。全製品販売可能。地域独占権の協議可。',
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
  customerOwnership:
    'エンドユーザーとのライセンス契約はHARMONIC insightが直接締結。' +
    'パートナーは販売代理店として紹介・導入支援を行う。' +
    '顧客リストはパートナーと共有し、更新時のコミッションを保証。',
  supportResponsibility:
    '1次サポート（操作方法・FAQ）: パートナーが対応（トレーニング提供）。' +
    '2次サポート（バグ・技術的問題）: HARMONIC insightが対応。' +
    'パートナーポータル経由でエスカレーション。',
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
 * - Tier 4（ISOF）: 全パートナーが販売可能
 */
export const RESELLER_PRODUCT_TERMS: Record<ProductCode, ResellerProductTerms> = {

  // =========================================================================
  // Tier 1: 業務変革ツール ＝Gold パートナーのみ
  // =========================================================================

  INCA: {
    productCode: 'INCA',
    resellerEnabled: true,
    minimumTier: 'gold',
    demoLicenses: 2,
    nfrLicenses: 1,
    notes: 'RPA移行アセスメントツール。Goldパートナーのみ。コンサル案件と連動した提案が前提。',
  },
  INBT: {
    productCode: 'INBT',
    resellerEnabled: true,
    minimumTier: 'gold',
    demoLicenses: 2,
    nfrLicenses: 1,
    notes: '業務自動化RPAツール。Goldパートナーのみ。自動化コンサルとセットでの提案が前提。',
  },
  IVIN: {
    productCode: 'IVIN',
    resellerEnabled: true,
    minimumTier: 'gold',
    demoLicenses: 1,
    nfrLicenses: 1,
    notes: '面接分析・採用支援ツール。Goldパートナーのみ。',
  },

  // =========================================================================
  // Tier 2: AI活用ツール ＝Silver 以上
  // =========================================================================

  INMV: {
    productCode: 'INMV',
    resellerEnabled: true,
    minimumTier: 'silver',
    demoLicenses: 3,
    nfrLicenses: 1,
    notes: 'AI動画作成ツール。Silver以上のパートナーが販売可能。研修・マニュアル動画案件に有効。',
  },
  INIG: {
    productCode: 'INIG',
    resellerEnabled: true,
    minimumTier: 'silver',
    demoLicenses: 3,
    nfrLicenses: 1,
    notes: 'AI画像・音声生成ツール。Silver以上のパートナーが販売可能。',
  },

  // =========================================================================
  // Tier 3: InsightOffice Suite ＝全パートナーが販売可能
  // =========================================================================

  INSS: {
    productCode: 'INSS',
    resellerEnabled: true,
    minimumTier: 'registered',
    demoLicenses: 5,
    nfrLicenses: 2,
    notes: 'PowerPointツール。全パートナーが販売可能。法人導入の主力製品。',
  },
  IOSH: {
    productCode: 'IOSH',
    resellerEnabled: true,
    minimumTier: 'registered',
    demoLicenses: 5,
    nfrLicenses: 2,
    notes: 'Excel管理ツール。全パートナーが販売可能。チーム導入案件はPROを推奨。',
  },
  IOSD: {
    productCode: 'IOSD',
    resellerEnabled: true,
    minimumTier: 'registered',
    demoLicenses: 5,
    nfrLicenses: 2,
    notes: 'Word文書管理ツール。全パートナーが販売可能。ドキュメント管理案件に有効。',
  },
  INPY: {
    productCode: 'INPY',
    resellerEnabled: true,
    minimumTier: 'registered',
    demoLicenses: 5,
    nfrLicenses: 2,
    notes: 'Python実行基盤。全パートナーが販売可能。業務自動化案件に有効。',
  },

  // =========================================================================
  // Tier 4: Insight Senior Office ＝全パートナーが販売可能
  // =========================================================================

  ISOF: {
    productCode: 'ISOF',
    resellerEnabled: true,
    minimumTier: 'registered',
    demoLicenses: 10,
    nfrLicenses: 3,
    notes: 'シニア向け統合オフィスツール。全パートナーが販売可能。自治体・福祉法人案件に有効。デモライセンス多め（導入説明会用）。',
  },
};

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
 * ティア昇格に必要な次のティアを取得
 */
export function getNextTier(currentTier: PartnerTier): PartnerTier | null {
  if (currentTier === 'gold') return null;
  return currentTier === 'registered' ? 'silver' : 'gold';
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  PARTNER_TIERS,
  STANDARD_AGREEMENT_TERMS,
  RESELLER_PRODUCT_TERMS,
  getPartnerTier,
  getResellerProducts,
  getNextTier,
};
