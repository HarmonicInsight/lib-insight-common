# Insight iOS テンプレート

> 新規 iOS アプリ作成時のスキャフォールドテンプレート (Swift / SwiftUI)

## Xcode 地獄の回避策

このテンプレートは iOS 開発で頻発する問題を構造的に解決します。

| 問題 | 原因 | このテンプレートの解決策 |
|------|------|----------------------|
| `.pbxproj` マージ地獄 | Xcode 独自のバイナリ風フォーマット | **XcodeGen** で `.xcodeproj` を生成。`.xcodeproj` 自体を gitignore |
| ビルド設定の GUI 分散 | Xcode GUI で設定がバラバラに | **`.xcconfig`** でテキスト管理。diff / レビュー可能 |
| バージョン番号の手動管理 | 手動でインクリメント忘れ | **`make bump-patch`** で xcconfig + project.yml を同期更新 |
| DerivedData 腐敗 | キャッシュ破損でビルド失敗 | **`make nuke`** で DerivedData を完全削除 + 再生成 |
| Xcode バージョン不一致 | チームメンバー間でバージョン違い | **`.xcode-version`** でピン留め（xcodes 対応） |
| Debug/Release 設定混在 | リリースビルドにデバッグ設定が残る | **Debug.xcconfig / Release.xcconfig** で明確に分離 |
| 依存バージョンのドリフト | `Package.resolved` が不一致 | アプリでは **コミット対象** に（再現性担保） |

### アーキテクチャ

```
project.yml (宣言的定義)
    ↓ xcodegen generate
*.xcodeproj (生成・gitignore)
    ↓
Configuration/
├── Base.xcconfig      ← 共通設定（バージョン、警告、セキュリティ）
├── Debug.xcconfig     ← デバッグ固有（最適化OFF、自動署名）
└── Release.xcconfig   ← リリース固有（最適化ON、手動署名）
    ↓
Makefile               ← ターミナルから全操作可能
```

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
find . -type f \( -name "*.swift" -o -name "*.plist" -o -name "*.yml" -o -name "*.strings" -o -name "*.xcconfig" -o -name "Makefile" \) | \
  xargs sed -i 's/__APPNAME__/camera/g; s/__AppName__/Camera/g; s/__APP_BUNDLE_ID__/com.harmonic.insight.camera/g'

# ディレクトリ名のリネーム
mv __APPNAME__ camera
```

3. セットアップ:

```bash
make setup    # XcodeGen インストール + .xcodeproj 生成
make open     # Xcode で開く
```

## 日常の開発コマンド

```bash
make build          # デバッグビルド（シミュレータ）
make build-release  # リリースビルド（シミュレータ）
make clean          # ビルドキャッシュ削除
make nuke           # DerivedData 完全削除（ビルドが壊れた時）
make generate       # .xcodeproj を再生成（project.yml 変更後）
make bump-patch     # 1.0.0 → 1.0.1 + ビルド番号 +1
make bump-minor     # 1.0.0 → 1.1.0 + ビルド番号 +1
make bump-major     # 1.0.0 → 2.0.0 + ビルド番号 +1
make bump-build     # ビルド番号のみ +1
```

## 必要環境

- Xcode 16.2+ (`.xcode-version` で指定)
- iOS 16.0+ (Deployment Target)
- Swift 5.9+
- XcodeGen (`brew install xcodegen`)

## ファイル構成

```
templates/ios/
├── .github/workflows/
│   └── build.yml                  # CI/CD ワークフロー
├── .gitignore                     # .xcodeproj を gitignore（地獄回避の要）
├── .xcode-version                 # Xcode バージョンピン留め
├── project.yml                    # XcodeGen プロジェクト定義
├── Makefile                       # ビルド・バージョン管理の自動化
├── Configuration/
│   ├── Base.xcconfig              # 共通ビルド設定
│   ├── Debug.xcconfig             # デバッグ設定
│   └── Release.xcconfig           # リリース設定
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
