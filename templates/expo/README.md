# Insight Expo テンプレート

> 新規 Expo/React Native アプリ作成時のスキャフォールドテンプレート

## 使い方

### 方法1: init-app.sh を使用（推奨）

```bash
./insight-common/scripts/init-app.sh my-app --platform expo --package com.harmonicinsight.myapp
```

### 方法2: 手動コピー

1. このディレクトリの全ファイルをプロジェクトルートにコピー
2. 以下のプレースホルダーを置換:

| プレースホルダー | 説明 | 例 |
|---|---|---|
| `__app_slug__` | Expo slug (小文字ハイフン) | `insight-qr` |
| `__app_display_name__` | 表示名 | `Insight QR` |
| `__APP_PACKAGE__` | パッケージ名 | `com.harmonicinsight.insightqr` |
| `__PRODUCT_CODE__` | 製品コード (4文字) | `IOSH` |

## ファイル構成

```
templates/expo/
├── app/
│   ├── _layout.tsx            # Root layout (expo-router)
│   ├── license.tsx            # ライセンス画面 (Insight Slides 形式)
│   └── (tabs)/
│       ├── _layout.tsx        # Tab layout (Gold テーマ)
│       ├── index.tsx          # ホーム画面
│       └── settings.tsx       # 設定画面
├── lib/
│   ├── colors.ts              # Ivory & Gold カラー定義
│   ├── theme.ts               # タイポグラフィ・スペーシング
│   └── license-manager.ts     # ライセンス管理 (AsyncStorage)
├── app.json                   # Expo 設定 (Gold テーマカラー)
├── eas.json                   # EAS Build 設定
├── package.json               # 依存関係
├── tsconfig.json              # TypeScript 設定
└── .gitignore
```

## 準拠する標準

- `standards/ANDROID.md` — Expo セクション
- `standards/APP_ICONS.md` — アイコン標準
- `brand/colors.json` — カラー定義
- `brand/design-system.json` — デザインシステム
- `CLAUDE.md` — プロジェクト全体ガイドライン

## Expo 固有ルール

| 項目 | 標準値 |
|---|---|
| **SDK** | Expo 52+ |
| **ナビゲーション** | expo-router (ファイルベースルーティング) |
| **カラー** | `lib/colors.ts` から import（ハードコード禁止） |
| **ライセンス** | `lib/license-manager.ts`（InsightOffice 製品のみ） |
| **TypeScript** | strict mode 必須 |
| **パッケージ名** | `com.harmonicinsight.*` |
| **app.json** | backgroundColor/splash = Gold (#B8942F) |
