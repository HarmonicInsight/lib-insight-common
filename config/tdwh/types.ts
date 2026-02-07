/**
 * テキストデータウェアハウス (TDWH) 共通型定義
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * DWH 設計原則をテキストナレッジに適用する。
 * 業種非依存の共通インターフェースを定義し、各業種の TDWH 実装が
 * 同じ型に準拠することで、横断検索・統合ディスパッチを可能にする。
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  TDWH 3 層アーキテクチャ                                        │
 * │                                                                 │
 * │  Layer 1: データレイク (Data Lake)                               │
 * │  ┌─────────────────────────────────────────────────────────┐    │
 * │  │  Crawler → RawDocument → data/raw/ (JSONL)              │    │
 * │  │  Web / PDF / RSS / API から公開情報を自動収集             │    │
 * │  └─────────────────────────────────────────────────────────┘    │
 * │                              ↓                                  │
 * │  Layer 2: マート (Mart)                                         │
 * │  ┌─────────────────────────────────────────────────────────┐    │
 * │  │  Cleaner → Classifier → Chunker → Embedder → VectorDB  │    │
 * │  │  目的別に構造化されたナレッジストア                        │    │
 * │  └─────────────────────────────────────────────────────────┘    │
 * │                              ↓                                  │
 * │  Layer 3: ディスパッチ (Dispatch)                                │
 * │  ┌─────────────────────────────────────────────────────────┐    │
 * │  │  IntentClassifier → Router → Integrator                 │    │
 * │  │  質問意図に応じたマートルーティングと結果統合              │    │
 * │  └─────────────────────────────────────────────────────────┘    │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## 横展開パターン
 *
 * ```
 * construction-tdwh     manufacturing-tdwh     finance-tdwh
 * (建設業)              (製造業)               (金融業)
 *      │                     │                     │
 *      └─────────────────────┼─────────────────────┘
 *                            │
 *                    insight-common/config/tdwh/types.ts
 *                    (この共通型定義)
 * ```
 */

// =============================================================================
// Layer 1: データレイク — ソース定義・クローラー
// =============================================================================

/** クロール対象ソースのタイプ */
export type CrawlerType =
  | 'web'            // 単一ページ取得
  | 'web_recursive'  // 再帰的リンク追跡
  | 'pdf'            // PDF ダウンロード + テキスト抽出
  | 'rss'            // RSS/Atom フィード監視
  | 'api';           // REST API 経由データ取得

/** クロールスケジュール */
export type CrawlSchedule =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annually';

/** クロール対象ソース定義 */
export interface SourceDefinition {
  /** ソース一意識別子 (e.g. "egov_construction_law") */
  id: string;
  /** 表示名 */
  name: string;
  /** 取得先 URL */
  url: string;
  /** クローラータイプ */
  type: CrawlerType;
  /** 格納先マート ID */
  mart: string;
  /** クロール頻度 */
  schedule: CrawlSchedule;
  /** 説明 */
  description?: string;
  /** web_recursive 時の最大探索深度 */
  maxDepth?: number;
  /** サイト内検索キーワード */
  searchKeywords?: string[];
}

/** クロール済み生ドキュメント */
export interface RawDocument {
  /** ソース定義 ID */
  sourceId: string;
  /** 取得元 URL */
  url: string;
  /** ドキュメントタイトル */
  title: string;
  /** 生テキストコンテンツ */
  content: string;
  /** コンテンツ種別 */
  contentType: 'html' | 'pdf' | 'text' | 'json';
  /** クロール日時 (ISO 8601) */
  crawledAt: string;
  /** コンテンツ SHA-256 ハッシュ（重複検出用） */
  contentHash: string;
  /** 追加メタデータ */
  metadata: Record<string, unknown>;
}

// =============================================================================
// Layer 2: マート — 分類・チャンク・ベクトル化
// =============================================================================

/** チャンク戦略タイプ（汎用パターン） */
export type ChunkStrategyType =
  | 'legal_article'        // 法令条文型（条・項・号の構造を保持）
  | 'section'              // セクション型（見出し区切り）
  | 'term_definition'      // 用語定義型（1 用語 = 1 チャンク）
  | 'case_study'           // 事例型（1 事例 = 1 チャンク、長い場合は段階分割）
  | 'construction_method'  // 工法・手法型（工種・手法単位）
  | 'safety_topic'         // 安全・コンプライアンス型（災害種別・作業種別単位）
  | 'generic';             // 汎用（固定トークン数で分割）

/** チャンク戦略設定 */
export interface ChunkStrategyConfig {
  type: ChunkStrategyType;
  /** 最小チャンクサイズ（トークン数） */
  minTokens: number;
  /** 最大チャンクサイズ（トークン数） */
  maxTokens: number;
  /** チャンク間オーバーラップ（トークン数） */
  overlapTokens: number;
}

