---
description: 製品の販売情報・パートナーティア別販売条件を参照。見積もり依頼や販売チャネル確認に使用。
argument-hint: "[product-code]"
---

# 製品販売情報参照

製品コード: $0

## 販売情報の参照

`insight-common/config/pricing.ts` から該当製品の販売情報を取得して表示。

```typescript
import { getSalesChannel, getProductTier, getProductSalesInfo } from '@/insight-common/config/pricing';

const info = getProductSalesInfo('$0');
// { productCode, channel, channelDescription, tier, pricingUnit, notes }
```

## パートナー販売条件

```typescript
import { getResellerProducts } from '@/insight-common/config/reseller-strategy';

// ティア別の販売可能製品を確認
getResellerProducts('registered');
getResellerProducts('silver');
getResellerProducts('gold');
```

## 表示フォーマット

以下の形式で回答:

```
【$0】
販売チャネル: コンサルティング連動
製品ティア: Tier X
価格単位: per_company / per_user
価格: 個別見積もり（パートナーと協議の上決定）
```

## 詳細リファレンス

- `insight-common/config/pricing.ts` — 製品販売情報
- `insight-common/config/reseller-strategy.ts` — パートナー戦略
- `insight-common/config/sales-strategy.ts` — 販売戦略
