---
description: 新しい HARMONIC insight アプリを作成。製品コード・プラットフォーム・技術スタックを選択してプロジェクトを初期化。
argument-hint: "[app-name]"
---

# 新規 HARMONIC insight アプリ作成

## Step 1: 基本情報確認

以下の情報を**順番に**ユーザーに確認してください:

### 1-1. アプリ名と製品コード

```yaml
app_name: "$ARGUMENTS"
product_code: ""       # 4文字 (INSS, IOSH, IOSD, INPY, INMV, INBT, INCA, INIG, IVIN, or 新規)
description: ""        # 1行説明
```

### 1-2. プラットフォーム

ユーザーに以下から選択してもらう:

| 選択肢 | 技術スタック | 用途 |
|--------|------------|------|
| **desktop-wpf** | C# / WPF / .NET 8 | Windows デスクトップ (IOSH, INSS, IOSD, INBT) |
| **desktop-tauri** | Tauri + React + TypeScript | クロスプラットフォーム デスクトップ |
| **web-react** | Next.js / React / TypeScript | Web アプリ / ダッシュボード |
| **web-python** | Python (Flask/FastAPI) | Python Web サービス |
| **mobile-expo** | Expo / React Native / TypeScript | iOS + Android クロスプラットフォーム（推奨） |
| **mobile-android** | Kotlin / Jetpack Compose | Android ネイティブ専用 |
| **mobile-ios** | Swift / SwiftUI | iOS ネイティブ専用 |
| **python-desktop** | Python / Tkinter / CustomTkinter | Python デスクトップ (INSS, INPY) |

### 1-3. デプロイ先

プラットフォームに応じて選択肢を絞る:

| プラットフォーム | デプロイ先選択肢 |
|----------------|----------------|
| desktop-wpf | **windows-installer** (Inno Setup / MSIX) |
| desktop-tauri | **windows-installer** / **mac-dmg** / **linux-appimage** |
| web-react | **vercel** / **cloudflare** / **railway** |
| web-python | **railway** / **cloudflare-workers** |
| mobile-expo | **eas** (EAS Build + EAS Submit) |
| mobile-android | **google-play** (AAB 直接) |
| mobile-ios | **app-store** (Xcode Archive 直接) |
| python-desktop | **windows-installer** / **pyinstaller** |

### 1-4. 主要機能

```yaml
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
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common

# init スクリプト実行
./insight-common/scripts/init-app.sh $ARGUMENTS
```

## Step 4: プラットフォーム別セットアップ

選択されたプラットフォームに応じて、該当するスキルを適用:

| 選択 | 適用スキル | 追加適用 |
|------|-----------|---------|
| desktop-wpf | `wpf` | `design-system` |
| desktop-tauri | `react` | `design-system` |
| web-react | `react` | `design-system`, デプロイ先スキル |
| web-python | `python-app` | `design-system`, `deploy-railway` |
| **mobile-expo** | **`expo`** | `design-system` |
| mobile-android | `android` | `design-system` |
| mobile-ios | `ios` | `design-system` |
| python-desktop | `python-app` | `design-system` |

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
