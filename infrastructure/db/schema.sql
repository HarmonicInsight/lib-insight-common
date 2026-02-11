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
    product_code TEXT NOT NULL,          -- INSS, IOSH, IOSD, INPY, INMV, INBT, INCA, INIG, IVIN
    plan TEXT NOT NULL DEFAULT 'FREE',   -- FREE, TRIAL, STD, PRO, ENT
    license_key TEXT,
    key_type TEXT DEFAULT 'production',  -- production, provisional, nfr, demo
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,

    -- 発行追跡（誰が発行したか）
    issuance_channel TEXT,               -- direct_paddle, partner_reseller, etc.
    issuer_type TEXT,                    -- system, admin, partner
    issuer_id TEXT,                      -- 発行者のID
    partner_id UUID,                    -- パートナー経由の場合

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
-- ライセンス発行・パートナー管理テーブル
-- =============================================

-- パートナー（販売代理店）
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL UNIQUE,
    tier TEXT NOT NULL DEFAULT 'registered',  -- registered, silver, gold
    partner_type TEXT NOT NULL DEFAULT 'reseller', -- reseller, referral, var
    is_active BOOLEAN DEFAULT true,
    contract_start_date TIMESTAMPTZ NOT NULL,
    contract_end_date TIMESTAMPTZ NOT NULL,
    regions TEXT[] DEFAULT '{}',              -- 対象地域: ['JP', 'US', ...]
    authorized_products TEXT[] DEFAULT '{}',  -- 取扱製品: ['INSS', 'IOSH', ...]
    nfr_remaining JSONB DEFAULT '{}',         -- NFR残数: {"INSS": 2, "IOSH": 2}
    demo_remaining JSONB DEFAULT '{}',        -- デモ残数: {"INSS": 5, "IOSH": 5}
    api_key_hash TEXT UNIQUE,                -- パートナーポータル認証用
    api_key_prefix TEXT,                     -- 表示用 "hpk_abc..."
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 登録（メール認証 → 仮キー → 正式キーの追跡）
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    product_code TEXT NOT NULL,
    requested_plan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_verification',
    -- pending_verification, verified, pending_payment, active, expired, suspended
    verification_token TEXT NOT NULL,
    verification_expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    provisional_key TEXT,
    provisional_expires_at TIMESTAMPTZ,
    production_key TEXT,
    production_expires_at TIMESTAMPTZ,
    payment_method TEXT,                     -- paddle, stripe, invoice, reseller
    payment_id TEXT,
    reseller_partner_id UUID REFERENCES partners(id),
    locale TEXT DEFAULT 'ja',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 発行ログ（全ライセンス発行の監査証跡）
CREATE TABLE IF NOT EXISTS issuance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
    license_key TEXT NOT NULL,
    product_code TEXT NOT NULL,
    plan TEXT NOT NULL,
    key_type TEXT NOT NULL,                  -- production, provisional, nfr, demo

    -- 発行チャネル
    channel TEXT NOT NULL,                   -- direct_paddle, partner_reseller, etc.

    -- 発行者情報（誰が発行したか）
    issuer_type TEXT NOT NULL,               -- system, admin, partner
    issuer_id TEXT NOT NULL,                 -- 発行者のID
    partner_id UUID REFERENCES partners(id), -- パートナー経由の場合
    partner_tier TEXT,                       -- 発行時点のパートナーティア

    -- 顧客情報
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_company TEXT,

    -- 決済情報
    payment_id TEXT,
    payment_amount INTEGER,                  -- 金額（最小通貨単位）
    payment_currency TEXT,                   -- JPY, USD, EUR

    -- メタデータ
    expires_at TIMESTAMPTZ NOT NULL,
    email_sent BOOLEAN DEFAULT false,
    notes TEXT,
    issued_at TIMESTAMPTZ DEFAULT now()
);

