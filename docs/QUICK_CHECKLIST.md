# 開発クイックチェックリスト

> 新規プロジェクト開始時に確認する項目リスト

## プロジェクト初期化

```bash
# 1. Node.js バージョン固定
echo "20.11.0" > .nvmrc
nvm use

# 2. Next.js プロジェクト作成
npx create-next-app@14.2.21 frontend --typescript --tailwind --app

# 3. package.json のバージョン固定を確認
# ^ や ~ を削除して固定バージョンにする
```

## 必須チェック項目

### 初期設定
- [ ] `.nvmrc` ファイル作成（Node.js 20.x）
- [ ] `package.json` の `engines` 設定
- [ ] 依存パッケージのバージョン固定（^ を削除）
- [ ] TypeScript strict mode 有効
- [ ] `.env.example` 作成

### フロントエンド構造
- [ ] `src/lib/i18n/` ディレクトリ作成
- [ ] `translations.ts` - 翻訳定義（JA/EN）
- [ ] `context.tsx` - Provider, useI18n, LanguageSwitcher
- [ ] `index.ts` - エクスポート
- [ ] `providers.tsx` で I18nProvider をラップ

### i18n 実装
- [ ] `DeepStringify` 型ヘルパー使用
- [ ] 全ハードコード日本語を翻訳キーに置換
- [ ] 日付フォーマットで `language` 考慮
- [ ] LanguageSwitcher を Header に配置

### API 連携
- [ ] `NEXT_PUBLIC_API_URL` 環境変数使用
- [ ] CORS 設定（バックエンド側）
- [ ] ヘルスチェックエンドポイント `/health`

### デプロイ
- [ ] Vercel 環境変数設定
- [ ] Railway 環境変数設定
- [ ] CORS に本番 URL 追加
- [ ] ビルド成功確認

## 絶対やらないこと

| NG | 理由 |
|----|------|
| `^` でバージョン指定 | 互換性破壊 |
| 絵文字フラグ使用 | フォント依存で表示されない |
| ハードコード日本語 | i18n 対応不可 |
| `any` 型の多用 | 型安全性が失われる |
| 環境変数ハードコード | セキュリティリスク |

## コピペ用テンプレート

### i18n 型定義
```typescript
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string;
};
export type TranslationKeys = DeepStringify<typeof translations.ja>;
```

### Chart.js 型定義
```typescript
import { ChartOptions, TooltipItem } from 'chart.js';

const options: ChartOptions<'line'> = {
  plugins: {
    tooltip: {
      callbacks: {
        label: (context: TooltipItem<'line'>) => {
          return `${context.parsed.y}`;
        }
      }
    }
  }
};
```

### 環境変数
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

---

詳細は [DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md) を参照
