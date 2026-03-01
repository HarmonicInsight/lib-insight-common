/**
 * HARMONIC insight 統合ライセンス発行・管理サーバー設計
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * すべてのライセンス発行を一元管理し、
 * 「誰が・いつ・どの経路で・誰に」発行したかを追跡する。
 *
 * ## 発行チャネル
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │                     ライセンス発行チャネル                             │
 * │                                                                       │
 * │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐          │
 * │  │  ① 直販        │  │  ② パートナー  │  │  ③ システム    │          │
 * │  │  (Direct)      │  │  (Partner)     │  │  (System)      │          │
 * │  ├────────────────┤  ├────────────────┤  ├────────────────┤          │
 * │  │ Stripe決済     │  │ パートナー     │  │ メール認証後   │          │
 * │  │ 請求書払い     │  │ ポータルから   │  │ 仮キー自動発行 │          │
 * │  │               │  │ ライセンス     │  │ 更新時自動発行 │          │
 * │  │               │  │ 発行申請       │  │ バッチ処理     │          │
 * │  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘          │
 * │          │                    │                    │                   │
 * │          └────────────────────┼────────────────────┘                   │
 * │                               ▼                                       │
 * │                   ┌──────────────────────┐                            │
 * │                   │ 統合発行エンジン      │                            │
 * │                   │ (Issuance Engine)    │                            │
 * │                   │                      │                            │
 * │                   │ • キー生成           │                            │
 * │                   │ • DB登録             │                            │
 * │                   │ • 監査ログ記録       │                            │
 * │                   │ • メール送信         │                            │
 * │                   │ • Webhook通知        │                            │
 * │                   └──────────────────────┘                            │
 * │                               │                                       │
 * │              ┌────────────────┼────────────────┐                      │
 * │              ▼                ▼                ▼                      │
 * │     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
 * │     │ licenses     │ │ issuance_log │ │ partner_     │              │
 * │     │ テーブル     │ │ テーブル     │ │ commissions  │              │
 * │     └──────────────┘ └──────────────┘ └──────────────┘              │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * ## パートナー発行フロー（詳細）
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  パートナーポータル                                              │
 * │                                                                 │
 * │  1. パートナーがログイン                                        │
 * │  2. 「ライセンス発行」画面                                      │
 * │     ├── 顧客メールアドレス入力                                  │
 * │     ├── 製品選択                                                │
 * │     ├── プラン選択                                              │
 * │     └── 発行ボタン                                              │
 * │  3. システムが:                                                 │
 * │     ├── ライセンスキー生成                                      │
 * │     ├── licenses テーブルに登録（issued_by = partner_id）       │
 * │     ├── issuance_log に記録                                     │
 * │     ├── partner_commissions にコミッション計上                   │
 * │     └── 顧客にメール送信（キー + DLリンク）                    │
 * │  4. パートナーダッシュボードに反映                               │
 * │     ├── 発行済みライセンス一覧                                  │
 * │     ├── コミッション累計                                        │
 * │     └── 残りNFR/デモキー数                                      │
 * └─────────────────────────────────────────────────────────────────┘
 */

import type { ProductCode, PlanCode } from './products';
import type { LicenseKeyType } from './license-issuance';
import type { PartnerTier } from './reseller-strategy';

// =============================================================================
// 型定義: 発行チャネル・発行者
// =============================================================================

/** ライセンス発行チャネル（B2B: Stripe + 請求書 + パートナー） */
export type IssuanceChannel =
  | 'direct_stripe'     // 直販: Stripe経由
  | 'direct_invoice'    // 直販: 請求書払い
  | 'partner_reseller'  // パートナー: リセラー経由
  | 'partner_referral'  // パートナー: 紹介経由
  | 'system_trial'      // システム: 仮キー自動発行
  | 'system_renewal'    // システム: 自動更新
  | 'system_nfr'        // システム: NFRキー発行
  | 'system_demo'       // システム: デモキー発行
  | 'admin_manual';     // 管理者: 手動発行

/** 発行者の種別 */
export type IssuerType =
  | 'system'    // 自動（メール認証、Webhook、バッチ）
  | 'admin'     // HARMONIC insight管理者
  | 'partner';  // パートナー企業

