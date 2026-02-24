# C# (WPF) 開発標溁E

> Windows チE��クトップアプリ開発時�E忁E��チェチE��リスチE

## 開発開始時チェチE��リスチE

### 1. プロジェクト構�E

```
YourApp/
├── Themes/
━E  ├── Colors.xaml          # 忁E��E Ivory & Gold カラー定義
━E  └── Styles.xaml           # 忁E��E 共通スタイル
├── License/
━E  ├── PlanCode.cs           # 忁E��E プラン列挙垁E
━E  ├── LicenseInfo.cs        # 忁E��E ライセンス惁E��クラス
━E  └── InsightLicenseManager.cs  # 忁E��E ライセンス管琁E
├── Views/
━E  └── LicenseView.xaml      # 忁E��E ライセンス画面
├── ViewModels/
━E  └── LicenseViewModel.cs   # 忁E��E ライセンスVM
└── App.xaml                   # ResourceDictionary登録
```

### 2. Colors.xaml チE��プレーチE

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
    <!-- ... 他�EBrush定義 ... -->

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

## UI レイアウト標溁E

### 標準レイアウチE カスタムトップバー

**Windows標準タイトルバ�Eは使用しなぁE*�E�安っぽく見えるためE��E

```
┌─────────────────────────────────────────────────────────────────━E
━EInsight {製品名}  v1.0.0  ◁EFREE    [⚙設定] [🔑ライセンス] [─][□][×] ━E
├─────────────────────────────────────────────────────────────────┤
━E                                                                 ━E
━E ┌─────────────────────────────────────────────────────────━E   ━E
━E ━E機�Eボタン / タチE/ アクションエリア                      ━E   ━E
━E └─────────────────────────────────────────────────────────━E   ━E
━E                                                                 ━E
━E                    メインコンチE��チE��リア                        ━E
━E                                                                 ━E
━E                                                                 ━E
└─────────────────────────────────────────────────────────────────━E
```

### レイアウト仕槁E

