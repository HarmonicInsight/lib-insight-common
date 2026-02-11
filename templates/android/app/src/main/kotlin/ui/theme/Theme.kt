package com.harmonic.insight.__APPNAME__.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// ============================================================
// Insight テーマ定義
//
// 【このファイルについて】
// insight-common/templates/android/ からコピーして使用。
// __APPNAME__ を実際のパッケージ名に置換してください。
// __AppName__ をアプリの表示名に置換してください。
// 例: Insight__AppName__Theme → InsightCameraTheme
// ============================================================

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
fun Insight__AppName__Theme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Insight ブランドカラーを優先するため dynamicColor は false
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    val colorScheme = when {
        darkTheme -> InsightDarkColorScheme
        else -> InsightLightColorScheme
    }

    // ステータスバーの色をテーマに合わせる
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            window.navigationBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = InsightTypography,
        content = content,
    )
}
