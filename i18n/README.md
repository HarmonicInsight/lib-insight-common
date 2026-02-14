# Insight Series i18n

Insight Series 製品群の共通多言語リソースです。

> **詳細なローカライゼーション標準**: `standards/LOCALIZATION.md` を参照してください。
> **ロケール設定・ストアメタデータ**: `config/localization.ts` を参照してください。

## 対応言語

| コード | 言語 | ステータス | フェーズ |
|--------|------|-----------|---------|
| `ja` | 日本語 | **必須** | Phase 1 |
| `en` | English | **必須** | Phase 1 |
| `ko` | 한국어 | 予定 | Phase 3 |
| `th` | ไทย | 予定 | Phase 2 |
| `vi` | Tiếng Việt | 予定 | Phase 2 |
| `zh` | 中文（简体） | 予定 | Phase 3 |

## ディレクトリ構成

```
i18n/
├── index.ts              # TypeScript i18n ヘルパー
├── __init__.py            # Python i18n ヘルパー
├── ja.json                # 日本語翻訳（デフォルト）
├── en.json                # 英語翻訳
├── README.md              # このファイル
└── react-template/        # React アプリ用テンプレート
    ├── context.tsx        # I18nProvider + useI18n + LanguageSwitcher
    ├── translations.ts    # 型安全な翻訳定義
    └── index.ts           # エクスポート
```

## 使用方法

### TypeScript

```typescript
import { t, setLocale, detectLocale } from '@insight/i18n';

// システムロケールを検出して設定
setLocale(detectLocale());

// 翻訳を取得
console.log(t('common.save'));        // "保存" or "Save"
console.log(t('license.title'));      // "ライセンス" or "License"

// パラメータ付き
console.log(t('license.trialDaysLeft', { days: 14 }));
// "トライアル残り14日" or "14 days left in trial"
```

### React

```tsx
// 1. translations.ts を i18n/react-template/ からコピー
// 2. context.tsx を i18n/react-template/ からコピー
// 3. I18nProvider でアプリをラップ

import { useI18n } from '@/lib/i18n';

function MyComponent() {
  const { t, language, setLanguage } = useI18n();
  return <button>{t.common.save}</button>;  // 型安全
}
```

### Python

```python
from insight_common.i18n import t, set_locale, detect_locale

# システムロケールを検出して設定
set_locale(detect_locale())

# 翻訳を取得
print(t('common.save'))        # "保存" or "Save"
print(t('license.title'))      # "ライセンス" or "License"

# パラメータ付き
print(t('license.trialDaysLeft', {'days': 14}))
# "トライアル残り14日" or "14 days left in trial"
```

### Android

Android は `strings.xml` リソースを使用します。テンプレートは `templates/android/` にあります。

```kotlin
// Compose での使用
Text(stringResource(R.string.save))           // ✅
Text(stringResource(R.string.photos_count, n)) // パラメータ付き
// Text("保存")                               // ❌ ハードコード禁止
```

## キー構造

```
common.*        # 共通UI要素（保存、キャンセル、削除 等）
license.*       # ライセンス関連（アクティベート、プラン名 等）
feature.*       # 機能制限関連（ロック、アップグレード 等）
auth.*          # 認証関連（ログイン、パスワード 等）
settings.*      # 設定画面（言語、テーマ 等）
file.*          # ファイル操作（開く、保存、エクスポート 等）
date.*          # 日付・時刻（フォーマット定義含む）
validation.*    # バリデーション（必須、文字数制限 等）
errors.*        # エラーメッセージ（ネットワーク、タイムアウト 等）
products.*      # 製品名（INSS, IOSH 等）
company.*       # 会社情報（著作権、利用規約 等）
```

## ロケール設定 API

```typescript
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  getRequiredLocales,
  getLocalesForPhase,
  getAndroidValuesDir,
  getPlayStoreLocale,
  validateStoreMetadata,
} from '@/insight-common/config/localization';

// 必須ロケール
getRequiredLocales();  // [ja, en]

// Phase 2 までのロケール
getLocalesForPhase(2);  // [ja, en, th, vi]

// Android の values ディレクトリ
getAndroidValuesDir('en');  // 'values-en'

// Play Store メタデータの文字数検証
validateStoreMetadata('play', 'title', 'Insight Camera');
// { valid: true, length: 14, limit: 30 }
```

## 新しい言語の追加

1. `i18n/xx.json` を作成（`ja.json` をコピーして翻訳）
2. TypeScript: `index.ts` の `Locale` 型と `LOCALES` に追加
3. Python: `__init__.py` の `LOCALES` に追加
4. `config/localization.ts` の `SUPPORTED_LOCALES` の `status` を `'supported'` に変更
5. Android: `values-xx/strings.xml` を作成
6. iOS: `Localizable.xcstrings` に言語を追加
7. React: `translations.ts` に言語を追加

> 詳細手順は `standards/LOCALIZATION.md` §7 を参照。
