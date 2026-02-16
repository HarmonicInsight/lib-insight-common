import SwiftUI

// ============================================================
// Insight Series カラー定義 - Ivory & Gold Theme
//
// 【このファイルについて】
// insight-common/templates/ios/ からコピーして使用。
// brand/colors.json の値と完全一致。
//
// ⚠️ 禁止: Blue (#2563EB) をプライマリカラーとして使用
// ✅ 必須: Gold (#B8942F) をプライマリカラーとして使用
// ✅ 必須: Ivory (#FAF8F5) を背景色として使用
// ============================================================

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
    static let primaryDark = Color(hex: "6B5518")

    // MARK: - Accent Scale (Gold)
    static let accent50 = Color(hex: "FDF9EF")
    static let accent100 = Color(hex: "F9F0D9")
    static let accent200 = Color(hex: "F0E6C8")
    static let accent300 = Color(hex: "E5D5A0")
    static let accent400 = Color(hex: "D4BC6A")
    static let accent500 = Color(hex: "B8942F")
    static let accent600 = Color(hex: "8C711E")
    static let accent700 = Color(hex: "6B5518")
    static let accent800 = Color(hex: "4A3B10")
    static let accent900 = Color(hex: "2D2408")

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
    static let textOnPrimary = Color.white

    // MARK: - Border
    static let border = Color(hex: "E7E2DA")
    static let borderLight = Color(hex: "F3F0EB")
    static let borderFocus = Color(hex: "B8942F")

    // MARK: - Plan
    static let planFree = Color(hex: "A8A29E")
    static let planTrial = Color(hex: "2563EB")
    static let planStd = Color(hex: "16A34A")
    static let planPro = Color(hex: "B8942F")
    static let planEnt = Color(hex: "7C3AED")

    // MARK: - Dark Mode
    enum Dark {
        static let bgPrimary = Color(hex: "1C1917")
        static let bgSecondary = Color(hex: "292524")
        static let bgCard = Color(hex: "292524")
        static let bgHover = Color(hex: "3D3835")

        static let primary = Color(hex: "D4BC6A")
        static let primaryHover = Color(hex: "E5D5A0")

        static let textPrimary = Color(hex: "FAF8F5")
        static let textSecondary = Color(hex: "D6D3D1")
        static let textTertiary = Color(hex: "A8A29E")

        static let border = Color(hex: "3D3835")
        static let borderLight = Color(hex: "292524")
    }
}
