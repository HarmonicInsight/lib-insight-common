/**
 * GlobalNav - グローバルナビゲーションコンポーネント
 *
 * Harmonic Insight の全サイトで共通のヘッダーナビゲーション
 *
 * @example
 * import { GlobalNav } from '@harmonic-insight/ui';
 *
 * <GlobalNav currentSiteId="blog" />
 */

import React, { useState, useCallback } from 'react';
import { getGlobalNavSites, getSite, type SiteId, type SiteConfig } from '../../config/sites';
import styles from './GlobalNav.module.css';

export interface GlobalNavProps {
  /** 現在のサイトID */
  currentSiteId: SiteId;
  /** ロゴクリック時のハンドラー（省略時はホームへ遷移） */
  onLogoClick?: () => void;
  /** カスタムクラス名 */
  className?: string;
  /** ダークモード */
  darkMode?: boolean;
}

/**
 * グローバルナビゲーション
 */
export function GlobalNav({
  currentSiteId,
  onLogoClick,
  className = '',
  darkMode = false,
}: GlobalNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sites = getGlobalNavSites();
  const currentSite = getSite(currentSiteId);
  const homeSite = getSite('home');

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const handleLogoClick = useCallback(() => {
    if (onLogoClick) {
      onLogoClick();
    } else if (homeSite) {
      window.location.href = homeSite.url;
    }
  }, [onLogoClick, homeSite]);

  const handleNavClick = useCallback((site: SiteConfig) => {
    window.location.href = site.url;
  }, []);

  return (
    <header
      className={`${styles.globalNav} ${darkMode ? styles.dark : ''} ${className}`}
      role="banner"
    >
      <div className={styles.container}>
        {/* ロゴ */}
        <div className={styles.logo} onClick={handleLogoClick} role="button" tabIndex={0}>
          <svg
            className={styles.logoIcon}
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="8" fill="currentColor" />
            <path
              d="M8 16L14 10L20 16L14 22L8 16Z"
              fill="white"
            />
            <path
              d="M14 16L20 10L26 16L20 22L14 16Z"
              fill="white"
              fillOpacity="0.6"
            />
          </svg>
          <span className={styles.logoText}>Harmonic Insight</span>
        </div>

        {/* デスクトップナビゲーション */}
        <nav className={styles.desktopNav} role="navigation" aria-label="メインナビゲーション">
          <ul className={styles.navList}>
            {sites.map(site => (
              <li key={site.id} className={styles.navItem}>
                <a
                  href={site.url}
                  className={`${styles.navLink} ${site.id === currentSiteId ? styles.active : ''}`}
                  aria-current={site.id === currentSiteId ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(site);
                  }}
                >
                  {site.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* モバイルメニューボタン */}
        <button
          className={styles.mobileMenuButton}
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
        >
          <span className={`${styles.hamburger} ${mobileMenuOpen ? styles.open : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* モバイルナビゲーション */}
        <nav
          id="mobile-menu"
          className={`${styles.mobileNav} ${mobileMenuOpen ? styles.open : ''}`}
          role="navigation"
          aria-label="モバイルナビゲーション"
        >
          <ul className={styles.mobileNavList}>
            {sites.map(site => (
              <li key={site.id} className={styles.mobileNavItem}>
                <a
                  href={site.url}
                  className={`${styles.mobileNavLink} ${site.id === currentSiteId ? styles.active : ''}`}
                  aria-current={site.id === currentSiteId ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(site);
                    setMobileMenuOpen(false);
                  }}
                >
                  {site.name}
                  <span className={styles.mobileNavDescription}>{site.description}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* モバイルメニューオーバーレイ */}
      {mobileMenuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}

export default GlobalNav;
