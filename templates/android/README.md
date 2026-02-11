# Insight Android テンプレート

> 新規 Android アプリ作成時のスキャフォールドテンプレート

## 使い方

### 方法1: init-app.sh を使用（推奨）

```bash
./insight-common/scripts/init-app.sh my-app --platform android
```

### 方法2: 手動コピー

1. このディレクトリの全ファイルをプロジェクトルートにコピー
2. 以下のプレースホルダーを置換:

| プレースホルダー | 説明 | 例 |
|---|---|---|
| `__APPNAME__` | パッケージ名末尾 (小文字) | `camera` |
| `__AppName__` | テーマ関数名のアプリ名部分 | `Camera` |
| `__APP_PACKAGE__` | 完全パッケージ名 | `com.harmonic.insight.camera` |
| `__app_name__` | settings.gradle のプロジェクト名 | `Insight-Camera` |
| `__app_display_name__` | ユーザーに表示されるアプリ名 | `Insight Camera` |
| `__PRODUCT_CODE__` | 製品コード (4文字) | `IOSH` |

```bash
# 一括置換の例
find . -type f -name "*.kt" -o -name "*.xml" -o -name "*.kts" -o -name "*.yml" | \
  xargs sed -i 's/__APPNAME__/camera/g; s/__AppName__/Camera/g; s/__APP_PACKAGE__/com.harmonic.insight.camera/g'
```

## ファイル構成

```
templates/android/
├── .github/workflows/
│   └── build.yml                  # CI/CD ワークフロー
├── .gitignore                     # Android 標準 .gitignore
├── gradle/
│   └── libs.versions.toml        # Version Catalog
├── build.gradle.kts               # ルートビルド設定
├── settings.gradle.kts            # プロジェクト設定
├── gradle.properties              # Gradle プロパティ
├── app/
│   ├── build.gradle.kts           # アプリビルド設定
│   ├── proguard-rules.pro         # R8/ProGuard ルール
│   └── src/main/
│       ├── kotlin/
│       │   ├── ui/theme/
│       │   │   ├── Color.kt      # Ivory & Gold カラー定義
│       │   │   ├── Theme.kt      # Material3 テーマ
│       │   │   └── Type.kt       # タイポグラフィ
│       │   └── license/
│       │       ├── PlanCode.kt    # プランコード enum
│       │       ├── LicenseManager.kt # ライセンス管理
│       │       └── LicenseScreen.kt  # ライセンス画面 (Compose)
│       └── res/
│           ├── drawable/
│           │   ├── ic_launcher_foreground.xml  # 前景アイコン
│           │   └── ic_launcher_background.xml  # 背景 (Ivory)
│           ├── values/
│           │   ├── colors.xml     # カラーリソース
│           │   ├── strings.xml    # 日本語文字列
│           │   └── themes.xml     # システムテーマ
│           ├── values-en/
│           │   └── strings.xml    # 英語文字列
│           └── values-night/
│               └── themes.xml     # ダークモードテーマ
└── README.md                      # このファイル
```

## 準拠する標準

- `standards/ANDROID.md` — Android 開発標準
- `standards/APP_ICONS.md` — アイコン標準
- `brand/colors.json` — カラー定義
- `brand/design-system.json` — デザインシステム
- `CLAUDE.md` — プロジェクト全体ガイドライン
