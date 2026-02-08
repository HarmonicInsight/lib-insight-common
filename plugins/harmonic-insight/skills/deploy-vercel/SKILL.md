---
name: deploy-vercel
description: Vercel へのデプロイパターン。Next.js アプリ、API Routes、Serverless Functions の Vercel デプロイ時に適用。
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash
argument-hint: "[project-name]"
---

# Vercel デプロイパターン

対象: Next.js Web アプリ、Web ダッシュボード、マーケティングサイト

## 標準構成

```
your-app/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/               # API Routes
│       └── [...route]/
│           └── route.ts   # withGateway() 使用
├── vercel.json
├── next.config.js
└── package.json
```

## vercel.json

```json
{
  "framework": "nextjs",
  "regions": ["hnd1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

## 環境変数

```bash
# Vercel CLI で設定
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add FIREBASE_PROJECT_ID
```

## API Routes は withGateway()

```typescript
// app/api/endpoint/route.ts
import { withGateway } from '@/insight-common/infrastructure/api/gateway';

export const POST = withGateway(handler, {
  requireAuth: true,
  rateLimit: 60,
});
```

## デプロイコマンド

```bash
# プレビューデプロイ
vercel

# 本番デプロイ
vercel --prod

# ログ確認
vercel logs <deployment-url>
```

## 本番チェックリスト

- [ ] リージョン: `hnd1`（東京）
- [ ] 環境変数がすべて設定済み
- [ ] API は `withGateway()` 使用
- [ ] カスタムドメイン設定
- [ ] Ivory & Gold テーマ適用済み
