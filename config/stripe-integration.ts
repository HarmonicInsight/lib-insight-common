/**
 * HARMONIC insight Stripe 決済統合設定
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * ## Stripe を Phase 1（日本国内・3月リリース MVP）の主力決済に使用
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                   Stripe 決済フロー                                 │
 * │                                                                    │
 * │ ① 購入ページ        ② Stripe Checkout      ③ Webhook 受信         │
 * │ ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
 * │ │製品・プラン   │→│Payment Link │→│checkout.session.    │  │
 * │ │プラン選択     │  │or Checkout  │  │completed            │  │
 * │ │メール入力     │  │Session      │  │                     │  │
 * │ └──────────────┘  └──────────────┘  └──────────────────────┘  │
 * │                                                                    │
 * │ ④ ライセンス発行    ⑤ メール送信          ⑥ 利用開始              │
 * │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
 * │ │キー生成      │→│Resend で    │→│アプリ内で     │         │
 * │ │DB登録        │  │キー送信    │  │アクティベート│          │
 * │ │監査ログ      │  │             │  │             │         │
 * │ └──────────────┘  └──────────────┘  └──────────────┘         │
 * │                                                                    │
 * │ ── サブスクリプション更新 ──                                        │
 * │ ┌──────────────────────────────────────────────────────────────┐ │
 * │ │invoice.paid → 新キー発行 → メール送信 → 自動切り替え      │ │
 * │ └──────────────────────────────────────────────────────────────┘ │
 * │                                                                    │
 * │ ── AI アドオン購入 ──                                              │
 * │ ┌──────────────────────────────────────────────────────────────┐ │
 * │ │checkout.session.completed (mode: payment)                   │ │
 * │ │→ ai_addon_packs に登録 → クレジット即時反映                 │ │
 * │ └──────────────────────────────────────────────────────────────┘ │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ## 対象製品：
 * - 個人・法人向け： INSS, IOSH, IOSD, INPY（Stripe + 自社サイト）
 * - コンサル連動型: INCA, INBT, INMV, INIG, IVIN（Stripe 請求書 or 手動）
 * - AI アドオンパック: 全製品共通
 *
 * ## プラン体系（FREE / TRIAL / BIZ / ENT）
 * - FREE: ライセンス不要（基本機能のみ、Stripe 決済なし）
 * - TRIAL: 評価用（14日間、Stripe 決済なし）
 * - BIZ: 法人向け全機能（AI月200回・コラボレーション）
 * - ENT: カスタマイズ（AI無制限）
 *
 * ## Stripe 製品構成
 * - 各製品×有料プラン（BIZ/ENT）= 1 Stripe Product + 1 Stripe Price
 * - FREE / TRIAL は Stripe 決済不要（キー不要 or 自動発行）
 * - サブスクリプション（年間）= recurring（価格は Stripe ダッシュボードで設定）
 * - AI アドオン = one-time（価格は Stripe ダッシュボードで設定）
 */

import type { ProductCode, PlanCode } from './products';
import type { IssuanceChannel } from './license-server';

// =============================================================================
// 型定義
// =============================================================================

/** Stripe 製品マッピング */
export interface StripeProductMapping {
  /** 製品コード */
  productCode: ProductCode;
  /** プランコード */
  plan: PlanCode;
  /** Stripe Product ID（環境変数から注入） */
  stripeProductIdEnvKey: string;
  /** Stripe Price ID（環境変数から注入） */
  stripePriceIdEnvKey: string;
  /** 課金タイプ */
  billingType: 'recurring' | 'one_time';
  /** 課金間隔（recurring の場合） */
  billingInterval?: 'year';
  /** 説明 */
  description: string;
}

/** Stripe Webhook イベント種別（処理対象） */
export type StripeWebhookEvent =
  | 'checkout.session.completed'     // 新規購入完了
  | 'invoice.paid'                   // サブスク更新決済成功
  | 'invoice.payment_failed'         // 決済失敗
  | 'customer.subscription.updated'  // サブスク変更（アップグレード／ダウングレード）
  | 'customer.subscription.deleted'; // サブスク解約

