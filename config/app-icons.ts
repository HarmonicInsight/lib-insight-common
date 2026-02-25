/**
 * HARMONIC insight アプリアイコン一允E��琁E
 *
 * ============================================================================
 * 【設計方針、E
 * ============================================================================
 *
 * 全製品�Eアイコンを「�Eスターソース ↁEプラチE��フォーム別出力」�E
 * パイプラインとして一允E��琁E��る、E
 *
 * ## マスターソース (brand/icons/png/)
 *
 * ```
 * brand/icons/png/
 * ├── icon-insight-sheet.png      # マスター PNG�E�E024x1024�E� E唯一の正
 * └── ...
 * ```
 *
 * ## プラチE��フォーム別出力�E
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────━E
 * ━E WPF (C#)                                                      ━E
 * ━E Assets/app.ico               E16/24/32/48/64/128/256px       ━E
 * ━E Assets/icon_256.png          Eタイトルバ�E・スプラチE��ュ用     ━E
 * ├─────────────────────────────────────────────────────────────────┤
 * ━E Web (Next.js / React)                                         ━E
 * ━E public/favicon.ico           E32px ICO                       ━E
 * ━E public/icon-192.png          EPWA マニフェスチE              ━E
 * ━E public/icon-512.png          EPWA マニフェスチE              ━E
 * ━E public/apple-touch-icon.png  EiOS Safari                     ━E
 * ━E public/og-image.png          EOGP                            ━E
 * ├─────────────────────────────────────────────────────────────────┤
 * ━E Android (Native Kotlin)                                       ━E
 * ━E app/src/main/res/mipmap-*/ic_launcher.png   E48、E92dp       ━E
 * ━E app/src/main/res/drawable/ic_launcher_foreground.xml          ━E
 * ├─────────────────────────────────────────────────────────────────┤
 * ━E iOS                                                           ━E
 * ━E Assets.xcassets/AppIcon.appiconset/  E1024x1024 PNG          ━E
 * ├─────────────────────────────────────────────────────────────────┤
 * ━E Expo / React Native                                           ━E
 * ━E assets/icon.png              E1024x1024 PNG                  ━E
 * ━E assets/adaptive-icon.png     E1024x1024 PNG                  ━E
 * ├─────────────────────────────────────────────────────────────────┤
 * ━E Electron                                                      ━E
 * ━E build/icon.ico               EWindows                        ━E
 * ━E build/icon.icns              EmacOS                          ━E
 * ━E build/icon.png               ELinux (256x256 or 512x512)     ━E
 * └─────────────────────────────────────────────────────────────────━E
 * ```
 *
 * ## 使ぁE��
 *
 * ```typescript
 * import {
 *   getIconConfig,
 *   getIconTargets,
 *   getAllIconConfigs,
 *   getIconStatus,
 * } from '@/insight-common/config/app-icons';
 *
 * // 製品�Eアイコン構�Eを取征E
 * const config = getIconConfig('IOSH');
 * config.masterPng;  // 'brand/icons/png/icon-insight-sheet.png'
 * config.motifJa;    // 'スプレチE��シートグリチE�� + ヘッダー衁E
 *
 * // プラチE��フォーム別の出力�Eを取征E
 * const targets = getIconTargets('IOSH', 'wpf');
 * // [
 * //   { path: 'Assets/app.ico', format: 'ico', sizes: [16,24,32,48,64,128,256] },
 * //   { path: 'Assets/icon_256.png', format: 'png', sizes: [256] },
 * // ]
 *
 * // 全製品�Eアイコン状態を取得！Epp Manager 用�E�E
 * const allConfigs = getAllIconConfigs();
 * ```
 */

import type { ProductCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** アプリケーションプラチE��フォーム */
export type IconPlatform =
  | 'wpf'              // WPF (C#) チE��クトップアプリ
  | 'web'              // Web (Next.js / React / Hono)
  | 'android'          // Android (Native Kotlin)  Emipmap PNG
  | 'android_native'   // Android (Native Kotlin)  Evector drawable XML
  | 'ios'              // iOS (Swift)
  | 'expo'             // Expo / React Native
  | 'electron';        // Electron チE��クトップアプリ

/** アイコンフォーマッチE*/
export type IconFormat = 'ico' | 'png' | 'icns';

/** プラチE��フォーム別アイコン出力ターゲチE�� */
export interface IconTarget {
  /** 出力�Eパス�E�アプリの BasePath からの相対パス�E�E*/
  path: string;
  /** アイコンフォーマッチE*/
  format: IconFormat;
  /** サイズ�E�Ex�E�。�Eルチサイズの場合�E褁E��、E*/
  sizes: number[];
  /** 説昁E*/
  description: string;
  /** 日本語説昁E*/
  descriptionJa: string;
}

/** プラチE��フォーム別出力定義 */
export interface IconPlatformConfig {
  /** プラチE��フォーム */
  platform: IconPlatform;
  /** 出力ターゲチE��一覧 */
  targets: IconTarget[];
}

/** 製品�Eアイコン構�E */
export interface AppIconConfig {
  /** 製品コーチE*/
  productCode: ProductCode | string;
  /** 製品名 */
  productName: string;
  /** マスター PNG ソース�E�E024x1024、リポジトリルートから�E相対パス�E�E E唯一の正 */
  masterPng: string;
  /** アイコンモチ�Eフ説明（英語！E*/
  motif: string;
  /** アイコンモチ�Eフ説明（日本語！E*/
  motifJa: string;
  /** こ�Eアプリが使用するプラチE��フォーム一覧 */
  platforms: IconPlatformConfig[];
}

// =============================================================================
// プラチE��フォーム別チE��プレーチE
// =============================================================================

/** WPF (C#) チE��クトップアプリ向けターゲチE�� */
const WPF_TARGETS: IconTarget[] = [
  {
    path: 'Assets/app.ico',
    format: 'ico',
    sizes: [16, 24, 32, 48, 64, 128, 256],
    description: 'Windows application icon (multi-size ICO)',
    descriptionJa: 'Windows アプリケーションアイコン�E��Eルチサイズ ICO�E�E,
  },
  {
    path: 'Assets/icon_256.png',
    format: 'png',
    sizes: [256],
    description: 'Title bar / splash screen icon',
    descriptionJa: 'タイトルバ�E・スプラチE��ュ画面用アイコン',
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

/** Web (Next.js / React) 向けターゲチE�� */
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
    descriptionJa: 'iOS Safari タチE��アイコン',
  },
];

/** Electron 向けターゲチE�� */
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

/** Android 向けターゲチE�� */
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

/** Android Native (mipmap PNGs only  Emaster PNG is the single source of truth) */
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

/** iOS 向けターゲチE�� */
const IOS_TARGETS: IconTarget[] = [
  {
    path: 'Assets.xcassets/AppIcon.appiconset/icon-1024.png',
    format: 'png',
    sizes: [1024],
    description: 'iOS App Store icon (1024x1024)',
    descriptionJa: 'iOS App Store アイコン (1024x1024)',
  },
];

/** Expo / React Native 向けターゲチE�� */
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
  // Tier 1: 業務変革チE�Eル
  // ══════════════════════════════════════════════════════
  {
    productCode: 'INCA',
    productName: 'InsightNoCodeAnalyzer',
    masterPng: 'brand/icons/png/icon-insight-nca.png',
    motif: 'Flowchart + gear',
    motifJa: 'フローチャーチE+ ギア',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },
  {
    productCode: 'INBT',
    productName: 'InsightBot',
    masterPng: 'brand/icons/png/icon-insight-bot.png',
    motif: 'Cute robot + chat bubble',
    motifJa: 'かわぁE��ロボッチE+ チャチE��吹き�EぁE,
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },
  {
    productCode: 'IVIN',
    productName: 'InterviewInsight',
    masterPng: 'brand/icons/png/icon-interview-insight.png',
    motif: 'Robot + microphone + clipboard',
    motifJa: 'ロボッチE+ マイク + クリチE�Eボ�EチE,
    platforms: [
      { platform: 'web', targets: WEB_TARGETS },
    ],
  },

  // ══════════════════════════════════════════════════════
  // Tier 2: AI活用チE�Eル
  // ══════════════════════════════════════════════════════
  {
    productCode: 'INMV',
    productName: 'InsightCast',
    masterPng: 'brand/icons/png/icon-insight-cast.png',
    motif: 'Projector + film strip + gear',
    motifJa: '映写橁E+ フィルムストリチE�E + ギア',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },
  {
    productCode: 'INIG',
    productName: 'InsightImageGen',
    masterPng: 'brand/icons/png/icon-insight-imagegen.png',
    motif: 'Monitor + aperture + image + gear',
    motifJa: 'モニター + アパ�Eチャ + 画僁E+ ギア',
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
    masterPng: 'brand/icons/png/icon-insight-slide.png',
    motif: 'Presentation board + gear + arrows',
    motifJa: 'プレゼンボ�EチE+ ギア + 矢印',
    platforms: [
      { platform: 'wpf', targets: wpfWithFileIcon('inss-file.ico') },
    ],
  },
  {
    productCode: 'IOSH',
    productName: 'InsightOfficeSheet',
    masterPng: 'brand/icons/png/icon-insight-sheet.png',
    motif: 'Spreadsheet grid + gear',
    motifJa: 'スプレチE��シートグリチE�� + ギア',
    platforms: [
      { platform: 'wpf', targets: wpfWithFileIcon('iosh-file.ico') },
    ],
  },
  {
    productCode: 'IOSD',
    productName: 'InsightOfficeDoc',
    masterPng: 'brand/icons/png/icon-insight-doc.png',
    motif: 'Document + gear + DB',
    motifJa: 'ドキュメンチE+ ギア + DB',
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
    motifJa: 'カレンダー + 斁E�� + メール + ギア',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },

  // ══════════════════════════════════════════════════════
  // ユーチE��リチE���E�EnsightQR: Expo iOS + Android Native Kotlin�E�E
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
  // Web アプリ�E�追加刁E��E
  // ══════════════════════════════════════════════════════
  {
    productCode: 'INBA',
    productName: 'InsightBrowser AI',
    masterPng: '',
    motif: 'Browser + AI sparkle',
    motifJa: 'ブラウザ + AI スパ�Eクル',
    platforms: [
      { platform: 'electron', targets: ELECTRON_TARGETS },
      { platform: 'web', targets: WEB_TARGETS },
    ],
  },

  // ══════════════════════════════════════════════════════
  // ユーチE��リチE��アイコン�E�Eauncher 等！E
  // ══════════════════════════════════════════════════════
  {
    productCode: 'LAUNCHER',
    productName: 'Insight Launcher',
    masterPng: 'brand/icons/png/icon-launcher.png',
    motif: '2x2 grid + rocket + circuit board',
    motifJa: '2x2 グリチE�� + ロケチE�� + 回路基板',
    platforms: [
      { platform: 'wpf', targets: WPF_TARGETS },
    ],
  },

  // ══════════════════════════════════════════════════════
  // ユーチE��リチE���E�Endroid Native�E�E
  // ══════════════════════════════════════════════════════
  {
    productCode: 'CAMERA',
    productName: 'InsightCamera',
    masterPng: 'brand/icons/png/icon-camera.png',
    motif: 'Camera lens with gold accent + sparkle',
    motifJa: 'カメラレンズ + ゴールドアクセンチE+ スパ�Eクル',
    platforms: [
      { platform: 'android_native', targets: ANDROID_NATIVE_TARGETS },
    ],
  },
  {
    productCode: 'VOICE_CLOCK',
    productName: 'InsightVoiceClock',
    masterPng: 'brand/icons/png/icon-voice-clock.png',
    motif: 'Clock face with voice wave + sparkle',
    motifJa: '時訁E+ 音声波形 + スパ�Eクル',
    platforms: [
      { platform: 'android_native', targets: ANDROID_NATIVE_TARGETS },
    ],
  },
  {
    productCode: 'INCLINE',
    productName: 'InclineInsight',
    masterPng: 'brand/icons/png/icon-incline.png',
    motif: 'Inclinometer + measurement',
    motifJa: '傾斜訁E+ 計測',
    platforms: [
      { platform: 'android_native', targets: ANDROID_NATIVE_TARGETS },
    ],
  },
  {
    productCode: 'CONSUL_TYPE',
    productName: 'InsightConsulType',
    masterPng: 'brand/icons/png/icon-consul-type.png',
    motif: 'Typing evaluation + assessment',
    motifJa: 'タイピング評価 + アセスメンチE,
    platforms: [
      { platform: 'android_native', targets: ANDROID_NATIVE_TARGETS },
    ],
  },
  {
    productCode: 'HOROSCOPE',
    productName: 'HarmonicHoroscope',
    masterPng: 'brand/icons/png/icon-horoscope.png',
    motif: 'Zodiac + stars + fortune',
    motifJa: '星座 + 昁E+ 占ぁE,
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
    motifJa: '評価チャーチE+ アセスメンチE,
    platforms: [
      { platform: 'android_native', targets: ANDROID_NATIVE_TARGETS },
    ],
  },
];

// =============================================================================
// インチE��クスマッチE
// =============================================================================

const _configByCode = new Map<string, AppIconConfig>();
for (const config of APP_ICON_CONFIGS) {
  _configByCode.set(config.productCode, config);
}

// =============================================================================
// ヘルパ�E関数
// =============================================================================

/**
 * 製品コードからアイコン構�Eを取征E
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
 * 製品EÁEプラチE��フォームのアイコン出力ターゲチE��を取征E
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
 * 全製品�Eアイコン構�Eを取征E
 */
export function getAllIconConfigs(): AppIconConfig[] {
  return APP_ICON_CONFIGS;
}

/**
 * 製品が使用するプラチE��フォーム一覧を取征E
 */
export function getIconPlatforms(productCode: string): IconPlatform[] {
  const config = _configByCode.get(productCode);
  if (!config) return [];
  return config.platforms.map(p => p.platform);
}

/**
 * マスターアイコンファイル名から製品コードを送E��き
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
 * 全プラチE��フォームのターゲチE��チE��プレートを取征E
 * �E�新製品追加時にプラチE��フォームを選択するため�E参�E用�E�E
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
 * プラチE��フォーム名�E日本語ラベルを取征E
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
// チE��ォルトエクスポ�EチE
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
