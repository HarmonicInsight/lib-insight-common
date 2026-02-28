# Android 開発標準

> **すべての HARMONIC insight Android アプリは、このドキュメントに準拠すること。**
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
| `__app_display_name__` | 表示名 | `スッキリカメラ` |
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

### 2.1 APK サイズ最適化（必須）

APK サイズを不必要に肥大化させないため、以下のルールに従うこと。

#### ABI Split

```kotlin
splits {
    abi {
        isEnable = true
        reset()
        include("arm64-v8a", "armeabi-v7a")
        isUniversalApk = false    // 【必須】 Play Store は AAB / ABI別APK で配布
    }
}
```

> **禁止**: `isUniversalApk = true`。Universal APK は全 ABI のネイティブライブラリを含むため
> サイズが倍増する。Play Store（AAB）/ ABI 別 APK で配布すること。

#### desugar_jdk_libs は原則不要

minSdk = 26 では `java.time` 等の Java 8 API がネイティブで利用可能。
`desugar_jdk_libs`（約 2〜3 MB）は **minSdk 26 以上では追加しないこと**。

```kotlin
// ❌ minSdk 26 以上では不要
compileOptions {
    isCoreLibraryDesugaringEnabled = true  // 削除する
}
dependencies {
    coreLibraryDesugaring(libs.desugar.jdk.libs)  // 削除する
}

// ✅ minSdk 26 以上の正しい設定
compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}
```

#### ML Kit: アンバンドル版を使用

ML Kit を使用する場合、**Play Services 版（アンバンドル版）** を使うこと。
バンドル版は ML モデル（約 3〜5 MB）が APK に埋め込まれる。

| ❌ バンドル版（APK にモデル内蔵） | ✅ アンバンドル版（Play Services 経由） |
|---|---|
| `com.google.mlkit:barcode-scanning` | `com.google.android.gms:play-services-mlkit-barcode-scanning` |
| `com.google.mlkit:text-recognition-japanese` | `com.google.android.gms:play-services-mlkit-text-recognition-japanese` |

アンバンドル版を使う場合、`AndroidManifest.xml` にモデル自動ダウンロード宣言を追加:

```xml
<application ...>
    <!-- ML Kit モデルを Google Play Services 経由で自動ダウンロード -->
    <meta-data
        android:name="com.google.mlkit.vision.DEPENDENCIES"
        android:value="barcode" />   <!-- 使用する機能に応じて変更 -->
</application>
```

> **例外**: Google Play Services が利用できない環境（中国市場等）向けのアプリのみバンドル版を許可。

---

## 3. パッケージ命名規則

```
com.harmonic.insight.<アプリ名>
```

| アプリ | パッケージ名 | 種別 |
|--------|------------|------|
| スッキリカメラ | `com.harmonic.insight.camera` | Native Kotlin |
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
│   ├── dev.keystore                    # 【必須】開発用署名キー（リポジトリに含める）
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
    <color name="plan_biz">#16A34A</color>
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

## 8. ProGuard / R8 / AAB（リリースビルド必須）

### build.gradle.kts — buildTypes

```kotlin
buildTypes {
    debug {
        isMinifyEnabled = false
        isShrinkResources = false
        signingConfig = signingConfigs.getByName("debug")  // dev.keystore を使用
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

### build.gradle.kts — bundle（AAB 最適化）

Play Store は AAB（Android App Bundle）でのアップロードが**必須**。
以下の `bundle` ブロックで分割配信を有効にする。

```kotlin
bundle {
    language {
        enableSplit = true   // 言語リソースを端末に応じて配信
    }
    density {
        enableSplit = true   // 画面密度リソースを端末に応じて配信
    }
    abi {
        enableSplit = true   // ABI（CPU アーキテクチャ）を端末に応じて配信
    }
}
```

> **ビルドコマンド**: `./gradlew bundleRelease` で AAB を生成。
> 出力先: `app/build/outputs/bundle/release/app-release.aab`

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

### ProGuard keep ルールのベストプラクティス

| ❌ 禁止 | ✅ 正しいやり方 | 理由 |
|---|---|---|
| `-keep class com.example.lib.** { *; }` | 使用クラスだけを個別に keep | ライブラリ全体の keep は R8 の tree-shaking を無効化し、APK サイズを肥大化させる |
| リフレクションで使わないクラスの keep | keep しない | R8 が自動的に不要クラスを除去する |

**例: ZXing（QR コード生成）**

```proguard
# ❌ ライブラリ全体を keep（サイズ増大）
-keep class com.google.zxing.** { *; }

