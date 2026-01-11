-- =============================================
-- Insight Apps - Supabase Schema
-- Firebase UID を正とする設計
--
-- 使い方:
--   1. Supabase Dashboard > SQL Editor
--   2. このファイルの内容をコピペ
--   3. Run
-- =============================================

-- ユーザー（Firebase連携）
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    email TEXT,
    display_name TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ライセンス
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_code TEXT NOT NULL,          -- INSS, INSP, INPY, FGIN
    plan TEXT NOT NULL DEFAULT 'FREE',   -- FREE, STD, PRO, ENT
    license_key TEXT,
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(user_id, product_code)
);

-- テナント（企業/チーム）
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'FREE',
    owner_id UUID REFERENCES users(id),
    max_members INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- メンバーシップ（ユーザー×テナント）
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',  -- owner, admin, member
    joined_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(user_id, tenant_id)
);

-- 利用ログ（Analytics補完用）
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_code TEXT NOT NULL,
    feature TEXT NOT NULL,
    event_type TEXT NOT NULL,            -- 'use', 'error', 'purchase'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_licenses_user_product ON licenses(user_id, product_code);
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_product ON usage_logs(product_code, created_at DESC);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================
-- API Gateway テーブル
-- =============================================

-- APIキー（Service-to-Service認証用）
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,     -- SHA256ハッシュ
    key_prefix TEXT NOT NULL,          -- 表示用 "hsk_abc..."
    scopes TEXT[] NOT NULL DEFAULT '{}',
    rate_limit INTEGER DEFAULT 60,     -- requests per minute
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 監査ログ
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,               -- request_id
    timestamp TIMESTAMPTZ NOT NULL,
    request_id TEXT NOT NULL,

    -- Who
    user_id TEXT,
    api_key_id TEXT,
    ip_address TEXT NOT NULL,
    user_agent TEXT,

    -- What
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    query JSONB,
    body JSONB,

    -- Result
    status_code INTEGER NOT NULL,
    duration INTEGER NOT NULL,         -- milliseconds
    error TEXT
);

-- セキュリティイベント
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    request_id TEXT,
    event_type TEXT NOT NULL,          -- auth_failure, rate_limit, etc.
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    user_id TEXT,
    details JSONB DEFAULT '{}'
);

-- API Gateway インデックス
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_path ON audit_logs(path, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address, timestamp DESC);

-- 古い監査ログの自動削除（90日以上）
-- Supabase Edge Functionで定期実行するか、pg_cronを使用
-- DELETE FROM audit_logs WHERE timestamp < now() - interval '90 days';
-- DELETE FROM security_events WHERE timestamp < now() - interval '90 days';

-- =============================================
-- 初期データ確認用クエリ
-- =============================================
-- SELECT * FROM users LIMIT 10;
-- SELECT * FROM licenses LIMIT 10;
-- SELECT * FROM tenants LIMIT 10;
-- SELECT * FROM api_keys LIMIT 10;
-- SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
-- SELECT * FROM security_events ORDER BY timestamp DESC LIMIT 10;
