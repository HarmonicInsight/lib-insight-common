# Android 開発標準

> **すべての Harmonic Insight Android アプリは、このドキュメントに準拠すること。**
> 新規作成・修正時に必ず確認。

---

## クイックスタート（新規アプリ作成）

### 方法1: 自動スキャフォールド（推奨）

```bash
./insight-common/scripts/init-app.sh my-app --platform android --package com.harmonic.insight.myapp
```

### 方法2: テンプレートファイルから手動コピー

`templates/android/` に**そのままコピーして使えるファイル**が揃っています:

```
templates/android/
├── gradle/libs.versions.toml      # Version Catalog（§5）
├── build.gradle.kts               # ルートビルド設定
├── settings.gradle.kts            # プロジェクト設定
├── gradle.properties              # Gradle プロパティ（§11）
├── app/
│   ├── build.gradle.kts           # アプリビルド設定（§2, §8）
│   ├── proguard-rules.pro         # ProGuard ルール（§8）
│   └── src/main/
│       ├── kotlin/
│       │   ├── ui/theme/
│       │   │   ├── Color.kt      # Ivory & Gold カラー（§6）
│       │   │   ├── Theme.kt      # Material3 テーマ（§6）
│       │   │   └── Type.kt       # タイポグラフィ（§7）
│       │   └── license/
│       │       ├── PlanCode.kt    # プランコード（§12）
│       │       ├── LicenseManager.kt # ライセンス管理（§12）
│       │       └── LicenseScreen.kt  # ライセンス画面（§12, Compose）
│       └── res/
│           ├── drawable/
│           │   ├── ic_launcher_foreground.xml  # アイコン前景
│           │   └── ic_launcher_background.xml  # アイコン背景 (Ivory)
│           ├── values/
│           │   ├── colors.xml     # XML カラー（§6）
│           │   ├── strings.xml    # 日本語文字列（§10）
│           │   └── themes.xml     # システムテーマ（§6）
│           ├── values-en/
│           │   └── strings.xml    # 英語文字列（§10）
│           └── values-night/
│               └── themes.xml     # ダークテーマ
├── .github/workflows/build.yml    # CI/CD（§9）
└── .gitignore
```

**プレースホルダー置換**（コピー後に実行）:

| プレースホルダー | 説明 | 例 |
|---|---|---|
| `__APPNAME__` | パッケージ名末尾 | `camera` |
| `__AppName__` | テーマ関数名 | `Camera` |
| `__APP_PACKAGE__` | 完全パッケージ名 | `com.harmonic.insight.camera` |
| `__app_display_name__` | 表示名 | `Insight Camera` |
| `__PRODUCT_CODE__` | 製品コード | `IOSH` |

### 標準検証

```bash
# Android 固有チェック（Version Catalog, SDK, ProGuard, テーマ, i18n, アイコン）
./insight-common/scripts/validate-standards.sh <project-directory>
```

---

## 1. 基本方針

| 項目 | 標準値 |
|------|--------|
| **言語** | Kotlin |
| **UI フレームワーク** | Jetpack Compose（100% Compose、XML レイアウト不可） |
| **デザインシステム** | Material Design 3（Material You） |
| **DI** | Hilt（複数画面 or ViewModel がある場合は必須） |
| **ナビゲーション** | Jetpack Navigation Compose（複数画面の場合） |
| **データベース** | Room（ローカル DB が必要な場合） |
| **非同期処理** | Kotlin Coroutines + Flow |
| **ビルドシステム** | Gradle (Kotlin DSL) + Version Catalog |
| **CI/CD** | GitHub Actions |

---

## 2. SDK バージョン・ビルド設定

| 項目 | 値 | 備考 |
|------|-----|------|
| **compileSdk** | 35 | Android 15 |
| **targetSdk** | 35 | Android 15 |
| **minSdk** | 26 | Android 8.0（Oreo） |
| **JVM Target** | 17 | Java 17 互換 |
| **Gradle** | 8.11+ | |
| **AGP** | 8.7.3+ | |
| **Kotlin** | 2.1.0+ | |

