# Insight Series ライセンス管理

Insight Series製品群の共通ライセンス管理モジュールです。

## ライセンスキー形式

```
PPPP-PLAN-YYMM-HASH-SIG1-SIG2

例:
INSS-TRIAL-2701-A1B2-C3D4-X9Z1   # InsightOfficeSlide トライアル
IOSH-PRO-2701-E5F6-G7H8-Y0W2     # InsightOfficeSheet Professional
IVIN-STD-2701-I9J0-K1L2-Z1A3     # InterviewInsight Standard
```

## 製品コード

| コード | 製品名 | 説明 |
|--------|--------|------|
| `INSS` | InsightOfficeSlide | プレゼン支援 |
| `IOSH` | InsightOfficeSheet | スプレッドシート支援 |
| `IOSD` | InsightOfficeDoc | ドキュメント支援 |
| `INPY` | InsightPy | Python開発支援 |
| `INMV` | InsightMovie | 動画作成 |
| `INBT` | InsightBot | RPA自動化 |
| `INCA` | InsightNoCodeAnalyzer | ローコード解析 |
| `INIG` | InsightImageGen | AI画像・音声生成 |
| `IVIN` | InterviewInsight | 面接支援 |

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
  → INSS-TRIAL-2701-XXXX-XXXX-XXXX  (期限指定でトライアル配布)

Phase 2: 正式販売
  → INSS-STD-2701-XXXX-XXXX-XXXX   (Standard版)
  → INSS-PRO-2701-XXXX-XXXX-XXXX   (Professional版)

Phase 3: 全製品展開
  → IOSH-PRO-2701-XXXX-XXXX-XXXX  (InsightOfficeSheet)
  → IVIN-STD-2701-XXXX-XXXX-XXXX  (InterviewInsight)
```

## キー構成

| 部分 | 説明 |
|------|------|
| `PPPP` | 製品コード（4文字） |
| `PLAN` | プラン（TRIAL/STD/PRO） |
| `YYMM` | 有効期限（年月） |
| `HASH` | メールハッシュ（SHA256 Base32 先頭4文字） |
| `SIG1-SIG2` | HMAC-SHA256署名（Base32 先頭8文字） |

## 機能

- ライセンスキーの生成・検証
- チェックサムによる改ざん検出
- 有効期限の管理（任意指定可能）
- ティア別機能制限
- 製品カバレッジ判定（ALLは全製品対応）
- オフライン検証対応
