# iOS 開発標準

> **すべての HARMONIC insight iOS アプリは、このドキュメントに準拠すること。**
> 新規作成・修正時に必ず確認。

---

## クイックスタート（新規アプリ作成）

### 方法1: 自動スキャフォールド（推奨）

```bash
./insight-common/scripts/init-app.sh my-app --platform ios --bundle-id com.harmonic.insight.myapp
```

### 方法2: テンプレートファイルから手動コピー

`templates/ios/` に**そのままコピーして使えるファイル**が揃っています:

```
templates/ios/
├── Sources/
│   ├── App/
│   │   └── __AppName__App.swift       # エントリーポイント（§4）
│   ├── Theme/
│   │   ├── InsightColors.swift         # Ivory & Gold カラー（§6）
│   │   ├── InsightTypography.swift     # タイポグラフィ（§7）
│   │   └── InsightTheme.swift          # テーマユーティリティ（§6）
│   ├── License/
│   │   ├── PlanCode.swift              # プランコード（§14）
│   │   ├── LicenseManager.swift        # ライセンス管理（§14）
│   │   └── LicenseView.swift           # ライセンス画面（§14, SwiftUI）
│   ├── Views/
│   │   ├── Screens/                    # 画面ごとのフォルダ
│   │   └── Components/                 # 共通 UI コンポーネント
│   └── Models/                         # データモデル
├── Resources/
│   ├── Assets.xcassets/
│   │   ├── AppIcon.appiconset/         # アプリアイコン
│   │   ├── AccentColor.colorset/       # Gold (#B8942F)
│   │   └── Colors/                     # カラーアセット
│   ├── Localizable.xcstrings           # String Catalog（§12）
│   └── InfoPlist.xcstrings             # Info.plist ローカライゼーション
├── .github/workflows/build.yml         # CI/CD（§10）
├── .gitignore
└── APP_SPEC.md                         # アプリ仕様書
```

**プレースホルダー置換**（コピー後に実行）:

| プレースホルダー | 説明 | 例 |
|---|---|---|
| `__AppName__` | アプリ名（PascalCase） | `ConsulType` |
| `__BUNDLE_ID__` | Bundle Identifier | `com.harmonic.insight.consultype` |
| `__PRODUCT_CODE__` | 製品コード（4文字） | `CTYP` |
| `__app_display_name__` | 表示名 | `ConsulType` |

### 標準検証

```bash
# iOS 固有チェック（カラー, i18n, Info.plist, コード署名）
./insight-common/scripts/validate-standards.sh <project-directory>
```

---

## 1. 基本方針

| 項目 | 標準値 |
|------|--------|
| **言語** | Swift 6.0+ |
| **UI フレームワーク** | SwiftUI（100% SwiftUI、UIKit ラッパーは最小限） |
| **最小デプロイターゲット** | iOS 17.0 |
| **アーキテクチャ** | MVVM + @Observable（Observation フレームワーク） |
| **データ永続化** | SwiftData（ローカル DB が必要な場合） |
| **ネットワーク** | URLSession + async/await |
| **DI** | Swift Package + Environment（小〜中規模）/ swift-dependencies（大規模） |
| **ナビゲーション** | NavigationStack + NavigationPath（iOS 16+） |
| **非同期処理** | Swift Concurrency（async/await, Actor, TaskGroup） |
| **依存管理** | Swift Package Manager（SPM）のみ。CocoaPods / Carthage は**禁止** |
| **CI/CD** | GitHub Actions + Fastlane（オプション） |

---

## 2. Xcode・SDK バージョン

| 項目 | 値 | 備考 |
|------|-----|------|
| **Xcode** | 16.0+ | 最新安定版を推奨 |
| **Swift** | 6.0+ | Strict Concurrency 対応 |
| **iOS Deployment Target** | 17.0 | @Observable, SwiftData 対応 |
| **macOS（開発環境）** | 15.0+ (Sequoia) | Xcode 16 の最小要件 |

### 2.1 iOS バージョンサポートポリシー

Apple は最新 iOS の普及率が極めて高い（リリース後 6 ヶ月で 70%+）。
コスト対効果を最大化するため、**最新 - 1 バージョン**をサポート下限とする。

| 時期 | 最小ターゲット | 理由 |
|------|:------------:|------|
| 2026 年現在 | iOS 17.0 | @Observable, SwiftData, TipKit 等の活用 |
| iOS 19 リリース後 | iOS 18.0 | 半年後に引き上げ |

> **例外**: 既存ユーザーベースが古い iOS に多い場合は個別判断。ただし iOS 16.0 未満はサポートしない。

### 2.2 Swift 6 Strict Concurrency

Swift 6 では Strict Concurrency Checking がデフォルトで有効。新規プロジェクトでは最初から対応すること。

```swift
// ✅ @MainActor で UI 関連クラスをマーク
@MainActor
@Observable
final class HomeViewModel {
    var items: [Item] = []

    func loadItems() async {
        items = await ItemService.shared.fetchItems()
    }
}

// ✅ Sendable 準拠のデータ型
struct Item: Sendable, Identifiable, Codable {
    let id: UUID
    let title: String
}
```

**ビルド設定**:

```
// Build Settings
SWIFT_STRICT_CONCURRENCY = complete   // Swift 6 デフォルト
```

> **既存プロジェクトの移行**: `SWIFT_STRICT_CONCURRENCY = targeted` で段階的に対応。

---

## 3. Bundle ID 命名規則

