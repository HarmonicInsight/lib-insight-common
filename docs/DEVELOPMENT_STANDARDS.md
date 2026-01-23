# Harmonic Insight 開発標準ガイド

> 本ドキュメントは InsightIoT プロジェクトでの経験を基に、今後の開発でスムーズに進めるための標準とチェックリストをまとめたものです。

## 目次

1. [技術スタック標準](#技術スタック標準)
2. [やってはいけないこと（アンチパターン）](#やってはいけないことアンチパターン)
3. [フロントエンド開発標準](#フロントエンド開発標準)
4. [バックエンド開発標準](#バックエンド開発標準)
5. [デプロイメント標準](#デプロイメント標準)
6. [国際化（i18n）標準](#国際化i18n標準)
7. [開発開始チェックリスト](#開発開始チェックリスト)
8. [トラブルシューティング](#トラブルシューティング)

---

## 技術スタック標準

### 推奨構成（2025年以降）

| レイヤー | 技術 | バージョン | 備考 |
|---------|------|-----------|------|
| フロントエンド | Next.js | 14.x | App Router 必須 |
| 言語 | TypeScript | 5.x | strict mode 推奨 |
| スタイリング | Tailwind CSS | 3.x | |
| 状態管理 | Zustand | 4.x | 軽量で十分 |
| チャート | Chart.js + react-chartjs-2 | 4.x / 5.x | |
| バックエンド | Ruby on Rails | 7.x | API モードで使用 |
| データベース | PostgreSQL | 15+ | |
| ホスティング（FE） | Vercel | - | Next.js との相性最良 |
| ホスティング（BE） | Railway | - | Rails との相性良好 |

### バージョン固定ルール

```json
// package.json - 必ずバージョンを固定する
{
  "dependencies": {
    "next": "14.2.21",        // ^14.x ではなく固定
    "react": "18.2.0",        // ^18.x ではなく固定
    "chart.js": "4.4.1",      // メジャーバージョン固定
    "react-chartjs-2": "5.2.0"
  }
}
```

---

## やってはいけないこと（アンチパターン）

### 1. バージョン関連

| NG | 理由 | 正しい方法 |
|----|------|-----------|
| `^` や `~` でバージョン指定 | 意図しないアップデートで破壊的変更が入る | 固定バージョンを使用 |
| `npm install` で最新版を入れる | 互換性問題が発生 | `npm install package@x.x.x` で固定 |
| Node.js バージョンを指定しない | 環境差異でビルド失敗 | `.nvmrc` と `engines` で固定 |

### 2. Chart.js 関連（特に注意）

```typescript
// NG: 型定義が曖昧
const options = {
  plugins: {
    tooltip: {
      callbacks: {
        label: (context) => { ... }  // any型になる
      }
    }
  }
};

// OK: 明示的な型定義
import { ChartOptions, TooltipItem } from 'chart.js';

const options: ChartOptions<'line'> = {
  plugins: {
    tooltip: {
      callbacks: {
        label: (context: TooltipItem<'line'>) => {
          return `${context.parsed.y} dB`;
        }
      }
    }
  }
};
```

### 3. TypeScript 関連

```typescript
// NG: リテラル型の直接使用（i18nで問題発生）
type Translations = {
  title: '読み込み中...';  // リテラル型
};

// OK: string型にマッピング
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string;
};
type Translations = DeepStringify<typeof translations.ja>;
```

### 4. CSS/スタイリング関連

```tsx
// NG: Tailwind クラスが効かない場合がある
<div className="fixed top-4 right-4">  // 一部環境で効かない

// OK: インラインスタイルで確実に指定
<div
  className="fixed z-50"
  style={{ top: '1rem', right: '1rem' }}
>
```

### 5. API連携関連

```typescript
// NG: 環境変数なしでハードコード
const API_URL = 'https://api.example.com';

// OK: 環境変数 + フォールバック
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

### 6. 絵文字/フォント関連

```tsx
// NG: 絵文字フラグはフォント依存で表示されない場合がある
<button>🇯🇵</button>  // Windows/Linux で「JP」と表示される

// OK: SVGアイコンまたはテキストを使用
<button>JA</button>
// または
<JapanFlagSVG />
```

---

## フロントエンド開発標準

### ディレクトリ構成

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # 認証が必要なルート
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── providers.tsx    # Context Providers
│   │   └── globals.css
│   ├── components/          # 共通コンポーネント
│   │   ├── ui/              # 基本UI（Button, Input等）
│   │   └── features/        # 機能コンポーネント
│   ├── lib/                 # ユーティリティ
│   │   ├── api.ts           # API クライアント
│   │   ├── store.ts         # 状態管理
│   │   └── i18n/            # 国際化
│   │       ├── index.ts
│   │       ├── context.tsx
│   │       └── translations.ts
│   └── types/               # 型定義
│       └── index.ts
├── public/
├── .nvmrc                   # Node.js バージョン固定
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 必須設定ファイル

#### `.nvmrc`
```
20.11.0
```

#### `package.json` の `engines`
```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

#### `tsconfig.json` 推奨設定
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### コンポーネント実装ルール

```tsx
// 1. 'use client' は必要な場合のみ
'use client';

// 2. 型定義はファイル上部に
interface Props {
  title: string;
  onAction: () => void;
}

// 3. i18n は必ず使用
import { useI18n } from '@/lib/i18n';

export function MyComponent({ title, onAction }: Props) {
  const { t, language } = useI18n();

  // 4. 日付フォーマットは言語対応
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US');
  };

  return (
    <div>
      <h1>{t.section.title}</h1>
      {/* ... */}
    </div>
  );
}
```

---

## バックエンド開発標準

### Rails API 設定

```ruby
# config/application.rb
module ApiApp
  class Application < Rails::Application
    config.api_only = true

    # CORS設定（重要）
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins ENV.fetch('FRONTEND_URL', 'http://localhost:3000')
        resource '*',
          headers: :any,
          methods: [:get, :post, :put, :patch, :delete, :options, :head],
          credentials: true
      end
    end
  end
end
```

### 環境変数管理

```ruby
# 本番環境では必ず環境変数を使用
# NG: ハードコード
DATABASE_URL = "postgres://user:pass@localhost/db"

# OK: 環境変数
DATABASE_URL = ENV.fetch('DATABASE_URL')
```

---

## デプロイメント標準

### Vercel（フロントエンド）

#### `vercel.json`
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url"
  }
}
```

#### 必須環境変数
| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NEXT_PUBLIC_API_URL` | バックエンドAPIのURL | `https://api.example.railway.app` |

### Railway（バックエンド）

#### 必須環境変数
| 変数名 | 説明 |
|--------|------|
| `DATABASE_URL` | PostgreSQL接続URL（Railwayが自動設定） |
| `RAILS_ENV` | `production` |
| `SECRET_KEY_BASE` | Rails シークレットキー |
| `FRONTEND_URL` | Vercelのフロントエンド URL（CORS用） |

### Vercel ↔ Railway 連携の注意点

1. **CORS設定**: バックエンドでフロントエンドのドメインを許可
2. **HTTPS必須**: 本番環境では両方HTTPS
3. **環境変数の同期**: API URLが正しく設定されているか確認
4. **ヘルスチェック**: `/health` エンドポイントを用意

```ruby
# config/routes.rb
get '/health', to: proc { [200, {}, ['OK']] }
```

---

## 国際化（i18n）標準

### ファイル構成

```
src/lib/i18n/
├── index.ts          # エクスポート
├── context.tsx       # Provider, useI18n, LanguageSwitcher
└── translations.ts   # 翻訳データ
```

### translations.ts テンプレート

```typescript
export const translations = {
  ja: {
    common: {
      loading: '読み込み中...',
      save: '保存',
      cancel: 'キャンセル',
      // ...
    },
    nav: {
      dashboard: 'ダッシュボード',
      settings: '設定',
      logout: 'ログアウト',
    },
    // 各ページ/機能ごとにセクション分け
    dashboard: { ... },
    settings: { ... },
  },
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
    },
    nav: {
      dashboard: 'Dashboard',
      settings: 'Settings',
      logout: 'Logout',
    },
    dashboard: { ... },
    settings: { ... },
  },
} as const;

// 型定義（重要：リテラル型問題を回避）
export type Language = keyof typeof translations;

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string;
};

export type TranslationKeys = DeepStringify<typeof translations.ja>;
```

### context.tsx テンプレート

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKeys } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ja');

  useEffect(() => {
    const saved = localStorage.getItem('app_language') as Language;
    if (saved && (saved === 'ja' || saved === 'en')) {
      setLanguageState(saved);
    } else {
      // ブラウザ言語を検出
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('en')) {
        setLanguageState('en');
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  // 重要: as TranslationKeys でキャスト
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

// 言語切り替えコンポーネント（シンプル版）
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useI18n();

  return (
    <div className={`flex items-center text-sm ${className}`}>
      <button
        onClick={() => setLanguage('ja')}
        className={`px-2 py-1 rounded-l border transition ${
          language === 'ja'
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
        }`}
      >
        JA
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded-r border-t border-r border-b transition ${
          language === 'en'
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
        }`}
      >
        EN
      </button>
    </div>
  );
}
```

### i18n 実装チェックリスト

- [ ] `translations.ts` に全テキストを定義
- [ ] `DeepStringify` 型ヘルパーを使用
- [ ] `providers.tsx` で `I18nProvider` をラップ
- [ ] 全コンポーネントで `useI18n()` を使用
- [ ] ハードコードされた日本語テキストがない
- [ ] 日付フォーマットで `language` を考慮
- [ ] LanguageSwitcher を適切な位置に配置

---

## 開発開始チェックリスト

### プロジェクト初期化時

- [ ] Node.js バージョンを `.nvmrc` に固定
- [ ] `package.json` の `engines` を設定
- [ ] 依存パッケージのバージョンを固定（`^` を使わない）
- [ ] TypeScript strict mode を有効化
- [ ] ESLint + Prettier を設定
- [ ] `.gitignore` を適切に設定
- [ ] 環境変数テンプレート `.env.example` を作成

### フロントエンド開発開始時

- [ ] Next.js App Router を使用
- [ ] i18n 構造を最初から作成
- [ ] API クライアントを環境変数対応で作成
- [ ] 型定義ファイルを作成
- [ ] Tailwind CSS を設定
- [ ] 共通コンポーネント（Button, Input等）を作成

### バックエンド開発開始時

- [ ] Rails API モードで作成
- [ ] CORS を正しく設定
- [ ] ヘルスチェックエンドポイントを作成
- [ ] 環境変数を使用（ハードコードしない）
- [ ] データベースマイグレーション構成

### デプロイ前

- [ ] ビルドが成功することを確認
- [ ] 環境変数が正しく設定されているか確認
- [ ] CORS 設定が本番URLを許可しているか確認
- [ ] HTTPS が有効か確認
- [ ] エラーハンドリングが実装されているか確認

---

## トラブルシューティング

### ビルドエラー

| エラー | 原因 | 解決策 |
|--------|------|--------|
| `Type 'X' is not assignable to type 'Y'` | TypeScript リテラル型の不一致 | `DeepStringify` または `as` でキャスト |
| `Module not found` | パッケージ未インストールまたはパス間違い | `npm install` 確認、`@/` パス確認 |
| `Cannot use import statement outside a module` | ESM/CJS混在 | `next.config.js` で `transpilePackages` 設定 |

### ランタイムエラー

| エラー | 原因 | 解決策 |
|--------|------|--------|
| `useI18n must be used within an I18nProvider` | Provider未設定 | `providers.tsx` で `I18nProvider` をラップ |
| `CORS error` | バックエンドでCORS未設定 | `rack-cors` gem で設定 |
| `Failed to fetch` | API URL間違いまたはバックエンド停止 | 環境変数確認、Railway ログ確認 |

### 表示の問題

| 問題 | 原因 | 解決策 |
|------|------|--------|
| 絵文字が文字で表示される | フォント未対応 | SVGアイコンまたはテキストを使用 |
| Tailwind クラスが効かない | JIT コンパイル問題 | インラインスタイルを併用 |
| fixed 配置がずれる | 親要素の transform 等 | インラインスタイルで上書き |

---

## 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2026-01-23 | 1.0.0 | InsightIoT プロジェクトの経験を基に初版作成 |

---

## 関連ドキュメント

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - 環境構築ガイド
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - 統合ガイド
- [platform-standard.md](./platform-standard.md) - プラットフォーム標準

