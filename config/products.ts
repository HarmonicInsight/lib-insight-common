/**
 * Harmonic Insight 製品・プラン・機能定義
 *
 * ============================================================================
 * 【重要】製品シリーズ共通のライセンス管理基盤
 * ============================================================================
 *
 * ## 製品ライン（全8製品）
 *
 * ### 【A】コンサル連動型（4製品）
 * INCA / INBT / INMV / INIG
 * - コンサル案件と一体提供、¥98万〜398万/年
 * - AI込み・無制限
 *
 * ### 【B】グローバルスタンドアロン型（4製品）
 * IOSH / IODC / IOSL / INPY
 * - ¥49,800/年/人（横並び）、ボリュームディスカウントあり
 * - AI: 無料枠20回/月 + カウント追加購入（ゲーム課金モデル）
 *
 * ## 廃止製品
 * - INSS (InsightSlide) → IOSLに統合
 * - INSP (InsightSlide Pro) → IOSLに統合
 * - FGIN (ForguncyInsight) → INCAに統合
 * - HMSH (HarmonicSheet) → IOSHにリネーム
 * - HMDC (HarmonicDoc) → IODCにリネーム
 * - HMSL (HarmonicSlide) → IOSLにリネーム
 *
 * ## 設計方針
 * 1. 機能は製品ごとに明確に定義（PRODUCT_FEATURES）
 * 2. 共通機能は COMMON として別管理（全製品で利用可能）
 * 3. 数値制限は limitValues で統一管理
 * 4. 型安全性を重視（製品・機能の組み合わせを保証）
 *
 * ## 新製品追加手順
 * 1. ProductCode に製品コードを追加
 * 2. PRODUCTS に製品情報を追加
 * 3. PRODUCT_FEATURES に機能定義を追加
 * 4. 製品固有の PlanLimits が必要なら PRODUCT_PLAN_LIMITS に追加
 */

// =============================================================================
// 型定義
// =============================================================================

/** 製品コード */
export type ProductCode =
  // 【B】スタンドアロン型
  | 'IOSH'   // InsightOfficeSheet（旧HMSH）
  | 'IODC'   // InsightOfficeDoc（旧HMDC）
  | 'IOSL'   // InsightOfficeSlide（旧HMSL + INSS + INSP統合）
  | 'INPY'   // InsightPy
  // 【A】コンサル連動型
  | 'INCA'   // InsightNoCodeAnalyzer（旧FGIN統合）
  | 'INBT'   // InsightBot
  | 'INMV'   // InsightMovie
  | 'INIG';  // InsightImageGen

/** 廃止製品コード（移行マッピング用） */
export type DeprecatedProductCode = 'INSS' | 'INSP' | 'FGIN' | 'HMSH' | 'HMDC' | 'HMSL';

/** プランコード */
export type PlanCode = 'FREE' | 'TRIAL' | 'STD' | 'PRO' | 'ENT';

/** 製品または共通を示す型 */
export type ProductOrCommon = ProductCode | 'COMMON';

/** 製品情報 */
export interface ProductInfo {
  code: ProductCode;
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
}

/** プラン情報 */
export interface PlanInfo {
  code: PlanCode;
  name: string;
  nameJa: string;
  /** 優先度（高いほど上位プラン、TRIAL=4 で全機能利用可能） */
  priority: number;
  description: string;
  descriptionJa: string;
  /** デフォルト有効期間（日）、-1 は無期限/要相談 */
  defaultDurationDays: number;
}

/**
 * 機能定義
 *
 * @example ブール型機能（有効/無効のみ）
 * {
 *   key: 'subtitle',
 *   name: 'Subtitle',
 *   nameJa: '字幕',
 *   type: 'boolean',
 *   allowedPlans: ['TRIAL', 'STD', 'ENT'],
 * }
 *
 * @example 数値制限機能
 * {
 *   key: 'scripts',
 *   name: 'Script Storage',
 *   nameJa: 'スクリプト保存数',
 *   type: 'limit',
 *   allowedPlans: ['FREE', 'TRIAL', 'STD', 'ENT'],
 *   limitValues: { FREE: 3, TRIAL: -1, STD: 50, ENT: -1 },
 * }
 */
