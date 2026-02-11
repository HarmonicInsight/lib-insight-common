# InterviewInsight: insight-common 統合プロンプト

以下のプロンプトを InterviewInsight リポジトリの Claude Code セッションで実行してください。

---

## プロンプト

```
# InterviewInsight に insight-common を統合

## 概要
Insight Series の共通リソースリポジトリ (insight-common) を InterviewInsight に統合してください。
（旧名: AutoInterview → InterviewInsight に改名）

## 手順

### 1. リポジトリ名の変更（まだの場合）
GitHub で AutoInterview → InterviewInsight に改名

### 2. Submodule として追加
```bash
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common
git submodule update --init --recursive
```

### 3. ライセンス管理の実装

技術スタックに応じて実装：

#### TypeScript/React (Tauri) の場合

`src/lib/license-manager.ts` を作成：

```typescript
import {
  LicenseValidator,
  LicenseInfo,
  ProductCode,
  getFeatureLimits,
} from '@insight/license';

const CURRENT_PRODUCT: ProductCode = 'IVIN';

class AppLicenseManager {
  private validator = new LicenseValidator();
  private licenseInfo: LicenseInfo | null = null;

  async loadLicense(): Promise<LicenseInfo> {
    const stored = localStorage.getItem('license');
    if (!stored) {
      return this.getTrialLicense();
    }

    const { key, expiresAt } = JSON.parse(stored);
    const result = this.validator.validate(key, new Date(expiresAt));

    if (result.isValid && this.validator.isProductCovered(result, CURRENT_PRODUCT)) {
      this.licenseInfo = result;
      return result;
    }

    return this.getTrialLicense();
  }

  getFeatureLimits() {
    return getFeatureLimits(this.licenseInfo?.tier || null);
  }

  private getTrialLicense(): LicenseInfo {
    return { isValid: true, product: 'ALL', tier: 'TRIAL', expiresAt: null };
  }
}

export const licenseManager = new AppLicenseManager();
```

#### Python の場合

`src/license_manager.py` を作成：

```python
from insight_common.license import (
    LicenseValidator,
    ProductCode,
    get_feature_limits,
)

CURRENT_PRODUCT = ProductCode.IVIN

class AppLicenseManager:
    def __init__(self):
        self.validator = LicenseValidator()
        self.license_info = None

    def load_license(self):
        # ~/.interviewinsight/license.json から読み込み
        pass

    def get_feature_limits(self):
        tier = self.license_info.tier if self.license_info else None
        return get_feature_limits(tier)

license_manager = AppLicenseManager()
```

### 4. ブランドカラーの適用

insight-common/brand/colors.json から InterviewInsight のカラーを取得:
- プライマリ: `#DC2626` (Red)

### 5. プロジェクト内の名前更新

- AutoInterview → InterviewInsight
- auto_interview → interview_insight
- AUTOINTERVIEW → INTERVIEWINSIGHT

### 6. コミット

```bash
git add -A
git commit -m "feat: Integrate insight-common and rename to InterviewInsight"
git push
```

## 確認事項

- [ ] リポジトリ名が InterviewInsight に変更された
- [ ] submodule が正しく追加された
- [ ] ライセンス検証が動作する
- [ ] 機能制限が適用される
- [ ] ブランドカラーが適用される
```

---

## 補足情報

### InterviewInsight の製品コード
- `IVIN` (ライセンスキー: `INS-IVIN-XXX-XXXX-XXXX-XX`)
- `ALL` も使用可能（全製品バンドル）

### 参照ドキュメント
- [クイックスタート](../QUICKSTART.md)
- [統合ガイド](../INTEGRATION_GUIDE.md)
- [ライセンス仕様](../../license/README.md)
