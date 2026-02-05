/**
 * 使用回数ベース ライセンス設定
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * ## クレジットプール型 AI 使用量管理
 *
 * AI 機能（ai_assistant + ai_editor）は共有クレジットプールで管理する。
 * プラン別の基本クレジットに加え、アドオンパックで追加購入が可能。
 *
 * ```
 * ┌────────────────────────────────────────────────────────────────┐
 * │                    AI クレジットプール                          │
 * │                                                                │
 * │   基本クレジット（プラン付属）                                   │
 * │   ┌──────────┬──────────┬──────────┬──────────┬──────────┐     │
 * │   │  FREE    │  TRIAL   │   STD    │   PRO    │   ENT    │     │
 * │   │  20回    │  無制限   │   0回    │  100回   │  無制限   │     │
 * │   │ (永続)   │ (14日)   │ (AIなし)  │  (/年)   │  (/年)   │     │
 * │   └──────────┴──────────┴──────────┴──────────┴──────────┘     │
 * │                                                                │
 * │   アドオンパック（追加購入・2ティア制）                           │
 * │   ┌──────────────────────────────────────────────┐             │
 * │   │  Standard  ¥10,000 / 200回（Sonnet まで）     │             │
 * │   │  Premium   ¥20,000 / 200回（Opus 対応）       │             │
 * │   │  有効期限: 購入日から365日                      │             │
 * │   │  複数パック購入可能（クレジットは累積加算）     │             │
 * │   └──────────────────────────────────────────────┘             │
 * │                                                                │
 * │   消費ルール                                                    │
 * │   ┌──────────────────────────────────────────────┐             │
 * │   │  1. 基本クレジットを先に消費                   │             │
 * │   │  2. 基本クレジット枯渇後にアドオンを消費       │             │
 * │   │  3. ai_assistant / ai_editor 共通プール        │             │
 * │   │  4. 1 API コール = 1 クレジット消費            │             │
 * │   └──────────────────────────────────────────────┘             │
 * └────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## 使用量トラッキング
 *
 * - サーバーサイド: `ai_usage_logs` テーブルで全 API コールを記録
 * - クライアントサイド: キャッシュされた残量を表示、API コール前にサーバーに確認
 * - 監査: 使用量、モデル、トークン数、推定コストを記録
 *
 * ## DB テーブル構成
 *
 * | テーブル             | 役割                                    |
 * |---------------------|----------------------------------------|
 * | `ai_usage_logs`     | 個別 AI コールの記録（監査・分析用）       |
 * | `ai_usage_summary`  | ユーザー×製品の集計（クレジット残量）      |
 * | `ai_addon_packs`    | 購入済みアドオンパック                    |
 */