/** メタデータフィールドの型 */
export type MetadataFieldType =
  | 'string'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'date'
  | 'list[string]';

/** マート定義 */
export interface MartDefinition {
  /** マート一意識別子 (e.g. "law", "accounting") */
  id: string;
  /** 表示名 */
  name: string;
  /** 説明 */
  description: string;
  /** ベクトル DB コレクション名 */
  collectionName: string;
  /** チャンク戦略 */
  chunkStrategy: ChunkStrategyConfig;
  /** ユースケース例（意図分類の学習データにも利用） */
  useCases: string[];
  /** メタデータスキーマ */
  metadataSchema: Record<string, MetadataFieldType>;
}

/** 分類結果 */
export interface ClassificationResult {
  /** 主マート ID */
  primaryMart: string;
  /** 副マート ID 一覧 */
  secondaryMarts: string[];
  /** 確信度 (0.0 - 1.0) */
  confidence: number;
  /** 分類根拠 */
  reasoning: string;
}

/** チャンク */
export interface Chunk {
  /** チャンク一意 ID */
  id: string;
  /** テキストコンテンツ */
  content: string;
  /** 元ドキュメントのソース ID */
  sourceId: string;
  /** 元 URL */
  sourceUrl: string;
  /** チャンクインデックス（同一ドキュメント内） */
  chunkIndex: number;
  /** 格納先マート ID */
  martId: string;
  /** 副マート ID 一覧 */
  secondaryMarts: string[];
  /** ドメイン固有メタデータ */
  metadata: Record<string, unknown>;
  /** チャンク作成日時 (ISO 8601) */
  createdAt: string;
}

// =============================================================================
// Layer 3: ディスパッチ — 意図分類・ルーティング・統合
// =============================================================================

/** マートへの検索クエリ */
export interface MartQuery {
  /** 対象マート ID */
  mart: string;
  /** 検索クエリ文字列 */
  query: string;
  /** 優先度 (1 が最高) */
  priority: number;
}

/** 意図分類結果 */
export interface IntentClassification {
  /** 質問の主要意図 */
  primaryIntent: string;
  /** マート別検索クエリ（優先度順） */
  martQueries: MartQuery[];
  /** 追加で聞くべき質問 */
  clarificationNeeded: string[];
  /** 分類根拠 */
  reasoning: string;
}

/** 検索結果 */
export interface SearchResult {
  /** テキストコンテンツ */
  content: string;
  /** 類似度スコア (0.0 - 1.0) */
  score: number;
  /** メタデータ */
  metadata: Record<string, unknown>;
  /** ソース URL */
  sourceUrl: string;
  /** マート名 */
  martName: string;
  /** マート ID */
  martId: string;
}

/** 出典情報 */
export interface SourceReference {
  /** マート ID */
  mart: string;
  /** ソース URL */
  url: string;
  /** 関連度スコア */
  relevance: number;
}

/** 統合結果 */
export interface IntegrationResult {
  /** 統合された情報テキスト */
  integratedContext: string;
  /** 出典一覧 */
  sources: SourceReference[];
  /** 情報の不足点 */
  gaps: string[];
  /** 注意事項 */
  caveats: string[];
}

/** マート統計情報 */
export interface MartStats {
  /** マート ID */
  martId: string;
  /** ドキュメント（チャンク）数 */
  documentCount: number;
  /** 最終更新日時 (ISO 8601) */
  lastUpdated: string;
  /** ソース別ドキュメント数 */
  sourceDistribution: Record<string, number>;
}

// =============================================================================
// TDWH インスタンス定義 — 業種別 TDWH の登録
// =============================================================================

/** TDWH インスタンス（業種別） */
export interface TdwhInstance {
  /** インスタンス ID (e.g. "construction", "manufacturing") */
  id: string;
  /** 表示名 */
  name: string;
  /** 対象業種 */
  industry: string;
  /** マート定義一覧 */
  marts: MartDefinition[];
  /** ソース定義一覧 */
  sources: SourceDefinition[];
  /** デフォルトの Embedding 設定キー */
  embeddingConfigKey: string;
}

// =============================================================================
// ヘルパー型
// =============================================================================

/** ディスパッチャー設定 */
export interface DispatcherConfig {
  /** 並列検索する最大マート数 */
  maxConcurrentMarts: number;
  /** マートあたりの検索結果上限 */
  topKPerMart: number;
  /** 最低スコア閾値 */
  minScoreThreshold: number;
}

/** デフォルトのディスパッチャー設定 */
export const DEFAULT_DISPATCHER_CONFIG: DispatcherConfig = {
  maxConcurrentMarts: 3,
  topKPerMart: 5,
  minScoreThreshold: 0.3,
};