```
com.harmonic.insight.<アプリ名>
```

| アプリ | Bundle ID | 種別 |
|--------|----------|------|
| ConsulType | `com.harmonic.insight.consultype` | Native Swift |
| Harmonic Horoscope | `com.harmonic.insight.horoscope` | Native Swift |
| InclineInsight | `com.harmonic.insight.incline` | Native Swift |

> **禁止**: `com.insightXXX`（フラットな Bundle ID）は使わないこと。
> Native Swift アプリは `com.harmonic.insight.*` の命名規則に従う。

---

## 4. プロジェクト構造

```
<project-root>/
├── .github/
│   └── workflows/
│       └── build.yml                       # 標準 CI/CD ワークフロー
├── <AppName>/
│   ├── <AppName>App.swift                  # @main エントリーポイント
│   ├── ContentView.swift                   # ルートビュー
│   ├── Info.plist                          # アプリ設定
│   │
│   ├── Models/                             # データモデル
│   │   └── <Model>.swift
│   │
│   ├── ViewModels/                         # ViewModel（@Observable）
│   │   └── <Screen>ViewModel.swift
│   │
│   ├── Views/
│   │   ├── Screens/                        # 画面ごとのフォルダ
│   │   │   ├── Home/
│   │   │   │   └── HomeScreen.swift
│   │   │   └── Settings/
│   │   │       └── SettingsScreen.swift
│   │   └── Components/                     # 共通 UI コンポーネント
│   │       └── InsightCard.swift
│   │
│   ├── Theme/                              # 【必須】テーマ定義
│   │   ├── InsightColors.swift             # Ivory & Gold カラー定義
│   │   ├── InsightTypography.swift         # タイポグラフィ
│   │   └── InsightTheme.swift              # テーマユーティリティ
│   │
│   ├── Services/                           # ビジネスロジック・API
│   │   └── <Service>.swift
│   │
│   ├── License/                            # ライセンス管理（Insight Business Suite 製品のみ）
│   │   ├── PlanCode.swift
│   │   ├── LicenseManager.swift
│   │   └── LicenseView.swift
│   │
│   ├── Navigation/                         # ナビゲーション定義
│   │   └── AppNavigation.swift
│   │
│   └── Resources/
│       ├── Assets.xcassets/                # アセット
│       │   ├── AppIcon.appiconset/         # アプリアイコン（1024x1024 PNG）
│       │   ├── AccentColor.colorset/       # Gold (#B8942F)
│       │   └── Colors/                     # 追加カラーアセット
│       ├── Localizable.xcstrings           # 【必須】String Catalog
│       └── InfoPlist.xcstrings             # Info.plist ローカライゼーション
│
├── <AppName>.xcodeproj/                    # Xcode プロジェクト
│   または
├── <AppName>.xcworkspace/                  # ワークスペース（SPM 利用時は自動生成）
│
├── <AppName>Tests/                         # ユニットテスト
│   └── <Test>.swift
├── <AppName>UITests/                       # UI テスト
│   └── <UITest>.swift
│
├── fastlane/                               # Fastlane 設定（オプション）
│   ├── Fastfile
│   ├── Appfile
│   └── metadata/                           # App Store メタデータ
│       ├── ja/
│       │   ├── name.txt
│       │   ├── subtitle.txt
│       │   ├── description.txt
│       │   ├── keywords.txt
│       │   └── release_notes.txt
│       └── en-US/
│           ├── name.txt
│           ├── subtitle.txt
│           ├── description.txt
│           ├── keywords.txt
│           └── release_notes.txt
│
└── APP_SPEC.md                             # アプリ仕様書
```

> **注意**: Xcode プロジェクトのファイル参照と実際のフォルダ構造を一致させること。

---

## 5. 依存管理（Swift Package Manager）

### 基本ルール

| ルール | 説明 |
|--------|------|
| **SPM のみ** | CocoaPods / Carthage は**使用禁止**。SPM に一本化。 |
| **バージョン固定** | `.upToNextMajor(from:)` を使用。`.branch()` や `.revision()` は禁止。 |
| **最小限の依存** | Apple 純正フレームワークで実現できる場合はサードパーティを追加しない。 |

### 推奨ライブラリ

| 用途 | ライブラリ | 備考 |
|------|-----------|------|
| **HTTP クライアント** | URLSession（標準） | サードパーティ不要 |
| **JSON** | Codable（標準） | サードパーティ不要 |
| **画像キャッシュ** | AsyncImage（標準）/ Kingfisher | 複雑な要件のみ Kingfisher |
| **キーチェーン** | KeychainAccess | ライセンスキー等の安全な保存 |
| **Firebase** | firebase-ios-sdk | Analytics, Crashlytics |
| **DI（大規模）** | swift-dependencies | pointfreeco 製。テスタビリティ向上 |
| **テスト** | swift-snapshot-testing | UI スナップショットテスト |

### Package.swift の例（SPM パッケージプロジェクトの場合）

```swift
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "InsightConsulType",
    platforms: [.iOS(.v17)],
    dependencies: [
        .package(url: "https://github.com/firebase/firebase-ios-sdk.git", .upToNextMajor(from: "11.0.0")),
        .package(url: "https://github.com/kishikawakatsumi/KeychainAccess.git", .upToNextMajor(from: "4.2.2")),
    ],
    targets: [
        .target(
            name: "InsightConsulType",
            dependencies: [
                .product(name: "FirebaseAnalytics", package: "firebase-ios-sdk"),
                .product(name: "FirebaseCrashlytics", package: "firebase-ios-sdk"),
                "KeychainAccess",
            ]
        ),
    ]
)
```

