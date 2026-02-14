/**
 * i18n Context テンプレート
 *
 * 使用方法:
 * 1. このファイルを src/lib/i18n/context.tsx にコピー
 * 2. providers.tsx で I18nProvider をラップ
 * 3. コンポーネントで useI18n() を使用
 *
 * 例:
 * const { t, language } = useI18n();
 * <p>{t.common.loading}</p>
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKeys } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// ローカルストレージのキー（アプリ名に変更してください）
const STORAGE_KEY = 'app_language';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ja');

  useEffect(() => {
    // 保存された言語設定を読み込み
    const savedLang = localStorage.getItem(STORAGE_KEY) as Language;
    if (savedLang && (savedLang === 'ja' || savedLang === 'en')) {
      setLanguageState(savedLang);
    } else {
      // ブラウザの言語設定を自動検出
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('en')) {
        setLanguageState('en');
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  // 重要: as TranslationKeys でキャストする
  // これがないとTypeScriptエラーが発生する
  const t = translations[language] as TranslationKeys;

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

/**
 * シンプルな言語切り替えコンポーネント
 *
 * 使用例:
 * <LanguageSwitcher />
 * <LanguageSwitcher className="ml-4" />
 */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useI18n();

  return (
    <div className={`flex items-center text-sm ${className}`}>
      <button
        onClick={() => setLanguage('ja')}
        className={`px-2 py-1 rounded-l border transition ${
          language === 'ja'
            ? 'bg-[#B8942F] text-white border-[#B8942F]'
            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
        }`}
      >
        JA
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded-r border-t border-r border-b transition ${
          language === 'en'
            ? 'bg-[#B8942F] text-white border-[#B8942F]'
            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
        }`}
      >
        EN
      </button>
    </div>
  );
}
