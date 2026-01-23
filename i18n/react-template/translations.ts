/**
 * i18n 翻訳定義テンプレート
 *
 * 使用方法:
 * 1. このファイルを src/lib/i18n/translations.ts にコピー
 * 2. アプリに合わせて翻訳キーを追加/変更
 *
 * 注意:
 * - DeepStringify 型ヘルパーは必須（リテラル型問題を回避）
 * - ja と en の構造は完全に一致させること
 */

export const translations = {
  ja: {
    // 共通
    common: {
      loading: '読み込み中...',
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      add: '追加',
      close: '閉じる',
      confirm: '確認',
      back: '戻る',
      next: '次へ',
      search: '検索',
      filter: 'フィルター',
      all: 'すべて',
      online: 'オンライン',
      offline: 'オフライン',
      status: 'ステータス',
      actions: 'アクション',
      details: '詳細',
      settings: '設定',
      subtitle: 'アプリケーションサブタイトル',
    },

    // ナビゲーション
    nav: {
      dashboard: 'ダッシュボード',
      settings: '設定',
      logout: 'ログアウト',
    },

    // ログイン
    login: {
      title: 'ログイン',
      register: '新規登録',
      email: 'メールアドレス',
      password: 'パスワード',
      forgotPassword: 'パスワードを忘れた方',
      noAccount: 'アカウントをお持ちでない方',
      hasAccount: '既にアカウントをお持ちの方',
      loginButton: 'ログイン',
      registerButton: '登録',
    },

    // エラーメッセージ
    errors: {
      required: '必須項目です',
      invalid_email: '有効なメールアドレスを入力してください',
      network_error: 'ネットワークエラーが発生しました',
      unknown_error: '予期しないエラーが発生しました',
    },
  },

  en: {
    // Common
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      close: 'Close',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
      online: 'Online',
      offline: 'Offline',
      status: 'Status',
      actions: 'Actions',
      details: 'Details',
      settings: 'Settings',
      subtitle: 'Application Subtitle',
    },

    // Navigation
    nav: {
      dashboard: 'Dashboard',
      settings: 'Settings',
      logout: 'Logout',
    },

    // Login
    login: {
      title: 'Login',
      register: 'Sign Up',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot password?',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      loginButton: 'Login',
      registerButton: 'Sign Up',
    },

    // Error messages
    errors: {
      required: 'This field is required',
      invalid_email: 'Please enter a valid email address',
      network_error: 'A network error occurred',
      unknown_error: 'An unexpected error occurred',
    },
  },
} as const;

// 型定義
export type Language = keyof typeof translations;

// リテラル型を string に変換するヘルパー型
// これがないと Type '"English text"' is not assignable to type '"日本語テキスト"' エラーが発生
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string;
};

export type TranslationKeys = DeepStringify<typeof translations.ja>;
