# クイチE��スタートガイチE

5刁E�� insight-common を導�Eするためのガイドです、E

## 1. Submodule として追加

```bash
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common
```

## 2. 製品コードを確誁E

あなた�Eアプリに対応するコードを確認！E

| アプリ | コーチE|
|--------|--------|
| InsightOfficeSlide | `INSS` |
| InsightOfficeSheet | `IOSH` |
| InsightOfficeDoc | `IOSD` |
| InsightPy | `INPY` |
| InsightCast | `INMV` |
| InsightImageGen | `INIG` |
| InsightBot | `INBT` |
| InsightNoCodeAnalyzer | `INCA` |
| InterviewInsight | `IVIN` |

## 3. ライセンス検証を実裁E

### TypeScript

```typescript
import { LicenseValidator, getFeatureLimits } from './insight-common/license/typescript';

const validator = new LicenseValidator();
const PRODUCT = 'INSS'; // あなた�E製品コーチE

// 検証
const result = validator.validate(licenseKey, expiresAt);
if (result.isValid && validator.isProductCovered(result, PRODUCT)) {
  const limits = getFeatureLimits(result.tier);
  // limits.maxFiles, limits.batchProcessing などを使用
}
```

### Python

```python
from insight_common.license import LicenseValidator, ProductCode, get_feature_limits

validator = LicenseValidator()
PRODUCT = ProductCode.INSS  # あなた�E製品コーチE

# 検証
result = validator.validate(license_key, expires_at)
if result.is_valid and validator.is_product_covered(result, PRODUCT):
    limits = get_feature_limits(result.tier)
    # limits.max_files, limits.batch_processing などを使用
```

## 4. ブランドカラーを適用

```typescript
import colors from './insight-common/brand/colors.json';

// 共通カラー
const primary = colors.brand.primary.main;      // #B8942F
const success = colors.semantic.success.main;   // #16A34A

// 製品固有カラー
const productColor = colors.products.insightOfficeSlide.primary;
```

## 5. 法務斁E��をリンク

アプリ冁E��ら参照�E�E

- 利用規紁E `insight-common/legal/terms-of-service.md`
- プライバシーポリシー: `insight-common/legal/privacy-policy.md`

## 完亁E��E

詳細は [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) を参照してください、E
