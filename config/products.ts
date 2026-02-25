/**
 * HARMONIC insight 製品�Eプラン・機�E定義
 *
 * ============================================================================
 * 【重要】製品シリーズ共通�Eライセンス管琁E��盤
 * ============================================================================
 *
 * ## 設計方釁E
 * 1. 機�Eは製品ごとに明確に定義�E�ERODUCT_FEATURES�E�E
 * 2. 共通機�Eは COMMON として別管琁E���E製品で利用可能�E�E
 * 3. 製品継承をサポ�Eト！EnheritsFrom で親製品�E機�Eを引き継ぎ可能�E�E
 * 4. 数値制限�E limitValues で統一管琁E
 * 5. 型安�E性を重視（製品�E機�Eの絁E��合わせを保証�E�E
 *
 * ## 新製品追加手頁E
 * 1. ProductCode に製品コードを追加
 * 2. PRODUCTS に製品情報を追加
 * 3. PRODUCT_FEATURES に機�E定義を追加
 * 4. 忁E��に応じて PRODUCT_INHERITANCE に継承関係を追加
 * 5. 製品固有�E PlanLimits が忁E��なめEPRODUCT_PLAN_LIMITS に追加
 *
 * ## 新機�E追加手頁E
 * 1. PRODUCT_FEATURES の該当製品に機�E定義を追加
 * 2. type: 'boolean' また�E 'limit' を指宁E
 * 3. allowedPlans で利用可能プランを指宁E
 * 4. type: 'limit' の場合�E limitValues でプラン別制限値を指宁E
 */

// =============================================================================
// 型定義
// =============================================================================

/** 製品コーチE*/
export type ProductCode = 'INSS' | 'IOSH' | 'IOSD' | 'ISOF' | 'INPY' | 'INMV' | 'INBT' | 'INCA' | 'INIG' | 'IVIN';

/** プランコード（�E製品E法人向け  EFREE廁E���E�E*/
export type PlanCode = 'TRIAL' | 'STD' | 'PRO' | 'ENT';

/** 製品また�E共通を示す型 */
export type ProductOrCommon = ProductCode | 'COMMON';

/** プロジェクトファイル定義 */
export interface ProjectFileConfig {
  /** 独自拡張子（ドチE��なし！E*/
  extension: string;
  /** MIME タイチE*/
  mimeType: string;
  /** ファイルタイプ�E説明（英語！E*/
  description: string;
  /** ファイルタイプ�E説明（日本語！E*/
  descriptionJa: string;
  /** アイコンファイル吁E*/
  iconFileName: string;
  /** 冁E��するドキュメント形式！Exlsx, .pptx, .docx�E�E*/
  innerDocumentFormat: string;
  /** コンチE��ストメニュー表示名（「{appName} で開く」！E*/
  contextMenuLabel: string;
  contextMenuLabelJa: string;
  /** コンチE��ストメニューに登録する対象拡張子（ドチE��なし！E*/
  contextMenuTargetExtensions: string[];
  /**
   * AI メモリ対応フラグ
   *
   * true の場合、�Eロジェクトファイル冁E��以下�Eメモリファイルを格紁E
   * - ai_memory.json�E��EチE��キャチE��ュ�E�E
   * - ai_memory_deep/�E�ディープストレージ: PRO+ のみ�E�E
   *
   * 参�E: config/ai-memory.ts
   */
  supportsAiMemory?: boolean;
}

/** アプリのターゲチE��プラチE��フォーム */
export type AppPlatform = 'wpf' | 'python' | 'tauri' | 'expo' | 'android_native' | 'ios_native' | 'web' | 'service';

/** 製品情報 */
export interface ProductInfo {
  code: ProductCode;
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
  /** マスターアイコン PNG パス�E�リポジトリルートから�E相対パス�E�E*/
  masterIcon: string;
  /** ターゲチE��プラチE��フォーム�E�アイコン生�E・ビルド設定に使用�E�E*/
  targetPlatform: AppPlatform;
  /** ビルド時のアイコン配置先パス�E�アプリリポジトリからの相対パス�E�E*/
  iconBuildPath: string;
  /** 継承允E�E製品E��この製品�E機�Eをすべて含む�E�E*/
  inheritsFrom?: ProductCode;
  /** プロジェクトファイル設定（対応製品�Eみ�E�E*/
  projectFile?: ProjectFileConfig;
}

/** プラン惁E�� */
export interface PlanInfo {
  code: PlanCode;
  name: string;
  nameJa: string;
  /** 優先度�E�高いほど上位�Eラン、TRIAL=4 で全機�E利用可能�E�E*/
  priority: number;
  description: string;
  descriptionJa: string;
  /** チE��ォルト有効期間�E�日�E�、E1 は無期限/要相諁E*/
  defaultDurationDays: number;
}

/**
 * 機�E定義
 *
 * @example ブ�Eル型機�E�E�有効/無効のみ�E�E
 * {
 *   key: 'subtitle',
 *   name: 'Subtitle',
 *   nameJa: '字幁E,
 *   type: 'boolean',
 *   allowedPlans: ['TRIAL', 'PRO', 'ENT'],
 * }
 *
 * @example 数値制限機�E
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
  /** 機�Eキー�E�製品�Eで一意！E*/
  key: string;
  /** 機�E名（英語！E*/
  name: string;
  /** 機�E名（日本語！E*/
  nameJa: string;
  /** 制御タイチE boolean=有効/無効, limit=数値制陁E*/
  type: 'boolean' | 'limit';
  /** こ�E機�Eが有効なプラン一覧 */
  allowedPlans: PlanCode[];
  /** 数値制限値�E�Eype='limit' の場合忁E��、E1 は無制限！E*/
  limitValues?: Partial<Record<PlanCode, number>>;
  /** 機�Eの説明（日本語！E*/
  descriptionJa?: string;
}

/** プラン別制限（製品�E通�EチE��ォルト値�E�E*/
export interface PlanLimits {
  /** 月間利用上限�E�E1 = 無制限！E*/
  monthlyLimit: number;
  /** 最大ファイルサイズ (MB)、E1 = 無制陁E*/
  maxFileSizeMB: number;
  /** 最大保存数、E1 = 無制陁E*/
  maxStorageItems: number;
  /** 最大解像度�E�動画系�E�E*/
  maxResolution?: '720p' | '1080p' | '4K';
  /** ウォーターマ�Eク有無 */
  hasWatermark: boolean;
  /** バッチ�E琁E��能 */
  batchEnabled: boolean;
  /** API利用可能 */
  apiEnabled: boolean;
  /** 優先�E琁E*/
  priorityProcessing: boolean;
}

// =============================================================================
// 製品定義
// =============================================================================

