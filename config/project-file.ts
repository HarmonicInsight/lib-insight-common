/**
 * InsightOffice プロジェクトファイル（ZIP パッケージ）仕様
 *
 * ============================================================================
 * 【概要】
 * ============================================================================
 *
 * InsightOffice 各製品（INSS / IOSH / IOSD）のプロジェクトファイルは
 * **ZIP 形式のアーカイブ**として、Office ドキュメント + メタデータ + 付随データを
 * 1 ファイルに集約する。
 *
 * ## 設計思想
 *
 * - **ポータビリティ**: ファイル 1 つ移動すれば全データが移動する
 * - **整合性**: Office ファイルとメタデータの分離事故を防止
 * - **業界標準**: .docx / .xlsx / .pptx / .epub 等と同じ ZIP ベースアプローチ
 * - **段階的保存**: 編集中は一時ディレクトリに展開し、保存時に再パッケージ
 *
 * ## ZIP 内部構造
 *
 * ```
 * report.iosh (ZIP archive)
 * ├── [content_types].xml          # コンテントタイプ定義（OPC 準拠）
 * ├── metadata.json                # プロジェクトメタデータ
 * ├── document.xlsx                # 元の Office ファイル（製品により異なる）
 * ├── sticky_notes.json            # 付箋データ
 * ├── ai_memory.json               # AI ホットキャッシュ
 * ├── ai_memory_deep/              # AI ディープストレージ（PRO+）
 * │   ├── glossary.json
 * │   ├── people.json
 * │   ├── projects.json
 * │   └── context.json
 * ├── ai_chat_history.json         # AI チャット履歴
 * ├── history/                     # バージョン履歴
 * │   ├── index.json               # 履歴インデックス
 * │   └── snapshots/               # 過去バージョンのスナップショット
 * │       ├── v001.json
 * │       └── v002.json
 * ├── references/                  # 参考資料
 * │   ├── index.json               # 参考資料インデックス
 * │   └── files/                   # 添付ファイル本体
 * │       ├── ref_001.pdf
 * │       └── ref_002.png
 * └── scripts/                     # Python スクリプト
 *     ├── index.json               # スクリプトインデックス
 *     └── files/
 *         └── script_001.py
 * ```
 *
 * ## 対象製品
 *
 * | 製品 | 拡張子 | 内包 Office 形式 |
 * |------|--------|-----------------|
 * | INSS | .inss  | .pptx           |
 * | IOSH | .iosh  | .xlsx           |
 * | IOSD | .iosd  | .docx           |
 *
 * ## 実装ガイドライン（C# WPF）
 *
 * - `System.IO.Compression.ZipArchive`（.NET 標準）を使用
 * - 保存時: 一時ファイルに書き込み → 完了後にリネーム（アトミック保存）
 * - 読込時: 一時ディレクトリに展開 → アプリ終了時にクリーンアップ
 * - 圧縮レベル: `CompressionLevel.Optimal`（Office ファイルは既に圧縮済みなので効果は限定的）
 *
 * 参照:
 * - config/products.ts — ProjectFileConfig（拡張子・MIME タイプ定義）
 * - config/ai-memory.ts — AI メモリの ZIP 内パス定義
 * - config/sticky-notes.ts — 付箋データモデル
 */

import type { ProductCode, PlanCode } from './products';

// =============================================================================
// スキーマバージョン
// =============================================================================

/**
 * プロジェクトファイルのスキーマバージョン
 *
 * メジャー変更（構造の互換性がない変更）時にインクリメント。
 * マイナー変更（後方互換性のある追加）時にマイナーをインクリメント。
 */
export const PROJECT_FILE_SCHEMA_VERSION = '1.0' as const;

// =============================================================================
// ZIP 内部パス定義
// =============================================================================

/**
 * プロジェクトファイル内のエントリパス（ZIP 内の相対パス）
 *
 * 各アプリの実装では、これらのパスを使って ZipArchive のエントリにアクセスする。
 *
 * @example C# での使用例
 * ```csharp
 * using var archive = ZipFile.Open(projectPath, ZipArchiveMode.Read);
 * var metadataEntry = archive.GetEntry(ProjectFilePaths.METADATA);
 * ```
 */
