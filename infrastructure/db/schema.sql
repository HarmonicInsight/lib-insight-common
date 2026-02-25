-- =============================================
-- Insight Apps - Supabase Schema
-- Firebase UID 繧呈ｭ｣縺ｨ縺吶ｋ險ｭ險・
--
-- 菴ｿ縺・婿:
--   1. Supabase Dashboard > SQL Editor
--   2. 縺薙・繝輔ぃ繧､繝ｫ縺ｮ蜀・ｮｹ繧偵さ繝斐・
--   3. Run
-- =============================================

-- 繝ｦ繝ｼ繧ｶ繝ｼ・・irebase騾｣謳ｺ・・
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    email TEXT,
    display_name TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 繝ｩ繧､繧ｻ繝ｳ繧ｹ
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

    -- 逋ｺ陦瑚ｿｽ霍｡・郁ｪｰ縺檎匱陦後＠縺溘°・・
    issuance_channel TEXT,               -- direct_paddle, partner_reseller, etc.
    issuer_type TEXT,                    -- system, admin, partner
    issuer_id TEXT,                      -- 逋ｺ陦瑚・・ID
    partner_id UUID,                    -- 繝代・繝医リ繝ｼ邨檎罰縺ｮ蝣ｴ蜷・

    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(user_id, product_code)
);

-- 繝・リ繝ｳ繝茨ｼ井ｼ∵･ｭ/繝√・繝・・
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'FREE',
    owner_id UUID REFERENCES users(id),
    max_members INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 繝｡繝ｳ繝舌・繧ｷ繝・・・医Θ繝ｼ繧ｶ繝ｼﾃ励ユ繝翫Φ繝茨ｼ・
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',  -- owner, admin, member
    joined_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(user_id, tenant_id)
);

-- 蛻ｩ逕ｨ繝ｭ繧ｰ・・nalytics陬懷ｮ檎畑・・
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_code TEXT NOT NULL,
    feature TEXT NOT NULL,
    event_type TEXT NOT NULL,            -- 'use', 'error', 'purchase'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 繧､繝ｳ繝・ャ繧ｯ繧ｹ
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_licenses_user_product ON licenses(user_id, product_code);
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_product ON usage_logs(product_code, created_at DESC);

-- updated_at 閾ｪ蜍墓峩譁ｰ繝医Μ繧ｬ繝ｼ
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
-- 繝ｩ繧､繧ｻ繝ｳ繧ｹ逋ｺ陦後・繝代・繝医リ繝ｼ邂｡逅・ユ繝ｼ繝悶Ν
-- =============================================

-- 繝代・繝医リ繝ｼ・郁ｲｩ螢ｲ莉｣逅・ｺ暦ｼ・
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
    regions TEXT[] DEFAULT '{}',              -- 蟇ｾ雎｡蝨ｰ蝓・ ['JP', 'US', ...]
    authorized_products TEXT[] DEFAULT '{}',  -- 蜿匁桶陬ｽ蜩・ ['INSS', 'IOSH', ...]
    nfr_remaining JSONB DEFAULT '{}',         -- NFR谿区焚: {"INSS": 2, "IOSH": 2}
    demo_remaining JSONB DEFAULT '{}',        -- 繝・Δ谿区焚: {"INSS": 5, "IOSH": 5}
    api_key_hash TEXT UNIQUE,                -- 繝代・繝医リ繝ｼ繝昴・繧ｿ繝ｫ隱崎ｨｼ逕ｨ
    api_key_prefix TEXT,                     -- 陦ｨ遉ｺ逕ｨ "hpk_abc..."
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 逋ｻ骭ｲ・医Γ繝ｼ繝ｫ隱崎ｨｼ 竊・莉ｮ繧ｭ繝ｼ 竊・豁｣蠑上く繝ｼ縺ｮ霑ｽ霍｡・・
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

