/**
 * Harmonic Insight 製品・プラン・機能定義
 *
 * ============================================================================
 * 【重要】製品シリーズ共通のライセンス管理基盤
 * ============================================================================
 *
 * ## 設計方針
 * 1. 機能は製品ごとに明確に定義（PRODUCT_FEATURES）
 * 2. 共通機能は COMMON として別管理（全製品で利用可能）
 * 3. 製品継承をサポート（inheritsFrom で親製品の機能を引き継ぎ可能）
 * 4. 数値制限は limitValues で統一管理
 * 5. 型安全性を重視（製品・機能の組み合わせを保証）
 *
 * ## 新製品追加手順
 * 1. ProductCode に製品コードを追加
 * 2. PRODUCTS に製品情報を追加
 * 3. PRODUCT_FEATURES に機能定義を追加
 * 4. 必要に応じて PRODUCT_INHERITANCE に継承関係を追加
 * 5. 製品固有の PlanLimits が必要なら PRODUCT_PLAN_LIMITS に追加
 *
 * ## 新機能追加手順
 * 1. PRODUCT_FEATURES の該当製品に機能定義を追加
 * 2. type: 'boolean' または 'limit' を指定
 * 3. allowedPlans で利用可能プランを指定
 * 4. type: 'limit' の場合は limitValues でプラン別制限値を指定
 */

// =============================================================================
// 型定義
// =============================================================================

/** 製品コード */
export type ProductCode = 'INSS' | 'IOSH' | 'IOSD' | 'INPY' | 'INMV' | 'INBT' | 'INCA' | 'INIG' | 'IVIN';

/** プランコード（全製品 法人向け — FREE廃止） */
export type PlanCode = 'TRIAL' | 'STD' | 'PRO' | 'ENT';

/** 製品または共通を示す型 */
export type ProductOrCommon = ProductCode | 'COMMON';

/** プロジェクトファイル定義 */
export interface ProjectFileConfig {
  /** 独自拡張子（ドットなし） */
  extension: string;
  /** MIME タイプ */
  mimeType: string;
  /** ファイルタイプの説明（英語） */
  description: string;
  /** ファイルタイプの説明（日本語） */
  descriptionJa: string;
  /** アイコンファイル名 */
  iconFileName: string;
  /** 内包するドキュメント形式（.xlsx, .pptx, .docx） */
  innerDocumentFormat: string;
  /** コンテキストメニュー表示名（「{appName} で開く」） */
  contextMenuLabel: string;
  contextMenuLabelJa: string;
  /** コンテキストメニューに登録する対象拡張子（ドットなし） */
  contextMenuTargetExtensions: string[];
}