export const PROJECT_FILE_PATHS = {
  // --- ルートレベル ---

  /** コンテントタイプ定義（OPC 準拠） */
  CONTENT_TYPES: '[content_types].xml',

  /** プロジェクトメタデータ */
  METADATA: 'metadata.json',

  /** 付箋データ */
  STICKY_NOTES: 'sticky_notes.json',

  /** AI チャット履歴 */
  AI_CHAT_HISTORY: 'ai_chat_history.json',

  // --- AI メモリ（config/ai-memory.ts の MEMORY_FILE_PATHS と同期） ---

  /** AI ホットキャッシュ */
  AI_MEMORY: 'ai_memory.json',
  /** AI ディープストレージ: 用語集 */
  AI_MEMORY_DEEP_GLOSSARY: 'ai_memory_deep/glossary.json',
  /** AI ディープストレージ: 人物 */
  AI_MEMORY_DEEP_PEOPLE: 'ai_memory_deep/people.json',
  /** AI ディープストレージ: プロジェクト */
  AI_MEMORY_DEEP_PROJECTS: 'ai_memory_deep/projects.json',
  /** AI ディープストレージ: 組織コンテキスト */
  AI_MEMORY_DEEP_CONTEXT: 'ai_memory_deep/context.json',

  // --- バージョン履歴 ---

  /** 履歴インデックス */
  HISTORY_INDEX: 'history/index.json',
  /** スナップショットディレクトリ */
  HISTORY_SNAPSHOTS_DIR: 'history/snapshots/',

  // --- 参考資料 ---

  /** 参考資料インデックス */
  REFERENCES_INDEX: 'references/index.json',
  /** 参考資料ファイルディレクトリ */
  REFERENCES_FILES_DIR: 'references/files/',

  // --- Python スクリプト ---

  /** スクリプトインデックス */
  SCRIPTS_INDEX: 'scripts/index.json',
  /** スクリプトファイルディレクトリ */
  SCRIPTS_FILES_DIR: 'scripts/files/',
} as const;

/**
 * 製品別の内包 Office ドキュメントファイル名
 *
 * ZIP 内で Office ファイルはこの固定名で格納される。
 */
export const INNER_DOCUMENT_NAMES: Record<string, string> = {
  INSS: 'document.pptx',
  IOSH: 'document.xlsx',
  IOSD: 'document.docx',
} as const;

/**
 * 内包 Office ドキュメントのファイル名を取得
 */
export function getInnerDocumentName(product: ProductCode): string | null {
  return INNER_DOCUMENT_NAMES[product] ?? null;
}

// =============================================================================
// メタデータスキーマ
// =============================================================================

/**
 * プロジェクトファイルのメタデータ（metadata.json）
 *
 * ファイルの管理情報を格納。ZIP 内の `metadata.json` として保存される。
 */
export interface ProjectFileMetadata {
  /** スキーマバージョン */
  schemaVersion: typeof PROJECT_FILE_SCHEMA_VERSION;

  /** 作成元の製品コード */
  productCode: ProductCode;

  /** 作成元アプリのバージョン（例: "2.1.0"） */
  appVersion: string;

  /** 作成元アプリのビルド番号 */
  appBuildNumber: number;

  /** プロジェクトの表示名 */
  title: string;

  /** 説明（任意） */
  description?: string;

  /** 作成者名 */
  author: string;

  /** 作成者メールアドレス（任意） */
  authorEmail?: string;

  /** 作成日時（ISO 8601） */
  createdAt: string;

  /** 最終更新日時（ISO 8601） */
  updatedAt: string;

  /** 最終更新者名 */
  lastModifiedBy: string;

  /** 内包 Office ファイルの元ファイル名（例: "売上報告_2026Q1.xlsx"） */
  originalFileName: string;

  /** 内包 Office ファイルの SHA-256 ハッシュ（整合性チェック用） */
  documentHash: string;

  /** バージョン履歴のエントリ数 */
  historyCount: number;

  /** 参考資料の添付数 */
  referenceCount: number;

  /** Python スクリプトの数 */
  scriptCount: number;

  /** タグ（分類用、任意） */
  tags?: string[];

  /** カスタムプロパティ（製品固有の拡張用） */
  customProperties?: Record<string, string>;
}

// =============================================================================
// バージョン履歴スキーマ
// =============================================================================

/** バージョン履歴のスナップショット種別 */
export type HistorySnapshotType = 'auto' | 'manual' | 'import';

