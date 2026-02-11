/**
 * HARMONIC insight アプリアイコン一元管理
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * 全製品のアイコンを「マスターソース → プラットフォーム別出力」の
 * パイプラインとして一元管理する。
 *
 * ## マスターソース (brand/icons/)
 *
 * ```
 * brand/icons/
 * ├── icon-insight-sheet.svg      # ベクターマスター（推奨）
 * ├── InsightSheet.png            # 高解像度ラスターマスター
 * └── ...
 * ```
 *
 * ## プラットフォーム別出力先
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  WPF (C#)                                                      │
 * │  Assets/app.ico              — 16/24/32/48/64/128/256px       │
 * │  Assets/icon_256.png         — タイトルバー・スプラッシュ用     │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  Web (Next.js / React)                                         │
 * │  public/favicon.ico          — 32px ICO                       │
 * │  public/icon-192.png         — PWA マニフェスト               │
 * │  public/icon-512.png         — PWA マニフェスト               │
 * │  public/apple-touch-icon.png — iOS Safari                     │
 * │  public/og-image.png         — OGP                            │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  Android (Native Kotlin)                                       │
 * │  app/src/main/res/mipmap-*/ic_launcher.png  — 48〜192dp       │
 * │  app/src/main/res/drawable/ic_launcher_foreground.xml          │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  iOS                                                           │
 * │  Assets.xcassets/AppIcon.appiconset/ — 1024x1024 PNG          │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  Expo / React Native                                           │
 * │  assets/icon.png             — 1024x1024 PNG                  │
 * │  assets/adaptive-icon.png    — 1024x1024 PNG                  │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  Electron                                                      │
 * │  build/icon.ico              — Windows                        │
 * │  build/icon.icns             — macOS                          │
 * │  build/icon.png              — Linux (256x256 or 512x512)     │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## 使い方
 *
 * ```typescript
 * import {
 *   getIconConfig,
 *   getIconTargets,
 *   getAllIconConfigs,
 *   getIconStatus,
 * } from '@/insight-common/config/app-icons';
 *
 * // 製品のアイコン構成を取得
 * const config = getIconConfig('IOSH');
 * config.masterSvg;  // 'brand/icons/icon-insight-sheet.svg'
 * config.masterPng;  // 'brand/icons/InsightSheet.png'
 * config.motifJa;    // 'スプレッドシートグリッド + ヘッダー行'
 *
 * // プラットフォーム別の出力先を取得
 * const targets = getIconTargets('IOSH', 'wpf');
 * // [
 * //   { path: 'Assets/app.ico', format: 'ico', sizes: [16,24,32,48,64,128,256] },
 * //   { path: 'Assets/icon_256.png', format: 'png', sizes: [256] },
 * // ]
 *
 * // 全製品のアイコン状態を取得（App Manager 用）
 * const allConfigs = getAllIconConfigs();
 * ```
 */

