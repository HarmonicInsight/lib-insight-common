# 新しいサイトの追加ガイド

HARMONIC insight の新しいWebサイトを追加する手順

---

## 概要

新しいサイトを追加すると、自動的に以下が更新されます：
- グローバルナビゲーション（`showInGlobalNav: true` の場合）
- サイトフッター（`showInFooter: true` の場合）
- サイト一覧API

### 現在の4サイト構成

| ID | サイト名 | URL | カテゴリ |
|----|----------|-----|----------|
| `corporate` | ハーモニックインサイト | h-insight.jp | corporate |
| `insight-office` | Insight Office | www.insight-office.com | product |
| `novels` | Insight Novels | www.insight-novels.com | media |
| `personal` | 瀬田博之 | erikhiroyuki.com | personal |

---

## 手順

### Step 1: SiteId の追加

`ui/web/config/sites.ts` の `SiteId` 型に新しいIDを追加：

```typescript
export type SiteId =
  | 'corporate'
  | 'insight-office'
  | 'novels'
  | 'personal'
  | 'newsite';     // ← 追加
```

### Step 2: サイト設定の追加

同ファイルの `SITES` 配列に設定を追加：

```typescript
export const SITES: SiteConfig[] = [
  // ... 既存のサイト ...

  // === 新しいサイト ===
  {
    id: 'newsite',
    name: '新サイト',
    nameEn: 'New Site',
    url: 'https://newsite.example.com',
    description: 'サイトの説明文（日本語）',
    descriptionEn: 'Site description (English)',
    category: 'media',  // 'corporate' | 'product' | 'media' | 'personal'
    showInGlobalNav: false,
    showInFooter: true,
    order: 25,  // 表示順序（小さいほど先）
    pages: [    // サイト内ページ（オプション）
      { name: 'ページ名', nameEn: 'Page Name', path: '/page', showInFooter: true },
    ],
  },
];
```

### Step 3: コミット & プッシュ

```bash
cd insight-common
git add ui/web/config/sites.ts
git commit -m "feat: Add newsite to site configuration"
git push origin main
```

### Step 4: 各サイトで更新

insight-common を使用している各サイトで更新：

```bash
# サブモジュール更新（サブモジュール使用の場合）
git submodule update --remote insight-common
git add insight-common
git commit -m "Update insight-common"

# または NPM パッケージ更新
npm update @harmonic-insight/ui
```

---

## 設定オプション

### SiteConfig インターフェース

| プロパティ | 型 | 説明 |
|-----------|------|------|
| `id` | `SiteId` | サイトを識別する一意のID |
| `name` | `string` | サイト名（日本語） |
| `nameEn` | `string` | サイト名（英語） |
| `url` | `string` | サイトのURL |
| `description` | `string` | サイトの説明文（日本語） |
| `descriptionEn` | `string` | サイトの説明文（英語） |
| `category` | `SiteCategory` | サイトカテゴリ |
| `showInGlobalNav` | `boolean` | グローバルナビに表示するか |
| `showInFooter` | `boolean` | フッターに表示するか |
| `order` | `number` | 表示順序（小さいほど先） |
| `pages` | `SitePage[]` | サイト内の主要ページ（オプション） |

### SiteCategory

| カテゴリ | 説明 | フッター表示名 |
|----------|------|----------------|
| `corporate` | コーポレートサイト | 会社情報 |
| `product` | 製品・サービス | 製品・サービス |
| `media` | メディア・コンテンツ | メディア |
| `personal` | 個人・コンサルタント | コンサルタント |

### order 値の目安

| 範囲 | 用途 |
|------|------|
| 0-9 | コーポレート |
| 10-19 | 製品・サービス |
| 20-29 | メディア |
| 30-39 | 個人・その他 |
| 40+ | 予備 |

---

## 新サイトのセットアップ

新しいサイトで insight-common の UI を使用する場合：

### 1. パッケージインストール

```bash
npm install @harmonic-insight/ui
```

### 2. レイアウトに組み込み

```tsx
// app/layout.tsx または _app.tsx
import { GlobalNav, SiteFooter } from '@harmonic-insight/ui';
import '@harmonic-insight/ui/styles/base.css';
import '@harmonic-insight/ui/styles/variables.css';

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <GlobalNav currentSiteId="newsite" />
        <main>{children}</main>
        <SiteFooter currentSiteId="newsite" />
      </body>
    </html>
  );
}
```

### 3. カスタムカラーの適用（オプション）

```css
/* app/globals.css */
:root {
  --hi-nav-accent: #your-brand-color;
  --hi-footer-accent: #your-brand-color;
}
```

---

## チェックリスト

新サイト追加時のチェックリスト：

- [ ] `SiteId` 型にIDを追加
- [ ] `SITES` 配列に設定を追加
- [ ] `descriptionEn` を含む英語名が設定されているか確認
- [ ] `order` 値が適切か確認
- [ ] `category` が正しいか確認
- [ ] `showInGlobalNav` / `showInFooter` が意図通りか確認
- [ ] insight-common をコミット & プッシュ
- [ ] 既存サイトで insight-common を更新
- [ ] 新サイトで UI コンポーネントを組み込み
- [ ] ローカルで動作確認
- [ ] 本番デプロイ

---

## トラブルシューティング

### サイトがナビゲーションに表示されない

1. `showInGlobalNav: true` になっているか確認
2. insight-common が最新か確認
3. ブラウザキャッシュをクリア

### フッターの順序がおかしい

1. `order` 値を確認
2. 同じ `order` 値のサイトがないか確認

### TypeScript エラー

1. `SiteId` 型に新しいIDを追加したか確認
2. TypeScript を再起動（VSCode: Cmd+Shift+P → "Restart TS Server"）
