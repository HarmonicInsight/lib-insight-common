/**
 * insight-common を参照している依存リポジトリの一覧
 *
 * insight-common の main ブランチに変更が push された際、
 * GitHub Actions (.github/workflows/sync-submodule.yml) が
 * 各リポジトリのサブモジュールを自動更新し、PR を作成する。
 *
 * ## 新規リポジトリ追加手順
 * 1. DEPENDENT_REPOS にエントリを追加
 * 2. iconCopy にアイコンのコピー元・先を定義
 * 3. submodulePath が 'insight-common' 以外の場合は明示指定
 */

// =============================================================================
// 型定義
// =============================================================================

/** アイコンコピー定義 */
export interface IconCopyRule {
  /** コピー元: insight-common 内の相対パス（brand/icons/generated/ 以下） */
  src: string;
  /** コピー先: アプリリポジトリ内の相対パス */
  dest: string;
}

/** 依存リポジトリ定義 */
export interface DependentRepo {
  /** GitHub リポジトリ名（HarmonicInsight/ 以下） */
  repo: string;
  /** 製品コード（参考情報） */
  productCode: string;
  /** 製品名 */
  productName: string;
  /** サブモジュールのパス（デフォルト: 'insight-common'） */
  submodulePath?: string;
  /** アイコンコピールール */
  iconCopy: IconCopyRule[];
  /** この同期を有効にするか（false にすると sync 対象外） */
  enabled: boolean;
}

// =============================================================================
// 依存リポジトリ一覧
// =============================================================================

