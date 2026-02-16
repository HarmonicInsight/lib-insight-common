import Foundation
import SwiftUI

// ============================================================
// Insight ライセンスマネージャー
//
// 【このファイルについて】
// insight-common/templates/ios/ からコピーして使用。
// __PRODUCT_CODE__ を製品コード (例: "IOSH") に置換してください。
//
// ライセンスキー形式:
//   {製品コード}-{プラン}-{YYMM}-{HASH}-{SIG1}-{SIG2}
//   例: IOSH-STD-2601-XXXX-XXXX-XXXX
//
// Android の LicenseManager.kt と完全な機能パリティ:
//   - activate / deactivate
//   - canUseFeature
//   - formattedExpiry
//   - isActivated / isExpired / isValid
//
// config/license-server.ts と連携してオンライン認証を追加可能。
// ============================================================

class LicenseManager: ObservableObject {
    static let productCode = "__PRODUCT_CODE__"

    private static let keyPattern = try! NSRegularExpression(
        pattern: "^([A-Z]{4})-(TRIAL|STD|PRO|ENT)-(\\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$"
    )

    private enum StoreKey {
        static let email = "insight_license_email"
        static let licenseKey = "insight_license_key"
        static let plan = "insight_license_plan"
        static let expiry = "insight_license_expiry"
    }

    @Published var currentPlan: PlanCode?
    @Published var email: String?
    @Published var expiryDate: Date?

    var isActivated: Bool { currentPlan != nil }

    var isExpired: Bool {
        guard let expiry = expiryDate else { return false }
        return expiry < Date()
    }

    var isValid: Bool { isActivated && !isExpired }

    init(productCode: String = LicenseManager.productCode) {
        loadLicense()
    }

    // MARK: - Activate

    func activate(email: String, key: String) -> Result<String, LicenseError> {
        let normalizedKey = key.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        let range = NSRange(normalizedKey.startIndex..., in: normalizedKey)

        guard let match = Self.keyPattern.firstMatch(in: normalizedKey, range: range) else {
            return .failure(.invalidFormat)
        }

        guard let productRange = Range(match.range(at: 1), in: normalizedKey) else {
            return .failure(.invalidFormat)
        }
        let productCode = String(normalizedKey[productRange])

        guard productCode == Self.productCode else {
            return .failure(.wrongProduct(productCode))
        }

        guard let planRange = Range(match.range(at: 2), in: normalizedKey),
              let plan = PlanCode(rawValue: String(normalizedKey[planRange])) else {
            return .failure(.invalidFormat)
        }

        guard let yymmRange = Range(match.range(at: 3), in: normalizedKey) else {
            return .failure(.invalidFormat)
        }
        let yymm = String(normalizedKey[yymmRange])

        // YYMM から有効期限を計算 (発行月から duration 日)
        let year = 2000 + (Int(yymm.prefix(2)) ?? 0)
        let month = Int(yymm.suffix(2)) ?? 1
        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = 1
        guard let issueDate = Calendar.current.date(from: components) else {
            return .failure(.invalidFormat)
        }
        let expiry = Calendar.current.date(
            byAdding: .day,
            value: plan.defaultDurationDays,
            to: issueDate
        )!

        // 保存
        let defaults = UserDefaults.standard
        defaults.set(email, forKey: StoreKey.email)
        defaults.set(normalizedKey, forKey: StoreKey.licenseKey)
        defaults.set(plan.rawValue, forKey: StoreKey.plan)
        defaults.set(ISO8601DateFormatter().string(from: expiry), forKey: StoreKey.expiry)

        self.email = email
        self.currentPlan = plan
        self.expiryDate = expiry

        return .success(plan.displayNameJa)
    }

    // MARK: - Deactivate

    func deactivate() {
        let defaults = UserDefaults.standard
        defaults.removeObject(forKey: StoreKey.email)
        defaults.removeObject(forKey: StoreKey.licenseKey)
        defaults.removeObject(forKey: StoreKey.plan)
        defaults.removeObject(forKey: StoreKey.expiry)

        currentPlan = nil
        email = nil
        expiryDate = nil
    }

    // MARK: - Feature Check

    func canUseFeature(
        _ feature: String,
        featureMatrix: [String: Set<PlanCode>]
    ) -> Bool {
        guard let plan = currentPlan, isValid else { return false }
        return featureMatrix[feature]?.contains(plan) == true
    }

    // MARK: - Formatted Expiry

    func formattedExpiry() -> String {
        guard let date = expiryDate else { return "---" }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy年MM月dd日"
        return formatter.string(from: date)
    }

    // MARK: - Load

    private func loadLicense() {
        let defaults = UserDefaults.standard
        guard let planStr = defaults.string(forKey: StoreKey.plan),
              let expiryStr = defaults.string(forKey: StoreKey.expiry) else { return }

        currentPlan = PlanCode(rawValue: planStr)
        email = defaults.string(forKey: StoreKey.email)
        expiryDate = ISO8601DateFormatter().date(from: expiryStr)
    }
}

// MARK: - License Error

enum LicenseError: LocalizedError {
    case invalidFormat
    case wrongProduct(String)

    var errorDescription: String? {
        switch self {
        case .invalidFormat:
            return NSLocalizedString("license_invalid_key", comment: "")
        case .wrongProduct(let code):
            return String(
                format: NSLocalizedString("license_wrong_product", comment: ""),
                code
            )
        }
    }
}
