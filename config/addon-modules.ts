/**
 * InsightOffice アドインモジュール定義
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * InsightOffice 系アプリ（HMSH/HMDC/HMSL）は、コア機能に加えて
 * アドインモジュールを追加・削除できるプラグインアーキテクチャを持つ。
 *
 * ## モジュールの種類
 *
 * 1. **組み込みモジュール** (bundled)
 *    - アプリに同梱されるが、ユーザーが有効/無効を切り替えられる
 *    - 例: AI アシスタント、掲示板
 *
 * 2. **拡張モジュール** (extension)
 *    - 別途ダウンロード・インストールが必要
 *    - 例: Python 実行エンジン（InsightPy エンジン）
 *
 * ## ホストアプリとの連携
 *
 * ```
 * ┌─────────────────────────────────────────────────────┐
 * │  InsightOffice ホストアプリ (C# WPF)                 │
 * │                                                     │
 * │  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
 * │  │コア機能  │  │コア機能  │  │コア機能  │            │
 * │  │(読込)   │  │(編集)   │  │(保存)   │            │
 * │  └─────────┘  └─────────┘  └─────────┘            │
 * │                                                     │
 * │  ┌───────────────────────────────────────────────┐  │
 * │  │  アドインマネージャー (AddonManager)            │  │
 * │  │                                               │  │
 * │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │  │
 * │  │  │AI ｱｼｽﾀﾝﾄ│ │Python実行│ │参考資料  │ ... │  │
 * │  │  │(bundled) │ │(extension)│ │(bundled) │      │  │
 * │  │  └──────────┘ └──────────┘ └──────────┘      │  │
 * │  └───────────────────────────────────────────────┘  │
 * └─────────────────────────────────────────────────────┘
 * ```
 *
 * ## ファイル連携プロトコル（Python モジュール）
 *
 * Python モジュールがホストアプリのドキュメントを操作する場合:
 *
 * ```
 * ① ホストアプリが現在のファイルを一時ディレクトリに保存
 * ② Python subprocess がファイルを読み込み・処理
 * ③ Python が処理済みファイルを一時ディレクトリに書き出し
 * ④ ホストアプリが処理済みファイルを再読み込み
 * ```
 *
 * ## 新規モジュール追加手順
 * 1. このファイルの ADDON_MODULES にモジュール定義を追加
 * 2. PRODUCT_ADDON_SUPPORT に対応製品を追加
 * 3. 必要に応じて config/products.ts のフィーチャーにライセンスゲートを追加
 * 4. ホストアプリ側にモジュール UI パネルとハンドラーを実装
 */