# ✅ QR エンコードに必要なクラスだけを keep
-keep class com.google.zxing.BarcodeFormat { *; }
-keep class com.google.zxing.EncodeHintType { *; }
-keep class com.google.zxing.WriterException { *; }
-keep class com.google.zxing.common.BitMatrix { *; }
-keep class com.google.zxing.qrcode.QRCodeWriter { *; }
```

> **原則**: サードパーティライブラリの keep は「リフレクション・シリアライゼーションで必要な最小限のクラス」に絞る。
> R8 ビルド後にクラッシュが発生した場合のみ、必要なクラスを追加していくこと。

---

## 8.5. 署名設定（Signing）

### 開発用 keystore（dev.keystore）— 上書きインストール対策

Android は署名キーが異なる APK の上書きインストールを拒否する。
チーム全員が同じ debug 署名を使うため、**プロジェクトごとに `app/dev.keystore` をリポジトリに含める**。

```
プロジェクトルート/
├── app/
│   ├── dev.keystore          # ✅ リポジトリに含める（開発用）
│   └── build.gradle.kts
├── keystore.properties       # ❌ リポジトリに含めない（リリース用）
└── .gitignore
```

> **重要**: `dev.keystore` は開発用のため、パスワードは固定値（`android`）で問題ない。
> **release keystore は絶対にリポジトリに含めないこと。**

### dev.keystore の生成

`init-app.sh` で自動生成されるが、手動で生成する場合:

```bash
keytool -genkeypair \
    -alias androiddebugkey \
    -keypass android \
    -keystore app/dev.keystore \
    -storepass android \
    -dname "CN=Android Debug,O=Android,C=US" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 36500