/** Stripe Checkout メタデータ（ライセンス発行に必要な情報） */
export interface StripeCheckoutMetadata {
  /** 製品コード */
  product_code: ProductCode;
  /** プランコード */
  plan: PlanCode;
  /** 購入種別 */
  purchase_type: 'license' | 'addon';
  /** アドオンパック ID（addon の場合） */
  addon_pack_id?: string;
  /** アドオンモデルティア（addon の場合） */
  addon_model_tier?: 'standard' | 'premium';
  /** 顧客名 */
  customer_name: string;
  /** 会社名（任意） */
  customer_company?: string;
  /** ロケール */
  locale: 'ja' | 'en';
}

/** Stripe Webhook 処理結果 */
export interface StripeWebhookHandlerResult {
  /** 処理成功か */
  success: boolean;
  /** 発行チャネル */
  channel: IssuanceChannel;
  /** 発行されたライセンスキー（ライセンス購入の場合） */
  licenseKey?: string;
  /** 発行されたアドオンパック ID（アドオン購入の場合） */
  addonPackId?: string;
  /** エラーメッセージ */
  error?: string;
  /** 処理の詳細 */
  details?: string;
}

/** Stripe 顧客情報（Checkout Session から抽出） */
export interface StripeCustomerInfo {
  /** Stripe Customer ID */
  stripeCustomerId: string;
  /** メールアドレス */
  email: string;
  /** 顧客名 */
  name: string;
  /** 会社名 */
  company?: string;
}

// =============================================================================
// Stripe 製品・価格マッピング
// =============================================================================

/**
 * Stripe 製品マッピング
 *
 * 【重要】Stripe Product ID / Price ID は環境変数から注入する。
 * ここでは環境変数キー名のみ定義し、ID のハードコードは行わない。
 * 価格は Stripe ダッシュボード上で設定する（パートナーとの協議により決定）。
 *
 * 命名規則:
 * - 環境変数: STRIPE_{PRODUCT_CODE}_{PLAN}_PRODUCT_ID / STRIPE_{PRODUCT_CODE}_{PLAN}_PRICE_ID
 * - 例: STRIPE_INSS_BIZ_PRODUCT_ID, STRIPE_INSS_BIZ_PRICE_ID
 * - FREE / TRIAL は Stripe 決済不要のためマッピングなし
 */
export const STRIPE_PRODUCT_MAPPINGS: StripeProductMapping[] = [
  // --- Insight Business Suite（Tier 3） ---
  // NOTE: FREE プランはライセンス不要のため Stripe マッピングなし
  // NOTE: TRIAL プランは自動発行のため Stripe マッピングなし

  // INSS (Insight Deck Quality Gate)
  {
    productCode: 'INSS',
    plan: 'BIZ',
    stripeProductIdEnvKey: 'STRIPE_INSS_BIZ_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_INSS_BIZ_PRICE_ID',

    billingType: 'recurring',
    billingInterval: 'year',
    description: 'Insight Deck Quality Gate Business (Annual)',
  },

  // IOSH (Insight Performance Management)
  {
    productCode: 'IOSH',
    plan: 'BIZ',
    stripeProductIdEnvKey: 'STRIPE_IOSH_BIZ_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_IOSH_BIZ_PRICE_ID',

    billingType: 'recurring',
    billingInterval: 'year',
    description: 'Insight Performance Management Business (Annual)',
  },

  // IOSD (Insight AI Briefcase)
  {
    productCode: 'IOSD',
    plan: 'BIZ',
    stripeProductIdEnvKey: 'STRIPE_IOSD_BIZ_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_IOSD_BIZ_PRICE_ID',

    billingType: 'recurring',
    billingInterval: 'year',
    description: 'Insight AI Briefcase Business (Annual)',
  },

  // INPY (InsightPy)
  {
    productCode: 'INPY',
    plan: 'BIZ',
    stripeProductIdEnvKey: 'STRIPE_INPY_BIZ_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_INPY_BIZ_PRICE_ID',

    billingType: 'recurring',
    billingInterval: 'year',
    description: 'InsightPy Business (Annual)',
  },

  // --- AI アドオンパック（全製品共通、one-time、ティア別） ---
  {
    productCode: 'INSS',
    plan: 'BIZ', // プランに関係なく購入可能（metadata で制御）
    stripeProductIdEnvKey: 'STRIPE_AI_ADDON_STANDARD_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_AI_ADDON_STANDARD_PRICE_ID',

    billingType: 'one_time',
    description: 'AI Credits - Standard 200 (up to Sonnet)',
  },
  {
    productCode: 'INSS',
    plan: 'BIZ', // プランに関係なく購入可能（metadata で制御）
    stripeProductIdEnvKey: 'STRIPE_AI_ADDON_PREMIUM_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_AI_ADDON_PREMIUM_PRICE_ID',

    billingType: 'one_time',
    description: 'AI Credits - Premium 200 (including Opus)',
  },
];