/**
 * バージョン履歴インデックス（history/index.json）
 */
export interface HistoryIndex {
  /** 最新バージョン番号 */
  latestVersion: number;
  /** スナップショット一覧 */
  entries: HistoryEntry[];
}

/**
 * バージョン履歴エントリ
 */
export interface HistoryEntry {
  /** バージョン番号（1-based、連番） */
  version: number;
  /** スナップショットファイル名（例: "v001.json"） */
  snapshotFile: string;
  /** 保存種別 */
  type: HistorySnapshotType;
  /** 保存日時（ISO 8601） */
  savedAt: string;
  /** 保存者名 */
  savedBy: string;
  /** 変更の説明（手動保存時に入力） */
  comment?: string;
  /** この時点のドキュメント SHA-256 ハッシュ */
  documentHash: string;
  /** スナップショットサイズ（バイト） */
  sizeBytes: number;
}

// =============================================================================
// 参考資料スキーマ
// =============================================================================

/** 参考資料の種別 */
export type ReferenceType = 'pdf' | 'image' | 'text' | 'spreadsheet' | 'presentation' | 'document' | 'other';

/**
 * 参考資料インデックス（references/index.json）
 */
export interface ReferencesIndex {
  /** 参考資料一覧 */
  entries: ReferenceEntry[];
}

/**
 * 参考資料エントリ
 */
export interface ReferenceEntry {
  /** 参考資料ID（UUID） */
  id: string;
  /** 表示名 */
  displayName: string;
  /** ZIP 内のファイルパス（例: "references/files/ref_001.pdf"） */
  filePath: string;
  /** 元ファイル名 */
  originalFileName: string;
  /** MIME タイプ */
  mimeType: string;
  /** ファイル種別 */
  type: ReferenceType;
  /** ファイルサイズ（バイト） */
  sizeBytes: number;
  /** 追加日時（ISO 8601） */
  addedAt: string;
  /** 追加者名 */
  addedBy: string;
  /** 説明（任意） */
  description?: string;
  /** AI コンテキストとして使用するか */
  useAsAiContext: boolean;
}

// =============================================================================
// スクリプトスキーマ
// =============================================================================

/**
 * スクリプトインデックス（scripts/index.json）
 */
export interface ScriptsIndex {
  /** スクリプト一覧 */
  entries: ScriptEntry[];
}

/**
 * スクリプトエントリ
 */
export interface ScriptEntry {
  /** スクリプトID（UUID） */
  id: string;
  /** 表示名 */
  displayName: string;
  /** ZIP 内のファイルパス（例: "scripts/files/script_001.py"） */
  filePath: string;
  /** 説明 */
  description?: string;
  /** 作成日時（ISO 8601） */
  createdAt: string;
  /** 最終更新日時（ISO 8601） */
  updatedAt: string;
  /** 作成者名 */
  author: string;
  /** AI コードエディターで生成されたか */
  generatedByAi: boolean;
}

// =============================================================================
// AI チャット履歴スキーマ
// =============================================================================

/** チャットメッセージのロール */
export type ChatRole = 'user' | 'assistant';

/**
 * AI チャット履歴（ai_chat_history.json）
 */
export interface AiChatHistory {
  /** スキーマバージョン */
  version: '1.0';
  /** セッション一覧 */
  sessions: ChatSession[];
}

/**
 * チャットセッション
 */
export interface ChatSession {
  /** セッションID */
  id: string;
  /** セッション開始日時（ISO 8601） */
  startedAt: string;
  /** 使用モデルID */
  modelId: string;
  /** メッセージ一覧 */
  messages: ChatMessage[];
}

/**
 * チャットメッセージ
 */
export interface ChatMessage {
  /** メッセージID */
  id: string;
  /** ロール */
  role: ChatRole;
  /** メッセージ本文 */
  content: string;
  /** 送信日時（ISO 8601） */
  timestamp: string;
}

// =============================================================================
// コンテントタイプ定義
// =============================================================================

/**
 * [content_types].xml のテンプレート
 *
 * OPC（Open Packaging Conventions）に準拠したコンテントタイプ定義。
 * ZIP ベースのドキュメント形式として標準的な慣習。
 */
