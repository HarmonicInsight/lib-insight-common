---
description: 新しい Harmonic Insight アプリを作成。製品コード・プラットフォーム・技術スタックを選択してプロジェクトを初期化。
argument-hint: "[app-name]"
---

# 新規 Harmonic Insight アプリ作成

## Step 1: 基本情報確認

以下の情報をユーザーに確認してください:

```yaml
app_name: "$ARGUMENTS"
product_code: ""       # 4文字 (INSS, IOSH, IOSD, INPY, INMV, INBT, INCA, INIG, IVIN)
description: ""        # 1行説明
platform: ""           # wpf / react / python / android / ios
deploy_target: ""      # railway / vercel / cloudflare / windows-installer / eas
main_features:
  - ""
  - ""
  - ""
```

## Step 2: 製品コードが既存か確認

`insight-common/config/products.ts` を読み、指定された製品コードが既に登録されているか確認。
未登録の場合は新規追加手順を案内。

## Step 3: プロジェクト初期化

```bash
# insight-common をサブモジュールとして追加
git submodule add https://github.com/HarmonicInsight/insight-common.git

# init スクリプト実行
./insight-common/scripts/init-app.sh $ARGUMENTS
```

## Step 4: プラットフォーム別セットアップ

選択されたプラットフォームに応じて、以下のスキルを適用:

- **wpf**: `/harmonic-insight:wpf` の標準に従ってプロジェクト構成
- **react**: `/harmonic-insight:react` の標準に従ってプロジェクト構成
- **python**: `/harmonic-insight:python-app` の標準に従ってプロジェクト構成
- **android**: `/harmonic-insight:android` の標準に従ってプロジェクト構成
- **ios**: `/harmonic-insight:ios` の標準に従ってプロジェクト構成

## Step 5: 必須コンポーネント実装

1. **Colors / デザインシステム** — Ivory & Gold テーマを適用
2. **ライセンス画面** — Insight Slides 形式で実装
3. **ライセンスマネージャー** — InsightLicenseManager を統合
4. **認証** — Firebase Auth
5. **i18n** — ja/en 対応

## Step 6: 検証

```bash
./insight-common/scripts/validate-standards.sh .
./insight-common/scripts/check-app.sh
```

## 参照ドキュメント

- `insight-common/prompts/new-app.md` — 詳細な新規アプリ作成テンプレート
- `insight-common/docs/prompts/` — 製品別セットアップガイド
