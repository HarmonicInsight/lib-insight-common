# Insight Series ライセンス管理

Insight Series製品群のライセンス管理モジュールです。

## ライセンスキー形式

```
INS-[PRODUCT]-[TIER]-[XXXX]-[XXXX]-[CC]
```

### 製品コード

| コード | 製品名 |
|--------|--------|
| SALES | SalesInsight |
| SLIDE | InsightSlide |
| PY | InsightPy |
| INTV | InterviewInsight |
| ALL | 全製品バンドル |

### ティア

| コード | 説明 |
|--------|------|
| TRIAL | トライアル（期間指定） |
| STD | Standard（年間ライセンス） |
| PRO | Professional（年間ライセンス） |
| ENT | Enterprise（永久ライセンス） |

### キー構成

- `INS`: Insight Series固定プレフィックス
- `[PRODUCT]`: 製品コード（上記参照）
- `[TIER]`: ライセンスティア（上記参照）
- `[XXXX]-[XXXX]`: 8桁のランダム英数字
- `[CC]`: 2桁のチェックサム

## 実装

### TypeScript版

Tauri/React製デスクトップアプリケーション向け。

```typescript
import { LicenseValidator } from 'insight-common/license/typescript';

const validator = new LicenseValidator();
const result = await validator.validate(licenseKey);
```

### Python版

InsightPy等のPython製アプリケーション向け。

```python
from insight_common.license import LicenseValidator

validator = LicenseValidator()
result = validator.validate(license_key)
```

## 機能

- ライセンスキーの検証
- ティア判定
- 有効期限チェック
- オフライン検証対応
