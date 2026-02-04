/**
 * Harmonic Insight ライセンス API ハンドラー定義
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * ## ライセンスサーバー API の型定義とハンドラー仕様
 *
 * このファイルは実際の HTTP フレームワーク（Hono/Express）に依存しない
 * 純粋な型定義とビジネスロジック仕様を提供する。
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │                        API アーキテクチャ                             │
 * │                                                                      │
 * │  クライアントアプリ                                                    │
 * │  (WPF / React / etc.)                                                │
 * │        │                                                              │
 * │        ▼                                                              │
 * │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
 * │  │  Registration   │  │  License       │  │  AI Credits    │         │
 * │  │  API            │  │  Validation    │  │  API           │         │
 * │  │                 │  │  API           │  │                │         │
 * │  │  POST /register │  │  POST /validate│  │  GET /balance  │         │
 * │  │  POST /verify   │  │  POST /activate│  │  POST /consume │         │
 * │  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘         │
 * │           │                    │                    │                  │
 * │           └────────────────────┼────────────────────┘                  │
 * │                                ▼                                      │
 * │  ┌──────────────────────────────────────────────────────────────┐    │
 * │  │                   Supabase (PostgreSQL)                       │    │
 * │  │  registrations | licenses | ai_usage_logs | ai_addon_packs   │    │
 * │  │  stripe_customers | stripe_subscriptions | issuance_logs     │    │
 * │  └──────────────────────────────────────────────────────────────┘    │
 * │                                                                      │
 * │  ┌────────────────┐  ┌────────────────┐                             │
 * │  │  Stripe        │  │  Resend        │                             │
 * │  │  Webhooks      │  │  Email         │                             │
 * │  └────────────────┘  └────────────────┘                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ## 認証方式
 * - Firebase Token: クライアントアプリからのリクエスト
 * - API Key: サーバー間通信
 * - Partner API Key: パートナーポータルからのリクエスト
 * - Webhook Signature: Stripe/Paddle Webhook 検証
 * - Cron Secret: バッチ処理トリガー
 */

import type { ProductCode, PlanCode } from '../../config/products';
import type { LicenseKeyType, EmailTemplate, RegistrationStatus } from '../../config/license-issuance';
import type { IssuanceChannel, IssuerType, Issuer } from '../../config/license-server';
import type { AiFeatureType, CreditBalance, UsageCheckResult, PurchasedAddonPack } from '../../config/usage-based-licensing';
import type { StripeCheckoutMetadata, StripeWebhookHandlerResult } from '../../config/stripe-integration';

// =============================================================================
// 認証型定義
// =============================================================================

/** 認証方式 */
export type AuthMethod =
  | 'firebase_token'
  | 'api_key'
  | 'partner_api_key'
  | 'webhook_signature'
  | 'cron_secret'
  | 'admin';

/** 認証済みコンテキスト */
export interface AuthContext {
  /** 認証方式 */
  method: AuthMethod;
  /** ユーザー ID（Firebase Token の場合） */
  userId?: string;
  /** ユーザーメール（Firebase Token の場合） */
  userEmail?: string;
  /** パートナー ID（Partner API Key の場合） */
  partnerId?: string;
  /** 管理者か */
  isAdmin: boolean;
}

// =============================================================================
// 登録 API
// =============================================================================

/** POST /api/v1/register — 新規登録リクエスト */
export interface RegisterRequest {
  email: string;
  name: string;
  company?: string;
  productCode: ProductCode;
  requestedPlan: PlanCode;
  locale: 'ja' | 'en';
}

/** POST /api/v1/register — レスポンス */
export interface RegisterResponse {
  success: boolean;
  registrationId: string;
  message: string;
  /** メール認証メールを送信済みか */
  verificationEmailSent: boolean;
}

/** POST /api/v1/verify — メール認証 */
export interface VerifyRequest {
  token: string;
}

