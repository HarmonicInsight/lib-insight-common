# Insight Business Suite パネル統合ガイド

> **対象アプリ**: IOSH (Sheet), IOSD (Doc), INSS (Slide)

このドキュメントでは、3つのInsight Business Suiteアプリで共通のSyncfusionメニュー、タイトルバー、サイドパネルを統一する方法を説明します。

---

## 1. 共通リソース一覧

| ファイル | 役割 |
|---------|------|
| `InsightIcons.cs` | 統一アイコンコード定義（Segoe MDL2 Assets + 絵文字 + ライセンス） |
| `InsightTitleBar.cs` | タイトルバー構築（製品名・バージョン・プランバッジ・パネルトグル） |
| `PanelViewModelBase.cs` | パネルViewModel基底クラス（開閉・リサイズ・ライセンスゲート） |
| `InsightPanelStyles.cs` | パネルUI生成ヘルパー（ヘッダー・ボタン・Thumb等） |
| `InsightTheme.cs` | テーマ定義（カラー・フォント） |
| `InsightColors.cs` | カラー定義（Ivory & Gold） |

---

## 2. アイコンコードの統一

### 2.1 推奨アイコンマッピング

| 機能 | Segoe MDL2 | 絵文字 | 用途 |
|------|-----------|--------|------|
| **ファイル操作** | | | |
| 新規 | `\uE7C3` | 📄 | メニュー・ツールバー |
| 開く | `\uE838` | 📂 | メニュー・ツールバー |
| 保存 | `\uE74E` | 💾 | メニュー・ツールバー |
| 名前を付けて保存 | `\uE792` | 💾 | メニュー |
| エクスポート | `\uE9F9` | - | メニュー |
| 印刷 | `\uE749` | 🖨️ | メニュー |
| 閉じる | `\uE8BB` | ✕ | メニュー・タブ |
| **編集** | | | |
| 切り取り | `\uE8C6` | ✂️ | リボン |
| コピー | `\uE8C8` | 📋 | リボン |
| 貼り付け | `\uE77F` | - | リボン |
| 検索 | `\uE721` | 🔍 | リボン |
| **パネル** | | | |
| 履歴/バージョン | `\uE81C` | 📜 | パネルヘッダー |
| 変更ログ | `\uE7C3` | ⏲ | パネルヘッダー |
| 掲示板 | `\uE8A5` | 📋 | パネルヘッダー |
| AIアシスタント | `\uE99A` | 🤖 | パネルヘッダー |
| Python | `\uE943` | 🐍 | パネルヘッダー |
| 参考資料 | `\uE723` | 📎 | パネルヘッダー |

### 2.2 使用方法

```csharp
using InsightCommon.UI;

// Segoe MDL2 Assets
var icon = InsightIcons.Save;  // "\uE74E"

// 絵文字
var emoji = InsightIcons.Emoji.AI;  // "🤖"

// フォントファミリ
var font = InsightIcons.FontFamily;  // "Segoe MDL2 Assets"

// サイズ
var size = InsightIcons.Size.Large;  // 20
```

### 2.3 XAMLでの使用

```xml
<!-- Segoe MDL2 Assets -->
<TextBlock Text="&#xE74E;"
           FontFamily="Segoe MDL2 Assets"
           FontSize="16"/>

<!-- 絵文字 -->
<TextBlock Text="🤖" FontSize="16"/>
```

---

## 3. パネルViewModel統合

### 3.1 基底クラスの継承

```csharp
using InsightCommon.UI;
using InsightCommon.License;

public class HistoryViewModel : HistoryPanelViewModelBase
{
    public HistoryViewModel(InsightLicenseManager? licenseManager = null)
        : base(licenseManager)
    {
    }

    // 必須オーバーライド
    public override bool IsCompareMode { get; set; }
    public override ICommand ToggleCompareModeCommand => _toggleCompareCmd;
    public override ICommand SaveVersionCommand => _saveVersionCmd;

    // カスタム実装...
}
```

### 3.2 AIパネルの継承