-- パートナーコミッション
CREATE TABLE IF NOT EXISTS partner_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id),
    issuance_log_id UUID REFERENCES issuance_logs(id),
    license_id UUID REFERENCES licenses(id),
    commission_type TEXT NOT NULL,            -- first_year, renewal, referral
    list_price INTEGER NOT NULL,             -- 定価（JPY）
    wholesale_price INTEGER NOT NULL,        -- 卸値（JPY）
    partner_profit INTEGER NOT NULL,         -- パートナー利益（JPY）
    discount_rate NUMERIC(4,2) NOT NULL,     -- 値引率 (0.20, 0.30, 0.40)
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, approved, paid, cancelled
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ライセンス発行・パートナー インデックス
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(contact_email);
CREATE INDEX IF NOT EXISTS idx_partners_tier ON partners(tier);
CREATE INDEX IF NOT EXISTS idx_partners_api_key ON partners(api_key_hash);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_token ON registrations(verification_token);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_issuance_logs_license ON issuance_logs(license_id);
CREATE INDEX IF NOT EXISTS idx_issuance_logs_partner ON issuance_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_issuance_logs_channel ON issuance_logs(channel, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_issuance_logs_customer ON issuance_logs(customer_email);
CREATE INDEX IF NOT EXISTS idx_issuance_logs_issued_at ON issuance_logs(issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_commissions_partner ON partner_commissions(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON partner_commissions(status);
CREATE INDEX IF NOT EXISTS idx_licenses_partner ON licenses(partner_id);
CREATE INDEX IF NOT EXISTS idx_licenses_channel ON licenses(issuance_channel);

-- パートナー updated_at トリガー
DROP TRIGGER IF EXISTS partners_updated_at ON partners;
CREATE TRIGGER partners_updated_at
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 登録 updated_at トリガー
DROP TRIGGER IF EXISTS registrations_updated_at ON registrations;
CREATE TRIGGER registrations_updated_at
    BEFORE UPDATE ON registrations
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
-- サポートチケット（Anthropic Customer Support Plugin 参考）
-- =============================================
-- 参照: config/support-triage.ts

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    -- チケット内容
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    -- AI 自動分類
    category TEXT NOT NULL DEFAULT 'how-to',           -- bug, how-to, license, ai-assistant, integration, feature-request, performance, data, security, partner
    priority TEXT NOT NULL DEFAULT 'P3',                -- P1, P2, P3, P4
    routing_target TEXT NOT NULL DEFAULT 'tier1',       -- tier1, tier2, engineering, product, security, billing, partner-team
    -- メタデータ
    product_code TEXT,                                 -- INSS, IOSH, IOSD 等
    plan TEXT,                                         -- 問い合わせ時のプラン
    partner_id UUID,                                   -- パートナー経由の場合
    -- ステータス管理
    status TEXT NOT NULL DEFAULT 'open',                -- open, in_progress, waiting_customer, waiting_internal, resolved, closed
    assigned_to TEXT,                                   -- 担当者 ID
    resolved_at TIMESTAMPTZ,
    -- SLA 追跡
    sla_response_deadline TIMESTAMPTZ,                 -- 初回応答期限
    sla_responded_at TIMESTAMPTZ,                      -- 実際の初回応答時刻
    sla_met BOOLEAN,                                   -- SLA 達成フラグ
    -- タイムスタンプ
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- チケットコメント（対応履歴）
CREATE TABLE IF NOT EXISTS support_ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
    author_type TEXT NOT NULL DEFAULT 'agent',          -- customer, agent, system, ai
    author_id TEXT,
    body TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,                 -- 内部メモ（顧客には非公開）
    created_at TIMESTAMPTZ DEFAULT now()
);

-- サポートインデックス
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_partner ON support_tickets(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_comments_ticket ON support_ticket_comments(ticket_id, created_at);

-- =============================================
-- 初期データ確認用クエリ
-- =============================================
-- SELECT * FROM users LIMIT 10;
-- SELECT * FROM licenses LIMIT 10;
-- SELECT * FROM tenants LIMIT 10;
-- SELECT * FROM api_keys LIMIT 10;
-- SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
-- SELECT * FROM security_events ORDER BY timestamp DESC LIMIT 10;
-- SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 10;