> Xcode プロジェクトの場合は Xcode UI から「Add Package Dependencies」で追加する。

---

## 6. カラーシステム（Ivory & Gold）

### ❌ 禁止

```
Blue (#2563EB, #007AFF, #0A84FF, #3478F6) をプライマリカラーとして使用
iOS デフォルトの tintColor（Blue）をそのまま使用
独自のカラーパレットを定義
ハードコードされた色値を直接使用
```

### ✅ 必須

```
Gold (#B8942F) をプライマリカラーとして使用
Ivory (#FAF8F5) をライトモード背景色として使用
brand/colors.json に基づくカラー定義
iOS デフォルトの tintColor を Gold に上書き
```

> **重要**: iOS はデフォルトで青色（#007AFF）を tintColor に使用する。
> **必ず** AccentColor を Gold (#B8942F) に設定し、`.tint()` で上書きすること。

### 6.1 AccentColor.colorset（Asset Catalog）

```json
{
  "colors": [
    {
      "color": {
        "color-space": "srgb",
        "components": {
          "red": "0.722",
          "green": "0.580",
          "blue": "0.184",
          "alpha": "1.000"
        }
      },
      "idiom": "universal"
    },
    {
      "appearances": [
        { "appearance": "luminosity", "value": "dark" }
      ],
      "color": {
        "color-space": "srgb",
        "components": {
          "red": "0.831",
          "green": "0.737",
          "blue": "0.416",
          "alpha": "1.000"
        }
      },
      "idiom": "universal"
    }
  ],
  "info": { "version": 1, "author": "xcode" }
}
```

### 6.2 InsightColors.swift（SwiftUI）

```swift
import SwiftUI

/// Insight Series カラー定義 - Ivory & Gold Theme
/// brand/colors.json に基づく統一カラー定義
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

    // MARK: - Dark Mode

    static let darkBgPrimary = Color(hex: "1C1917")
    static let darkBgSecondary = Color(hex: "292524")
    static let darkBgCard = Color(hex: "292524")
    static let darkTextPrimary = Color(hex: "FAF8F5")
    static let darkTextSecondary = Color(hex: "D6D3D1")
    static let darkBorder = Color(hex: "3D3835")

    // MARK: - Plan（FREE 廃止 — CLAUDE.md §8 準拠）

    static let planTrial = Color(hex: "2563EB")
    static let planStd = Color(hex: "16A34A")
    static let planPro = Color(hex: "B8942F")
    static let planEnt = Color(hex: "7C3AED")

    // MARK: - Adaptive Colors（Light/Dark 自動切替）

    /// 背景色（Light: Ivory, Dark: Stone 900）
    static let background = Color("InsightBackground")
    /// サーフェス色（Light: White, Dark: Stone 800）
    static let surface = Color("InsightSurface")
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

### 6.3 テーマ適用（エントリーポイント）

```swift
import SwiftUI

@main
struct ConsulTypeApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .tint(InsightColors.primary)  // 【必須】iOS デフォルト Blue を Gold に上書き
        }
    }
}
```

### 6.4 InsightTheme.swift（テーマユーティリティ）

```swift
import SwiftUI

/// Insight デザインシステムの共通修飾子・スタイル
enum InsightTheme {
    /// 標準カード修飾子
    static func card() -> some ViewModifier {
        CardModifier()
    }

    /// 標準コーナー半径
    static let cornerRadius: CGFloat = 12

    /// 標準パディング
    static let padding: CGFloat = 16
    static let paddingSmall: CGFloat = 8
    static let paddingLarge: CGFloat = 24
}

private struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(InsightTheme.padding)
            .background(InsightColors.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: InsightTheme.cornerRadius))
            .overlay(
                RoundedRectangle(cornerRadius: InsightTheme.cornerRadius)
                    .stroke(InsightColors.border, lineWidth: 1)
            )
    }
}

extension View {
    /// Insight 標準カードスタイルを適用
    func insightCard() -> some View {
        modifier(InsightTheme.card())
    }
}
```

使用例:

```swift
VStack {
    Text("コンテンツ")
}
.insightCard()  // カード背景 + 角丸12 + ボーダー
```

---

## 7. タイポグラフィ

### InsightTypography.swift（標準定義）

```swift
import SwiftUI

/// Insight タイポグラフィ定義
/// システムフォント（San Francisco）を使用
enum InsightTypography {
    // MARK: - Display
    static let displayLarge = Font.system(size: 57, weight: .light)
    static let displayMedium = Font.system(size: 45, weight: .light)
    static let displaySmall = Font.system(size: 36, weight: .regular)

    // MARK: - Headline
    static let headlineLarge = Font.system(size: 32, weight: .regular)
    static let headlineMedium = Font.system(size: 28, weight: .regular)
    static let headlineSmall = Font.system(size: 24, weight: .regular)

    // MARK: - Title
    static let titleLarge = Font.system(size: 22, weight: .medium)
    static let titleMedium = Font.system(size: 16, weight: .medium)
    static let titleSmall = Font.system(size: 14, weight: .medium)

    // MARK: - Body
    static let bodyLarge = Font.system(size: 16, weight: .regular)
    static let bodyMedium = Font.system(size: 14, weight: .regular)
    static let bodySmall = Font.system(size: 12, weight: .regular)

