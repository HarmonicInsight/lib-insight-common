# Harmonic Insight - 新規アプリ開発ガイド

> このドキュメントは新規アプリ作成時に必ず参照してください。

## 1. アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                      あなたのアプリ                          │
├─────────────────────────────────────────────────────────────┤
│  insight-common (サブモジュール)                             │
│  ├── infrastructure/   # 認証・DB・API Gateway              │
│  ├── brand/           # カラー・フォント・ロゴ               │
│  └── components/      # 共通UIコンポーネント                 │
├─────────────────────────────────────────────────────────────┤
│  harmonic-mart-generator (ナレッジ処理が必要な場合)           │
│  ├── ingest/          # PDF解析・チャンキング                │
│  └── search/          # Hybrid Search                       │
└─────────────────────────────────────────────────────────────┘
```

## 2. 必須手順

### Step 1: リポジトリ初期化

```bash
# insight-commonのinit-app.shを使用
curl -sL https://raw.githubusercontent.com/HarmonicInsight/insight-common/main/scripts/init-app.sh | bash -s -- <app-name>

# または既存リポジトリに追加
git submodule add https://github.com/HarmonicInsight/insight-common.git
```

### Step 2: 環境変数設定

`.env.local` に以下を設定:

```env
# Firebase (必須)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# Supabase (必須)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# オプション
REDIS_URL=                    # レート制限用
AUDIT_LOG_WEBHOOK=            # 監査ログ外部連携
SECURITY_ALERT_WEBHOOK=       # セキュリティアラート
```

### Step 3: APIエンドポイント作成

**全てのAPIは `withGateway()` でラップすること:**

```typescript
import { withGateway } from '@/insight-common/infrastructure/api/gateway';

export default withGateway(
  async (req, res) => {
    // req.user にユーザー情報がセット済み
    // ビジネスロジックのみ記述
  },
  {
    requireAuth: true,        // 認証必須
    rateLimit: 60,            // レート制限
    audit: true,              // 監査ログ
  }
);
```

### Step 4: ブランドカラー適用

```typescript
import colors from '@/insight-common/brand/colors.json';

// 製品タイトル: colors.title (#2563EB)
// プライマリ: colors.primary (#6366F1)
// 背景: colors.background (#F8FAFC)
```

## 3. 禁止事項

| ❌ やってはいけない | ✅ 正しいやり方 |
|-------------------|----------------|
| クライアントで権限判定 | `withGateway({ requiredPlan: [...] })` |
| 独自の認証実装 | `infrastructure/auth/firebase-*.ts` |
| 独自のレート制限 | `withGateway({ rateLimit: N })` |
| console.logでエラー記録 | `logAudit()` / `logSecurityEvent()` |
| 独自のAPIキー実装 | `api-keys.ts` の `createApiKey()` |

## 4. プラン別機能制限

```typescript
// entitlement-check.ts の FEATURE_MATRIX を参照
const FEATURE_MATRIX = {
  'basic': ['FREE', 'STD', 'PRO', 'ENT'],      // 全員
  'export_pdf': ['STD', 'PRO', 'ENT'],         // Standard以上
  'batch_process': ['PRO', 'ENT'],             // Pro以上
  'api_access': ['ENT'],                        // Enterprise専用
};

// 使用方法
withGateway(handler, { requiredPlan: ['PRO', 'ENT'] });
```

## 5. チェックリスト

新規アプリ作成時に確認:

- [ ] `insight-common` をサブモジュールとして追加
- [ ] 環境変数を `.env.local` に設定
- [ ] 全APIで `withGateway()` を使用
- [ ] ブランドカラーを `colors.json` から読み込み
- [ ] 製品コードを決定 (例: INSS, INSP, INPY)
- [ ] Supabase の `licenses` テーブルに製品を登録
- [ ] `check-app.sh` でセットアップ確認

## 6. 製品コード一覧

| コード | 製品名 | 説明 |
|-------|-------|------|
| INSS | InsightSlide | スライド作成 |
| INSP | InsightPy | Python学習 |
| FGIN | ForguncyInsight | Forguncy連携 |
| INJL | InsightJournal | ジャーナル/メモ |

新規製品を追加する場合は、このリストを更新してください。

## 7. 困ったときは

```bash
# セットアップ確認
./insight-common/scripts/check-app.sh

# 接続テスト
npx ts-node ./insight-common/infrastructure/scripts/check-connection.ts

# 認証テスト
npx ts-node ./insight-common/infrastructure/scripts/test-auth.ts
```

---

**このガイドに従わないコードはレビューで却下されます。**
