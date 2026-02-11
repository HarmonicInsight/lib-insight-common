---
description: 全プラットフォームのビルドエラーを自動検出・修正。GitHub Actions、Vercel、Railway、EAS、Supabase に対応。
argument-hint: "[platform]"
---

# ビルドエラー自動修正

対象プラットフォーム: $ARGUMENTS (未指定の場合は全プラットフォーム)

## Step 1: 全プラットフォームのステータス確認

```bash
# GitHub Actions
gh run list --status failure --limit 3 2>/dev/null

# Vercel
vercel list 2>/dev/null

# Railway
railway logs 2>/dev/null

# EAS (Expo)
eas build:list --status=errored --limit=3 2>/dev/null

# Supabase
supabase functions list 2>/dev/null
```

## Step 2: エラーログ取得

失敗が検出されたプラットフォームのログを取得して原因を分析。

## Step 3: よくあるエラーパターン

| パターン | 症状 | 対処 |
|---------|------|------|
| 依存関係 | `Module not found` | `npm install` / バージョン修正 |
| 環境変数 | `undefined`, `API key not found` | プラットフォームに環境変数設定 |
| Node.js | `SyntaxError` | `engines` フィールド設定 |
| TypeScript | `TS2xxx` | 型エラー修正 |
| メモリ | `ENOMEM`, `Killed` | ビルド最適化 |
| Supabase | `migration failed` | マイグレーション修正 |

## Step 4: 修正 → コミット → プッシュ

```bash
git add -A
git commit -m "fix: [platform] エラー内容を修正"
git push
```

## Step 5: 再確認

プッシュ後、デプロイが成功するまで監視。必要に応じてループ。

## 詳細リファレンス

`insight-common/skills/build-auto-fix/SKILL.md` — 完全なビルド修正ガイド
