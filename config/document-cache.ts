/**
 * ドキュメントキャッシュ設定
 *
 * ============================================================================
 * 【概要】
 * ============================================================================
 *
 * Insight Business Suite 系アプリ（INSS / IOSH / IOSD）の AI アシスタントが
 * ドキュメント内容を参照する際、Office ファイルの解析結果をキャッシュする。
 *
 * ## 背景・課題
 *
 * AI チャットの度に Office ドキュメント全体を再解析するのは非効率。
 * 特に大規模なスプレッドシートやプレゼンテーションでは解析に数秒かかり、
 * レスポンスタイムの大幅な低下を招く。
 *
 * ## 設計方針
 *
 * - **キャッシュ粒度**: ドキュメントの部分単位（シート / スライド / セクション）
 * - **無効化戦略**: ドキュメントハッシュの変更を検知して自動無効化
 * - **保存場所**: プロジェクトファイル（ZIP）内の `ai_cache/` ディレクトリ
 * - **プラン別制限**: TRIAL は基本キャッシュのみ、BIZ+ は全文キャッシュ対応
 * - **TTL 管理**: キャッシュエントリに有効期限を設定し、古いキャッシュを自動削除
 *
 * ## ZIP 内部構造
 *
 * ```
 * report.iosh (ZIP archive)
 * ├── ... (既存エントリ)
 * └── ai_cache/
 *     ├── index.json              # キャッシュインデックス
 *     └── chunks/                 # 解析結果チャンク
 *         ├── chunk_001.json
 *         ├── chunk_002.json
 *         └── ...
 * ```
 *
 * ## 対象製品
 *
 * | 製品 | キャッシュ対象 | 粒度 |
 * |------|-------------|------|
 * | INSS | スライド内テキスト・ノート | スライド単位 |
 * | IOSH | セル値・数式・シート構造 | シート単位 |
 * | IOSD | 段落テキスト・見出し構造 | セクション単位 |
 *
 * ## C# WPF 実装ガイドライン
 *
 * - キャッシュ読み書きは `System.IO.Compression.ZipArchive` 経由
 * - ドキュメント保存時にキャッシュを更新（差分更新 — 変更されたチャンクのみ）
 * - AI チャット開始時にキャッシュの有効性を検証（ハッシュ比較）
 * - キャッシュミス時はオンデマンドで解析・キャッシュ作成
 *
 * 参照:
 * - config/project-file.ts — ZIP 内パス定義・メタデータスキーマ
 * - config/ai-assistant.ts — AI アシスタント設定・ツール定義
 * - config/ai-memory.ts — AI メモリシステム（同じ ZIP 内に格納）
 */

