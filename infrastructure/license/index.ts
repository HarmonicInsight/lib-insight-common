/**
 * Harmonic Insight 統合ライセンスモジュール
 *
 * サーバーサイド・クライアントサイド両方で利用可能な
 * ライセンス管理機能を提供
 *
 * ## 使用方法
 *
 * ### サーバーサイド
 * ```typescript
 * const checker = new ServerLicenseChecker(supabase, 'INMV');
 * const canUse = await checker.checkFeature(userId, 'subtitle');
 * ```
 *
 * ### クライアントサイド
 * ```typescript
 * const manager = new ClientLicenseManager('INMV');
 * const canUse = await manager.canUseFeature('subtitle');
 * ```
 */

import {
  ProductCode,
  PlanCode,
  PlanLimits,
  FeatureDefinition,
  ProductOrCommon,
  PRODUCTS,
  PLANS,
  PRODUCT_FEATURES,
  COMMON_FEATURES,
  DEFAULT_PLAN_LIMITS,
  PRODUCT_PLAN_LIMITS,
  // 推奨API
  checkFeature,
  checkProductFeature,
  checkCommonFeature,
  getFeatureLimit,
  getRequiredPlan,
  getProductFeatures,
  getFeatureDefinition,
  getCommonFeatureDefinition,
  getProductFeatureMatrix,
  getPlanLimits,
  isPlanAtLeast,
  // 後方互換
  FEATURE_MATRIX,
  canAccessFeature,
} from '../../config/products';

// Re-export all from config/products
export {
  ProductCode,
  PlanCode,
  PlanLimits,
  FeatureDefinition,
  ProductOrCommon,
  PRODUCTS,
  PLANS,
  PRODUCT_FEATURES,
  COMMON_FEATURES,
  DEFAULT_PLAN_LIMITS,
  PRODUCT_PLAN_LIMITS,
  // 推奨API
  checkFeature,
  checkProductFeature,
  checkCommonFeature,
  getFeatureLimit,
  getRequiredPlan,
  getProductFeatures,
  getFeatureDefinition,
  getCommonFeatureDefinition,
  getProductFeatureMatrix,
  getPlanLimits,
  isPlanAtLeast,
  // 後方互換
  FEATURE_MATRIX,
  canAccessFeature,
};

// =============================================================================
// 型定義
// =============================================================================

export interface LicenseInfo {
  productCode: ProductCode;
  plan: PlanCode;
  isActive: boolean;
  expiresAt: Date | null;
  activatedAt: Date | null;
}

export interface LicenseCheckResult {
  isValid: boolean;
  license: LicenseInfo | null;
  limits: PlanLimits;
  reason?: string;
}

export interface FeatureCheckResult {
  allowed: boolean;
  plan: PlanCode;
  requiredPlan?: PlanCode;
  reason?: string;
}

export interface UsageInfo {
  current: number;
  limit: number;
  remaining: number;
  resetAt: Date;
}

// =============================================================================
// ライセンスチェッカー（サーバーサイド用）
// =============================================================================

/**
 * サーバーサイドライセンスチェッカー
 *
 * Supabaseを使用してライセンス情報を検証
 */
export class ServerLicenseChecker {
  private supabase: any;
  private productCode: ProductCode;

  constructor(supabase: any, productCode: ProductCode) {
    this.supabase = supabase;
    this.productCode = productCode;
  }

  /**
   * ユーザーのライセンスを取得
   */
  async getLicense(userId: string): Promise<LicenseInfo | null> {
    const { data: license, error } = await this.supabase
      .from('licenses')
      .select('*')
      .eq('user_id', userId)
      .eq('product_code', this.productCode)
      .single();

    if (error || !license) {
      return null;
    }

    return {
      productCode: license.product_code,
      plan: license.plan,
      isActive: license.is_active,
      expiresAt: license.expires_at ? new Date(license.expires_at) : null,
      activatedAt: license.activated_at ? new Date(license.activated_at) : null,
    };
  }

  /**
   * ライセンスの有効性をチェック
   */
  async checkLicense(userId: string): Promise<LicenseCheckResult> {
    const license = await this.getLicense(userId);

    // ライセンスなし → FREEプラン
    if (!license) {
      return {
        isValid: true,
        license: null,
        limits: getPlanLimits(this.productCode, 'FREE'),
        reason: 'No license found, using FREE plan',
      };
    }

    // 無効化されている
    if (!license.isActive) {
      return {
        isValid: false,
        license,
        limits: getPlanLimits(this.productCode, 'FREE'),
        reason: 'License has been deactivated',
      };
    }

    // 期限切れ
    if (license.expiresAt && license.expiresAt < new Date()) {
      return {
        isValid: false,
        license,
        limits: getPlanLimits(this.productCode, 'FREE'),
        reason: 'License has expired',
      };
    }

    // 有効
    return {
      isValid: true,
      license,
      limits: getPlanLimits(this.productCode, license.plan),
    };
  }

