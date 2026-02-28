import SwiftUI

// ============================================================
// Insight ライセンス プランコード（4ティア制）
//
// 【このファイルについて】
// insight-common/templates/ios/ からコピーして使用。
// config/products.ts のプラン体系に準拠。
// Android の PlanCode.kt と機能一致。
//
// FREE:  無料（Group A: 保存不可, Group B: 閲覧のみ, BYOK）
// TRIAL: 評価用（30日間, 全機能, BYOK）
// BIZ:   ビジネス（365日, 全機能, BYOK）
// ENT:   エンタープライズ（カスタマイズ, BYOK, API/SSO/監査）
// ============================================================

enum PlanCode: String, CaseIterable, Codable, Sendable {
    case free = "FREE"
    case trial = "TRIAL"
    case biz = "BIZ"
    case ent = "ENT"

    var displayName: String { rawValue }

    var displayNameJa: String {
        switch self {
        case .free: return "フリー"
        case .trial: return "トライアル"
        case .biz: return "ビジネス"
        case .ent: return "エンタープライズ"
        }
    }

    var color: Color {
        switch self {
        case .free: return InsightColors.planFree
        case .trial: return InsightColors.planTrial
        case .biz: return InsightColors.planBiz
        case .ent: return InsightColors.planEnt
        }
    }

    /// プラン優先度（高いほど上位プラン）
    var priority: Int {
        switch self {
        case .free: return 0
        case .trial: return 1
        case .biz: return 2
        case .ent: return 3
        }
    }

    /// デフォルト有効期間（日）。-1 = 無期限
    var defaultDurationDays: Int {
        switch self {
        case .free: return -1
        case .trial: return 30
        case .biz: return 365
        case .ent: return -1
        }
    }

    static func fromString(_ value: String) -> PlanCode? {
        PlanCode(rawValue: value.uppercased())
    }
}