/** POST /api/v1/verify — レスポンス */
export interface VerifyResponse {
  success: boolean;
  /** 仮キーが発行されたか */
  provisionalKeyIssued: boolean;
  /** 仮ライセンスキー（成功時） */
  provisionalKey?: string;
  /** 仮キー有効期限 */
  provisionalExpiresAt?: string;
  message: string;
}

// =============================================================================
// ライセンス検証 API
// =============================================================================

/** POST /api/v1/licenses/validate — ライセンスキー検証 */
export interface ValidateLicenseRequest {
  licenseKey: string;
  productCode: ProductCode;
  /** デバイス識別子（将来のデバイス台数制限用） */
  deviceId?: string;
}

/** POST /api/v1/licenses/validate — レスポンス */
export interface ValidateLicenseResponse {
  valid: boolean;
  plan: PlanCode;
  expiresAt: string | null;
  features: Record<string, boolean | number>;
  /** AI クレジット残量 */
  aiCredits: CreditBalance | null;
  reason?: string;
}

/** POST /api/v1/licenses/activate — アクティベーション */
export interface ActivateLicenseRequest {
  email: string;
  licenseKey: string;
  productCode: ProductCode;
  deviceId?: string;
  deviceName?: string;
}

/** POST /api/v1/licenses/activate — レスポンス */
export interface ActivateLicenseResponse {
  success: boolean;
  plan: PlanCode;
  expiresAt: string | null;
  features: Record<string, boolean | number>;
  aiCredits: CreditBalance | null;
  message: string;
}

// =============================================================================
// エンタイトルメント API
// =============================================================================

/** POST /api/v1/entitlement/check — 機能利用可否チェック */
export interface CheckEntitlementRequest {
  productCode: ProductCode;
  featureKey: string;
}

/** POST /api/v1/entitlement/check — レスポンス */
export interface CheckEntitlementResponse {
  allowed: boolean;
  plan: PlanCode;
  requiredPlan?: PlanCode;
  reason?: string;
  /** 機能が limit 型の場合の制限値 */
  limit?: number;
}

/** POST /api/v1/entitlement/status — ライセンス状態取得 */
export interface EntitlementStatusRequest {
  product_code: ProductCode;
}

/** POST /api/v1/entitlement/status — レスポンス */
export interface EntitlementStatusResponse {
  plan: PlanCode;
  limits: {
    monthlyLimit: number;
    storageLimit: number;
    teamMembers: number;
  };
  expires_at: string | null;
  usage: {
    current: number;
    limit: number;
    remaining: number;
    resetAt: string;
  } | null;
  ai_credits: CreditBalance | null;
}

// =============================================================================
// AI クレジット API
// =============================================================================

/** GET /api/ai/credits/balance — クレジット残量取得 */
export interface GetCreditBalanceRequest {
  productCode: ProductCode;
}

/** GET /api/ai/credits/balance — レスポンス */
export interface GetCreditBalanceResponse {
  balance: CreditBalance;
  plan: PlanCode;
  /** ステータスメッセージ */
  statusMessage: string;
  /** 警告レベル */
  warningLevel: 'none' | 'low' | 'critical' | 'exhausted';
}

