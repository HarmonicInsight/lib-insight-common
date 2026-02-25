---
name: product-config
description: 陬ｽ蜩∬ｨｭ螳壹・雋ｩ螢ｲ謌ｦ逡･縺ｮ蜿ら・縲よ眠陬ｽ蜩∬ｿｽ蜉縲∵ｩ溯・繝槭ヨ繝ｪ繧ｯ繧ｹ螳夂ｾｩ縲√ヱ繝ｼ繝医リ繝ｼ繝励Ο繧ｰ繝ｩ繝險ｭ螳壹・菴懈･ｭ譎ゅ↓閾ｪ蜍暮←逕ｨ縲・
allowed-tools: Read, Grep, Glob
---

# 陬ｽ蜩∬ｨｭ螳壹・雋ｩ螢ｲ謌ｦ逡･

## 陬ｽ蜩√さ繝ｼ繝我ｸ隕ｧ

### Tier 1: 讌ｭ蜍吝､蛾擠繝・・繝ｫ

| 繧ｳ繝ｼ繝・| 陬ｽ蜩∝錐 |
|-------|-------|
| INCA | InsightNoCodeAnalyzer |
| INBT | InsightBot |
| IVIN | InterviewInsight |

### Tier 2: AI豢ｻ逕ｨ繝・・繝ｫ

| 繧ｳ繝ｼ繝・| 陬ｽ蜩∝錐 |
|-------|-------|
| INMV | InsightCast |
| INIG | InsightImageGen |

### Tier 3: InsightOffice Suite・亥ｰ主・繝・・繝ｫ・・

| 繧ｳ繝ｼ繝・| 陬ｽ蜩∝錐 |
|-------|-------|
| INSS | InsightOfficeSlide |
| IOSH | InsightOfficeSheet |
| IOSD | InsightOfficeDoc |
| INPY | InsightPy |

### Tier 4: InsightSeniorOffice

| 繧ｳ繝ｼ繝・| 陬ｽ蜩∝錐 |
|-------|-------|
| ISOF | InsightSeniorOffice |

> **萓｡譬ｼ縺ｯ蜈ｨ陬ｽ蜩∝句挨隕狗ｩ阪ｂ繧翫ゅヱ繝ｼ繝医リ繝ｼ・郁ｲｩ螢ｲ莉｣逅・ｺ暦ｼ峨→縺ｮ蜊碑ｭｰ縺ｫ繧医ｊ豎ｺ螳壹・*

## 譁ｰ陬ｽ蜩∬ｿｽ蜉謇矩・

1. `config/products.ts` 縺ｫ陬ｽ蜩√さ繝ｼ繝峨・讖溯・繝槭ヨ繝ｪ繧ｯ繧ｹ逋ｻ骭ｲ
2. `config/pricing.ts` 縺ｫ雋ｩ螢ｲ諠・ｱ繧定ｨｭ螳・
3. `config/sales-strategy.ts` 縺ｫ雋ｩ螢ｲ謌ｦ逡･
4. CLAUDE.md 縺ｮ陬ｽ蜩∽ｸ隕ｧ縺ｫ霑ｽ蜉
5. 繝ｩ繧､繧ｻ繝ｳ繧ｹ讖溯・繝槭ヨ繝ｪ繧ｯ繧ｹ螳夂ｾｩ

## 雋ｩ螢ｲ謌ｦ逡･

- **蜈ｨ陬ｽ蜩・B2B Only**・亥倶ｺｺ蜷代￠雋ｩ螢ｲ縺ｪ縺暦ｼ・
- **雋ｩ螢ｲ譁ｹ豕・*: 繧ｳ繝ｳ繧ｵ繝ｫ譯井ｻｶ蜀・〒縺ｮ逶ｴ謗･謠先｡・+ 繝代・繝医リ繝ｼ邨檎罰
- **豎ｺ貂・*: Stripe / 隲区ｱよ嶌謇輔＞
- **螻暮幕**: JP 竊・SEA 竊・KR

## 繝代・繝医リ繝ｼ繝励Ο繧ｰ繝ｩ繝

| 繝・ぅ繧｢ | 雋ｩ螢ｲ蜿ｯ閭ｽ陬ｽ蜩・| 荳ｻ縺ｪ迚ｹ蜈ｸ |
|:------:|:----------:|:--------:|
| Registered | Tier 3+4 | 繝昴・繧ｿ繝ｫ繧｢繧ｯ繧ｻ繧ｹ縲√ヨ繝ｬ繝ｼ繝九Φ繧ｰ |
| Silver | Tier 2+3+4 | 蟆ゆｻｻ諡・ｽ薙√Μ繝ｼ繝牙・譛・|
| Gold | 蜈ｨ陬ｽ蜩・| 蝨ｰ蝓溽峡蜊讓ｩ縺ｮ蜊碑ｭｰ蜿ｯ |

> 莉募・繧悟､蠑慕紫繝ｻ繧ｳ繝溘ャ繧ｷ繝ｧ繝ｳ邇・・繝代・繝医リ繝ｼ縺ｨ縺ｮ蛟句挨蜊碑ｭｰ縺ｫ繧医ｊ豎ｺ螳壹・

## API

```typescript
import { getSalesChannel, getProductTier } from '@/insight-common/config/pricing';
import { getSalesStrategy } from '@/insight-common/config/sales-strategy';
import { getResellerProducts } from '@/insight-common/config/reseller-strategy';
```

## 隧ｳ邏ｰ繝ｪ繝輔ぃ繝ｬ繝ｳ繧ｹ

- `insight-common/config/products.ts` 窶・陬ｽ蜩∝ｮ夂ｾｩ
- `insight-common/config/pricing.ts` 窶・陬ｽ蜩∬ｲｩ螢ｲ諠・ｱ
- `insight-common/config/sales-strategy.ts` 窶・雋ｩ螢ｲ謌ｦ逡･
- `insight-common/config/reseller-strategy.ts` 窶・繝代・繝医リ繝ｼ謌ｦ逡･