export const DEPENDENT_REPOS: DependentRepo[] = [
  // ══════════════════════════════════════════════════════
  // Tier 1: 業務変革ツール
  // ══════════════════════════════════════════════════════
  {
    repo: 'win-app-nocode-analyzer',
    productCode: 'INCA',
    productName: 'InsightNoCodeAnalyzer',
    iconCopy: [
      { src: 'InsightNoCodeAnalyzer/', dest: 'src-tauri/icons/' },
    ],
    enabled: true,
  },
  {
    repo: 'win-app-insight-bot',
    productCode: 'INBT',
    productName: 'InsightBot',
    iconCopy: [
      { src: 'InsightBot/InsightBot.ico', dest: 'Resources/InsightBot.ico' },
      { src: 'InsightBot/InsightBot_256.png', dest: 'Resources/InsightBot_256.png' },
    ],
    enabled: true,
  },
  {
    repo: 'web-app-auto-interview',
    productCode: 'IVIN',
    productName: 'InterviewInsight',
    iconCopy: [
      { src: 'InterviewInsight/', dest: 'src-tauri/icons/' },
    ],
    enabled: true,
  },

  // ══════════════════════════════════════════════════════
  // Tier 2: AI活用ツール
  // ══════════════════════════════════════════════════════
  {
    repo: 'win-app-insight-movie-gen',
    productCode: 'INMV',
    productName: 'InsightMovie',
    iconCopy: [
      { src: 'InsightMovie/InsightMovie.ico', dest: 'resources/InsightMovie.ico' },
      { src: 'InsightMovie/InsightMovie_256.png', dest: 'resources/InsightMovie_256.png' },
    ],
    enabled: true,
  },
  {
    repo: 'win-app-insight-image-gen',
    productCode: 'INIG',
    productName: 'InsightImageGen',
    iconCopy: [
      { src: 'InsightImageGen/InsightImageGen.ico', dest: 'resources/InsightImageGen.ico' },
      { src: 'InsightImageGen/InsightImageGen_256.png', dest: 'resources/InsightImageGen_256.png' },
    ],
    enabled: true,
  },

  // ══════════════════════════════════════════════════════
  // Tier 3: InsightOffice Suite
  // ══════════════════════════════════════════════════════
  {
    repo: 'win-app-insight-slide',
    productCode: 'INSS',
    productName: 'InsightOfficeSlide',
    iconCopy: [
      { src: 'InsightOfficeSlide/InsightOfficeSlide.ico', dest: 'Resources/InsightOfficeSlide.ico' },
      { src: 'InsightOfficeSlide/InsightOfficeSlide_256.png', dest: 'Resources/InsightOfficeSlide_256.png' },
    ],
    enabled: true,
  },
  {
    repo: 'win-app-insight-sheet',
    productCode: 'IOSH',
    productName: 'InsightOfficeSheet',
    iconCopy: [
      { src: 'InsightOfficeSheet/InsightOfficeSheet.ico', dest: 'Resources/InsightOfficeSheet.ico' },
      { src: 'InsightOfficeSheet/InsightOfficeSheet_256.png', dest: 'Resources/InsightOfficeSheet_256.png' },
    ],
    enabled: true,
  },
  {
    repo: 'win-app-insight-doc',
    productCode: 'IOSD',
    productName: 'InsightOfficeDoc',
    iconCopy: [
      { src: 'InsightOfficeDoc/InsightOfficeDoc.ico', dest: 'Resources/InsightOfficeDoc.ico' },
      { src: 'InsightOfficeDoc/InsightOfficeDoc_256.png', dest: 'Resources/InsightOfficeDoc_256.png' },
    ],
    enabled: true,
  },
  {
    repo: 'win-app-insight-py',
    productCode: 'INPY',
    productName: 'InsightPy',
    iconCopy: [
      { src: 'InsightPy/InsightPy.ico', dest: 'resources/InsightPy.ico' },
      { src: 'InsightPy/InsightPy_256.png', dest: 'resources/InsightPy_256.png' },
    ],
    enabled: true,
  },
  {
    repo: 'win-app-insight-py-pro',
    productCode: 'INPY',
    productName: 'InsightPy (PRO)',
    iconCopy: [
      { src: 'InsightPy/InsightPy.ico', dest: 'resources/InsightPy.ico' },
      { src: 'InsightPy/InsightPy_256.png', dest: 'resources/InsightPy_256.png' },
    ],
    enabled: true,
  },

  // ══════════════════════════════════════════════════════
  // Tier 4: シニア向け
  // ══════════════════════════════════════════════════════
  {
    repo: 'win-app-insight-sheet-senior',
    productCode: 'ISOF',
    productName: 'InsightSeniorOffice',
    iconCopy: [
      { src: 'InsightSeniorOffice/InsightSeniorOffice.ico', dest: 'Resources/InsightSeniorOffice.ico' },
      { src: 'InsightSeniorOffice/InsightSeniorOffice_256.png', dest: 'Resources/InsightSeniorOffice_256.png' },
    ],
    enabled: true,
  },

  // ══════════════════════════════════════════════════════
  // ユーティリティ
  // ══════════════════════════════════════════════════════
  {
    repo: 'win-app-insight-launcher',
    productCode: 'LAUNCHER',
    productName: 'InsightLauncher',
    iconCopy: [
      { src: 'InsightLauncher/InsightLauncher.ico', dest: 'Resources/InsightLauncher.ico' },
      { src: 'InsightLauncher/InsightLauncher_256.png', dest: 'Resources/InsightLauncher_256.png' },
    ],
    enabled: true,
  },
  {
    repo: 'android-app-insight-launcher',
    productCode: 'LAUNCHER_ANDROID',
    productName: 'InsightLauncherAndroid',
    iconCopy: [
      { src: 'InsightLauncherAndroid/drawable/', dest: 'app/src/main/res/drawable/' },
      { src: 'InsightLauncherAndroid/mipmap-anydpi-v26/', dest: 'app/src/main/res/mipmap-anydpi-v26/' },
    ],
    enabled: true,
  },
  // ══════════════════════════════════════════════════════
  // Android Native (Kotlin/Compose)
  // ══════════════════════════════════════════════════════
  {
    repo: 'android-app-insight-voice-clock',
    productCode: 'VOICE_CLOCK',
    productName: 'InsightVoiceClock',
    iconCopy: [
      { src: 'InsightVoiceClock/drawable/', dest: 'app/src/main/res/drawable/' },
      { src: 'InsightVoiceClock/mipmap-anydpi-v26/', dest: 'app/src/main/res/mipmap-anydpi-v26/' },
    ],
    enabled: true,
  },
  {
    repo: 'android-app-insight-camera',
    productCode: 'CAMERA',
    productName: 'InsightCamera',
    iconCopy: [
      { src: 'InsightCamera/drawable/', dest: 'app/src/main/res/drawable/' },
      { src: 'InsightCamera/mipmap-anydpi-v26/', dest: 'app/src/main/res/mipmap-anydpi-v26/' },
    ],
    enabled: true,
  },
  // ══════════════════════════════════════════════════════
  // Expo / React Native
  // ══════════════════════════════════════════════════════
  {
    repo: 'mobile-app-voice-memo',
    productCode: 'VOICE_MEMO',
    productName: 'InsightVoiceMemo',
    iconCopy: [
      { src: 'InsightVoiceMemo/icon.png', dest: 'assets/icon.png' },
      { src: 'InsightVoiceMemo/adaptive-icon.png', dest: 'assets/adaptive-icon.png' },
      { src: 'InsightVoiceMemo/notification-icon.png', dest: 'assets/notification-icon.png' },
      { src: 'InsightVoiceMemo/splash-icon.png', dest: 'assets/splash-icon.png' },
      { src: 'InsightVoiceMemo/favicon.png', dest: 'assets/favicon.png' },
    ],
    enabled: true,
  },
  // ══════════════════════════════════════════════════════
  // WPF (C#)
  // ══════════════════════════════════════════════════════
  {
    repo: 'win-app-insight-pinboard',
    productCode: 'PINBOARD',
    productName: 'InsightPinBoard',
    iconCopy: [
      { src: 'InsightPinBoard/InsightPinBoard.ico', dest: 'Resources/InsightPinBoard.ico' },
      { src: 'InsightPinBoard/InsightPinBoard_256.png', dest: 'Resources/InsightPinBoard_256.png' },
    ],
    enabled: true,
  },

  // ══════════════════════════════════════════════════════
  // InsightQR（Expo iOS + Android Native Kotlin）
  // ══════════════════════════════════════════════════════
  {
    repo: 'web-app-insight-qr',
    productCode: 'QR',
    productName: 'InsightQR (iOS / Expo)',
    iconCopy: [
      { src: 'InsightQR/favicon.ico', dest: 'public/favicon.ico' },
      { src: 'InsightQR/favicon-16.png', dest: 'public/favicon-16x16.png' },
      { src: 'InsightQR/favicon-32.png', dest: 'public/favicon-32x32.png' },
      { src: 'InsightQR/apple-touch-icon.png', dest: 'public/apple-touch-icon.png' },
      { src: 'InsightQR/icon-192.png', dest: 'public/icon-192.png' },
      { src: 'InsightQR/icon-512.png', dest: 'public/icon-512.png' },
    ],
    enabled: true,
  },
  {
    repo: 'android-app-insight-qr',
    productCode: 'QR',
    productName: 'InsightQR (Android / Kotlin)',
    iconCopy: [
      { src: 'InsightQR/drawable/', dest: 'app/src/main/res/drawable/' },
      { src: 'InsightQR/mipmap-anydpi-v26/', dest: 'app/src/main/res/mipmap-anydpi-v26/' },
    ],
    enabled: true,
  },

  // ══════════════════════════════════════════════════════
  // コンサルティングツール
  // ══════════════════════════════════════════════════════
  {
    repo: 'android-app-consul-evaluate',
    productCode: 'CONSUL_EVAL',
    productName: 'ConsulEvaluate',
    iconCopy: [],
    enabled: true,
  },
  {
    repo: 'android-app-voice-tesk-calendar',
    productCode: 'VOICE_TASK_CALENDAR',
    productName: 'しゃべってカレンダー',
    iconCopy: [],
    enabled: true,
  },
];

// =============================================================================
// ヘルパー関数
// =============================================================================

/** 同期が有効なリポジトリ一覧を取得 */
export function getEnabledRepos(): DependentRepo[] {
  return DEPENDENT_REPOS.filter(r => r.enabled);
}

/** 製品コードから依存リポジトリを取得 */
export function getReposByProduct(productCode: string): DependentRepo[] {
  return DEPENDENT_REPOS.filter(r => r.productCode === productCode && r.enabled);
}

/** リポジトリ名から依存リポジトリを取得 */
export function getRepoByName(repoName: string): DependentRepo | undefined {
  return DEPENDENT_REPOS.find(r => r.repo === repoName);
}

export default {
  DEPENDENT_REPOS,
  getEnabledRepos,
  getReposByProduct,
  getRepoByName,
};
