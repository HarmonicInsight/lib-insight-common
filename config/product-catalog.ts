/**
 * HARMONIC insight 製品カタログ�E�Eeb サイト�Eダウンロード�Eージの唯一のマスターチE�Eタ�E�E
 *
 * ============================================================================
 * 【このファイルの役割、E
 * ============================================================================
 *
 * Web サイト！Ensight-office.com�E��E製品紹介�Eージ・ダウンロード�Eージに
 * 表示する全製品�E惁E��を一允E��琁E��ます、E
 *
 * ## なぜこのファイルが忁E��か
 * - products.ts はライセンス・機�Eマトリクスの管琁E���E��E部向け�E�E
 * - こ�Eファイルは「Web サイトに何をどぁE��せるか」�E管琁E���E�外部向け�E�E
 * - Web サイト�Eに製品データをハードコードする忁E��がなくなめE
 *
 * ## 管琁E��ロー
 * 1. こ�Eファイルを編雁E���E閁E非�E開、バージョン、説明文など�E�E
 * 2. git push ↁEWeb サイト�Eビルドが走めEↁE製品�Eージ自動更新
 *
 * ## 対象
 * - メイン製品E��Eroducts.ts の ProductCode に対応！E
 * - ユーチE��リチE��アプリ�E�Eauncher, Camera, QR など�E�E
 *
 * ## 製品追加手頁E
 * 1. PRODUCT_CATALOG 配�Eにエントリを追加
 * 2. status を設宁E
 *    - 'published'   ↁEWeb サイトに公開（通常表示�E�E
 *    - 'development' ↁE「開発中」バチE��付きで表示
 *    - 'hidden'      ↁEWeb サイトに表示しなぁE
 * 3. releases にダウンロード情報を設宁E
 */

