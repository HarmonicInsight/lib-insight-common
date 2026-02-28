/**
 * HARMONIC insight 製品・プラン・機能定義
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
 * 5. 型安全性を重視（製品と機能の組み合わせを保証）
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
export type ProductCode = 'INSS' | 'IOSH' | 'IOSD' | 'ISOF' | 'INPY' | 'INMV' | 'INBT' | 'INCA' | 'INIG' | 'IVIN';

/**
 * プランコード（全製品＝法人向け B2B Only）
 *
 * FREE:  ライセンス不要。基本機能のみ。ダウンロード→すぐ使える
 * TRIAL: 全機能無制限（1ヶ月間）。自社が発行
 * BIZ:   法人1端末。全機能（AI月200回・Standardティア）
 * ENT:   法人複数端末。全機能＋コラボレーション（AI無制限・Premiumティア）
 */
export type PlanCode = 'FREE' | 'TRIAL' | 'BIZ' | 'ENT';

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
  /**
   * AI メモリ対応フラグ
   *
   * true の場合、プロジェクトファイル内に以下のメモリファイルを格納:
   * - ai_memory.json（ホットキャッシュ）
   * - ai_memory_deep/（ディープストレージ: ENT のみ）
   *
   * 参照: config/ai-memory.ts
   */
  supportsAiMemory?: boolean;
}

/** アプリのターゲットプラットフォーム */
export type AppPlatform = 'wpf' | 'python' | 'tauri' | 'expo' | 'android_native' | 'ios_native' | 'web' | 'service';

/** 製品情報 */
export interface ProductInfo {
  code: ProductCode;
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
  /** マスターアイコン PNG パス（リポジトリルートからの相対パス） */
  masterIcon: string;
  /** ターゲットプラットフォーム（アイコン生成・ビルド設定に使用） */
  targetPlatform: AppPlatform;
  /** ビルド時のアイコン配置先パス（アプリリポジトリからの相対パス） */
  iconBuildPath: string;
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
 *   allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
 * }
 *
 * @example 数値制限機能
 * {
 *   key: 'scripts',
 *   name: 'Script Storage',
 *   nameJa: 'スクリプト保存数',
 *   type: 'limit',
 *   allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
 *   limitValues: { TRIAL: -1, BIZ: -1, ENT: -1 },
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
    masterIcon: 'brand/icons/png/icon-insight-nca.png',
    targetPlatform: 'tauri',
    iconBuildPath: 'src-tauri/icons/',
  },
  INBT: {
    code: 'INBT',
    name: 'InsightBot',
    nameJa: 'InsightBot',
    description: 'AI editor-equipped business optimization RPA + Orchestrator',
    descriptionJa: 'AIエディタ搭載 — 業務最適化RPA + Orchestrator',
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
  // Tier 2: AI活用ツール（中単価）
  // =========================================================================

  INMV: {
    code: 'INMV',
    name: 'InsightCast',
    nameJa: 'InsightCast',
    description: 'Automated video creation from images and text',
    descriptionJa: '画像とテキストから動画を自動作成',
    masterIcon: 'brand/icons/png/icon-insight-cast.png',
    targetPlatform: 'python',
    iconBuildPath: 'resources/',
  },
  INIG: {
    code: 'INIG',
    name: 'InsightImageGen',
    nameJa: 'InsightImageGen',
    description: 'AI bulk image generation tool for business materials',
    descriptionJa: '業務資料向けAI画像の大量自動生成ツール',
    masterIcon: 'brand/icons/png/icon-insight-imagegen.png',
    targetPlatform: 'python',
    iconBuildPath: 'resources/',
  },

  // =========================================================================
  // Tier 3: Insight Business Suite（コンサル導入ツール）
  // =========================================================================

  INSS: {
    code: 'INSS',
    name: 'Insight Deck Quality Gate',
    nameJa: 'Insight Deck Quality Gate',
    description: 'AI-powered presentation quality gate — review, extract & automate slide decks',
    descriptionJa: 'AIアシスタント搭載 — プレゼン資料の品質管理・抽出・自動化ツール',
    masterIcon: 'brand/icons/png/icon-insight-slide.png',
    targetPlatform: 'wpf',
    iconBuildPath: 'Resources/',
    projectFile: {
      extension: 'inss',
      mimeType: 'application/x-insightoffice-slide',
      description: 'Insight Deck Quality Gate Project',
      descriptionJa: 'Insight Deck Quality Gate プロジェクト',
      iconFileName: 'inss-file.ico',
      innerDocumentFormat: '.pptx',
      contextMenuLabel: 'Open with Insight Deck Quality Gate',
      contextMenuLabelJa: 'Insight Deck Quality Gate で開く',
      contextMenuTargetExtensions: ['pptx', 'ppt'],
      supportsAiMemory: true,
    },
  },
  IOSH: {
    code: 'IOSH',
    name: 'Insight Performance Management',
    nameJa: 'Insight Performance Management',
    description: 'AI-powered performance management tool for business metrics and financial analysis',
    descriptionJa: 'AIアシスタント搭載 — 経営数値管理・財務分析ツール',
    masterIcon: 'brand/icons/png/icon-insight-sheet.png',
    targetPlatform: 'wpf',
    iconBuildPath: 'Resources/',
    projectFile: {
      extension: 'iosh',
      mimeType: 'application/x-insightoffice-sheet',
      description: 'Insight Performance Management Project',
      descriptionJa: 'Insight Performance Management プロジェクト',
      iconFileName: 'iosh-file.ico',
      innerDocumentFormat: '.xlsx',
      contextMenuLabel: 'Open with Insight Performance Management',
      contextMenuLabelJa: 'Insight Performance Management で開く',
      contextMenuTargetExtensions: ['xlsx', 'xls', 'csv'],
      supportsAiMemory: true,
    },
  },
  IOSD: {
    code: 'IOSD',
    name: 'Insight AI Briefcase',
    nameJa: 'Insight AI Briefcase',
    description: 'AI-powered business document management briefcase — MS Office not required',
    descriptionJa: 'AIアシスタント搭載 — 業務文書一括管理ブリーフケース（MS Office 不要）',
    masterIcon: 'brand/icons/png/icon-insight-doc.png',
    targetPlatform: 'wpf',
    iconBuildPath: 'Resources/',
    projectFile: {
      extension: 'iosd',
      mimeType: 'application/x-insightoffice-doc',
      description: 'Insight AI Briefcase Project',
      descriptionJa: 'Insight AI Briefcase プロジェクト',
      iconFileName: 'iosd-file.ico',
      innerDocumentFormat: '.docx',
      contextMenuLabel: 'Open with Insight AI Briefcase',
      contextMenuLabelJa: 'Insight AI Briefcase で開く',
      contextMenuTargetExtensions: ['docx', 'doc'],
      supportsAiMemory: true,
    },
  },
  INPY: {
    code: 'INPY',
    name: 'InsightPy',
    nameJa: 'InsightPy',
    description: 'AI editor-equipped Python execution platform for business automation',
    descriptionJa: 'AIエディタ搭載 — 業務調査・データ収集のためのPython実行基盤',
    masterIcon: 'brand/icons/png/icon-insight-py.png',
    targetPlatform: 'python',
    iconBuildPath: 'resources/',
  },

  // =========================================================================
  // Tier 4: Insight Senior Office（シニア向け社会貢献ツール）
  // =========================================================================

  ISOF: {
    code: 'ISOF',
    name: 'InsightSeniorOffice',
    nameJa: 'InsightSeniorOffice',
    description: 'AI-assisted office suite for senior users — spreadsheet, document, and iCloud email in one simple app',
    descriptionJa: 'AIアシスタント搭載 — シニア向け統合オフィスツール（表計算・文書・iCloudメール）',
    masterIcon: 'brand/icons/png/icon-senior-office.png',
    targetPlatform: 'wpf',
    iconBuildPath: 'Resources/',
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
    priority: 1,
    description: 'Basic features without license (unlimited)',
    descriptionJa: 'ライセンス不要・基本機能のみ（無期限）',
    defaultDurationDays: -1,  // 無期限
  },
  TRIAL: {
    code: 'TRIAL',
    name: 'Trial',
    nameJa: 'トライアル',
    priority: 4,  // 全機能使えるため最上位と同等
    description: 'Full features for evaluation (1 month, issued by HARMONIC insight)',
    descriptionJa: '全機能利用可能（1ヶ月間・自社発行）',
    defaultDurationDays: 30,
  },
  BIZ: {
    code: 'BIZ',
    name: 'Business',
    nameJa: 'ビジネス',
    priority: 3,
    description: 'All features for single PC use — AI 200/month Standard tier (365 days)',
    descriptionJa: '法人1端末・全機能 — AI月200回・Standardティア（365日）',
    defaultDurationDays: 365,
  },
  ENT: {
    code: 'ENT',
    name: 'Enterprise',
    nameJa: 'エンタープライズ',
    priority: 4,
    description: 'All features + collaboration — AI unlimited Premium tier',
    descriptionJa: '法人複数端末・全機能＋コラボレーション — AI無制限・Premiumティア（要相談）',
    defaultDurationDays: -1,
  },
};

