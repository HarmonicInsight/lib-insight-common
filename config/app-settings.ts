/**
 * HARMONIC insight - アプリ設定画面 標準定義
 *
 * 全 Android アプリ（および将来的に他プラットフォーム）で共通利用する
 * 設定画面の標準構成・法的URL・会社情報を定義する。
 *
 * @example
 * ```typescript
 * import {
 *   LEGAL_URLS,
 *   COMPANY_INFO,
 *   getSettingsSections,
 *   getAboutItems,
 * } from '@/insight-common/config/app-settings';
 * ```
 */

// ============================================================
// 法的情報 URL（全製品共通）
// ============================================================

/**
 * 法的情報の URL 定義
 *
 * Play Store の「データ セーフティ」セクションにも同じ URL を登録する。
 * URL を変更する場合はここを更新するだけで全アプリに反映される。
 */
export const LEGAL_URLS = {
  /** プライバシーポリシー */
  privacyPolicy: 'https://h-insight.jp/privacy',
  /** 利用規約 */
  termsOfService: 'https://h-insight.jp/terms',
} as const;

/**
 * 法的情報 URL を取得（全言語共通）
 */
export function getLegalUrls() {
  return {
    privacyPolicy: LEGAL_URLS.privacyPolicy,
    termsOfService: LEGAL_URLS.termsOfService,
  };
}

// ============================================================
// 会社情報（設定画面の「このアプリについて」セクション用）
// ============================================================

export const COMPANY_INFO = {
  name: 'HARMONIC insight',
  legalName: 'HARMONIC insight LLC',
  website: 'https://h-insight.jp',
  supportEmail: 'support@h-insight.jp',
  generalEmail: 'info@h-insight.jp',
  github: 'https://github.com/HarmonicInsight',
  copyright: (year: number = new Date().getFullYear()) =>
    `© ${year} HARMONIC insight. All rights reserved.`,
} as const;

// ============================================================
// Android ユーティリティアプリ定義
// ============================================================

/**
 * Play Store 公開対象の Android ユーティリティアプリ
 *
 * Insight Office Suite (B2B) とは別カテゴリ。
 * 無料公開のユーティリティアプリとして Play Store に掲載。
 */
export interface AndroidUtilityApp {
  /** アプリ識別子 */
  id: string;
  /** パッケージ名 (applicationId) */
  packageName: string;
  /** アプリ表示名（日本語） */
  displayNameJa: string;
  /** アプリ表示名（英語） */
  displayNameEn: string;
  /** 短い説明（日本語） */
  descriptionJa: string;
  /** 短い説明（英語） */
  descriptionEn: string;
  /** Play Store カテゴリ */
  category: string;
  /** GitHub リポジトリ */
  repository: string;
  /** 使用する権限 */
  permissions: string[];
  /** データ収集に関する説明（Data Safety 用） */
  dataSafety: DataSafetyDeclaration;
}

/**
 * Play Store Data Safety セクション用の宣言
 */
export interface DataSafetyDeclaration {
  /** データ収集の有無 */
  collectsData: boolean;
  /** 収集するデータの種類 */
  dataCollected: DataCollectedItem[];
  /** データ共有の有無 */
  sharesData: boolean;
  /** データの暗号化 */
  dataEncrypted: boolean;
  /** データ削除のリクエスト可否 */
  canRequestDeletion: boolean;
}

interface DataCollectedItem {
  type: string;
  purpose: string;
  optional: boolean;
}

