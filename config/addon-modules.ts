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
        description: 'Execute Python script on the currently open document. The host app saves the document to a temp file, Python processes it, and the host app reloads the result.',
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
    themeColor: '#3776AB', // Python blue
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
    tools: [], // ai-assistant.ts の CODE_EDITOR_TOOLS を使用
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
    tools: [],
    requiresModules: [],
    icon: 'Mail',
    themeColor: '#0891B2',
    settingsSchema: [],
  },

  // =========================================================================
  // 音声入力
  // =========================================================================
  voice_input: {
    id: 'voice_input',
    name: 'Voice Input',
    nameJa: '音声入力',
    description: 'Voice-to-text input using Web Speech API or Whisper for hands-free document editing',
    descriptionJa: '音声認識によるハンズフリーのドキュメント入力（Web Speech API / Whisper）',
    version: '1.0.0',
    distribution: 'bundled',
    panelPosition: 'dialog',
    requiredFeatureKey: 'voice_input',
    allowedPlans: ['TRIAL', 'PRO', 'ENT'],
    dependencies: [],
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
          { value: 'whisper', label: 'Whisper (OpenAI)', labelJa: 'Whisper (OpenAI)' },
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
      'reference_materials',
      'board',
      'messaging',
      'voice_input',
    ],
    defaultEnabled: ['ai_assistant', 'board', 'messaging'],
  },
  HMDC: {
    supportedModules: [
      'ai_assistant',
      'python_runtime',
      'ai_code_editor',
      'reference_materials',
      'voice_input',
    ],
    defaultEnabled: ['ai_assistant', 'reference_materials'],
  },
  HMSL: {
    supportedModules: [
      'ai_assistant',
      'python_runtime',
      'ai_code_editor',
      'reference_materials',
      'voice_input',
    ],
    defaultEnabled: ['ai_assistant'],
  },
  // INPY / INBT はアドインではなくコア機能として提供
  // InsightOffice 系のみがアドイン対象
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
};