// =============================================================================
// 共通機能（全製品で利用可能）
// =============================================================================

/**
 * 全製品共通の機能
 * - Enterprise専用機能など、製品に依存しないものを定義
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
    allowedPlans: ['BIZ', 'ENT'],
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
  // Insight Deck Quality Gate (INSS) — Tier 3
  // AIアシスタント搭載PowerPointツール
  // ========================================
  INSS: [
    // ------------------------------------------------------------------
    // 基本操作（ファイルタブ相当） — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'create_new',
      name: 'Create New Presentation',
      nameJa: '新規プレゼンテーション作成',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '空の PowerPoint プレゼンテーションを新規作成（MS Office 不要）',
    },
    {
      key: 'slide_edit',
      name: 'Slide Editing',
      nameJa: 'スライド編集',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スライドのテキスト・レイアウト編集（MS Office 不要 — Syncfusion エンジン）',
    },
    {
      key: 'save_as',
      name: 'Save As',
      nameJa: '名前を付けて保存',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '.pptx / .ppt 形式での保存',
    },
    {
      key: 'print',
      name: 'Print',
      nameJa: '印刷',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スライドの印刷（配布資料・ノート付き・複数スライドページ対応）',
    },
    {
      key: 'pdf_export',
      name: 'PDF Export',
      nameJa: 'PDF出力',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'プレゼンテーションをPDF形式でエクスポート',
    },
    {
      key: 'undo_redo',
      name: 'Undo / Redo',
      nameJa: '元に戻す・やり直し',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '操作の取り消し・やり直し（複数レベル対応）',
    },
    {
      key: 'clipboard',
      name: 'Clipboard',
      nameJa: 'クリップボード',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'コピー・切り取り・貼り付け・形式を選択して貼り付け',
    },
    // ------------------------------------------------------------------
    // ホームタブ相当（テキスト書式・スライド操作） — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'text_formatting',
      name: 'Text Formatting',
      nameJa: 'テキスト書式',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'フォント（種類・サイズ・太字・斜体・下線・影・色）、段落（配置・行間・箇条書き・番号付き）',
    },
    {
      key: 'slide_management',
      name: 'Slide Management',
      nameJa: 'スライド操作',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スライドの追加・複製・削除・並べ替え・レイアウト変更・セクション管理',
    },
    {
      key: 'find_replace',
      name: 'Find & Replace',
      nameJa: '検索・置換',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スライド内テキストの検索・一括置換',
    },
    // ------------------------------------------------------------------
    // 挿入タブ相当 — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'insert_image',
      name: 'Insert Image',
      nameJa: '画像挿入',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '画像ファイルの挿入・トリミング・サイズ変更・位置調整',
    },
    {
      key: 'insert_shape',
      name: 'Insert Shape',
      nameJa: '図形挿入',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '図形・矢印・吹き出し・テキストボックス・ワードアートの挿入・書式設定',
    },
    {
      key: 'insert_table',
      name: 'Insert Table',
      nameJa: '表の挿入',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スライドへの表の挿入・行列追加・セル結合・スタイル設定',
    },
    {
      key: 'insert_chart',
      name: 'Insert Chart',
      nameJa: 'グラフの挿入',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '棒・折れ線・円・散布図等のグラフをスライドに挿入・データ編集',
    },
    {
      key: 'insert_smartart',
      name: 'Insert SmartArt',
      nameJa: 'SmartArt挿入',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'SmartArt（リスト・手順・循環・階層・関係等）の挿入・編集',
    },
    {
      key: 'insert_media',
      name: 'Insert Media',
      nameJa: 'メディア挿入',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '動画・音声ファイルの挿入・再生設定',
    },
    {
      key: 'hyperlink',
      name: 'Hyperlink',
      nameJa: 'ハイパーリンク',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'テキスト・オブジェクトへのハイパーリンク挿入（URL・スライド内・メール）',
    },
    {
      key: 'comments',
      name: 'Comments',
      nameJa: 'コメント',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スライドへのコメント挿入・返信・解決',
    },
    {
      key: 'header_footer',
      name: 'Header & Footer',
      nameJa: 'ヘッダーとフッター',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スライド番号・日付・フッターテキストの設定',
    },
    // ------------------------------------------------------------------
    // デザインタブ相当
    // ------------------------------------------------------------------
    {
      key: 'design_theme',
      name: 'Design Theme',
      nameJa: 'デザインテーマ',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'テーマ・バリエーションの適用・配色/フォント/効果のカスタマイズ',
    },
    {
      key: 'slide_size',
      name: 'Slide Size',
      nameJa: 'スライドのサイズ',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スライドサイズの設定（標準 4:3 / ワイド 16:9 / カスタム）',
    },
    {
      key: 'slide_master',
      name: 'Slide Master',
      nameJa: 'スライドマスター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スライドマスター・レイアウトの編集によるデザイン統一',
    },
    // ------------------------------------------------------------------
    // 画面切り替え・アニメーションタブ相当 — BIZ/ENT
    // ------------------------------------------------------------------
    {
      key: 'slide_transition',
      name: 'Slide Transition',
      nameJa: 'スライド切替効果',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スライド間のトランジション効果の設定（フェード・プッシュ・ワイプ等）',
    },
    {
      key: 'animation',
      name: 'Animation',
      nameJa: 'アニメーション',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'オブジェクトのアニメーション効果（開始・強調・終了・軌跡）の設定・タイミング調整',
    },
    // ------------------------------------------------------------------
    // オブジェクト操作（書式タブ相当） — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'object_formatting',
      name: 'Object Formatting',
      nameJa: 'オブジェクト書式',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '図形・画像の塗りつぶし・枠線・効果（影・反射・光彩）・サイズ・回転',
    },
    {
      key: 'arrange_objects',
      name: 'Arrange Objects',
      nameJa: 'オブジェクトの整列',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'オブジェクトの整列・配置・グループ化・前面/背面移動・回転',
    },
    // ------------------------------------------------------------------
    // スライドショータブ相当 — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'slideshow',
      name: 'Slide Show',
      nameJa: 'スライドショー',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スライドショーの再生（最初から・現在のスライドから）',
    },
    {
      key: 'presenter_view',
      name: 'Presenter View',
      nameJa: '発表者ツール',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '発表者ツール（ノート表示・次スライドプレビュー・タイマー・レーザーポインター）',
    },
    {
      key: 'speaker_notes',
      name: 'Speaker Notes',
      nameJa: '発表者ノート',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スライドごとの発表者メモの編集・印刷',
    },
    // ------------------------------------------------------------------
    // 校閲タブ相当
    // ------------------------------------------------------------------
    {
      key: 'spell_check',
      name: 'Spell Check',
      nameJa: 'スペルチェック',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スライド内テキストのスペルチェック',
    },
    // ------------------------------------------------------------------
    // 独自機能（Insight Business Suite 固有）
    // ------------------------------------------------------------------
    {
      key: 'extract',
      name: 'Content Extraction',
      nameJa: 'コンテンツ抽出',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'PowerPointからテキスト・画像を抽出',
    },
    {
      key: 'update',
      name: 'Content Update',
      nameJa: 'コンテンツ更新',
      type: 'limit',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: -1, ENT: -1 },
      descriptionJa: 'スライドの一括更新',
    },
    {
      key: 'json',
      name: 'JSON I/O',
      nameJa: 'JSON入出力',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'JSON形式でのデータ入出力',
    },
    {
      key: 'batch',
      name: 'Batch Processing',
      nameJa: 'フォルダ一括処理',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '複数ファイルの一括処理',
    },
    {
      key: 'compare',
      name: 'File Compare',
      nameJa: '2ファイル比較',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '2つのPowerPointファイルの差分比較',
    },
    {
      key: 'auto_backup',
      name: 'Auto Backup',
      nameJa: '自動バックアップ',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '編集前の自動バックアップ作成',
    },
    // ------------------------------------------------------------------
    // AI・アシスタント機能
    // ------------------------------------------------------------------
    {
      key: 'ai_assistant',
      name: 'AI Assistant',
      nameJa: 'AIアシスタント',
      type: 'limit',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 },
      descriptionJa: 'AIによるスライドテキストの校正・改善提案（BIZ: 月200回 / ENT: 無制限）',
    },
    {
      key: 'ai_editor',
      name: 'AI Code Editor',
      nameJa: 'AIコードエディター',
      type: 'limit',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 },
      descriptionJa: 'AIによるPythonコードの生成・編集でPowerPointを自動処理（BIZ: 月200回 / ENT: 無制限）',
    },
    {
      key: 'reference_materials',
      name: 'Reference Materials',
      nameJa: '参考資料',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '参考資料の添付・AI コンテキストとしての活用',
    },
    {
      key: 'document_evaluation',
      name: 'Document Evaluation',
      nameJa: 'ドキュメント評価',
      type: 'limit',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 },
      descriptionJa: 'AIによるプレゼンテーションの多角的評価・スコアリング・改善提案（Opus推奨・BIZ: 月200回 / ENT: 無制限）',
    },
    {
      key: 'voice_input',
      name: 'Voice Input',
      nameJa: '音声入力',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '音声認識によるハンズフリー入力',
    },
    {
      key: 'vrm_avatar',
      name: 'VRM Avatar',
      nameJa: 'VRMアバター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'ENT'],
      descriptionJa: 'VRM 3Dアバターによる音声会話（TTS + STT + リップシンク）',
    },
  ],

  // ========================================
  // Insight Performance Management (IOSH) — Tier 3
  // AIアシスタント搭載 経営数値管理ツール
  // ========================================
  IOSH: [
    // ------------------------------------------------------------------
    // 基本操作（ファイル・ホームタブ相当） — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'create_new',
      name: 'Create New Spreadsheet',
      nameJa: '新規スプレッドシート作成',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '空の Excel スプレッドシートを新規作成（MS Office 不要）',
    },
    {
      key: 'read_excel',
      name: 'Read Excel',
      nameJa: 'Excel読み込み・編集',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'Excelファイルの読み込み・編集・保存（MS Office 不要 — Syncfusion エンジン）',
    },
    {
      key: 'save_as',
      name: 'Save As',
      nameJa: '名前を付けて保存',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '.xlsx / .xls / .csv / .tsv 形式での保存',
    },
    {
      key: 'print',
      name: 'Print',
      nameJa: '印刷',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スプレッドシートの印刷（範囲指定・ヘッダーフッター・改ページ設定対応）',
    },
    {
      key: 'pdf_export',
      name: 'PDF Export',
      nameJa: 'PDF出力',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スプレッドシートをPDF形式でエクスポート',
    },
    {
      key: 'undo_redo',
      name: 'Undo / Redo',
      nameJa: '元に戻す・やり直し',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '操作の取り消し・やり直し（複数レベル対応）',
    },
    {
      key: 'clipboard',
      name: 'Clipboard',
      nameJa: 'クリップボード',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'コピー・切り取り・貼り付け・形式を選択して貼り付け',
    },
    // ------------------------------------------------------------------
    // セル書式設定（ホームタブ — フォント・配置・数値） — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'cell_formatting',
      name: 'Cell Formatting',
      nameJa: 'セル書式設定',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'フォント（種類・サイズ・太字・斜体・下線・色）、セル背景色・罫線の設定',
    },
    {
      key: 'number_format',
      name: 'Number Format',
      nameJa: '表示形式',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '数値・通貨・日付・パーセント・会計・分類・文字列等のセル表示形式設定',
    },
    {
      key: 'alignment',
      name: 'Alignment',
      nameJa: '配置',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '水平・垂直配置、折り返し、縮小して全体を表示、インデント、テキスト方向',
    },
    {
      key: 'merge_cells',
      name: 'Merge Cells',
      nameJa: 'セルの結合',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'セルの結合・結合解除（横方向・縦方向・結合して中央揃え）',
    },
    // ------------------------------------------------------------------
    // 行・列・シート操作 — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'row_column_ops',
      name: 'Row & Column Operations',
      nameJa: '行と列の操作',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '行・列の挿入・削除・非表示・再表示・高さ/幅の調整・自動調整',
    },
    {
      key: 'sheet_management',
      name: 'Sheet Management',
      nameJa: 'シート管理',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'シートの追加・削除・名前変更・移動・コピー・タブ色設定・非表示/再表示',
    },
    {
      key: 'freeze_panes',
      name: 'Freeze Panes',
      nameJa: 'ウィンドウ枠の固定',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '先頭行・先頭列・任意セル位置でのウィンドウ枠固定',
    },
    // ------------------------------------------------------------------
    // 数式・関数（数式タブ相当） — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'formulas',
      name: 'Formulas & Functions',
      nameJa: '数式と関数',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '数式入力・関数挿入（SUM / VLOOKUP / IF / COUNT 等 400+ 関数）、オートSUM',
    },
    {
      key: 'named_ranges',
      name: 'Named Ranges',
      nameJa: '名前の定義',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'セル範囲への名前定義・名前の管理・数式での名前参照',
    },
    {
      key: 'formula_auditing',
      name: 'Formula Auditing',
      nameJa: '数式の検証',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '参照元/参照先トレース・エラーチェック・数式の評価',
    },
    // ------------------------------------------------------------------
    // 検索・フィルタ・並べ替え — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'find_replace',
      name: 'Find & Replace',
      nameJa: '検索・置換',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'セル値の検索・一括置換（正規表現対応）',
    },
    {
      key: 'sort_filter',
      name: 'Sort & Filter',
      nameJa: 'ソート・フィルタ',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '列のソート・オートフィルタ・カスタムフィルタ・色フィルタ',
    },
    {
      key: 'auto_fill',
      name: 'Auto Fill',
      nameJa: 'オートフィル',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '連続データの自動入力（数値・日付・曜日・カスタムリスト）',
    },
    // ------------------------------------------------------------------
    // 挿入タブ相当 — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'chart',
      name: 'Chart',
      nameJa: 'グラフ作成',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '棒・折れ線・円・散布図・面・レーダー等のグラフ作成・編集（Syncfusion Chart）',
    },
    {
      key: 'insert_image',
      name: 'Insert Image',
      nameJa: '画像の挿入',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '画像ファイルの挿入・サイズ変更・位置調整',
    },
    {
      key: 'insert_shape',
      name: 'Insert Shape',
      nameJa: '図形の挿入',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '図形・テキストボックス・ワードアートの挿入',
    },
    {
      key: 'hyperlink',
      name: 'Hyperlink',
      nameJa: 'ハイパーリンク',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'セルへのハイパーリンクの挿入・編集（URL・メール・シート内参照）',
    },
    {
      key: 'comments',
      name: 'Comments',
      nameJa: 'コメント',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'セルへのコメント挿入・編集・削除・スレッド表示',
    },
    // ------------------------------------------------------------------
    // ページレイアウトタブ相当 — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'page_setup',
      name: 'Page Setup',
      nameJa: 'ページ設定',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '用紙サイズ・余白・印刷の向き・拡大縮小・印刷範囲・改ページの設定',
    },
    // ------------------------------------------------------------------
    // データタブ相当（上級） — BIZ/ENT
    // ------------------------------------------------------------------
    {
      key: 'conditional_formatting',
      name: 'Conditional Formatting',
      nameJa: '条件付き書式',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'セル値に応じた自動書式設定（カラースケール・データバー・アイコンセット）',
    },
    {
      key: 'pivot_table',
      name: 'Pivot Table',
      nameJa: 'ピボットテーブル',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'データの集計・クロス分析（Syncfusion Pivot Table）',
    },
    {
      key: 'data_validation',
      name: 'Data Validation',
      nameJa: 'データ入力規則',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'セルへの入力制限・ドロップダウンリスト・エラーメッセージ設定',
    },
    {
      key: 'text_to_columns',
      name: 'Text to Columns',
      nameJa: '区切り位置',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'テキストデータを区切り文字で複数列に分割',
    },
    {
      key: 'remove_duplicates',
      name: 'Remove Duplicates',
      nameJa: '重複の削除',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '選択範囲内の重複データを検出・削除',
    },
    {
      key: 'group_outline',
      name: 'Group & Outline',
      nameJa: 'グループ化とアウトライン',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '行・列のグループ化・アウトライン表示・小計',
    },
    {
      key: 'goal_seek',
      name: 'Goal Seek',
      nameJa: 'ゴールシーク',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '目標値に対するセル値の逆算（What-If 分析）',
    },
    // ------------------------------------------------------------------
    // 校閲タブ相当
    // ------------------------------------------------------------------
    {
      key: 'spell_check',
      name: 'Spell Check',
      nameJa: 'スペルチェック',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'セル内テキストのスペルチェック',
    },
    {
      key: 'protect_sheet',
      name: 'Protect Sheet / Workbook',
      nameJa: 'シート・ブックの保護',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'シート保護（パスワード付き）・ブック構成の保護・セルのロック/解除',
    },
    // ------------------------------------------------------------------
    // 独自機能（Insight Business Suite 固有）
    // ------------------------------------------------------------------
    {
      key: 'version_control',
      name: 'Version Control',
      nameJa: 'バージョン管理',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'ファイルのバージョン管理・履歴保持',
    },
    {
      key: 'diff_compare',
      name: 'Diff Compare',
      nameJa: '差分比較',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'バージョン間のセル差分比較',
    },
    {
      key: 'change_log',
      name: 'Change Log',
      nameJa: 'セル変更ログ',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'セル単位の変更履歴の記録・表示',
    },
    {
      key: 'export',
      name: 'Export',
      nameJa: 'エクスポート',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '変更履歴・差分のエクスポート出力',
    },
    {
      key: 'file_compare',
      name: 'File Compare',
      nameJa: '2ファイル比較',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '2つのExcelファイルのセル単位差分比較',
    },
    {
      key: 'show_author',
      name: 'Show Author',
      nameJa: '変更者表示',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'ENT'],
      descriptionJa: 'セル変更ログで変更者（誰が変更したか）を表示（コラボレーション — ENT のみ）',
    },
    {
      key: 'board',
      name: 'Board',
      nameJa: '掲示板',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'ENT'],
      descriptionJa: 'チーム向け掲示板機能（コラボレーション — ENT のみ）',
    },
    {
      key: 'sticky_notes',
      name: 'Sticky Notes',
      nameJa: '付箋',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'セルに付箋（メモ）を貼り付け。色分け・バージョン管理連動',
    },
    {
      key: 'send_message',
      name: 'Send Message',
      nameJa: 'メッセージ送信',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'ENT'],
      descriptionJa: 'チームメンバーへのメッセージ送信（コラボレーション — ENT のみ）',
    },
    // ------------------------------------------------------------------
    // AI・アシスタント機能
    // ------------------------------------------------------------------
    {
      key: 'ai_assistant',
      name: 'AI Assistant',
      nameJa: 'AIアシスタント',
      type: 'limit',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 },
      descriptionJa: 'AIチャットによるExcel操作支援（BIZ: 月200回 / ENT: 無制限）',
    },
    {
      key: 'ai_editor',
      name: 'AI Code Editor',
      nameJa: 'AIコードエディター',
      type: 'limit',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 },
      descriptionJa: 'AIによるPythonコードの生成・編集でExcelを自動処理（BIZ: 月200回 / ENT: 無制限）',
    },
    {
      key: 'reference_materials',
      name: 'Reference Materials',
      nameJa: '参考資料',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '参考資料の添付・AI コンテキストとしての活用',
    },
    {
      key: 'document_evaluation',
      name: 'Document Evaluation',
      nameJa: 'ドキュメント評価',
      type: 'limit',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 },
      descriptionJa: 'AIによるスプレッドシートの多角的評価・スコアリング・改善提案（Opus推奨・BIZ: 月200回 / ENT: 無制限）',
    },
    {
      key: 'voice_input',
      name: 'Voice Input',
      nameJa: '音声入力',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '音声認識によるハンズフリー入力',
    },
    {
      key: 'vrm_avatar',
      name: 'VRM Avatar',
      nameJa: 'VRMアバター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'ENT'],
      descriptionJa: 'VRM 3Dアバターによる音声会話（TTS + STT + リップシンク）',
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
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'サーバー管理テンプレートによるエンタープライズデータ収集（テンプレート選択→入力→送信）',
    },
    {
      key: 'data_collection_ai_transfer',
      name: 'AI Auto-Transfer',
      nameJa: 'AI 自動転記',
      type: 'limit',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 },
      descriptionJa: 'AI が既存 Excel データをデータ収集テンプレートに自動転記（BIZ: 月200回 / ENT: 無制限）',
    },
    {
      key: 'data_collection_ai_validate',
      name: 'AI Validation',
      nameJa: 'AI 検証',
      type: 'limit',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 },
      descriptionJa: 'AI による入力データの妥当性検証・異常値検出・整合性チェック（BIZ: 月200回 / ENT: 無制限）',
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
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'サーバー管理テンプレートによるエンタープライズデータ収集（テンプレート選択→入力→送信）',
    },
    {
      key: 'data_collection_ai_transfer',
      name: 'AI Auto-Transfer',
      nameJa: 'AI 自動転記',
      type: 'limit',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 },
      descriptionJa: 'AI が既存 Excel データをデータ収集テンプレートに自動転記（BIZ: 月200回 / ENT: 無制限）',
    },
    {
      key: 'data_collection_ai_validate',
      name: 'AI Validation',
      nameJa: 'AI 検証',
      type: 'limit',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 },
      descriptionJa: 'AI による入力データの妥当性検証・異常値検出・整合性チェック（BIZ: 月200回 / ENT: 無制限）',
    },
  ],

  // ========================================
  // Insight AI Briefcase (IOSD) — Tier 3
  // AIアシスタント搭載 業務文書管理ブリーフケース
  // ========================================
  IOSD: [
    // ------------------------------------------------------------------
    // 基本操作（ファイルタブ相当） — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'create_new',
      name: 'Create New Document',
      nameJa: '新規ドキュメント作成',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '空の Word ドキュメントを新規作成（MS Office 不要）',
    },
    {
      key: 'read_doc',
      name: 'Read Document',
      nameJa: 'ドキュメント読取・書込',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'Wordドキュメントの読み込み・編集・保存（MS Office 不要 — Syncfusion エンジン）',
    },
    {
      key: 'save_as',
      name: 'Save As',
      nameJa: '名前を付けて保存',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '.docx / .doc / .rtf / .txt 形式での保存',
    },
    {
      key: 'print',
      name: 'Print',
      nameJa: '印刷',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'ドキュメントの印刷（ページ範囲指定・部数・用紙サイズ対応）',
    },
    {
      key: 'pdf_export',
      name: 'PDF Export',
      nameJa: 'PDF出力',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'ドキュメントをPDF形式でエクスポート',
    },
    {
      key: 'undo_redo',
      name: 'Undo / Redo',
      nameJa: '元に戻す・やり直し',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '操作の取り消し・やり直し（複数レベル対応）',
    },
    {
      key: 'clipboard',
      name: 'Clipboard',
      nameJa: 'クリップボード',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'コピー・切り取り・貼り付け・形式を選択して貼り付け',
    },
    // ------------------------------------------------------------------
    // ホームタブ相当（フォント・段落・スタイル） — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'font_formatting',
      name: 'Font Formatting',
      nameJa: 'フォント書式',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'フォント種類・サイズ・太字・斜体・下線・取り消し線・上付き/下付き・文字色・蛍光ペン',
    },
    {
      key: 'paragraph_formatting',
      name: 'Paragraph Formatting',
      nameJa: '段落書式',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '配置（左揃え・中央・右揃え・両端揃え）・行間・段落前後の間隔・インデント',
    },
    {
      key: 'bullets_numbering',
      name: 'Bullets & Numbering',
      nameJa: '箇条書きと段落番号',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '箇条書き・番号付きリスト・アウトライン番号・リストレベルの変更',
    },
    {
      key: 'styles',
      name: 'Styles',
      nameJa: 'スタイル',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '見出しスタイル（H1〜H6）・本文・引用・リスト等の適用・カスタムスタイル作成',
    },
    {
      key: 'find_replace',
      name: 'Find & Replace',
      nameJa: '検索・置換',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'テキストの検索・一括置換（正規表現対応・書式検索）',
    },
    // ------------------------------------------------------------------
    // 挿入タブ相当 — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'insert_table',
      name: 'Insert Table',
      nameJa: '表の挿入・編集',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '表の挿入・行列追加・セル結合・罫線スタイル設定・表スタイルの適用',
    },
    {
      key: 'insert_image',
      name: 'Insert Image',
      nameJa: '画像挿入',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '画像ファイルの挿入・トリミング・サイズ変更・文字列の折り返し設定',
    },
    {
      key: 'insert_shape',
      name: 'Insert Shape',
      nameJa: '図形挿入',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '図形・テキストボックス・ワードアートの挿入・書式設定',
    },
    {
      key: 'insert_chart',
      name: 'Insert Chart',
      nameJa: 'グラフの挿入',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'グラフの挿入・データ編集（棒・折れ線・円等）',
    },
    {
      key: 'hyperlink',
      name: 'Hyperlink',
      nameJa: 'ハイパーリンク',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'テキスト・画像へのハイパーリンク挿入（URL・メール・文書内参照）',
    },
    {
      key: 'bookmark',
      name: 'Bookmark',
      nameJa: 'ブックマーク',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'ブックマークの挿入・管理・相互参照',
    },
    {
      key: 'comments',
      name: 'Comments',
      nameJa: 'コメント',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'テキストへのコメント挿入・返信・解決・削除',
    },
    {
      key: 'header_footer',
      name: 'Header & Footer',
      nameJa: 'ヘッダー・フッター',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'ページヘッダー・フッターの編集（ページ番号・日付・ロゴ・奇数/偶数ページ別）',
    },
    {
      key: 'page_break',
      name: 'Page Break',
      nameJa: '改ページ・セクション区切り',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '改ページ・セクション区切り（次のページ・現在の位置・偶数/奇数ページ）の挿入',
    },
    {
      key: 'insert_symbol',
      name: 'Insert Symbol',
      nameJa: '記号と特殊文字',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '特殊文字・記号・絵文字の挿入',
    },
    {
      key: 'footnote_endnote',
      name: 'Footnote & Endnote',
      nameJa: '脚注・文末脚注',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '脚注・文末脚注の挿入・編集・番号書式設定',
    },
    // ------------------------------------------------------------------
    // ページレイアウトタブ相当 — 全プラン共通
    // ------------------------------------------------------------------
    {
      key: 'page_setup',
      name: 'Page Setup',
      nameJa: 'ページ設定',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '用紙サイズ・余白・ページの向き（縦/横）・段組みの設定',
    },
    {
      key: 'borders_shading',
      name: 'Borders & Shading',
      nameJa: '罫線と網かけ',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'ページ罫線・段落罫線・網かけの設定',
    },
    {
      key: 'columns',
      name: 'Columns',
      nameJa: '段組み',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '文書の段組みレイアウト（1段・2段・3段・カスタム）',
    },
    {
      key: 'watermark',
      name: 'Watermark',
      nameJa: '透かし',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'テキスト・画像の透かし挿入（「社外秘」「下書き」等）',
    },
    {
      key: 'line_numbers',
      name: 'Line Numbers',
      nameJa: '行番号',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '行番号の表示設定（連続・ページごとにリセット・セクションごと）',
    },
    // ------------------------------------------------------------------
    // 参考資料タブ相当 — BIZ/ENT
    // ------------------------------------------------------------------
    {
      key: 'table_of_contents',
      name: 'Table of Contents',
      nameJa: '目次生成',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '見出しスタイルから目次を自動生成・更新',
    },
    // ------------------------------------------------------------------
    // 校閲タブ相当
    // ------------------------------------------------------------------
    {
      key: 'spell_check',
      name: 'Spell Check',
      nameJa: 'スペルチェック',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '文書内テキストのスペルチェック・文章校正',
    },
    {
      key: 'word_count',
      name: 'Word Count',
      nameJa: '文字カウント',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '文字数・単語数・段落数・行数のカウント表示',
    },
    {
      key: 'track_changes',
      name: 'Track Changes',
      nameJa: '変更履歴の記録',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '編集内容の変更履歴を記録・承認・却下（Word 互換の変更追跡）',
    },
    {
      key: 'protect_document',
      name: 'Protect Document',
      nameJa: '文書の保護',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '編集制限・パスワード保護・読み取り専用の設定',
    },
    // ------------------------------------------------------------------
    // フォーマット変換・テンプレート — 全プラン/BIZ
    // ------------------------------------------------------------------
    {
      key: 'convert',
      name: 'Convert Format',
      nameJa: 'フォーマット変換',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'PDF・HTML・RTF・テキスト等へのフォーマット変換',
    },
    {
      key: 'template',
      name: 'Template',
      nameJa: 'テンプレート',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'テンプレートからのドキュメント生成',
    },
    {
      key: 'mail_merge',
      name: 'Mail Merge',
      nameJa: '差し込み印刷',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'データソース（Excel/CSV）からの差し込み印刷・文書生成',
    },
    {
      key: 'batch',
      name: 'Batch Processing',
      nameJa: 'バッチ処理',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '複数ドキュメントの一括処理',
    },
    {
      key: 'macro',
      name: 'Macro Execution',
      nameJa: 'マクロ実行',
      type: 'boolean',
      allowedPlans: ['BIZ', 'ENT'],
      descriptionJa: 'VBAマクロの実行・変換',
    },
    // ------------------------------------------------------------------
    // AI・アシスタント機能
    // ------------------------------------------------------------------
    {
      key: 'ai_assistant',
      name: 'AI Assistant',
      nameJa: 'AIアシスタント',
      type: 'limit',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 },
      descriptionJa: 'AIによるドキュメントの校正・要約・構成提案（BIZ: 月200回 / ENT: 無制限）',
    },
    {
      key: 'ai_editor',
      name: 'AI Code Editor',
      nameJa: 'AIコードエディター',
      type: 'limit',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 },
      descriptionJa: 'AIによるPythonコードの生成・編集でWordを自動処理（BIZ: 月200回 / ENT: 無制限）',
    },
    {
      key: 'reference_materials',
      name: 'Reference Materials',
      nameJa: '参考資料',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '参考資料の添付・AI コンテキストとしての活用',
    },
    {
      key: 'document_evaluation',
      name: 'Document Evaluation',
      nameJa: 'ドキュメント評価',
      type: 'limit',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 },
      descriptionJa: 'AIによるWord文書の多角的評価・スコアリング・改善提案（Opus推奨・BIZ: 月200回 / ENT: 無制限）',
    },
    {
      key: 'voice_input',
      name: 'Voice Input',
      nameJa: '音声入力',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '音声認識によるハンズフリー入力',
    },
    {
      key: 'vrm_avatar',
      name: 'VRM Avatar',
      nameJa: 'VRMアバター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'ENT'],
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
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'Pythonコードの実行',
    },
    {
      key: 'presets',
      name: 'Presets',
      nameJa: 'プリセット利用',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '定義済みスクリプトテンプレートの利用',
    },
    {
      key: 'scripts',
      name: 'Script Storage',
      nameJa: 'スクリプト保存数',
      type: 'limit',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: -1, ENT: -1 },
      descriptionJa: '保存可能なスクリプト数',
    },
    {
      key: 'cloud_sync',
      name: 'Cloud Sync',
      nameJa: 'クラウド同期',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'スクリプトのクラウド同期',
    },
    {
      key: 'ai_editor',
      name: 'AI Code Editor',
      nameJa: 'AIコードエディター',
      type: 'limit',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 },
      descriptionJa: 'AIによるPythonコードの生成・編集・構文検証・デバッグ支援（BIZ: 月200回 / ENT: 無制限）',
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
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'RPAスクリプトの実行',
    },
    {
      key: 'presets',
      name: 'Presets',
      nameJa: 'プリセット利用',
      type: 'boolean',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      descriptionJa: '定義済みスクリプトテンプレートの利用',
    },
    {
      key: 'jobs',
      name: 'Job Storage',
      nameJa: 'JOB保存数',
      type: 'limit',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: -1, ENT: -1 },
      descriptionJa: '保存可能なJOB数',
    },
    {
      key: 'cloud_sync',
      name: 'Cloud Sync',
      nameJa: 'クラウド同期',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'JOBのクラウド同期',
    },
    {
      key: 'ai_editor',
      name: 'AI Code Editor',
      nameJa: 'AIコードエディター',
      type: 'limit',
      allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 },
      descriptionJa: 'AIによるPythonコードの生成・編集・構文検証・デバッグ支援（BIZ: 月200回 / ENT: 無制限）',
    },
    {
      key: 'orchestrator',
      name: 'Orchestrator',
      nameJa: 'オーケストレーター',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'Insight Business Suite Agent の集中管理・JOB配信・実行監視',
    },
    {
      key: 'agents',
      name: 'Agent Management',
      nameJa: 'Agent管理',
      type: 'limit',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      limitValues: { TRIAL: 5, BIZ: 50, ENT: -1 },
      descriptionJa: '管理可能な Agent（Insight Business Suite 端末）数（BIZ: 50台 / ENT: 無制限）',
    },
    {
      key: 'scheduler',
      name: 'Job Scheduler',
      nameJa: 'JOBスケジューラー',
      type: 'boolean',
      allowedPlans: ['TRIAL', 'BIZ', 'ENT'],
      descriptionJa: 'JOBの定期実行スケジュール設定（cron 相当）',
    },
  ],

  // ========================================
  // InsightNoCodeAnalyzer (INCA)
  // ========================================
  INCA: [
    { key: 'rpa_analysis', name: 'RPA Analysis', nameJa: 'RPA解析', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: 'BizRobo等のRPAソース解析' },
    { key: 'lowcode_analysis', name: 'Low-code Analysis', nameJa: 'ローコード解析', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: 'Forguncy等のローコードツール解析' },
    { key: 'migration_assessment', name: 'Migration Assessment', nameJa: '移行アセスメント', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: '工数見積もり・複雑度分析' },
    { key: 'akabot_conversion', name: 'akaBot Conversion', nameJa: 'akaBot変換', type: 'boolean', allowedPlans: ['TRIAL', 'BIZ', 'ENT'], descriptionJa: 'BizRoboからakaBotへの変換' },
    { key: 'export_json', name: 'JSON Export', nameJa: 'JSON出力', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: '解析結果のJSON形式出力' },
    { key: 'export_markdown', name: 'Markdown Export', nameJa: 'Markdown出力', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: '解析結果のMarkdown形式出力' },
  ],

  // ========================================
  // InsightImageGen (INIG)
  // ========================================
  INIG: [
    { key: 'generate_image', name: 'Image Generation', nameJa: '画像生成', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: 'Stable Diffusionによる画像生成' },
    { key: 'batch_image', name: 'Batch Image Generation', nameJa: 'バッチ画像生成', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: '複数画像の一括生成' },
    { key: 'generate_audio', name: 'Audio Generation', nameJa: '音声生成', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: 'VOICEVOXによる音声生成' },
    { key: 'character_prompts', name: 'Character Prompts', nameJa: 'キャラクタープロンプト', type: 'limit', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], limitValues: { TRIAL: -1, BIZ: -1, ENT: -1 }, descriptionJa: '保存可能なキャラクタープロンプト数' },
    { key: 'hi_res', name: 'High Resolution', nameJa: '高解像度出力', type: 'boolean', allowedPlans: ['TRIAL', 'BIZ', 'ENT'], descriptionJa: '高解像度画像の生成' },
    { key: 'cloud_sync', name: 'Cloud Sync', nameJa: 'クラウド同期', type: 'boolean', allowedPlans: ['TRIAL', 'BIZ', 'ENT'], descriptionJa: 'プロンプト・設定のクラウド同期' },
  ],

  // ========================================
  // InsightCast (INMV)
  // ========================================
  INMV: [
    { key: 'generate', name: 'Video Generation', nameJa: '動画生成', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: '画像・テキストから動画を生成' },
    { key: 'subtitle', name: 'Subtitle', nameJa: '字幕', type: 'boolean', allowedPlans: ['TRIAL', 'BIZ', 'ENT'], descriptionJa: '動画への字幕追加' },
    { key: 'subtitle_style', name: 'Subtitle Style', nameJa: '字幕スタイル選択', type: 'boolean', allowedPlans: ['TRIAL', 'BIZ', 'ENT'], descriptionJa: '字幕のフォント・色・位置のカスタマイズ' },
    { key: 'transition', name: 'Transition', nameJa: 'トランジション', type: 'boolean', allowedPlans: ['TRIAL', 'BIZ', 'ENT'], descriptionJa: 'シーン間のトランジション効果' },
    { key: 'pptx_import', name: 'PPTX Import', nameJa: 'PPTX取込', type: 'boolean', allowedPlans: ['TRIAL', 'BIZ', 'ENT'], descriptionJa: 'PowerPointファイルからの素材取込' },
  ],

  // ========================================
  // InsightSeniorOffice (ISOF) — Tier 4
  // シニア向け統合オフィスツール
  // ========================================
  ISOF: [
    { key: 'create_new', name: 'Create New Document', nameJa: '新規作成', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: '空の Excel スプレッドシート・Word ドキュメントを新規作成（MS Office 不要）' },
    { key: 'spreadsheet', name: 'Spreadsheet', nameJa: '表計算', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: 'Excelファイルの読み込み・編集・保存' },
    { key: 'document', name: 'Document', nameJa: '文書作成', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: 'Wordドキュメントの読み込み・編集・保存' },
    { key: 'icloud_mail', name: 'iCloud Mail', nameJa: 'iCloudメール', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: 'iCloudメールの送受信（iPhoneと同じメールをPCで閲覧）' },
    { key: 'ai_assistant', name: 'AI Assistant', nameJa: 'AIアシスタント', type: 'limit', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 }, descriptionJa: 'AIによる自然言語操作支援（「A2に1万円入れて」等）（BIZ: 月200回 / ENT: 無制限）' },
    { key: 'voice_input', name: 'Voice Input', nameJa: '音声入力', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: '音声認識によるハンズフリー入力' },
    { key: 'text_to_speech', name: 'Text to Speech', nameJa: '読み上げ', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: 'メール・文書の音声読み上げ' },
    { key: 'font_scaling', name: 'Font Scaling', nameJa: '文字サイズ調整', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: '文字サイズ50%〜200%の拡大縮小' },
    { key: 'setup_wizard', name: 'Setup Wizard', nameJa: '初期設定ウィザード', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: '5ステップの簡単初期設定（名前・メール・文字サイズ）' },
    { key: 'tutorial', name: 'Tutorial', nameJa: 'チュートリアル', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: '10ステップの対話型ガイドツアー' },
    { key: 'print', name: 'Print', nameJa: '印刷', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: 'シニア向け大きい文字での印刷' },
    { key: 'contacts', name: 'Contacts', nameJa: '連絡先管理', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: '家族・友人・病院等のグループ別連絡先管理' },
  ],

  // ========================================
  // InterviewInsight (IVIN) — Tier 1
  // 自動ヒアリング・業務調査支援
  // Syncfusion ej2-react-grids によるグリッド機能搭載
  // ========================================
  IVIN: [
    { key: 'interview_session', name: 'Interview Session', nameJa: 'インタビューセッション', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: 'AIインタビューセッションの作成・実行' },
    { key: 'voice_input', name: 'Voice Input', nameJa: '音声入力', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: '音声認識によるインタビュー回答の入力' },
    { key: 'voice_synthesis', name: 'Voice Synthesis', nameJa: '音声合成', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: 'AI面接官の質問読み上げ（TTS）' },
    { key: 'excel_grid', name: 'Excel Grid View', nameJa: 'Excelグリッド表示', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: 'Syncfusion ej2-react-grids によるインタビュー結果の一覧表示・ソート・フィルタ' },
    { key: 'excel_import', name: 'Excel Import', nameJa: 'Excelインポート', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: 'Excel ファイルからのデータ取り込み（テンプレート・回答者・案件の一括登録）' },
    { key: 'excel_export', name: 'Excel Export', nameJa: 'Excelエクスポート', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: 'インタビュー結果のExcel形式エクスポート' },
    { key: 'ai_analysis', name: 'AI Analysis', nameJa: 'AI分析', type: 'limit', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], limitValues: { TRIAL: -1, BIZ: 200, ENT: -1 }, descriptionJa: 'AIによる回答の構造化・感情分析・課題抽出（BIZ: 月200回 / ENT: 無制限）' },
    { key: 'data_mart', name: 'Data Mart', nameJa: 'データマート', type: 'boolean', allowedPlans: ['TRIAL', 'BIZ', 'ENT'], descriptionJa: 'インタビュー結果の自動分類・ナレッジマート生成' },
    { key: 'search', name: 'Full-text Search', nameJa: '全文検索', type: 'boolean', allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'], descriptionJa: 'インタビュー回答のハイブリッド検索' },
    { key: 'vrm_avatar', name: 'VRM Avatar', nameJa: 'VRMアバター', type: 'boolean', allowedPlans: ['TRIAL', 'BIZ', 'ENT'], descriptionJa: 'VRM 3Dアバターによる面接官キャラクター表示' },
    { key: 'batch_interview', name: 'Batch Interview', nameJa: 'バッチインタビュー', type: 'boolean', allowedPlans: ['TRIAL', 'BIZ', 'ENT'], descriptionJa: '複数回答者への一括インタビュー配信・管理' },
  ],
};

// =============================================================================
// プラン別制限
// =============================================================================

/** デフォルトのプラン別制限 */
export const DEFAULT_PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  FREE: { monthlyLimit: 3, maxFileSizeMB: 50, maxStorageItems: 5, maxResolution: '720p', hasWatermark: true, batchEnabled: false, apiEnabled: false, priorityProcessing: false },
  TRIAL: { monthlyLimit: -1, maxFileSizeMB: -1, maxStorageItems: -1, maxResolution: '4K', hasWatermark: false, batchEnabled: true, apiEnabled: false, priorityProcessing: false },
  BIZ: { monthlyLimit: -1, maxFileSizeMB: -1, maxStorageItems: -1, maxResolution: '4K', hasWatermark: false, batchEnabled: true, apiEnabled: false, priorityProcessing: false },
  ENT: { monthlyLimit: -1, maxFileSizeMB: -1, maxStorageItems: -1, maxResolution: '4K', hasWatermark: false, batchEnabled: true, apiEnabled: true, priorityProcessing: true },
};

