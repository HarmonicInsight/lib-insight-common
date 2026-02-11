# InterviewInsight Windows化 + insight-common 統合プロンプト

## このプロンプトを InterviewInsight リポジトリの Claude Code で実行してください

---

```
InterviewInsight を Windows デスクトップアプリに変換し、insight-common を統合してください。

## 現状
- 技術スタック: Next.js (Web)
- 目標: Windowsデスクトップアプリ

## 方針
- **Tauri + React + TypeScript** で再構築
- SalesInsight と技術スタックを統一
- 既存の Next.js コードから React コンポーネント・ロジックを移行

## 製品情報
- 製品名: InterviewInsight
- 製品コード: IVIN
- 旧名: AutoInterview（必要に応じてリネーム）

---

## Step 1: 現状確認

まず現在のプロジェクト構成を確認してください:
- package.json の内容
- src/ または app/ のディレクトリ構成
- 主要コンポーネントの一覧
- 使用している状態管理（Redux, Zustand, Context等）
- API通信の方法（fetch, axios, tRPC等）

---

## Step 2: Tauri プロジェクト作成

### 2.1 Tauri CLI インストール
npm install -g @tauri-apps/cli

### 2.2 プロジェクト初期化
既存プロジェクトに Tauri を追加:
npm install @tauri-apps/api
npm create tauri-app@latest -- --template react-ts

または新規作成後に既存コードを移行

### 2.3 ディレクトリ構成
以下の構成を目指す:
InterviewInsight/
├── apps/
│   └── desktop/           # Tauri アプリ
│       ├── src/           # React コード
│       ├── src-tauri/     # Rust コード
│       ├── vite.config.ts
│       └── tsconfig.json
├── packages/              # 共通パッケージ（必要に応じて）
│   └── core/             # InterviewInsight 固有ロジック
├── insight-common/        # submodule
└── package.json

---

## Step 3: Next.js から React への移行

### 3.1 移行が必要な項目
- pages/ → 通常の React コンポーネント + React Router
- API Routes → Tauri Commands (Rust) または直接 fetch
- next/image → 通常の img タグまたは最適化ライブラリ
- next/link → React Router Link
- getServerSideProps/getStaticProps → useEffect + fetch

### 3.2 状態管理の維持
既存の状態管理（Redux, Zustand等）はそのまま使用可能

### 3.3 スタイリング
- Tailwind CSS → そのまま使用可能
- CSS Modules → そのまま使用可能
- styled-components → そのまま使用可能

---

## Step 4: insight-common 統合

### 4.1 Submodule 追加
git submodule add https://github.com/HarmonicInsight/insight-common.git

### 4.2 tsconfig.json 設定
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@insight/license": ["./insight-common/license/typescript"],
      "@insight/i18n": ["./insight-common/i18n"],
      "@insight/utils": ["./insight-common/utils/typescript"],
      "@insight/errors": ["./insight-common/errors"],
      "@insight/brand/*": ["./insight-common/brand/*"],
      "@insight/ui/*": ["./insight-common/ui/*"],
      "@insight/config/*": ["./insight-common/config/*"]
    }
  },
  "include": ["src/**/*", "insight-common/**/*"]
}

### 4.3 vite.config.ts 設定
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@insight/license': path.resolve(__dirname, './insight-common/license/typescript'),
      '@insight/i18n': path.resolve(__dirname, './insight-common/i18n'),
      '@insight/utils': path.resolve(__dirname, './insight-common/utils/typescript'),
      '@insight/errors': path.resolve(__dirname, './insight-common/errors'),
      '@insight/brand': path.resolve(__dirname, './insight-common/brand'),
      '@insight/ui': path.resolve(__dirname, './insight-common/ui'),
      '@insight/config': path.resolve(__dirname, './insight-common/config'),
    }
  },
  clearScreen: false,
  server: {
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});

---

## Step 5: ライセンス管理実装

### 5.1 src/lib/license-manager.ts 作成
import { LicenseValidator, getFeatureLimits, type LicenseTier, type FeatureLimits } from '@insight/license';

const PRODUCT_CODE = 'IVIN';
const LICENSE_STORAGE_KEY = 'interview_insight_license';

class LicenseManager {
  private validator: LicenseValidator;
  private currentTier: LicenseTier | null = null;
  private expiresAt: Date | null = null;

  constructor() {
    this.validator = new LicenseValidator();
  }

  async initialize(): Promise<void> {
    const storedKey = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (storedKey) {
      await this.activate(storedKey);
    }
  }

  async activate(licenseKey: string): Promise<{ success: boolean; message: string }> {
    const result = this.validator.validate(licenseKey, PRODUCT_CODE);
    if (!result.isValid) {
      return { success: false, message: result.errorMessage || '無効なライセンスキーです' };
    }
    this.currentTier = result.tier!;
    this.expiresAt = result.expiresAt || null;
    localStorage.setItem(LICENSE_STORAGE_KEY, licenseKey);
    return { success: true, message: 'ライセンスを有効化しました' };
  }

  deactivate(): void {
    this.currentTier = null;
    this.expiresAt = null;
    localStorage.removeItem(LICENSE_STORAGE_KEY);
  }

  get isLicensed(): boolean { return this.currentTier !== null; }
  get tier(): LicenseTier | null { return this.currentTier; }
  get limits(): FeatureLimits | null {
    return this.currentTier ? getFeatureLimits(this.currentTier) : null;
  }

  hasFeature(feature: keyof FeatureLimits): boolean {
    if (!this.limits) return false;
    const value = this.limits[feature];
    return typeof value === 'boolean' ? value : value > 0;
  }
}

export const licenseManager = new LicenseManager();

---

## Step 6: i18n プロバイダー実装

### 6.1 src/providers/I18nProvider.tsx 作成
import React, { createContext, useContext, useState, useEffect } from 'react';
import { t as translate, setLocale, detectLocale, type Locale } from '@insight/i18n';

interface I18nContextType {
  locale: Locale;
  t: typeof translate;
  changeLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

  useEffect(() => {
    setLocale(locale);
  }, [locale]);

  const changeLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  return (
    <I18nContext.Provider value={{ locale, t: translate, changeLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}

---

## Step 7: 機能制限ゲート実装

### 7.1 src/components/FeatureGate.tsx 作成
import React from 'react';
import { licenseManager } from '@/lib/license-manager';
import type { FeatureLimits } from '@insight/license';

interface FeatureGateProps {
  feature: keyof FeatureLimits;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  if (!licenseManager.hasFeature(feature)) {
    return fallback ? <>{fallback}</> : null;
  }
  return <>{children}</>;
}

---

## Step 8: ブランドカラー適用

### 8.1 InterviewInsight のカラー
Primary: #DC2626 (赤系)
Secondary: #B91C1C

### 8.2 Tailwind 設定 (tailwind.config.js)
import colors from './insight-common/brand/colors.json';

export default {
  theme: {
    extend: {
      colors: {
        primary: colors.products.interviewInsight.primary,
        secondary: colors.products.interviewInsight.secondary,
        ...colors.semantic,
      }
    }
  }
};

---

## Step 9: UI構造適用

### 9.1 メニュー構造を適用
insight-common/ui/menu-structure.json の productSpecific.interviewInsight を参照:
- 面接一覧 (interviews)
- 評価 (evaluation)
- 質問集 (questions)

### 9.2 設定画面構造
insight-common/ui/menu-structure.json の settings を参照して統一

---

## Step 10: Tauri 設定

### 10.1 src-tauri/tauri.conf.json
{
  "productName": "InterviewInsight",
  "identifier": "jp.h-insight.interview-insight",
  "version": "1.0.0",
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "InterviewInsight",
        "width": 1280,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}

---

## Step 11: テスト実行

### 11.1 開発サーバー起動
npm run tauri dev

### 11.2 ビルドテスト
npm run tauri build

---

## Step 12: コミット

変更をコミットしてください:
git add .
git commit -m "feat: Convert to Tauri desktop app with insight-common integration"
```

