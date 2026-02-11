# iOS 開発標準

> iOS アプリ開発時の必須チェックリスト

## 開発開始時チェックリスト

### 1. プロジェクト構成

```
YourApp/
├── Resources/
│   └── Colors.xcassets/      # カラーアセット
├── Theme/
│   └── InsightColors.swift   # カラー定義
├── License/
│   ├── PlanCode.swift        # プラン列挙型
│   ├── LicenseInfo.swift     # ライセンス情報
│   └── LicenseManager.swift  # ライセンス管理
└── Views/
    └── LicenseView.swift     # ライセンス画面
```

### 2. InsightColors.swift テンプレート

```swift
import SwiftUI

/// Insight Series カラー定義 - Ivory & Gold Theme
enum InsightColors {
    // MARK: - Background (Ivory)
    static let bgPrimary = Color(hex: "FAF8F5")
    static let bgSecondary = Color(hex: "F3F0EB")
    static let bgCard = Color.white
    static let bgHover = Color(hex: "EEEBE5")

    // MARK: - Brand Primary (Gold)
    static let primary = Color(hex: "B8942F")
    static let primaryHover = Color(hex: "8C711E")
    static let primaryLight = Color(hex: "F0E6C8")

    // MARK: - Accent Scale (Gold)
    static let accent50 = Color(hex: "FDF9EF")
    static let accent100 = Color(hex: "F9F0D9")
    static let accent200 = Color(hex: "F0E6C8")
    static let accent500 = Color(hex: "B8942F")
    static let accent600 = Color(hex: "8C711E")
    static let accent700 = Color(hex: "6B5518")

    // MARK: - Semantic
    static let success = Color(hex: "16A34A")
    static let successLight = Color(hex: "DCFCE7")
    static let warning = Color(hex: "CA8A04")
    static let warningLight = Color(hex: "FEF9C3")
    static let error = Color(hex: "DC2626")
    static let errorLight = Color(hex: "FEE2E2")
    static let info = Color(hex: "2563EB")
    static let infoLight = Color(hex: "DBEAFE")

    // MARK: - Category
    static let catRpa = Color(hex: "16A34A")
    static let catLowcode = Color(hex: "7C3AED")
    static let catDoc = Color(hex: "2563EB")

    // MARK: - Text
    static let textPrimary = Color(hex: "1C1917")
    static let textSecondary = Color(hex: "57534E")
    static let textTertiary = Color(hex: "A8A29E")
    static let textMuted = Color(hex: "D6D3D1")
    static let textAccent = Color(hex: "8C711E")

    // MARK: - Border
    static let border = Color(hex: "E7E2DA")
    static let borderLight = Color(hex: "F3F0EB")

    // MARK: - Plan
    static let planFree = Color(hex: "A8A29E")
    static let planTrial = Color(hex: "2563EB")
    static let planStd = Color(hex: "16A34A")
    static let planPro = Color(hex: "B8942F")
    static let planEnt = Color(hex: "7C3AED")
}

// MARK: - Color Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
```

---

## 必須チェックリスト

### デザイン（トンマナ）