export const PRODUCTS: Record<ProductCode, ProductInfo> = {

  // =========================================================================
  // Tier 1: 業務変革チE�Eル�E�高単価�E�E
  // =========================================================================

  INCA: {
    code: 'INCA',
    name: 'InsightNoCodeAnalyzer',
    nameJa: 'InsightNoCodeAnalyzer',
    description: 'RPA and low-code migration automation tool',
    descriptionJa: 'RPA・ローコード�Eマイグレーション自動化チE�Eル',
    masterIcon: 'brand/icons/png/icon-insight-nca.png',
    targetPlatform: 'tauri',
    iconBuildPath: 'src-tauri/icons/',
  },
  INBT: {
    code: 'INBT',
    name: 'InsightBot',
    nameJa: 'InsightBot',
    description: 'AI editor-equipped business optimization RPA + Orchestrator',
    descriptionJa: 'AIエチE��タ搭輁E E業務最適化RPA + Orchestrator',
    masterIcon: 'brand/icons/png/icon-insight-bot.png',
    targetPlatform: 'service',
    iconBuildPath: 'Resources/',
  },
  IVIN: {
    code: 'IVIN',
    name: 'InterviewInsight',
    nameJa: 'InterviewInsight',
    description: 'Automated hearing and business research support',
    descriptionJa: '自動ヒアリング・業務調査支援',
    masterIcon: 'brand/icons/png/icon-interview-insight.png',
    targetPlatform: 'tauri',
    iconBuildPath: 'src-tauri/icons/',
  },

  // =========================================================================
  // Tier 2: AI活用チE�Eル�E�中単価�E�E
  // =========================================================================

  INMV: {
    code: 'INMV',
    name: 'InsightCast',
    nameJa: 'InsightCast',
    description: 'Automated video creation from images and text',
    descriptionJa: '画像とチE��ストから動画を�E動作�E',
    masterIcon: 'brand/icons/png/icon-insight-cast.png',
    targetPlatform: 'python',
    iconBuildPath: 'resources/',
  },
  INIG: {
    code: 'INIG',
    name: 'InsightImageGen',
    nameJa: 'InsightImageGen',
    description: 'AI bulk image generation tool for business materials',
    descriptionJa: '業務賁E��向けAI画像�E大量�E動生成ツール',
    masterIcon: 'brand/icons/png/icon-insight-imagegen.png',
    targetPlatform: 'python',
    iconBuildPath: 'resources/',
  },

  // =========================================================================
  // Tier 3: InsightOffice Suite�E�コンサル導�EチE�Eル�E�E
  // =========================================================================

  INSS: {
    code: 'INSS',
    name: 'InsightOfficeSlide',
    nameJa: 'InsightOfficeSlide',
    description: 'AI-powered presentation creation and editing tool  EMS Office not required',
    descriptionJa: 'AIアシスタント搭輁E EプレゼンチE�Eション作�E・編雁E��ール�E�ES Office 不要E��E,
    masterIcon: 'brand/icons/png/icon-insight-slide.png',
    targetPlatform: 'wpf',
    iconBuildPath: 'Resources/',
    projectFile: {
      extension: 'inss',
      mimeType: 'application/x-insightoffice-slide',
      description: 'InsightOfficeSlide Project',
      descriptionJa: 'InsightOfficeSlide プロジェクチE,
      iconFileName: 'inss-file.ico',
      innerDocumentFormat: '.pptx',
      contextMenuLabel: 'Open with InsightOfficeSlide',
      contextMenuLabelJa: 'InsightOfficeSlide で開く',
      contextMenuTargetExtensions: ['pptx', 'ppt'],
      supportsAiMemory: true,
    },
  },
  IOSH: {
    code: 'IOSH',
    name: 'InsightOfficeSheet',
    nameJa: 'InsightOfficeSheet',
    description: 'AI-powered spreadsheet creation and editing tool  EMS Office not required',
    descriptionJa: 'AIアシスタント搭輁E EスプレチE��シート作�E・編雁E��ール�E�ES Office 不要E��E,
    masterIcon: 'brand/icons/png/icon-insight-sheet.png',
    targetPlatform: 'wpf',
    iconBuildPath: 'Resources/',
    projectFile: {
      extension: 'iosh',
      mimeType: 'application/x-insightoffice-sheet',
      description: 'InsightOfficeSheet Project',
      descriptionJa: 'InsightOfficeSheet プロジェクチE,
      iconFileName: 'iosh-file.ico',
      innerDocumentFormat: '.xlsx',
      contextMenuLabel: 'Open with InsightOfficeSheet',
      contextMenuLabelJa: 'InsightOfficeSheet で開く',
      contextMenuTargetExtensions: ['xlsx', 'xls', 'csv'],
      supportsAiMemory: true,
    },
  },
  IOSD: {
    code: 'IOSD',
    name: 'InsightOfficeDoc',
    nameJa: 'InsightOfficeDoc',
    description: 'AI-powered document creation and editing tool  EMS Office not required',
    descriptionJa: 'AIアシスタント搭輁E Eドキュメント作�E・編雁E��ール�E�ES Office 不要E��E,
    masterIcon: 'brand/icons/png/icon-insight-doc.png',
    targetPlatform: 'wpf',
    iconBuildPath: 'Resources/',
    projectFile: {
      extension: 'iosd',
      mimeType: 'application/x-insightoffice-doc',
      description: 'InsightOfficeDoc Project',
      descriptionJa: 'InsightOfficeDoc プロジェクチE,
      iconFileName: 'iosd-file.ico',
      innerDocumentFormat: '.docx',
      contextMenuLabel: 'Open with InsightOfficeDoc',
      contextMenuLabelJa: 'InsightOfficeDoc で開く',
      contextMenuTargetExtensions: ['docx', 'doc'],
      supportsAiMemory: true,
    },
  },
  INPY: {
    code: 'INPY',
    name: 'InsightPy',
    nameJa: 'InsightPy',
    description: 'AI editor-equipped Python execution platform for business automation',
    descriptionJa: 'AIエチE��タ搭輁E E業務調査・チE�Eタ収集のためのPython実行基盤',
    masterIcon: 'brand/icons/png/icon-insight-py.png',
    targetPlatform: 'python',
    iconBuildPath: 'resources/',
  },

  // =========================================================================
  // Tier 4: Insight Senior Office�E�シニア向け社会貢献チE�Eル�E�E
  // =========================================================================

  ISOF: {
    code: 'ISOF',
    name: 'InsightSeniorOffice',
    nameJa: 'InsightSeniorOffice',
    description: 'AI-assisted office suite for senior users  Espreadsheet, document, and iCloud email in one simple app',
    descriptionJa: 'AIアシスタント搭輁E Eシニア向け統合オフィスチE�Eル�E�表計算�E斁E��・iCloudメール�E�E,
    masterIcon: 'brand/icons/png/icon-senior-office.png',
    targetPlatform: 'wpf',
    iconBuildPath: 'Resources/',
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
    priority: 4,  // 全機�E使えるため最上位と同筁E
    description: 'Full features for evaluation (14 days)',
    descriptionJa: '全機�E利用可能�E�E4日間！E,
    defaultDurationDays: 14,
  },
  STD: {
    code: 'STD',
    name: 'Standard',
    nameJa: 'スタンダーチE,
    priority: 2,
    description: 'Standard features for corporate use (365 days)',
    descriptionJa: '法人向け標準機�E�E�E65日�E�E,
    defaultDurationDays: 365,
  },
  PRO: {
    code: 'PRO',
    name: 'Pro',
    nameJa: 'プロ',
    priority: 3,
    description: 'All features including AI (200/month) and collaboration (365 days)',
    descriptionJa: '法人向け全機�E  EAI朁E00回�Eコラボレーション�E�E65日�E�E,
    defaultDurationDays: 365,
  },
  ENT: {
    code: 'ENT',
    name: 'Enterprise',
    nameJa: 'エンタープライズ',
    priority: 4,
    description: 'Custom features and dedicated support',
    descriptionJa: 'カスタマイズ�E�要相諁E��E,
    defaultDurationDays: -1,
  },
};

// =============================================================================
// 共通機�E�E��E製品で利用可能�E�E
// =============================================================================

/**
 * 全製品�E通�E機�E
 * - Enterprise専用機�Eなど、製品に依存しなぁE���Eを定義
 * - checkCommonFeature() でチェチE��可能
 */
export const COMMON_FEATURES: FeatureDefinition[] = [
  {
    key: 'api_access',
    name: 'API Access',
    nameJa: 'API利用',
    type: 'boolean',
    allowedPlans: ['ENT'],
    descriptionJa: '外部シスチE��からのAPI経由でのアクセス',
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
    nameJa: '優先サポ�EチE,
    type: 'boolean',
    allowedPlans: ['PRO', 'ENT'],
    descriptionJa: '優先的なサポ�Eト対忁E,
  },
];

// =============================================================================
// 製品別機�E定義
// =============================================================================

/**
 * 製品固有�E機�E定義
 *
 * 【注意、E
 * - 吁E���Eの key は製品�Eで一意であること
 * - allowedPlans には忁E��該当する�Eランを�E挙すること
 * - type: 'limit' の場合�E limitValues を忁E��設定すること
 */
