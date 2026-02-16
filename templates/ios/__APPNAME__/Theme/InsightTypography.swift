import SwiftUI

// ============================================================
// Insight タイポグラフィスケール
//
// Android の Type.kt / brand/design-system.json と同じスケール。
// Material Design 3 の名前規則に準拠。
// ============================================================

enum InsightTypography {
    // MARK: - Display
    static let displayLarge = Font.system(size: 57, weight: .light)
    static let displayMedium = Font.system(size: 45, weight: .light)
    static let displaySmall = Font.system(size: 36, weight: .regular)

    // MARK: - Headline
    static let headlineLarge = Font.system(size: 32, weight: .regular)
    static let headlineMedium = Font.system(size: 28, weight: .regular)
    static let headlineSmall = Font.system(size: 24, weight: .regular)

    // MARK: - Title
    static let titleLarge = Font.system(size: 22, weight: .medium)
    static let titleMedium = Font.system(size: 16, weight: .medium)
    static let titleSmall = Font.system(size: 14, weight: .medium)

    // MARK: - Body
    static let bodyLarge = Font.system(size: 16, weight: .regular)
    static let bodyMedium = Font.system(size: 14, weight: .regular)
    static let bodySmall = Font.system(size: 12, weight: .regular)

    // MARK: - Label
    static let labelLarge = Font.system(size: 14, weight: .medium)
    static let labelMedium = Font.system(size: 12, weight: .medium)
    static let labelSmall = Font.system(size: 11, weight: .medium)
}
