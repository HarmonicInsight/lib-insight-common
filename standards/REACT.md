# React / Next.js 開発標準

> Web アプリケーション開発時の必須チェックリスト

## 開発開始時チェックリスト

### 1. プロジェクト構成

```
your-app/
├── lib/
│   ├── colors.ts             # カラー定義
│   └── license/
│       ├── types.ts          # 型定義
│       └── license-manager.ts # ライセンス管理
├── components/
│   └── license/
│       └── LicenseView.tsx   # ライセンス画面
├── styles/
│   └── globals.css           # CSS 変数定義
└── tailwind.config.js        # Tailwind 設定（使用時）
```

### 2. カラー定義 (colors.ts)

```typescript
/**
 * Insight Series カラー定義 - Ivory & Gold Theme
 */
export const colors = {
  // Background (Ivory)
  background: {
    primary: '#FAF8F5',
    secondary: '#F3F0EB',
    card: '#FFFFFF',
    hover: '#EEEBE5',
  },

  // Brand Primary (Gold)
  brand: {
    primary: '#B8942F',
    primaryHover: '#8C711E',
    primaryLight: '#F0E6C8',
  },

  // Semantic
  semantic: {
    success: '#16A34A',
    warning: '#CA8A04',
    error: '#DC2626',
    info: '#2563EB',
  },

  // Text
  text: {
    primary: '#1C1917',
    secondary: '#57534E',
    tertiary: '#A8A29E',
    accent: '#8C711E',
  },

  // Border
  border: {
    default: '#E7E2DA',
    light: '#F3F0EB',
  },

  // Plan colors
  plan: {
    free: '#A8A29E',
    trial: '#2563EB',
    biz: '#16A34A',
    ent: '#7C3AED',
  },
} as const;
```

### 3. CSS 変数定義 (globals.css)

```css
:root {
  /* Background (Ivory) */
  --bg-primary: #FAF8F5;
  --bg-secondary: #F3F0EB;
  --bg-card: #FFFFFF;
  --bg-hover: #EEEBE5;

  /* Brand Primary (Gold) */
  --primary: #B8942F;
  --primary-hover: #8C711E;
  --primary-light: #F0E6C8;

  /* Semantic */
  --success: #16A34A;
  --warning: #CA8A04;
  --error: #DC2626;
  --info: #2563EB;

  /* Text */
  --text-primary: #1C1917;
  --text-secondary: #57534E;
  --text-tertiary: #A8A29E;
  --text-accent: #8C711E;

  /* Border */
  --border: #E7E2DA;
  --border-light: #F3F0EB;
}
```

### 4. Tailwind Config（使用時）

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FAF8F5',
          100: '#F3F0EB',
          200: '#EEEBE5',
        },
        gold: {
          50: '#FDF9EF',
          100: '#F0E6C8',
          500: '#B8942F',
          600: '#8C711E',
          700: '#6B5518',
        },
        stone: {
          600: '#57534E',
          900: '#1C1917',
        },
      },
    },
  },
};
```

---

## 必須チェックリスト

### デザイン（トンマナ）

- [ ] `colors.ts` が Ivory & Gold テーマに準拠している
- [ ] **Primary (#B8942F)** が製品タイトル、アクセントに使用されている
- [ ] **Background (#FAF8F5)** がメイン背景に使用されている
- [ ] ハードコードされた色がない（変数/定数経由）
- [ ] 青色 (#2563EB) がプライマリとして使用されて**いない**
- [ ] カードは白背景 + border-radius: 12px (rounded-xl)
- [ ] テキストは Stone 系の暖色（#1C1917, #57534E）

### ライセンス

- [ ] ライセンス画面が Insight Slides 形式に準拠
  - [ ] 製品名が中央に Gold 色で表示
  - [ ] 現在のプランが大きく中央に表示
  - [ ] 機能一覧セクションがある
  - [ ] ライセンス認証セクション（メール + キー入力）
  - [ ] アクティベート / クリア ボタン

### 製品コード

- [ ] 製品コードが `config/products.ts` に登録されている
- [ ] `CLAUDE.md` の製品コード一覧に追加されている

---

## コンポーネント例

### ライセンス画面

```tsx
import { colors } from '@/lib/colors';

export function LicenseView() {
  return (
    <div className="p-8" style={{ backgroundColor: colors.background.primary }}>
      {/* Product Title */}
      <h1
        className="text-2xl font-bold text-center mb-6"
        style={{ color: colors.brand.primary }}
      >
        Insight Product Name
      </h1>

      {/* Current Plan */}
      <div className="text-center mb-6">
        <p style={{ color: colors.text.secondary }}>現在のプラン</p>
        <p
          className="text-4xl font-bold"
          style={{ color: colors.brand.primary }}
        >
          BIZ
        </p>
        <p style={{ color: colors.text.secondary }}>
          有効期限: 2027年01月31日
        </p>
      </div>

      {/* Feature List */}
      <div
        className="rounded-xl p-4 mb-6"
        style={{
          backgroundColor: colors.background.card,
          border: `1px solid ${colors.border.default}`,
        }}
      >
        <h2
          className="font-bold mb-4"
          style={{ color: colors.text.primary }}
        >
          機能一覧
        </h2>
        {/* Feature items */}
      </div>

      {/* License Form */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: colors.background.card,
          border: `1px solid ${colors.border.default}`,
        }}
      >
        <h2
          className="font-bold mb-4"
          style={{ color: colors.text.primary }}
        >
          ライセンス認証
        </h2>
        {/* Form inputs */}
        <button
          className="px-6 py-2 rounded-lg text-white"
          style={{ backgroundColor: colors.brand.primary }}
        >
          アクティベート
        </button>
      </div>
    </div>
  );
}
```

---

## 参考実装

- **Sales Insight**: `app-sales-insight` リポジトリ
- **Interview Insight**: `app-interview-insight` リポジトリ
