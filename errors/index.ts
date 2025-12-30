/**
 * Insight Series 共通エラー定義 - TypeScript
 */

// ============== エラーコード ==============

export const ErrorCode = {
  // 一般
  UNKNOWN: 'UNKNOWN',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // ネットワーク
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',

  // 認証・認可
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // ライセンス
  LICENSE_REQUIRED: 'LICENSE_REQUIRED',
  LICENSE_INVALID: 'LICENSE_INVALID',
  LICENSE_EXPIRED: 'LICENSE_EXPIRED',
  FEATURE_LOCKED: 'FEATURE_LOCKED',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',

  // ファイル
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED: 'FILE_ACCESS_DENIED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_INVALID_TYPE: 'FILE_INVALID_TYPE',
  FILE_CORRUPTED: 'FILE_CORRUPTED',

  // データ
  DATA_INVALID: 'DATA_INVALID',
  DATA_CONFLICT: 'DATA_CONFLICT',
  DATA_IMPORT_FAILED: 'DATA_IMPORT_FAILED',
  DATA_EXPORT_FAILED: 'DATA_EXPORT_FAILED',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// ============== エラークラス ==============

/**
 * Insight 共通エラー
 */
export class InsightError extends Error {
  readonly code: ErrorCodeType;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;

  constructor(
    code: ErrorCodeType,
    message: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'InsightError';
    this.code = code;
    this.details = options?.details;
    this.cause = options?.cause;

    // Error.captureStackTrace が利用可能な場合のみ使用
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InsightError);
    }
  }

  /**
   * エラーをJSON形式に変換
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }

  /**
   * ログ出力用の文字列
   */
  toString(): string {
    return `[${this.code}] ${this.message}`;
  }
}

// ============== 専用エラークラス ==============

/**
 * ライセンスエラー
 */
export class LicenseError extends InsightError {
  constructor(
    code: 'LICENSE_REQUIRED' | 'LICENSE_INVALID' | 'LICENSE_EXPIRED' | 'FEATURE_LOCKED' | 'LIMIT_EXCEEDED',
    message: string,
    details?: Record<string, unknown>
  ) {
    super(code, message, { details });
    this.name = 'LicenseError';
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends InsightError {
  readonly field?: string;
  readonly errors: Array<{ field: string; message: string }>;

  constructor(
    errors: Array<{ field: string; message: string }>,
    message = 'Validation failed'
  ) {
    super(ErrorCode.VALIDATION, message, { details: { errors } });
    this.name = 'ValidationError';
    this.errors = errors;
    this.field = errors[0]?.field;
  }
}

/**
 * ネットワークエラー
 */
export class NetworkError extends InsightError {
  readonly statusCode?: number;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      cause?: Error;
    }
  ) {
    const code = options?.statusCode
      ? options.statusCode >= 500
        ? ErrorCode.SERVER_ERROR
        : ErrorCode.NETWORK
      : ErrorCode.NETWORK;

    super(code, message, { cause: options?.cause });
    this.name = 'NetworkError';
    this.statusCode = options?.statusCode;
  }
}

/**
 * ファイルエラー
 */
export class FileError extends InsightError {
  readonly filePath?: string;

  constructor(
    code: 'FILE_NOT_FOUND' | 'FILE_ACCESS_DENIED' | 'FILE_TOO_LARGE' | 'FILE_INVALID_TYPE' | 'FILE_CORRUPTED',
    message: string,
    filePath?: string
  ) {
    super(code, message, { details: { filePath } });
    this.name = 'FileError';
    this.filePath = filePath;
  }
}

// ============== ヘルパー関数 ==============

/**
 * エラーをInsightErrorに変換
 */
export function toInsightError(error: unknown): InsightError {
  if (error instanceof InsightError) {
    return error;
  }

  if (error instanceof Error) {
    return new InsightError(ErrorCode.UNKNOWN, error.message, { cause: error });
  }

  return new InsightError(ErrorCode.UNKNOWN, String(error));
}

/**
 * エラーコードからユーザー向けメッセージを取得
 * （実際のメッセージはi18nを使用）
 */
export function getErrorMessageKey(code: ErrorCodeType): string {
  const keyMap: Record<ErrorCodeType, string> = {
    UNKNOWN: 'errors.unknown',
    VALIDATION: 'validation.error',
    NOT_FOUND: 'errors.notFound',
    ALREADY_EXISTS: 'errors.alreadyExists',
    NETWORK: 'errors.network',
    TIMEOUT: 'errors.timeout',
    SERVER_ERROR: 'errors.serverError',
    UNAUTHORIZED: 'errors.unauthorized',
    FORBIDDEN: 'errors.forbidden',
    SESSION_EXPIRED: 'auth.errors.sessionExpired',
    LICENSE_REQUIRED: 'license.errors.required',
    LICENSE_INVALID: 'license.errors.invalidFormat',
    LICENSE_EXPIRED: 'license.errors.expired',
    FEATURE_LOCKED: 'feature.locked',
    LIMIT_EXCEEDED: 'feature.limitReached',
    FILE_NOT_FOUND: 'file.errors.notFound',
    FILE_ACCESS_DENIED: 'file.errors.accessDenied',
    FILE_TOO_LARGE: 'file.errors.tooLarge',
    FILE_INVALID_TYPE: 'file.errors.invalidType',
    FILE_CORRUPTED: 'file.errors.corrupted',
    DATA_INVALID: 'errors.dataInvalid',
    DATA_CONFLICT: 'errors.dataConflict',
    DATA_IMPORT_FAILED: 'file.errors.uploadFailed',
    DATA_EXPORT_FAILED: 'file.errors.downloadFailed',
  };

  return keyMap[code] || 'errors.unknown';
}

/**
 * エラーがリトライ可能かどうか
 */
export function isRetryable(error: InsightError): boolean {
  const retryableCodes: ErrorCodeType[] = [
    ErrorCode.NETWORK,
    ErrorCode.TIMEOUT,
    ErrorCode.SERVER_ERROR,
  ];
  return retryableCodes.includes(error.code);
}

export default {
  ErrorCode,
  InsightError,
  LicenseError,
  ValidationError,
  NetworkError,
  FileError,
  toInsightError,
  getErrorMessageKey,
  isRetryable,
};
