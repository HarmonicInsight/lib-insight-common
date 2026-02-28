/**
 * HARMONIC insight 製品ライセンス価格表
 *
 * ============================================================================
 * 【重要】全製品 法人向け B2B Only・1台/年ライセンス（Per Device / Per Year）
 * ============================================================================
 *
 * ## プラン体系（4ティア）
 *
 * | プラン | 価格 | 期間 | 制限 | AIモデル |
 * |--------|------|------|------|----------|
 * | FREE | ¥0 | 無期限 | Group A: 保存/エクスポート不可, Group B: 閲覧のみ | クライアント選択（BYOK） |
 * | TRIAL | ¥0 | 30日 | 全機能 | クライアント選択（BYOK） |
 * | BIZ | 下表参照 | 365日 | 全機能 | クライアント選択（BYOK） |
 * | ENT | 個別見積もり | 要相談 | 全機能 + API/SSO/監査 | クライアント選択（BYOK） |
 *
 * ## 製品グループ
 * - Group A（エンドユーザー向け）: FREE / TRIAL / BIZ / ENT
 * - Group B（コンサルツール）: FREE（閲覧のみ） / ENT のみ — BIZ 設定なし
 *
 * ## 価格設計方針
 * - BYOK（AI API キーはクライアント自社負担）のため限界費用は低い
 * - FREE で全機能体験可能 → BIZ の価値は「保存・エクスポートの解放」
 * - コンサル案件バンドル販売が主 → 単体価格は参考値
 * - ENT は個別見積もり（API/SSO/監査ログ付き）
 * - 消費税率: 10%
 */

