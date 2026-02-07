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
 * │  TDWH 4 層アーキテクチャ                                        │
 * │                                                                 │
 * │  Layer 1: データレイク (Data Lake)                               │
 * │  ┌─────────────────────────────────────────────────────────┐    │
 * │  │  Crawler → RawDocument → data/raw/ (JSONL)              │    │
 * │  │  Web / PDF / RSS / API / 議事録 / 音声文字起こし          │    │
 * │  │  ＝ 一切加工しない「本当の生データ」                       │    │
 * │  └─────────────────────────────────────────────────────────┘    │
 * │                              ↓                                  │
 * │  Layer 2: キュレーション (Curated)                               │
 * │  ┌─────────────────────────────────────────────────────────┐    │
 * │  │  Cleaner → EntityExtractor → Normalizer → CuratedRecord │    │
 * │  │  構造化された「元ネタ」データ。重複排除・正規化済み。      │    │
 * │  │  1レコード = 1情報単位（1法令/1議題/1事例/1用語）          │    │
 * │  │  ＝ マートに配る前の「信頼できる元データ」                 │    │
 * │  └─────────────────────────────────────────────────────────┘    │
 * │                              ↓                                  │
 * │  Layer 3: マート (Mart)                                         │
 * │  ┌─────────────────────────────────────────────────────────┐    │
 * │  │  Classifier → Chunker → Embedder → VectorDB             │    │
 * │  │  目的別に構造化されたナレッジストア                        │    │
 * │  └─────────────────────────────────────────────────────────┘    │
 * │                              ↓                                  │
 * │  Layer 4: ディスパッチ (Dispatch)                                │
 * │  ┌─────────────────────────────────────────────────────────┐    │
 * │  │  IntentClassifier → Router → Integrator                 │    │
 * │  │  質問意図に応じたマートルーティングと結果統合              │    │
 * │  └─────────────────────────────────────────────────────────┘    │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## データレイク vs キュレーション の違い
 *
 * ```
 * [データレイク]                      [キュレーション]
 * 議事録.pdf (20ページ)         →    議題A: 安全管理の報告 (CuratedRecord)
 *                               →    議題B: 工期変更の決議 (CuratedRecord)
 *                               →    議題C: 予算追加の承認 (CuratedRecord)
 *
 * e-Gov建設業法.html            →    第3条: 建設業の許可 (CuratedRecord)
 *                               →    第26条: 主任技術者 (CuratedRecord)
 *
 * インタビュー音声.txt          →    課題: 人手不足の状況 (CuratedRecord)
 *                               →    取組: BIM導入の経緯 (CuratedRecord)
 *                               →    成果: 工期30%短縮   (CuratedRecord)
 * ```
 *
 * キュレーション層は「1つの生データから複数の情報単位を抽出する」変換層。
 * マートはこのキュレーション済みレコードを分類・チャンク化・ベクトル化する。
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
  | 'api'            // REST API 経由データ取得
  | 'scan_ocr'       // スキャン紙 → OCR テキスト化（文字化けあり得る）
  | 'transcript'     // 音声文字起こし（Whisper等）
  | 'manual';        // 手動投入（議事録・手書きメモ等）

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

/** クロール済み生ドキュメント — 一切加工しない「本当の生データ」 */
export interface RawDocument {
  /** ソース定義 ID */
  sourceId: string;
  /** 取得元 URL（ローカルファイルの場合は file:// パス） */
  url: string;
  /** ドキュメントタイトル */
  title: string;
  /** 生テキストコンテンツ（OCR 文字化け等もそのまま保存） */
  content: string;
  /** コンテンツ種別 */
  contentType: 'html' | 'pdf' | 'text' | 'json' | 'scan' | 'transcript';
  /** クロール日時 (ISO 8601) */
  crawledAt: string;
  /** コンテンツ SHA-256 ハッシュ（重複検出用） */
  contentHash: string;
  /** 追加メタデータ */
  metadata: Record<string, unknown>;
  /**
   * 取得品質スコア (0.0 - 1.0)
   * - 1.0: 完全なデジタルテキスト（Web, API）
   * - 0.7-0.9: 良好な PDF テキスト抽出
   * - 0.3-0.7: OCR 抽出（部分的な文字化けあり）
   * - 0.0-0.3: 低品質 OCR（大量の文字化け、ほぼ読めない）
   * データレイクには品質に関わらず全データを保存する。
   * 将来の OCR 改善時に再処理できるよう、元ファイルへの参照も保持。
   */
  qualityScore?: number;
  /** 元ファイルパス（スキャン元の画像/PDF — 再 OCR 用） */
  originalFilePath?: string;
}

// =============================================================================
// Layer 2: キュレーション — 生データから構造化された「元ネタ」を抽出
// =============================================================================
//
// データレイクの生データ（議事録PDF、Webページ、音声文字起こし等）を
// 情報単位に分解し、正規化・品質チェック済みの「元ネタレコード」にする。
//
// 例:
//   議事録.pdf (20ページ) → 議題A, 議題B, 議題C (3レコード)
//   e-Gov建設業法.html    → 第3条, 第26条, ... (N レコード)
//   インタビュー音声.txt  → 課題, 取組, 成果 (3レコード)
//
// マートはこのキュレーション済みレコードを入力として受け取る。

