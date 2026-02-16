# Insight iOS テンプレート

> 新規 iOS アプリ作成時のスキャフォールドテンプレート (Swift 6 / SwiftUI / iOS 17+)

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
| `__APPNAME__` | ターゲットディレクトリ名 | `insightcamera` |
| `__AppName__` | 型名プレフィックス (PascalCase) | `InsightCamera` |
| `__APP_BUNDLE_ID__` | Bundle Identifier | `com.harmonic.insight.camera` |
| `__app_display_name__` | ユーザーに表示されるアプリ名 | `Insight Camera` |
| `__PRODUCT_CODE__` | 製品コード (4文字) | `IOSH` |

```bash
# 一括置換の例
find . -type f \( -name "*.swift" -o -name "*.plist" -o -name "*.yml" -o -name "*.xcstrings" \) | \
  xargs sed -i 's/__APPNAME__/insightcamera/g; s/__AppName__/InsightCamera/g; s/__APP_BUNDLE_ID__/com.harmonic.insight.camera/g'

# ディレクトリ名のリネーム
mv __APPNAME__ insightcamera
```

### 方法A: XcodeGen（推奨）

```bash
brew install xcodegen   # 初回のみ
xcodegen generate
open __AppName__.xcodeproj
```

### 方法B: Swift Package Manager

```bash
# Package.swift を使用（Xcode で開く or swift build）
open Package.swift
```

## 必要環境

- Xcode 16.0+
- iOS 17.0+ (Deployment Target)
- Swift 6.0+
- XcodeGen (`brew install xcodegen`) — 方法A の場合

## 主な iOS 17+ パターン

| パターン | 説明 |
|---------|------|
| `@Observable` | `ObservableObject` の後継（Observation フレームワーク） |
| `@Environment(Type.self)` | `@EnvironmentObject` の後継 |
| `String(localized:)` | `NSLocalizedString` の後継 |
| `.foregroundStyle()` | `.foregroundColor()` の後継 |
| `.textInputAutocapitalization()` | `.autocapitalization()` の後継 |
| String Catalog (`.xcstrings`) | `.strings` の後継（Xcode 15+） |

## ファイル構成

```
templates/ios/
├── .github/workflows/
│   └── build.yml                    # CI/CD ワークフロー
├── .gitignore                       # iOS 標準 .gitignore
├── project.yml                      # XcodeGen プロジェクト定義
├── Package.swift                    # SPM パッケージ定義（代替ビルド方法）
├── __APPNAME__/
│   ├── __APPNAME__App.swift         # @main エントリポイント
│   ├── ContentView.swift            # メインビュー
│   ├── Info.plist                   # アプリ設定
│   ├── Extensions/
│   │   └── Color+Hex.swift          # Color(hex:) イニシャライザ
│   ├── Theme/
│   │   ├── InsightColors.swift      # Ivory & Gold カラー定義
│   │   ├── InsightTheme.swift       # テーマ定数 + CardModifier
│   │   └── InsightTypography.swift  # タイポグラフィ
│   ├── License/
│   │   ├── PlanCode.swift           # プランコード enum
│   │   ├── LicenseManager.swift     # ライセンス管理 (@Observable)
│   │   └── LicenseView.swift        # ライセンス画面 (SwiftUI)
│   └── Resources/
│       ├── Assets.xcassets/         # カラー・アイコンアセット
│       ├── Localizable.xcstrings    # String Catalog（日英）
│       └── InfoPlist.xcstrings      # Info.plist ローカライズ
├── fastlane/metadata/               # App Store メタデータ
│   ├── ja/                          # 日本語
│   └── en-US/                       # 英語
└── README.md                        # このファイル
```

## 準拠する標準

- `standards/IOS.md` — iOS 開発標準
- `standards/APP_ICONS.md` — アイコン標準
- `brand/colors.json` — カラー定義
- `brand/design-system.json` — デザインシステム
- `CLAUDE.md` — プロジェクト全体ガイドライン
