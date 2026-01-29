# Android 開発標準

> Android アプリ開発時の必須チェックリスト

## 開発開始時チェックリスト

### 1. プロジェクト構成

```
app/
├── src/main/
│   ├── res/
│   │   └── values/
│   │       ├── colors.xml        # 必須: Ivory & Gold カラー定義
│   │       └── themes.xml        # テーマ定義
│   └── java/com/yourapp/
│       └── license/
│           ├── PlanCode.kt       # プラン列挙型
│           ├── LicenseInfo.kt    # ライセンス情報
│           └── LicenseManager.kt # ライセンス管理
└── build.gradle
```

### 2. colors.xml テンプレート

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

    <!-- === Category === -->
    <color name="cat_rpa">#16A34A</color>
    <color name="cat_lowcode">#7C3AED</color>
    <color name="cat_doc">#2563EB</color>

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

    <!-- === Plan === -->
    <color name="plan_free">#A8A29E</color>
    <color name="plan_trial">#2563EB</color>
    <color name="plan_std">#16A34A</color>
    <color name="plan_pro">#B8942F</color>
    <color name="plan_ent">#7C3AED</color>
</resources>
```

### 3. themes.xml テンプレート

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.InsightApp" parent="Theme.Material3.Light.NoActionBar">
        <!-- Primary -->
        <item name="colorPrimary">@color/primary</item>
        <item name="colorPrimaryVariant">@color/primary_hover</item>
        <item name="colorOnPrimary">@color/text_on_primary</item>

        <!-- Secondary -->
        <item name="colorSecondary">@color/accent_600</item>
        <item name="colorOnSecondary">@color/text_on_primary</item>

        <!-- Background -->
        <item name="android:colorBackground">@color/bg_primary</item>
        <item name="colorSurface">@color/bg_card</item>
        <item name="colorOnSurface">@color/text_primary</item>

        <!-- Status Bar -->
        <item name="android:statusBarColor">@color/bg_secondary</item>
    </style>
</resources>
```

---

## 必須チェックリスト

### デザイン（トンマナ）

- [ ] `colors.xml` が Ivory & Gold テーマに準拠している
- [ ] **Primary (#B8942F)** が製品タイトル、アクセントに使用されている
- [ ] **Background (#FAF8F5)** がメイン背景に使用されている
- [ ] ハードコードされた色がない（@color/ 経由）
- [ ] 青色 (#2563EB) がプライマリとして使用されて**いない**
- [ ] カードは白背景 + cornerRadius: 12dp
- [ ] テキストは Stone 系の暖色（#1C1917, #57534E）

### ライセンス

- [ ] `LicenseManager` クラスが実装されている
- [ ] ライセンスキー形式: `{製品コード}-{プラン}-{YYMM}-XXXX-XXXX-XXXX`
- [ ] ライセンス画面が Insight Slides 形式に準拠
- [ ] ライセンス保存: SharedPreferences または DataStore

### 製品コード

- [ ] 製品コードが `config/products.ts` に登録されている
- [ ] `CLAUDE.md` の製品コード一覧に追加されている

---

## Kotlin 実装例

### PlanCode.kt

```kotlin
package com.yourapp.license

enum class PlanCode(val displayName: String) {
    FREE("FREE"),
    TRIAL("TRIAL"),
    STD("STD"),
    PRO("PRO"),
    ENT("ENT")
}
```

### LicenseManager.kt

```kotlin
package com.yourapp.license

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

        // 保存処理
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

## Jetpack Compose スタイル

```kotlin
object InsightColors {
    val BgPrimary = Color(0xFFFAF8F5)
    val BgCard = Color(0xFFFFFFFF)
    val Primary = Color(0xFFB8942F)
    val PrimaryHover = Color(0xFF8C711E)
    val TextPrimary = Color(0xFF1C1917)
    val TextSecondary = Color(0xFF57534E)
    val Border = Color(0xFFE7E2DA)
    val Success = Color(0xFF16A34A)
    val Error = Color(0xFFDC2626)
}

@Composable
fun LicenseScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(InsightColors.BgPrimary)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Insight Product",
            color = InsightColors.Primary,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )
        // ... rest of UI
    }
}
```

---

## 参考実装

- **Insight Mobile**: `app-insight-mobile-android` リポジトリ