/** InsightCast 専用のプラン別制限 */
export const INMV_PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  FREE: { monthlyLimit: 3, maxFileSizeMB: 50, maxStorageItems: -1, maxResolution: '720p', hasWatermark: true, batchEnabled: false, apiEnabled: false, priorityProcessing: false },
  TRIAL: { monthlyLimit: -1, maxFileSizeMB: -1, maxStorageItems: -1, maxResolution: '4K', hasWatermark: false, batchEnabled: true, apiEnabled: false, priorityProcessing: false },
  BIZ: { monthlyLimit: -1, maxFileSizeMB: -1, maxStorageItems: -1, maxResolution: '4K', hasWatermark: false, batchEnabled: true, apiEnabled: false, priorityProcessing: false },
  ENT: { monthlyLimit: -1, maxFileSizeMB: -1, maxStorageItems: -1, maxResolution: '4K', hasWatermark: false, batchEnabled: true, apiEnabled: true, priorityProcessing: true },
};

/** 製品別のプラン制限マッピング */
export const PRODUCT_PLAN_LIMITS: Partial<Record<ProductCode, Record<PlanCode, PlanLimits>>> = {
  INMV: INMV_PLAN_LIMITS,
};

// =============================================================================
// 機能チェック関数（標準API）
// =============================================================================