---

## 3. パッケージ命名規則

```
com.harmonic.insight.<アプリ名>
```

| アプリ | パッケージ名 | 種別 |
|--------|------------|------|
| Insight Camera | `com.harmonic.insight.camera` | Native Kotlin |
| Insight Launcher | `com.harmonic.insight.launcher` | Native Kotlin |
| Insight Voice Clock | `com.harmonic.insight.voiceclock` | Native Kotlin |
| InclineInsight | `com.harmonic.inclineinsight` | Native Kotlin |
| ConsulType (コンサル評価) | `com.harmonic.insighttype` | Native Kotlin |
| Harmonic Horoscope | `com.harmonic.horoscope` | Native Kotlin |
| Food Medicine Insight | `com.foodmedicineinsight` (native) / `com.foodmedicineinsight.app` (Expo) | Hybrid |
| Insight QR | `com.harmonicinsight.insightqr` | Expo/React Native |
| ConsulEvaluate Mobile | `com.harmonicinsight.consulevaluate` | Expo/React Native |

> **禁止**: `com.insightXXX`（フラットなパッケージ名）は使わないこと。
> Native Kotlin アプリは `com.harmonic.*` の命名規則に従う。
> Expo/React Native アプリは `com.harmonicinsight.*` の命名規則に従う。

---

## 4. プロジェクト構造

```
<project-root>/
├── .github/
│   └── workflows/
│       └── build.yml                    # 標準 CI/CD ワークフロー
├── gradle/
│   └── libs.versions.toml              # 【必須】Version Catalog
├── app/
│   ├── build.gradle.kts                # アプリレベルのビルド設定
│   ├── proguard-rules.pro              # 【必須】R8/ProGuard ルール
│   └── src/main/
│       ├── kotlin/com/harmonic/insight/<appname>/
│       │   ├── <AppName>App.kt         # @HiltAndroidApp Application
│       │   ├── MainActivity.kt         # メインアクティビティ
│       │   ├── data/                   # データ層
│       │   │   ├── model/              # データモデル
│       │   │   ├── db/                 # Room データベース（必要時）
│       │   │   └── repository/         # リポジトリ
│       │   ├── di/                     # Hilt DI モジュール
│       │   │   └── AppModule.kt
│       │   ├── service/                # サービス・レシーバー
│       │   ├── ui/
│       │   │   ├── theme/              # 【必須】テーマ定義
│       │   │   │   ├── Color.kt        # Ivory & Gold カラー定義
│       │   │   │   ├── Theme.kt        # Material3 テーマ
│       │   │   │   └── Type.kt         # タイポグラフィ
│       │   │   ├── components/         # 共通 UI コンポーネント
│       │   │   └── <screen>/           # 画面ごとのフォルダ
│       │   │       ├── <Screen>Screen.kt
│       │   │       └── <Screen>ViewModel.kt
│       │   └── navigation/
│       │       └── NavGraph.kt         # ナビゲーション定義
│       ├── res/
│       │   ├── values/
│       │   │   ├── colors.xml          # 【必須】Ivory & Gold カラーリソース
│       │   │   ├── strings.xml         # 【必須】日本語文字列（デフォルト）
│       │   │   └── themes.xml          # Android システムテーマ
│       │   └── values-en/
│       │       └── strings.xml         # 【必須】英語文字列
│       └── AndroidManifest.xml
├── build.gradle.kts                    # ルートビルド設定
├── settings.gradle.kts
├── gradle.properties
└── APP_SPEC.md                         # アプリ仕様書
```

> **注意**: Kotlin ソースは `src/main/kotlin/` に配置する（`src/main/java/` ではない）。

---

## 5. Gradle Version Catalog（必須）

すべての Android プロジェクトは `gradle/libs.versions.toml` を使用してバージョンを一元管理する。

