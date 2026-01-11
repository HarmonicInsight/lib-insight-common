# Insight Apps Infrastructure

Firebase + Supabase ハイブリッドアーキテクチャの共通基盤

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                   Firebase                           │
│  ┌──────────┬──────────┬──────────┬──────────┐     │
│  │   Auth   │   FCM    │Analytics │Crashlytics│    │
│  └──────────┴──────────┴──────────┴──────────┘     │
└─────────────────────────────────────────────────────┘
        ↑                    │
        │                    ▼
┌───────┴─────────┐  ┌─────────────────────────────────┐
│  Vercel Functions│  │          Supabase               │
│  (認証・権限判定) │→│  (PostgreSQL: 業務データ)        │
└─────────────────┘  └─────────────────────────────────┘
        ↑
┌───────┴───────────────────────────────────────────┐
│            Apps (Web / Android / Desktop)          │
└───────────────────────────────────────────────────┘
```

## 設計原則

| ルール | 説明 |
|--------|------|
| **Firebase UID が正** | 全アプリ共通の主キー |
| **業務データは Supabase** | PostgreSQL の柔軟性 |
| **書き込みはサーバー経由** | RLS 不要、事故防止 |
| **権限はサーバーで判定** | クライアント改造対策 |

## ディレクトリ構成

```
infrastructure/
├── auth/
│   ├── firebase-admin.ts   # サーバー用 Firebase
│   └── firebase-client.ts  # クライアント用 Firebase
├── api/
│   ├── verify.ts           # /api/auth/verify
│   ├── entitlement-check.ts # /api/entitlement/check ★
│   └── activate-license.ts # /api/entitlement/activate
├── db/
│   └── schema.sql          # Supabase テーブル定義
├── scripts/
│   ├── check-env.ts        # 環境変数チェック
│   ├── check-connection.ts # 接続テスト
│   ├── setup-supabase.ts   # DB セットアップ
│   └── test-auth.ts        # 認証テスト
├── .env.example            # 環境変数テンプレート
└── README.md
```

## セットアップ手順

### 1. 環境変数設定

```bash
cp .env.example .env.local
# 各値を設定
```

### 2. 環境変数チェック

```bash
npm run check:env
# または
npx ts-node scripts/check-env.ts
```

### 3. Supabase スキーマ作成

```bash
# Supabase Dashboard の SQL Editor で schema.sql を実行
# または
npm run setup:supabase
```

### 4. 接続テスト

```bash
npm run check:connection
```

### 5. 認証テスト（開発時）

```bash
# .env.local に追加
TEST_FIREBASE_UID=dev-user-001

# テスト実行
npm run test:auth
```

## API エンドポイント

| エンドポイント | メソッド | 説明 |
|---------------|----------|------|
| `/api/auth/verify` | POST | トークン検証 + ユーザー登録 |
| `/api/entitlement/check` | POST | 機能利用可否チェック ★ |
| `/api/entitlement/activate` | POST | ライセンス有効化 |

### entitlement/check の使用例

```typescript
// クライアント側
const result = await fetch('/api/entitlement/check', {
  method: 'POST',
  headers: await getAuthHeaders(),
  body: JSON.stringify({
    product_code: 'INSS',
    feature: 'export_pdf'
  })
});

const { allowed, plan, reason } = await result.json();

if (allowed) {
  // 機能を実行
} else {
  // アップグレード案内
  showUpgradeDialog(reason);
}
```

## 開発時の割り切り

```
✔ Firebase Auth 自体はテストしない
✔ テスト対象は「UIDを受け取った後の世界」
✔ 開発時は TEST_FIREBASE_UID でモック
```

## package.json に追加

```json
{
  "scripts": {
    "check:env": "ts-node infrastructure/scripts/check-env.ts",
    "check:connection": "ts-node infrastructure/scripts/check-connection.ts",
    "setup:supabase": "ts-node infrastructure/scripts/setup-supabase.ts",
    "test:auth": "ts-node infrastructure/scripts/test-auth.ts"
  }
}
```
