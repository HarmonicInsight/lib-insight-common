/**
 * HARMONIC insight App Icon Manager
 *
 * ============================================================================
 * Android ランチャーアプリが全製品のアイコンを管理するための設定モジュール
 * ============================================================================
 *
 * ## 背景
 * Android ランチャーアプリ（InsightLauncher）は全 Insight 製品のアイコンを
 * タイル表示する。各製品の targetPlatform は wpf/python/tauri/expo 等さまざまだが、
 * ランチャー表示用に Android 解像度（mipmap）の PNG が必要になる。
 *
 * ## 仕組み
 * 1. generate-app-icon.py --launcher で全製品の Android 用アイコンを一括生成
 * 2. 生成先: brand/icons/generated/launcher/{productCode}/
 * 3. launcher-manifest.json に全製品のアイコンメタデータを記録
 * 4. Android ランチャーアプリはこのマニフェストを参照してアイコンを解決
 *
 * ## 使い方（Android ランチャー側）
 * ```typescript
 * import {
 *   getLauncherIcon,
 *   getLauncherIconsForDensity,
 *   LAUNCHER_ICON_MANIFEST,
 * } from '@/insight-common/config/app-icon-manager';
 *
 * // 特定製品のアイコンパスを取得
 * getLauncherIcon('IOSH', 'xxhdpi');
 * // → 'brand/icons/generated/launcher/IOSH/mipmap-xxhdpi/ic_launcher.png'
 *
 * // 全製品のアイコンをまとめて取得（グリッド表示用）
 * const icons = getLauncherIconsForDensity('xxhdpi');
 * // → [{ code: 'INSS', name: 'Insight Deck Quality Gate', path: '...', size: 144 }, ...]
 * ```
 */