### `gradle/libs.versions.toml`

```toml
[versions]
agp = "8.7.3"
kotlin = "2.1.0"
ksp = "2.1.0-1.0.29"
coreKtx = "1.15.0"
lifecycleRuntime = "2.8.7"
activityCompose = "1.9.3"
composeBom = "2024.12.01"
navigation = "2.8.5"
hilt = "2.53.1"
hiltNavigationCompose = "1.2.0"
room = "2.6.1"
coroutines = "1.9.0"
firebaseBom = "33.7.0"
firebaseCrashlyticsPlugin = "3.0.2"
googleServices = "4.4.2"

[libraries]
# Core
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }

# Lifecycle
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntime" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycleRuntime" }
androidx-lifecycle-runtime-compose = { group = "androidx.lifecycle", name = "lifecycle-runtime-compose", version.ref = "lifecycleRuntime" }

# Compose
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended" }

# Navigation
androidx-navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigation" }

# Hilt
hilt-android = { group = "com.google.dagger", name = "hilt-android", version.ref = "hilt" }
hilt-android-compiler = { group = "com.google.dagger", name = "hilt-android-compiler", version.ref = "hilt" }
hilt-navigation-compose = { group = "androidx.hilt", name = "hilt-navigation-compose", version.ref = "hiltNavigationCompose" }

# Room
androidx-room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
androidx-room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
androidx-room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }

# Coroutines
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }

# Firebase
firebase-bom = { group = "com.google.firebase", name = "firebase-bom", version.ref = "firebaseBom" }
firebase-crashlytics = { group = "com.google.firebase", name = "firebase-crashlytics" }
firebase-analytics = { group = "com.google.firebase", name = "firebase-analytics" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
firebase-crashlytics = { id = "com.google.firebase.crashlytics", version.ref = "firebaseCrashlyticsPlugin" }
google-services = { id = "com.google.gms.google-services", version.ref = "googleServices" }
```

> **ルール**: アプリ固有の依存は `[libraries]` に追記する。バージョンは直書きせず Version Catalog を経由すること。

---

## 6. カラーシステム（Ivory & Gold）

### ❌ 禁止

```
Blue (#2563EB, #1A73E8, #3F51B5, #3D7BF7) をプライマリカラーとして使用
独自のカラーパレットを定義
ハードコードされた色値を直接使用
```

### ✅ 必須

```
Gold (#B8942F) をプライマリカラーとして使用
Ivory (#FAF8F5) をライトモード背景色として使用
brand/colors.json に基づくカラー定義
```

### 6.1 colors.xml（XML リソース）

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- === Background (Ivory) === -->
    <color name="bg_primary">#FAF8F5</color>
    <color name="bg_secondary">#F3F0EB</color>
    <color name="bg_card">#FFFFFF</color>
    <color name="bg_hover">#EEEBE5</color>

    <!-- === Brand Primary (Gold) === -->
    <color name="primary">#B8942F</color>
    <color name="primary_hover">#8C711E</color>
    <color name="primary_light">#F0E6C8</color>

    <!-- === Accent Scale (Gold) === -->
    <color name="accent_50">#FDF9EF</color>
    <color name="accent_100">#F9F0D9</color>
    <color name="accent_200">#F0E6C8</color>
    <color name="accent_300">#E5D5A0</color>
    <color name="accent_400">#D4BC6A</color>
    <color name="accent_500">#B8942F</color>
    <color name="accent_600">#8C711E</color>
    <color name="accent_700">#6B5518</color>

    <!-- === Semantic === -->
    <color name="success">#16A34A</color>
    <color name="success_light">#DCFCE7</color>
    <color name="warning">#CA8A04</color>
    <color name="warning_light">#FEF9C3</color>
    <color name="error">#DC2626</color>
    <color name="error_light">#FEE2E2</color>
    <color name="info">#2563EB</color>
    <color name="info_light">#DBEAFE</color>

    <!-- === Text === -->
    <color name="text_primary">#1C1917</color>
    <color name="text_secondary">#57534E</color>
    <color name="text_tertiary">#A8A29E</color>
    <color name="text_muted">#D6D3D1</color>
    <color name="text_accent">#8C711E</color>
    <color name="text_on_primary">#FFFFFF</color>

    <!-- === Border === -->
    <color name="border">#E7E2DA</color>
    <color name="border_light">#F3F0EB</color>

    <!-- === Dark Mode === -->
    <color name="dark_bg_primary">#1C1917</color>
    <color name="dark_bg_secondary">#292524</color>
    <color name="dark_bg_card">#292524</color>
    <color name="dark_text_primary">#FAF8F5</color>
    <color name="dark_text_secondary">#D6D3D1</color>
    <color name="dark_border">#3D3835</color>

    <!-- === Plan === -->
    <color name="plan_free">#A8A29E</color>
    <color name="plan_trial">#2563EB</color>
    <color name="plan_std">#16A34A</color>
    <color name="plan_pro">#B8942F</color>
    <color name="plan_ent">#7C3AED</color>
