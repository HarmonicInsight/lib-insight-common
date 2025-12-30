# Insight Series i18n

Insight Series 製品群の共通多言語リソースです。

## 対応言語

| コード | 言語 |
|--------|------|
| `ja` | 日本語 |
| `en` | English |

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

## キー構造

```
common.*        # 共通UI要素
license.*       # ライセンス関連
feature.*       # 機能制限関連
auth.*          # 認証関連
settings.*      # 設定画面
file.*          # ファイル操作
date.*          # 日付・時刻
validation.*    # バリデーション
errors.*        # エラーメッセージ
products.*      # 製品名
company.*       # 会社情報
```

## 新しい言語の追加

1. `i18n/xx.json` を作成（xx = 言語コード）
2. `ja.json` をコピーして翻訳
3. TypeScript: `index.ts` に import を追加
4. Python: `LOCALES` に追加
