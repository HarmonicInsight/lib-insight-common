/**
 * API Gateway 型定義
 *
 * 全APIで共通使用する型
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// ========================================
// リクエスト拡張
// ========================================

export interface AuthenticatedUser {
  uid: string;          // Firebase UID
  userId: string;       // Supabase users.id (UUID)
  email: string | null;
  displayName: string | null;
  plan: string;         // TRIAL | STD | PRO | ENT
  tenantId: string | null;
}

export interface ApiKeyInfo {
  keyId: string;
  name: string;
  scopes: string[];     // ['read', 'write', 'admin']
  tenantId: string | null;
  rateLimit: number;    // requests per minute
}

export interface GatewayRequest extends NextApiRequest {
  // 認証情報（Firebase Token認証後にセット）
  user?: AuthenticatedUser;

  // APIキー情報（APIキー認証後にセット）
  apiKey?: ApiKeyInfo;

  // リクエストID（トレーシング用）
  requestId: string;

  // リクエスト開始時刻
  startTime: number;
}

// ========================================
// レスポンス
// ========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  duration?: number;
}

// ========================================
// ミドルウェア
// ========================================

export type MiddlewareResult =
  | { proceed: true }
  | { proceed: false; status: number; body: ApiResponse };

export type Middleware = (
  req: GatewayRequest,
  res: NextApiResponse
) => Promise<MiddlewareResult>;

export interface MiddlewareOptions {
  // 認証
  requireAuth?: boolean;          // Firebase Token必須
  requireApiKey?: boolean;        // APIキー必須
  allowEither?: boolean;          // どちらかでOK

  // 認可
  requiredPlan?: string[];        // ['PRO', 'ENT']
  requiredScopes?: string[];      // ['read', 'write']

  // レート制限
  rateLimit?: number;             // requests per minute
  rateLimitKey?: 'user' | 'ip' | 'apiKey';

  // 検証
  validateBody?: ValidationSchema;
  validateQuery?: ValidationSchema;

  // 監査
  audit?: boolean;                // 監査ログ記録
  auditLevel?: 'basic' | 'full';  // full: リクエストボディも記録
}

// ========================================
// バリデーション
// ========================================

export interface ValidationSchema {
  type: 'object';
  required?: string[];
  properties: Record<string, ValidationRule>;
}

export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: (string | number)[];
  items?: ValidationRule;
}

// ========================================
// 監査ログ
// ========================================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  requestId: string;

  // Who
  userId: string | null;
  apiKeyId: string | null;
  ipAddress: string;
  userAgent: string;

  // What
  method: string;
  path: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;

  // Result
  statusCode: number;
  duration: number;
  error?: string;
}

// ========================================
// レート制限
// ========================================

export interface RateLimitInfo {
  key: string;
  limit: number;
  remaining: number;
  resetAt: number;
}

// ========================================
// APIキー
// ========================================

export interface CreateApiKeyRequest {
  name: string;
  scopes: string[];
  expiresAt?: string;
}

export interface ApiKeyRecord {
  id: string;
  user_id: string;
  tenant_id: string | null;
  name: string;
  key_hash: string;
  key_prefix: string;   // 表示用（例: "hsk_abc..."）
  scopes: string[];
  rate_limit: number;
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}