---

## 完成後のディレクトリ構成

```
InterviewInsight/
├── apps/
│   └── desktop/
│       ├── src/
│       │   ├── components/
│       │   │   ├── FeatureGate.tsx
│       │   │   └── ...（既存コンポーネント移行）
│       │   ├── lib/
│       │   │   └── license-manager.ts
│       │   ├── providers/
│       │   │   └── I18nProvider.tsx
│       │   ├── pages/            # React Router 用
│       │   │   ├── Home.tsx
│       │   │   ├── Interviews.tsx
│       │   │   ├── Evaluation.tsx
│       │   │   └── Settings.tsx
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── src-tauri/
│       │   ├── src/
│       │   │   └── main.rs
│       │   ├── Cargo.toml
│       │   └── tauri.conf.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── package.json
├── insight-common/              # submodule
├── .gitmodules
└── README.md
```

---

## SalesInsight との技術統一

| 項目 | SalesInsight | InterviewInsight |
|------|-------------|-----------------|
| フレームワーク | Tauri | Tauri |
| フロントエンド | React + TypeScript | React + TypeScript |
| ビルドツール | Vite | Vite |
| スタイリング | Tailwind CSS | Tailwind CSS |
| 状態管理 | (プロジェクトに依存) | (プロジェクトに依存) |
| ライセンス | @insight/license | @insight/license |
| i18n | @insight/i18n | @insight/i18n |