/** 発行者情報 */
export interface Issuer {
  /** 発行者種別 */
  type: IssuerType;
  /** 発行者ID（system の場合は 'system'） */
  id: string;
  /** パートナーID（パートナー発行の場合） */
  partnerId?: string;
  /** パートナーティア（パートナー発行の場合） */
  partnerTier?: PartnerTier;
  /** 管理者メール（管理者発行の場合） */
  adminEmail?: string;
}

// =============================================================================
// 型定義: 発行リクエスト・レスポンス
// =============================================================================

/** ライセンス発行リクエスト */
export interface IssueLicenseRequest {
  /** 発行先: ユーザーのメールアドレス */
  customerEmail: string;
  /** 発行先: ユーザー名 */
  customerName: string;
  /** 発行先: 会社名（任意） */
  customerCompany?: string;
  /** 製品コード */
  productCode: ProductCode;
  /** プラン */
  plan: PlanCode;
  /** キー種別 */
  keyType: LicenseKeyType;
  /** 発行チャネル */
  channel: IssuanceChannel;
  /** 発行者情報 */
  issuer: Issuer;
  /** 決済ID（決済経由の場合） */
  paymentId?: string;
  /** 決済金額（JPY） */
  paymentAmount?: number;
  /** 決済通貨 */
  paymentCurrency?: 'JPY' | 'USD' | 'EUR';
  /** メール送信するか */
  sendEmail: boolean;
  /** ロケール */
  locale: 'ja' | 'en';
  /** 備考 */
  notes?: string;
}

/** ライセンス発行レスポンス */
export interface IssueLicenseResponse {
  success: boolean;
  /** 発行されたライセンスキー */
  licenseKey?: string;
  /** ライセンスID（DB上のID） */
  licenseId?: string;
  /** 発行ログID */
  issuanceLogId?: string;
  /** 有効期限 */
  expiresAt?: Date;
  /** エラー */
  error?: string;
}

// =============================================================================
// 型定義: 発行ログ（監査証跡）
// =============================================================================

/** 発行ログ — 全発行を記録する監査テーブル */
export interface IssuanceLog {
  id: string;
  /** ライセンスID（licenses テーブルの外部キー） */
  licenseId: string;
  /** ライセンスキー */
  licenseKey: string;
  /** 製品コード */
  productCode: ProductCode;
  /** プラン */
  plan: PlanCode;
  /** キー種別 */
  keyType: LicenseKeyType;
  /** 発行チャネル */
  channel: IssuanceChannel;

  // --- 発行者情報 ---
  /** 発行者種別 */
  issuerType: IssuerType;
  /** 発行者ID */
  issuerId: string;
  /** パートナーID */
  partnerId: string | null;
  /** パートナーティア（発行時点） */
  partnerTier: PartnerTier | null;

  // --- 顧客情報 ---
  /** 顧客メール */
  customerEmail: string;
  /** 顧客名 */
  customerName: string;
  /** 顧客会社名 */
  customerCompany: string | null;

  // --- 決済情報 ---
  /** 決済ID */
  paymentId: string | null;
  /** 決済金額 */
  paymentAmount: number | null;
  /** 決済通貨 */
  paymentCurrency: string | null;

  // --- メタデータ ---
  /** 有効期限 */
  expiresAt: Date;
  /** メール送信済みか */
  emailSent: boolean;
  /** 備考 */
  notes: string | null;
  /** 発行日時 */
  issuedAt: Date;
}

// =============================================================================
// 型定義: パートナー管理
// =============================================================================