import type { ProductCode, PlanCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

export interface ProductLicense {
  /** 製品コード */
  productCode: ProductCode;
  /** 製品名 */
  productName: string;
  /** 製品ティア */
  tier: 1 | 2 | 3 | 4;
  /** 製品グループ */
  group: 'group_a' | 'group_b';
  /** 利用可能プラン */
  availablePlans: PlanCode[];
  /** BIZ プラン年間価格（税抜・円）。null = BIZ プラン設定なし */
  bizPriceYearlyExTax: number | null;
  /** BIZ プラン年間価格（税込・円）。null = BIZ プラン設定なし */
  bizPriceYearlyInTax: number | null;
  /** ENT 価格の説明 */
  entPricing: string;
  /** ライセンス形態 */
  licenseModel: 'per_device' | 'per_organization';
  /** 備考 */
  note?: string;
}

// =============================================================================
// 消費税計算
// =============================================================================

const TAX_RATE = 0.10;

function withTax(priceExTax: number): number {
  return Math.ceil(priceExTax * (1 + TAX_RATE));
}

// =============================================================================
// Group A: エンドユーザー向けアプリ（BIZ 価格あり）
// =============================================================================

/**
 * Group A 製品ライセンス一覧
 *
 * ┌──────┬──────────────────────────────────┬────────────┬────────────┐
 * │ Tier │ 製品名                            │ BIZ (税抜)  │ BIZ (税込)  │
 * ├──────┼──────────────────────────────────┼────────────┼────────────┤
 * │  3   │ Insight Performance Management   │  ¥98,000   │ ¥107,800   │
 * │  3   │ Insight Deck Quality Gate        │ ¥148,000   │ ¥162,800   │
 * │  3   │ Insight AI Briefcase             │ ¥198,000   │ ¥217,800   │
 * │  3   │ InsightPy                        │  ¥78,000   │  ¥85,800   │
 * │  4   │ InsightSeniorOffice              │  ¥48,000   │  ¥52,800   │
 * │  2   │ InsightCast                      │ ¥128,000   │ ¥140,800   │
 * │  2   │ InsightImageGen                  │  ¥88,000   │  ¥96,800   │
 * └──────┴──────────────────────────────────┴────────────┴────────────┘
 *
 * 全製品: 1台/年ライセンス（Per Device / Per Year）
 * ENT: 個別見積もり（パートナーとの協議により決定）
 */

// =============================================================================
// Group B: コンサルティングツール（BIZ 設定なし・ENT のみ）
// =============================================================================

/**
 * Group B 製品ライセンス一覧
 *
 * ┌──────┬──────────────────────────────────┬──────────────────────┐
 * │ Tier │ 製品名                            │ 価格                  │
 * ├──────┼──────────────────────────────────┼──────────────────────┤
 * │  1   │ InsightBot                       │ ENT: 個別見積もり     │
 * │  1   │ InsightNoCodeAnalyzer            │ ENT: 個別見積もり     │
 * │  1   │ InterviewInsight                 │ ENT: 個別見積もり     │
 * └──────┴──────────────────────────────────┴──────────────────────┘
 *
 * Group B は FREE（閲覧モードのみ）と ENT（個別見積もり）の 2 プランのみ。
 * コンサルティング案件の一環として導入。BIZ プランは設定なし。
 */

// =============================================================================
// ライセンス定義
// =============================================================================

export const PRODUCT_LICENSES: ProductLicense[] = [
  // -------------------------------------------------------------------------
  // Tier 3: InsightOffice Suite
  // -------------------------------------------------------------------------
  {
    productCode: 'IOSH',
    productName: 'Insight Performance Management',
    tier: 3,
    group: 'group_a',
    availablePlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
    bizPriceYearlyExTax: 98_000,
    bizPriceYearlyInTax: withTax(98_000),
    entPricing: '個別見積もり',
    licenseModel: 'per_device',
    note: '旧 InsightOfficeSheet。AI搭載スプレッドシート。',
  },
  {
    productCode: 'INSS',
    productName: 'Insight Deck Quality Gate',
    tier: 3,
    group: 'group_a',
    availablePlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
    bizPriceYearlyExTax: 148_000,
    bizPriceYearlyInTax: withTax(148_000),
    entPricing: '個別見積もり',
    licenseModel: 'per_device',
    note: '旧 InsightOfficeSlide。AI搭載プレゼンテーション品質評価。',
  },
  {
    productCode: 'IOSD',
    productName: 'Insight AI Briefcase',
    tier: 3,
    group: 'group_a',
    availablePlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
    bizPriceYearlyExTax: 198_000,
    bizPriceYearlyInTax: withTax(198_000),
    entPricing: '個別見積もり',
    licenseModel: 'per_device',
    note: '旧 InsightOfficeDoc。AI搭載ドキュメント管理ブリーフケース。',
  },
  {
    productCode: 'INPY',
    productName: 'InsightPy',
    tier: 3,
    group: 'group_a',
    availablePlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
    bizPriceYearlyExTax: 78_000,
    bizPriceYearlyInTax: withTax(78_000),
    entPricing: '個別見積もり',
    licenseModel: 'per_device',
    note: 'AIコードエディター搭載 Python 実行基盤。スクリプト実行が主用途のため低価格帯。',
  },

  // -------------------------------------------------------------------------
  // Tier 4: InsightSeniorOffice
  // -------------------------------------------------------------------------
  {
    productCode: 'ISOF',
    productName: 'InsightSeniorOffice',
    tier: 4,
    group: 'group_a',
    availablePlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
    bizPriceYearlyExTax: 48_000,
    bizPriceYearlyInTax: withTax(48_000),
    entPricing: '個別見積もり',
    licenseModel: 'per_device',
    note: 'シニア向け社会貢献ツール。導入障壁を低くするため最低価格帯に設定。',
  },

  // -------------------------------------------------------------------------
  // Tier 2: AI活用ツール
  // -------------------------------------------------------------------------
  {
    productCode: 'INMV',
    productName: 'InsightCast',
    tier: 2,
    group: 'group_a',
    availablePlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
    bizPriceYearlyExTax: 128_000,
    bizPriceYearlyInTax: withTax(128_000),
    entPricing: '個別見積もり',
    licenseModel: 'per_device',
    note: '動画自動生成ツール。コンテンツ制作の自動化による高い投資対効果。',
  },
  {
    productCode: 'INIG',
    productName: 'InsightImageGen',
    tier: 2,
    group: 'group_a',
    availablePlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
    bizPriceYearlyExTax: 88_000,
    bizPriceYearlyInTax: withTax(88_000),
    entPricing: '個別見積もり',
    licenseModel: 'per_device',
    note: 'AI画像一括生成ツール。InsightCast の補助ツールとして位置付け、やや低めに設定。',
  },

  // -------------------------------------------------------------------------
  // Tier 1: コンサルティングツール（Group B — BIZ なし）
  // -------------------------------------------------------------------------
  {
    productCode: 'INBT',
    productName: 'InsightBot',
    tier: 1,
    group: 'group_b',
    availablePlans: ['FREE', 'ENT'],
    bizPriceYearlyExTax: null,
    bizPriceYearlyInTax: null,
    entPricing: '個別見積もり（コンサル案件連動）',
    licenseModel: 'per_device',
    note: 'RPA + Orchestrator。コンサル案件で導入。BIZ プラン設定なし。',
  },
  {
    productCode: 'INCA',
    productName: 'InsightNoCodeAnalyzer',
    tier: 1,
    group: 'group_b',
    availablePlans: ['FREE', 'ENT'],
    bizPriceYearlyExTax: null,
    bizPriceYearlyInTax: null,
    entPricing: '個別見積もり（コンサル案件連動）',
    licenseModel: 'per_device',
    note: 'RPA/ローコードマイグレーション自動化。コンサル案件で導入。BIZ プラン設定なし。',
  },
  {
    productCode: 'IVIN',
    productName: 'InterviewInsight',
    tier: 1,
    group: 'group_b',
    availablePlans: ['FREE', 'ENT'],
    bizPriceYearlyExTax: null,
    bizPriceYearlyInTax: null,
    entPricing: '個別見積もり（コンサル案件連動）',
    licenseModel: 'per_device',
    note: '自動ヒアリング・業務調査支援。コンサル案件で導入。BIZ プラン設定なし。',
  },
];

// =============================================================================
// ヘルパー関数
// =============================================================================

/** 製品コードからライセンス情報を取得 */
export function getProductLicense(code: ProductCode): ProductLicense | undefined {
  return PRODUCT_LICENSES.find((l) => l.productCode === code);
}

/** BIZ プラン価格を取得（税抜）。null = BIZ プラン設定なし */
export function getBizPrice(code: ProductCode): number | null {
  return getProductLicense(code)?.bizPriceYearlyExTax ?? null;
}

/** BIZ プラン価格を取得（税込）。null = BIZ プラン設定なし */
export function getBizPriceInTax(code: ProductCode): number | null {
  return getProductLicense(code)?.bizPriceYearlyInTax ?? null;
}

/** Group A 製品の BIZ ライセンス一覧を取得 */
export function getGroupALicenses(): ProductLicense[] {
  return PRODUCT_LICENSES.filter((l) => l.group === 'group_a');
}

/** Group B 製品の ENT ライセンス一覧を取得 */
export function getGroupBLicenses(): ProductLicense[] {
  return PRODUCT_LICENSES.filter((l) => l.group === 'group_b');
}

/** 価格をフォーマット（日本円表示） */
export function formatPrice(price: number | null, locale: 'ja' | 'en' = 'ja'): string {
  if (price === null) return locale === 'ja' ? '個別見積もり' : 'Custom quote';
  if (price === 0) return locale === 'ja' ? '無料' : 'Free';
  return locale === 'ja'
    ? `¥${price.toLocaleString('ja-JP')}/年`
    : `¥${price.toLocaleString('en-US')}/yr`;
}
