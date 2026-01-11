/**
 * API Gateway エラー定義
 *
 * 統一されたエラーコードとレスポンス形式
 */

import type { NextApiResponse } from 'next';
import type { ApiResponse, ApiError, GatewayRequest } from './types';

// ========================================
// エラーコード定義
// ========================================

export const ErrorCodes = {
  // 認証 (1xxx)
  AUTH_REQUIRED: 'AUTH_001',
  AUTH_INVALID_TOKEN: 'AUTH_002',
  AUTH_EXPIRED_TOKEN: 'AUTH_003',
  AUTH_INVALID_API_KEY: 'AUTH_004',
  AUTH_EXPIRED_API_KEY: 'AUTH_005',
  AUTH_REVOKED_API_KEY: 'AUTH_006',

  // 認可 (2xxx)
  AUTHZ_INSUFFICIENT_PLAN: 'AUTHZ_001',
  AUTHZ_INSUFFICIENT_SCOPE: 'AUTHZ_002',
  AUTHZ_TENANT_MISMATCH: 'AUTHZ_003',
  AUTHZ_FEATURE_DISABLED: 'AUTHZ_004',

  // リクエスト (3xxx)
  REQ_METHOD_NOT_ALLOWED: 'REQ_001',
  REQ_VALIDATION_FAILED: 'REQ_002',
  REQ_MISSING_FIELD: 'REQ_003',
  REQ_INVALID_FORMAT: 'REQ_004',
  REQ_PAYLOAD_TOO_LARGE: 'REQ_005',

  // レート制限 (4xxx)
  RATE_LIMIT_EXCEEDED: 'RATE_001',
  RATE_LIMIT_QUOTA_EXCEEDED: 'RATE_002',

  // リソース (5xxx)
  RES_NOT_FOUND: 'RES_001',
  RES_ALREADY_EXISTS: 'RES_002',
  RES_CONFLICT: 'RES_003',

  // サーバー (9xxx)
  SERVER_ERROR: 'SRV_001',
  SERVER_UNAVAILABLE: 'SRV_002',
  SERVER_TIMEOUT: 'SRV_003',
  SERVER_DEPENDENCY_ERROR: 'SRV_004',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ========================================
// エラーメッセージ（日英対応）
// ========================================

const ErrorMessages: Record<ErrorCode, { en: string; ja: string }> = {
  // 認証
  [ErrorCodes.AUTH_REQUIRED]: {
    en: 'Authentication required',
    ja: '認証が必要です',
  },
  [ErrorCodes.AUTH_INVALID_TOKEN]: {
    en: 'Invalid authentication token',
    ja: '無効な認証トークンです',
  },
  [ErrorCodes.AUTH_EXPIRED_TOKEN]: {
    en: 'Authentication token has expired',
    ja: '認証トークンの有効期限が切れています',
  },
  [ErrorCodes.AUTH_INVALID_API_KEY]: {
    en: 'Invalid API key',
    ja: '無効なAPIキーです',
  },
  [ErrorCodes.AUTH_EXPIRED_API_KEY]: {
    en: 'API key has expired',
    ja: 'APIキーの有効期限が切れています',
  },
  [ErrorCodes.AUTH_REVOKED_API_KEY]: {
    en: 'API key has been revoked',
    ja: 'APIキーは無効化されています',
  },

  // 認可
  [ErrorCodes.AUTHZ_INSUFFICIENT_PLAN]: {
    en: 'Your plan does not include this feature',
    ja: 'ご利用のプランではこの機能は使用できません',
  },
  [ErrorCodes.AUTHZ_INSUFFICIENT_SCOPE]: {
    en: 'API key does not have required scope',
    ja: 'APIキーに必要な権限がありません',
  },
  [ErrorCodes.AUTHZ_TENANT_MISMATCH]: {
    en: 'Access denied to this resource',
    ja: 'このリソースへのアクセス権がありません',
  },
  [ErrorCodes.AUTHZ_FEATURE_DISABLED]: {
    en: 'This feature is currently disabled',
    ja: 'この機能は現在無効です',
  },

  // リクエスト
  [ErrorCodes.REQ_METHOD_NOT_ALLOWED]: {
    en: 'Method not allowed',
    ja: '許可されていないHTTPメソッドです',
  },
  [ErrorCodes.REQ_VALIDATION_FAILED]: {
    en: 'Request validation failed',
    ja: 'リクエストの検証に失敗しました',
  },
  [ErrorCodes.REQ_MISSING_FIELD]: {
    en: 'Required field is missing',
    ja: '必須フィールドがありません',
  },
  [ErrorCodes.REQ_INVALID_FORMAT]: {
    en: 'Invalid format',
    ja: '形式が不正です',
  },
  [ErrorCodes.REQ_PAYLOAD_TOO_LARGE]: {
    en: 'Request payload too large',
    ja: 'リクエストサイズが大きすぎます',
  },

  // レート制限
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: {
    en: 'Rate limit exceeded. Please try again later',
    ja: 'リクエスト制限を超えました。しばらく待ってからお試しください',
  },
  [ErrorCodes.RATE_LIMIT_QUOTA_EXCEEDED]: {
    en: 'Monthly quota exceeded',
    ja: '月間利用上限を超えました',
  },

  // リソース
  [ErrorCodes.RES_NOT_FOUND]: {
    en: 'Resource not found',
    ja: 'リソースが見つかりません',
  },
  [ErrorCodes.RES_ALREADY_EXISTS]: {
    en: 'Resource already exists',
    ja: 'リソースは既に存在します',
  },
  [ErrorCodes.RES_CONFLICT]: {
    en: 'Resource conflict',
    ja: 'リソースの競合が発生しました',
  },

  // サーバー
  [ErrorCodes.SERVER_ERROR]: {
    en: 'Internal server error',
    ja: 'サーバーエラーが発生しました',
  },
  [ErrorCodes.SERVER_UNAVAILABLE]: {
    en: 'Service temporarily unavailable',
    ja: 'サービスが一時的に利用できません',
  },
  [ErrorCodes.SERVER_TIMEOUT]: {
    en: 'Request timed out',
    ja: 'リクエストがタイムアウトしました',
  },
  [ErrorCodes.SERVER_DEPENDENCY_ERROR]: {
    en: 'Dependency service error',
    ja: '連携サービスでエラーが発生しました',
  },
};

// ========================================
// HTTPステータスコードマッピング
// ========================================

const ErrorStatusCodes: Record<ErrorCode, number> = {
  // 認証 → 401
  [ErrorCodes.AUTH_REQUIRED]: 401,
  [ErrorCodes.AUTH_INVALID_TOKEN]: 401,
  [ErrorCodes.AUTH_EXPIRED_TOKEN]: 401,
  [ErrorCodes.AUTH_INVALID_API_KEY]: 401,
  [ErrorCodes.AUTH_EXPIRED_API_KEY]: 401,
  [ErrorCodes.AUTH_REVOKED_API_KEY]: 401,

  // 認可 → 403
  [ErrorCodes.AUTHZ_INSUFFICIENT_PLAN]: 403,
  [ErrorCodes.AUTHZ_INSUFFICIENT_SCOPE]: 403,
  [ErrorCodes.AUTHZ_TENANT_MISMATCH]: 403,
  [ErrorCodes.AUTHZ_FEATURE_DISABLED]: 403,

  // リクエスト → 400/405
  [ErrorCodes.REQ_METHOD_NOT_ALLOWED]: 405,
  [ErrorCodes.REQ_VALIDATION_FAILED]: 400,
  [ErrorCodes.REQ_MISSING_FIELD]: 400,
  [ErrorCodes.REQ_INVALID_FORMAT]: 400,
  [ErrorCodes.REQ_PAYLOAD_TOO_LARGE]: 413,

  // レート制限 → 429
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCodes.RATE_LIMIT_QUOTA_EXCEEDED]: 429,

  // リソース → 404/409
  [ErrorCodes.RES_NOT_FOUND]: 404,
  [ErrorCodes.RES_ALREADY_EXISTS]: 409,
  [ErrorCodes.RES_CONFLICT]: 409,

  // サーバー → 500/503
  [ErrorCodes.SERVER_ERROR]: 500,
  [ErrorCodes.SERVER_UNAVAILABLE]: 503,
  [ErrorCodes.SERVER_TIMEOUT]: 504,
  [ErrorCodes.SERVER_DEPENDENCY_ERROR]: 502,
};

// ========================================
// エラーレスポンス生成
// ========================================

export function createError(
  code: ErrorCode,
  details?: Record<string, unknown>,
  lang: 'en' | 'ja' = 'ja'
): ApiError {
  const messages = ErrorMessages[code];
  return {
    code,
    message: lang === 'ja' ? messages.ja : messages.en,
    details,
  };
}

export function sendError(
  req: GatewayRequest,
  res: NextApiResponse,
  code: ErrorCode,
  details?: Record<string, unknown>,
  lang: 'en' | 'ja' = 'ja'
): void {
  const status = ErrorStatusCodes[code];
  const error = createError(code, details, lang);

  const response: ApiResponse = {
    success: false,
    error,
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration: Date.now() - req.startTime,
    },
  };

  res.status(status).json(response);
}

// ========================================
// 便利関数
// ========================================

export function sendSuccess<T>(
  req: GatewayRequest,
  res: NextApiResponse,
  data: T,
  status = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration: Date.now() - req.startTime,
    },
  };

  res.status(status).json(response);
}

export function getStatusForCode(code: ErrorCode): number {
  return ErrorStatusCodes[code];
}
