# HARMONIC insight 繝ｩ繧､繧ｻ繝ｳ繧ｹ邂｡逅・

HARMONIC insight 陬ｽ蜩∫ｾ､縺ｮ蜈ｱ騾壹Λ繧､繧ｻ繝ｳ繧ｹ邂｡逅・Δ繧ｸ繝･繝ｼ繝ｫ縺ｧ縺吶・

## 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ蠖｢蠑・

```
PPPP-PLAN-YYMM-HASH-SIG1-SIG2

萓・
INSS-TRIAL-2701-A1B2-C3D4-X9Z1   # InsightOfficeSlide 繝医Λ繧､繧｢繝ｫ
IOSH-PRO-2701-E5F6-G7H8-Y0W2     # InsightOfficeSheet Professional
IVIN-STD-2701-I9J0-K1L2-Z1A3     # InterviewInsight Standard
```

## 陬ｽ蜩√さ繝ｼ繝・

### 縲植縲大倶ｺｺ蜷代￠・・ndividual・・

| 繧ｳ繝ｼ繝・| 陬ｽ蜩∝錐 | 隱ｬ譏・|
|--------|--------|------|
| `INSS` | InsightOfficeSlide | AI繧｢繧ｷ繧ｹ繧ｿ繝ｳ繝域政霈・窶・繝励Ξ繧ｼ繝ｳ謾ｯ謠ｴ |
| `IOSH` | InsightOfficeSheet | AI繧｢繧ｷ繧ｹ繧ｿ繝ｳ繝域政霈・窶・繧ｹ繝励Ξ繝・ラ繧ｷ繝ｼ繝域髪謠ｴ |
| `IOSD` | InsightOfficeDoc | AI繧｢繧ｷ繧ｹ繧ｿ繝ｳ繝域政霈・窶・繝峨く繝･繝｡繝ｳ繝域髪謠ｴ |
| `INPY` | InsightPy | AI繧ｨ繝・ぅ繧ｿ謳ｭ霈・窶・Python髢狗匱謾ｯ謠ｴ |
| `INMV` | InsightCast | 蜍慕判菴懈・ |
| `INIG` | InsightImageGen | AI逕ｻ蜒上・髻ｳ螢ｰ逕滓・ |

### 縲殖縲代さ繝ｳ繧ｵ繝ｫ繝・ぅ繝ｳ繧ｰ騾｣蜍募梛・・orporate・・

| 繧ｳ繝ｼ繝・| 陬ｽ蜩∝錐 | 隱ｬ譏・|
|--------|--------|------|
| `INBT` | InsightBot | AI繧ｨ繝・ぅ繧ｿ謳ｭ霈・窶・RPA閾ｪ蜍募喧 |
| `INCA` | InsightNoCodeAnalyzer | 繝ｭ繝ｼ繧ｳ繝ｼ繝芽ｧ｣譫・|
| `IVIN` | InterviewInsight | 髱｢謗･謾ｯ謠ｴ |

## 繝・ぅ繧｢

| 繧ｳ繝ｼ繝・| 蜷咲ｧｰ | 譛滄俣 | 隱ｬ譏・|
|--------|------|------|------|
| `FREE` | Free | 辟｡譛滄剞 | 讖溯・蛻ｶ髯舌≠繧・|
| `TRIAL` | Trial | 14譌･髢・| 蜈ｨ讖溯・蛻ｩ逕ｨ蜿ｯ閭ｽ・郁ｩ穂ｾ｡逕ｨ・・|
| `STD` | Standard | 蟷ｴ髢難ｼ・65譌･・・| 蛟倶ｺｺ蜷代￠讓呎ｺ匁ｩ溯・ |
| `PRO` | Professional | 蟷ｴ髢難ｼ・65譌･・・| 豕穂ｺｺ繝ｻ繝√・繝蜷代￠蜈ｨ讖溯・ |
| `ENT` | Enterprise | 隕∫嶌隲・| 繧ｫ繧ｹ繧ｿ繝槭う繧ｺ |