  /**
   * 機能アクセスをチェック（製品固有 + 共通機能を自動判定）
   *
   * @param userId ユーザーID
   * @param featureKey 機能キー（製品プレフィックスなし: 'subtitle'）
   *
   * @example
   * // 製品固有機能
   * await checker.checkFeature(userId, 'subtitle');
   * // 共通機能
   * await checker.checkFeature(userId, 'api_access');
   */
  async checkFeatureAccess(userId: string, featureKey: string): Promise<FeatureCheckResult> {
    const result = await this.checkLicense(userId);
    const plan = result.license?.plan || 'FREE';

    // 統合API: 製品固有 + 共通機能を自動判定
    const allowed = checkFeature(this.productCode, featureKey, plan);
    const requiredPlan = getRequiredPlan(this.productCode, featureKey);

    return {
      allowed,
      plan,
      requiredPlan: allowed ? undefined : requiredPlan || undefined,
      reason: allowed ? undefined : `This feature requires ${requiredPlan} plan or higher`,
    };
  }

  /**
   * 機能アクセスをチェック（製品固有機能のみ）
   * @deprecated 新規実装では checkFeatureAccess を使用
   */
  async checkFeature(userId: string, featureKey: string): Promise<FeatureCheckResult> {
    return this.checkFeatureAccess(userId, featureKey);
  }

  /**
   * 機能の数値制限を取得
   * @param userId ユーザーID
   * @param featureKey 機能キー
   * @returns 制限値（-1 = 無制限、null = 制限機能ではない）
   */
  async getFeatureLimit(userId: string, featureKey: string): Promise<number | null> {
    const result = await this.checkLicense(userId);
    const plan = result.license?.plan || 'FREE';
    return getFeatureLimit(this.productCode, featureKey, plan);
  }

  /**
   * 製品の全機能可否一覧を取得（UI表示用）
   */
  async getFeatureMatrix(userId: string): Promise<Array<{
    key: string;
    name: string;
    nameJa: string;
    enabled: boolean;
    limit: number | null;
  }>> {
    const result = await this.checkLicense(userId);
    const plan = result.license?.plan || 'FREE';
    return getProductFeatureMatrix(this.productCode, plan);
  }

  /**
   * 月間利用状況を取得
   */
  async getMonthlyUsage(userId: string): Promise<UsageInfo> {
    const result = await this.checkLicense(userId);
    const limits = result.limits;

    // 今月の開始日
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 利用回数をカウント
    const { count } = await this.supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('product_code', this.productCode)
      .gte('created_at', monthStart.toISOString())
      .lt('created_at', nextMonth.toISOString());

    const current = count || 0;
    const limit = limits.monthlyLimit;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - current);

