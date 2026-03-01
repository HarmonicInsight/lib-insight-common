/**
 * ヘルプシステム — 製品別セクション定義 & 共通コンテンツ
 *
 * 各アプリの HelpWindow.xaml.cs がこの定義を参照してセクションを構築する。
 * INSS（Insight Deck Quality Gate）を基準実装として全製品で統一。
 *
 * 【設計方針】
 * - セクションID は string 統一（IOSH の integer は廃止）
 * - HelpWindow は ShowDialog() で開く（Show() は禁止）
 * - XAML 色参照は DynamicResource / StaticResource（ハードコード禁止）
 * - 全製品で最低6セクション（overview, ui-layout, shortcuts, license, system-req, support）
 * - AI 搭載製品は ai-assistant セクション必須
 * - マーケター視点: ヘルプ = 製品の価値を再確認する接点。機能説明ではなく「導入効果」を伝える。
 *
 * 詳細仕様: standards/HELP_SYSTEM.md
 */

import type { ProductCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** ヘルプセクションカテゴリ */
export type HelpSectionCategory =
  | 'overview'           // はじめに（全製品必須）
  | 'ui_layout'          // 画面構成（全製品必須）
  | 'file_ops'           // ファイル操作
  | 'editing'            // 編集機能（製品固有）
  | 'ai_assistant'       // AIアシスタント（AI搭載製品必須）
  | 'version_history'    // バージョン管理
  | 'compare'            // ファイル比較
  | 'product_feature'    // 製品固有機能
  | 'shortcuts'          // キーボードショートカット（全製品必須）
  | 'faq'                // FAQ
  | 'license'            // ライセンス（全製品必須）
  | 'system_req'         // システム要件（全製品必須）
  | 'support';           // お問い合わせ（全製品必須）

/** ヘルプセクション定義 */
export interface HelpSectionDefinition {
  /** HTML anchor ID（string 統一、integer 禁止） */
  id: string;
  /** セクションカテゴリ */
  category: HelpSectionCategory;
  /** TOC に表示するラベル */
  label: { ja: string; en: string };
  /** セクション冒頭に表示するリード文（ベネフィット訴求） */
  description: { ja: string; en: string };
  /** 表示順 */
  order: number;
  /** 全プラン表示か */
  isRequired: boolean;
  /** プラン制限ありならバッジ表示 */
  planBadge?: 'BIZ' | 'ENT';
}

/** 製品マーケティング情報 */
export interface ProductMarketing {
  /** キャッチコピー（ヘルプ冒頭のヒーローエリア） */
  tagline: { ja: string; en: string };
  /** 導入価値（3行以内で「なぜこの製品か」を伝える） */
  valueProposition: { ja: string; en: string };
  /** ターゲット顧客像 */
  targetAudience: { ja: string; en: string };
  /** 導入効果キーワード（feature-card で表示） */
  benefitKeywords: { ja: string; en: string }[];
}

/** 製品別ヘルプ構成 */
export interface ProductHelpConfig {
  productCode: ProductCode;
  productName: { ja: string; en: string };
  marketing: ProductMarketing;
  sections: HelpSectionDefinition[];
  colorTheme: 'ivory_gold' | 'cool_blue_slate';
  supportedLanguages: ('ja' | 'en' | 'zh')[];
}

/** 共通セクションコンテンツ（全製品で再利用） */
export interface SharedSectionContent {
  /** セクションカテゴリ */
  category: HelpSectionCategory;
  /** HTML テンプレート（{productName} 等のプレースホルダ対応） */
  html: { ja: string; en: string };
}

// =============================================================================
// 共通定数（HelpWindow 構成・スタイル・連絡先）
// =============================================================================

/**
 * HelpWindow の標準構成
 *
 * 全製品でウィンドウサイズ・レイアウト比率を統一する。
 * C# 側では `standards/HELP_SYSTEM.md` §2 に準拠して実装すること。
 */
export const HELP_WINDOW_STANDARD = {
  /** ウィンドウ幅 (px) */
  width: 1050,
  /** ウィンドウ高さ (px) */
  height: 740,
  /** 左サイドバー（TOC）の幅 (px) */
  tocWidth: 210,
  /** タイトルバーの高さ (px) */
  titleBarHeight: 36,
  /** HelpWindow を開くメソッド — ShowDialog() 必須、Show() 禁止 */
  openMode: 'ShowDialog' as const,
  /** セクション ID の型 — string 統一、integer 禁止 */
  sectionIdType: 'string' as const,
  /** XAML 色参照方式 — DynamicResource / StaticResource 必須、ハードコード禁止 */
  colorReference: 'DynamicResource' as const,
  /** セクション間スクロール動作 */
  scrollBehavior: "scrollIntoView({behavior:'smooth',block:'start'})" as const,
  /** コンストラクタシグネチャ */
  constructorSignature: 'HelpWindow(string? initialSection = null)' as const,
} as const;

/**
 * HelpWindow HTML スタイルパレット
 *
 * テーマ別の色定義。全製品でこの定義に従い、CSS を統一する。
 * standards/HELP_SYSTEM.md §3 に対応。
 */
export const HELP_STYLE_PALETTE = {
  /** Ivory & Gold テーマ（INSS/IOSH/IOSD/INMV/INPY/ISOF） */
  ivory_gold: {
    /** 見出し色（Gold） */
    heading: '#B8942F',
    /** ページ背景（Ivory） */
    background: '#FAF8F5',
    /** カード背景 */
    cardBackground: '#FFFFFF',
    /** テキスト Primary */
    textPrimary: '#1C1917',
    /** テキスト Secondary */
    textSecondary: '#57534E',
    /** ボーダー */
    border: '#E7E2DA',
    /** TOC サイドバー背景 */
    tocBackground: '#F5F0E8',
    /** TOC 選択行 */
    tocSelected: '#B8942F',
    /** TOC 選択行テキスト */
    tocSelectedText: '#FFFFFF',
    /** コールアウト: tip (amber) */
    tipBackground: '#FFF8E1',
    tipBorder: '#FFD54F',
    /** コールアウト: note (purple) */
    noteBackground: '#F3E5F5',
    noteBorder: '#CE93D8',
    /** バッジ: BIZ */
    badgeBizBackground: '#E8F5E9',
    badgeBizText: '#2E7D32',
    /** バッジ: ENT */
    badgeEntBackground: '#E3F2FD',
    badgeEntText: '#1565C0',
    /** バッジ: TRIAL */
    badgeTrialBackground: '#FFF3E0',
    badgeTrialText: '#E65100',
  },
  /** Cool Blue & Slate テーマ（INBT/INCA/IVIN） */
  cool_blue_slate: {
    heading: '#2563EB',
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    border: '#E2E8F0',
    tocBackground: '#F1F5F9',
    tocSelected: '#2563EB',
    tocSelectedText: '#FFFFFF',
    tipBackground: '#EFF6FF',
    tipBorder: '#60A5FA',
    noteBackground: '#F0FDF4',
    noteBorder: '#86EFAC',
    badgeBizBackground: '#E8F5E9',
    badgeBizText: '#2E7D32',
    badgeEntBackground: '#E3F2FD',
    badgeEntText: '#1565C0',
    badgeTrialBackground: '#FFF3E0',
    badgeTrialText: '#E65100',
  },
} as const;

/**
 * 連絡先情報（全製品共通）
 *
 * ヘルプ内のサポートセクション・ライセンスセクションで使用。
 * 変更時はここを更新するだけで全製品に反映される。
 */
export const HELP_CONTACT_INFO = {
  /** テクニカルサポート */
  support: {
    email: 'support@h-insight.jp',
    hours: {
      ja: '平日 9:00〜18:00（日本時間）',
      en: 'Weekdays 9:00–18:00 (JST)',
    },
    /** ENT プランの優先サポート */
    priorityNote: {
      ja: 'ENT プランは優先対応',
      en: 'ENT plan customers receive priority support',
    },
  },
  /** 営業・導入相談 */
  sales: {
    email: 'sales@harmonicinsight.com',
    description: {
      ja: 'チーム導入や業務フローへの組み込みなど、活用方法のご相談も承ります。',
      en: "We're happy to help with team deployment and workflow integration.",
    },
  },
  /** 会社情報 */
  company: {
    name: {
      ja: 'HARMONIC insight 合同会社',
      en: 'HARMONIC insight LLC',
    },
    website: 'https://harmonicinsight.com',
  },
} as const;

/**
 * システム要件の標準値（全 WPF 製品共通）
 *
 * 製品固有の要件がある場合は ProductHelpConfig 側で上書きする。
 */
export const HELP_SYSTEM_REQUIREMENTS = {
  os: {
    minimum: 'Windows 10 (64-bit)',
    recommended: 'Windows 11 (64-bit)',
  },
  cpu: {
    minimum: 'Intel Core i3 / AMD Ryzen 3',
    recommended: 'Intel Core i5 / AMD Ryzen 5',
  },
  memory: {
    minimum: '4 GB',
    recommended: '8 GB',
  },
  disk: {
    minimum: '500 MB',
    recommended: '1 GB',
  },
  display: {
    minimum: '1280×720',
    recommended: '1920×1080',
  },
  runtime: '.NET 8.0 Desktop Runtime',
  internet: {
    ja: 'AI アシスタント・ライセンス認証に必要',
    en: 'Required for AI Assistant and license activation',
  },
} as const;

/**
 * 外部リンク（全製品共通）
 *
 * ヘルプ内で参照される外部 URL。
 */
export const HELP_EXTERNAL_LINKS = {
  /** Anthropic Console（API キー取得） */
  anthropicConsole: 'https://console.anthropic.com/',
  /** HARMONIC insight 公式サイト */
  website: 'https://harmonicinsight.com',
} as const;

// =============================================================================
// 必須セクションカテゴリ（全製品共通 — 最低6セクション）
// =============================================================================

const REQUIRED_CATEGORIES: readonly HelpSectionCategory[] = [
  'overview',
  'ui_layout',
  'shortcuts',
  'license',
  'system_req',
  'support',
] as const;

// =============================================================================
// 共通コンテンツ（全製品で再利用する HTML テンプレート）
// =============================================================================

/**
 * 全製品共通のライセンスセクション HTML テンプレート
 *
 * プレースホルダ:
 * - {productName} — 製品名
 * - {productCode} — 製品コード
 * - {featureRows} — 製品固有の機能比較行（各アプリで注入）
 */
export const SHARED_LICENSE_CONTENT: SharedSectionContent = {
  category: 'license',
  html: {
    ja: `
<h2 id="license">ライセンス・プラン</h2>
<p>お客様の業務規模に合わせた最適なプランをご用意しています。まずは FREE プランで全機能をお試しいただき、チームでの本格運用には BIZ / ENT プランをご検討ください。</p>

<table class="plan-table">
  <thead>
    <tr><th>機能</th><th>FREE</th><th>TRIAL</th><th>BIZ</th><th>ENT</th></tr>
  </thead>
  <tbody>
    <tr><td>全機能アクセス</td><td>○</td><td>○</td><td>○</td><td>○</td></tr>
    <tr><td>保存・エクスポート</td><td>—</td><td>○</td><td>○</td><td>○</td></tr>
    <tr><td>AI アシスタント</td><td>○ (BYOK)</td><td>○ (BYOK)</td><td>○ (BYOK)</td><td>○ (BYOK)</td></tr>
    <tr><td>有効期間</td><td>無期限</td><td>30日</td><td>365日</td><td>要相談</td></tr>
    {featureRows}
    <tr><td>API / SSO / 監査ログ</td><td>—</td><td>—</td><td>—</td><td>○</td></tr>
    <tr><td>優先サポート</td><td>—</td><td>—</td><td>—</td><td>○</td></tr>
  </tbody>
</table>

<div class="tip"><strong>💡 FREE プランでも全機能をお使いいただけます</strong><br/>保存・エクスポートのみ制限されます。操作感や AI アシスタントの性能を、コスト負担なくじっくりご評価ください。</div>

<h3>アクティベーション手順</h3>
<div class="step"><span class="step-num">1</span><div>{productName} を起動し、メニューの「ライセンス管理」を開きます</div></div>
<div class="step"><span class="step-num">2</span><div>ご契約時にお送りしたメールアドレスとライセンスキーを入力します</div></div>
<div class="step"><span class="step-num">3</span><div>「アクティベート」ボタンをクリックして完了です</div></div>

<div class="note"><strong>📝 ライセンスキー形式:</strong> <code>{productCode}-BIZ-2601-XXXX-XXXX-XXXX</code><br/>ご不明な場合は ${HELP_CONTACT_INFO.support.email} までお問い合わせください。</div>
`,
    en: `
<h2 id="license">License &amp; Plans</h2>
<p>We offer plans tailored to your business needs. Start with the FREE plan to evaluate all features, then consider BIZ or ENT for full team deployment.</p>

<table class="plan-table">
  <thead>
    <tr><th>Feature</th><th>FREE</th><th>TRIAL</th><th>BIZ</th><th>ENT</th></tr>
  </thead>
  <tbody>
    <tr><td>Full Feature Access</td><td>○</td><td>○</td><td>○</td><td>○</td></tr>
    <tr><td>Save &amp; Export</td><td>—</td><td>○</td><td>○</td><td>○</td></tr>
    <tr><td>AI Assistant</td><td>○ (BYOK)</td><td>○ (BYOK)</td><td>○ (BYOK)</td><td>○ (BYOK)</td></tr>
    <tr><td>Duration</td><td>Unlimited</td><td>30 days</td><td>365 days</td><td>Custom</td></tr>
    {featureRows}
    <tr><td>API / SSO / Audit Log</td><td>—</td><td>—</td><td>—</td><td>○</td></tr>
    <tr><td>Priority Support</td><td>—</td><td>—</td><td>—</td><td>○</td></tr>
  </tbody>
</table>

<div class="tip"><strong>💡 FREE plan includes all features</strong><br/>Only save and export are restricted. Evaluate the full experience, including AI Assistant, at no cost.</div>

<h3>Activation Steps</h3>
<div class="step"><span class="step-num">1</span><div>Launch {productName} and open "License Management" from the menu</div></div>
<div class="step"><span class="step-num">2</span><div>Enter the email address and license key provided in your contract email</div></div>
<div class="step"><span class="step-num">3</span><div>Click "Activate" to complete the process</div></div>

<div class="note"><strong>📝 License key format:</strong> <code>{productCode}-BIZ-2601-XXXX-XXXX-XXXX</code><br/>Contact ${HELP_CONTACT_INFO.support.email} if you need assistance.</div>
`,
  },
};

/**
 * 全製品共通のシステム要件 HTML テンプレート
 */
export const SHARED_SYSTEM_REQ_CONTENT: SharedSectionContent = {
  category: 'system_req',
  html: {
    ja: `
<h2 id="system-req">システム要件</h2>
<p>快適にご利用いただくための推奨環境です。</p>

<table>
  <thead><tr><th>項目</th><th>最低要件</th><th>推奨環境</th></tr></thead>
  <tbody>
    <tr><td>OS</td><td>Windows 10 (64bit)</td><td>Windows 11 (64bit)</td></tr>
    <tr><td>CPU</td><td>Intel Core i3 / AMD Ryzen 3</td><td>Intel Core i5 / AMD Ryzen 5 以上</td></tr>
    <tr><td>メモリ</td><td>4 GB</td><td>8 GB 以上</td></tr>
    <tr><td>ディスク</td><td>500 MB の空き容量</td><td>1 GB 以上</td></tr>
    <tr><td>ディスプレイ</td><td>1280×720</td><td>1920×1080 以上</td></tr>
    <tr><td>ランタイム</td><td colspan="2">.NET 8.0 Desktop Runtime（インストーラーに同梱）</td></tr>
    <tr><td>インターネット</td><td colspan="2">AI アシスタント・ライセンス認証に必要</td></tr>
  </tbody>
</table>

<div class="tip"><strong>💡 インストール不要で試せます</strong><br/>ポータブル版（ZIP）もご用意しています。管理者権限なしでお試しいただけます。</div>
`,
    en: `
<h2 id="system-req">System Requirements</h2>
<p>Recommended environment for optimal performance.</p>

<table>
  <thead><tr><th>Item</th><th>Minimum</th><th>Recommended</th></tr></thead>
  <tbody>
    <tr><td>OS</td><td>Windows 10 (64-bit)</td><td>Windows 11 (64-bit)</td></tr>
    <tr><td>CPU</td><td>Intel Core i3 / AMD Ryzen 3</td><td>Intel Core i5 / AMD Ryzen 5 or higher</td></tr>
    <tr><td>Memory</td><td>4 GB</td><td>8 GB or more</td></tr>
    <tr><td>Disk</td><td>500 MB free space</td><td>1 GB or more</td></tr>
    <tr><td>Display</td><td>1280×720</td><td>1920×1080 or higher</td></tr>
    <tr><td>Runtime</td><td colspan="2">.NET 8.0 Desktop Runtime (bundled with installer)</td></tr>
    <tr><td>Internet</td><td colspan="2">Required for AI Assistant and license activation</td></tr>
  </tbody>
</table>

<div class="tip"><strong>💡 Try without installation</strong><br/>A portable edition (ZIP) is available. No administrator privileges required.</div>
`,
  },
};

/**
 * 全製品共通のサポートセクション HTML テンプレート
 */
export const SHARED_SUPPORT_CONTENT: SharedSectionContent = {
  category: 'support',
  html: {
    ja: `
<h2 id="support">お問い合わせ・サポート</h2>
<p>ご不明な点がございましたら、お気軽にお問い合わせください。<br/>専任スタッフが迅速に対応いたします。</p>

<div class="feature-grid">
  <div class="feature-card">
    <h4>メールサポート</h4>
    <p><a href="mailto:${HELP_CONTACT_INFO.support.email}">${HELP_CONTACT_INFO.support.email}</a><br/>受付時間: ${HELP_CONTACT_INFO.support.hours.ja}<br/>※ ${HELP_CONTACT_INFO.support.priorityNote.ja}</p>
  </div>
  <div class="feature-card">
    <h4>導入・活用相談</h4>
    <p>${HELP_CONTACT_INFO.sales.description.ja}<br/><a href="mailto:${HELP_CONTACT_INFO.sales.email}">${HELP_CONTACT_INFO.sales.email}</a></p>
  </div>
</div>

<div class="tip"><strong>💡 よりスムーズな問い合わせのために</strong><br/>お問い合わせの際は、製品名・バージョン・ライセンスキー・発生状況を添えていただくと、迅速に対応できます。</div>
`,
    en: `
<h2 id="support">Contact &amp; Support</h2>
<p>If you have any questions, please don't hesitate to reach out.<br/>Our dedicated team will respond promptly.</p>

<div class="feature-grid">
  <div class="feature-card">
    <h4>Email Support</h4>
    <p><a href="mailto:${HELP_CONTACT_INFO.support.email}">${HELP_CONTACT_INFO.support.email}</a><br/>Hours: ${HELP_CONTACT_INFO.support.hours.en}<br/>${HELP_CONTACT_INFO.support.priorityNote.en}.</p>
  </div>
  <div class="feature-card">
    <h4>Deployment Consultation</h4>
    <p>${HELP_CONTACT_INFO.sales.description.en}<br/><a href="mailto:${HELP_CONTACT_INFO.sales.email}">${HELP_CONTACT_INFO.sales.email}</a></p>
  </div>
</div>

<div class="tip"><strong>💡 For faster support</strong><br/>Please include the product name, version, license key, and a description of the issue.</div>
`,
  },
};

/**
 * AI アシスタント共通セクション HTML テンプレート
 */
export const SHARED_AI_ASSISTANT_CONTENT: SharedSectionContent = {
  category: 'ai_assistant',
  html: {
    ja: `
<h2 id="ai-assistant">AI アシスタント</h2>
<p>Claude（Anthropic）の最新 AI が、あなたの業務をサポートします。<br/>すべてのプランで、お手持ちの API キーですぐにご利用いただけます。</p>

<div class="feature-grid">
  <div class="feature-card">
    <h4>回数制限なし</h4>
    <p>FREE プランを含む全プランで、回数制限なく AI に相談できます。API 利用料はお客様の Anthropic アカウントに直接課金されるため、透明性の高い料金体系です。</p>
  </div>
  <div class="feature-card">
    <h4>全モデル選択可能</h4>
    <p>Haiku（高速）・Sonnet（バランス）・Opus（高精度）から、作業内容に応じて最適なモデルを自由に選択できます。</p>
  </div>
</div>

<h3>API キー設定手順</h3>
<div class="step"><span class="step-num">1</span><div><a href="${HELP_EXTERNAL_LINKS.anthropicConsole}" target="_blank">Anthropic Console</a> でアカウントを作成し、API キーを取得します</div></div>
<div class="step"><span class="step-num">2</span><div>アプリの「設定」→「AI アシスタント」→「API キー」に取得したキーを入力します</div></div>
<div class="step"><span class="step-num">3</span><div>お好みのモデルを選択して、チャットパネルから AI に話しかけてみましょう</div></div>

<div class="note"><strong>📝 BYOK（Bring Your Own Key）方式</strong><br/>API キーはお客様が Anthropic から直接取得・管理します。弊社サーバーを経由しないため、機密データの安全性が確保されます。</div>
`,
    en: `
<h2 id="ai-assistant">AI Assistant</h2>
<p>Claude (Anthropic) AI supports your daily work.<br/>Available on all plans with your own API key.</p>

<div class="feature-grid">
  <div class="feature-card">
    <h4>Unlimited Usage</h4>
    <p>Use AI without any usage limits on all plans, including FREE. API costs are billed directly to your Anthropic account for full transparency.</p>
  </div>
  <div class="feature-card">
    <h4>Choose Any Model</h4>
    <p>Select from Haiku (fast), Sonnet (balanced), or Opus (most capable) based on your task requirements.</p>
  </div>
</div>

<h3>API Key Setup</h3>
<div class="step"><span class="step-num">1</span><div>Create an account at <a href="${HELP_EXTERNAL_LINKS.anthropicConsole}" target="_blank">Anthropic Console</a> and generate an API key</div></div>
<div class="step"><span class="step-num">2</span><div>Open Settings → AI Assistant → API Key and paste your key</div></div>
<div class="step"><span class="step-num">3</span><div>Choose your preferred model and start chatting with the AI panel</div></div>

<div class="note"><strong>📝 BYOK (Bring Your Own Key)</strong><br/>You obtain and manage API keys directly from Anthropic. No data passes through our servers, ensuring the safety of your confidential information.</div>
`,
  },
};

/**
 * 全共通コンテンツをまとめた配列
 */
export const SHARED_CONTENTS: readonly SharedSectionContent[] = [
  SHARED_LICENSE_CONTENT,
  SHARED_SYSTEM_REQ_CONTENT,
  SHARED_SUPPORT_CONTENT,
  SHARED_AI_ASSISTANT_CONTENT,
];

// =============================================================================
// 製品別ヘルプ構成
// =============================================================================

/**
 * INSS — Insight Deck Quality Gate（11セクション — 基準実装）
 */
const INSS_HELP: ProductHelpConfig = {
  productCode: 'INSS',
  productName: { ja: 'Insight Deck Quality Gate', en: 'Insight Deck Quality Gate' },
  colorTheme: 'ivory_gold',
  supportedLanguages: ['ja', 'en'],
  marketing: {
    tagline: {
      ja: 'プレゼン品質を、AIの力で一段上へ',
      en: 'Elevate Your Presentations with AI',
    },
    valueProposition: {
      ja: 'Microsoft Office がなくても、プロ品質のプレゼン資料を作成・編集・管理できます。AI アシスタントがテキストの校正から構成改善まで提案し、チームの資料品質を底上げします。',
      en: 'Create, edit, and manage professional presentations without Microsoft Office. The AI Assistant handles everything from proofreading to structural improvements, elevating your team\'s output quality.',
    },
    targetAudience: {
      ja: 'プレゼン資料を頻繁に作成・レビューする企業の DX推進部門・営業企画部門',
      en: 'Enterprise DX and sales planning teams that frequently create and review presentations',
    },
    benefitKeywords: [
      { ja: 'MS Office 不要で資料作成', en: 'No MS Office Required' },
      { ja: 'AI が校正・改善を提案', en: 'AI Proofreading & Improvement' },
      { ja: '2ファイル差分比較', en: 'Two-File Diff Compare' },
      { ja: 'バージョン管理で履歴追跡', en: 'Version Control & History' },
    ],
  },
  sections: [
    { id: 'overview',     category: 'overview',        label: { ja: 'はじめに',               en: 'Getting Started' },       description: { ja: '製品概要と主要機能をご紹介します。初回起動時にお読みください。', en: 'Product overview and key features. Read this when you first launch the app.' }, order: 1,  isRequired: true },
    { id: 'ui-layout',    category: 'ui_layout',       label: { ja: '画面構成',               en: 'UI Layout' },             description: { ja: '各パネルの役割と操作エリアを把握して、スムーズに作業を始められます。', en: 'Understand each panel\'s role and work areas to get started quickly.' }, order: 2,  isRequired: true },
    { id: 'file-ops',     category: 'file_ops',        label: { ja: 'ファイル操作',           en: 'File Operations' },       description: { ja: 'ドラッグ&ドロップで簡単インポート。独自プロジェクト形式(.inss)で全データを1ファイルに集約できます。', en: 'Easy drag & drop import. The .inss project format bundles all data into a single file.' }, order: 3,  isRequired: true },
    { id: 'text-edit',    category: 'editing',         label: { ja: 'テキスト編集',           en: 'Text Editing' },          description: { ja: 'スライド内テキストの編集・書式設定・一括置換で、資料の統一感を効率的に保てます。', en: 'Edit, format, and batch-replace text across slides to maintain consistent quality.' }, order: 4,  isRequired: true },
    { id: 'notes',        category: 'product_feature', label: { ja: '発表者ノート',           en: 'Speaker Notes' },         description: { ja: '発表者ノートの編集・AI による改善提案で、プレゼン本番の自信につながります。', en: 'Edit speaker notes with AI improvement suggestions to boost your presentation confidence.' }, order: 5,  isRequired: true },
    { id: 'ai-assistant', category: 'ai_assistant',    label: { ja: 'AIアシスタント',          en: 'AI Assistant' },          description: { ja: 'Claude AI があなたの業務パートナーに。テキストの校正、改善提案、要約をチャット形式で。', en: 'Claude AI becomes your work partner. Proofreading, suggestions, and summaries via chat.' }, order: 6,  isRequired: true },
    { id: 'compare',      category: 'compare',         label: { ja: 'ファイル比較',           en: 'File Compare' },          description: { ja: '2つのファイルをスライド単位で差分比較。レビュー工数を大幅に削減できます。', en: 'Compare two files slide by slide. Dramatically reduce review time.' }, order: 7,  isRequired: true },
    { id: 'shortcuts',    category: 'shortcuts',       label: { ja: 'キーボードショートカット', en: 'Keyboard Shortcuts' },    description: { ja: 'ショートカットを活用して、マウス操作を減らし作業効率をアップ。', en: 'Use shortcuts to minimize mouse operations and boost productivity.' }, order: 8,  isRequired: true },
    { id: 'license',      category: 'license',         label: { ja: 'ライセンス・プラン',      en: 'License & Plans' },       description: { ja: 'FREE から ENT まで、業務規模に合わせた最適なプランをご案内します。', en: 'From FREE to ENT, find the plan that fits your business scale.' }, order: 9,  isRequired: true },
    { id: 'system-req',   category: 'system_req',      label: { ja: 'システム要件',           en: 'System Requirements' },   description: { ja: '快適にご利用いただくための推奨環境をご確認ください。', en: 'Check the recommended environment for optimal performance.' }, order: 10, isRequired: true },
    { id: 'support',      category: 'support',         label: { ja: 'お問い合わせ',           en: 'Support' },               description: { ja: 'ご不明な点は専任スタッフが迅速に対応します。', en: 'Our dedicated staff will respond promptly to your inquiries.' }, order: 11, isRequired: true },
  ],
};

/**
 * IOSH — Insight Performance Management（14セクション）
 *
 * 注意: 既存実装では integer ID を使用しているが、string に移行すること。
 */
const IOSH_HELP: ProductHelpConfig = {
  productCode: 'IOSH',
  productName: { ja: 'Insight Performance Management', en: 'Insight Performance Management' },
  colorTheme: 'ivory_gold',
  supportedLanguages: ['ja', 'en', 'zh'],
  marketing: {
    tagline: {
      ja: '経営数値を一元管理。AIが示す、次の一手',
      en: 'Unified Financial Management. AI-Powered Insights',
    },
    valueProposition: {
      ja: 'Excel ファイルの編集から差分比較、バージョン管理まで1本で完結。AI アシスタントが数値の傾向分析や改善提案を行い、経営判断のスピードを加速します。MS Office は不要です。',
      en: 'From Excel editing to diff comparison and version control, all in one tool. The AI Assistant analyzes trends and suggests improvements, accelerating business decisions. No MS Office required.',
    },
    targetAudience: {
      ja: '経営管理部門・財務部門・管理会計を担当するビジネスユーザー',
      en: 'Business management, finance departments, and management accounting professionals',
    },
    benefitKeywords: [
      { ja: 'MS Office 不要で Excel 編集', en: 'Edit Excel Without MS Office' },
      { ja: 'セル単位の変更追跡', en: 'Cell-Level Change Tracking' },
      { ja: 'AI が数値分析をサポート', en: 'AI-Powered Data Analysis' },
      { ja: 'バージョン履歴で安心管理', en: 'Version History for Peace of Mind' },
    ],
  },
  sections: [
    { id: 'overview',        category: 'overview',        label: { ja: 'はじめに',               en: 'Getting Started' },       description: { ja: '製品概要と主要機能をご紹介します。', en: 'Product overview and key features.' }, order: 1,  isRequired: true },
    { id: 'ai-assistant',    category: 'ai_assistant',    label: { ja: 'AIアシスタント',          en: 'AI Assistant' },          description: { ja: 'Claude AI にデータ分析や関数の相談ができます。自然言語で指示するだけ。', en: 'Ask Claude AI about data analysis and formulas. Just describe what you need.' }, order: 2,  isRequired: true },
    { id: 'ui-layout',       category: 'ui_layout',       label: { ja: '画面構成',               en: 'UI Layout' },             description: { ja: 'Ribbon インターフェースの各タブと作業エリアの構成をご確認ください。', en: 'Explore the Ribbon interface tabs and work area layout.' }, order: 3,  isRequired: true },
    { id: 'file-ops',        category: 'file_ops',        label: { ja: 'ファイル操作',           en: 'File Operations' },       description: { ja: '.xlsx/.csv を直接編集。独自形式(.iosh)で AI メモリやバージョン履歴も1ファイルに。', en: 'Edit .xlsx/.csv directly. The .iosh format bundles AI memory and version history in one file.' }, order: 4,  isRequired: true },
    { id: 'spreadsheet',     category: 'editing',         label: { ja: 'スプレッドシート編集',    en: 'Spreadsheet Editing' },   description: { ja: 'セル書式、グラフ、条件付き書式 — Excel と同等の編集機能を備えています。', en: 'Cell formatting, charts, conditional formatting — full Excel-compatible editing capabilities.' }, order: 5,  isRequired: true },
    { id: 'excel-functions', category: 'product_feature', label: { ja: 'Excel 関数リファレンス',  en: 'Excel Functions' },       description: { ja: 'SUM から VLOOKUP まで 400 以上の関数に対応。AI に使い方を聞くこともできます。', en: 'Over 400 functions from SUM to VLOOKUP. Ask the AI for usage guidance.' }, order: 6,  isRequired: true },
    { id: 'version-history', category: 'version_history', label: { ja: 'バージョン管理',         en: 'Version History' },       description: { ja: '編集前に自動バックアップ。「いつ・誰が・何を変えたか」を完全に追跡できます。', en: 'Automatic backup before edits. Track "who changed what, when" completely.' }, order: 7,  isRequired: true },
    { id: 'compare',         category: 'compare',         label: { ja: 'ファイル比較',           en: 'File Compare' },          description: { ja: '2つの Excel ファイルをセル単位で差分比較。月次レポートの変更箇所を瞬時に把握。', en: 'Compare two Excel files cell by cell. Instantly spot changes in monthly reports.' }, order: 8,  isRequired: true },
    { id: 'change-log',      category: 'product_feature', label: { ja: '変更ログ',               en: 'Change Log' },            description: { ja: 'セル単位の変更履歴を自動記録。監査対応やチーム間の引き継ぎに。', en: 'Automatic cell-level change log. Perfect for audits and team handovers.' }, order: 9,  isRequired: true },
    { id: 'data-collection', category: 'product_feature', label: { ja: 'データ収集',             en: 'Data Collection' },       description: { ja: '複数の Excel ファイルからデータを収集・集計。月末処理を自動化できます。', en: 'Collect and aggregate data from multiple Excel files. Automate month-end processing.' }, order: 10, isRequired: true },
    { id: 'shortcuts',       category: 'shortcuts',       label: { ja: 'キーボードショートカット', en: 'Keyboard Shortcuts' },    description: { ja: 'Excel ユーザーに馴染みのあるショートカットで、すぐに使いこなせます。', en: 'Familiar Excel-compatible shortcuts for immediate productivity.' }, order: 11, isRequired: true },
    { id: 'file-formats',    category: 'product_feature', label: { ja: '対応ファイル形式',       en: 'Supported Formats' },     description: { ja: '.xlsx / .xls / .csv に対応。他ツールとのデータ連携もスムーズです。', en: 'Supports .xlsx, .xls, and .csv for seamless data exchange.' }, order: 12, isRequired: true },
    { id: 'license',         category: 'license',         label: { ja: 'ライセンス・プラン',      en: 'License & Plans' },       description: { ja: 'FREE から ENT まで、業務規模に合わせた最適なプランをご案内します。', en: 'From FREE to ENT, find the plan that fits your business scale.' }, order: 13, isRequired: true },
    { id: 'support',         category: 'support',         label: { ja: 'お問い合わせ',           en: 'Support' },               description: { ja: 'ご不明な点は専任スタッフが迅速に対応します。', en: 'Our dedicated staff will respond promptly to your inquiries.' }, order: 14, isRequired: true },
  ],
};

/**
 * IOSD — Insight AI Briefcase（16セクション）
 *
 * 注意: 既存実装で XAML ハードコード色がある場合は DynamicResource に修正すること。
 */
const IOSD_HELP: ProductHelpConfig = {
  productCode: 'IOSD',
  productName: { ja: 'Insight AI Briefcase', en: 'Insight AI Briefcase' },
  colorTheme: 'ivory_gold',
  supportedLanguages: ['ja', 'en', 'zh'],
  marketing: {
    tagline: {
      ja: '業務文書をAIで効率化。作成から管理まで一気通貫',
      en: 'Streamline Documents with AI. From Creation to Management',
    },
    valueProposition: {
      ja: 'Word 文書の作成・編集・PDF 変換・バージョン管理を1つのアプリで完結。AI が文書の校正・要約・構成改善を提案し、品質の高いドキュメント作成を支援します。MS Office は不要です。',
      en: 'Create, edit, convert to PDF, and version-control Word documents in one app. AI suggests proofreading, summarization, and structural improvements. No MS Office required.',
    },
    targetAudience: {
      ja: '契約書・報告書・提案書を日常的に作成する法務部門・総務部門・コンサルタント',
      en: 'Legal, general affairs, and consulting teams who create contracts, reports, and proposals daily',
    },
    benefitKeywords: [
      { ja: 'MS Office 不要で文書作成', en: 'Create Documents Without MS Office' },
      { ja: 'AI が校正・要約・構成改善', en: 'AI Proofreading & Summarization' },
      { ja: '参考資料を AI に読み込ませる', en: 'Feed References to AI' },
      { ja: 'テンプレートで統一品質', en: 'Templates for Consistent Quality' },
    ],
  },
  sections: [
    { id: 'overview',        category: 'overview',        label: { ja: 'はじめに',               en: 'Getting Started' },       description: { ja: '製品概要と主要機能をご紹介します。', en: 'Product overview and key features.' }, order: 1,  isRequired: true },
    { id: 'ui-layout',       category: 'ui_layout',       label: { ja: '画面構成',               en: 'UI Layout' },             description: { ja: 'Ribbon インターフェースと各パネルの役割を把握できます。', en: 'Explore the Ribbon interface and each panel\'s role.' }, order: 2,  isRequired: true },
    { id: 'file-ops',        category: 'file_ops',        label: { ja: 'ファイル操作',           en: 'File Operations' },       description: { ja: '.docx を直接編集。独自形式(.iosd)で参考資料や AI メモリも1ファイルに。', en: 'Edit .docx directly. The .iosd format bundles references and AI memory in one file.' }, order: 3,  isRequired: true },
    { id: 'editing',         category: 'editing',         label: { ja: '文書編集',               en: 'Document Editing' },      description: { ja: '書式設定、表・画像の挿入、スタイル適用 — Word と同等の編集体験を提供します。', en: 'Formatting, tables, images, styles — full Word-compatible editing experience.' }, order: 4,  isRequired: true },
    { id: 'version-history', category: 'version_history', label: { ja: 'バージョン管理',         en: 'Version History' },       description: { ja: '文書の変更履歴を自動で記録。過去のバージョンにいつでも戻せます。', en: 'Automatic change history. Roll back to any previous version anytime.' }, order: 5,  isRequired: true },
    { id: 'ai-assistant',    category: 'ai_assistant',    label: { ja: 'AIアシスタント',          en: 'AI Assistant' },          description: { ja: 'Claude AI が文書の校正・要約・構成提案をチャット形式でサポートします。', en: 'Claude AI supports proofreading, summarization, and structural suggestions via chat.' }, order: 6,  isRequired: true },
    { id: 'references',      category: 'product_feature', label: { ja: '参考資料',               en: 'References' },            description: { ja: '関連資料を添付して AI に読み込ませると、文脈を踏まえた的確な提案が得られます。', en: 'Attach related documents for the AI to read, enabling context-aware suggestions.' }, order: 7,  isRequired: true },
    { id: 'comments',        category: 'product_feature', label: { ja: 'コメント・レビュー',      en: 'Comments & Review' },     description: { ja: '文書内にコメントを挿入してチームでレビュー。返信・解決機能でやり取りを集約。', en: 'Insert comments for team review. Reply and resolve features keep discussions organized.' }, order: 8,  isRequired: true },
    { id: 'templates',       category: 'product_feature', label: { ja: 'テンプレート',           en: 'Templates' },             description: { ja: '定型文書をテンプレート化して、チーム全体の品質とスピードを均一化できます。', en: 'Templatize standard documents to unify quality and speed across your team.' }, order: 9,  isRequired: true, planBadge: 'ENT' },
    { id: 'export-print',    category: 'product_feature', label: { ja: 'エクスポート・印刷',      en: 'Export & Print' },        description: { ja: 'PDF・HTML・テキスト形式へ変換。印刷設定も細かくカスタマイズできます。', en: 'Convert to PDF, HTML, or text. Printing settings are fully customizable.' }, order: 10, isRequired: true },
    { id: 'file-optimize',   category: 'product_feature', label: { ja: 'ファイル最適化',         en: 'File Optimization' },     description: { ja: '画像圧縮やメタデータ整理で、ファイルサイズを削減しメール添付もスムーズに。', en: 'Compress images and clean metadata to reduce file size for easy email sharing.' }, order: 11, isRequired: true },
    { id: 'shortcuts',       category: 'shortcuts',       label: { ja: 'キーボードショートカット', en: 'Keyboard Shortcuts' },    description: { ja: 'Word ユーザーに馴染みのあるショートカットで、すぐに使いこなせます。', en: 'Familiar Word-compatible shortcuts for immediate productivity.' }, order: 12, isRequired: true },
    { id: 'faq',             category: 'faq',             label: { ja: 'よくある質問',           en: 'FAQ' },                   description: { ja: 'お寄せいただくご質問とその回答をまとめています。', en: 'Frequently asked questions and answers.' }, order: 13, isRequired: true },
    { id: 'license',         category: 'license',         label: { ja: 'ライセンス・プラン',      en: 'License & Plans' },       description: { ja: 'FREE から ENT まで、業務規模に合わせた最適なプランをご案内します。', en: 'From FREE to ENT, find the plan that fits your business scale.' }, order: 14, isRequired: true },
    { id: 'system-req',      category: 'system_req',      label: { ja: 'システム要件',           en: 'System Requirements' },   description: { ja: '快適にご利用いただくための推奨環境をご確認ください。', en: 'Check the recommended environment for optimal performance.' }, order: 15, isRequired: true },
    { id: 'support',         category: 'support',         label: { ja: 'お問い合わせ',           en: 'Support' },               description: { ja: 'ご不明な点は専任スタッフが迅速に対応します。', en: 'Our dedicated staff will respond promptly to your inquiries.' }, order: 16, isRequired: true },
  ],
};

/**
 * INMV — Insight Training Studio（10セクション — 新規）
 */
const INMV_HELP: ProductHelpConfig = {
  productCode: 'INMV',
  productName: { ja: 'Insight Training Studio', en: 'Insight Training Studio' },
  colorTheme: 'ivory_gold',
  supportedLanguages: ['ja', 'en'],
  marketing: {
    tagline: {
      ja: '画像とテキストから、プロ品質の研修動画を自動生成',
      en: 'Auto-Generate Professional Training Videos from Images & Text',
    },
    valueProposition: {
      ja: 'PowerPoint 素材と原稿テキストを用意するだけで、ナレーション付き研修動画を自動生成。動画制作の専門知識がなくても、社内研修・マニュアル動画を短時間で量産できます。',
      en: 'Just prepare PowerPoint slides and script text to auto-generate narrated training videos. Mass-produce internal training and manual videos without video production expertise.',
    },
    targetAudience: {
      ja: '社内研修・教育コンテンツを効率的に制作したい人事部門・教育研修部門',
      en: 'HR and training departments looking to efficiently produce internal education content',
    },
    benefitKeywords: [
      { ja: 'PPTX から動画を自動生成', en: 'Auto-Generate from PPTX' },
      { ja: 'AI がナレーション原稿を作成', en: 'AI-Written Narration Scripts' },
      { ja: '字幕・トランジション自動付与', en: 'Auto Subtitles & Transitions' },
      { ja: '動画制作の専門知識不要', en: 'No Video Expertise Needed' },
    ],
  },
  sections: [
    { id: 'overview',      category: 'overview',        label: { ja: 'はじめに',               en: 'Getting Started' },       description: { ja: '製品概要と動画制作ワークフローをご紹介します。', en: 'Product overview and video production workflow.' }, order: 1,  isRequired: true },
    { id: 'ui-layout',     category: 'ui_layout',       label: { ja: '画面構成',               en: 'UI Layout' },             description: { ja: 'タイムライン・プレビュー・素材パネルの配置と操作方法をご確認ください。', en: 'Explore the timeline, preview, and asset panel layout.' }, order: 2,  isRequired: true },
    { id: 'file-ops',      category: 'file_ops',        label: { ja: '素材取り込み',           en: 'Import Assets' },         description: { ja: 'PPTX・画像・音声をドラッグ&ドロップで取り込み。素材管理も直感的に。', en: 'Drag & drop PPTX, images, and audio. Intuitive asset management.' }, order: 3,  isRequired: true },
    { id: 'video-editing', category: 'editing',          label: { ja: '動画編集',               en: 'Video Editing' },         description: { ja: 'シーンの並べ替え・トランジション・字幕スタイルを設定して、プロ品質の動画に仕上げます。', en: 'Arrange scenes, set transitions, and style subtitles for professional-quality videos.' }, order: 4,  isRequired: true },
    { id: 'narration',     category: 'product_feature',  label: { ja: 'ナレーション',           en: 'Narration' },             description: { ja: 'AI がスライド内容からナレーション原稿を自動作成。音声合成でナレーションも自動生成します。', en: 'AI auto-generates narration scripts from slides. Text-to-speech creates the narration automatically.' }, order: 5,  isRequired: true },
    { id: 'ai-assistant',  category: 'ai_assistant',     label: { ja: 'AIアシスタント',          en: 'AI Assistant' },          description: { ja: '動画構成の提案、ナレーション原稿の改善、字幕の最適化を AI がサポートします。', en: 'AI supports video structure suggestions, narration improvement, and subtitle optimization.' }, order: 6,  isRequired: true },
    { id: 'shortcuts',     category: 'shortcuts',        label: { ja: 'キーボードショートカット', en: 'Keyboard Shortcuts' },    description: { ja: 'タイムライン操作を効率化するショートカット一覧。', en: 'Shortcuts to streamline timeline operations.' }, order: 7,  isRequired: true },
    { id: 'license',       category: 'license',          label: { ja: 'ライセンス・プラン',      en: 'License & Plans' },       description: { ja: 'FREE から ENT まで、業務規模に合わせた最適なプランをご案内します。', en: 'From FREE to ENT, find the plan that fits your business scale.' }, order: 8,  isRequired: true },
    { id: 'system-req',    category: 'system_req',       label: { ja: 'システム要件',           en: 'System Requirements' },   description: { ja: '動画生成にはやや高いスペックを推奨します。', en: 'Higher specs recommended for video generation.' }, order: 9,  isRequired: true },
    { id: 'support',       category: 'support',          label: { ja: 'お問い合わせ',           en: 'Support' },               description: { ja: 'ご不明な点は専任スタッフが迅速に対応します。', en: 'Our dedicated staff will respond promptly to your inquiries.' }, order: 10, isRequired: true },
  ],
};

/**
 * INPY — InsightPy（8セクション）
 */
const INPY_HELP: ProductHelpConfig = {
  productCode: 'INPY',
  productName: { ja: 'InsightPy', en: 'InsightPy' },
  colorTheme: 'ivory_gold',
  supportedLanguages: ['ja', 'en'],
  marketing: {
    tagline: {
      ja: 'AI エディタで Python を直感的に。業務自動化の第一歩',
      en: 'Intuitive Python with AI Editor. Your First Step to Automation',
    },
    valueProposition: {
      ja: 'AI がコードを書いてくれるから、プログラミング経験がなくても業務データの集計・加工・分析を自動化できます。プリセットスクリプトですぐに使い始められます。',
      en: 'AI writes the code for you, enabling automation of data aggregation and analysis without programming experience. Get started immediately with preset scripts.',
    },
    targetAudience: {
      ja: '業務データの手作業に課題を感じている DX推進部門・情報システム部門',
      en: 'DX and IT departments looking to eliminate manual data processing',
    },
    benefitKeywords: [
      { ja: 'AI がコードを自動生成', en: 'AI Auto-Generates Code' },
      { ja: 'プリセットですぐ使える', en: 'Ready-to-Use Presets' },
      { ja: 'プログラミング経験不要', en: 'No Coding Experience Needed' },
      { ja: '業務データを自動処理', en: 'Automated Data Processing' },
    ],
  },
  sections: [
    { id: 'overview',          category: 'overview',        label: { ja: 'はじめに',               en: 'Getting Started' },       description: { ja: '製品概要と AI コードエディターの始め方をご紹介します。', en: 'Product overview and how to get started with the AI code editor.' }, order: 1, isRequired: true },
    { id: 'ui-layout',         category: 'ui_layout',       label: { ja: '画面構成',               en: 'UI Layout' },             description: { ja: 'エディターパネル・出力パネル・AI チャットの配置と操作方法。', en: 'Layout of the editor, output panel, and AI chat.' }, order: 2, isRequired: true },
    { id: 'script-management', category: 'product_feature', label: { ja: 'スクリプト管理',         en: 'Script Management' },     description: { ja: 'スクリプトの作成・保存・整理。プリセットから選んですぐに実行できます。', en: 'Create, save, and organize scripts. Choose from presets for instant execution.' }, order: 3, isRequired: true },
    { id: 'code-editor',       category: 'editing',         label: { ja: 'AI コードエディター',    en: 'AI Code Editor' },        description: { ja: '「やりたいこと」を日本語で伝えるだけで、AI がPythonコードを生成・修正します。', en: 'Just describe what you want in plain language, and AI generates and fixes Python code.' }, order: 4, isRequired: true },
    { id: 'ai-assistant',      category: 'ai_assistant',    label: { ja: 'AIアシスタント',          en: 'AI Assistant' },          description: { ja: 'コードのデバッグ、エラーの解説、処理の最適化を AI がチャット形式でサポート。', en: 'AI supports debugging, error explanation, and optimization via chat.' }, order: 5, isRequired: true },
    { id: 'shortcuts',         category: 'shortcuts',       label: { ja: 'キーボードショートカット', en: 'Keyboard Shortcuts' },    description: { ja: 'コードエディターの操作を効率化するショートカット一覧。', en: 'Shortcuts to streamline code editor operations.' }, order: 6, isRequired: true },
    { id: 'license',           category: 'license',         label: { ja: 'ライセンス・プラン',      en: 'License & Plans' },       description: { ja: 'FREE から ENT まで、業務規模に合わせた最適なプランをご案内します。', en: 'From FREE to ENT, find the plan that fits your business scale.' }, order: 7, isRequired: true },
    { id: 'support',           category: 'support',         label: { ja: 'お問い合わせ',           en: 'Support' },               description: { ja: 'ご不明な点は専任スタッフが迅速に対応します。', en: 'Our dedicated staff will respond promptly to your inquiries.' }, order: 8, isRequired: true },
  ],
};

/**
 * INBT — InsightBot（9セクション）
 */
const INBT_HELP: ProductHelpConfig = {
  productCode: 'INBT',
  productName: { ja: 'InsightBot', en: 'InsightBot' },
  colorTheme: 'cool_blue_slate',
  supportedLanguages: ['ja', 'en'],
  marketing: {
    tagline: {
      ja: 'AI が書く RPA。業務プロセスを丸ごと自動化',
      en: 'AI-Written RPA. Automate Entire Business Processes',
    },
    valueProposition: {
      ja: 'AI エディターが RPA スクリプトを自動生成。Insight Business Suite と連携し、Excel・Word・PowerPoint ファイルを「中から」直接操作することで、従来の UI オートメーションでは不可能だった高速・高精度な自動処理を実現します。',
      en: 'The AI editor auto-generates RPA scripts. By working with Insight Business Suite to manipulate Office files "from the inside," it achieves speed and accuracy impossible with traditional UI automation.',
    },
    targetAudience: {
      ja: '定型業務の自動化・BPO 効率化を推進する IT部門・業務改革推進室',
      en: 'IT departments and business transformation teams driving automation of routine tasks',
    },
    benefitKeywords: [
      { ja: 'AI がスクリプトを自動生成', en: 'AI Auto-Generates Scripts' },
      { ja: 'ファイルを中から直接操作', en: 'Direct File Manipulation' },
      { ja: 'Orchestrator で集中管理', en: 'Centralized Orchestrator' },
      { ja: 'JOB スケジューラーで定期実行', en: 'Scheduled Job Execution' },
    ],
  },
  sections: [
    { id: 'overview',       category: 'overview',        label: { ja: 'はじめに',               en: 'Getting Started' },       description: { ja: '製品概要と RPA 自動化の始め方をご紹介します。', en: 'Product overview and how to get started with RPA automation.' }, order: 1, isRequired: true },
    { id: 'ui-layout',      category: 'ui_layout',       label: { ja: '画面構成',               en: 'UI Layout' },             description: { ja: 'JOB リスト・スクリプトエディター・実行ログの配置と操作方法。', en: 'Layout of JOB list, script editor, and execution log.' }, order: 2, isRequired: true },
    { id: 'job-management', category: 'product_feature', label: { ja: 'JOB 管理',               en: 'Job Management' },        description: { ja: 'JOB の作成・編集・実行・ログ管理。プリセットからワンクリックで定型処理を設定できます。', en: 'Create, edit, execute, and manage JOB logs. Set up routine tasks from presets with one click.' }, order: 3, isRequired: true },
    { id: 'script-editor',  category: 'editing',         label: { ja: 'AI スクリプトエディター', en: 'AI Script Editor' },      description: { ja: '「やりたいこと」を日本語で伝えるだけで、AI が Python スクリプトを生成します。', en: 'Just describe what you want and AI generates the Python script.' }, order: 4, isRequired: true },
    { id: 'orchestrator',   category: 'product_feature', label: { ja: 'オーケストレーター',      en: 'Orchestrator' },          description: { ja: '複数 PC の Insight Business Suite を集中管理。JOB 配信・スケジュール実行・監視を一元化。', en: 'Centrally manage Insight Business Suite across multiple PCs. Unified JOB dispatch, scheduling, and monitoring.' }, order: 5, isRequired: true, planBadge: 'ENT' },
    { id: 'ai-assistant',   category: 'ai_assistant',    label: { ja: 'AIアシスタント',          en: 'AI Assistant' },          description: { ja: 'スクリプトのデバッグ、エラー解説、処理最適化を AI がチャット形式でサポート。', en: 'AI supports script debugging, error explanation, and optimization via chat.' }, order: 6, isRequired: true },
    { id: 'shortcuts',      category: 'shortcuts',       label: { ja: 'キーボードショートカット', en: 'Keyboard Shortcuts' },    description: { ja: 'スクリプト編集・JOB 操作を効率化するショートカット一覧。', en: 'Shortcuts for efficient script editing and JOB operations.' }, order: 7, isRequired: true },
    { id: 'license',        category: 'license',         label: { ja: 'ライセンス・プラン',      en: 'License & Plans' },       description: { ja: 'FREE から ENT まで。Orchestrator は ENT プラン限定です。', en: 'FREE to ENT plans available. Orchestrator is ENT-exclusive.' }, order: 8, isRequired: true },
    { id: 'support',        category: 'support',         label: { ja: 'お問い合わせ',           en: 'Support' },               description: { ja: 'ご不明な点は専任スタッフが迅速に対応します。', en: 'Our dedicated staff will respond promptly to your inquiries.' }, order: 9, isRequired: true },
  ],
};

/**
 * ISOF — InsightSeniorOffice（8セクション）
 *
 * シニア向けのため、専門用語を避け、やさしい日本語を使用する。
 */
const ISOF_HELP: ProductHelpConfig = {
  productCode: 'ISOF',
  productName: { ja: 'InsightSeniorOffice', en: 'InsightSeniorOffice' },
  colorTheme: 'ivory_gold',
  supportedLanguages: ['ja', 'en'],
  marketing: {
    tagline: {
      ja: 'パソコン操作に自信がなくても大丈夫。やさしいオフィスツール',
      en: 'Easy Office Tools for Everyone. No Experience Needed',
    },
    valueProposition: {
      ja: '大きな文字と音声操作で、表計算・文書作成・メール送受信がかんたんにできます。「AI アシスタント」に話しかけるだけで、むずかしい操作も代わりにやってくれます。',
      en: 'Large text and voice control make spreadsheets, documents, and email easy. Just talk to the AI Assistant to handle complex operations for you.',
    },
    targetAudience: {
      ja: 'パソコン操作に不慣れなシニア層。デジタルデバイド解消を目指す自治体・福祉団体',
      en: 'Senior users unfamiliar with computers. Municipalities and welfare organizations working to bridge the digital divide',
    },
    benefitKeywords: [
      { ja: '大きな文字で見やすい', en: 'Large, Easy-to-Read Text' },
      { ja: '声で操作できる', en: 'Voice-Controlled' },
      { ja: 'AI がやさしくサポート', en: 'Gentle AI Support' },
      { ja: 'iPhone のメールも読める', en: 'Read iPhone (iCloud) Email' },
    ],
  },
  sections: [
    { id: 'overview',    category: 'overview',        label: { ja: 'はじめに',               en: 'Getting Started' },       description: { ja: 'このアプリでできることを、やさしくご紹介します。', en: 'A gentle introduction to what this app can do for you.' }, order: 1, isRequired: true },
    { id: 'ui-layout',   category: 'ui_layout',       label: { ja: '画面の見かた',           en: 'Screen Guide' },          description: { ja: '画面の各部分の名前と使い方をご説明します。', en: 'Learn the name and purpose of each screen area.' }, order: 2, isRequired: true },
    { id: 'spreadsheet', category: 'editing',         label: { ja: '表計算',                 en: 'Spreadsheet' },           description: { ja: '数字の入力や合計の計算など、表計算の基本操作をご案内します。', en: 'Basic spreadsheet operations like entering numbers and calculating totals.' }, order: 3, isRequired: true },
    { id: 'document',    category: 'editing',         label: { ja: '文書作成',               en: 'Document' },              description: { ja: '手紙や案内文の作成方法をご説明します。', en: 'How to create letters and notices.' }, order: 4, isRequired: true },
    { id: 'email',       category: 'product_feature', label: { ja: 'メール',                 en: 'Email' },                 description: { ja: 'iPhone と同じ iCloud メールをパソコンで読み書きできます。', en: 'Read and write iCloud email on your PC, just like on your iPhone.' }, order: 5, isRequired: true },
    { id: 'shortcuts',   category: 'shortcuts',       label: { ja: 'キーボードショートカット', en: 'Keyboard Shortcuts' },    description: { ja: 'よく使う操作をキーボードだけで素早く行えます。', en: 'Perform frequent operations quickly with keyboard shortcuts.' }, order: 6, isRequired: true },
    { id: 'license',     category: 'license',         label: { ja: 'ライセンス・プラン',      en: 'License & Plans' },       description: { ja: 'ご利用プランについてご案内します。', en: 'Information about available plans.' }, order: 7, isRequired: true },
    { id: 'support',     category: 'support',         label: { ja: 'お問い合わせ',           en: 'Support' },               description: { ja: 'お困りのことがあれば、いつでもご連絡ください。', en: 'Please contact us anytime you need help.' }, order: 8, isRequired: true },
  ],
};

// =============================================================================
// ヘルプ構成レジストリ
// =============================================================================

/** ヘルプ対応製品の構成マップ */
const HELP_CONFIGS: Record<string, ProductHelpConfig> = {
  INSS: INSS_HELP,
  IOSH: IOSH_HELP,
  IOSD: IOSD_HELP,
  INMV: INMV_HELP,
  INPY: INPY_HELP,
  INBT: INBT_HELP,
  ISOF: ISOF_HELP,
};

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 製品のヘルプセクション一覧を取得
 *
 * @param code 製品コード
 * @returns セクション定義の配列（order 順）。未対応製品は空配列
 */
export function getHelpSections(code: ProductCode): HelpSectionDefinition[] {
  const config = HELP_CONFIGS[code];
  if (!config) return [];
  return [...config.sections].sort((a, b) => a.order - b.order);
}

/**
 * 製品のヘルプ構成全体を取得
 *
 * @param code 製品コード
 * @returns ヘルプ構成。未対応製品は null
 */
export function getHelpConfig(code: ProductCode): ProductHelpConfig | null {
  return HELP_CONFIGS[code] ?? null;
}

/**
 * 製品がヘルプシステムに対応しているかチェック
 *
 * @param code 製品コード
 */
export function isHelpSupportedProduct(code: ProductCode): boolean {
  return code in HELP_CONFIGS;
}

/**
 * 全製品で必須のセクションカテゴリ一覧を取得
 *
 * @returns 必須カテゴリの配列
 */
export function getRequiredSections(): readonly HelpSectionCategory[] {
  return REQUIRED_CATEGORIES;
}

/**
 * 製品のヘルプ構成が必須セクションを満たしているか検証
 *
 * @param code 製品コード
 * @returns 検証結果。missing に不足カテゴリが入る
 */
export function validateHelpSections(code: ProductCode): {
  valid: boolean;
  missing: HelpSectionCategory[];
} {
  const config = HELP_CONFIGS[code];
  if (!config) return { valid: false, missing: [...REQUIRED_CATEGORIES] };

  const categories = new Set(config.sections.map((s) => s.category));
  const missing = REQUIRED_CATEGORIES.filter((c) => !categories.has(c));
  return { valid: missing.length === 0, missing };
}

/**
 * 製品のセクションIDが全て string であることを検証
 *
 * @param code 製品コード
 * @returns 全セクションID が string なら true
 */
export function validateSectionIdTypes(code: ProductCode): boolean {
  const sections = getHelpSections(code);
  return sections.every((s) => typeof s.id === 'string' && s.id.length > 0);
}

/**
 * 共通コンテンツ HTML にプレースホルダを適用
 *
 * @param content 共通コンテンツ
 * @param locale 言語
 * @param replacements プレースホルダ置換マップ
 * @returns 適用済み HTML
 */
export function applySharedContent(
  content: SharedSectionContent,
  locale: 'ja' | 'en',
  replacements: Record<string, string>,
): string {
  let html = content.html[locale];
  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(`{${key}}`, value);
  }
  return html;
}

/**
 * 製品のマーケティング情報を取得
 *
 * @param code 製品コード
 * @returns マーケティング情報。未対応製品は null
 */
export function getProductMarketing(code: ProductCode): ProductMarketing | null {
  const config = HELP_CONFIGS[code];
  return config?.marketing ?? null;
}

/**
 * 製品のカラーテーマに対応するスタイルパレットを取得
 *
 * @param code 製品コード
 * @returns スタイルパレット。未対応製品は ivory_gold をフォールバック
 */
export function getStylePalette(
  code: ProductCode,
): (typeof HELP_STYLE_PALETTE)['ivory_gold'] | (typeof HELP_STYLE_PALETTE)['cool_blue_slate'] {
  const config = HELP_CONFIGS[code];
  const theme = config?.colorTheme ?? 'ivory_gold';
  return HELP_STYLE_PALETTE[theme];
}
