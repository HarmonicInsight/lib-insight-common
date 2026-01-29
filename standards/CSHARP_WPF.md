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

### 標準レイアウト: カスタムトップバー

**Windows標準タイトルバーは使用しない**（安っぽく見えるため）

```
┌─────────────────────────────────────────────────────────────────┐
│ Insight {製品名}  v1.0.0  ● FREE    [⚙設定] [🔑ライセンス] [─][□][×] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 機能ボタン / タブ / アクションエリア                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│                     メインコンテンツエリア                        │
│                                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### レイアウト仕様

| 項目 | 値 |
|-----|-----|
| ウィンドウスタイル | `WindowStyle="None"` |
| タイトルバー高さ | **48px** |
| タイトルバー背景 | `BgSecondaryBrush` (#F3F0EB) |
| メインコンテンツ背景 | `BgPrimaryBrush` (#FAF8F5) |
| ウィンドウ枠線 | `BorderBrush` (#E7E2DA) 1px |
| 角丸 | CornerRadius: 8 (Windows 11対応) |

### タイトルバー配置ルール

**左側（必須）:**
1. 製品ロゴ/名前: `Insight {製品名}` (Gold 色)
2. バージョン: `v1.0.0` (薄いグレー)
3. プランバッジ: `● FREE` / `● STD` など

**右側（必須）:**
1. 設定ボタン（オプション）: `⚙ 設定`
2. ライセンスボタン: `🔑 ライセンス`
3. ウィンドウコントロール: 最小化 / 最大化 / 閉じる

### MainWindow.xaml テンプレート

```xml
<Window x:Class="YourApp.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Insight {製品名}"
        Height="720" Width="1280"
        WindowStyle="None"
        AllowsTransparency="True"
        Background="Transparent"
        ResizeMode="CanResizeWithGrip">

    <Border Background="{StaticResource BgPrimaryBrush}"
            BorderBrush="{StaticResource BorderBrush}"
            BorderThickness="1"
            CornerRadius="8">
        <Grid>
            <Grid.RowDefinitions>
                <RowDefinition Height="48"/>  <!-- タイトルバー -->
                <RowDefinition Height="*"/>   <!-- コンテンツ -->
            </Grid.RowDefinitions>

            <!-- カスタムタイトルバー -->
            <Border Grid.Row="0"
                    Background="{StaticResource BgSecondaryBrush}"
                    CornerRadius="8,8,0,0"
                    MouseLeftButtonDown="TitleBar_MouseLeftButtonDown">
                <Grid>
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="*"/>    <!-- 左: ロゴ・バージョン -->
                        <ColumnDefinition Width="Auto"/> <!-- 右: ボタン群 -->
                    </Grid.ColumnDefinitions>

                    <!-- 左側: ロゴ・バージョン・プラン -->
                    <StackPanel Grid.Column="0"
                                Orientation="Horizontal"
                                VerticalAlignment="Center"
                                Margin="16,0">
                        <!-- 製品名 -->
                        <TextBlock Text="Insight {製品名}"
                                   FontSize="16" FontWeight="SemiBold"
                                   Foreground="{StaticResource PrimaryBrush}"/>
                        <!-- バージョン -->
                        <TextBlock Text="v1.0.0"
                                   FontSize="12"
                                   Foreground="{StaticResource TextTertiaryBrush}"
                                   VerticalAlignment="Center"
                                   Margin="12,0,0,0"/>
                        <!-- プランバッジ -->
                        <Border Background="{StaticResource PrimaryLightBrush}"
                                CornerRadius="4"
                                Padding="8,2"
                                Margin="12,0,0,0">
                            <TextBlock Text="{Binding CurrentPlan}"
                                       FontSize="11" FontWeight="SemiBold"
                                       Foreground="{StaticResource TextAccentBrush}"/>
                        </Border>
                    </StackPanel>

                    <!-- 右側: ボタン群 -->
                    <StackPanel Grid.Column="1"
                                Orientation="Horizontal"
                                VerticalAlignment="Center">
                        <!-- 設定ボタン（オプション） -->
                        <Button Style="{StaticResource TitleBarButtonStyle}"
                                Command="{Binding OpenSettingsCommand}">
                            <StackPanel Orientation="Horizontal">
                                <TextBlock Text="⚙" Margin="0,0,4,0"/>
                                <TextBlock Text="設定"/>
                            </StackPanel>
                        </Button>
                        <!-- ライセンスボタン -->
                        <Button Style="{StaticResource TitleBarButtonStyle}"
                                Command="{Binding OpenLicenseCommand}"
                                Margin="8,0">
                            <StackPanel Orientation="Horizontal">
                                <TextBlock Text="🔑" Margin="0,0,4,0"/>
                                <TextBlock Text="ライセンス"/>
                            </StackPanel>
                        </Button>
                        <!-- ウィンドウコントロール -->
                        <Button Style="{StaticResource WindowControlButtonStyle}"
                                Click="MinimizeButton_Click">─</Button>
                        <Button Style="{StaticResource WindowControlButtonStyle}"
                                Click="MaximizeButton_Click">□</Button>
                        <Button Style="{StaticResource CloseButtonStyle}"
                                Click="CloseButton_Click">×</Button>
                    </StackPanel>
                </Grid>
            </Border>

            <!-- メインコンテンツ -->
            <ContentControl Grid.Row="1"
                            Content="{Binding CurrentView}"
                            Margin="24"/>
        </Grid>
    </Border>
