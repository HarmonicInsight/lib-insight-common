/**
 * InsightOfficeSheet データ収集基盤 (Data Collection Platform)
 *
 * ============================================================================
 * 【設計思想】
 * ============================================================================
 *
 * CCH Tagetik / STRAVIS-LINK / Forguncy と同じアーキテクチャパターンを
 * InsightOfficeSheet (IOSH) の ENT モジュールとして実装する。
 *
 * ## コアコンセプト
 *
 * 「Excel のシート自体がフォーム UI。テーブル単位で論理テーブルにマッピング。」
 *
 * - 管理者が Excel 上でテンプレートをデザイン
 * - Excel Table（ListObject）を JSON ベースの論理テーブルにマッピング
 * - テンプレートをクライアントに配信
 * - クライアントが IOSH でデータを入力・提出
 * - 管理者側で全クライアント分のデータを集約・閲覧
 *
 * ## RDB ではなく JSON ベースの論理テーブル
 *
 * CCH Tagetik は OLAP / RDB にマッピングするが、IOSH では
 * **JSON ドキュメントベースの論理テーブル** を採用する。
 * スキーマは管理者が自由に定義でき、固定的な RDB テーブル定義は不要。
 *
 * ## アーキテクチャ
 *
 * ```
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  管理者（コンサル / SIer / 経営企画）— IOSH ENT                   │
 * │                                                                  │
 * │  ① テンプレートデザイナー                                         │
 * │     ・Excel 上でレイアウト作成（Syncfusion SpreadsheetControl）    │
 * │     ・Excel Table → 論理テーブルにマッピング                      │
 * │     ・カラム定義（型・バリデーション・ドロップダウンソース）          │
 * │     ・セル単位のロック（入力可能セル / 固定セル）                   │
 * │                                                                  │
 * │  ② テンプレート公開 → 配信                                       │
 * │     ・バージョン管理（v1, v2, ...）                               │
 * │     ・配信先グループ指定（部門・子会社・クライアント企業）           │
 * │     ・配信ステータスモニタリング                                   │
 * │                                                                  │
 * │  ③ データ集約ビュー                                              │
 * │     ・提出済みデータの一覧・フィルタ・エクスポート                  │
 * │     ・バリデーションエラーの一覧管理                               │
 * │     ・承認ワークフロー（draft → submitted → approved / rejected） │
 * │     ・集約結果を新しい .iosh として出力                            │
 * └──────────────────┬───────────────────────────────────────────────┘
 *                     │ 配信（クラウド同期 / ファイル配布）
 *                     ▼
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  クライアント端末 — IOSH ENT                                     │
 * │                                                                  │
 * │  ④ テンプレートを開く（.iosh プロジェクトファイル内に定義埋込）     │
 * │     ・入力可能セルのみ編集可能（保護されたテンプレート）             │
 * │     ・Excel のデータ入力規則 + カスタムバリデーション               │
 * │     ・ドロップダウンはマスタ論理テーブルからプル                    │
 * │                                                                  │
 * │  ⑤ 保存 → 提出                                                  │
 * │     ・ローカル保存（通常の .iosh 保存）                           │
 * │     ・提出ボタン → テーブル単位で JSON 抽出 → サーバーに送信       │
 * │     ・提出前バリデーション（必須チェック・型チェック・ルールチェック） │
 * └──────────────────┬───────────────────────────────────────────────┘
 *                     │ 提出（HTTPS → ライセンスサーバー拡張 API）
 *                     ▼
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  データストア（Supabase — JSONB カラム）                          │
 * │                                                                  │
 * │  dc_templates       テンプレート定義（論理テーブルスキーマ含む）    │
 * │  dc_distributions   配信レコード（誰に・いつ配信したか）            │
 * │  dc_submissions     提出データ（JSONB — 論理テーブル単位）         │
 * │  dc_master_tables   マスタ論理テーブル（ドロップダウンソース等）     │
 * └──────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## StravisLINK / CCH Tagetik / Forguncy との対比
 *
 * | 項目 | Tagetik | STRAVIS-LINK | Forguncy | IOSH Data Collection |
 * |------|---------|-------------|----------|---------------------|
 * | フォーム UI | Excel Add-in | Excel ライク Web | Excel ライク Web | IOSH (Syncfusion) |
 * | マッピング単位 | セル→次元交点 | セル→DB | テーブル→DB | テーブル→論理テーブル |
 * | データストア | OLAP/RDB | RDB | RDB | JSON (Supabase JSONB) |
 * | スキーマ | 固定次元 | 固定テーブル | 固定テーブル | 動的 JSON スキーマ |
 * | Excel 必要 | 要 | 不要(Web) | 不要(Web) | 不要 (Syncfusion) |
 * | AI 連携 | なし | なし | なし | Claude AI アシスタント |
 *
 * ## 新規モジュール追加手順（このファイルで定義済み）
 * 1. このファイル: 論理テーブル・マッピング・配信・提出の型定義
 * 2. addon-modules.ts: data_collection モジュール追加
 * 3. products.ts: IOSH に data_collection フィーチャー追加
 * 4. ライセンスサーバー: dc_* テーブルの Supabase マイグレーション
 * 5. IOSH アプリ: テンプレートデザイナー UI + 提出 UI の実装
 */

// =============================================================================
// 型定義 — 論理テーブル（JSON ベース）
// =============================================================================

/**
 * 論理テーブルのカラム型
 *
 * RDB のカラム型ではなく、JSON シリアライズ可能な型のみ。
 * Excel のセル値から自然に変換可能なもの。
 */
