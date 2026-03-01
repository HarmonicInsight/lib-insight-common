---
name: wpf
description: C# WPF Windows デスクトップアプリの開発標準。.cs、.xaml、.csproj ファイルの作業時に自動適用。MVVM、Colors.xaml、ライセンス画面、Syncfusion 統合のパターンを提供。
allowed-tools: Read, Grep, Glob, Bash
---

# C# WPF 開発標準

対象製品: IOSH (Insight Performance Management), INSS (Insight Deck Quality Gate), IOSD (Insight AI Doc Factory), INBT (InsightBot)

## プロジェクト構成（必須）

```
YourApp/
├── Themes/
│   ├── Colors.xaml           # Ivory & Gold カラー定義
│   └── Styles.xaml           # 共通スタイル
├── License/
│   ├── PlanCode.cs           # TRIAL/STD/PRO/ENT 列挙型
│   ├── LicenseInfo.cs        # ライセンス情報クラス
│   └── InsightLicenseManager.cs
├── Views/
│   └── LicenseView.xaml      # ライセンス画面（Insight Slides 形式）
├── ViewModels/
│   └── LicenseViewModel.cs
└── App.xaml                  # ResourceDictionary 登録
```

## 必須: Colors.xaml

```xml
<ResourceDictionary>
    <Color x:Key="BgPrimaryColor">#FAF8F5</Color>
    <Color x:Key="PrimaryColor">#B8942F</Color>
    <Color x:Key="PrimaryHoverColor">#8C711E</Color>
    <Color x:Key="TextPrimaryColor">#1C1917</Color>
    <Color x:Key="TextSecondaryColor">#57534E</Color>
    <Color x:Key="BorderColor">#E7E2DA</Color>
    <Color x:Key="SuccessColor">#16A34A</Color>
    <Color x:Key="WarningColor">#CA8A04</Color>
    <Color x:Key="ErrorColor">#DC2626</Color>

    <SolidColorBrush x:Key="BgPrimaryBrush" Color="{StaticResource BgPrimaryColor}"/>
    <SolidColorBrush x:Key="PrimaryBrush" Color="{StaticResource PrimaryColor}"/>
    <SolidColorBrush x:Key="TextPrimaryBrush" Color="{StaticResource TextPrimaryColor}"/>
</ResourceDictionary>
```

## 必須: Syncfusion ライセンス登録

```csharp
// App.xaml.cs の OnStartup 冒頭
var licenseKey = Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE_KEY");
if (string.IsNullOrEmpty(licenseKey))
    licenseKey = ThirdPartyLicenses.GetSyncfusionKey();  // third-party-licenses.json から
Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(licenseKey);
```

## 必須: ライセンス画面レイアウト

```
┌────────────────────────────────────┐
│      製品名（Gold色、中央）          │
│         現在のプラン: STD            │
│     有効期限: 2027年01月31日         │
│  ┌──────────────────────────────┐  │
│  │ 機能一覧                      │  │
│  │ • 機能1          ○利用可能    │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ メールアドレス: [          ]   │  │
│  │ ライセンスキー: [          ]   │  │
│  │ [アクティベート] [クリア]      │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

## MVVM パターン

- `CommunityToolkit.Mvvm` 推奨
- ViewModel は `ObservableObject` 継承
- コマンドは `[RelayCommand]` 属性
- View は DataContext バインディング

## プロジェクトファイル（.iosh / .inss / .iosd）

独自拡張子は ZIP 形式:
```
report.iosh
├── document.xlsx       # 元 Office ファイル
├── metadata.json       # バージョン、作成者
├── history/            # バージョン履歴
├── sticky_notes.json   # 付箋データ
└── ai_chat_history.json
```

## 禁止事項

- ハードコード色値（StaticResource を使用）
- 独自の認証実装（Firebase Auth を使用）
- クライアント側権限判定
- サードパーティキーの直書き（third-party-licenses.json 経由）

## 詳細リファレンス

`insight-common/standards/CSHARP_WPF.md` に完全なガイドあり。