import type { ProductCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** アプリケーションプラットフォーム */
export type IconPlatform =
  | 'wpf'          // WPF (C#) デスクトップアプリ
  | 'web'          // Web (Next.js / React / Hono)
  | 'android'      // Android (Native Kotlin)
  | 'ios'          // iOS (Swift)
  | 'expo'         // Expo / React Native
  | 'electron';    // Electron デスクトップアプリ

/** アイコンフォーマット */
export type IconFormat = 'ico' | 'png' | 'svg' | 'icns' | 'vector_drawable';

/** プラットフォーム別アイコン出力ターゲット */
export interface IconTarget {
  /** 出力先パス（アプリの BasePath からの相対パス） */
  path: string;
  /** アイコンフォーマット */
  format: IconFormat;
  /** サイズ（px）。マルチサイズの場合は複数。 */
  sizes: number[];
  /** 説明 */
  description: string;
  /** 日本語説明 */
  descriptionJa: string;
}

/** プラットフォーム別出力定義 */
export interface IconPlatformConfig {
  /** プラットフォーム */
  platform: IconPlatform;
  /** 出力ターゲット一覧 */
  targets: IconTarget[];
}

/** 製品のアイコン構成 */
export interface AppIconConfig {
  /** 製品コード */
  productCode: ProductCode | string;
  /** 製品名 */
  productName: string;
  /** マスター SVG ソース（insight-common ルートからの相対パス） */
  masterSvg: string;
  /** マスター PNG ソース（高解像度ラスター、insight-common ルートからの相対パス） */
  masterPng?: string;
  /** アイコンモチーフ説明（英語） */
  motif: string;
  /** アイコンモチーフ説明（日本語） */
  motifJa: string;
  /** このアプリが使用するプラットフォーム一覧 */
  platforms: IconPlatformConfig[];
}

// =============================================================================
// プラットフォーム別テンプレート
// =============================================================================

/** WPF (C#) デスクトップアプリ向けターゲット */
const WPF_TARGETS: IconTarget[] = [
  {
    path: 'Assets/app.ico',
    format: 'ico',
    sizes: [16, 24, 32, 48, 64, 128, 256],
    description: 'Windows application icon (multi-size ICO)',
    descriptionJa: 'Windows アプリケーションアイコン（マルチサイズ ICO）',
  },
  {
    path: 'Assets/icon_256.png',
    format: 'png',
    sizes: [256],
    description: 'Title bar / splash screen icon',
    descriptionJa: 'タイトルバー・スプラッシュ画面用アイコン',
  },
];

/** WPF + 独自拡張子ファイルアイコン */
function wpfWithFileIcon(fileIconName: string): IconTarget[] {
  return [
    ...WPF_TARGETS,
    {
      path: `Assets/${fileIconName}`,
      format: 'ico',
      sizes: [16, 24, 32, 48, 64, 128, 256],
      description: 'File type association icon',
      descriptionJa: 'ファイル関連付け用アイコン',
    },
  ];
}

/** Web (Next.js / React) 向けターゲット */
const WEB_TARGETS: IconTarget[] = [
  {
    path: 'public/favicon.ico',
    format: 'ico',
    sizes: [32],
    description: 'Browser favicon',
    descriptionJa: 'ブラウザファビコン',
  },
  {
    path: 'public/icon-192.png',
    format: 'png',
    sizes: [192],
    description: 'PWA manifest icon (192x192)',
    descriptionJa: 'PWA マニフェスト用アイコン (192x192)',
  },
  {
    path: 'public/icon-512.png',
    format: 'png',
    sizes: [512],
    description: 'PWA manifest icon (512x512)',
    descriptionJa: 'PWA マニフェスト用アイコン (512x512)',
  },
  {
    path: 'public/apple-touch-icon.png',
    format: 'png',
    sizes: [180],
    description: 'iOS Safari touch icon',
    descriptionJa: 'iOS Safari タッチアイコン',
  },
];

/** Electron 向けターゲット */
const ELECTRON_TARGETS: IconTarget[] = [
  {
    path: 'build/icon.ico',
    format: 'ico',
    sizes: [16, 24, 32, 48, 64, 128, 256],
    description: 'Electron Windows icon',
    descriptionJa: 'Electron Windows アイコン',
  },
  {
    path: 'build/icon.png',
    format: 'png',
    sizes: [512],
    description: 'Electron Linux icon',
    descriptionJa: 'Electron Linux アイコン',
  },
  {
    path: 'build/icon.icns',
    format: 'icns',
    sizes: [16, 32, 64, 128, 256, 512, 1024],
    description: 'Electron macOS icon',
    descriptionJa: 'Electron macOS アイコン',
  },
];

/** Android 向けターゲット */
const ANDROID_TARGETS: IconTarget[] = [
  {
    path: 'app/src/main/res/mipmap-mdpi/ic_launcher.png',
    format: 'png',
    sizes: [48],
    description: 'Android mipmap-mdpi',
    descriptionJa: 'Android mipmap-mdpi',
  },
  {
    path: 'app/src/main/res/mipmap-hdpi/ic_launcher.png',
    format: 'png',
    sizes: [72],
    description: 'Android mipmap-hdpi',
    descriptionJa: 'Android mipmap-hdpi',
  },
  {
    path: 'app/src/main/res/mipmap-xhdpi/ic_launcher.png',
    format: 'png',
    sizes: [96],
    description: 'Android mipmap-xhdpi',
    descriptionJa: 'Android mipmap-xhdpi',
  },
  {
    path: 'app/src/main/res/mipmap-xxhdpi/ic_launcher.png',
    format: 'png',
    sizes: [144],
    description: 'Android mipmap-xxhdpi',
    descriptionJa: 'Android mipmap-xxhdpi',
  },
  {
    path: 'app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
    format: 'png',
    sizes: [192],
    description: 'Android mipmap-xxxhdpi',
    descriptionJa: 'Android mipmap-xxxhdpi',
  },
];

/** iOS 向けターゲット */
const IOS_TARGETS: IconTarget[] = [
  {
    path: 'Assets.xcassets/AppIcon.appiconset/icon-1024.png',
    format: 'png',
    sizes: [1024],
    description: 'iOS App Store icon (1024x1024)',
    descriptionJa: 'iOS App Store アイコン (1024x1024)',
  },
];

/** Expo / React Native 向けターゲット */
const EXPO_TARGETS: IconTarget[] = [
  {
    path: 'assets/icon.png',
    format: 'png',
    sizes: [1024],
    description: 'Expo app icon (1024x1024)',
    descriptionJa: 'Expo アプリアイコン (1024x1024)',
  },
  {
    path: 'assets/adaptive-icon.png',
    format: 'png',
    sizes: [1024],
    description: 'Expo adaptive icon for Android (1024x1024)',
    descriptionJa: 'Expo Android Adaptive アイコン (1024x1024)',
  },
  {
    path: 'assets/favicon.png',
    format: 'png',
    sizes: [48],
    description: 'Expo web favicon',
    descriptionJa: 'Expo Web ファビコン',
  },
];

// =============================================================================
// 製品別アイコン定義
// =============================================================================

export const APP_ICON_CONFIGS: AppIconConfig[] = [
  // ══════════════════════════════════════════════════════
  // Tier 1: 業務変革ツール
  // ══════════════════════════════════════════════════════
  {
    productCode: 'INCA',
    productName: 'InsightNoCodeAnalyzer',
    masterSvg: 'brand/icons/icon-insight-nca.svg',
    masterPng: 'brand/icons/NoCodeAnalyzer.png',
    motif: 'Flowchart + magnifying glass',
    motifJa: 'フローチャート + 虫眼鏡',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },
  {
    productCode: 'INBT',
    productName: 'InsightBot',
    masterSvg: 'brand/icons/icon-insight-bot.svg',
    masterPng: 'brand/icons/InsightBot.png',
    motif: 'Cute robot (big eyes + antenna)',
    motifJa: 'かわいいロボット（大きな目 + アンテナ）',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },
  {
    productCode: 'IVIN',
    productName: 'InterviewInsight',
    masterSvg: 'brand/icons/icon-interview-insight.svg',
    masterPng: 'brand/icons/InsightAutoInterview.png',
    motif: 'Microphone + sound waves',
    motifJa: 'マイク + 音波',
    platforms: [
      { platform: 'web', targets: WEB_TARGETS },
    ],
  },

  // ══════════════════════════════════════════════════════
  // Tier 2: AI活用ツール
  // ══════════════════════════════════════════════════════
  {
    productCode: 'INMV',
    productName: 'InsightMovie',
    masterSvg: 'brand/icons/icon-insight-movie.svg',
    masterPng: 'brand/icons/InsightMovieGen.png',
    motif: 'Film strip + play button',
    motifJa: 'フィルムストリップ + 再生ボタン',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },
  {
    productCode: 'INIG',
    productName: 'InsightImageGen',
    masterSvg: 'brand/icons/icon-insight-imagegen.svg',
    masterPng: 'brand/icons/InsightImageGen.png',
    motif: 'Image frame + paint brush',
    motifJa: '画像フレーム + ペイントブラシ',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },

  // ══════════════════════════════════════════════════════
  // Tier 3: InsightOffice Suite
  // ══════════════════════════════════════════════════════
  {
    productCode: 'INSS',
    productName: 'InsightOfficeSlide',
    masterSvg: 'brand/icons/icon-insight-slide.svg',
    masterPng: 'brand/icons/InsightSlide.png',
    motif: 'Slide layers + up arrow (text extraction)',
    motifJa: 'スライドレイヤー + 上矢印（テキスト抽出）',
    platforms: [
      { platform: 'wpf', targets: wpfWithFileIcon('inss-file.ico') },
    ],
  },
  {
    productCode: 'IOSH',
    productName: 'InsightOfficeSheet',
    masterSvg: 'brand/icons/icon-insight-sheet.svg',
    masterPng: 'brand/icons/InsightSheet.png',
    motif: 'Spreadsheet grid + header row',
    motifJa: 'スプレッドシートグリッド + ヘッダー行',
    platforms: [
      { platform: 'wpf', targets: wpfWithFileIcon('iosh-file.ico') },
    ],
  },
  {
    productCode: 'IOSD',
    productName: 'InsightOfficeDoc',
    masterSvg: 'brand/icons/icon-insight-doc.svg',
    masterPng: 'brand/icons/InsightDoc.png',
    motif: 'Document + fold corner + text lines',
    motifJa: 'ドキュメント + 折り角 + テキスト行',
    platforms: [
      { platform: 'wpf', targets: wpfWithFileIcon('iosd-file.ico') },
    ],
  },
  {
    productCode: 'INPY',
    productName: 'InsightPy',
    masterSvg: 'brand/icons/icon-insight-py.svg',
    masterPng: 'brand/icons/InsightPy.png',
    motif: 'Python snake (S-curve)',
    motifJa: 'Python ヘビ（S字カーブ）',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },

  // ══════════════════════════════════════════════════════
  // Tier 4: シニア向け
  // ══════════════════════════════════════════════════════
  {
    productCode: 'ISOF',
    productName: 'InsightSeniorOffice',
    masterSvg: '',
    masterPng: 'brand/icons/InsightSeniorOffice.png',
    motif: 'Senior-friendly office suite',
    motifJa: 'シニア向け統合オフィスツール',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },

  // ══════════════════════════════════════════════════════
  // Web アプリ（追加分）
  // ══════════════════════════════════════════════════════
  {
    productCode: 'INBA',
    productName: 'InsightBrowser AI',
    masterSvg: '',
    masterPng: '',
    motif: 'Browser + AI sparkle',
    motifJa: 'ブラウザ + AI スパークル',
    platforms: [
      { platform: 'electron', targets: ELECTRON_TARGETS },
      { platform: 'web', targets: WEB_TARGETS },
    ],
  },

  // ══════════════════════════════════════════════════════
  // ユーティリティアイコン（Launcher 等）
  // ══════════════════════════════════════════════════════
  {
    productCode: 'LAUNCHER',
    productName: 'Insight Launcher',
    masterSvg: 'brand/icons/icon-launcher.svg',
    masterPng: 'brand/icons/InsightLauncher.png',
    motif: '2x2 app grid',
    motifJa: '2x2 アプリグリッド',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },
];

// =============================================================================
// インデックスマップ
// =============================================================================

const _configByCode = new Map<string, AppIconConfig>();
for (const config of APP_ICON_CONFIGS) {
  _configByCode.set(config.productCode, config);
}

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 製品コードからアイコン構成を取得
 *
 * @example
 * ```typescript
 * const config = getIconConfig('IOSH');
 * config.masterSvg;  // 'brand/icons/icon-insight-sheet.svg'
 * ```
 */
export function getIconConfig(productCode: string): AppIconConfig | undefined {
  return _configByCode.get(productCode);
}

/**
 * 製品 × プラットフォームのアイコン出力ターゲットを取得
 *
 * @example
 * ```typescript
 * const targets = getIconTargets('IOSH', 'wpf');
 * // [{ path: 'Assets/app.ico', format: 'ico', sizes: [...] }, ...]
 * ```
 */
export function getIconTargets(productCode: string, platform: IconPlatform): IconTarget[] {
  const config = _configByCode.get(productCode);
  if (!config) return [];
  const platformConfig = config.platforms.find(p => p.platform === platform);
  return platformConfig?.targets ?? [];
}

/**
 * 全製品のアイコン構成を取得
 */
export function getAllIconConfigs(): AppIconConfig[] {
  return APP_ICON_CONFIGS;
}

/**
 * 製品が使用するプラットフォーム一覧を取得
 */
export function getIconPlatforms(productCode: string): IconPlatform[] {
  const config = _configByCode.get(productCode);
  if (!config) return [];
  return config.platforms.map(p => p.platform);
}

/**
 * マスターアイコンファイル名から製品コードを逆引き
 *
 * @example
 * ```typescript
 * resolveProductByIconFile('icon-insight-sheet.svg');  // 'IOSH'
 * resolveProductByIconFile('InsightSheet.png');         // 'IOSH'
 * ```
 */
export function resolveProductByIconFile(filename: string): string | undefined {
  for (const config of APP_ICON_CONFIGS) {
    if (config.masterSvg.endsWith(filename) || config.masterPng?.endsWith(filename)) {
      return config.productCode;
    }
  }
  return undefined;
}

/**
 * 全プラットフォームのターゲットテンプレートを取得
 * （新製品追加時にプラットフォームを選択するための参照用）
 */
export function getPlatformTemplate(platform: IconPlatform): IconTarget[] {
  switch (platform) {
    case 'wpf':       return WPF_TARGETS;
    case 'web':       return WEB_TARGETS;
    case 'android':   return ANDROID_TARGETS;
    case 'ios':       return IOS_TARGETS;
    case 'expo':      return EXPO_TARGETS;
    case 'electron':  return ELECTRON_TARGETS;
    default:          return [];
  }
}

/**
 * プラットフォーム名の日本語ラベルを取得
 */
export function getPlatformLabel(platform: IconPlatform, locale: 'en' | 'ja' = 'ja'): string {
  const labels: Record<IconPlatform, { en: string; ja: string }> = {
    wpf:      { en: 'WPF (C#)', ja: 'WPF (C#)' },
    web:      { en: 'Web (Next.js/React)', ja: 'Web (Next.js/React)' },
    android:  { en: 'Android', ja: 'Android' },
    ios:      { en: 'iOS', ja: 'iOS' },
    expo:     { en: 'Expo / React Native', ja: 'Expo / React Native' },
    electron: { en: 'Electron', ja: 'Electron' },
  };
  return labels[platform]?.[locale] ?? platform;
}

// =============================================================================
// デフォルトエクスポート
// =============================================================================

export default {
  APP_ICON_CONFIGS,
  getIconConfig,
  getIconTargets,
  getAllIconConfigs,
  getIconPlatforms,
  resolveProductByIconFile,
  getPlatformTemplate,
  getPlatformLabel,
};