```

### build.gradle.kts — signingConfigs

```kotlin
signingConfigs {
    // 開発用署名（チーム共有の dev.keystore を使用）
    getByName("debug") {
        val devKeystore = rootProject.file("app/dev.keystore")
        if (devKeystore.exists()) {
            storeFile = devKeystore
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }
    create("release") {
        val props = rootProject.file("keystore.properties")
        if (props.exists()) {
            val keystoreProps = Properties().apply {
                props.inputStream().use { load(it) }
            }
            storeFile = file(keystoreProps["storeFile"] as String)
            storePassword = keystoreProps["storePassword"] as String
            keyAlias = keystoreProps["keyAlias"] as String
            keyPassword = keystoreProps["keyPassword"] as String
        }
    }
}
```

### .gitignore の設定

```gitignore
# Secrets
*.keystore
!app/dev.keystore     # 開発用 keystore はリポジトリに含める
*.jks
keystore.properties
.env
```

### keystore のルール

| 種類 | ファイル | リポジトリ | パスワード | 用途 |
|------|---------|:--------:|----------|------|
| 開発用 | `app/dev.keystore` | ✅ 含める | 固定 `android` | debug ビルド、上書きインストール |
| リリース用 | `release.keystore` | ❌ 含めない | GitHub Secrets 経由 | Play Store 提出 |

### アプリ間での keystore 共有について

- **開発用 keystore**: アプリごとに**別々**の `dev.keystore` を生成・管理する
- **リリース用 keystore**: アプリごとに**別々**の `release.keystore` を使用する
- insight-common で共通の keystore を持つことは**しない**

> **理由**: 同一署名キーで異なる `applicationId` のアプリを署名しても直接的な問題は起きないが、
> keystore のローテーション・漏洩時の影響範囲を限定するため、アプリごとに独立させる。

---

## 9. CI/CD ワークフロー（GitHub Actions 標準テンプレート）

> **テンプレートファイル**: `templates/android/.github/workflows/build.yml`
> APK（テスト配布用）と AAB（Play Store 用）の両方を必ずビルドすること。

```yaml
name: Build Android

on:
  push:
    branches: [ main, 'claude/**' ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      HAS_SIGNING_KEY: ${{ secrets.KEYSTORE_BASE64 }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          submodules: true

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4

      # --- 署名設定（secrets が設定されている場合のみ） ---
      - name: Setup signing
        if: env.HAS_SIGNING_KEY != ''
        env:
          KEYSTORE_BASE64: ${{ secrets.KEYSTORE_BASE64 }}
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: |
          echo "$KEYSTORE_BASE64" | base64 -d > app/release.keystore
          cat > keystore.properties <<PROPS
          storeFile=release.keystore
          storePassword=$KEYSTORE_PASSWORD
          keyAlias=$KEY_ALIAS
          keyPassword=$KEY_PASSWORD
          PROPS

      # Firebase を使用している場合のみ（不要なら削除）
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

      # --- ビルド: AAB（Play Store 用）+ APK ---
      - name: Build Release AAB
        run: ./gradlew bundleRelease --stacktrace

      - name: Build Release APK
        run: ./gradlew assembleRelease --stacktrace

      # --- アーティファクト名をアプリ名に変更 ---
      - name: Rename artifacts
        run: |
          for f in app/build/outputs/apk/release/app-*.apk; do
            [ -f "$f" ] && mv "$f" "${f/app-/<AppDisplayName>-}"
          done
          for f in app/build/outputs/bundle/release/app-*.aab; do
            [ -f "$f" ] && mv "$f" "${f/app-/<AppDisplayName>-}"
          done

      # --- サイズ確認 ---
      - name: Display build artifact sizes
        run: |
          echo "=== Release APK ==="
          find app/build/outputs/apk/release/ -name "*.apk" -exec ls -lh {} \; 2>/dev/null || echo "No APK found"
          echo ""
          echo "=== Release AAB ==="
          find app/build/outputs/bundle/release/ -name "*.aab" -exec ls -lh {} \; 2>/dev/null || echo "No AAB found"

      # --- アーティファクトアップロード ---
      - name: Upload AAB
        uses: actions/upload-artifact@v4
        with:
          name: <app-name>-aab
          path: app/build/outputs/bundle/release/*.aab
          if-no-files-found: error
          retention-days: 90

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: <app-name>-apk
          path: app/build/outputs/apk/release/*.apk
          if-no-files-found: error
          retention-days: 90

      # --- GitHub Release（タグ push 時のみ） ---
      - name: Collect release artifacts
        if: startsWith(github.ref, 'refs/tags/v')
        run: |
          mkdir -p release-artifacts
          cp app/build/outputs/bundle/release/*.aab release-artifacts/
          cp app/build/outputs/apk/release/*.apk release-artifacts/

      - name: Create GitHub Release
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v2
        with:
          files: release-artifacts/*
          generate_release_notes: true
          # -rc, -beta, -alpha サフィックス付きタグは prerelease として作成
          prerelease: ${{ contains(github.ref, '-rc') || contains(github.ref, '-beta') || contains(github.ref, '-alpha') }}
```

### 統一ポイント

| 項目 | 標準 |
|------|------|
| JDK | 17 (Temurin) |
| Gradle | `gradle/actions/setup-gradle@v4` |
| サブモジュール | `submodules: true`（insight-common 使用時） |
| トリガー | `main`, `claude/**` ブランチ + `v*` タグ |
| ビルド | `bundleRelease`（AAB）+ `assembleRelease`（APK）の**両方** |
| 署名 | `secrets.KEYSTORE_BASE64` 経由（CI 上で復元） |
| アーティファクト保持 | 90日 |
| GitHub Release | `v*` タグ push 時に AAB + APK を自動リリース |
| サイズ表示 | APK / AAB のファイルサイズをログに出力 |
| google-services.json | CI プレースホルダー自動生成（Firebase 使用時のみ） |

### 必要な GitHub Secrets

| Secret 名 | 説明 | 設定方法 |
|-----------|------|---------|
| `KEYSTORE_BASE64` | リリース keystore の Base64 エンコード | `base64 -w 0 release.keystore` |
| `KEYSTORE_PASSWORD` | keystore のパスワード | |
| `KEY_ALIAS` | キーエイリアス | |
| `KEY_PASSWORD` | キーのパスワード | |

> **注意**: Secrets が未設定の場合、署名ステップはスキップされ debug 署名でビルドされる。
> Play Store にアップロードするには release 署名が必須。

### リリースフロー（基本）

```bash
# 1. バージョン更新（build.gradle.kts の versionCode / versionName）
# 2. コミット & プッシュ
git add . && git commit -m "release: v1.1.0"
git tag v1.1.0
git push origin main --tags

# → GitHub Actions が自動で:
#   - AAB + APK をビルド
#   - GitHub Release を作成（AAB + APK を添付）
```

> **詳細なリリース管理**: §9.5 を参照。

---

## 9.5 リリース管理（Release Management）

### 概要

GitHub の **タグ + GitHub Releases** を使ってバージョン管理・リリース管理を行う。

```
バージョン管理フロー:

  build.gradle.kts          Git タグ              GitHub Release
  ┌────────────────┐      ┌──────────┐          ┌──────────────────┐
  │ versionCode: 1 │      │          │          │                  │
  │ versionName:   │──→   │  v1.0.0  │──push──→ │  Release v1.0.0  │
  │  "1.0.0"       │      │          │          │  ├── app.aab     │
  └────────────────┘      └──────────┘          │  ├── app.apk     │
                                                 │  └── Release Notes│
  versionCode: 2                                 └──────────────────┘
  versionName: "1.1.0" ──→  v1.1.0  ──push──→  Release v1.1.0
  ...
```

### バージョニング規則

| 項目 | 規則 | 例 |
|------|------|-----|
| **versionName** | セマンティックバージョニング（MAJOR.MINOR.PATCH） | `1.0.0`, `1.1.0`, `2.0.0` |
| **versionCode** | リリースごとに +1（Play Store は同一値を拒否） | `1`, `2`, `3` |
| **Git タグ** | `v` + versionName | `v1.0.0`, `v1.1.0` |

#### セマンティックバージョニング

| 変更内容 | バージョン更新 | 例 |
|---------|:------------:|-----|
| バグ修正・微調整 | PATCH +1 | `1.0.0` → `1.0.1` |
| 新機能追加・UI 改善 | MINOR +1 | `1.0.0` → `1.1.0` |
| 破壊的変更・大幅リニューアル | MAJOR +1 | `1.0.0` → `2.0.0` |

### リリースの作成手順

#### 手順 1: バージョン更新

`app/build.gradle.kts` の `versionCode` と `versionName` を更新:

```kotlin
android {
    defaultConfig {
        versionCode = 2          // 前回から +1
        versionName = "1.1.0"   // セマンティックバージョニング
    }
}
```

#### 手順 2: リリースチェック（推奨）

```bash
./insight-common/scripts/release-check.sh . --platform android
```

#### 手順 3: コミット・タグ・プッシュ

```bash
# コミット
git add .
git commit -m "release: v1.1.0"

# タグ作成
git tag v1.1.0

# プッシュ（コミット + タグ）
git push origin main --tags
```

#### 手順 4: 自動リリース

`v*` タグの push をトリガーに GitHub Actions が自動実行:

1. AAB + APK をビルド
2. GitHub Release を作成（`softprops/action-gh-release@v2`）
3. AAB + APK を Release に添付
4. コミット履歴からリリースノートを自動生成

#### ヘルパースクリプト（推奨）

```bash
# 通常のリリース
./insight-common/scripts/create-release.sh .

# バージョン指定
./insight-common/scripts/create-release.sh . --version 1.1.0

# 既存リリースの上書き（初期開発時）
./insight-common/scripts/create-release.sh . --version 1.0.0 --overwrite
```

### 既存リリースの上書き（v1.0.0 の再リリース）

初期開発時は同じバージョンを修正して再リリースしたい場合がある。
以下の手順で既存の GitHub Release とタグを削除し、再作成する。

#### 手動での上書き手順

```bash
# 1. 既存の GitHub Release を削除
gh release delete v1.0.0 --yes

# 2. リモートタグを削除
git push origin --delete v1.0.0

# 3. ローカルタグを削除
git tag -d v1.0.0

# 4. 修正をコミット
git add .
git commit -m "release: v1.0.0 (修正)"

# 5. タグを再作成
git tag v1.0.0

# 6. プッシュ
git push origin main --tags

# → GitHub Actions が再度 Release を作成
```

#### ヘルパースクリプトでの上書き

```bash
# --overwrite フラグで上記を自動実行
./insight-common/scripts/create-release.sh . --version 1.0.0 --overwrite
```

> **注意**: Play Store に既にアップロード済みの場合、同じ `versionCode` は拒否される。
> Play Store 向けには `versionCode` を +1 すること（`versionName` は同じでも可）。

### プレリリース（テスト版）

テスト版を配布したい場合、`-rc` / `-beta` / `-alpha` サフィックスを使用:

```bash
# リリース候補
git tag v1.0.0-rc.1
git push origin v1.0.0-rc.1
# → GitHub Release が prerelease: true で作成される
```

テンプレートの `build.yml` を以下のように拡張すると、プレリリースを自動判定できる:

```yaml
      - name: Create GitHub Release
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v2
        with:
          files: release-artifacts/*
          generate_release_notes: true
          prerelease: ${{ contains(github.ref, '-rc') || contains(github.ref, '-beta') || contains(github.ref, '-alpha') }}
```

### ドラフトリリース

GitHub 上で確認してから公開したい場合:

```yaml
      - name: Create GitHub Release
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v2
        with:
          files: release-artifacts/*
          generate_release_notes: true
          draft: true    # ← ドラフトとして作成（手動で Publish する）
```

### リリース管理のベストプラクティス

| フェーズ | 推奨戦略 | 理由 |
|---------|---------|------|
| **初期開発**（v1.0.0） | 上書き可。`--overwrite` を活用 | 安定版ができるまで試行錯誤 |
| **安定版以降**（v1.1.0+） | 上書き禁止。新バージョンで対応 | リリース履歴の追跡性を確保 |
| **ホットフィックス** | PATCH バージョン（v1.0.1） | 既存機能への影響を最小化 |
| **Play Store 提出前** | `-rc.N` でテスト版を配布 | 社内テスト・QA を経てから正式版 |

### GitHub Release ページの活用

| 用途 | 説明 |
|------|------|
| **APK の社内配布** | Release の Assets から APK を直接ダウンロード |
| **AAB の Play Store 提出** | Release の Assets から AAB をダウンロードし Play Console にアップロード |
| **リリースノート** | 自動生成 + 手動編集で変更履歴を管理 |
| **過去バージョンの参照** | 任意のバージョンの APK/AAB にいつでもアクセス可能 |

---

## 10. 多言語対応（i18n）

> **詳細**: `standards/LOCALIZATION.md` を参照。

### 必須要件

| 項目 | 必須 |
|------|------|
| `res/values/strings.xml` | ✅ 日本語（デフォルト） |
| `res/values-en/strings.xml` | ✅ 英語 |

### ルール

- UI テキストは**すべて** `strings.xml` で管理する。Compose 内のハードコードは禁止。
- `stringResource(R.string.xxx)` を使用する。
- 日本語をデフォルト（`values/strings.xml`）、英語を `values-en/` に配置。
- パラメータは `%1$s`（文字列）、`%1$d`（整数）を使用。
- `values/strings.xml` と `values-en/strings.xml` のキーは完全一致させる。

### Play ストア向けメタデータ

リリース時はストアのメタデータも日英で用意する。テンプレートは `templates/android/fastlane/` にあります。

```
fastlane/metadata/android/
├── ja-JP/
│   ├── title.txt               # アプリ名（30文字以内）
│   ├── short_description.txt   # 短い説明（80文字以内）
│   ├── full_description.txt    # 完全な説明（4000文字以内）
│   └── changelogs/default.txt  # リリースノート（500文字以内）
└── en-US/
    ├── title.txt
    ├── short_description.txt
    ├── full_description.txt
    └── changelogs/default.txt
```

> 文字数制限は `config/localization.ts` の `PLAY_STORE_LIMITS` で定義。

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

Insight Business Suite 製品（INSS/IOSH/IOSD 等）の Android 版では、ライセンス管理が必須。
ユーティリティアプリ（カメラ、ランチャー、時計等）では任意。

### PlanCode.kt

```kotlin
package com.harmonic.insight.<appname>.license

enum class PlanCode(val displayName: String) {
    FREE("FREE"),
    TRIAL("TRIAL"),
    BIZ("BIZ"),
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
            "^([A-Z]{4})-(TRIAL|BIZ|ENT)-(\\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$"
        )
    }

    private val prefs: SharedPreferences =
        context.getSharedPreferences("insight_license", Context.MODE_PRIVATE)

    var currentPlan: PlanCode = PlanCode.TRIAL
        private set

    val isActivated: Boolean
        get() = currentPlan != PlanCode.TRIAL

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
        currentPlan = PlanCode.TRIAL
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

## 13. Expo/React Native（Android アプリの第2パターン）

> **Kotlin ではなく Expo/React Native で開発する Android アプリ向け。**
> テンプレートは `templates/expo/` に配置。

### クイックスタート（Expo アプリ作成）

#### 方法1: 自動スキャフォールド（推奨）

```bash
./insight-common/scripts/init-app.sh my-app --platform expo --package com.harmonicinsight.myapp
```

#### 方法2: テンプレートファイルから手動コピー

`templates/expo/` に**そのままコピーして使えるファイル**が揃っています:

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

**プレースホルダー置換**（コピー後に実行）:

| プレースホルダー | 説明 | 例 |
|---|---|---|
| `__app_slug__` | Expo slug (小文字ハイフン) | `insight-qr` |
| `__app_display_name__` | 表示名 | `Insight QR` |
| `__APP_PACKAGE__` | パッケージ名 | `com.harmonicinsight.insightqr` |
| `__PRODUCT_CODE__` | 製品コード (4文字) | `IOSH` |

### 13.1 基本方針

| 項目 | 標準値 |
|------|--------|
| **SDK** | Expo 52+ |
| **ナビゲーション** | expo-router（ファイルベースルーティング） |
| **状態管理** | React hooks / Zustand（必要な場合） |
| **カラー** | `lib/colors.ts` から import（ハードコード禁止） |
| **ライセンス** | `lib/license-manager.ts`（Insight Business Suite 製品のみ） |
| **TypeScript** | strict mode 必須 |
| **パッケージ名** | `com.harmonicinsight.*` |
| **ビルド** | EAS Build（`eas.json` 必須） |

### 13.2 パッケージ命名規則（Expo）

```
com.harmonicinsight.<アプリ名>
```

> **注意**: Native Kotlin (`com.harmonic.*`) とは命名規則が異なる。

### 13.3 カラーシステム（lib/colors.ts）

Ivory & Gold カラーは `lib/colors.ts` で一元管理。ハードコード禁止。

```typescript
import { colors } from '@/lib/colors';

// Primary (Gold): colors.brand.primary  (#B8942F)
// Background (Ivory): colors.background.primary  (#FAF8F5)
// Text: colors.text.primary  (#1C1917)
// Border: colors.border.default  (#E7E2DA)
```

### 13.4 app.json 標準

```json
{
  "expo": {
    "backgroundColor": "#B8942F",
    "splash": {
      "backgroundColor": "#B8942F"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#B8942F"
      },
      "package": "com.harmonicinsight.__app_slug__"
    },
    "plugins": ["expo-router"]
  }
}
```

### 13.5 EAS Build（eas.json）

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
    "production": { "android": { "buildType": "app-bundle" } }
  }
}
```

### 13.6 ライセンス管理（lib/license-manager.ts）

- `@react-native-async-storage/async-storage` を使用
- キー形式: Kotlin 版と同一 (`{製品コード}-{プラン}-{YYMM}-{HASH}-{SIG1}-{SIG2}`)
- シングルトンパターン、`initialize()` で AsyncStorage から復元

### 13.7 Expo チェックリスト

- [ ] `lib/colors.ts` が Ivory & Gold テーマに準拠
- [ ] `app.json` の backgroundColor/splash が Gold (#B8942F)
- [ ] `eas.json` が存在（development/preview/production プロファイル）
- [ ] `tsconfig.json` で strict mode が有効
- [ ] パッケージ名が `com.harmonicinsight.*` 形式
- [ ] expo-router を使用（ファイルベースルーティング）
- [ ] ハードコードカラーが使用されていない
- [ ] `lib/license-manager.ts` が実装（Insight Business Suite 製品のみ）

---

## 14. 現行アプリの準拠状況

### Native Kotlin アプリ

| アプリ | パッケージ | カラー | Version Catalog | ProGuard | SDK | JVM | 準拠率 |
|--------|----------|--------|:---------------:|:--------:|:---:|:---:|:------:|
| Insight Voice Clock | ❌ `com.insightvoiceclock` | ✅ Ivory & Gold | ✅ | ✅ | ✅ 35 | ✅ 17 | 80% |
| Insight Launcher | ✅ | ✅ Ivory & Gold | ✅ | ✅ | ✅ 35 | ✅ 17 | 90% |
| スッキリカメラ | ✅ | ✅ Ivory & Gold | ✅ | ✅ | ✅ 35 | ✅ 17 | 90% |
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

## 15. 必須チェックリスト

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

### ビルド・署名

- [ ] `gradle/libs.versions.toml` が存在し、バージョンが一元管理されている
- [ ] compileSdk = 35, targetSdk = 35, minSdk = 26
- [ ] JVM Target = 17
- [ ] Release ビルドで `isMinifyEnabled = true`, `isShrinkResources = true`
- [ ] `proguard-rules.pro` が標準テンプレートに準拠
- [ ] `app/dev.keystore` がリポジトリに含まれている（上書きインストール対策）
- [ ] debug ビルドが `dev.keystore` を使用する signingConfig になっている

### APK サイズ最適化（§2.1）

- [ ] `isUniversalApk = false`（ABI split 使用時）
- [ ] `desugar_jdk_libs` が含まれて**いない**（minSdk 26 では不要）
- [ ] `isCoreLibraryDesugaringEnabled` が設定されて**いない**（minSdk 26 では不要）
- [ ] ML Kit 使用時: アンバンドル版（`play-services-mlkit-*`）を使用
- [ ] ProGuard でサードパーティライブラリ全体を keep して**いない**（§8 参照）

### プロジェクト構造

- [ ] パッケージ名が `com.harmonic.insight.<appname>` 形式
- [ ] Kotlin ソースが `src/main/kotlin/` に配置
- [ ] `APP_SPEC.md` が存在

### 多言語（`standards/LOCALIZATION.md` 参照）

- [ ] `values/strings.xml`（日本語）が存在
- [ ] `values-en/strings.xml`（英語）が存在
- [ ] `values/strings.xml` と `values-en/strings.xml` のキーが完全一致
- [ ] Compose 内に文字列のハードコードがない
- [ ] Play ストアリリース時: メタデータ（タイトル・説明）が日英で用意されている

### CI/CD

- [ ] `.github/workflows/build.yml` が標準テンプレートに準拠
- [ ] JDK 17 + Temurin
- [ ] `gradle/actions/setup-gradle@v4` を使用
- [ ] `submodules: true` が設定されている（insight-common 使用時）
- [ ] Release APK **と AAB の両方**をビルド・アップロード
- [ ] `bundle {}` ブロックで language / density / abi split が有効
- [ ] 署名設定が secrets 経由（`KEYSTORE_BASE64` 等）
- [ ] `v*` タグで GitHub Release が自動作成される
- [ ] `--stacktrace` フラグ付きでビルド
- [ ] APK / AAB サイズがログに表示される

### ライセンス（Insight Business Suite 製品のみ）

- [ ] `LicenseManager` クラスが実装されている
- [ ] ライセンスキー形式: `{製品コード}-{プラン}-{YYMM}-XXXX-XXXX-XXXX`
- [ ] ライセンス画面が Insight Slides 形式に準拠

---

## 16. アイコンパイプライン（全 Android アプリ共通）

### 概要

マスター PNG（1024x1024）から、Android ネイティブアプリに必要な全アイコンファイルを自動生成する。
マスター PNG が唯一の正（Single Source of Truth）。

```
マスターソース                       生成出力 (app/src/main/res/)
┌────────────────────┐              ┌──────────────────────────────────┐
│ brand/icons/png/   │              │ mipmap-mdpi/     (48px)          │
│  icon-*.png        │──── PNG ────→│  ic_launcher.png                 │
│  (1024x1024)       │              │  ic_launcher_round.png           │
│                    │              │ mipmap-hdpi/     (72px)          │
└────────────────────┘              │  ic_launcher.png                 │
                                    │  ic_launcher_round.png           │
                                    │ mipmap-xhdpi/    (96px)          │
                                    │  ic_launcher.png                 │
                                    │  ic_launcher_round.png           │
                                    │ mipmap-xxhdpi/   (144px)         │
                                    │  ic_launcher.png                 │
                                    │  ic_launcher_round.png           │
                                    │ mipmap-xxxhdpi/  (192px)         │
                                    │  ic_launcher.png                 │
                                    │  ic_launcher_round.png           │
                                    └──────────────────────────────────┘
```

> **重要**: `mipmap-anydpi-v26/` や `drawable/ic_launcher_foreground.xml` がアプリの
> `res/` に残っていると、mipmap PNG よりも優先されてしまう。
> これらのファイルが存在する場合は削除すること。

### 生成コマンド

```bash
# 個別アプリのアイコンを生成（PNG → mipmap PNGs）
python scripts/generate-app-icon.py --product CAMERA

# 全アプリのアイコンを一括生成
python scripts/generate-app-icon.py --all

# 生成後、アプリプロジェクトに同期
./scripts/sync-app-icons.sh --product CAMERA --pull app/src/main/res/
```

### 対象アプリ一覧（android_native プラットフォーム）

| コード | アプリ名 | マスター PNG |
|--------|----------|:----------:|
| LAUNCHER_ANDROID | InsightLauncherAndroid | ✅ |
| CAMERA | InsightCamera | ✅ |
| VOICE_CLOCK | InsightVoiceClock | ✅ |
| INCLINE | InclineInsight | ✅ |
| CONSUL_TYPE | InsightConsulType | ✅ |
| HOROSCOPE | HarmonicHoroscope | ✅ |
| FOOD_MEDICINE | FoodMedicineInsight | ✅ |
| CONSUL_EVALUATE | InsightConsulEvaluate | ✅ |

### マスターアイコン更新フロー

1. `brand/icons/png/icon-*.png`（1024x1024）を更新
2. `python scripts/generate-app-icon.py --product CODE` を実行
3. `brand/icons/generated/{AppName}/` に全ファイルが生成される
4. `./scripts/sync-app-icons.sh --product CODE app/src/main/res/` でアプリに同期
5. コミット & プッシュ

---

## 参考

- **ブランドカラー定義**: `brand/colors.json`
- **デザインシステム**: `brand/design-system.json`
- **CLAUDE.md**: プロジェクト全体のガイドライン
