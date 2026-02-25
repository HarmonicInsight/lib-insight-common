# Insight Series 共通リソース統合ガイチE

こ�Eドキュメント�E、Insight Series の吁E��プリケーション�E�EnsightOfficeSlide, InsightOfficeSheet, InsightOfficeDoc, InsightPy, InsightCast, InsightImageGen, InsightBot, InsightNoCodeAnalyzer, InterviewInsight�E�が `insight-common` リポジトリの共通リソースを使用するための手頁E��説明します、E

## 概要E

### insight-common とは

Insight Series 全製品で共有するリソースを一允E��琁E��るリポジトリです、E

```
insight-common/
├── license/           # ライセンス管琁E��EypeScript/Python�E�E
├── brand/             # ブランド賁E���E�カラー定義�E�E
├── legal/             # 法務斁E���E�利用規紁E���Eライバシーポリシー�E�E
├── company/           # 会社惁E��
└── config/            # 製品定義・設宁E
```

### メリチE��

- **一貫性**: 全製品で同じライセンス体系、ブランドカラー、法務斁E��を使用
- **保守性**: 変更は1箁E��で行い、�E製品に反映
- **拡張性**: 新製品追加時も共通基盤を�E利用

---

## 導�E方況E

### 方況E: Git Submodule�E�推奨�E�E

吁E��品リポジトリに submodule として追加します、E

```bash
# リポジトリのルートで実衁E
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common

# 初期化（クローン後！E
git submodule update --init --recursive
```

チE��レクトリ構�E例！E
```
InsightNoCodeAnalyzer/
├── insight-common/     # サブモジュール
├── src/
├── src-tauri/
└── package.json
```

### 方況E: ファイルコピ�E

submodule を使わなぁE��合、忁E��なファイルを手動でコピ�Eします、E

```bash
# ライセンスモジュールをコピ�E
cp -r insight-common/license/typescript ./src/lib/license

# ブランドカラーをコピ�E
cp insight-common/brand/colors.json ./src/assets/
```

---

## ライセンス管琁E�E統吁E

### 共通ライセンスキー形弁E

```
INS-[PRODUCT]-[TIER]-[XXXX]-[XXXX]-[CC]

侁E
INS-INSS-TRIAL-A1B2-C3D4-X9    # InsightOfficeSlide トライアル
INS-INCA-PRO-E5F6-G7H8-Y0     # InsightNoCodeAnalyzer Professional
```

### 製品コーチE

| コーチE| 製品名 | 対象アプリ |
|--------|--------|-----------|
| `INSS` | InsightOfficeSlide | InsightOfficeSlide |
| `IOSH` | InsightOfficeSheet | InsightOfficeSheet |
| `IOSD` | InsightOfficeDoc | InsightOfficeDoc |
| `INPY` | InsightPy | InsightPy |
| `INMV` | InsightCast | InsightCast |
| `INIG` | InsightImageGen | InsightImageGen |
| `INBT` | InsightBot | InsightBot |
| `INCA` | InsightNoCodeAnalyzer | InsightNoCodeAnalyzer |
| `IVIN` | InterviewInsight | InterviewInsight |

### チE��ア

| チE��ア | 期間 | 用送E|
|--------|------|------|
| `TRIAL` | 任意指宁E| トライアル牁E|
| `STD` | 年閁E| Standard牁E|
| `PRO` | 年閁E| Professional牁E|
| `ENT` | 永乁E| Enterprise牁E|

---

## TypeScript/React アプリでの使用

InsightNoCodeAnalyzer, InterviewInsight�E�Eauri版）など

### 1. インポ�Eト設宁E

```typescript
// tsconfig.json のパス設宁E
{
  "compilerOptions": {
    "paths": {
      "@insight/license": ["./insight-common/license/typescript/index.ts"],
      "@insight/brand": ["./insight-common/brand/colors.json"]
    }
  }
}
```

### 2. ライセンス検証の実裁E

