# Insight Series 共通リソース統合ガイド

このドキュメントは、Insight Series の各アプリケーション（Insight Deck Quality Gate, Insight Performance Management, Insight AI Briefcase, InsightPy, Insight Training Studio, InsightImageGen, InsightBot, InsightNoCodeAnalyzer, InterviewInsight）が `insight-common` リポジトリの共通リソースを使用するための手順を説明します。

## 概要

### insight-common とは

Insight Series 全製品で共有するリソースを一元管理するリポジトリです。

```
insight-common/
├── license/           # ライセンス管理（TypeScript/Python）
├── brand/             # ブランド資産（カラー定義等）
├── legal/             # 法務書類（利用規約、プライバシーポリシー等）
├── company/           # 会社情報
└── config/            # 製品定義・設定
```

### メリット

- **一貫性**: 全製品で同じライセンス体系、ブランドカラー、法務書類を使用
- **保守性**: 変更は1箇所で行い、全製品に反映
- **拡張性**: 新製品追加時も共通基盤を再利用

---

## 導入方法

### 方法1: Git Submodule（推奨）

各製品リポジトリに submodule として追加します。

```bash
# リポジトリのルートで実行
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common

# 初期化（クローン後）
git submodule update --init --recursive
```

ディレクトリ構成例：
```
InsightNoCodeAnalyzer/
├── insight-common/     # サブモジュール
├── src/
├── src-tauri/
└── package.json
```

### 方法2: ファイルコピー

submodule を使わない場合、必要なファイルを手動でコピーします。

```bash
# ライセンスモジュールをコピー
cp -r insight-common/license/typescript ./src/lib/license

# ブランドカラーをコピー
cp insight-common/brand/colors.json ./src/assets/
```

---

## ライセンス管理の統合

### 共通ライセンスキー形式

```
INS-[PRODUCT]-[TIER]-[XXXX]-[XXXX]-[CC]

例：
INS-INSS-TRIAL-A1B2-C3D4-X9    # Insight Deck Quality Gate トライアル
INS-INCA-PRO-E5F6-G7H8-Y0     # InsightNoCodeAnalyzer Professional
```

### 製品コード

| コード | 製品名 | 対象アプリ |
|--------|--------|-----------|
| `INSS` | Insight Deck Quality Gate | Insight Deck Quality Gate |
| `IOSH` | Insight Performance Management | Insight Performance Management |
| `IOSD` | Insight AI Briefcase | Insight AI Briefcase |
| `INPY` | InsightPy | InsightPy |
| `INMV` | Insight Training Studio | Insight Training Studio |
| `INIG` | InsightImageGen | InsightImageGen |
| `INBT` | InsightBot | InsightBot |
| `INCA` | InsightNoCodeAnalyzer | InsightNoCodeAnalyzer |
| `IVIN` | InterviewInsight | InterviewInsight |

### ティア

| ティア | 期間 | 用途 |
|--------|------|------|
| `TRIAL` | 任意指定 | トライアル版 |
| `STD` | 年間 | Standard版 |
| `PRO` | 年間 | Professional版 |
| `ENT` | 永久 | Enterprise版 |

---

## TypeScript/React アプリでの使用

InsightNoCodeAnalyzer, InterviewInsight（Tauri版）など

### 1. インポート設定

```typescript
// tsconfig.json のパス設定
{
  "compilerOptions": {
    "paths": {
      "@insight/license": ["./insight-common/license/typescript/index.ts"],
      "@insight/brand": ["./insight-common/brand/colors.json"]
    }
  }
}
```

### 2. ライセンス検証の実装