import type { ProductCode, PlanCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** モジュール配布タイプ */
export type AddonDistributionType = 'bundled' | 'extension';

/** モジュール UI の配置場所 */
export type AddonPanelPosition = 'right' | 'bottom' | 'dialog' | 'tab';

/** モジュールの状態 */
export type AddonState = 'not_installed' | 'installed' | 'enabled' | 'disabled' | 'update_available';

/**
 * ファイル連携プロトコル
 *
 * Python 等の外部プロセスがホストアプリのドキュメントを操作するための仕組み。
 * ホストアプリ側がこのプロトコルを実装する。
 */
export interface FileExchangeProtocol {
  /** 連携対象のファイル形式 */
  supportedFormats: string[];
  /** ホストアプリ → モジュールへの入力方式 */
  inputMethod: 'temp_file' | 'stdin' | 'shared_memory';
  /** モジュール → ホストアプリへの出力方式 */
  outputMethod: 'temp_file' | 'stdout' | 'shared_memory';
  /** ファイル受け渡し用の一時ディレクトリ (ランタイム決定) */
  tempDirPattern: string;
}

/** モジュールが公開するツール定義（Claude API Tool Use 互換） */
export interface AddonToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/** 外部プロセス依存の定義 */
export interface ExternalDependency {
  /** 依存名 (表示用) */
  name: string;
  /** 実行ファイル名 (検出用) */
  executable: string;
  /** 最低バージョン */
  minVersion: string;
  /** バージョン確認コマンド */
  versionCommand: string;
  /** インストール手順 URL */
  installUrl: string;
  /** 自動インストール可能か */
  autoInstallable: boolean;
}

// =============================================================================
// I/O コントラクト — 全モジュール共通の Input → Process → Output 定義
// =============================================================================

/**
 * アドインモジュールの I/O コントラクト
 *
 * 各モジュールが「何を受け取り、何を処理し、何を返すか」を明示する。
 * UI の見た目（3D アバター、コードエディター等）に関わらず、
 * データレベルのインターフェースはこの型で統一される。
 *
 * ホストアプリはこのコントラクトだけを見て連携すればよい。
 * モジュール内部の実装（WebView, subprocess, API call）は隠蔽される。
 */
export interface AddonIOContract {
  /** コントラクト ID（モジュール内で一意、複数の I/O パスがある場合に区別） */
  id: string;
  /** 操作名（英語） */
  name: string;
  /** 操作名（日本語） */
  nameJa: string;
  /** この I/O パスの説明 */
  description: string;
  /** Input: ホストアプリからモジュールに渡すデータ */
  input: AddonIOField[];
  /** Process: モジュールが内部で行う処理の概要 */
  process: string;
  /** Output: モジュールからホストアプリに返すデータ */
  output: AddonIOField[];
  /** 通信方式 */
  transport: 'in_process' | 'subprocess' | 'http' | 'websocket' | 'ipc';
  /** 同期/非同期 */
  async: boolean;
  /** ストリーミング出力か */
  streaming: boolean;
}

/** I/O フィールド定義 */
export interface AddonIOField {
  /** フィールド名 */
  key: string;
  /** 型 */
  type: 'string' | 'number' | 'boolean' | 'binary' | 'json' | 'file_path' | 'audio_stream';
  /** 説明 */
  description: string;
  /** 必須か */
  required: boolean;
  /** 例 */
  example?: string;
}

/** アドインモジュール定義 */
export interface AddonModuleDefinition {
  /** モジュール ID（一意） */
  id: string;
  /** モジュール名（英語） */
  name: string;
  /** モジュール名（日本語） */
  nameJa: string;
  /** 説明（英語） */
  description: string;
  /** 説明（日本語） */
  descriptionJa: string;
  /** バージョン */
  version: string;
  /** 配布タイプ */
  distribution: AddonDistributionType;
  /** UI パネルの配置場所 */
  panelPosition: AddonPanelPosition;
  /** ライセンスで必要なフィーチャーキー（products.ts のキーに対応） */
  requiredFeatureKey: string;
  /** 利用可能プラン */
  allowedPlans: PlanCode[];
  /** 外部プロセス依存 */
  dependencies: ExternalDependency[];
  /** ファイル連携プロトコル（ドキュメント操作する場合） */
  fileExchange?: FileExchangeProtocol;
  /**
   * I/O コントラクト — このモジュールの全入出力を定義
   *
   * モジュールが複数の操作を持つ場合は複数エントリ。
   * ホストアプリはこのコントラクトだけを実装すれば連携できる。
   */
  ioContracts: AddonIOContract[];
  /** AI Tool Use 定義（AI 連携する場合） */
  tools: AddonToolDefinition[];
  /** このモジュールが依存する他のモジュール ID */
  requiresModules: string[];
  /** モジュールのアイコン（Segoe Fluent Icons のグリフ名） */
  icon: string;
  /** テーマカラー */
  themeColor: string;
  /** 設定項目のスキーマ（ユーザーが設定画面で変更可能な項目） */
  settingsSchema: AddonSettingDefinition[];
}

/** モジュール設定項目 */
export interface AddonSettingDefinition {
  key: string;
  name: string;
  nameJa: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  defaultValue: string | number | boolean;
  options?: Array<{ value: string; label: string; labelJa: string }>;
  descriptionJa?: string;
}

/** 製品ごとのアドイン対応状況 */
export interface ProductAddonSupport {
  /** サポートする全モジュール ID */
  supportedModules: string[];
  /** デフォルトで有効なモジュール ID */
  defaultEnabled: string[];
}

// =============================================================================
// モジュール定義
// =============================================================================

/**
 * 全アドインモジュールのカタログ
 *
 * 各モジュールは独立して追加・削除でき、ライセンスゲートで制御される。
 */
export const ADDON_MODULES: Record<string, AddonModuleDefinition> = {
  // =========================================================================
  // AI アシスタント
  // =========================================================================
  ai_assistant: {
    id: 'ai_assistant',
    name: 'AI Assistant',
    nameJa: 'AI アシスタント',
    description: 'Claude-powered AI assistant for document editing, proofreading, and suggestions',
    descriptionJa: 'Claude AIによるドキュメント編集・校正・提案アシスタント',
    version: '1.0.0',
    distribution: 'bundled',
    panelPosition: 'right',
    requiredFeatureKey: 'ai_assistant',
    allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    dependencies: [],
    ioContracts: [
      {
        id: 'chat',
        name: 'Chat',
        nameJa: 'チャット',
        description: 'Send a message with document context, receive AI response',
        input: [
          { key: 'message', type: 'string', description: 'ユーザーのメッセージ', required: true },
          { key: 'document_context', type: 'json', description: '現在のドキュメント内容（選択範囲 or 全体）', required: false },
          { key: 'persona_id', type: 'string', description: 'ペルソナ ID (shunsuke/megumi/manabu)', required: false, example: 'megumi' },
          { key: 'conversation_history', type: 'json', description: '過去の会話履歴', required: false },
        ],
        process: 'Claude API にメッセージ + ドキュメントコンテキストを送信。Tool Use でドキュメント操作を実行。',
        output: [
          { key: 'response_text', type: 'string', description: 'AI の応答テキスト', required: true },
          { key: 'tool_results', type: 'json', description: '実行されたツール操作の結果', required: false },
          { key: 'usage', type: 'json', description: 'トークン使用量 { input_tokens, output_tokens }', required: true },
        ],
        transport: 'http',
        async: true,
        streaming: true,
      },
      {
        id: 'structured_check',
        name: 'Content Check',
        nameJa: 'コンテンツチェック',
        description: 'Structured analysis of document content (proofreading, improvement suggestions)',
        input: [
          { key: 'content', type: 'string', description: 'チェック対象のテキスト', required: true },
          { key: 'check_type', type: 'string', description: 'チェック種別: proofread / improve / summarize', required: true, example: 'proofread' },
        ],
        process: 'Claude API に構造化出力プロンプトを送信。JSON 形式で修正提案を返却。',
        output: [
          { key: 'suggestions', type: 'json', description: '修正提案の配列 [{ original, suggested, reason }]', required: true },
          { key: 'summary', type: 'string', description: '全体の要約コメント', required: true },
        ],
        transport: 'http',
        async: true,
        streaming: false,
      },
    ],
    tools: [], // ツールは ai-assistant.ts で製品別に定義済み
    requiresModules: [],
    icon: 'Chat',
    themeColor: '#B8942F',
    settingsSchema: [
      {
        key: 'api_key',
        name: 'Anthropic API Key',
        nameJa: 'Anthropic API キー',
        type: 'string',
        defaultValue: '',
        descriptionJa: 'Claude API キー（BYOK）',
      },
      {
        key: 'default_persona',
        name: 'Default Persona',
        nameJa: 'デフォルトペルソナ',
        type: 'select',
        defaultValue: 'megumi',
        options: [
          { value: 'shunsuke', label: 'Claude Shun (Haiku)', labelJa: 'Claude 俊（Haiku）' },
          { value: 'megumi', label: 'Claude Meg (Sonnet)', labelJa: 'Claude 恵（Sonnet）' },
          { value: 'manabu', label: 'Claude Manabu (Opus)', labelJa: 'Claude 学（Opus）' },
        ],
        descriptionJa: 'デフォルトで使用するAIペルソナ',
      },
    ],
  },

  // =========================================================================
  // Python 実行エンジン（InsightPy コア）
  // =========================================================================
  python_runtime: {
    id: 'python_runtime',
    name: 'Python Runtime',
    nameJa: 'Python 実行エンジン',
    description: 'Embedded Python execution environment powered by InsightPy engine. Run Python scripts to process the currently open document.',
    descriptionJa: 'InsightPyエンジンによるPython実行環境。開いているドキュメントをPythonスクリプトで処理。',
    version: '1.0.0',
    distribution: 'extension',
    panelPosition: 'bottom',
    requiredFeatureKey: 'ai_editor',
    allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    dependencies: [
      {
        name: 'Python',
        executable: 'python',
        minVersion: '3.10',
        versionCommand: 'python --version',
        installUrl: 'https://www.python.org/downloads/',
        autoInstallable: false,
      },
    ],
    fileExchange: {
      supportedFormats: ['.xlsx', '.docx', '.pptx'],
      inputMethod: 'temp_file',
      outputMethod: 'temp_file',
      tempDirPattern: '%TEMP%/harmonic_insight/{product}/python_exchange',
    },
    ioContracts: [
      {
        id: 'validate_syntax',
        name: 'Validate Syntax',
        nameJa: '構文検証',
        description: 'Validate Python code syntax without executing',
        input: [
          { key: 'code', type: 'string', description: 'Python ソースコード', required: true },
        ],
        process: 'Python ast.parse() で構文解析。SyntaxError を検出。',
        output: [
          { key: 'valid', type: 'boolean', description: '構文が正しいか', required: true },
          { key: 'error', type: 'string', description: 'エラーメッセージ（invalid の場合）', required: false },
          { key: 'line', type: 'number', description: 'エラー行番号', required: false },
          { key: 'offset', type: 'number', description: 'エラー列番号', required: false },
        ],
        transport: 'subprocess',
        async: true,
        streaming: false,
      },
      {
        id: 'execute_standalone',
        name: 'Execute Code',
        nameJa: 'コード実行',
        description: 'Execute Python code in sandbox (no document access)',
        input: [
          { key: 'code', type: 'string', description: 'Python ソースコード', required: true },
          { key: 'timeout_seconds', type: 'number', description: 'タイムアウト秒数（デフォルト: 30）', required: false, example: '30' },
        ],
        process: 'Python subprocess でサンドボックス実行。stdout/stderr をキャプチャ。',
        output: [
          { key: 'stdout', type: 'string', description: '標準出力', required: true },
          { key: 'stderr', type: 'string', description: '標準エラー', required: true },
          { key: 'exit_code', type: 'number', description: '終了コード（0=成功）', required: true },
          { key: 'timed_out', type: 'boolean', description: 'タイムアウトしたか', required: true },
        ],
        transport: 'subprocess',
        async: true,
        streaming: false,
      },
      {
        id: 'execute_on_document',
        name: 'Execute on Document',
        nameJa: 'ドキュメント処理実行',
        description: 'Save current document to temp → Python processes it → reload result',
        input: [
          { key: 'code', type: 'string', description: 'Python ソースコード（INPUT_PATH, OUTPUT_PATH 変数が自動注入）', required: true },
          { key: 'document_path', type: 'file_path', description: 'ホストアプリが保存した一時ファイルパス', required: true },
          { key: 'timeout_seconds', type: 'number', description: 'タイムアウト秒数', required: false },
        ],
        process: 'ホストが一時保存 → Python が openpyxl/python-docx/python-pptx で処理 → 結果ファイルを書き出し',
        output: [
          { key: 'output_path', type: 'file_path', description: '処理済みファイルパス（ホストアプリが再読み込み）', required: true },
          { key: 'stdout', type: 'string', description: '実行ログ', required: true },
          { key: 'stderr', type: 'string', description: 'エラーログ', required: true },
          { key: 'exit_code', type: 'number', description: '終了コード', required: true },
        ],
        transport: 'subprocess',
        async: true,
        streaming: false,
      },
      {
        id: 'lint',
        name: 'Lint Code',
        nameJa: 'コード解析',
        description: 'Run linting checks (undefined vars, unused imports, etc.)',
        input: [
          { key: 'code', type: 'string', description: 'Python ソースコード', required: true },
        ],
        process: 'pyflakes 相当の静的解析。未定義変数・未使用インポートを検出。',
        output: [
          { key: 'diagnostics', type: 'json', description: '診断結果 [{ line, column, message, severity }]', required: true },
        ],
        transport: 'subprocess',
        async: true,
        streaming: false,
      },
    ],
    tools: [
      {
        name: 'validate_python_syntax',
        description: 'Validate Python code syntax using ast.parse()',
        input_schema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Python source code to validate' },
          },
          required: ['code'],
        },
      },
      {
        name: 'run_python_on_document',
        description: 'Execute Python script on the currently open document.',
        input_schema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Python script to execute' },
            timeout_seconds: { type: 'number', description: 'Timeout in seconds (default: 30)' },
          },
          required: ['code'],
        },
      },
      {
        name: 'run_python_code',
        description: 'Execute Python code in a sandboxed subprocess (no document access)',
        input_schema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Python source code to execute' },
            timeout_seconds: { type: 'number', description: 'Timeout in seconds (default: 30)' },
          },
          required: ['code'],
        },
      },
      {
        name: 'lint_python_code',
        description: 'Run linting checks on Python code',
        input_schema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Python source code to lint' },
          },
          required: ['code'],
        },
      },
    ],
    requiresModules: [],
    icon: 'Code',
    themeColor: '#3776AB',
    settingsSchema: [
      {
        key: 'python_path',
        name: 'Python Executable Path',
        nameJa: 'Python 実行パス',
        type: 'string',
        defaultValue: 'python',
        descriptionJa: 'Python 実行ファイルのパス（デフォルト: PATH から検索）',
      },
      {
        key: 'auto_install_packages',
        name: 'Auto Install Packages',
        nameJa: 'パッケージ自動インストール',
        type: 'boolean',
        defaultValue: false,
        descriptionJa: 'スクリプトが必要とするパッケージを自動で pip install する',
      },
      {
        key: 'execution_timeout',
        name: 'Default Timeout (seconds)',
        nameJa: 'デフォルトタイムアウト（秒）',
        type: 'number',
        defaultValue: 30,
        descriptionJa: 'スクリプト実行のデフォルトタイムアウト',
      },
    ],
  },

  // =========================================================================
  // AI コードエディター（Python + AI）
  // =========================================================================
  ai_code_editor: {
    id: 'ai_code_editor',
    name: 'AI Code Editor',
    nameJa: 'AI コードエディター',
    description: 'AI-powered Python code editor with syntax validation, auto-completion, and document processing suggestions',
    descriptionJa: 'AI搭載のPythonコードエディター。構文検証・補完・ドキュメント処理の提案。',
    version: '1.0.0',
    distribution: 'bundled',
    panelPosition: 'bottom',
    requiredFeatureKey: 'ai_editor',
    allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    dependencies: [],
    ioContracts: [
      {
        id: 'ai_generate_code',
        name: 'AI Generate Code',
        nameJa: 'AI コード生成',
        description: 'Natural language instruction → validated Python code',
        input: [
          { key: 'instruction', type: 'string', description: '自然言語の指示（例: "A列の空白行を削除して"）', required: true },
          { key: 'current_code', type: 'string', description: '現在エディタに表示中のコード', required: false },
          { key: 'document_schema', type: 'json', description: 'ドキュメント構造情報（シート名、列名等）', required: false },
        ],
        process: 'AI がコード生成 → validate_python_syntax で構文検証 → lint で品質チェック → 検証済みコードを返却',
        output: [
          { key: 'code', type: 'string', description: '構文検証済みの Python コード', required: true },
          { key: 'description', type: 'string', description: 'コードの説明', required: true },
          { key: 'required_packages', type: 'json', description: '必要な pip パッケージ ["openpyxl", ...]', required: true },
        ],
        transport: 'http',
        async: true,
        streaming: true,
      },
    ],
    tools: [],
    requiresModules: ['ai_assistant', 'python_runtime'],
    icon: 'CodeEdit',
    themeColor: '#B8942F',
    settingsSchema: [
      {
        key: 'font_size',
        name: 'Editor Font Size',
        nameJa: 'エディターフォントサイズ',
        type: 'number',
        defaultValue: 14,
      },
      {
        key: 'auto_validate',
        name: 'Auto Validate on Type',
        nameJa: '入力時自動検証',
        type: 'boolean',
        defaultValue: true,
        descriptionJa: 'コード入力時にリアルタイムで構文検証を実行',
      },
    ],
  },

  // =========================================================================
  // 参考資料
  // =========================================================================
  reference_materials: {
    id: 'reference_materials',
    name: 'Reference Materials',
    nameJa: '参考資料',
    description: 'Attach reference documents (PDF, images, text) and use them as context for AI suggestions and document editing',
    descriptionJa: '参考資料（PDF・画像・テキスト）を添付し、AI提案やドキュメント編集のコンテキストとして活用',
    version: '1.0.0',
    distribution: 'bundled',
    panelPosition: 'right',
    requiredFeatureKey: 'reference_materials',
    allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    dependencies: [],
    ioContracts: [
      {
        id: 'attach',
        name: 'Attach Reference',
        nameJa: '参考資料添付',
        description: 'Attach a file and extract text for indexing',
        input: [
          { key: 'file_path', type: 'file_path', description: '添付ファイルのパス', required: true },
          { key: 'file_type', type: 'string', description: 'ファイル種別: pdf / image / text / docx', required: true },
        ],
        process: 'ファイルからテキスト抽出 → チャンク分割 → インデックス登録',
        output: [
          { key: 'reference_id', type: 'string', description: '登録された参考資料 ID', required: true },
          { key: 'extracted_text', type: 'string', description: '抽出されたテキスト（プレビュー用、先頭 500 文字）', required: true },
          { key: 'page_count', type: 'number', description: 'ページ数（PDF の場合）', required: false },
        ],
        transport: 'in_process',
        async: true,
        streaming: false,
      },
      {
        id: 'search',
        name: 'Search References',
        nameJa: '参考資料検索',
        description: 'Search across attached references by keyword',
        input: [
          { key: 'query', type: 'string', description: '検索クエリ', required: true },
          { key: 'max_results', type: 'number', description: '最大件数（デフォルト: 5）', required: false },
        ],
        process: 'インデックスからキーワード検索 → 関連度順にソート',
        output: [
          { key: 'results', type: 'json', description: '検索結果 [{ reference_id, title, snippet, relevance }]', required: true },
        ],
        transport: 'in_process',
        async: true,
        streaming: false,
      },
    ],
    tools: [
      {
        name: 'search_references',
        description: 'Search across attached reference materials by keyword or semantic query',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            max_results: { type: 'number', description: 'Maximum results to return (default: 5)' },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_reference_content',
        description: 'Get the full text content of a specific reference document',
        input_schema: {
          type: 'object',
          properties: {
            reference_id: { type: 'string', description: 'ID of the reference document' },
            page: { type: 'number', description: 'Specific page number (for PDFs)' },
          },
          required: ['reference_id'],
        },
      },
      {
        name: 'list_references',
        description: 'List all attached reference materials with metadata',
        input_schema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
    requiresModules: [],
    icon: 'Library',
    themeColor: '#16A34A',
    settingsSchema: [
      {
        key: 'max_file_size_mb',
        name: 'Max File Size (MB)',
        nameJa: '最大ファイルサイズ (MB)',
        type: 'number',
        defaultValue: 50,
        descriptionJa: '参考資料1ファイルあたりの最大サイズ',
      },
      {
        key: 'auto_index',
        name: 'Auto Index on Attach',
        nameJa: '添付時自動インデックス',
        type: 'boolean',
        defaultValue: true,
        descriptionJa: '参考資料添付時にテキスト抽出・インデックスを自動実行',
      },
    ],
  },

  // =========================================================================
  // 掲示板
  // =========================================================================
  board: {
    id: 'board',
    name: 'Team Board',
    nameJa: '掲示板',
    description: 'Team collaboration board for discussions and announcements within the document context',
    descriptionJa: 'ドキュメントに紐づくチーム掲示板・ディスカッション',
    version: '1.0.0',
    distribution: 'bundled',
    panelPosition: 'right',
    requiredFeatureKey: 'board',
    allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    dependencies: [],
    ioContracts: [
      {
        id: 'post',
        name: 'Post Message',
        nameJa: 'メッセージ投稿',
        description: 'Post a message to the document-linked board',
        input: [
          { key: 'text', type: 'string', description: '投稿テキスト', required: true },
          { key: 'author_id', type: 'string', description: '投稿者 ID', required: true },
          { key: 'document_id', type: 'string', description: '紐づくドキュメント ID', required: true },
        ],
        process: 'Supabase の board テーブルに保存 → リアルタイム通知を配信',
        output: [
          { key: 'post_id', type: 'string', description: '投稿 ID', required: true },
          { key: 'created_at', type: 'string', description: '投稿日時（ISO 8601）', required: true },
        ],
        transport: 'http',
        async: true,
        streaming: false,
      },
    ],
    tools: [],
    requiresModules: [],
    icon: 'People',
    themeColor: '#7C3AED',
    settingsSchema: [
      {
        key: 'notifications',
        name: 'Enable Notifications',
        nameJa: '通知を有効にする',
        type: 'boolean',
        defaultValue: true,
      },
    ],
  },

  // =========================================================================
  // メッセージ
  // =========================================================================
  messaging: {
    id: 'messaging',
    name: 'Messaging',
    nameJa: 'メッセージ',
    description: 'Direct messaging between team members within the document workspace',
    descriptionJa: 'ドキュメントワークスペース内でのチームメンバー間メッセージ',
    version: '1.0.0',
    distribution: 'bundled',
    panelPosition: 'right',
    requiredFeatureKey: 'send_message',
    allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    dependencies: [],
    ioContracts: [
      {
        id: 'send',
        name: 'Send Message',
        nameJa: 'メッセージ送信',
        description: 'Send a direct message to a team member',
        input: [
          { key: 'text', type: 'string', description: 'メッセージ本文', required: true },
          { key: 'to_user_id', type: 'string', description: '送信先ユーザー ID', required: true },
          { key: 'from_user_id', type: 'string', description: '送信元ユーザー ID', required: true },
        ],
        process: 'Supabase に保存 → リアルタイム配信',
        output: [
          { key: 'message_id', type: 'string', description: 'メッセージ ID', required: true },
          { key: 'delivered', type: 'boolean', description: '配信済みか', required: true },
        ],
        transport: 'http',
        async: true,
        streaming: false,
      },
    ],
    tools: [],
    requiresModules: [],
    icon: 'Mail',
    themeColor: '#0891B2',
    settingsSchema: [],
  },

  // =========================================================================
  // 音声入力（STT）
  // =========================================================================
  voice_input: {
    id: 'voice_input',
    name: 'Voice Input',
    nameJa: '音声入力',
    description: 'Speech-to-text: microphone audio → transcribed text inserted into document',
    descriptionJa: 'マイク音声 → テキスト変換 → ドキュメントに挿入',
    version: '1.0.0',
    distribution: 'bundled',
    panelPosition: 'dialog',
    requiredFeatureKey: 'voice_input',
    allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    dependencies: [],
    ioContracts: [
      {
        id: 'transcribe',
        name: 'Transcribe Speech',
        nameJa: '音声認識',
        description: 'Audio stream from microphone → transcribed text',
        input: [
          { key: 'audio', type: 'audio_stream', description: 'マイクからの音声ストリーム（WebM/WAV）', required: true },
          { key: 'language', type: 'string', description: '認識言語（デフォルト: ja-JP）', required: false, example: 'ja-JP' },
        ],
        process: 'Web Speech API（Chrome）または Whisper API で音声認識。1.5 秒の無音で自動確定。',
        output: [
          { key: 'text', type: 'string', description: '確定されたテキスト', required: true },
          { key: 'interim_text', type: 'string', description: '認識途中のテキスト（リアルタイムプレビュー）', required: false },
          { key: 'is_final', type: 'boolean', description: '確定済みか（true で文書に挿入）', required: true },
        ],
        transport: 'in_process',
        async: true,
        streaming: true,
      },
    ],
    tools: [],
    requiresModules: [],
    icon: 'Microphone',
    themeColor: '#DC2626',
    settingsSchema: [
      {
        key: 'engine',
        name: 'Speech Engine',
        nameJa: '音声エンジン',
        type: 'select',
        defaultValue: 'web_speech',
        options: [
          { value: 'web_speech', label: 'Web Speech API', labelJa: 'Web Speech API' },
          { value: 'whisper', label: 'Whisper (Groq/OpenAI)', labelJa: 'Whisper (Groq/OpenAI)' },
        ],
      },
      {
        key: 'language',
        name: 'Language',
        nameJa: '言語',
        type: 'select',
        defaultValue: 'ja-JP',
        options: [
          { value: 'ja-JP', label: 'Japanese', labelJa: '日本語' },
          { value: 'en-US', label: 'English', labelJa: '英語' },
        ],
      },
    ],
  },

  // =========================================================================
  // Python スクリプトランナー（InsightPy 相当のスクリプト一覧 UI）
  // =========================================================================
  python_scripts: {
    id: 'python_scripts',
    name: 'Python Script Runner',
    nameJa: 'Python スクリプト',
    description: 'Browse, manage, and run Python scripts from a categorized list. Equivalent to InsightPy script management embedded in InsightOffice. Admins can preload scripts for end users.',
    descriptionJa: 'Pythonスクリプトの一覧表示・管理・実行。InsightPyのスクリプト管理をInsightOfficeに組み込んだもの。管理者が業務スクリプトを事前配布可能。',
    version: '1.0.0',
    distribution: 'bundled',
    panelPosition: 'tab',
    requiredFeatureKey: 'ai_editor',
    allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    dependencies: [],
    ioContracts: [
      {
        id: 'list_scripts',
        name: 'List Scripts',
        nameJa: 'スクリプト一覧取得',
        description: 'Get all available scripts (user-created + admin-preloaded)',
        input: [
          { key: 'category', type: 'string', description: 'カテゴリでフィルタ（省略時: 全件）', required: false },
        ],
        process: 'ローカルストレージ + 管理者プロファイルのスクリプトを統合して返却',
        output: [
          { key: 'scripts', type: 'json', description: 'スクリプト一覧 [{ id, name, nameJa, category, descriptionJa, readOnly, code }]', required: true },
          { key: 'categories', type: 'json', description: 'カテゴリ一覧 ["データ整形", "集計", ...]', required: true },
        ],
        transport: 'in_process',
        async: false,
        streaming: false,
      },
      {
        id: 'run_script',
        name: 'Run Script',
        nameJa: 'スクリプト実行',
        description: 'Execute a script from the list on the current document',
        input: [
          { key: 'script_id', type: 'string', description: '実行するスクリプトの ID', required: true },
          { key: 'parameters', type: 'json', description: 'スクリプトに渡すパラメータ（スクリプトが要求する場合）', required: false },
        ],
        process: '① スクリプト取得 → ② validate_python_syntax → ③ ドキュメント一時保存 → ④ Python 実行 → ⑤ 結果再読み込み',
        output: [
          { key: 'success', type: 'boolean', description: '実行成功か', required: true },
          { key: 'stdout', type: 'string', description: '実行ログ', required: true },
          { key: 'stderr', type: 'string', description: 'エラーログ', required: true },
          { key: 'exit_code', type: 'number', description: '終了コード', required: true },
          { key: 'document_modified', type: 'boolean', description: 'ドキュメントが変更されたか', required: true },
        ],
        transport: 'subprocess',
        async: true,
        streaming: false,
      },
      {
        id: 'save_script',
        name: 'Save Script',
        nameJa: 'スクリプト保存',
        description: 'Save a new script or update an existing one',
        input: [
          { key: 'id', type: 'string', description: 'スクリプト ID（新規の場合は空）', required: false },
          { key: 'name', type: 'string', description: 'スクリプト名', required: true },
          { key: 'category', type: 'string', description: 'カテゴリ', required: true },
          { key: 'code', type: 'string', description: 'Python ソースコード', required: true },
          { key: 'description', type: 'string', description: '説明', required: false },
        ],
        process: '構文検証 → ローカルストレージに保存（readOnly=true のスクリプトは上書き不可）',
        output: [
          { key: 'script_id', type: 'string', description: '保存されたスクリプト ID', required: true },
          { key: 'valid', type: 'boolean', description: '構文が正しいか', required: true },
        ],
        transport: 'in_process',
        async: true,
        streaming: false,
      },
    ],
    tools: [
      {
        name: 'list_available_scripts',
        description: 'List all available Python scripts (user + admin preloaded)',
        input_schema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Filter by category' },
          },
          required: [],
        },
      },
      {
        name: 'run_script_by_id',
        description: 'Run a Python script from the script list by its ID',
        input_schema: {
          type: 'object',
          properties: {
            script_id: { type: 'string', description: 'Script ID to execute' },
            parameters: { type: 'object', description: 'Parameters to pass to the script' },
          },
          required: ['script_id'],
        },
      },
    ],
    requiresModules: ['python_runtime'],
    icon: 'PlayList',
    themeColor: '#3776AB',
    settingsSchema: [
      {
        key: 'show_preloaded',
        name: 'Show Admin Scripts',
        nameJa: '管理者スクリプトを表示',
        type: 'boolean',
        defaultValue: true,
        descriptionJa: '管理者が事前配布したスクリプトを一覧に表示する',
      },
      {
        key: 'confirm_before_run',
        name: 'Confirm Before Run',
        nameJa: '実行前確認',
        type: 'boolean',
        defaultValue: true,
        descriptionJa: 'スクリプト実行前に確認ダイアログを表示する',
      },
    ],
  },

  // =========================================================================
  // VRM アバター（Live2D-Talker / Live2D-Interview 統合）
  // =========================================================================
  vrm_avatar: {
    id: 'vrm_avatar',
    name: 'VRM Avatar',
    nameJa: 'VRM アバター',
    description: 'VRM/Live2D 3D avatar for voice conversation. Internally: TTS (text→speech) + STT (speech→text) + lip-sync animation. The 3D visual is a presentation layer over the same audio I/O.',
    descriptionJa: 'VRM/Live2D 3Dアバターによる音声会話。内部的には TTS（テキスト→音声読み上げ）+ STT（音声→テキスト）+ リップシンク。3D表示は音声 I/O の表現層。',
    version: '1.0.0',
    distribution: 'extension',
    panelPosition: 'dialog',
    requiredFeatureKey: 'vrm_avatar',
    allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    dependencies: [],
    ioContracts: [
      // -----------------------------------------------------------------
      // TTS: テキスト → 音声読み上げ（＋アバターのリップシンク）
      // -----------------------------------------------------------------
      {
        id: 'speak',
        name: 'Text-to-Speech',
        nameJa: 'テキスト読み上げ',
        description: 'Text → synthesized speech audio + avatar lip-sync animation. The 3D avatar is just a visual layer on top of TTS.',
        input: [
          { key: 'text', type: 'string', description: '読み上げるテキスト', required: true },
          { key: 'voice_id', type: 'string', description: '音声 ID（VoiceVox キャラ or ElevenLabs voice）', required: false, example: 'voicevox-zundamon' },
          { key: 'speed', type: 'number', description: '読み上げ速度（0.5〜2.0、デフォルト: 1.0）', required: false },
          { key: 'emotion', type: 'string', description: '感情（neutral/happy/sad/angry）→ アバター表情に反映', required: false, example: 'neutral' },
        ],
        process: 'テキスト → TTS エンジン（VoiceVox / ElevenLabs）→ 音声バイナリ生成。同時にフォネームを抽出しアバターのリップシンクに反映。',
        output: [
          { key: 'audio', type: 'binary', description: '音声データ（WAV/MP3）', required: true },
          { key: 'duration_ms', type: 'number', description: '音声長（ミリ秒）', required: true },
          { key: 'phonemes', type: 'json', description: 'タイムスタンプ付きフォネーム [{ time_ms, phoneme }]（リップシンク用）', required: true },
        ],
        transport: 'http',
        async: true,
        streaming: false,
      },
      // -----------------------------------------------------------------
      // STT: 音声 → テキスト（＋アバターのリスニングアニメーション）
      // -----------------------------------------------------------------
      {
        id: 'listen',
        name: 'Speech-to-Text',
        nameJa: '音声認識',
        description: 'Microphone audio → transcribed text. Avatar shows listening animation during recording. Internally identical to voice_input module.',
        input: [
          { key: 'audio', type: 'audio_stream', description: 'マイクからの音声ストリーム', required: true },
          { key: 'language', type: 'string', description: '認識言語', required: false, example: 'ja-JP' },
        ],
        process: 'Whisper API で音声認識（voice_input モジュールと同じエンジン）。認識中はアバターがリスニングアニメーションを表示。',
        output: [
          { key: 'text', type: 'string', description: '認識されたテキスト', required: true },
          { key: 'is_final', type: 'boolean', description: '確定済みか', required: true },
        ],
        transport: 'websocket',
        async: true,
        streaming: true,
      },
      // -----------------------------------------------------------------
      // 会話: テキスト → AI 応答 → 音声読み上げ（STT + AI + TTS の統合フロー）
      // -----------------------------------------------------------------
      {
        id: 'converse',
        name: 'Conversation',
        nameJa: '会話',
        description: 'Full conversation loop: user speech → STT → AI response → TTS → avatar speaks back. Combines listen + ai_assistant.chat + speak into one flow.',
        input: [
          { key: 'audio', type: 'audio_stream', description: 'ユーザーの音声', required: true },
          { key: 'conversation_history', type: 'json', description: '過去の会話履歴', required: false },
          { key: 'document_context', type: 'json', description: '現在のドキュメント内容', required: false },
          { key: 'persona_id', type: 'string', description: 'AI ペルソナ', required: false, example: 'megumi' },
        ],
        process: '① STT で音声→テキスト → ② Claude API でAI応答生成 → ③ TTS でテキスト→音声 → ④ アバターがリップシンクで読み上げ',
        output: [
          { key: 'user_text', type: 'string', description: 'ユーザー発話のテキスト（STT 結果）', required: true },
          { key: 'ai_text', type: 'string', description: 'AI の応答テキスト', required: true },
          { key: 'ai_audio', type: 'binary', description: 'AI 応答の音声データ', required: true },
          { key: 'phonemes', type: 'json', description: 'リップシンク用フォネーム', required: true },
          { key: 'tool_results', type: 'json', description: 'AI が実行したツール操作の結果', required: false },
        ],
        transport: 'websocket',
        async: true,
        streaming: true,
      },
    ],
    tools: [],
    requiresModules: ['ai_assistant', 'voice_input'],
    icon: 'Person',
    themeColor: '#EC4899',
    settingsSchema: [
      {
        key: 'vrm_model_path',
        name: 'VRM Model Path',
        nameJa: 'VRM モデルパス',
        type: 'string',
        defaultValue: '',
        descriptionJa: 'VRM モデルファイルのパス（.vrm）',
      },
      {
        key: 'tts_engine',
        name: 'TTS Engine',
        nameJa: '音声合成エンジン',
        type: 'select',
        defaultValue: 'voicevox',
        options: [
          { value: 'voicevox', label: 'VoiceVox (Local)', labelJa: 'VoiceVox（ローカル）' },
          { value: 'elevenlabs', label: 'ElevenLabs (Cloud)', labelJa: 'ElevenLabs（クラウド）' },
        ],
        descriptionJa: 'テキスト読み上げに使用するエンジン',
      },
      {
        key: 'voicevox_speaker_id',
        name: 'VoiceVox Speaker',
        nameJa: 'VoiceVox キャラクター',
        type: 'number',
        defaultValue: 3,
        descriptionJa: 'VoiceVox の話者 ID（デフォルト: ずんだもん = 3）',
      },
      {
        key: 'auto_listen',
        name: 'Auto Listen After Speak',
        nameJa: '読み上げ後自動リスニング',
        type: 'boolean',
        defaultValue: true,
        descriptionJa: 'アバターの読み上げ完了後、自動でマイクを有効にする',
      },
    ],
  },
};

