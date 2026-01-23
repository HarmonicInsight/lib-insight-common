# React/Next.js i18n テンプレート

Next.js App Router 用の国際化（i18n）テンプレートです。

## セットアップ

### 1. ファイルをコピー

```bash
# プロジェクトの src/lib/i18n/ にコピー
cp -r insight-common/i18n/react-template/* your-project/src/lib/i18n/
```

### 2. providers.tsx を作成/更新

```tsx
// src/app/providers.tsx
'use client';

import { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      {children}
    </I18nProvider>
  );
}
```

### 3. layout.tsx でラップ

```tsx
// src/app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### 4. コンポーネントで使用

```tsx
'use client';

import { useI18n, LanguageSwitcher } from '@/lib/i18n';

export function MyComponent() {
  const { t, language } = useI18n();

  return (
    <div>
      <LanguageSwitcher />
      <p>{t.common.loading}</p>
    </div>
  );
}
```

## 翻訳の追加

`translations.ts` に翻訳キーを追加します。

```typescript
export const translations = {
  ja: {
    myFeature: {
      title: '機能タイトル',
      description: '機能の説明',
    },
  },
  en: {
    myFeature: {
      title: 'Feature Title',
      description: 'Feature description',
    },
  },
} as const;
```

## 注意事項

1. **DeepStringify 型ヘルパー**: 必ず使用してください。これがないとTypeScriptエラーが発生します。

2. **ja と en の構造一致**: 両方の言語で同じキー構造を維持してください。

3. **as TranslationKeys**: context.tsx で `translations[language] as TranslationKeys` のキャストが必要です。

4. **絵文字フラグは使わない**: 環境依存で表示されないため、テキスト（JA/EN）を使用してください。
