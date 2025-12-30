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

## 使用方法

### TypeScript製品での利用

```typescript
import { LicenseValidator } from '@insight-series/license';

const validator = new LicenseValidator();
const result = validator.validate(licenseKey);

if (result.isValid) {
  console.log(`Product: ${result.product}, Tier: ${result.tier}`);
}
```

### Python製品での利用

```python
from insight_common.license import LicenseValidator

validator = LicenseValidator()
result = validator.validate(license_key)

if result.is_valid:
    print(f"Product: {result.product}, Tier: {result.tier}")
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