/** 製品情報 */
export interface ProductInfo {
  code: ProductCode;
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
  /** 継承元の製品（この製品の機能をすべて含む） */
  inheritsFrom?: ProductCode;
  /** プロジェクトファイル設定（対応製品のみ） */
  projectFile?: ProjectFileConfig;
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
 *   allowedPlans: ['TRIAL', 'PRO', 'ENT'],
 * }
 *
 * @example 数値制限機能
 * {
 *   key: 'scripts',
 *   name: 'Script Storage',
 *   nameJa: 'スクリプト保存数',
 *   type: 'limit',
 *   allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
 *   limitValues: { TRIAL: -1, STD: 50, PRO: -1, ENT: -1 },
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
// 製品定義
// =============================================================================

export const PRODUCTS: Record<ProductCode, ProductInfo> = {

  // =========================================================================
  // Tier 1: 業務変革ツール（高単価）
  // =========================================================================

  INCA: {
    code: 'INCA',
    name: 'InsightNoCodeAnalyzer',
    nameJa: 'InsightNoCodeAnalyzer',
    description: 'RPA and low-code migration automation tool',
    descriptionJa: 'RPA・ローコードのマイグレーション自動化ツール',
  },
  INBT: {
    code: 'INBT',
    name: 'InsightBot',
    nameJa: 'InsightBot',
    description: 'AI editor-equipped RPA product for business optimization',
    descriptionJa: 'AIエディタ搭載 — 業務最適化RPA製品',
  },
  IVIN: {
    code: 'IVIN',
    name: 'InterviewInsight',
    nameJa: 'InterviewInsight',
    description: 'Automated hearing and business research support',
    descriptionJa: '自動ヒアリング・業務調査支援',
  },

  // =========================================================================
  // Tier 2: AI活用ツール（中単価）
  // =========================================================================

  INMV: {
    code: 'INMV',
    name: 'InsightMovie',
    nameJa: 'InsightMovie',
    description: 'Automated video creation from images and text',
    descriptionJa: '画像とテキストから動画を自動作成',
  },
  INIG: {
    code: 'INIG',
    name: 'InsightImageGen',
    nameJa: 'InsightImageGen',
    description: 'AI bulk image generation tool for business materials',
    descriptionJa: '業務資料向けAI画像の大量自動生成ツール',
  },

  // =========================================================================
  // Tier 3: InsightOffice Suite（コンサル導入ツール）
  // =========================================================================

  INSS: {
    code: 'INSS',
    name: 'InsightOfficeSlide',
    nameJa: 'InsightOfficeSlide',
    description: 'AI-powered PowerPoint text extraction and review tool for enterprise',
    descriptionJa: 'AIアシスタント搭載 — PowerPointテキスト抽出・レビューツール',
    projectFile: {
      extension: 'inss',
      mimeType: 'application/x-insightoffice-slide',
      description: 'InsightOfficeSlide Project',
      descriptionJa: 'InsightOfficeSlide プロジェクト',
      iconFileName: 'inss-file.ico',
      innerDocumentFormat: '.pptx',
      contextMenuLabel: 'Open with InsightOfficeSlide',
      contextMenuLabelJa: 'InsightOfficeSlide で開く',
      contextMenuTargetExtensions: ['pptx', 'ppt'],
    },
  },
  IOSH: {
    code: 'IOSH',
    name: 'InsightOfficeSheet',
    nameJa: 'InsightOfficeSheet',
    description: 'AI-powered business planning, budget management, and simulation tool for enterprise',
    descriptionJa: 'AIアシスタント搭載 — 経営数値管理・予実管理・計画シミュレーション',
    projectFile: {
      extension: 'iosh',
      mimeType: 'application/x-insightoffice-sheet',
      description: 'InsightOfficeSheet Project',
      descriptionJa: 'InsightOfficeSheet プロジェクト',
      iconFileName: 'iosh-file.ico',
      innerDocumentFormat: '.xlsx',
      contextMenuLabel: 'Open with InsightOfficeSheet',
      contextMenuLabelJa: 'InsightOfficeSheet で開く',
      contextMenuTargetExtensions: ['xlsx', 'xls', 'csv'],
    },
  },
  IOSD: {
    code: 'IOSD',
    name: 'InsightOfficeDoc',
    nameJa: 'InsightOfficeDoc',
    description: 'AI-powered Word document management with reference materials for enterprise',
    descriptionJa: 'AIアシスタント搭載 — 参照資料付きWord文書管理ツール',
    projectFile: {
      extension: 'iosd',
      mimeType: 'application/x-insightoffice-doc',
      description: 'InsightOfficeDoc Project',
      descriptionJa: 'InsightOfficeDoc プロジェクト',
      iconFileName: 'iosd-file.ico',
      innerDocumentFormat: '.docx',
      contextMenuLabel: 'Open with InsightOfficeDoc',
      contextMenuLabelJa: 'InsightOfficeDoc で開く',
      contextMenuTargetExtensions: ['docx', 'doc'],
    },
  },
  INPY: {
    code: 'INPY',
    name: 'InsightPy',
    nameJa: 'InsightPy',
    description: 'AI editor-equipped Python execution platform for business automation',
    descriptionJa: 'AIエディタ搭載 — 業務調査・データ収集のためのPython実行基盤',
  },
};

// =============================================================================
// プラン定義
// =============================================================================

export const PLANS: Record<PlanCode, PlanInfo> = {
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
    description: 'Standard features for corporate use (365 days)',
    descriptionJa: '法人向け標準機能（365日）',
    defaultDurationDays: 365,
  },
  PRO: {
    code: 'PRO',
    name: 'Pro',
    nameJa: 'プロ',
    priority: 3,
    description: 'All features including AI (200/month) and collaboration (365 days)',
    descriptionJa: '法人向け全機能 — AI月200回・コラボレーション（365日）',
    defaultDurationDays: 365,
  },
  ENT: {
    code: 'ENT',
    name: 'Enterprise',
    nameJa: 'エンタープライズ',
    priority: 4,
    description: 'Custom features and dedicated support',
    descriptionJa: 'カスタマイズ（要相談）',
    defaultDurationDays: -1,
  },
};

