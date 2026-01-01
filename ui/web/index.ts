/**
 * @harmonic-insight/ui
 *
 * Harmonic Insight Webサイト共通UIコンポーネント
 */

// コンポーネント
export { GlobalNav, type GlobalNavProps } from './components/GlobalNav';
export { SiteFooter, type SiteFooterProps } from './components/SiteFooter';

// 設定
export {
  SITES,
  getSite,
  getGlobalNavSites,
  getFooterSites,
  getSitesByCategory,
  getFooterSitesByCategory,
  getCategoryName,
  type SiteId,
  type SiteCategory,
  type SiteConfig,
} from './config/sites';
