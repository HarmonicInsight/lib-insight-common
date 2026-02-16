import SwiftUI

// ============================================================
// Insight ライセンス プランコード
//
// 【このファイルについて】
// insight-common/templates/ios/ からコピーして使用。
// config/products.ts のプラン体系に準拠。
// Android の PlanCode.kt と機能一致。
// ============================================================

enum PlanCode: String, CaseIterable, Codable {
    case trial = "TRIAL"
    case std = "STD"
    case pro = "PRO"
    case ent = "ENT"

    var displayName: String { rawValue }

    var displayNameJa: String {
        switch self {
        case .trial: return "トライアル"
        case .std: return "スタンダード"
        case .pro: return "プロフェッショナル"
        case .ent: return "エンタープライズ"
        }
    }

    var color: Color {
        switch self {
        case .trial: return InsightColors.planTrial
        case .std: return InsightColors.planStd
        case .pro: return InsightColors.planPro
        case .ent: return InsightColors.planEnt
        }
    }

    var defaultDurationDays: Int {
        switch self {
        case .trial: return 14
        default: return 365
        }
    }

    static func fromString(_ value: String) -> PlanCode? {
        PlanCode(rawValue: value.uppercased())
    }
}