export const PRODUCT_FEATURES: Record<ProductCode, FeatureDefinition[]> = {
  // ========================================
  // InsightOfficeSlide (INSS)  ETier 3
  // AIアシスタント搭載PowerPointチE�Eル
  // ========================================
  INSS: [
    // ------------------------------------------------------------------
    // 基本操作（ファイルタブ相当） E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'create_new',
      name: 'Create New Presentation',
      nameJa: '新規�EレゼンチE�Eション作�E',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '空の PowerPoint プレゼンチE�Eションを新規作�E�E�ES Office 不要E��E,
    },
    {
      key: 'slide_edit',
      name: 'Slide Editing',
      nameJa: 'スライド編雁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スライド�EチE��スト�Eレイアウト編雁E��ES Office 不要E ESyncfusion エンジン�E�E,
    },
    {
      key: 'save_as',
      name: 'Save As',
      nameJa: '名前を付けて保孁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '.pptx / .ppt 形式での保孁E,
    },
    {
      key: 'print',
      name: 'Print',
      nameJa: '印刷',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スライド�E印刷�E��E币E��E��・ノ�Eト付き・褁E��スライチEペ�Eジ対応！E,
    },
    {
      key: 'pdf_export',
      name: 'PDF Export',
      nameJa: 'PDF出劁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'プレゼンチE�EションをPDF形式でエクスポ�EチE,
    },
    {
      key: 'undo_redo',
      name: 'Undo / Redo',
      nameJa: '允E��戻す�EめE��直ぁE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '操作�E取り消し・めE��直し（褁E��レベル対応！E,
    },
    {
      key: 'clipboard',
      name: 'Clipboard',
      nameJa: 'クリチE�Eボ�EチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'コピ�E・刁E��取り・貼り付け・形式を選択して貼り付け',
    },
    // ------------------------------------------------------------------
    // ホ�Eムタブ相当（テキスト書式�Eスライド操作） E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'text_formatting',
      name: 'Text Formatting',
      nameJa: 'チE��スト書弁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'フォント（種類�Eサイズ・太字�E斜体�E下線�E影・色�E�、段落�E��E置・行間・箁E��書き�E番号付き�E�E,
    },
    {
      key: 'slide_management',
      name: 'Slide Management',
      nameJa: 'スライド操佁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スライド�E追加・褁E��・削除・並べ替え�Eレイアウト変更・セクション管琁E,
    },
    {
      key: 'find_replace',
      name: 'Find & Replace',
      nameJa: '検索・置揁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スライド�EチE��スト�E検索・一括置揁E,
    },
    // ------------------------------------------------------------------
    // 挿入タブ相彁E E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'insert_image',
      name: 'Insert Image',
      nameJa: '画像挿入',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '画像ファイルの挿入・トリミング・サイズ変更・位置調整',
    },
    {
      key: 'insert_shape',
      name: 'Insert Shape',
      nameJa: '図形挿入',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '図形・矢印・吹き�Eし�EチE��スト�EチE��ス・ワードアート�E挿入・書式設宁E,
    },
    {
      key: 'insert_table',
      name: 'Insert Table',
      nameJa: '表の挿入',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スライドへの表の挿入・行�E追加・セル結合・スタイル設宁E,
    },
    {
      key: 'insert_chart',
      name: 'Insert Chart',
      nameJa: 'グラフ�E挿入',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '棒�E折れ線�E冁E�E散币E��等�Eグラフをスライドに挿入・チE�Eタ編雁E,
    },
    {
      key: 'insert_smartart',
      name: 'Insert SmartArt',
      nameJa: 'SmartArt挿入',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'SmartArt�E�リスト�E手頁E�E循環・階層・関係等）�E挿入・編雁E,
    },
    {
      key: 'insert_media',
      name: 'Insert Media',
      nameJa: 'メチE��ア挿入',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '動画・音声ファイルの挿入・再生設宁E,
    },
    {
      key: 'hyperlink',
      name: 'Hyperlink',
      nameJa: 'ハイパ�Eリンク',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'チE��スト�Eオブジェクトへのハイパ�Eリンク挿入�E�ERL・スライド�E・メール�E�E,
    },
    {
      key: 'comments',
      name: 'Comments',
      nameJa: 'コメンチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スライドへのコメント挿入・返信・解決',
    },
    {
      key: 'header_footer',
      name: 'Header & Footer',
      nameJa: 'ヘッダーとフッター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スライド番号・日付�EフッターチE��スト�E設宁E,
    },
    // ------------------------------------------------------------------
    // チE��インタブ相彁E
    // ------------------------------------------------------------------
    {
      key: 'design_theme',
      name: 'Design Theme',
      nameJa: 'チE��インチE�EチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'チE�Eマ�Eバリエーションの適用・配色/フォンチE効果�Eカスタマイズ',
    },
    {
      key: 'slide_size',
      name: 'Slide Size',
      nameJa: 'スライド�Eサイズ',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スライドサイズの設定（標溁E4:3 / ワイチE16:9 / カスタム�E�E,
    },
    {
      key: 'slide_master',
      name: 'Slide Master',
      nameJa: 'スライド�Eスター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'スライド�Eスター・レイアウト�E編雁E��よるチE��イン統一',
    },
    // ------------------------------------------------------------------
    // 画面刁E��替え�Eアニメーションタブ相彁E EPRO/ENT
    // ------------------------------------------------------------------
    {
      key: 'slide_transition',
      name: 'Slide Transition',
      nameJa: 'スライド�E替効极E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'スライド間のトランジション効果�E設定（フェード�Eプッシュ・ワイプ等！E,
    },
    {
      key: 'animation',
      name: 'Animation',
      nameJa: 'アニメーション',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'オブジェクト�Eアニメーション効果（開始�E強調・終亁E�E軌跡�E��E設定�Eタイミング調整',
    },
    // ------------------------------------------------------------------
    // オブジェクト操作（書式タブ相当） E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'object_formatting',
      name: 'Object Formatting',
      nameJa: 'オブジェクト書弁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '図形・画像�E塗りつぶし�E枠線�E効果（影・反封E�E光彩�E��Eサイズ・回転',
    },
    {
      key: 'arrange_objects',
      name: 'Arrange Objects',
      nameJa: 'オブジェクト�E整刁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'オブジェクト�E整列�E配置・グループ化・前面/背面移動�E回転',
    },
    // ------------------------------------------------------------------
    // スライドショータブ相彁E E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'slideshow',
      name: 'Slide Show',
      nameJa: 'スライドショー',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スライドショーの再生�E�最初から�E現在のスライドから！E,
    },
    {
      key: 'presenter_view',
      name: 'Presenter View',
      nameJa: '発表老E��ール',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '発表老E��ール�E�ノート表示・次スライド�Eレビュー・タイマ�E・レーザーポインター�E�E,
    },
    {
      key: 'speaker_notes',
      name: 'Speaker Notes',
      nameJa: '発表老E��ーチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スライドごとの発表老E��モの編雁E�E印刷',
    },
    // ------------------------------------------------------------------
    // 校閲タブ相彁E
    // ------------------------------------------------------------------
    {
      key: 'spell_check',
      name: 'Spell Check',
      nameJa: 'スペルチェチE��',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スライド�EチE��スト�EスペルチェチE��',
    },
    // ------------------------------------------------------------------
    // 独自機�E�E�EnsightOffice 固有！E
    // ------------------------------------------------------------------
    {
      key: 'extract',
      name: 'Content Extraction',
      nameJa: 'コンチE��チE��出',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'PowerPointからチE��スト�E画像を抽出',
    },
    {
      key: 'update',
      name: 'Content Update',
      nameJa: 'コンチE��チE��新',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: -1, PRO: -1, ENT: -1 },
      descriptionJa: 'スライド�E一括更新',
    },
    {
      key: 'json',
      name: 'JSON I/O',
      nameJa: 'JSON入出劁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'JSON形式でのチE�Eタ入出劁E,
    },
    {
      key: 'batch',
      name: 'Batch Processing',
      nameJa: 'フォルダ一括処琁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '褁E��ファイルの一括処琁E,
    },
    {
      key: 'compare',
      name: 'File Compare',
      nameJa: '2ファイル比輁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '2つのPowerPointファイルの差刁E��輁E,
    },
    {
      key: 'auto_backup',
      name: 'Auto Backup',
      nameJa: '自動バチE��アチE�E',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: '編雁E��の自動バチE��アチE�E作�E',
    },
    // ------------------------------------------------------------------
    // AI・アシスタント機�E
    // ------------------------------------------------------------------
    {
      key: 'ai_assistant',
      name: 'AI Assistant',
      nameJa: 'AIアシスタンチE,
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるスライドテキスト�E校正・改喁E��案！ETD: 朁E0囁E/ PRO: 朁E00囁E/ ENT: 無制限！E,
    },
    {
      key: 'ai_editor',
      name: 'AI Code Editor',
      nameJa: 'AIコードエチE��ター',
      type: 'limit',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるPythonコード�E生�E・編雁E��PowerPointを�E動�E琁E��ERO: 朁E00囁E/ ENT: 無制限！E,
    },
    {
      key: 'reference_materials',
      name: 'Reference Materials',
      nameJa: '参老E��E��',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '参老E��E��の添付�EAI コンチE��ストとしての活用',
    },
    {
      key: 'document_evaluation',
      name: 'Document Evaluation',
      nameJa: 'ドキュメント評価',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるプレゼンチE�Eションの多角的評価・スコアリング・改喁E��案！Epus推奨・STD: 朁E0囁E/ PRO: 朁E00囁E/ ENT: 無制限！E,
    },
    {
      key: 'voice_input',
      name: 'Voice Input',
      nameJa: '音声入劁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '音声認識によるハンズフリー入劁E,
    },
    {
      key: 'vrm_avatar',
      name: 'VRM Avatar',
      nameJa: 'VRMアバター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'VRM 3Dアバターによる音声会話�E�ETS + STT + リチE�Eシンク�E�E,
    },
  ],

  // ========================================
  // InsightOfficeSheet (IOSH)  ETier 3
  // AIアシスタント搭載Excel管琁E��ール
  // ========================================
  IOSH: [
    // ------------------------------------------------------------------
    // 基本操作（ファイル・ホ�Eムタブ相当） E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'create_new',
      name: 'Create New Spreadsheet',
      nameJa: '新規スプレチE��シート作�E',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '空の Excel スプレチE��シートを新規作�E�E�ES Office 不要E��E,
    },
    {
      key: 'read_excel',
      name: 'Read Excel',
      nameJa: 'Excel読み込み・編雁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'Excelファイルの読み込み・編雁E�E保存！ES Office 不要E ESyncfusion エンジン�E�E,
    },
    {
      key: 'save_as',
      name: 'Save As',
      nameJa: '名前を付けて保孁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '.xlsx / .xls / .csv / .tsv 形式での保孁E,
    },
    {
      key: 'print',
      name: 'Print',
      nameJa: '印刷',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スプレチE��シート�E印刷�E�篁E��持E���Eヘッダーフッター・改ペ�Eジ設定対応！E,
    },
    {
      key: 'pdf_export',
      name: 'PDF Export',
      nameJa: 'PDF出劁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'スプレチE��シートをPDF形式でエクスポ�EチE,
    },
    {
      key: 'undo_redo',
      name: 'Undo / Redo',
      nameJa: '允E��戻す�EめE��直ぁE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '操作�E取り消し・めE��直し（褁E��レベル対応！E,
    },
    {
      key: 'clipboard',
      name: 'Clipboard',
      nameJa: 'クリチE�Eボ�EチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'コピ�E・刁E��取り・貼り付け・形式を選択して貼り付け',
    },
    // ------------------------------------------------------------------
    // セル書式設定（�EームタチE Eフォント�E配置・数値�E� E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'cell_formatting',
      name: 'Cell Formatting',
      nameJa: 'セル書式設宁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'フォント（種類�Eサイズ・太字�E斜体�E下線�E色�E�、セル背景色・罫線�E設宁E,
    },
    {
      key: 'number_format',
      name: 'Number Format',
      nameJa: '表示形弁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '数値・通貨・日付�Eパ�Eセント�E会計�E刁E��・斁E���E等�Eセル表示形式設宁E,
    },
    {
      key: 'alignment',
      name: 'Alignment',
      nameJa: '配置',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '水平・垂直配置、折り返し、縮小して全体を表示、インチE��ト、テキスト方吁E,
    },
    {
      key: 'merge_cells',
      name: 'Merge Cells',
      nameJa: 'セルの結合',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'セルの結合・結合解除�E�横方向�E縦方向�E結合して中央揁E���E�E,
    },
    // ------------------------------------------------------------------
    // 行�E列�Eシート操佁E E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'row_column_ops',
      name: 'Row & Column Operations',
      nameJa: '行と列�E操佁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '行�E列�E挿入・削除・非表示・再表示・高さ/幁E�E調整・自動調整',
    },
    {
      key: 'sheet_management',
      name: 'Sheet Management',
      nameJa: 'シート管琁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'シート�E追加・削除・名前変更・移動�Eコピ�E・タブ色設定�E非表示/再表示',
    },
    {
      key: 'freeze_panes',
      name: 'Freeze Panes',
      nameJa: 'ウィンドウ枠の固宁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '先頭行�E先頭列�E任意セル位置でのウィンドウ枠固宁E,
    },
    // ------------------------------------------------------------------
    // 数式�E関数�E�数式タブ相当） E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'formulas',
      name: 'Formulas & Functions',
      nameJa: '数式と関数',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '数式�E力�E関数挿入�E�EUM / VLOOKUP / IF / COUNT 筁E400+ 関数�E�、オーチEUM',
    },
    {
      key: 'named_ranges',
      name: 'Named Ranges',
      nameJa: '名前の定義',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'セル篁E��への名前定義・名前の管琁E�E数式での名前参�E',
    },
    {
      key: 'formula_auditing',
      name: 'Formula Auditing',
      nameJa: '数式�E検証',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '参�E允E参�E先トレース・エラーチェチE��・数式�E評価',
    },
    // ------------------------------------------------------------------
    // 検索・フィルタ・並べ替ぁE E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'find_replace',
      name: 'Find & Replace',
      nameJa: '検索・置揁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'セル値の検索・一括置換（正規表現対応！E,
    },
    {
      key: 'sort_filter',
      name: 'Sort & Filter',
      nameJa: 'ソート�Eフィルタ',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '列�Eソート�Eオートフィルタ・カスタムフィルタ・色フィルタ',
    },
    {
      key: 'auto_fill',
      name: 'Auto Fill',
      nameJa: 'オートフィル',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '連続データの自動�E力（数値・日付�E曜日・カスタムリスト！E,
    },
    // ------------------------------------------------------------------
    // 挿入タブ相彁E E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'chart',
      name: 'Chart',
      nameJa: 'グラフ作�E',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '棒�E折れ線�E冁E�E散币E��・面・レーダー等�Eグラフ作�E・編雁E��Eyncfusion Chart�E�E,
    },
    {
      key: 'insert_image',
      name: 'Insert Image',
      nameJa: '画像�E挿入',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '画像ファイルの挿入・サイズ変更・位置調整',
    },
    {
      key: 'insert_shape',
      name: 'Insert Shape',
      nameJa: '図形の挿入',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '図形・チE��スト�EチE��ス・ワードアート�E挿入',
    },
    {
      key: 'hyperlink',
      name: 'Hyperlink',
      nameJa: 'ハイパ�Eリンク',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'セルへのハイパ�Eリンクの挿入・編雁E��ERL・メール・シート�E参�E�E�E,
    },
    {
      key: 'comments',
      name: 'Comments',
      nameJa: 'コメンチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'セルへのコメント挿入・編雁E�E削除・スレチE��表示',
    },
    // ------------------------------------------------------------------
    // ペ�Eジレイアウトタブ相彁E E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'page_setup',
      name: 'Page Setup',
      nameJa: 'ペ�Eジ設宁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '用紙サイズ・余白・印刷の向き・拡大縮小�E印刷篁E��・改ペ�Eジの設宁E,
    },
    // ------------------------------------------------------------------
    // チE�Eタタブ相当（上級） EPRO/ENT
    // ------------------------------------------------------------------
    {
      key: 'conditional_formatting',
      name: 'Conditional Formatting',
      nameJa: '条件付き書弁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'セル値に応じた�E動書式設定（カラースケール・チE�Eタバ�E・アイコンセチE���E�E,
    },
    {
      key: 'pivot_table',
      name: 'Pivot Table',
      nameJa: 'ピ�EチE��チE�Eブル',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'チE�Eタの雁E���Eクロス刁E���E�Eyncfusion Pivot Table�E�E,
    },
    {
      key: 'data_validation',
      name: 'Data Validation',
      nameJa: 'チE�Eタ入力規則',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'セルへの入力制限�EドロチE�Eダウンリスト�EエラーメチE��ージ設宁E,
    },
    {
      key: 'text_to_columns',
      name: 'Text to Columns',
      nameJa: '区刁E��位置',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'チE��ストデータを区刁E��斁E��で褁E��列に刁E��',
    },
    {
      key: 'remove_duplicates',
      name: 'Remove Duplicates',
      nameJa: '重褁E�E削除',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: '選択篁E��冁E�E重褁E��ータを検�E・削除',
    },
    {
      key: 'group_outline',
      name: 'Group & Outline',
      nameJa: 'グループ化とアウトライン',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: '行�E列�Eグループ化・アウトライン表示・小訁E,
    },
    {
      key: 'goal_seek',
      name: 'Goal Seek',
      nameJa: 'ゴールシーク',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: '目標値に対するセル値の送E��！Ehat-If 刁E���E�E,
    },
    // ------------------------------------------------------------------
    // 校閲タブ相彁E
    // ------------------------------------------------------------------
    {
      key: 'spell_check',
      name: 'Spell Check',
      nameJa: 'スペルチェチE��',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'セル冁E��キスト�EスペルチェチE��',
    },
    {
      key: 'protect_sheet',
      name: 'Protect Sheet / Workbook',
      nameJa: 'シート�Eブックの保護',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'シート保護�E�パスワード付き�E��Eブック構�Eの保護・セルのロチE��/解除',
    },
    // ------------------------------------------------------------------
    // 独自機�E�E�EnsightOffice 固有！E
    // ------------------------------------------------------------------
    {
      key: 'version_control',
      name: 'Version Control',
      nameJa: 'バ�Eジョン管琁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'ファイルのバ�Eジョン管琁E�E履歴保持',
    },
    {
      key: 'diff_compare',
      name: 'Diff Compare',
      nameJa: '差刁E��輁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'バ�Eジョン間�Eセル差刁E��輁E,
    },
    {
      key: 'change_log',
      name: 'Change Log',
      nameJa: 'セル変更ログ',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'セル単位�E変更履歴の記録・表示',
    },
    {
      key: 'export',
      name: 'Export',
      nameJa: 'エクスポ�EチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '変更履歴・差刁E�Eエクスポ�Eト�E劁E,
    },
    {
      key: 'file_compare',
      name: 'File Compare',
      nameJa: '2ファイル比輁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '2つのExcelファイルのセル単位差刁E��輁E,
    },
    {
      key: 'show_author',
      name: 'Show Author',
      nameJa: '変更老E��示',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'セル変更ログで変更老E��誰が変更したか）を表示�E�チーム利用向け�E�E,
    },
    {
      key: 'board',
      name: 'Board',
      nameJa: '掲示板',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'チ�Eム向け掲示板機�E',
    },
    {
      key: 'sticky_notes',
      name: 'Sticky Notes',
      nameJa: '付箁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'セルに付箋（メモ�E�を貼り付け。色刁E��・バ�Eジョン管琁E��勁E,
    },
    {
      key: 'send_message',
      name: 'Send Message',
      nameJa: 'メチE��ージ送信',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'チ�Eムメンバ�EへのメチE��ージ送信',
    },
    // ------------------------------------------------------------------
    // AI・アシスタント機�E
    // ------------------------------------------------------------------
    {
      key: 'ai_assistant',
      name: 'AI Assistant',
      nameJa: 'AIアシスタンチE,
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, PRO: 200, ENT: -1 },
      descriptionJa: 'AIチャチE��によるExcel操作支援�E�ETD: 朁E0囁E/ PRO: 朁E00囁E/ ENT: 無制限！E,
    },
    {
      key: 'ai_editor',
      name: 'AI Code Editor',
      nameJa: 'AIコードエチE��ター',
      type: 'limit',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるPythonコード�E生�E・編雁E��Excelを�E動�E琁E��ERO: 朁E00囁E/ ENT: 無制限！E,
    },
    {
      key: 'reference_materials',
      name: 'Reference Materials',
      nameJa: '参老E��E��',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '参老E��E��の添付�EAI コンチE��ストとしての活用',
    },
    {
      key: 'document_evaluation',
      name: 'Document Evaluation',
      nameJa: 'ドキュメント評価',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるスプレチE��シート�E多角的評価・スコアリング・改喁E��案！Epus推奨・STD: 朁E0囁E/ PRO: 朁E00囁E/ ENT: 無制限！E,
    },
    {
      key: 'voice_input',
      name: 'Voice Input',
      nameJa: '音声入劁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '音声認識によるハンズフリー入劁E,
    },
    {
      key: 'vrm_avatar',
      name: 'VRM Avatar',
      nameJa: 'VRMアバター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'VRM 3Dアバターによる音声会話�E�ETS + STT + リチE�Eシンク�E�E,
    },
    // ------------------------------------------------------------------
    // データ収集プラットフォーム（Data Collection Platform）
    // サーバー管理テンプレート + AI 自動転記 + AI 検証
    // ------------------------------------------------------------------
    {
      key: 'data_collection',
      name: 'Data Collection',
      nameJa: 'データ収集',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'サーバー管理テンプレートによるエンタープライズデータ収集（テンプレート選択→入力→送信）',
    },
    {
      key: 'data_collection_ai_transfer',
      name: 'AI Auto-Transfer',
      nameJa: 'AI 自動転記',
      type: 'limit',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, PRO: 200, ENT: -1 },
      descriptionJa: 'AI が既存 Excel データをデータ収集テンプレートに自動転記（PRO: 月200回 / ENT: 無制限）',
    },
    {
      key: 'data_collection_ai_validate',
      name: 'AI Validation',
      nameJa: 'AI 検証',
      type: 'limit',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, PRO: 200, ENT: -1 },
      descriptionJa: 'AI による入力データの妥当性検証・異常値検出・整合性チェック（PRO: 月200回 / ENT: 無制限）',
    },
  ],

  // ========================================
  // InsightOfficeDoc (IOSD)  ETier 3
  // AIアシスタント搭載Word管琁E��ール
  // ========================================
  IOSD: [
    // ------------------------------------------------------------------
    // 基本操作（ファイルタブ相当） E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'create_new',
      name: 'Create New Document',
      nameJa: '新規ドキュメント作�E',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '空の Word ドキュメントを新規作�E�E�ES Office 不要E��E,
    },
    {
      key: 'read_doc',
      name: 'Read Document',
      nameJa: 'ドキュメント読取�E書込',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'Wordドキュメント�E読み込み・編雁E�E保存！ES Office 不要E ESyncfusion エンジン�E�E,
    },
    {
      key: 'save_as',
      name: 'Save As',
      nameJa: '名前を付けて保孁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '.docx / .doc / .rtf / .txt 形式での保孁E,
    },
    {
      key: 'print',
      name: 'Print',
      nameJa: '印刷',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'ドキュメント�E印刷�E��Eージ篁E��持E���E部数・用紙サイズ対応！E,
    },
    {
      key: 'pdf_export',
      name: 'PDF Export',
      nameJa: 'PDF出劁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'ドキュメントをPDF形式でエクスポ�EチE,
    },
    {
      key: 'undo_redo',
      name: 'Undo / Redo',
      nameJa: '允E��戻す�EめE��直ぁE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '操作�E取り消し・めE��直し（褁E��レベル対応！E,
    },
    {
      key: 'clipboard',
      name: 'Clipboard',
      nameJa: 'クリチE�Eボ�EチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'コピ�E・刁E��取り・貼り付け・形式を選択して貼り付け',
    },
    // ------------------------------------------------------------------
    // ホ�Eムタブ相当（フォント�E段落・スタイル�E� E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'font_formatting',
      name: 'Font Formatting',
      nameJa: 'フォント書弁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'フォント種類�Eサイズ・太字�E斜体�E下線�E取り消し線�E上付き/下付き・斁E��色・蛍�Eペン',
    },
    {
      key: 'paragraph_formatting',
      name: 'Paragraph Formatting',
      nameJa: '段落書弁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '配置�E�左揁E��・中央・右揁E��・両端揁E���E��E行間・段落前後�E間隔・インチE��チE,
    },
    {
      key: 'bullets_numbering',
      name: 'Bullets & Numbering',
      nameJa: '箁E��書きと段落番号',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '箁E��書き�E番号付きリスト�Eアウトライン番号・リストレベルの変更',
    },
    {
      key: 'styles',
      name: 'Styles',
      nameJa: 'スタイル',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '見�Eしスタイル�E�E1〜H6�E��E本斁E�E引用・リスト等�E適用・カスタムスタイル作�E',
    },
    {
      key: 'find_replace',
      name: 'Find & Replace',
      nameJa: '検索・置揁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'チE��スト�E検索・一括置換（正規表現対応�E書式検索�E�E,
    },
    // ------------------------------------------------------------------
    // 挿入タブ相彁E E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'insert_table',
      name: 'Insert Table',
      nameJa: '表の挿入・編雁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '表の挿入・行�E追加・セル結合・罫線スタイル設定�E表スタイルの適用',
    },
    {
      key: 'insert_image',
      name: 'Insert Image',
      nameJa: '画像挿入',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '画像ファイルの挿入・トリミング・サイズ変更・斁E���Eの折り返し設宁E,
    },
    {
      key: 'insert_shape',
      name: 'Insert Shape',
      nameJa: '図形挿入',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '図形・チE��スト�EチE��ス・ワードアート�E挿入・書式設宁E,
    },
    {
      key: 'insert_chart',
      name: 'Insert Chart',
      nameJa: 'グラフ�E挿入',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'グラフ�E挿入・チE�Eタ編雁E��棒�E折れ線�E冁E��！E,
    },
    {
      key: 'hyperlink',
      name: 'Hyperlink',
      nameJa: 'ハイパ�Eリンク',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'チE��スト�E画像へのハイパ�Eリンク挿入�E�ERL・メール・斁E��冁E��照�E�E,
    },
    {
      key: 'bookmark',
      name: 'Bookmark',
      nameJa: 'ブックマ�Eク',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'ブックマ�Eクの挿入・管琁E�E相互参照',
    },
    {
      key: 'comments',
      name: 'Comments',
      nameJa: 'コメンチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'チE��ストへのコメント挿入・返信・解決・削除',
    },
    {
      key: 'header_footer',
      name: 'Header & Footer',
      nameJa: 'ヘッダー・フッター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'ペ�Eジヘッダー・フッターの編雁E���Eージ番号・日付�Eロゴ・奁E��/偶数ペ�Eジ別�E�E,
    },
    {
      key: 'page_break',
      name: 'Page Break',
      nameJa: '改ペ�Eジ・セクション区刁E��',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '改ペ�Eジ・セクション区刁E���E�次のペ�Eジ・現在の位置・偶数/奁E��ペ�Eジ�E��E挿入',
    },
    {
      key: 'insert_symbol',
      name: 'Insert Symbol',
      nameJa: '記号と特殊文孁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '特殊文字�E記号・絵斁E���E挿入',
    },
    {
      key: 'footnote_endnote',
      name: 'Footnote & Endnote',
      nameJa: '脚注・斁E��脚注',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '脚注・斁E��脚注の挿入・編雁E�E番号書式設宁E,
    },
    // ------------------------------------------------------------------
    // ペ�Eジレイアウトタブ相彁E E全プラン共送E
    // ------------------------------------------------------------------
    {
      key: 'page_setup',
      name: 'Page Setup',
      nameJa: 'ペ�Eジ設宁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '用紙サイズ・余白・ペ�Eジの向き�E�縦/横�E��E段絁E��設宁E,
    },
    {
      key: 'borders_shading',
      name: 'Borders & Shading',
      nameJa: '罫線と網かけ',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'ペ�Eジ罫線�E段落罫線�E網かけの設宁E,
    },
    {
      key: 'columns',
      name: 'Columns',
      nameJa: '段絁E��',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '斁E��の段絁E��レイアウト！E段・2段・3段・カスタム�E�E,
    },
    {
      key: 'watermark',
      name: 'Watermark',
      nameJa: '透かぁE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'チE��スト�E画像�E透かし挿入�E�「社外秘」「下書き」等！E,
    },
    {
      key: 'line_numbers',
      name: 'Line Numbers',
      nameJa: '行番号',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '行番号の表示設定（連続�Eペ�EジごとにリセチE��・セクションごと�E�E,
    },
    // ------------------------------------------------------------------
    // 参老E��E��タブ相彁E EPRO/ENT
    // ------------------------------------------------------------------
    {
      key: 'table_of_contents',
      name: 'Table of Contents',
      nameJa: '目次生�E',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: '見�Eしスタイルから目次を�E動生成�E更新',
    },
    // ------------------------------------------------------------------
    // 校閲タブ相彁E
    // ------------------------------------------------------------------
    {
      key: 'spell_check',
      name: 'Spell Check',
      nameJa: 'スペルチェチE��',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '斁E��冁E��キスト�EスペルチェチE��・斁E��校正',
    },
    {
      key: 'word_count',
      name: 'Word Count',
      nameJa: '斁E��カウンチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '斁E��数・単語数・段落数・行数のカウント表示',
    },
    {
      key: 'track_changes',
      name: 'Track Changes',
      nameJa: '変更履歴の記録',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: '編雁E�E容の変更履歴を記録・承認�E却下！Eord 互換の変更追跡�E�E,
    },
    {
      key: 'protect_document',
      name: 'Protect Document',
      nameJa: '斁E��の保護',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '編雁E��限�Eパスワード保護・読み取り専用の設宁E,
    },
    // ------------------------------------------------------------------
    // フォーマット変換・チE��プレーチE E全プラン/PRO
    // ------------------------------------------------------------------
    {
      key: 'convert',
      name: 'Convert Format',
      nameJa: 'フォーマット変換',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'PDF・HTML・RTF・チE��スト等へのフォーマット変換',
    },
    {
      key: 'template',
      name: 'Template',
      nameJa: 'チE��プレーチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'チE��プレートから�Eドキュメント生戁E,
    },
    {
      key: 'mail_merge',
      name: 'Mail Merge',
      nameJa: '差し込み印刷',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'チE�Eタソース�E�Excel/CSV�E�から�E差し込み印刷・斁E��生�E',
    },
    {
      key: 'batch',
      name: 'Batch Processing',
      nameJa: 'バッチ�E琁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: '褁E��ドキュメント�E一括処琁E,
    },
    {
      key: 'macro',
      name: 'Macro Execution',
      nameJa: 'マクロ実衁E,
      type: 'boolean',
      allowedPlans: ['PRO', 'ENT'],
      descriptionJa: 'VBAマクロの実行�E変換',
    },
    // ------------------------------------------------------------------
    // AI・アシスタント機�E
    // ------------------------------------------------------------------
    {
      key: 'ai_assistant',
      name: 'AI Assistant',
      nameJa: 'AIアシスタンチE,
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるドキュメント�E校正・要紁E�E構�E提案！ETD: 朁E0囁E/ PRO: 朁E00囁E/ ENT: 無制限！E,
    },
    {
      key: 'ai_editor',
      name: 'AI Code Editor',
      nameJa: 'AIコードエチE��ター',
      type: 'limit',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるPythonコード�E生�E・編雁E��Wordを�E動�E琁E��ERO: 朁E00囁E/ ENT: 無制限！E,
    },
    {
      key: 'reference_materials',
      name: 'Reference Materials',
      nameJa: '参老E��E��',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '参老E��E��の添付�EAI コンチE��ストとしての活用',
    },
    {
      key: 'document_evaluation',
      name: 'Document Evaluation',
      nameJa: 'ドキュメント評価',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるWord斁E��の多角的評価・スコアリング・改喁E��案！Epus推奨・STD: 朁E0囁E/ PRO: 朁E00囁E/ ENT: 無制限！E,
    },
    {
      key: 'voice_input',
      name: 'Voice Input',
      nameJa: '音声入劁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '音声認識によるハンズフリー入劁E,
    },
    {
      key: 'vrm_avatar',
      name: 'VRM Avatar',
      nameJa: 'VRMアバター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'VRM 3Dアバターによる音声会話�E�ETS + STT + リチE�Eシンク�E�E,
    },
  ],

  // ========================================
  // InsightPy (INPY)
  // ========================================
  INPY: [
    {
      key: 'execute',
      name: 'Code Execution',
      nameJa: 'コード実衁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'Pythonコード�E実衁E,
    },
    {
      key: 'presets',
      name: 'Presets',
      nameJa: 'プリセチE��利用',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '定義済みスクリプトチE��プレート�E利用',
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
      nameJa: 'クラウド同朁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'スクリプトのクラウド同朁E,
    },
    {
      key: 'ai_editor',
      name: 'AI Code Editor',
      nameJa: 'AIコードエチE��ター',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるPythonコード�E生�E・編雁E�E構文検証・チE��チE��支援�E�ETD: 朁E0囁E/ PRO: 朁E00囁E/ ENT: 無制限！E,
    },
  ],

  // ========================================
  // InsightBot (INBT)
  // ========================================
  INBT: [
    {
      key: 'execute',
      name: 'Script Execution',
      nameJa: 'スクリプト実衁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'RPAスクリプトの実衁E,
    },
    {
      key: 'presets',
      name: 'Presets',
      nameJa: 'プリセチE��利用',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '定義済みスクリプトチE��プレート�E利用',
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
      nameJa: 'クラウド同朁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'JOBのクラウド同朁E,
    },
    {
      key: 'ai_editor',
      name: 'AI Code Editor',
      nameJa: 'AIコードエチE��ター',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによるPythonコード�E生�E・編雁E�E構文検証・チE��チE��支援�E�ETD: 朁E0囁E/ PRO: 朁E00囁E/ ENT: 無制限！E,
    },
    {
      key: 'orchestrator',
      name: 'Orchestrator',
      nameJa: 'オーケストレーター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'InsightOffice Agent の雁E��管琁E�EJOB配信・実行監要E,
    },
    {
      key: 'agents',
      name: 'Agent Management',
      nameJa: 'Agent管琁E,
      type: 'limit',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      limitValues: { TRIAL: 5, PRO: 50, ENT: -1 },
      descriptionJa: '管琁E��能な Agent�E�EnsightOffice 端末�E�数�E�ERO: 50台 / ENT: 無制限！E,
    },
    {
      key: 'scheduler',
      name: 'Job Scheduler',
      nameJa: 'JOBスケジューラー',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'JOBの定期実行スケジュール設定！Eron 相当！E,
    },
  ],

  // ========================================
  // InsightNoCodeAnalyzer (INCA)
  // ========================================
  INCA: [
    {
      key: 'rpa_analysis',
      name: 'RPA Analysis',
      nameJa: 'RPA解极E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'BizRobo等�ERPAソース解极E,
    },
    {
      key: 'lowcode_analysis',
      name: 'Low-code Analysis',
      nameJa: 'ローコード解极E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'Forguncy等�Eローコードツール解极E,
    },
    {
      key: 'migration_assessment',
      name: 'Migration Assessment',
      nameJa: '移行アセスメンチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '工数見積もり�E褁E��度刁E��',
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
      nameJa: 'JSON出劁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '解析結果のJSON形式�E劁E,
    },
    {
      key: 'export_markdown',
      name: 'Markdown Export',
      nameJa: 'Markdown出劁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '解析結果のMarkdown形式�E劁E,
    },
  ],

  // ========================================
  // InsightImageGen (INIG)
  // ========================================
  INIG: [
    {
      key: 'generate_image',
      name: 'Image Generation',
      nameJa: '画像生戁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'Stable Diffusionによる画像生戁E,
    },
    {
      key: 'batch_image',
      name: 'Batch Image Generation',
      nameJa: 'バッチ画像生戁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '褁E��画像�E一括生�E',
    },
    {
      key: 'generate_audio',
      name: 'Audio Generation',
      nameJa: '音声生�E',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'VOICEVOXによる音声生�E',
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
      nameJa: '高解像度出劁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: '高解像度画像�E生�E',
    },
    {
      key: 'cloud_sync',
      name: 'Cloud Sync',
      nameJa: 'クラウド同朁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'プロンプト・設定�Eクラウド同朁E,
    },
  ],

  // ========================================
  // InsightCast (INMV)
  // ========================================
  INMV: [
    {
      key: 'generate',
      name: 'Video Generation',
      nameJa: '動画生�E',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '画像�EチE��ストから動画を生戁E,
    },
    {
      key: 'subtitle',
      name: 'Subtitle',
      nameJa: '字幁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: '動画への字幕追加',
    },
    {
      key: 'subtitle_style',
      name: 'Subtitle Style',
      nameJa: '字幕スタイル選抁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: '字幕�Eフォント�E色・位置のカスタマイズ',
    },
    {
      key: 'transition',
      name: 'Transition',
      nameJa: 'トランジション',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'シーン間�Eトランジション効极E,
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
  // InsightSeniorOffice (ISOF)  ETier 4
  // シニア向け統合オフィスチE�Eル
  // ========================================
  ISOF: [
    {
      key: 'create_new',
      name: 'Create New Document',
      nameJa: '新規作�E',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'ENT'],
      descriptionJa: '空の Excel スプレチE��シート�EWord ドキュメントを新規作�E�E�ES Office 不要E��E,
    },
    {
      key: 'spreadsheet',
      name: 'Spreadsheet',
      nameJa: '表計箁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'ENT'],
      descriptionJa: 'Excelファイルの読み込み・編雁E�E保孁E,
    },
    {
      key: 'document',
      name: 'Document',
      nameJa: '斁E��作�E',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'ENT'],
      descriptionJa: 'Wordドキュメント�E読み込み・編雁E�E保孁E,
    },
    {
      key: 'icloud_mail',
      name: 'iCloud Mail',
      nameJa: 'iCloudメール',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'ENT'],
      descriptionJa: 'iCloudメールの送受信�E�EPhoneと同じメールをPCで閲覧�E�E,
    },
    {
      key: 'ai_assistant',
      name: 'AI Assistant',
      nameJa: 'AIアシスタンチE,
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, ENT: -1 },
      descriptionJa: 'AIによる自然言語操作支援�E�「A2に1丁E�E入れて」等）！ETD: 朁E0囁E/ ENT: 無制限！E,
    },
    {
      key: 'voice_input',
      name: 'Voice Input',
      nameJa: '音声入劁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'ENT'],
      descriptionJa: '音声認識によるハンズフリー入劁E,
    },
    {
      key: 'text_to_speech',
      name: 'Text to Speech',
      nameJa: '読み上げ',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'ENT'],
      descriptionJa: 'メール・斁E��の音声読み上げ',
    },
    {
      key: 'font_scaling',
      name: 'Font Scaling',
      nameJa: '斁E��サイズ調整',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'ENT'],
      descriptionJa: '斁E��サイズ50%、E00%の拡大縮封E,
    },
    {
      key: 'setup_wizard',
      name: 'Setup Wizard',
      nameJa: '初期設定ウィザーチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'ENT'],
      descriptionJa: '5スチE��プ�E簡単�E期設定（名前�Eメール・斁E��サイズ�E�E,
    },
    {
      key: 'tutorial',
      name: 'Tutorial',
      nameJa: 'チュートリアル',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'ENT'],
      descriptionJa: '10スチE��プ�E対話型ガイドツアー',
    },
    {
      key: 'print',
      name: 'Print',
      nameJa: '印刷',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'ENT'],
      descriptionJa: 'シニア向け大きい斁E��での印刷',
    },
    {
      key: 'contacts',
      name: 'Contacts',
      nameJa: '連絡先管琁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'ENT'],
      descriptionJa: '家族�E友人・痁E��等�Eグループ別連絡先管琁E,
    },
  ],

  // ========================================
  // InterviewInsight (IVIN)  ETier 1
  // 自動ヒアリング・業務調査支援
  // Syncfusion ej2-react-grids によるグリチE��機�E搭輁E
  // ========================================
  IVIN: [
    {
      key: 'interview_session',
      name: 'Interview Session',
      nameJa: 'インタビューセチE��ョン',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'AIインタビューセチE��ョンの作�E・実衁E,
    },
    {
      key: 'voice_input',
      name: 'Voice Input',
      nameJa: '音声入劁E,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: '音声認識によるインタビュー回答�E入劁E,
    },
    {
      key: 'voice_synthesis',
      name: 'Voice Synthesis',
      nameJa: '音声合�E',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'AI面接官�E質問読み上げ�E�ETS�E�E,
    },
    {
      key: 'excel_grid',
      name: 'Excel Grid View',
      nameJa: 'ExcelグリチE��表示',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'Syncfusion ej2-react-grids によるインタビュー結果の一覧表示・ソート�Eフィルタ',
    },
    {
      key: 'excel_import',
      name: 'Excel Import',
      nameJa: 'Excelインポ�EチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'Excel ファイルからのチE�Eタ取り込み�E�テンプレート�E回答老E�E案件の一括登録�E�E,
    },
    {
      key: 'excel_export',
      name: 'Excel Export',
      nameJa: 'Excelエクスポ�EチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'インタビュー結果のExcel形式エクスポ�EチE,
    },
    {
      key: 'ai_analysis',
      name: 'AI Analysis',
      nameJa: 'AI刁E��',
      type: 'limit',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      limitValues: { TRIAL: -1, STD: 50, PRO: 200, ENT: -1 },
      descriptionJa: 'AIによる回答�E構造化�E感情刁E��・課題抽出�E�ETD: 朁E0囁E/ PRO: 朁E00囁E/ ENT: 無制限！E,
    },
    {
      key: 'data_mart',
      name: 'Data Mart',
      nameJa: 'チE�Eタマ�EチE,
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'インタビュー結果の自動�E類�EナレチE��マ�Eト生戁E,
    },
    {
      key: 'search',
      name: 'Full-text Search',
      nameJa: '全斁E��索',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'STD', 'PRO', 'ENT'],
      descriptionJa: 'インタビュー回答�EハイブリチE��検索',
    },
    {
      key: 'vrm_avatar',
      name: 'VRM Avatar',
      nameJa: 'VRMアバター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: 'VRM 3Dアバターによる面接官キャラクター表示',
    },
    {
      key: 'batch_interview',
      name: 'Batch Interview',
      nameJa: 'バッチインタビュー',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'PRO', 'ENT'],
      descriptionJa: '褁E��回答老E��の一括インタビュー配信・管琁E,
    },
  ],
};