-- 逋ｺ陦後Ο繧ｰ・亥・繝ｩ繧､繧ｻ繝ｳ繧ｹ逋ｺ陦後・逶｣譟ｻ險ｼ霍｡・・
CREATE TABLE IF NOT EXISTS issuance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
    license_key TEXT NOT NULL,
    product_code TEXT NOT NULL,
    plan TEXT NOT NULL,
    key_type TEXT NOT NULL,                  -- production, provisional, nfr, demo

    -- 逋ｺ陦後メ繝｣繝阪Ν
    channel TEXT NOT NULL,                   -- direct_paddle, partner_reseller, etc.

    -- 逋ｺ陦瑚・ュ蝣ｱ・郁ｪｰ縺檎匱陦後＠縺溘°・・
    issuer_type TEXT NOT NULL,               -- system, admin, partner
    issuer_id TEXT NOT NULL,                 -- 逋ｺ陦瑚・・ID
    partner_id UUID REFERENCES partners(id), -- 繝代・繝医リ繝ｼ邨檎罰縺ｮ蝣ｴ蜷・
    partner_tier TEXT,                       -- 逋ｺ陦梧凾轤ｹ縺ｮ繝代・繝医リ繝ｼ繝・ぅ繧｢

    -- 鬘ｧ螳｢諠・ｱ
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_company TEXT,

    -- 豎ｺ貂域ュ蝣ｱ
    payment_id TEXT,
    payment_amount INTEGER,                  -- 驥鷹｡搾ｼ域怙蟆城夊ｲｨ蜊倅ｽ搾ｼ・
    payment_currency TEXT,                   -- JPY, USD, EUR

    -- 繝｡繧ｿ繝・・繧ｿ
    expires_at TIMESTAMPTZ NOT NULL,
    email_sent BOOLEAN DEFAULT false,
    notes TEXT,
    issued_at TIMESTAMPTZ DEFAULT now()
);

-- 繝代・繝医リ繝ｼ繧ｳ繝溘ャ繧ｷ繝ｧ繝ｳ
CREATE TABLE IF NOT EXISTS partner_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id),
    issuance_log_id UUID REFERENCES issuance_logs(id),
    license_id UUID REFERENCES licenses(id),
    commission_type TEXT NOT NULL,            -- first_year, renewal, referral
    list_price INTEGER NOT NULL,             -- 螳壻ｾ｡・・PY・・
    wholesale_price INTEGER NOT NULL,        -- 蜊ｸ蛟､・・PY・・
    partner_profit INTEGER NOT NULL,         -- 繝代・繝医リ繝ｼ蛻ｩ逶奇ｼ・PY・・
    discount_rate NUMERIC(4,2) NOT NULL,     -- 蛟､蠑慕紫 (0.20, 0.30, 0.40)
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, approved, paid, cancelled
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 繝ｩ繧､繧ｻ繝ｳ繧ｹ逋ｺ陦後・繝代・繝医リ繝ｼ 繧､繝ｳ繝・ャ繧ｯ繧ｹ
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

-- 繝代・繝医リ繝ｼ updated_at 繝医Μ繧ｬ繝ｼ
DROP TRIGGER IF EXISTS partners_updated_at ON partners;
CREATE TRIGGER partners_updated_at
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 逋ｻ骭ｲ updated_at 繝医Μ繧ｬ繝ｼ
DROP TRIGGER IF EXISTS registrations_updated_at ON registrations;
CREATE TRIGGER registrations_updated_at
    BEFORE UPDATE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================
-- API Gateway 繝・・繝悶Ν
-- =============================================

-- API繧ｭ繝ｼ・・ervice-to-Service隱崎ｨｼ逕ｨ・・
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,     -- SHA256繝上ャ繧ｷ繝･
    key_prefix TEXT NOT NULL,          -- 陦ｨ遉ｺ逕ｨ "hsk_abc..."
    scopes TEXT[] NOT NULL DEFAULT '{}',
    rate_limit INTEGER DEFAULT 60,     -- requests per minute
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 逶｣譟ｻ繝ｭ繧ｰ
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