import { PRODUCTS, UTILITY_ICONS, type ProductCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** Android 画面密度 */
export type AndroidDensity = 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi';

/** ランチャーアイコンエントリ */
export interface LauncherIconEntry {
  /** 製品/ユーティリティコード */
  code: string;
  /** 製品名（英語） */
  name: string;
  /** 製品名（日本語） */
  nameJa: string;
  /** マスターアイコンパス（リポジトリルートからの相対パス） */
  masterIcon: string;
  /** ランチャー用アイコンの基底ディレクトリ */
  launcherIconDir: string;
  /** 正規の製品かユーティリティか */
  isProduct: boolean;
  /** 製品の表示順序（ランチャーでのソート用） */
  displayOrder: number;
  /** アイコンカテゴリ（ランチャーでのグルーピング用） */
  category: LauncherIconCategory;
}

/** ランチャーでのアイコンカテゴリ */
export type LauncherIconCategory =
  | 'office'      // Insight Business Suite (INSS, IOSH, IOSD)
  | 'ai_tools'    // AI ツール (INMV, INIG, INPY)
  | 'enterprise'  // 業務変革ツール (INCA, INBT, IVIN)
  | 'senior'      // シニアオフィス (ISOF)
  | 'utility';    // ユーティリティ (Camera, VoiceClock, QR, PinBoard, VoiceMemo)

/** ランチャーアイコン解決結果 */
export interface ResolvedLauncherIcon {
  /** 製品/ユーティリティコード */
  code: string;
  /** 製品名（英語） */
  name: string;
  /** 製品名（日本語） */
  nameJa: string;
  /** アイコンファイルパス（リポジトリルートからの相対パス） */
  path: string;
  /** アイコンサイズ (px) */
  size: number;
  /** カテゴリ */
  category: LauncherIconCategory;
  /** 表示順序 */
  displayOrder: number;
}

// =============================================================================
// 定数
// =============================================================================

/** Android 密度 → アイコンサイズ (px) マッピング */
export const ANDROID_DENSITY_SIZES: Record<AndroidDensity, number> = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

/** ランチャーアイコン生成先の基底パス */
export const LAUNCHER_ICONS_BASE_DIR = 'brand/icons/generated/launcher';

/** ランチャーマニフェストファイルのパス */
export const LAUNCHER_MANIFEST_PATH = `${LAUNCHER_ICONS_BASE_DIR}/launcher-manifest.json`;

// =============================================================================
// ランチャーアイコンレジストリ
// =============================================================================

/**
 * 製品コード → カテゴリのマッピング
 */
const PRODUCT_CATEGORIES: Record<string, LauncherIconCategory> = {
  // Insight Business Suite
  INSS: 'office',
  IOSH: 'office',
  IOSD: 'office',
  // AI ツール
  INMV: 'ai_tools',
  INIG: 'ai_tools',
  INPY: 'ai_tools',
  // 業務変革ツール
  INCA: 'enterprise',
  INBT: 'enterprise',
  IVIN: 'enterprise',
  // シニアオフィス
  ISOF: 'senior',
  // ユーティリティ
  LAUNCHER: 'utility',
  CAMERA: 'utility',
  VOICE_CLOCK: 'utility',
  QR: 'utility',
  PINBOARD: 'utility',
  VOICE_MEMO: 'utility',
};

/**
 * ランチャーでの表示順序
 * 小さい値ほど先に表示される
 */
const DISPLAY_ORDER: Record<string, number> = {
  // Insight Business Suite（メイン製品、先頭に表示）
  INSS: 100,
  IOSH: 110,
  IOSD: 120,
  // Senior Office
  ISOF: 130,
  // AI ツール
  INPY: 200,
  INMV: 210,
  INIG: 220,
  // 業務変革ツール
  INCA: 300,
  INBT: 310,
  IVIN: 320,
  // ユーティリティ
  CAMERA: 400,
  VOICE_CLOCK: 410,
  PINBOARD: 420,
  VOICE_MEMO: 430,
  QR: 440,
  LAUNCHER: 900,  // ランチャー自身は最後尾
};

/**
 * ランチャーアイコンのマニフェスト（全製品 + ユーティリティ）
 *
 * Android ランチャーアプリはこのレジストリを使ってアイコンを解決する。
 */
export const LAUNCHER_ICON_MANIFEST: LauncherIconEntry[] = [
  // 製品アイコン
  ...Object.values(PRODUCTS).map(p => ({
    code: p.code,
    name: p.name,
    nameJa: p.nameJa,
    masterIcon: p.masterIcon,
    launcherIconDir: `${LAUNCHER_ICONS_BASE_DIR}/${p.code}`,
    isProduct: true,
    displayOrder: DISPLAY_ORDER[p.code] ?? 999,
    category: PRODUCT_CATEGORIES[p.code] ?? ('enterprise' as LauncherIconCategory),
  })),
  // ユーティリティアイコン（LAUNCHER 自身を除く）
  ...Object.entries(UTILITY_ICONS)
    .filter(([key]) => key !== 'LAUNCHER')
    .map(([key, v]) => ({
      code: key,
      name: v.name,
      nameJa: v.nameJa,
      masterIcon: v.masterIcon,
      launcherIconDir: `${LAUNCHER_ICONS_BASE_DIR}/${key}`,
      isProduct: false,
      displayOrder: DISPLAY_ORDER[key] ?? 999,
      category: PRODUCT_CATEGORIES[key] ?? ('utility' as LauncherIconCategory),
    })),
];

// =============================================================================
// API
// =============================================================================

/**
 * 特定製品のランチャー用アイコンパスを取得
 *
 * @param code - 製品コードまたはユーティリティコード
 * @param density - Android 画面密度（デフォルト: xxhdpi）
 * @returns アイコンファイルパス（リポジトリルートからの相対パス）
 *
 * @example
 * getLauncherIcon('IOSH', 'xxhdpi');
 * // → 'brand/icons/generated/launcher/IOSH/mipmap-xxhdpi/ic_launcher.png'
 */
export function getLauncherIcon(
  code: ProductCode | string,
  density: AndroidDensity = 'xxhdpi',
): string {
  return `${LAUNCHER_ICONS_BASE_DIR}/${code}/mipmap-${density}/ic_launcher.png`;
}

/**
 * 全製品のランチャーアイコンを指定密度で一括取得（グリッド表示用）
 *
 * @param density - Android 画面密度
 * @param options - フィルタオプション
 * @returns 表示順序でソートされたアイコン一覧
 *
 * @example
 * // 全製品のアイコンを取得
 * getLauncherIconsForDensity('xxhdpi');
 *
 * // カテゴリでフィルタ
 * getLauncherIconsForDensity('xxhdpi', { category: 'office' });
 *
 * // 製品のみ（ユーティリティ除外）
 * getLauncherIconsForDensity('xxhdpi', { productsOnly: true });
 */
export function getLauncherIconsForDensity(
  density: AndroidDensity = 'xxhdpi',
  options?: {
    category?: LauncherIconCategory;
    productsOnly?: boolean;
  },
): ResolvedLauncherIcon[] {
  const size = ANDROID_DENSITY_SIZES[density];
  let entries = LAUNCHER_ICON_MANIFEST;

  if (options?.category) {
    entries = entries.filter(e => e.category === options.category);
  }
  if (options?.productsOnly) {
    entries = entries.filter(e => e.isProduct);
  }

  return entries
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(entry => ({
      code: entry.code,
      name: entry.name,
      nameJa: entry.nameJa,
      path: `${entry.launcherIconDir}/mipmap-${density}/ic_launcher.png`,
      size,
      category: entry.category,
      displayOrder: entry.displayOrder,
    }));
}

/**
 * カテゴリ別にグルーピングされたランチャーアイコンを取得
 *
 * @param density - Android 画面密度
 * @returns カテゴリ → アイコン一覧のマップ
 *
 * @example
 * const grouped = getLauncherIconsByCategory('xxhdpi');
 * grouped.office;     // [INSS, IOSH, IOSD]
 * grouped.ai_tools;   // [INMV, INIG, INPY]
 */
export function getLauncherIconsByCategory(
  density: AndroidDensity = 'xxhdpi',
): Record<LauncherIconCategory, ResolvedLauncherIcon[]> {
  const all = getLauncherIconsForDensity(density);
  const result: Record<LauncherIconCategory, ResolvedLauncherIcon[]> = {
    office: [],
    ai_tools: [],
    enterprise: [],
    senior: [],
    utility: [],
  };

  for (const icon of all) {
    result[icon.category].push(icon);
  }

  return result;
}

/**
 * カテゴリの表示名を取得
 */
export function getCategoryLabel(
  category: LauncherIconCategory,
  locale: 'ja' | 'en' = 'ja',
): string {
  const labels: Record<LauncherIconCategory, { ja: string; en: string }> = {
    office: { ja: 'Insight Business', en: 'Insight Business' },
    ai_tools: { ja: 'AI ツール', en: 'AI Tools' },
    enterprise: { ja: '業務変革ツール', en: 'Enterprise Tools' },
    senior: { ja: 'シニアオフィス', en: 'Senior Office' },
    utility: { ja: 'ユーティリティ', en: 'Utilities' },
  };
  return labels[category][locale];
}

/**
 * マスターアイコンからランチャーアイコンのディレクトリパスへのマッピングを生成
 *
 * generate-app-icon.py が参照する情報と同等のデータを提供。
 * ランチャーアプリのビルドスクリプトで、アイコンコピー先を決定する際に使用。
 *
 * @example
 * const mapping = getLauncherIconMapping();
 * // {
 * //   IOSH: {
 * //     masterIcon: 'brand/icons/png/icon-insight-sheet.png',
 * //     launcherDir: 'brand/icons/generated/launcher/IOSH',
 * //     densities: { mdpi: 48, hdpi: 72, ... }
 * //   }, ...
 * // }
 */
export function getLauncherIconMapping(): Record<string, {
  masterIcon: string;
  launcherDir: string;
  densities: Record<AndroidDensity, number>;
}> {
  const result: Record<string, {
    masterIcon: string;
    launcherDir: string;
    densities: Record<AndroidDensity, number>;
  }> = {};

  for (const entry of LAUNCHER_ICON_MANIFEST) {
    result[entry.code] = {
      masterIcon: entry.masterIcon,
      launcherDir: entry.launcherIconDir,
      densities: { ...ANDROID_DENSITY_SIZES },
    };
  }

  return result;
}