export type LogicalColumnType =
  | 'string'      // テキスト
  | 'number'      // 数値（整数・小数）
  | 'integer'     // 整数のみ
  | 'boolean'     // true/false（チェックボックス）
  | 'date'        // 日付（ISO 8601: YYYY-MM-DD）
  | 'datetime'    // 日時（ISO 8601: YYYY-MM-DDTHH:mm:ss）
  | 'select'      // 選択肢（ドロップダウン — 値はリテラル定義 or マスタ参照）
  | 'multi_select' // 複数選択（カンマ区切り格納）
  | 'currency'    // 通貨（数値 + 通貨コード）
  | 'percentage'  // パーセンテージ（0-1 の小数で格納、表示時に ×100）
  | 'email'       // メールアドレス
  | 'url'         // URL
  | 'file';       // 添付ファイル参照（ファイル名のみ、実体は別管理）

/**
 * 論理テーブルのカラム定義
 *
 * Excel Table の各列に対応。バリデーションルールもここで定義。
 */
export interface LogicalColumn {
  /** カラム ID（テーブル内で一意、英数字 + アンダースコア） */
  id: string;
  /** 表示名（日本語） */
  nameJa: string;
  /** 表示名（英語） */
  name: string;
  /** データ型 */
  type: LogicalColumnType;
  /** 必須か */
  required: boolean;
  /** デフォルト値（JSON シリアライズ可能な値） */
  defaultValue?: unknown;
  /** 説明（日本語） — 入力時のヒントとして表示 */
  descriptionJa?: string;
  /**
   * バリデーションルール
   *
   * Excel のデータ入力規則に加えて、提出時にサーバーサイドでも検証される。
   */
  validation?: ColumnValidation;
  /**
   * ドロップダウンソース（type: 'select' / 'multi_select' のとき）
   *
   * - inline: 値を直接定義
   * - master_table: マスタ論理テーブルの特定カラムから動的に取得
   */
  selectSource?: SelectSource;
  /** カラムが読み取り専用か（自動計算値等） */
  readOnly?: boolean;
  /** Excel セルの表示形式（例: "#,##0", "yyyy/mm/dd"） */
  excelFormat?: string;
  /** カラムの表示幅（Excel の列幅） */
  displayWidth?: number;
}

/** バリデーションルール */
export interface ColumnValidation {
  /** 最小値（number / integer / currency / percentage） */
  min?: number;
  /** 最大値 */
  max?: number;
  /** 最小文字数（string） */
  minLength?: number;
  /** 最大文字数 */
  maxLength?: number;
  /** 正規表現パターン（string） */
  pattern?: string;
  /** パターン不一致時のエラーメッセージ（日本語） */
  patternErrorJa?: string;
  /** カスタムバリデーション関数名（ホストアプリで実装） */
  customValidator?: string;
  /** ユニーク制約（テーブル内で重複不可） */
  unique?: boolean;
}

/** ドロップダウンソース定義 */
export type SelectSource =
  | {
      /** インライン定義: 固定の選択肢リスト */
      type: 'inline';
      options: Array<{
        value: string;
        labelJa: string;
        label: string;
      }>;
    }
  | {
      /** マスタテーブル参照: 別の論理テーブルのカラムから取得 */
      type: 'master_table';
      /** マスタ論理テーブル ID */
      masterTableId: string;
      /** 値に使うカラム ID */
      valueColumnId: string;
      /** 表示に使うカラム ID（省略時は value と同じ） */
      displayColumnId?: string;
      /** フィルタ条件（他カラムの値で絞り込む場合） */
      filterBy?: {
        masterColumnId: string;
        sourceColumnId: string;
      };
    };

/**
 * 論理テーブル定義
 *
 * 1 つの Excel Table (ListObject) に対応する。
 * テンプレートには複数の論理テーブルを含めることができる。
 */
export interface LogicalTableDefinition {
  /** テーブル ID（テンプレート内で一意） */
  id: string;
  /** テーブル名（日本語） */
  nameJa: string;
  /** テーブル名（英語） */
  name: string;
  /** テーブルの説明 */
  descriptionJa?: string;
  /** カラム定義 */
  columns: LogicalColumn[];
  /**
   * テーブルの種類
   *
   * - input: クライアントが入力するメインデータ
   * - header: テンプレートのヘッダー情報（案件名、担当者等 — 1 行のみ）
   * - master: マスタデータ（ドロップダウンソース — 読み取り専用）
   * - summary: 集計テーブル（数式で自動計算 — 読み取り専用）
   */
  tableType: 'input' | 'header' | 'master' | 'summary';
  /** 最大行数の制限（input テーブルのみ。-1 = 無制限） */
  maxRows?: number;
  /** 行の追加をクライアントに許可するか（input テーブルのみ） */
  allowAddRows?: boolean;
  /** 行の削除をクライアントに許可するか（input テーブルのみ） */
  allowDeleteRows?: boolean;
  /** テーブル間リレーション（ヘッダー → 明細 のような親子関係） */
  parentTableId?: string;
  /** 親テーブルの外部キーカラム ID */
  parentKeyColumnId?: string;
}

// =============================================================================
// 型定義 — Excel マッピング
// =============================================================================

/**
 * Excel Table → 論理テーブル のマッピング定義
 *
 * Excel 上の名前付きテーブル（ListObject）と論理テーブルを紐付ける。
 * テンプレートデザイナーで設定し、.iosh ファイル内に保存される。
 */
