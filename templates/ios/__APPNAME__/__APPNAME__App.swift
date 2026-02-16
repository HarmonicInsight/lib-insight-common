import SwiftUI

// ============================================================
// アプリエントリポイント
//
// 【このファイルについて】
// insight-common/templates/ios/ からコピーして使用。
// __AppName__ を実際のアプリ名 (PascalCase) に置換してください。
// __PRODUCT_CODE__ を製品コード (例: "IOSH") に置換してください。
//
// iOS 17+: @Observable + @Environment(Type.self) パターンを使用。
// ============================================================

@main
struct __AppName__App: App {
    @State private var licenseManager = LicenseManager(productCode: "__PRODUCT_CODE__")

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(licenseManager)
                .tint(InsightColors.primary)  // 【必須】iOS デフォルト Blue を Gold に上書き
        }
    }
}
