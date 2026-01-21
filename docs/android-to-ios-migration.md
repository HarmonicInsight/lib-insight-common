# Android → iOS (Swift/SwiftUI) 移行手順書

> Android (Kotlin/Jetpack Compose) アプリを iOS (Swift/SwiftUI) に移植する手順と注意点

## 1. プロジェクト構造の作成

### 必要なフォルダ構成

```
ProjectName/
├── ProjectName.xcodeproj/
├── ProjectName/
│   ├── ProjectNameApp.swift      # エントリーポイント
│   ├── ContentView.swift         # メインビュー
│   ├── Info.plist                # アプリ設定
│   ├── Assets.xcassets/          # アセット
│   │   ├── AppIcon.appiconset/
│   │   └── AccentColor.colorset/
│   ├── Models/                   # データモデル
│   ├── Views/
│   │   ├── Screens/              # 画面
│   │   └── Components/           # UIコンポーネント
│   └── Sensor/                   # センサー等のマネージャー
└── README.md
```

### 注意点

- ソースファイルは必ず `ProjectName/` サブフォルダ内に配置
- Xcodeプロジェクトのファイル参照と実際のフォルダ構造を一致させる

## 2. 技術スタックの対応表

| Android | iOS |
|---------|-----|
| Jetpack Compose | SwiftUI |
| Room Database | SwiftData |
| ViewModel | @Observable / @StateObject |
| SensorManager | CoreMotion |
| SharedPreferences | UserDefaults / @AppStorage |
| Coroutines | async/await |

## 3. SwiftData設定（データ永続化）

### 重要: ModelContainerの設定

`ProjectNameApp.swift` で必ず設定:

```swift
import SwiftUI
import SwiftData

@main
struct ProjectNameApp: App {
    var sharedModelContainer: ModelContainer = {
        let schema = Schema([YourModel.self])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        do {
            return try ModelContainer(for: schema, configurations: [config])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some SwiftUI.Scene {  // ← SwiftUI.Scene と明示！
        WindowGroup {
            ContentView()
        }
        .modelContainer(sharedModelContainer)
    }
}
```

### 名前衝突の回避

- `Scene` という名前のenumを作ると、SwiftUIの`Scene`プロトコルと衝突
- 解決策: `UsageScene` などにリネーム、または `SwiftUI.Scene` と明示

## 4. App Store提出前の必須チェック

### Info.plist設定

iPad全画面方向サポート（必須）:

```xml
<key>UISupportedInterfaceOrientations~ipad</key>
<array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationPortraitUpsideDown</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
</array>
```

### アプリアイコン

透明度（アルファチャンネル）は禁止。白背景で作成するか、アルファを削除:

```python
from PIL import Image

img = Image.open("icon.png")
background = Image.new('RGB', img.size, (255, 255, 255))
background.paste(img, mask=img.split()[3])
background.save("icon.png")
```

### App Store Connect

- アップロード前にアプリを登録する（新規App作成）
- Bundle IDを一致させる

## 5. ビルド・デプロイ手順

### ローカルビルド確認

```bash
# 利用可能なシミュレータ確認
xcrun simctl list devices available

# ビルド
xcodebuild -project ProjectName.xcodeproj \
  -scheme ProjectName \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  build
```

### エラー詳細確認

```bash
xcodebuild ... 2>&1 | grep -A 5 "error:"
```

### TestFlightアップロード

1. Xcode → Product → Archive
2. Distribute App → App Store Connect
3. Upload

## 6. よくあるエラーと解決策

| エラー | 原因 | 解決策 |
|-------|------|--------|
| Type does not conform to protocol 'App' | Scene名前衝突 | SwiftUI.Sceneと明示 or enumリネーム |
| some Scene type error | 同上 | 同上 |
| Supported platforms empty | スキーム設定不備 | Xcodeで直接開いて確認 |
| iPad orientations error | Info.plist不足 | 4方向すべて追加 |
| App icon alpha channel | 透明度あり | 白背景で再作成 |
| DistributionAppRecordProviderError | App Store未登録 | App Store Connectでアプリ作成 |
| 履歴が動かない | ModelContainer未設定 | App.swiftで設定 |

## 7. Git管理のポイント

### サブツリー分割（モノレポの場合）

```bash
# ios-appフォルダを別リポジトリにプッシュ
git subtree push --prefix=ios-app \
  https://TOKEN@github.com/org/ios-repo.git main
```

### ローカル変更の破棄

```bash
git checkout -- . && git pull origin main
```

## 8. チェックリスト

### 開発開始時

- [ ] Xcodeプロジェクト作成（正しいBundle ID）
- [ ] フォルダ構造を `ProjectName/` サブフォルダに
- [ ] SwiftData ModelContainer設定
- [ ] Scene名前衝突を確認

### 提出前

- [ ] iPad全方向サポート（Info.plist）
- [ ] アプリアイコン透明度削除
- [ ] App Store Connectでアプリ登録
- [ ] シミュレータでビルド確認
- [ ] 実機でテスト

### TestFlight後

- [ ] 履歴機能動作確認
- [ ] センサー動作確認
- [ ] UI/UXの確認（背景色等）

---

この手順に従えば、Android → iOS 移植を効率的に進められます。
