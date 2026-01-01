/**
 * Harmonic Insight Webサイト設定
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
  | 'home'           // メインサイト
  | 'framework'      // ビジネスフレームワーク
  | 'insight'        // Insight Series 製品ページ
  | 'blog'           // ブログ
  | 'support'        // サポート
  | 'docs'           // ドキュメント
  | 'careers';       // 採用情報

/**
 * サイトカテゴリ
 */
export type SiteCategory = 'main' | 'product' | 'content' | 'support';

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
  /** サイト説明 */
  description: string;
  /** カテゴリ */
  category: SiteCategory;
  /** グローバルナビに表示するか */
  showInGlobalNav: boolean;
  /** フッターに表示するか */
  showInFooter: boolean;
  /** 表示順序（小さいほど先） */
  order: number;
}

/**
 * 全サイト設定
 * 新しいサイト追加時はここに設定を追加
 */
export const SITES: SiteConfig[] = [
  // === メインサイト ===
  {
    id: 'home',
    name: 'Harmonic Insight',
    nameEn: 'Harmonic Insight',
    url: 'https://h-insight.jp',
    description: 'AI業務支援ソリューション',
    category: 'main',
    showInGlobalNav: true,
    showInFooter: true,
    order: 0,
  },

  // === 製品・サービス ===
  {
    id: 'insight',
    name: 'Insight Series',
    nameEn: 'Insight Series',
    url: 'https://insight.h-insight.jp',
    description: 'AI搭載デスクトップアプリケーション',
    category: 'product',
    showInGlobalNav: true,
    showInFooter: true,
    order: 10,
  },
  {
    id: 'framework',
    name: 'Framework',
    nameEn: 'Framework',
    url: 'https://framework.h-insight.jp',
    description: 'ビジネスフレームワーク集',
    category: 'product',
    showInGlobalNav: true,
    showInFooter: true,
    order: 11,
  },

  // === コンテンツ ===
  {
    id: 'blog',
    name: 'ブログ',
    nameEn: 'Blog',
    url: 'https://blog.h-insight.jp',
    description: '技術・ビジネス情報',
    category: 'content',
    showInGlobalNav: true,
    showInFooter: true,
    order: 20,
  },
  {
    id: 'docs',
    name: 'ドキュメント',
    nameEn: 'Documentation',
    url: 'https://docs.h-insight.jp',
    description: '製品マニュアル・API リファレンス',
    category: 'content',
    showInGlobalNav: false,
    showInFooter: true,
    order: 21,
  },

  // === サポート ===
  {
    id: 'support',
    name: 'サポート',
    nameEn: 'Support',
    url: 'https://support.h-insight.jp',
    description: 'お問い合わせ・ヘルプセンター',
    category: 'support',
    showInGlobalNav: false,
    showInFooter: true,
    order: 30,
  },
  {
    id: 'careers',
    name: '採用情報',
    nameEn: 'Careers',
    url: 'https://h-insight.jp/careers',
    description: '採用情報',
    category: 'support',
    showInGlobalNav: false,
    showInFooter: true,
    order: 31,
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
    main: getSitesByCategory('main'),
    product: getSitesByCategory('product'),
    content: getSitesByCategory('content'),
    support: getSitesByCategory('support'),
  };
}

/**
 * カテゴリの日本語名を取得
 */
export function getCategoryName(category: SiteCategory): string {
  const names: Record<SiteCategory, string> = {
    main: 'メイン',
    product: 'サービス',
    content: 'コンテンツ',
    support: 'サポート',
  };
  return names[category];
}