- [ ] `InsightColors.swift` が Ivory & Gold テーマに準拠している
- [ ] **Primary (#B8942F)** が製品タイトル、アクセントに使用されている
- [ ] **Background (#FAF8F5)** がメイン背景に使用されている
- [ ] ハードコードされた色がない（InsightColors 経由）
- [ ] 青色 (#2563EB) がプライマリとして使用されて**いない**
- [ ] カードは白背景 + cornerRadius: 12
- [ ] テキストは Stone 系の暖色

### ライセンス

- [ ] `LicenseManager` クラスが実装されている
- [ ] ライセンスキー形式: `{製品コード}-{プラン}-{YYMM}-XXXX-XXXX-XXXX`
- [ ] ライセンス画面が Insight Slides 形式に準拠
- [ ] ライセンス保存: UserDefaults または Keychain

### 製品コード

- [ ] 製品コードが `config/products.ts` に登録されている
- [ ] `CLAUDE.md` の製品コード一覧に追加されている

---

## Swift 実装例

### PlanCode.swift

```swift
enum PlanCode: String, CaseIterable {
    case free = "FREE"
    case trial = "TRIAL"
    case std = "STD"
    case pro = "PRO"
    case ent = "ENT"

    var displayName: String { rawValue }

    var color: Color {
        switch self {
        case .free: return InsightColors.planFree
        case .trial: return InsightColors.planTrial
        case .std: return InsightColors.planStd
        case .pro: return InsightColors.planPro
        case .ent: return InsightColors.planEnt
        }
    }
}
```

### LicenseManager.swift

```swift
import Foundation

class LicenseManager: ObservableObject {
    static let shared = LicenseManager()

    private let productCode: String
    private let keyPattern = try! NSRegularExpression(
        pattern: "^([A-Z]{4})-(TRIAL|STD|PRO)-(\\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$"
    )

    @Published var currentPlan: PlanCode = .free
    @Published var expiryDate: Date?

    var isActivated: Bool { currentPlan != .free }

    init(productCode: String = "XXXX") {
        self.productCode = productCode
        loadLicense()
    }

    func activate(email: String, key: String) -> Result<String, Error> {
        let upperKey = key.uppercased()
        let range = NSRange(upperKey.startIndex..., in: upperKey)

        guard let match = keyPattern.firstMatch(in: upperKey, range: range) else {
            return .failure(LicenseError.invalidFormat)
        }

        guard let productRange = Range(match.range(at: 1), in: upperKey),
              String(upperKey[productRange]) == productCode else {
            return .failure(LicenseError.wrongProduct)
        }

        // 保存
        UserDefaults.standard.set(email, forKey: "license_email")
        UserDefaults.standard.set(upperKey, forKey: "license_key")

        if let planRange = Range(match.range(at: 2), in: upperKey),
           let plan = PlanCode(rawValue: String(upperKey[planRange])) {
            currentPlan = plan
        }

        return .success("ライセンスが有効化されました")
    }

    func deactivate() {
        UserDefaults.standard.removeObject(forKey: "license_email")
        UserDefaults.standard.removeObject(forKey: "license_key")
        currentPlan = .free
        expiryDate = nil
    }

    private func loadLicense() {
        guard let key = UserDefaults.standard.string(forKey: "license_key") else { return }
        let range = NSRange(key.startIndex..., in: key)
        guard let match = keyPattern.firstMatch(in: key, range: range),
              let planRange = Range(match.range(at: 2), in: key),
              let plan = PlanCode(rawValue: String(key[planRange])) else { return }
        currentPlan = plan
    }
}

enum LicenseError: LocalizedError {
    case invalidFormat
    case wrongProduct

    var errorDescription: String? {
        switch self {
        case .invalidFormat: return "無効なライセンスキー形式です"
        case .wrongProduct: return "この製品用のキーではありません"
        }
    }
}
```

### LicenseView.swift (SwiftUI)

```swift
import SwiftUI

struct LicenseView: View {
    @StateObject private var licenseManager = LicenseManager.shared
    @State private var email = ""
    @State private var licenseKey = ""

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Product Title
                Text("Insight Product")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(InsightColors.primary)

                // Current Plan
                VStack(spacing: 4) {
                    Text("現在のプラン")
                        .font(.subheadline)
                        .foregroundColor(InsightColors.textSecondary)

                    Text(licenseManager.currentPlan.displayName)
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(licenseManager.currentPlan.color)

                    if let expiry = licenseManager.expiryDate {
                        Text("有効期限: \(expiry.formatted())")
                            .font(.subheadline)
                            .foregroundColor(InsightColors.textSecondary)
                    }
                }

                // License Form
                VStack(alignment: .leading, spacing: 16) {
                    Text("ライセンス認証")
                        .font(.headline)
                        .foregroundColor(InsightColors.textPrimary)

                    TextField("メールアドレス", text: $email)
                        .textFieldStyle(.roundedBorder)

                    TextField("ライセンスキー", text: $licenseKey)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.characters)

                    HStack {
                        Button("アクティベート") {
                            _ = licenseManager.activate(email: email, key: licenseKey)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(InsightColors.primary)

                        Button("クリア") {
                            email = ""
                            licenseKey = ""
                        }
                        .buttonStyle(.bordered)
                    }
                }
                .padding()
                .background(InsightColors.bgCard)
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(InsightColors.border, lineWidth: 1)
                )
            }
            .padding()
        }
        .background(InsightColors.bgPrimary)
    }
}
```

---

## 参考実装

- **Insight Mobile iOS**: `app-insight-mobile-ios` リポジトリ