| 頁E�� | 値 |
|-----|-----|
| ウィンドウスタイル | `WindowStyle="None"` |
| タイトルバ�E高さ | **48px** |
| タイトルバ�E背景 | `BgSecondaryBrush` (#F3F0EB) |
| メインコンチE��チE��景 | `BgPrimaryBrush` (#FAF8F5) |
| ウィンドウ枠緁E| `BorderBrush` (#E7E2DA) 1px |
| 角丸 | CornerRadius: 8 (Windows 11対忁E |

### タイトルバ�E配置ルール

**左側�E�忁E��！E**
1. 製品ロゴ/名前: `Insight {製品名}` (Gold 色)
2. バ�Eジョン: `v1.0.0` (薁E��グレー)
3. プランバッジ: `◁EFREE` / `◁ESTD` など

**右側�E�忁E��！E**
1. 設定�Eタン�E�オプション�E�E `⚁E設定`
2. **言語�Eり替ぁE*: `English` / `日本語`
3. **ライセンスボタン**: `🔑 ライセンス`
4. ウィンドウコントロール: 最小化 / 最大匁E/ 閉じめE

### 言語�Eり替え仕槁E

| 頁E�� | 値 |
|-----|-----|
| 対応言誁E| 日本誁E(ja), English (en) |
| チE��ォルチE| シスチE��言語に従う |
| 保存�E | `%APPDATA%/HarmonicInsight/{製品名}/settings.json` |
| ボタン表示 | 現在の言語�E**反対側**を表示�E�日本語時は「English」）|

### MainWindow.xaml チE��プレーチE

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
                <RowDefinition Height="48"/>  <!-- タイトルバ�E -->
                <RowDefinition Height="*"/>   <!-- コンチE��チE-->
            </Grid.RowDefinitions>

            <!-- カスタムタイトルバ�E -->
            <Border Grid.Row="0"
                    Background="{StaticResource BgSecondaryBrush}"
                    CornerRadius="8,8,0,0"
                    MouseLeftButtonDown="TitleBar_MouseLeftButtonDown">
                <Grid>
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="*"/>    <!-- 左: ロゴ・バ�Eジョン -->
                        <ColumnDefinition Width="Auto"/> <!-- 右: ボタン群 -->
                    </Grid.ColumnDefinitions>

                    <!-- 左側: ロゴ・バ�Eジョン・プラン -->
                    <StackPanel Grid.Column="0"
                                Orientation="Horizontal"
                                VerticalAlignment="Center"
                                Margin="16,0">
                        <!-- 製品名 -->
                        <TextBlock Text="Insight {製品名}"
                                   FontSize="16" FontWeight="SemiBold"
                                   Foreground="{StaticResource PrimaryBrush}"/>
                        <!-- バ�Eジョン -->
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
                        <!-- 設定�Eタン�E�オプション�E�E-->
                        <Button Style="{StaticResource TitleBarButtonStyle}"
                                Command="{Binding OpenSettingsCommand}">
                            <StackPanel Orientation="Horizontal">
                                <TextBlock Text="⚁E Margin="0,0,4,0"/>
                                <TextBlock Text="設宁E/>
                            </StackPanel>
                        </Button>
                        <!-- 言語�Eり替え�Eタン -->
                        <Button Style="{StaticResource TitleBarButtonStyle}"
                                Command="{Binding ToggleLanguageCommand}"
                                Margin="8,0">
                            <TextBlock Text="{Binding LanguageButtonText}"/>
                        </Button>
                        <!-- ライセンスボタン -->
                        <Button Style="{StaticResource TitleBarButtonStyle}"
                                Command="{Binding OpenLicenseCommand}"
                                Margin="8,0">
                            <StackPanel Orientation="Horizontal">
                                <TextBlock Text="🔑" Margin="0,0,4,0"/>
                                <TextBlock Text="{Binding LicenseButtonText}"/>
                            </StackPanel>
                        </Button>
                        <!-- ウィンドウコントロール -->
                        <Button Style="{StaticResource WindowControlButtonStyle}"
                                Click="MinimizeButton_Click">─</Button>
                        <Button Style="{StaticResource WindowControlButtonStyle}"
                                Click="MaximizeButton_Click">□</Button>
                        <Button Style="{StaticResource CloseButtonStyle}"
                                Click="CloseButton_Click">ÁE/Button>
                    </StackPanel>
                </Grid>
            </Border>

            <!-- メインコンチE��チE-->
            <ContentControl Grid.Row="1"
                            Content="{Binding CurrentView}"
                            Margin="24"/>
        </Grid>
    </Border>
</Window>
```

### MainWindow.xaml.cs�E�ウィンドウ操作！E

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

### Styles.xaml タイトルバ�Eスタイル

```xml
<!-- タイトルバ�Eボタン -->
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

<!-- 閉じる�Eタン�E�赤ホバー�E�E-->
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

### 例夁E 作業画面特化アプリ

以下�Eアプリは作業画面が中忁E�Eため、例外として独自レイアウトを許可�E�E
- **InsightCast**: タイムライン・プレビューが主体�Eため、ツールバ�E形式を維持E
- **InsightSlides**: ファイル操作�E編雁E��主体�Eため、左サイドバー+右コンチE��チE��式を維持E

**ただし例外アプリでも以下�E忁E��E**
- **言語�Eり替え�Eタン**は右上に配置
- **ライセンスボタン**は右上に配置�E�言語�Eり替え�E右隣�E�E
- Ivory & Gold カラーチE�Eマを使用
- プランバッジを表示

---

## 忁E��チェチE��リスチE

### レイアウト！EI構造�E�E

- [ ] **WindowStyle="None"** でカスタムタイトルバ�Eを使用
- [ ] タイトルバ�E左側に **Insight {製品名}**�E�Eold 色�E�がある
- [ ] タイトルバ�E左側に **バ�Eジョン** と **プランバッジ** があめE
- [ ] タイトルバ�E右側に **言語�Eり替え�Eタン** があめE
- [ ] タイトルバ�E右側に **ライセンスボタン** があめE
- [ ] ウィンドウコントロール�E�最小化/最大匁E閉じる）がある
- [ ] タイトルバ�EでドラチE��移動できる
- [ ] ウィンドウ枠線が `BorderBrush` (#E7E2DA) 1px

### 多言語対忁E

- [ ] 日本誁E/ English の刁E��替えが可能
- [ ] 言語設定が `settings.json` に保存される
- [ ] 全ての UI チE��ストがリソースファイルから読み込まれる

### チE��イン�E�トンマナ�E�E

- [ ] **Colors.xaml** ぁEIvory & Gold チE�Eマに準拠してぁE��
- [ ] **Primary (#B8942F)** が製品タイトル、アクセントに使用されてぁE��
- [ ] **Background (#FAF8F5)** がメイン背景に使用されてぁE��
- [ ] **ハ�Eドコードされた色がなぁE*�E��Eて StaticResource 経由�E�E
- [ ] **青色 (#2563EB)** が�Eライマリとして使用されて**ぁE��ぁE*
- [ ] カード�E白背景 + CornerRadius: 12
- [ ] チE��スト�E Stone 系の暖色�E�E1C1917, #57534E�E�E
- [ ] サイドバー背景は `BgSecondaryBrush` (#F3F0EB)

### ライセンス

- [ ] **InsightLicenseManager** クラスが実裁E��れてぁE��
- [ ] ライセンスキー形弁E `{製品コード}-{プラン}-{YYMM}-XXXX-XXXX-XXXX`
- [ ] **LicenseView** ぁEInsight Slides 形式に準拠
  - [ ] 製品名が中央に Gold 色で表示
  - [ ] 現在のプランが大きく中央に表示
  - [ ] 機�E一覧セクションがあめE
  - [ ] ライセンス認証セクション�E�メール + キー入力！E
  - [ ] アクチE��ベ�EチE/ クリア ボタン
- [ ] ライセンス保存�E: `%APPDATA%/HarmonicInsight/{製品名}/license.json`
- [ ] HMAC-SHA256 署名検証が実裁E��れてぁE��

### 製品コーチE

- [ ] 製品コードが `config/products.ts` に登録されてぁE��
- [ ] `CLAUDE.md` の製品コード一覧に追加されてぁE��

### コンバ�Eター�E�該当する場合！E

- [ ] 色を返すコンバ�EターぁEDesign System に準拠
  - Success: #16A34A
  - Warning: #CA8A04
  - Error: #DC2626
  - Info: #2563EB

---

## ボタンスタイル

### プライマリボタン�E�Eold�E�E

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

### セカンダリボタン�E�アウトライン�E�E

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

## ファイルチE��プレーチE

### MenuItem.cs�E�メニュー頁E��モチE���E�E

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
    // 製品固有�E機�E...
    License  // 忁E��最征E
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

### InsightLicenseManager.cs�E�簡略版！E

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
        // キー検証・保存ロジチE��
    }

    public void Deactivate()
    {
        // ライセンス解除ロジチE��
    }
}
```

---

## よくある間違ぁE

### ❁E間違ぁE Blue を�Eライマリに使用

```xml
<!-- 間違ぁE-->
<Color x:Key="PrimaryColor">#2563EB</Color>
```

### ✁E正しい: Gold を�Eライマリに使用

```xml
<!-- 正しい -->
<Color x:Key="PrimaryColor">#B8942F</Color>
```

### ❁E間違ぁE ハ�Eドコードされた色

```xml
<!-- 間違ぁE-->
<TextBlock Foreground="#1C1917"/>
```

### ✁E正しい: StaticResource を使用

```xml
<!-- 正しい -->
<TextBlock Foreground="{StaticResource TextPrimaryBrush}"/>
```

---

## サードパーチE��ライセンス管琁E

Syncfusion 等�EサードパーチE��ライセンスキーは `insight-common/config/third-party-licenses.json` で**全製品�E通管琁E*されてぁE��す。各アプリに直書きしなぁE��ください、E

### Syncfusion コンポ�Eネント�EチE��ング

| 製品E| 用送E| Syncfusion コンポ�EネンチE| NuGet パッケージ |
|------|------|-------------------------|-----------------|
| IOSH | Excel 操佁E| SfSpreadsheet | `Syncfusion.SfSpreadsheet.WPF` |
| IOSD | Word 操佁E| SfRichTextBoxAdv (DocIO) | `Syncfusion.SfRichTextBoxAdv.WPF`, `Syncfusion.DocIO.WPF` |
| INSS | PowerPoint 操佁E| SfPresentation | `Syncfusion.Presentation.WPF` |

### IOSD (InsightOfficeDoc) におけめEDocIO 使用パターン

DocIO は Word 斁E�� (.docx/.doc) の読み書き�E操作を行うライブラリです、EOSD では以下�Eパターンで使用します、E

#### 忁E��ENuGet パッケージ

```xml
<ItemGroup>
    <!-- Word 斁E��表示・編雁EUI -->
    <PackageReference Include="Syncfusion.SfRichTextBoxAdv.WPF" Version="*" />
    <!-- Word 斁E��バックエンド�E琁E��読み書き�E変換�E�E-->
    <PackageReference Include="Syncfusion.DocIO.WPF" Version="*" />
    <!-- ライセンス管琁E���E通！E-->
    <PackageReference Include="Syncfusion.Licensing" Version="*" />
</ItemGroup>
```

#### 基本皁E��使用パターン

```csharp
using Syncfusion.DocIO;
using Syncfusion.DocIO.DLS;
using Syncfusion.Windows.Controls.RichTextBoxAdv;

// === 斁E��の読み込み ===
public WordDocument LoadDocument(string filePath)
{
    using var stream = File.OpenRead(filePath);
    var document = new WordDocument(stream, FormatType.Automatic);
    return document;
}

// === 斁E��の保孁E===
public void SaveDocument(WordDocument document, string filePath, FormatType format = FormatType.Docx)
{
    using var stream = File.Create(filePath);
    document.Save(stream, format);
}

// === SfRichTextBoxAdv への読み込み ===
public void LoadToRichTextBox(SfRichTextBoxAdv richTextBox, string filePath)
{
    using var stream = File.OpenRead(filePath);
    richTextBox.Load(stream, FormatType.Docx);
}

// === SfRichTextBoxAdv から保孁E===
public void SaveFromRichTextBox(SfRichTextBoxAdv richTextBox, string filePath)
{
    using var stream = File.Create(filePath);
    richTextBox.Save(stream, FormatType.Docx);
}
```

#### チE��スト抽出・検索

```csharp
// === 全斁E��キスト抽出 ===
public string ExtractText(WordDocument document)
{
    return document.GetText();
}

// === 段落単位でのチE��スト取征E===
public IEnumerable<string> GetParagraphs(WordDocument document)
{
    foreach (WSection section in document.Sections)
    {
        foreach (WParagraph paragraph in section.Body.Paragraphs)
        {
            yield return paragraph.Text;
        }
    }
}

// === チE��スト検索・置揁E===
public void FindAndReplace(WordDocument document, string find, string replace)
{
    document.Replace(find, replace, false, false);
}
```

#### スタイル・書式設宁E

```csharp
// === 段落スタイル適用 ===
public void ApplyHeadingStyle(WParagraph paragraph, int level)
{
    paragraph.ApplyStyle($"Heading {level}");
}

// === フォント設宁E===
public void SetFontStyle(WTextRange textRange, string fontName, float fontSize)
{
    textRange.CharacterFormat.FontName = fontName;
    textRange.CharacterFormat.FontSize = fontSize;
}

// === Ivory & Gold チE�Eマカラーの適用 ===
public void ApplyBrandColor(WTextRange textRange)
{
    // Gold (#B8942F) をアクセントカラーとして使用
    textRange.CharacterFormat.TextColor = System.Drawing.Color.FromArgb(0xB8, 0x94, 0x2F);
}
```

#### 表・画像�E操佁E

```csharp
// === 表の作�E ===
public WTable CreateTable(WSection section, int rows, int cols)
{
    var table = section.AddTable();
    table.ResetCells(rows, cols);
    return table;
}

// === 画像�E挿入 ===
public void InsertImage(WParagraph paragraph, string imagePath)
{
    using var stream = File.OpenRead(imagePath);
    var picture = paragraph.AppendPicture(stream);
    picture.Width = 200;
    picture.Height = 150;
}
```

#### PDF 変換

```csharp
using Syncfusion.DocToPDFConverter;
using Syncfusion.Pdf;

public void ConvertToPdf(WordDocument document, string outputPath)
{
    using var converter = new DocToPDFConverter();
    using var pdfDocument = converter.ConvertToPDF(document);
    using var stream = File.Create(outputPath);
    pdfDocument.Save(stream);
}
```

### IOSH (InsightOfficeSheet) におけめEXlsIO 使用パターン

XlsIO は Excel ブック (.xlsx/.xls) の読み書き�E操作を行うライブラリです、E

#### 忁E��ENuGet パッケージ

```xml
<ItemGroup>
    <!-- Excel 表示・編雁EUI -->
    <PackageReference Include="Syncfusion.SfSpreadsheet.WPF" Version="*" />
    <!-- Excel バックエンド�E琁E-->
    <PackageReference Include="Syncfusion.XlsIO.WPF" Version="*" />
    <!-- ライセンス管琁E���E通！E-->
    <PackageReference Include="Syncfusion.Licensing" Version="*" />
</ItemGroup>
```

#### 基本皁E��使用パターン

```csharp
using Syncfusion.XlsIO;

// === ブックの読み込み ===
public IWorkbook LoadWorkbook(string filePath)
{
    using var engine = new ExcelEngine();
    var application = engine.Excel;
    application.DefaultVersion = ExcelVersion.Xlsx;
    return application.Workbooks.Open(filePath);
}

// === セル値の取得�E設宁E===
public void CellOperations(IWorksheet sheet)
{
    // 値の取征E
    var value = sheet.Range["A1"].Value;

    // 値の設宁E
    sheet.Range["B1"].Value = "Hello";
    sheet.Range["C1"].Number = 123.45;
    sheet.Range["D1"].DateTime = DateTime.Now;
}
```

### INSS (InsightSlide) におけめEPresentation 使用パターン

Presentation は PowerPoint プレゼンチE�Eション (.pptx/.ppt) の読み書き�E操作を行うライブラリです、E

#### 忁E��ENuGet パッケージ

```xml
<ItemGroup>
    <!-- PowerPoint バックエンド�E琁E-->
    <PackageReference Include="Syncfusion.Presentation.WPF" Version="*" />
    <!-- PDF変換�E�オプション�E�E-->
    <PackageReference Include="Syncfusion.PresentationToPdfConverter.WPF" Version="*" />
    <!-- 画像変換�E�オプション�E�E-->
    <PackageReference Include="Syncfusion.PresentationRenderer.WPF" Version="*" />
    <!-- ライセンス管琁E���E通！E-->
    <PackageReference Include="Syncfusion.Licensing" Version="*" />
</ItemGroup>
```

#### 基本皁E��使用パターン

```csharp
using Syncfusion.Presentation;

// === プレゼンチE�Eションの読み込み ===
public IPresentation LoadPresentation(string filePath)
{
    return Presentation.Open(filePath);
}

// === プレゼンチE�Eションの保孁E===
public void SavePresentation(IPresentation presentation, string filePath)
{
    presentation.Save(filePath);
}

// === 新規作�E ===
public IPresentation CreatePresentation()
{
    return Presentation.Create();
}
```

#### チE��スト抽出�E�EIレビュー用�E�E

```csharp
// === 全スライドからテキスト抽出 ===
public IEnumerable<SlideText> ExtractAllText(IPresentation presentation)
{
    foreach (ISlide slide in presentation.Slides)
    {
        int slideNumber = presentation.Slides.IndexOf(slide) + 1;

        foreach (IShape shape in slide.Shapes)
        {
            if (shape is ITextBox textBox)
            {
                yield return new SlideText
                {
                    SlideNumber = slideNumber,
                    ShapeId = shape.ShapeId,
                    ShapeName = shape.ShapeName,
                    Text = textBox.TextBody.Text
                };
            }
        }
    }
}

public record SlideText
{
    public int SlideNumber { get; init; }
    public int ShapeId { get; init; }
    public string ShapeName { get; init; } = "";
    public string Text { get; init; } = "";
}

// === スライドノート抽出 ===
public IEnumerable<string> ExtractNotes(IPresentation presentation)
{
    foreach (ISlide slide in presentation.Slides)
    {
        if (slide.NotesSlide != null)
        {
            yield return slide.NotesSlide.NotesTextBody.Text;
        }
    }
}
```

#### チE��スト検索・置揁E

```csharp
// === 一括検索・置換（用語統一など�E�E===
public void FindAndReplace(IPresentation presentation, string find, string replace)
{
    foreach (ISlide slide in presentation.Slides)
    {
        foreach (IShape shape in slide.Shapes)
        {
            if (shape is ITextBox textBox)
            {
                foreach (IParagraph paragraph in textBox.TextBody.Paragraphs)
                {
                    foreach (ITextPart textPart in paragraph.TextParts)
                    {
                        if (textPart.Text.Contains(find))
                        {
                            textPart.Text = textPart.Text.Replace(find, replace);
                        }
                    }
                }
            }
        }
    }
}
```

#### スライドサムネイル生�E

```csharp
using Syncfusion.PresentationRenderer;

// === スライドを画像に変換 ===
public void ExportSlideAsImage(IPresentation presentation, int slideIndex, string outputPath)
{
    presentation.PresentationRenderer = new PresentationRenderer();
    using var stream = presentation.Slides[slideIndex].ConvertToImage(ExportImageFormat.Png);
    using var fileStream = File.Create(outputPath);
    stream.CopyTo(fileStream);
}
```

#### PDF 変換

```csharp
using Syncfusion.PresentationToPdfConverter;
using Syncfusion.Pdf;

public void ConvertToPdf(IPresentation presentation, string outputPath)
{
    using var pdfDocument = PresentationToPdfConverter.Convert(presentation);
    using var stream = File.Create(outputPath);
    pdfDocument.Save(stream);
}
```

### 忁E��実裁E ThirdPartyLicenseProvider�E�Ensight-common 共通クラス�E�E

吁E��プリは `InsightCommon.License.ThirdPartyLicenseProvider` を使用して、Edition 持E��でキーを取得�E登録します、E

> **重要E*: Syncfusion は Edition ごとに異なるライセンスキーを発行します。詳細は `docs/SYNCFUSION_SETUP.md` を参照、E

```csharp
using InsightCommon.License;

// Edition を指定してキーを取征E
// 優先頁E��E Edition 別環墁E��数 > 汎用環墁E��数 > JSON(editions) > JSON(レガシー)
var key = ThirdPartyLicenseProvider.GetSyncfusionKey("uiEdition");

// Edition を指定してライセンス登録�E�推奨�E�E
ThirdPartyLicenseProvider.RegisterSyncfusion("uiEdition");

// Edition 省略時�E uiEdition がデフォルチE
ThirdPartyLicenseProvider.RegisterSyncfusion();
```

### App.xaml.cs での登録

```csharp
using InsightCommon.License;

protected override void OnStartup(StartupEventArgs e)
{
    base.OnStartup(e);

    // Syncfusion ライセンス登録�E�Edition 持E��！E
    ThirdPartyLicenseProvider.RegisterSyncfusion("uiEdition");

    // ...
}
```

### チェチE��リスチE

- [ ] App.xaml.cs の OnStartup で `ThirdPartyLicenseProvider.RegisterSyncfusion()` を呼んでぁE��
- [ ] 正しい Edition を指定してぁE���E�現在の全製品�E `uiEdition`�E�E
- [ ] キーがハードコーチE*のみ**で管琁E��れて**ぁE��ぁE*�E�ESON読み込み優先！E

---

## 参老E��裁E

- **InsightOfficeSheet**: `win-app-insight-sheet` リポジトリ�E�Eyncfusion SfSpreadsheet + ThirdPartyLicenses 統合！E
- **InsightNoCodeAnalyzer**: `win-app-nocode-analyzer` リポジトリ
- **InsightSlide**: ライセンス画面のリファレンス実裁E
