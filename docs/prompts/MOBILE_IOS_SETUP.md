# insight-common iOS (Swift) モジュール追加

このプロンプトを使用して、insight-common リポジトリに iOS (Swift) 用モジュールを追加してください。

## 概要

insight-common リポジトリに以下の iOS 用モジュールを追加します：
- `license/swift/` - ライセンス管理
- `utils/swift/` - 共通ユーティリティ
- `errors/swift/` - 共通エラー定義

## 実行手順

以下の構成でファイルを作成してください：

### 1. ディレクトリ構造

```
insight-common/
├── license/
│   └── swift/
│       └── InsightLicense.swift
├── utils/
│   └── swift/
│       └── InsightUtils.swift
├── errors/
│   └── swift/
│       └── InsightErrors.swift
└── i18n/
    └── swift/
        └── InsightI18n.swift
```

### 2. license/swift/InsightLicense.swift

```swift
import Foundation
import CryptoKit

// MARK: - License Tier

public enum LicenseTier: String, CaseIterable {
    case free = "FREE"
    case trial = "TRIAL"
    case business = "BIZ"
    case enterprise = "ENT"

    public var displayName: String {
        switch self {
        case .free: return "Free"
        case .trial: return "Trial"
        case .business: return "Business"
        case .enterprise: return "Enterprise"
        }
    }
}

// MARK: - Product Code

public enum ProductCode: String, CaseIterable {
    case sales = "SALES"
    case slide = "SLIDE"
    case py = "PY"
    case interview = "IVIN"
    case all = "ALL"

    public var displayName: String {
        switch self {
        case .sales: return "SalesInsight"
        case .slide: return "InsightSlide"
        case .py: return "InsightPy"
        case .interview: return "InterviewInsight"
        case .all: return "All Products"
        }
    }
}

// MARK: - Feature Limits

public struct FeatureLimits {
    public let maxFiles: Int
    public let maxRecords: Int
    public let batchProcessing: Bool
    public let export: Bool
    public let cloudSync: Bool
    public let priority: Bool

    public static func forTier(_ tier: LicenseTier) -> FeatureLimits {
        switch tier {
        case .trial:
            return FeatureLimits(
                maxFiles: 10,
                maxRecords: 500,
                batchProcessing: true,
                export: true,
                cloudSync: false,
                priority: false
            )
        case .business:
            return FeatureLimits(
                maxFiles: .max,
                maxRecords: 50000,
                batchProcessing: true,
                export: true,
                cloudSync: true,
                priority: true
            )
        case .enterprise:
            return FeatureLimits(
                maxFiles: .max,
                maxRecords: .max,
                batchProcessing: true,
                export: true,
                cloudSync: true,
                priority: true
            )
        }
    }
}

// MARK: - License Validation Result

public struct LicenseValidationResult {
    public let isValid: Bool
    public let product: ProductCode?
    public let tier: LicenseTier?
    public let expiresAt: Date?
    public let errorMessage: String?

    public static func valid(
        product: ProductCode,
        tier: LicenseTier,
        expiresAt: Date?
    ) -> LicenseValidationResult {
        LicenseValidationResult(
            isValid: true,
            product: product,
            tier: tier,
            expiresAt: expiresAt,
            errorMessage: nil
        )
    }

    public static func invalid(_ message: String) -> LicenseValidationResult {
        LicenseValidationResult(
            isValid: false,
            product: nil,
            tier: nil,
            expiresAt: nil,
            errorMessage: message
        )
    }
}

// MARK: - License Validator

/// ライセンスバリデーター
///
/// ライセンスキー形式: INS-[PRODUCT]-[TIER]-[XXXX]-[XXXX]-[CC]
public class LicenseValidator {

    private static let licensePattern = try! NSRegularExpression(
        pattern: "^INS-(SALES|SLIDE|PY|IVIN|ALL)-(FREE|TRIAL|BIZ|ENT)-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{2})$"
    )

    public init() {}

    /// ライセンスキーを検証
    public func validate(
        _ licenseKey: String,
        currentProduct: ProductCode? = nil
    ) -> LicenseValidationResult {
        let trimmedKey = licenseKey.trimmingCharacters(in: .whitespaces).uppercased()

        let range = NSRange(location: 0, length: trimmedKey.utf16.count)
        guard let match = Self.licensePattern.firstMatch(in: trimmedKey, range: range) else {
            return .invalid("無効なライセンスキー形式です")
        }

        let productCode = extractGroup(from: trimmedKey, match: match, at: 1)
        let tierCode = extractGroup(from: trimmedKey, match: match, at: 2)
        let segment1 = extractGroup(from: trimmedKey, match: match, at: 3)
        let segment2 = extractGroup(from: trimmedKey, match: match, at: 4)
        let checksum = extractGroup(from: trimmedKey, match: match, at: 5)

        // チェックサム検証
        let expectedChecksum = calculateChecksum("\(productCode)-\(tierCode)-\(segment1)-\(segment2)")
        guard checksum == expectedChecksum else {
            return .invalid("ライセンスキーのチェックサムが無効です")
        }

        guard let product = ProductCode(rawValue: productCode),
              let tier = LicenseTier(rawValue: tierCode) else {
            return .invalid("無効な製品コードまたはティアです")
        }

        // 製品チェック
        if let currentProduct = currentProduct,
           product != .all && product != currentProduct {
            return .invalid("このライセンスキーは\(currentProduct.displayName)では使用できません")
        }

        // 有効期限をセグメントからデコード
        let expiresAt = decodeExpiryDate(segment1: segment1, segment2: segment2)

        // 有効期限チェック（ENT以外）
        if tier != .enterprise, let expiresAt = expiresAt {
            if Date() > expiresAt {
                return LicenseValidationResult(
                    isValid: false,
                    product: product,
                    tier: tier,
                    expiresAt: expiresAt,
                    errorMessage: "ライセンスの有効期限が切れています"
                )
            }
        }

        return .valid(product: product, tier: tier, expiresAt: expiresAt)
    }

    private func extractGroup(from string: String, match: NSTextCheckingResult, at index: Int) -> String {
        let range = Range(match.range(at: index), in: string)!
        return String(string[range])
    }

    private func calculateChecksum(_ data: String) -> String {
        let inputData = Data(data.utf8)
        let hashed = SHA256.hash(data: inputData)
        return hashed.prefix(2).map { String(format: "%02X", $0) }.joined().prefix(2).uppercased()
    }

    private func decodeExpiryDate(segment1: String, segment2: String) -> Date? {
        let dateStr = String((segment1 + segment2).prefix(6))
        guard dateStr.count == 6 else { return nil }

        let year = 2000 + (Int(String(dateStr.prefix(2))) ?? 0)
        let month = Int(String(dateStr.dropFirst(2).prefix(2))) ?? 1
        let day = Int(String(dateStr.suffix(2))) ?? 1

        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = day

        return Calendar.current.date(from: components)
    }
}

// MARK: - License Generator (開発・テスト用)

public struct LicenseGenerator {

    public static func generate(
        product: ProductCode,
        tier: LicenseTier,
        expiresAt: Date? = nil
    ) -> String {
        let calendar = Calendar.current
        let expiry: Date

        if let expiresAt = expiresAt {
            expiry = expiresAt
        } else {
            switch tier {
            case .free:
                expiry = calendar.date(byAdding: .year, value: 100, to: Date())!
            case .trial:
                expiry = calendar.date(byAdding: .day, value: 30, to: Date())!
            case .business:
                expiry = calendar.date(byAdding: .year, value: 1, to: Date())!
            case .enterprise:
                expiry = calendar.date(byAdding: .year, value: 100, to: Date())!
            }
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyMMdd"
        let dateStr = formatter.string(from: expiry)

        let random1 = String(format: "%02d", Int.random(in: 10...99))
        let random2 = String(format: "%02d", Int.random(in: 10...99))

        let segment1 = String(dateStr.prefix(4))
        let segment2 = String(dateStr.suffix(2)) + random1

        let checksumData = "\(product.rawValue)-\(tier.rawValue)-\(segment1)-\(segment2)"
        let inputData = Data(checksumData.utf8)
        let hashed = SHA256.hash(data: inputData)
        let checksum = String(hashed.prefix(2).map { String(format: "%02X", $0) }.joined().prefix(2))

        return "INS-\(product.rawValue)-\(tier.rawValue)-\(segment1)-\(segment2)-\(checksum)"
    }
}
```