```csharp
public class ChatViewModel : AiPanelViewModelBase
{
    public ChatViewModel(InsightLicenseManager? licenseManager = null)
        : base(licenseManager)
    {
    }

    public override bool HasApiKey => !string.IsNullOrEmpty(_apiKey);
    public override bool IsSending => _isSending;
    public override ICommand SendCommand => _sendCmd;
    public override ICommand ClearCommand => _clearCmd;
}
```

### 3.3 パネル開閉のバインディング

```xml
<!-- Grid列幅をViewModelにバインド -->
<Grid.ColumnDefinitions>
    <ColumnDefinition Width="*"/>
    <ColumnDefinition Width="{Binding HistoryVM.GridWidth}"/>
    <ColumnDefinition Width="{Binding ChatVM.GridWidth}"/>
</Grid.ColumnDefinitions>

<!-- ツールバーボタン -->
<Button Command="{Binding HistoryVM.ToggleCommand}"
        ToolTip="履歴の表示/非表示">
    <TextBlock Text="📜"
               Opacity="{Binding HistoryVM.Opacity}"/>
</Button>
```

---

## 4. パネルスタイルの統一

### 4.1 パネルヘッダー生成

```csharp
using InsightCommon.UI;

// パネルヘッダーを生成
var header = InsightPanelStyles.CreatePanelHeader(
    definition: InsightIcons.Panels.History,
    theme: _theme,
    useEmoji: true,
    rightButtons: new[]
    {
        InsightPanelStyles.CreatePanelButton("＋ 保存", _theme,
            command: _saveVersionCmd, isPrimary: true),
        InsightPanelStyles.CreateIconButton(InsightIcons.Search, _theme,
            command: _compareCmd, tooltip: "バージョン間比較"),
    }
);
```

### 4.2 リサイズThumb

```csharp
// リサイズハンドル
var thumb = InsightPanelStyles.CreateResizeThumb("history", _theme);
thumb.DragDelta += (s, e) =>
{
    var minWidth = InsightIcons.Panels.History.MinWidth;
    vm.HistoryVM.Width = Math.Max(minWidth,
        vm.HistoryVM.Width - e.HorizontalChange);
};
```

### 4.3 状態別行背景色

```csharp
// DataGridの行背景色
var background = InsightPanelStyles.GetStatusRowBackground(item.Status);
// "edited" → #E3F2FD (青)
// "added"  → #E8F5E9 (緑)
// "deleted" → #FFEBEE (赤)
```

### 4.4 チャットメッセージスタイル

```csharp
// メッセージ背景
var bg = InsightPanelStyles.GetChatMessageBackground(message.Role);
// "user" → #E3F2FD
// "assistant" → #F3E5F5

// コーナー半径
var radius = InsightPanelStyles.GetChatMessageCornerRadius(message.Role);
// "user" → 右下が角
// "assistant" → 左下が角
```

---

## 5. パネル構成比較

### 5.1 アプリ別パネル

| パネル | Sheet | Doc | Slide | 共通化 |
|--------|:-----:|:---:|:-----:|:------:|
| 履歴/バージョン | ✅ | ✅ | ❌ | `HistoryPanelViewModelBase` |
| 変更ログ | ✅ | ❌ | ❌ | Sheet固有 |
| 掲示板 | ✅ | ❌ | ❌ | Sheet固有 |
| AIアシスタント | ✅ | ✅ | ✅ | `AiPanelViewModelBase` |
| Python | ✅ | ❌ | ❌ | Sheet固有 |
| 参考資料 | ❌ | ✅ | ❌ | `ReferencePanelViewModelBase` |
| テキスト編集 | ❌ | ❌ | ✅ | Slide固有 |

### 5.2 推奨パネル配置

```
Sheet:  [履歴] [変更ログ] [掲示板] [AI] [Python]
Doc:    [履歴] [参考資料] [AI]
Slide:  [テキスト] [AI] [比較]
```

---

## 6. ライセンスゲート

### 6.1 パネル別ライセンス要件

| パネル | FREE | BIZ | ENT |
|--------|:----:|:---:|:---:|
| 履歴 | ✅ | ✅ | ✅ |
| 変更ログ | ✅ | ✅ | ✅ |
| AI（月200回） | ❌ | ✅ | ✅ |
| AI（無制限） | ❌ | ❌ | ✅ |
| 掲示板 | ❌ | ❌ | ✅ |
| Python | ❌ | ✅ | ✅ |
| 参考資料 | ✅ | ✅ | ✅ |