// =============================================================================
// 製品別アドイン対応マップ
// =============================================================================

/**
 * 各 InsightOffice 製品がサポートするアドインモジュールと、
 * デフォルトで有効になるモジュールを定義。
 *
 * - supportedModules: インストール可能なモジュール一覧
 * - defaultEnabled: 初回起動時にデフォルトで ON になるモジュール
 */
export const PRODUCT_ADDON_SUPPORT: Partial<Record<ProductCode, ProductAddonSupport>> = {
  HMSH: {
    supportedModules: [
      'ai_assistant',
      'python_runtime',
      'ai_code_editor',
      'python_scripts',
      'reference_materials',
      'board',
      'messaging',
      'voice_input',
      'vrm_avatar',
    ],
    defaultEnabled: ['ai_assistant', 'board', 'messaging'],
  },
  HMDC: {
    supportedModules: [
      'ai_assistant',
      'python_runtime',
      'ai_code_editor',
      'python_scripts',
      'reference_materials',
      'voice_input',
      'vrm_avatar',
    ],
    defaultEnabled: ['ai_assistant', 'reference_materials'],
  },
  HMSL: {
    supportedModules: [
      'ai_assistant',
      'python_runtime',
      'ai_code_editor',
      'python_scripts',
      'reference_materials',
      'voice_input',
      'vrm_avatar',
    ],
    defaultEnabled: ['ai_assistant'],
  },
  // INPY / INBT はアドインではなくコア機能として提供
  // InsightOffice 系のみがアドイン対象
};