import type { ProductCode, PlanCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** キャッシュチャンクの粒度（製品別） */
export type CacheGranularity = 'slide' | 'sheet' | 'section';

/** キャッシュエントリの状態 */
export type CacheEntryStatus = 'valid' | 'stale' | 'expired';

/**
 * 製品別のキャッシュ粒度マッピング
 */
export const CACHE_GRANULARITY_BY_PRODUCT: Partial<Record<ProductCode, CacheGranularity>> = {
  INSS: 'slide',
  IOSH: 'sheet',
  IOSD: 'section',
} as const;

/**
 * キャッシュインデックス（ai_cache/index.json）
 *
 * キャッシュ全体のメタ情報を管理。
 * ドキュメントハッシュとチャンクの対応関係を保持する。
 */
export interface DocumentCacheIndex {
  /** スキーマバージョン */
  version: '1.0';
  /** キャッシュ対象のドキュメントハッシュ（SHA-256） */
  documentHash: string;
  /** キャッシュ作成日時（ISO 8601） */
  createdAt: string;
  /** キャッシュ最終更新日時（ISO 8601） */
  updatedAt: string;
  /** キャッシュの有効期限（ISO 8601） */
  expiresAt: string;
  /** キャッシュ粒度 */
  granularity: CacheGranularity;
  /** 製品コード */
  productCode: ProductCode;
  /** チャンク一覧 */
  chunks: CacheChunkEntry[];
  /** キャッシュ全体のトークン推定数 */
  totalEstimatedTokens: number;
  /** キャッシュ全体のサイズ（バイト） */
  totalSizeBytes: number;
}

/**
 * キャッシュチャンクのインデックスエントリ
 *
 * チャンクの概要情報。実データは別ファイル（chunks/chunk_XXX.json）に格納。
 */
export interface CacheChunkEntry {
  /** チャンク ID（例: "slide_001", "sheet_sales", "section_intro"） */
  id: string;
  /** ZIP 内のファイルパス */
  filePath: string;
  /** チャンクの表示ラベル（例: "スライド 1", "売上シート"） */
  label: string;
  /** このチャンクのコンテンツハッシュ（SHA-256） */
  contentHash: string;
  /** 推定トークン数 */
  estimatedTokens: number;
  /** サイズ（バイト） */
  sizeBytes: number;
  /** 最終更新日時（ISO 8601） */
  updatedAt: string;
  /** チャンクのソート順序（0-based） */
  order: number;
}

/**
 * キャッシュチャンクの実データ（chunks/chunk_XXX.json）
 *
 * AI アシスタントのコンテキストに渡すための解析済みテキストデータ。
 */
export interface CacheChunkData {
  /** チャンク ID（CacheChunkEntry.id と一致） */
  id: string;
  /** コンテンツハッシュ（整合性チェック用） */
  contentHash: string;
  /** 解析日時（ISO 8601） */
  parsedAt: string;
  /** 解析元の情報 */
  source: CacheChunkSource;
  /** 解析済みテキスト（AI に渡す本文） */
  textContent: string;
  /** 構造化メタデータ（製品固有） */
  structuredData?: Record<string, unknown>;
}

/**
 * チャンクの解析元情報
 */
export interface CacheChunkSource {
  /** 粒度ごとのインデックス（スライド番号 / シートインデックス / セクション番号） */
  index: number;
  /** 元の名前（シート名 / セクション見出し等） */
  name?: string;
}

// =============================================================================
// INSS（スライド）固有の構造化データ
// =============================================================================

/** スライドキャッシュの構造化データ */
export interface SlideCacheStructuredData {
  /** スライド番号（1-based） */
  slideNumber: number;
  /** レイアウト種別 */
  layout?: string;
  /** スライドタイトル */
  title?: string;
  /** テキストボックス一覧 */
  textBoxes: Array<{
    shapeId: string;
    text: string;
  }>;
  /** 発表者ノート */
  notes?: string;
  /** 画像の数 */
  imageCount: number;
  /** 表の数 */
  tableCount: number;
}

// =============================================================================
// IOSH（シート）固有の構造化データ
// =============================================================================

/** シートキャッシュの構造化データ */
export interface SheetCacheStructuredData {
  /** シート名 */
  sheetName: string;
  /** シートインデックス（0-based） */
  sheetIndex: number;
  /** 使用範囲（例: "A1:Z100"） */
  usedRange?: string;
  /** 行数 */
  rowCount: number;
  /** 列数 */
  columnCount: number;
  /** ヘッダー行（先頭行の値） */
  headers?: string[];
  /** 数式の数 */
  formulaCount: number;
  /** グラフの数 */
  chartCount: number;
}

// =============================================================================
// IOSD（セクション）固有の構造化データ
// =============================================================================

/** セクションキャッシュの構造化データ */
export interface SectionCacheStructuredData {
  /** セクション番号（0-based） */
  sectionIndex: number;
  /** セクション見出し */
  heading?: string;
  /** 見出しレベル（1-6、見出しなしは 0） */
  headingLevel: number;
  /** 段落数 */
  paragraphCount: number;
  /** 表の数 */
  tableCount: number;
  /** 画像の数 */
  imageCount: number;
  /** 文字数 */
  characterCount: number;
}

// =============================================================================
// プロジェクトファイル内のパス定義
// =============================================================================

/**
 * プロジェクトファイル（.iosh/.inss/.iosd）内のキャッシュファイルパス
 */
export const DOCUMENT_CACHE_PATHS = {
  /** キャッシュインデックス */
  INDEX: 'ai_cache/index.json',
  /** チャンクディレクトリ */
  CHUNKS_DIR: 'ai_cache/chunks/',
} as const;

/**
 * チャンクファイルのパスを生成
 *
 * @example
 * ```typescript
 * getChunkFilePath('slide_001');
 * // → 'ai_cache/chunks/slide_001.json'
 * ```
 */
export function getChunkFilePath(chunkId: string): string {
  return `${DOCUMENT_CACHE_PATHS.CHUNKS_DIR}${chunkId}.json`;
}

// =============================================================================
// プラン別制限
// =============================================================================

/** プラン別キャッシュ制限 */
export interface DocumentCacheLimits {
  /** キャッシュ機能の利用可否 */
  enabled: boolean;
  /** 最大チャンク数 */
  maxChunks: number;
  /** キャッシュ合計の最大サイズ（MB） */
  maxTotalSizeMB: number;
  /** チャンク 1 件の最大トークン推定数 */
  maxTokensPerChunk: number;
  /** キャッシュ TTL（時間） */
  ttlHours: number;
  /** 構造化データの保持可否 */
  structuredDataEnabled: boolean;
}

/**
 * プラン別のキャッシュ制限定義
 *
 * - TRIAL: 基本キャッシュのみ（小規模ドキュメント向け）
 * - BIZ: 全文キャッシュ + 構造化データ
 * - ENT: 無制限
 */
export const DOCUMENT_CACHE_LIMITS: Record<PlanCode, DocumentCacheLimits> = {
  FREE: {
    enabled: true,
    maxChunks: 50,
    maxTotalSizeMB: 10,
    maxTokensPerChunk: 8_000,
    ttlHours: 72,
    structuredDataEnabled: true,
  },
  TRIAL: {
    enabled: true,
    maxChunks: 20,
    maxTotalSizeMB: 5,
    maxTokensPerChunk: 4_000,
    ttlHours: 24,
    structuredDataEnabled: false,
  },
  BIZ: {
    enabled: true,
    maxChunks: 100,
    maxTotalSizeMB: 50,
    maxTokensPerChunk: 16_000,
    ttlHours: 168, // 7 days
    structuredDataEnabled: true,
  },
  ENT: {
    enabled: true,
    maxChunks: -1, // unlimited
    maxTotalSizeMB: -1,
    maxTokensPerChunk: -1,
    ttlHours: -1, // no expiration
    structuredDataEnabled: true,
  },
};

// =============================================================================
// キャッシュ設定定数
// =============================================================================

/** キャッシュ設定 */
export const DOCUMENT_CACHE_SETTINGS = {
  /** 1 文字あたりの推定トークン数（日本語） */
  tokensPerCharJa: 1.5,
  /** 1 文字あたりの推定トークン数（英語） */
  tokensPerCharEn: 0.25,
  /** AI コンテキストに含める最大トークン数（全チャンク合計） */
  maxContextTokens: 50_000,
  /** キャッシュ無効化チェック間隔（秒） */
  validationIntervalSeconds: 30,
  /** キャッシュクリーンアップ間隔（分） */
  cleanupIntervalMinutes: 60,
} as const;

// =============================================================================
// ユーティリティ関数
// =============================================================================

/**
 * キャッシュ機能が利用可能か確認
 */
export function isCacheEnabled(plan: PlanCode): boolean {
  return DOCUMENT_CACHE_LIMITS[plan]?.enabled ?? false;
}

/**
 * 製品のキャッシュ粒度を取得
 */
export function getCacheGranularity(product: ProductCode): CacheGranularity | null {
  return CACHE_GRANULARITY_BY_PRODUCT[product] ?? null;
}

/**
 * 空のキャッシュインデックスを生成
 */
export function createEmptyCacheIndex(
  product: ProductCode,
  documentHash: string,
  ttlHours: number,
): DocumentCacheIndex | null {
  const granularity = getCacheGranularity(product);
  if (!granularity) return null;

  const now = new Date();
  const expiresAt = ttlHours === -1
    ? new Date(9999, 11, 31).toISOString() // practically never
    : new Date(now.getTime() + ttlHours * 60 * 60 * 1000).toISOString();

  return {
    version: '1.0',
    documentHash,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt,
    granularity,
    productCode: product,
    chunks: [],
    totalEstimatedTokens: 0,
    totalSizeBytes: 0,
  };
}

/**
 * キャッシュインデックスの有効性を検証
 *
 * ドキュメントハッシュの一致 + TTL チェックを行い、
 * キャッシュが引き続き有効かどうかを判定する。
 *
 * @param index キャッシュインデックス
 * @param currentDocumentHash 現在のドキュメントハッシュ
 * @returns キャッシュの状態
 */
export function validateCacheIndex(
  index: DocumentCacheIndex,
  currentDocumentHash: string,
): CacheEntryStatus {
  // ドキュメントが変更されていればキャッシュは無効
  if (index.documentHash !== currentDocumentHash) {
    return 'stale';
  }

  // TTL チェック
  const now = new Date().getTime();
  const expiresAt = new Date(index.expiresAt).getTime();
  if (now > expiresAt) {
    return 'expired';
  }

  return 'valid';
}

/**
 * キャッシュにチャンクを追加可能か確認
 */
export function canAddChunk(
  plan: PlanCode,
  currentChunkCount: number,
  currentTotalSizeBytes: number,
  newChunkSizeBytes: number,
): { allowed: boolean; reason?: string; reasonJa?: string } {
  const limits = DOCUMENT_CACHE_LIMITS[plan];
  if (!limits.enabled) {
    return {
      allowed: false,
      reason: 'Cache is not enabled for this plan',
      reasonJa: 'このプランではキャッシュが利用できません',
    };
  }

  if (limits.maxChunks !== -1 && currentChunkCount >= limits.maxChunks) {
    return {
      allowed: false,
      reason: `Maximum chunk count reached (${limits.maxChunks})`,
      reasonJa: `チャンク数の上限に達しました（${limits.maxChunks}）`,
    };
  }

  const maxBytes = limits.maxTotalSizeMB === -1 ? Infinity : limits.maxTotalSizeMB * 1024 * 1024;
  if (currentTotalSizeBytes + newChunkSizeBytes > maxBytes) {
    return {
      allowed: false,
      reason: `Cache size limit exceeded (${limits.maxTotalSizeMB}MB)`,
      reasonJa: `キャッシュサイズの上限を超えます（${limits.maxTotalSizeMB}MB）`,
    };
  }

  return { allowed: true };
}

/**
 * テキストの推定トークン数を計算
 *
 * 日本語テキストと英語テキストで異なる係数を使用。
 * 正確なトークン数はモデル依存だが、キャッシュ容量管理には十分な精度。
 */
export function estimateTokenCount(text: string): number {
  // 簡易判定: Unicode の CJK 範囲を含むかどうかで判定
  const cjkRegex = /[\u3000-\u9fff\uf900-\ufaff]/;
  const isCjk = cjkRegex.test(text);

  const tokensPerChar = isCjk
    ? DOCUMENT_CACHE_SETTINGS.tokensPerCharJa
    : DOCUMENT_CACHE_SETTINGS.tokensPerCharEn;

  return Math.ceil(text.length * tokensPerChar);
}

/**
 * チャンクのトークン数が制限内か確認
 */
export function isWithinTokenLimit(plan: PlanCode, estimatedTokens: number): boolean {
  const limits = DOCUMENT_CACHE_LIMITS[plan];
  if (limits.maxTokensPerChunk === -1) return true;
  return estimatedTokens <= limits.maxTokensPerChunk;
}

/**
 * AI コンテキスト用にチャンクを選択
 *
 * トークン予算内で最も関連性の高いチャンクを選択する。
 * order 順に優先的に選択し、予算を超えたら打ち切る。
 *
 * @param chunks 全チャンクエントリ
 * @param maxTokens トークン予算（デフォルト: DOCUMENT_CACHE_SETTINGS.maxContextTokens）
 * @returns 選択されたチャンク ID の配列
 */
export function selectChunksForContext(
  chunks: CacheChunkEntry[],
  maxTokens: number = DOCUMENT_CACHE_SETTINGS.maxContextTokens,
): string[] {
  const sorted = [...chunks].sort((a, b) => a.order - b.order);
  const selected: string[] = [];
  let usedTokens = 0;

  for (const chunk of sorted) {
    if (usedTokens + chunk.estimatedTokens > maxTokens) {
      break;
    }
    selected.push(chunk.id);
    usedTokens += chunk.estimatedTokens;
  }

  return selected;
}

/**
 * 期限切れチャンクの ID 一覧を取得（クリーンアップ用）
 *
 * キャッシュインデックス自体が expired/stale の場合は全チャンクを返す。
 */
export function getExpiredChunkIds(
  index: DocumentCacheIndex,
  currentDocumentHash: string,
): string[] {
  const status = validateCacheIndex(index, currentDocumentHash);
  if (status !== 'valid') {
    return index.chunks.map(c => c.id);
  }
  return [];
}

/**
 * キャッシュの TTL を取得（プラン別）
 */
export function getCacheTtlHours(plan: PlanCode): number {
  return DOCUMENT_CACHE_LIMITS[plan]?.ttlHours ?? 24;
}

/**
 * キャッシュサイズの表示用文字列を生成
 *
 * @example
 * ```typescript
 * formatCacheSize(1_500_000, 'ja');
 * // → "1.4 MB"
 *
 * formatCacheSize(500, 'ja');
 * // → "500 B"
 * ```
 */
export function formatCacheSize(bytes: number, locale: 'ja' | 'en' = 'ja'): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * キャッシュステータスの表示用ラベルを生成
 */
export function getCacheStatusLabel(
  status: CacheEntryStatus,
  locale: 'ja' | 'en' = 'ja',
): string {
  const labels: Record<CacheEntryStatus, { ja: string; en: string }> = {
    valid: { ja: '有効', en: 'Valid' },
    stale: { ja: '更新が必要', en: 'Needs update' },
    expired: { ja: '期限切れ', en: 'Expired' },
  };
  return labels[status][locale];
}

/**
 * キャッシュの概要情報を生成（UI 表示用）
 */
export function getCacheSummary(
  index: DocumentCacheIndex,
  currentDocumentHash: string,
  plan: PlanCode,
  locale: 'ja' | 'en' = 'ja',
): {
  status: CacheEntryStatus;
  statusLabel: string;
  chunkCount: number;
  totalSize: string;
  totalTokens: number;
  limitInfo: string;
} {
  const status = validateCacheIndex(index, currentDocumentHash);
  const limits = DOCUMENT_CACHE_LIMITS[plan];
  const chunkLimitStr = limits.maxChunks === -1
    ? (locale === 'ja' ? '無制限' : 'Unlimited')
    : `${index.chunks.length}/${limits.maxChunks}`;

  return {
    status,
    statusLabel: getCacheStatusLabel(status, locale),
    chunkCount: index.chunks.length,
    totalSize: formatCacheSize(index.totalSizeBytes, locale),
    totalTokens: index.totalEstimatedTokens,
    limitInfo: chunkLimitStr,
  };
}

// =============================================================================
// ライフサイクル — いつ・どこで呼ばれるか
// =============================================================================

/**
 * キャッシュのライフサイクルイベント
 *
 * C# WPF 側で各イベントに対応する処理を実装する。
 * このモジュールはイベントの種別と、各イベントで実行すべき処理の仕様を定義する。
 *
 * ## 呼び出しタイミング一覧
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  (1) ファイルを開く                                              │
 * │      OpenDocument                                               │
 * │      → ZIP から ai_cache/index.json を読む                       │
 * │      → ドキュメントハッシュ比較 → valid / stale / expired         │
 * │      → stale/expired ならキャッシュを破棄（チャンク削除）          │
 * │                                                                 │
 * │  (2) AI チャット開始（ユーザーがメッセージ送信）                   │
 * │      BeforeAiChat                                               │
 * │      → キャッシュが valid ならそのまま使う（高速パス）             │
 * │      → キャッシュが無い or stale ならオンデマンド解析              │
 * │        → Office ファイルをパース → チャンクに分割 → ZIP に保存     │
 * │      → selectChunksForContext() でトークン予算内のチャンクを選択   │
 * │      → formatCacheForPrompt() でテキスト化                       │
 * │      → buildEnhancedSystemPrompt() に注入                       │
 * │                                                                 │
 * │  (3) ドキュメント保存                                            │
 * │      AfterSave                                                  │
 * │      → ドキュメントハッシュを再計算                               │
 * │      → 変更されたチャンクだけ差分更新（contentHash 比較）          │
 * │      → index.json を更新                                        │
 * │                                                                 │
 * │  (4) 定期クリーンアップ（バックグラウンド）                       │
 * │      PeriodicCleanup                                            │
 * │      → cleanupIntervalMinutes ごとに実行                         │
 * │      → 期限切れチャンクの削除                                    │
 * │      → ZIP サイズの最適化（必要に応じて再パック）                 │
 * │                                                                 │
 * │  (5) ファイルを閉じる                                            │
 * │      CloseDocument                                              │
 * │      → ダーティなキャッシュがあれば ZIP に書き戻し                │
 * │      → 一時ファイルのクリーンアップ                               │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 */
export type CacheLifecycleEvent =
  | 'open_document'
  | 'before_ai_chat'
  | 'after_save'
  | 'periodic_cleanup'
  | 'close_document';

/**
 * 各ライフサイクルイベントの仕様
 */
export const CACHE_LIFECYCLE_SPEC: Record<CacheLifecycleEvent, {
  descriptionJa: string;
  descriptionEn: string;
  /** このイベントはユーザー操作を待たせるか（同期的に処理すべきか） */
  blocking: boolean;
  /** 推奨実装: バックグラウンドスレッドで実行すべきか */
  backgroundThread: boolean;
}> = {
  open_document: {
    descriptionJa: 'ファイルオープン時にキャッシュインデックスを読み込み、有効性を検証する',
    descriptionEn: 'Load cache index on file open and validate against document hash',
    blocking: false,
    backgroundThread: true,
  },
  before_ai_chat: {
    descriptionJa: 'AI チャット送信前にキャッシュを確認し、必要ならオンデマンド解析を実行する',
    descriptionEn: 'Check cache before AI chat, run on-demand parsing if needed',
    blocking: true,
    backgroundThread: false,
  },
  after_save: {
    descriptionJa: 'ドキュメント保存後にキャッシュの差分更新を実行する',
    descriptionEn: 'Run incremental cache update after document save',
    blocking: false,
    backgroundThread: true,
  },
  periodic_cleanup: {
    descriptionJa: '定期的に期限切れキャッシュを削除する',
    descriptionEn: 'Periodically remove expired cache entries',
    blocking: false,
    backgroundThread: true,
  },
  close_document: {
    descriptionJa: 'ファイルクローズ時にダーティキャッシュを書き戻す',
    descriptionEn: 'Flush dirty cache entries on file close',
    blocking: true,
    backgroundThread: false,
  },
};

// =============================================================================
// AI プロンプト注入 — buildEnhancedSystemPrompt() から呼ばれる
// =============================================================================

/**
 * キャッシュチャンクを AI のシステムプロンプトに注入するテキストに整形する
 *
 * buildEnhancedSystemPrompt() のステップ 5.5（メモリの後、コマンド一覧の前）で呼ばれる。
 *
 * @param chunks チャンクデータの配列（selectChunksForContext() で選択済み）
 * @param granularity キャッシュ粒度
 * @param locale ロケール
 * @returns システムプロンプトに追加するテキスト（空文字列 = キャッシュなし）
 *
 * @example
 * ```typescript
 * // C# 側で ZIP からチャンクを読み込んだ後:
 * const selectedIds = selectChunksForContext(index.chunks);
 * const chunkDataList = selectedIds.map(id => readChunkFromZip(id));
 * const prompt = formatCacheForPrompt(chunkDataList, 'sheet', 'ja');
 * // → "【現在のドキュメント内容】\n--- シート「売上」 ---\n..."
 * ```
 */
export function formatCacheForPrompt(
  chunks: CacheChunkData[],
  granularity: CacheGranularity,
  locale: 'ja' | 'en' = 'ja',
): string {
  if (chunks.length === 0) return '';

  const header = locale === 'ja'
    ? '【現在のドキュメント内容】'
    : '[Current Document Content]';

  const granularityLabels: Record<CacheGranularity, { ja: string; en: string }> = {
    slide: { ja: 'スライド', en: 'Slide' },
    sheet: { ja: 'シート', en: 'Sheet' },
    section: { ja: 'セクション', en: 'Section' },
  };
  const label = granularityLabels[granularity][locale];

  const parts = chunks.map(chunk => {
    const name = chunk.source.name
      ? `${label}「${chunk.source.name}」`
      : `${label} ${chunk.source.index + 1}`;
    return `--- ${name} ---\n${chunk.textContent}`;
  });

  return `${header}\n以下はユーザーが現在編集中のドキュメントから抽出したテキストです。質問や指示に対してこの内容を参照してください。\n\n${parts.join('\n\n')}`;
}

/**
 * AI チャット前のキャッシュ解決結果
 *
 * C# WPF 側の before_ai_chat ハンドラが返す構造。
 * buildEnhancedSystemPrompt() に渡す。
 */
export interface ResolvedDocumentCache {
  /** キャッシュが利用可能か */
  available: boolean;
  /** プロンプトに注入するテキスト（available=false なら空文字列） */
  promptText: string;
  /** 使用したチャンク数 */
  chunkCount: number;
  /** 使用した推定トークン数 */
  estimatedTokens: number;
  /** キャッシュヒットしたか（false = オンデマンド解析が走った） */
  cacheHit: boolean;
}

/**
 * キャッシュなしの空の解決結果を生成
 */
export function createEmptyResolvedCache(): ResolvedDocumentCache {
  return {
    available: false,
    promptText: '',
    chunkCount: 0,
    estimatedTokens: 0,
    cacheHit: false,
  };
}