// =============================================================================
// プラン別制陁E
// =============================================================================

/** チE��ォルト�Eプラン別制陁E*/
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

/** InsightCast 専用のプラン別制陁E*/
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

/** 製品別のプラン制限�EチE��ング */
export const PRODUCT_PLAN_LIMITS: Partial<Record<ProductCode, Record<PlanCode, PlanLimits>>> = {
  INMV: INMV_PLAN_LIMITS,
};

// =============================================================================
// 機�EチェチE��関数�E�標準API�E�E
// =============================================================================

/**
 * 製品�Eプランの制限を取征E
 */
export function getPlanLimits(productCode: ProductCode, planCode: PlanCode): PlanLimits {
  const productLimits = PRODUCT_PLAN_LIMITS[productCode];
  if (productLimits && productLimits[planCode]) {
    return productLimits[planCode];
  }
  return DEFAULT_PLAN_LIMITS[planCode];
}

/**
 * 製品�E機�E一覧を取得（継承機�Eを含む�E�E
 */
export function getProductFeatures(product: ProductCode): FeatureDefinition[] {
  const productInfo = PRODUCTS[product];
  const ownFeatures = PRODUCT_FEATURES[product] || [];

  // 継承允E��ある場合�E継承允E�E機�Eも含める
  if (productInfo.inheritsFrom) {
    const inheritedFeatures = getProductFeatures(productInfo.inheritsFrom);
    // 継承允E�E機�E + 自身の機�E�E�重褁E��ーは自身が優先！E
    const ownKeys = new Set(ownFeatures.map(f => f.key));
    const merged = inheritedFeatures.filter(f => !ownKeys.has(f.key));
    return [...merged, ...ownFeatures];
  }

  return ownFeatures;
}