export const ANDROID_UTILITY_APPS: Record<string, AndroidUtilityApp> = {
  'voice-task-calendar': {
    id: 'voice-task-calendar',
    packageName: 'com.harmonicinsight.voicetask',
    displayNameJa: 'Voice Task Calendar',
    displayNameEn: 'Voice Task Calendar',
    descriptionJa: '音声でタスク・メモ・スケジュールを管理',
    descriptionEn: 'Manage tasks, memos, and schedules with voice input',
    category: 'PRODUCTIVITY',
    repository: 'HarmonicInsight/android-app-voice-tesk-calendar',
    permissions: [
      'RECORD_AUDIO',
      'INTERNET',
      'POST_NOTIFICATIONS',
      'SCHEDULE_EXACT_ALARM',
      'USE_EXACT_ALARM',
      'RECEIVE_BOOT_COMPLETED',
    ],
    dataSafety: {
      collectsData: false,
      dataCollected: [],
      sharesData: false,
      dataEncrypted: true,
      canRequestDeletion: true,
    },
  },
  'insight-voice-clock': {
    id: 'insight-voice-clock',
    packageName: 'com.insightvoiceclock',
    displayNameJa: 'Voice Clock',
    displayNameEn: 'Voice Clock',
    descriptionJa: 'TTS音声読み上げ対応アラーム時計',
    descriptionEn: 'TTS voice announcement alarm clock',
    category: 'TOOLS',
    repository: 'HarmonicInsight/android-app-insight-voice-clock',
    permissions: [
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
      'USE_EXACT_ALARM',
      'SCHEDULE_EXACT_ALARM',
      'USE_FULL_SCREEN_INTENT',
      'FOREGROUND_SERVICE',
      'WAKE_LOCK',
      'POST_NOTIFICATIONS',
      'REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
    ],
    dataSafety: {
      collectsData: true,
      dataCollected: [
        {
          type: 'crash_logs',
          purpose: 'App stability and performance',
          optional: false,
        },
        {
          type: 'app_usage',
          purpose: 'Analytics',
          optional: false,
        },
      ],
      sharesData: true, // Firebase Crashlytics/Analytics
      dataEncrypted: true,
      canRequestDeletion: true,
    },
  },
  'insight-camera': {
    id: 'insight-camera',
    packageName: 'com.harmonic.insight.camera',
    displayNameJa: 'Insight Camera',
    displayNameEn: 'Insight Camera',
    descriptionJa: 'シンプルで使いやすいカメラアプリ',
    descriptionEn: 'Simple and easy-to-use camera app',
    category: 'PHOTOGRAPHY',
    repository: 'HarmonicInsight/android-app-insight-camera',
    permissions: ['CAMERA', 'RECORD_AUDIO'],
    dataSafety: {
      collectsData: false,
      dataCollected: [],
      sharesData: false,
      dataEncrypted: false,
      canRequestDeletion: true,
    },
  },
  'insight-qr': {
    id: 'insight-qr',
    packageName: 'com.harmonicinsight.insightqr',
    displayNameJa: 'Insight QR',
    displayNameEn: 'Insight QR',
    descriptionJa: 'QRコード読み取り・生成ツール',
    descriptionEn: 'QR code scanner and generator',
    category: 'TOOLS',
    repository: 'HarmonicInsight/android-app-insight-qr',
    permissions: ['CAMERA', 'VIBRATE', 'INTERNET'],
    dataSafety: {
      collectsData: false,
      dataCollected: [],
      sharesData: false,
      dataEncrypted: true,
      canRequestDeletion: true,
    },
  },
};

// ============================================================
// 設定画面 標準セクション定義
// ============================================================

/**
 * 設定画面のセクション種別
 */
export type SettingsSectionType =
  | 'app_specific'
  | 'appearance'
  | 'about'
  | 'legal';

/**
 * 設定項目の種別
 */
export type SettingsItemType =
  | 'toggle'       // ON/OFF スイッチ
  | 'link'         // 外部リンク（ブラウザで開く）
  | 'navigation'   // アプリ内画面遷移
  | 'info'         // 表示のみ（タップ不可）
  | 'radio'        // 選択肢（テーマ等）
  | 'action';      // タップでアクション実行

export interface SettingsSection {
  type: SettingsSectionType;
  titleJa: string;
  titleEn: string;
  items: SettingsItem[];
}

export interface SettingsItem {
  key: string;
  type: SettingsItemType;
  titleJa: string;
  titleEn: string;
  descriptionJa?: string;
  descriptionEn?: string;
  /** link タイプの場合の URL */
  url?: string;
  /** info タイプの場合の値（バージョン番号など） */
  value?: string;
}

/**
 * 全アプリ共通の「外観」セクション
 */
export function getAppearanceSection(): SettingsSection {
  return {
    type: 'appearance',
    titleJa: '外観',
    titleEn: 'Appearance',
    items: [
      {
        key: 'dark_mode',
        type: 'toggle',
        titleJa: 'ダークモード',
        titleEn: 'Dark Mode',
        descriptionJa: 'ダークテーマに切り替える',
        descriptionEn: 'Switch to dark theme',
      },
    ],
  };
}

/**
 * 全アプリ共通の「このアプリについて」セクション
 *
 * @param appNameJa - アプリ名（日本語）
 * @param appNameEn - アプリ名（英語）
 * @param version - バージョン文字列（例: "1.0.0"）
 */