## 菴ｿ逕ｨ譁ｹ豕・

### TypeScript迚・

```typescript
import {
  LicenseValidator,
  generateLicenseKey,
  getFeatureLimits
} from '@insight/license';

// 繝ｩ繧､繧ｻ繝ｳ繧ｹ逕滓・
const { licenseKey, expiresAt } = generateLicenseKey({
  productCode: 'INSS',
  plan: 'STD',
  email: 'user@example.com',
  expiresAt: new Date('2027-01-31')
});

// 繝ｩ繧､繧ｻ繝ｳ繧ｹ讀懆ｨｼ
const validator = new LicenseValidator();
const result = validator.validate(licenseKey, expiresAt);

if (result.isValid) {
  console.log(`Product: ${result.product}, Plan: ${result.plan}`);
}
```

### Python迚・

```python
from datetime import datetime
from insight_license import (
    LicenseValidator,
    generate_license_key,
    ProductCode,
    Plan,
)

# 繝ｩ繧､繧ｻ繝ｳ繧ｹ逕滓・
result = generate_license_key(
    product_code=ProductCode.INSS,
    plan=Plan.STD,
    email="user@example.com",
    expires_at=datetime(2027, 1, 31)
)

# 繝ｩ繧､繧ｻ繝ｳ繧ｹ讀懆ｨｼ
validator = LicenseValidator()
info = validator.validate(result["license_key"], result["expires_at"])

if info.is_valid:
    print(f"Product: {info.product}, Plan: {info.plan}")
```

### CLI

```
Phase 1: 繝ｪ繝ｪ繝ｼ繧ｹ蛻晄悄
  竊・INSS-TRIAL-2701-XXXX-XXXX-XXXX  (譛滄剞謖・ｮ壹〒繝医Λ繧､繧｢繝ｫ驟榊ｸ・

Phase 2: 豁｣蠑剰ｲｩ螢ｲ
  竊・INSS-STD-2701-XXXX-XXXX-XXXX   (Standard迚・
  竊・INSS-PRO-2701-XXXX-XXXX-XXXX   (Professional迚・

Phase 3: 蜈ｨ陬ｽ蜩∝ｱ暮幕
  竊・IOSH-PRO-2701-XXXX-XXXX-XXXX  (InsightOfficeSheet)
  竊・IVIN-STD-2701-XXXX-XXXX-XXXX  (InterviewInsight)
```

## 繧ｭ繝ｼ讒区・

| 驛ｨ蛻・| 隱ｬ譏・|
|------|------|
| `PPPP` | 陬ｽ蜩√さ繝ｼ繝会ｼ・譁・ｭ暦ｼ・|
| `PLAN` | 繝励Λ繝ｳ・・RIAL/STD/PRO・・|
| `YYMM` | 譛牙柑譛滄剞・亥ｹｴ譛茨ｼ・|
| `HASH` | 繝｡繝ｼ繝ｫ繝上ャ繧ｷ繝･・・HA256 Base32 蜈磯ｭ4譁・ｭ暦ｼ・|
| `SIG1-SIG2` | HMAC-SHA256鄂ｲ蜷搾ｼ・ase32 蜈磯ｭ8譁・ｭ暦ｼ・|

## 讖溯・

- 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ縺ｮ逕滓・繝ｻ讀懆ｨｼ
- 繝√ぉ繝・け繧ｵ繝縺ｫ繧医ｋ謾ｹ縺悶ｓ讀懷・
- 譛牙柑譛滄剞縺ｮ邂｡逅・ｼ井ｻｻ諢乗欠螳壼庄閭ｽ・・
- 繝・ぅ繧｢蛻･讖溯・蛻ｶ髯・
- 陬ｽ蜩√き繝舌Ξ繝・ず蛻､螳夲ｼ・LL縺ｯ蜈ｨ陬ｽ蜩∝ｯｾ蠢懶ｼ・
- 繧ｪ繝輔Λ繧､繝ｳ讀懆ｨｼ蟇ｾ蠢・