// =============================================================================
// 管理者プロファイル — コンサル/SIer が現場に合わせてモジュール構成を制御
// =============================================================================

/**
 * 管理者デプロイプロファイル
 *
 * コンサルタントや SIer が業務改善の一環として InsightOffice を導入する際、
 * 現場の状況に応じてアドインの有効/無効やスクリプト一覧を制御する。
 *
 * ## ユースケース
 *
 * - **コンサル案件**: Python スクリプト一覧を事前にセットして現場に配布
 *   → `preloadedScripts` にスクリプトを定義、python_runtime を強制有効
 *
 * - **セキュリティ要件**: AI 機能やクラウド同期を無効化
 *   → `disabledModules` で制限、ユーザーは有効化できない
 *
 * - **段階的導入**: まず基本機能だけ、慣れたら Python 追加
 *   → プロファイルを差し替えるだけでモジュール構成が変わる
 *
 * ## 配布方法
 *
 * ```
 * %APPDATA%/HarmonicInsight/{product}/admin-profile.json
 * ```
 *
 * このファイルが存在する場合、アプリはユーザー設定よりこのプロファイルを優先する。
 * 管理者がグループポリシーや MDM で配布可能。
 */
export interface AdminDeployProfile {
  /** プロファイル名 */
  name: string;
  /** プロファイル説明 */
  description: string;
  /** 作成者（コンサル会社名等） */
  createdBy: string;
  /** 作成日（ISO 8601） */
  createdAt: string;
  /** 対象製品 */
  product: ProductCode;
  /** 強制的に有効にするモジュール（ユーザーは無効化できない） */
  forcedEnabledModules: string[];
  /** 強制的に無効にするモジュール（ユーザーは有効化できない） */
  disabledModules: string[];
  /** モジュール別の設定上書き */
  moduleSettings: Record<string, Record<string, string | number | boolean>>;
  /**
   * 事前登録スクリプト（Python 実行モジュール用）
   *
   * コンサルが作成した業務用スクリプトをアプリ内のスクリプト一覧に表示。
   * ユーザーはワンクリックで実行できる。
   */
  preloadedScripts: PreloadedScript[];
}