export interface FeatureDefinition {
  /** 機能キー（製品内で一意） */
  key: string;
  /** 機能名（英語） */
  name: string;
  /** 機能名（日本語） */
  nameJa: string;
  /** 制御タイプ: boolean=有効/無効, limit=数値制限 */
  type: 'boolean' | 'limit';
  /** この機能が有効なプラン一覧 */
  allowedPlans: PlanCode[];
  /** 数値制限値（type='limit' の場合必須、-1 は無制限） */
  limitValues?: Partial<Record<PlanCode, number>>;
  /** 機能の説明（日本語） */
  descriptionJa?: string;
}

/** プラン別制限（製品共通のデフォルト値） */
export interface PlanLimits {
  /** 月間利用上限（-1 = 無制限） */
  monthlyLimit: number;
  /** 最大ファイルサイズ (MB)、-1 = 無制限 */
  maxFileSizeMB: number;
  /** 最大保存数、-1 = 無制限 */
  maxStorageItems: number;
  /** 最大解像度（動画系） */
  maxResolution?: '720p' | '1080p' | '4K';
  /** ウォーターマーク有無 */
  hasWatermark: boolean;
  /** バッチ処理可能 */
  batchEnabled: boolean;
  /** API利用可能 */
  apiEnabled: boolean;
  /** 優先処理 */
  priorityProcessing: boolean;
}

// =============================================================================
// 廃止製品マッピング
// =============================================================================

/**
 * 廃止製品から新製品への移行マッピング
 * 既存ライセンスキーの互換性維持に使用
 */
export const DEPRECATED_PRODUCT_MAPPING: Record<DeprecatedProductCode, ProductCode> = {
  INSS: 'IOSL',
  INSP: 'IOSL',
  FGIN: 'INCA',
  HMSH: 'IOSH',
  HMDC: 'IODC',
  HMSL: 'IOSL',
};

/**
 * 廃止製品コードを新コードに変換
 */
export function migrateProductCode(code: string): ProductCode | null {
  if (code in DEPRECATED_PRODUCT_MAPPING) {
    return DEPRECATED_PRODUCT_MAPPING[code as DeprecatedProductCode];
  }
  // 新コードならそのまま返す
  const allCodes: string[] = ['IOSH', 'IODC', 'IOSL', 'INPY', 'INCA', 'INBT', 'INMV', 'INIG'];
  if (allCodes.includes(code)) {
    return code as ProductCode;
  }
  return null;
}

// =============================================================================
// 製品定義
// =============================================================================

export const PRODUCTS: Record<ProductCode, ProductInfo> = {
  // ── 【B】スタンドアロン型 ─────────────────────────
  IOSH: {
    code: 'IOSH',
    name: 'InsightOfficeSheet',
    nameJa: 'InsightOfficeSheet',
    description: 'Excel version control, diff comparison, and team collaboration tool',
    descriptionJa: 'Excelバージョン管理・差分比較・チームコラボレーションツール',
  },
  IODC: {
    code: 'IODC',
    name: 'InsightOfficeDoc',
    nameJa: 'InsightOfficeDoc',
    description: 'Word document operations, automation, and format conversion tool',
    descriptionJa: 'Wordドキュメント操作・自動化・フォーマット変換ツール',
  },
  IOSL: {
    code: 'IOSL',
    name: 'InsightOfficeSlide',
    nameJa: 'InsightOfficeSlide',
    description: 'PowerPoint content extraction, update, presentation automation tool',
    descriptionJa: 'PowerPointコンテンツ抽出・更新・プレゼンテーション自動化ツール',
  },
  INPY: {
    code: 'INPY',
    name: 'InsightPy',
    nameJa: 'InsightPy',
    description: 'Python execution environment for Windows automation',
    descriptionJa: 'Windows自動化のためのPython実行環境',
  },

  // ── 【A】コンサル連動型 ───────────────────────────
  INCA: {
    code: 'INCA',
    name: 'InsightNoCodeAnalyzer',
    nameJa: 'InsightNoCodeAnalyzer',
    description: 'RPA, low-code, and Forguncy platform analyzer for migration assessment',
    descriptionJa: 'RPA・ローコード・Forguncy解析・移行アセスメントツール',
  },
  INBT: {
    code: 'INBT',
    name: 'InsightBot',
    nameJa: 'InsightBot',
    description: 'Python-based RPA bot for Windows automation',
    descriptionJa: 'Python RPA自動化ボット',
  },
  INMV: {
    code: 'INMV',
    name: 'InsightMovie',
    nameJa: 'InsightMovie',
    description: 'AI video creation from images, text, and PowerPoint',
    descriptionJa: '画像・テキスト・PPTからAI動画作成',
  },
  INIG: {
    code: 'INIG',
    name: 'InsightImageGen',
    nameJa: 'InsightImageGen',
    description: 'AI image and audio generation tool with Stable Diffusion and VOICEVOX',
    descriptionJa: 'Stable Diffusion・VOICEVOXを活用したAI画像・音声生成ツール',
  },
};

