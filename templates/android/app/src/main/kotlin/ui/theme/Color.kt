package com.harmonic.insight.__APPNAME__.ui.theme

import androidx.compose.ui.graphics.Color

// ============================================================
// Insight Ivory & Gold カラーシステム
// brand/colors.json に基づく統一カラー定義
//
// 【このファイルについて】
// insight-common/templates/android/ からコピーして使用。
// __APPNAME__ を実際のパッケージ名に置換してください。
// アプリ固有のカラーは末尾の「App-Specific Colors」セクションに追加。
// ============================================================

// --- Light Theme (Ivory & Gold) ---
val InsightPrimaryLight = Color(0xFFB8942F)           // Gold — brand.primary
val InsightOnPrimaryLight = Color(0xFFFFFFFF)
val InsightPrimaryContainerLight = Color(0xFFF0E6C8)  // Gold Light — brand.primaryLight
val InsightOnPrimaryContainerLight = Color(0xFF6B5518) // Gold 700

val InsightSecondaryLight = Color(0xFF8C711E)         // Gold Hover — brand.primaryHover
val InsightOnSecondaryLight = Color(0xFFFFFFFF)
val InsightSecondaryContainerLight = Color(0xFFF9F0D9) // Accent 100
val InsightOnSecondaryContainerLight = Color(0xFF6B5518)

val InsightBackgroundLight = Color(0xFFFAF8F5)        // Ivory — background.primary
val InsightOnBackgroundLight = Color(0xFF1C1917)      // text.primary
val InsightSurfaceLight = Color(0xFFFFFFFF)           // background.card
val InsightOnSurfaceLight = Color(0xFF1C1917)
val InsightSurfaceVariantLight = Color(0xFFF3F0EB)    // background.secondary
val InsightOnSurfaceVariantLight = Color(0xFF57534E)  // text.secondary

val InsightErrorLight = Color(0xFFDC2626)             // semantic.error
val InsightOnErrorLight = Color(0xFFFFFFFF)
val InsightOutlineLight = Color(0xFFE7E2DA)           // border.default

// --- Dark Theme ---
val InsightPrimaryDark = Color(0xFFD4BC6A)            // Accent 400
val InsightOnPrimaryDark = Color(0xFF6B5518)
val InsightPrimaryContainerDark = Color(0xFF8C711E)   // Gold Hover
val InsightOnPrimaryContainerDark = Color(0xFFF0E6C8)

val InsightSecondaryDark = Color(0xFFF0E6C8)          // Accent 200
val InsightOnSecondaryDark = Color(0xFF6B5518)
val InsightSecondaryContainerDark = Color(0xFF4A3B10) // Accent 800
val InsightOnSecondaryContainerDark = Color(0xFFF9F0D9)

val InsightBackgroundDark = Color(0xFF1C1917)         // darkMode.background.primary
val InsightOnBackgroundDark = Color(0xFFFAF8F5)       // Ivory
val InsightSurfaceDark = Color(0xFF292524)            // darkMode.background.card
val InsightOnSurfaceDark = Color(0xFFFAF8F5)
val InsightSurfaceVariantDark = Color(0xFF3D3835)     // darkMode.background.hover
val InsightOnSurfaceVariantDark = Color(0xFFD6D3D1)   // darkMode.text.secondary

val InsightErrorDark = Color(0xFFFF6B6B)
val InsightOnErrorDark = Color(0xFF1C1917)
val InsightOutlineDark = Color(0xFF3D3835)            // darkMode.border.default

// --- Semantic Colors (Light/Dark 共通) ---
val InsightSuccess = Color(0xFF16A34A)
val InsightSuccessLight = Color(0xFFDCFCE7)
val InsightWarning = Color(0xFFCA8A04)
val InsightWarningLight = Color(0xFFFEF9C3)
val InsightInfo = Color(0xFF2563EB)
val InsightInfoLight = Color(0xFFDBEAFE)

// --- Plan Badge Colors ---
val InsightPlanFree = Color(0xFFA8A29E)
val InsightPlanTrial = Color(0xFF2563EB)
val InsightPlanStd = Color(0xFF16A34A)
val InsightPlanPro = Color(0xFFB8942F)
val InsightPlanEnt = Color(0xFF7C3AED)

// ============================================================
// App-Specific Colors
// アプリ固有のカラーはここに追加してください。
// 例:
// val ZoneGreen = Color(0xFF4CAF50)
// val ZoneYellow = Color(0xFFFFEB3B)
// val ZoneRed = Color(0xFFF44336)
// ============================================================
