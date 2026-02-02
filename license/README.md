# Harmonic Insight ライセンス管理

Harmonic Insight 製品群の共通ライセンス管理モジュールです。

## ライセンスキー形式

```
{製品コード}-{プラン}-{YYMM}-{HASH}-{SIG1}-{SIG2}

例:
INSS-STD-2601-XXXX-XXXX-XXXX     # InsightSlide Standard
HMSH-PRO-2601-XXXX-XXXX-XXXX     # HarmonicSheet Professional
INCA-PRO-2601-XXXX-XXXX-XXXX     # InsightNoCodeAnalyzer Professional
```

## 製品コード

### 【A】コンサルティング連動型

| コード | 製品名 | 説明 |
|--------|--------|------|
| `INCA` | InsightNoCodeAnalyzer | RPA・ローコード解析・移行アセスメント |
| `INBT` | InsightBot | Python RPA自動化ボット |
| `FGIN` | ForguncyInsight | Forguncy連携・分析 |
| `INMV` | InsightMovie | 画像・テキスト・PPTからAI動画作成 |
| `INIG` | InsightImageGen | AI画像・音声生成 |

### 【B】グローバルスタンドアロン型

| コード | 製品名 | 説明 |
|--------|--------|------|
| `INSS` | InsightSlide | PowerPointコンテンツ抽出・更新 |
| `INSP` | InsightSlide Pro | プロ向けPowerPointツール |
| `INPY` | InsightPy | Windows自動化Python実行環境 |
| `HMSH` | HarmonicSheet | Excelバージョン管理・チームコラボ |
| `HMDC` | HarmonicDoc | Wordドキュメント操作・自動化 |
| `HMSL` | HarmonicSlide | PowerPoint操作・自動化 |

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

```bash
# InsightSlide Pro（2027年1月まで）
python generate-license.py -p INSP --plan PRO -e user@example.com --expires 2027-01-31

# HarmonicSheet Standard（12ヶ月）
python generate-license.py -p HMSH --plan STD -e user@example.com -m 12

# InsightPy トライアル（14日間）
python generate-license.py -p INPY --trial -e user@example.com
```

## キー構成

| 部分 | 説明 |
|------|------|
| `PPPP` | 製品コード（4文字） |
| `PLAN` | プランコード（TRIAL/STD/PRO/ENT） |
| `YYMM` | 発行年月 |
| `HASH` | HMAC-SHA256由来のハッシュ |
| `SIG1` | 署名パート1 |
| `SIG2` | 署名パート2 |
