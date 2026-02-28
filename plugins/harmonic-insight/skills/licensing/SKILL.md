---
name: licensing
description: ライセンスシステム実装標準。ライセンス検証、プラン管理、ライセンス画面、キー形式、ライセンスサーバー統合の作業時に自動適用。
allowed-tools: Read, Grep, Glob
---

# ライセンスシステム実装標準

## プラン体系（全製品共通 — FREE 廃止）

| プラン | 説明 | 有効期限 |
|-------|------|---------|
| TRIAL | 全機能利用可能（評価用） | 30日間 |
| STD | 法人向け標準機能 | 365日 |
| PRO | 全機能 + AI無制限（BYOK） + コラボレーション | 365日 |
| ENT | カスタマイズ | 要相談 |

## ライセンスキー形式

```
{製品コード}-{プラン}-{YYMM}-{HASH}-{SIG1}-{SIG2}
例: IOSH-STD-2601-XXXX-XXXX-XXXX
```

## ライセンス画面（必須レイアウト）

全製品で Insight Slides 形式のライセンス画面を実装:

```
┌────────────────────────────────────┐
│      製品名（Gold色、中央配置）       │
│         現在のプラン: STD            │
│     有効期限: 2027年01月31日         │
│  ┌──────────────────────────────┐  │
│  │ 機能一覧（プラン別 ○/×）      │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ メールアドレス: [          ]   │  │
│  │ ライセンスキー: [          ]   │  │
│  │ [アクティベート] [クリア]      │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

## ライセンスサーバー

```
https://license.harmonicinsight.com
├── POST /api/activate          # アクティベーション
├── POST /api/verify            # 検証
├── POST /api/entitlement       # エンタイトルメントチェック
└── POST /api/deactivate        # 無効化
```

## 発行チャネル

| チャネル | 説明 |
|---------|------|
| `direct_stripe` | Stripe 決済完了 → 自動発行 |
| `direct_invoice` | 請求書払い → 管理者承認後 |
| `partner_reseller` | パートナー経由 → 自動発行 |
| `system_trial` | メール認証後 → 自動発行（30日） |
| `system_renewal` | サブスク自動更新 |

## プラットフォーム別実装

### TypeScript
```typescript
import { InsightLicenseManager } from '@/insight-common/license/typescript';
```

### Python
```python
from insight_common.license import validate_license
```

### C# / WPF
```csharp
var manager = new InsightLicenseManager("IOSH");
var result = await manager.ActivateAsync(email, key);
```

## 禁止事項

- 独自のライセンス実装（InsightLicenseManager を使用）
- クライアント側での権限判定
- ライセンスチェックの省略

## 詳細リファレンス

- `insight-common/config/license-server.ts` — サーバー設定
- `insight-common/config/license-issuance.ts` — 発行ロジック
- `insight-common/infrastructure/license-api/` — API 実装
- `insight-common/license/` — プラットフォーム別バリデータ
