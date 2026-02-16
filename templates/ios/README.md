# Insight iOS テンプレート

> 新規 iOS アプリ作成時のスキャフォールドテンプレート (Swift / SwiftUI)

## 使い方

### 方法1: init-app.sh を使用（推奨）

```bash
./insight-common/scripts/init-app.sh my-app --platform ios
```

### 方法2: 手動コピー

1. このディレクトリの全ファイルをプロジェクトルートにコピー
2. 以下のプレースホルダーを置換:

| プレースホルダー | 説明 | 例 |
|---|---|---|
| `__APPNAME__` | ターゲット名 (小文字) | `camera` |
| `__AppName__` | 型名プレフィックス (PascalCase) | `Camera` |
| `__APP_BUNDLE_ID__` | Bundle Identifier | `com.harmonic.insight.camera` |
| `__app_display_name__` | ユーザーに表示されるアプリ名 | `Insight Camera` |
| `__PRODUCT_CODE__` | 製品コード (4文字) | `IOSH` |

```bash
# 一括置換の例
find . -type f \( -name "*.swift" -o -name "*.plist" -o -name "*.yml" -o -name "*.strings" \) | \
  xargs sed -i 's/__APPNAME__/camera/g; s/__AppName__/Camera/g; s/__APP_BUNDLE_ID__/com.harmonic.insight.camera/g'

# ディレクトリ名のリネーム
mv __APPNAME__ camera
```

3. XcodeGen で Xcode プロジェクトを生成:

```bash
brew install xcodegen   # 初回のみ
xcodegen generate
open __AppName__.xcodeproj
```

## 必要環境

- Xcode 15.0+
- iOS 16.0+ (Deployment Target)
- Swift 5.9+
- XcodeGen (`brew install xcodegen`)

## ファイル構成

```
templates/ios/
├── .github/workflows/
│   └── build.yml                  # CI/CD ワークフロー
├── .gitignore                     # iOS 標準 .gitignore
├── project.yml                    # XcodeGen プロジェクト定義
├── __APPNAME__/
│   ├── __APPNAME__App.swift       # @main エントリポイント
│   ├── ContentView.swift          # メインビュー
│   ├── Info.plist                 # アプリ設定
│   ├── Extensions/
│   │   └── Color+Hex.swift        # Color(hex:) イニシャライザ
│   ├── Theme/
│   │   ├── InsightColors.swift    # Ivory & Gold カラー定義
│   │   ├── InsightTheme.swift     # テーマ環境オブジェクト
│   │   └── InsightTypography.swift # タイポグラフィ
│   ├── License/
│   │   ├── PlanCode.swift         # プランコード enum
│   │   ├── LicenseManager.swift   # ライセンス管理
│   │   └── LicenseView.swift      # ライセンス画面 (SwiftUI)
│   └── Resources/
│       ├── Assets.xcassets/       # カラー・アイコンアセット
│       ├── ja.lproj/
│       │   └── Localizable.strings # 日本語文字列
│       └── en.lproj/
│           └── Localizable.strings # 英語文字列
├── fastlane/metadata/             # App Store メタデータ
│   ├── ja/                        # 日本語
│   └── en-US/                     # 英語
└── README.md                      # このファイル
```

## 準拠する標準

- `standards/IOS.md` — iOS 開発標準
- `standards/APP_ICONS.md` — アイコン標準
- `brand/colors.json` — カラー定義
- `brand/design-system.json` — デザインシステム
- `CLAUDE.md` — プロジェクト全体ガイドライン