-- 繧ｻ繧ｭ繝･繝ｪ繝・ぅ繧､繝吶Φ繝・
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

-- API Gateway 繧､繝ｳ繝・ャ繧ｯ繧ｹ
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_path ON audit_logs(path, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address, timestamp DESC);

-- 蜿､縺・屮譟ｻ繝ｭ繧ｰ縺ｮ閾ｪ蜍募炎髯､・・0譌･莉･荳奇ｼ・
-- Supabase Edge Function縺ｧ螳壽悄螳溯｡後☆繧九°縲｝g_cron繧剃ｽｿ逕ｨ
-- DELETE FROM audit_logs WHERE timestamp < now() - interval '90 days';
-- DELETE FROM security_events WHERE timestamp < now() - interval '90 days';

-- =============================================
-- 繧ｵ繝昴・繝医メ繧ｱ繝・ヨ・・nthropic Customer Support Plugin 蜿り・ｼ・
-- =============================================
-- 蜿ら・: config/support-triage.ts

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    -- 繝√こ繝・ヨ蜀・ｮｹ
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    -- AI 閾ｪ蜍募・鬘・
    category TEXT NOT NULL DEFAULT 'how-to',           -- bug, how-to, license, ai-assistant, integration, feature-request, performance, data, security, partner
    priority TEXT NOT NULL DEFAULT 'P3',                -- P1, P2, P3, P4
    routing_target TEXT NOT NULL DEFAULT 'tier1',       -- tier1, tier2, engineering, product, security, billing, partner-team
    -- 繝｡繧ｿ繝・・繧ｿ
    product_code TEXT,                                 -- INSS, IOSH, IOSD 遲・
    plan TEXT,                                         -- 蝠上＞蜷医ｏ縺帶凾縺ｮ繝励Λ繝ｳ
    partner_id UUID,                                   -- 繝代・繝医リ繝ｼ邨檎罰縺ｮ蝣ｴ蜷・
    -- 繧ｹ繝・・繧ｿ繧ｹ邂｡逅・
    status TEXT NOT NULL DEFAULT 'open',                -- open, in_progress, waiting_customer, waiting_internal, resolved, closed
    assigned_to TEXT,                                   -- 諡・ｽ楢・ID
    resolved_at TIMESTAMPTZ,
    -- SLA 霑ｽ霍｡
    sla_response_deadline TIMESTAMPTZ,                 -- 蛻晏屓蠢懃ｭ疲悄髯・
    sla_responded_at TIMESTAMPTZ,                      -- 螳滄圀縺ｮ蛻晏屓蠢懃ｭ疲凾蛻ｻ
    sla_met BOOLEAN,                                   -- SLA 驕疲・繝輔Λ繧ｰ
    -- 繧ｿ繧､繝繧ｹ繧ｿ繝ｳ繝・
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 繝√こ繝・ヨ繧ｳ繝｡繝ｳ繝茨ｼ亥ｯｾ蠢懷ｱ･豁ｴ・・
CREATE TABLE IF NOT EXISTS support_ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
    author_type TEXT NOT NULL DEFAULT 'agent',          -- customer, agent, system, ai
    author_id TEXT,
    body TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,                 -- 蜀・Κ繝｡繝｢・磯｡ｧ螳｢縺ｫ縺ｯ髱槫・髢具ｼ・
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 繧ｵ繝昴・繝医う繝ｳ繝・ャ繧ｯ繧ｹ
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_partner ON support_tickets(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_comments_ticket ON support_ticket_comments(ticket_id, created_at);

-- =============================================
-- 蛻晄悄繝・・繧ｿ遒ｺ隱咲畑繧ｯ繧ｨ繝ｪ
-- =============================================
-- SELECT * FROM users LIMIT 10;
-- SELECT * FROM licenses LIMIT 10;
-- SELECT * FROM tenants LIMIT 10;
-- SELECT * FROM api_keys LIMIT 10;
-- SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
-- SELECT * FROM security_events ORDER BY timestamp DESC LIMIT 10;
-- SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 10;
