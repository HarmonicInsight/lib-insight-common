-- =============================================================================
-- Data Collection Platform — Tenant Registry Migration
-- =============================================================================
-- Run this SQL in the ADMIN Supabase (license server) ONLY.
-- This creates the dc_tenant_registry table that maps tenants to their
-- dedicated Supabase projects.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- dc_tenant_registry — 顧客環境の接続先管理
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dc_tenant_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_name TEXT NOT NULL,                              -- 顧客企業名
  tenant_code TEXT UNIQUE NOT NULL,                       -- 短縮コード (e.g. 'acme-corp')
  supabase_url TEXT NOT NULL,                             -- 顧客用 Supabase project URL
  supabase_anon_key TEXT NOT NULL,                        -- anon key (client)
  supabase_service_role_key_encrypted TEXT NOT NULL,       -- service_role key (server, encrypted)
  status TEXT DEFAULT 'active',                           -- active / suspended / decommissioned
  license_key TEXT,                                       -- Associated IOSH license key
  provisioned_by TEXT NOT NULL,                           -- Consultant who set up this tenant
  provisioned_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_dc_registry_status ON dc_tenant_registry(status);
CREATE INDEX IF NOT EXISTS idx_dc_registry_license ON dc_tenant_registry(license_key);
CREATE INDEX IF NOT EXISTS idx_dc_registry_code ON dc_tenant_registry(tenant_code);