</Window>
```

### MainWindow.xaml.cs（ウィンドウ操作）

```csharp
private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
{
    if (e.ClickCount == 2)
        MaximizeButton_Click(sender, e);
    else
        DragMove();
}

private void MinimizeButton_Click(object sender, RoutedEventArgs e)
    => WindowState = WindowState.Minimized;

private void MaximizeButton_Click(object sender, RoutedEventArgs e)
    => WindowState = WindowState == WindowState.Maximized
        ? WindowState.Normal
        : WindowState.Maximized;

private void CloseButton_Click(object sender, RoutedEventArgs e)
    => Close();
```

### Styles.xaml タイトルバースタイル

```xml
<!-- タイトルバーボタン -->
<Style x:Key="TitleBarButtonStyle" TargetType="Button">
    <Setter Property="Background" Value="Transparent"/>
    <Setter Property="Foreground" Value="{StaticResource TextPrimaryBrush}"/>
    <Setter Property="BorderBrush" Value="{StaticResource BorderBrush}"/>
    <Setter Property="BorderThickness" Value="1"/>
    <Setter Property="Padding" Value="12,6"/>
    <Setter Property="Cursor" Value="Hand"/>
    <Setter Property="Template">
        <Setter.Value>
            <ControlTemplate TargetType="Button">
                <Border x:Name="border"
                        Background="{TemplateBinding Background}"
                        BorderBrush="{TemplateBinding BorderBrush}"
                        BorderThickness="{TemplateBinding BorderThickness}"
                        CornerRadius="6"
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

<!-- ウィンドウコントロールボタン -->
<Style x:Key="WindowControlButtonStyle" TargetType="Button">
    <Setter Property="Width" Value="46"/>
    <Setter Property="Height" Value="32"/>
    <Setter Property="Background" Value="Transparent"/>
    <Setter Property="Foreground" Value="{StaticResource TextSecondaryBrush}"/>
    <Setter Property="BorderThickness" Value="0"/>
    <Setter Property="FontSize" Value="14"/>
    <Setter Property="Template">
        <Setter.Value>
            <ControlTemplate TargetType="Button">
                <Border x:Name="border"
                        Background="{TemplateBinding Background}">
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

<!-- 閉じるボタン（赤ホバー） -->
<Style x:Key="CloseButtonStyle" TargetType="Button"
       BasedOn="{StaticResource WindowControlButtonStyle}">
    <Style.Triggers>
        <Trigger Property="IsMouseOver" Value="True">
            <Setter Property="Background" Value="#DC2626"/>
            <Setter Property="Foreground" Value="White"/>
        </Trigger>
    </Style.Triggers>
</Style>
```

### 例外: 作業画面特化アプリ

以下のアプリは作業画面が中心のため、例外として独自レイアウトを許可：
- **InsightMovie**: タイムライン・プレビューが主体のため、ツールバー形式を維持
- **InsightSlides**: ファイル操作・編集が主体のため、左サイドバー+右コンテンツ形式を維持

**ただし例外アプリでも以下は必須:**
- ライセンスボタンは右上に配置
- Ivory & Gold カラーテーマを使用
- プランバッジを表示

---

## 必須チェックリスト

### レイアウト（UI構造）

- [ ] **WindowStyle="None"** でカスタムタイトルバーを使用
- [ ] タイトルバー左側に **Insight {製品名}**（Gold 色）がある
- [ ] タイトルバー左側に **バージョン** と **プランバッジ** がある
- [ ] タイトルバー右側に **ライセンスボタン** がある
- [ ] ウィンドウコントロール（最小化/最大化/閉じる）がある
- [ ] タイトルバーでドラッグ移動できる
- [ ] ウィンドウ枠線が `BorderBrush` (#E7E2DA) 1px

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