/**
 * 製品�E機�E定義を取征E
 */
export function getFeatureDefinition(product: ProductCode, featureKey: string): FeatureDefinition | null {
  const features = getProductFeatures(product);
  return features.find(f => f.key === featureKey) || null;
}

/**
 * 共通機�Eの定義を取征E
 */
export function getCommonFeatureDefinition(featureKey: string): FeatureDefinition | null {
  return COMMON_FEATURES.find(f => f.key === featureKey) || null;
}

/**
 * 製品固有�E機�Eが利用可能かチェチE��
 *
 * @param product 製品コーチE
 * @param featureKey 機�Eキー
 * @param plan プランコーチE
 * @returns 利用可能かどぁE��
 *
 * @example
 * checkProductFeature('INMV', 'subtitle', 'PRO')  // true
 * checkProductFeature('INMV', 'subtitle', 'FREE') // false
 */
export function checkProductFeature(product: ProductCode, featureKey: string, plan: PlanCode): boolean {
  const feature = getFeatureDefinition(product, featureKey);
  if (!feature) {
    // 未定義の機�Eはエラーを記録して拒否�E�安�E側�E�E
    console.error(`[License] Unknown product feature: ${product}/${featureKey}`);
    return false;
  }
  return feature.allowedPlans.includes(plan);
}