// =============================================================================
// Stripe Checkout 設定
// =============================================================================

/**
 * Stripe Checkout Session 作成パラメーター
 *
 * Payment Links を MVP で使用し、将来的に Custom Checkout に移行可能。
 */
export const STRIPE_CHECKOUT_CONFIG = {
  /** 成功時のリダイレクト URL */
  successUrl: 'https://account.harmonicinsight.com/purchase/success?session_id={CHECKOUT_SESSION_ID}',
  /** キャンセル時のリダイレクト URL */
  cancelUrl: 'https://account.harmonicinsight.com/purchase/cancel',
  /** 対応通貨 */
  currency: 'jpy' as const,
  /** 自動税額計算 */
  automaticTax: true,
  /** 請求先住所の収集 */
  collectBillingAddress: true,
  /** プロモーションコードの許可 */
  allowPromotionCodes: true,
  /** 同意条項 URL */
  termsOfServiceUrl: 'https://harmonicinsight.com/terms',
  /** サブスクリプション設定 */
  subscription: {
    /** トライアル期間（日）。0 = トライアルなし（別途 TRIAL キーで対応） */
    trialPeriodDays: 0,
    /** 決済失敗時の猶予期間（日） */
    paymentGracePeriodDays: 7,
    /** 自動更新のデフォルト */
    defaultAutoRenew: true,
  },
} as const;

// =============================================================================
// Webhook イベントハンドラーマッピング
// =============================================================================

/**
 * Stripe Webhook イベント → 処理内容のマッピング
 *
 * ライセンスサーバーで使用する参照定義。
 */
export const STRIPE_WEBHOOK_HANDLERS: Record<StripeWebhookEvent, {
  /** 処理の説明 */
  description: string;
  /** 対応する発行チャネル */
  issuanceChannel: IssuanceChannel | null;
  /** 処理内容 */
  actions: string[];
}> = {
  'checkout.session.completed': {
    description: '新規購入完了 → ライセンスキー発行 or アドオンクレジット付与',
    issuanceChannel: 'direct_stripe',
    actions: [
      'metadata から product_code, plan, purchase_type を取得',
      'purchase_type === "license" の場合：',
      '  → 統合発行エンジンでキー生成 + DB登録 + 監査ログ',
      '  → Resend でライセンスキーメール送信',
      'purchase_type === "addon" の場合：',
      '  → ai_addon_packs テーブルにクレジット登録',
      '  → メールで購入確認を送信',
    ],
  },
  'invoice.paid': {
    description: 'サブスクリプション更新決済成功 → 新キー発行',
    issuanceChannel: 'system_renewal',
    actions: [
      'subscription metadata から製品・プラン情報を取得',
      '新しいライセンスキーを生成（有効期限を +365日）',
      'licenses テーブルの expires_at を更新',
      '更新完了メールを送信（新キー + 新有効期限）',
    ],
  },
  'invoice.payment_failed': {
    description: '決済失敗 → 猶予期間の案内',
    issuanceChannel: null,
    actions: [
      '決済失敗メールを送信（更新リンク付き）',
      'licenses テーブルの payment_status を "past_due" に更新',
      '猶予期間（7日）後にライセンスを停止',
    ],
  },
  'customer.subscription.updated': {
    description: 'サブスクリプション変更 → プラン変更を反映',
    issuanceChannel: null,
    actions: [
      '変更後のプランを特定',
      'licenses テーブルの plan を更新',
      'アップグレード → 即時反映、差額は日割り',
      'ダウングレード → 次回更新日に反映',
    ],
  },
  'customer.subscription.deleted': {
    description: 'サブスクリプション解約 → ライセンス期限切れ予告',
    issuanceChannel: null,
    actions: [
      '解約確認メールを送信',
      'licenses テーブルの auto_renew を false に更新',
      '現在の有効期限まではそのまま利用可能',
      '有効期限後に FREE プランに自動移行（基本機能のみ利用可能）',
    ],
  },
};

