# Insight Series 共通エラー定義

製品間で共有するエラー型とエラーコードです。

## エラーコード

| カテゴリ | コード | 説明 |
|---------|--------|------|
| 一般 | `UNKNOWN` | 不明なエラー |
| 一般 | `VALIDATION` | バリデーションエラー |
| 一般 | `NOT_FOUND` | リソースが見つからない |
| ネットワーク | `NETWORK` | ネットワークエラー |
| ネットワーク | `TIMEOUT` | タイムアウト |
| ネットワーク | `SERVER_ERROR` | サーバーエラー |
| 認証 | `UNAUTHORIZED` | 認証が必要 |
| 認証 | `FORBIDDEN` | アクセス拒否 |
| 認証 | `SESSION_EXPIRED` | セッション期限切れ |
| ライセンス | `LICENSE_REQUIRED` | ライセンスが必要 |
| ライセンス | `LICENSE_INVALID` | 無効なライセンス |
| ライセンス | `LICENSE_EXPIRED` | ライセンス期限切れ |
| ライセンス | `FEATURE_LOCKED` | 機能がロック |
| ライセンス | `LIMIT_EXCEEDED` | 上限超過 |
| ファイル | `FILE_NOT_FOUND` | ファイルが見つからない |
| ファイル | `FILE_TOO_LARGE` | ファイルサイズ超過 |

## 使用方法

### TypeScript

```typescript
import {
  InsightError,
  LicenseError,
  ValidationError,
  ErrorCode,
  isRetryable
} from '@insight/errors';

// ライセンスエラー
throw new LicenseError('LICENSE_EXPIRED', 'ライセンスの有効期限が切れています');

// バリデーションエラー
throw new ValidationError([
  { field: 'email', message: '有効なメールアドレスを入力してください' }
]);

// エラーハンドリング
try {
  await fetchData();
} catch (e) {
  const error = toInsightError(e);
  if (isRetryable(error)) {
    // リトライ処理
  }
}
```

### Python

```python
from insight_common.errors import (
    InsightError,
    LicenseError,
    ValidationError,
    ErrorCode,
    is_retryable
)

# ライセンスエラー
raise LicenseError(ErrorCode.LICENSE_EXPIRED, 'ライセンスの有効期限が切れています')

# バリデーションエラー
raise ValidationError([
    {'field': 'email', 'message': '有効なメールアドレスを入力してください'}
])

# エラーハンドリング
try:
    fetch_data()
except Exception as e:
    error = to_insight_error(e)
    if is_retryable(error):
        # リトライ処理
        pass
```

## i18n との連携

エラーコードから i18n のメッセージキーを取得できます：

```typescript
import { getErrorMessageKey } from '@insight/errors';
import { t } from '@insight/i18n';

const messageKey = getErrorMessageKey(error.code);
const message = t(messageKey);
```