/** 製品・プランの制限を取得 */
export function getPlanLimits(productCode: ProductCode, planCode: PlanCode): PlanLimits {
  const productLimits = PRODUCT_PLAN_LIMITS[productCode];
  if (productLimits && productLimits[planCode]) {
    return productLimits[planCode];
  }
  return DEFAULT_PLAN_LIMITS[planCode];
}

/** 製品の機能一覧を取得（継承機能を含む） */
export function getProductFeatures(product: ProductCode): FeatureDefinition[] {
  const productInfo = PRODUCTS[product];
  const ownFeatures = PRODUCT_FEATURES[product] || [];
  if (productInfo.inheritsFrom) {
    const inheritedFeatures = getProductFeatures(productInfo.inheritsFrom);
    const ownKeys = new Set(ownFeatures.map(f => f.key));
    const merged = inheritedFeatures.filter(f => !ownKeys.has(f.key));
    return [...merged, ...ownFeatures];
  }
  return ownFeatures;
}

/** 製品の機能定義を取得 */
export function getFeatureDefinition(product: ProductCode, featureKey: string): FeatureDefinition | null {
  const features = getProductFeatures(product);
  return features.find(f => f.key === featureKey) || null;
}

/** 共通機能の定義を取得 */
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
 * checkProductFeature('INMV', 'subtitle', 'BIZ')  // true
 * checkProductFeature('INMV', 'subtitle', 'FREE')  // false
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
 * checkCommonFeature('api_access', 'BIZ')  // false
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