import type { ProductCode, PlanCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** AI クレジットの消費対象となる機能 */
export type AiFeatureType = 'ai_assistant' | 'ai_editor';

/** クレジット付与の基準期間 */
export type QuotaPeriod = 'lifetime' | 'annual' | 'unlimited';

/**
 * AI モデルティア
 *
 * アドオンパックごとに利用可能なモデルの上限を制御する。
 * - standard: Haiku / Sonnet まで
 * - premium: Haiku / Sonnet / Opus（全モデル）
 */
export type AiModelTier = 'standard' | 'premium';

/** プラン別 AI クレジット定義 */
export interface AiQuotaDefinition {
  /** プランコード */
  plan: PlanCode;
  /** 基本クレジット数（-1 = 無制限） */
  baseCredits: number;
  /** クレジット期間 */
  period: QuotaPeriod;
  /** AI 機能が利用可能か */
  aiEnabled: boolean;
  /** 利用可能なモデルティア */
  modelTier: AiModelTier;
  /** 説明（日本語） */
  descriptionJa: string;
  /** 説明（英語） */
  descriptionEn: string;
}

/** アドオンパック定義 */
export interface AddonPackDefinition {
  /** パック ID */
  id: string;
  /** クレジット数 */
  credits: number;
  /** 価格（税抜） */
  price: number;
  /** 通貨 */
  currency: 'JPY' | 'USD';
  /** 有効期間（日数） */
  validDays: number;
  /** 利用可能なモデルティア */
  modelTier: AiModelTier;
  /** 説明（日本語） */
  descriptionJa: string;
  /** 説明（英語） */
  descriptionEn: string;
}

/** AI 使用ログエントリ */
export interface AiUsageLogEntry {
  /** ログ ID */
  id: string;
  /** ユーザー ID */
  userId: string;
  /** 製品コード */
  productCode: ProductCode;
  /** 使用機能 */
  featureType: AiFeatureType;
  /** 使用したペルソナ ID */
  personaId: string;
  /** 使用したモデル */
  model: string;
  /** 入力トークン数 */
  inputTokens: number;
  /** 出力トークン数 */
  outputTokens: number;
  /** 推定コスト（USD） */
  estimatedCostUsd: number;
  /** クレジットソース: 基本クレジットかアドオンか */
  creditSource: 'base' | 'addon';
  /** アドオンパック ID（creditSource が 'addon' の場合） */
  addonPackId?: string;
  /** 作成日時 */
  createdAt: string;
}

/** クレジット残量サマリー */
export interface CreditBalance {
  /** 基本クレジット残量（-1 = 無制限） */
  baseRemaining: number;
  /** 基本クレジット上限（-1 = 無制限） */
  baseTotal: number;
  /** 基本クレジット使用済み */
  baseUsed: number;
  /** アドオンクレジット残量 */
  addonRemaining: number;
  /** アドオンクレジット合計 */
  addonTotal: number;
  /** アドオンクレジット使用済み */
  addonUsed: number;
  /** 合計残量（-1 = 無制限） */
  totalRemaining: number;
  /** 合計上限（-1 = 無制限） */
  totalCredits: number;
  /** 合計使用済み */
  totalUsed: number;
  /** 基本クレジットのリセット日（annual の場合） */
  baseResetAt: Date | null;
  /** AI 機能が利用可能か */
  aiEnabled: boolean;
  /** 現在の有効モデルティア（基本プラン + アドオンの最大値） */
  effectiveModelTier: AiModelTier;
}

/** 使用可否チェック結果 */
export interface UsageCheckResult {
  /** 使用可能か */
  allowed: boolean;
  /** 残りクレジット数（-1 = 無制限） */
  remaining: number;
  /** 使用不可の理由 */
  reason?: string;
  /** 使用不可の理由コード */
  reasonCode?: UsageDeniedReason;
  /** アップグレード先プラン（使用不可の場合） */
  suggestedUpgrade?: PlanCode;
  /** アドオン購入が可能か */
  canPurchaseAddon?: boolean;
}

/** 使用拒否の理由コード */
export type UsageDeniedReason =
  | 'ai_not_available'    // STD プランなど AI 機能なし
  | 'credits_exhausted'   // クレジット使い切り
  | 'license_expired'     // ライセンス期限切れ
  | 'license_inactive';   // ライセンス無効

/** 購入済みアドオンパック */
export interface PurchasedAddonPack {
  /** レコード ID */
  id: string;
  /** ユーザー ID */
  userId: string;
  /** 製品コード */
  productCode: ProductCode;
  /** アドオンパック定義 ID */
  packId: string;
  /** 付与クレジット数 */
  credits: number;
  /** 使用済みクレジット数 */
  usedCredits: number;
  /** 残りクレジット数 */
  remainingCredits: number;
  /** 購入日時 */
  purchasedAt: string;
  /** 有効期限 */
  expiresAt: string;
  /** 有効かどうか */
  isActive: boolean;
  /** モデルティア */
  modelTier: AiModelTier;
  /** 決済方法 */
  paymentMethod: 'paddle' | 'stripe' | 'msstore' | 'invoice' | 'admin';
  /** 決済 ID */
  paymentId?: string;
}

// =============================================================================
// クレジット定義
// =============================================================================

/**
 * プラン別 AI クレジット定義
 *
 * 【重要】
 * - FREE: 20回は「永続」（使い切るまで有効、月間リセットなし）
 * - STD: AI 機能なし（aiEnabled: false）
 * - PRO: 100回は年間（ライセンス更新時にリセット）
 * - TRIAL/ENT: 無制限
 */
export const AI_QUOTA_BY_PLAN: Record<PlanCode, AiQuotaDefinition> = {
  FREE: {
    plan: 'FREE',
    baseCredits: 20,
    period: 'lifetime',
    aiEnabled: true,
    modelTier: 'standard',
    descriptionJa: 'AI 20回付き無料版（Sonnetまで）',
    descriptionEn: 'Free with 20 AI credits (up to Sonnet)',
  },
  TRIAL: {
    plan: 'TRIAL',
    baseCredits: -1,
    period: 'unlimited',
    aiEnabled: true,
    modelTier: 'premium',
    descriptionJa: '全機能無制限（14日間・Opus対応）',
    descriptionEn: 'Unlimited access for 14 days (including Opus)',
  },
  STD: {
    plan: 'STD',
    baseCredits: 0,
    period: 'annual',
    aiEnabled: false,
    modelTier: 'standard',
    descriptionJa: 'AI機能なし（アドオン購入でAI利用可能）',
    descriptionEn: 'No AI features (purchase add-on to enable)',
  },
  PRO: {
    plan: 'PRO',
    baseCredits: 100,
    period: 'annual',
    aiEnabled: true,
    modelTier: 'standard',
    descriptionJa: 'AI 100回付き（Sonnetまで・Premiumアドオンで Opus利用可）',
    descriptionEn: '100 AI credits included (up to Sonnet, Opus via Premium add-on)',
  },
  ENT: {
    plan: 'ENT',
    baseCredits: -1,
    period: 'unlimited',
    aiEnabled: true,
    modelTier: 'premium',
    descriptionJa: 'AI無制限（Opus対応）',
    descriptionEn: 'Unlimited AI usage (including Opus)',
  },
};

// =============================================================================
// アドオンパック定義
// =============================================================================

/**
 * AI クレジット アドオンパック（2ティア制）
 *
 * - Standard: ¥10,000 / 200回（Sonnet まで）
 * - Premium:  ¥20,000 / 200回（Opus 対応）
 * - 全プランで購入可能（STD でもアドオンでAI利用可能に）
 * - 複数パック購入可能（クレジットは累積加算）
 * - 有効期限: 購入日から365日
 * - Standard と Premium を混在購入可能
 *   → 消費時に Premium パックのクレジットがあれば Opus 利用可能
 */
export const AI_ADDON_PACKS: AddonPackDefinition[] = [
  {
    id: 'ai_credits_200_standard',
    credits: 200,
    price: 10_000,
    currency: 'JPY',
    validDays: 365,
    modelTier: 'standard',
    descriptionJa: 'AI標準パック 200回（Sonnetまで）',
    descriptionEn: '200 AI Credits - Standard (up to Sonnet)',
  },
  {
    id: 'ai_credits_200_premium',
    credits: 200,
    price: 20_000,
    currency: 'JPY',
    validDays: 365,
    modelTier: 'premium',
    descriptionJa: 'AIプレミアムパック 200回（Opus対応）',
    descriptionEn: '200 AI Credits - Premium (including Opus)',
  },
];

/** USD 参考価格（グローバル展開用） */
export const AI_ADDON_PACKS_USD: Record<string, number> = {
  ai_credits_200_standard: 67,  // $67 ≈ ¥10,000
  ai_credits_200_premium: 133,  // $133 ≈ ¥20,000
};

// =============================================================================
// クレジット計算関数
// =============================================================================

/**
 * プランの AI クレジット定義を取得
 */
export function getAiQuota(plan: PlanCode): AiQuotaDefinition {
  return AI_QUOTA_BY_PLAN[plan];
}

/**
 * プランで AI が利用可能かチェック（アドオンなし前提）
 */
export function isAiEnabledForPlan(plan: PlanCode): boolean {
  return AI_QUOTA_BY_PLAN[plan].aiEnabled;
}

/**
 * プランの基本クレジット数を取得
 * @returns クレジット数（-1 = 無制限）
 */
export function getBaseCredits(plan: PlanCode): number {
  return AI_QUOTA_BY_PLAN[plan].baseCredits;
}

/**
 * 無制限プランかチェック
 */
export function isUnlimitedPlan(plan: PlanCode): boolean {
  return AI_QUOTA_BY_PLAN[plan].baseCredits === -1;
}

/**
 * プランの基本モデルティアを取得
 */
export function getModelTier(plan: PlanCode): AiModelTier {
  return AI_QUOTA_BY_PLAN[plan].modelTier;
}

/**
 * モデルティアに基づいて使用可能なモデルを取得
 */
export function getAllowedModels(tier: AiModelTier): string[] {
  const standardModels = [
    'claude-haiku-4-5-20251001',
    'claude-sonnet-4-20250514',
  ];
  if (tier === 'premium') {
    return [...standardModels, 'claude-opus-4-20250514'];
  }
  return standardModels;
}

/**
 * 指定モデルがティアで利用可能かチェック
 */
export function isModelAllowedForTier(model: string, tier: AiModelTier): boolean {
  return getAllowedModels(tier).includes(model);
}

/**
 * モデルに必要な最低ティアを取得
 */
export function getRequiredTierForModel(model: string): AiModelTier {
  if (model.includes('opus')) return 'premium';
  return 'standard';
}

/**
 * クレジット残量を計算
 *
 * @param plan - 現在のプラン
 * @param baseUsed - 基本クレジット使用済み数
 * @param addonPacks - 購入済みアドオンパック一覧
 * @returns クレジット残量サマリー
 */
export function calculateCreditBalance(
  plan: PlanCode,
  baseUsed: number,
  addonPacks: PurchasedAddonPack[],
): CreditBalance {
  const quota = AI_QUOTA_BY_PLAN[plan];

  // 無制限プラン
  if (quota.baseCredits === -1) {
    return {
      baseRemaining: -1,
      baseTotal: -1,
      baseUsed,
      addonRemaining: 0,
      addonTotal: 0,
      addonUsed: 0,
      totalRemaining: -1,
      totalCredits: -1,
      totalUsed: baseUsed,
      baseResetAt: null,
      aiEnabled: true,
      effectiveModelTier: quota.modelTier,
    };
  }

  // 有効なアドオンのみ集計
  const now = new Date();
  const activePacks = addonPacks.filter(
    p => p.isActive && new Date(p.expiresAt) > now,
  );
  const addonTotal = activePacks.reduce((sum, p) => sum + p.credits, 0);
  const addonUsed = activePacks.reduce((sum, p) => sum + p.usedCredits, 0);
  const addonRemaining = activePacks.reduce((sum, p) => sum + p.remainingCredits, 0);

  const baseRemaining = Math.max(0, quota.baseCredits - baseUsed);
  const totalCredits = quota.baseCredits + addonTotal;
  const totalUsed = baseUsed + addonUsed;
  const totalRemaining = baseRemaining + addonRemaining;

  // STD でもアドオンがあれば AI 有効
  const aiEnabled = quota.aiEnabled || addonRemaining > 0;

  // モデルティア: プラン基本 or 有効な Premium アドオンがあれば premium
  const hasPremiumAddon = activePacks.some(
    p => p.modelTier === 'premium' && p.remainingCredits > 0,
  );
  const effectiveModelTier: AiModelTier =
    quota.modelTier === 'premium' || hasPremiumAddon ? 'premium' : 'standard';

  return {
    baseRemaining,
    baseTotal: quota.baseCredits,
    baseUsed,
    addonRemaining,
    addonTotal,
    addonUsed,
    totalRemaining,
    totalCredits,
    totalUsed,
    baseResetAt: null, // サーバーサイドでライセンス期間から算出
    aiEnabled,
    effectiveModelTier,
  };
}

/**
 * AI 使用可否をチェック
 *
 * @param plan - 現在のプラン
 * @param balance - クレジット残量
 * @param licenseActive - ライセンスが有効か
 * @returns 使用可否チェック結果
 *
 * @example
 * ```typescript
 * const balance = calculateCreditBalance('PRO', 95, addonPacks);
 * const result = checkAiUsage('PRO', balance, true);
 * if (!result.allowed) {
 *   console.log(result.reason); // "クレジットが不足しています"
 *   console.log(result.canPurchaseAddon); // true
 * }
 * ```
 */
export function checkAiUsage(
  plan: PlanCode,
  balance: CreditBalance,
  licenseActive: boolean = true,
): UsageCheckResult {
  // ライセンス無効
  if (!licenseActive && plan !== 'FREE') {
    return {
      allowed: false,
      remaining: 0,
      reason: 'ライセンスが無効化されています',
      reasonCode: 'license_inactive',
    };
  }

  // 無制限プラン
  if (balance.totalRemaining === -1) {
    return {
      allowed: true,
      remaining: -1,
    };
  }

  // AI 機能なし（STD でアドオンなし）
  if (!balance.aiEnabled) {
    return {
      allowed: false,
      remaining: 0,
      reason: 'このプランではAI機能はご利用いただけません。アドオンパックを購入するか、PROプランにアップグレードしてください。',
      reasonCode: 'ai_not_available',
      suggestedUpgrade: 'PRO',
      canPurchaseAddon: true,
    };
  }

  // クレジット枯渇
  if (balance.totalRemaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      reason: 'AIクレジットを使い切りました。アドオンパックを購入してください。',
      reasonCode: 'credits_exhausted',
      canPurchaseAddon: true,
    };
  }

  // 使用可能
  return {
    allowed: true,
    remaining: balance.totalRemaining,
  };
}

