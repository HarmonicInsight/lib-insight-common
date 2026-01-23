/**
 * i18n エクスポート
 *
 * 使用方法:
 * このファイルを src/lib/i18n/index.ts にコピー
 *
 * インポート例:
 * import { useI18n, LanguageSwitcher, I18nProvider } from '@/lib/i18n';
 */

export { I18nProvider, useI18n, LanguageSwitcher } from './context';
export { translations } from './translations';
export type { Language, TranslationKeys } from './translations';