export interface ExcelTableMapping {
  /** マッピング ID（テンプレート内で一意） */
  id: string;
  /** 対応する論理テーブル ID */
  logicalTableId: string;
  /**
   * Excel 上の名前付きテーブル名（ListObject.Name）
   *
   * Syncfusion の IListObject に対応。
   * 管理者がテンプレート上で Excel Table を作成し、この名前をマッピングに紐付ける。
   */
  excelTableName: string;
  /** Excel テーブルが存在するシート名 */
  sheetName: string;
  /** カラムマッピング: 論理カラム ID → Excel 列番号（0-based） */
  columnMappings: Array<{
    logicalColumnId: string;
    excelColumnIndex: number;
  }>;
}

/**
 * ヘッダー領域のセルマッピング（テーブル外の単一セル用）
 *
 * テンプレートのヘッダー部分（会社名、報告期間等）のように
 * テーブル形式ではないセル単位のマッピング。
 */
export interface ExcelCellMapping {
  /** マッピング ID */
  id: string;
  /** 対応する論理テーブル ID（通常は header タイプ） */
  logicalTableId: string;
  /** 対応する論理カラム ID */
  logicalColumnId: string;
  /** シート名 */
  sheetName: string;
  /** セルアドレス（例: "B3", "D5"） */
  cellAddress: string;
}

// =============================================================================
// 型定義 — テンプレート
// =============================================================================

/**
 * データ収集テンプレート定義
 *
 * 管理者が作成するテンプレートの全情報。
 * .iosh プロジェクトファイル内の `data_collection/template.json` に保存される。
 */
export interface DataCollectionTemplate {
  /** テンプレート ID（UUID） */
  id: string;
  /** テンプレート名（日本語） */
  nameJa: string;
  /** テンプレート名（英語） */
  name: string;
  /** テンプレートの説明 */
  descriptionJa?: string;
  /** バージョン（公開のたびにインクリメント） */
  version: number;
  /** 作成者 */
  createdBy: string;
  /** 作成日時（ISO 8601） */
  createdAt: string;
  /** 最終更新日時 */
  updatedAt: string;
  /** テンプレートのステータス */
  status: 'draft' | 'published' | 'archived';
  /** 論理テーブル定義 */
  logicalTables: LogicalTableDefinition[];
  /** Excel テーブルマッピング */
  tableMappings: ExcelTableMapping[];
  /** セルマッピング（テーブル外のヘッダーセル等） */
  cellMappings: ExcelCellMapping[];
  /** 提出時の承認ワークフロー設定 */
  workflow: WorkflowConfig;
  /**
   * 配信設定
   *
   * 回答期限、配信先グループ、リマインダー等。
   */
  distribution: DistributionConfig;
}

/** 承認ワークフロー設定 */
export interface WorkflowConfig {
  /** ワークフロー有効化 */
  enabled: boolean;
  /**
   * ワークフローステップ
   *
   * 単純なケース: draft → submitted → approved
   * 複雑なケース: draft → submitted → reviewed → approved
   */
  steps: WorkflowStep[];
}

/** ワークフローステップ定義 */
export interface WorkflowStep {
  /** ステップ ID */
  id: string;
  /** ステップ名（日本語） */
  nameJa: string;
  /** このステップに遷移する前のステータス */
  fromStatus: SubmissionStatus;
  /** このステップ完了後のステータス */
  toStatus: SubmissionStatus;
  /** 承認者の役割（admin / reviewer） */
  approverRole: 'admin' | 'reviewer';
  /** コメント必須か */
  requireComment: boolean;
}

/** 配信設定 */
export interface DistributionConfig {
  /** 回答期限（ISO 8601 日付） */
  deadline?: string;
  /** リマインダー（期限の何日前に通知） */
  reminderDaysBefore?: number[];
  /** 期限超過時の通知メッセージ */
  overdueMessageJa?: string;
}

// =============================================================================
// 型定義 — 提出データ
// =============================================================================

/** 提出ステータス */
export type SubmissionStatus =
  | 'draft'       // 下書き（未提出 — ローカルのみ）
  | 'submitted'   // 提出済み（サーバーに送信済み）
  | 'reviewing'   // レビュー中
  | 'approved'    // 承認済み
  | 'rejected'    // 差し戻し
  | 'resubmitted'; // 再提出済み

/**
 * 提出データ
 *
 * クライアントが入力したデータをテーブル単位で JSON 化したもの。
 * サーバーの dc_submissions テーブルに JSONB として保存される。
 */
export interface Submission {
  /** 提出 ID（UUID） */
  id: string;
  /** テンプレート ID */
  templateId: string;
  /** テンプレートバージョン（どのバージョンに対する提出か） */
  templateVersion: number;
  /** 提出者のユーザー ID */
  submittedBy: string;
  /** 提出者の組織名（日本語） */
  organizationJa?: string;
  /** 提出日時 */
  submittedAt: string;
  /** ステータス */
  status: SubmissionStatus;
  /**
   * テーブルデータ
   *
   * 論理テーブル ID → 行データ配列 のマップ。
   * 各行は { [columnId]: value } の JSON オブジェクト。
   */
  tableData: Record<string, SubmissionTableData>;
  /** バリデーション結果 */
  validationResult?: ValidationResult;
  /** ワークフロー履歴 */
  workflowHistory: WorkflowHistoryEntry[];
  /** 提出者からのコメント */
  comment?: string;
}

/** テーブル単位の提出データ */
export interface SubmissionTableData {
  /** 論理テーブル ID */
  logicalTableId: string;
  /**
   * 行データの配列
   *
   * 各行は { [columnId]: value } の形式。
   * value は LogicalColumnType に応じた JSON 値:
   *   string → "テキスト"
   *   number/integer/currency/percentage → 123.45
   *   boolean → true/false
   *   date → "2026-01-15"
   *   datetime → "2026-01-15T09:30:00"
   *   select → "option_value"
   *   multi_select → ["val1", "val2"]
   */
  rows: Array<Record<string, unknown>>;
}

