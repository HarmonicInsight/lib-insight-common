/**
 * TDWH Embedding 設定
 *
 * 全業種の TDWH で共有する Embedding モデル設定。
 * ベクトル化モデル・次元数・バッチサイズ等を一元管理する。
 *
 * 【注意】
 * - 本番環境では Supabase + pgvector を使用（ChromaDB はローカル開発用）
 * - Embedding モデルは OpenAI text-embedding-3-small を標準とする
 * - 将来的に Anthropic が Embedding モデルを提供した場合は移行を検討
 */

// =============================================================================
// Embedding プロバイダー定義
// =============================================================================

/** Embedding プロバイダー */
export type EmbeddingProvider = 'openai' | 'cohere' | 'local';

/** Embedding モデル設定 */
export interface EmbeddingModelConfig {
  /** プロバイダー */
  provider: EmbeddingProvider;
  /** モデル ID */
  modelId: string;
  /** ベクトル次元数 */
  dimensions: number;
  /** 1 バッチあたりの最大テキスト数 */
  maxBatchSize: number;
  /** 1 テキストあたりの最大トークン数 */
  maxTokens: number;
  /** API レートリミット (リクエスト/分) */
  rateLimitPerMinute: number;
}

// =============================================================================
// 定義済み Embedding 設定
// =============================================================================

/** OpenAI text-embedding-3-small（標準・推奨） */
export const EMBEDDING_OPENAI_SMALL: EmbeddingModelConfig = {
  provider: 'openai',
  modelId: 'text-embedding-3-small',
  dimensions: 1536,
  maxBatchSize: 2048,
  maxTokens: 8191,
  rateLimitPerMinute: 3000,
};

/** OpenAI text-embedding-3-large（高精度） */
export const EMBEDDING_OPENAI_LARGE: EmbeddingModelConfig = {
  provider: 'openai',
  modelId: 'text-embedding-3-large',
  dimensions: 3072,
  maxBatchSize: 2048,
  maxTokens: 8191,
  rateLimitPerMinute: 3000,
};

/** Cohere embed-multilingual-v3.0（多言語対応・代替） */
export const EMBEDDING_COHERE_MULTILINGUAL: EmbeddingModelConfig = {
  provider: 'cohere',
  modelId: 'embed-multilingual-v3.0',
  dimensions: 1024,
  maxBatchSize: 96,
  maxTokens: 512,
  rateLimitPerMinute: 100,
};

// =============================================================================
// 設定レジストリ
// =============================================================================

/** 利用可能な Embedding 設定 */
export const EMBEDDING_CONFIGS: Record<string, EmbeddingModelConfig> = {
  'openai-small': EMBEDDING_OPENAI_SMALL,
  'openai-large': EMBEDDING_OPENAI_LARGE,
  'cohere-multilingual': EMBEDDING_COHERE_MULTILINGUAL,
} as const;

/** デフォルトの Embedding 設定キー */
export const DEFAULT_EMBEDDING_CONFIG_KEY = 'openai-small';

/**
 * Embedding 設定を取得
 *
 * @param key - 設定キー (e.g. "openai-small")
 * @returns Embedding モデル設定
 * @throws 未知の設定キーの場合
 */
export function getEmbeddingConfig(key: string): EmbeddingModelConfig {
  const config = EMBEDDING_CONFIGS[key];
  if (!config) {
    throw new Error(
      `Unknown embedding config key: "${key}". Available: ${Object.keys(EMBEDDING_CONFIGS).join(', ')}`
    );
  }
  return config;
}

// =============================================================================
// VectorStore 設定
// =============================================================================

/** VectorStore プロバイダー */
export type VectorStoreProvider = 'pgvector' | 'chromadb' | 'pinecone' | 'qdrant';

/** VectorStore 接続設定 */
export interface VectorStoreConfig {
  /** プロバイダー */
  provider: VectorStoreProvider;
  /** 接続 URL またはパス */
  connectionUrl: string;
  /** 距離メトリクス */
  distanceMetric: 'cosine' | 'euclidean' | 'inner_product';
  /** Embedding 設定キー */
  embeddingConfigKey: string;
}

/** ローカル開発用 ChromaDB 設定 */
export const LOCAL_CHROMADB_CONFIG: VectorStoreConfig = {
  provider: 'chromadb',
  connectionUrl: './data/.chroma',
  distanceMetric: 'cosine',
  embeddingConfigKey: DEFAULT_EMBEDDING_CONFIG_KEY,
};

/** 本番用 Supabase pgvector 設定テンプレート */
export const PRODUCTION_PGVECTOR_CONFIG: Omit<VectorStoreConfig, 'connectionUrl'> = {
  provider: 'pgvector',
  distanceMetric: 'cosine',
  embeddingConfigKey: DEFAULT_EMBEDDING_CONFIG_KEY,
};