### 6.2 ライセンスチェック実装

```csharp
// PanelViewModelBaseが自動でチェック
public bool IsAvailable
{
    get
    {
        if (_definition.LicenseGate == PanelLicenseGate.None)
            return true;

        var plan = _licenseManager.CurrentLicense?.Plan ?? PlanCode.FREE;
        return _definition.LicenseGate switch
        {
            PanelLicenseGate.Biz => plan >= PlanCode.BIZ,
            PanelLicenseGate.Enterprise => plan >= PlanCode.ENT,
            _ => true
        };
    }
}
```

### 6.3 アップグレード促進

```csharp
// ライセンス不足時にプロンプト表示
if (!vm.BoardVM.IsAvailable)
{
    var prompt = InsightPanelStyles.CreateUpgradePrompt(
        InsightIcons.Panels.Board,
        _theme,
        onUpgradeClick: () => ShowLicenseDialog()
    );
    panelContent.Children.Add(prompt);
}
```

---

## 7. 移行手順

### Step 1: 依存関係の追加

```xml
<!-- .csproj -->
<ProjectReference Include="..\..\insight-common\csharp\InsightCommon\InsightCommon.csproj" />
```

### Step 2: 既存ViewModelの継承変更

```csharp
// Before
public class HistoryViewModel : ObservableObject
{
    public bool IsHistoryOpen { get; set; }
    public ICommand ToggleHistoryCommand { get; }
}

// After
public class HistoryViewModel : HistoryPanelViewModelBase
{
    // IsOpen, ToggleCommand は基底クラスで提供
    // アプリ固有のロジックのみ実装
}
```

### Step 3: アイコンコードの統一

```csharp
// Before（各アプリでバラバラ）
var icon = "\uE8E5";  // Sheet
var icon = "\uE838";  // Doc

// After（統一）
var icon = InsightIcons.Open;  // "\uE838"
```

### Step 4: XAMLスタイルの共通化

```xml
<!-- Before -->
<TextBlock Text="&#xE8E5;" FontFamily="Segoe MDL2 Assets"/>

<!-- After -->
<TextBlock Text="{x:Static ui:InsightIcons.Open}"
           FontFamily="{x:Static ui:InsightIcons.FontFamily}"/>
```

---

## 8. 注意事項

### 8.1 アイコン選定基準

- **リボンメニュー**: Segoe MDL2 Assets を使用（Microsoft Office との一貫性）
- **パネルヘッダー**: 絵文字を推奨（視認性向上）
- **ツールバー**: 絵文字または Segoe MDL2（コンテキストに応じて）

### 8.2 サイズ統一

| 場所 | FontSize |
|------|----------|
| リボン Large | 24px |
| リボン Small | 16px |
| ツールバー | 16px |
| パネルヘッダー | 14-16px |

### 8.3 カラー統一

- すべてのカラーは `InsightColors` / `InsightTheme` から参照
- ハードコードされた色値（`#XXXXXX`）を使用しない
- パネル状態色は `InsightPanelStyles.GetStatusRowBackground()` を使用

---

## 9. タイトルバー統合

### 9.1 タイトルバー構成

全アプリで統一されたタイトルバー構成:

```
┌─────────────────────────────────────────────────────────────────────┐
│ [製品名] v2.1.0 [TRIAL]  │  [📜][⏲][📋][🤖][🐍] │ [JA][🔑][−][□][×] │
│   ↑        ↑      ↑      │         ↑            │    ↑    ↑          │
│ Gold    Gray  Badge      │    Panel Toggles     │ Lang License WinCtl│
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 タイトルバー生成

```csharp
using InsightCommon.UI;

var options = new InsightTitleBar.TitleBarOptions
{
    Product = InsightTitleBar.Products.Sheet,
    Version = "v2.1.0",
    Plan = PlanCode.Biz,
    PanelToggles = new[]
    {
        new InsightTitleBar.PanelToggleInfo
        {
            Definition = InsightIcons.Panels.History,
            UseEmoji = true,
        },
        new InsightTitleBar.PanelToggleInfo
        {
            Definition = InsightIcons.Panels.AI,
            UseEmoji = true,
        },
    },
    ShowLanguageToggle = true,
    ShowLicenseButton = true,
    CurrentLanguage = "JA",
};