/** バリデーション結果 */
export interface ValidationResult {
  /** バリデーション通過したか */
  valid: boolean;
  /** エラー一覧 */
  errors: ValidationError[];
  /** 警告一覧 */
  warnings: ValidationWarning[];
}

/** バリデーションエラー（提出ブロック） */
export interface ValidationError {
  /** エラー種別 */
  type: 'required' | 'type_mismatch' | 'range' | 'pattern' | 'unique' | 'custom';
  /** 対象テーブル ID */
  logicalTableId: string;
  /** 対象カラム ID */
  columnId: string;
  /** 対象行番号（0-based） */
  rowIndex: number;
  /** エラーメッセージ（日本語） */
  messageJa: string;
  /** エラーメッセージ（英語） */
  message: string;
}

/** バリデーション警告（提出はブロックしない） */
export interface ValidationWarning {
  /** 警告種別 */
  type: 'outlier' | 'empty_recommended' | 'format_suggestion';
  logicalTableId: string;
  columnId: string;
  rowIndex: number;
  messageJa: string;
  message: string;
}

/** ワークフロー履歴エントリ */
export interface WorkflowHistoryEntry {
  /** アクション */
  action: 'submit' | 'approve' | 'reject' | 'resubmit' | 'review';
  /** 実行者 ID */
  actorId: string;
  /** 実行者名 */
  actorName: string;
  /** 日時 */
  timestamp: string;
  /** コメント */
  comment?: string;
  /** 遷移前ステータス */
  fromStatus: SubmissionStatus;
  /** 遷移後ステータス */
  toStatus: SubmissionStatus;
}

// =============================================================================
// 型定義 — マスタ論理テーブル
// =============================================================================

/**
 * マスタ論理テーブル
 *
 * ドロップダウンの選択肢や参照データを管理する。
 * テンプレート間で共有可能（組織レベルで定義）。
 *
 * 例:
 * - 部門マスタ: { id: "dept_001", name: "営業部" }
 * - 勘定科目マスタ: { id: "4100", name: "売上高", category: "収益" }
 * - ステータスマスタ: { id: "in_progress", name: "進行中" }
 */
export interface MasterTable {
  /** マスタテーブル ID */
  id: string;
  /** テーブル名（日本語） */
  nameJa: string;
  /** テーブル名（英語） */
  name: string;
  /** カラム定義 */
  columns: LogicalColumn[];
  /** データ行 */
  rows: Array<Record<string, unknown>>;
  /** 最終更新日時 */
  updatedAt: string;
  /** 作成者 */
  createdBy: string;
}

// =============================================================================
// 型定義 — 配信
// =============================================================================

/** 配信先 */
export interface DistributionTarget {
  /** 配信先 ID（ユーザー ID or グループ ID） */
  targetId: string;
  /** 配信先の種類 */
  targetType: 'user' | 'group' | 'organization';
  /** 配信先名（日本語） */
  nameJa: string;
  /** メールアドレス（通知用） */
  email?: string;
}

/** 配信レコード */
export interface DistributionRecord {
  /** 配信 ID */
  id: string;
  /** テンプレート ID */
  templateId: string;
  /** テンプレートバージョン */
  templateVersion: number;
  /** 配信先 */
  target: DistributionTarget;
  /** 配信日時 */
  distributedAt: string;
  /** 配信方法 */
  method: 'cloud_sync' | 'file_export' | 'email_link';
  /** 回答ステータス */
  responseStatus: 'not_started' | 'in_progress' | 'submitted' | 'approved';
  /** 対応する提出 ID（提出後に紐付け） */
  submissionId?: string;
}

// =============================================================================
// .iosh プロジェクトファイル内の配置
// =============================================================================

/**
 * .iosh プロジェクトファイル内のデータ収集関連パス
 *
 * 既存の PROJECT_FILE_PATHS（project-file.ts）を拡張する形。
 *
 * ```
 * report.iosh (ZIP archive)
 * ├── ... (既存エントリ)
 * ├── data_collection/
 * │   ├── template.json        # テンプレート定義（論理テーブル + マッピング）
 * │   ├── master_tables/       # マスタ論理テーブル（テンプレート同梱分）
 * │   │   ├── departments.json
 * │   │   └── accounts.json
 * │   ├── submission.json      # 入力中の提出データ（ドラフト）
 * │   └── submission_history/  # 過去の提出履歴
 * │       ├── index.json
 * │       └── {submission_id}.json
 * ```
 */
export const DATA_COLLECTION_PATHS = {
  /** テンプレート定義 */
  TEMPLATE: 'data_collection/template.json',
  /** マスタテーブルディレクトリ */
  MASTER_TABLES_DIR: 'data_collection/master_tables/',
  /** マスタテーブルファイル（テーブル ID で生成） */
  masterTableFile: (tableId: string) => `data_collection/master_tables/${tableId}.json`,
  /** 提出データ（現在のドラフト） */
  SUBMISSION_DRAFT: 'data_collection/submission.json',
  /** 提出履歴ディレクトリ */
  SUBMISSION_HISTORY_DIR: 'data_collection/submission_history/',
  /** 提出履歴インデックス */
  SUBMISSION_HISTORY_INDEX: 'data_collection/submission_history/index.json',
  /** 個別の提出履歴ファイル */
  submissionFile: (submissionId: string) => `data_collection/submission_history/${submissionId}.json`,
} as const;

// =============================================================================
// API エンドポイント（ライセンスサーバー拡張）
// =============================================================================