### 3. utils/swift/InsightUtils.swift

```swift
import Foundation

// MARK: - Date Utilities

public struct DateUtils {

    public static func formatDate(
        _ date: Date,
        style: String = "medium",
        locale: Locale = Locale(identifier: "ja_JP")
    ) -> String {
        let formatter = DateFormatter()
        formatter.locale = locale

        switch style {
        case "short":
            formatter.dateFormat = locale.identifier.hasPrefix("ja") ? "yy/MM/dd" : "MM/dd/yy"
        case "long":
            formatter.dateFormat = locale.identifier.hasPrefix("ja") ? "yyyy年M月d日" : "MMMM d, yyyy"
        default:
            formatter.dateFormat = locale.identifier.hasPrefix("ja") ? "yyyy/MM/dd" : "MMM d, yyyy"
        }

        return formatter.string(from: date)
    }

    public static func formatDateTime(
        _ date: Date,
        style: String = "medium",
        locale: Locale = Locale(identifier: "ja_JP")
    ) -> String {
        let dateStr = formatDate(date, style: style, locale: locale)
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return "\(dateStr) \(formatter.string(from: date))"
    }

    public static func formatRelativeDate(
        _ date: Date,
        locale: Locale = Locale(identifier: "ja_JP")
    ) -> String {
        let calendar = Calendar.current
        let now = Date()
        let components = calendar.dateComponents([.day], from: date, to: now)
        let days = components.day ?? 0
        let isJapanese = locale.identifier.hasPrefix("ja")

        switch days {
        case 0:
            return isJapanese ? "今日" : "Today"
        case 1:
            return isJapanese ? "昨日" : "Yesterday"
        case -1:
            return isJapanese ? "明日" : "Tomorrow"
        case 2...6:
            return isJapanese ? "\(days)日前" : "\(days) days ago"
        case -6...(-2):
            return isJapanese ? "\(-days)日後" : "in \(-days) days"
        case 7...29:
            return isJapanese ? "\(days / 7)週間前" : "\(days / 7) weeks ago"
        case 30...364:
            return isJapanese ? "\(days / 30)ヶ月前" : "\(days / 30) months ago"
        case 365...:
            return isJapanese ? "\(days / 365)年前" : "\(days / 365) years ago"
        default:
            return formatDate(date, style: "medium", locale: locale)
        }
    }

    public static func daysUntil(_ targetDate: Date) -> Int {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.day], from: Date(), to: targetDate)
        return components.day ?? 0
    }
}

// MARK: - Number Utilities

public struct NumberUtils {

    public static func formatNumber(
        _ value: Double,
        locale: Locale = Locale(identifier: "ja_JP")
    ) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.locale = locale
        return formatter.string(from: NSNumber(value: value)) ?? String(value)
    }

    public static func formatCurrency(
        _ value: Double,
        currencyCode: String = "JPY",
        locale: Locale = Locale(identifier: "ja_JP")
    ) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currencyCode
        formatter.locale = locale
        return formatter.string(from: NSNumber(value: value)) ?? String(value)
    }

    public static func formatPercent(
        _ value: Double,
        decimals: Int = 1
    ) -> String {
        return String(format: "%.\(decimals)f%%", value * 100)
    }

    public static func formatFileSize(_ bytes: Int64) -> String {
        let units = ["B", "KB", "MB", "GB", "TB"]
        var size = Double(bytes)
        var unitIndex = 0

        while size >= 1024 && unitIndex < units.count - 1 {
            size /= 1024
            unitIndex += 1
        }

        if unitIndex == 0 {
            return "\(bytes) \(units[0])"
        } else {
            return String(format: "%.1f %@", size, units[unitIndex])
        }
    }
}

// MARK: - String Utilities

public extension String {

    func truncated(maxLength: Int, suffix: String = "...") -> String {
        if self.count <= maxLength {
            return self
        }
        return String(self.prefix(maxLength - suffix.count)) + suffix
    }

    var snakeCased: String {
        let pattern = "([a-z])([A-Z])"
        let regex = try! NSRegularExpression(pattern: pattern)
        let range = NSRange(location: 0, length: self.utf16.count)
        return regex.stringByReplacingMatches(
            in: self,
            range: range,
            withTemplate: "$1_$2"
        ).lowercased()
    }

    var camelCased: String {
        let words = self.components(separatedBy: CharacterSet(charactersIn: "_- "))
        return words.enumerated().map { index, word in
            if index == 0 {
                return word.lowercased()
            }
            return word.capitalized
        }.joined()
    }

    var pascalCased: String {
        let words = self.components(separatedBy: CharacterSet(charactersIn: "_- "))
        return words.map { $0.capitalized }.joined()
    }
}

// MARK: - Validation Utilities

public struct ValidationUtils {

    private static let emailPattern = try! NSRegularExpression(
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    )

    private static let urlPattern = try! NSRegularExpression(
        pattern: "^https?://[\\w\\-]+(\\.[\\w\\-]+)+(/[\\w\\-./?%&=]*)?$"
    )

    private static let phoneJPPattern = try! NSRegularExpression(
        pattern: "^0[0-9]{9,10}$|^\\+81[0-9]{9,10}$"
    )

    public static func isValidEmail(_ email: String) -> Bool {
        let range = NSRange(location: 0, length: email.utf16.count)
        return emailPattern.firstMatch(in: email, range: range) != nil
    }

    public static func isValidUrl(_ url: String) -> Bool {
        let range = NSRange(location: 0, length: url.utf16.count)
        return urlPattern.firstMatch(in: url, range: range) != nil
    }

    public static func isValidPhoneJP(_ phone: String) -> Bool {
        let normalized = phone.replacingOccurrences(
            of: "[\\s\\-()]",
            with: "",
            options: .regularExpression
        )
        let range = NSRange(location: 0, length: normalized.utf16.count)
        return phoneJPPattern.firstMatch(in: normalized, range: range) != nil
    }
}

// MARK: - Collection Utilities

public extension Array {

    func unique<T: Hashable>(by keyPath: KeyPath<Element, T>) -> [Element] {
        var seen = Set<T>()
        return filter { element in
            let key = element[keyPath: keyPath]
            return seen.insert(key).inserted
        }
    }

    func grouped<Key: Hashable>(by keyPath: KeyPath<Element, Key>) -> [Key: [Element]] {
        Dictionary(grouping: self) { $0[keyPath: keyPath] }
    }
}

// MARK: - Misc Utilities

public struct MiscUtils {

    public static func generateId(length: Int = 12) -> String {
        let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        return String((0..<length).map { _ in chars.randomElement()! })
    }

    public static func isEmpty(_ value: Any?) -> Bool {
        guard let value = value else { return true }

        if let string = value as? String {
            return string.trimmingCharacters(in: .whitespaces).isEmpty
        }
        if let array = value as? [Any] {
            return array.isEmpty
        }
        if let dict = value as? [String: Any] {
            return dict.isEmpty
        }

        return false
    }

    public static func sleep(_ seconds: TimeInterval) async {
        try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
    }

    public static func deepCopy<T: Codable>(_ value: T) -> T? {
        guard let data = try? JSONEncoder().encode(value),
              let copy = try? JSONDecoder().decode(T.self, from: data) else {
            return nil
        }
        return copy
    }
}

// MARK: - Debounce & Throttle

public class Debouncer {
    private var workItem: DispatchWorkItem?
    private let queue: DispatchQueue
    private let delay: TimeInterval

    public init(delay: TimeInterval, queue: DispatchQueue = .main) {
        self.delay = delay
        self.queue = queue
    }

    public func debounce(_ action: @escaping () -> Void) {
        workItem?.cancel()
        workItem = DispatchWorkItem(block: action)
        queue.asyncAfter(deadline: .now() + delay, execute: workItem!)
    }
}

public class Throttler {
    private var lastExecution: Date?
    private let interval: TimeInterval
    private let queue: DispatchQueue

    public init(interval: TimeInterval, queue: DispatchQueue = .main) {
        self.interval = interval
        self.queue = queue
    }

    public func throttle(_ action: @escaping () -> Void) {
        let now = Date()

        if let lastExecution = lastExecution,
           now.timeIntervalSince(lastExecution) < interval {
            return
        }

        lastExecution = now
        queue.async(execute: action)
    }
}
```

