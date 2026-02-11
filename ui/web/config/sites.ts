/**
 * Harmonic Insight Webサイト設定
 *
 * 4サイト構成:
 *   1. h-insight.jp          - コーポレート（法人）
 *   2. insight-office.com    - Insight Office 製品サイト
 *   3. insight-novels.com    - 小説プラットフォーム
 *   4. erikhiroyuki.com      - 瀬田博之 個人事業主
 *
 * 新しいサイトを追加する場合:
 * 1. SiteId に新しいIDを追加
 * 2. SITES 配列に新しいサイト設定を追加
 * 3. npm run build で再ビルド
 * 4. 各サイトで npm update @harmonic-insight/ui
 */

/**
 * サイトID
 * 新しいサイト追加時はここにIDを追加
 */
export type SiteId =
  | 'corporate'       // コーポレートサイト（h-insight.jp）
  | 'insight-office'  // Insight Office 製品サイト（insight-office.com）
  | 'novels'          // 小説プラットフォーム（insight-novels.com）
  | 'personal';       // 瀬田博之 個人事業主（erikhiroyuki.com）

/**
 * サイトカテゴリ
 */
export type SiteCategory = 'corporate' | 'product' | 'media' | 'personal';

/**
 * サイト設定
 */
export interface SiteConfig {
  /** サイトID */
  id: SiteId;
  /** サイト名（日本語） */
  name: string;
  /** サイト名（英語） */
  nameEn: string;
  /** サイトURL */
  url: string;
  /** サイト説明（日本語） */
  description: string;
  /** サイト説明（英語） */
  descriptionEn: string;
  /** カテゴリ */
  category: SiteCategory;
  /** グローバルナビに表示するか */
  showInGlobalNav: boolean;
  /** フッターに表示するか */
  showInFooter: boolean;
  /** 表示順序（小さいほど先） */
  order: number;
  /** サイト内の主要ページ */
  pages?: SitePage[];
}

/**
 * サイト内ページ
 */
export interface SitePage {
  /** ページ名（日本語） */
  name: string;
  /** ページ名（英語） */
  nameEn: string;
  /** ページパス（サイトURL末尾に結合） */
  path: string;
  /** フッターに表示するか */
  showInFooter: boolean;
}

/**
 * 全サイト設定
 *
 * サイト間の導線設計:
 *
 *   法人顧客の典型的ジャーニー:
 *     セミナー/紹介 → erikhiroyuki.com（人格信頼）
 *     会社確認      → h-insight.jp（法人信頼）
 *     製品検討      → insight-office.com（受注）
 *
 *                    ┌─────────────┐
 *                    │ h-insight.jp │ ← 信頼の起点
 *                    │  法人サイト   │
 *                    └──────┬──────┘
 *                           │
 *              ┌────────────┼────────────┐
 *              ▼            ▼            ▼
 *    ┌──────────────┐ ┌──────────┐ ┌──────────────┐
 *    │insight-office│ │ novels   │ │erikhiroyuki  │
 *    │ 製品 → 受注  │ │ 技術力証明│ │ 人格信頼     │
 *    └──────────────┘ └──────────┘ └──────────────┘
 */