```typescript
// src/lib/license-manager.ts
import {
  LicenseValidator,
  LicenseInfo,
  ProductCode,
  getFeatureLimits,
  TIER_LIMITS
} from '@insight/license';

// このアプリの製品コード
const CURRENT_PRODUCT: ProductCode = 'INCA';  // または 'IVIN'

class AppLicenseManager {
  private validator = new LicenseValidator();
  private licenseInfo: LicenseInfo | null = null;

  // ライセンスを読み込み・検証
  async loadLicense(): Promise<LicenseInfo> {
    // ローカルストレージから読み込み
    const stored = localStorage.getItem('license');
    if (!stored) {
      return this.getTrialLicense();
    }

    const { key, expiresAt } = JSON.parse(stored);
    const result = this.validator.validate(key, new Date(expiresAt));

    // この製品がカバーされているかチェック
    if (result.isValid && this.validator.isProductCovered(result, CURRENT_PRODUCT)) {
      this.licenseInfo = result;
      return result;
    }

    return this.getTrialLicense();
  }

  // ライセンスキーを登録
  async registerLicense(key: string, expiresAt: Date): Promise<LicenseInfo> {
    const result = this.validator.validate(key, expiresAt);

    if (!result.isValid) {
      throw new Error(result.error || 'Invalid license');
    }

    if (!this.validator.isProductCovered(result, CURRENT_PRODUCT)) {
      throw new Error('This license does not cover this product');
    }

    // 保存
    localStorage.setItem('license', JSON.stringify({ key, expiresAt }));
    this.licenseInfo = result;
    return result;
  }

  // 機能制限を取得
  getFeatureLimits() {
    return getFeatureLimits(this.licenseInfo?.tier || null);
  }

  // トライアルライセンス
  private getTrialLicense(): LicenseInfo {
    return {
      isValid: true,
      product: CURRENT_PRODUCT,
      tier: 'TRIAL',
      expiresAt: null,
    };
  }
}

export const licenseManager = new AppLicenseManager();
```

### 3. 機能制限の適用

```typescript
// src/components/FeatureGate.tsx
import { licenseManager } from '@/lib/license-manager';

interface FeatureGateProps {
  feature: 'batchProcessing' | 'export' | 'cloudSync';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const limits = licenseManager.getFeatureLimits();

  if (!limits[feature]) {
    return fallback || <UpgradePrompt feature={feature} />;
  }

  return <>{children}</>;
}

// 使用例
<FeatureGate feature="cloudSync">
  <CloudSyncButton />
</FeatureGate>
```

### 4. ブランドカラーの使用

```typescript
// src/lib/theme.ts
import colors from '@insight/brand';

export const theme = {
  colors: {
    primary: colors.brand.primary.main,      // #B8942F
    secondary: colors.brand.secondary.main,
    success: colors.semantic.success.main,   // #16A34A
    error: colors.semantic.error.main,       // #DC2626
  }
};
```

---

## Python アプリでの使用

Insight Deck Quality Gate, InsightPy（Python版）など

### 1. パッケージ構成

```
InsightOfficeSlide/
├── insight_common/          # コピーまたはシンボリックリンク
│   └── license/
│       └── __init__.py
├── src/
│   └── license_manager.py
└── main.py
```

### 2. ライセンス検証の実装

```python
# src/license_manager.py
import json
from pathlib import Path
from datetime import datetime
from typing import Optional

from insight_common.license import (
    LicenseValidator,
    LicenseInfo,
    ProductCode,
    LicenseTier,
    get_feature_limits,
)

# このアプリの製品コード
CURRENT_PRODUCT = ProductCode.INSS  # または INPY, IVIN

# 設定ファイルのパス
CONFIG_DIR = Path.home() / ".insight-office-slide"
LICENSE_FILE = CONFIG_DIR / "license.json"


class AppLicenseManager:
    def __init__(self):
        self.validator = LicenseValidator()
        self.license_info: Optional[LicenseInfo] = None
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    def load_license(self) -> LicenseInfo:
        """ライセンスを読み込み・検証"""
        if not LICENSE_FILE.exists():
            return self._get_trial_license()

        try:
            with open(LICENSE_FILE, 'r') as f:
                data = json.load(f)

            key = data.get('key')
            expires_at_str = data.get('expires_at')
            expires_at = datetime.fromisoformat(expires_at_str) if expires_at_str else None

            result = self.validator.validate(key, expires_at)

            # この製品がカバーされているかチェック
            if result.is_valid and self.validator.is_product_covered(result, CURRENT_PRODUCT):
                self.license_info = result
                return result

        except Exception:
            pass

        return self._get_trial_license()

    def register_license(self, key: str, expires_at: datetime) -> LicenseInfo:
        """ライセンスキーを登録"""
        result = self.validator.validate(key, expires_at)

        if not result.is_valid:
            raise ValueError(result.error or "Invalid license")

        if not self.validator.is_product_covered(result, CURRENT_PRODUCT):
            raise ValueError("This license does not cover this product")

        # 保存
        with open(LICENSE_FILE, 'w') as f:
            json.dump({
                'key': key,
                'expires_at': expires_at.isoformat() if expires_at else None,
            }, f)

        self.license_info = result
        return result

    def get_feature_limits(self):
        """機能制限を取得"""
        tier = self.license_info.tier if self.license_info else None
        return get_feature_limits(tier)

    def _get_trial_license(self) -> LicenseInfo:
        """トライアルライセンス"""
        return LicenseInfo(
            is_valid=True,
            product=CURRENT_PRODUCT,
            tier=LicenseTier.TRIAL,
            expires_at=None,
        )


# シングルトン
license_manager = AppLicenseManager()
```