export function generateContentTypesXml(product: ProductCode): string {
  const innerDocName = getInnerDocumentName(product);
  if (!innerDocName) return '';

  const officeContentType: Record<string, string> = {
    INSS: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    IOSH: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    IOSD: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    `  <Default Extension="json" ContentType="application/json" />`,
    `  <Default Extension="xml" ContentType="application/xml" />`,
    `  <Default Extension="py" ContentType="text/x-python" />`,
    `  <Default Extension="pdf" ContentType="application/pdf" />`,
    `  <Default Extension="png" ContentType="image/png" />`,
    `  <Default Extension="jpg" ContentType="image/jpeg" />`,
    `  <Override PartName="/${innerDocName}" ContentType="${officeContentType[product] ?? 'application/octet-stream'}" />`,
    `  <Override PartName="/metadata.json" ContentType="application/json" />`,
    '</Types>',
  ].join('\n');
}

// =============================================================================
// プラン別制限
// =============================================================================

/**
 * プロジェクトファイルのプラン別容量制限
 */
export interface ProjectFileLimits {
  /** バージョン履歴の最大保持数 */
  maxHistoryVersions: number;
  /** 参考資料の最大添付数 */
  maxReferences: number;
  /** 参考資料 1 ファイルの最大サイズ（MB） */
  maxReferenceSizeMB: number;
  /** 参考資料の合計最大サイズ（MB） */
  maxTotalReferenceSizeMB: number;
  /** Python スクリプトの最大数 */
  maxScripts: number;
  /** AI チャット履歴の最大セッション数 */
  maxChatSessions: number;
}

/**
 * プラン別のプロジェクトファイル制限
 */
export const PROJECT_FILE_LIMITS: Record<PlanCode, ProjectFileLimits> = {
  TRIAL: {
    maxHistoryVersions: 50,
    maxReferences: 20,
    maxReferenceSizeMB: 50,
    maxTotalReferenceSizeMB: 500,
    maxScripts: 50,
    maxChatSessions: 100,
  },
  STD: {
    maxHistoryVersions: 20,
    maxReferences: 10,
    maxReferenceSizeMB: 20,
    maxTotalReferenceSizeMB: 200,
    maxScripts: 10,
    maxChatSessions: 50,
  },
  PRO: {
    maxHistoryVersions: 100,
    maxReferences: 50,
    maxReferenceSizeMB: 100,
    maxTotalReferenceSizeMB: 2000,
    maxScripts: 100,
    maxChatSessions: 500,
  },
  ENT: {
    maxHistoryVersions: -1,  // 無制限
    maxReferences: -1,
    maxReferenceSizeMB: -1,
    maxTotalReferenceSizeMB: -1,
    maxScripts: -1,
    maxChatSessions: -1,
  },
};

// =============================================================================
// ファクトリ関数
// =============================================================================

/**
 * 空のメタデータを生成
 *
 * @param product 製品コード
 * @param originalFileName 元の Office ファイル名
 * @param author 作成者名
 * @param appVersion アプリバージョン
 * @param appBuildNumber アプリビルド番号
 *
 * @example
 * ```typescript
 * const metadata = createEmptyMetadata('IOSH', '売上報告.xlsx', '山田太郎', '2.0.0', 38);
 * ```
 */
export function createEmptyMetadata(
  product: ProductCode,
  originalFileName: string,
  author: string,
  appVersion: string,
  appBuildNumber: number,
): ProjectFileMetadata {
  const now = new Date().toISOString();
  return {
    schemaVersion: PROJECT_FILE_SCHEMA_VERSION,
    productCode: product,
    appVersion,
    appBuildNumber,
    title: originalFileName.replace(/\.[^.]+$/, ''),
    author,
    createdAt: now,
    updatedAt: now,
    lastModifiedBy: author,
    originalFileName,
    documentHash: '',
    historyCount: 0,
    referenceCount: 0,
    scriptCount: 0,
  };
}

/**
 * 空のバージョン履歴インデックスを生成
 */
export function createEmptyHistoryIndex(): HistoryIndex {
  return {
    latestVersion: 0,
    entries: [],
  };
}

/**
 * 空の参考資料インデックスを生成
 */
export function createEmptyReferencesIndex(): ReferencesIndex {
  return {
    entries: [],
  };
}

/**
 * 空のスクリプトインデックスを生成
 */
export function createEmptyScriptsIndex(): ScriptsIndex {
  return {
    entries: [],
  };
}

/**
 * 空の AI チャット履歴を生成
 */
