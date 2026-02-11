# ============================================================
# Insight Android 標準 ProGuard ルール
#
# 【このファイルについて】
# insight-common/templates/android/ からコピーして使用。
# アプリ固有のルールは末尾の App-Specific セクションに追加。
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

# ============================================================
# App-Specific Rules
# アプリ固有のルールはここに追加してください。
# 例:
# -keep class com.harmonic.insight.camera.model.** { *; }
# ============================================================