/** パートナー企業 */
export interface Partner {
  id: string;
  /** 会社名 */
  companyName: string;
  /** 担当者名 */
  contactName: string;
  /** 担当者メール */
  contactEmail: string;
  /** パートナーティア */
  tier: PartnerTier;
  /** パートナー種別 */
  type: 'reseller' | 'referral' | 'var';
  /** 有効か */
  isActive: boolean;
  /** 契約開始日 */
  contractStartDate: Date;
  /** 契約終了日 */
  contractEndDate: Date;
  /** 対象地域 */
  regions: string[];
  /** 取扱製品 */
  authorizedProducts: ProductCode[];
  /** NFR残数（製品ごと） */
  nfrRemaining: Partial<Record<ProductCode, number>>;
  /** デモキー残数（製品ごと） */
  demoRemaining: Partial<Record<ProductCode, number>>;
  /** APIキー（パートナーポータル認証） */
  apiKeyHash: string;
  /** 作成日 */
  createdAt: Date;
  /** 更新日 */
  updatedAt: Date;
}

/** パートナーコミッション記録 */
export interface PartnerCommission {
  id: string;
  /** パートナーID */
  partnerId: string;
  /** 発行ログID */
  issuanceLogId: string;
  /** ライセンスID */
  licenseId: string;
  /** コミッション種別 */
  commissionType: 'first_year' | 'renewal' | 'referral';
  /** 定価（JPY） */
  listPrice: number;
  /** 卸値（JPY） */
  wholesalePrice: number;
  /** パートナー利益（JPY） */
  partnerProfit: number;
  /** 値引率 */
  discountRate: number;
  /** ステータス */
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  /** 対象期間開始 */
  periodStart: Date;
  /** 対象期間終了 */
  periodEnd: Date;
  /** 支払日 */
  paidAt: Date | null;
  /** 作成日 */
  createdAt: Date;
}

// =============================================================================
// 型定義: パートナーポータル
// =============================================================================

/** パートナーダッシュボード表示情報 */
export interface PartnerDashboard {
  /** パートナー情報 */
  partner: Partner;
  /** 発行済みライセンス数（今月） */
  issuedThisMonth: number;
  /** 発行済みライセンス数（累計） */
  issuedTotal: number;
  /** コミッション合計（今月） */
  commissionThisMonth: number;
  /** コミッション合計（累計） */
  commissionTotal: number;
  /** 未払いコミッション */
  commissionPending: number;
  /** ティア昇格までの残り件数 */
  dealsToNextTier: number | null;
  /** NFR/デモキー残数 */
  keyQuotas: {
    productCode: ProductCode;
    productName: string;
    nfrRemaining: number;
    nfrTotal: number;
    demoRemaining: number;
    demoTotal: number;
  }[];
  /** 最近の発行履歴 */
  recentIssuances: IssuanceLog[];
}

/** パートナーからの発行申請 */
export interface PartnerIssuanceRequest {
  /** パートナーID（APIキーから自動判定） */
  partnerId: string;
  /** 顧客メール */
  customerEmail: string;
  /** 顧客名 */
  customerName: string;
  /** 顧客会社名 */
  customerCompany?: string;
  /** 製品コード */
  productCode: ProductCode;
  /** プラン */
  plan: PlanCode;
  /** キー種別（production / nfr / demo） */
  keyType: 'production' | 'nfr' | 'demo';
  /** ロケール */
  locale: 'ja' | 'en';
}

// =============================================================================
// API エンドポイント定義
// =============================================================================

/**
 * 統合ライセンスサーバー APIエンドポイント
 *
 * Railway + Hono/Express でホスト
 * ベースURL: https://license.harmonicinsight.com
 */
