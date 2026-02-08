---
name: deploy-cloudflare
description: Cloudflare Pages / Workers へのデプロイパターン。静的サイト、Next.js SSR、Edge Functions の Cloudflare デプロイ時に適用。
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash
argument-hint: "[project-name]"
---

# Cloudflare Pages / Workers デプロイパターン

対象: Web フロントエンド、ランディングページ、静的サイト、Edge API

## Cloudflare Pages（静的 / SSR）

### wrangler.toml

```toml
name = "your-project"
compatibility_date = "2025-01-01"
pages_build_output_dir = "./out"
```

### Next.js on Cloudflare Pages

```bash
# next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  # 静的エクスポートの場合
};
```

### デプロイコマンド

```bash
# Pages デプロイ
npx wrangler pages deploy ./out --project-name=your-project

# プレビューデプロイ
npx wrangler pages deploy ./out --project-name=your-project --branch=preview
```

## Cloudflare Workers（Edge API）

### worker エントリポイント

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // ...
  },
};
```

## 環境変数

```bash
# Wrangler で設定
npx wrangler secret put SUPABASE_URL
npx wrangler secret put FIREBASE_PROJECT_ID
```

## 本番チェックリスト

- [ ] カスタムドメイン設定
- [ ] 環境変数（Secrets）設定済み
- [ ] CORS ヘッダー適切
- [ ] キャッシュ設定最適化
- [ ] ブランドカラー（Ivory & Gold）適用済み
