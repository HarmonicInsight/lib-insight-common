# Harmonic Insight ライセンス管理

Harmonic Insight 製品群の共通ライセンス管理モジュールです。

## ライセンスキー形式

```
PPPP-PLAN-YYMM-HASH-SIG1-SIG2

例:
INSS-TRIAL-2701-A1B2-C3D4-X9Z1   # InsightOfficeSlide トライアル
IOSH-PRO-2701-E5F6-G7H8-Y0W2     # InsightOfficeSheet Professional
IVIN-STD-2701-I9J0-K1L2-Z1A3     # InterviewInsight Standard
```

## 製品コード

### 【A】個人向け（individual）

| コード | 製品名 | 説明 |
|--------|--------|------|
| `INSS` | InsightOfficeSlide | AIアシスタント搭載 — プレゼン支援 |
| `IOSH` | InsightOfficeSheet | AIアシスタント搭載 — スプレッドシート支援 |
| `IOSD` | InsightOfficeDoc | AIアシスタント搭載 — ドキュメント支援 |
| `INPY` | InsightPy | AIエディタ搭載 — Python開発支援 |
| `INMV` | InsightMovie | 動画作成 |
| `INIG` | InsightImageGen | AI画像・音声生成 |

### 【B】コンサルティング連動型（corporate）

| コード | 製品名 | 説明 |
|--------|--------|------|
| `INBT` | InsightBot | AIエディタ搭載 — RPA自動化 |
| `INCA` | InsightNoCodeAnalyzer | ローコード解析 |
| `IVIN` | InterviewInsight | 面接支援 |

## ティア

| コード | 名称 | 期間 | 説明 |
|--------|------|------|------|
| `FREE` | Free | 無期限 | 機能制限あり |
| `TRIAL` | Trial | 14日間 | 全機能利用可能（評価用） |
| `STD` | Standard | 年間（365日） | 個人向け標準機能 |
| `PRO` | Professional | 年間（365日） | 法人・チーム向け全機能 |
| `ENT` | Enterprise | 要相談 | カスタマイズ |

## 使用方法

### TypeScript版

```typescript
import {
  LicenseValidator,
  generateLicenseKey,
  getFeatureLimits
} from '@insight/license';

// ライセンス生成
const { licenseKey, expiresAt } = generateLicenseKey({
  productCode: 'INSS',
  plan: 'STD',
  email: 'user@example.com',
  expiresAt: new Date('2027-01-31')
});

// ライセンス検証
const validator = new LicenseValidator();
const result = validator.validate(licenseKey, expiresAt);

if (result.isValid) {
  console.log(`Product: ${result.product}, Plan: ${result.plan}`);
}
```

### Python版

```python
from datetime import datetime
from insight_license import (
    LicenseValidator,
    generate_license_key,
    ProductCode,
    Plan,
)

# ライセンス生成
result = generate_license_key(
    product_code=ProductCode.INSS,
    plan=Plan.STD,
    email="user@example.com",
    expires_at=datetime(2027, 1, 31)
)

# ライセンス検証
validator = LicenseValidator()
info = validator.validate(result["license_key"], result["expires_at"])

if info.is_valid:
    print(f"Product: {info.product}, Plan: {info.plan}")
```

### CLI

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