// =============================================================================
// プラン定義
// =============================================================================

export const PLANS: Record<PlanCode, PlanInfo> = {
  FREE: {
    code: 'FREE',
    name: 'Free',
    nameJa: 'フリー',
    priority: 0,
    description: 'Basic features with limitations',
    descriptionJa: '機能制限あり',
    defaultDurationDays: -1,
  },
  TRIAL: {
    code: 'TRIAL',
    name: 'Trial',
    nameJa: 'トライアル',
    priority: 4,  // 全機能使えるため最上位と同等
    description: 'Full features for evaluation (14 days)',
    descriptionJa: '全機能利用可能（14日間）',
    defaultDurationDays: 14,
  },
  STD: {
    code: 'STD',
    name: 'Standard',
    nameJa: 'スタンダード',
    priority: 2,
    description: 'All features for individual use (365 days)',
    descriptionJa: '全機能（365日）',
    defaultDurationDays: 365,
  },
  PRO: {
    code: 'PRO',
    name: 'Pro',
    nameJa: 'プロ',
    priority: 3,
    description: 'All features for business/team use (365 days)',
    descriptionJa: '法人・チーム向け全機能（365日）',
    defaultDurationDays: 365,
  },
  ENT: {
    code: 'ENT',
    name: 'Enterprise',
    nameJa: 'エンタープライズ',
    priority: 4,
    description: 'Custom features and dedicated support',
    descriptionJa: 'カスタマイズ（個別見積）',
    defaultDurationDays: -1,
  },
};

// =============================================================================
// 共通機能（全製品で利用可能）
// =============================================================================

export const COMMON_FEATURES: FeatureDefinition[] = [
  {
    key: 'api_access',
    name: 'API Access',
    nameJa: 'API利用',
    type: 'boolean',
    allowedPlans: ['ENT'],
    descriptionJa: '外部システムからのAPI経由でのアクセス',
  },
  {
    key: 'sso',
    name: 'Single Sign-On',
    nameJa: 'シングルサインオン',
    type: 'boolean',
    allowedPlans: ['ENT'],
    descriptionJa: '企業の認証基盤との連携',
  },
  {
    key: 'audit_log',
    name: 'Audit Log',
    nameJa: '監査ログ',
    type: 'boolean',
    allowedPlans: ['ENT'],
    descriptionJa: '操作履歴の詳細記録',
  },
  {
    key: 'priority_support',
    name: 'Priority Support',
    nameJa: '優先サポート',
    type: 'boolean',
    allowedPlans: ['PRO', 'ENT'],
    descriptionJa: '優先的なサポート対応',
  },
  {
    key: 'ai_chat',
    name: 'AI Assistant',
    nameJa: 'AIアシスタント',
    type: 'boolean',
    allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
    descriptionJa: 'Claude Opus搭載AIアシスタント（無料枠20回/月、追加カウント購入可）',
  },
];

// =============================================================================
// 製品別機能定義
// =============================================================================