export const LICENSE_SERVER_ENDPOINTS = {

  // --- 発行系 ---

  /** ライセンス発行（統合エンドポイント） */
  issue: {
    method: 'POST' as const,
    path: '/api/v1/licenses/issue',
    auth: 'admin_or_partner',
    description: '新規ライセンスを発行。全チャネル共通。',
  },

  /** Stripe Webhook（決済完了通知） */
  webhookStripe: {
    method: 'POST' as const,
    path: '/api/v1/webhooks/stripe',
    auth: 'webhook_signature',
    description: 'Stripe決済完了時に自動でライセンス発行。',
  },

  // --- 検証系 ---

  /** ライセンスキー検証 */
  validate: {
    method: 'POST' as const,
    path: '/api/v1/licenses/validate',
    auth: 'api_key',
    description: 'ライセンスキーの有効性を検証。アプリ起動時に呼ぶ。',
  },

  /** ライセンスアクティベート */
  activate: {
    method: 'POST' as const,
    path: '/api/v1/licenses/activate',
    auth: 'firebase_token',
    description: 'ユーザーがアプリ内でキーを入力して有効化。',
  },

  /** 機能利用可否チェック */
  checkEntitlement: {
    method: 'POST' as const,
    path: '/api/v1/entitlement/check',
    auth: 'firebase_token',
    description: '機能アクセス権の判定。既存APIと互換。',
  },

  // --- パートナーポータル ---

  /** パートナーダッシュボード */
  partnerDashboard: {
    method: 'GET' as const,
    path: '/api/v1/partner/dashboard',
    auth: 'partner_api_key',
    description: 'パートナーのダッシュボード情報を取得。',
  },

  /** パートナーからのライセンス発行 */
  partnerIssue: {
    method: 'POST' as const,
    path: '/api/v1/partner/issue',
    auth: 'partner_api_key',
    description: 'パートナーが顧客向けにライセンスを発行。',
  },

  /** パートナーの発行履歴 */
  partnerHistory: {
    method: 'GET' as const,
    path: '/api/v1/partner/issuances',
    auth: 'partner_api_key',
    description: 'パートナーが発行したライセンスの一覧。',
  },

  /** パートナーのコミッション一覧 */
  partnerCommissions: {
    method: 'GET' as const,
    path: '/api/v1/partner/commissions',
    auth: 'partner_api_key',
    description: 'コミッション実績と支払いステータス。',
  },

  /** パートナーのNFR/デモキー発行 */
  partnerIssueNfr: {
    method: 'POST' as const,
    path: '/api/v1/partner/issue-nfr',
    auth: 'partner_api_key',
    description: 'NFRまたはデモキーを発行（残数管理付き）。',
  },

  // --- 管理系 ---

  /** ライセンス一覧（管理画面用） */
  adminList: {
    method: 'GET' as const,
    path: '/api/v1/admin/licenses',
    auth: 'admin',
    description: '全ライセンスの一覧・検索・フィルタ。',
  },

  /** 発行ログ一覧（監査用） */
  adminIssuanceLogs: {
    method: 'GET' as const,
    path: '/api/v1/admin/issuance-logs',
    auth: 'admin',
    description: '全発行履歴の監査ログ。',
  },

  /** ライセンス無効化 */
  adminRevoke: {
    method: 'POST' as const,
    path: '/api/v1/admin/licenses/revoke',
    auth: 'admin',
    description: 'ライセンスを無効化。理由を記録。',
  },

  /** パートナー管理 */
  adminPartners: {
    method: 'GET' as const,
    path: '/api/v1/admin/partners',
    auth: 'admin',
    description: 'パートナー一覧・ティア管理。',
  },

  /** パートナー登録 */
  adminCreatePartner: {
    method: 'POST' as const,
    path: '/api/v1/admin/partners',
    auth: 'admin',
    description: '新規パートナーを登録。',
  },

  // --- バッチ処理 ---

  /** 期限切れチェック（日次バッチ） */
  batchExpiry: {
    method: 'POST' as const,
    path: '/api/v1/batch/check-expiry',
    auth: 'cron_secret',
    description: '期限切れ30日前リマインダー + 期限切れ通知の送信。',
  },

  /** 自動更新処理（日次バッチ） */
  batchRenewal: {
    method: 'POST' as const,
    path: '/api/v1/batch/process-renewals',
    auth: 'cron_secret',
    description: 'Stripeの自動更新を処理。',
  },

  // --- サポートトリアージ（Anthropic Customer Support Plugin 参考） ---

  /** サポートチケット作成 */
  supportCreate: {
    method: 'POST' as const,
    path: '/api/v1/support/tickets',
    auth: 'firebase_token',
    description: 'サポートチケットを作成。AI が自動分類・優先度判定・ルーティングを実施。',
  },

  /** サポートチケット一覧 */
  supportList: {
    method: 'GET' as const,
    path: '/api/v1/support/tickets',
    auth: 'firebase_token',
    description: 'ユーザーまたは管理者のサポートチケット一覧。',
  },

  /** サポートチケット詳細 */
  supportDetail: {
    method: 'GET' as const,
    path: '/api/v1/support/tickets/:ticketId',
    auth: 'firebase_token',
    description: 'チケットの詳細・対応履歴。',
  },

  /** サポートチケット AI 自動分類 */
  supportAutoClassify: {
    method: 'POST' as const,
    path: '/api/v1/support/classify',
    auth: 'api_key',
    description: 'メッセージ内容を AI で自動分類（カテゴリ・優先度・ルーティング先を返却）。',
  },

  /** パートナー向けサポートガイドライン取得 */
  supportPartnerGuidelines: {
    method: 'GET' as const,
    path: '/api/v1/support/partner-guidelines',
    auth: 'partner_api_key',
    description: 'パートナー向け 1 次サポートガイドライン（カテゴリ分類・応答テンプレート）。',
  },

  /** サポート統計（管理画面用） */
  supportAdminStats: {
    method: 'GET' as const,
    path: '/api/v1/admin/support/stats',
    auth: 'admin',
    description: 'サポートチケットの統計（カテゴリ別件数・平均応答時間・SLA 達成率）。',
  },

  // --- リモートコンフィグ & 自動更新（remote-config.ts 参照） ---

  /** 統合リモートコンフィグ取得（起動時に1回呼ぶ） */
  remoteConfigGet: {
    method: 'POST' as const,
    path: '/api/v1/remote-config/config',
    auth: 'license_key',
    description: 'バージョンチェック + API キー + モデルレジストリ + フィーチャーフラグを一括取得。ETag 対応。',
  },

  /** バージョンチェック */
  remoteConfigVersionCheck: {
    method: 'GET' as const,
    path: '/api/v1/remote-config/versions/:productCode',
    auth: 'api_key',
    description: '製品の最新バージョン・更新情報を取得。',
  },

  /** API キー取得（暗号化配信） */
  remoteConfigApiKeys: {
    method: 'POST' as const,
    path: '/api/v1/remote-config/api-keys',
    auth: 'license_key',
    description: 'Claude / Syncfusion 等の API キーを暗号化して配信。ライセンスキー + デバイスID で認証。',
  },

  /** モデルレジストリ取得 */
  remoteConfigModels: {
    method: 'GET' as const,
    path: '/api/v1/remote-config/models',
    auth: 'api_key',
    description: '最新の AI モデルレジストリを取得。新モデル追加をアプリ再ビルドなしで反映。ETag 対応。',
  },

  /** フィーチャーフラグ取得 */
  remoteConfigFeatures: {
    method: 'GET' as const,
    path: '/api/v1/remote-config/features/:productCode',
    auth: 'api_key',
    description: '製品のフィーチャーフラグを取得。段階的ロールアウト対応。ETag 対応。',
  },

  /** リモートコンフィグ値の更新（管理画面用） */
  adminRemoteConfigUpdate: {
    method: 'PUT' as const,
    path: '/api/v1/admin/remote-config',
    auth: 'admin',
    description: 'リモートコンフィグ値を更新。変更ログ自動記録。',
  },

  /** API キーローテーション（管理画面用） */
  adminRotateApiKey: {
    method: 'POST' as const,
    path: '/api/v1/admin/remote-config/rotate-key',
    auth: 'admin',
    description: 'API キーをローテーション。旧キーは猶予期間（7日）後に無効化。',
  },

  /** リリース情報の登録（管理画面用） */
  adminPublishRelease: {
    method: 'POST' as const,
    path: '/api/v1/admin/remote-config/releases',
    auth: 'admin',
    description: '新しいリリースを登録。自動更新マニフェストも更新。',
  },

  /** フィーチャーフラグの更新（管理画面用） */
  adminUpdateFeatureFlag: {
    method: 'PUT' as const,
    path: '/api/v1/admin/remote-config/features/:flagKey',
    auth: 'admin',
    description: 'フィーチャーフラグを更新。ロールアウト率の変更等。',
  },

  /** リモートコンフィグの変更ログ（監査用） */
  adminRemoteConfigLog: {
    method: 'GET' as const,
    path: '/api/v1/admin/remote-config/log',
    auth: 'admin',
    description: 'リモートコンフィグの全変更履歴（API キーローテーション含む）。監査用。',
  },
} as const;

