# C# (WPF) 開発標準

> Windows デスクトップアプリ開発時の必須チェックリスト

## 開発開始時チェックリスト

### 1. プロジェクト構成

```
YourApp/
├── Themes/
│   ├── Colors.xaml          # 必須: Ivory & Gold カラー定義
│   └── Styles.xaml           # 必須: 共通スタイル
├── License/
│   ├── PlanCode.cs           # 必須: プラン列挙型
│   ├── LicenseInfo.cs        # 必須: ライセンス情報クラス
│   └── InsightLicenseManager.cs  # 必須: ライセンス管理
├── Views/
│   └── LicenseView.xaml      # 必須: ライセンス画面
├── ViewModels/
│   └── LicenseViewModel.cs   # 必須: ライセンスVM
└── App.xaml                   # ResourceDictionary登録
```

### 2. Colors.xaml テンプレート

```xml
<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">

    <!-- === Background (Ivory) === -->
    <Color x:Key="BgPrimaryColor">#FAF8F5</Color>
    <Color x:Key="BgSecondaryColor">#F3F0EB</Color>
    <Color x:Key="BgCardColor">#FFFFFF</Color>
    <Color x:Key="BgHoverColor">#EEEBE5</Color>

    <!-- === Brand Primary (Gold) === -->
    <Color x:Key="PrimaryColor">#B8942F</Color>
    <Color x:Key="PrimaryHoverColor">#8C711E</Color>
    <Color x:Key="PrimaryLightColor">#F0E6C8</Color>

    <!-- === Semantic === -->
    <Color x:Key="SuccessColor">#16A34A</Color>
    <Color x:Key="WarningColor">#CA8A04</Color>
    <Color x:Key="ErrorColor">#DC2626</Color>
    <Color x:Key="InfoColor">#2563EB</Color>

    <!-- === Text === -->
    <Color x:Key="TextPrimaryColor">#1C1917</Color>
    <Color x:Key="TextSecondaryColor">#57534E</Color>
    <Color x:Key="TextTertiaryColor">#A8A29E</Color>
    <Color x:Key="TextAccentColor">#8C711E</Color>

    <!-- === Border === -->
    <Color x:Key="BorderColor">#E7E2DA</Color>
    <Color x:Key="BorderLightColor">#F3F0EB</Color>

    <!-- === Brushes === -->
    <SolidColorBrush x:Key="BgPrimaryBrush" Color="{StaticResource BgPrimaryColor}"/>
    <SolidColorBrush x:Key="BgCardBrush" Color="{StaticResource BgCardColor}"/>
    <SolidColorBrush x:Key="PrimaryBrush" Color="{StaticResource PrimaryColor}"/>
    <SolidColorBrush x:Key="TextPrimaryBrush" Color="{StaticResource TextPrimaryColor}"/>
    <SolidColorBrush x:Key="TextSecondaryBrush" Color="{StaticResource TextSecondaryColor}"/>
    <SolidColorBrush x:Key="BorderBrush" Color="{StaticResource BorderColor}"/>
    <!-- ... 他のBrush定義 ... -->

</ResourceDictionary>
```

### 3. App.xaml への登録

```xml
<Application.Resources>
    <ResourceDictionary>
        <ResourceDictionary.MergedDictionaries>
            <ResourceDictionary Source="Themes/Colors.xaml"/>
            <ResourceDictionary Source="Themes/Styles.xaml"/>
        </ResourceDictionary.MergedDictionaries>
    </ResourceDictionary>
</Application.Resources>
```

---

## 必須チェックリスト

### デザイン（トンマナ）

- [ ] **Colors.xaml** が Ivory & Gold テーマに準拠している
- [ ] **Primary (#B8942F)** が製品タイトル、アクセントに使用されている
- [ ] **Background (#FAF8F5)** がメイン背景に使用されている
- [ ] **ハードコードされた色がない**（全て StaticResource 経由）
- [ ] **青色 (#2563EB)** がプライマリとして使用されて**いない**
- [ ] カードは白背景 + border-radius: 12px
- [ ] テキストは Stone 系の暖色（#1C1917, #57534E）

### ライセンス

- [ ] **InsightLicenseManager** クラスが実装されている
- [ ] ライセンスキー形式: `{製品コード}-{プラン}-{YYMM}-XXXX-XXXX-XXXX`
- [ ] **LicenseView** が Insight Slides 形式に準拠
  - [ ] 製品名が中央に Gold 色で表示
  - [ ] 現在のプランが大きく中央に表示
  - [ ] 機能一覧セクションがある
  - [ ] ライセンス認証セクション（メール + キー入力）
  - [ ] アクティベート / クリア ボタン
- [ ] ライセンス保存先: `%APPDATA%/HarmonicInsight/{製品名}/license.json`
- [ ] HMAC-SHA256 署名検証が実装されている

### 製品コード

- [ ] 製品コードが `config/products.ts` に登録されている
- [ ] `CLAUDE.md` の製品コード一覧に追加されている

### コンバーター（該当する場合）

- [ ] 色を返すコンバーターが Design System に準拠
  - Success: #16A34A
  - Warning: #CA8A04
  - Error: #DC2626
  - Info: #2563EB

---

## ファイルテンプレート

### PlanCode.cs

```csharp
namespace YourApp.License;

public enum PlanCode
{
    Free,
    Trial,
    Std,
    Pro,
    Ent
}

public static class PlanCodeExtensions
{
    public static string ToDisplayName(this PlanCode plan) => plan switch
    {
        PlanCode.Free => "FREE",
        PlanCode.Trial => "TRIAL",
        PlanCode.Std => "STD",
        PlanCode.Pro => "PRO",
        PlanCode.Ent => "ENT",
        _ => "FREE"
    };
}
```

### InsightLicenseManager.cs（簡略版）

```csharp
namespace YourApp.License;

public class InsightLicenseManager
{
    private static readonly Regex KeyPattern = new(
        @"^(XXXX)-(TRIAL|STD|PRO)-(\\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$",
        RegexOptions.Compiled);

    private readonly string _productCode;
    private readonly string _storagePath;

    public InsightLicenseManager(string productCode, string appName)
    {
        _productCode = productCode;
        _storagePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "HarmonicInsight", appName, "license.json");
        LoadLicense();
    }

    public LicenseInfo CurrentLicense { get; private set; } = LicenseInfo.Free();
    public bool IsActivated => CurrentLicense.Plan != PlanCode.Free && CurrentLicense.IsValid;

    public (bool Success, string Message) Activate(string email, string key)
    {
        // キー検証・保存ロジック
    }

    public void Deactivate()
    {
        // ライセンス解除ロジック
    }
}
```

---

## よくある間違い

### ❌ 間違い: Blue をプライマリに使用

```xml
<!-- 間違い -->
<Color x:Key="PrimaryColor">#2563EB</Color>
```

### ✅ 正しい: Gold をプライマリに使用

```xml
<!-- 正しい -->
<Color x:Key="PrimaryColor">#B8942F</Color>
```

### ❌ 間違い: ハードコードされた色

```xml
<!-- 間違い -->
<TextBlock Foreground="#1C1917"/>
```

### ✅ 正しい: StaticResource を使用

```xml
<!-- 正しい -->
<TextBlock Foreground="{StaticResource TextPrimaryBrush}"/>
```

---

## 参考実装

- **InsightNoCodeAnalyzer**: `app-nocode-analyzer-C` リポジトリ
- **InsightSlide**: ライセンス画面のリファレンス実装