export const PRODUCT_FEATURES: Record<ProductCode, FeatureDefinition[]> = {
  // ========================================
  // InsightOfficeSheet (IOSH) — 旧HMSH
  // ========================================
  IOSH: [
    {
      key: 'read_excel',
      name: 'Read Excel',
      nameJa: 'Excel読み込み・編集',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'Excelファイルの読み込み・編集',
    },
    {
      key: 'version_control',
      name: 'Version Control',
      nameJa: 'バージョン管理',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'ファイルのバージョン管理・履歴保持',
    },
    {
      key: 'diff_compare',
      name: 'Diff Compare',
      nameJa: '差分比較',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'バージョン間のセル差分比較',
    },
    {
      key: 'change_log',
      name: 'Change Log',
      nameJa: 'セル変更ログ',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'セル単位の変更履歴の記録・表示',
    },
    {
      key: 'export',
      name: 'Export',
      nameJa: 'エクスポート',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '変更履歴・差分のエクスポート出力',
    },
    {
      key: 'show_author',
      name: 'Show Author',
      nameJa: '変更者表示',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'セル変更ログで変更者を表示',
    },
    {
      key: 'board',
      name: 'Board',
      nameJa: '掲示板',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'チーム向け掲示板機能',
    },
    {
      key: 'send_message',
      name: 'Send Message',
      nameJa: 'メッセージ送信',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'チームメンバーへのメッセージ送信',
    },
  ],

  // ========================================
  // InsightOfficeDoc (IODC) — 旧HMDC
  // ========================================
  IODC: [
    {
      key: 'read_doc',
      name: 'Read Document',
      nameJa: 'ドキュメント読取',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'Wordドキュメントの読み取り',
    },
    {
      key: 'write_doc',
      name: 'Write Document',
      nameJa: 'ドキュメント書込',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'Wordドキュメントへの書き込み',
    },
    {
      key: 'convert',
      name: 'Convert Format',
      nameJa: 'フォーマット変換',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'PDF・HTML等へのフォーマット変換',
    },
    {
      key: 'template',
      name: 'Template',
      nameJa: 'テンプレート',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'テンプレートからのドキュメント生成',
    },
    {
      key: 'batch',
      name: 'Batch Processing',
      nameJa: 'バッチ処理',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '複数ドキュメントの一括処理',
    },
    {
      key: 'macro',
      name: 'Macro Execution',
      nameJa: 'マクロ実行',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'VBAマクロの実行・変換',
    },
  ],

  // ========================================
  // InsightOfficeSlide (IOSL) — 旧HMSL + INSS + INSP統合
  // ========================================
  IOSL: [
    {
      key: 'read_pptx',
      name: 'Read PPTX',
      nameJa: 'PPTX読取',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'PowerPointファイルの読み取り',
    },
    {
      key: 'write_pptx',
      name: 'Write PPTX',
      nameJa: 'PPTX書込',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'PowerPointファイルへの書き込み',
    },
    {
      key: 'extract',
      name: 'Content Extraction',
      nameJa: 'コンテンツ抽出',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'PowerPointからテキスト・画像を抽出（旧InsightSlide機能）',
    },
    {
      key: 'update',
      name: 'Content Update',
      nameJa: 'コンテンツ一括更新',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スライドの一括更新（旧InsightSlide機能）',
    },
    {
      key: 'json',
      name: 'JSON I/O',
      nameJa: 'JSON入出力',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'JSON形式でのデータ入出力（旧InsightSlide機能）',
    },
    {
      key: 'compare',
      name: 'File Compare',
      nameJa: '2ファイル比較',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '2つのPowerPointファイルの差分比較',
    },
    {
      key: 'extract_slides',
      name: 'Extract Slides',
      nameJa: 'スライド抽出',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スライドの個別抽出・分割',
    },
    {
      key: 'generate_pdf',
      name: 'Generate PDF',
      nameJa: 'PDF生成',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スライドからPDFの生成',
    },
    {
      key: 'batch',
      name: 'Batch Processing',
      nameJa: 'バッチ処理',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '複数PPTXファイルの一括処理',
    },
    {
      key: 'template',
      name: 'Template',
      nameJa: 'テンプレート',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'テンプレートからのスライド生成',
    },
    {
      key: 'auto_backup',
      name: 'Auto Backup',
      nameJa: '自動バックアップ',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '編集前の自動バックアップ作成（旧InsightSlide機能）',
    },
  ],

  // ========================================
  // InsightPy (INPY)
  // ========================================
  INPY: [
    {
      key: 'execute',
      name: 'Code Execution',
      nameJa: 'コード実行',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'Pythonコードの実行',
    },
    {
      key: 'presets',
      name: 'Presets',
      nameJa: 'プリセット利用',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '定義済みスクリプトテンプレートの利用',
    },
    {
      key: 'scripts',
      name: 'Script Storage',
      nameJa: 'スクリプト保存数',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: -1, PRO: -1, ENT: -1 },
      descriptionJa: '保存可能なスクリプト数（無制限）',
    },
    {
      key: 'cloud_sync',
      name: 'Cloud Sync',
      nameJa: 'クラウド同期',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スクリプトのクラウド同期',
    },
  ],

  // ========================================
  // InsightNoCodeAnalyzer (INCA) — 旧FGIN統合
  // ========================================
  INCA: [
    {
      key: 'rpa_analysis',
      name: 'RPA Analysis',
      nameJa: 'RPA解析',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'BizRobo等のRPAソース解析',
    },
    {
      key: 'lowcode_analysis',
      name: 'Low-code Analysis',
      nameJa: 'ローコード解析',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'Forguncy等のローコードツール解析',
    },
    {
      key: 'forguncy_analysis',
      name: 'Forguncy Analysis',
      nameJa: 'Forguncy解析',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'Forguncy連携・解析（旧ForguncyInsight機能）',
    },
    {
      key: 'migration_assessment',
      name: 'Migration Assessment',
      nameJa: '移行アセスメント',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '工数見積もり・複雑度分析',
    },
    {
      key: 'akabot_conversion',
      name: 'akaBot Conversion',
      nameJa: 'akaBot変換',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'BizRoboからakaBotへの変換',
    },
    {
      key: 'export_json',
      name: 'JSON Export',
      nameJa: 'JSON出力',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '解析結果のJSON形式出力',
    },
    {
      key: 'export_markdown',
      name: 'Markdown Export',
      nameJa: 'Markdown出力',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '解析結果のMarkdown形式出力',
    },
  ],

  // ========================================
  // InsightBot (INBT)
  // ========================================
  INBT: [
    {
      key: 'execute',
      name: 'Script Execution',
      nameJa: 'スクリプト実行',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'RPAスクリプトの実行',
    },
    {
      key: 'presets',
      name: 'Presets',
      nameJa: 'プリセット利用',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '定義済みスクリプトテンプレートの利用',
    },
    {
      key: 'jobs',
      name: 'Job Storage',
      nameJa: 'JOB保存数',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, PRO: -1, ENT: -1 },
      descriptionJa: '保存可能なJOB数',
    },
    {
      key: 'cloud_sync',
      name: 'Cloud Sync',
      nameJa: 'クラウド同期',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'JOBのクラウド同期',
    },
  ],

  // ========================================
  // InsightMovie (INMV)
  // ========================================
  INMV: [
    {
      key: 'generate',
      name: 'Video Generation',
      nameJa: '動画生成',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '画像・テキストから動画を生成',
    },
    {
      key: 'subtitle',
      name: 'Subtitle',
      nameJa: '字幕',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: '動画への字幕追加',
    },
    {
      key: 'subtitle_style',
      name: 'Subtitle Style',
      nameJa: '字幕スタイル選択',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: '字幕のフォント・色・位置のカスタマイズ',
    },
    {
      key: 'transition',
      name: 'Transition',
      nameJa: 'トランジション',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'シーン間のトランジション効果',
    },
    {
      key: 'pptx_import',
      name: 'PPTX Import',
      nameJa: 'PPTX取込',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'PowerPointファイルからの素材取込',
    },
  ],

  // ========================================
  // InsightImageGen (INIG)
  // ========================================
  INIG: [
    {
      key: 'generate_image',
      name: 'Image Generation',
      nameJa: '画像生成',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'Stable Diffusionによる画像生成',
    },
    {
      key: 'batch_image',
      name: 'Batch Image Generation',
      nameJa: 'バッチ画像生成',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '複数画像の一括生成',
    },
    {
      key: 'generate_audio',
      name: 'Audio Generation',
      nameJa: '音声生成',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'VOICEVOXによる音声生成',
    },
    {
      key: 'character_prompts',
      name: 'Character Prompts',
      nameJa: 'キャラクタープロンプト',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 20, PRO: -1, ENT: -1 },
      descriptionJa: '保存可能なキャラクタープロンプト数',
    },
    {
      key: 'hi_res',
      name: 'High Resolution',
      nameJa: '高解像度出力',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: '高解像度画像の生成',
    },
    {
      key: 'cloud_sync',
      name: 'Cloud Sync',
      nameJa: 'クラウド同期',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'プロンプト・設定のクラウド同期',
    },
  ],
};

