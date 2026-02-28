# HARMONIC insight ライセンス管理

HARMONIC insight 製品群の共通ライセンス管理モジュールです。

## ライセンスキー形式

```
PPPP-PLAN-YYMM-HASH-SIG1-SIG2

例:
INSS-TRIAL-2701-A1B2-C3D4-X9Z1   # Insight Deck Quality Gate トライアル
IOSH-BIZ-2701-E5F6-G7H8-Y0W2     # Insight Performance Management Business
IVIN-BIZ-2701-I9J0-K1L2-Z1A3     # InterviewInsight Business
```

## 製品コード

### 【A】個人向け（Individual）

| コード | 製品名 | 説明 |
|--------|--------|------|
| `INSS` | Insight Deck Quality Gate | AIアシスタント搭載 プレゼン支援 |
| `IOSH` | Insight Performance Management | AIアシスタント搭載 スプレッドシート支援 |
| `IOSD` | Insight AI Briefcase | AIアシスタント搭載 ドキュメント支援 |
| `INPY` | InsightPy | AIエディタ搭載 Python開発支援 |
| `INMV` | InsightCast | 動画作成 |
| `INIG` | InsightImageGen | AI画像・音声生成 |

### 【B】コンサルティング連動型（Corporate）

| コード | 製品名 | 説明 |
|--------|--------|------|
| `INBT` | InsightBot | AIエディタ搭載 RPA自動化 |
| `INCA` | InsightNoCodeAnalyzer | ローコード解析 |
| `IVIN` | InterviewInsight | 面接支援 |

## ティア

| コード | 名称 | 期間 | 説明 |
|--------|------|------|------|
| `FREE` | Free | 無期限 | 基本機能 |
| `TRIAL` | Trial | 30日間 | 全機能利用可能（評価用） |
| `BIZ` | Business | 年間（365日） | 法人向け全機能 |
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
  plan: 'BIZ',
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
    plan=Plan.BIZ,
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
  → INSS-TRIAL-2701-XXXX-XXXX-XXXX  (期限付きでトライアル配布)

Phase 2: 正式販売
  → INSS-BIZ-2701-XXXX-XXXX-XXXX   (Business版)
  → INSS-ENT-2701-XXXX-XXXX-XXXX   (Enterprise版)

Phase 3: 全製品展開
  → IOSH-BIZ-2701-XXXX-XXXX-XXXX  (Insight Performance Management)
  → IVIN-BIZ-2701-XXXX-XXXX-XXXX  (InterviewInsight)
```

## キー構造

| 部分 | 説明 |
|------|------|
| `PPPP` | 製品コード（4文字） |
| `PLAN` | プラン（FREE/TRIAL/BIZ/ENT） |
| `YYMM` | 有効期限（年月） |
| `HASH` | メールハッシュ（SHA256 Base32 先頭4文字） |
| `SIG1-SIG2` | HMAC-SHA256署名（Base32 先頭8文字） |

## 機能

- ライセンスキーの生成・検証
- チェックサムによる改ざん検知
- 有効期限の管理（任意指定可能）
- ティア別機能制限
- 製品カバレッジ判定（ALLは全製品対応）
- オフライン検証対応
