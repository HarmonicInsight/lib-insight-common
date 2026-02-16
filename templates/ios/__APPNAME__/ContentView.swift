import SwiftUI

// ============================================================
// メインコンテンツビュー
//
// 【このファイルについて】
// アプリのルートビュー。ナビゲーションとライセンス画面への遷移を含む。
// __app_display_name__ をアプリの表示名に置換してください。
// ============================================================

struct ContentView: View {
    @Environment(LicenseManager.self) var licenseManager

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: InsightTheme.paddingLarge) {
                    // Hero
                    VStack(spacing: 8) {
                        Text("__app_display_name__")
                            .font(InsightTypography.headlineLarge)
                            .fontWeight(.bold)
                            .foregroundStyle(InsightColors.primary)

                        Text(String(localized: "subtitle"))
                            .font(InsightTypography.bodyMedium)
                            .foregroundStyle(InsightColors.textSecondary)
                    }
                    .padding(.top, 40)

                    // Plan Badge
                    HStack {
                        Text(String(localized: "currentPlan"))
                            .font(InsightTypography.labelMedium)
                            .foregroundStyle(InsightColors.textSecondary)
                        Text(licenseManager.currentPlan.displayName)
                            .font(InsightTypography.labelMedium)
                            .fontWeight(.bold)
                            .foregroundStyle(licenseManager.currentPlan.color)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(
                                Capsule()
                                    .fill(licenseManager.currentPlan.color.opacity(0.12))
                            )
                    }

                    // Main Content
                    VStack(spacing: InsightTheme.padding) {
                        Text(String(localized: "welcomeMessage"))
                            .font(InsightTypography.titleLarge)
                            .foregroundStyle(InsightColors.textPrimary)
                    }
                    .insightCard()

                    Spacer()
                }
                .padding()
            }
            .background(InsightColors.bgPrimary)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink {
                        LicenseView()
                    } label: {
                        Image(systemName: "key")
                            .foregroundStyle(InsightColors.primary)
                    }
                }
            }
        }
    }
}