// =============================================================================
// 発行ルール・バリデーション
// =============================================================================

/** チャネル別の発行ルール */
export interface ChannelIssuanceRule {
  channel: IssuanceChannel;
  /** 発行可能なキー種別 */
  allowedKeyTypes: LicenseKeyType[];
  /** 発行可能なプラン */
  allowedPlans: PlanCode[];
  /** 要決済情報 */
  requiresPayment: boolean;
  /** 要パートナーID */
  requiresPartner: boolean;
  /** 自動承認か（false = 管理者承認待ち） */
  autoApprove: boolean;
  /** メール送信必須か */
  requiresEmail: boolean;
  /** 説明 */
  description: string;
}

export const CHANNEL_ISSUANCE_RULES: Record<IssuanceChannel, ChannelIssuanceRule> = {
  direct_stripe: {
    channel: 'direct_stripe',
    allowedKeyTypes: ['production'],
    allowedPlans: ['BIZ', 'ENT'],
    requiresPayment: true,
    requiresPartner: false,
    autoApprove: true,
    requiresEmail: true,
    description: 'Stripe Webhook経由。決済完了で自動発行。',
  },
  direct_invoice: {
    channel: 'direct_invoice',
    allowedKeyTypes: ['production'],
    allowedPlans: ['BIZ', 'ENT'],
    requiresPayment: false, // 後払い
    requiresPartner: false,
    autoApprove: false, // 管理者承認
    requiresEmail: true,
    description: '請求書払い。管理者が入金確認後に承認。',
  },
  partner_reseller: {
    channel: 'partner_reseller',
    allowedKeyTypes: ['production'],
    allowedPlans: ['BIZ', 'ENT'],
    requiresPayment: false, // パートナーとの精算は別
    requiresPartner: true,
    autoApprove: true,
    requiresEmail: true,
    description: 'リセラーパートナーが顧客向けに発行。コミッション自動計上。',
  },
  partner_referral: {
    channel: 'partner_referral',
    allowedKeyTypes: ['provisional'],
    allowedPlans: ['TRIAL'],
    requiresPayment: false,
    requiresPartner: true,
    autoApprove: true,
    requiresEmail: true,
    description: '紹介パートナーがリード紹介。仮キーを発行して顧客に試用させる。',
  },
  system_trial: {
    channel: 'system_trial',
    allowedKeyTypes: ['provisional'],
    allowedPlans: ['TRIAL'],
    requiresPayment: false,
    requiresPartner: false,
    autoApprove: true,
    requiresEmail: true,
    description: 'メール認証完了後に自動で7日間仮キーを発行。',
  },
  system_renewal: {
    channel: 'system_renewal',
    allowedKeyTypes: ['production'],
    allowedPlans: ['BIZ', 'ENT'],
    requiresPayment: true,
    requiresPartner: false,
    autoApprove: true,
    requiresEmail: true,
    description: 'サブスクリプション自動更新。新キーを発行してメール送信。',
  },
  system_nfr: {
    channel: 'system_nfr',
    allowedKeyTypes: ['nfr'],
    allowedPlans: ['BIZ'], // NFRはBIZ相当（全機能利用可能）
    requiresPayment: false,
    requiresPartner: true,
    autoApprove: true,
    requiresEmail: true,
    description: 'パートナー社内評価用NFRキー。残数管理あり。',
  },
  system_demo: {
    channel: 'system_demo',
    allowedKeyTypes: ['demo'],
    allowedPlans: ['TRIAL'], // デモはTRIAL相当
    requiresPayment: false,
    requiresPartner: true,
    autoApprove: true,
    requiresEmail: true,
    description: 'パートナーが顧客デモに使用するキー。残数管理あり。',
  },
  admin_manual: {
    channel: 'admin_manual',
    allowedKeyTypes: ['production', 'provisional', 'nfr', 'demo'],
    allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
    requiresPayment: false,
    requiresPartner: false,
    autoApprove: true,
    requiresEmail: true,
    description: '管理者が手動で発行。特殊ケース用。理由の記録が必須。',
  },
};