</resources>
```

### 6.2 Color.kt（Jetpack Compose）

```kotlin
package com.harmonic.insight.<appname>.ui.theme

import androidx.compose.ui.graphics.Color

// ============================================================
// Insight Ivory & Gold カラーシステム
// brand/colors.json に基づく統一カラー定義
// ============================================================

// --- Light Theme ---
val InsightPrimaryLight = Color(0xFFB8942F)           // Gold
val InsightOnPrimaryLight = Color(0xFFFFFFFF)
val InsightPrimaryContainerLight = Color(0xFFF0E6C8)  // Gold Light
val InsightOnPrimaryContainerLight = Color(0xFF6B5518) // Gold 700

val InsightSecondaryLight = Color(0xFF8C711E)         // Gold Hover
val InsightOnSecondaryLight = Color(0xFFFFFFFF)
val InsightSecondaryContainerLight = Color(0xFFF9F0D9) // Accent 100
val InsightOnSecondaryContainerLight = Color(0xFF6B5518)

val InsightBackgroundLight = Color(0xFFFAF8F5)        // Ivory
val InsightOnBackgroundLight = Color(0xFF1C1917)      // Text Primary
val InsightSurfaceLight = Color(0xFFFFFFFF)           // Card
val InsightOnSurfaceLight = Color(0xFF1C1917)
val InsightSurfaceVariantLight = Color(0xFFF3F0EB)    // Bg Secondary
val InsightOnSurfaceVariantLight = Color(0xFF57534E)  // Text Secondary

val InsightErrorLight = Color(0xFFDC2626)
val InsightOnErrorLight = Color(0xFFFFFFFF)
val InsightOutlineLight = Color(0xFFE7E2DA)           // Border

// --- Dark Theme ---
val InsightPrimaryDark = Color(0xFFD4BC6A)            // Accent 400
val InsightOnPrimaryDark = Color(0xFF6B5518)
val InsightPrimaryContainerDark = Color(0xFF8C711E)   // Gold Hover
val InsightOnPrimaryContainerDark = Color(0xFFF0E6C8)

val InsightSecondaryDark = Color(0xFFF0E6C8)          // Accent 200
val InsightOnSecondaryDark = Color(0xFF6B5518)
val InsightSecondaryContainerDark = Color(0xFF4A3B10) // Accent 800
val InsightOnSecondaryContainerDark = Color(0xFFF9F0D9)

val InsightBackgroundDark = Color(0xFF1C1917)         // Dark Bg Primary
val InsightOnBackgroundDark = Color(0xFFFAF8F5)       // Ivory
val InsightSurfaceDark = Color(0xFF292524)            // Dark Card
val InsightOnSurfaceDark = Color(0xFFFAF8F5)
val InsightSurfaceVariantDark = Color(0xFF3D3835)     // Dark Hover
val InsightOnSurfaceVariantDark = Color(0xFFD6D3D1)   // Text Secondary