### 4. errors/swift/InsightErrors.swift

```swift
import Foundation

// MARK: - Error Code

public enum ErrorCode: String {
    case unknown = "UNKNOWN"
    case validation = "VALIDATION"
    case licenseRequired = "LICENSE_REQUIRED"
    case licenseExpired = "LICENSE_EXPIRED"
    case licenseInvalid = "LICENSE_INVALID"
    case featureLocked = "FEATURE_LOCKED"
    case networkError = "NETWORK_ERROR"
    case networkTimeout = "NETWORK_TIMEOUT"
    case fileNotFound = "FILE_NOT_FOUND"
    case fileReadError = "FILE_READ_ERROR"
    case fileWriteError = "FILE_WRITE_ERROR"
    case permissionDenied = "PERMISSION_DENIED"
    case quotaExceeded = "QUOTA_EXCEEDED"
    case rateLimited = "RATE_LIMITED"
    case serverError = "SERVER_ERROR"
    case maintenance = "MAINTENANCE"

    public var isRetryable: Bool {
        switch self {
        case .networkError, .networkTimeout, .serverError, .rateLimited:
            return true
        default:
            return false
        }
    }

    public var i18nKey: String {
        return "errors.\(rawValue.lowercased())"
    }
}

// MARK: - Insight Error

public class InsightError: LocalizedError {
    public let code: ErrorCode
    public let message: String
    public let context: [String: Any]?
    public let underlyingError: Error?

    public init(
        code: ErrorCode,
        message: String,
        context: [String: Any]? = nil,
        underlyingError: Error? = nil
    ) {
        self.code = code
        self.message = message
        self.context = context
        self.underlyingError = underlyingError
    }

    public var errorDescription: String? {
        return message
    }

    public var isRetryable: Bool {
        return code.isRetryable
    }

    public func toDictionary() -> [String: Any] {
        var dict: [String: Any] = [
            "code": code.rawValue,
            "message": message
        ]
        if let context = context {
            dict["context"] = context
        }
        return dict
    }
}

// MARK: - License Error

public class LicenseError: InsightError {

    public static func required() -> LicenseError {
        LicenseError(
            code: .licenseRequired,
            message: "ライセンスが必要です"
        )
    }

    public static func expired(expiresAt: Date? = nil) -> LicenseError {
        var context: [String: Any]? = nil
        if let expiresAt = expiresAt {
            let formatter = ISO8601DateFormatter()
            context = ["expiresAt": formatter.string(from: expiresAt)]
        }
        return LicenseError(
            code: .licenseExpired,
            message: "ライセンスの有効期限が切れています",
            context: context
        )
    }

    public static func invalid(_ reason: String? = nil) -> LicenseError {
        LicenseError(
            code: .licenseInvalid,
            message: reason ?? "無効なライセンスキーです"
        )
    }
}

// MARK: - Validation Error

public class ValidationError: InsightError {
    public let field: String?

    public init(message: String, field: String? = nil) {
        self.field = field
        var context: [String: Any]? = nil
        if let field = field {
            context = ["field": field]
        }
        super.init(code: .validation, message: message, context: context)
    }
}

// MARK: - Network Error

public class NetworkError: InsightError {
    public let statusCode: Int?

    public init(
        code: ErrorCode = .networkError,
        message: String,
        statusCode: Int? = nil,
        underlyingError: Error? = nil
    ) {
        self.statusCode = statusCode
        var context: [String: Any]? = nil
        if let statusCode = statusCode {
            context = ["statusCode": statusCode]
        }
        super.init(
            code: code,
            message: message,
            context: context,
            underlyingError: underlyingError
        )
    }

    public static func timeout() -> NetworkError {
        NetworkError(
            code: .networkTimeout,
            message: "リクエストがタイムアウトしました"
        )
    }

    public static func serverError(statusCode: Int) -> NetworkError {
        NetworkError(
            code: .serverError,
            message: "サーバーエラーが発生しました",
            statusCode: statusCode
        )
    }
}

// MARK: - File Error

public class FileError: InsightError {
    public let path: String?

    public init(
        code: ErrorCode,
        message: String,
        path: String? = nil,
        underlyingError: Error? = nil
    ) {
        self.path = path
        var context: [String: Any]? = nil
        if let path = path {
            context = ["path": path]
        }
        super.init(
            code: code,
            message: message,
            context: context,
            underlyingError: underlyingError
        )
    }

    public static func notFound(_ path: String) -> FileError {
        FileError(
            code: .fileNotFound,
            message: "ファイルが見つかりません: \(path)",
            path: path
        )
    }

    public static func readError(_ path: String, error: Error? = nil) -> FileError {
        FileError(
            code: .fileReadError,
            message: "ファイルの読み込みに失敗しました: \(path)",
            path: path,
            underlyingError: error
        )
    }

    public static func writeError(_ path: String, error: Error? = nil) -> FileError {
        FileError(
            code: .fileWriteError,
            message: "ファイルの書き込みに失敗しました: \(path)",
            path: path,
            underlyingError: error
        )
    }
}

// MARK: - Error Utilities

public func toInsightError(_ error: Error) -> InsightError {
    if let insightError = error as? InsightError {
        return insightError
    }

    let nsError = error as NSError

    switch nsError.domain {
    case NSURLErrorDomain:
        if nsError.code == NSURLErrorTimedOut {
            return NetworkError.timeout()
        }
        return NetworkError(
            message: error.localizedDescription,
            underlyingError: error
        )
    case NSCocoaErrorDomain:
        if nsError.code == NSFileNoSuchFileError {
            return FileError(
                code: .fileNotFound,
                message: error.localizedDescription,
                underlyingError: error
            )
        }
        if nsError.code == NSFileReadNoPermissionError {
            return InsightError(
                code: .permissionDenied,
                message: error.localizedDescription,
                underlyingError: error
            )
        }
    default:
        break
    }

    return InsightError(
        code: .unknown,
        message: error.localizedDescription,
        underlyingError: error
    )
}

public func isRetryable(_ error: Error) -> Bool {
    if let insightError = error as? InsightError {
        return insightError.isRetryable
    }
    return false
}
```