/** POST /api/ai/credits/consume — クレジット消費 */
export interface ConsumeCreditRequest {
  productCode: ProductCode;
  featureType: AiFeatureType;
  personaId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

/** POST /api/ai/credits/consume — レスポンス */
export interface ConsumeCreditResponse {
  allowed: boolean;
  remaining: number;
  /** 使用ログ ID */
  logId?: string;
  /** 使用不可の理由 */
  reason?: string;
  reasonCode?: string;
  /** アドオン購入可能か */
  canPurchaseAddon?: boolean;
  /** アップグレード先 */
  suggestedUpgrade?: PlanCode;
}

/** GET /api/ai/usage/history — 使用履歴取得 */
export interface GetUsageHistoryRequest {
  productCode: ProductCode;
  limit?: number;
  offset?: number;
}

/** GET /api/ai/usage/history — レスポンス */
export interface GetUsageHistoryResponse {
  logs: Array<{
    id: string;
    featureType: AiFeatureType;
    personaId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
    creditSource: 'base' | 'addon';
    createdAt: string;
  }>;
  total: number;
}

// =============================================================================
// AI アドオン購入 API
// =============================================================================

/** POST /api/ai/addon/purchase — アドオン購入（Stripe Checkout Session 作成） */
export interface PurchaseAddonRequest {
  productCode: ProductCode;
  packId: string;
  /** Stripe で決済する場合の成功/キャンセル URL */
  successUrl?: string;
  cancelUrl?: string;
}

/** POST /api/ai/addon/purchase — レスポンス */
export interface PurchaseAddonResponse {
  /** Stripe Checkout Session URL */
  checkoutUrl: string;
  /** Session ID */
  sessionId: string;
}

/** GET /api/ai/addon/list — アドオンパック一覧 */
export interface GetAddonPacksResponse {
  /** 利用可能なアドオン定義 */
  availablePacks: Array<{
    id: string;
    credits: number;
    price: number;
    currency: 'JPY' | 'USD';
    descriptionJa: string;
    descriptionEn: string;
  }>;
  /** ユーザーの購入済みパック */
  purchasedPacks: PurchasedAddonPack[];
}

// =============================================================================
// Stripe Webhook API
// =============================================================================

/**
 * POST /api/v1/webhooks/stripe — Stripe Webhook ハンドラー仕様
 *
 * 処理フロー:
 * 1. Webhook 署名検証 (stripe.webhooks.constructEvent)
 * 2. イベント種別による分岐
 * 3. メタデータからライセンス情報を抽出
 * 4. ライセンス発行 or クレジット付与
 * 5. 監査ログ記録
 * 6. メール送信
 */
export interface StripeWebhookProcessingSpec {
  /** checkout.session.completed (mode: subscription) → ライセンス発行 */
  handleCheckoutCompleted: {
    input: {
      sessionId: string;
      customerId: string;
      customerEmail: string;
      subscriptionId: string;
      metadata: StripeCheckoutMetadata;
      amountTotal: number;
      currency: string;
    };
    output: StripeWebhookHandlerResult;
    steps: [
      '1. stripe_customers テーブルに顧客を upsert',
      '2. metadata.purchase_type を確認',
      '3a. "license" → 統合発行エンジンで production キーを発行',
      '3b. "addon" → ai_addon_packs にクレジットを登録',
      '4. stripe_subscriptions テーブルにサブスク情報を記録',
      '5. stripe_payments テーブルに決済情報を記録',
      '6. issuance_logs テーブルに監査ログを記録',
      '7. Resend でメール送信（ライセンスキー or アドオン購入確認）',
    ];
  };

  /** invoice.paid → サブスク更新 */
  handleInvoicePaid: {
    input: {
      invoiceId: string;
      subscriptionId: string;
      customerId: string;
      amountPaid: number;
      currency: string;
    };
    output: StripeWebhookHandlerResult;
    steps: [
      '1. stripe_subscriptions から製品・プラン情報を取得',
      '2. 新しい production キーを生成',
      '3. licenses テーブルの expires_at を +365 日に更新',
      '4. stripe_subscriptions の current_period を更新',
      '5. issuance_logs に更新ログを記録',
      '6. 更新完了メールを送信',
    ];
  };

  /** invoice.payment_failed → 猶予期間の処理 */
  handlePaymentFailed: {
    input: {
      invoiceId: string;
      subscriptionId: string;
      customerId: string;
      attemptCount: number;
    };
    output: { success: boolean; notificationSent: boolean };
    steps: [
      '1. licenses テーブルの payment_status を "past_due" に更新',
      '2. 決済失敗メールを送信',
      '3. 3回目の失敗で猶予期間終了、ライセンスを停止',
    ];
  };