// =============================================================================
// Stripe 環境変数一覧
// =============================================================================

/**
 * ライセンスサーバーで必要な Stripe 関連の環境変数
 */
export const STRIPE_ENV_VARS = {
  /** Stripe Secret Key */
  secretKey: 'STRIPE_SECRET_KEY',
  /** Stripe Publishable Key（クライアント用） */
  publishableKey: 'STRIPE_PUBLISHABLE_KEY',
  /** Stripe Webhook Signing Secret */
  webhookSecret: 'STRIPE_WEBHOOK_SECRET',
  /** Stripe Customer Portal URL（自己管理用） */
  customerPortalUrl: 'STRIPE_CUSTOMER_PORTAL_URL',
} as const;

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 製品・プランに対応する Stripe マッピングを取得
 */
export function getStripeMapping(
  productCode: ProductCode,
  plan: PlanCode,
): StripeProductMapping | null {
  return STRIPE_PRODUCT_MAPPINGS.find(
    m => m.productCode === productCode && m.plan === plan && m.billingType === 'recurring',
  ) ?? null;
}

/**
 * AI アドオンの Stripe マッピングを取得
 */
export function getAddonStripeMapping(): StripeProductMapping | null {
  return STRIPE_PRODUCT_MAPPINGS.find(
    m => m.billingType === 'one_time',
  ) ?? null;
}

/**
 * Stripe Checkout メタデータを生成
 */
export function buildCheckoutMetadata(params: {
  productCode: ProductCode;
  plan: PlanCode;
  purchaseType: 'license' | 'addon';
  customerName: string;
  customerCompany?: string;
  locale?: 'ja' | 'en';
  addonPackId?: string;
}): StripeCheckoutMetadata {
  return {
    product_code: params.productCode,
    plan: params.plan,
    purchase_type: params.purchaseType,
    addon_pack_id: params.addonPackId,
    customer_name: params.customerName,
    customer_company: params.customerCompany,
    locale: params.locale ?? 'ja',
  };
}

/**
 * Stripe Checkout Session からメタデータを安全に抽出
 *
 * @param metadata - Stripe Session の metadata オブジェクト
 * @returns パース済みメタデータ、無効な場合は null
 */
export function parseCheckoutMetadata(
  metadata: Record<string, string> | null,
): StripeCheckoutMetadata | null {
  if (!metadata) return null;

  const productCode = metadata.product_code;
  const plan = metadata.plan;
  const purchaseType = metadata.purchase_type;
  const customerName = metadata.customer_name;

  if (!productCode || !plan || !purchaseType || !customerName) {
    return null;
  }

  return {
    product_code: productCode as ProductCode,
    plan: plan as PlanCode,
    purchase_type: purchaseType as 'license' | 'addon',
    addon_pack_id: metadata.addon_pack_id,
    customer_name: customerName,
    customer_company: metadata.customer_company,
    locale: (metadata.locale as 'ja' | 'en') || 'ja',
  };
}

/**
 * Stripe 製品が設定済みかチェック（環境変数の存在確認）
 */
