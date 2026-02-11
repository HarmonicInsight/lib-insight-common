---
description: 既存プロジェクトに insight-common を統合セットアップ。サブモジュール追加、カラー適用、ライセンス統合を実行。
argument-hint: "[product-code]"
---

# insight-common 統合セットアップ

製品コード: $ARGUMENTS

## Step 1: サブモジュール追加

```bash
git submodule add https://github.com/HarmonicInsight/insight-common.git
git submodule update --init --recursive
```

## Step 2: 製品コード確認

`insight-common/config/products.ts` で指定された製品コード ($ARGUMENTS) の設定を確認:
- 機能マトリクス
- プラン別制限
- 対応プラットフォーム

## Step 3: プラットフォーム検出

プロジェクト内のファイルから技術スタックを自動検出:

| 検出ファイル | プラットフォーム | 適用スキル |
|------------|---------------|-----------|
| `*.csproj` / `*.xaml` | WPF | `/harmonic-insight:wpf` |
| `package.json` + `next.config.*` | Next.js | `/harmonic-insight:react` |
| `package.json` + `tauri.conf.json` | Tauri + React | `/harmonic-insight:react` |
| `requirements.txt` / `pyproject.toml` | Python | `/harmonic-insight:python-app` |
| `build.gradle.kts` | Android | `/harmonic-insight:android` |
| `Package.swift` / `*.xcodeproj` | iOS | `/harmonic-insight:ios` |

## Step 4: 必須ファイル生成

検出されたプラットフォームに応じて:

1. **カラー定義ファイル** — Ivory & Gold テーマ
2. **ライセンスマネージャー** — InsightLicenseManager
3. **ライセンス画面** — Insight Slides 形式
4. **i18n 設定** — ja/en 対応
5. **環境変数テンプレート** — .env.example

## Step 5: 検証

```bash
./insight-common/scripts/validate-standards.sh .
./insight-common/scripts/check-app.sh
```

## 製品別詳細ガイド

- IOSH: `insight-common/docs/prompts/HARMONICSHEET_SETUP.md`
- INSS: `insight-common/docs/prompts/INSIGHTSLIDE_SETUP.md`
- IOSD: `insight-common/docs/prompts/INSIGHTOFFICEDOC_SETUP.md`
- INPY: `insight-common/docs/prompts/INSIGHTPY_SETUP.md`
- IVIN: `insight-common/docs/prompts/INTERVIEWINSIGHT_SETUP.md`