/**
 * データ収集 API エンドポイント
 *
 * 既存のライセンスサーバー（license.harmonicinsight.com）に
 * /api/v1/data-collection/ 以下として追加する。
 */
export const DATA_COLLECTION_API = {
  baseUrl: '/api/v1/data-collection',
  endpoints: {
    // -----------------------------------------------------------------------
    // テンプレート管理（管理者）
    // -----------------------------------------------------------------------
    templates: {
      /** テンプレート一覧取得 */
      list: { method: 'GET' as const, path: '/templates' },
      /** テンプレート作成 */
      create: { method: 'POST' as const, path: '/templates' },
      /** テンプレート取得 */
      get: { method: 'GET' as const, path: '/templates/:templateId' },
      /** テンプレート更新 */
      update: { method: 'PUT' as const, path: '/templates/:templateId' },
      /** テンプレート公開（バージョンをインクリメントして publish） */
      publish: { method: 'POST' as const, path: '/templates/:templateId/publish' },
      /** テンプレートアーカイブ */
      archive: { method: 'POST' as const, path: '/templates/:templateId/archive' },
    },
    // -----------------------------------------------------------------------
    // マスタテーブル管理（管理者）
    // -----------------------------------------------------------------------
    masterTables: {
      /** マスタテーブル一覧 */
      list: { method: 'GET' as const, path: '/master-tables' },
      /** マスタテーブル作成 */
      create: { method: 'POST' as const, path: '/master-tables' },
      /** マスタテーブル取得 */
      get: { method: 'GET' as const, path: '/master-tables/:tableId' },
      /** マスタテーブル更新（行データの更新） */
      update: { method: 'PUT' as const, path: '/master-tables/:tableId' },
      /** マスタテーブル削除 */
      delete: { method: 'DELETE' as const, path: '/master-tables/:tableId' },
    },
    // -----------------------------------------------------------------------
    // 配信管理（管理者）
    // -----------------------------------------------------------------------
    distributions: {
      /** テンプレートを配信 */
      distribute: { method: 'POST' as const, path: '/templates/:templateId/distribute' },
      /** 配信状況一覧 */
      status: { method: 'GET' as const, path: '/templates/:templateId/distribution-status' },
      /** リマインダー送信 */
      remind: { method: 'POST' as const, path: '/distributions/:distributionId/remind' },
    },
    // -----------------------------------------------------------------------
    // 提出（クライアント）
    // -----------------------------------------------------------------------
    submissions: {
      /** データ提出 */
      submit: { method: 'POST' as const, path: '/templates/:templateId/submit' },
      /** 自分の提出一覧 */
      mySubmissions: { method: 'GET' as const, path: '/submissions/mine' },
      /** 提出データ取得 */
      get: { method: 'GET' as const, path: '/submissions/:submissionId' },
      /** 再提出 */
      resubmit: { method: 'PUT' as const, path: '/submissions/:submissionId/resubmit' },
    },
    // -----------------------------------------------------------------------
    // 集約・承認（管理者）
    // -----------------------------------------------------------------------
    review: {
      /** テンプレートの全提出データ一覧 */
      listSubmissions: { method: 'GET' as const, path: '/templates/:templateId/submissions' },
      /** 提出データを承認 */
      approve: { method: 'POST' as const, path: '/submissions/:submissionId/approve' },
      /** 提出データを差し戻し */
      reject: { method: 'POST' as const, path: '/submissions/:submissionId/reject' },
      /** 集約データのエクスポート（JSON / CSV / Excel） */
      exportAll: { method: 'GET' as const, path: '/templates/:templateId/export' },
      /** 集約データを新しい .iosh ファイルとして生成 */
      exportAsIosh: { method: 'POST' as const, path: '/templates/:templateId/export-iosh' },
    },
    // -----------------------------------------------------------------------
    // バリデーション
    // -----------------------------------------------------------------------
    validation: {
      /** サーバーサイドバリデーション（提出前プレチェック） */
      validate: { method: 'POST' as const, path: '/templates/:templateId/validate' },
    },
  },
} as const;

// =============================================================================
// DB テーブル定義（Supabase）
// =============================================================================

/**
 * Supabase テーブル定義（マイグレーション参考用）
 *
 * 実際のマイグレーションは SQL で行うが、ここで構造を定義しておく。
 */
export const DB_TABLES = {
  /** テンプレート定義 */
  DC_TEMPLATES: 'dc_templates',
  /** 配信レコード */
  DC_DISTRIBUTIONS: 'dc_distributions',
  /** 提出データ（JSONB — 論理テーブル単位） */
  DC_SUBMISSIONS: 'dc_submissions',
  /** マスタ論理テーブル */
  DC_MASTER_TABLES: 'dc_master_tables',
  /** 監査ログ */
  DC_AUDIT_LOG: 'dc_audit_log',
} as const;