/** 事前登録スクリプト */
export interface PreloadedScript {
  /** スクリプト ID */
  id: string;
  /** 表示名 */
  name: string;
  /** 表示名（日本語） */
  nameJa: string;
  /** 説明 */
  descriptionJa: string;
  /** カテゴリ（スクリプト一覧のグルーピング用） */
  category: string;
  /** Python ソースコード */
  code: string;
  /** 必要な pip パッケージ */
  requiredPackages: string[];
  /** 実行前に表示する確認メッセージ */
  confirmMessage?: string;
  /** 読み取り専用（ユーザーが編集不可） */
  readOnly: boolean;
}

/**
 * 管理者プロファイルの適用結果を計算
 *
 * デフォルト設定 + 管理者プロファイル → 最終的な有効モジュール一覧
 */
export function applyAdminProfile(
  product: ProductCode,
  profile: AdminDeployProfile | null,
): { enabledModules: string[]; lockedEnabled: string[]; lockedDisabled: string[] } {
  const support = PRODUCT_ADDON_SUPPORT[product];
  if (!support) return { enabledModules: [], lockedEnabled: [], lockedDisabled: [] };

  if (!profile) {
    return {
      enabledModules: [...support.defaultEnabled],
      lockedEnabled: [],
      lockedDisabled: [],
    };
  }

  const lockedEnabled = profile.forcedEnabledModules.filter(
    id => support.supportedModules.includes(id),
  );
  const lockedDisabled = profile.disabledModules.filter(
    id => support.supportedModules.includes(id),
  );

  // デフォルト有効 + 強制有効 - 強制無効
  const enabledSet = new Set([...support.defaultEnabled, ...lockedEnabled]);
  for (const id of lockedDisabled) {
    enabledSet.delete(id);
  }

  return {
    enabledModules: [...enabledSet],
    lockedEnabled,
    lockedDisabled,
  };
}

