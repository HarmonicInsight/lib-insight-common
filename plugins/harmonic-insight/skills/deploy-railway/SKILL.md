---
name: deploy-railway
description: Railway へのデプロイパターン。Hono API サーバー、ライセンスサーバー、バックエンドサービスの Railway デプロイ時に適用。
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash
argument-hint: "[service-name]"
---

# Railway デプロイパターン

対象: ライセンスサーバー、API バックエンド、Hono サーバー

## 標準構成

```
your-service/
├── src/
│   └── index.ts           # Hono エントリポイント
├── Dockerfile             # (optional) カスタムビルド
├── railway.json           # Railway 設定
├── package.json
└── tsconfig.json
```

## railway.json

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 必須環境変数

```bash
# Railway ダッシュボードで設定
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
FIREBASE_PROJECT_ID=harmonic-insight-xxx
RESEND_API_KEY=re_xxx
STRIPE_SECRET_KEY=sk_live_xxx
```

## Hono サーバーテンプレート

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

export default {
  port: parseInt(process.env.PORT || '3000'),
  fetch: app.fetch,
};
```

## デプロイコマンド

```bash
# Railway CLI
railway login
railway link
railway up

# ログ確認
railway logs

# 環境変数設定
railway variables set KEY=VALUE
```

## ヘルスチェック

`/health` エンドポイント必須。Railway のヘルスチェックで使用。

## 本番設定チェックリスト

- [ ] 環境変数がすべて設定済み
- [ ] `/health` エンドポイントが応答
- [ ] CORS が適切に設定
- [ ] レート制限が有効
- [ ] 監査ログが有効