// =============================================================================
// Railway デプロイ設定
// =============================================================================

/**
 * Railway サービス構成
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  Railway Project: harmonic-license-server                    │
 * │                                                              │
 * │  ┌──────────────────────────┐  ┌──────────────────────────┐ │
 * │  │  Service: api            │  │  Service: cron           │ │
 * │  │  Runtime: Node.js 20    │  │  Runtime: Node.js 20    │ │
 * │  │  Framework: Hono        │  │  Cron: daily at 09:00   │ │
 * │  │  Port: 3000             │  │                          │ │
 * │  │                          │  │  Jobs:                   │ │
 * │  │  Endpoints:              │  │  - check-expiry         │ │
 * │  │  - /api/v1/licenses/*   │  │  - process-renewals     │ │
 * │  │  - /api/v1/partner/*    │  │  - partner-reports      │ │
 * │  │  - /api/v1/admin/*      │  │                          │ │
 * │  │  - /api/v1/webhooks/*   │  │                          │ │
 * │  └──────────────────────────┘  └──────────────────────────┘ │
 * │                                                              │
 * │  External Services:                                          │
 * │  - Supabase (PostgreSQL)                                    │
 * │  - Firebase Auth                                             │
 * │  - Resend (Email)                                           │
 * │  - Stripe (Payments)                                        │
 * └──────────────────────────────────────────────────────────────┘
 */