/**
 * 共通機�Eが利用可能かチェチE��
 *
 * @param featureKey 機�Eキー
 * @param plan プランコーチE
 * @returns 利用可能かどぁE��
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
 * 機�Eが利用可能かチェチE���E�製品固朁E+ 共通を自動判定！E
 *
 * @param product 製品コーチE
 * @param featureKey 機�Eキー
 * @param plan プランコーチE
 * @returns 利用可能かどぁE��
 */
export function checkFeature(product: ProductCode, featureKey: string, plan: PlanCode): boolean {
  // まず製品固有�E機�Eを確誁E
  const productFeature = getFeatureDefinition(product, featureKey);
  if (productFeature) {
    return productFeature.allowedPlans.includes(plan);
  }

  // 次に共通機�Eを確誁E
  const commonFeature = getCommonFeatureDefinition(featureKey);
  if (commonFeature) {
    return commonFeature.allowedPlans.includes(plan);
  }

  // どちらにも見つからなぁE
  console.error(`[License] Unknown feature: ${product}/${featureKey}`);
  return false;
}

/**
 * 機�Eの数値制限を取征E
 *
 * @returns 制限値�E�E1 = 無制限、null = 制限機�EではなぁE��E
 */
export function getFeatureLimit(product: ProductCode, featureKey: string, plan: PlanCode): number | null {
  const feature = getFeatureDefinition(product, featureKey);
  if (!feature || feature.type !== 'limit') {
    return null;
  }
  return feature.limitValues?.[plan] ?? -1;
}