### 5. i18n/swift/InsightI18n.swift

```swift
import Foundation

// MARK: - I18n Manager

public class InsightI18n {

    public static let shared = InsightI18n()

    private var translations: [String: Any] = [:]
    private var currentLocale: Locale = Locale(identifier: "ja_JP")

    private init() {
        loadTranslations()
    }

    /// 初期化（Bundle から JSON を読み込む）
    public func configure(bundle: Bundle = .main, locale: Locale? = nil) {
        if let locale = locale {
            currentLocale = locale
        } else {
            currentLocale = detectLocale()
        }
        loadTranslations(from: bundle)
    }

    /// ロケールを設定
    public func setLocale(_ locale: Locale) {
        currentLocale = locale
        loadTranslations()
    }

    /// 現在のロケールを取得
    public var locale: Locale {
        return currentLocale
    }

    /// ロケールを検出
    public func detectLocale() -> Locale {
        let preferredLanguage = Locale.preferredLanguages.first ?? "en"
        if preferredLanguage.hasPrefix("ja") {
            return Locale(identifier: "ja_JP")
        }
        return Locale(identifier: "en_US")
    }

    /// 翻訳を取得
    /// - Parameters:
    ///   - key: ドット区切りのキー（例: "common.save"）
    ///   - params: プレースホルダー置換用パラメータ
    public func t(_ key: String, params: [String: Any]? = nil) -> String {
        let keys = key.split(separator: ".").map(String.init)
        var current: Any? = translations

        for k in keys {
            if let dict = current as? [String: Any] {
                current = dict[k]
            } else {
                return key
            }
        }

        guard var result = current as? String else {
            return key
        }

        // パラメータ置換
        if let params = params {
            for (paramKey, value) in params {
                result = result.replacingOccurrences(of: "{\(paramKey)}", with: "\(value)")
            }
        }

        return result
    }

    private func loadTranslations(from bundle: Bundle = .main) {
        let fileName = currentLocale.identifier.hasPrefix("ja") ? "ja" : "en"

        guard let url = bundle.url(forResource: fileName, withExtension: "json", subdirectory: "i18n"),
              let data = try? Data(contentsOf: url),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            translations = [:]
            return
        }

        translations = json
    }
}

// MARK: - Convenience Functions

/// 翻訳を取得するグローバル関数
public func t(_ key: String, params: [String: Any]? = nil) -> String {
    return InsightI18n.shared.t(key, params: params)
}

/// ロケールを設定
public func setLocale(_ locale: Locale) {
    InsightI18n.shared.setLocale(locale)
}

/// 現在のロケールを取得
public func currentLocale() -> Locale {
    return InsightI18n.shared.locale
}
```

