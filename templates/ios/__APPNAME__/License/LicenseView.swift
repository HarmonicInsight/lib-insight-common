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
    @ObservedObject var licenseManager: LicenseManager
    var appDisplayName: String = "__app_display_name__"
    var features: [FeatureItem] = []

    @State private var emailInput = ""
    @State private var keyInput = ""
    @State private var alertMessage: String?
    @State private var showAlert = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // --- アプリ名 (Gold) ---
                Text(appDisplayName)
                    .font(InsightTypography.headlineMedium)
                    .fontWeight(.bold)
                    .foregroundColor(InsightColors.primary)
                    .multilineTextAlignment(.center)

                // --- 現在のプラン ---
                VStack(spacing: 8) {
                    Text(NSLocalizedString("license_current_plan", comment: ""))
                        .font(InsightTypography.bodyMedium)
                        .foregroundColor(InsightColors.textSecondary)

                    Text(licenseManager.currentPlan?.displayName ?? "---")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(licenseManager.currentPlan?.color ?? InsightColors.textSecondary)

                    Text("\(NSLocalizedString("license_expiry", comment: "")): \(licenseManager.formattedExpiry())")
                        .font(InsightTypography.bodyMedium)
                        .foregroundColor(InsightColors.textSecondary)
                }

                // --- 機能一覧カード ---
                if !features.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(NSLocalizedString("license_features", comment: ""))
                            .font(InsightTypography.titleMedium)
                            .fontWeight(.bold)
                            .foregroundColor(InsightColors.textPrimary)

                        ForEach(features, id: \.key) { feature in
                            let isAvailable = licenseManager.canUseFeature(
                                feature.key,
                                featureMatrix: feature.requiredPlans
                            )

                            HStack {
                                Text(feature.displayName)
                                    .font(InsightTypography.bodyMedium)
                                    .foregroundColor(InsightColors.textPrimary)

                                Spacer()

                                HStack(spacing: 6) {
                                    Circle()
                                        .fill(isAvailable ? InsightColors.success : InsightColors.textMuted)
                                        .frame(width: 8, height: 8)

                                    Text(NSLocalizedString(
                                        isAvailable ? "license_feature_available" : "license_feature_unavailable",
                                        comment: ""
                                    ))
                                    .font(InsightTypography.bodySmall)
                                    .foregroundColor(isAvailable ? InsightColors.success : InsightColors.textSecondary)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                    .padding(16)
                    .background(InsightColors.bgCard)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(InsightColors.border, lineWidth: 1)
                    )
                }

                // --- ライセンス認証カード ---
                VStack(alignment: .leading, spacing: 16) {
                    Text(NSLocalizedString("license_title", comment: ""))
                        .font(InsightTypography.titleMedium)
                        .fontWeight(.bold)
                        .foregroundColor(InsightColors.textPrimary)

                    TextField(
                        NSLocalizedString("license_email_hint", comment: ""),
                        text: $emailInput
                    )
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)

                    TextField(
                        NSLocalizedString("license_key_hint", comment: ""),
                        text: $keyInput
                    )
                    .textFieldStyle(.roundedBorder)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()

                    HStack(spacing: 12) {
                        Button(action: activateLicense) {
                            Text(NSLocalizedString("license_activate", comment: ""))
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(InsightColors.primary)

                        Button(action: clearForm) {
                            Text(NSLocalizedString("license_clear", comment: ""))
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }
                }
                .padding(16)
                .background(InsightColors.bgCard)
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(InsightColors.border, lineWidth: 1)
                )
            }
            .padding(24)
        }
        .background(InsightColors.bgPrimary.ignoresSafeArea())
        .alert(
            alertMessage ?? "",
            isPresented: $showAlert
        ) {
            Button(NSLocalizedString("ok", comment: "")) {}
        }
        .onAppear {
            emailInput = licenseManager.email ?? ""
        }
    }

    // MARK: - Actions

    private func activateLicense() {
        let result = licenseManager.activate(email: emailInput, key: keyInput)
        switch result {
        case .success:
            alertMessage = NSLocalizedString("license_activated", comment: "")
        case .failure(let error):
            alertMessage = error.localizedDescription
        }
        showAlert = true
    }

    private func clearForm() {
        licenseManager.deactivate()
        emailInput = ""
        keyInput = ""
    }
}

// MARK: - Feature Item

struct FeatureItem {
    let key: String
    let displayName: String
    let requiredPlans: [String: Set<PlanCode>]
}
