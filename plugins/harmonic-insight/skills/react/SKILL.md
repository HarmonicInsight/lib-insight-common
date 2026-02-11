---
name: react
description: React / Next.js Web アプリの開発標準。.tsx、.jsx、.ts ファイル、Tailwind CSS、Next.js 設定の作業時に自動適用。カラー定義、ライセンス画面、API Gateway パターンを提供。
allowed-tools: Read, Grep, Glob, Bash
---

# React / Next.js 開発標準

対象製品: SalesInsight, InterviewInsight (Tauri + React), Web ダッシュボード系

## プロジェクト構成（必須）

```
your-app/
├── lib/
│   ├── colors.ts              # Ivory & Gold カラー
│   └── license/
│       ├── types.ts           # ライセンス型定義
│       └── license-manager.ts
├── components/
│   └── license/
│       └── LicenseView.tsx    # ライセンス画面
├── styles/
│   └── globals.css            # CSS 変数
└── tailwind.config.js
```

## カラー定義

### colors.ts
```typescript
import colors from '@/insight-common/brand/colors.json';
export { colors };
// colors.brand.primary → "#B8942F"
// colors.background.primary → "#FAF8F5"
```

### globals.css
```css
:root {
  --color-primary: #B8942F;
  --color-primary-hover: #8C711E;
  --color-bg-primary: #FAF8F5;
  --color-bg-card: #FFFFFF;
  --color-text-primary: #1C1917;
  --color-text-secondary: #57534E;
  --color-border: #E7E2DA;
}
```

### tailwind.config.js
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: { primary: '#B8942F', hover: '#8C711E', light: '#F0E6C8' },
        ivory: { DEFAULT: '#FAF8F5', secondary: '#F3F0EB' },
      },
    },
  },
};
```

## API は必ず withGateway()

```typescript
import { withGateway } from '@/insight-common/infrastructure/api/gateway';

export default withGateway(handler, {
  requireAuth: true,
  rateLimit: 60,
  audit: true,
});
```

## 認証

```typescript
import { useAuth } from '@/insight-common/infrastructure/auth/firebase-client';
// Firebase UID が全システムの主キー
```

## ライセンス画面

Insight Slides 形式に準拠:
- 製品名: Gold (#B8942F) 色、中央配置
- プラン表示、有効期限、機能一覧
- メールアドレス＋ライセンスキー入力
- アクティベート / クリアボタン

## 禁止事項

- Blue (#2563EB) をプライマリに使用
- `withGateway()` なしの API エンドポイント
- クライアント側での権限判定
- `console.log`（`logAudit()` を使用）
- 独自認証実装

## 詳細リファレンス

`insight-common/standards/REACT.md` に完全なガイドあり。