// =============================================================================
// 共通機能（全製品で利用可能）
// =============================================================================

/**
 * 全製品共通の機能
 * - Enterprise専用機能など、製品に依存しない機能を定義
 * - checkCommonFeature() でチェック可能
 */
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
];

// =============================================================================
// 製品別機能定義
// =============================================================================

/**
 * 製品固有の機能定義
 *
 * 【注意】
 * - 各機能の key は製品内で一意であること
 * - allowedPlans には必ず該当するプランを列挙すること
 * - type: 'limit' の場合は limitValues を必ず設定すること
 */
export const PRODUCT_FEATURES: Record<ProductCode, FeatureDefinition[]> = {
  // ========================================
  // InsightOfficeSlide (INSS) — Tier 3
  // AIアシスタント搭載PowerPointツール
  // ========================================
  INSS: [
    {
      key: 'extract',
      name: 'Content Extraction',
      nameJa: 'コンテンツ抽出',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'PowerPointからテキスト・画像を抽出',
    },
    {
      key: 'update',
      name: 'Content Update',
      nameJa: 'コンテンツ更新',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: -1, PRO: -1, ENT: -1 },
      descriptionJa: 'スライドの一括更新',
    },
    {
      key: 'json',
      name: 'JSON I/O',
      nameJa: 'JSON入出力',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'JSON形式でのデータ入出力',
    },
    {
      key: 'batch',
      name: 'Batch Processing',
      nameJa: 'フォルダ一括処理',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '複数ファイルの一括処理',
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
      key: 'auto_backup',
      name: 'Auto Backup',
      nameJa: '自動バックアップ',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: '編集前の自動バックアップ作成',
    },
    {
      key: 'ai_assistant',
      name: 'AI Assistant',
      nameJa: 'AIアシスタント',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるスライドテキストの校正・改善提案（STD: 月50回 / PRO: 月200回 / ENT: 無制限）',
    },
    {
      key: 'ai_editor',
      name: 'AI Code Editor',
      nameJa: 'AIコードエディター',
      type: 'limit',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるPythonコードの生成・編集でPowerPointを自動処理（PRO: 月200回 / ENT: 無制限）',
    },
    {
      key: 'reference_materials',
      name: 'Reference Materials',
      nameJa: '参考資料',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '参考資料の添付・AI コンテキストとしての活用',
    },
    {
      key: 'voice_input',
      name: 'Voice Input',
      nameJa: '音声入力',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '音声認識によるハンズフリー入力',
    },
    {
      key: 'vrm_avatar',
      name: 'VRM Avatar',
      nameJa: 'VRMアバター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'VRM 3Dアバターによる音声会話（TTS + STT + リップシンク）',
    },
  ],

  // ========================================
  // InsightOfficeSheet (IOSH) — Tier 3
  // AIアシスタント搭載Excel管理ツール
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
      key: 'file_compare',
      name: 'File Compare',
      nameJa: '2ファイル比較',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '2つのExcelファイルのセル単位差分比較',
    },
    {
      key: 'show_author',
      name: 'Show Author',
      nameJa: '変更者表示',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'セル変更ログで変更者（誰が変更したか）を表示（チーム利用向け）',
    },
    {
      key: 'board',
      name: 'Board',
      nameJa: '掲示板',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'チーム向け掲示板機能',
    },
    {
      key: 'ai_assistant',
      name: 'AI Assistant',
      nameJa: 'AIアシスタント',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, PRO: 200, ENT: -1 },
      descriptionJa: 'AIチャットによるExcel操作支援（STD: 月50回 / PRO: 月200回 / ENT: 無制限）',
    },
    {
      key: 'sticky_notes',
      name: 'Sticky Notes',
      nameJa: '付箋',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'セルに付箋（メモ）を貼り付け。色分け・バージョン管理連動',
    },
    {
      key: 'send_message',
      name: 'Send Message',
      nameJa: 'メッセージ送信',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'チームメンバーへのメッセージ送信',
    },
    {
      key: 'ai_editor',
      name: 'AI Code Editor',
      nameJa: 'AIコードエディター',
      type: 'limit',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるPythonコードの生成・編集でExcelを自動処理（PRO: 月200回 / ENT: 無制限）',
    },
    {
      key: 'reference_materials',
      name: 'Reference Materials',
      nameJa: '参考資料',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '参考資料の添付・AI コンテキストとしての活用',
    },
    {
      key: 'voice_input',
      name: 'Voice Input',
      nameJa: '音声入力',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '音声認識によるハンズフリー入力',
    },
    {
      key: 'vrm_avatar',
      name: 'VRM Avatar',
      nameJa: 'VRMアバター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'VRM 3Dアバターによる音声会話（TTS + STT + リップシンク）',
    },
  ],

  // ========================================
  // InsightOfficeDoc (IOSD) — Tier 3
  // AIアシスタント搭載Word管理ツール
  // ========================================
  IOSD: [
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
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: -1, PRO: -1, ENT: -1 },
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
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'テンプレートからのドキュメント生成',
    },
    {
      key: 'batch',
      name: 'Batch Processing',
      nameJa: 'バッチ処理',
      type: 'boolean',
      allowedPlans: ['PRO', 'ENT'],
      descriptionJa: '複数ドキュメントの一括処理',
    },
    {
      key: 'macro',
      name: 'Macro Execution',
      nameJa: 'マクロ実行',
      type: 'boolean',
      allowedPlans: ['PRO', 'ENT'],
      descriptionJa: 'VBAマクロの実行・変換',
    },
    {
      key: 'ai_assistant',
      name: 'AI Assistant',
      nameJa: 'AIアシスタント',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるドキュメントの校正・要約・構成提案（STD: 月50回 / PRO: 月200回 / ENT: 無制限）',
    },
    {
      key: 'ai_editor',
      name: 'AI Code Editor',
      nameJa: 'AIコードエディター',
      type: 'limit',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるPythonコードの生成・編集でWordを自動処理（PRO: 月200回 / ENT: 無制限）',
    },
    {
      key: 'reference_materials',
      name: 'Reference Materials',
      nameJa: '参考資料',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '参考資料の添付・AI コンテキストとしての活用',
    },
    {
      key: 'voice_input',
      name: 'Voice Input',
      nameJa: '音声入力',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '音声認識によるハンズフリー入力',
    },
    {
      key: 'vrm_avatar',
      name: 'VRM Avatar',
      nameJa: 'VRMアバター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'VRM 3Dアバターによる音声会話（TTS + STT + リップシンク）',
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
      limitValues: { TRIAL: -1, STD: 50, PRO: -1, ENT: -1 },
      descriptionJa: '保存可能なスクリプト数',
    },
    {
      key: 'cloud_sync',
      name: 'Cloud Sync',
      nameJa: 'クラウド同期',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'スクリプトのクラウド同期',
    },
    {
      key: 'ai_editor',
      name: 'AI Code Editor',
      nameJa: 'AIコードエディター',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるPythonコードの生成・編集・構文検証・デバッグ支援（STD: 月50回 / PRO: 月200回 / ENT: 無制限）',
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
    {
      key: 'ai_editor',
      name: 'AI Code Editor',
      nameJa: 'AIコードエディター',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるPythonコードの生成・編集・構文検証・デバッグ支援（STD: 月50回 / PRO: 月200回 / ENT: 無制限）',
    },
    {
      key: 'orchestrator',
      name: 'Orchestrator',
      nameJa: 'オーケストレーター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'InsightOffice Agent の集中管理・JOB配信・実行監視',
    },
    {
      key: 'agents',
      name: 'Agent Management',
      nameJa: 'Agent管理',
      type: 'limit',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      limitValues: { TRIAL: 5, PRO: 50, ENT: -1 },
      descriptionJa: '管理可能な Agent（InsightOffice 端末）数（PRO: 50台 / ENT: 無制限）',
    },
    {
      key: 'scheduler',
      name: 'Job Scheduler',
      nameJa: 'JOBスケジューラー',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'JOBの定期実行スケジュール設定（cron 相当）',
    },
  ],

  // ========================================
  // InsightNoCodeAnalyzer (INCA)
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
  // InterviewInsight (IVIN)
  // 自動ヒアリング・業務調査支援
  // ========================================
  IVIN: [
    // 機能定義は開発進行に合わせて追加予定
  ],
};