export const SITES: SiteConfig[] = [
  // === 1. コーポレートサイト ===
  {
    id: 'corporate',
    name: 'ハーモニックインサイト',
    nameEn: 'Harmonic Insight',
    url: 'https://h-insight.jp',
    description: 'ハーモニックインサイト合同会社 — AI業務支援コンサルティング',
    descriptionEn: 'Harmonic Insight LLC — AI Business Consulting',
    category: 'corporate',
    showInGlobalNav: true,
    showInFooter: true,
    order: 0,
    pages: [
      { name: 'サービス', nameEn: 'Services', path: '/services', showInFooter: true },
      { name: '製品', nameEn: 'Products', path: '/products', showInFooter: true },
      { name: '建設DX', nameEn: 'Construction DX', path: '/construction-dx', showInFooter: true },
      { name: '会社概要', nameEn: 'About', path: '/company', showInFooter: true },
      { name: 'お問い合わせ', nameEn: 'Contact', path: '/#contact', showInFooter: true },
      { name: 'プライバシーポリシー', nameEn: 'Privacy Policy', path: '/privacy', showInFooter: false },
      { name: '利用規約', nameEn: 'Terms of Service', path: '/terms', showInFooter: false },
      { name: '特定商取引法に基づく表記', nameEn: 'Legal Notice', path: '/legal', showInFooter: false },
    ],
  },

  // === 2. Insight Office 製品サイト ===
  {
    id: 'insight-office',
    name: 'Insight Office',
    nameEn: 'Insight Office',
    url: 'https://www.insight-office.com',
    description: 'AI搭載 業務効率化ツール — 10製品の統合ソリューション',
    descriptionEn: 'AI-Powered Business Productivity Tools',
    category: 'product',
    showInGlobalNav: true,
    showInFooter: true,
    order: 10,
    pages: [
      { name: '製品一覧', nameEn: 'Products', path: '/ja/products', showInFooter: true },
      { name: 'ダウンロード', nameEn: 'Downloads', path: '/ja/downloads', showInFooter: true },
      { name: 'プロフィール', nameEn: 'About', path: '/ja/partners', showInFooter: true },
      { name: 'お問い合わせ', nameEn: 'Contact', path: '/ja/contact', showInFooter: true },
    ],
  },

  // === 3. 小説プラットフォーム ===
  {
    id: 'novels',
    name: 'Insight Novels',
    nameEn: 'Insight Novels',
    url: 'https://www.insight-novels.com',
    description: 'AI活用 小説プラットフォーム — テクノロジーの可能性を体験',
    descriptionEn: 'AI-Powered Novel Platform',
    category: 'media',
    showInGlobalNav: false,
    showInFooter: true,
    order: 20,
    pages: [
      { name: '小説一覧', nameEn: 'Novels', path: '/novels', showInFooter: true },
      { name: 'ランキング', nameEn: 'Ranking', path: '/novels/ranking', showInFooter: true },
      { name: '未来年表', nameEn: 'Future Timeline', path: '/novels/future-timeline', showInFooter: true },
    ],
  },

  // === 4. 瀬田博之 個人事業主 ===
  {
    id: 'personal',
    name: '瀬田博之',
    nameEn: 'Hiroyuki Seta',
    url: 'https://erikhiroyuki.com',
    description: 'ITコンサルタント — 28年の現場経験',
    descriptionEn: 'IT Consultant — 28 Years of Experience',
    category: 'personal',
    showInGlobalNav: false,
    showInFooter: true,
    order: 30,
    pages: [
      { name: '個人サイト', nameEn: 'Personal', path: '/', showInFooter: true },
      { name: 'ハーモニックインサイト紹介', nameEn: 'Harmonic Insight', path: '/harmonic-insight.html', showInFooter: true },
    ],
  },
];

// ============================================
// ユーティリティ関数
// ============================================

/**
 * サイトIDからサイト設定を取得
 */
export function getSite(id: SiteId): SiteConfig | undefined {
  return SITES.find(site => site.id === id);
}

/**
 * グローバルナビに表示するサイト一覧を取得
 * （corporate + insight-office のみ）
 */
export function getGlobalNavSites(): SiteConfig[] {
  return SITES
    .filter(site => site.showInGlobalNav)
    .sort((a, b) => a.order - b.order);
}

/**
 * フッターに表示するサイト一覧を取得
 */
export function getFooterSites(): SiteConfig[] {
  return SITES
    .filter(site => site.showInFooter)
    .sort((a, b) => a.order - b.order);
}

/**
 * カテゴリ別にサイトを取得
 */
export function getSitesByCategory(category: SiteCategory): SiteConfig[] {
  return SITES
    .filter(site => site.category === category && site.showInFooter)
    .sort((a, b) => a.order - b.order);
}

/**
 * 全カテゴリとそのサイト一覧を取得（フッター用）
 */
export function getFooterSitesByCategory(): Record<SiteCategory, SiteConfig[]> {
  return {
    corporate: getSitesByCategory('corporate'),
    product: getSitesByCategory('product'),
    media: getSitesByCategory('media'),
    personal: getSitesByCategory('personal'),
  };
}

/**
 * カテゴリの日本語名を取得
 */
export function getCategoryName(category: SiteCategory): string {
  const names: Record<SiteCategory, string> = {
    corporate: '会社情報',
    product: '製品・サービス',
    media: 'メディア',
    personal: 'コンサルタント',
  };
  return names[category];
}

/**
 * カテゴリの英語名を取得
 */
export function getCategoryNameEn(category: SiteCategory): string {
  const names: Record<SiteCategory, string> = {
    corporate: 'Company',
    product: 'Products',
    media: 'Media',
    personal: 'Consultant',
  };
  return names[category];
}

/**
 * 全サイトのクロスリンク情報を取得
 * 各サイトのフッター等で他サイトへのリンクを表示するために使用
 */
export function getCrossSiteLinks(currentSiteId: SiteId): SiteConfig[] {
  return SITES
    .filter(site => site.id !== currentSiteId && site.showInFooter)
    .sort((a, b) => a.order - b.order);
}

/**
 * サイトの全ページリンク（フッター用）を取得
 */
export function getFooterPages(siteId: SiteId): { name: string; nameEn: string; url: string }[] {
  const site = getSite(siteId);
  if (!site?.pages) return [];

  return site.pages
    .filter(page => page.showInFooter)
    .map(page => ({
      name: page.name,
      nameEn: page.nameEn,
      url: `${site.url}${page.path}`,
    }));
}
