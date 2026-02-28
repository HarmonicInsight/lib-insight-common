# Claude Code 指示書

このファイルは Claude Code がHARMONIC insightのプロジェクトで作業する際に従うべきルールです。

---

## 絶対ルール

### 1. insight-common を必ず使う

新規アプリ作成時:
```bash
./insight-common/scripts/init-app.sh <app-name>
```

既存リポジトリ:
```bash
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common
```

### 2. APIは必ず withGateway() でラップ

```typescript
// ✅ 正しい
import { withGateway } from '@/insight-common/infrastructure/api/gateway';
export default withGateway(handler, { requireAuth: true });

// ❌ 間違い - 直接エクスポート禁止
export default async function handler(req, res) { ... }
```

### 3. 認証は Firebase、データは Supabase

```
Firebase: 認証, FCM, Analytics, Crashlytics, Remote Config
Supabase: ビジネスデータ, ユーザー情報, ライセンス
```

Firebase UID が全システムの主キー。

### 4. 権限判定はサーバーサイドのみ

```typescript
// ✅ サーバーで判定
withGateway(handler, { requiredPlan: ['BIZ', 'ENT'] });

// ❌ クライアントで判定しない
if (user.plan === 'BIZ') { showBizFeature(); }
```

### 5. ブランドカラーは colors.json から

```typescript
import colors from '@/insight-common/brand/colors.json';
// colors.primary, colors.title, colors.background
```

---

## 作業開始時の確認事項

新しいタスクを始める前に:

1. **insight-common が最新か確認**
   ```bash
   cd insight-common && git pull origin main && cd ..
   ```

2. **環境変数が設定されているか確認**
   ```bash
   npx ts-node ./insight-common/infrastructure/scripts/check-env.ts
   ```

3. **CLAUDE.md を読む**
   - `/insight-common/CLAUDE.md` に全体ルール
   - `/insight-common/prompts/new-app.md` に新規アプリ手順

---

## 禁止事項

| 禁止 | 理由 | 代替 |
|-----|------|-----|
| 独自認証実装 | セキュリティリスク | Firebase Auth使用 |
| console.log | 本番に残る | logAudit() |
| クライアント権限判定 | 改ざん可能 | withGateway |
| 独自レート制限 | 不統一 | withGateway |
| ハードコードされた色 | ブランド不統一 | colors.json |

---

## よく使うコマンド

```bash
# セットアップ確認
./insight-common/scripts/check-app.sh

# 新規アプリ初期化
./insight-common/scripts/init-app.sh <name>

# 接続テスト
npx ts-node ./insight-common/infrastructure/scripts/check-connection.ts

# 認証テスト
npx ts-node ./insight-common/infrastructure/scripts/test-auth.ts
```

---

## 質問されたら

「新しいアプリを作りたい」と言われたら:
1. まず製品名・製品コード・主要機能を確認
2. `/insight-common/prompts/new-app.md` の手順に従う
3. `init-app.sh` を実行

「APIを追加したい」と言われたら:
1. `withGateway()` テンプレートを使用
2. 認証・レート制限・監査ログを設定
3. バリデーションスキーマを定義

「検索機能を追加したい」と言われたら:
1. `harmonic-mart-generator` の使用を提案
2. Hybrid Search (`BM25 + Vector`) を推奨