/**
 * 製品�E機�E可否一覧を取得！EI表示用�E�E
 *
 * @param product 製品コーチE
 * @param plan プランコーチE
 * @param includeCommon 共通機�Eを含めるか（デフォルチE true�E�E
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
 * プランが別のプラン以上かチェチE��
 *
 * 注愁E TRIALは全機�E使えるため特殊扱ぁE��常にtrue�E�E
 */
export function isPlanAtLeast(userPlan: PlanCode, requiredPlan: PlanCode): boolean {
  if (userPlan === 'TRIAL') {
    return true;
  }
  return PLANS[userPlan].priority >= PLANS[requiredPlan].priority;
}

/**
 * プラン表示名を取征E
 */
export function getPlanDisplayName(plan: PlanCode, locale: 'en' | 'ja' = 'ja'): string {
  const planInfo = PLANS[plan];
  return locale === 'ja' ? planInfo.nameJa : planInfo.name;
}

/**
 * 製品表示名を取征E
 */
export function getProductDisplayName(product: ProductCode, locale: 'en' | 'ja' = 'ja'): string {
  const productInfo = PRODUCTS[product];
  return locale === 'ja' ? productInfo.nameJa : productInfo.name;
}

/**
 * 機�Eに忁E��な最低�Eランを取征E
 *
 * TRIAL は評価用の特殊�Eランのため除外し、購入可能なプラン�E�ETD/PRO/ENT�E�かめE
 * 最低要件を返す。TRIAL のみで利用可能な機�Eは 'TRIAL' を返す、E
 */
