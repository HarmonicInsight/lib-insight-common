/**
 * SiteFooter - サイトフッターコンポーネント
 *
 * Harmonic Insight の全サイトで共通のフッター
 *
 * @example
 * import { SiteFooter } from '@harmonic-insight/ui';
 *
 * <SiteFooter currentSiteId="blog" />
 */

import React from 'react';
import {
  getFooterSitesByCategory,
  getCategoryName,
  getSite,
  type SiteId,
  type SiteCategory,
} from '../../config/sites';
import styles from './SiteFooter.module.css';

export interface SiteFooterProps {
  /** 現在のサイトID */
  currentSiteId: SiteId;
  /** カスタムクラス名 */
  className?: string;
  /** ダークモード */
  darkMode?: boolean;
  /** コピーライト年（省略時は現在年） */
  copyrightYear?: number;
  /** 追加のフッターリンク */
  additionalLinks?: {
    label: string;
    href: string;
  }[];
}

/**
 * サイトフッター
 */
export function SiteFooter({
  currentSiteId,
  className = '',
  darkMode = false,
  copyrightYear = new Date().getFullYear(),
  additionalLinks = [],
}: SiteFooterProps) {
  const sitesByCategory = getFooterSitesByCategory();
  const homeSite = getSite('home');

  // 表示するカテゴリの順序
  const categoryOrder: SiteCategory[] = ['product', 'content', 'support'];

  return (
    <footer
      className={`${styles.siteFooter} ${darkMode ? styles.dark : ''} ${className}`}
      role="contentinfo"
    >
      <div className={styles.container}>
        {/* メインフッターコンテンツ */}
        <div className={styles.main}>
          {/* ブランドセクション */}
          <div className={styles.brand}>
            <div className={styles.logo}>
              <svg
                className={styles.logoIcon}
                width="40"
                height="40"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect width="32" height="32" rx="8" fill="currentColor" />
                <path d="M8 16L14 10L20 16L14 22L8 16Z" fill="white" />
                <path d="M14 16L20 10L26 16L20 22L14 16Z" fill="white" fillOpacity="0.6" />
              </svg>
              <div className={styles.logoTextGroup}>
                <span className={styles.logoText}>Harmonic Insight</span>
                <span className={styles.tagline}>AI業務支援ソリューション</span>
              </div>
            </div>

            <p className={styles.description}>
              AIの力で業務効率を最大化。
              インタビュー、セールス、プレゼンテーションなど、
              あらゆるビジネスシーンをサポートします。
            </p>

            {/* ソーシャルリンク */}
            <div className={styles.social}>
              <a
                href="https://twitter.com/harmonicinsight"
                className={styles.socialLink}
                aria-label="Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://github.com/HarmonicInsight"
                className={styles.socialLink}
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
            </div>
          </div>

          {/* サイトリンクグリッド */}
          <div className={styles.linksGrid}>
            {categoryOrder.map(category => {
              const sites = sitesByCategory[category];
              if (sites.length === 0) return null;

              return (
                <div key={category} className={styles.linkGroup}>
                  <h3 className={styles.linkGroupTitle}>{getCategoryName(category)}</h3>
                  <ul className={styles.linkList}>
                    {sites.map(site => (
                      <li key={site.id}>
                        <a
                          href={site.url}
                          className={`${styles.link} ${site.id === currentSiteId ? styles.current : ''}`}
                          aria-current={site.id === currentSiteId ? 'page' : undefined}
                        >
                          {site.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            {/* 法的情報 */}
            <div className={styles.linkGroup}>
              <h3 className={styles.linkGroupTitle}>法的情報</h3>
              <ul className={styles.linkList}>
                <li>
                  <a href="https://h-insight.jp/privacy" className={styles.link}>
                    プライバシーポリシー
                  </a>
                </li>
                <li>
                  <a href="https://h-insight.jp/terms" className={styles.link}>
                    利用規約
                  </a>
                </li>
                <li>
                  <a href="https://h-insight.jp/legal" className={styles.link}>
                    特定商取引法に基づく表記
                  </a>
                </li>
                {additionalLinks.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className={styles.link}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 区切り線 */}
        <hr className={styles.divider} />

        {/* ボトムバー */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            &copy; {copyrightYear} Harmonic Insight Inc. All rights reserved.
          </p>
          <div className={styles.bottomLinks}>
            <a href="mailto:info@h-insight.jp" className={styles.bottomLink}>
              info@h-insight.jp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