/** 管理者プロファイルの例（コンサル案件用テンプレート） */
export const ADMIN_PROFILE_TEMPLATES: Record<string, Omit<AdminDeployProfile, 'product' | 'createdAt' | 'createdBy'>> = {
  /** Python 業務改善テンプレート: Excel を Python で自動処理する現場向け */
  excel_automation: {
    name: 'Excel Automation',
    description: 'Excel業務のPython自動化テンプレート。スクリプト一覧から業務処理をワンクリック実行。',
    forcedEnabledModules: ['python_runtime', 'ai_code_editor', 'python_scripts'],
    disabledModules: ['vrm_avatar'],
    moduleSettings: {
      python_runtime: { auto_install_packages: true, execution_timeout: 60 },
    },
    preloadedScripts: [
      {
        id: 'clean_empty_rows',
        name: 'Remove Empty Rows',
        nameJa: '空白行の削除',
        descriptionJa: '選択シートの空白行をすべて削除します',
        category: 'データ整形',
        code: [
          '# requires: pip install openpyxl',
          'import openpyxl',
          'import os',
          '',
          'wb = openpyxl.load_workbook(os.environ["INPUT_PATH"])',
          'ws = wb.active',
          'rows_to_delete = []',
          'for row in ws.iter_rows():\n    if all(cell.value is None for cell in row):\n        rows_to_delete.append(row[0].row)',
          'for row_idx in reversed(rows_to_delete):',
          '    ws.delete_rows(row_idx)',
          'wb.save(os.environ["OUTPUT_PATH"])',
          'print(f"Deleted {len(rows_to_delete)} empty rows")',
        ].join('\n'),
        requiredPackages: ['openpyxl'],
        readOnly: true,
      },
      {
        id: 'merge_sheets',
        name: 'Merge All Sheets',
        nameJa: '全シート統合',
        descriptionJa: '全シートのデータを1つのシートに統合します（ヘッダー行は1行目のみ）',
        category: 'データ整形',
        code: [
          '# requires: pip install openpyxl',
          'import openpyxl',
          'import os',
          '',
          'wb = openpyxl.load_workbook(os.environ["INPUT_PATH"])',
          'merged = openpyxl.Workbook()',
          'ws_out = merged.active',
          'ws_out.title = "Merged"',
          'header_written = False',
          'for sheet_name in wb.sheetnames:',
          '    ws = wb[sheet_name]',
          '    for i, row in enumerate(ws.iter_rows(values_only=True)):',
          '        if i == 0 and header_written:',
          '            continue',
          '        ws_out.append(list(row))',
          '        if i == 0:',
          '            header_written = True',
          'merged.save(os.environ["OUTPUT_PATH"])',
          'print(f"Merged {len(wb.sheetnames)} sheets")',
        ].join('\n'),
        requiredPackages: ['openpyxl'],
        readOnly: true,
      },
    ],
  },

  /** セキュア環境テンプレート: AI とクラウドを無効化した閉域ネットワーク向け */
  secure_offline: {
    name: 'Secure Offline',
    description: '閉域ネットワーク向け。AI・クラウド機能を無効化し、ローカル機能のみ使用。',
    forcedEnabledModules: [],
    disabledModules: ['ai_assistant', 'ai_code_editor', 'vrm_avatar', 'voice_input'],
    moduleSettings: {},
    preloadedScripts: [],
  },
};