export const RAILWAY_CONFIG = {
  projectName: 'harmonic-license-server',
  services: {
    api: {
      name: 'api',
      runtime: 'node',
      nodeVersion: '20',
      framework: 'hono',
      port: 3000,
      startCommand: 'npm run start',
      buildCommand: 'npm run build',
      healthcheck: '/health',
      envVars: [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_SERVICE_ACCOUNT_JSON',
        'STRIPE_WEBHOOK_SECRET',
        'RESEND_API_KEY',
        'PARTNER_API_SIGNING_KEY',
        'ADMIN_API_KEY',
        'CRON_SECRET',
        'NODE_ENV',
      ],
      customDomain: 'license.harmonicinsight.com',
    },
    cron: {
      name: 'cron',
      runtime: 'node',
      nodeVersion: '20',
      startCommand: 'npm run cron',
      schedule: '0 9 * * *', // 毎日 09:00 JST
      jobs: [
        'check-expiry',           // 期限切れリマインダー
        'process-renewals',       // 自動更新処理
        'partner-reports',        // パートナー月次レポート
        'check-api-key-expiry',   // API キー有効期限チェック
        'cleanup-expired-flags',  // 期限切れフィーチャーフラグ無効化
      ],
    },
  },
  /** 推奨リージョン */
  region: 'us-west1',
  /** 推奨プラン */
  plan: 'pro', // $20/mo — 十分な性能
};

// =============================================================================
// メール配信設定（Resend）
// =============================================================================

/**
 * メール配信: Resend を使用
 *
 * 選定理由:
 * - 開発者フレンドリーなAPI
 * - React Emailでテンプレート管理
 * - 月3,000通無料
 * - カスタムドメイン対応
 */
export const EMAIL_CONFIG = {
  provider: 'resend',
  fromAddress: 'license@harmonicinsight.com',
  fromName: 'HARMONIC insight',
  replyTo: 'support@harmonicinsight.com',
  /** テンプレートで使用する変数 */
  templateVars: [
    'customerName',
    'productName',
    'planName',
    'licenseKey',
    'expiresAt',
    'downloadUrl',
    'documentationUrl',
    'activationGuideUrl',
    'partnerName',       // パートナー経由の場合
    'renewalUrl',
    'supportUrl',
  ],
};

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 発行チャネルのルールを取得
 */
export function getChannelRule(channel: IssuanceChannel): ChannelIssuanceRule {
  return CHANNEL_ISSUANCE_RULES[channel];
}

/**
 * 発行リクエストのバリデーション
 */
