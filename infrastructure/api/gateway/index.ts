/**
 * API Gateway
 *
 * HARMONIC insight 全アプリ共通のAPIゲートウェイ
 *
 * 機能:
 *   - 認証 (Firebase Token / APIキー)
 *   - 認可 (プラン/スコープ)
 *   - レート制限
 *   - 入力検証・サニタイズ
 *   - 監査ログ
 *   - 統一エラーレスポンス
 *
 * 使用例:
 * ```typescript
 * import { withGateway, sendSuccess, sendError, ErrorCodes } from '@/infrastructure/api/gateway';
 *
 * export default withGateway(
 *   async (req, res) => {
 *     // req.user にユーザー情報がセット済み
 *     const { query } = req.body;
 *
 *     const results = await search(query);
 *     return results; // 自動でsendSuccessされる
 *   },
 *   {
 *     requireAuth: true,
 *     requiredPlan: ['PRO', 'ENT'],
 *     rateLimit: 60,
 *     audit: true,
 *     validateBody: {
 *       type: 'object',
 *       required: ['query'],
 *       properties: {
 *         query: { type: 'string', minLength: 1, maxLength: 500 },
 *       },
 *     },
 *   }
 * );
 * ```
 */

// ミドルウェア
export { withGateway, allowMethods } from './middleware';
export type { ApiHandler } from './middleware';

// 型定義
export type {
  GatewayRequest,
  AuthenticatedUser,
  ApiKeyInfo,
  ApiResponse,
  ApiError,
  ResponseMeta,
  MiddlewareOptions,
  MiddlewareResult,
  ValidationSchema,
  ValidationRule,
  AuditLogEntry,
  RateLimitInfo,
} from './types';

// エラー
export { ErrorCodes, createError, sendError, sendSuccess, getStatusForCode } from './errors';
export type { ErrorCode } from './errors';

// レート制限
export {
  checkRateLimit,
  getRateLimitForPlan,
  getRateLimitKey,
  getClientIP,
  setRateLimitHeaders,
  DEFAULT_RATE_LIMITS,
} from './rate-limit';
export type { RateLimitConfig, CheckRateLimitOptions } from './rate-limit';

// APIキー
export {
  generateApiKey,
  createApiKey,
  verifyApiKey,
  revokeApiKey,
  listApiKeys,
  hasScope,
  hasAllScopes,
  extractApiKey,
  VALID_SCOPES,
} from './api-keys';
export type { CreateKeyOptions, Scope } from './api-keys';

// バリデーション
export {
  validate,
  sanitizeString,
  containsDangerousInput,
  detectDangerousInputs,
  CommonSchemas,
} from './validator';
export type { ValidationResult, ValidationError } from './validator';

// 監査ログ
export {
  logAudit,
  queryAuditLogs,
  logSecurityEvent,
} from './audit';
export type { AuditLogOptions, AuditLogQuery, SecurityEventType } from './audit';
