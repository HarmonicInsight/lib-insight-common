import SwiftUI

// ============================================================
// Insight ライセンス画面 (Insight Slides 形式)
//
// 【このファイルについて】
// insight-common/templates/ios/ からコピーして使用。
// __app_display_name__ をアプリの表示名に置換してください。
//
// CLAUDE.md § 8「ライセンス画面（必須）」に準拠。
// ┌────────────────────────────────────┐
// │      Insight Product Name          │  ← Gold色、中央配置
// │         現在のプラン                │
// │            STD                     │
// │     有効期限: 2027年01月31日        │
// │  ┌──────────────────────────────┐  │
// │  │ 機能一覧                      │  │
// │  │ • 機能1          ○利用可能   │  │
// │  └──────────────────────────────┘  │
// │  ┌──────────────────────────────┐  │
// │  │ ライセンス認証                 │  │
// │  │ メールアドレス: [          ]  │  │
// │  │ ライセンスキー: [          ]  │  │
// │  │ [アクティベート] [クリア]     │  │
// │  └──────────────────────────────┘  │
// └────────────────────────────────────┘
//
// Android の LicenseScreen.kt と同等の UI。
// ============================================================

struct LicenseView: View {
    @Environment(LicenseManager.self) var licenseManager
    var features: [FeatureItem] = []

    @State private var emailInput = ""
    @State private var keyInput = ""
    @State private var message: String?
    @State private var isError = false

    var body: some View {
        ScrollView {
            VStack(spacing: InsightTheme.paddingLarge) {
                // --- アプリ名 (Gold) ---
                Text("__app_display_name__")
                    .font(InsightTypography.headlineMedium)
                    .fontWeight(.bold)
                    .foregroundStyle(InsightColors.primary)
                    .multilineTextAlignment(.center)
                    .padding(.top, 20)

                // --- 現在のプラン ---
                VStack(spacing: 8) {
                    Text(String(localized: "currentPlan"))
                        .font(InsightTypography.bodyMedium)
                        .foregroundStyle(InsightColors.textSecondary)

                    Text(licenseManager.currentPlan.displayName)
                        .font(.system(size: 36, weight: .bold))
                        .foregroundStyle(licenseManager.currentPlan.color)

                    if let expiry = licenseManager.expiryDate {
                        Text(String(localized: "expiryDate \(expiry.formatted(date: .long, time: .omitted))"))
                            .font(InsightTypography.bodyMedium)
                            .foregroundStyle(InsightColors.textSecondary)
                    }
                }

                // --- 機能一覧カード ---
                if !features.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(String(localized: "featureList"))
                            .font(InsightTypography.titleMedium)
                            .fontWeight(.bold)
                            .foregroundStyle(InsightColors.textPrimary)

                        ForEach(features, id: \.key) { feature in
                            let isAvailable = licenseManager.canUseFeature(
                                feature.key,
                                featureMatrix: feature.requiredPlans
                            )

                            HStack {
                                Text(feature.displayName)
                                    .font(InsightTypography.bodyMedium)
                                    .foregroundStyle(InsightColors.textPrimary)

                                Spacer()

                                HStack(spacing: 6) {
                                    Circle()
                                        .fill(isAvailable ? InsightColors.success : InsightColors.textMuted)
                                        .frame(width: 8, height: 8)

                                    Text(isAvailable
                                        ? String(localized: "featureAvailable")
                                        : String(localized: "featureUnavailable"))
                                    .font(InsightTypography.bodySmall)
                                    .foregroundStyle(isAvailable ? InsightColors.success : InsightColors.textSecondary)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                    .insightCard()
                }

                // --- ライセンス認証カード ---
                VStack(alignment: .leading, spacing: InsightTheme.padding) {
                    Text(String(localized: "licenseAuth"))
                        .font(InsightTypography.titleMedium)
                        .fontWeight(.bold)
                        .foregroundStyle(InsightColors.textPrimary)

                    TextField(String(localized: "emailPlaceholder"), text: $emailInput)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()

                    TextField(String(localized: "keyPlaceholder"), text: $keyInput)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()

                    if let message {
                        Text(message)
                            .font(InsightTypography.bodySmall)
                            .foregroundStyle(isError ? InsightColors.error : InsightColors.success)
                    }

                    HStack(spacing: 12) {
                        Button {
                            activateLicense()
                        } label: {
                            Text(String(localized: "activate"))
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(InsightColors.primary)

                        Button {
                            emailInput = ""
                            keyInput = ""
                            message = nil
                        } label: {
                            Text(String(localized: "clear"))
                        }
                        .buttonStyle(.bordered)

                        if licenseManager.isActivated {
                            Button(role: .destructive) {
                                licenseManager.deactivate()
                                message = String(localized: "deactivated")
                                isError = false
                            } label: {
                                Text(String(localized: "deactivateButton"))
                            }
                            .buttonStyle(.bordered)
                        }
                    }
                }
                .insightCard()

                Spacer()
            }
            .padding()
        }
        .background(InsightColors.bgPrimary)
        .navigationTitle(String(localized: "licenseTitle"))
        .onAppear {
            emailInput = licenseManager.email
        }
    }

    // MARK: - Actions

    private func activateLicense() {
        let result = licenseManager.activate(email: emailInput, key: keyInput)
        switch result {
        case .success(let msg):
            message = msg
            isError = false
        case .failure(let error):
            message = error.localizedDescription
            isError = true
        }
    }
}

// MARK: - Feature Item

struct FeatureItem {
    let key: String
    let displayName: String
    let requiredPlans: [String: Set<PlanCode>]
}