import type { ProductCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** Web サイト�E多言語対忁E*/
export type CatalogLocale = 'en' | 'ja' | 'zh';

/** Web サイト�EカチE��リ刁E��E*/
export type WebsiteCategory = 'rpa' | 'consulting' | 'content' | 'utility';

/** 対応�EラチE��フォーム */
export type PlatformType = 'windows' | 'web' | 'android' | 'ios';

/**
 * カタログスチE�Eタス
 *
 * - published:   Web サイトに公開（通常表示�E�E
 * - development: 「開発中」バチE��付きで表示�E�EL ボタンは非活性�E�E
 * - hidden:      Web サイトに表示しなぁE���E部管琁E���E�E
 */
export type CatalogStatus = 'published' | 'development' | 'hidden';

/** スチE�Eタスの多言語ラベル */
export const STATUS_LABELS: Record<CatalogStatus, Record<CatalogLocale, string>> = {
  published: { en: 'Available', ja: '公開中', zh: '已发币E },
  development: { en: 'In Development', ja: '開発中', zh: '开发中' },
  hidden: { en: 'Hidden', ja: '非�E閁E, zh: '未公开' },
};

/** ユーチE��リチE��アプリコーチE*/
export type UtilityCode = 'LAUNCHER' | 'CAMERA' | 'VOICE_CLOCK' | 'QR' | 'PINBOARD' | 'VOICE_MEMO' | 'VOICE_TASK_CALENDAR';

/** カタログで扱ぁE�EコーチE*/
export type CatalogCode = ProductCode | UtilityCode;

/** リリース惁E���E��EラチE��フォーム単位！E*/
export interface ReleaseInfo {
  /** バ�Eジョン�E�侁E "1.0.0"�E�E*/
  version: string;
  /** GitHub リリースタグ�E�侁E "INBT-v1.0.0"�E�E*/
  tag: string;
  /** ダウンロードファイル名（侁E "InsightBotRPA_Setup_1.0.0.exe"�E�E*/
  fileName: string;
  /** リリース日�E�EYYY-MM-DD�E�E*/
  releaseDate?: string;
}

/** スクリーンショチE��定義 */
export interface ScreenshotEntry {
  /** ファイル名！Eublic/images/products/screenshots/{slug}/ 配下！E*/
  file: string;
  /** キャプション�E�多言語！E*/
  label: Record<CatalogLocale, string>;
}

/** カタログエントリ�E�E製品�E�E�E*/
export interface CatalogEntry {
  /** 製品コード！Eroducts.ts の ProductCode また�EユーチE��リチE��コード！E*/
  code: CatalogCode;
  /** URL スラチE���E�侁E "insight-bot"�E� EWeb サイト�E /products/{slug} に対忁E*/
  slug: string;
  /** 公開スチE�Eタス: 'published' | 'development' | 'hidden' */
  status: CatalogStatus;
  /** カチE��リ冁E�E表示頁E��小さぁE��ど先頭�E�E*/
  displayOrder: number;
  /** Web サイトでのカチE��リ刁E��E*/
  category: WebsiteCategory;
  /** SVG アイコンの path チE�Eタ�E�Etroke ベ�Eス、viewBox="0 0 24 24"�E�E*/
  svgIcon: string;
  /** Tailwind CSS グラチE�Eションクラス�E�侁E "from-emerald-500 to-teal-600"�E�E*/
  colorGradient: string;
  /** 対応�EラチE��フォーム */
  platforms: PlatformType[];
  /** 製品名�E�多言語！E*/
  name: Record<CatalogLocale, string>;
  /** 短ぁE��明文�E�多言語！E*/
  tagline: Record<CatalogLocale, string>;
  /** 詳細説明（多言語！E*/
  description: Record<CatalogLocale, string>;
  /** 主要機�E一覧�E�多言語、Web サイト表示用�E�E*/
  features: Record<CatalogLocale, string[]>;
  /** ユースケース�E�多言語！E*/
  useCases: Record<CatalogLocale, string[]>;
  /** プラチE��フォーム別リリース惁E���E�未リリースは空オブジェクト！E*/
  releases: Partial<Record<PlatformType, ReleaseInfo>>;
  /** スクリーンショチE�� */
  screenshots?: ScreenshotEntry[];
}

/** カチE��リ名�E多言語定義 */
export const CATEGORY_NAMES: Record<WebsiteCategory, Record<CatalogLocale, string>> = {
  rpa: {
    en: 'Automation & Delivery',
    ja: '自動化・チE��バリー',
    zh: '自动化与交仁E,
  },
  consulting: {
    en: 'Business Analysis, Requirements, Proposal & Strategy Simulation',
    ja: '業務調査・要件定義・提案�E経営シミュレーション',
    zh: '业务谁E���E需求定义�E提案�E经营模拁E,
  },
  content: {
    en: 'Content Creation',
    ja: 'コンチE��チE���E',
    zh: '冁E��创佁E,
  },
  utility: {
    en: 'Utility Apps',
    ja: 'ユーチE��リチE��アプリ',
    zh: '实用工具',
  },
};

/** GitHub ダウンロード�Eース URL */
export const GITHUB_DOWNLOAD_BASE = 'https://github.com/HarmonicInsight/releases/releases/download';

/** カチE��リの表示頁E*/
export const CATEGORY_ORDER: WebsiteCategory[] = ['rpa', 'consulting', 'content', 'utility'];

// =============================================================================
// 製品カタログチE�Eタ
// =============================================================================

export const PRODUCT_CATALOG: CatalogEntry[] = [

  // ===========================================================================
  // カチE��リ: Automation & Delivery (rpa)
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
      ja: 'AIエチE��タ搭輁E E業務最適化RPA + Orchestrator',
      zh: '搭载AI编辑器  E业务优化RPA + Orchestrator',
    },
    description: {
      en: 'Built-in AI Editor automatically generates bot scripts from natural language instructions. Turn the generated Python into production bots and visually orchestrate them into automated workflows. From AI-driven bot creation to visual job design, InsightBot streamlines business process automation delivery.',
      ja: '搭載�EAIエチE��タが�EチE��のスクリプトを�E動生成。生成したPythonを�EチE��化し、E��発したボットをビジュアルにJOB化して業務を自動化、EIによるボット作�EからビジュアルなJOB設計まで、業務�Eロセス自動化のチE��バリーを効玁E��します、E,
      zh: '冁E��AI编辑器从�E然语言持E��自动生�E机器人脚本。封E��成的Python转化为生产机器人�E�并通迁E��见E��编排实现业务流程�E动化。从AI驱动皁E��器人创建到可见E��JOB设计�E��E面简化业务流程�E动化交付、E,
    },
    features: {
      en: [
        'AI Editor  Egenerate bot scripts from natural language instructions',
        'Python-to-bot conversion',
        'Visual job orchestration designer',
        'Web and desktop automation',
        'Scheduled and triggered execution',
        'Centralized bot management',
      ],
      ja: [
        'AIエチE��タ  E自然言語�E持E��からボットスクリプトを�E動生戁E,
        'Pythonからボットへの変換',
        'ビジュアルJOBオーケストレーション設訁E,
        'Web・チE��クトップ�E動化',
        'スケジュール・トリガー実衁E,
        '雁E��ボット管琁E,
      ],
      zh: [
        'AI编辑器  E从�E然语言持E��自动生�E机器人脚本',
        'Python转机器人',
        '可见E��JOB编排设计',
        'Web和桌面自动匁E,
        '定时和触发执衁E,
        '雁E��式机器人管琁E,
      ],
    },
    useCases: {
      en: [
        'Auto-generate bots with AI Editor  Eno coding required',
        'Convert AI-generated Python into production bots',
        'Visual job design for business process automation',
        'Client back-office workflow automation delivery',
      ],
      ja: [
        'AIエチE��タでボットを自動生戁E EコーチE��ング不要E,
        'AIで作�EしたPythonを本番ボットに変換',
        '業務�Eロセス自動化のビジュアルJOB設訁E,
        'クライアント�Eバックオフィス業務�E動化の納品',
      ],
      zh: [
        '用AI编辑器自动生�E机器人  E无需编码E,
        '封EI生�E的Python转化为生产机器人',
        '业务流程�E动化的可见E��JOB设计',
        '客户后台业务流程�E动化交仁E,
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
      ja: 'RPA・ローコード�Eマイグレーション自動化チE�Eル',
      zh: 'RPA与低代码平台皁E��移自动化工具',
    },
    description: {
      en: 'Automate the migration of clients\' existing RPA and low-code environments to other platforms. From complexity analysis and effort estimation of original logic, to migration strategy proposals and automated process conversion  Eend-to-end migration support.',
      ja: 'AIが各ローコード�EラチE��フォームの仕絁E��解析、�EロジチE��の褁E��性刁E��による見積もり、移行方針提案から、�Eロセスの自動変換作業まで対応します、E,
      zh: '自动化客户现有RPA和低代码环墁E��其他平台皁E��移。从原始逻辑的复杂性刁E��与估算、迁移方针提案，到流程的自动转换作业，提供端到端迁移支持、E,
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
        '允E��ジチE��の褁E��性刁E��',
        '移行工数の自動見積もめE,
        '移行方針�E提案生戁E,
        'プラチE��フォーム間�Eロセス自動変換',
        'リスクと依存関係�EチE��ング',
        '詳細な移行ロード�EチE�E',
      ],
      zh: [
        '原始逻辑复杂性刁E��',
        '迁移工作量自动估箁E,
        '迁移方针提案生戁E,
        '跨平台流程�E动转换',
        '风险和依赖�E系映封E,
        '详绁E��迁移路线图',
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
        'プロセス自動変換によるRPAプラチE��フォーム移衁E,
        '允E��ジチE��刁E��に基づく移行工数見積もめE,
        'クライアント意思決定向け移行方針提桁E,
        'ローコード環墁E�E近代化�EロジェクチE,
      ],
      zh: [
        '通迁E�E动流程转换进行RPA平台迁移',
        '基于原始逻辑�E析的迁移工作量估箁E,
        '面向客户决策的迁移方针提桁E,
        '低代码环墁E��代化项目',
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
      ja: 'AIエチE��タ搭輁E E業務調査・チE�Eタ収集のためのPython実行基盤',
      zh: '搭载AI编辑器  E面向业务谁E��与数据收雁E��Python执行平台',
    },
    description: {
      en: 'Run Python without the hassle of setting up execution environments. The built-in AI Editor lets you describe what you need in plain language and automatically generates Python code  Eno programming knowledge required. From client device automation and citizen development to Python language education, a versatile platform applicable across a wide range of fields.',
      ja: '手間のかかるPython実行環墁E��しでPythonの実行が可能に。搭載�EAIエチE��タに欲しい機�Eを日本語で持E��するだけでPythonコードを自動生戁E Eプログラミング知識がなくても業務ツールを作�Eできます。クライアント端末の自動化、民主化開発から、Pythonの言語教育まで、幁E��E��刁E��での活用が可能です、E,
      zh: '无需繁琐的Python执行环墁E��建即可运行Python。�E置AI编辑器只需用自然语言描述需求即可自动生�EPython代码E��无需编程知证E��从客户终端自动化、�E民开发到Python语言教育�E�可在广泛颁E��中灵活运用、E,
    },
    features: {
      en: [
        'AI Editor  Edescribe requirements in natural language to generate Python code',
        'Zero-setup Python execution',
        'Syntax checking and instant test execution',
        'Client device automation',
        'Citizen development enablement',
        'Data analysis toolkit',
      ],
      ja: [
        'AIエチE��タ  E日本語で持E��するだけでPythonコードを自動生戁E,
        '環墁E��築不要�EPython実衁E,
        '斁E��チェチE��・即時テスト実衁E,
        'クライアント端末の自動化',
        '民主化開発の実現',
        'チE�Eタ刁E��チE�EルキチE��',
      ],
      zh: [
        'AI编辑器  E用自然语言描述需求�E动生�EPython代码E,
        '零配置Python执衁E,
        '语法检查与即时测试执衁E,
        '客户终端自动匁E,
        '全民开发赋�E',
        '数据刁E��工具匁E,
      ],
    },
    useCases: {
      en: [
        'Generate business tools instantly with AI Editor  Eno coding skills needed',
        'Client device automation without environment setup',
        'Citizen development for non-engineers',
        'Python language education and training',
      ],
      ja: [
        'AIエチE��タで業務ツールを即座に生�E  EコーチE��ング不要E,
        '環墁E��築不要�Eクライアント端末自動化',
        '非エンジニア向け民主化開発',
        'Pythonの言語教育・研修',
      ],
      zh: [
        '用AI编辑器即时生�E业务工具  E无需编程技能',
        '无需环墁E��建皁E��户终端自动匁E,
        '面向非工程师的全民开叁E,
        'Python语言教育与培训',
      ],
    },
    releases: {
      windows: { version: '1.0.0', tag: 'INPY-v1.0.0', fileName: 'InsightPy-v1.0.0-win-x64.zip' },
    },
  },

  // ===========================================================================
  // カチE��リ: Business Analysis & Strategy (consulting)
  // ===========================================================================

  {
    code: 'IOSH',
    slug: 'insight-office-sheet',
    status: 'published',
    displayOrder: 10,
    category: 'consulting',
    svgIcon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    colorGradient: 'from-green-500 to-green-700',
    platforms: ['windows'],
    name: { en: 'InsightOfficeSheet', ja: 'InsightOfficeSheet', zh: 'InsightOfficeSheet' },
    tagline: {
      en: 'AI Assistant-Powered Spreadsheet Creation & Editing Tool  EMS Office Not Required',
      ja: 'AIアシスタント搭輁E EスプレチE��シート作�E・編雁E��ール�E�ES Office 不要E��E,
      zh: '搭载AI助扁E E电子表格创建与编辑工具�E�无需MS Office�E�E,
    },
    description: {
      en: 'Open your existing Excel files with InsightOfficeSheet to unlock version control, cell-level change history, a built-in bulletin board, and AI chat  Eall on top of your familiar Excel workflow. The AI assistant reviews and corrects values and formulas, ensuring accuracy across complex financial models. No cloud environment required: simply place the file on a shared server and multiple people can collaborate on a single file, tracking who changed what and when as they work.',
      ja: '今お使ぁE�EExcelファイルをこのチE�Eルで開くだけで、バージョン管琁E��セル単位�E変更履歴管琁E��掲示板機�E、AIチャチE��が実現できます。搭載�EAIアシスタントが数値めE��算式をチェチE��・修正し、褁E��な財務モチE��の正確性を確保します。クラウド�Eような環墁E��不要で、�E有サーバ�Eに置ぁE��おけば1つのファイルを褁E��の人とコラボレーションし、誰がいつ何を変更したかを確認しながら作業を進められます、E,
      zh: '只需用InsightOfficeSheet打开您现有的Excel斁E���E�即可实现版本控制、单允E��级别皁E��更厁E��管琁E���E告板功�E和AI聊天、EI助手审查并修正数值和计算�E式，确保复杂财务模型的凁E��性。无需云环墁E��只需封E��件放在共享服务器上，多人即可协作编辑同一斁E���E�并随时确认谁在何时更改亁E��么、E,
    },
    features: {
      en: [
        'AI assistant  Ereview and correct values and formulas',
        'Version control for Excel files',
        'Cell-level change history tracking',
        'Built-in bulletin board for team communication',
        'AI chat integration',
        'Shared server collaboration (no cloud required)',
      ],
      ja: [
        'AIアシスタンチE E数値・計算式�EチェチE��と修正',
        'Excelファイルのバ�Eジョン管琁E,
        'セル単位�E変更履歴管琁E,
        '掲示板機�Eによるチ�Eムコミュニケーション',
        'AIチャチE��統吁E,
        '共有サーバ�Eでのコラボレーション�E�クラウド不要E��E,
      ],
      zh: [
        'AI助扁E E数值与计算�E式审查及修正',
        'Excel斁E��版本控制',
        '单�E格级别皁E��更厁E��管琁E,
        '冁E��公告板团队沟通功能',
        'AI聊天雁E�E',
        '共享服务器协作（无需云环墁E��E,
      ],
    },
    useCases: {
      en: [
        'AI-assisted formula validation in financial models',
        'Management metrics tracking and budget vs. actual reporting',
        'Planning simulation and scenario analysis on Excel',
        'Multi-person Excel collaboration on shared server',
      ],
      ja: [
        'AIによる財務モチE��の計算式検証・修正',
        '経営数値管琁E�E予実管琁E��ポ�EチE��ング',
        'Excelでの計画シミュレーション・シナリオ刁E��',
        '共有サーバ�E上での褁E��人によるExcelコラボレーション',
      ],
      zh: [
        'AI辁E��财务模型的公式验证与修正',
        '经营数值管琁E��颁E��管琁E��呁E,
        'Excel上的计划模拟与场景刁E��',
        '共享服务器上多人Excel协佁E,
      ],
    },
    releases: {
      windows: { version: '1.0.0', tag: 'IOSH-v1.0.0', fileName: 'InsightOfficeSheet-v1.0.0-win-x64.zip' },
    },
    screenshots: [
      { file: 'main.png', label: { en: 'Main View', ja: 'メイン画面', zh: '主界面' } },
      { file: 'version-history.png', label: { en: 'Version History', ja: '履歴管琁E, zh: '版本厁E��' } },
      { file: 'ai-assistant.png', label: { en: 'AI Assistant', ja: 'AIアシスタンチE, zh: 'AI助扁E } },
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
      en: 'Simple Office App for Seniors  EDocument, Spreadsheet & Email in One',
      ja: 'シニア向けシンプルオフィス  E斁E��・表計算�EメールめEつに',
      zh: '适合老年人皁E��易办公软件  E斁E��、表格、E��件一体化',
    },
    description: {
      en: 'An office app designed for users aged 80 and above  Eno Microsoft Office license required. Large text and buttons for easy viewing and tapping, voice input to type by speaking, text-to-speech to read documents aloud, and natural language commands like \'Put 10,000 yen in A2\'. Documents, spreadsheets, and email unified in one simple interface. Reads and writes Word/Excel formats for compatibility.',
      ja: '80代以上�E高齢老E��も迷わず使えるオフィスアプリ、Eicrosoft Officeのライセンスは不要です。大きな斁E��とボタンで見やすく押しやすい。話すだけで斁E���E力、文書めE��ールの読み上げ、「A2に1丁E�E入れて」などの自然言語操作に対応。Word/Excel形式�E読み書きに対応してぁE��ので、他�EPCとのファイルのめE��とりも問題ありません、E,
      zh: '专为80岁以上老年人设计皁E��公软件�E�无需Microsoft Office许可证。大字体、大按钮�E�渁E��易点击。支持语音输�E、文档朗读、以及「在A2输�E1丁E��允E��等�E然语言操作。支持Word/Excel格式读写，与�E他电脑文件兼容、E,
    },
    features: {
      en: [
        'No Microsoft Office required  Esave on license costs',
        'Reads & writes Word/Excel formats for compatibility',
        'Large text & buttons  Eadjustable size (70% E50%)',
        'Voice input  Etype by speaking',
        'Text-to-speech  Eread documents and emails aloud',
        'Natural language spreadsheet commands',
      ],
      ja: [
        'Microsoft Office不要E Eライセンスコスト削渁E,
        'Word/Excel形式�E読み書き対忁E E他PCとの互換性確俁E,
        '大きな斁E���Eボタン  Eサイズ調整可能�E�E0%、E50%�E�E,
        '音声入劁E E話すだけで斁E���E劁E,
        '読み上げ機�E  E斁E��めE��ールを音声で確誁E,
        '自然言語での表操作（「A2に1丁E�E入れて」！E,
      ],
      zh: [
        '无需Microsoft Office  E节省许可证�E本',
        '支持Word/Excel格式读冁E E与�E他电脑�E容',
        '大字体、大按钮  E可谁E��大小！E0% E50%�E�E,
        '语音输�E  E说话即可输�E斁E��E,
        '朗读功�E  E朗读斁E��和邮件',
        '自然语言表格操作（「在A2输�E1丁E��允E��！E,
      ],
    },
    useCases: {
      en: [
        'PC operation for elderly family members',
        'Senior citizen community centers and lifelong learning programs',
        'Nursing homes and senior care facilities  Eno Office license needed',
        'Municipality digital literacy programs for seniors',
      ],
      ja: [
        '高齢の家族�Eパソコン操作支援',
        'シニア向け公民館・生涯学習�Eログラム',
        '介護施設・高齢老E�Eームでの導�E  EOfficeライセンス不要E,
        '自治体�Eシニア向けチE��タルリチE��シー推進',
      ],
      zh: [
        '帮助年迈家人使用电脁E,
        '老年社区中忁E��终身学习项目',
        '养老E��和老年护琁E��施  E无需Office许可证E,
        '政府面向老年人皁E��字素养项目',
      ],
    },
    releases: {},
    screenshots: [
      { file: 'document.png', label: { en: 'Document Editor', ja: '斁E��作�E', zh: '斁E��编辁E } },
      { file: 'spreadsheet.png', label: { en: 'Spreadsheet', ja: '表計箁E, zh: '表格' } },
      { file: 'email.png', label: { en: 'Email', ja: 'メール', zh: '邮件' } },
    ],
  },
  {
    code: 'IOSD',
    slug: 'insight-office-doc',
    status: 'development',
    displayOrder: 30,
    category: 'consulting',
    svgIcon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    colorGradient: 'from-amber-500 to-yellow-700',
    platforms: ['windows'],
    name: { en: 'InsightOfficeDoc', ja: 'InsightOfficeDoc', zh: 'InsightOfficeDoc' },
    tagline: {
      en: 'AI Assistant-Powered Document Creation & Editing Tool  EMS Office Not Required',
      ja: 'AIアシスタント搭輁E Eドキュメント作�E・編雁E��ール�E�ES Office 不要E��E,
      zh: '搭载AI助扁E E斁E��创建与编辑工具�E�无需MS Office�E�E,
    },
    description: {
      en: 'Open your Word files with InsightOfficeDoc to get full version history  Eone file, all revisions preserved. Register reference materials (Excel, Word) and the AI assistant uses them to advise on your document content. Ask questions like \'Summarize this document\' or \'What should I write in Chapter 3?\' and get context-aware answers based on your registered references.',
      ja: 'Wordファイルは1つだけ。履歴は全部残る。参照賁E��としてExcel・Wordファイルを登録でき、AIアシスタントがそ�E冁E��を�Eにアドバイスします。「この斁E��を要紁E��て」「第3章に何を書け�EぁE���E�」など、登録した参�E賁E��に基づぁE��コンチE��スト対応�E回答が得られます。各種書類作�Eの効玁E��根本皁E��変えるツールです、E,
      zh: '用InsightOfficeDoc打开Word斁E���E�即可获得完整版本厁E��——一个斁E���E�所有修订全部保留。注册参老E��E���E�Excel、Word�E�，AI助手封E��于�E冁E��提供建议。可以提问「请摘要这份斁E��」「第3章应该写什么？」等，获得基于注册参老E��E��皁E��下文感知回答、E,
    },
    features: {
      en: [
        'AI assistant  Econtext-aware advice based on registered reference materials',
        'Full version history for Word documents',
        'Reference material registration (Excel / Word)',
        'Word editing integration (open in Word and sync back)',
        'Export functionality',
        'Claude API-powered document Q&A',
      ],
      ja: [
        'AIアシスタンチE E登録した参�E賁E��に基づくコンチE��スト対応�Eアドバイス',
        'Wordファイルの全履歴管琁E,
        '参�E賁E��の登録�E�Excel / Word�E�E,
        'Word連携編雁E��Eordで開いて同期�E�E,
        'エクスポ�Eト機�E',
        'Claude API搭載�EドキュメンチE&A',
      ],
      zh: [
        'AI助扁E E基于注册参老E��E��皁E��下文感知建议',
        'Word斁E��完整版本厁E��管琁E,
        '参老E��E��注册！Excel / Word�E�E,
        'Word联动编辑（在Word中打开并同步�E�E,
        '导出功�E',
        'Claude API驱动皁E��档问筁E,
      ],
    },
    useCases: {
      en: [
        'Contract and proposal drafting with AI-assisted reference lookup',
        'Document version management without SharePoint or cloud tools',
        'AI-powered document summarization and chapter guidance',
        'Consulting deliverable creation with registered source materials',
      ],
      ja: [
        'AIによる参�E賁E��参�E付きの契紁E��・提案書作�E',
        'SharePointめE��ラウド不要�Eドキュメントバージョン管琁E,
        'AIによるドキュメント要紁E�E章立てガイダンス',
        '参�E賁E��を登録してのコンサルチE��ング成果物作�E',
      ],
      zh: [
        'AI辁E��参老E��E��查询皁E��同和提案起荁E,
        '无需SharePoint或云工具皁E��档版本管琁E,
        'AI驱动皁E��档摘要与章节指导',
        '注册源材料后皁E��询交付物制佁E,
      ],
    },
    releases: {},
  },
  {
    code: 'INSS',
    slug: 'insight-slide',
    status: 'published',
    displayOrder: 40,
    category: 'consulting',
    svgIcon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122',
    colorGradient: 'from-orange-400 to-amber-600',
    platforms: ['windows'],
    name: { en: 'InsightOfficeSlide', ja: 'InsightOfficeSlide', zh: 'InsightOfficeSlide' },
    tagline: {
      en: 'AI Assistant-Powered Presentation Creation & Editing Tool  EMS Office Not Required',
      ja: 'AIアシスタント搭輁E EプレゼンチE�Eション作�E・編雁E��ール�E�ES Office 不要E��E,
      zh: '搭载AI助扁E E演示斁E��创建与编辑工具�E�无需MS Office�E�E,
    },
    description: {
      en: 'Extract all text from PowerPoint slides and export it to a screen view or Excel for efficient editing. The built-in AI assistant reviews and corrects presentation content  Echecking logical consistency, data accuracy, and messaging clarity. Reviewing hundreds of PowerPoint pages is extremely inefficient  Eby exporting to Excel, you can easily check the overall structure, catch typos, and review content at scale.',
      ja: 'PowerPointのチE��ストを全て抽出し、編雁E��きるチE�Eルです。搭載�EAIアシスタントによる冁E��チェチE��・修正は、E��違いなく提案時の作業効玁E��爁E��げします。何百ペ�Eジも�EPowerPointのレビューめExcelに出力することで全体�E骨子確認や誤字脱字�EチェチE��が格段に容易になります。スピ�EチノートもExcelから登録でき、Excelに落としたチE��ストを多言語に翻訳して取り込むことで、賁E��の多言語翻訳もとても簡単に行えます、E,
      zh: '提取PowerPoint中皁E��有文本�E�导出到屏幕见E��或Excel进行高效编辑。�E置AI助手审查并修正演示冁E���E�检查逻辑一致性、数据凁E��性和信息表达皁E��E��度。审阁E��百页PowerPoint效率极低，导出到Excel后可以轻松检查整体结构、发现错别字并大见E��审阁E�E容、E,
    },
    features: {
      en: [
        'AI assistant  Ereview and correct presentation content',
        'Full text extraction from PowerPoint',
        'Export to Excel for bulk editing',
        'On-screen text review and editing',
        'Typo and content structure checking',
        'Multilingual translation via Excel export/import',
      ],
      ja: [
        'AIアシスタンチE Eプレゼン冁E��のチェチE��・修正',
        'PowerPointからの全チE��スト抽出',
        'Excelへのエクスポ�Eトで一括編雁E,
        '画面上でのチE��ストレビュー・編雁E,
        '誤字脱字�E構�EチェチE��',
        'Excel経由の多言語翻訳・取り込み',
      ],
      zh: [
        'AI助扁E E演示冁E��审查与修正',
        'PowerPoint全斁E��提取',
        '导出到Excel进行批量编辁E,
        '屏幕上文本审阁E��编辁E,
        '错别字和冁E��结构检查',
        '通过Excel导出导入实现多语言翻证E,
      ],
    },
    useCases: {
      en: [
        'AI-powered presentation quality review before client delivery',
        'Efficient review of large PowerPoint decks (100+ pages)',
        'Bulk typo and terminology checking via Excel export',
        'Multilingual presentation translation via Excel workflow',
      ],
      ja: [
        'クライアント納品前�EAIによるプレゼン品質チェチE��',
        '大量PowerPoint賁E���E�E00ペ�Eジ趁E���E効玁E��レビュー',
        'Excelエクスポ�Eトによる誤字脱字�E用語�E一括チェチE��',
        'Excel経由のプレゼン賁E��多言語翻訳',
      ],
      zh: [
        '客户交付前AI驱动皁E��示质量审查',
        '大量PowerPoint赁E���E�E00页以上）的高效审阁E,
        '通过Excel导出进行错别字和术语批量检查',
        '通过Excel工作流实现演示赁E��多语言翻证E,
      ],
    },
    releases: {
      windows: { version: '1.0.0', tag: 'INSS-v1.0.0', fileName: 'InsightSlide-v1.0.0-win-x64.zip' },
    },
    screenshots: [
      { file: 'main.png', label: { en: 'Main View', ja: 'メイン画面', zh: '主界面' } },
      { file: 'ai-review.png', label: { en: 'AI Review', ja: 'AIレビュー', zh: 'AI审阁E } },
      { file: 'excel-export.png', label: { en: 'Excel Export', ja: 'Excel出劁E, zh: 'Excel导出' } },
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
      zh: '自动访谈与业务谁E��支持E,
    },
    description: {
      en: 'Fully automate interviews for business surveys and requirements definition. Users respond by voice to pre-configured interview sheets, and their answers are transcribed to text in real time and registered automatically. AI then summarizes and categorizes responses into issues, concerns, tasks, and completed items  Eso you can focus on problem-solving and next actions.',
      ja: '業務調査めE��件定義時�Eインタビューを完�E自動化。ユーザーは事前に設定されたインタビューシートに音声で回答し、リアルタイムにチE��スト化されて回答が登録されます。回答�EAIにより問題点・課題�E懸念点、タスク、完亁E��業などに要紁E�E刁E��されるため、次のアクションめE��題解決に注力することができます、E,
      zh: '完�E自动化业务谁E��和需求定义阶段皁E��谈。用户通迁E��音回答颁E��皁E��谈表�E�回答实时转录为斁E��并自动登记、EI自动封E��答汁E��刁E��为问题点、课题、�E注事项、任务和已完�E事项�E�让您专注于下一步行动和问题解决、E,
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
        '事前設定可能なインタビューシートテンプレーチE,
        '音声からチE��ストへのリアルタイム変換',
        '回答�E自動登録',
        'AIによる回答�E要紁E,
        '問題点・タスク・懸念点への自動�E顁E,
        'アクションにつながるインサイト抽出',
      ],
      zh: [
        '可颁E��皁E��谈表模板',
        '语音实时转录为斁E��',
        '回答�E动登记',
        'AI驱动皁E��答摘要E,
        '自动刁E��为问题、任务和�E注事项',
        '可操作的洞察提叁E,
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
        '業務調査時�EスチE�Eクホルダーインタビュー自動化',
        'リアルタイム斁E��起こし付き要件定義ヒアリング',
        'インタビューからのAI刁E��による課題�Eタスク抽出',
        '褁E��部門横断のスケーラブルなインタビュープロセス',
      ],
      zh: [
        '业务谁E��中皁E��益相关方访谈�E动匁E,
        '带实时转录的需求定义访谁E,
        '通过AI刁E��从访谈中提取课题与任务',
        '跨多部门皁E��扩展访谈流稁E,
      ],
    },
    releases: {},
  },

  // ===========================================================================
  // カチE��リ: Content Creation (content)
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
    name: { en: 'InsightCast', ja: 'InsightCast', zh: 'InsightCast' },
    tagline: {
      en: 'Auto Video Creation from Images & Text',
      ja: '画像とチE��ストから動画を�E動作�E',
      zh: '从图像和斁E��自动创建见E��E,
    },
    description: {
      en: 'Enter descriptive text for images and InsightCast automatically converts it to speech and produces a video. Turn presentation materials into videos for playback, or create educational content with ease. It can also convert PowerPoint slides into images and turn speech notes into narration to automatically generate videos  Edramatically improving the efficiency of presentation preparation and review.',
      ja: '画像に説明用のチE��ストを入力するだけで、�E動で音声化して動画を作�E。�EレゼンチE�Eション賁E��を動画にして流したり、教育用の教材を動画にするのも簡単です。さらに、PowerPointの賁E��をスライド画像に変換し、スピ�Eチノートを音声化して自動で動画を作�Eする機�Eも搭載。�EレゼンチE�Eションの準備めE��ビューの効玁E��格段に向上します、E,
      zh: '只需输�E图像的说明文字，即可自动转换为语音并生�E见E��。轻松封E��示赁E��制作�E见E��播放�E��E封E��育教材转换为见E��。还可以封EowerPoint赁E��转换为图像，封E��讲夁E��转换为语音�E��E动生�E见E��——大幁E��十E��示凁E��E��审阁E��效率、E,
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
        '画像＋テキストから�E動画自動生戁E,
        'チE��スト�E自動音声変換',
        'PowerPointスライドから動画変換',
        'スピ�Eチノート�E自動ナレーション匁E,
        'プレゼンチE�Eションレビュー動画の作�E',
        'マルチフォーマット動画出劁E,
      ],
      zh: [
        '图僁E斁E��自动生�E见E��E,
        '斁E��自动语音转换',
        'PowerPoint幻灯牁E��见E��E,
        '演讲夁E��自动旁白匁E,
        '演示审阁E��E���E建',
        '多格式见E��导出',
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
        'プレゼンチE�Eション賁E��を動画化して配信',
        '教育・研修コンチE��チE�E動画作�E',
        'PowerPointからナレーション付き動画でレビュー効玁E��',
        'クライアント向け業務�Eロセス説明動画の作�E',
      ],
      zh: [
        '封E��示赁E��转换为见E��播放',
        '教育培训冁E��皁E��E��制佁E,
        'PowerPoint转带旁白见E��提十E��阁E��玁E,
        '面向客户皁E��务流程说明见E��制佁E,
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
      ja: '業務賁E��向けAI画像�E大量�E動生成ツール',
      zh: '面向业务赁E��的AI图像批量�E动生�E工具',
    },
    description: {
      en: 'AI image generation often requires extensive trial and error  Ethe same prompt rarely produces the perfect result on the first try. InsightImageGen lets you define prompts in JSON and automatically generate dozens or hundreds of images in batch. A built-in management tool makes it easy to review, compare, and delete generated images to find the perfect visual for your deliverables.',
      ja: 'AI画像生成�E同じプロンプトでも思い通りの結果になることは稀で、何十回�E何百回もの試行錯誤が欠かせません、EnsightImageGenはJSONにプロンプトを記述し、何十枚�E何百枚もの画像を自動で大量生成。作�Eした画像�E管琁E��ールで一覧確認でき、不要な画像�E削除も簡単に行えます、E,
      zh: 'AI图像生成即使使用相同提示词也很难一次得到琁E��结果�E�需要反复数十次甚�E数百次皁E��错、EnsightImageGen让您在JSON中编�E提示词，�E动批量生成数十张乁E�E数百张图像。通迁E�E置管琁E��具�E�可以轻松浏览、比辁E��删除生�E皁E��像、E,
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
        'JSONベ�Eスのプロンプト一括定義',
        '大量画像�E自動バチE��生�E�E�数十〜数百枚！E,
        '生�E画像�E管琁E�E確認ツール冁E��',
        '不要画像�E簡単削除・フィルタリング',
        'Stable Diffusion統吁E,
        '4K高解像度出劁E,
      ],
      zh: [
        '基于JSON皁E��示词批量定乁E,
        '自动批量生成大量图像（数十�E数百张�E�E,
        '冁E��生�E图像管琁E��浏览工具',
        '轻松删除和筛选结果',
        'Stable Diffusion雁E�E',
        '4K高�E辨玁E���E',
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
        'コンサルチE��ング納品物向けビジュアルの大量生戁E,
        '提案賁E��向け画像�E試行錯誤皁E��作�E',
        'プロンプト反復によるコンセプトイラスト生戁E,
        '継続案件向けビジュアルアセチE��ライブラリの構篁E,
      ],
      zh: [
        '咨询交付物见E��素材批量生戁E,
        '提案赁E��图像的反复试错创佁E,
        '通迁E��示词迭代生�E概念插图',
        '为持续项目极E��见E��素材庁E,
      ],
    },
    releases: {
      windows: { version: '1.0.0', tag: 'INIG-v1.0.0', fileName: 'InsightImageGen-v1.0.0-win-x64.zip' },
    },
  },

  // ===========================================================================
  // カチE��リ: Utility Apps (utility)
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
      ja: 'Insight製品�E統合ランチャー',
      zh: 'Insight产品统一启动器',
    },
    description: {
      en: 'A unified launcher that provides quick access to all installed Insight products from a single interface.',
      ja: 'インスト�Eル済みの全Insight製品に1つの画面からアクセスできる統合ランチャーです、E,
      zh: '通迁E��一界面快速访问所有已安裁E��Insight产品、E,
    },
    features: {
      en: ['Quick access to all Insight products', 'Product status overview', 'Auto-update management'],
      ja: ['全Insight製品への即座のアクセス', '製品スチE�Eタス概要E, '自動アチE�EチE�Eト管琁E],
      zh: ['快速访问所有Insight产品E, '产品状态概见E, '自动更新管琁E],
    },
    useCases: {
      en: ['Centralized access to Insight product suite'],
      ja: ['Insight製品スイートへの一允E��なアクセス'],
      zh: ['雁E��访问Insight产品套件'],
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
    name: { en: 'Insight Camera', ja: 'スチE��リカメラ', zh: 'Insight Camera' },
    tagline: {
      en: 'Simple camera with beautiful photos',
      ja: 'シンプルで綺麗に撮れるカメラ',
      zh: '简洁好用皁E��机应用',
    },
    description: {
      en: 'A simple camera app that takes beautiful photos without complexity. Features always-on flashlight, one-tap capture, and automatic OEM image processing via CameraX Extensions.',
      ja: '難しいことを老E��なくても綺麗な写真が撮れるシンプルなカメラアプリ。常時ライト点灯、ワンタチE�E操作、CameraX Extensions による OEM 画質自動適用に対応、E,
      zh: '无需复杂操作即可拍�E精美�E牁E��简洁相机应用。支持常亮闪光�E、一键拍摄、CameraX Extensions自动应用OEM图像夁E��、E,
    },
    features: {
      en: ['Always-on flashlight', 'One-tap capture', 'Auto OEM quality (CameraX Extensions)', 'Photo & video recording', 'Pinch zoom with presets'],
      ja: ['常時ライト点灯', 'ワンタチE�E撮影', 'OEM画質自動適用�E�EameraX Extensions�E�E, '写真・動画撮影', 'ピンチズーム + プリセチE��'],
      zh: ['常亮闪光�E', '一键拍摄', '自动OEM画质�E�EameraX Extensions�E�E, '照牁E��见E��录制', '捏合缩放+颁E��'],
    },
    useCases: {
      en: ['Simple photo and video capture for everyday use', 'Galaxy Fold optimized camera experience'],
      ja: ['日常のシンプルな写真・動画撮影', 'Galaxy Fold 最適化カメラ体騁E],
      zh: ['日常简单拍照和录像', 'Galaxy Fold优化相机体骁E],
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
      ja: '音声対応時計�Eリマインダーアプリ',
      zh: '语音时钟与提醒应用',
    },
    description: {
      en: 'A voice-activated clock with reminder and alarm features, designed for accessibility.',
      ja: '音声操作対応�E時計アプリ。リマインダー・アラーム機�E搭載。アクセシビリチE��に配�Eした設計です、E,
      zh: '支持语音操作的时钟应用�E��E有提醒和闹钟功能�E�注重无障碍设计、E,
    },
    features: {
      en: ['Voice-activated controls', 'Reminders and alarms', 'Accessibility-first design'],
      ja: ['音声操佁E, 'リマインダー・アラーム', 'アクセシビリチE��重視設訁E],
      zh: ['语音操佁E, '提�E与闹钁E, '无障碍优�E设计'],
    },
    useCases: {
      en: ['Hands-free time management'],
      ja: ['ハンズフリーの時間管琁E],
      zh: ['免提时间管琁E],
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
      ja: 'QRコードスキャナ�E�E�E��ェネレーター',
      zh: 'QR码扫描与生成器',
    },
    description: {
      en: 'Scan and generate QR codes with history tracking and batch generation support.',
      ja: 'QRコード�Eスキャン・生�E。履歴管琁E��バッチ生成に対応、E,
      zh: '扫描和生�EQR码E��支持历史记录和批量生成、E,
    },
    features: {
      en: ['QR code scanning', 'QR code generation', 'History tracking', 'Batch generation'],
      ja: ['QRコードスキャン', 'QRコード生戁E, '履歴管琁E, 'バッチ生戁E],
      zh: ['QR码扫揁E, 'QR码生戁E, '厁E��记彁E, '批量生戁E],
    },
    useCases: {
      en: ['Business card scanning', 'URL sharing via QR codes'],
      ja: ['名刺スキャン', 'QRコードによるURL共朁E],
      zh: ['名片扫揁E, '通过QR码�E享URL'],
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
      ja: 'クイチE��ノ�Eト！E��ンボ�EチE,
      zh: '快速笔记与固定�E容管琁E��',
    },
    description: {
      en: 'Pin important notes, links, and snippets for quick access. Sync across devices for seamless workflow.',
      ja: '重要なメモ・リンク・スニ�EチE��をピン留め。デバイス間同期でシームレスなワークフローを実現、E,
      zh: '固定重要笔记、E��接和片段�E�快速访问。跨设夁E��步实现无缝工作流、E,
    },
    features: {
      en: ['Pin notes and links', 'Cross-device sync', 'Quick access'],
      ja: ['メモ・リンクのピン留め', 'チE��イス間同朁E, '即座のアクセス'],
      zh: ['固定笔记和链接', '跨设夁E��步', '快速访问'],
    },
    useCases: {
      en: ['Meeting notes pinning', 'Quick reference management'],
      ja: ['会議メモのピン留め', 'クイチE��リファレンス管琁E],
      zh: ['会议笔记固宁E, '快速参老E��琁E],
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
      ja: 'AI斁E��起こし付き音声メモ',
      zh: '搭载AI转录的语音夁E��彁E,
    },
    description: {
      en: 'Record voice memos with automatic AI-powered transcription. Search and organize your memos by content.',
      ja: '音声メモを録音し、AIが�E動でチE��スト化。�E容で検索・整琁E��可能です、E,
      zh: '录制语音夁E��录，AI自动转录。可按�E容搜索和整琁E��E,
    },
    features: {
      en: ['Voice recording', 'AI transcription', 'Content search', 'Organization by tags'],
      ja: ['音声録音', 'AI斁E��起こし', '冁E��検索', 'タグによる整琁E],
      zh: ['语音录制', 'AI转彁E, '冁E��搜索', '栁E��整琁E],
    },
    useCases: {
      en: ['Meeting recording and transcription', 'Field notes capture'],
      ja: ['会議の録音・斁E��起こし', 'フィールドノート�E記録'],
      zh: ['会议录音与转彁E, '现场笔记记彁E],
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
      ja: '音声対応タスク管琁E��レンダー',
      zh: '语音驱动皁E��务管琁E��厁E,
    },
    description: {
      en: 'A calendar app with voice-powered task management. Add and manage tasks using voice input for hands-free productivity.',
      ja: '音声でタスクを追加・管琁E��きるカレンダーアプリ。ハンズフリーで生産性を向上させます、E,
      zh: '通迁E��音添加和管琁E��务皁E��厁E��用�E�实现免提高效工作、E,
    },
    features: {
      en: ['Voice task input', 'Calendar view', 'Task management', 'Reminders'],
      ja: ['音声タスク入劁E, 'カレンダー表示', 'タスク管琁E, 'リマインダー'],
      zh: ['语音任务输�E', '日厁E��E��', '任务管琁E, '提�E功�E'],
    },
    useCases: {
      en: ['Hands-free task scheduling', 'Voice-powered daily planning'],
      ja: ['ハンズフリーのタスクスケジューリング', '音声による日次計画'],
      zh: ['免提任务安排', '语音驱动皁E��常见E�E'],
    },
    releases: {},
  },
];

// =============================================================================
// ヘルパ�E関数
// =============================================================================

/**
 * Web サイトに表示する製品を取得！Eublished + development�E�E
 *
 * hidden は除外。development は「開発中」バチE��付きで表示、E
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
 * 公開済み�E�Eublished�E��E製品�Eみ取征E
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
 * スチE�Eタスで製品をフィルタ
 */
export function getProductsByStatus(status: CatalogStatus): CatalogEntry[] {
  return PRODUCT_CATALOG
    .filter(p => p.status === status)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * カチE��リ別に製品を取得！Eidden 以外！E
 */
export function getProductsByCategory(category: WebsiteCategory): CatalogEntry[] {
  return PRODUCT_CATALOG
    .filter(p => p.status !== 'hidden' && p.category === category)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * スラチE��で製品を検索
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
 * プラチE��フォーム別の表示対象製品を取得！Eidden 以外！E
 */
export function getVisibleProductsByPlatform(platform: PlatformType): CatalogEntry[] {
  return getVisibleProducts().filter(p => p.platforms.includes(platform));
}

/**
 * スチE�Eタスのラベルを取征E
 */
export function getStatusLabel(status: CatalogStatus, locale: CatalogLocale = 'ja'): string {
  return STATUS_LABELS[status][locale];
}

/**
 * 製品�EダウンローチEURL を取征E
 *
 * @returns ダウンローチEURL。未リリースの場合�E null
 */
export function getDownloadUrl(code: CatalogCode, platform: PlatformType): string | null {
  const product = getProductByCode(code);
  if (!product) return null;
  const release = product.releases[platform];
  if (!release || !release.tag) return null;
  return `${GITHUB_DOWNLOAD_BASE}/${release.tag}/${release.fileName}`;
}

/**
 * 製品がダウンロード可能かチェチE��
 */
export function isDownloadAvailable(code: CatalogCode, platform: PlatformType = 'windows'): boolean {
  const product = getProductByCode(code);
  if (!product) return false;
  const release = product.releases[platform];
  return !!release && !!release.tag;
}

/**
 * 全カチE��リとそ�E公開製品を取得！Eeb サイト�EカチE��リ別表示用�E�E
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
// エクスポ�EチE
// =============================================================================

export default {
  // チE�Eタ
  PRODUCT_CATALOG,
  CATEGORY_NAMES,
  CATEGORY_ORDER,
  STATUS_LABELS,
  GITHUB_DOWNLOAD_BASE,

  // ヘルパ�E
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
