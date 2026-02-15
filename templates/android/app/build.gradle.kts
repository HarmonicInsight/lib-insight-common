// ============================================================
// Insight Android 標準 app/build.gradle.kts
//
// 【このファイルについて】
// insight-common/templates/android/ からコピーして使用。
// __APPNAME__ → パッケージ名の末尾 (例: camera)
// __APP_PACKAGE__ → 完全なパッケージ名 (例: com.harmonic.insight.camera)
// ============================================================

import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    // Hilt を使用する場合
    alias(libs.plugins.hilt)
    // Firebase を使用する場合
    // alias(libs.plugins.firebase.crashlytics)
    // alias(libs.plugins.google.services)
}

android {
    namespace = "__APP_PACKAGE__"
    compileSdk = 35

    defaultConfig {
        applicationId = "__APP_PACKAGE__"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        resourceConfigurations += listOf("ja", "en")
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    // --- 署名設定 ---
    signingConfigs {
        // 開発用署名（チーム共有の dev.keystore を使用）
        // dev.keystore をリポジトリに含めることで、全員が同じ署名でビルドし
        // 上書きインストールが可能になる。
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

    buildTypes {
        debug {
            isMinifyEnabled = false
            isShrinkResources = false
            signingConfig = signingConfigs.getByName("debug")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            val releaseConfig = signingConfigs.findByName("release")
            signingConfig = if (releaseConfig?.storeFile != null) {
                releaseConfig
            } else {
                signingConfigs.getByName("debug")
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    // --- ABI Split（ネイティブライブラリ使用時） ---
    // ネイティブライブラリ（CameraX, ML Kit 等）を使う場合は有効化
    // splits {
    //     abi {
    //         isEnable = true
    //         reset()
    //         include("arm64-v8a", "armeabi-v7a")
    //         isUniversalApk = false  // 【必須】Universal APK 禁止
    //     }
    // }
}

dependencies {
    // --- Core ---
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)

    // --- Compose ---
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    debugImplementation(libs.androidx.ui.tooling)

    // --- Navigation ---
    implementation(libs.androidx.navigation.compose)

    // --- Hilt ---
    implementation(libs.hilt.android)
    ksp(libs.hilt.android.compiler)
    implementation(libs.hilt.navigation.compose)

    // --- Coroutines ---
    implementation(libs.kotlinx.coroutines.android)

    // --- Room (必要な場合のみ) ---
    // implementation(libs.androidx.room.runtime)
    // implementation(libs.androidx.room.ktx)
    // ksp(libs.androidx.room.compiler)

    // --- DataStore (必要な場合のみ) ---
    // implementation(libs.androidx.datastore.preferences)

    // --- Firebase (必要な場合のみ) ---
    // implementation(platform(libs.firebase.bom))
    // implementation(libs.firebase.crashlytics)
    // implementation(libs.firebase.analytics)

    // --- Testing ---
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)

    // ============================================================
    // App-Specific Dependencies
    // アプリ固有の依存はここに追加してください。
    // ============================================================
}
