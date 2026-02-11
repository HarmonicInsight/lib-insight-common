---
name: product-config
description: 製品設定・価格・販売戦略の参照。新製品追加、価格設定、機能マトリクス定義、パートナープログラム設定の作業時に自動適用。
allowed-tools: Read, Grep, Glob
---

# 製品設定・価格・販売戦略

## 製品コード一覧

### Tier 1: 業務変革ツール（高単価）

| コード | 製品名 | STD/年 | PRO/年 |
|-------|-------|--------|--------|
| INCA | InsightNoCodeAnalyzer | ¥1,980,000 | ¥3,980,000 |
| INBT | InsightBot | ¥1,480,000 | ¥2,980,000 |
| IVIN | InterviewInsight | 個別見積 | 個別見積 |

### Tier 2: AI活用ツール（中単価）

| コード | 製品名 | STD/年 | PRO/年 |
|-------|-------|--------|--------|
| INMV | InsightMovie | ¥980,000 | ¥1,980,000 |
| INIG | InsightImageGen | ¥480,000 | ¥980,000 |

### Tier 3: InsightOffice Suite（導入ツール）

| コード | 製品名 | STD/人/年 | PRO/人/年 |
|-------|-------|----------|----------|
| INSS | InsightOfficeSlide | ¥39,800 | ¥49,800 |
| IOSH | InsightOfficeSheet | ¥39,800 | ¥49,800 |
| IOSD | InsightOfficeDoc | ¥39,800 | ¥49,800 |
| INPY | InsightPy | ¥39,800 | ¥49,800 |

## 新製品追加手順

1. `config/products.ts` に製品コード・機能マトリクス登録
2. `config/pricing.ts` に価格設定
3. `config/sales-strategy.ts` に販売戦略
4. CLAUDE.md の製品一覧に追加
5. ライセンス機能マトリクス定義

## 販売戦略

- **全製品 B2B Only**（個人向け販売なし）
- **販売方法**: コンサル案件内での直接提案 + パートナー経由
- **決済**: Stripe / 請求書払い
- **展開**: JP → SEA → KR

## パートナープログラム

| ティア | 仕入値引 | 初年度コミッション | 年間最低件数 |
|:------:|:-------:|:----------------:|:----------:|
| Registered | 20% | 20% | なし |
| Silver | 30% | 30% | 5件 |
| Gold | 40% | 40% | 20件 |

## API

```typescript
import { getPrice, getSalesChannel } from '@/insight-common/config/pricing';
import { getSalesStrategy } from '@/insight-common/config/sales-strategy';
import { calculateWholesalePrice } from '@/insight-common/config/reseller-strategy';
```

## 詳細リファレンス

- `insight-common/config/products.ts` — 製品定義
- `insight-common/config/pricing.ts` — 価格設定
- `insight-common/config/sales-strategy.ts` — 販売戦略
- `insight-common/config/reseller-strategy.ts` — パートナー戦略
