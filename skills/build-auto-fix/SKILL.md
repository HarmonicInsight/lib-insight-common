# Build Error Auto-Fix Skill

> Claude Code がビルドエラーを自動検出・修正するためのスキル定義

## Skill Overview

| 項目 | 内容 |
|------|------|
| スキル名 | `build-auto-fix` |
| トリガー | 「ビルドエラー直して」「デプロイ失敗を修正」など |
| 対応プラットフォーム | GitHub Actions, Vercel, Railway, EAS, Supabase |

---

## 実行フロー

```
1. 全プラットフォームのステータス確認
2. エラーログ取得
3. 原因分析
4. コード修正
5. コミット＆プッシュ
6. 再確認（必要に応じてループ）
```

---

## プラットフォーム別コマンド

### GitHub Actions

```bash
# 失敗したワークフロー確認
gh run list --status failure --limit 3

# エラーログ取得
gh run view <RUN_ID> --log-failed
```

### Vercel

```bash
# デプロイ一覧
vercel list

# エラーログ取得
vercel logs <DEPLOYMENT_URL>

# 詳細情報
vercel inspect <DEPLOYMENT_ID> --logs
```

### Railway

```bash
# 最新ログ
railway logs

# サービス状態
railway status
```

### EAS (Expo)

```bash
# 失敗ビルド一覧
eas build:list --status=errored --limit=3

# ビルド詳細
eas build:view <BUILD_ID>
```

### Supabase

```bash
# Edge Functions 一覧
supabase functions list

# 関数ログ
supabase functions logs <FUNCTION_NAME>

# マイグレーション状態
supabase migration list

# DB差分
supabase db diff --linked
```

---

## よくあるエラーパターンと対処法

### 1. 依存関係エラー

**症状**: `Module not found`, `Cannot resolve`, `peer dependency`

**確認**:
```bash
npm ls --depth=0
npm outdated
```

**対処**:
- `package.json` の依存関係を確認
- `npm install` で再インストール
- バージョン不整合があれば修正

### 2. 環境変数未設定

**症状**: `undefined`, `ENOENT`, `API key not found`

**確認**:
- Vercel: ダッシュボード → Settings → Environment Variables
- Railway: ダッシュボード → Variables
- GitHub Actions: Settings → Secrets and variables

**対処**:
- 必要な環境変数をプラットフォームに設定
- `.env.example` と照合

### 3. Node.js バージョン不一致

**症状**: `SyntaxError`, `Unsupported engine`

**確認**:
```bash
node --version
cat package.json | grep "engines"
```

**対処**:
- `package.json` の `engines` フィールドを設定
- プラットフォームの Node.js バージョンを指定

### 4. TypeScript エラー

**症状**: `TS2xxx`, `Type error`

**確認**:
```bash
npx tsc --noEmit
```

**対処**:
- 型エラーを修正
- 必要に応じて `@ts-ignore` または型定義追加

### 5. ビルドメモリ/タイムアウト

**症状**: `ENOMEM`, `Killed`, `Build exceeded time limit`

**対処**:
- ビルド最適化（tree shaking, code splitting）
- プラットフォームのプラン確認
- 不要な依存関係削除

### 6. Supabase マイグレーションエラー

**症状**: `migration failed`, `relation does not exist`

**確認**:
```bash
supabase db diff --linked
supabase migration list
```

**対処**:
- マイグレーションファイルを修正
- `supabase db reset` でローカルリセット（注意）

---

## デバッグの優先順位

1. **エラーメッセージを正確に読む** - 最初の数行が最重要
2. **直近のコミット差分を確認** - `git diff HEAD~3`
3. **ローカルで再現** - `npm run build` / `npm run type-check`
4. **環境変数を確認** - 本番と開発環境の差異
5. **依存関係を確認** - `package-lock.json` の変更有無

---

## 修正後のフロー

```bash
# 変更をステージング
git add -A

# コミット（修正内容を明記）
git commit -m "fix: [プラットフォーム名] エラー内容を修正"

# プッシュ
git push

# 再デプロイを確認
# (自動デプロイの場合は待機、手動の場合はトリガー)
```

---

## 自動修正の制限事項

以下の場合は手動介入が必要:

- **シークレット/API キーの設定** - セキュリティ上、自動設定不可
- **プラン制限** - 有料プランへのアップグレードが必要な場合
- **外部サービスの障害** - プラットフォーム側の問題
- **大規模なアーキテクチャ変更** - 単純な修正では解決不可

---

## 使用例

### 基本

```
ビルドエラー直して
```

### プラットフォーム指定

```
Vercel のデプロイエラーを確認して修正して
GitHub Actions の CI が失敗してるので直して
Railway のビルドログ見てエラー原因を特定して
```

### 全環境一括

```
GitHub Actions、Vercel、Railway、EAS、Supabase の全てのビルド状況を確認して、
エラーがあれば修正してpushして
```

---

## 関連ファイル

- `scripts/auto-fix.sh` - 自動修正スクリプト
- `scripts/fix.sh` - シンプル版（Claude に丸投げ）
- `.devcontainer/setup.sh` - Codespaces 環境セットアップ
- `docs/BUILD_FIX_SETUP.md` - 詳細ドキュメント