export function getAboutSection(
  appNameJa: string,
  appNameEn: string,
  version: string
): SettingsSection {
  return {
    type: 'about',
    titleJa: `${appNameJa}について`,
    titleEn: `About ${appNameEn}`,
    items: [
      {
        key: 'version',
        type: 'info',
        titleJa: 'バージョン',
        titleEn: 'Version',
        value: version,
      },
      {
        key: 'developer',
        type: 'info',
        titleJa: '開発元',
        titleEn: 'Developer',
        value: COMPANY_INFO.name,
      },
    ],
  };
}

/**
 * 全アプリ共通の「法的情報」セクション
 */
export function getLegalSection(): SettingsSection {
  return {
    type: 'legal',
    titleJa: '法的情報',
    titleEn: 'Legal',
    items: [
      {
        key: 'privacy_policy',
        type: 'link',
        titleJa: 'プライバシーポリシー',
        titleEn: 'Privacy Policy',
        url: LEGAL_URLS.privacyPolicy,
      },
      {
        key: 'terms_of_service',
        type: 'link',
        titleJa: '利用規約',
        titleEn: 'Terms of Service',
        url: LEGAL_URLS.termsOfService,
      },
      {
        key: 'oss_licenses',
        type: 'navigation',
        titleJa: 'オープンソースライセンス',
        titleEn: 'Open Source Licenses',
      },
    ],
  };
}

/**
 * 標準設定画面のセクション一覧を取得
 *
 * 各アプリの設定画面は以下の順序で構成する:
 * 1. アプリ固有の設定（各アプリで定義）
 * 2. 外観
 * 3. このアプリについて
 * 4. 法的情報
 *
 * @param appNameJa - アプリ名（日本語）
 * @param appNameEn - アプリ名（英語）
 * @param version - バージョン文字列
 * @param appSpecificSections - アプリ固有のセクション（先頭に配置）
 */
export function getStandardSettingsSections(
  appNameJa: string,
  appNameEn: string,
  version: string,
  appSpecificSections: SettingsSection[] = []
): SettingsSection[] {
  return [
    ...appSpecificSections,
    getAppearanceSection(),
    getAboutSection(appNameJa, appNameEn, version),
    getLegalSection(),
  ];
}

// ============================================================
// Android strings.xml 用ヘルパー
// ============================================================

/**
 * 設定画面で使用する標準文字列（日本語）
 *
 * Android の strings.xml に追加すべき文字列の一覧。
 * キーの命名規則: `settings_` + セクション名 + `_` + 項目名
 */
export const STANDARD_STRINGS_JA: Record<string, string> = {
  // セクションヘッダー
  settings_title: '設定',
  settings_appearance: '外観',
  settings_legal: '法的情報',

  // 外観
  settings_dark_mode: 'ダークモード',
  settings_dark_mode_desc: 'ダークテーマに切り替える',
  settings_theme: 'テーマ',
  settings_theme_light: 'ライト',
  settings_theme_dark: 'ダーク',
  settings_theme_system: 'システム設定に従う',

  // このアプリについて（%s = アプリ名）
  settings_about: '%sについて',
  settings_version: 'バージョン',
  settings_developer: '開発元',
  settings_developer_name: 'HARMONIC insight',

  // 法的情報
  settings_privacy_policy: 'プライバシーポリシー',
  settings_terms_of_service: '利用規約',
  settings_oss_licenses: 'オープンソースライセンス',

  // コピーライト
  settings_copyright: '© %d HARMONIC insight. All rights reserved.',
};

/**
 * 設定画面で使用する標準文字列（英語）
 */
export const STANDARD_STRINGS_EN: Record<string, string> = {
  // Section headers
  settings_title: 'Settings',
  settings_appearance: 'Appearance',
  settings_legal: 'Legal',

  // Appearance
  settings_dark_mode: 'Dark Mode',
  settings_dark_mode_desc: 'Switch to dark theme',
  settings_theme: 'Theme',
  settings_theme_light: 'Light',
  settings_theme_dark: 'Dark',
  settings_theme_system: 'System',

  // About (%s = app name)
  settings_about: 'About %s',
  settings_version: 'Version',
  settings_developer: 'Developer',
  settings_developer_name: 'HARMONIC insight',

  // Legal
  settings_privacy_policy: 'Privacy Policy',
  settings_terms_of_service: 'Terms of Service',
  settings_oss_licenses: 'Open Source Licenses',

  // Copyright
  settings_copyright: '© %d HARMONIC insight. All rights reserved.',
};
