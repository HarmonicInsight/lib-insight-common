-- =============================================================================
-- TDWH (テキストデータウェアハウス) pgvector スキーマ
-- =============================================================================
--
-- Supabase + pgvector 用のテーブル定義。
-- 全業種の TDWH が共通スキーマに準拠することで、横断検索が可能になる。
--
-- 使い方:
--   psql $DATABASE_URL -f pgvector-schema.sql
--
-- 前提:
--   CREATE EXTENSION IF NOT EXISTS vector;
-- =============================================================================

-- pgvector 拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- マート定義テーブル
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdwh_marts (
    id              TEXT PRIMARY KEY,           -- マート ID (e.g. "law")
    instance_id     TEXT NOT NULL,              -- TDWH インスタンス ID (e.g. "construction")
    name            TEXT NOT NULL,              -- 表示名
    description     TEXT,                       -- 説明
    collection_name TEXT NOT NULL UNIQUE,       -- ベクトルコレクション名
    chunk_strategy  JSONB NOT NULL,            -- チャンク戦略設定 (JSON)
    use_cases       JSONB DEFAULT '[]'::JSONB, -- ユースケース例
    metadata_schema JSONB DEFAULT '{}'::JSONB, -- メタデータスキーマ
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ソース定義テーブル
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdwh_sources (
    id              TEXT PRIMARY KEY,           -- ソース ID
    instance_id     TEXT NOT NULL,              -- TDWH インスタンス ID
    name            TEXT NOT NULL,              -- 表示名
    url             TEXT NOT NULL,              -- 取得先 URL
    type            TEXT NOT NULL CHECK (type IN ('web', 'web_recursive', 'pdf', 'rss', 'api', 'scan_ocr', 'transcript', 'manual')),
    mart_id         TEXT NOT NULL REFERENCES tdwh_marts(id),
    schedule        TEXT NOT NULL CHECK (schedule IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually')),
    description     TEXT,
    max_depth       INTEGER,
    search_keywords JSONB DEFAULT '[]'::JSONB,
    is_active       BOOLEAN DEFAULT TRUE,
    last_crawled_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 生ドキュメントテーブル (データレイク層)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdwh_raw_documents (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id     TEXT NOT NULL REFERENCES tdwh_sources(id),
    url           TEXT NOT NULL,
    title         TEXT,
    content       TEXT NOT NULL,
    content_type  TEXT NOT NULL CHECK (content_type IN ('html', 'pdf', 'text', 'json', 'scan', 'transcript')),
    content_hash  TEXT NOT NULL,                -- SHA-256（重複検出用）
    crawled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata      JSONB DEFAULT '{}'::JSONB,
    quality_score FLOAT,                        -- 取得品質 (0.0-1.0)。OCR等は低い
    original_file TEXT,                         -- 元ファイルパス（再OCR用）
    is_curated    BOOLEAN DEFAULT FALSE,        -- キュレーション済みフラグ
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 重複排除用インデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_documents_url_hash
    ON tdwh_raw_documents(url, content_hash);

-- 未キュレーションドキュメント検索用
CREATE INDEX IF NOT EXISTS idx_raw_documents_uncurated
    ON tdwh_raw_documents(is_curated) WHERE is_curated = FALSE;

-- =============================================================================
-- キュレーション済みレコードテーブル (キュレーション層)
-- =============================================================================
-- 1 RawDocument から複数の CuratedRecord が生成される。
-- 例: 議事録PDF → 議題A, 議題B, 議題C (3レコード)
--     法令HTML → 第3条, 第26条, ... (N レコード)

CREATE TABLE IF NOT EXISTS tdwh_curated_records (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_document_id    UUID NOT NULL REFERENCES tdwh_raw_documents(id),
    source_id          TEXT NOT NULL REFERENCES tdwh_sources(id),
    source_url         TEXT NOT NULL,
    source_type        TEXT NOT NULL CHECK (source_type IN (
        'web_article', 'legal_text', 'meeting_minutes', 'interview',
        'report', 'manual', 'news', 'specification', 'scan_document', 'other'
    )),
    title              TEXT NOT NULL,              -- 情報単位タイトル
    content            TEXT NOT NULL,              -- 正規化済みテキスト
    summary            TEXT,                       -- 1-2文の要約
    quality            TEXT NOT NULL CHECK (quality IN (
        'verified', 'auto_extracted', 'low_quality', 'needs_review', 'rejected'
    )) DEFAULT 'auto_extracted',
    quality_score      FLOAT NOT NULL DEFAULT 0.8, -- 品質スコア (0.0-1.0)
    quality_notes      JSONB DEFAULT '[]'::JSONB,  -- 品質注記（文字化け箇所等）
    suggested_mart_id  TEXT REFERENCES tdwh_marts(id),
    entities           JSONB DEFAULT '[]'::JSONB,  -- 抽出エンティティ
    metadata           JSONB DEFAULT '{}'::JSONB,
    curated_at         TIMESTAMPTZ DEFAULT NOW(),
    curation_version   TEXT DEFAULT '1.0.0',       -- 再処理追跡用
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 品質別検索
CREATE INDEX IF NOT EXISTS idx_curated_quality
    ON tdwh_curated_records(quality);

-- マート別検索
CREATE INDEX IF NOT EXISTS idx_curated_mart
    ON tdwh_curated_records(suggested_mart_id);

-- 元ドキュメント参照
CREATE INDEX IF NOT EXISTS idx_curated_raw_doc
    ON tdwh_curated_records(raw_document_id);

-- レビュー待ちレコード検索
CREATE INDEX IF NOT EXISTS idx_curated_needs_review
    ON tdwh_curated_records(quality) WHERE quality = 'needs_review';

-- =============================================================================
-- チャンクテーブル (マート層)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdwh_chunks (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curated_record_id UUID REFERENCES tdwh_curated_records(id),
    source_id        TEXT NOT NULL REFERENCES tdwh_sources(id),
    source_url       TEXT NOT NULL,
    mart_id          TEXT NOT NULL REFERENCES tdwh_marts(id),
    chunk_index      INTEGER NOT NULL,           -- 同一レコード内のインデックス
    content          TEXT NOT NULL,
    embedding        vector(1536),                -- OpenAI text-embedding-3-small
    secondary_marts  JSONB DEFAULT '[]'::JSONB,  -- 副マート ID 一覧
    metadata         JSONB DEFAULT '{}'::JSONB,  -- ドメイン固有メタデータ
    raw_document_id  UUID REFERENCES tdwh_raw_documents(id),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- マート別検索用インデックス
CREATE INDEX IF NOT EXISTS idx_chunks_mart
    ON tdwh_chunks(mart_id);

-- ベクトル類似度検索用インデックス (IVFFlat)
-- 注意: データ投入後に REINDEX が必要な場合がある
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
    ON tdwh_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ソース別検索用
CREATE INDEX IF NOT EXISTS idx_chunks_source
    ON tdwh_chunks(source_id);

-- =============================================================================
-- クロールログテーブル
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdwh_crawl_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id     TEXT NOT NULL REFERENCES tdwh_sources(id),
    status        TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed', 'skipped')),
    documents_found   INTEGER DEFAULT 0,
    documents_new     INTEGER DEFAULT 0,
    documents_updated INTEGER DEFAULT 0,
    error_message TEXT,
    started_at    TIMESTAMPTZ NOT NULL,
    completed_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crawl_logs_source
    ON tdwh_crawl_logs(source_id, created_at DESC);

-- =============================================================================
-- ベクトル類似度検索関数
-- =============================================================================

-- マートを指定してベクトル類似度検索
CREATE OR REPLACE FUNCTION tdwh_search(
    query_embedding vector(1536),
    target_mart_id  TEXT,
    match_count     INTEGER DEFAULT 5,
    min_score       FLOAT DEFAULT 0.3
)
RETURNS TABLE (
    id          UUID,
    content     TEXT,
    score       FLOAT,
    metadata    JSONB,
    source_url  TEXT,
    mart_id     TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.content,
        1 - (c.embedding <=> query_embedding) AS score,
        c.metadata,
        c.source_url,
        c.mart_id
    FROM tdwh_chunks c
    WHERE c.mart_id = target_mart_id
      AND 1 - (c.embedding <=> query_embedding) >= min_score
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 複数マートを横断して検索
CREATE OR REPLACE FUNCTION tdwh_search_multi(
    query_embedding vector(1536),
    target_mart_ids TEXT[],
    match_count     INTEGER DEFAULT 5,
    min_score       FLOAT DEFAULT 0.3
)
RETURNS TABLE (
    id          UUID,
    content     TEXT,
    score       FLOAT,
    metadata    JSONB,
    source_url  TEXT,
    mart_id     TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.content,
        1 - (c.embedding <=> query_embedding) AS score,
        c.metadata,
        c.source_url,
        c.mart_id
    FROM tdwh_chunks c
    WHERE c.mart_id = ANY(target_mart_ids)
      AND 1 - (c.embedding <=> query_embedding) >= min_score
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- =============================================================================
-- マート統計ビュー
-- =============================================================================

CREATE OR REPLACE VIEW tdwh_mart_stats AS
SELECT
    m.id AS mart_id,
    m.instance_id,
    m.name AS mart_name,
    COUNT(c.id) AS document_count,
    MAX(c.updated_at) AS last_updated,
    JSONB_OBJECT_AGG(
        COALESCE(c.source_id, 'unknown'),
        cnt.source_count
    ) AS source_distribution
FROM tdwh_marts m
LEFT JOIN tdwh_chunks c ON c.mart_id = m.id
LEFT JOIN (
    SELECT mart_id, source_id, COUNT(*) AS source_count
    FROM tdwh_chunks
    GROUP BY mart_id, source_id
) cnt ON cnt.mart_id = m.id AND cnt.source_id = c.source_id
GROUP BY m.id, m.instance_id, m.name;

-- =============================================================================
-- 更新トリガー
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_marts_updated
    BEFORE UPDATE ON tdwh_marts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_sources_updated
    BEFORE UPDATE ON tdwh_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_curated_updated
    BEFORE UPDATE ON tdwh_curated_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_chunks_updated
    BEFORE UPDATE ON tdwh_chunks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- キュレーション統計ビュー
-- =============================================================================

CREATE OR REPLACE VIEW tdwh_curation_stats AS
SELECT
    quality,
    COUNT(*) AS record_count,
    AVG(quality_score) AS avg_quality_score,
    COUNT(*) FILTER (WHERE suggested_mart_id IS NOT NULL) AS classified_count
FROM tdwh_curated_records
GROUP BY quality;
