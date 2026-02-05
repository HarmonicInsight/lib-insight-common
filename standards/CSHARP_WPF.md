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
2. **言語切り替え**: `English` / `日本語`
3. **ライセンスボタン**: `🔑 ライセンス`
4. ウィンドウコントロール: 最小化 / 最大化 / 閉じる

### 言語切り替え仕様

| 項目 | 値 |
|-----|-----|
| 対応言語 | 日本語 (ja), English (en) |
| デフォルト | システム言語に従う |
| 保存先 | `%APPDATA%/HarmonicInsight/{製品名}/settings.json` |
| ボタン表示 | 現在の言語の**反対側**を表示（日本語時は「English」）|

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
                        <!-- 言語切り替えボタン -->
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
- **言語切り替えボタン**は右上に配置
- **ライセンスボタン**は右上に配置（言語切り替えの右隣）
- Ivory & Gold カラーテーマを使用
- プランバッジを表示

---

## 必須チェックリスト

### レイアウト（UI構造）

- [ ] **WindowStyle="None"** でカスタムタイトルバーを使用
- [ ] タイトルバー左側に **Insight {製品名}**（Gold 色）がある
- [ ] タイトルバー左側に **バージョン** と **プランバッジ** がある
- [ ] タイトルバー右側に **言語切り替えボタン** がある
- [ ] タイトルバー右側に **ライセンスボタン** がある
- [ ] ウィンドウコントロール（最小化/最大化/閉じる）がある
- [ ] タイトルバーでドラッグ移動できる
- [ ] ウィンドウ枠線が `BorderBrush` (#E7E2DA) 1px

### 多言語対応

- [ ] 日本語 / English の切り替えが可能
- [ ] 言語設定が `settings.json` に保存される
- [ ] 全ての UI テキストがリソースファイルから読み込まれる

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

## サードパーティライセンス管理

Syncfusion 等のサードパーティライセンスキーは `insight-common/config/third-party-licenses.json` で**全製品共通管理**されています。各アプリに直書きしないでください。

### Syncfusion コンポーネントマッピング

| 製品 | 用途 | Syncfusion コンポーネント | NuGet パッケージ |
|------|------|-------------------------|-----------------|
| IOSH | Excel 操作 | SfSpreadsheet | `Syncfusion.SfSpreadsheet.WPF` |
| IOSD | Word 操作 | SfRichTextBoxAdv (DocIO) | `Syncfusion.SfRichTextBoxAdv.WPF`, `Syncfusion.DocIO.WPF` |
| INSS | PowerPoint 操作 | SfPresentation | `Syncfusion.Presentation.WPF` |

### IOSD (InsightOfficeDoc) における DocIO 使用パターン

DocIO は Word 文書 (.docx/.doc) の読み書き・操作を行うライブラリです。IOSD では以下のパターンで使用します。

#### 必須 NuGet パッケージ

```xml
<ItemGroup>
    <!-- Word 文書表示・編集 UI -->
    <PackageReference Include="Syncfusion.SfRichTextBoxAdv.WPF" Version="*" />
    <!-- Word 文書バックエンド処理（読み書き・変換） -->
    <PackageReference Include="Syncfusion.DocIO.WPF" Version="*" />
    <!-- ライセンス管理（共通） -->
    <PackageReference Include="Syncfusion.Licensing" Version="*" />
</ItemGroup>
```

#### 基本的な使用パターン

```csharp
using Syncfusion.DocIO;
using Syncfusion.DocIO.DLS;
using Syncfusion.Windows.Controls.RichTextBoxAdv;

// === 文書の読み込み ===
public WordDocument LoadDocument(string filePath)
{
    using var stream = File.OpenRead(filePath);
    var document = new WordDocument(stream, FormatType.Automatic);
    return document;
}

// === 文書の保存 ===
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

// === SfRichTextBoxAdv から保存 ===
public void SaveFromRichTextBox(SfRichTextBoxAdv richTextBox, string filePath)
{
    using var stream = File.Create(filePath);
    richTextBox.Save(stream, FormatType.Docx);
}
```

#### テキスト抽出・検索

```csharp
// === 全文テキスト抽出 ===
public string ExtractText(WordDocument document)
{
    return document.GetText();
}

// === 段落単位でのテキスト取得 ===
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

// === テキスト検索・置換 ===
public void FindAndReplace(WordDocument document, string find, string replace)
{
    document.Replace(find, replace, false, false);
}
```

#### スタイル・書式設定

```csharp
// === 段落スタイル適用 ===
public void ApplyHeadingStyle(WParagraph paragraph, int level)
{
    paragraph.ApplyStyle($"Heading {level}");
}

// === フォント設定 ===
public void SetFontStyle(WTextRange textRange, string fontName, float fontSize)
{
    textRange.CharacterFormat.FontName = fontName;
    textRange.CharacterFormat.FontSize = fontSize;
}

// === Ivory & Gold テーマカラーの適用 ===
public void ApplyBrandColor(WTextRange textRange)
{
    // Gold (#B8942F) をアクセントカラーとして使用
    textRange.CharacterFormat.TextColor = System.Drawing.Color.FromArgb(0xB8, 0x94, 0x2F);
}
```

#### 表・画像の操作

```csharp
// === 表の作成 ===
public WTable CreateTable(WSection section, int rows, int cols)
{
    var table = section.AddTable();
    table.ResetCells(rows, cols);
    return table;
}

// === 画像の挿入 ===
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

### IOSH (InsightOfficeSheet) における XlsIO 使用パターン

XlsIO は Excel ブック (.xlsx/.xls) の読み書き・操作を行うライブラリです。

#### 必須 NuGet パッケージ

```xml
<ItemGroup>
    <!-- Excel 表示・編集 UI -->
    <PackageReference Include="Syncfusion.SfSpreadsheet.WPF" Version="*" />
    <!-- Excel バックエンド処理 -->
    <PackageReference Include="Syncfusion.XlsIO.WPF" Version="*" />
    <!-- ライセンス管理（共通） -->
    <PackageReference Include="Syncfusion.Licensing" Version="*" />
</ItemGroup>
```

#### 基本的な使用パターン

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

// === セル値の取得・設定 ===
public void CellOperations(IWorksheet sheet)
{
    // 値の取得
    var value = sheet.Range["A1"].Value;

    // 値の設定
    sheet.Range["B1"].Value = "Hello";
    sheet.Range["C1"].Number = 123.45;
    sheet.Range["D1"].DateTime = DateTime.Now;
}
```

### INSS (InsightSlide) における Presentation 使用パターン

Presentation は PowerPoint プレゼンテーション (.pptx/.ppt) の読み書き・操作を行うライブラリです。

#### 必須 NuGet パッケージ

```xml
<ItemGroup>
    <!-- PowerPoint バックエンド処理 -->
    <PackageReference Include="Syncfusion.Presentation.WPF" Version="*" />
    <!-- PDF変換（オプション） -->
    <PackageReference Include="Syncfusion.PresentationToPdfConverter.WPF" Version="*" />
    <!-- 画像変換（オプション） -->
    <PackageReference Include="Syncfusion.PresentationRenderer.WPF" Version="*" />
    <!-- ライセンス管理（共通） -->
    <PackageReference Include="Syncfusion.Licensing" Version="*" />
</ItemGroup>
```

#### 基本的な使用パターン

```csharp
using Syncfusion.Presentation;

// === プレゼンテーションの読み込み ===
public IPresentation LoadPresentation(string filePath)
{
    return Presentation.Open(filePath);
}

// === プレゼンテーションの保存 ===
public void SavePresentation(IPresentation presentation, string filePath)
{
    presentation.Save(filePath);
}

// === 新規作成 ===
public IPresentation CreatePresentation()
{
    return Presentation.Create();
}
```

#### テキスト抽出（AIレビュー用）

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

#### テキスト検索・置換

```csharp
// === 一括検索・置換（用語統一など） ===
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

#### スライドサムネイル生成

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

### 必須実装: ThirdPartyLicenses.cs

各アプリに `ThirdPartyLicenses.cs` を作成し、共通 JSON からキーを読み込みます。

```csharp
internal static class ThirdPartyLicenses
{
    public static string GetSyncfusionKey()
    {
        // 1. insight-common/config/third-party-licenses.json から読み込み
        try
        {
            var path = FindConfigPath();
            if (path != null && File.Exists(path))
            {
                var json = File.ReadAllText(path);
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("syncfusion", out var sf) &&
                    sf.TryGetProperty("licenseKey", out var key))
                {
                    var value = key.GetString();
                    if (!string.IsNullOrEmpty(value))
                        return value;
                }
            }
        }
        catch { }

        // 2. ハードコードフォールバック
        return "YOUR_FALLBACK_KEY";
    }
}
```

### App.xaml.cs での登録

```csharp
protected override void OnStartup(StartupEventArgs e)
{
    base.OnStartup(e);

    // サードパーティライセンス登録（環境変数 > JSON > フォールバック）
    var licenseKey = Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE_KEY");
    if (string.IsNullOrEmpty(licenseKey))
        licenseKey = ThirdPartyLicenses.GetSyncfusionKey();
    if (!string.IsNullOrEmpty(licenseKey))
        Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(licenseKey);

    // ...
}
```

### チェックリスト

- [ ] `ThirdPartyLicenses.cs` が作成されている
- [ ] App.xaml.cs の OnStartup で Syncfusion キーを登録している
- [ ] キーがハードコード**のみ**で管理されて**いない**（JSON読み込み優先）

---

## 参考実装

- **InsightOfficeSheet**: `app-Insight-excel` リポジトリ（Syncfusion SfSpreadsheet + ThirdPartyLicenses 統合）
- **InsightNoCodeAnalyzer**: `app-nocode-analyzer-C` リポジトリ
- **InsightSlide**: ライセンス画面のリファレンス実装