    // MARK: - Label
    static let labelLarge = Font.system(size: 14, weight: .medium)
    static let labelMedium = Font.system(size: 12, weight: .medium)
    static let labelSmall = Font.system(size: 11, weight: .medium)
}
```

> **命名**: フォント変数は `InsightTypography` enum で統一する。
> **San Francisco**: iOS 標準フォントを使用。カスタムフォントは原則不要。
> 日本語は自動的にヒラギノ角ゴシック（SF の日本語フォールバック）が使用される。

---

## 8. アーキテクチャ（MVVM + @Observable）

### 8.1 基本パターン

iOS 17+ の `@Observable` マクロを使用した MVVM アーキテクチャを標準とする。

```swift
// MARK: - Model
struct DiagnosisResult: Identifiable, Codable, Sendable {
    let id: UUID
    let typeName: String
    let score: Double
    let description: String
    let createdAt: Date
}

// MARK: - ViewModel
@MainActor
@Observable
final class DiagnosisViewModel {
    var results: [DiagnosisResult] = []
    var isLoading = false
    var errorMessage: String?

    private let service: DiagnosisService

    init(service: DiagnosisService = .shared) {
        self.service = service
    }

    func runDiagnosis(answers: [Answer]) async {
        isLoading = true
        errorMessage = nil
        do {
            let result = try await service.diagnose(answers: answers)
            results.append(result)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

// MARK: - View
struct DiagnosisScreen: View {
    @State private var viewModel = DiagnosisViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    DiagnosisResultList(results: viewModel.results)
                }
            }
            .navigationTitle("診断結果")
            .background(InsightColors.bgPrimary)
        }
    }
}
```

### 8.2 ナビゲーション

```swift
// MARK: - Navigation（型安全なナビゲーション）
enum AppRoute: Hashable {
    case home
    case diagnosis
    case result(DiagnosisResult)
    case settings
    case license
}

struct AppNavigation: View {
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            HomeScreen()
                .navigationDestination(for: AppRoute.self) { route in
                    switch route {
                    case .home:
                        HomeScreen()
                    case .diagnosis:
                        DiagnosisScreen()
                    case .result(let result):
                        ResultDetailScreen(result: result)
                    case .settings:
                        SettingsScreen()
                    case .license:
                        LicenseView()
                    }
                }
        }
        .tint(InsightColors.primary)
    }
}
```

### 8.3 データ永続化（SwiftData）

iOS 17+ では Core Data の代わりに SwiftData を使用する。

```swift
import SwiftData

// MARK: - SwiftData Model
@Model
final class DiagnosisRecord {
    var typeName: String
    var score: Double
    var resultDescription: String
    var createdAt: Date

    init(typeName: String, score: Double, resultDescription: String) {
        self.typeName = typeName
        self.score = score
        self.resultDescription = resultDescription
        self.createdAt = .now
    }
}

// MARK: - App Entry Point（ModelContainer 設定）
@main
struct ConsulTypeApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .tint(InsightColors.primary)
        }
        .modelContainer(for: DiagnosisRecord.self)
    }
}
```

> **重要**: `Scene` という名前の enum やプロトコルを定義すると、SwiftUI の `Scene` と名前衝突する。
> 衝突した場合は `SwiftUI.Scene` と明示するか、enum 名を変更すること。

---

## 9. プライバシー・権限（Info.plist）

### 9.1 必須設定

iOS ではハードウェアやユーザーデータへのアクセスに**使用理由（Usage Description）**の宣言が必須。
宣言なしにアクセスするとクラッシュし、App Store にリジェクトされる。

```xml
<!-- Info.plist -->

<!-- カメラ使用 -->
<key>NSCameraUsageDescription</key>
<string>写真撮影のためにカメラを使用します</string>

<!-- 写真ライブラリ（読み取り） -->
<key>NSPhotoLibraryUsageDescription</key>
<string>写真を選択するためにフォトライブラリにアクセスします</string>

<!-- 写真ライブラリ（書き込み） -->
<key>NSPhotoLibraryAddUsageDescription</key>
<string>撮影した写真をフォトライブラリに保存します</string>

<!-- 位置情報 -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>現在地の取得に位置情報を使用します</string>

<!-- マイク -->
<key>NSMicrophoneUsageDescription</key>
<string>音声入力のためにマイクを使用します</string>

<!-- モーションセンサー（傾斜計等） -->
<key>NSMotionUsageDescription</key>
<string>傾斜角度の計測にモーションセンサーを使用します</string>

<!-- Face ID -->
<key>NSFaceIDUsageDescription</key>
<string>認証のために Face ID を使用します</string>
```

> **ルール**: 使用しない権限は宣言しないこと。不要な権限宣言は App Store リジェクトの原因になる。
> **日本語**: Usage Description は日本語で記載し、`InfoPlist.xcstrings` で英語翻訳を追加する。

### 9.2 iPad 対応（必須）

App Store 提出時、iPad 全画面方向のサポートが必須:

```xml
<key>UISupportedInterfaceOrientations~ipad</key>
<array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationPortraitUpsideDown</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
</array>
```

### 9.3 App Transport Security

すべての通信は HTTPS を使用する。例外は原則設定しない。

```xml
<!-- Info.plist — 通常は設定不要（デフォルトで HTTPS 強制） -->
<!-- ローカル開発サーバーへの接続が必要な場合のみ例外を追加 -->
```

---

## 10. CI/CD ワークフロー（GitHub Actions 標準テンプレート）

> **テンプレートファイル**: `templates/ios/.github/workflows/build.yml`

```yaml
name: Build iOS

