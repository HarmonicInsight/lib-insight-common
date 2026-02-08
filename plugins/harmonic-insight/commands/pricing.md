---
description: 製品の価格情報・販売戦略・パートナーコミッションを参照。見積もり作成や価格確認に使用。
argument-hint: "[product-code] [plan]"
---

# 価格・販売戦略参照

製品コード: $0
プラン: $1

## 価格表の参照

`insight-common/config/pricing.ts` から該当製品の価格を取得して表示。

```typescript
import { getPrice, getSalesChannel } from '@/insight-common/config/pricing';

const price = getPrice('$0', '$1');
// { annualPrice, currency, monthlyEquivalent, unit }
```

## パートナー販売価格の計算

```typescript
import { calculateWholesalePrice } from '@/insight-common/config/reseller-strategy';

// 各ティアの仕入れ価格を表示
calculateWholesalePrice(price.annualPrice, 'registered');  // 20% off
calculateWholesalePrice(price.annualPrice, 'silver');       // 30% off
calculateWholesalePrice(price.annualPrice, 'gold');         // 40% off
```

## 表示フォーマット

以下の形式で回答:

```
【$0 — $1 プラン】
定価: ¥XXX,XXX/年（税抜）
月額換算: ¥XX,XXX/月

パートナー仕入れ価格:
  Registered (20% off): ¥XXX,XXX/年
  Silver (30% off):     ¥XXX,XXX/年
  Gold (40% off):       ¥XXX,XXX/年
```

## 詳細リファレンス

- `insight-common/config/pricing.ts` — 全製品価格定義
- `insight-common/config/reseller-strategy.ts` — パートナー戦略
- `insight-common/config/sales-strategy.ts` — 販売戦略