var titleBar = InsightTitleBar.Create(
    options,
    _theme,
    onMinimize: w => w.WindowState = WindowState.Minimized,
    onMaximizeRestore: w => w.WindowState = w.WindowState == WindowState.Maximized
        ? WindowState.Normal : WindowState.Maximized,
    onClose: w => w.Close(),
    onLanguageToggle: () => ToggleLanguage(),
    onLicenseClick: () => ShowLicenseDialog()
);
```

### 9.3 プランバッジ

```csharp
// プランバッジを個別生成
var badge = InsightTitleBar.CreatePlanBadge(PlanCode.Biz, _theme);
```

| プラン | 表示 | 背景色 |
|--------|------|--------|
| FREE | `FREE` | PrimaryLight (#F0E6C8) |
| TRIAL | `TRIAL` | PrimaryLight |
| BIZ | `BIZ` | PrimaryLight |
| ENT | `ENT` | PrimaryLight |

---

## 10. ライセンスアイコン

### 10.1 ライセンス画面用アイコン

| 用途 | Segoe MDL2 | 絵文字 | 説明 |
|------|-----------|--------|------|
| ライセンスキー | `\uE8D7` | 🔑 | タイトルバー |
| 利用可能 | `\uE73E` | ✅ | 機能一覧 |
| 制限/ロック | `\uE72E` | 🔒 | 機能一覧 |
| アップグレード | `\uE8AB` | ⭐ | ボタン |
| プレミアム | `\uE7C1` | 👑 | ENTプラン |

### 10.2 機能一覧の表示

```csharp
using InsightCommon.UI;

// 機能が利用可能かどうかでアイコンを切り替え
bool hasFeature = _licenseManager.HasFeature("ai_assistant");

var icon = InsightTitleBar.GetFeatureAvailableIcon(hasFeature);
// hasFeature=true  → "✅"
// hasFeature=false → "🔒 PRO"

var color = InsightTitleBar.GetFeatureAvailableBrush(hasFeature, _theme);
// hasFeature=true  → SuccessBrush (緑)
// hasFeature=false → TextMutedBrush (グレー)
```

### 10.3 プラン別アイコン

```csharp
var planIcon = InsightTitleBar.GetPlanIcon(PlanCode.Ent);
// Ent   → "👑"
// Pro   → "⭐"
// Std   → "✅"
// Trial → "⏱"
// Free  → "🔒"
```

---

## 11. パネルトグルボタン配置（統一）

### 11.1 推奨配置順序

右側 → 左側の順序で配置:

```
Sheet:  [履歴📜][変更ログ⏲][掲示板📋][AI🤖][Python🐍] │ [JA][🔑][−][□][×]
Doc:    [履歴📜][参考資料📎][AI🤖]                    │ [JA][🔑][−][□][×]
Slide:  （Syncfusion Ribbonを使用、タイトルバーにパネルトグルなし）
```

### 11.2 ボタンスタイル

| 項目 | 値 |
|------|-----|
| 幅 | 36px |
| 高さ | 32px |
| アイコンサイズ | 16px（絵文字）/ 14px（Segoe MDL2） |
| 開状態 | Opacity = 1.0 |
| 閉状態 | Opacity = 0.4 |

### 11.3 セパレータ

パネルトグルとウィンドウコントロールの間にセパレータを配置:

```csharp
var separator = InsightTitleBar.CreateSeparator(_theme);
// Width=1, Height=20, Fill=BorderBrush, Margin=4,0
```

---

## 12. 参照

- `csharp/InsightCommon/UI/InsightIcons.cs` - アイコン定義（ライセンス含む）
- `csharp/InsightCommon/UI/InsightTitleBar.cs` - タイトルバー構築
- `csharp/InsightCommon/UI/PanelViewModelBase.cs` - ViewModel基底クラス
- `csharp/InsightCommon/UI/InsightPanelStyles.cs` - スタイルヘルパー
- `csharp/InsightCommon/Theme/InsightTheme.cs` - テーマ定義
- `csharp/InsightCommon/Theme/InsightColors.cs` - カラー定義