  /** customer.subscription.deleted → 解約処理 */
  handleSubscriptionDeleted: {
    input: {
      subscriptionId: string;
      customerId: string;
      canceledAt: string;
    };
    output: { success: boolean };
    steps: [
      '1. stripe_subscriptions の status を "canceled" に更新',
      '2. licenses テーブルの auto_renew を false に更新',
      '3. 解約確認メールを送信',
      '4. 有効期限到来時に FREE プランへ自動降格（バッチ処理）',
    ];
  };
}

// =============================================================================
// 購入ページ API
// =============================================================================

/** POST /api/v1/checkout/create — Stripe Checkout Session 作成 */
export interface CreateCheckoutRequest {
  productCode: ProductCode;
  plan: PlanCode;
  purchaseType: 'license' | 'addon';
  /** アドオンパック ID（addon の場合） */
  addonPackId?: string;
  /** 顧客名 */
  customerName: string;
  /** 顧客メール */
  customerEmail: string;
  /** 会社名 */
  customerCompany?: string;
  /** ロケール */
  locale?: 'ja' | 'en';
  /** 成功時 URL */
  successUrl?: string;
  /** キャンセル時 URL */
  cancelUrl?: string;
}

/** POST /api/v1/checkout/create — レスポンス */
export interface CreateCheckoutResponse {
  /** Stripe Checkout URL（ユーザーをこの URL にリダイレクト） */
  checkoutUrl: string;
  /** Stripe Session ID */
  sessionId: string;
}

/** GET /api/v1/checkout/status — Checkout Session ステータス確認 */
export interface CheckoutStatusRequest {
  sessionId: string;
}

/** GET /api/v1/checkout/status — レスポンス */
export interface CheckoutStatusResponse {
  status: 'open' | 'complete' | 'expired';
  /** 決済完了時のライセンスキー */
  licenseKey?: string;
  /** 決済完了時の製品情報 */
  productCode?: ProductCode;
  plan?: PlanCode;
  expiresAt?: string;
}

// =============================================================================
// 管理 API
// =============================================================================

/** GET /api/v1/admin/licenses — ライセンス一覧 */
export interface AdminListLicensesRequest {
  page?: number;
  perPage?: number;
  productCode?: ProductCode;
  plan?: PlanCode;
  status?: 'active' | 'expired' | 'suspended';
  search?: string;
}

/** POST /api/v1/admin/licenses/revoke — ライセンス無効化 */
export interface AdminRevokeLicenseRequest {
  licenseId: string;
  reason: string;
}

// =============================================================================
// API エンドポイント一覧（ルーティング定義用）
// =============================================================================

/**
 * 全 API エンドポイントの型安全な定義
 *
 * ライセンスサーバー（Hono）のルーティング実装時に参照する。
 */
export const API_ROUTES = {
  // --- 登録系 ---
  register: {
    method: 'POST' as const,
    path: '/api/v1/register',
    auth: 'none' as const,
    rateLimit: { windowMs: 60_000, max: 5 },
    description: '新規ユーザー登録。メール認証メールを送信。',
  },
  verify: {
    method: 'POST' as const,
    path: '/api/v1/verify',
    auth: 'none' as const,
    rateLimit: { windowMs: 60_000, max: 10 },
    description: 'メール認証。成功時に7日間仮キーを自動発行。',
  },

  // --- ライセンス検証系 ---
  validate: {
    method: 'POST' as const,
    path: '/api/v1/licenses/validate',
    auth: 'api_key' as const,
    rateLimit: { windowMs: 60_000, max: 60 },
    description: 'ライセンスキーの有効性を検証。アプリ起動時に使用。',
  },
  activate: {
    method: 'POST' as const,
    path: '/api/v1/licenses/activate',
    auth: 'firebase_token' as const,
    rateLimit: { windowMs: 60_000, max: 10 },
    description: 'ライセンスキーをアクティベート。',
  },

  // --- エンタイトルメント系 ---
  checkEntitlement: {
    method: 'POST' as const,
    path: '/api/v1/entitlement/check',
    auth: 'firebase_token' as const,
    rateLimit: { windowMs: 60_000, max: 120 },
    description: '機能の利用可否をチェック。',
  },
  entitlementStatus: {
    method: 'POST' as const,
    path: '/api/v1/entitlement/status',
    auth: 'firebase_token' as const,
    rateLimit: { windowMs: 60_000, max: 30 },
    description: 'ライセンス状態の全体像を取得。',
  },

  // --- AI クレジット系 ---
  getCreditBalance: {
    method: 'GET' as const,
    path: '/api/ai/credits/balance',
    auth: 'firebase_token' as const,
    rateLimit: { windowMs: 60_000, max: 60 },
    description: 'AI クレジット残量を取得。',
  },
  consumeCredit: {
    method: 'POST' as const,
    path: '/api/ai/credits/consume',
    auth: 'firebase_token' as const,
    rateLimit: { windowMs: 60_000, max: 120 },
    description: 'AI クレジットを1消費。使用前に必ず呼ぶ。',
  },
  getUsageHistory: {
    method: 'GET' as const,
    path: '/api/ai/usage/history',
    auth: 'firebase_token' as const,
    rateLimit: { windowMs: 60_000, max: 20 },
    description: 'AI 使用履歴を取得。',
  },
  purchaseAddon: {
    method: 'POST' as const,
    path: '/api/ai/addon/purchase',
    auth: 'firebase_token' as const,
    rateLimit: { windowMs: 60_000, max: 10 },
    description: 'AI アドオンパック購入（Stripe Checkout Session 作成）。',
  },
  getAddonPacks: {
    method: 'GET' as const,
    path: '/api/ai/addon/list',
    auth: 'firebase_token' as const,
    rateLimit: { windowMs: 60_000, max: 30 },
    description: '利用可能なアドオンパックと購入済みパック一覧。',
  },

  // --- Checkout 系 ---
  createCheckout: {
    method: 'POST' as const,
    path: '/api/v1/checkout/create',
    auth: 'firebase_token' as const,
    rateLimit: { windowMs: 60_000, max: 10 },
    description: 'Stripe Checkout Session を作成。',
  },
  checkoutStatus: {
    method: 'GET' as const,
    path: '/api/v1/checkout/status',
    auth: 'firebase_token' as const,
    rateLimit: { windowMs: 60_000, max: 30 },
    description: 'Checkout Session のステータスを確認。',
  },

  // --- Webhook 系 ---
  webhookStripe: {
    method: 'POST' as const,
    path: '/api/v1/webhooks/stripe',
    auth: 'webhook_signature' as const,
    rateLimit: { windowMs: 60_000, max: 100 },
    description: 'Stripe Webhook。署名検証必須。',
  },

  // --- バッチ系 ---
  batchExpiry: {
    method: 'POST' as const,
    path: '/api/v1/batch/check-expiry',
    auth: 'cron_secret' as const,
    rateLimit: { windowMs: 60_000, max: 1 },
    description: '期限切れチェック（日次バッチ）。',
  },
  batchRenewal: {
    method: 'POST' as const,
    path: '/api/v1/batch/process-renewals',
    auth: 'cron_secret' as const,
    rateLimit: { windowMs: 60_000, max: 1 },
    description: '自動更新処理（日次バッチ）。',
  },
} as const;

// =============================================================================
// エラーコード
// =============================================================================

/** API エラーコード */
export const API_ERROR_CODES = {
  // 認証系
  AUTH_REQUIRED: { code: 'AUTH_REQUIRED', status: 401, messageJa: '認証が必要です', messageEn: 'Authentication required' },
  AUTH_INVALID: { code: 'AUTH_INVALID', status: 401, messageJa: '認証情報が無効です', messageEn: 'Invalid authentication' },
  AUTH_EXPIRED: { code: 'AUTH_EXPIRED', status: 401, messageJa: '認証が期限切れです', messageEn: 'Authentication expired' },
  FORBIDDEN: { code: 'FORBIDDEN', status: 403, messageJa: 'アクセス権限がありません', messageEn: 'Access denied' },

  // ライセンス系
  LICENSE_NOT_FOUND: { code: 'LICENSE_NOT_FOUND', status: 404, messageJa: 'ライセンスが見つかりません', messageEn: 'License not found' },
  LICENSE_EXPIRED: { code: 'LICENSE_EXPIRED', status: 403, messageJa: 'ライセンスの有効期限が切れています', messageEn: 'License has expired' },
  LICENSE_INVALID: { code: 'LICENSE_INVALID', status: 400, messageJa: 'ライセンスキーが無効です', messageEn: 'Invalid license key' },
  LICENSE_ALREADY_ACTIVE: { code: 'LICENSE_ALREADY_ACTIVE', status: 409, messageJa: 'このキーは既にアクティベート済みです', messageEn: 'License already activated' },

  // AI クレジット系
  CREDITS_EXHAUSTED: { code: 'CREDITS_EXHAUSTED', status: 403, messageJa: 'AIクレジットを使い切りました', messageEn: 'AI credits exhausted' },
  AI_NOT_AVAILABLE: { code: 'AI_NOT_AVAILABLE', status: 403, messageJa: 'このプランではAI機能を利用できません', messageEn: 'AI features not available for this plan' },

  // 登録系
  EMAIL_ALREADY_REGISTERED: { code: 'EMAIL_ALREADY_REGISTERED', status: 409, messageJa: 'このメールアドレスは既に登録されています', messageEn: 'Email already registered' },
  VERIFICATION_EXPIRED: { code: 'VERIFICATION_EXPIRED', status: 410, messageJa: '認証リンクの有効期限が切れています', messageEn: 'Verification link has expired' },
  VERIFICATION_INVALID: { code: 'VERIFICATION_INVALID', status: 400, messageJa: '無効な認証トークンです', messageEn: 'Invalid verification token' },

  // 決済系
  PAYMENT_FAILED: { code: 'PAYMENT_FAILED', status: 402, messageJa: '決済に失敗しました', messageEn: 'Payment failed' },
  WEBHOOK_INVALID: { code: 'WEBHOOK_INVALID', status: 400, messageJa: 'Webhook署名が無効です', messageEn: 'Invalid webhook signature' },

  // 一般
  RATE_LIMITED: { code: 'RATE_LIMITED', status: 429, messageJa: 'リクエスト回数の上限に達しました', messageEn: 'Rate limit exceeded' },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', status: 500, messageJa: '内部エラーが発生しました', messageEn: 'Internal server error' },
  INVALID_REQUEST: { code: 'INVALID_REQUEST', status: 400, messageJa: 'リクエストが不正です', messageEn: 'Invalid request' },
} as const;

/** API エラーレスポンス */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

/**
 * ロケールに応じたエラーメッセージを取得
 */
export function getErrorMessage(
  errorCode: keyof typeof API_ERROR_CODES,
  locale: 'ja' | 'en' = 'ja',
): string {
  const error = API_ERROR_CODES[errorCode];
  return locale === 'ja' ? error.messageJa : error.messageEn;
}

/**
 * API エラーレスポンスを生成
 */
export function createErrorResponse(
  errorCode: keyof typeof API_ERROR_CODES,
  locale: 'ja' | 'en' = 'ja',
): { status: number; body: ApiErrorResponse } {
  const error = API_ERROR_CODES[errorCode];
  return {
    status: error.status,
    body: {
      error: {
        code: error.code,
        message: locale === 'ja' ? error.messageJa : error.messageEn,
      },
    },
  };
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  API_ROUTES,
  API_ERROR_CODES,
  getErrorMessage,
  createErrorResponse,
};