val InsightErrorDark = Color(0xFFFF6B6B)
val InsightOnErrorDark = Color(0xFF1C1917)
val InsightOutlineDark = Color(0xFF3D3835)            // Dark Border

// --- Semantic ---
val InsightSuccess = Color(0xFF16A34A)
val InsightWarning = Color(0xFFCA8A04)
val InsightInfo = Color(0xFF2563EB)
```

### 6.3 Theme.kt

```kotlin
package com.harmonic.insight.<appname>.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val InsightLightColorScheme = lightColorScheme(
    primary = InsightPrimaryLight,
    onPrimary = InsightOnPrimaryLight,
    primaryContainer = InsightPrimaryContainerLight,
    onPrimaryContainer = InsightOnPrimaryContainerLight,
    secondary = InsightSecondaryLight,
    onSecondary = InsightOnSecondaryLight,
    secondaryContainer = InsightSecondaryContainerLight,
    onSecondaryContainer = InsightOnSecondaryContainerLight,
    background = InsightBackgroundLight,
    onBackground = InsightOnBackgroundLight,
    surface = InsightSurfaceLight,
    onSurface = InsightOnSurfaceLight,
    surfaceVariant = InsightSurfaceVariantLight,
    onSurfaceVariant = InsightOnSurfaceVariantLight,
    error = InsightErrorLight,
    onError = InsightOnErrorLight,
    outline = InsightOutlineLight,
)

private val InsightDarkColorScheme = darkColorScheme(
    primary = InsightPrimaryDark,
    onPrimary = InsightOnPrimaryDark,
    primaryContainer = InsightPrimaryContainerDark,
    onPrimaryContainer = InsightOnPrimaryContainerDark,
    secondary = InsightSecondaryDark,
    onSecondary = InsightOnSecondaryDark,
    secondaryContainer = InsightSecondaryContainerDark,
    onSecondaryContainer = InsightOnSecondaryContainerDark,
    background = InsightBackgroundDark,
    onBackground = InsightOnBackgroundDark,
    surface = InsightSurfaceDark,
    onSurface = InsightOnSurfaceDark,
    surfaceVariant = InsightSurfaceVariantDark,
    onSurfaceVariant = InsightOnSurfaceVariantDark,
    error = InsightErrorDark,
    onError = InsightOnErrorDark,
    outline = InsightOutlineDark,
)

@Composable
fun Insight<AppName>Theme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Material You（Android 12+ で端末のテーマカラーを使用）
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit,
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context)
            else dynamicLightColorScheme(context)
        }
        darkTheme -> InsightDarkColorScheme
        else -> InsightLightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = InsightTypography,
        content = content,
    )
}
```

> **カメラアプリ等、常時ダークが適切な場合**: `dynamicColor = false` にし、Dark スキームのみを使用可。
> ただしカラー値自体は Ivory & Gold の Dark Mode パレットに準拠すること。

### 6.4 themes.xml（Android システムテーマ）

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.Insight<AppName>" parent="android:Theme.Material.Light.NoActionBar">
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:navigationBarColor">@android:color/transparent</item>
    </style>
</resources>
```

---

## 7. タイポグラフィ

### Type.kt（標準定義）

```kotlin
package com.harmonic.insight.<appname>.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val InsightTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Light,
        fontSize = 57.sp,
        lineHeight = 64.sp,
        letterSpacing = (-0.25).sp,
    ),
    displayMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Light,
        fontSize = 45.sp,
        lineHeight = 52.sp,
    ),
    displaySmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 36.sp,
        lineHeight = 44.sp,
    ),
    headlineLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 32.sp,
        lineHeight = 40.sp,
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 28.sp,
        lineHeight = 36.sp,
    ),
    headlineSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 24.sp,
        lineHeight = 32.sp,
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 22.sp,
        lineHeight = 28.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.15.sp,
    ),
    titleSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.25.sp,
    ),
    bodySmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.4.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp,
    ),
    labelMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp,
    ),
)
```

