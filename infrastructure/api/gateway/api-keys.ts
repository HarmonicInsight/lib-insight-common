/**
 * API Gateway APIキー管理
 *
 * Service-to-Service認証用のAPIキー
 * Enterprise顧客向け機能
 */

import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';
import type { ApiKeyInfo, ApiKeyRecord, CreateApiKeyRequest } from './types';

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
// APIキー生成
// ========================================

const API_KEY_PREFIX = 'hsk_';  // Harmonic Secret Key
const API_KEY_LENGTH = 32;       // 256 bits

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const rawKey = randomBytes(API_KEY_LENGTH).toString('base64url');
  const fullKey = `${API_KEY_PREFIX}${rawKey}`;
  const hash = hashApiKey(fullKey);
  const prefix = `${API_KEY_PREFIX}${rawKey.substring(0, 8)}...`;

  return { key: fullKey, hash, prefix };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// ========================================
// APIキーCRUD
// ========================================

export interface CreateKeyOptions extends CreateApiKeyRequest {
  userId: string;
  tenantId?: string;
  rateLimit?: number;
}

export async function createApiKey(
  options: CreateKeyOptions
): Promise<{ key: string; record: ApiKeyRecord }> {
  const supabase = getSupabase();
  const { key, hash, prefix } = generateApiKey();

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: options.userId,
      tenant_id: options.tenantId || null,
      name: options.name,
      key_hash: hash,
      key_prefix: prefix,
      scopes: options.scopes,
      rate_limit: options.rateLimit || 60,
      expires_at: options.expiresAt || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create API key: ${error.message}`);
  }

  // 秘密鍵は一度だけ返す（DBには保存しない）
  return { key, record: data };
}

export async function verifyApiKey(key: string): Promise<ApiKeyInfo | null> {
  const supabase = getSupabase();
  const hash = hashApiKey(key);

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', hash)
    .single();

  if (error || !data) {
    return null;
  }

  const record = data as ApiKeyRecord;

  // 無効チェック
  if (!record.is_active) {
    return null;
  }

  // 期限チェック
  if (record.expires_at && new Date(record.expires_at) < new Date()) {
    return null;
  }

  // last_used_at更新（非同期、待たない）
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', record.id)
    .then(() => {});

  return {
    keyId: record.id,
    name: record.name,
    scopes: record.scopes,
    tenantId: record.tenant_id,
    rateLimit: record.rate_limit,
  };
}

export async function revokeApiKey(keyId: string): Promise<boolean> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId);

  return !error;
}

export async function listApiKeys(
  userId: string
): Promise<Omit<ApiKeyRecord, 'key_hash'>[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, user_id, tenant_id, name, key_prefix, scopes, rate_limit, is_active, expires_at, last_used_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list API keys: ${error.message}`);
  }

  return data || [];
}

// ========================================
// スコープ検証
// ========================================

export const VALID_SCOPES = [
  'read',           // 読み取り
  'write',          // 書き込み
  'delete',         // 削除
  'admin',          // 管理操作
  'mart:read',      // マート読み取り
  'mart:write',     // マート書き込み
  'search',         // 検索
  'export',         // エクスポート
] as const;

export type Scope = typeof VALID_SCOPES[number];

export function hasScope(apiKey: ApiKeyInfo, requiredScope: string): boolean {
  // admin は全権限
  if (apiKey.scopes.includes('admin')) {
    return true;
  }

  // 完全一致
  if (apiKey.scopes.includes(requiredScope)) {
    return true;
  }

  // 親スコープチェック（例: write は read を含む）
  if (requiredScope === 'read' && apiKey.scopes.includes('write')) {
    return true;
  }

  // mart:read は read または mart:write に含まれる
  if (requiredScope === 'mart:read') {
    return apiKey.scopes.includes('mart:write') || apiKey.scopes.includes('read');
  }

  return false;
}

export function hasAllScopes(apiKey: ApiKeyInfo, requiredScopes: string[]): boolean {
  return requiredScopes.every(scope => hasScope(apiKey, scope));
}

// ========================================
// ヘッダーからAPIキー取得
// ========================================

export function extractApiKey(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  // Bearer hsk_xxx または X-API-Key: hsk_xxx
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token.startsWith(API_KEY_PREFIX)) {
      return token;
    }
  }

  // 直接指定
  if (authHeader.startsWith(API_KEY_PREFIX)) {
    return authHeader;
  }

  return null;
}