/**
 * DB スキーマ概要（Supabase JSONB 活用）
 *
 * ```sql
 * -- テンプレート
 * CREATE TABLE dc_templates (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name_ja TEXT NOT NULL,
 *   name TEXT NOT NULL,
 *   description_ja TEXT,
 *   version INTEGER NOT NULL DEFAULT 1,
 *   status TEXT NOT NULL DEFAULT 'draft', -- draft / published / archived
 *   schema JSONB NOT NULL,  -- LogicalTableDefinition[] + マッピング情報
 *   workflow JSONB,         -- WorkflowConfig
 *   distribution JSONB,     -- DistributionConfig
 *   created_by UUID REFERENCES auth.users(id),
 *   organization_id UUID,
 *   created_at TIMESTAMPTZ DEFAULT now(),
 *   updated_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- マスタ論理テーブル（組織レベルで共有）
 * CREATE TABLE dc_master_tables (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   table_id TEXT NOT NULL,        -- 論理テーブル ID
 *   name_ja TEXT NOT NULL,
 *   name TEXT NOT NULL,
 *   columns JSONB NOT NULL,        -- LogicalColumn[]
 *   rows JSONB NOT NULL DEFAULT '[]',  -- 行データ
 *   organization_id UUID,
 *   created_by UUID REFERENCES auth.users(id),
 *   updated_at TIMESTAMPTZ DEFAULT now(),
 *   UNIQUE(table_id, organization_id)
 * );
 *
 * -- 配信レコード
 * CREATE TABLE dc_distributions (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   template_id UUID REFERENCES dc_templates(id),
 *   template_version INTEGER NOT NULL,
 *   target_id TEXT NOT NULL,
 *   target_type TEXT NOT NULL,     -- user / group / organization
 *   target_name_ja TEXT,
 *   target_email TEXT,
 *   method TEXT NOT NULL,          -- cloud_sync / file_export / email_link
 *   response_status TEXT DEFAULT 'not_started',
 *   submission_id UUID,
 *   distributed_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- 提出データ
 * CREATE TABLE dc_submissions (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   template_id UUID REFERENCES dc_templates(id),
 *   template_version INTEGER NOT NULL,
 *   submitted_by UUID REFERENCES auth.users(id),
 *   organization_ja TEXT,
 *   status TEXT NOT NULL DEFAULT 'draft',
 *   table_data JSONB NOT NULL,         -- Record<tableId, { rows: [...] }>
 *   validation_result JSONB,
 *   workflow_history JSONB DEFAULT '[]',
 *   comment TEXT,
 *   submitted_at TIMESTAMPTZ,
 *   created_at TIMESTAMPTZ DEFAULT now(),
 *   updated_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- 監査ログ
 * CREATE TABLE dc_audit_log (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   action TEXT NOT NULL,
 *   entity_type TEXT NOT NULL,     -- template / submission / master_table
 *   entity_id UUID NOT NULL,
 *   actor_id UUID,
 *   details JSONB,
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- インデックス
 * CREATE INDEX idx_dc_submissions_template ON dc_submissions(template_id);
 * CREATE INDEX idx_dc_submissions_status ON dc_submissions(status);
 * CREATE INDEX idx_dc_distributions_template ON dc_distributions(template_id);
 * CREATE INDEX idx_dc_audit_log_entity ON dc_audit_log(entity_type, entity_id);
 * ```
 */

// =============================================================================
// プラン別制限
// =============================================================================

/** データ収集モジュールのプラン別制限 */
export const DATA_COLLECTION_LIMITS = {
  /** ENT のみ — テンプレート数上限（-1 = 無制限） */
  ENT: {
    maxTemplates: -1,
    maxMasterTables: -1,
    maxRowsPerSubmission: -1,
    maxDistributionsPerTemplate: -1,
    maxSubmissionsPerTemplate: -1,
    exportFormats: ['json', 'csv', 'xlsx', 'iosh'] as const,
  },
  /** TRIAL — 評価用に制限付きで利用可能 */
  TRIAL: {
    maxTemplates: 3,
    maxMasterTables: 5,
    maxRowsPerSubmission: 100,
    maxDistributionsPerTemplate: 10,
    maxSubmissionsPerTemplate: 20,
    exportFormats: ['json', 'csv', 'xlsx', 'iosh'] as const,
  },
} as const;

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 論理テーブルのデータ行をバリデーション
 *
 * Excel → JSON 抽出後、提出前にクライアント側でチェックする。
 * サーバー側でも同じロジックで再検証される。
 */
export function validateTableData(
  table: LogicalTableDefinition,
  rows: Array<Record<string, unknown>>,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 行数チェック
  if (table.maxRows && table.maxRows > 0 && rows.length > table.maxRows) {
    errors.push({
      type: 'custom',
      logicalTableId: table.id,
      columnId: '',
      rowIndex: -1,
      messageJa: `行数が上限（${table.maxRows}行）を超えています（${rows.length}行）`,
      message: `Row count (${rows.length}) exceeds limit (${table.maxRows})`,
    });
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];

    for (const col of table.columns) {
      if (col.readOnly) continue;
      const value = row[col.id];

      // 必須チェック
      if (col.required && (value === undefined || value === null || value === '')) {
        errors.push({
          type: 'required',
          logicalTableId: table.id,
          columnId: col.id,
          rowIndex,
          messageJa: `${col.nameJa}は必須です`,
          message: `${col.name} is required`,
        });
        continue;
      }

      if (value === undefined || value === null || value === '') continue;

      // 型チェック
      const typeError = validateColumnType(col, value, table.id, rowIndex);
      if (typeError) {
        errors.push(typeError);
        continue;
      }

      // バリデーションルール
      if (col.validation) {
        const ruleErrors = validateColumnRules(col, value, table.id, rowIndex);
        errors.push(...ruleErrors);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/** カラム型チェック */
function validateColumnType(
  col: LogicalColumn,
  value: unknown,
  tableId: string,
  rowIndex: number,
): ValidationError | null {
  switch (col.type) {
    case 'number':
    case 'integer':
    case 'currency':
    case 'percentage':
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return {
          type: 'type_mismatch',
          logicalTableId: tableId,
          columnId: col.id,
          rowIndex,
          messageJa: `${col.nameJa}は数値で入力してください`,
          message: `${col.name} must be a number`,
        };
      }
      if (col.type === 'integer' && !Number.isInteger(value)) {
        return {
          type: 'type_mismatch',
          logicalTableId: tableId,
          columnId: col.id,
          rowIndex,
          messageJa: `${col.nameJa}は整数で入力してください`,
          message: `${col.name} must be an integer`,
        };
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        return {
          type: 'type_mismatch',
          logicalTableId: tableId,
          columnId: col.id,
          rowIndex,
          messageJa: `${col.nameJa}は真偽値で入力してください`,
          message: `${col.name} must be a boolean`,
        };
      }
      break;
    case 'date':
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return {
          type: 'type_mismatch',
          logicalTableId: tableId,
          columnId: col.id,
          rowIndex,
          messageJa: `${col.nameJa}は日付形式（YYYY-MM-DD）で入力してください`,
          message: `${col.name} must be a date (YYYY-MM-DD)`,
        };
      }
      break;
    case 'datetime':
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
        return {
          type: 'type_mismatch',
          logicalTableId: tableId,
          columnId: col.id,
          rowIndex,
          messageJa: `${col.nameJa}は日時形式で入力してください`,
          message: `${col.name} must be a datetime`,
        };
      }
      break;
    case 'email':
      if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return {
          type: 'pattern',
          logicalTableId: tableId,
          columnId: col.id,
          rowIndex,
          messageJa: `${col.nameJa}は有効なメールアドレスを入力してください`,
          message: `${col.name} must be a valid email address`,
        };
      }
      break;
  }
  return null;
}

