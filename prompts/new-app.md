# 新規アプリ作成プロンプト

> Claude Code または開発者が新規アプリを作成する際に使用するプロンプトテンプレート

---

## 基本情報入力

以下の情報を確定してから開発を開始してください:

```yaml
app_name: ""           # 例: insight-journal
product_code: ""       # 例: INJL (4文字、INで始まる)
description: ""        # 1行説明
target_users: ""       # 対象ユーザー
main_features:         # 主要機能（3-5個）
  - ""
  - ""
  - ""
```

---

## 開発開始コマンド

```bash
# 1. リポジトリ作成＆初期化
./insight-common/scripts/init-app.sh {{app_name}}

# 2. ディレクトリ移動
cd ../{{app_name}}

# 3. 依存関係インストール
npm install

# 4. 環境変数設定
cp .env.example .env.local
# → .env.local を編集

# 5. セットアップ確認
./insight-common/scripts/check-app.sh
```

---

## API実装テンプレート

新しいAPIエンドポイントを作成する際は以下のテンプレートを使用:

```typescript
// pages/api/{{endpoint}}.ts

import { withGateway, sendSuccess, sendError, ErrorCodes } from '@/insight-common/infrastructure/api/gateway';
import type { GatewayRequest } from '@/insight-common/infrastructure/api/gateway';

interface RequestBody {
  // リクエストボディの型定義
}

interface ResponseData {
  // レスポンスデータの型定義
}

export default withGateway<ResponseData>(
  async (req, res) => {
    const { user } = req;  // 認証済みユーザー
    const body = req.body as RequestBody;

    // ビジネスロジック

    return {
      // レスポンスデータ
    };
  },
  {
    requireAuth: true,
    rateLimit: 60,
    audit: true,
    validateBody: {
      type: 'object',
      required: ['field1'],
      properties: {
        field1: { type: 'string', minLength: 1 },
      },
    },
  }
);
```

---

## 機能別設定

### 認証が不要な公開API

```typescript
withGateway(handler, {
  requireAuth: false,
  rateLimit: 30,  // 公開APIは厳しめに
});
```

### Pro以上のみ使用可能

```typescript
withGateway(handler, {
  requireAuth: true,
  requiredPlan: ['PRO', 'ENT'],
});
```

### APIキー認証（S2S）

```typescript
withGateway(handler, {
  requireApiKey: true,
  requiredScopes: ['read', 'write'],
});
```

### 監査ログ詳細記録

```typescript
withGateway(handler, {
  audit: true,
  auditLevel: 'full',  // リクエストボディも記録
});
```

---

## フロントエンド共通コンポーネント

```typescript
// 認証
import { useAuth } from '@/insight-common/infrastructure/auth/firebase-client';

// ブランドカラー
import colors from '@/insight-common/brand/colors.json';

// 音声入力（利用可能な場合）
import { VoiceInput } from '@/insight-common/components/VoiceInput';
```

---

## Supabaseテーブル設計

アプリ固有のテーブルを作成する場合:

```sql
-- 命名規則: {{product_code}}_{{table_name}}
-- 例: injl_entries, injl_tags

CREATE TABLE IF NOT EXISTS injl_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- アプリ固有フィールド
    content TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_injl_entries_user
ON injl_entries(user_id, created_at DESC);
```

---

## リリース前チェックリスト

- [ ] 全APIで `withGateway()` 使用
- [ ] 環境変数が `.env.example` に記載
- [ ] 製品コードを `CLAUDE.md` に追加
- [ ] Supabase に製品登録
- [ ] `check-app.sh` がパス
- [ ] READMEにセットアップ手順記載
- [ ] ライセンス表記確認

---

## 困ったとき

### 認証エラー

```bash
npx ts-node ./insight-common/infrastructure/scripts/test-auth.ts
```

### DB接続エラー

```bash
npx ts-node ./insight-common/infrastructure/scripts/check-connection.ts
```

### 環境変数確認

```bash
npx ts-node ./insight-common/infrastructure/scripts/check-env.ts
```
