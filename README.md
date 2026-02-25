# insight-common

Insight Series製品群の共通リソースを一允E��琁E��るリポジトリです、E

## 概要E

こ�Eリポジトリは、Eつのアプリケーションで構�EされるInsight Series全体で共有するリソースを管琁E��ます、E

## チE��レクトリ構�E

```
insight-common/
├── license/           # ライセンス管琁E��ジュール
━E  ├── typescript/    # TypeScript牁E(Tauri/React製品用)
━E  ├── python/        # Python牁E(InsightPy等用)
━E  └── README.md      # ライセンス仕様ドキュメンチE
├── i18n/              # 多言語リソース
━E  ├── ja.json        # 日本誁E
━E  ├── en.json        # 英誁E
━E  ├── index.ts       # TypeScript用ヘルパ�E
━E  ├── __init__.py    # Python用ヘルパ�E
━E  └── README.md
├── utils/             # 共通ユーチE��リチE��
━E  ├── typescript/    # TypeScript牁E
━E  ├── python/        # Python牁E
━E  └── README.md
├── errors/            # 共通エラー定義
━E  ├── index.ts       # TypeScript牁E
━E  ├── __init__.py    # Python牁E
━E  └── README.md
├── brand/             # ブランド�EチE��インシスチE��
━E  ├── colors.json         # カラーパレチE��
━E  ├── design-system.json  # タイポグラフィ・スペ�Eシング筁E
━E  └── voice-guidelines.md # ト�Eン�E�E�Eナ�E
├── ui/                # UI共通定義
━E  ├── menu-structure.json # メニュー・ナビゲーション
━E  ├── components.md       # コンポ�Eネント設訁E
━E  └── README.md
├── legal/             # 法務斁E��
━E  ├── terms-of-service.md
━E  └── privacy-policy.md
├── company/           # 会社惁E��
━E  ├── about.md
━E  └── contact.json
├── config/            # 共通設宁E
━E  └── products.json  # 製品定義・機�Eフラグ
├── docs/              # ドキュメンチE
━E  ├── prompts/       # 吁E��品向け統合�Eロンプト
━E  ├── QUICKSTART.md
━E  └── INTEGRATION_GUIDE.md
└── README.md
```

## 対象製品E

### 個人向け製品E

| 製品コーチE| 製品名 | 説昁E|
|-----------|--------|------|
| INSS | InsightOfficeSlide | PowerPointコンチE��チE��出・更新 |
| IOSH | InsightOfficeSheet | Excelバ�Eジョン管琁E�Eチ�EムコラチE|
| IOSD | InsightOfficeDoc | Wordドキュメント操作�E自動化 |
| INPY | InsightPy | Windows自動化Python実行環墁E|
| INMV | InsightCast | 画像�EPPTから動画作�E |
| INIG | InsightImageGen | AI画像�E音声生�E |

### 法人向け製品E

| 製品コーチE| 製品名 | 説昁E|
|-----------|--------|------|
| INBT | InsightBot | Python RPA自動化ボッチE|
| INCA | InsightNoCodeAnalyzer | RPA・ローコード解析�E移行アセスメンチE|
| IVIN | InterviewInsight | AI採用面接支援 |

## ライセンスキー形弁E

```
INS-[PRODUCT]-[TIER]-[XXXX]-[XXXX]-[CC]
```

### チE��ア

| コーチE| 名称 | 期間 |
|--------|------|------|
| TRIAL | Trial | 任意指定（デフォルチE4日�E�E|
| STD | Standard | 年閁E|
| PRO | Professional | 年閁E|
| ENT | Enterprise | 永乁E|

詳細は [license/README.md](./license/README.md) を参照してください、E

## ドキュメンチE

### 技術ドキュメンチE

