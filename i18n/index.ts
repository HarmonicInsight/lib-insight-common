/**
 * Insight Series i18n - TypeScript
 * 多言語サポートヘルパー
 */

import ja from './ja.json';
import en from './en.json';

export type Locale = 'ja' | 'en';
export type TranslationKey = string;

// 利用可能なロケール
export const LOCALES: Record<Locale, { name: string; nativeName: string }> = {
  ja: { name: 'Japanese', nativeName: '日本語' },
  en: { name: 'English', nativeName: 'English' },
};

// 翻訳データ
const translations: Record<Locale, typeof ja> = {
  ja,
  en,
};

// デフォルトロケール
let currentLocale: Locale = 'ja';

/**
 * 現在のロケールを設定
 */
export function setLocale(locale: Locale): void {
  if (locale in translations) {
    currentLocale = locale;
  }
}

/**
 * 現在のロケールを取得
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * システムロケールを検出
 */
export function detectLocale(): Locale {
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang in translations) {
      return browserLang as Locale;
    }
  }
  return 'ja'; // デフォルト
}

/**
 * 翻訳を取得
 * @param key ドット区切りのキー (例: "license.title")
 * @param params 置換パラメータ (例: { days: 14 })
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: unknown = translations[currentLocale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // フォールバック: 英語を試す
      value = translations.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = (value as Record<string, unknown>)[fallbackKey];
        } else {
          return key; // キーが見つからない場合はキー自体を返す
        }
      }
      break;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // パラメータ置換 (例: {days} → 14)
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, name) => {
      return params[name]?.toString() ?? `{${name}}`;
    });
  }

  return value;
}

/**
 * 翻訳オブジェクトを取得
 */
export function getTranslations(locale?: Locale): typeof ja {
  return translations[locale || currentLocale];
}

/**
 * React Hook 用のコンテキスト値を生成
 */
export function createI18nContext(locale: Locale = currentLocale) {
  return {
    locale,
    t: (key: TranslationKey, params?: Record<string, string | number>) => {
      const savedLocale = currentLocale;
      currentLocale = locale;
      const result = t(key, params);
      currentLocale = savedLocale;
      return result;
    },
    setLocale,
  };
}

export default {
  t,
  setLocale,
  getLocale,
  detectLocale,
  getTranslations,
  LOCALES,
};