```typescript
// src/lib/license-manager.ts
import {
  LicenseValidator,
  LicenseInfo,
  ProductCode,
  getFeatureLimits,
  TIER_LIMITS
} from '@insight/license';

// こ�Eアプリの製品コーチE
const CURRENT_PRODUCT: ProductCode = 'INCA';  // また�E 'IVIN'

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

    // こ�E製品がカバ�EされてぁE��かチェチE��
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

    // 保孁E
    localStorage.setItem('license', JSON.stringify({ key, expiresAt }));
    this.licenseInfo = result;
    return result;
  }

  // 機�E制限を取征E
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

### 3. 機�E制限�E適用

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

// 使用侁E
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

InsightOfficeSlide, InsightPy�E�Eython版）など

### 1. パッケージ構�E

```
InsightOfficeSlide/
├── insight_common/          # コピ�Eまた�EシンボリチE��リンク
━E  └── license/
━E      └── __init__.py
├── src/
━E  └── license_manager.py
└── main.py
```

### 2. ライセンス検証の実裁E

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

# こ�Eアプリの製品コーチE
CURRENT_PRODUCT = ProductCode.INSS  # また�E INPY, IVIN

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

            # こ�E製品がカバ�EされてぁE��かチェチE��
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

        # 保孁E
        with open(LICENSE_FILE, 'w') as f:
            json.dump({
                'key': key,
                'expires_at': expires_at.isoformat() if expires_at else None,
            }, f)

        self.license_info = result
        return result

    def get_feature_limits(self):
        """機�E制限を取征E""
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

### 3. 機�E制限�E適用

```python
# src/feature_check.py
from license_manager import license_manager


def require_feature(feature: str):
    """機�Eが利用可能かチェチE��するチE��レータ"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            limits = license_manager.get_feature_limits()
            if not getattr(limits, feature, False):
                raise PermissionError(
                    f"こ�E機�Eはご利用のプランでは使用できません、E
                    f"アチE�Eグレードをご検討ください、E
                )
            return func(*args, **kwargs)
        return wrapper
    return decorator


# 使用侁E
@require_feature('batch_processing')
def process_all_files(files: list):
    """バッチ�E琁E��ETD以上！E""
    for file in files:
        process_file(file)


@require_feature('cloud_sync')
def sync_to_cloud():
    """クラウド同期！ERO以上！E""
    pass
```

---

## ブランドカラーの統一

### colors.json の構�E

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

全製品�E Gold (#B8942F) を�Eライマリカラーとして使用し、Ivory (#FAF8F5) を背景色として使用します、E

---

## 法務斁E��の表示

### 利用規紁E�Eプライバシーポリシー

```typescript
// React での表示侁E
import termsOfService from '@/insight-common/legal/terms-of-service.md';
import privacyPolicy from '@/insight-common/legal/privacy-policy.md';

function LegalPage() {
  return (
    <div>
      <h1>利用規紁E/h1>
      <MarkdownRenderer content={termsOfService} />

      <h1>プライバシーポリシー</h1>
      <MarkdownRenderer content={privacyPolicy} />
    </div>
  );
}
```

---

## 製品情報の参�E

### products.json の活用

```typescript
import products from '@/insight-common/config/products.json';

// 現在の製品情報を取征E
const currentProduct = products.products.individual.find(
  p => p.code === 'INSS'
);

console.log(currentProduct.name);        // "InsightOfficeSlide"
console.log(currentProduct.description); // "PowerPointコンチE��チE��出・更新"

// チE��ア惁E��
const proTier = products.tiers.PRO;
console.log(proTier.name);      // "Professional"
console.log(proTier.limits);    // { apiCalls: 100000, storage: "50GB" }
```

---

## 更新の反映

### Submodule を使用してぁE��場吁E

```bash
# 最新の共通リソースを取征E
cd insight-common
git pull origin main
cd ..

# 変更をコミッチE
git add insight-common
git commit -m "chore: Update insight-common to latest"
```

### 自動化�E�EitHub Actions�E�E

```yaml
# .github/workflows/update-common.yml
name: Update insight-common

on:
  schedule:
    - cron: '0 0 * * 0'  # 毎週日曁E

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

## チェチE��リスチE

新規アプリで insight-common を導�Eする際�EチェチE��リスト！E

- [ ] insight-common めEsubmodule として追加
- [ ] 製品コード！ENSS/IOSH/IOSD/INPY/INMV/INIG/INBT/INCA/IVIN�E�を決宁E
- [ ] ライセンス管琁E��ラスを実裁E
- [ ] 機�E制限�Eゲート�E琁E��実裁E
- [ ] ブランドカラーをテーマに適用
- [ ] 利用規紁E�Eプライバシーポリシーへのリンクを設置
- [ ] 製品情報めEAbout 画面に表示

---

## サポ�EチE

質問や問題がある場合！E

- Issue: https://github.com/HarmonicInsight/cross-lib-insight-common/issues
- Email: developer@h-insight.jp
