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
| ボタン表示 | 現在の言語の**反対側**を表示（日本語時は「English」）|

### タイトルバーコンポーネント標準

> **注意**: InsightOffice 系アプリ（Sheet/Doc/Slide）で統一された仕様です。

#### ブランド名 "InsightOffice"

| 項目 | 値 |
|-----|-----|
| テキスト | `InsightOffice` （固定） |
| フォントサイズ | **15px** |
| フォントウェイト | **SemiBold (600)** |
| 色 | `PrimaryBrush` (#B8942F) |
| 配置 | タイトルバー左端、Margin="16,0" |

```xml
<!-- ✅ 正しい: ブランド名 -->
<TextBlock Text="InsightOffice"
           FontSize="15" FontWeight="SemiBold"
           Foreground="{StaticResource PrimaryBrush}"/>
```

#### 製品名

| 項目 | 値 |
|-----|-----|
| 形式 | `{製品名}` |
| 例 | `Sheet`, `Doc`, `Slide` |
| フォントサイズ | **15px** |
| フォントウェイト | **Normal (400)** |
| 色 | `TextSecondaryBrush` (#57534E) |
| 配置 | ブランド名の右（スペースなし、または Margin="4,0,0,0"） |

```xml
<!-- ✅ 正しい: 製品名 -->
<TextBlock Text="Sheet"
           FontSize="15" FontWeight="Normal"
           Foreground="{StaticResource TextSecondaryBrush}"/>
```

**命名規則:**
- 製品名は短縮形を使用: `Sheet`, `Doc`, `Slide`
- ブランド名と製品名は別々の TextBlock で表示
- 例: `InsightOffice` + `Sheet` ✅, `Insight Sheet` ❌

#### バージョン表示

| 項目 | 値 |
|-----|-----|
| 形式 | `v{MAJOR}.{MINOR}.{PATCH}` |
| 例 | `v2.1.0`, `v1.0.0` |
| フォントサイズ | **11px** |
| フォントウェイト | **Regular (400)** |
| 色 | `TextTertiaryBrush` (#A8A29E) |
| 配置 | 製品名の右、**Margin="12,0,0,0"** |

```xml
<!-- ✅ 正しい: バージョン表示 -->
<TextBlock Text="v2.1.0"
           FontSize="11"
           Foreground="{StaticResource TextTertiaryBrush}"
           VerticalAlignment="Center"
           Margin="12,0,0,0"/>
```

**取得方法（C#）:**
```csharp
// AssemblyVersion から取得
var version = System.Reflection.Assembly.GetExecutingAssembly().GetName().Version;
var versionText = $"v{version.Major}.{version.Minor}.{version.Build}";

// または config/app-versions.ts と同期した定数から取得（推奨）
public static class AppInfo
{
    public const string Version = "2.1.0";
    public const int BuildNumber = 45;
    public static string VersionText => $"v{Version}";
}
```

#### プランバッジ

| 項目 | 値 |
|-----|-----|
| 形式 | `◀ {PLAN}` |
| 例 | `◀ TRIAL`, `◀ STD`, `◀ PRO`, `◀ ENT` |
| フォントサイズ | **11px** |
| フォントウェイト | **SemiBold (600)** |
| 文字色 | `TextAccentBrush` (#8C711E) |
| 背景色 | `PrimaryLightBrush` (#F0E6C8) |
| 角丸 | CornerRadius="4" |
| パディング | Padding="8,2" |
| 配置 | バージョン表示の右、Margin="12,0,0,0" |

```xml
<!-- ✅ 正しい: プランバッジ -->
<Border Background="{StaticResource PrimaryLightBrush}"
        CornerRadius="4"
        Padding="8,2"
        Margin="12,0,0,0">
    <TextBlock Text="{Binding CurrentPlan, StringFormat='◀ {0}'}"
               FontSize="11" FontWeight="SemiBold"
               Foreground="{StaticResource TextAccentBrush}"/>
</Border>
```

#### ライセンスボタン

| 項目 | 値 |
|-----|-----|
| アイコン | `🔑` (U+1F511) |
| テキスト（日本語） | `ライセンス` |
| テキスト（英語） | `License` |
| 形式 | `🔑 {テキスト}` |
| フォントサイズ | **14px** |
| スタイル | `TitleBarButtonStyle` |
| 配置 | 言語切り替えボタンの右、ウィンドウコントロールの左 |

```xml
<!-- ✅ 正しい: ライセンスボタン -->
<Button Style="{StaticResource TitleBarButtonStyle}"
        Command="{Binding OpenLicenseCommand}"
        Margin="8,0">
    <StackPanel Orientation="Horizontal">
        <TextBlock Text="🔑" Margin="0,0,4,0"/>
        <TextBlock Text="{Binding LicenseButtonText}"/>  <!-- "ライセンス" or "License" -->
    </StackPanel>
</Button>
```

#### 設定ボタン（オプション）

| 項目 | 値 |
|-----|-----|
| アイコン | `⚙` (U+2699) |
| テキスト（日本語） | `設定` |
| テキスト（英語） | `Settings` |
| 形式 | `⚙ {テキスト}` |
| スタイル | `TitleBarButtonStyle` |

```xml
<!-- ✅ 正しい: 設定ボタン -->
<Button Style="{StaticResource TitleBarButtonStyle}"
        Command="{Binding OpenSettingsCommand}">
    <StackPanel Orientation="Horizontal">
        <TextBlock Text="⚙" Margin="0,0,4,0"/>
        <TextBlock Text="{Binding SettingsButtonText}"/>  <!-- "設定" or "Settings" -->
    </StackPanel>
</Button>
```

#### タイトルバー全体レイアウト

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [InsightOffice][Sheet] [v2.1.0] [◀ PRO]     [⚙ 設定] [English] [🔑 ライセンス] [─][□][×] │
│ ↑              ↑       ↑         ↑          ↑        ↑         ↑             ↑        │
│ Gold/15px      Gray    Gray/11px  Badge     Optional  Language  License       Controls │
│ SemiBold       15px               11px               Toggle     Button                 │
│                Normal                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**配置順序（左から右）:**
1. ブランド名 "InsightOffice"（必須）— Gold, 15px, SemiBold
2. 製品名（必須）— Gray, 15px, Normal
3. バージョン（必須）— Margin=12
4. プランバッジ（必須）— 11px
5. （スペーサー）
6. 設定ボタン（オプション）
7. 言語切り替えボタン（必須）
8. ライセンスボタン（必須）
9. ウィンドウコントロール（必須）

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

## ⚠️ StaticResource ルール（重要）

### 基本原則

**すべての色は `Colors.xaml` / `Styles.xaml` で定義し、`{StaticResource ...}` で参照する。**

このルールは以下の理由で重要：
- テーマ変更時に一箇所で済む
- 一貫性が保たれる
- デバッグしやすい
- Syncfusion などのサードパーティコンポーネントとの競合を防ぐ

### ❌ 絶対禁止: StaticResource を直接の色コードに置き換える

```xml
<!-- ❌ 間違い: StaticResource を直接の色コードに置き換えた -->
<Border Background="#FAF8F5" />
<TextBlock Foreground="#1C1917" />
<SolidColorBrush Color="#B8942F" />

<!-- ✅ 正しい: StaticResource を使用 -->
<Border Background="{StaticResource BgPrimaryBrush}" />
<TextBlock Foreground="{StaticResource TextPrimaryBrush}" />
<SolidColorBrush Color="{StaticResource PrimaryColor}" />
```

### ❌ 絶対禁止: Syncfusion コンポーネントの内部スタイルを手動で上書き

Syncfusion のコンポーネント（Ribbon, BackStage, SfSpreadsheet 等）は独自の内部スタイルを持っています。
これらを手動で上書きすると、予期せぬ動作や競合が発生します。

```xml
<!-- ❌ 間違い: Syncfusion の内部構造に直接スタイルを追加 -->
<syncfusion:RibbonBackStage>
    <syncfusion:RibbonBackStage.Resources>
        <SolidColorBrush x:Key="SomeInternalKey" Color="#FAF8F5"/>
    </syncfusion:RibbonBackStage.Resources>
    ...
</syncfusion:RibbonBackStage>

<!-- ✅ 正しい: Syncfusion のテーマ設定を使用するか、App.xaml でグローバルに設定 -->
```

### Syncfusion コンポーネントのカスタマイズ方法

Syncfusion コンポーネントのカスタマイズは以下の方法で行う：

1. **SfSkinManager を使用**（推奨）
```csharp
// App.xaml.cs
SfSkinManager.SetTheme(window, new Theme("MaterialLight"));
```

2. **App.xaml でグローバルリソースを設定**
```xml
<Application.Resources>
    <ResourceDictionary>
        <ResourceDictionary.MergedDictionaries>
            <ResourceDictionary Source="Themes/Colors.xaml"/>
            <ResourceDictionary Source="Themes/Styles.xaml"/>
            <!-- Syncfusion テーマのオーバーライド（あれば） -->
            <ResourceDictionary Source="Themes/SyncfusionOverrides.xaml"/>
        </ResourceDictionary.MergedDictionaries>
    </ResourceDictionary>
</Application.Resources>
```

3. **Syncfusion 公式ドキュメントに従う**
   - 内部キー名を推測して上書きしない
   - 公開されている API のみを使用

### 検出パターン（validate-standards.sh でチェック）

以下のパターンが XAML ファイル内に存在する場合はエラー：

| パターン | 説明 |
|---------|------|
| `Background="#[0-9A-Fa-f]{6}"` | 直接の色コード（Background） |
| `Foreground="#[0-9A-Fa-f]{6}"` | 直接の色コード（Foreground） |
| `Color="#[0-9A-Fa-f]{6}"` | 直接の色コード（Color） |
| `Fill="#[0-9A-Fa-f]{6}"` | 直接の色コード（Fill） |
| `Stroke="#[0-9A-Fa-f]{6}"` | 直接の色コード（Stroke） |
| `BorderBrush="#[0-9A-Fa-f]{6}"` | 直接の色コード（BorderBrush） |

**例外:**
- `Colors.xaml` 内の Color 定義（ここで色を定義するのは正しい）
- コメント内
- `x:Key` を持つ SolidColorBrush 定義（リソースとして定義する場合）

---

## Syncfusion Ribbon / BackStage 標準（InsightOffice 統一仕様）

InsightOffice 系アプリ（Sheet/Doc/Slide）では Syncfusion Ribbon コンポーネントを使用します。
3つのアプリで実装を統一し、保守性を高めるため、以下の標準に従ってください。

### 基本原則

1. **Ribbon に Background 属性を設定しない** — Syncfusion のテーマに任せる
2. **Ribbon.Items で RibbonTab をラップする** — 直接配置しない
3. **内部スタイルを手動で上書きしない** — 予期せぬ動作を防ぐ
4. **BackStage コマンドを統一する** — 3アプリで共通のコマンド構成

### Ribbon 必須属性

| 属性 | 値 | 説明 |
|------|-----|------|
| `ShowCustomizeRibbon` | `"False"` | カスタマイズUIを非表示 |
| `EnableSimplifiedLayoutMode` | `"False"` | 簡易レイアウトモードを無効化 |
| `BackStageHeader` | `"ファイル"` | BackStage ボタンのラベル |

### ✅ 正しい Ribbon 実装

```xml
<syncfusion:Ribbon x:Name="MainRibbon"
                   Grid.Row="1"
                   ShowCustomizeRibbon="False"
                   EnableSimplifiedLayoutMode="False"
                   BackStageHeader="ファイル">

    <!-- ✅ 必須: Ribbon.Items でタブをラップ -->
    <syncfusion:Ribbon.Items>
        <syncfusion:RibbonTab Caption="ホーム">
            <syncfusion:RibbonBar Header="クリップボード">
                <syncfusion:RibbonButton Label="貼り付け"
                                         SizeForm="Large"
                                         LargeIcon="/Resources/Icons/paste_32.png"
                                         Command="{Binding PasteCommand}"/>
                <syncfusion:RibbonButton Label="切り取り"
                                         SizeForm="Small"
                                         SmallIcon="/Resources/Icons/cut_16.png"
                                         Command="{Binding CutCommand}"/>
                <syncfusion:RibbonButton Label="コピー"
                                         SizeForm="Small"
                                         SmallIcon="/Resources/Icons/copy_16.png"
                                         Command="{Binding CopyCommand}"/>
            </syncfusion:RibbonBar>
            <!-- 他の RibbonBar... -->
        </syncfusion:RibbonTab>

        <syncfusion:RibbonTab Caption="挿入">
            <!-- ... -->
        </syncfusion:RibbonTab>
    </syncfusion:Ribbon.Items>

    <!-- BackStage（後述） -->
    <syncfusion:Ribbon.BackStage>
        <!-- ... -->
    </syncfusion:Ribbon.BackStage>
</syncfusion:Ribbon>
```

### ❌ 禁止: 間違った Ribbon 実装

```xml
<!-- ❌ 間違い 1: Background 属性を設定 -->
<syncfusion:Ribbon Background="#FAF8F5">

<!-- ❌ 間違い 2: Ribbon.Items を使わずに直接 RibbonTab を配置 -->
<syncfusion:Ribbon>
    <syncfusion:RibbonTab Caption="ホーム">
        <!-- ... -->
    </syncfusion:RibbonTab>
</syncfusion:Ribbon>

<!-- ❌ 間違い 3: 内部リソースを手動で上書き -->
<syncfusion:Ribbon>
    <syncfusion:Ribbon.Resources>
        <SolidColorBrush x:Key="SomeInternalKey" Color="#FAF8F5"/>
    </syncfusion:Ribbon.Resources>
</syncfusion:Ribbon>
```

### BackStage 標準構成

InsightOffice 系アプリでは以下の BackStage コマンドを統一的に実装します。

#### 共通 BackStage コマンド

| コマンド | Header | 説明 | 必須 |
|---------|--------|------|:----:|
| 新規作成 | `新規作成` | 新しいドキュメントを作成 | ✅ |
| 開く | `開く` | 既存ファイルを開く | ✅ |
| 上書き保存 | `上書き保存` | 現在のファイルを保存 | ✅ |
| 名前を付けて保存 | `名前を付けて保存` | 別名で保存 | ✅ |
| エクスポート | `{形式}エクスポート` | 各製品固有の形式 | 製品による |
| 印刷 | `印刷` | 印刷ダイアログを開く | ✅ |
| 閉じる | `閉じる` | 現在のファイルを閉じる | ✅ |

#### 製品別エクスポートコマンド

| 製品 | エクスポート 1 | エクスポート 2 |
|------|--------------|--------------|
| IOSH (Sheet) | `Excelエクスポート` | `CSVエクスポート` |
| IOSD (Doc) | `Wordエクスポート` | `PDFエクスポート` |
| INSS (Slide) | `PowerPointエクスポート` | `PDFエクスポート` |

### ✅ 正しい BackStage 実装

```xml
<syncfusion:Ribbon.BackStage>
    <syncfusion:Backstage>
        <!-- 基本ファイル操作 -->
        <syncfusion:BackStageCommandButton Header="新規作成"
                                           Icon="/Resources/Icons/new_32.png"
                                           Click="BackStageNewFile_Click"/>
        <syncfusion:BackStageCommandButton Header="開く"
                                           Icon="/Resources/Icons/open_32.png"
                                           Click="BackStageOpenFile_Click"/>
        <syncfusion:BackStageCommandButton Header="上書き保存"
                                           Icon="/Resources/Icons/save_32.png"
                                           Click="BackStageSaveFile_Click"/>
        <syncfusion:BackStageCommandButton Header="名前を付けて保存"
                                           Icon="/Resources/Icons/save_as_32.png"
                                           Click="BackStageSaveAsFile_Click"/>

        <!-- エクスポート（製品固有） -->
        <!-- IOSH の場合 -->
        <syncfusion:BackStageCommandButton Header="Excelエクスポート"
                                           Icon="/Resources/Icons/excel_32.png"
                                           Click="BackStageExportExcel_Click"/>
        <syncfusion:BackStageCommandButton Header="CSVエクスポート"
                                           Icon="/Resources/Icons/csv_32.png"
                                           Click="BackStageExportCsv_Click"/>

        <!-- 印刷・閉じる -->
        <syncfusion:BackStageCommandButton Header="印刷"
                                           Icon="/Resources/Icons/print_32.png"
                                           Click="BackStagePrint_Click"/>
        <syncfusion:BackStageCommandButton Header="閉じる"
                                           Icon="/Resources/Icons/close_32.png"
                                           Click="BackStageCloseFile_Click"/>
    </syncfusion:Backstage>
</syncfusion:Ribbon.BackStage>
```

### ❌ 禁止: 間違った BackStage 実装

```xml
<!-- ❌ 間違い 1: Backstage に Background 属性を設定 -->
<syncfusion:Backstage Background="#FAF8F5">

<!-- ❌ 間違い 2: 内部リソースを手動で上書き -->
<syncfusion:Backstage>
    <syncfusion:Backstage.Resources>
        <SolidColorBrush x:Key="BackStageBackground" Color="#FAF8F5"/>
    </syncfusion:Backstage.Resources>
</syncfusion:Backstage>

<!-- ❌ 間違い 3: RibbonBackStage を使用（旧API） -->
<syncfusion:RibbonBackStage>
    <!-- ... -->
</syncfusion:RibbonBackStage>
```

### BackStage イベントハンドラーのテンプレート

```csharp
// MainWindow.xaml.cs

private void BackStageNewFile_Click(object sender, RoutedEventArgs e)
{
    // 変更確認 → 新規作成
    if (ConfirmUnsavedChanges())
    {
        CreateNewDocument();
    }
    CloseBackStage();
}

private void BackStageOpenFile_Click(object sender, RoutedEventArgs e)
{
    // ファイル選択ダイアログ
    var dialog = new OpenFileDialog
    {
        Filter = GetFileFilter(), // 製品固有のフィルター
        Title = "ファイルを開く"
    };

    if (dialog.ShowDialog() == true)
    {
        OpenDocument(dialog.FileName);
    }
    CloseBackStage();
}

private void BackStageSaveFile_Click(object sender, RoutedEventArgs e)
{
    if (string.IsNullOrEmpty(CurrentFilePath))
    {
        BackStageSaveAsFile_Click(sender, e);
        return;
    }
    SaveDocument(CurrentFilePath);
    CloseBackStage();
}

private void BackStageSaveAsFile_Click(object sender, RoutedEventArgs e)
{
    var dialog = new SaveFileDialog
    {
        Filter = GetFileFilter(),
        Title = "名前を付けて保存"
    };

    if (dialog.ShowDialog() == true)
    {
        SaveDocument(dialog.FileName);
    }
    CloseBackStage();
}

private void BackStageCloseFile_Click(object sender, RoutedEventArgs e)
{
    if (ConfirmUnsavedChanges())
    {
        CloseDocument();
    }
    CloseBackStage();
}

private void CloseBackStage()
{
    MainRibbon.HideBackStage();
}
```

### BackStage 印刷機能標準（Excel 互換）

InsightOffice 系アプリでは、Excel と同様の印刷エクスペリエンスを提供します。
BackStage の「印刷」コマンドをクリックすると、以下の印刷パネルを表示します。

#### 印刷パネル レイアウト

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ← 戻る                                印刷                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────┐    ┌──────────────────────────────────────────┐  │
│  │ 印刷設定             │    │                                          │  │
│  │                      │    │                                          │  │
│  │ 部数: [1    ] [▲▼]  │    │                                          │  │
│  │                      │    │              印刷プレビュー               │  │
│  │ プリンター:          │    │                                          │  │
│  │ [Microsoft Print ▼] │    │                                          │  │
│  │                      │    │                                          │  │
│  │ 設定                 │    │                                          │  │
│  │ ┌──────────────────┐│    │                                          │  │
│  │ │ すべてのページ    ▼││    │                                          │  │
│  │ └──────────────────┘│    │                                          │  │
│  │ ┌──────────────────┐│    │                                          │  │
│  │ │ 片面印刷          ▼││    └──────────────────────────────────────────┘  │
│  │ └──────────────────┘│                                                   │
│  │ ┌──────────────────┐│    ページ: [◀] 1 / 3 [▶]                        │
│  │ │ 部単位で印刷      ▼││                                                   │
│  │ └──────────────────┘│                                                   │
│  │                      │                                                   │
│  │ 用紙サイズ:          │                                                   │
│  │ [A4            ▼]   │                                                   │
│  │                      │                                                   │
│  │ 余白:                │                                                   │
│  │ [標準          ▼]   │                                                   │
│  │                      │                                                   │
│  │ 印刷の向き:          │                                                   │
│  │ [縦           ▼]    │                                                   │
│  │                      │                                                   │
│  │ [      印刷       ]  │                                                   │
│  │                      │                                                   │
│  └─────────────────────┘                                                   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 印刷設定項目

| 項目 | 説明 | デフォルト |
|------|------|-----------|
| **部数** | 印刷部数（1-999） | 1 |
| **プリンター** | 利用可能なプリンター一覧 | 通常使うプリンター |
| **印刷範囲** | すべてのページ / 現在のページ / 選択範囲 / ページ指定 | すべてのページ |
| **両面/片面** | 片面印刷 / 両面印刷（長辺とじ） / 両面印刷（短辺とじ） | 片面印刷 |
| **部単位** | 部単位で印刷 / ページ単位で印刷 | 部単位で印刷 |
| **用紙サイズ** | A4 / A3 / Letter / Legal 等 | A4 |
| **余白** | 標準 / 狭い / 広い / ユーザー設定 | 標準 |
| **印刷の向き** | 縦 / 横 | 縦 |

#### 製品別 印刷範囲オプション

| 製品 | 印刷範囲オプション |
|------|------------------|
| IOSH (Sheet) | すべてのシート / アクティブシート / 選択範囲 / ページ指定 |
| IOSD (Doc) | すべてのページ / 現在のページ / 選択範囲 / ページ指定 |
| INSS (Slide) | すべてのスライド / 現在のスライド / 選択範囲 / スライド指定 / 配布資料 |

#### 印刷パネル実装（BackStage TabItem）

```xml
<syncfusion:Ribbon.BackStage>
    <syncfusion:Backstage>
        <!-- 他のコマンド... -->

        <!-- 印刷タブ（パネル表示） -->
        <syncfusion:BackStageTabItem Header="印刷"
                                     Icon="/Resources/Icons/print_32.png">
            <Grid>
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="320"/>
                    <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>

                <!-- 左: 印刷設定 -->
                <ScrollViewer Grid.Column="0"
                              VerticalScrollBarVisibility="Auto"
                              Margin="24">
                    <StackPanel>
                        <!-- 部数 -->
                        <TextBlock Text="部数" Style="{StaticResource PrintLabelStyle}"/>
                        <syncfusion:IntegerTextBox Value="{Binding Copies}"
                                                   MinValue="1" MaxValue="999"
                                                   Margin="0,4,0,16"/>

                        <!-- プリンター選択 -->
                        <TextBlock Text="プリンター" Style="{StaticResource PrintLabelStyle}"/>
                        <ComboBox ItemsSource="{Binding AvailablePrinters}"
                                  SelectedItem="{Binding SelectedPrinter}"
                                  Margin="0,4,0,16"/>

                        <!-- 設定セクション -->
                        <TextBlock Text="設定" Style="{StaticResource PrintSectionStyle}"/>

                        <!-- 印刷範囲 -->
                        <ComboBox ItemsSource="{Binding PrintRangeOptions}"
                                  SelectedItem="{Binding SelectedPrintRange}"
                                  Margin="0,4,0,8"/>

                        <!-- 両面/片面 -->
                        <ComboBox ItemsSource="{Binding DuplexOptions}"
                                  SelectedItem="{Binding SelectedDuplex}"
                                  Margin="0,4,0,8"/>

                        <!-- 部単位 -->
                        <ComboBox ItemsSource="{Binding CollateOptions}"
                                  SelectedItem="{Binding SelectedCollate}"
                                  Margin="0,4,0,16"/>

                        <!-- 用紙サイズ -->
                        <TextBlock Text="用紙サイズ" Style="{StaticResource PrintLabelStyle}"/>
                        <ComboBox ItemsSource="{Binding PaperSizes}"
                                  SelectedItem="{Binding SelectedPaperSize}"
                                  Margin="0,4,0,16"/>

                        <!-- 余白 -->
                        <TextBlock Text="余白" Style="{StaticResource PrintLabelStyle}"/>
                        <ComboBox ItemsSource="{Binding MarginOptions}"
                                  SelectedItem="{Binding SelectedMargin}"
                                  Margin="0,4,0,16"/>

                        <!-- 印刷の向き -->
                        <TextBlock Text="印刷の向き" Style="{StaticResource PrintLabelStyle}"/>
                        <ComboBox ItemsSource="{Binding OrientationOptions}"
                                  SelectedItem="{Binding SelectedOrientation}"
                                  Margin="0,4,0,24"/>

                        <!-- 印刷ボタン -->
                        <Button Content="印刷"
                                Style="{StaticResource PrimaryButtonStyle}"
                                Command="{Binding PrintCommand}"
                                Width="200" Height="40"/>
                    </StackPanel>
                </ScrollViewer>

                <!-- 右: 印刷プレビュー -->
                <Border Grid.Column="1"
                        Background="{StaticResource BgSecondaryBrush}"
                        Margin="0,24,24,24">
                    <Grid>
                        <Grid.RowDefinitions>
                            <RowDefinition Height="*"/>
                            <RowDefinition Height="Auto"/>
                        </Grid.RowDefinitions>

                        <!-- プレビュー表示 -->
                        <Border Grid.Row="0"
                                Background="White"
                                Margin="24"
                                Effect="{StaticResource CardShadow}">
                            <Image Source="{Binding PreviewImage}"
                                   Stretch="Uniform"/>
                        </Border>

                        <!-- ページナビゲーション -->
                        <StackPanel Grid.Row="1"
                                    Orientation="Horizontal"
                                    HorizontalAlignment="Center"
                                    Margin="0,0,0,16">
                            <Button Content="◀"
                                    Command="{Binding PreviousPageCommand}"
                                    Style="{StaticResource SecondaryButtonStyle}"
                                    Width="32" Height="32"/>
                            <TextBlock VerticalAlignment="Center"
                                       Margin="16,0">
                                <Run Text="{Binding CurrentPage}"/>
                                <Run Text=" / "/>
                                <Run Text="{Binding TotalPages}"/>
                            </TextBlock>
                            <Button Content="▶"
                                    Command="{Binding NextPageCommand}"
                                    Style="{StaticResource SecondaryButtonStyle}"
                                    Width="32" Height="32"/>
                        </StackPanel>
                    </Grid>
                </Border>
            </Grid>
        </syncfusion:BackStageTabItem>

        <!-- 閉じるコマンド -->
        <syncfusion:BackStageCommandButton Header="閉じる"
                                           Icon="/Resources/Icons/close_32.png"
                                           Click="BackStageCloseFile_Click"/>
    </syncfusion:Backstage>
</syncfusion:Ribbon.BackStage>
```

#### PrintViewModel 基本実装

```csharp
public class PrintViewModel : ViewModelBase
{
    private int _copies = 1;
    private PrintQueue _selectedPrinter;
    private string _selectedPrintRange;
    private string _selectedDuplex;
    private string _selectedCollate;
    private PaperSize _selectedPaperSize;
    private string _selectedMargin;
    private string _selectedOrientation;
    private int _currentPage = 1;
    private int _totalPages;
    private ImageSource _previewImage;

    public int Copies
    {
        get => _copies;
        set => SetProperty(ref _copies, value);
    }

    // プリンター一覧を取得
    public ObservableCollection<PrintQueue> AvailablePrinters { get; }

    public PrintQueue SelectedPrinter
    {
        get => _selectedPrinter;
        set
        {
            SetProperty(ref _selectedPrinter, value);
            UpdatePaperSizes();
        }
    }

    // 印刷範囲オプション（製品により異なる）
    public ObservableCollection<string> PrintRangeOptions { get; }

    // 両面印刷オプション
    public ObservableCollection<string> DuplexOptions { get; } = new()
    {
        "片面印刷",
        "両面印刷（長辺とじ）",
        "両面印刷（短辺とじ）"
    };

    // 部単位オプション
    public ObservableCollection<string> CollateOptions { get; } = new()
    {
        "部単位で印刷",
        "ページ単位で印刷"
    };

    // 余白オプション
    public ObservableCollection<string> MarginOptions { get; } = new()
    {
        "標準",
        "狭い",
        "広い",
        "ユーザー設定..."
    };

    // 印刷の向きオプション
    public ObservableCollection<string> OrientationOptions { get; } = new()
    {
        "縦",
        "横"
    };

    public ICommand PrintCommand { get; }
    public ICommand PreviousPageCommand { get; }
    public ICommand NextPageCommand { get; }

    public PrintViewModel()
    {
        AvailablePrinters = GetAvailablePrinters();
        SelectedPrinter = GetDefaultPrinter();
        PrintCommand = new RelayCommand(ExecutePrint);
        PreviousPageCommand = new RelayCommand(PreviousPage, () => CurrentPage > 1);
        NextPageCommand = new RelayCommand(NextPage, () => CurrentPage < TotalPages);
    }

    private ObservableCollection<PrintQueue> GetAvailablePrinters()
    {
        var printServer = new LocalPrintServer();
        var queues = printServer.GetPrintQueues();
        return new ObservableCollection<PrintQueue>(queues);
    }

    private PrintQueue GetDefaultPrinter()
    {
        var printServer = new LocalPrintServer();
        return printServer.DefaultPrintQueue;
    }

    private void ExecutePrint()
    {
        // 印刷実行ロジック（製品固有）
    }

    private void UpdatePreview()
    {
        // プレビュー更新（製品固有）
    }
}
```

#### 印刷機能チェックリスト

- [ ] BackStage に「印刷」タブ（BackStageTabItem）が実装されている
- [ ] 印刷プレビューが表示される
- [ ] ページナビゲーション（◀ / ▶）が動作する
- [ ] プリンター選択ができる
- [ ] 部数指定ができる
- [ ] 印刷範囲が選択できる（製品固有オプション）
- [ ] 用紙サイズが選択できる
- [ ] 余白設定ができる
- [ ] 印刷の向きが選択できる
- [ ] 印刷ボタンで実際に印刷される

---

### 検出パターン（validate-standards.sh でチェック）

| パターン | 問題 | 深刻度 |
|---------|------|:------:|
| `<syncfusion:Ribbon[^>]*Background=` | Ribbon に Background 属性 | error |
| `<syncfusion:Backstage[^>]*Background=` | Backstage に Background 属性 | error |
| `<syncfusion:Ribbon.Resources>` | Ribbon 内部リソース上書き | error |
| `<syncfusion:Backstage.Resources>` | Backstage 内部リソース上書き | error |
| `<syncfusion:RibbonBackStage` | 旧 API 使用 | warning |
| `ShowCustomizeRibbon="True"` | カスタマイズUI表示 | warning |
| RibbonTab が Ribbon.Items 外 | 構造エラー | error |

### Ribbon/BackStage チェックリスト

- [ ] `syncfusion:Ribbon` に `Background` 属性が**ない**
- [ ] `syncfusion:Ribbon` に `ShowCustomizeRibbon="False"` が設定されている
- [ ] `syncfusion:Ribbon` に `EnableSimplifiedLayoutMode="False"` が設定されている
- [ ] `syncfusion:Ribbon` に `BackStageHeader="ファイル"` が設定されている
- [ ] `RibbonTab` が `<syncfusion:Ribbon.Items>` 内にラップされている
- [ ] `syncfusion:Backstage` に `Background` 属性が**ない**
- [ ] `<syncfusion:Ribbon.Resources>` で内部スタイルを上書きして**いない**
- [ ] `<syncfusion:Backstage.Resources>` で内部スタイルを上書きして**いない**
- [ ] BackStage に必須コマンド（新規作成/開く/保存/名前を付けて保存/印刷/閉じる）がある
- [ ] BackStage コマンドの Header が統一フォーマットに従っている

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