/** バリデーションルールチェック */
function validateColumnRules(
  col: LogicalColumn,
  value: unknown,
  tableId: string,
  rowIndex: number,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const v = col.validation!;

  if (typeof value === 'number') {
    if (v.min !== undefined && value < v.min) {
      errors.push({
        type: 'range',
        logicalTableId: tableId,
        columnId: col.id,
        rowIndex,
        messageJa: `${col.nameJa}は${v.min}以上で入力してください`,
        message: `${col.name} must be >= ${v.min}`,
      });
    }
    if (v.max !== undefined && value > v.max) {
      errors.push({
        type: 'range',
        logicalTableId: tableId,
        columnId: col.id,
        rowIndex,
        messageJa: `${col.nameJa}は${v.max}以下で入力してください`,
        message: `${col.name} must be <= ${v.max}`,
      });
    }
  }

  if (typeof value === 'string') {
    if (v.minLength !== undefined && value.length < v.minLength) {
      errors.push({
        type: 'range',
        logicalTableId: tableId,
        columnId: col.id,
        rowIndex,
        messageJa: `${col.nameJa}は${v.minLength}文字以上で入力してください`,
        message: `${col.name} must be at least ${v.minLength} characters`,
      });
    }
    if (v.maxLength !== undefined && value.length > v.maxLength) {
      errors.push({
        type: 'range',
        logicalTableId: tableId,
        columnId: col.id,
        rowIndex,
        messageJa: `${col.nameJa}は${v.maxLength}文字以下で入力してください`,
        message: `${col.name} must be at most ${v.maxLength} characters`,
      });
    }
    if (v.pattern) {
      const re = new RegExp(v.pattern);
      if (!re.test(value)) {
        errors.push({
          type: 'pattern',
          logicalTableId: tableId,
          columnId: col.id,
          rowIndex,
          messageJa: v.patternErrorJa ?? `${col.nameJa}の形式が正しくありません`,
          message: `${col.name} does not match the required pattern`,
        });
      }
    }
  }

  return errors;
}

/**
 * テンプレートから Excel Table の初期データ入力規則を生成
 *
 * Syncfusion の IDataValidation に対応する設定オブジェクトを返す。
 * ホストアプリはこの情報をもとに Excel のデータ入力規則を設定する。
 */
export function generateExcelValidationRules(
  table: LogicalTableDefinition,
): Array<{
  columnId: string;
  excelValidationType: string;
  formula?: string;
  allowBlank: boolean;
  errorTitle: string;
  errorMessage: string;
  showDropdown: boolean;
  dropdownValues?: string[];
}> {
  return table.columns
    .filter(col => !col.readOnly)
    .map(col => {
      const base = {
        columnId: col.id,
        allowBlank: !col.required,
        errorTitle: col.nameJa,
        errorMessage: '',
        showDropdown: false,
        dropdownValues: undefined as string[] | undefined,
      };

      switch (col.type) {
        case 'integer':
          return {
            ...base,
            excelValidationType: 'WholeNumber',
            formula: col.validation
              ? `${col.validation.min ?? ''},${col.validation.max ?? ''}`
              : undefined,
            errorMessage: `${col.nameJa}: 整数を入力してください`,
          };
        case 'number':
        case 'currency':
        case 'percentage':
          return {
            ...base,
            excelValidationType: 'Decimal',
            formula: col.validation
              ? `${col.validation.min ?? ''},${col.validation.max ?? ''}`
              : undefined,
            errorMessage: `${col.nameJa}: 数値を入力してください`,
          };
        case 'date':
          return {
            ...base,
            excelValidationType: 'Date',
            errorMessage: `${col.nameJa}: 日付を入力してください`,
          };
        case 'select':
          if (col.selectSource?.type === 'inline') {
            return {
              ...base,
              excelValidationType: 'List',
              showDropdown: true,
              dropdownValues: col.selectSource.options.map(o => o.labelJa),
              errorMessage: `${col.nameJa}: リストから選択してください`,
            };
          }
          return {
            ...base,
            excelValidationType: 'List',
            showDropdown: true,
            errorMessage: `${col.nameJa}: リストから選択してください`,
          };
        case 'email':
          return {
            ...base,
            excelValidationType: 'Custom',
            formula: 'ISNUMBER(FIND("@",INDIRECT("RC",FALSE)))',
            errorMessage: `${col.nameJa}: メールアドレスを入力してください`,
          };
        default:
          return {
            ...base,
            excelValidationType: 'TextLength',
            formula: col.validation
              ? `${col.validation.minLength ?? 0},${col.validation.maxLength ?? 32767}`
              : undefined,
            errorMessage: col.required
              ? `${col.nameJa}: 入力必須です`
              : '',
          };
      }
    });
}

