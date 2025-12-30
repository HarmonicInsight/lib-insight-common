# insight-common

Insight Series製品群の共通リソースを一元管理するリポジトリです。

## 概要

このリポジトリは、5つのデスクトップアプリケーションと10個のモバイルアプリケーションで構成されるInsight Series全体で共有するリソースを管理します。

## ディレクトリ構成

```
insight-common/
├── license/           # ライセンス管理モジュール
│   ├── typescript/    # TypeScript版 (Tauri/React製品用)
│   ├── python/        # Python版 (InsightPy等用)
│   └── README.md      # ライセンス仕様ドキュメント
├── i18n/              # 多言語リソース
│   ├── ja.json        # 日本語
│   ├── en.json        # 英語
│   ├── index.ts       # TypeScript用ヘルパー
│   ├── __init__.py    # Python用ヘルパー
│   └── README.md
├── utils/             # 共通ユーティリティ
│   ├── typescript/    # TypeScript版
│   ├── python/        # Python版
│   └── README.md
├── errors/            # 共通エラー定義
│   ├── index.ts       # TypeScript版
│   ├── __init__.py    # Python版
│   └── README.md
├── brand/             # ブランド資産
│   └── colors.json    # カラーパレット定義
├── legal/             # 法務文書
│   ├── terms-of-service.md
│   └── privacy-policy.md
├── company/           # 会社情報
│   ├── about.md
│   └── contact.json
├── config/            # 共通設定
│   └── products.json  # 製品定義・機能フラグ
├── docs/              # ドキュメント
│   ├── prompts/       # 各製品向け統合プロンプト
│   ├── QUICKSTART.md
│   └── INTEGRATION_GUIDE.md
└── README.md
```

## 対象製品

### デスクトップアプリケーション

| 製品コード | 製品名 | 説明 |
|-----------|--------|------|
| SALES | SalesInsight | AI営業支援アシスタント |
| SLIDE | InsightSlide | AIプレゼンテーション支援 |
| PY | InsightPy | Pythonデータ分析支援 |
| INTV | InterviewInsight | AI採用面接支援 |

### モバイルアプリケーション

各デスクトップ製品に対応するモバイル版およびコンパニオンアプリ

## ライセンスキー形式

```
INS-[PRODUCT]-[TIER]-[XXXX]-[XXXX]-[CC]
```

### ティア

| コード | 名称 | 期間 |
|--------|------|------|
| TRIAL | Trial | 任意指定（デフォルト14日） |
| STD | Standard | 年間 |
| PRO | Professional | 年間 |
| ENT | Enterprise | 永久 |

詳細は [license/README.md](./license/README.md) を参照してください。

## ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [クイックスタート](./docs/QUICKSTART.md) | 5分で導入 |
| [統合ガイド](./docs/INTEGRATION_GUIDE.md) | 詳細な統合手順 |
| [ライセンス仕様](./license/README.md) | ライセンスキー形式・機能制限 |
| [多言語対応](./i18n/README.md) | i18n リソースとヘルパー関数 |
| [ユーティリティ](./utils/README.md) | 共通ユーティリティ関数 |
| [エラー定義](./errors/README.md) | 共通エラー型とコード |
| [統合プロンプト](./docs/prompts/README.md) | 各製品向けセットアップ手順 |

## 使用方法

### TypeScript製品での利用

```typescript
// ライセンス管理
import { LicenseValidator, getFeatureLimits } from '@insight/license';

const validator = new LicenseValidator();
const result = validator.validate(licenseKey);

if (result.isValid) {
  const limits = getFeatureLimits(result.tier);
  console.log(`Tier: ${result.tier}, Max Files: ${limits.maxFiles}`);
}

// 多言語対応
import { t, setLocale } from '@insight/i18n';

setLocale('ja');
console.log(t('common.save'));  // "保存"

// ユーティリティ
import { formatDate, formatCurrency, isValidEmail } from '@insight/utils';

formatDate(new Date(), 'long', 'ja');  // "2025年1月15日"
formatCurrency(1500);                   // "¥1,500"
isValidEmail('test@example.com');       // true

// エラーハンドリング
import { InsightError, LicenseError, isRetryable } from '@insight/errors';

throw new LicenseError('LICENSE_EXPIRED', 'ライセンスの有効期限が切れています');
```

### Python製品での利用

```python
# ライセンス管理
from insight_common.license import LicenseValidator, get_feature_limits

validator = LicenseValidator()
result = validator.validate(license_key)

if result.is_valid:
    limits = get_feature_limits(result.tier)
    print(f"Tier: {result.tier}, Max Files: {limits['max_files']}")

# 多言語対応
from insight_common.i18n import t, set_locale

set_locale('ja')
print(t('common.save'))  # "保存"

# ユーティリティ
from insight_common.utils import format_date, format_currency, is_valid_email

format_date(datetime.now(), 'long', 'ja')  # "2025年1月15日"
format_currency(1500)                       # "¥1,500"
is_valid_email('test@example.com')          # True

# エラーハンドリング
from insight_common.errors import LicenseError, ErrorCode, is_retryable

raise LicenseError(ErrorCode.LICENSE_EXPIRED, 'ライセンスの有効期限が切れています')
```

## サブモジュールとしての利用

各製品リポジトリでは、このリポジトリをGit Submoduleとして取り込むことを推奨します：

```bash
git submodule add https://github.com/HarmonicInsight/insight-common.git
git submodule update --init --recursive
```

## 開発

### 前提条件

- Node.js 18+（TypeScript版）
- Python 3.10+（Python版）

### TypeScriptモジュールのビルド

```bash
cd license/typescript
npm install
npm run build
```

### Pythonモジュールのテスト

```bash
cd license/python
python -m pytest
```

## ライセンス

このリポジトリはHarmonic Insightの内部利用専用です。

## 連絡先

- サポート: support@harmonicinsight.com
- 開発チーム: dev@harmonicinsight.com