/** プラン表示名を取得 */
export function getPlanDisplayName(plan: PlanCode, locale: 'en' | 'ja' = 'ja'): string {
  const planInfo = PLANS[plan];
  return locale === 'ja' ? planInfo.nameJa : planInfo.name;
}

/** 製品表示名を取得 */
export function getProductDisplayName(product: ProductCode, locale: 'en' | 'ja' = 'ja'): string {
  const productInfo = PRODUCTS[product];
  return locale === 'ja' ? productInfo.nameJa : productInfo.name;
}

/**
 * 機能に必要な最低プランを取得
 *
 * FREE/TRIAL は評価用の特殊プランのため除外し、購入可能なプラン（BIZ/ENT）から
 * 最低要件を返す。FREE/TRIAL のみで利用可能な機能はそれぞれを返す。
 */
export function getRequiredPlan(product: ProductCode, featureKey: string): PlanCode | null {
  const feature = getFeatureDefinition(product, featureKey)
    || getCommonFeatureDefinition(featureKey);

  if (!feature || feature.allowedPlans.length === 0) {
    return null;
  }

  // TRIAL を除外した購入可能プランで最低 priority を探す
  const purchasablePlans = feature.allowedPlans.filter(p => p !== 'TRIAL');
  if (purchasablePlans.length === 0) {
    // TRIAL のみで利用可能な機能（通常はない、安全側で対応）
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
 * getContextMenuProducts('xlsx')  // [{ product: 'IOSH', label: 'Insight Performance Management で開く' }]
 * getContextMenuProducts('pptx')  // [{ product: 'INSS', label: 'Insight Deck Quality Gate で開く' }]
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

/** 製品のプロジェクトファイル設定を取得 */
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
 * //   progId: 'HarmonicInsight.InsightOfficeSheet',  // レジストリキーのため据え置き
 * //   extension: '.iosh',
 * //   mimeType: 'application/x-insightoffice-sheet',
 * //   description: 'Insight Performance Management プロジェクト',
 * //   iconFileName: 'iosh-file.ico',
 * //   openCommand: '"%INSTALL_DIR%\\InsightOfficeSheet.exe" "%1"',  // exe名は外部リポジトリ変更後に更新
 * //   contextMenu: {
 * //     targetExtensions: ['.xlsx', '.xls', '.csv'],
 * //     label: 'Insight Performance Management で開く',
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

/** ユーティリティアプリのマスターアイコン定義 */
export const UTILITY_ICONS: Record<string, {
  name: string;
  nameJa: string;
  masterIcon: string;
  targetPlatform: AppPlatform;
  iconBuildPath: string;
}> = {
  LAUNCHER: { name: 'InsightLauncher', nameJa: 'Insight Launcher', masterIcon: 'brand/icons/png/icon-launcher.png', targetPlatform: 'wpf', iconBuildPath: 'Resources/' },
  CAMERA: { name: 'InsightCamera', nameJa: 'スッキリカメラ', masterIcon: 'brand/icons/png/icon-camera.png', targetPlatform: 'android_native', iconBuildPath: 'app/src/main/res/' },
  VOICE_CLOCK: { name: 'InsightVoiceClock', nameJa: 'Insight Voice Clock', masterIcon: 'brand/icons/png/icon-voice-clock.png', targetPlatform: 'expo', iconBuildPath: 'assets/' },
  QR: { name: 'InsightQR', nameJa: 'Insight QR', masterIcon: 'brand/icons/png/icon-qr.png', targetPlatform: 'expo', iconBuildPath: 'assets/' },
  PINBOARD: { name: 'InsightPinBoard', nameJa: 'Insight PinBoard', masterIcon: 'brand/icons/png/icon-pinboard.png', targetPlatform: 'expo', iconBuildPath: 'assets/' },
  VOICE_MEMO: { name: 'InsightVoiceMemo', nameJa: 'Insight Voice Memo', masterIcon: 'brand/icons/png/icon-voice-memo.png', targetPlatform: 'expo', iconBuildPath: 'assets/' },
};

/**
 * 製品コードからマスターアイコンのパスを取得
 *
 * @param productCode 製品コード
 * @returns リポジトリルートからの相対パス
 *
 * @example
 * getMasterIconPath('IOSH')  // 'brand/icons/png/icon-insight-sheet.png'
 */
export function getMasterIconPath(productCode: ProductCode): string {
  return PRODUCTS[productCode].masterIcon;
}

/** 全アイコン（製品 + ユーティリティ）の一覧を取得 */
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

  // アイコン
  UTILITY_ICONS,
  getMasterIconPath,
  getAllIcons,

  // 後方互換（非推奨）
  FEATURE_MATRIX,
  canAccessFeature,
};
