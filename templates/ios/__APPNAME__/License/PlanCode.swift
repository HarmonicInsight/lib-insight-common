import SwiftUI

// ============================================================
// Insight ライセンス プランコード
//
// 【このファイルについて】
// insight-common/templates/ios/ からコピーして使用。
// config/products.ts のプラン体系に準拠。
// Android の PlanCode.kt と機能一致。
//
// FREE 廃止 — CLAUDE.md §8 準拠。TRIAL が基本プラン。
// ============================================================

enum PlanCode: String, CaseIterable, Codable, Sendable {
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

    /// プラン優先度（高いほど上位プラン、TRIAL=4 で全機能利用可能）
    var priority: Int {
        switch self {
        case .trial: return 4
        case .std: return 1
        case .pro: return 2
        case .ent: return 3
        }
    }

    /// デフォルト有効期間（日）
    var defaultDurationDays: Int {
        switch self {
        case .trial: return 14
        case .std: return 365
        case .pro: return 365
        case .ent: return -1
        }
    }

    static func fromString(_ value: String) -> PlanCode? {
        PlanCode(rawValue: value.uppercased())
    }
}