export function isStripeConfigured(): boolean {
  return !!(
    process.env[STRIPE_ENV_VARS.secretKey] &&
    process.env[STRIPE_ENV_VARS.webhookSecret]
  );
}

/**
 * Stripe Price ID を環境変数から取得
 */
export function getStripePriceId(productCode: ProductCode, plan: PlanCode): string | null {
  const mapping = getStripeMapping(productCode, plan);
  if (!mapping) return null;
  return process.env[mapping.stripePriceIdEnvKey] ?? null;
}

/**
 * Stripe で購入可能な製品・プランの一覧を取得
 */
export function getStripePurchasableProducts(): Array<{
  productCode: ProductCode;
  plan: PlanCode;
  billingType: 'recurring' | 'one_time';
}> {
  return STRIPE_PRODUCT_MAPPINGS
    .filter(m => m.billingType === 'recurring')
    .map(m => ({
      productCode: m.productCode,
      plan: m.plan,
      billingType: m.billingType,
    }));
}

// =============================================================================
// DB スキーマ参照（Supabase テーブル追加）
// =============================================================================

/**
 * Stripe 統合に必要な追加テーブル・カラム
 */
export const STRIPE_DB_SCHEMA_REFERENCE = {
  /** Stripe 顧客マッピング */
  stripe_customers: `
    CREATE TABLE IF NOT EXISTS stripe_customers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id),
      stripe_customer_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT,
      company TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE UNIQUE INDEX idx_stripe_customers_user ON stripe_customers(user_id);
    CREATE INDEX idx_stripe_customers_stripe ON stripe_customers(stripe_customer_id);
  `,

  /** Stripe サブスクリプション記録 */
  stripe_subscriptions: `
    CREATE TABLE IF NOT EXISTS stripe_subscriptions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id),
      license_id UUID REFERENCES licenses(id),
      stripe_subscription_id TEXT NOT NULL UNIQUE,
      stripe_customer_id TEXT NOT NULL,
      product_code TEXT NOT NULL,
      plan TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      current_period_start TIMESTAMPTZ,
      current_period_end TIMESTAMPTZ,
      cancel_at_period_end BOOLEAN DEFAULT FALSE,
      canceled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_stripe_subs_user ON stripe_subscriptions(user_id);
    CREATE INDEX idx_stripe_subs_stripe ON stripe_subscriptions(stripe_subscription_id);
    CREATE INDEX idx_stripe_subs_status ON stripe_subscriptions(status);
  `,

  /** Stripe 決済履歴 */
  stripe_payments: `
    CREATE TABLE IF NOT EXISTS stripe_payments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id),
      stripe_payment_intent_id TEXT,
      stripe_checkout_session_id TEXT,
      stripe_invoice_id TEXT,
      product_code TEXT NOT NULL,
      plan TEXT,
      purchase_type TEXT NOT NULL CHECK (purchase_type IN ('license', 'addon')),
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'jpy',
      status TEXT NOT NULL DEFAULT 'pending',
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_stripe_payments_user ON stripe_payments(user_id);
    CREATE INDEX idx_stripe_payments_session ON stripe_payments(stripe_checkout_session_id);
  `,

  /** licenses テーブルへの追加カラム */
  licenses_stripe_columns: `
    ALTER TABLE licenses ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
    ALTER TABLE licenses ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;
    ALTER TABLE licenses ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'active';
    -- payment_status: 'active' | 'past_due' | 'canceled' | 'unpaid'
  `,
} as const;

// =============================================================================
// エクスポート
// =============================================================================

export default {
  // マッピング
  STRIPE_PRODUCT_MAPPINGS,
  STRIPE_CHECKOUT_CONFIG,
  STRIPE_WEBHOOK_HANDLERS,
  STRIPE_ENV_VARS,
  STRIPE_DB_SCHEMA_REFERENCE,

  // ヘルパー
  getStripeMapping,
  getAddonStripeMapping,
  buildCheckoutMetadata,
  parseCheckoutMetadata,
  isStripeConfigured,
  getStripePriceId,
  getStripePurchasableProducts,
};