## iOS アプリでの使用方法

### Package.swift（Swift Package として使用する場合）

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "InsightCommon",
    platforms: [.iOS(.v15), .macOS(.v12)],
    products: [
        .library(name: "InsightCommon", targets: ["InsightCommon"]),
    ],
    targets: [
        .target(
            name: "InsightCommon",
            path: ".",
            sources: [
                "license/swift",
                "utils/swift",
                "errors/swift",
                "i18n/swift"
            ],
            resources: [
                .copy("i18n/ja.json"),
                .copy("i18n/en.json")
            ]
        ),
    ]
)
```

### AppDelegate または App での初期化

```swift
import InsightCommon

@main
struct InsightApp: App {
    init() {
        // i18n 初期化
        InsightI18n.shared.configure()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

### View での使用例

```swift
import SwiftUI
import InsightCommon

struct ContentView: View {
    private let licenseValidator = LicenseValidator()

    var body: some View {
        VStack {
            Text(t("common.save"))  // "保存"

            Button(action: validateLicense) {
                Text(t("license.activate"))
            }
        }
    }

    private func validateLicense() {
        let result = licenseValidator.validate(
            "INS-SALES-BIZ-2601-1534-A7",
            currentProduct: .sales
        )

        if result.isValid {
            let limits = FeatureLimits.forTier(result.tier!)
            print("Max files: \(limits.maxFiles)")
        }

        // Utils
        let formattedDate = DateUtils.formatDate(Date(), style: "long")
        let formattedPrice = NumberUtils.formatCurrency(1500)
        print("\(formattedDate), \(formattedPrice)")
    }
}
```

## 注意事項

1. **i18n JSONファイルの配置**: プロジェクトの Bundle に `i18n/ja.json` と `i18n/en.json` を追加
2. **CryptoKit**: ライセンス検証に必要（iOS 13+）
3. **async/await**: `MiscUtils.sleep()` には Swift 5.5+ が必要

## 確認項目

- [ ] license/swift/InsightLicense.swift を作成
- [ ] utils/swift/InsightUtils.swift を作成
- [ ] errors/swift/InsightErrors.swift を作成
- [ ] i18n/swift/InsightI18n.swift を作成
- [ ] 各ファイルがコンパイルできることを確認
