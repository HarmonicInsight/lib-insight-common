/**
 * API Gateway レート制限
 *
 * Redis優先、なければインメモリ（開発用）
 * Supabaseにも使用量記録（月次制限用）
 */

import type { GatewayRequest } from './types';
import type { RateLimitInfo } from './types';

// ========================================
// レート制限設定
// ========================================

export interface RateLimitConfig {
  // リクエスト制限
  requestsPerMinute: number;
  requestsPerHour?: number;
  requestsPerDay?: number;

  // バースト許容
  burstLimit?: number;

  // プラン別オーバーライド
  planOverrides?: Record<string, Partial<RateLimitConfig>>;
}

// デフォルト設定
export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  FREE: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 500,
    burstLimit: 3,
  },
  TRIAL: {
    requestsPerMinute: 20,
    requestsPerHour: 200,
    requestsPerDay: 1000,
    burstLimit: 5,
  },
  BIZ: {
    requestsPerMinute: 120,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    burstLimit: 30,
  },
  ENT: {
    requestsPerMinute: 600,
    requestsPerHour: 30000,
    requestsPerDay: 500000,
    burstLimit: 100,
  },
};

// ========================================
// インメモリストア（開発/フォールバック用）
// ========================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// グローバルストア（サーバー再起動でリセット）
const memoryStore = new Map<string, RateLimitEntry>();

// 期限切れエントリのクリーンアップ
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetAt < now) {
      memoryStore.delete(key);
    }
  }
}, 60000); // 1分ごと

// ========================================
// レート制限チェック
// ========================================

export interface CheckRateLimitOptions {
  key: string;           // ユーザーID, IP, APIキーIDなど
  limit: number;         // 上限
  windowMs: number;      // ウィンドウ（ミリ秒）
  useRedis?: boolean;    // Redis使用（要環境変数）
}

export async function checkRateLimit(
  options: CheckRateLimitOptions
): Promise<RateLimitInfo> {
  const { key, limit, windowMs, useRedis = false } = options;

  // Redis使用する場合
  if (useRedis && process.env.REDIS_URL) {
    return checkRateLimitRedis(key, limit, windowMs);
  }

  // インメモリ
  return checkRateLimitMemory(key, limit, windowMs);
}

// インメモリ版
function checkRateLimitMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitInfo {
  const now = Date.now();
  const resetAt = now + windowMs;

  let entry = memoryStore.get(key);

  // 新規 or 期限切れ
  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt };
    memoryStore.set(key, entry);
    return {
      key,
      limit,
      remaining: limit - 1,
      resetAt,
    };
  }

  // カウント増加
  entry.count++;
  memoryStore.set(key, entry);

  return {
    key,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

// Redis版（オプション）
async function checkRateLimitRedis(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitInfo> {
  // Redis未設定時はインメモリへフォールバック
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not set, falling back to memory store');
    return checkRateLimitMemory(key, limit, windowMs);
  }

  // 動的インポート（Redisが入っていない環境でもエラーにならない）
  try {
    const Redis = (await import('ioredis')).default;
    const redis = new Redis(process.env.REDIS_URL);

    const redisKey = `ratelimit:${key}`;
    const now = Date.now();
    const windowSec = Math.ceil(windowMs / 1000);

    // Luaスクリプトでアトミックに実行
    const script = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      local ttl = redis.call('TTL', KEYS[1])
      return {current, ttl}
    `;

    const result = await redis.eval(script, 1, redisKey, windowSec) as [number, number];
    await redis.quit();

    const [count, ttl] = result;
    const resetAt = now + (ttl * 1000);

    return {
      key,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    };
  } catch (error) {
    console.error('Redis rate limit error, falling back to memory:', error);
    return checkRateLimitMemory(key, limit, windowMs);
  }
}

// ========================================
// ミドルウェア用ヘルパー
// ========================================

export function getRateLimitForPlan(plan: string): RateLimitConfig {
  return DEFAULT_RATE_LIMITS[plan] || DEFAULT_RATE_LIMITS.TRIAL;
}

export function getRateLimitKey(
  req: GatewayRequest,
  keyType: 'user' | 'ip' | 'apiKey'
): string {
  switch (keyType) {
    case 'user':
      return req.user?.uid || getClientIP(req);
    case 'apiKey':
      return req.apiKey?.keyId || getClientIP(req);
    case 'ip':
    default:
      return getClientIP(req);
  }
}

export function getClientIP(req: GatewayRequest): string {
  // Vercel/Cloudflare対応
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const cfConnecting = req.headers['cf-connecting-ip'];

  if (typeof cfConnecting === 'string') return cfConnecting;
  if (typeof realIP === 'string') return realIP;
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();

  return req.socket?.remoteAddress || 'unknown';
}

// ========================================
// レスポンスヘッダー設定
// ========================================

export function setRateLimitHeaders(
  res: { setHeader: (name: string, value: string | number) => void },
  info: RateLimitInfo
): void {
  res.setHeader('X-RateLimit-Limit', info.limit);
  res.setHeader('X-RateLimit-Remaining', info.remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(info.resetAt / 1000));
}
