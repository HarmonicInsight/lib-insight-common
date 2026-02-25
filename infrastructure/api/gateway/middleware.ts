/**
 * API Gateway ミドルウェア
 *
 * 全APIエンドポイントで使用する共通ミドルウェアチェーン
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type {
  GatewayRequest,
  MiddlewareOptions,
  MiddlewareResult,
  ApiResponse,
  AuthenticatedUser,
} from './types';
import { ErrorCodes, sendError, sendSuccess } from './errors';
import { verifyRequest } from '../../auth/firebase-admin';
import { verifyApiKey, extractApiKey, hasAllScopes } from './api-keys';
import {
  checkRateLimit,
  getRateLimitKey,
  getRateLimitForPlan,
  setRateLimitHeaders,
} from './rate-limit';
import { validate, detectDangerousInputs } from './validator';
import { logAudit, logSecurityEvent } from './audit';
import { createClient } from '@supabase/supabase-js';

// ========================================
// リクエストID生成
// ========================================

function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `req_${timestamp}_${random}`;
}

// ========================================
// リクエスト拡張
// ========================================

function extendRequest(req: NextApiRequest): GatewayRequest {
  const extended = req as GatewayRequest;
  extended.requestId = generateRequestId();
  extended.startTime = Date.now();
  return extended;
}

// ========================================
// メインミドルウェア
// ========================================

export type ApiHandler<T = unknown> = (
  req: GatewayRequest,
  res: NextApiResponse
) => Promise<T | void>;

export function withGateway<T = unknown>(
  handler: ApiHandler<T>,
  options: MiddlewareOptions = {}
): (req: NextApiRequest, res: NextApiResponse) => Promise<void> {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const gReq = extendRequest(req);

    try {
      // 1. 認証チェック
      const authResult = await runAuthMiddleware(gReq, res, options);
      if (!authResult.proceed) {
        res.status(authResult.status).json(authResult.body);
        return;
      }

      // 2. レート制限チェック
      const rateResult = await runRateLimitMiddleware(gReq, res, options);
      if (!rateResult.proceed) {
        res.status(rateResult.status).json(rateResult.body);
        return;
      }

      // 3. 入力検証
      const validResult = await runValidationMiddleware(gReq, res, options);
      if (!validResult.proceed) {
        res.status(validResult.status).json(validResult.body);
        return;
      }

      // 4. ハンドラー実行
      const result = await handler(gReq, res);

      // 5. 監査ログ
      if (options.audit) {
        await logAudit(gReq, res.statusCode, undefined, {
          level: options.auditLevel || 'basic',
        });
      }

      // ハンドラーが直接レスポンスを送信していない場合
      if (result !== undefined && !res.writableEnded) {
        sendSuccess(gReq, res, result);
      }
    } catch (error) {
      console.error('Gateway error:', error);

      // エラー監査ログ
      if (options.audit) {
        await logAudit(gReq, 500, String(error), { level: 'full' });
      }

      sendError(gReq, res, ErrorCodes.SERVER_ERROR, {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

// ========================================
// 認証ミドルウェア
// ========================================

async function runAuthMiddleware(
  req: GatewayRequest,
  res: NextApiResponse,
  options: MiddlewareOptions
): Promise<MiddlewareResult> {
  const { requireAuth, requireApiKey, allowEither, requiredPlan, requiredScopes } = options;

  // 認証不要
  if (!requireAuth && !requireApiKey) {
    return { proceed: true };
  }

  const authHeader = req.headers.authorization as string | undefined;
  const apiKeyHeader = req.headers['x-api-key'] as string | undefined;

  let authenticated = false;

  // Firebase Token認証
  if (requireAuth || allowEither) {
    const result = await verifyRequest(authHeader);
    if (result.success && result.uid) {
      // Supabaseからユーザー情報取得
      const user = await getUserFromFirebaseUid(result.uid);
      if (user) {
        req.user = user;
        authenticated = true;
      }
    }
  }

  // APIキー認証
  if ((requireApiKey || allowEither) && !authenticated) {
    const apiKey = extractApiKey(apiKeyHeader || authHeader);
    if (apiKey) {
      const keyInfo = await verifyApiKey(apiKey);
      if (keyInfo) {
        req.apiKey = keyInfo;
        authenticated = true;
      }
    }
  }

  // 認証失敗
  if (!authenticated) {
    await logSecurityEvent(req, 'auth_failure', { method: req.method, path: req.url });
    return {
      proceed: false,
      status: 401,
      body: {
        success: false,
        error: {
          code: ErrorCodes.AUTH_REQUIRED,
          message: '認証が必要です',
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      },
    };
  }

  // プランチェック
  if (requiredPlan && requiredPlan.length > 0) {
    const userPlan = req.user?.plan || 'TRIAL';
    if (!requiredPlan.includes(userPlan)) {
      await logSecurityEvent(req, 'unauthorized_access', {
        requiredPlan,
        userPlan,
      });
      return {
        proceed: false,
        status: 403,
        body: {
          success: false,
          error: {
            code: ErrorCodes.AUTHZ_INSUFFICIENT_PLAN,
            message: 'ご利用のプランではこの機能は使用できません',
          },
          meta: {
            requestId: req.requestId,
            timestamp: new Date().toISOString(),
          },
        },
      };
    }
  }

  // スコープチェック（APIキー認証時）
  if (requiredScopes && requiredScopes.length > 0 && req.apiKey) {
    if (!hasAllScopes(req.apiKey, requiredScopes)) {
      await logSecurityEvent(req, 'unauthorized_access', {
        requiredScopes,
        actualScopes: req.apiKey.scopes,
      });
      return {
        proceed: false,
        status: 403,
        body: {
          success: false,
          error: {
            code: ErrorCodes.AUTHZ_INSUFFICIENT_SCOPE,
            message: 'APIキーに必要な権限がありません',
          },
          meta: {
            requestId: req.requestId,
            timestamp: new Date().toISOString(),
          },
        },
      };
    }
  }

  return { proceed: true };
}

// ========================================
// レート制限ミドルウェア
// ========================================

async function runRateLimitMiddleware(
  req: GatewayRequest,
  res: NextApiResponse,
  options: MiddlewareOptions
): Promise<MiddlewareResult> {
  const { rateLimit, rateLimitKey = 'user' } = options;

  // レート制限なし
  if (!rateLimit) {
    return { proceed: true };
  }

  // ユーザーのプランに応じた制限を取得
  const plan = req.user?.plan || 'TRIAL';
  const planLimits = getRateLimitForPlan(plan);

  // カスタム制限 or プラン制限
  const limit = rateLimit || planLimits.requestsPerMinute;
  const key = getRateLimitKey(req, rateLimitKey);

  const result = await checkRateLimit({
    key: `${req.url}:${key}`,
    limit,
    windowMs: 60000, // 1分
    useRedis: !!process.env.REDIS_URL,
  });

  // ヘッダー設定
  setRateLimitHeaders(res, result);

  if (result.remaining < 0) {
    await logSecurityEvent(req, 'rate_limit_exceeded', {
      key,
      limit,
      resetAt: result.resetAt,
    });

    return {
      proceed: false,
      status: 429,
      body: {
        success: false,
        error: {
          code: ErrorCodes.RATE_LIMIT_EXCEEDED,
          message: 'リクエスト制限を超えました。しばらく待ってからお試しください',
          details: {
            retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
          },
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      },
    };
  }

  return { proceed: true };
}

// ========================================
// 入力検証ミドルウェア
// ========================================

async function runValidationMiddleware(
  req: GatewayRequest,
  res: NextApiResponse,
  options: MiddlewareOptions
): Promise<MiddlewareResult> {
  const { validateBody, validateQuery } = options;

  // 危険な入力の検出
  const bodyDangerous = req.body ? detectDangerousInputs(req.body) : [];
  const queryDangerous = req.query ? detectDangerousInputs(req.query as Record<string, unknown>) : [];

  if (bodyDangerous.length > 0 || queryDangerous.length > 0) {
    await logSecurityEvent(req, 'suspicious_input', {
      body: bodyDangerous,
      query: queryDangerous,
    });

    return {
      proceed: false,
      status: 400,
      body: {
        success: false,
        error: {
          code: ErrorCodes.REQ_VALIDATION_FAILED,
          message: '不正な入力が検出されました',
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      },
    };
  }

  // スキーマ検証（ボディ）
  if (validateBody && req.body) {
    const result = validate(req.body, validateBody);
    if (!result.valid) {
      return {
        proceed: false,
        status: 400,
        body: {
          success: false,
          error: {
            code: ErrorCodes.REQ_VALIDATION_FAILED,
            message: 'リクエストの検証に失敗しました',
            details: { errors: result.errors },
          },
          meta: {
            requestId: req.requestId,
            timestamp: new Date().toISOString(),
          },
        },
      };
    }

    // サニタイズ済みデータで置換
    if (result.sanitized) {
      req.body = result.sanitized;
    }
  }

  // スキーマ検証（クエリ）
  if (validateQuery && req.query) {
    const result = validate(req.query, validateQuery);
    if (!result.valid) {
      return {
        proceed: false,
        status: 400,
        body: {
          success: false,
          error: {
            code: ErrorCodes.REQ_VALIDATION_FAILED,
            message: 'クエリパラメータの検証に失敗しました',
            details: { errors: result.errors },
          },
          meta: {
            requestId: req.requestId,
            timestamp: new Date().toISOString(),
          },
        },
      };
    }
  }

  return { proceed: true };
}

// ========================================
// ユーザー情報取得
// ========================================

async function getUserFromFirebaseUid(uid: string): Promise<AuthenticatedUser | null> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ユーザー + ライセンス + メンバーシップ情報を取得
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id,
      firebase_uid,
      email,
      display_name,
      licenses (
        plan,
        is_active,
        expires_at
      ),
      memberships (
        tenant_id,
        role
      )
    `)
    .eq('firebase_uid', uid)
    .single();

  if (error || !user) {
    return null;
  }

  // 有効なライセンスからプランを決定
  const activeLicense = (user.licenses as Array<{ plan: string; is_active: boolean; expires_at: string | null }>)?.find(
    l => l.is_active && (!l.expires_at || new Date(l.expires_at) > new Date())
  );

  // メンバーシップからテナントIDを取得（最初のメンバーシップを使用）
  const membership = (user.memberships as Array<{ tenant_id: string; role: string }> | null)?.[0] ?? null;

  return {
    uid: user.firebase_uid,
    userId: user.id,
    email: user.email,
    displayName: user.display_name,
    plan: activeLicense?.plan || 'TRIAL',
    tenantId: membership?.tenant_id ?? null,
  };
}

// ========================================
// HTTPメソッド制限ヘルパー
// ========================================

export function allowMethods(
  methods: string[]
): (req: GatewayRequest, res: NextApiResponse) => MiddlewareResult {
  return (req: GatewayRequest, res: NextApiResponse): MiddlewareResult => {
    if (!methods.includes(req.method || '')) {
      res.setHeader('Allow', methods.join(', '));
      return {
        proceed: false,
        status: 405,
        body: {
          success: false,
          error: {
            code: ErrorCodes.REQ_METHOD_NOT_ALLOWED,
            message: `許可されているメソッド: ${methods.join(', ')}`,
          },
          meta: {
            requestId: req.requestId,
            timestamp: new Date().toISOString(),
          },
        },
      };
    }
    return { proceed: true };
  };
}