| ドキュメンチE| 説昁E|
|-------------|------|
| [クイチE��スターチE(./docs/QUICKSTART.md) | 5刁E��導�E |
| [統合ガイド](./docs/INTEGRATION_GUIDE.md) | 詳細な統合手頁E|
| [ライセンス仕様](./license/README.md) | ライセンスキー形式�E機�E制陁E|
| [多言語対応](./i18n/README.md) | i18n リソースとヘルパ�E関数 |
| [ユーチE��リチE��](./utils/README.md) | 共通ユーチE��リチE��関数 |
| [エラー定義](./errors/README.md) | 共通エラー型とコーチE|
| [統合�Eロンプト](./docs/prompts/README.md) | 吁E��品向けセチE��アチE�E手頁E|

### チE��イン・UXドキュメンチE

| ドキュメンチE| 説昁E|
|-------------|------|
| [チE��インシスチE��](./brand/design-system.json) | タイポグラフィ・スペ�Eシング・アニメーション |
| [カラーパレチE��](./brand/colors.json) | ブランドカラー・製品カラー |
| [ト�Eン�E�E�Eナ�E](./brand/voice-guidelines.md) | UIチE��スト�EメチE��ージの書き方 |
| [UIコンポ�EネンチE(./ui/components.md) | 共通UI設計ガイドライン |
| [メニュー構造](./ui/menu-structure.json) | ナビゲーション・設定画面の構造 |

## 使用方況E

### TypeScript製品での利用

```typescript
// ライセンス管琁E
import { LicenseValidator, getFeatureLimits } from '@insight/license';

const validator = new LicenseValidator();
const result = validator.validate(licenseKey);

if (result.isValid) {
  const limits = getFeatureLimits(result.tier);
  console.log(`Tier: ${result.tier}, Max Files: ${limits.maxFiles}`);
}

// 多言語対忁E
import { t, setLocale } from '@insight/i18n';

setLocale('ja');
console.log(t('common.save'));  // "保孁E

// ユーチE��リチE��
import { formatDate, formatCurrency, isValidEmail } from '@insight/utils';

formatDate(new Date(), 'long', 'ja');  // "2025年1朁E5日"
formatCurrency(1500);                   // "¥1,500"
isValidEmail('test@example.com');       // true

// エラーハンドリング
import { InsightError, LicenseError, isRetryable } from '@insight/errors';

throw new LicenseError('LICENSE_EXPIRED', 'ライセンスの有効期限が�EれてぁE��ぁE);
```

### Python製品での利用

```python
# ライセンス管琁E
from insight_common.license import LicenseValidator, get_feature_limits

validator = LicenseValidator()
result = validator.validate(license_key)

if result.is_valid:
    limits = get_feature_limits(result.tier)
    print(f"Tier: {result.tier}, Max Files: {limits['max_files']}")

# 多言語対忁E
from insight_common.i18n import t, set_locale

set_locale('ja')
print(t('common.save'))  # "保孁E

# ユーチE��リチE��
from insight_common.utils import format_date, format_currency, is_valid_email

format_date(datetime.now(), 'long', 'ja')  # "2025年1朁E5日"
format_currency(1500)                       # "¥1,500"
is_valid_email('test@example.com')          # True

# エラーハンドリング
from insight_common.errors import LicenseError, ErrorCode, is_retryable

raise LicenseError(ErrorCode.LICENSE_EXPIRED, 'ライセンスの有効期限が�EれてぁE��ぁE)
```

## サブモジュールとしての利用

吁E��品リポジトリでは、このリポジトリをGit Submoduleとして取り込むことを推奨します！E

```bash
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common
git submodule update --init --recursive
```

## 開発

### 前提条件

- Node.js 18+�E�EypeScript版！E
- Python 3.10+�E�Eython版！E

### TypeScriptモジュールのビルチE

```bash
cd license/typescript
npm install
npm run build
```

### PythonモジュールのチE��チE

```bash
cd license/python
python -m pytest
```

## ライセンス

こ�EリポジトリはHARMONIC insightの冁E��利用専用です、E

## 連絡允E

- 一般: info@h-insight.jp
- サポ�EチE support@h-insight.jp
- 開発チ�Eム: developer@h-insight.jp
