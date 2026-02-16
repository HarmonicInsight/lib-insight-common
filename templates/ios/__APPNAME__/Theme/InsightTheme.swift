import SwiftUI

// ============================================================
// Insight テーマ (SwiftUI Environment)
//
// Android の Theme.kt に相当。
// Light / Dark モードの切り替えを環境変数で管理。
//
// 使い方:
//   @Environment(\.insightTheme) var theme
//   Text("Hello").foregroundColor(theme.primary)
//
// ルートビューに .insightTheme() を適用:
//   ContentView().insightTheme()
// ============================================================

struct InsightTheme {
    let primary: Color
    let onPrimary: Color
    let primaryContainer: Color
    let background: Color
    let surface: Color
    let onSurface: Color
    let onSurfaceVariant: Color
    let outline: Color
    let error: Color
    let success: Color
    let warning: Color

    static let light = InsightTheme(
        primary: InsightColors.primary,
        onPrimary: InsightColors.textOnPrimary,
        primaryContainer: InsightColors.primaryLight,
        background: InsightColors.bgPrimary,
        surface: InsightColors.bgCard,
        onSurface: InsightColors.textPrimary,
        onSurfaceVariant: InsightColors.textSecondary,
        outline: InsightColors.border,
        error: InsightColors.error,
        success: InsightColors.success,
        warning: InsightColors.warning
    )

    static let dark = InsightTheme(
        primary: InsightColors.Dark.primary,
        onPrimary: InsightColors.accent900,
        primaryContainer: InsightColors.accent800,
        background: InsightColors.Dark.bgPrimary,
        surface: InsightColors.Dark.bgCard,
        onSurface: InsightColors.Dark.textPrimary,
        onSurfaceVariant: InsightColors.Dark.textSecondary,
        outline: InsightColors.Dark.border,
        error: InsightColors.error,
        success: InsightColors.success,
        warning: InsightColors.warning
    )
}

// MARK: - Environment Key

private struct InsightThemeKey: EnvironmentKey {
    static let defaultValue = InsightTheme.light
}

extension EnvironmentValues {
    var insightTheme: InsightTheme {
        get { self[InsightThemeKey.self] }
        set { self[InsightThemeKey.self] = newValue }
    }
}

// MARK: - View Modifier

struct InsightThemeModifier: ViewModifier {
    @Environment(\.colorScheme) var colorScheme

    func body(content: Content) -> some View {
        content
            .environment(\.insightTheme, colorScheme == .dark ? .dark : .light)
            .tint(colorScheme == .dark ? InsightColors.Dark.primary : InsightColors.primary)
    }
}

extension View {
    func insightTheme() -> some View {
        modifier(InsightThemeModifier())
    }
}
