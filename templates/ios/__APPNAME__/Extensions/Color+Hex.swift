import SwiftUI

// ============================================================
// Color Hex イニシャライザ
//
// 【このファイルについて】
// HEX 文字列から SwiftUI Color を生成するユーティリティ。
// standards/IOS.md のカラー拡張を独立ファイルとして抽出。
//
// 使い方:
//   Color(hex: "B8942F")     // 6桁 (RGB)
//   Color(hex: "FFB8942F")   // 8桁 (ARGB)
// ============================================================

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
