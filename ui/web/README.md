# HARMONIC insight Web UI

HARMONIC insight の全Webサイトで共通利用するUIコンポーネント・スタイル・設定

## クイックスタート

### 1. パッケージインストール

```bash
npm install @harmonic-insight/ui
```

### 2. コンポーネント使用

```tsx
import { GlobalNav, SiteFooter } from '@harmonic-insight/ui';
import '@harmonic-insight/ui/styles/base.css';
import '@harmonic-insight/ui/styles/variables.css';

function App() {
  return (
    <>
      <GlobalNav currentSiteId="insight-office" />
      <main>
        {/* コンテンツ */}
      </main>
      <SiteFooter currentSiteId="insight-office" />
    </>
  );
}
```

---

## ディレクトリ構成

```
ui/web/
├── components/
│   ├── GlobalNav/        # グローバルナビゲーション
│   │   ├── index.tsx
│   │   └── GlobalNav.module.css
│   └── SiteFooter/       # サイトフッター
│       ├── index.tsx
│       └── SiteFooter.module.css
├── config/
│   └── sites.ts          # サイト設定
├── scripts/
│   └── generate-css-variables.ts
├── styles/
│   ├── base.css          # ベーススタイル
│   └── variables.css     # CSS変数（自動生成）
├── index.ts              # エクスポート
└── README.md
```

---

## コンポーネント

### GlobalNav

グローバルナビゲーションコンポーネント

```tsx
import { GlobalNav } from '@harmonic-insight/ui';

<GlobalNav
  currentSiteId="corporate"     // 現在のサイトID
  darkMode={false}              // ダークモード（オプション）
  onLogoClick={() => {}}        // ロゴクリック時（オプション）
/>
```

**Props:**

| プロパティ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| `currentSiteId` | `SiteId` | ✓ | 現在のサイトを識別するID |
| `darkMode` | `boolean` | | ダークモードの有効化 |
| `onLogoClick` | `() => void` | | ロゴクリック時のカスタムハンドラー |
| `className` | `string` | | 追加のCSSクラス |

### SiteFooter

サイトフッターコンポーネント。4サイト間のクロスリンクを自動生成。

```tsx
import { SiteFooter } from '@harmonic-insight/ui';

<SiteFooter
  currentSiteId="corporate"    // 現在のサイトID
  darkMode={false}             // ダークモード（オプション）
  additionalLinks={[           // 追加リンク（オプション）
    { label: 'カスタムリンク', href: '/custom' }
  ]}
/>
```

**Props:**

| プロパティ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| `currentSiteId` | `SiteId` | ✓ | 現在のサイトを識別するID |
| `darkMode` | `boolean` | | ダークモードの有効化 |
| `copyrightYear` | `number` | | コピーライト年（デフォルト: 現在年） |
| `additionalLinks` | `Array<{label, href}>` | | 法的情報に追加するリンク |
| `className` | `string` | | 追加のCSSクラス |

---

## サイト設定

### 4サイト構成

| ID | サイト名 | URL | カテゴリ | ナビ表示 |
|----|----------|-----|----------|:--------:|
| `corporate` | ハーモニックインサイト | h-insight.jp | corporate | ✓ |
| `insight-office` | Insight Office | www.insight-office.com | product | ✓ |
| `novels` | Insight Novels | www.insight-novels.com | media | |
| `personal` | 瀬田博之 | erikhiroyuki.com | personal | |

### サイト間導線

```
                    ┌─────────────┐
                    │ h-insight.jp │ ← 信頼の起点
                    │  法人サイト   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
    ┌──────────────┐ ┌──────────┐ ┌──────────────┐
    │insight-office│ │ novels   │ │erikhiroyuki  │
    │ 製品 → 受注  │ │ 技術力証明│ │ 人格信頼     │
    └──────────────┘ └──────────┘ └──────────────┘
```

### ユーティリティ関数

```typescript
import {
  getSite,
  getGlobalNavSites,
  getFooterSites,
  getSitesByCategory,
  getCrossSiteLinks,
  getFooterPages,
} from '@harmonic-insight/ui';

// 特定のサイト設定を取得
const officeSite = getSite('insight-office');

// ナビゲーションに表示するサイト一覧
const navSites = getGlobalNavSites();

// フッターに表示するサイト一覧
const footerSites = getFooterSites();

// カテゴリ別にサイトを取得
const productSites = getSitesByCategory('product');

// 他サイトへのクロスリンク
const crossLinks = getCrossSiteLinks('corporate');

// サイト内ページリンク（フッター用）
const pages = getFooterPages('insight-office');
```

---

## スタイル

### CSS変数

`styles/variables.css` には以下のCSS変数が定義されています：

```css
:root {
  /* カラー */
  --hi-color-primary: #2563eb;
  --hi-color-secondary: #1d4ed8;
  --hi-color-success: #16a34a;
  --hi-color-warning: #d97706;
  --hi-color-error: #dc2626;

  /* タイポグラフィ */
  --hi-font-sans: 'Noto Sans JP', 'Inter', system-ui, sans-serif;
  --hi-font-size-base: 1rem;

  /* スペーシング */
  --hi-spacing-4: 16px;
  --hi-spacing-6: 24px;
  --hi-spacing-8: 32px;

  /* その他 */
  --hi-radius-md: 8px;
  --hi-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}
```

### カスタマイズ

コンポーネント固有のCSS変数でカスタマイズ可能：

```css
:root {
  /* ナビゲーション */
  --hi-nav-height: 64px;
  --hi-nav-bg: #ffffff;
  --hi-nav-accent: #2563eb;

  /* フッター */
  --hi-footer-bg: #f5f5f5;
  --hi-footer-accent: #2563eb;
}
```

---

## 新しいサイトの追加

👉 詳細は [ADD_NEW_SITE.md](./ADD_NEW_SITE.md) を参照

### 簡易手順

1. `config/sites.ts` の `SiteId` 型にIDを追加
2. `SITES` 配列にサイト設定を追加
3. insight-common を更新してコミット
4. 各サイトで `npm update @harmonic-insight/ui`

---

## 開発

### CSS変数の再生成

```bash
cd ui/web
npx ts-node scripts/generate-css-variables.ts
```

### ビルド

```bash
npm run build
```

---

## 関連ドキュメント

- [新サイト追加ガイド](./ADD_NEW_SITE.md)
- [デザインシステム](../../brand/design-system.json)
- [カラー定義](../../brand/colors.json)
- [トンマナガイド](../../brand/voice-guidelines.md)