on:
  push:
    branches: [ main, 'claude/**' ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    name: Build
    runs-on: macos-15
    timeout-minutes: 30

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          submodules: true

      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode_16.2.app/Contents/Developer

      - name: Show build environment
        run: |
          xcodebuild -version
          swift --version

      # --- ビルド ---
      - name: Build for iOS Simulator
        run: |
          xcodebuild build \
            -project <AppName>.xcodeproj \
            -scheme <AppName> \
            -destination 'platform=iOS Simulator,name=iPhone 16 Pro' \
            -configuration Debug \
            CODE_SIGNING_ALLOWED=NO \
            | xcpretty

      # --- テスト ---
      - name: Run Tests
        run: |
          xcodebuild test \
            -project <AppName>.xcodeproj \
            -scheme <AppName> \
            -destination 'platform=iOS Simulator,name=iPhone 16 Pro' \
            -configuration Debug \
            CODE_SIGNING_ALLOWED=NO \
            -resultBundlePath TestResults \
            | xcpretty

      # --- Archive（タグ push 時のみ） ---
      - name: Archive for Distribution
        if: startsWith(github.ref, 'refs/tags/v')
        run: |
          xcodebuild archive \
            -project <AppName>.xcodeproj \
            -scheme <AppName> \
            -configuration Release \
            -archivePath build/<AppName>.xcarchive \
            -destination 'generic/platform=iOS' \
            CODE_SIGN_IDENTITY="${{ secrets.CODE_SIGN_IDENTITY }}" \
            PROVISIONING_PROFILE_SPECIFIER="${{ secrets.PROVISIONING_PROFILE }}" \
            DEVELOPMENT_TEAM="${{ secrets.DEVELOPMENT_TEAM }}"

      # --- GitHub Release（タグ push 時のみ） ---
      - name: Create GitHub Release
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
          prerelease: ${{ contains(github.ref, '-rc') || contains(github.ref, '-beta') || contains(github.ref, '-alpha') }}
```

### 統一ポイント

| 項目 | 標準 |
|------|------|
| ランナー | `macos-15` |
| Xcode | 16.2+（`xcode-select` で指定） |
| サブモジュール | `submodules: true`（insight-common 使用時） |
| トリガー | `main`, `claude/**` ブランチ + `v*` タグ |
| ビルド | Simulator ビルド（CI）+ Archive（リリース時） |
| テスト | `xcodebuild test` + `xcpretty` |
| コード署名 | CI では `CODE_SIGNING_ALLOWED=NO`（Simulator ビルド） |
| GitHub Release | `v*` タグ push 時に自動作成 |

### 必要な GitHub Secrets

| Secret 名 | 説明 | 設定方法 |
|-----------|------|---------|
| `DEVELOPMENT_TEAM` | Apple Developer Team ID | 10文字の英数字 |
| `CODE_SIGN_IDENTITY` | コード署名 ID | `Apple Distribution: HARMONIC insight Inc.` |
| `PROVISIONING_PROFILE` | プロビジョニングプロファイル名 | Xcode で確認 |

---

## 11. コード署名・配布

### 11.1 概要

| 環境 | 署名方式 | 用途 |
|------|---------|------|
| **開発** | Automatic Signing（Xcode 管理） | ローカル開発・Simulator |
| **テスト配布** | TestFlight（App Store Connect 経由） | 社内テスト・QA |
| **リリース** | App Store Distribution | App Store 公開 |

### 11.2 Xcode プロジェクト設定

```
Build Settings:
  CODE_SIGN_STYLE = Automatic          # 開発時
  DEVELOPMENT_TEAM = <Team ID>
  PRODUCT_BUNDLE_IDENTIFIER = com.harmonic.insight.<appname>
```

### 11.3 TestFlight 配布手順

```
1. Xcode → Product → Archive
2. Distribute App → TestFlight & App Store
3. Upload → App Store Connect に IPA がアップロードされる
4. App Store Connect → TestFlight → テスターに配信
```

### 11.4 Fastlane（オプション — 自動化が必要な場合）

```ruby
# fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "テストを実行"
  lane :test do
    run_tests(
      scheme: "<AppName>",
      device: "iPhone 16 Pro",
      clean: true
    )
  end

  desc "TestFlight にアップロード"
  lane :beta do
    increment_build_number
    build_app(scheme: "<AppName>")
    upload_to_testflight
  end

  desc "App Store にリリース"
  lane :release do
    build_app(scheme: "<AppName>")
    upload_to_app_store(
      submit_for_review: true,
      automatic_release: false
    )
  end
end
```

```ruby
# fastlane/Appfile
app_identifier("com.harmonic.insight.<appname>")
apple_id("developer@harmonicinsight.com")
team_id("<Team ID>")
```

---

## 12. 多言語対応（i18n）

> **詳細**: `standards/LOCALIZATION.md` を参照。

### 必須要件

| 項目 | 必須 |
|------|------|
| `Localizable.xcstrings`（String Catalog） | ✅ Xcode 15+ 推奨 |
| Development Language | `ja`（日本語） |
| 英語ローカライゼーション | ✅ 必須 |

### ルール

- Xcode 15+ では **String Catalog（`.xcstrings`）** を使用する（`.strings` ファイルは新規プロジェクトでは使わない）。
- SwiftUI の `Text("文字列")` は自動的に `LocalizedStringKey` として解決される。
- Development Language を `ja`（日本語）に設定し、英語を追加言語とする。
- `InfoPlist.xcstrings` で Info.plist のキー（権限説明文等）もローカライズする。
- パラメータは String Interpolation を使用: `Text("残り\(days)日")`

### 実装例

```swift
// SwiftUI — 文字列リテラルが自動的にローカライズされる
Text("診断結果")           // ✅ Localizable.xcstrings から解決
Text("残り\(days)日")     // ✅ パラメータ付きローカライズ

// 明示的に NSLocalizedString を使う場合（非 SwiftUI コード）
let message = String(localized: "camera_permission_required")
```

### App Store メタデータ

```
fastlane/metadata/
├── ja/
│   ├── name.txt                # アプリ名（30文字以内）
│   ├── subtitle.txt            # サブタイトル（30文字以内）
│   ├── description.txt         # 説明
│   ├── keywords.txt            # キーワード（100文字以内、カンマ区切り）
│   ├── release_notes.txt       # リリースノート
│   └── promotional_text.txt    # プロモーションテキスト
└── en-US/
    ├── name.txt
    ├── subtitle.txt
    ├── description.txt
    ├── keywords.txt
    ├── release_notes.txt
    └── promotional_text.txt
```

---

## 13. リリース管理

### バージョニング

| 項目 | 規則 | Info.plist キー | 例 |
|------|------|----------------|-----|
| **バージョン番号** | セマンティックバージョニング | `CFBundleShortVersionString` | `1.0.0`, `1.1.0` |
| **ビルド番号** | リリースごとに +1 | `CFBundleVersion` | `1`, `2`, `3` |
| **Git タグ** | `v` + バージョン番号 | — | `v1.0.0` |

> **重要**: App Store Connect は同一ビルド番号を拒否する。ビルド番号は必ずインクリメントすること。

### リリースフロー

```bash
# 1. バージョン更新（Xcode の General タブ、または agvtool）
agvtool new-marketing-version 1.1.0    # CFBundleShortVersionString
agvtool next-version -all              # CFBundleVersion +1

# 2. リリースチェック
./insight-common/scripts/release-check.sh . --platform ios

# 3. コミット & タグ & プッシュ
git add . && git commit -m "release: v1.1.0"
git tag v1.1.0
git push origin main --tags

# 4. Archive & TestFlight
# Xcode → Product → Archive → Distribute App
```

### App Store 提出チェック

| 項目 | 説明 |
|------|------|
| **アイコン** | 1024x1024 PNG。**アルファチャンネル禁止**。 |
| **スクリーンショット** | 6.9"（iPhone 16 Pro Max）+ 6.3"（iPhone 16 Pro）。日英。 |
| **メタデータ** | 名前、サブタイトル、説明、キーワード。日英。 |
| **プライバシーポリシー** | URL 必須。 |
| **年齢制限** | 適切なレーティングを設定。 |
| **App Privacy** | データ収集の詳細を App Store Connect で宣言。 |

### アプリアイコンの注意点

- **アルファチャンネル（透明度）禁止**: Apple はアイコンの透明度を許可しない。
- アイコンに透明度がある場合は白背景に合成:

```python
# Python で透明度を除去
from PIL import Image
img = Image.open("icon.png")
background = Image.new('RGB', img.size, (255, 255, 255))
background.paste(img, mask=img.split()[3])
background.save("icon.png")
```

---

## 14. ライセンス管理

Insight Business Suite 製品（INSS/IOSH/IOSD 等）の iOS 版では、ライセンス管理が必須。
ユーティリティアプリ（ConsulType、Horoscope 等）では任意。

### PlanCode.swift

> **注意**: CLAUDE.md §8 に基づき、FREE プランは廃止。TRIAL が最下位プラン。

```swift
import SwiftUI

/// ライセンスプランコード（全製品 法人向け — FREE 廃止）
enum PlanCode: String, CaseIterable, Sendable {
    case trial = "TRIAL"
    case std = "STD"
    case pro = "PRO"
    case ent = "ENT"

    var displayName: String { rawValue }

    var displayNameJa: String {
        switch self {
        case .trial: return "トライアル"
        case .std: return "スタンダード"
        case .pro: return "プロ"
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
}
```

### LicenseManager.swift

> **テンプレート**: `templates/ios/__APPNAME__/License/LicenseManager.swift` に完全な実装あり。

```swift
import Foundation
import SwiftUI

/// ライセンス管理
///
/// ライセンスキー形式: `{製品コード}-{プラン}-{YYMM}-{HASH}-{SIG1}-{SIG2}`
/// 例: `INSS-STD-2601-XXXX-XXXX-XXXX`
@MainActor
@Observable
final class LicenseManager {
    let productCode: String

    private let keyPattern = try! NSRegularExpression(
        pattern: "^([A-Z]{4})-(TRIAL|STD|PRO|ENT)-(\\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$"
    )

    var currentPlan: PlanCode = .trial
    var expiryDate: Date?
    var email: String = ""

    var isActivated: Bool { currentPlan != .trial }

    init(productCode: String) {
        self.productCode = productCode
        loadLicense()
    }

    func activate(email: String, key: String) -> Result<String, LicenseError> {
        let upperKey = key.uppercased().trimmingCharacters(in: .whitespacesAndNewlines)
        let range = NSRange(upperKey.startIndex..., in: upperKey)

        guard let match = keyPattern.firstMatch(in: upperKey, range: range) else {
            return .failure(.invalidFormat)
        }

        guard let productRange = Range(match.range(at: 1), in: upperKey),
              String(upperKey[productRange]) == productCode else {
            return .failure(.wrongProduct)
        }

        guard let planRange = Range(match.range(at: 2), in: upperKey),
              let plan = PlanCode(rawValue: String(upperKey[planRange])) else {
            return .failure(.invalidFormat)
        }

        // UserDefaults に保存（機密データは Keychain を推奨）
        UserDefaults.standard.set(email, forKey: "license_email")
        UserDefaults.standard.set(upperKey, forKey: "license_key")

        self.email = email
        self.currentPlan = plan

        return .success(String(localized: "licenseActivated"))
    }

    func deactivate() {
        UserDefaults.standard.removeObject(forKey: "license_email")
        UserDefaults.standard.removeObject(forKey: "license_key")
        currentPlan = .trial
        expiryDate = nil
        email = ""
    }

    private func loadLicense() {
        email = UserDefaults.standard.string(forKey: "license_email") ?? ""

        guard let key = UserDefaults.standard.string(forKey: "license_key") else { return }
        let range = NSRange(key.startIndex..., in: key)
        guard let match = keyPattern.firstMatch(in: key, range: range),
              let planRange = Range(match.range(at: 2), in: key),
              let plan = PlanCode(rawValue: String(key[planRange])) else { return }
        currentPlan = plan
    }
}

enum LicenseError: LocalizedError, Sendable {
    case invalidFormat
    case wrongProduct
    case expired
    case networkError

    var errorDescription: String? {
        switch self {
        case .invalidFormat: return String(localized: "errorInvalidFormat")
        case .wrongProduct: return String(localized: "errorWrongProduct")
        case .expired: return String(localized: "errorExpired")
        case .networkError: return String(localized: "errorNetwork")
        }
    }
}
```

### LicenseView.swift（SwiftUI）

```swift
import SwiftUI

struct LicenseView: View {
    @State private var licenseManager = LicenseManager.shared
    @State private var email = ""
    @State private var licenseKey = ""
    @State private var alertMessage: String?
    @State private var showAlert = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Product Title
                Text("Insight Product")
                    .font(InsightTypography.titleLarge)
                    .fontWeight(.bold)
                    .foregroundStyle(InsightColors.primary)

                // Current Plan
                VStack(spacing: 4) {
                    Text("現在のプラン")
                        .font(InsightTypography.bodyMedium)
                        .foregroundStyle(InsightColors.textSecondary)

                    Text(licenseManager.currentPlan.displayName)
                        .font(.system(size: 36, weight: .bold))
                        .foregroundStyle(licenseManager.currentPlan.color)

                    if let expiry = licenseManager.expiryDate {
                        Text("有効期限: \(expiry.formatted(date: .long, time: .omitted))")
                            .font(InsightTypography.bodySmall)
                            .foregroundStyle(InsightColors.textSecondary)
                    }
                }

                // License Form
                VStack(alignment: .leading, spacing: 16) {
                    Text("ライセンス認証")
                        .font(InsightTypography.titleMedium)
                        .foregroundStyle(InsightColors.textPrimary)

                    TextField("メールアドレス", text: $email)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)

                    TextField("ライセンスキー", text: $licenseKey)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()

                    HStack {
                        Button("アクティベート") {
                            let result = licenseManager.activate(email: email, key: licenseKey)
                            switch result {
                            case .success(let message):
                                alertMessage = message
                            case .failure(let error):
                                alertMessage = error.localizedDescription
                            }
                            showAlert = true
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
                .insightCard()
            }
            .padding()
        }
        .background(InsightColors.bgPrimary)
        .alert("ライセンス", isPresented: $showAlert) {
            Button("OK") { }
        } message: {
            Text(alertMessage ?? "")
        }
    }
}
```

---

## 15. Android → iOS 技術対応表

| Android (Kotlin / Compose) | iOS (Swift / SwiftUI) | 備考 |
|---|---|---|
| Jetpack Compose | SwiftUI | 宣言的 UI |
| `@Composable` | `View` プロトコル | |
| `ViewModel` + `StateFlow` | `@Observable` クラス | iOS 17+ |
| `remember` / `mutableStateOf` | `@State` | |
| `collectAsState()` | 自動（@Observable） | |
| Hilt（DI） | Environment / swift-dependencies | |
| Room | SwiftData | iOS 17+ |
| SharedPreferences | UserDefaults / `@AppStorage` | |
| Kotlin Coroutines | Swift Concurrency（async/await） | |
| Flow | AsyncSequence / Combine | |
| `LazyColumn` | `List` / `LazyVStack` | |
| `Material3` テーマ | カスタムテーマ（InsightTheme） | |
| `stringResource()` | `String(localized:)` / `Text("key")` | |
| `strings.xml` | `Localizable.xcstrings` | |
| Navigation Compose | NavigationStack + NavigationPath | |
| Version Catalog | Package.resolved | |
| ProGuard/R8 | 不要（Swift は最適化済み） | |
| AAB / APK | IPA / Archive | |
| Play Store Console | App Store Connect | |
| Firebase Crashlytics | Firebase Crashlytics（同じ） | |
| `SensorManager` | CoreMotion | |
| CameraX | AVFoundation | |
| `PackageManager` | （制限あり — アプリ検出不可） | |

---

## 16. よくあるエラーと解決策

| エラー | 原因 | 解決策 |
|-------|------|--------|
| `Type does not conform to protocol 'App'` | `Scene` の名前衝突 | `SwiftUI.Scene` と明示、または enum をリネーム |
| `Supported platforms empty` | スキーム設定不備 | Xcode で Build Settings → Supported Platforms を確認 |
| iPad orientations error | Info.plist 不足 | 4方向すべて追加（§9.2） |
| App icon alpha channel | 透明度あり | 白背景で再作成（§13） |
| `DistributionAppRecordProviderError` | App Store Connect 未登録 | App Store Connect でアプリを作成 |
| SwiftData が動作しない | `ModelContainer` 未設定 | App エントリーポイントで `.modelContainer()` を設定 |
| `Sending 'xxx' risks causing data races` | Swift 6 Strict Concurrency | `@MainActor` / `Sendable` 準拠を追加 |
| `Cannot find 'xxx' in scope` | ファイルがターゲットに含まれていない | Xcode → Target → Build Phases → Compile Sources を確認 |

---

## 17. 必須チェックリスト

### デザイン（トンマナ）

- [ ] `InsightColors.swift` が Ivory & Gold テーマに準拠している
- [ ] **Primary (#B8942F)** が製品タイトル、アクセント、CTA に使用されている
- [ ] **Background (#FAF8F5)** がメイン背景に使用されている
- [ ] AccentColor が Gold (#B8942F) に設定されている（Asset Catalog）
- [ ] `.tint(InsightColors.primary)` がルートビューに適用されている
- [ ] **iOS デフォルトの Blue tint が上書きされている**
- [ ] ハードコードされた色がない（InsightColors 経由）
- [ ] カードは白背景 + cornerRadius: 12
- [ ] テキストは Stone 系の暖色（InsightColors.textPrimary / textSecondary）

### テーマ

- [ ] `InsightTypography.swift` が標準定義に準拠
- [ ] `InsightTheme.swift` が共通修飾子を提供
- [ ] San Francisco フォント使用（カスタムフォント不使用）

### プロジェクト構造

- [ ] Bundle ID が `com.harmonic.insight.<appname>` 形式
- [ ] プロジェクトフォルダ構造が標準に準拠（§4）
- [ ] `APP_SPEC.md` が存在

### ビルド・署名

- [ ] iOS Deployment Target = 17.0
- [ ] Swift Language Version = 6.0
- [ ] Strict Concurrency Checking = Complete
- [ ] Development Team が設定されている
- [ ] Automatic Signing が有効（開発環境）

### 依存管理

- [ ] Swift Package Manager のみ使用（CocoaPods / Carthage 不使用）
- [ ] パッケージバージョンが `.upToNextMajor` で固定されている

### 多言語（`standards/LOCALIZATION.md` 参照）

- [ ] `Localizable.xcstrings`（String Catalog）が存在
- [ ] Development Language が `ja`（日本語）
- [ ] 英語ローカライゼーションが追加されている
- [ ] `InfoPlist.xcstrings` で権限説明文がローカライズされている
- [ ] SwiftUI 内に文字列のハードコードがない
- [ ] App Store リリース時: メタデータ（名前・サブタイトル・説明・キーワード）が日英で用意されている

### プライバシー・権限

- [ ] 使用する権限のみ Info.plist に宣言されている
- [ ] Usage Description が日本語で記載されている
- [ ] iPad 全画面方向がサポートされている（§9.2）
- [ ] App Privacy（データ収集宣言）が App Store Connect で設定されている

### CI/CD

- [ ] `.github/workflows/build.yml` が標準テンプレートに準拠
- [ ] `macos-15` ランナーを使用
- [ ] `submodules: true` が設定されている（insight-common 使用時）
- [ ] Simulator ビルドが成功する
- [ ] テストが実行される
- [ ] `v*` タグで GitHub Release が自動作成される

### ライセンス（Insight Business Suite 製品のみ）

- [ ] `LicenseManager` クラスが実装されている
- [ ] ライセンスキー形式: `{製品コード}-{プラン}-{YYMM}-XXXX-XXXX-XXXX`
- [ ] ライセンス画面が Insight Slides 形式に準拠
- [ ] ライセンス保存: UserDefaults または Keychain

### App Store 提出

- [ ] アプリアイコン 1024x1024（アルファチャンネルなし）
- [ ] スクリーンショットが日英で用意されている
- [ ] メタデータ（名前・説明・キーワード）が日英で用意されている
- [ ] プライバシーポリシー URL が設定されている
- [ ] 年齢制限レーティングが適切に設定されている
- [ ] Archive ビルドが成功する
- [ ] App Store Connect にアップロード可能

### 製品コード

- [ ] 製品コードが `config/products.ts` に登録されている
- [ ] `CLAUDE.md` の製品コード一覧に追加されている

---

## 参考

- **ブランドカラー定義**: `brand/colors.json`
- **デザインシステム**: `brand/design-system.json`
- **ローカライゼーション**: `standards/LOCALIZATION.md`
- **AI アシスタント**: `standards/AI_ASSISTANT.md`
- **リリースチェックリスト**: `standards/RELEASE_CHECKLIST.md`
- **Android → iOS 移行ガイド**: `docs/android-to-ios-migration.md`
- **iOS 市場調査**: `docs/ios-market-research-2026.md`
- **CLAUDE.md**: プロジェクト全体のガイドライン