export function createEmptyAiChatHistory(): AiChatHistory {
  return {
    version: '1.0',
    sessions: [],
  };
}

// =============================================================================
// バリデーション
// =============================================================================

/**
 * プロジェクトファイルの必須エントリ一覧
 *
 * ZIP を開いた際に、最低限これらのエントリが存在することを検証する。
 */
export const REQUIRED_ENTRIES = [
  PROJECT_FILE_PATHS.METADATA,
] as const;

/**
 * プロジェクトファイルの推奨エントリ一覧
 *
 * 存在しない場合はデフォルト値で初期化して問題ない。
 */
export const OPTIONAL_ENTRIES = [
  PROJECT_FILE_PATHS.CONTENT_TYPES,
  PROJECT_FILE_PATHS.STICKY_NOTES,
  PROJECT_FILE_PATHS.AI_MEMORY,
  PROJECT_FILE_PATHS.AI_CHAT_HISTORY,
  PROJECT_FILE_PATHS.HISTORY_INDEX,
  PROJECT_FILE_PATHS.REFERENCES_INDEX,
  PROJECT_FILE_PATHS.SCRIPTS_INDEX,
] as const;

/** バリデーション結果 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * メタデータのバリデーション
 */
export function validateMetadata(metadata: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!metadata || typeof metadata !== 'object') {
    return { valid: false, errors: ['metadata.json is not a valid JSON object'], warnings };
  }

  const m = metadata as Record<string, unknown>;

  // 必須フィールドチェック
  const requiredFields = ['schemaVersion', 'productCode', 'appVersion', 'title', 'author', 'createdAt', 'updatedAt', 'originalFileName'] as const;
  for (const field of requiredFields) {
    if (!m[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // 製品コードチェック
  const validProducts: ProductCode[] = ['INSS', 'IOSH', 'IOSD'];
  if (m['productCode'] && !validProducts.includes(m['productCode'] as ProductCode)) {
    errors.push(`Invalid productCode: ${m['productCode']}. Must be one of: ${validProducts.join(', ')}`);
  }

  // スキーマバージョンチェック
  if (m['schemaVersion'] && m['schemaVersion'] !== PROJECT_FILE_SCHEMA_VERSION) {
    warnings.push(`Schema version mismatch: expected ${PROJECT_FILE_SCHEMA_VERSION}, got ${m['schemaVersion']}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * プラン別の容量制限チェック
 */
export function checkProjectFileLimits(
  plan: PlanCode,
  counts: {
    historyVersions?: number;
    references?: number;
    scripts?: number;
    chatSessions?: number;
  },
): { withinLimits: boolean; exceeded: string[] } {
  const limits = PROJECT_FILE_LIMITS[plan];
  const exceeded: string[] = [];

  if (limits.maxHistoryVersions !== -1 && (counts.historyVersions ?? 0) >= limits.maxHistoryVersions) {
    exceeded.push(`history_versions (${counts.historyVersions}/${limits.maxHistoryVersions})`);
  }
  if (limits.maxReferences !== -1 && (counts.references ?? 0) >= limits.maxReferences) {
    exceeded.push(`references (${counts.references}/${limits.maxReferences})`);
  }
  if (limits.maxScripts !== -1 && (counts.scripts ?? 0) >= limits.maxScripts) {
    exceeded.push(`scripts (${counts.scripts}/${limits.maxScripts})`);
  }
  if (limits.maxChatSessions !== -1 && (counts.chatSessions ?? 0) >= limits.maxChatSessions) {
    exceeded.push(`chat_sessions (${counts.chatSessions}/${limits.maxChatSessions})`);
  }

  return { withinLimits: exceeded.length === 0, exceeded };
}

// =============================================================================
// ZIP エントリ一覧生成（新規プロジェクト作成用）
// =============================================================================

/**
 * 新規プロジェクトファイルに含めるべき ZIP エントリの一覧を生成
 *
 * C# 側の実装では、この一覧に基づいて ZipArchive にエントリを追加する。
 *
 * @example
 * ```typescript
 * const entries = getInitialEntries('IOSH');
 * // [
 * //   { path: '[content_types].xml', type: 'xml' },
 * //   { path: 'metadata.json', type: 'json' },
 * //   { path: 'document.xlsx', type: 'binary' },
 * //   { path: 'sticky_notes.json', type: 'json' },
 * //   ...
 * // ]
 * ```
 */
export function getInitialEntries(product: ProductCode): Array<{
  path: string;
  type: 'json' | 'xml' | 'binary';
  description: string;
  descriptionJa: string;
  required: boolean;
}> {
  const docName = getInnerDocumentName(product);
  if (!docName) return [];

  return [
    {
      path: PROJECT_FILE_PATHS.CONTENT_TYPES,
      type: 'xml',
      description: 'Content types definition (OPC)',
      descriptionJa: 'コンテントタイプ定義（OPC）',
      required: true,
    },
    {
      path: PROJECT_FILE_PATHS.METADATA,
      type: 'json',
      description: 'Project metadata',
      descriptionJa: 'プロジェクトメタデータ',
      required: true,
    },
    {
      path: docName,
      type: 'binary',
      description: 'Office document',
      descriptionJa: 'Office ドキュメント',
      required: true,
    },
    {
      path: PROJECT_FILE_PATHS.STICKY_NOTES,
      type: 'json',
      description: 'Sticky notes data',
      descriptionJa: '付箋データ',
      required: false,
    },
    {
      path: PROJECT_FILE_PATHS.AI_MEMORY,
      type: 'json',
      description: 'AI memory hot cache',
      descriptionJa: 'AI メモリ（ホットキャッシュ）',
      required: false,
    },
    {
      path: PROJECT_FILE_PATHS.AI_CHAT_HISTORY,
      type: 'json',
      description: 'AI chat history',
      descriptionJa: 'AI チャット履歴',
      required: false,
    },
    {
      path: PROJECT_FILE_PATHS.HISTORY_INDEX,
      type: 'json',
      description: 'Version history index',
      descriptionJa: 'バージョン履歴インデックス',
      required: false,
    },
    {
      path: PROJECT_FILE_PATHS.REFERENCES_INDEX,
      type: 'json',
      description: 'Reference materials index',
      descriptionJa: '参考資料インデックス',
      required: false,
    },
    {
      path: PROJECT_FILE_PATHS.SCRIPTS_INDEX,
      type: 'json',
      description: 'Python scripts index',
      descriptionJa: 'Python スクリプトインデックス',
      required: false,
    },
  ];
}

// =============================================================================
// マイグレーション
// =============================================================================

/**
 * 既存の Office ファイルからプロジェクトファイルへの変換に必要な情報
 *
 * ユーザーが .xlsx をダブルクリック → 「InsightOfficeSheet で開く」を選択した場合、
 * .xlsx を .iosh（ZIP）にパッケージングする際のガイドライン。
 */
export const MIGRATION_GUIDE = {
  /**
   * サポートする元ファイル拡張子（製品別）
   *
   * これらの拡張子のファイルを右クリック→「〜で開く」でプロジェクトに変換可能。
   */
  importableExtensions: {
    INSS: ['.pptx', '.ppt'],
    IOSH: ['.xlsx', '.xls', '.csv'],
    IOSD: ['.docx', '.doc'],
  } as Record<string, string[]>,

  /**
   * プロジェクトファイルから Office ファイルをエクスポートする際の注意
   *
   * - 付箋・履歴・AI データは含まれない（Office 形式には存在しない概念）
   * - 元のファイル名で出力
   */
  exportNote: 'Exporting to Office format will only include the document. Sticky notes, history, AI data, references, and scripts are not included.',
  exportNoteJa: 'Office 形式でエクスポートすると、ドキュメント本体のみが出力されます。付箋・履歴・AI データ・参考資料・スクリプトは含まれません。',
} as const;

// =============================================================================
// エクスポート
// =============================================================================

export default {
  // 定数
  PROJECT_FILE_SCHEMA_VERSION,
  PROJECT_FILE_PATHS,
  INNER_DOCUMENT_NAMES,
  PROJECT_FILE_LIMITS,
  REQUIRED_ENTRIES,
  OPTIONAL_ENTRIES,
  MIGRATION_GUIDE,

  // ファクトリ
  createEmptyMetadata,
  createEmptyHistoryIndex,
  createEmptyReferencesIndex,
  createEmptyScriptsIndex,
  createEmptyAiChatHistory,
  generateContentTypesXml,

  // ユーティリティ
  getInnerDocumentName,
  getInitialEntries,
  validateMetadata,
  checkProjectFileLimits,
};