    return {
      current,
      limit,
      remaining,
      resetAt: nextMonth,
    };
  }

  /**
   * 利用をログに記録
   */
  async logUsage(userId: string, action: string, metadata?: Record<string, any>): Promise<void> {
    await this.supabase.from('usage_logs').insert({
      user_id: userId,
      product_code: this.productCode,
      action,
      metadata,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * 月間制限内かチェック
   */
  async isWithinMonthlyLimit(userId: string): Promise<boolean> {
    const result = await this.checkLicense(userId);
    if (result.limits.monthlyLimit === -1) {
      return true; // 無制限
    }

    const usage = await this.getMonthlyUsage(userId);
    return usage.remaining > 0;
  }
}

// =============================================================================
// ライセンスチェッカー（クライアントサイド用）
// =============================================================================

export interface ClientLicenseState {
  plan: PlanCode;
  limits: PlanLimits;
  expiresAt: Date | null;
  usage: UsageInfo | null;
}

/**
 * クライアントサイドライセンス状態管理
 *
 * サーバーから取得したライセンス情報をキャッシュして利用
 */
export class ClientLicenseManager {
  private productCode: ProductCode;
  private state: ClientLicenseState | null = null;
  private apiBase: string;

  constructor(productCode: ProductCode, apiBase: string = '/api') {
    this.productCode = productCode;
    this.apiBase = apiBase;
  }

  /**
   * ライセンス情報を取得（キャッシュまたはサーバーから）
   */
  async getState(forceRefresh = false): Promise<ClientLicenseState> {
    if (this.state && !forceRefresh) {
      return this.state;
    }

    const response = await fetch(`${this.apiBase}/entitlement/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_code: this.productCode }),
      credentials: 'include',
    });

    if (!response.ok) {
      // エラー時はFREEプランとして扱う
      return this.getDefaultState();
    }

    const data = await response.json();
    this.state = {
      plan: data.plan || 'FREE',
      limits: data.limits || getPlanLimits(this.productCode, 'FREE'),
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      usage: data.usage || null,
    };

    return this.state;
  }

  /**
   * 機能が利用可能かチェック（製品固有 + 共通機能を自動判定）
   *
   * @param featureKey 機能キー（製品プレフィックスなし: 'subtitle'）
   *
   * @example
   * // 製品固有機能
   * await manager.canUseFeature('subtitle');
   * // 共通機能
   * await manager.canUseFeature('api_access');
   */
  async canUseFeature(featureKey: string): Promise<boolean> {
    const state = await this.getState();
    return checkFeature(this.productCode, featureKey, state.plan);
  }

  /**
   * 機能の数値制限を取得
   * @returns 制限値（-1 = 無制限、null = 制限機能ではない）
   */
  async getFeatureLimit(featureKey: string): Promise<number | null> {
    const state = await this.getState();
    return getFeatureLimit(this.productCode, featureKey, state.plan);
  }

  /**
   * 製品の全機能可否一覧を取得（UI表示用）
   */
  getFeatureMatrix(): Array<{
    key: string;
    name: string;
    nameJa: string;
    enabled: boolean;
    limit: number | null;
  }> {
    const plan = this.state?.plan || 'FREE';
    return getProductFeatureMatrix(this.productCode, plan);
  }

  /**
   * 月間制限をチェック
   */
  async isWithinLimit(): Promise<boolean> {
    const state = await this.getState();
    if (state.limits.monthlyLimit === -1) return true;
    if (!state.usage) return true;
    return state.usage.remaining > 0;
  }

  /**
   * プランの制限を取得
   */
  async getLimits(): Promise<PlanLimits> {
    const state = await this.getState();
    return state.limits;
  }

  /**
   * 現在のプランを取得
   */
  async getPlan(): Promise<PlanCode> {
    const state = await this.getState();
    return state.plan;
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.state = null;
  }

  private getDefaultState(): ClientLicenseState {
    return {
      plan: 'FREE',
      limits: getPlanLimits(this.productCode, 'FREE'),
      expiresAt: null,
      usage: null,
    };
  }
}

// =============================================================================
// ユーティリティ関数
// =============================================================================

/**
 * プラン表示名を取得
 */
export function getPlanDisplayName(plan: PlanCode, locale: 'en' | 'ja' = 'ja'): string {
  const planInfo = PLANS[plan];
  return locale === 'ja' ? planInfo.nameJa : planInfo.name;
}

/**
 * 製品表示名を取得
 */
export function getProductDisplayName(product: ProductCode, locale: 'en' | 'ja' = 'ja'): string {
  const productInfo = PRODUCTS[product];
  return locale === 'ja' ? productInfo.nameJa : productInfo.name;
}

/**
 * アップグレードが必要なプランを取得
 * @deprecated config/products.ts の getRequiredPlan を使用
 */
export function getRequiredPlanForProductFeature(product: ProductCode, featureKey: string): PlanCode | null {
  return getRequiredPlan(product, featureKey);
}

/**
 * アップグレードが必要なプランを取得（後方互換）
 * @deprecated config/products.ts の getRequiredPlan を使用
 */
export function getRequiredPlanForFeature(feature: string): PlanCode | null {
  const allowedPlans = FEATURE_MATRIX[feature];
  if (!allowedPlans || allowedPlans.length === 0) return null;

  return allowedPlans.reduce((min, plan) => {
    return PLANS[plan].priority < PLANS[min].priority ? plan : min;
  });
}

/**
 * 残り日数を計算
 */
export function getDaysRemaining(expiresAt: Date | null): number {
  if (!expiresAt) return -1; // 無期限
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * ライセンスステータスメッセージを取得
 */
export function getLicenseStatusMessage(
  license: LicenseInfo | null,
  locale: 'en' | 'ja' = 'ja'
): string {
  if (!license) {
    return locale === 'ja' ? 'フリープランをご利用中' : 'Using Free plan';
  }

  if (!license.isActive) {
    return locale === 'ja' ? 'ライセンスが無効化されています' : 'License has been deactivated';
  }

  if (license.expiresAt && license.expiresAt < new Date()) {
    return locale === 'ja' ? 'ライセンスの有効期限が切れています' : 'License has expired';
  }

  const days = getDaysRemaining(license.expiresAt);
  const planName = getPlanDisplayName(license.plan, locale);

  if (days === -1) {
    return locale === 'ja'
      ? `${planName}プランをご利用中`
      : `Using ${planName} plan`;
  }

  if (days <= 30) {
    return locale === 'ja'
      ? `${planName}プラン（残り${days}日）`
      : `${planName} plan (${days} days remaining)`;
  }

  return locale === 'ja'
    ? `${planName}プランをご利用中`
    : `Using ${planName} plan`;
}

// =============================================================================
// デフォルトエクスポート
// =============================================================================

export default {
  ServerLicenseChecker,
  ClientLicenseManager,
  // ユーティリティ
  getPlanDisplayName,
  getProductDisplayName,
  getRequiredPlanForProductFeature,
  getRequiredPlanForFeature,  // @deprecated
  getDaysRemaining,
  getLicenseStatusMessage,
};
