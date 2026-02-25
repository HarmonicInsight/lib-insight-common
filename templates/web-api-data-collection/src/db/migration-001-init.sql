-- =============================================================================
-- Data Collection Platform — Initial Migration
-- =============================================================================
-- Run this SQL in each tenant's Supabase SQL Editor.
-- For the admin Supabase (license server), run migration-000-registry.sql instead.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- dc_templates — テンプレート定義 + JSON Schema（論理テーブル定義）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dc_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ja TEXT NOT NULL,
  category TEXT,
  description TEXT,
  description_ja TEXT,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',                -- draft / published / archived
  schedule TEXT DEFAULT 'once',               -- once / monthly / quarterly / yearly / custom
  deadline TIMESTAMPTZ,
  template_file_path TEXT,                    -- Storage path for .xlsx
  schema_json JSONB NOT NULL,                 -- TemplateDataSchema (logical table definition)
  mapping_json JSONB NOT NULL,                -- Named Range ↔ schema_json.fields mapping
  validation_rules JSONB DEFAULT '[]',        -- Rule-based validation rules
  tab_color TEXT DEFAULT '#2563EB',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dc_templates_status ON dc_templates(status);
CREATE INDEX IF NOT EXISTS idx_dc_templates_category ON dc_templates(category);

DROP TRIGGER IF EXISTS dc_templates_updated_at ON dc_templates;
CREATE TRIGGER dc_templates_updated_at
  BEFORE UPDATE ON dc_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- dc_collected_data — 全テンプレートの収集データを格納する汎用テーブル
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dc_collected_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES dc_templates(id),
  template_version INTEGER NOT NULL,
  submitter_email TEXT NOT NULL,
  submitter_name TEXT,
  status TEXT DEFAULT 'submitted',            -- draft / submitted / accepted / rejected / pending_review
  comment TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  rejection_reason TEXT,
  data JSONB NOT NULL,                        -- Collected data (logical record)
  ai_validation_snapshot JSONB,               -- AI validation result snapshot
  ai_transfer_used BOOLEAN DEFAULT FALSE
);

-- Template-based queries (most frequent)
CREATE INDEX IF NOT EXISTS idx_dc_data_template ON dc_collected_data(template_id);
-- Submitter-based queries (collection management)
CREATE INDEX IF NOT EXISTS idx_dc_data_submitter ON dc_collected_data(submitter_email);
-- Status-based queries (collection status overview)
CREATE INDEX IF NOT EXISTS idx_dc_data_status ON dc_collected_data(template_id, status);
-- JSONB full search (AI queries, aggregation)
CREATE INDEX IF NOT EXISTS idx_dc_data_gin ON dc_collected_data USING GIN (data);
-- Time-series queries (historical comparison)
CREATE INDEX IF NOT EXISTS idx_dc_data_timeline ON dc_collected_data(template_id, submitted_at DESC);

-- ---------------------------------------------------------------------------
-- dc_drafts — 下書きデータ（ユーザー × テンプレートで一意）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dc_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES dc_templates(id),
  user_email TEXT NOT NULL,
  data JSONB NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_dc_drafts_user ON dc_drafts(user_email);

-- ---------------------------------------------------------------------------
-- dc_ai_logs — AI 転記・検証の実行ログ
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dc_ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES dc_templates(id),
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,                       -- 'transfer' / 'validate'
  source_file_name TEXT,
  result_summary JSONB,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dc_ai_logs_usage ON dc_ai_logs(user_email, action, executed_at);

-- ---------------------------------------------------------------------------
-- dc_collection_status — 回収状況集計ビュー
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW dc_collection_status AS
SELECT
  t.id AS template_id,
  t.name_ja AS template_name,
  t.deadline,
  COUNT(*) FILTER (WHERE d.status = 'submitted') AS submitted_count,
  COUNT(*) FILTER (WHERE d.status = 'accepted') AS accepted_count,
  COUNT(*) FILTER (WHERE d.status = 'rejected') AS rejected_count,
  COUNT(*) FILTER (WHERE d.status = 'pending_review') AS pending_count,
  (SELECT COUNT(*) FROM dc_drafts dr WHERE dr.template_id = t.id) AS draft_count
FROM dc_templates t
LEFT JOIN dc_collected_data d ON d.template_id = t.id
WHERE t.status = 'published'
GROUP BY t.id, t.name_ja, t.deadline;
