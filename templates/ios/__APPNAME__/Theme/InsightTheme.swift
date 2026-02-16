import SwiftUI

// ============================================================
// Insight デザインシステムの共通修飾子・スタイル
//
// 【このファイルについて】
// IOS.md §6.4 に準拠した静的テーマ定数 + CardModifier。
// Android の Theme.kt に相当。
//
// 使い方:
//   VStack { ... }.insightCard()
//   .padding(InsightTheme.padding)
// ============================================================

enum InsightTheme {
    static func card() -> some ViewModifier { CardModifier() }

    static let cornerRadius: CGFloat = 12
    static let padding: CGFloat = 16
    static let paddingSmall: CGFloat = 8
    static let paddingLarge: CGFloat = 24
}

// MARK: - Card Modifier

private struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(InsightTheme.padding)
            .background(InsightColors.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: InsightTheme.cornerRadius))
            .overlay(
                RoundedRectangle(cornerRadius: InsightTheme.cornerRadius)
                    .stroke(InsightColors.border, lineWidth: 1)
            )
    }
}

extension View {
    func insightCard() -> some View {
        modifier(InsightTheme.card())
    }
}