// =============================================================================
// ヘルパー関数
// =============================================================================

/** モジュール定義を取得 */
export function getAddonModule(moduleId: string): AddonModuleDefinition | null {
  return ADDON_MODULES[moduleId] ?? null;
}

/** 製品がサポートするモジュール一覧を取得 */
export function getSupportedModules(product: ProductCode): AddonModuleDefinition[] {
  const support = PRODUCT_ADDON_SUPPORT[product];
  if (!support) return [];
  return support.supportedModules
    .map(id => ADDON_MODULES[id])
    .filter((m): m is AddonModuleDefinition => m != null);
}

/** 製品のデフォルト有効モジュール一覧を取得 */
export function getDefaultEnabledModules(product: ProductCode): AddonModuleDefinition[] {
  const support = PRODUCT_ADDON_SUPPORT[product];
  if (!support) return [];
  return support.defaultEnabled
    .map(id => ADDON_MODULES[id])
    .filter((m): m is AddonModuleDefinition => m != null);
}

/**
 * モジュールが有効化可能かチェック
 *
 * 以下をすべて検証:
 * 1. 製品がそのモジュールをサポートしているか
 * 2. ライセンスプランが対応しているか
 * 3. 依存モジュールが有効になっているか
 */
export function canEnableModule(
  product: ProductCode,
  moduleId: string,
  plan: PlanCode,
  enabledModuleIds: string[],
): { allowed: boolean; reason?: string; reasonJa?: string } {
  const support = PRODUCT_ADDON_SUPPORT[product];
  if (!support || !support.supportedModules.includes(moduleId)) {
    return {
      allowed: false,
      reason: `${product} does not support module: ${moduleId}`,
      reasonJa: `${product} はモジュール ${moduleId} をサポートしていません`,
    };
  }

  const mod = ADDON_MODULES[moduleId];
  if (!mod) {
    return {
      allowed: false,
      reason: `Unknown module: ${moduleId}`,
      reasonJa: `不明なモジュール: ${moduleId}`,
    };
  }

  if (!mod.allowedPlans.includes(plan)) {
    return {
      allowed: false,
      reason: `Module ${moduleId} requires plan: ${mod.allowedPlans.join('/')}`,
      reasonJa: `${mod.nameJa}には ${mod.allowedPlans.join('/')} プランが必要です`,
    };
  }

  for (const depId of mod.requiresModules) {
    if (!enabledModuleIds.includes(depId)) {
      const depMod = ADDON_MODULES[depId];
      return {
        allowed: false,
        reason: `Module ${moduleId} requires module: ${depId}`,
        reasonJa: `${mod.nameJa}には「${depMod?.nameJa ?? depId}」が必要です`,
      };
    }
  }

  return { allowed: true };
}

