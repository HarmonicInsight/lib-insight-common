/**
 * HARMONIC insight 製品カタログ（Web サイトのダウンロードページの唯一のマスターデータ）
 *
 * ============================================================================
 * 【このファイルの役割】
 * ============================================================================
 *
 * Web サイト（insight-office.com）の製品紹介ページ・ダウンロードページに
 * 表示する全製品の情報を一元管理します。
 *
 * ## なぜこのファイルが必要か
 * - products.ts はライセンス・機能マトリクスの管理用（内部向け）
 * - このファイルは「Web サイトに何をどう見せるか」の管理用（外部向け）
 * - Web サイト側に製品データをハードコードする必要がなくなる
 *
 * ## 管理フロー
 * 1. このファイルを編集（公開/非公開、バージョン、説明文など）
 * 2. git push → Web サイトのビルドが走る → 製品ページ自動更新
 *
 * ## 対象
 * - メイン製品（products.ts の ProductCode に対応）
 * - ユーティリティアプリ（Launcher, Camera, QR など）
 *
 * ## 製品追加手順
 * 1. PRODUCT_CATALOG 配列にエントリを追加
 * 2. status を設定
 *    - 'published'   → Web サイトに公開（通常表示）
 *    - 'development' → 「開発中」バッジ付きで表示
 *    - 'hidden'      → Web サイトに表示しない
 * 3. releases にダウンロード情報を設定
 */

