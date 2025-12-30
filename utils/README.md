# Insight Series 共通ユーティリティ

製品間で共有するユーティリティ関数群です。

## 機能

| カテゴリ | 関数 |
|---------|------|
| 日付 | `formatDate`, `formatRelativeDate`, `daysUntil` |
| 数値 | `formatNumber`, `formatCurrency`, `formatPercent`, `formatFileSize` |
| 文字列 | `truncate`, `toSnakeCase`, `toCamelCase`, `toPascalCase` |
| バリデーション | `isValidEmail`, `isValidUrl`, `isValidPhoneJP` |
| 配列 | `groupBy`, `unique`, `sortByLocale` |
| その他 | `sleep`, `debounce`, `throttle`, `generateId`, `deepClone`, `isEmpty` |

## 使用方法

### TypeScript

```typescript
import {
  formatDate,
  formatCurrency,
  truncate,
  isValidEmail,
  debounce
} from '@insight/utils';

formatDate(new Date(), 'long', 'ja');  // "2025年1月15日"
formatCurrency(1500);                   // "1,500万円"
truncate('長いテキスト', 5);            // "長いテ..."
isValidEmail('test@example.com');       // true

const debouncedSearch = debounce(search, 300);
```

### Python

```python
from insight_common.utils import (
    format_date,
    format_currency,
    truncate,
    is_valid_email,
    debounce
)

format_date(datetime.now(), 'long', 'ja')  # "2025年1月15日"
format_currency(1500)                       # "1,500万円"
truncate('長いテキスト', 5)                 # "長いテ..."
is_valid_email('test@example.com')          # True

@debounce(0.3)
def search(query):
    pass
```