export function getRequiredPlan(product: ProductCode, featureKey: string): PlanCode | null {
  const feature = getFeatureDefinition(product, featureKey)
    || getCommonFeatureDefinition(featureKey);

  if (!feature || feature.allowedPlans.length === 0) {
    return null;
  }

  // TRIAL を除外した購入可能プランで最佁Epriority を探ぁE
  const purchasablePlans = feature.allowedPlans.filter(p => p !== 'TRIAL');
  if (purchasablePlans.length === 0) {
    // TRIAL のみで利用可能な機�E�E�通常はなぁE��安�E側で対応！E
    return 'TRIAL';
  }

  return purchasablePlans.reduce((min, plan) => {
    return PLANS[plan].priority < PLANS[min].priority ? plan : min;
  });
}

// =============================================================================
// プロジェクトファイル
// =============================================================================

/**
 * 拡張子から�Eロジェクトファイル対応製品を解決
 *
 * @param extension 拡張子（ドチE��なし！E
 * @returns 対応する製品コード、また�E null
 *
 * @example
 * resolveProductByExtension('iosh')  // 'IOSH'
 * resolveProductByExtension('xlsx')  // null�E�独自拡張子ではなぁE��E
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
 * コンチE��ストメニュー対象の拡張子から対応製品を検索
 *
 * @param extension ファイルの拡張子（ドチE��なし！E
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
 * 製品�Eプロジェクトファイル設定を取征E
 */
export function getProjectFileConfig(product: ProductCode): ProjectFileConfig | null {
  return PRODUCTS[product].projectFile ?? null;
}

/**
 * Windows レジストリに登録すべきファイル関連付け惁E��を生戁E
 *
 * インスト�Eラー�E�Enno Setup / WiX 等）での利用を想定、E
 *
 * @example
 * const reg = getFileAssociationInfo('IOSH');
 * // {
 * //   progId: 'HarmonicInsight.InsightOfficeSheet',
 * //   extension: '.iosh',
 * //   mimeType: 'application/x-insightoffice-sheet',
 * //   description: 'InsightOfficeSheet プロジェクチE,
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
// アイコン
// =============================================================================

/** ユーチE��リチE��アプリのマスターアイコン定義 */
export const UTILITY_ICONS: Record<string, {
  name: string;
  nameJa: string;
  masterIcon: string;
  targetPlatform: AppPlatform;
  iconBuildPath: string;
}> = {
  LAUNCHER: { name: 'InsightLauncher', nameJa: 'Insight Launcher', masterIcon: 'brand/icons/png/icon-launcher.png', targetPlatform: 'wpf', iconBuildPath: 'Resources/' },
  CAMERA: { name: 'InsightCamera', nameJa: 'スチE��リカメラ', masterIcon: 'brand/icons/png/icon-camera.png', targetPlatform: 'android_native', iconBuildPath: 'app/src/main/res/' },
  VOICE_CLOCK: { name: 'InsightVoiceClock', nameJa: 'Insight Voice Clock', masterIcon: 'brand/icons/png/icon-voice-clock.png', targetPlatform: 'expo', iconBuildPath: 'assets/' },
  QR: { name: 'InsightQR', nameJa: 'Insight QR', masterIcon: 'brand/icons/png/icon-qr.png', targetPlatform: 'expo', iconBuildPath: 'assets/' },
  PINBOARD: { name: 'InsightPinBoard', nameJa: 'Insight PinBoard', masterIcon: 'brand/icons/png/icon-pinboard.png', targetPlatform: 'expo', iconBuildPath: 'assets/' },
  VOICE_MEMO: { name: 'InsightVoiceMemo', nameJa: 'Insight Voice Memo', masterIcon: 'brand/icons/png/icon-voice-memo.png', targetPlatform: 'expo', iconBuildPath: 'assets/' },
};

/**
 * 製品コードから�Eスターアイコンのパスを取征E
 *
 * @param productCode 製品コーチE
 * @returns リポジトリルートから�E相対パス
 *
 * @example
 * getMasterIconPath('IOSH')  // 'brand/icons/png/icon-insight-sheet.png'
 */
export function getMasterIconPath(productCode: ProductCode): string {
  return PRODUCTS[productCode].masterIcon;
}

/**
 * 全アイコン�E�製品E+ ユーチE��リチE���E��E一覧を取征E
 */
export function getAllIcons(): Array<{
  key: string;
  name: string;
  nameJa: string;
  masterIcon: string;
  targetPlatform: AppPlatform;
  iconBuildPath: string;
  isProduct: boolean;
}> {
  const productIcons = Object.values(PRODUCTS).map(p => ({
    key: p.code,
    name: p.name,
    nameJa: p.nameJa,
    masterIcon: p.masterIcon,
    targetPlatform: p.targetPlatform,
    iconBuildPath: p.iconBuildPath,
    isProduct: true,
  }));
  const utilityIcons = Object.entries(UTILITY_ICONS).map(([key, v]) => ({
    key,
    name: v.name,
    nameJa: v.nameJa,
    masterIcon: v.masterIcon,
    targetPlatform: v.targetPlatform,
    iconBuildPath: v.iconBuildPath,
    isProduct: false,
  }));
  return [...productIcons, ...utilityIcons];
}

// =============================================================================
// 後方互換性�E�非推奨�E�E
// =============================================================================

/**
 * フラチE��な機�Eマトリクス
 * @deprecated 新規実裁E��は checkProductFeature / checkCommonFeature を使用
 */
export const FEATURE_MATRIX: Record<string, PlanCode[]> = (() => {
  const matrix: Record<string, PlanCode[]> = {};

  // 共通機�Eを追加
  for (const feature of COMMON_FEATURES) {
    matrix[feature.key] = [...feature.allowedPlans];
  }

  // 製品別機�Eを追加
  for (const [productCode, features] of Object.entries(PRODUCT_FEATURES)) {
    for (const feature of features) {
      // プレフィチE��ス付き: inmv_subtitle
      const prefixedKey = `${productCode.toLowerCase()}_${feature.key}`;
      matrix[prefixedKey] = [...feature.allowedPlans];

      // プレフィチE��スなし（後方互換性�E�E
      if (!matrix[feature.key]) {
        matrix[feature.key] = [...feature.allowedPlans];
      }
    }
  }

  return matrix;
})();

/**
 * @deprecated 新規実裁E��は checkProductFeature / checkCommonFeature を使用
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
// エクスポ�EチE
// =============================================================================

export default {
  // 定義チE�Eタ
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

  // アイコン
  UTILITY_ICONS,
  getMasterIconPath,
  getAllIcons,

  // 後方互換�E�非推奨�E�E
  FEATURE_MATRIX,
  canAccessFeature,
};