// =============================================================================
// プラン別制限
// =============================================================================

/** デフォルトのプラン別制限 */
export const DEFAULT_PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  FREE: {
    monthlyLimit: -1,
    maxFileSizeMB: 10,
    maxStorageItems: 5,
    maxResolution: '720p',
    hasWatermark: false,
    batchEnabled: false,
    apiEnabled: false,
    priorityProcessing: false,
  },
  TRIAL: {
    monthlyLimit: -1,
    maxFileSizeMB: -1,
    maxStorageItems: -1,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: true,
    apiEnabled: false,
    priorityProcessing: false,
  },
  STD: {
    monthlyLimit: -1,
    maxFileSizeMB: -1,
    maxStorageItems: -1,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: true,
    apiEnabled: false,
    priorityProcessing: false,
  },
  PRO: {
    monthlyLimit: -1,
    maxFileSizeMB: -1,
    maxStorageItems: -1,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: true,
    apiEnabled: false,
    priorityProcessing: true,
  },
  ENT: {
    monthlyLimit: -1,
    maxFileSizeMB: -1,
    maxStorageItems: -1,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: true,
    apiEnabled: true,
    priorityProcessing: true,
  },
};

/** InsightMovie 専用のプラン別制限 */
export const INMV_PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  FREE: {
    monthlyLimit: -1,
    maxFileSizeMB: 100,
    maxStorageItems: -1,
    maxResolution: '1080p',
    hasWatermark: false,
    batchEnabled: false,
    apiEnabled: false,
    priorityProcessing: false,
  },
  TRIAL: {
    monthlyLimit: -1,
    maxFileSizeMB: -1,
    maxStorageItems: -1,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: true,
    apiEnabled: false,
    priorityProcessing: false,
  },
  STD: {
    monthlyLimit: -1,
    maxFileSizeMB: 200,
    maxStorageItems: -1,
    maxResolution: '1080p',
    hasWatermark: false,
    batchEnabled: false,
    apiEnabled: false,
    priorityProcessing: false,
  },
  PRO: {
    monthlyLimit: -1,
    maxFileSizeMB: -1,
    maxStorageItems: -1,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: true,
    apiEnabled: false,
    priorityProcessing: false,
  },
  ENT: {
    monthlyLimit: -1,
    maxFileSizeMB: -1,
    maxStorageItems: -1,
    maxResolution: '4K',
    hasWatermark: false,
    batchEnabled: true,
    apiEnabled: true,
    priorityProcessing: true,
  },
};

