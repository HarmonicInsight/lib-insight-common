# クイックスタートガイド

5分で insight-common を導入するためのガイドです。

## 1. Submodule として追加

```bash
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common
```

## 2. 製品コードを確認

あなたのアプリに対応するコードを確認：

| アプリ | コード |
|--------|--------|
| Insight Deck Quality Gate | `INSS` |
| Insight Performance Management | `IOSH` |
| Insight AI Doc Factory | `IOSD` |
| InsightPy | `INPY` |
| Insight Training Studio | `INMV` |
| InsightImageGen | `INIG` |
| InsightBot | `INBT` |
| InsightNoCodeAnalyzer | `INCA` |
| InterviewInsight | `IVIN` |

## 3. ライセンス検証を実装

### TypeScript

```typescript
import { LicenseValidator, getFeatureLimits } from './insight-common/license/typescript';

const validator = new LicenseValidator();
const PRODUCT = 'INSS'; // あなたの製品コード

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
PRODUCT = ProductCode.INSS  # あなたの製品コード

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

## 5. 法務書類をリンク

アプリ内から参照：

- 利用規約: `insight-common/legal/terms-of-service.md`
- プライバシーポリシー: `insight-common/legal/privacy-policy.md`

## 完了！

詳細は [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) を参照してください。
