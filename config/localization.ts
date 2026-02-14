/**
 * Insight Series ローカライゼーション設定
 *
 * 全製品共通のロケール定義、ストアメタデータ仕様、
 * 日付・数値フォーマットを管理する。
 */

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

/** サポート対象ロケール */
export type LocaleCode = 'ja' | 'en' | 'ko' | 'th' | 'vi' | 'zh';

/** ロケールの状態 */
export type LocaleStatus = 'required' | 'supported' | 'planned';

/** 展開フェーズ */
export type Phase = 1 | 2 | 3;

/** ロケール情報 */
export interface LocaleInfo {
  code: LocaleCode;
  /** ISO 639-1 言語名（英語） */
  name: string;
  /** ネイティブ名 */
  nativeName: string;
  /** 対応状況 */
  status: LocaleStatus;
  /** 導入フェーズ */
  phase: Phase;
  /** Android リソースディレクトリ名 */
  androidValuesDir: string;
  /** iOS lproj ディレクトリ名 */
  iosLprojDir: string;
  /** Play Store ロケールコード */
  playStoreLocale: string;
  /** App Store ロケールコード */
  appStoreLocale: string;
  /** 日付フォーマット */
  dateFormats: {
    short: string;
    long: string;
    time: string;
    datetime: string;
  };
  /** 通貨 */
  currency: {
    code: string;
    symbol: string;
    symbolPosition: 'prefix' | 'suffix';
  };
}

/** ストアメタデータの文字数制限 */
export interface StoreMetadataLimits {
  title: number;
  shortDescription: number;
  fullDescription: number;
  releaseNotes: number;
  keywords?: number;
  subtitle?: number;
  promotionalText?: number;
}

// ---------------------------------------------------------------------------
// ロケール定義
// ---------------------------------------------------------------------------

export const SUPPORTED_LOCALES: Record<LocaleCode, LocaleInfo> = {
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    status: 'required',
    phase: 1,
    androidValuesDir: 'values',
    iosLprojDir: 'ja.lproj',
    playStoreLocale: 'ja-JP',
    appStoreLocale: 'ja',
    dateFormats: {
      short: 'YYYY/MM/DD',
      long: 'YYYY年MM月DD日',
      time: 'HH:mm',
      datetime: 'YYYY/MM/DD HH:mm',
    },
    currency: {
      code: 'JPY',
      symbol: '¥',
      symbolPosition: 'prefix',
    },
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    status: 'required',
    phase: 1,
    androidValuesDir: 'values-en',
    iosLprojDir: 'en.lproj',
    playStoreLocale: 'en-US',
    appStoreLocale: 'en-US',
    dateFormats: {
      short: 'MM/DD/YYYY',
      long: 'MMMM D, YYYY',
      time: 'h:mm A',
      datetime: 'MM/DD/YYYY h:mm A',
    },
    currency: {
      code: 'USD',
      symbol: '$',
      symbolPosition: 'prefix',
    },
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    status: 'planned',
    phase: 3,
    androidValuesDir: 'values-ko',
    iosLprojDir: 'ko.lproj',
    playStoreLocale: 'ko-KR',
    appStoreLocale: 'ko',
    dateFormats: {
      short: 'YYYY.MM.DD',
      long: 'YYYY년 MM월 DD일',
      time: 'HH:mm',
      datetime: 'YYYY.MM.DD HH:mm',
    },
    currency: {
      code: 'KRW',
      symbol: '₩',
      symbolPosition: 'prefix',
    },
  },
  th: {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    status: 'planned',
    phase: 2,
    androidValuesDir: 'values-th',
    iosLprojDir: 'th.lproj',
    playStoreLocale: 'th',
    appStoreLocale: 'th',
    dateFormats: {
      short: 'DD/MM/YYYY',
      long: 'DD MMMM YYYY',
      time: 'HH:mm',
      datetime: 'DD/MM/YYYY HH:mm',
    },
    currency: {
      code: 'THB',
      symbol: '฿',
      symbolPosition: 'prefix',
    },
  },
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    status: 'planned',
    phase: 2,
    androidValuesDir: 'values-vi',
    iosLprojDir: 'vi.lproj',
    playStoreLocale: 'vi',
    appStoreLocale: 'vi',
    dateFormats: {
      short: 'DD/MM/YYYY',
      long: 'ngày DD tháng MM năm YYYY',
      time: 'HH:mm',
      datetime: 'DD/MM/YYYY HH:mm',
    },
    currency: {
      code: 'VND',
      symbol: '₫',
      symbolPosition: 'suffix',
    },
  },
  zh: {
    code: 'zh',
    name: 'Chinese (Simplified)',
    nativeName: '中文（简体）',
    status: 'planned',
    phase: 3,
    androidValuesDir: 'values-zh',
    iosLprojDir: 'zh-Hans.lproj',
    playStoreLocale: 'zh-CN',
    appStoreLocale: 'zh-Hans',
    dateFormats: {
      short: 'YYYY/MM/DD',
      long: 'YYYY年MM月DD日',
      time: 'HH:mm',
      datetime: 'YYYY/MM/DD HH:mm',
    },
    currency: {
      code: 'CNY',
      symbol: '¥',
      symbolPosition: 'prefix',
    },
  },
};