> **命名**: Typography 変数名は `InsightTypography` で統一する（`Typography` 単体ではない）。

---

## 8. ProGuard / R8（リリースビルド必須）

### build.gradle.kts

```kotlin
buildTypes {
    debug {
        isMinifyEnabled = false
        isShrinkResources = false
    }
    release {
        isMinifyEnabled = true       // 【必須】 R8 有効
        isShrinkResources = true     // 【必須】 リソース縮小
        proguardFiles(
            getDefaultProguardFile("proguard-android-optimize.txt"),
            "proguard-rules.pro"
        )
    }
}
```

### proguard-rules.pro（標準テンプレート）

```proguard
# ============================================================
# Insight Android 標準 ProGuard ルール
# ============================================================

# === Kotlin ===
-dontwarn kotlin.**
-keep class kotlin.Metadata { *; }
-keepclassmembers class kotlin.Metadata { public <methods>; }

# === Jetpack Compose ===
-dontwarn androidx.compose.**
-keep class androidx.compose.runtime.** { *; }
-keep class androidx.compose.ui.** { *; }
-keep class androidx.compose.material3.** { *; }
-keep class androidx.compose.foundation.** { *; }
-keep class androidx.compose.animation.** { *; }

# === Hilt / Dagger ===
-dontwarn dagger.**
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }
-keep @dagger.hilt.android.AndroidEntryPoint class * { *; }
-keep @dagger.hilt.android.HiltAndroidApp class * { *; }
-keepclasseswithmembers class * {
    @dagger.hilt.* <methods>;
}
-keepclasseswithmembers class * {
    @javax.inject.* <fields>;
}
-keepclasseswithmembers class * {
    @javax.inject.* <init>(...);
}

# === Room ===
-keep class * extends androidx.room.RoomDatabase { *; }
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao interface * { *; }
-keepclassmembers class * {
    @androidx.room.* <methods>;
}

# === Navigation ===
-keep class androidx.navigation.** { *; }

# === Lifecycle / ViewModel ===
-keep class * extends androidx.lifecycle.ViewModel { *; }
-keep class * extends androidx.lifecycle.AndroidViewModel { *; }

# === Coroutines ===
-dontwarn kotlinx.coroutines.**
-keepclassmembers class kotlinx.coroutines.** { *; }

# === Firebase Crashlytics ===
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception

# === General ===
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Keep R classes
-keepclassmembers class **.R$* {
    public static <fields>;
}
```

> **アプリ固有のルール**（Room エンティティ、BroadcastReceiver 等）はコメントで分離して追記。

---

## 9. CI/CD ワークフロー（GitHub Actions 標準テンプレート）

```yaml
name: Build APK

on:
  push:
    branches: [ main, 'claude/**' ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4

      # Firebase を使用している場合のみ
      - name: Create google-services.json for CI
        run: |
          if [ ! -f app/google-services.json ]; then
            cat > app/google-services.json << 'GSEOF'
          {
            "project_info": {
              "project_number": "000000000000",
              "project_id": "insight-app-ci",
              "storage_bucket": "insight-app-ci.appspot.com"
            },
            "client": [
              {
                "client_info": {
                  "mobilesdk_app_id": "1:000000000000:android:0000000000000000",
                  "android_client_info": {
                    "package_name": "com.harmonic.insight.<appname>"
                  }
                },
                "api_key": [{ "current_key": "CI_PLACEHOLDER_KEY" }]
              }
            ]
          }
          GSEOF
          fi

      - name: Build Release APK
        run: ./gradlew assembleRelease --stacktrace

      - name: Display APK size
        run: |
          echo "=== Release APK ==="
          find app/build/outputs/apk/release/ -name "*.apk" -exec ls -lh {} \;

      - name: Upload Release APK
        uses: actions/upload-artifact@v4
        with:
          name: app-release
          path: app/build/outputs/apk/release/*.apk
          retention-days: 30
```