export function validateIssuanceRequest(
  req: IssueLicenseRequest,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const rule = CHANNEL_ISSUANCE_RULES[req.channel];

  if (!rule) {
    errors.push(`不明な発行チャネル: ${req.channel}`);
    return { valid: false, errors };
  }

  // キー種別チェック
  if (!rule.allowedKeyTypes.includes(req.keyType)) {
    errors.push(
      `チャネル ${req.channel} ではキー種別 ${req.keyType} は発行できません。` +
      `許可: ${rule.allowedKeyTypes.join(', ')}`,
    );
  }

  // プランチェック
  if (!rule.allowedPlans.includes(req.plan)) {
    errors.push(
      `チャネル ${req.channel} ではプラン ${req.plan} は発行できません。` +
      `許可: ${rule.allowedPlans.join(', ')}`,
    );
  }

  // 決済情報チェック
  if (rule.requiresPayment && !req.paymentId) {
    errors.push(`チャネル ${req.channel} では決済情報が必要です。`);
  }

  // パートナーIDチェック
  if (rule.requiresPartner && !req.issuer.partnerId) {
    errors.push(`チャネル ${req.channel} ではパートナーIDが必要です。`);
  }

  // 管理者手動発行の場合は理由必須
  if (req.channel === 'admin_manual' && !req.notes) {
    errors.push('管理者手動発行の場合は備考（理由）の記載が必須です。');
  }

  // 顧客情報
  if (!req.customerEmail) {
    errors.push('顧客メールアドレスが必要です。');
  }
  if (!req.customerName) {
    errors.push('顧客名が必要です。');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * パートナーがNFR/デモキーを発行可能か判定
 */
export function canPartnerIssueSpecialKey(
  partner: Partner,
  productCode: ProductCode,
  keyType: 'nfr' | 'demo',
): { allowed: boolean; remaining: number; reason?: string } {
  if (!partner.isActive) {
    return { allowed: false, remaining: 0, reason: 'パートナーアカウントが無効です' };
  }

  if (!partner.authorizedProducts.includes(productCode)) {
    return { allowed: false, remaining: 0, reason: `製品 ${productCode} の取扱権限がありません` };
  }

  const remaining = keyType === 'nfr'
    ? (partner.nfrRemaining[productCode] ?? 0)
    : (partner.demoRemaining[productCode] ?? 0);

  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      reason: `${keyType === 'nfr' ? 'NFR' : 'デモ'}キーの残数がありません`,
    };
  }

  return { allowed: true, remaining };
}

/**
 * 発行チャネルが直販かパートナー経由かを判定
 */
export function isPartnerChannel(channel: IssuanceChannel): boolean {
  return channel.startsWith('partner_') || channel === 'system_nfr' || channel === 'system_demo';
}

/**
 * 発行チャネルの表示名を取得
 */
export function getChannelDisplayName(
  channel: IssuanceChannel,
  locale: 'ja' | 'en' = 'ja',
): string {
  const names: Record<IssuanceChannel, { ja: string; en: string }> = {
    direct_stripe: { ja: '直販（Stripe）', en: 'Direct (Stripe)' },
    direct_invoice: { ja: '直販（請求書）', en: 'Direct (Invoice)' },
    partner_reseller: { ja: 'パートナー経由', en: 'Partner (Reseller)' },
    partner_referral: { ja: 'パートナー紹介', en: 'Partner (Referral)' },
    system_trial: { ja: 'トライアル自動発行', en: 'System (Trial)' },
    system_renewal: { ja: '自動更新', en: 'System (Renewal)' },
    system_nfr: { ja: 'NFRキー発行', en: 'System (NFR)' },
    system_demo: { ja: 'デモキー発行', en: 'System (Demo)' },
    admin_manual: { ja: '管理者手動発行', en: 'Admin (Manual)' },
  };
  return names[channel][locale];
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  LICENSE_SERVER_ENDPOINTS,
  CHANNEL_ISSUANCE_RULES,
  RAILWAY_CONFIG,
  EMAIL_CONFIG,
  getChannelRule,
  validateIssuanceRequest,
  canPartnerIssueSpecialKey,
  isPartnerChannel,
  getChannelDisplayName,
};