// =============================================================================
// プラン別制限
// =============================================================================

/** デフォルトのプラン別制限 */
export const DEFAULT_PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
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
    maxFileSizeMB: 100,
    maxStorageItems: 50,
    maxResolution: '1080p',
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
 * 製品の機能一覧を取得（継承機能を含む）
 */
export function getProductFeatures(product: ProductCode): FeatureDefinition[] {
  const productInfo = PRODUCTS[product];
  const ownFeatures = PRODUCT_FEATURES[product] || [];

  // 継承元がある場合は継承元の機能も含める
  if (productInfo.inheritsFrom) {
    const inheritedFeatures = getProductFeatures(productInfo.inheritsFrom);
    // 継承元の機能 + 自身の機能（重複キーは自身が優先）
    const ownKeys = new Set(ownFeatures.map(f => f.key));
    const merged = inheritedFeatures.filter(f => !ownKeys.has(f.key));
    return [...merged, ...ownFeatures];
  }

  return ownFeatures;
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
 *
 * @param product 製品コード
 * @param featureKey 機能キー
 * @param plan プランコード
 * @returns 利用可能かどうか
 *
 * @example
 * checkProductFeature('INMV', 'subtitle', 'PRO')  // true
 * checkProductFeature('INMV', 'subtitle', 'FREE') // false
 */
export function checkProductFeature(product: ProductCode, featureKey: string, plan: PlanCode): boolean {
  const feature = getFeatureDefinition(product, featureKey);
  if (!feature) {
    // 未定義の機能はエラーを記録して拒否（安全側）
    console.error(`[License] Unknown product feature: ${product}/${featureKey}`);
    return false;
  }
  return feature.allowedPlans.includes(plan);
}

/**
 * 共通機能が利用可能かチェック
 *
 * @param featureKey 機能キー
 * @param plan プランコード
 * @returns 利用可能かどうか
 *
 * @example
 * checkCommonFeature('api_access', 'ENT')  // true
 * checkCommonFeature('api_access', 'PRO')  // false
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
 *
 * @param product 製品コード
 * @param featureKey 機能キー
 * @param plan プランコード
 * @returns 利用可能かどうか
 */
export function checkFeature(product: ProductCode, featureKey: string, plan: PlanCode): boolean {
  // まず製品固有の機能を確認
  const productFeature = getFeatureDefinition(product, featureKey);
  if (productFeature) {
    return productFeature.allowedPlans.includes(plan);
  }

  // 次に共通機能を確認
  const commonFeature = getCommonFeatureDefinition(featureKey);
  if (commonFeature) {
    return commonFeature.allowedPlans.includes(plan);
  }

  // どちらにも見つからない
  console.error(`[License] Unknown feature: ${product}/${featureKey}`);
  return false;
}

/**
 * 機能の数値制限を取得
 *
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
 *
 * @param product 製品コード
 * @param plan プランコード
 * @param includeCommon 共通機能を含めるか（デフォルト: true）
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
 *
 * 注意: TRIALは全機能使えるため特殊扱い（常にtrue）
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

  // priority が最小のプランを返す
  return feature.allowedPlans.reduce((min, plan) => {
    return PLANS[plan].priority < PLANS[min].priority ? plan : min;
  });
}

// =============================================================================
// プロジェクトファイル
// =============================================================================

/**
 * 拡張子からプロジェクトファイル対応製品を解決
 *
 * @param extension 拡張子（ドットなし）
 * @returns 対応する製品コード、または null
 *
 * @example
 * resolveProductByExtension('iosh')  // 'IOSH'
 * resolveProductByExtension('xlsx')  // null（独自拡張子ではない）
 */
export function resolveProductByExtension(extension: string): ProductCode | null {
  const ext = extension.toLowerCase().replace(/^\./, '');
  for (const [code, product] of Object.entries(PRODUCTS)) {
    if (product.projectFile?.extension === ext) {
      return code as ProductCode;
    }
  }
  return null;
}

/**
 * コンテキストメニュー対象の拡張子から対応製品を検索
 *
 * @param extension ファイルの拡張子（ドットなし）
 * @returns 「〜で開く」を表示すべき製品一覧
 *
 * @example
 * getContextMenuProducts('xlsx')  // [{ product: 'IOSH', label: 'InsightOfficeSheet で開く' }]
 * getContextMenuProducts('pptx')  // [{ product: 'INSS', label: 'InsightOfficeSlide で開く' }]
 */
export function getContextMenuProducts(
  extension: string,
  locale: 'en' | 'ja' = 'ja',
): Array<{ product: ProductCode; label: string }> {
  const ext = extension.toLowerCase().replace(/^\./, '');
  const results: Array<{ product: ProductCode; label: string }> = [];

  for (const [code, product] of Object.entries(PRODUCTS)) {
    const pf = product.projectFile;
    if (pf && pf.contextMenuTargetExtensions.includes(ext)) {
      results.push({
        product: code as ProductCode,
        label: locale === 'ja' ? pf.contextMenuLabelJa : pf.contextMenuLabel,
      });
    }
  }
  return results;
}

/**
 * 製品のプロジェクトファイル設定を取得
 */
export function getProjectFileConfig(product: ProductCode): ProjectFileConfig | null {
  return PRODUCTS[product].projectFile ?? null;
}

/**
 * Windows レジストリに登録すべきファイル関連付け情報を生成
 *
 * インストーラー（Inno Setup / WiX 等）での利用を想定。
 *
 * @example
 * const reg = getFileAssociationInfo('IOSH');
 * // {
 * //   progId: 'HarmonicInsight.InsightOfficeSheet',
 * //   extension: '.iosh',
 * //   mimeType: 'application/x-insightoffice-sheet',
 * //   description: 'InsightOfficeSheet プロジェクト',
 * //   iconFileName: 'iosh-file.ico',
 * //   openCommand: '"%INSTALL_DIR%\\InsightOfficeSheet.exe" "%1"',
 * //   contextMenu: {
 * //     targetExtensions: ['.xlsx', '.xls', '.csv'],
 * //     label: 'InsightOfficeSheet で開く',
 * //   },
 * // }
 */
export function getFileAssociationInfo(
  product: ProductCode,
  locale: 'en' | 'ja' = 'ja',
): {
  progId: string;
  extension: string;
  mimeType: string;
  description: string;
  iconFileName: string;
  openCommand: string;
  contextMenu: { targetExtensions: string[]; label: string };
} | null {
  const productInfo = PRODUCTS[product];
  const pf = productInfo.projectFile;
  if (!pf) return null;

  return {
    progId: `HarmonicInsight.${productInfo.name}`,
    extension: `.${pf.extension}`,
    mimeType: pf.mimeType,
    description: locale === 'ja' ? pf.descriptionJa : pf.description,
    iconFileName: pf.iconFileName,
    openCommand: `"%INSTALL_DIR%\\${productInfo.name}.exe" "%1"`,
    contextMenu: {
      targetExtensions: pf.contextMenuTargetExtensions.map(e => `.${e}`),
      label: locale === 'ja' ? pf.contextMenuLabelJa : pf.contextMenuLabel,
    },
  };
}

// =============================================================================
// 後方互換性（非推奨）
// =============================================================================

/**
 * フラットな機能マトリクス
 * @deprecated 新規実装では checkProductFeature / checkCommonFeature を使用
 */
export const FEATURE_MATRIX: Record<string, PlanCode[]> = (() => {
  const matrix: Record<string, PlanCode[]> = {};

  // 共通機能を追加
  for (const feature of COMMON_FEATURES) {
    matrix[feature.key] = [...feature.allowedPlans];
  }

  // 製品別機能を追加
  for (const [productCode, features] of Object.entries(PRODUCT_FEATURES)) {
    for (const feature of features) {
      // プレフィックス付き: inmv_subtitle
      const prefixedKey = `${productCode.toLowerCase()}_${feature.key}`;
      matrix[prefixedKey] = [...feature.allowedPlans];

      // プレフィックスなし（後方互換性）
      if (!matrix[feature.key]) {
        matrix[feature.key] = [...feature.allowedPlans];
      }
    }
  }

  return matrix;
})();

/**
 * @deprecated 新規実装では checkProductFeature / checkCommonFeature を使用
 */
export function canAccessFeature(feature: string, planCode: PlanCode): boolean {
  const allowedPlans = FEATURE_MATRIX[feature];
  if (!allowedPlans) {
    console.warn(`[License] Unknown feature: ${feature}`);
    return false;
  }
  return allowedPlans.includes(planCode);
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

  // プロジェクトファイル
  resolveProductByExtension,
  getContextMenuProducts,
  getProjectFileConfig,
  getFileAssociationInfo,

  // 後方互換（非推奨）
  FEATURE_MATRIX,
  canAccessFeature,
};
