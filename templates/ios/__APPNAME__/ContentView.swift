import SwiftUI

// ============================================================
// メインコンテンツビュー
//
// 【このファイルについて】
// アプリのルートビュー。ナビゲーションとライセンス画面への遷移を含む。
// __app_display_name__ をアプリの表示名に置換してください。
// ============================================================

struct ContentView: View {
    @EnvironmentObject var licenseManager: LicenseManager
    @Environment(\.insightTheme) var theme
    @State private var showLicense = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                Text(NSLocalizedString("app_name", comment: ""))
                    .font(InsightTypography.headlineLarge)
                    .fontWeight(.bold)
                    .foregroundColor(theme.primary)

                if licenseManager.isValid, let plan = licenseManager.currentPlan {
                    Text(plan.displayName)
                        .font(InsightTypography.titleMedium)
                        .foregroundColor(plan.color)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 6)
                        .background(plan.color.opacity(0.1))
                        .cornerRadius(8)
                }

                Spacer()
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(theme.background.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showLicense = true }) {
                        Image(systemName: "key")
                    }
                }
            }
            .sheet(isPresented: $showLicense) {
                NavigationStack {
                    LicenseView(
                        licenseManager: licenseManager,
                        appDisplayName: NSLocalizedString("app_name", comment: "")
                    )
                    .toolbar {
                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button(NSLocalizedString("close", comment: "")) {
                                showLicense = false
                            }
                        }
                    }
                }
            }
        }
    }
}