### 統一ポイント

| 項目 | 標準 |
|------|------|
| JDK | 17 (Temurin) |
| Gradle | `gradle/actions/setup-gradle@v4` |
| トリガー | `main`, `claude/**` ブランチ |
| ビルド | `assembleRelease` |
| アーティファクト保持 | 30日 |
| google-services.json | CI プレースホルダー自動生成 |

---

## 10. 多言語対応（i18n）

### 必須要件

| 項目 | 必須 |
|------|------|
| `res/values/strings.xml` | ✅ 日本語（デフォルト） |
| `res/values-en/strings.xml` | ✅ 英語 |

### ルール

- UI テキストは**すべて** `strings.xml` で管理する。Compose 内のハードコードは禁止。
- `stringResource(R.string.xxx)` を使用する。
- 日本語をデフォルト（`values/strings.xml`）、英語を `values-en/` に配置。

---

## 11. gradle.properties（標準）

```properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
```

---

## 12. ライセンス管理

InsightOffice 製品（INSS/IOSH/IOSD 等）の Android 版では、ライセンス管理が必須。
ユーティリティアプリ（カメラ、ランチャー、時計等）では任意。

### PlanCode.kt

```kotlin
package com.harmonic.insight.<appname>.license

enum class PlanCode(val displayName: String) {
    FREE("FREE"),
    TRIAL("TRIAL"),
    STD("STD"),
    PRO("PRO"),
    ENT("ENT"),
}
```

### LicenseManager.kt

```kotlin
package com.harmonic.insight.<appname>.license

import android.content.Context
import android.content.SharedPreferences
import java.util.regex.Pattern

class LicenseManager(context: Context, private val productCode: String) {
    companion object {
        private val KEY_PATTERN = Pattern.compile(
            "^([A-Z]{4})-(TRIAL|STD|PRO)-(\\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$"
        )
    }

    private val prefs: SharedPreferences =
        context.getSharedPreferences("insight_license", Context.MODE_PRIVATE)

    var currentPlan: PlanCode = PlanCode.FREE
        private set

    val isActivated: Boolean
        get() = currentPlan != PlanCode.FREE

    init {
        loadLicense()
    }

    fun activate(email: String, key: String): Result<String> {
        val matcher = KEY_PATTERN.matcher(key.uppercase())
        if (!matcher.matches()) {
            return Result.failure(Exception("無効なライセンスキー形式です"))
        }

        val product = matcher.group(1)
        if (product != productCode) {
            return Result.failure(Exception("この製品用のキーではありません"))
        }

        prefs.edit()
            .putString("email", email)
            .putString("key", key)
            .apply()

        currentPlan = PlanCode.valueOf(matcher.group(2)!!)
        return Result.success("ライセンスが有効化されました")
    }

    fun deactivate() {
        prefs.edit().clear().apply()
        currentPlan = PlanCode.FREE
    }

    private fun loadLicense() {
        val key = prefs.getString("key", null) ?: return
        val matcher = KEY_PATTERN.matcher(key)
        if (matcher.matches()) {
            currentPlan = PlanCode.valueOf(matcher.group(2)!!)
        }
    }
}
```

---

## 13. 現行アプリの準拠状況

### Native Kotlin アプリ