/** デフォルトロケール */
export const DEFAULT_LOCALE: LocaleCode = 'ja';

// ---------------------------------------------------------------------------
// ストアメタデータ制限
// ---------------------------------------------------------------------------

/** Play Store メタデータの文字数制限 */
export const PLAY_STORE_LIMITS: StoreMetadataLimits = {
  title: 30,
  shortDescription: 80,
  fullDescription: 4000,
  releaseNotes: 500,
};

/** App Store メタデータの文字数制限 */
export const APP_STORE_LIMITS: StoreMetadataLimits = {
  title: 30,
  shortDescription: 170,       // App Store では promotional_text
  fullDescription: 4000,
  releaseNotes: 4000,
  keywords: 100,
  subtitle: 30,
  promotionalText: 170,
};

// ---------------------------------------------------------------------------
// ヘルパー関数
// ---------------------------------------------------------------------------

/**
 * 指定フェーズで必要なロケールを取得
 */
export function getLocalesForPhase(phase: Phase): LocaleInfo[] {
  return Object.values(SUPPORTED_LOCALES).filter((l) => l.phase <= phase);
}

/**
 * 必須ロケール（ja + en）を取得
 */
export function getRequiredLocales(): LocaleInfo[] {
  return Object.values(SUPPORTED_LOCALES).filter((l) => l.status === 'required');
}

/**
 * Android の values ディレクトリ名を取得
 */
export function getAndroidValuesDir(locale: LocaleCode): string {
  return SUPPORTED_LOCALES[locale].androidValuesDir;
}

/**
 * iOS の lproj ディレクトリ名を取得
 */
export function getIosLprojDir(locale: LocaleCode): string {
  return SUPPORTED_LOCALES[locale].iosLprojDir;
}

/**
 * Play Store ロケールコードを取得
 */
export function getPlayStoreLocale(locale: LocaleCode): string {
  return SUPPORTED_LOCALES[locale].playStoreLocale;
}

/**
 * App Store ロケールコードを取得
 */
export function getAppStoreLocale(locale: LocaleCode): string {
  return SUPPORTED_LOCALES[locale].appStoreLocale;
}

/**
 * ロケールの日付フォーマットを取得
 */
export function getDateFormat(
  locale: LocaleCode,
  format: 'short' | 'long' | 'time' | 'datetime',
): string {
  return SUPPORTED_LOCALES[locale].dateFormats[format];
}

/**
 * ストアメタデータの文字数を検証
 */
export function validateStoreMetadata(
  store: 'play' | 'appstore',
  field: keyof StoreMetadataLimits,
  text: string,
): { valid: boolean; length: number; limit: number } {
  const limits = store === 'play' ? PLAY_STORE_LIMITS : APP_STORE_LIMITS;
  const limit = limits[field];
  if (limit === undefined) {
    return { valid: true, length: text.length, limit: 0 };
  }
  return {
    valid: text.length <= limit,
    length: text.length,
    limit,
  };
}