/**
 * モジュールの外部依存をチェックする際のコマンド一覧を返す
 *
 * ホストアプリはこのコマンドを subprocess で実行して依存の存在を確認する。
 *
 * @example
 * ```typescript
 * const checks = getDependencyChecks('python_runtime');
 * // [{ name: 'Python', command: 'python --version', minVersion: '3.10', ... }]
 * ```
 */
export function getDependencyChecks(moduleId: string): ExternalDependency[] {
  const mod = ADDON_MODULES[moduleId];
  return mod?.dependencies ?? [];
}

/**
 * モジュールが有効なときに AI アシスタントに追加すべきツール定義を返す
 *
 * ホストアプリは有効なモジュールのツールを集約して Claude API に渡す。
 *
 * @example
 * ```typescript
 * const enabledModules = ['ai_assistant', 'python_runtime', 'reference_materials'];
 * const allTools = getToolsForEnabledModules('HMSH', enabledModules);
 * // → SPREADSHEET_TOOLS + python_runtime tools + reference_materials tools
 * ```
 */
export function getToolsForEnabledModules(
  product: ProductCode,
  enabledModuleIds: string[],
): AddonToolDefinition[] {
  const tools: AddonToolDefinition[] = [];
  for (const id of enabledModuleIds) {
    const mod = ADDON_MODULES[id];
    if (mod && mod.tools.length > 0) {
      tools.push(...mod.tools);
    }
  }
  return tools;
}

/**
 * モジュールを有効順に並べる（依存関係を考慮したトポロジカルソート）
 *
 * モジュールの有効化順序を返す。依存先が先になるように並ぶ。
 */
export function resolveModuleOrder(moduleIds: string[]): string[] {
  const resolved: string[] = [];
  const visited = new Set<string>();

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const mod = ADDON_MODULES[id];
    if (mod) {
      for (const depId of mod.requiresModules) {
        if (moduleIds.includes(depId)) {
          visit(depId);
        }
      }
    }
    resolved.push(id);
  }

  for (const id of moduleIds) {
    visit(id);
  }
  return resolved;
}

// =============================================================================
// デフォルトエクスポート
// =============================================================================

export default {
  // 定義
  ADDON_MODULES,
  PRODUCT_ADDON_SUPPORT,
  ADMIN_PROFILE_TEMPLATES,

  // クエリ
  getAddonModule,
  getSupportedModules,
  getDefaultEnabledModules,

  // 検証
  canEnableModule,
  getDependencyChecks,

  // AI 連携
  getToolsForEnabledModules,

  // ユーティリティ
  resolveModuleOrder,

  // 管理者プロファイル
  applyAdminProfile,
};
