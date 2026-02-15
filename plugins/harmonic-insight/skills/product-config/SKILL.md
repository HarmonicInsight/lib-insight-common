---
name: product-config
description: 製品設定・販売戦略の参照。新製品追加、機能マトリクス定義、パートナープログラム設定の作業時に自動適用。
allowed-tools: Read, Grep, Glob
---

# 製品設定・販売戦略

## 製品コード一覧

### Tier 1: 業務変革ツール

| コード | 製品名 |
|-------|-------|
| INCA | InsightNoCodeAnalyzer |
| INBT | InsightBot |
| IVIN | InterviewInsight |

### Tier 2: AI活用ツール

| コード | 製品名 |
|-------|-------|
| INMV | InsightMovie |
| INIG | InsightImageGen |

### Tier 3: InsightOffice Suite（導入ツール）

| コード | 製品名 |
|-------|-------|
| INSS | InsightOfficeSlide |
| IOSH | InsightOfficeSheet |
| IOSD | InsightOfficeDoc |
| INPY | InsightPy |

### Tier 4: InsightSeniorOffice

| コード | 製品名 |
|-------|-------|
| ISOF | InsightSeniorOffice |

> **価格は全製品個別見積もり。パートナー（販売代理店）との協議により決定。**

## 新製品追加手順

1. `config/products.ts` に製品コード・機能マトリクス登録
2. `config/pricing.ts` に販売情報を設定
3. `config/sales-strategy.ts` に販売戦略
4. CLAUDE.md の製品一覧に追加
5. ライセンス機能マトリクス定義

## 販売戦略

- **全製品 B2B Only**（個人向け販売なし）
- **販売方法**: コンサル案件内での直接提案 + パートナー経由
- **決済**: Stripe / 請求書払い
- **展開**: JP → SEA → KR

## パートナープログラム

| ティア | 販売可能製品 | 主な特典 |
|:------:|:----------:|:--------:|
| Registered | Tier 3+4 | ポータルアクセス、トレーニング |
| Silver | Tier 2+3+4 | 専任担当、リード共有 |
| Gold | 全製品 | 地域独占権の協議可 |

> 仕入れ値引率・コミッション率はパートナーとの個別協議により決定。

## API

```typescript
import { getSalesChannel, getProductTier } from '@/insight-common/config/pricing';
import { getSalesStrategy } from '@/insight-common/config/sales-strategy';
import { getResellerProducts } from '@/insight-common/config/reseller-strategy';
```

## 詳細リファレンス

- `insight-common/config/products.ts` — 製品定義
- `insight-common/config/pricing.ts` — 製品販売情報
- `insight-common/config/sales-strategy.ts` — 販売戦略
- `insight-common/config/reseller-strategy.ts` — パートナー戦略
