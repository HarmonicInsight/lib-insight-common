/**
 * API Gateway リクエスト検証
 *
 * 入力バリデーション・サニタイズ
 * SQLインジェクション/XSS対策
 */

import type { ValidationSchema, ValidationRule } from './types';

// ========================================
// バリデーション結果
// ========================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  sanitized?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
}

// ========================================
// バリデーション実行
// ========================================

export function validate(
  data: unknown,
  schema: ValidationSchema
): ValidationResult {
  const errors: ValidationError[] = [];
  const sanitized: Record<string, unknown> = {};

  if (typeof data !== 'object' || data === null) {
    return {
      valid: false,
      errors: [{ field: 'root', rule: 'type', message: 'オブジェクトが必要です' }],
    };
  }

  const obj = data as Record<string, unknown>;

  // 必須チェック
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
        errors.push({
          field,
          rule: 'required',
          message: `${field} は必須です`,
        });
      }
    }
  }

  // プロパティ検証
  for (const [field, rule] of Object.entries(schema.properties)) {
    const value = obj[field];

    // 存在しない場合はスキップ（requiredで別途チェック済み）
    if (value === undefined || value === null) {
      continue;
    }

    const fieldErrors = validateField(field, value, rule);
    errors.push(...fieldErrors);

    if (fieldErrors.length === 0) {
      // サニタイズ済みの値をセット
      sanitized[field] = sanitizeValue(value, rule);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined,
  };
}

// ========================================
// フィールド検証
// ========================================

function validateField(
  field: string,
  value: unknown,
  rule: ValidationRule
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 型チェック
  const actualType = Array.isArray(value) ? 'array' : typeof value;
  if (rule.type !== actualType) {
    errors.push({
      field,
      rule: 'type',
      message: `${field} は ${rule.type} 型である必要があります`,
    });
    return errors; // 型が違う場合は以降のチェックをスキップ
  }

  // 文字列検証
  if (rule.type === 'string' && typeof value === 'string') {
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      errors.push({
        field,
        rule: 'minLength',
        message: `${field} は ${rule.minLength} 文字以上必要です`,
      });
    }
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      errors.push({
        field,
        rule: 'maxLength',
        message: `${field} は ${rule.maxLength} 文字以下にしてください`,
      });
    }
    if (rule.pattern) {
      const regex = new RegExp(rule.pattern);
      if (!regex.test(value)) {
        errors.push({
          field,
          rule: 'pattern',
          message: `${field} の形式が不正です`,
        });
      }
    }
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field,
        rule: 'enum',
        message: `${field} は ${rule.enum.join(', ')} のいずれかである必要があります`,
      });
    }
  }

  // 数値検証
  if (rule.type === 'number' && typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      errors.push({
        field,
        rule: 'min',
        message: `${field} は ${rule.min} 以上である必要があります`,
      });
    }
    if (rule.max !== undefined && value > rule.max) {
      errors.push({
        field,
        rule: 'max',
        message: `${field} は ${rule.max} 以下である必要があります`,
      });
    }
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field,
        rule: 'enum',
        message: `${field} は ${rule.enum.join(', ')} のいずれかである必要があります`,
      });
    }
  }

  // 配列検証
  if (rule.type === 'array' && Array.isArray(value) && rule.items) {
    for (let i = 0; i < value.length; i++) {
      const itemErrors = validateField(`${field}[${i}]`, value[i], rule.items);
      errors.push(...itemErrors);
    }
  }

  return errors;
}

// ========================================
// サニタイズ
// ========================================

function sanitizeValue(value: unknown, rule: ValidationRule): unknown {
  if (rule.type === 'string' && typeof value === 'string') {
    return sanitizeString(value);
  }

  if (rule.type === 'array' && Array.isArray(value) && rule.items) {
    return value.map(item => sanitizeValue(item, rule.items!));
  }

  return value;
}

export function sanitizeString(input: string): string {
  // 基本的なXSS対策
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// ========================================
// 危険な入力検出
// ========================================

const DANGEROUS_PATTERNS = [
  // SQLインジェクション
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b.*\b(FROM|INTO|SET|TABLE|WHERE)\b)/i,
  /';\s*--/i,
  /;\s*DROP\s+TABLE/i,

  // XSS
  /<script\b[^>]*>/i,
  /javascript:/i,
  /on\w+\s*=/i,

  // パストラバーサル
  /\.\.\//g,
  /\.\.\\/ ,

  // コマンドインジェクション
  /[;&|`$]/,
];

export function containsDangerousInput(input: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(input));
}

export function detectDangerousInputs(
  obj: Record<string, unknown>
): string[] {
  const dangerous: string[] = [];

  function check(value: unknown, path: string) {
    if (typeof value === 'string') {
      if (containsDangerousInput(value)) {
        dangerous.push(path);
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => check(item, `${path}[${i}]`));
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([key, val]) => {
        check(val, path ? `${path}.${key}` : key);
      });
    }
  }

  check(obj, '');
  return dangerous;
}

// ========================================
// よく使うスキーマ
// ========================================

export const CommonSchemas = {
  // ページネーション
  pagination: {
    type: 'object' as const,
    properties: {
      page: { type: 'number' as const, min: 1 },
      limit: { type: 'number' as const, min: 1, max: 100 },
    },
  },

  // ID
  id: {
    type: 'object' as const,
    required: ['id'],
    properties: {
      id: { type: 'string' as const, pattern: '^[a-f0-9-]{36}$' },
    },
  },

  // 検索
  search: {
    type: 'object' as const,
    required: ['query'],
    properties: {
      query: { type: 'string' as const, minLength: 1, maxLength: 500 },
      limit: { type: 'number' as const, min: 1, max: 100 },
    },
  },
};