/**
 * 提出データから集約テーブルを生成
 *
 * 管理者が全提出データを1つのテーブルに集約する際に使用。
 * 各行に submittedBy, organizationJa, submittedAt を付加。
 */
export function aggregateSubmissions(
  submissions: Submission[],
  logicalTableId: string,
): {
  columns: Array<{ id: string; nameJa: string; name: string }>;
  rows: Array<Record<string, unknown>>;
} {
  const metaColumns = [
    { id: '_submitted_by', nameJa: '提出者', name: 'Submitted By' },
    { id: '_organization', nameJa: '組織', name: 'Organization' },
    { id: '_submitted_at', nameJa: '提出日時', name: 'Submitted At' },
    { id: '_status', nameJa: 'ステータス', name: 'Status' },
  ];

  const rows: Array<Record<string, unknown>> = [];

  for (const sub of submissions) {
    const tableData = sub.tableData[logicalTableId];
    if (!tableData) continue;

    for (const row of tableData.rows) {
      rows.push({
        ...row,
        _submitted_by: sub.submittedBy,
        _organization: sub.organizationJa ?? '',
        _submitted_at: sub.submittedAt,
        _status: sub.status,
      });
    }
  }

  // 最初の提出からカラム定義を推定
  const dataColumns = submissions.length > 0 && submissions[0].tableData[logicalTableId]
    ? Object.keys(submissions[0].tableData[logicalTableId].rows[0] ?? {}).map(key => ({
        id: key,
        nameJa: key,
        name: key,
      }))
    : [];

  return {
    columns: [...metaColumns, ...dataColumns],
    rows,
  };
}

/**
 * テンプレートの空の提出データを生成
 *
 * クライアントがテンプレートを開いたとき、初期の空データを作る。
 */
export function createEmptySubmission(
  template: DataCollectionTemplate,
  userId: string,
  organizationJa?: string,
): Omit<Submission, 'id'> {
  const tableData: Record<string, SubmissionTableData> = {};

  for (const table of template.logicalTables) {
    if (table.tableType === 'master' || table.tableType === 'summary') continue;

    const emptyRow: Record<string, unknown> = {};
    for (const col of table.columns) {
      emptyRow[col.id] = col.defaultValue ?? null;
    }

    tableData[table.id] = {
      logicalTableId: table.id,
      rows: table.tableType === 'header' ? [emptyRow] : [],
    };
  }

  return {
    templateId: template.id,
    templateVersion: template.version,
    submittedBy: userId,
    organizationJa,
    submittedAt: '',
    status: 'draft',
    tableData,
    workflowHistory: [],
  };
}

/**
 * Excel Table のデータを論理テーブル行データに変換
 *
 * Syncfusion の ListObject から読み取った二次元配列を
 * 論理テーブルの { columnId: value } 形式に変換する。
 *
 * @param mapping - Excel Table → 論理テーブルのマッピング
 * @param table - 論理テーブル定義
 * @param excelRows - Excel Table から読み取った二次元配列（ヘッダー行除く）
 */
export function convertExcelRowsToLogicalData(
  mapping: ExcelTableMapping,
  table: LogicalTableDefinition,
  excelRows: unknown[][],
): Array<Record<string, unknown>> {
  return excelRows.map(excelRow => {
    const logicalRow: Record<string, unknown> = {};

    for (const colMapping of mapping.columnMappings) {
      const col = table.columns.find(c => c.id === colMapping.logicalColumnId);
      if (!col) continue;

      const rawValue = excelRow[colMapping.excelColumnIndex];
      logicalRow[col.id] = coerceValue(rawValue, col.type);
    }

    return logicalRow;
  });
}

/** Excel セル値を論理カラム型に変換 */
function coerceValue(raw: unknown, type: LogicalColumnType): unknown {
  if (raw === undefined || raw === null || raw === '') return null;

  switch (type) {
    case 'number':
    case 'currency':
    case 'percentage':
      return typeof raw === 'number' ? raw : Number(raw);
    case 'integer':
      return typeof raw === 'number' ? Math.round(raw) : Math.round(Number(raw));
    case 'boolean':
      if (typeof raw === 'boolean') return raw;
      if (typeof raw === 'string') return raw.toLowerCase() === 'true' || raw === '1';
      return Boolean(raw);
    case 'date':
      if (raw instanceof Date) return raw.toISOString().split('T')[0];
      return String(raw);
    case 'datetime':
      if (raw instanceof Date) return raw.toISOString();
      return String(raw);
    default:
      return String(raw);
  }
}

// =============================================================================
// デフォルトエクスポート
// =============================================================================

export default {
  // パス定義
  DATA_COLLECTION_PATHS,

  // API
  DATA_COLLECTION_API,

  // DB
  DB_TABLES,

  // プラン制限
  DATA_COLLECTION_LIMITS,

  // バリデーション
  validateTableData,

  // Excel 連携
  generateExcelValidationRules,
  convertExcelRowsToLogicalData,

  // データ操作
  aggregateSubmissions,
  createEmptySubmission,
};
