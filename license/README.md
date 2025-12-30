# Insight Series ライセンス管理

Insight Series製品群の共通ライセンス管理モジュールです。

## ライセンスキー形式

```
INS-[PRODUCT]-[TIER]-[XXXX]-[XXXX]-[CC]

例:
INS-ALL-TRIAL-A1B2-C3D4-X9     # 全製品トライアル
INS-ALL-PRO-E5F6-G7H8-Y0       # 全製品Professional
INS-SALES-STD-I9J0-K1L2-Z1     # SalesInsight Standard
```

## 製品コード

| コード | 製品名 | 説明 |
|--------|--------|------|
| `SALES` | SalesInsight | 営業管理 |
| `SLIDE` | InsightSlide | スライド管理 |
| `PY` | InsightPy | Python開発支援 |
| `INTV` | InterviewInsight | インタビュー支援 |
| `ALL` | Insight Series Bundle | 全製品バンドル |

## ティア

| コード | 名称 | 期間 | 説明 |
|--------|------|------|------|
| `TRIAL` | Trial | 任意指定（デフォルト14日） | トライアル版 |
| `STD` | Standard | 年間（12ヶ月） | 標準版 |
| `PRO` | Professional | 年間（12ヶ月） | プロ版 |
| `ENT` | Enterprise | 永久 | 法人向け |

## 機能制限

| ティア | ファイル数 | レコード数 | バッチ | エクスポート | クラウド同期 |
|--------|-----------|-----------|--------|-------------|-------------|
| TRIAL | 10 | 500 | ✅ | ✅ | ❌ |
| STD | 50 | 5,000 | ✅ | ✅ | ❌ |
| PRO | ∞ | 50,000 | ✅ | ✅ | ✅ |
| ENT | ∞ | ∞ | ✅ | ✅ | ✅ |

## 使用方法

### TypeScript版

```typescript
import {
  LicenseValidator,
  generateLicenseWithExpiry,
  getFeatureLimits
} from '@insight/license';

// ライセンス生成（期限指定）
const { licenseKey, expiresAt } = generateLicenseWithExpiry({
  productCode: 'ALL',
  tier: 'TRIAL',
  expiresAt: new Date('2025-03-31')  // 任意の期限
});

// ライセンス検証
const validator = new LicenseValidator();
const result = validator.validate(licenseKey, expiresAt);

if (result.isValid) {
  console.log(`Product: ${result.product}, Tier: ${result.tier}`);

  // 機能制限取得
  const limits = getFeatureLimits(result.tier);
  console.log(`Max files: ${limits.maxFiles}`);
}
```

### Python版

```python
from datetime import datetime
from insight_license import (
    LicenseValidator,
    generate_license_with_expiry,
    get_feature_limits,
    ProductCode,
    LicenseTier,
)

# ライセンス生成（期限指定）
result = generate_license_with_expiry(
    product_code=ProductCode.ALL,
    tier=LicenseTier.TRIAL,
    expires_at=datetime(2025, 3, 31)  # 任意の期限
)
license_key = result["license_key"]
expires_at = result["expires_at"]

# ライセンス検証
validator = LicenseValidator()
info = validator.validate(license_key, expires_at)

if info.is_valid:
    print(f"Product: {info.product}, Tier: {info.tier}")

    # 機能制限取得
    limits = get_feature_limits(info.tier)
    print(f"Max files: {limits.max_files}")
```

## 運用フロー

```
Phase 1: リリース初期
  → INS-ALL-TRIAL-XXXX-XXXX-XX  (期限指定でトライアル配布)

Phase 2: 正式販売
  → INS-ALL-STD-XXXX-XXXX-XX   (Standard版)
  → INS-ALL-PRO-XXXX-XXXX-XX   (Professional版)

Phase 3: 製品別販売（将来）
  → INS-SALES-PRO-XXXX-XXXX-XX  (製品別に分離)
```

## キー構成

| 部分 | 説明 |
|------|------|
| `INS` | Insight Series固定プレフィックス |
| `[PRODUCT]` | 製品コード |
| `[TIER]` | ライセンスティア |
| `[XXXX]-[XXXX]` | 8桁のランダム英数字 |
| `[CC]` | 2桁のチェックサム |

## 機能

- ライセンスキーの生成・検証
- チェックサムによる改ざん検出
- 有効期限の管理（任意指定可能）
- ティア別機能制限
- 製品カバレッジ判定（ALLは全製品対応）
- オフライン検証対応