/** 製品別のプラン制限マッピング */
export const PRODUCT_PLAN_LIMITS: Partial<Record<ProductCode, Record<PlanCode, PlanLimits>>> = {
  INMV: INMV_PLAN_LIMITS,
};

// =============================================================================
// 機能チェック関数（標準API）
// =============================================================================

/**
 * 製品・プランの制限を取得
 */
export function getPlanLimits(productCode: ProductCode, planCode: PlanCode): PlanLimits {
  const productLimits = PRODUCT_PLAN_LIMITS[productCode];
  if (productLimits && productLimits[planCode]) {
    return productLimits[planCode];
  }
  return DEFAULT_PLAN_LIMITS[planCode];
}

/**
 * 製品の機能一覧を取得
 */
export function getProductFeatures(product: ProductCode): FeatureDefinition[] {
  return PRODUCT_FEATURES[product] || [];
}

/**
 * 製品の機能定義を取得
 */
export function getFeatureDefinition(product: ProductCode, featureKey: string): FeatureDefinition | null {
  const features = getProductFeatures(product);
  return features.find(f => f.key === featureKey) || null;
}

/**
 * 共通機能の定義を取得
 */
export function getCommonFeatureDefinition(featureKey: string): FeatureDefinition | null {
  return COMMON_FEATURES.find(f => f.key === featureKey) || null;
}

/**
 * 製品固有の機能が利用可能かチェック
 */
export function checkProductFeature(product: ProductCode, featureKey: string, plan: PlanCode): boolean {
  const feature = getFeatureDefinition(product, featureKey);
  if (!feature) {
    console.error(`[License] Unknown product feature: ${product}/${featureKey}`);
    return false;
  }
  return feature.allowedPlans.includes(plan);
}

/**
 * 共通機能が利用可能かチェック
 */
export function checkCommonFeature(featureKey: string, plan: PlanCode): boolean {
  const feature = getCommonFeatureDefinition(featureKey);
  if (!feature) {
    console.error(`[License] Unknown common feature: ${featureKey}`);
    return false;
  }
  return feature.allowedPlans.includes(plan);
}

