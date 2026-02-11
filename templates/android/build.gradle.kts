// ============================================================
// Insight Android 標準 ルート build.gradle.kts
//
// 【このファイルについて】
// insight-common/templates/android/ からコピーして使用。
// 使用するプラグインのみ alias を記載。
// Firebase を使わない場合は該当行を削除。
// ============================================================

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
    // Hilt を使用する場合（複数画面 or ViewModel がある場合は必須）
    alias(libs.plugins.hilt) apply false
    // Firebase を使用する場合
    // alias(libs.plugins.firebase.crashlytics) apply false
    // alias(libs.plugins.google.services) apply false
}
