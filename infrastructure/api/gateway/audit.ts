/**
 * API Gateway 監査ログ
 *
 * セキュリティ・コンプライアンス用の監査証跡
 * Supabaseに記録 + オプションでログサービス連携
 */

import { createClient } from '@supabase/supabase-js';
import type { GatewayRequest, AuditLogEntry } from './types';
import { getClientIP } from './rate-limit';

// ========================================
// Supabaseクライアント
// ========================================

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ========================================
// 監査ログ記録
// ========================================

export interface AuditLogOptions {
  level: 'basic' | 'full';
  includeBody?: boolean;
  includeQuery?: boolean;
  maskFields?: string[];   // ['password', 'token']
}

const DEFAULT_OPTIONS: AuditLogOptions = {
  level: 'basic',
  includeBody: false,
  includeQuery: true,
  maskFields: ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization'],
};

export async function logAudit(
  req: GatewayRequest,
  statusCode: number,
  error?: string,
  options: Partial<AuditLogOptions> = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const entry: AuditLogEntry = {
    id: req.requestId,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,

    // Who
    userId: req.user?.userId || null,
    apiKeyId: req.apiKey?.keyId || null,
    ipAddress: getClientIP(req),
    userAgent: (req.headers['user-agent'] as string) || '',

    // What
    method: req.method || 'UNKNOWN',
    path: req.url || '',
    query: opts.includeQuery ? maskSensitive(req.query, opts.maskFields!) : undefined,
    body: opts.level === 'full' && opts.includeBody
      ? maskSensitive(req.body, opts.maskFields!)
      : undefined,

    // Result
    statusCode,
    duration: Date.now() - req.startTime,
    error,
  };

  // 非同期で記録（APIレスポンスを遅延させない）
  recordAuditLog(entry).catch(err => {
    console.error('Failed to record audit log:', err);
  });
}

async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  const supabase = getSupabase();

  // Supabaseに記録
  const { error } = await supabase
    .from('audit_logs')
    .insert(entry);

  if (error) {
    console.error('Supabase audit log error:', error);
  }

  // 外部ログサービス連携（オプション）
  if (process.env.AUDIT_LOG_WEBHOOK) {
    await sendToWebhook(entry);
  }
}

// ========================================
// 外部連携
// ========================================

async function sendToWebhook(entry: AuditLogEntry): Promise<void> {
  const webhookUrl = process.env.AUDIT_LOG_WEBHOOK;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch (err) {
    console.error('Webhook delivery failed:', err);
  }
}

// ========================================
// センシティブデータマスク
// ========================================

function maskSensitive(
  obj: Record<string, unknown> | undefined,
  fieldsToMask: string[]
): Record<string, unknown> | undefined {
  if (!obj) return undefined;

  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // マスク対象フィールド
    if (fieldsToMask.some(f => lowerKey.includes(f.toLowerCase()))) {
      masked[key] = '[REDACTED]';
    }
    // ネストしたオブジェクト
    else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      masked[key] = maskSensitive(value as Record<string, unknown>, fieldsToMask);
    }
    // そのまま
    else {
      masked[key] = value;
    }
  }

  return masked;
}

// ========================================
// 監査ログ検索
// ========================================

export interface AuditLogQuery {
  userId?: string;
  apiKeyId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export async function queryAuditLogs(
  query: AuditLogQuery
): Promise<AuditLogEntry[]> {
  const supabase = getSupabase();

  let q = supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false });

  if (query.userId) {
    q = q.eq('user_id', query.userId);
  }
  if (query.apiKeyId) {
    q = q.eq('api_key_id', query.apiKeyId);
  }
  if (query.method) {
    q = q.eq('method', query.method);
  }
  if (query.path) {
    q = q.ilike('path', `%${query.path}%`);
  }
  if (query.statusCode) {
    q = q.eq('status_code', query.statusCode);
  }
  if (query.startDate) {
    q = q.gte('timestamp', query.startDate);
  }
  if (query.endDate) {
    q = q.lte('timestamp', query.endDate);
  }

  q = q.range(
    query.offset || 0,
    (query.offset || 0) + (query.limit || 100) - 1
  );

  const { data, error } = await q;

  if (error) {
    throw new Error(`Failed to query audit logs: ${error.message}`);
  }

  return data || [];
}

// ========================================
// セキュリティイベント
// ========================================

export type SecurityEventType =
  | 'auth_failure'
  | 'rate_limit_exceeded'
  | 'suspicious_input'
  | 'unauthorized_access'
  | 'api_key_revoked'
  | 'brute_force_detected';

export async function logSecurityEvent(
  req: GatewayRequest,
  eventType: SecurityEventType,
  details: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabase();

  const event = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    request_id: req.requestId,
    event_type: eventType,
    ip_address: getClientIP(req),
    user_agent: req.headers['user-agent'] || '',
    user_id: req.user?.userId || null,
    details,
  };

  const { error } = await supabase
    .from('security_events')
    .insert(event);

  if (error) {
    console.error('Security event log failed:', error);
  }

  // 重大イベントは即時通知
  if (['brute_force_detected', 'suspicious_input'].includes(eventType)) {
    await notifySecurityTeam(event);
  }
}

async function notifySecurityTeam(event: Record<string, unknown>): Promise<void> {
  const webhookUrl = process.env.SECURITY_ALERT_WEBHOOK;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Security Alert: ${event.event_type}`,
        ...event,
      }),
    });
  } catch (err) {
    console.error('Security notification failed:', err);
  }
}
