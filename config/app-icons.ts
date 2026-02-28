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
 * ## マスターソース (brand/icons/png/)
 *
 * ```
 * brand/icons/png/
 * ├── icon-insight-sheet.png      # マスター PNG（1024x1024）— 唯一の正
 * └── ...
 * ```
 *
 * ## プラットフォーム別出力先
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ WPF (C#)                                                      │
 * │ Assets/app.ico               — 16/24/32/48/64/128/256px       │
 * │ Assets/icon_256.png          — タイトルバー・スプラッシュ用     │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ Web (Next.js / React)                                         │
 * │ public/favicon.ico           — 32px ICO                       │
 * │ public/icon-192.png          — PWA マニフェスト              │
 * │ public/icon-512.png          — PWA マニフェスト              │
 * │ public/apple-touch-icon.png  — iOS Safari                     │
 * │ public/og-image.png          — OGP                            │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ Android (Native Kotlin)                                       │
 * │ app/src/main/res/mipmap-*/ic_launcher.png   — 48〜192dp       │
 * │ app/src/main/res/drawable/ic_launcher_foreground.xml          │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ iOS                                                           │
 * │ Assets.xcassets/AppIcon.appiconset/  — 1024x1024 PNG          │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ Expo / React Native                                           │
 * │ assets/icon.png              — 1024x1024 PNG                  │
 * │ assets/adaptive-icon.png     — 1024x1024 PNG                  │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ Electron                                                      │
 * │ build/icon.ico               — Windows                        │
 * │ build/icon.icns              — macOS                          │
 * │ build/icon.png               — Linux (256x256 or 512x512)     │
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
 * config.masterPng;  // 'brand/icons/png/icon-insight-sheet.png'
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
  | 'wpf'              // WPF (C#) デスクトップアプリ
  | 'web'              // Web (Next.js / React / Hono)
  | 'android'          // Android (Native Kotlin) — mipmap PNG
  | 'android_native'   // Android (Native Kotlin) — vector drawable XML
  | 'ios'              // iOS (Swift)
  | 'expo'             // Expo / React Native
  | 'electron';        // Electron デスクトップアプリ

/** アイコンフォーマット */
export type IconFormat = 'ico' | 'png' | 'icns';

/** プラットフォーム別アイコン出力ターゲット */
export interface IconTarget {
  /** 出力先パス（アプリの BasePath からの相対パス） */
  path: string;
  /** アイコンフォーマット */
  format: IconFormat;
  /** サイズ（px）。マルチサイズの場合は複数 */
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
  /** マスター PNG ソース（1024x1024）— 唯一の正 */
  masterPng: string;
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

/** Android Native (mipmap PNGs only — master PNG is the single source of truth) */
const ANDROID_NATIVE_TARGETS: IconTarget[] = [
  {
    path: 'app/src/main/res/mipmap-mdpi/ic_launcher.png',
    format: 'png',
    sizes: [48],
    description: 'Android mipmap-mdpi launcher icon',
    descriptionJa: 'Android mipmap-mdpi ランチャーアイコン',
  },
  {
    path: 'app/src/main/res/mipmap-mdpi/ic_launcher_round.png',
    format: 'png',
    sizes: [48],
    description: 'Android mipmap-mdpi round launcher icon',
    descriptionJa: 'Android mipmap-mdpi ラウンドランチャーアイコン',
  },
  {
    path: 'app/src/main/res/mipmap-hdpi/ic_launcher.png',
    format: 'png',
    sizes: [72],
    description: 'Android mipmap-hdpi launcher icon',
    descriptionJa: 'Android mipmap-hdpi ランチャーアイコン',
  },
  {
    path: 'app/src/main/res/mipmap-hdpi/ic_launcher_round.png',
    format: 'png',
    sizes: [72],
    description: 'Android mipmap-hdpi round launcher icon',
    descriptionJa: 'Android mipmap-hdpi ラウンドランチャーアイコン',
  },
  {
    path: 'app/src/main/res/mipmap-xhdpi/ic_launcher.png',
    format: 'png',
    sizes: [96],
    description: 'Android mipmap-xhdpi launcher icon',
    descriptionJa: 'Android mipmap-xhdpi ランチャーアイコン',
  },
  {
    path: 'app/src/main/res/mipmap-xhdpi/ic_launcher_round.png',
    format: 'png',
    sizes: [96],
    description: 'Android mipmap-xhdpi round launcher icon',
    descriptionJa: 'Android mipmap-xhdpi ラウンドランチャーアイコン',
  },
  {
    path: 'app/src/main/res/mipmap-xxhdpi/ic_launcher.png',
    format: 'png',
    sizes: [144],
    description: 'Android mipmap-xxhdpi launcher icon',
    descriptionJa: 'Android mipmap-xxhdpi ランチャーアイコン',
  },
  {
    path: 'app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png',
    format: 'png',
    sizes: [144],
    description: 'Android mipmap-xxhdpi round launcher icon',
    descriptionJa: 'Android mipmap-xxhdpi ラウンドランチャーアイコン',
  },
  {
    path: 'app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
    format: 'png',
    sizes: [192],
    description: 'Android mipmap-xxxhdpi launcher icon',
    descriptionJa: 'Android mipmap-xxxhdpi ランチャーアイコン',
  },
  {
    path: 'app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png',
    format: 'png',
    sizes: [192],
    description: 'Android mipmap-xxxhdpi round launcher icon',
    descriptionJa: 'Android mipmap-xxxhdpi ラウンドランチャーアイコン',
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
    masterPng: 'brand/icons/png/icon-insight-nca.png',
    motif: 'Flowchart + gear',
    motifJa: 'フローチャート + ギア',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },
  {
    productCode: 'INBT',
    productName: 'InsightBot',
    masterPng: 'brand/icons/png/icon-insight-bot.png',
    motif: 'Cute robot + chat bubble',
    motifJa: 'かわいいロボット + チャット吹き出し',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },
  {
    productCode: 'IVIN',
    productName: 'InterviewInsight',
    masterPng: 'brand/icons/png/icon-interview-insight.png',
    motif: 'Robot + microphone + clipboard',
    motifJa: 'ロボット + マイク + クリップボード',
    platforms: [
      { platform: 'web', targets: WEB_TARGETS },
    ],
  },

  // ══════════════════════════════════════════════════════
  // Tier 2: AI活用ツール
  // ══════════════════════════════════════════════════════
  {
    productCode: 'INMV',
    productName: 'InsightCast',
    masterPng: 'brand/icons/png/icon-insight-cast.png',
    motif: 'Projector + film strip + gear',
    motifJa: '映写機 + フィルムストリップ + ギア',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },
  {
    productCode: 'INIG',
    productName: 'InsightImageGen',
    masterPng: 'brand/icons/png/icon-insight-imagegen.png',
    motif: 'Monitor + aperture + image + gear',
    motifJa: 'モニター + アパーチャ + 画像 + ギア',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },

  // ══════════════════════════════════════════════════════
  // Tier 3: Insight Business Suite
  // ══════════════════════════════════════════════════════
  {
    productCode: 'INSS',
    productName: 'Insight Deck Quality Gate',
    masterPng: 'brand/icons/png/icon-insight-slide.png',
    motif: 'Presentation board + gear + arrows',
    motifJa: 'プレゼンボード + ギア + 矢印',
    platforms: [
      { platform: 'wpf', targets: wpfWithFileIcon('inss-file.ico') },
    ],
  },
  {
    productCode: 'IOSH',
    productName: 'Insight Performance Management',
    masterPng: 'brand/icons/png/icon-insight-sheet.png',
    motif: 'Spreadsheet grid + gear',
    motifJa: 'スプレッドシートグリッド + ギア',
    platforms: [
      { platform: 'wpf', targets: wpfWithFileIcon('iosh-file.ico') },
    ],
  },
  {
    productCode: 'IOSD',
    productName: 'Insight AI Briefcase',
    masterPng: 'brand/icons/png/icon-insight-doc.png',
    motif: 'Document + gear + DB',
    motifJa: 'ドキュメント + ギア + DB',
    platforms: [
      { platform: 'wpf', targets: wpfWithFileIcon('iosd-file.ico') },
    ],
  },
  {
    productCode: 'INPY',
    productName: 'InsightPy',
    masterPng: 'brand/icons/png/icon-insight-py.png',
    motif: 'Python snake + circuit board',
    motifJa: 'Python ヘビ + 回路基板',
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
    masterPng: 'brand/icons/png/icon-senior-office.png',
    motif: 'Calendar + document + mail + gear',
    motifJa: 'カレンダー + 文書 + メール + ギア',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },

  // ══════════════════════════════════════════════════════
  // ユーティリティ（InsightQR: Expo iOS + Android Native Kotlin）
  // ══════════════════════════════════════════════════════
  {
    productCode: 'QR',
    productName: 'InsightQR',
    masterPng: 'brand/icons/png/icon-qr.png',
    motif: 'QR code pattern',
    motifJa: 'QR コードパターン',
    platforms: [
      { platform: 'expo', targets: EXPO_TARGETS },                        // iOS (Expo)
      { platform: 'android_native', targets: ANDROID_NATIVE_TARGETS },    // Android (Kotlin)
    ],
  },

  // ══════════════════════════════════════════════════════
  // Web アプリ（追加分）
  // ══════════════════════════════════════════════════════
  {
    productCode: 'INBA',
    productName: 'InsightBrowser AI',
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
    masterPng: 'brand/icons/png/icon-launcher.png',
    motif: '2x2 grid + rocket + circuit board',
    motifJa: '2x2 グリッド + ロケット + 回路基板',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },

  // ══════════════════════════════════════════════════════
  // ユーティリティ（Android Native）
  // ══════════════════════════════════════════════════════
  {
    productCode: 'CAMERA',
    productName: 'InsightCamera',
    masterPng: 'brand/icons/png/icon-camera.png',
    motif: 'Camera lens with gold accent + sparkle',
    motifJa: 'カメラレンズ + ゴールドアクセント + スパークル',
    platforms: [
      { platform: 'android_native', targets: ANDROID_NATIVE_TARGETS },
    ],
  },
  {
    productCode: 'VOICE_CLOCK',
    productName: 'InsightVoiceClock',
    masterPng: 'brand/icons/png/icon-voice-clock.png',
    motif: 'Clock face with voice wave + sparkle',
    motifJa: '時計 + 音声波形 + スパークル',
    platforms: [
      { platform: 'android_native', targets: ANDROID_NATIVE_TARGETS },
    ],
  },
  {
    productCode: 'INCLINE',
    productName: 'InclineInsight',
    masterPng: 'brand/icons/png/icon-incline.png',
    motif: 'Inclinometer + measurement',
    motifJa: '傾斜計 + 計測',
    platforms: [
      { platform: 'android_native', targets: ANDROID_NATIVE_TARGETS },
    ],
  },
  {
    productCode: 'CONSUL_TYPE',
    productName: 'InsightConsulType',
    masterPng: 'brand/icons/png/icon-consul-type.png',
    motif: 'Typing evaluation + assessment',
    motifJa: 'タイピング評価 + アセスメント',
    platforms: [
      { platform: 'android_native', targets: ANDROID_NATIVE_TARGETS },
    ],
  },
  {
    productCode: 'HOROSCOPE',
    productName: 'HarmonicHoroscope',
    masterPng: 'brand/icons/png/icon-horoscope.png',
    motif: 'Zodiac + stars + fortune',
    motifJa: '星座 + 星 + 占い',
    platforms: [
      { platform: 'android_native', targets: ANDROID_NATIVE_TARGETS },
    ],
  },
  {
    productCode: 'FOOD_MEDICINE',
    productName: 'FoodMedicineInsight',
    masterPng: 'brand/icons/png/icon-food-medicine.png',
    motif: 'Food + medicine + health',
    motifJa: '食品 + 医薬 + 健康',
    platforms: [
      { platform: 'android_native', targets: ANDROID_NATIVE_TARGETS },
    ],
  },
  {
    productCode: 'CONSUL_EVALUATE',
    productName: 'InsightConsulEvaluate',
    masterPng: 'brand/icons/png/icon-consul-evaluate.png',
    motif: 'Evaluation chart + assessment',
    motifJa: '評価チャート + アセスメント',
    platforms: [
      { platform: 'android_native', targets: ANDROID_NATIVE_TARGETS },
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
 * 製品のプラットフォームのアイコン出力ターゲットを取得
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
 * resolveProductByIconFile('icon-insight-sheet.png');  // 'IOSH'
 * ```
 */
export function resolveProductByIconFile(filename: string): string | undefined {
  for (const config of APP_ICON_CONFIGS) {
    if (config.masterPng.endsWith(filename)) {
      return config.productCode;
    }
  }
  return undefined;
}

/**
 * 全プラットフォームのターゲットテンプレートを取得
 * （新製品追加時にプラットフォームを選択するための参考用）
 */
export function getPlatformTemplate(platform: IconPlatform): IconTarget[] {
  switch (platform) {
    case 'wpf':       return WPF_TARGETS;
    case 'web':       return WEB_TARGETS;
    case 'android':          return ANDROID_TARGETS;
    case 'android_native':   return ANDROID_NATIVE_TARGETS;
    case 'ios':              return IOS_TARGETS;
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
    wpf:            { en: 'WPF (C#)', ja: 'WPF (C#)' },
    web:            { en: 'Web (Next.js/React)', ja: 'Web (Next.js/React)' },
    android:        { en: 'Android', ja: 'Android' },
    android_native: { en: 'Android (Kotlin)', ja: 'Android (Kotlin)' },
    ios:            { en: 'iOS', ja: 'iOS' },
    expo:           { en: 'Expo / React Native', ja: 'Expo / React Native' },
    electron:       { en: 'Electron', ja: 'Electron' },
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