/** キュレーション済みレコードの品質ステータス */
export type CurationQuality =
  | 'verified'       // 人間またはLLMによる検証済み
  | 'auto_extracted' // 自動抽出（未検証だが品質良好）
  | 'low_quality'    // 抽出できたが品質に問題あり（OCR文字化け等）
  | 'needs_review'   // 人間のレビューが必要
  | 'rejected';      // 品質不足で却下（データレイクには残る）

/** キュレーション済みレコードの抽出元種別 */
export type CurationSourceType =
  | 'web_article'    // Web 記事・ページ
  | 'legal_text'     // 法令・条文
  | 'meeting_minutes'// 議事録
  | 'interview'      // インタビュー・ヒアリング記録
  | 'report'         // レポート・報告書
  | 'manual'         // マニュアル・手順書
  | 'news'           // ニュース記事
  | 'specification'  // 仕様書・基準書
  | 'scan_document'  // スキャン紙ドキュメント
  | 'other';

/**
 * キュレーション済みレコード（元ネタデータ）
 *
 * 1 レコード = 1 情報単位。
 * 1 つの RawDocument から複数の CuratedRecord が生成される。
 * マートへの投入はこのレコードを起点とする。
 */
export interface CuratedRecord {
  /** レコード一意 ID */
  id: string;
  /** 元の RawDocument の ID (contentHash) — データレイクへのトレーサビリティ */
  rawDocumentHash: string;
  /** 元の RawDocument のソース ID */
  sourceId: string;
  /** 元 URL */
  sourceUrl: string;
  /** 抽出元種別 */
  sourceType: CurationSourceType;
  /** 情報単位タイトル (e.g. "第3条 建設業の許可", "議題A: 安全管理報告") */
  title: string;
  /** 正規化・クリーニング済みテキスト */
  content: string;
  /** 抽出サマリー（1-2文の要約） */
  summary: string;
  /** 品質ステータス */
  quality: CurationQuality;
  /**
   * 品質スコア (0.0 - 1.0)
   * データレイクの qualityScore とは異なり、キュレーション処理後の品質。
   * - 1.0: 完全にクリーン、構造化済み
   * - 0.7-0.9: 良好だが一部不明箇所あり
   * - 0.5-0.7: 読めるが修正が必要
   * - < 0.5: needs_review 以下
   */
  qualityScore: number;
  /** 品質に関する注記（文字化け箇所、不明語句の記録等） */
  qualityNotes: string[];
  /** 推定マート ID（キュレーション段階での仮分類） */
  suggestedMartId?: string;
  /** 抽出されたエンティティ（人名・組織名・日付・金額等） */
  entities: ExtractedEntity[];
  /** ドメイン固有メタデータ */
  metadata: Record<string, unknown>;
  /** キュレーション日時 (ISO 8601) */
  curatedAt: string;
  /** キュレーション処理バージョン（再処理の追跡用） */
  curationVersion: string;
}

/** 抽出されたエンティティ */
export interface ExtractedEntity {
  /** エンティティ種別 */
  type: 'person' | 'organization' | 'date' | 'amount' | 'law_reference' | 'location' | 'technical_term' | 'other';
  /** エンティティ値 */
  value: string;
  /** 元テキスト内での出現位置（文字インデックス） */
  offset?: number;
  /** 信頼度 (0.0 - 1.0) */
  confidence: number;
}

/** キュレーション処理の設定 */
export interface CurationConfig {
  /** 最低品質スコア（これ未満は needs_review にマーク） */
  minQualityThreshold: number;
  /** 自動分類を有効にするか */
  enableAutoClassification: boolean;
  /** エンティティ抽出を有効にするか */
  enableEntityExtraction: boolean;
  /** サマリー生成を有効にするか */
  enableSummaryGeneration: boolean;
  /** 低品質データもマートに投入するか（false なら verified + auto_extracted のみ） */
  includeLowQuality: boolean;
}

/** デフォルトのキュレーション設定 */
export const DEFAULT_CURATION_CONFIG: CurationConfig = {
  minQualityThreshold: 0.5,
  enableAutoClassification: true,
  enableEntityExtraction: true,
  enableSummaryGeneration: true,
  includeLowQuality: false,
};

// =============================================================================
// Layer 3: マート — 分類・チャンク・ベクトル化
// =============================================================================

/** チャンク戦略タイプ（汎用パターン） */
export type ChunkStrategyType =
  | 'legal_article'        // 法令条文型（条・項・号の構造を保持）
  | 'section'              // セクション型（見出し区切り）
  | 'term_definition'      // 用語定義型（1 用語 = 1 チャンク）
  | 'case_study'           // 事例型（1 事例 = 1 チャンク、長い場合は段階分割）
  | 'construction_method'  // 工法・手法型（工種・手法単位）
  | 'safety_topic'         // 安全・コンプライアンス型（災害種別・作業種別単位）
  | 'interview_qa_pair'    // インタビューQ&Aペア型（1問1答 = 1チャンク）
  | 'interview_problem'    // インタビュー課題型（1課題/問題 = 1チャンク）
  | 'interview_insight'    // インタビュー知見型（1知見/決定事項 = 1チャンク）
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

/** チャンク（マート投入単位） */
export interface Chunk {
  /** チャンク一意 ID */
  id: string;
  /** テキストコンテンツ */
  content: string;
  /** 元の CuratedRecord ID（キュレーション層へのトレーサビリティ） */
  curatedRecordId: string;
  /** 元ドキュメントのソース ID */
  sourceId: string;
  /** 元 URL */
  sourceUrl: string;
  /** チャンクインデックス（同一レコード内） */
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
// Layer 4: ディスパッチ — 意図分類・ルーティング・統合
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
