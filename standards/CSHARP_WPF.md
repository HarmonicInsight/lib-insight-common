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

## UI レイアウト標準

### 標準レイアウト: 縦型サイドバー

```
┌─────────────────────────────────────────────────────────┐
│  [ロゴ] Insight                                          │
│         {製品名}                                         │
├────────────┬────────────────────────────────────────────┤
│            │                                             │
│  🏠 ホーム  │                                             │
│  📋 機能1   │           メインコンテンツ                   │
│  🔄 機能2   │                                             │
│  📊 機能3   │                                             │
│            │                                             │
│  ────────  │                                             │
│  🔑 ライセンス │                                          │
│            │                                             │
│  v1.0.0    │                                             │
└────────────┴────────────────────────────────────────────┘
     260px              残り全幅
```

### レイアウト仕様

| 項目 | 値 |
|-----|-----|
| サイドバー幅 | **260px** 固定 |
| サイドバー背景 | `BgSecondaryBrush` (#F3F0EB) |
| メインコンテンツ背景 | `BgPrimaryBrush` (#FAF8F5) |
| 区切り線 | `BorderBrush` (#E7E2DA) 1px |

### メニュー配置ルール

1. **ロゴセクション**（上部）
   - 「Insight」ロゴ（Gold 色）
   - 製品名サブタイトル

2. **機能メニュー**（中央）
   - ホーム（常に最初）
   - 製品固有の機能メニュー
   - アイコン + ラベル形式

3. **ライセンスメニュー**（下部固定）
   - 🔑 ライセンス
   - **必ずメニューの最下部に配置**

4. **バージョン表示**（最下部）
   - `v{メジャー}.{マイナー}.{パッチ}`

### MainWindow.xaml テンプレート

```xml
<Window x:Class="YourApp.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Insight {製品名}" Height="720" Width="1280"
        Background="{StaticResource BgPrimaryBrush}">

    <Grid>
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="260"/>  <!-- サイドバー固定幅 -->
            <ColumnDefinition Width="*"/>    <!-- メインコンテンツ -->
        </Grid.ColumnDefinitions>

        <!-- サイドバー -->
        <Border Grid.Column="0"
                Background="{StaticResource BgSecondaryBrush}"
                BorderBrush="{StaticResource BorderBrush}"
                BorderThickness="0,0,1,0">
            <Grid>
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/>  <!-- ロゴ -->
                    <RowDefinition Height="*"/>     <!-- メニュー -->
                    <RowDefinition Height="Auto"/>  <!-- ライセンス -->
                    <RowDefinition Height="Auto"/>  <!-- バージョン -->
                </Grid.RowDefinitions>

                <!-- ロゴセクション -->
                <StackPanel Grid.Row="0" Margin="20,24,20,16">
                    <TextBlock Text="Insight"
                               FontSize="24" FontWeight="Bold"
                               Foreground="{StaticResource PrimaryBrush}"/>
                    <TextBlock Text="{製品名}"
                               FontSize="14"
                               Foreground="{StaticResource TextSecondaryBrush}"/>
                </StackPanel>

                <!-- 機能メニュー -->
                <ItemsControl Grid.Row="1"
                              ItemsSource="{Binding MenuItems}"
                              Margin="8,0">
                    <ItemsControl.ItemTemplate>
                        <DataTemplate>
                            <RadioButton Style="{StaticResource SidebarMenuItemStyle}"
                                         Command="{Binding DataContext.NavigateCommand,
                                                   RelativeSource={RelativeSource AncestorType=Window}}"
                                         CommandParameter="{Binding ModuleType}">
                                <StackPanel Orientation="Horizontal">
                                    <TextBlock Text="{Binding Icon}" Width="24"/>
                                    <TextBlock Text="{Binding Label}"/>
                                </StackPanel>
                            </RadioButton>
                        </DataTemplate>
                    </ItemsControl.ItemTemplate>
                </ItemsControl>

                <!-- ライセンスメニュー（固定位置） -->
                <Border Grid.Row="2" Margin="8,8">
                    <RadioButton Style="{StaticResource SidebarMenuItemStyle}"
                                 Command="{Binding NavigateToLicenseCommand}">
                        <StackPanel Orientation="Horizontal">
                            <TextBlock Text="🔑" Width="24"/>
                            <TextBlock Text="ライセンス"/>
                        </StackPanel>
                    </RadioButton>
                </Border>

                <!-- バージョン表示 -->
                <TextBlock Grid.Row="3"
                           Text="v1.0.0"
                           FontSize="12"
                           Foreground="{StaticResource TextTertiaryBrush}"
                           Margin="20,8,20,16"/>
            </Grid>
        </Border>

        <!-- メインコンテンツ -->
        <ContentControl Grid.Column="1"
                        Content="{Binding CurrentView}"
                        Margin="24"/>
    </Grid>
</Window>
```

### Styles.xaml メニュースタイル

```xml
<!-- サイドバーメニュー項目スタイル -->
<Style x:Key="SidebarMenuItemStyle" TargetType="RadioButton">
    <Setter Property="Background" Value="Transparent"/>
    <Setter Property="Foreground" Value="{StaticResource TextPrimaryBrush}"/>
    <Setter Property="Padding" Value="16,12"/>
    <Setter Property="Margin" Value="0,2"/>
    <Setter Property="Cursor" Value="Hand"/>
    <Setter Property="Template">
        <Setter.Value>
            <ControlTemplate TargetType="RadioButton">
                <Border x:Name="border"
                        Background="{TemplateBinding Background}"
                        CornerRadius="8"
                        Padding="{TemplateBinding Padding}">
                    <ContentPresenter/>
                </Border>
                <ControlTemplate.Triggers>
                    <Trigger Property="IsMouseOver" Value="True">
                        <Setter TargetName="border" Property="Background"
                                Value="{StaticResource BgHoverBrush}"/>
                    </Trigger>
                    <Trigger Property="IsChecked" Value="True">
                        <Setter TargetName="border" Property="Background"
                                Value="{StaticResource PrimaryLightBrush}"/>
                    </Trigger>
                </ControlTemplate.Triggers>
            </ControlTemplate>
        </Setter.Value>
    </Setter>
</Style>
```

---

## 必須チェックリスト

### レイアウト（UI構造）

- [ ] **縦型サイドバー**（260px 固定幅）を使用している
- [ ] サイドバー上部に **Insight ロゴ**（Gold 色）がある
- [ ] サイドバー最下部に **ライセンスメニュー** がある
- [ ] バージョン表示がサイドバー最下部にある
- [ ] メインコンテンツは ContentControl で切り替え

### デザイン（トンマナ）

- [ ] **Colors.xaml** が Ivory & Gold テーマに準拠している
- [ ] **Primary (#B8942F)** が製品タイトル、アクセントに使用されている
- [ ] **Background (#FAF8F5)** がメイン背景に使用されている
- [ ] **ハードコードされた色がない**（全て StaticResource 経由）
- [ ] **青色 (#2563EB)** がプライマリとして使用されて**いない**
- [ ] カードは白背景 + CornerRadius: 12
- [ ] テキストは Stone 系の暖色（#1C1917, #57534E）
- [ ] サイドバー背景は `BgSecondaryBrush` (#F3F0EB)

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

## ボタンスタイル

### プライマリボタン（Gold）

```xml
<Style x:Key="PrimaryButtonStyle" TargetType="Button">
    <Setter Property="Background" Value="{StaticResource PrimaryBrush}"/>
    <Setter Property="Foreground" Value="White"/>
    <Setter Property="Padding" Value="24,12"/>
    <Setter Property="FontWeight" Value="SemiBold"/>
    <Setter Property="Cursor" Value="Hand"/>
    <Setter Property="Template">
        <Setter.Value>
            <ControlTemplate TargetType="Button">
                <Border x:Name="border"
                        Background="{TemplateBinding Background}"
                        CornerRadius="8"
                        Padding="{TemplateBinding Padding}">
                    <ContentPresenter HorizontalAlignment="Center"
                                      VerticalAlignment="Center"/>
                </Border>
                <ControlTemplate.Triggers>
                    <Trigger Property="IsMouseOver" Value="True">
                        <Setter TargetName="border" Property="Background"
                                Value="{StaticResource PrimaryHoverBrush}"/>
                    </Trigger>
                    <Trigger Property="IsEnabled" Value="False">
                        <Setter TargetName="border" Property="Opacity" Value="0.5"/>
                    </Trigger>
                </ControlTemplate.Triggers>
            </ControlTemplate>
        </Setter.Value>
    </Setter>
</Style>
```

### セカンダリボタン（アウトライン）

```xml
<Style x:Key="SecondaryButtonStyle" TargetType="Button">
    <Setter Property="Background" Value="Transparent"/>
    <Setter Property="Foreground" Value="{StaticResource TextPrimaryBrush}"/>
    <Setter Property="BorderBrush" Value="{StaticResource BorderBrush}"/>
    <Setter Property="BorderThickness" Value="1"/>
    <Setter Property="Padding" Value="24,12"/>
    <Setter Property="Cursor" Value="Hand"/>
    <Setter Property="Template">
        <Setter.Value>
            <ControlTemplate TargetType="Button">
                <Border x:Name="border"
                        Background="{TemplateBinding Background}"
                        BorderBrush="{TemplateBinding BorderBrush}"
                        BorderThickness="{TemplateBinding BorderThickness}"
                        CornerRadius="8"
                        Padding="{TemplateBinding Padding}">
                    <ContentPresenter HorizontalAlignment="Center"
                                      VerticalAlignment="Center"/>
                </Border>
                <ControlTemplate.Triggers>
                    <Trigger Property="IsMouseOver" Value="True">
                        <Setter TargetName="border" Property="Background"
                                Value="{StaticResource BgHoverBrush}"/>
                    </Trigger>
                </ControlTemplate.Triggers>
            </ControlTemplate>
        </Setter.Value>
    </Setter>
</Style>
```

---

## ファイルテンプレート

### MenuItem.cs（メニュー項目モデル）

```csharp
namespace YourApp.Models;

public record MenuItem
{
    public required ModuleType ModuleType { get; init; }
    public required string Label { get; init; }
    public required string Icon { get; init; }
    public string? RequiredLicense { get; init; }  // "rpa", "lowcode" など
}

public enum ModuleType
{
    Home,
    // 製品固有の機能...
    License  // 必ず最後
}
```

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