/**
 * クレジット消費のソースを決定
 *
 * 消費ルール:
 * 1. 基本クレジットを先に消費
 * 2. 基本クレジット枯渇後にアドオンを消費（FIFO: 購入日が古い順）
 *
 * @returns 消費先情報、null = 消費不可（クレジット不足）
 */
export function determineCreditSource(
  balance: CreditBalance,
  addonPacks: PurchasedAddonPack[],
): { source: 'base' | 'addon'; addonPackId?: string } | null {
  // 無制限
  if (balance.totalRemaining === -1) {
    return { source: 'base' };
  }

  // 基本クレジット残あり
  if (balance.baseRemaining > 0) {
    return { source: 'base' };
  }

  // アドオンから消費（FIFO: 購入日が古い順）
  const now = new Date();
  const availablePack = addonPacks
    .filter(p => p.isActive && p.remainingCredits > 0 && new Date(p.expiresAt) > now)
    .sort((a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime())[0];

  if (availablePack) {
    return { source: 'addon', addonPackId: availablePack.id };
  }

  // クレジット不足
  return null;
}

// =============================================================================
// 使用量メッセージ生成
// =============================================================================

/**
 * クレジット残量の表示メッセージを取得
 */
export function getCreditStatusMessage(
  balance: CreditBalance,
  locale: 'ja' | 'en' = 'ja',
): string {
  if (balance.totalRemaining === -1) {
    return locale === 'ja' ? 'AI無制限' : 'Unlimited AI';
  }

  if (!balance.aiEnabled) {
    return locale === 'ja'
      ? 'AI機能なし'
      : 'No AI access';
  }

  if (locale === 'ja') {
    const parts: string[] = [];
    if (balance.baseTotal > 0) {
      parts.push(`基本: ${balance.baseRemaining}/${balance.baseTotal}回`);
    }
    if (balance.addonTotal > 0) {
      parts.push(`アドオン: ${balance.addonRemaining}/${balance.addonTotal}回`);
    }
    return `AI残り ${balance.totalRemaining}回（${parts.join('、')}）`;
  }

  const parts: string[] = [];
  if (balance.baseTotal > 0) {
    parts.push(`Base: ${balance.baseRemaining}/${balance.baseTotal}`);
  }
  if (balance.addonTotal > 0) {
    parts.push(`Add-on: ${balance.addonRemaining}/${balance.addonTotal}`);
  }
  return `${balance.totalRemaining} AI credits remaining (${parts.join(', ')})`;
}

/**
 * クレジット残量の警告レベルを取得
 */
export function getCreditWarningLevel(
  balance: CreditBalance,
): 'none' | 'low' | 'critical' | 'exhausted' {
  if (balance.totalRemaining === -1) return 'none';
  if (!balance.aiEnabled) return 'exhausted';
  if (balance.totalRemaining <= 0) return 'exhausted';
  if (balance.totalRemaining <= 5) return 'critical';
  if (balance.totalRemaining <= 10) return 'low';
  return 'none';
}

// =============================================================================
// DB スキーマ定義（Supabase マイグレーション用参考）
// =============================================================================

/**
 * DB テーブル定義（参考 SQL）
 *
 * サーバーサイドでのマイグレーション実行に使用。
 * このファイルには実行コードは含まず、型定義のみ。
 */
export const DB_SCHEMA_REFERENCE = {
  /** AI 使用ログテーブル */
  ai_usage_logs: `
    CREATE TABLE IF NOT EXISTS ai_usage_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id),
      product_code TEXT NOT NULL,
      feature_type TEXT NOT NULL CHECK (feature_type IN ('ai_assistant', 'ai_editor')),
      persona_id TEXT NOT NULL,
      model TEXT NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
      credit_source TEXT NOT NULL CHECK (credit_source IN ('base', 'addon')),
      addon_pack_id UUID REFERENCES ai_addon_packs(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_ai_usage_logs_user_product ON ai_usage_logs(user_id, product_code);
    CREATE INDEX idx_ai_usage_logs_created ON ai_usage_logs(created_at);
  `,

  /** AI 使用量サマリーテーブル */
  ai_usage_summary: `
    CREATE TABLE IF NOT EXISTS ai_usage_summary (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id),
      product_code TEXT NOT NULL,
      base_credits_used INTEGER NOT NULL DEFAULT 0,
      base_credits_total INTEGER NOT NULL DEFAULT 0,
      period_start TIMESTAMPTZ,
      period_end TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, product_code)
    );
  `,

  /** アドオンパックテーブル */
  ai_addon_packs: `
    CREATE TABLE IF NOT EXISTS ai_addon_packs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id),
      product_code TEXT NOT NULL,
      pack_id TEXT NOT NULL,
      credits INTEGER NOT NULL,
      used_credits INTEGER NOT NULL DEFAULT 0,
      remaining_credits INTEGER NOT NULL,
      purchased_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      payment_method TEXT NOT NULL,
      payment_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_ai_addon_packs_user ON ai_addon_packs(user_id, product_code);
    CREATE INDEX idx_ai_addon_packs_active ON ai_addon_packs(is_active, expires_at);
  `,
} as const;

// =============================================================================
// Supabase RPC 関数定義（参考 SQL）
// =============================================================================

/**
 * AI クレジット管理用の Supabase RPC 関数
 *
 * ServerAiUsageManager から呼び出される。
 * アトミックなクレジット消費を保証するため、DB 側の関数として実装する。
 */
export const RPC_FUNCTIONS_REFERENCE = {
  /**
   * 基本クレジットの使用数をインクリメント（upsert）
   *
   * ai_usage_summary テーブルが存在しない場合は新規作成し、
   * 存在する場合は base_credits_used を +1 する。
   */
  increment_ai_base_usage: `
    CREATE OR REPLACE FUNCTION increment_ai_base_usage(
      p_user_id UUID,
      p_product_code TEXT,
      p_base_total INTEGER
    ) RETURNS VOID AS $$
    BEGIN
      INSERT INTO ai_usage_summary (user_id, product_code, base_credits_used, base_credits_total, updated_at)
      VALUES (p_user_id, p_product_code, 1, p_base_total, NOW())
      ON CONFLICT (user_id, product_code)
      DO UPDATE SET
        base_credits_used = ai_usage_summary.base_credits_used + 1,
        base_credits_total = p_base_total,
        updated_at = NOW();
    END;
    $$ LANGUAGE plpgsql;
  `,

  /**
   * アドオンパックからクレジットを1消費
   *
   * remaining_credits を -1 し、used_credits を +1 する。
   * remaining_credits が 0 になったら is_active を false に更新する。
   */
  consume_ai_addon_credit: `
    CREATE OR REPLACE FUNCTION consume_ai_addon_credit(
      p_pack_id UUID
    ) RETURNS VOID AS $$
    BEGIN
      UPDATE ai_addon_packs
      SET
        used_credits = used_credits + 1,
        remaining_credits = remaining_credits - 1,
        is_active = CASE WHEN remaining_credits - 1 <= 0 THEN FALSE ELSE TRUE END
      WHERE id = p_pack_id
        AND is_active = TRUE
        AND remaining_credits > 0
        AND expires_at > NOW();

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Addon pack not available: %', p_pack_id;
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  `,

  /**
   * ライセンス更新時に基本クレジットをリセット
   *
   * annual プランの更新時に呼び出す。
   * base_credits_used を 0 にリセットし、新しい期間を設定する。
   */
  reset_ai_base_credits: `
    CREATE OR REPLACE FUNCTION reset_ai_base_credits(
      p_user_id UUID,
      p_product_code TEXT,
      p_base_total INTEGER,
      p_period_start TIMESTAMPTZ,
      p_period_end TIMESTAMPTZ
    ) RETURNS VOID AS $$
    BEGIN
      INSERT INTO ai_usage_summary (user_id, product_code, base_credits_used, base_credits_total, period_start, period_end, updated_at)
      VALUES (p_user_id, p_product_code, 0, p_base_total, p_period_start, p_period_end, NOW())
      ON CONFLICT (user_id, product_code)
      DO UPDATE SET
        base_credits_used = 0,
        base_credits_total = p_base_total,
        period_start = p_period_start,
        period_end = p_period_end,
        updated_at = NOW();
    END;
    $$ LANGUAGE plpgsql;
  `,

  /**
   * Stripe 決済完了時にアドオンパックを登録
   *
   * checkout.session.completed (purchase_type: addon) のハンドラーから呼び出す。
   */
  provision_ai_addon_pack: `
    CREATE OR REPLACE FUNCTION provision_ai_addon_pack(
      p_user_id UUID,
      p_product_code TEXT,
      p_pack_id TEXT,
      p_credits INTEGER,
      p_valid_days INTEGER,
      p_payment_method TEXT,
      p_payment_id TEXT
    ) RETURNS UUID AS $$
    DECLARE
      v_pack_uuid UUID;
    BEGIN
      INSERT INTO ai_addon_packs (
        user_id, product_code, pack_id, credits, used_credits, remaining_credits,
        purchased_at, expires_at, is_active, payment_method, payment_id
      ) VALUES (
        p_user_id, p_product_code, p_pack_id, p_credits, 0, p_credits,
        NOW(), NOW() + (p_valid_days || ' days')::INTERVAL, TRUE, p_payment_method, p_payment_id
      )
      RETURNING id INTO v_pack_uuid;

      RETURN v_pack_uuid;
    END;
    $$ LANGUAGE plpgsql;
  `,
} as const;

// =============================================================================
// ライセンスサーバー API エンドポイント定義
// =============================================================================

/**
 * 使用量管理 API エンドポイント
 */
export const USAGE_API_ENDPOINTS = {
  /** クレジット残量を取得 */
  getBalance: '/api/ai/credits/balance',
  /** AI 使用をログに記録（1クレジット消費） */
  consumeCredit: '/api/ai/credits/consume',
  /** 使用履歴を取得 */
  getUsageHistory: '/api/ai/usage/history',
  /** アドオンパック購入 */
  purchaseAddon: '/api/ai/addon/purchase',
  /** アドオンパック一覧取得 */
  getAddonPacks: '/api/ai/addon/list',
} as const;

// =============================================================================
// エクスポート
// =============================================================================

export default {
  // 定義データ
  AI_QUOTA_BY_PLAN,
  AI_ADDON_PACKS,
  AI_ADDON_PACKS_USD,
  USAGE_API_ENDPOINTS,
  DB_SCHEMA_REFERENCE,
  RPC_FUNCTIONS_REFERENCE,

  // クレジット計算
  getAiQuota,
  isAiEnabledForPlan,
  getBaseCredits,
  isUnlimitedPlan,
  getModelTier,
  getAllowedModels,
  isModelAllowedForTier,
  getRequiredTierForModel,
  calculateCreditBalance,
  checkAiUsage,
  determineCreditSource,

  // 表示
  getCreditStatusMessage,
  getCreditWarningLevel,
};