| アプリ | パッケージ | カラー | Version Catalog | ProGuard | SDK | JVM | 準拠率 |
|--------|----------|--------|:---------------:|:--------:|:---:|:---:|:------:|
| Insight Voice Clock | ❌ `com.insightvoiceclock` | ✅ Ivory & Gold | ✅ | ✅ | ✅ 35 | ✅ 17 | 80% |
| Insight Launcher | ✅ | ✅ Ivory & Gold | ✅ | ✅ | ✅ 35 | ✅ 17 | 90% |
| Insight Camera | ✅ | ✅ Ivory & Gold | ✅ | ✅ | ✅ 35 | ✅ 17 | 90% |
| InclineInsight | ✅ | ✅ Ivory & Gold | ✅ | ✅ | ✅ 35 | ✅ 17 | 90% |
| ConsulType（コンサル評価）| ✅ | ✅ Ivory & Gold | ✅ | ✅ | ✅ 35 | ✅ 17 | 90% |
| Harmonic Horoscope | ✅ | ✅ Ivory & Gold | ✅ | ✅ | ✅ 35 | ✅ 17 | 90% |
| Food Medicine (native) | ✅ | ✅ Ivory & Gold | ❌ inline | ✅ | ✅ 35 | ✅ 17 | 80% |

### Expo/React Native アプリ

| アプリ | パッケージ | カラー | 備考 |
|--------|----------|--------|------|
| Insight QR | ✅ `com.harmonicinsight.insightqr` | ✅ Ivory & Gold | 元から準拠済み |
| ConsulEvaluate Mobile | ✅ `com.harmonicinsight.consulevaluate` | ✅ Ivory & Gold | Blue→Gold 修正済み |
| Food Medicine (Expo) | ✅ `com.foodmedicineinsight.app` | ✅ Ivory & Gold | Teal→Gold 修正済み |

---

## 14. 必須チェックリスト

### デザイン（トンマナ）

- [ ] `Color.kt` が Ivory & Gold テーマに準拠（`Insight*Light` / `Insight*Dark` 命名）
- [ ] `colors.xml` が標準テンプレートに準拠
- [ ] **Primary** = Gold (#B8942F) が使用されている
- [ ] **Background** = Ivory (#FAF8F5) がライトモード背景に使用されている
- [ ] 青色がプライマリとして使用されて**いない**
- [ ] Dark Mode カラーが `brand/colors.json` の darkMode セクションに準拠
- [ ] カードは白背景 (#FFFFFF) + cornerRadius: 12dp

### テーマ

- [ ] `Theme.kt` が Material3 + Material You (API 31+) に対応
- [ ] テーマ関数名が `Insight<AppName>Theme` 形式
- [ ] `InsightTypography` が標準定義に準拠
- [ ] `themes.xml` が transparent ステータスバー/ナビゲーションバー

### ビルド

- [ ] `gradle/libs.versions.toml` が存在し、バージョンが一元管理されている
- [ ] compileSdk = 35, targetSdk = 35, minSdk = 26
- [ ] JVM Target = 17
- [ ] Release ビルドで `isMinifyEnabled = true`, `isShrinkResources = true`
- [ ] `proguard-rules.pro` が標準テンプレートに準拠

### プロジェクト構造

- [ ] パッケージ名が `com.harmonic.insight.<appname>` 形式
- [ ] Kotlin ソースが `src/main/kotlin/` に配置
- [ ] `APP_SPEC.md` が存在

### 多言語

- [ ] `values/strings.xml`（日本語）が存在
- [ ] `values-en/strings.xml`（英語）が存在
- [ ] Compose 内に文字列のハードコードがない

### CI/CD

- [ ] `.github/workflows/build.yml` が標準テンプレートに準拠
- [ ] JDK 17 + Temurin
- [ ] `gradle/actions/setup-gradle@v4` を使用
- [ ] Release APK をビルド・アップロード

### ライセンス（InsightOffice 製品のみ）

- [ ] `LicenseManager` クラスが実装されている
- [ ] ライセンスキー形式: `{製品コード}-{プラン}-{YYMM}-XXXX-XXXX-XXXX`
- [ ] ライセンス画面が Insight Slides 形式に準拠

---

## 参考

- **ブランドカラー定義**: `brand/colors.json`
- **デザインシステム**: `brand/design-system.json`
- **CLAUDE.md**: プロジェクト全体のガイドライン