import type { ProductCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** Web サイトの多言語対応 */
export type CatalogLocale = 'en' | 'ja' | 'zh';

/** Web サイトのカテゴリ分類 */
export type WebsiteCategory = 'rpa' | 'consulting' | 'content' | 'utility';

/** 対応プラットフォーム */
export type PlatformType = 'windows' | 'web' | 'android' | 'ios';

/**
 * カタログステータス
 *
 * - published:   Web サイトに公開（通常表示）
 * - development: 「開発中」バッジ付きで表示（DL ボタンは非活性）
 * - hidden:      Web サイトに表示しない（内部管理用）
 */
export type CatalogStatus = 'published' | 'development' | 'hidden';

/** ステータスの多言語ラベル */
export const STATUS_LABELS: Record<CatalogStatus, Record<CatalogLocale, string>> = {
  published: { en: 'Available', ja: '公開中', zh: '已发布' },
  development: { en: 'In Development', ja: '開発中', zh: '开发中' },
  hidden: { en: 'Hidden', ja: '非公開', zh: '未公开' },
};

/** ユーティリティアプリコード */
export type UtilityCode = 'LAUNCHER' | 'CAMERA' | 'VOICE_CLOCK' | 'QR' | 'PINBOARD' | 'VOICE_MEMO' | 'VOICE_TASK_CALENDAR';

/** カタログで扱う全コード */
export type CatalogCode = ProductCode | UtilityCode;

/** リリース情報（プラットフォーム単位） */
export interface ReleaseInfo {
  /** バージョン（例: "1.0.0"） */
  version: string;
  /** GitHub リリースタグ（例: "INBT-v1.0.0"） */
  tag: string;
  /** ダウンロードファイル名（例: "InsightBotRPA_Setup_1.0.0.exe"） */
  fileName: string;
  /** リリース日（YYYY-MM-DD） */
  releaseDate?: string;
}

/** スクリーンショット定義 */
export interface ScreenshotEntry {
  /** ファイル名（public/images/products/screenshots/{slug}/ 配下） */
  file: string;
  /** キャプション（多言語） */
  label: Record<CatalogLocale, string>;
}

/** カタログエントリ（1製品＝1件） */
export interface CatalogEntry {
  /** 製品コード（products.ts の ProductCode またはユーティリティコード） */
  code: CatalogCode;
  /** URL スラッグ（例: "insight-bot"）→ Web サイトの /products/{slug} に対応 */
  slug: string;
  /** 公開ステータス: 'published' | 'development' | 'hidden' */
  status: CatalogStatus;
  /** カテゴリ内の表示順（小さいほど先頭） */
  displayOrder: number;
  /** Web サイトでのカテゴリ分類 */
  category: WebsiteCategory;
  /** SVG アイコンの path データ（stroke ベース、viewBox="0 0 24 24"） */
  svgIcon: string;
  /** Tailwind CSS グラデーションクラス（例: "from-emerald-500 to-teal-600"） */
  colorGradient: string;
  /** 対応プラットフォーム */
  platforms: PlatformType[];
  /** 製品名（多言語） */
  name: Record<CatalogLocale, string>;
  /** 短い説明文（多言語） */
  tagline: Record<CatalogLocale, string>;
  /** 詳細説明（多言語） */
  description: Record<CatalogLocale, string>;
  /** 主要機能一覧（多言語、Web サイト表示用） */
  features: Record<CatalogLocale, string[]>;
  /** ユースケース（多言語） */
  useCases: Record<CatalogLocale, string[]>;
  /** プラットフォーム別リリース情報（未リリースは空オブジェクト） */
  releases: Partial<Record<PlatformType, ReleaseInfo>>;
  /** スクリーンショット */
  screenshots?: ScreenshotEntry[];
}

/** カテゴリ名の多言語定義 */
export const CATEGORY_NAMES: Record<WebsiteCategory, Record<CatalogLocale, string>> = {
  rpa: {
    en: 'Automation & Delivery',
    ja: '自動化・デリバリー',
    zh: '自动化与交付',
  },
  consulting: {
    en: 'Business Analysis, Requirements, Proposal & Strategy Simulation',
    ja: '業務調査・要件定義・提案・経営シミュレーション',
    zh: '业务调查、需求定义、提案、经营模拟',
  },
  content: {
    en: 'Content Creation',
    ja: 'コンテンツ制作',
    zh: '内容创作',
  },
  utility: {
    en: 'Utility Apps',
    ja: 'ユーティリティアプリ',
    zh: '实用工具',
  },
};

/** GitHub ダウンロードベース URL */
export const GITHUB_DOWNLOAD_BASE = 'https://github.com/HarmonicInsight/releases/releases/download';

/** カテゴリの表示順 */
export const CATEGORY_ORDER: WebsiteCategory[] = ['rpa', 'consulting', 'content', 'utility'];

// =============================================================================
// 製品カタログデータ
// =============================================================================

export const PRODUCT_CATALOG: CatalogEntry[] = [

  // ===========================================================================
  // カテゴリ: Automation & Delivery (rpa)
  // ===========================================================================

  {
    code: 'INBT',
    slug: 'insight-bot',
    status: 'published',
    displayOrder: 10,
    category: 'rpa',
    svgIcon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    colorGradient: 'from-emerald-500 to-teal-600',
    platforms: ['windows'],
    name: { en: 'InsightBot', ja: 'InsightBot', zh: 'InsightBot' },
    tagline: {
      en: 'AI Editor-Powered Business Optimization RPA + Orchestrator',
      ja: 'AIエディタ搭載 — 業務最適化RPA + Orchestrator',
      zh: '搭载AI编辑器 — 业务优化RPA + Orchestrator',
    },
    description: {
      en: 'Built-in AI Editor automatically generates bot scripts from natural language instructions. Turn the generated Python into production bots and visually orchestrate them into automated workflows. From AI-driven bot creation to visual job design, InsightBot streamlines business process automation delivery.',
      ja: '搭載のAIエディタが、ボットのスクリプトを自動生成。生成したPythonをボット化し、開発したボットをビジュアルにJOB化して業務を自動化。AIによるボット作成からビジュアルなJOB設計まで、業務プロセス自動化のデリバリーを効率化します。',
      zh: '内置AI编辑器从自然语言指令自动生成机器人脚本。将生成的Python转化为生产机器人，并通过可视化编排实现业务流程自动化。从AI驱动的机器人创建到可视化JOB设计，全面简化业务流程自动化交付。',
    },
    features: {
      en: [
        'AI Editor — generate bot scripts from natural language instructions',
        'Python-to-bot conversion',
        'Visual job orchestration designer',
        'Web and desktop automation',
        'Scheduled and triggered execution',
        'Centralized bot management',
      ],
      ja: [
        'AIエディタ — 自然言語の指示からボットスクリプトを自動生成',
        'Pythonからボットへの変換',
        'ビジュアルJOBオーケストレーション設計',
        'Web・デスクトップ自動化',
        'スケジュール・トリガー実行',
        '集中ボット管理',
      ],
      zh: [
        'AI编辑器 — 从自然语言指令自动生成机器人脚本',
        'Python转机器人',
        '可视化JOB编排设计',
        'Web和桌面自动化',
        '定时和触发执行',
        '集中式机器人管理',
      ],
    },
    useCases: {
      en: [
        'Auto-generate bots with AI Editor — no coding required',
        'Convert AI-generated Python into production bots',
        'Visual job design for business process automation',
        'Client back-office workflow automation delivery',
      ],
      ja: [
        'AIエディタでボットを自動生成 — コーディング不要',
        'AIで作成したPythonを本番ボットに変換',
        '業務プロセス自動化のビジュアルJOB設計',
        'クライアントのバックオフィス業務自動化の納品',
      ],
      zh: [
        '用AI编辑器自动生成机器人 — 无需编码',
        '将AI生成的Python转化为生产机器人',
        '业务流程自动化的可视化JOB设计',
        '客户后台业务流程自动化交付',
      ],
    },
    releases: {
      windows: { version: '1.0.0', tag: 'INBT-v1.0.0', fileName: 'InsightBotRPA_Setup_1.0.0.exe' },
    },
  },
  {
    code: 'INCA',
    slug: 'insight-nocode-analyzer',
    status: 'published',
    displayOrder: 20,
    category: 'rpa',
    svgIcon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    colorGradient: 'from-violet-500 to-indigo-600',
    platforms: ['windows'],
    name: { en: 'InsightNoCodeAnalyzer', ja: 'InsightNoCodeAnalyzer', zh: 'InsightNoCodeAnalyzer' },
    tagline: {
      en: 'Migration Automation Tool for RPA & Low-Code Platforms',
      ja: 'RPA・ローコードのマイグレーション自動化ツール',
      zh: 'RPA与低代码平台的迁移自动化工具',
    },
    description: {
      en: 'Automate the migration of clients\' existing RPA and low-code environments to other platforms. From complexity analysis and effort estimation of original logic, to migration strategy proposals and automated process conversion — end-to-end migration support.',
      ja: 'AIが各ローコードプラットフォームの仕組みを解析、ロジックの複雑性分析による見積もり、移行方針提案から、プロセスの自動変換作業まで対応します。',
      zh: '自动化客户现有RPA和低代码环境向其他平台的迁移。从原始逻辑的复杂性分析与估算、迁移方针提案，到流程的自动转换作业，提供端到端迁移支持。',
    },
    features: {
      en: [
        'Original logic complexity analysis',
        'Automated migration effort estimation',
        'Migration strategy proposal generation',
        'Cross-platform process auto-conversion',
        'Risk and dependency mapping',
        'Detailed migration roadmap',
      ],
      ja: [
        '元ロジックの複雑性分析',
        '移行工数の自動見積もり',
        '移行方針の提案生成',
        'プラットフォーム間プロセス自動変換',
        'リスクと依存関係のマッピング',
        '詳細な移行ロードマップ',
      ],
      zh: [
        '原始逻辑复杂性分析',
        '迁移工作量自动估算',
        '迁移方针提案生成',
        '跨平台流程自动转换',
        '风险和依赖关系映射',
        '详细的迁移路线图',
      ],
    },
    useCases: {
      en: [
        'RPA platform migration with automated process conversion',
        'Migration effort estimation from original logic analysis',
        'Migration strategy proposals for client decision-making',
        'Low-code environment modernization projects',
      ],
      ja: [
        'プロセス自動変換によるRPAプラットフォーム移行',
        '元ロジック分析に基づく移行工数見積もり',
        'クライアント意思決定向け移行方針提案',
        'ローコード環境の近代化プロジェクト',
      ],
      zh: [
        '通过自动流程转换进行RPA平台迁移',
        '基于原始逻辑分析的迁移工作量估算',
        '面向客户决策的迁移方针提案',
        '低代码环境现代化项目',
      ],
    },
    releases: {
      windows: { version: '1.0.0', tag: 'INCA-v1.0.0', fileName: 'InsightNoCodeAnalyzer-v1.0.0-win-x64.zip' },
    },
  },
  {
    code: 'INPY',
    slug: 'insight-py',
    status: 'published',
    displayOrder: 30,
    category: 'rpa',
    svgIcon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    colorGradient: 'from-sky-500 to-cyan-600',
    platforms: ['windows'],
    name: { en: 'InsightPy', ja: 'InsightPy', zh: 'InsightPy' },
    tagline: {
      en: 'Python Execution Platform with AI Editor for Business Survey & Data Collection',
      ja: 'AIエディタ搭載 — 業務調査・データ収集のためのPython実行基盤',
      zh: '搭载AI编辑器 — 面向业务调查与数据收集的Python执行平台',
    },
    description: {
      en: 'Run Python without the hassle of setting up execution environments. The built-in AI Editor lets you describe what you need in plain language and automatically generates Python code — no programming knowledge required. From client device automation and citizen development to Python language education, a versatile platform applicable across a wide range of fields.',
      ja: '手間のかかるPython実行環境なしでPythonの実行が可能に。搭載のAIエディタに欲しい機能を日本語で指示するだけでPythonコードを自動生成 — プログラミング知識がなくても業務ツールを作成できます。クライアント端末の自動化、民主化開発から、Pythonの言語教育まで、幅広い分野での活用が可能です。',
      zh: '无需繁琐的Python执行环境搭建即可运行Python。内置AI编辑器只需用自然语言描述需求即可自动生成Python代码——无需编程知识。从客户终端自动化、市民开发到Python语言教育，可在广泛领域中灵活运用。',
    },
    features: {
      en: [
        'AI Editor — describe requirements in natural language to generate Python code',
        'Zero-setup Python execution',
        'Syntax checking and instant test execution',
        'Client device automation',
        'Citizen development enablement',
        'Data analysis toolkit',
      ],
      ja: [
        'AIエディタ — 日本語で指示するだけでPythonコードを自動生成',
        '環境構築不要のPython実行',
        '構文チェック・即時テスト実行',
        'クライアント端末の自動化',
        '民主化開発の実現',
        'データ分析ツールキット',
      ],
      zh: [
        'AI编辑器 — 用自然语言描述需求自动生成Python代码',
        '零配置Python执行',
        '语法检查与即时测试执行',
        '客户终端自动化',
        '全民开发赋能',
        '数据分析工具包',
      ],
    },
    useCases: {
      en: [
        'Generate business tools instantly with AI Editor — no coding skills needed',
        'Client device automation without environment setup',
        'Citizen development for non-engineers',
        'Python language education and training',
      ],
      ja: [
        'AIエディタで業務ツールを即座に生成 — コーディング不要',
        '環境構築不要のクライアント端末自動化',
        '非エンジニア向け民主化開発',
        'Pythonの言語教育・研修',
      ],
      zh: [
        '用AI编辑器即时生成业务工具 — 无需编程技能',
        '无需环境搭建的客户终端自动化',
        '面向非工程师的全民开发',
        'Python语言教育与培训',
      ],
    },
    releases: {
      windows: { version: '1.0.0', tag: 'INPY-v1.0.0', fileName: 'InsightPy-v1.0.0-win-x64.zip' },
    },
  },

  // ===========================================================================
  // カテゴリ: Business Analysis & Strategy (consulting)
  // ===========================================================================

  {
    code: 'IOSH',
    slug: 'insight-performance-management',
    status: 'published',
    displayOrder: 10,
    category: 'consulting',
    svgIcon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    colorGradient: 'from-green-500 to-green-700',
    platforms: ['windows'],
    name: { en: 'Insight Performance Management', ja: 'Insight Performance Management', zh: 'Insight Performance Management' },
    tagline: {
      en: 'AI-Powered Business Performance Management — Track, Analyze & Optimize Your Metrics',
      ja: 'AI搭載 ビジネスパフォーマンス管理 — 経営指標の追跡・分析・最適化',
      zh: 'AI驱动的业务绩效管理 — 追踪、分析并优化您的经营指标',
    },
    description: {
      en: 'Transform your Excel-based financial workflows into a powerful performance management platform. Insight Performance Management brings AI-driven analysis to your KPIs, budgets, and financial models — validating formulas, detecting anomalies, and providing actionable insights. Track budget vs. actual performance with version-controlled spreadsheets, collaborate on shared servers without cloud overhead, and let the AI assistant ensure accuracy across complex financial models and management reports.',
      ja: 'Excelベースの財務ワークフローを強力なパフォーマンス管理プラットフォームに変革します。KPI、予算、財務モデルにAI分析を適用し、計算式の検証、異常値の検出、実用的なインサイトの提供を実現します。バージョン管理されたスプレッドシートで予実管理を行い、クラウド不要で共有サーバー上のコラボレーションを実現。AIアシスタントが複雑な財務モデルや経営レポートの正確性を担保します。',
      zh: '将基于Excel的财务工作流转变为强大的绩效管理平台。Insight Performance Management为您的KPI、预算和财务模型提供AI驱动的分析——验证公式、检测异常并提供可执行的洞察。通过版本控制的电子表格追踪预算与实际绩效，在共享服务器上协作无需云端开销，AI助手确保复杂财务模型和管理报告的准确性。',
    },
    features: {
      en: [
        'AI-powered KPI tracking and anomaly detection',
        'Budget vs. actual performance dashboards',
        'Financial model validation — formula checking and error prevention',
        'Version-controlled spreadsheets with cell-level change history',
        'Team collaboration on shared servers (no cloud required)',
        'Management reporting with AI-assisted insights',
      ],
      ja: [
        'AI搭載のKPI追跡・異常値検出',
        '予算対実績パフォーマンスダッシュボード',
        '財務モデル検証 — 計算式チェックとエラー防止',
        'セル単位の変更履歴付きバージョン管理スプレッドシート',
        '共有サーバーでのチームコラボレーション（クラウド不要）',
        'AIアシスタントによるインサイト付き経営レポーティング',
      ],
      zh: [
        'AI驱动的KPI追踪与异常检测',
        '预算与实际绩效对比仪表板',
        '财务模型验证 — 公式检查与错误预防',
        '带单元格级变更历史的版本控制电子表格',
        '共享服务器上的团队协作（无需云环境）',
        'AI辅助洞察的经营报告',
      ],
    },
    useCases: {
      en: [
        'Monthly and quarterly business performance reviews with AI analysis',
        'Budget planning, forecasting, and variance analysis',
        'Financial model auditing and formula integrity checks',
        'Cross-department KPI consolidation and management reporting',
      ],
      ja: [
        'AIによる月次・四半期ビジネスパフォーマンスレビュー',
        '予算策定・予測・差異分析',
        '財務モデル監査と計算式の整合性チェック',
        '部門横断KPI集約と経営レポーティング',
      ],
      zh: [
        '通过AI进行月度和季度业务绩效评审',
        '预算规划、预测与差异分析',
        '财务模型审计与公式完整性检查',
        '跨部门KPI汇总与经营报告',
      ],
    },
    releases: {
      windows: { version: '1.0.0', tag: 'IOSH-v1.0.0', fileName: 'InsightPerformanceManagement-v1.0.0-win-x64.zip' },
    },
    screenshots: [
      { file: 'main.png', label: { en: 'Main View', ja: 'メイン画面', zh: '主界面' } },
      { file: 'version-history.png', label: { en: 'Version History', ja: '履歴管理', zh: '版本历史' } },
      { file: 'ai-assistant.png', label: { en: 'AI Assistant', ja: 'AIアシスタント', zh: 'AI助手' } },
    ],
  },
  {
    code: 'ISOF',
    slug: 'insight-senior-office',
    status: 'development',
    displayOrder: 20,
    category: 'consulting',
    svgIcon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    colorGradient: 'from-rose-400 to-pink-600',
    platforms: ['windows'],
    name: { en: 'InsightSeniorOffice', ja: 'InsightSeniorOffice', zh: 'InsightSeniorOffice' },
    tagline: {
      en: 'Simple Office App for Seniors — Document, Spreadsheet & Email in One',
      ja: 'シニア向けシンプルオフィス — 文書・表計算・メールを1つに',
      zh: '适合老年人的简易办公软件 — 文档、表格、邮件一体化',
    },
    description: {
      en: 'An office app designed for users aged 80 and above — no Microsoft Office license required. Large text and buttons for easy viewing and tapping, voice input to type by speaking, text-to-speech to read documents aloud, and natural language commands like \'Put 10,000 yen in A2\'. Documents, spreadsheets, and email unified in one simple interface. Reads and writes Word/Excel formats for compatibility.',
      ja: '80代以上の高齢者も迷わず使えるオフィスアプリ。Microsoft Officeのライセンスは不要です。大きな文字とボタンで見やすく押しやすい。話すだけで文字入力、文書やメールの読み上げ、「A2に1万円入れて」などの自然言語操作に対応。Word/Excel形式の読み書きに対応しているので、他のPCとのファイルのやりとりも問題ありません。',
      zh: '专为80岁以上老年人设计的办公软件，无需Microsoft Office许可证。大字体、大按钮，清晰易点击。支持语音输入、文档朗读、以及「在A2输入1万日元」等自然语言操作。支持Word/Excel格式读写，与其他电脑文件兼容。',
    },
    features: {
      en: [
        'No Microsoft Office required — save on license costs',
        'Reads & writes Word/Excel formats for compatibility',
        'Large text & buttons — adjustable size (70%–150%)',
        'Voice input — type by speaking',
        'Text-to-speech — read documents and emails aloud',
        'Natural language spreadsheet commands',
      ],
      ja: [
        'Microsoft Office不要 — ライセンスコスト削減',
        'Word/Excel形式の読み書き対応 — 他PCとの互換性確保',
        '大きな文字とボタン — サイズ調整可能（70%〜150%）',
        '音声入力 — 話すだけで文字入力',
        '読み上げ機能 — 文書やメールを音声で確認',
        '自然言語での表操作（「A2に1万円入れて」）',
      ],
      zh: [
        '无需Microsoft Office — 节省许可证成本',
        '支持Word/Excel格式读写 — 与其他电脑兼容',
        '大字体、大按钮 — 可调整大小（70%–150%）',
        '语音输入 — 说话即可输入文字',
        '朗读功能 — 朗读文档和邮件',
        '自然语言表格操作（「在A2输入1万日元」）',
      ],
    },
    useCases: {
      en: [
        'PC operation for elderly family members',
        'Senior citizen community centers and lifelong learning programs',
        'Nursing homes and senior care facilities — no Office license needed',
        'Municipality digital literacy programs for seniors',
      ],
      ja: [
        '高齢の家族のパソコン操作支援',
        'シニア向け公民館・生涯学習プログラム',
        '介護施設・高齢者ホームでの導入 — Officeライセンス不要',
        '自治体のシニア向けデジタルリテラシー推進',
      ],
      zh: [
        '帮助年迈家人使用电脑',
        '老年社区中心、终身学习项目',
        '养老院和老年护理设施 — 无需Office许可证',
        '政府面向老年人的数字素养项目',
      ],
    },
    releases: {},
    screenshots: [
      { file: 'document.png', label: { en: 'Document Editor', ja: '文書作成', zh: '文档编辑' } },
      { file: 'spreadsheet.png', label: { en: 'Spreadsheet', ja: '表計算', zh: '表格' } },
      { file: 'email.png', label: { en: 'Email', ja: 'メール', zh: '邮件' } },
    ],
  },
  {
    code: 'IOSD',
    slug: 'insight-ai-briefcase',
    status: 'development',
    displayOrder: 30,
    category: 'consulting',
    svgIcon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    colorGradient: 'from-amber-500 to-yellow-700',
    platforms: ['windows'],
    name: { en: 'Insight AI Doc Factory', ja: 'Insight AI Doc Factory', zh: 'Insight AI Doc Factory' },
    tagline: {
      en: 'AI-Powered Document Factory — Generate Documents from Your Templates at Scale',
      ja: 'AI搭載 ドキュメント工場 — インテリジェントな整理・管理・作成',
      zh: 'AI驱动的商务文档公文包 — 智能整理、管理与创建',
    },
    description: {
      en: 'Your AI-powered briefcase for business documents. Insight AI Doc Factory consolidates contracts, proposals, reports, and reference materials into a single managed workspace. Register source documents and the AI assistant cross-references them to draft new content, summarize existing files, and answer questions about your document portfolio. Full version history keeps every revision safe, while AI-driven insights help you create polished deliverables faster.',
      ja: 'ビジネス文書のためのAI搭載ドキュメント工場。契約書、提案書、報告書、参考資料を1つの管理されたワークスペースに集約します。ソース文書を登録すると、AIアシスタントがそれらを相互参照して新しいコンテンツの起草、既存ファイルの要約、ドキュメントポートフォリオに関する質問への回答を行います。完全なバージョン履歴ですべての改訂を安全に保持し、AIドリブンのインサイトで洗練された成果物をより速く作成できます。',
      zh: '您的AI商务文档公文包。Insight AI Doc Factory将合同、提案、报告和参考资料整合到一个统一管理的工作空间中。注册源文档后，AI助手会交叉引用它们来起草新内容、摘要现有文件并回答关于您文档组合的问题。完整的版本历史确保每次修订安全保存，AI驱动的洞察帮助您更快地创建精美的交付物。',
    },
    features: {
      en: [
        'AI-powered document briefcase — organize contracts, proposals & reports in one workspace',
        'Cross-reference registered materials for AI-assisted drafting',
        'Full version history — every revision safely preserved',
        'Document Q&A — ask questions about your entire document portfolio',
        'AI summarization and content generation from source materials',
        'Export to PDF, Word, and other formats',
      ],
      ja: [
        'AI搭載のドキュメント工場 — 契約書・提案書・報告書を1つのワークスペースで管理',
        '登録資料の相互参照によるAIアシスト起草',
        '完全なバージョン履歴 — すべての改訂を安全に保持',
        'ドキュメントQ&A — ドキュメントポートフォリオ全体への質問',
        'ソース資料からのAI要約・コンテンツ生成',
        'PDF・Word等の各種フォーマットへのエクスポート',
      ],
      zh: [
        'AI驱动的文档公文包 — 在一个工作空间中管理合同、提案和报告',
        '交叉引用注册资料进行AI辅助起草',
        '完整版本历史 — 每次修订安全保存',
        '文档问答 — 针对整个文档组合提问',
        '从源材料进行AI摘要与内容生成',
        '导出为PDF、Word等多种格式',
      ],
    },
    useCases: {
      en: [
        'Consolidating project documents into a single managed briefcase',
        'AI-assisted contract and proposal drafting from reference materials',
        'Executive briefing preparation with cross-referenced source documents',
        'Consulting deliverable management with full version tracking',
      ],
      ja: [
        'プロジェクト文書を1つの管理されたドキュメント工場に集約',
        '参考資料からのAIアシスト契約書・提案書起草',
        '相互参照されたソース文書によるエグゼクティブブリーフィング準備',
        '完全なバージョン追跡付きコンサルティング成果物管理',
      ],
      zh: [
        '将项目文档整合到一个统一管理的公文包中',
        '基于参考资料的AI辅助合同和提案起草',
        '通过交叉引用源文档准备高管简报',
        '带完整版本追踪的咨询交付物管理',
      ],
    },
    releases: {},
  },
  {
    code: 'INSS',
    slug: 'insight-deck-quality-gate',
    status: 'published',
    displayOrder: 40,
    category: 'consulting',
    svgIcon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122',
    colorGradient: 'from-orange-400 to-amber-600',
    platforms: ['windows'],
    name: { en: 'Insight Deck Quality Gate', ja: 'Insight Deck Quality Gate', zh: 'Insight Deck Quality Gate' },
    tagline: {
      en: 'AI-Powered Presentation Quality Management — Review, Extract, Automate Slide Decks',
      ja: 'AI駆動プレゼン品質管理 — スライドデッキのレビュー・抽出・自動化',
      zh: 'AI驱动演示质量管理 — 幻灯片审查、提取与自动化',
    },
    description: {
      en: 'AI-powered presentation quality management tool that reviews, extracts, and automates slide deck workflows. Extract all text from PowerPoint slides and export to Excel for efficient bulk editing. The built-in AI assistant checks logical consistency, data accuracy, and messaging clarity — acting as a quality gate before client delivery. Automate repetitive review tasks across hundreds of slides with intelligent analysis and structured output.',
      ja: 'スライドデッキのレビュー・抽出・自動化を実現するAI駆動プレゼン品質管理ツール。PowerPointのテキストを全て抽出し、Excelへのエクスポートで効率的な一括編集が可能。搭載のAIアシスタントが論理的一貫性・データ正確性・メッセージの明確さをチェックし、クライアント納品前のクオリティゲートとして機能します。数百枚のスライドに対するレビュー作業をインテリジェントな分析と構造化出力で自動化します。',
      zh: 'AI驱动的演示质量管理工具，实现幻灯片审查、提取与工作流自动化。提取PowerPoint中的所有文本并导出到Excel进行高效批量编辑。内置AI助手检查逻辑一致性、数据准确性和信息表达的清晰度，在客户交付前充当质量关卡。通过智能分析和结构化输出，自动化数百张幻灯片的重复审查任务。',
    },
    features: {
      en: [
        'AI-powered quality gate — review presentation content before delivery',
        'Full text extraction from PowerPoint slide decks',
        'Export to Excel for bulk editing and structured review',
        'Automated consistency and accuracy checking across slides',
        'Typo detection, terminology validation, and content structure analysis',
        'Multilingual translation workflow via Excel export/import',
      ],
      ja: [
        'AI品質ゲート — 納品前のプレゼン内容レビュー',
        'PowerPointスライドデッキからの全テキスト抽出',
        'Excelエクスポートによる一括編集・構造化レビュー',
        'スライド横断の整合性・正確性自動チェック',
        '誤字検出・用語検証・コンテンツ構成分析',
        'Excel経由の多言語翻訳ワークフロー',
      ],
      zh: [
        'AI质量关卡 — 交付前审查演示内容',
        'PowerPoint幻灯片全文本提取',
        '导出到Excel进行批量编辑和结构化审阅',
        '跨幻灯片的一致性和准确性自动检查',
        '错别字检测、术语验证和内容结构分析',
        '通过Excel导出导入实现多语言翻译工作流',
      ],
    },
    useCases: {
      en: [
        'AI-powered quality gate review before client presentation delivery',
        'Automated review of large PowerPoint decks (100+ pages)',
        'Bulk terminology and accuracy validation via Excel export',
        'Multilingual slide deck translation and localization workflow',
      ],
      ja: [
        'クライアントプレゼン納品前のAI品質ゲートレビュー',
        '大量PowerPointデッキ（100ページ超）の自動レビュー',
        'Excelエクスポートによる用語・正確性の一括検証',
        'スライドデッキの多言語翻訳・ローカライゼーションワークフロー',
      ],
      zh: [
        '客户演示交付前的AI质量关卡审查',
        '大量PowerPoint幻灯片（100页以上）的自动审阅',
        '通过Excel导出进行术语和准确性批量验证',
        '幻灯片多语言翻译和本地化工作流',
      ],
    },
    releases: {
      windows: { version: '1.0.0', tag: 'INSS-v1.0.0', fileName: 'InsightSlide-v1.0.0-win-x64.zip' },
    },
    screenshots: [
      { file: 'main.png', label: { en: 'Main View', ja: 'メイン画面', zh: '主界面' } },
      { file: 'ai-review.png', label: { en: 'AI Review', ja: 'AIレビュー', zh: 'AI审阅' } },
      { file: 'excel-export.png', label: { en: 'Excel Export', ja: 'Excel出力', zh: 'Excel导出' } },
    ],
  },
  {
    code: 'IVIN',
    slug: 'interview-insight',
    status: 'development',
    displayOrder: 50,
    category: 'consulting',
    svgIcon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    colorGradient: 'from-teal-500 to-cyan-600',
    platforms: ['windows'],
    name: { en: 'InterviewInsight', ja: 'InterviewInsight', zh: 'InterviewInsight' },
    tagline: {
      en: 'Automated Interview & Business Survey Support',
      ja: '自動ヒアリング・業務調査支援',
      zh: '自动访谈与业务调查支持',
    },
    description: {
      en: 'Fully automate interviews for business surveys and requirements definition. Users respond by voice to pre-configured interview sheets, and their answers are transcribed to text in real time and registered automatically. AI then summarizes and categorizes responses into issues, concerns, tasks, and completed items — so you can focus on problem-solving and next actions.',
      ja: '業務調査や要件定義時のインタビューを完全自動化。ユーザーは事前に設定されたインタビューシートに音声で回答し、リアルタイムにテキスト化されて回答が登録されます。回答はAIにより問題点・課題・懸念点、タスク、完了事項などに要約・分類されるため、次のアクションや問題解決に注力することができます。',
      zh: '完全自动化业务调查和需求定义阶段的访谈。用户通过语音回答预设的访谈表，回答实时转录为文本并自动登记。AI自动将回答汇总分类为问题点、课题、关注事项、任务和已完成事项，让您专注于下一步行动和问题解决。',
    },
    features: {
      en: [
        'Pre-configured interview sheet templates',
        'Voice-to-text real-time transcription',
        'Automatic answer registration',
        'AI-powered response summarization',
        'Categorization into issues, tasks, and concerns',
        'Actionable insight extraction',
      ],
      ja: [
        '事前設定可能なインタビューシートテンプレート',
        '音声からテキストへのリアルタイム変換',
        '回答の自動登録',
        'AIによる回答の要約',
        '問題点・タスク・懸念点への自動分類',
        'アクションにつながるインサイト抽出',
      ],
      zh: [
        '可预设的访谈表模板',
        '语音实时转录为文本',
        '回答自动登记',
        'AI驱动的回答摘要',
        '自动分类为问题、任务和关注事项',
        '可操作的洞察提取',
      ],
    },
    useCases: {
      en: [
        'Automated stakeholder interviews during business surveys',
        'Requirements definition hearing with real-time transcription',
        'AI-categorized issue and task extraction from interviews',
        'Scalable interview process across multiple departments',
      ],
      ja: [
        '業務調査時のステークホルダーインタビュー自動化',
        'リアルタイム文字起こし付き要件定義ヒアリング',
        'インタビューからのAI分類による課題・タスク抽出',
        '複数部門横断のスケーラブルなインタビュープロセス',
      ],
      zh: [
        '业务调查中的利益相关方访谈自动化',
        '带实时转录的需求定义访谈',
        '通过AI分类从访谈中提取课题与任务',
        '跨多部门的可扩展访谈流程',
      ],
    },
    releases: {},
  },

  // ===========================================================================
  // カテゴリ: Content Creation (content)
  // ===========================================================================

  {
    code: 'INMV',
    slug: 'insight-cast',
    status: 'published',
    displayOrder: 10,
    category: 'content',
    svgIcon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    colorGradient: 'from-red-500 to-rose-600',
    platforms: ['windows'],
    name: { en: 'Insight Training Studio', ja: 'Insight Training Studio', zh: 'Insight Training Studio' },
    tagline: {
      en: 'Training & Presentation Video Creation Tool',
      ja: '教育・プレゼン動画作成ツール',
      zh: '教育・演示视频制作工具',
    },
    description: {
      en: 'Enter descriptive text for images and Insight Training Studio automatically converts it to speech and produces a video. Turn presentation materials into training videos for playback, or create educational content with ease. It can also convert PowerPoint slides into images and turn speech notes into narration to automatically generate videos — dramatically improving the efficiency of training material preparation and presentation review.',
      ja: '画像に説明用のテキストを入力するだけで、自動で音声化して動画を作成。プレゼンテーション資料を教育・研修用の動画にして流したり、教育用の教材を動画にするのも簡単です。さらに、PowerPointの資料をスライド画像に変換し、スピーチノートを音声化して自動で動画を作成する機能も搭載。教育・プレゼンテーション資料の準備やレビューの効率が格段に向上します。',
      zh: '只需输入图像的说明文字，即可自动转换为语音并生成视频。轻松将演示资料制作为培训视频播放，或将教育教材转换为视频。还可以将PowerPoint资料转换为图像，将演讲备注转换为语音，自动生成视频——大幅提升培训材料准备和演示审阅的效率。',
    },
    features: {
      en: [
        'Image + text to video auto-generation',
        'Automatic text-to-speech conversion',
        'PowerPoint slides to video conversion',
        'Speech notes to narration automation',
        'Presentation review video creation',
        'Multi-format video export',
      ],
      ja: [
        '画像＋テキストから動画自動生成',
        'テキストの自動音声変換',
        'PowerPointスライドから動画変換',
        'スピーチノートの自動ナレーション化',
        'プレゼンテーションレビュー動画の作成',
        'マルチフォーマット動画出力',
      ],
      zh: [
        '图像+文本自动生成视频',
        '文本自动语音转换',
        'PowerPoint幻灯片转视频',
        '演讲备注自动旁白化',
        '演示审阅视频创建',
        '多格式视频导出',
      ],
    },
    useCases: {
      en: [
        'Presentation materials converted to video for playback',
        'Educational and training content video creation',
        'PowerPoint to narrated video for review efficiency',
        'Client-facing business process explanation videos',
      ],
      ja: [
        'プレゼンテーション資料を動画化して配信',
        '教育・研修コンテンツ動画作成',
        'PowerPointからナレーション付き動画でレビュー効率化',
        'クライアント向け業務プロセス説明動画の作成',
      ],
      zh: [
        '将演示资料转换为视频播放',
        '教育培训内容的视频制作',
        'PowerPoint转带旁白视频提升审阅效率',
        '面向客户的业务流程说明视频制作',
      ],
    },
    releases: {
      windows: { version: '1.0.0', tag: 'INMV-v1.0.0', fileName: 'InsightCast-v1.0.0-win-x64.zip' },
    },
  },
  {
    code: 'INIG',
    slug: 'insight-image-gen',
    status: 'published',
    displayOrder: 20,
    category: 'content',
    svgIcon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    colorGradient: 'from-purple-500 to-pink-600',
    platforms: ['windows'],
    name: { en: 'InsightImageGen', ja: 'InsightImageGen', zh: 'InsightImageGen' },
    tagline: {
      en: 'Batch AI Image Generation for Business Materials',
      ja: '業務資料向けAI画像の大量自動生成ツール',
      zh: '面向业务资料的AI图像批量自动生成工具',
    },
    description: {
      en: 'AI image generation often requires extensive trial and error — the same prompt rarely produces the perfect result on the first try. InsightImageGen lets you define prompts in JSON and automatically generate dozens or hundreds of images in batch. A built-in management tool makes it easy to review, compare, and delete generated images to find the perfect visual for your deliverables.',
      ja: 'AI画像生成は同じプロンプトでも思い通りの結果になることは稀で、何十回も何百回もの試行錯誤が欠かせません。InsightImageGenはJSONにプロンプトを記述し、何十枚も何百枚もの画像を自動で大量生成。作成した画像は管理ツールで一覧確認でき、不要な画像の削除も簡単に行えます。',
      zh: 'AI图像生成即使使用相同提示词也很难一次得到理想结果，需要反复数十次甚至数百次的试错。InsightImageGen让您在JSON中编写提示词，自动批量生成数十张乃至数百张图像。通过内置管理工具，可以轻松浏览、比较和删除生成的图像。',
    },
    features: {
      en: [
        'JSON-based prompt batch definition',
        'Bulk image generation (dozens to hundreds)',
        'Built-in image management and review tool',
        'Easy deletion and filtering of results',
        'Stable Diffusion integration',
        'High-resolution 4K output',
      ],
      ja: [
        'JSONベースのプロンプト一括定義',
        '大量画像の自動バッチ生成（数十〜数百枚）',
        '生成画像の管理・確認ツール内蔵',
        '不要画像の簡単削除・フィルタリング',
        'Stable Diffusion統合',
        '4K高解像度出力',
      ],
      zh: [
        '基于JSON的提示词批量定义',
        '自动批量生成大量图像（数十至数百张）',
        '内置生成图像管理与浏览工具',
        '轻松删除和筛选结果',
        'Stable Diffusion集成',
        '4K高分辨率输出',
      ],
    },
    useCases: {
      en: [
        'Batch generation of visuals for consulting deliverables',
        'Trial-and-error image creation for proposal materials',
        'Concept illustration generation with prompt iteration',
        'Visual asset library building for recurring projects',
      ],
      ja: [
        'コンサルティング納品物向けビジュアルの大量生成',
        '提案資料向け画像の試行錯誤的作成',
        'プロンプト反復によるコンセプトイラスト生成',
        '継続案件向けビジュアルアセットライブラリの構築',
      ],
      zh: [
        '咨询交付物视觉素材批量生成',
        '提案资料图像的反复试错创作',
        '通过提示词迭代生成概念插图',
        '为持续项目构建视觉素材库',
      ],
    },
    releases: {
      windows: { version: '1.0.0', tag: 'INIG-v1.0.0', fileName: 'InsightImageGen-v1.0.0-win-x64.zip' },
    },
  },

  // ===========================================================================
  // カテゴリ: Utility Apps (utility)
  // ===========================================================================

  {
    code: 'LAUNCHER',
    slug: 'insight-launcher',
    status: 'hidden',
    displayOrder: 10,
    category: 'utility',
    svgIcon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    colorGradient: 'from-gray-500 to-gray-700',
    platforms: ['windows'],
    name: { en: 'Insight Launcher', ja: 'Insight Launcher', zh: 'Insight Launcher' },
    tagline: {
      en: 'Unified launcher for all Insight products',
      ja: 'Insight製品の統合ランチャー',
      zh: 'Insight产品统一启动器',
    },
    description: {
      en: 'A unified launcher that provides quick access to all installed Insight products from a single interface.',
      ja: 'インストール済みの全Insight製品に1つの画面からアクセスできる統合ランチャーです。',
      zh: '通过统一界面快速访问所有已安装的Insight产品。',
    },
    features: {
      en: ['Quick access to all Insight products', 'Product status overview', 'Auto-update management'],
      ja: ['全Insight製品への即座のアクセス', '製品ステータス概要', '自動アップデート管理'],
      zh: ['快速访问所有Insight产品', '产品状态概览', '自动更新管理'],
    },
    useCases: {
      en: ['Centralized access to Insight product suite'],
      ja: ['Insight製品スイートへの一元的なアクセス'],
      zh: ['集中访问Insight产品套件'],
    },
    releases: {},
  },
  {
    code: 'CAMERA',
    slug: 'insight-camera',
    status: 'hidden',
    displayOrder: 20,
    category: 'utility',
    svgIcon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z',
    colorGradient: 'from-amber-500 to-amber-700',
    platforms: ['android'],
    name: { en: 'Insight Camera', ja: 'スッキリカメラ', zh: 'Insight Camera' },
    tagline: {
      en: 'Simple camera with beautiful photos',
      ja: 'シンプルで綺麗に撮れるカメラ',
      zh: '简洁好用的相机应用',
    },
    description: {
      en: 'A simple camera app that takes beautiful photos without complexity. Features always-on flashlight, one-tap capture, and automatic OEM image processing via CameraX Extensions.',
      ja: '難しいことを考えなくても綺麗な写真が撮れるシンプルなカメラアプリ。常時ライト点灯、ワンタッチ操作、CameraX Extensions による OEM 画質自動適用に対応。',
      zh: '无需复杂操作即可拍出精美照片的简洁相机应用。支持常亮闪光灯、一键拍摄、CameraX Extensions自动应用OEM图像处理。',
    },
    features: {
      en: ['Always-on flashlight', 'One-tap capture', 'Auto OEM quality (CameraX Extensions)', 'Photo & video recording', 'Pinch zoom with presets'],
      ja: ['常時ライト点灯', 'ワンタッチ撮影', 'OEM画質自動適用（CameraX Extensions）', '写真・動画撮影', 'ピンチズーム + プリセット'],
      zh: ['常亮闪光灯', '一键拍摄', '自动OEM画质（CameraX Extensions）', '照片与视频录制', '捏合缩放+预设'],
    },
    useCases: {
      en: ['Simple photo and video capture for everyday use', 'Galaxy Fold optimized camera experience'],
      ja: ['日常のシンプルな写真・動画撮影', 'Galaxy Fold 最適化カメラ体験'],
      zh: ['日常简单拍照和录像', 'Galaxy Fold优化相机体验'],
    },
    releases: {
      android: {
        version: '1.0.0',
        tag: 'v1.0.0',
        fileName: 'InsightCamera-arm64-v8a-release.apk',
        releaseDate: '2026-02-15',
      },
    },
  },
  {
    code: 'VOICE_CLOCK',
    slug: 'insight-voice-clock',
    status: 'hidden',
    displayOrder: 30,
    category: 'utility',
    svgIcon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    colorGradient: 'from-indigo-400 to-indigo-600',
    platforms: ['android', 'ios'],
    name: { en: 'Insight Voice Clock', ja: 'Insight Voice Clock', zh: 'Insight Voice Clock' },
    tagline: {
      en: 'Voice-activated clock and reminder app',
      ja: '音声対応時計・リマインダーアプリ',
      zh: '语音时钟与提醒应用',
    },
    description: {
      en: 'A voice-activated clock with reminder and alarm features, designed for accessibility.',
      ja: '音声操作対応の時計アプリ。リマインダー・アラーム機能搭載。アクセシビリティに配慮した設計です。',
      zh: '支持语音操作的时钟应用，具有提醒和闹钟功能，注重无障碍设计。',
    },
    features: {
      en: ['Voice-activated controls', 'Reminders and alarms', 'Accessibility-first design'],
      ja: ['音声操作', 'リマインダー・アラーム', 'アクセシビリティ重視設計'],
      zh: ['语音操控', '提醒与闹钟', '无障碍优先设计'],
    },
    useCases: {
      en: ['Hands-free time management'],
      ja: ['ハンズフリーの時間管理'],
      zh: ['免提时间管理'],
    },
    releases: {},
  },
  {
    code: 'QR',
    slug: 'insight-qr',
    status: 'hidden',
    displayOrder: 40,
    category: 'utility',
    svgIcon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z',
    colorGradient: 'from-slate-500 to-slate-700',
    platforms: ['android', 'ios'],
    name: { en: 'Insight QR', ja: 'Insight QR', zh: 'Insight QR' },
    tagline: {
      en: 'QR code scanner and generator',
      ja: 'QRコードスキャナー＆ジェネレーター',
      zh: 'QR码扫描与生成器',
    },
    description: {
      en: 'Scan and generate QR codes with history tracking and batch generation support.',
      ja: 'QRコードのスキャン・生成。履歴管理やバッチ生成に対応。',
      zh: '扫描和生成QR码，支持历史记录和批量生成。',
    },
    features: {
      en: ['QR code scanning', 'QR code generation', 'History tracking', 'Batch generation'],
      ja: ['QRコードスキャン', 'QRコード生成', '履歴管理', 'バッチ生成'],
      zh: ['QR码扫描', 'QR码生成', '历史记录', '批量生成'],
    },
    useCases: {
      en: ['Business card scanning', 'URL sharing via QR codes'],
      ja: ['名刺スキャン', 'QRコードによるURL共有'],
      zh: ['名片扫描', '通过QR码分享URL'],
    },
    releases: {},
  },
  {
    code: 'PINBOARD',
    slug: 'insight-pinboard',
    status: 'hidden',
    displayOrder: 50,
    category: 'utility',
    svgIcon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    colorGradient: 'from-yellow-400 to-orange-500',
    platforms: ['android', 'ios'],
    name: { en: 'Insight PinBoard', ja: 'Insight PinBoard', zh: 'Insight PinBoard' },
    tagline: {
      en: 'Quick notes and pinned content manager',
      ja: 'クイックノート＆ピンボード',
      zh: '快速笔记与固定内容管理器',
    },
    description: {
      en: 'Pin important notes, links, and snippets for quick access. Sync across devices for seamless workflow.',
      ja: '重要なメモ・リンク・スニペットをピン留め。デバイス間同期でシームレスなワークフローを実現。',
      zh: '固定重要笔记、链接和片段，快速访问。跨设备同步实现无缝工作流。',
    },
    features: {
      en: ['Pin notes and links', 'Cross-device sync', 'Quick access'],
      ja: ['メモ・リンクのピン留め', 'デバイス間同期', '即座のアクセス'],
      zh: ['固定笔记和链接', '跨设备同步', '快速访问'],
    },
    useCases: {
      en: ['Meeting notes pinning', 'Quick reference management'],
      ja: ['会議メモのピン留め', 'クイックリファレンス管理'],
      zh: ['会议笔记固定', '快速参考管理'],
    },
    releases: {},
  },
  {
    code: 'VOICE_MEMO',
    slug: 'insight-voice-memo',
    status: 'hidden',
    displayOrder: 60,
    category: 'utility',
    svgIcon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
    colorGradient: 'from-pink-400 to-red-500',
    platforms: ['android', 'ios'],
    name: { en: 'Insight Voice Memo', ja: 'Insight Voice Memo', zh: 'Insight Voice Memo' },
    tagline: {
      en: 'Voice memo with AI transcription',
      ja: 'AI文字起こし付き音声メモ',
      zh: '搭载AI转录的语音备忘录',
    },
    description: {
      en: 'Record voice memos with automatic AI-powered transcription. Search and organize your memos by content.',
      ja: '音声メモを録音し、AIが自動でテキスト化。内容で検索・整理が可能です。',
      zh: '录制语音备忘录，AI自动转录。可按内容搜索和整理。',
    },
    features: {
      en: ['Voice recording', 'AI transcription', 'Content search', 'Organization by tags'],
      ja: ['音声録音', 'AI文字起こし', '内容検索', 'タグによる整理'],
      zh: ['语音录制', 'AI转录', '内容搜索', '标签整理'],
    },
    useCases: {
      en: ['Meeting recording and transcription', 'Field notes capture'],
      ja: ['会議の録音・文字起こし', 'フィールドノートの記録'],
      zh: ['会议录音与转录', '现场笔记记录'],
    },
    releases: {},
  },
  {
    code: 'VOICE_TASK_CALENDAR',
    slug: 'insight-voice-task-calendar',
    status: 'hidden',
    displayOrder: 70,
    category: 'utility',
    svgIcon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    colorGradient: 'from-blue-400 to-indigo-500',
    platforms: ['android'],
    name: { en: 'Insight Voice Task Calendar', ja: 'Insight Voice Task Calendar', zh: 'Insight Voice Task Calendar' },
    tagline: {
      en: 'Voice-powered task management calendar',
      ja: '音声対応タスク管理カレンダー',
      zh: '语音驱动的任务管理日历',
    },
    description: {
      en: 'A calendar app with voice-powered task management. Add and manage tasks using voice input for hands-free productivity.',
      ja: '音声でタスクを追加・管理できるカレンダーアプリ。ハンズフリーで生産性を向上させます。',
      zh: '通过语音添加和管理任务的日历应用，实现免提高效工作。',
    },
    features: {
      en: ['Voice task input', 'Calendar view', 'Task management', 'Reminders'],
      ja: ['音声タスク入力', 'カレンダー表示', 'タスク管理', 'リマインダー'],
      zh: ['语音任务输入', '日历视图', '任务管理', '提醒功能'],
    },
    useCases: {
      en: ['Hands-free task scheduling', 'Voice-powered daily planning'],
      ja: ['ハンズフリーのタスクスケジューリング', '音声による日次計画'],
      zh: ['免提任务安排', '语音驱动的日常规划'],
    },
    releases: {},
  },
];

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * Web サイトに表示する製品を取得（published + development）
 *
 * hidden は除外。development は「開発中」バッジ付きで表示。
 */
export function getVisibleProducts(): CatalogEntry[] {
  return PRODUCT_CATALOG
    .filter(p => p.status !== 'hidden')
    .sort((a, b) => {
      const catA = CATEGORY_ORDER.indexOf(a.category);
      const catB = CATEGORY_ORDER.indexOf(b.category);
      if (catA !== catB) return catA - catB;
      return a.displayOrder - b.displayOrder;
    });
}

/**
 * 公開済み（published）の製品のみ取得
 */
export function getPublishedProducts(): CatalogEntry[] {
  return PRODUCT_CATALOG
    .filter(p => p.status === 'published')
    .sort((a, b) => {
      const catA = CATEGORY_ORDER.indexOf(a.category);
      const catB = CATEGORY_ORDER.indexOf(b.category);
      if (catA !== catB) return catA - catB;
      return a.displayOrder - b.displayOrder;
    });
}

/**
 * ステータスで製品をフィルタ
 */
export function getProductsByStatus(status: CatalogStatus): CatalogEntry[] {
  return PRODUCT_CATALOG
    .filter(p => p.status === status)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * カテゴリ別に製品を取得（hidden 以外）
 */
export function getProductsByCategory(category: WebsiteCategory): CatalogEntry[] {
  return PRODUCT_CATALOG
    .filter(p => p.status !== 'hidden' && p.category === category)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * スラッグで製品を検索
 */
export function getProductBySlug(slug: string): CatalogEntry | undefined {
  return PRODUCT_CATALOG.find(p => p.slug === slug);
}

/**
 * 製品コードで検索
 */
export function getProductByCode(code: CatalogCode): CatalogEntry | undefined {
  return PRODUCT_CATALOG.find(p => p.code === code);
}

/**
 * プラットフォーム別の表示対象製品を取得（hidden 以外）
 */
export function getVisibleProductsByPlatform(platform: PlatformType): CatalogEntry[] {
  return getVisibleProducts().filter(p => p.platforms.includes(platform));
}

/**
 * ステータスのラベルを取得
 */
export function getStatusLabel(status: CatalogStatus, locale: CatalogLocale = 'ja'): string {
  return STATUS_LABELS[status][locale];
}

/**
 * 製品のダウンロード URL を取得
 *
 * @returns ダウンロード URL。未リリースの場合は null
 */
export function getDownloadUrl(code: CatalogCode, platform: PlatformType): string | null {
  const product = getProductByCode(code);
  if (!product) return null;
  const release = product.releases[platform];
  if (!release || !release.tag) return null;
  return `${GITHUB_DOWNLOAD_BASE}/${release.tag}/${release.fileName}`;
}

/**
 * 製品がダウンロード可能かチェック
 */
export function isDownloadAvailable(code: CatalogCode, platform: PlatformType = 'windows'): boolean {
  const product = getProductByCode(code);
  if (!product) return false;
  const release = product.releases[platform];
  return !!release && !!release.tag;
}

/**
 * 全カテゴリとその公開製品を取得（Web サイトのカテゴリ別表示用）
 */
export function getCategorizedProducts(): Array<{
  category: WebsiteCategory;
  categoryName: Record<CatalogLocale, string>;
  products: CatalogEntry[];
}> {
  return CATEGORY_ORDER
    .map(cat => ({
      category: cat,
      categoryName: CATEGORY_NAMES[cat],
      products: getProductsByCategory(cat),
    }))
    .filter(group => group.products.length > 0);
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  // データ
  PRODUCT_CATALOG,
  CATEGORY_NAMES,
  CATEGORY_ORDER,
  STATUS_LABELS,
  GITHUB_DOWNLOAD_BASE,

  // ヘルパー
  getVisibleProducts,
  getPublishedProducts,
  getProductsByStatus,
  getProductsByCategory,
  getProductBySlug,
  getProductByCode,
  getVisibleProductsByPlatform,
  getDownloadUrl,
  isDownloadAvailable,
  getCategorizedProducts,
  getStatusLabel,
};