/**
 * 機能が利用可能かチェック（製品固有 + 共通を自動判定）
 */
export function checkFeature(product: ProductCode, featureKey: string, plan: PlanCode): boolean {
  const productFeature = getFeatureDefinition(product, featureKey);
  if (productFeature) {
    return productFeature.allowedPlans.includes(plan);
  }

  const commonFeature = getCommonFeatureDefinition(featureKey);
  if (commonFeature) {
    return commonFeature.allowedPlans.includes(plan);
  }

  console.error(`[License] Unknown feature: ${product}/${featureKey}`);
  return false;
}

/**
 * 機能の数値制限を取得
 * @returns 制限値（-1 = 無制限、null = 制限機能ではない）
 */
export function getFeatureLimit(product: ProductCode, featureKey: string, plan: PlanCode): number | null {
  const feature = getFeatureDefinition(product, featureKey);
  if (!feature || feature.type !== 'limit') {
    return null;
  }
  return feature.limitValues?.[plan] ?? -1;
}

/**
 * 製品の機能可否一覧を取得（UI表示用）
 */
export function getProductFeatureMatrix(
  product: ProductCode,
  plan: PlanCode,
  includeCommon: boolean = true
): Array<{
  key: string;
  name: string;
  nameJa: string;
  enabled: boolean;
  limit: number | null;
  isCommon: boolean;
}> {
  const productFeatures = getProductFeatures(product);
  const result = productFeatures.map(feature => ({
    key: feature.key,
    name: feature.name,
    nameJa: feature.nameJa,
    enabled: feature.allowedPlans.includes(plan),
    limit: feature.type === 'limit' ? (feature.limitValues?.[plan] ?? -1) : null,
    isCommon: false,
  }));

  if (includeCommon) {
    const commonResults = COMMON_FEATURES.map(feature => ({
      key: feature.key,
      name: feature.name,
      nameJa: feature.nameJa,
      enabled: feature.allowedPlans.includes(plan),
      limit: feature.type === 'limit' ? (feature.limitValues?.[plan] ?? -1) : null,
      isCommon: true,
    }));
    return [...result, ...commonResults];
  }

  return result;
}

/**
 * プランが別のプラン以上かチェック
 */
export function isPlanAtLeast(userPlan: PlanCode, requiredPlan: PlanCode): boolean {
  if (userPlan === 'TRIAL') {
    return true;
  }
  return PLANS[userPlan].priority >= PLANS[requiredPlan].priority;
}

/**
 * プラン表示名を取得
 */
export function getPlanDisplayName(plan: PlanCode, locale: 'en' | 'ja' = 'ja'): string {
  const planInfo = PLANS[plan];
  return locale === 'ja' ? planInfo.nameJa : planInfo.name;
}

/**
 * 製品表示名を取得
 */
export function getProductDisplayName(product: ProductCode, locale: 'en' | 'ja' = 'ja'): string {
  const productInfo = PRODUCTS[product];
  return locale === 'ja' ? productInfo.nameJa : productInfo.name;
}

/**
 * 機能に必要な最低プランを取得
 */
export function getRequiredPlan(product: ProductCode, featureKey: string): PlanCode | null {
  const feature = getFeatureDefinition(product, featureKey)
    || getCommonFeatureDefinition(featureKey);

  if (!feature || feature.allowedPlans.length === 0) {
    return null;
  }

  return feature.allowedPlans.reduce((min, plan) => {
    return PLANS[plan].priority < PLANS[min].priority ? plan : min;
  });
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  // 定義データ
  PRODUCTS,
  PLANS,
  PRODUCT_FEATURES,
  COMMON_FEATURES,
  DEFAULT_PLAN_LIMITS,
  PRODUCT_PLAN_LIMITS,

  // 廃止製品
  DEPRECATED_PRODUCT_MAPPING,
  migrateProductCode,

  // 推奨API
  checkFeature,
  checkProductFeature,
  checkCommonFeature,
  getFeatureLimit,
  getRequiredPlan,
  getProductFeatures,
  getFeatureDefinition,
  getCommonFeatureDefinition,
  getProductFeatureMatrix,
  getPlanLimits,
  isPlanAtLeast,
  getPlanDisplayName,
  getProductDisplayName,
};
