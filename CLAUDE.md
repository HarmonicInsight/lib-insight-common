# Harmonic Insight - 新規アプリ開発ガイド

> このドキュメントは新規アプリ作成時に必ず参照してください。

## 1. アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                      あなたのアプリ                          │
├─────────────────────────────────────────────────────────────┤
│  insight-common (サブモジュール)                             │
│  ├── infrastructure/   # 認証・DB・API Gateway              │
│  ├── nlp/             # 日本語NLP (JBCA)                    │
│  ├── brand/           # カラー・フォント・ロゴ               │
│  └── docs/            # プラットフォーム標準                 │
├─────────────────────────────────────────────────────────────┤
│  harmonic-mart-generator (ナレッジ処理が必要な場合)           │
│  ├── ingest/          # PDF解析・チャンキング                │
│  └── search/          # Hybrid Search                       │
└─────────────────────────────────────────────────────────────┘

📖 技術選定の詳細: docs/platform-standard.md を参照
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
# Firebase (🟢 標準 - 必須)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# Supabase (⚪ 業務系のみ - オプション)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Pinecone (⚪ AI連携時 - オプション)
PINECONE_API_KEY=
PINECONE_INDEX=

# Claude API (🟢 標準)
ANTHROPIC_API_KEY=

# その他オプション
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
| INSS | InsightSlide | PowerPointコンテンツ抽出・更新 |
| INSP | InsightSlide Pro | プロ向けPowerPointツール |
| INPY | InsightPy | Windows自動化Python実行環境 |
| FGIN | ForguncyInsight | Forguncy連携 |
| INMV | InsightMovie | 画像・PPTから動画作成 |
| INBT | InsightBot | Python RPA自動化ボット |

新規製品を追加する場合は `config/products.ts` も更新してください。

## 7. ライセンスシステム

### プラン体系

| プラン | 説明 | 有効期限 |
|-------|------|---------|
| FREE | 機能制限あり | 無期限 |
| TRIAL | 全機能利用可能（評価用） | 標準1ヶ月（発行時に自由設定可） |
| STD | 標準機能 | 12ヶ月 |
| PRO | 全機能 | 12ヶ月 |
| ENT | カスタマイズ | 要相談 |

### 製品別機能マトリクス

#### InsightSlide (INSS)

| 機能 | FREE | TRIAL | STD | PRO |
|-----|------|-------|-----|-----|
| Extract/Update | ○ | ○ | ○ | ○ |
| スライド更新数 | 3枚 | 無制限 | 無制限 | 無制限 |
| JSON入出力 | × | ○ | ○ | ○ |
| フォルダ一括処理 | × | ○ | ○ | ○ |
| 2ファイル比較 | × | ○ | ○ | ○ |
| 自動バックアップ | × | ○ | × | ○ |

#### InsightPy (INPY)

| 機能 | FREE | TRIAL | STD | PRO |
|-----|------|-------|-----|-----|
| コード実行 | ○ | ○ | ○ | ○ |
| スクリプト保存数 | 3個 | 無制限 | 50個 | 無制限 |
| プリセット利用 | ○ | ○ | ○ | ○ |
| クラウド同期 | × | ○ | × | ○ |

#### InsightBot (INBT)

| 機能 | FREE | TRIAL | STD | PRO |
|-----|------|-------|-----|-----|
| スクリプト実行 | ○ | ○ | ○ | ○ |
| JOB保存数 | 3個 | 無制限 | 50個 | 無制限 |
| プリセット利用 | ○ | ○ | ○ | ○ |
| クラウド同期 | × | ○ | × | ○ |

#### InsightMovie (INMV)

| 機能 | FREE | TRIAL | STD | PRO |
|-----|------|-------|-----|-----|
| 動画生成 | ○ | ○ | ○ | ○ |
| 字幕 | × | ○ | × | ○ |
| 字幕スタイル選択 | × | ○ | × | ○ |
| トランジション | × | ○ | × | ○ |
| PPTX取込 | × | ○ | × | ○ |

### ライセンスキー形式

```
{製品コード}-{プラン}-{YYMM}-{HASH}-{SIG1}-{SIG2}
例: INMV-PRO-2601-XXXX-XXXX-XXXX
```

### サーバーサイド実装

```typescript
import { ServerLicenseChecker } from '@/insight-common/infrastructure/license';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ライセンスチェッカーを初期化
const licenseChecker = new ServerLicenseChecker(supabase, 'INMV');

// ライセンス確認
const result = await licenseChecker.checkLicense(userId);
if (!result.isValid) {
  return res.status(403).json({ error: result.reason });
}

// 機能アクセス確認
const canUseFeature = await licenseChecker.checkFeature(userId, 'inmv_subtitle');
if (!canUseFeature.allowed) {
  return res.status(403).json({ error: 'PRO以上のプランが必要です' });
}
```

### クライアントサイド実装

```typescript
import { ClientLicenseManager } from '@/insight-common/infrastructure/license';

const licenseManager = new ClientLicenseManager('INMV');

// プラン取得
const plan = await licenseManager.getPlan();

// 機能確認（UI表示用）
const canSubtitle = await licenseManager.canUseFeature('inmv_subtitle');
if (!canSubtitle) {
  // アップグレード促進UIを表示
}
```

## 8. 困ったときは

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