### 3. 機能制限の適用

```python
# src/feature_check.py
from license_manager import license_manager


def require_feature(feature: str):
    """機能が利用可能かチェックするデコレータ"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            limits = license_manager.get_feature_limits()
            if not getattr(limits, feature, False):
                raise PermissionError(
                    f"この機能はご利用のプランでは使用できません。"
                    f"アップグレードをご検討ください。"
                )
            return func(*args, **kwargs)
        return wrapper
    return decorator


# 使用例
@require_feature('batch_processing')
def process_all_files(files: list):
    """バッチ処理（STD以上）"""
    for file in files:
        process_file(file)


@require_feature('cloud_sync')
def sync_to_cloud():
    """クラウド同期（PRO以上）"""
    pass
```

---

## ブランドカラーの統一

### colors.json の構成

```json
{
  "brand": {
    "primary": { "main": "#B8942F", "light": "#D4B95E", "dark": "#8A6F23" },
    "secondary": { "main": "#7C3AED", ... }
  },
  "semantic": {
    "success": { "main": "#16A34A", ... },
    "error": { "main": "#DC2626", ... }
  },
  "products": {
    "insightOfficeSlide": { "primary": "#B8942F" },
    "insightOfficeSheet": { "primary": "#B8942F" },
    "insightOfficeDoc": { "primary": "#B8942F" },
    "insightPy": { "primary": "#059669" },
    "interviewInsight": { "primary": "#B8942F" }
  }
}
```

### 製品別アクセントカラー

全製品で Gold (#B8942F) をプライマリカラーとして使用し、Ivory (#FAF8F5) を背景色として使用します。

---

## 法務書類の表示

### 利用規約・プライバシーポリシー

```typescript
// React での表示例
import termsOfService from '@/insight-common/legal/terms-of-service.md';
import privacyPolicy from '@/insight-common/legal/privacy-policy.md';

function LegalPage() {
  return (
    <div>
      <h1>利用規約</h1>
      <MarkdownRenderer content={termsOfService} />

      <h1>プライバシーポリシー</h1>
      <MarkdownRenderer content={privacyPolicy} />
    </div>
  );
}
```

---

## 製品情報の参照

### products.json の活用

```typescript
import products from '@/insight-common/config/products.json';

// 現在の製品情報を取得
const currentProduct = products.products.individual.find(
  p => p.code === 'INSS'
);

console.log(currentProduct.name);        // "Insight Deck Quality Gate"
console.log(currentProduct.description); // "PowerPointコンテンツ抽出・更新"

// ティア情報
const proTier = products.tiers.PRO;
console.log(proTier.name);      // "Professional"
console.log(proTier.limits);    // { apiCalls: 100000, storage: "50GB" }
```

---

## 更新の反映

### Submodule を使用している場合

```bash
# 最新の共通リソースを取得
cd insight-common
git pull origin main
cd ..

# 変更をコミット
git add insight-common
git commit -m "chore: Update insight-common to latest"
```

### 自動化（GitHub Actions）

```yaml
# .github/workflows/update-common.yml
name: Update insight-common

on:
  schedule:
    - cron: '0 0 * * 0'  # 毎週日曜

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true

      - name: Update submodule
        run: |
          git submodule update --remote insight-common

      - name: Create PR
        uses: peter-evans/create-pull-request@v5
        with:
          title: 'chore: Update insight-common'
          branch: update-insight-common
```

---

## チェックリスト

新規アプリで insight-common を導入する際のチェックリスト：

- [ ] insight-common を submodule として追加
- [ ] 製品コード（INSS/IOSH/IOSD/INPY/INMV/INIG/INBT/INCA/IVIN）を決定
- [ ] ライセンス管理クラスを実装
- [ ] 機能制限のゲート処理を実装
- [ ] ブランドカラーをテーマに適用
- [ ] 利用規約・プライバシーポリシーへのリンクを設置
- [ ] 製品情報を About 画面に表示

---

## サポート

質問や問題がある場合：

- Issue: https://github.com/HarmonicInsight/cross-lib-insight-common/issues
- Email: developer@h-insight.jp
