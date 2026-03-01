# ヘルプシステム標準仕様

> INSS（Insight Deck Quality Gate）を基準実装として、全 WPF アプリのヘルプシステムを統一する。

---

## §0 マーケティング方針 — ヘルプは「製品の価値を再確認する接点」

**ヘルプは機能マニュアルではない。** ユーザーがヘルプを開く = 操作に迷っている or 機能を探している瞬間であり、製品の価値を再確認させる絶好のタッチポイントである。

### ライティング原則

| ルール | 悪い例 | 良い例 |
|--------|--------|--------|
| **機能ではなく効果を書く** | 「バージョン管理機能があります」 | 「編集前に自動バックアップ。いつでも安心して修正できます」 |
| **主語はユーザー** | 「本機能は差分を検出します」 | 「2つのファイルの違いを瞬時に把握できます」 |
| **専門用語を避ける** | 「BYOK 方式で API キーを…」 | 「お手持ちの API キーですぐにご利用いただけます」 |
| **数字で具体化** | 「多くの関数に対応」 | 「SUM から VLOOKUP まで 400 以上の関数に対応」 |
| **アップグレード誘導は自然に** | 「ENT プランを購入してください」 | 「チームでの本格運用には BIZ / ENT プランをご検討ください」 |

### セクションリード文

各セクションの冒頭に1〜2文のリード文（`description`）を必ず配置する。このリード文は TOC 下にサマリーとしても表示されるため、ベネフィットを端的に伝えること。

```html
<!-- 良い例 -->
<p class="section-lead">
  2つのファイルをスライド単位で差分比較。レビュー工数を大幅に削減できます。
</p>

<!-- 悪い例: 機能説明のみ -->
<p class="section-lead">
  ファイル比較機能の使い方を説明します。
</p>
```

### 共通コンテンツの利用

`config/help-content.ts` に全製品で再利用する HTML テンプレートが定義されている。ライセンス・システム要件・サポート・AI アシスタントの4セクションは共通コンテンツを使用すること。

```csharp
// C# での利用イメージ（各アプリの HelpWindow.cs）
// help-content.ts の SHARED_LICENSE_CONTENT 等を参照して HTML を構築
```

### 製品マーケティング情報

各製品のヘルプ冒頭（overview セクション）に以下を表示する:

1. **キャッチコピー**（`marketing.tagline`）— ヒーローエリアに大きく表示
2. **導入価値**（`marketing.valueProposition`）— 3行以内で「なぜこの製品か」
3. **効果キーワード**（`marketing.benefitKeywords`）— feature-card 形式で4つ表示

```html
<div class="hero">
  <h1>{productName}</h1>
  <p class="tagline">{tagline}</p>
</div>
<p>{valueProposition}</p>
<div class="feature-grid">
  <!-- benefitKeywords を feature-card で表示 -->
</div>
```

### ISOF（シニア向け）の特別ルール

InsightSeniorOffice のヘルプは一般的なビジネス文体ではなく、**やさしい日本語**を使用する:

- 漢字にはふりがなを振る（HTML の `<ruby>` タグ）
- 専門用語は使わず、日常的な言葉で説明
- 文は短く、一文一意
- 「〜できます」ではなく「〜できるようになります」（学習の喜びを感じさせる）

---

## §1 概要

### 設計思想

HelpWindow は C# で HTML を動的生成し、WPF の `WebBrowser` コントロールで表示する。
外部 HTML ファイルを同梱せず、アプリ内で完結する。

```
┌──────────────────────────────────────────────┐
│  HelpWindow (1050×740)                        │
│  ┌────────────┬─────────────────────────────┐ │
│  │ TOC        │ WebBrowser                   │ │
│  │ Sidebar    │ （C# で生成した HTML）        │ │
│  │ (210px)    │                              │ │
│  │            │                              │ │
│  │ ・はじめに  │  <h2>はじめに</h2>            │ │
│  │ ・画面構成  │  <p>製品概要...</p>           │ │
│  │ ・AI       │                              │ │
│  │ ・ショート  │                              │ │
│  │   カット    │                              │ │
│  │ ・ライセンス│                              │ │
│  │ ・...      │                              │ │
│  └────────────┴─────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 呼び出しフロー

```
ユーザー操作                       処理
─────────────                    ────────
F1 キー押下                →  ShowHelpSectionCommand("overview")
Ribbon ヘルプボタン         →  ShowHelpCommand
パネルの ? ボタン           →  ShowHelpSectionCommand("ai-assistant")
ダイアログの ? ボタン       →  HelpWindow.ShowSection(owner, "license")
メニュー > ヘルプ > 操作マニュアル →  ShowHelpCommand
```

---

## §2 HelpWindow 標準仕様

| 項目 | 値 | 備考 |
|------|-----|------|
| **ウィンドウサイズ** | 1050×740 | 固定推奨 |
| **レイアウト** | 左 210px TOC sidebar + 右 WebBrowser | Grid で分割 |
| **セクション ID** | **string（必須）** | integer は**禁止** |
| **Open mode** | **ShowDialog()（必須）** | Show() は**禁止** |
| **XAML 色参照** | **DynamicResource / StaticResource（必須）** | ハードコード色は**禁止** |
| **ナビゲーション** | `scrollIntoView({behavior:'smooth',block:'start'})` | JavaScript で実行 |
| **外部リンク** | `Navigating` イベントで default browser に転送 | アプリ内では開かない |
| **コンストラクタ** | `HelpWindow(string? initialSection = null)` | null なら先頭表示 |
| **WindowStartupLocation** | `CenterOwner` | 親ウィンドウの中央 |
| **ResizeMode** | `CanResize` | ユーザーがリサイズ可能 |

### コンストラクタ

```csharp
public partial class HelpWindow : Window
{
    private readonly string? _initialSection;

    public HelpWindow(string? initialSection = null)
    {
        InitializeComponent();
        _initialSection = initialSection;
    }

    private void Window_Loaded(object sender, RoutedEventArgs e)
    {
        var html = GenerateHelpHtml();
        HelpBrowser.NavigateToString(html);
    }

    private void HelpBrowser_LoadCompleted(object sender, NavigationEventArgs e)
    {
        if (_initialSection != null)
        {
            ScrollToSection(_initialSection);
        }
    }

    private void ScrollToSection(string sectionId)
    {
        HelpBrowser.InvokeScript("eval",
            $"document.getElementById('{sectionId}')?.scrollIntoView({{behavior:'smooth',block:'start'}})");
    }
}
```

### 外部リンク処理

```csharp
private void HelpBrowser_Navigating(object sender, NavigatingCancelEventArgs e)
{
    if (e.Uri != null && e.Uri.Scheme is "http" or "https")
    {
        e.Cancel = true;
        Process.Start(new ProcessStartInfo(e.Uri.AbsoluteUri) { UseShellExecute = true });
    }
}
```

---

## §3 HTML スタイル標準（INSS 準拠）

### カラーパレット

| 用途 | Ivory & Gold | Cool Blue & Slate |
|------|-------------|-------------------|
| 見出し色 | `#B8942F` (Gold) | `#2563EB` (Blue) |
| 背景色 | `#FAF8F5` (Ivory) | `#F8FAFC` (Slate) |
| カード背景 | `#FFFFFF` | `#FFFFFF` |
| テキスト | `#1C1917` | `#0F172A` |
| サブテキスト | `#57534E` | `#475569` |
| ボーダー | `#E7E2DA` | `#E2E8F0` |

### コールアウトスタイル

```html
<!-- ヒント（amber） -->
<div class="tip">
    <strong>💡 ヒント:</strong> 役立つ情報をここに記載
</div>

<!-- 注意（purple） -->
<div class="note">
    <strong>📝 注意:</strong> 注意事項をここに記載
</div>
```

```css
.tip {
    background: #FFF8E1;
    border-left: 4px solid #FFA000;
    padding: 12px 16px;
    margin: 12px 0;
    border-radius: 0 6px 6px 0;
}
.note {
    background: #F3E5F5;
    border-left: 4px solid #7B1FA2;
    padding: 12px 16px;
    margin: 12px 0;
    border-radius: 0 6px 6px 0;
}
```

### プランバッジ

```html
<span class="badge-biz">BIZ</span>
<span class="badge-ent">ENT</span>
<span class="badge-trial">TRIAL</span>
```

```css
.badge-biz {
    background: #B8942F; color: white;
    padding: 2px 8px; border-radius: 4px;
    font-size: 11px; font-weight: bold;
}
.badge-ent {
    background: #7C3AED; color: white;
    padding: 2px 8px; border-radius: 4px;
    font-size: 11px; font-weight: bold;
}
.badge-trial {
    background: #0EA5E9; color: white;
    padding: 2px 8px; border-radius: 4px;
    font-size: 11px; font-weight: bold;
}
```

### Feature Grid（2カラムレイアウト）

```html
<div class="feature-grid">
    <div class="feature-card">
        <h4>機能名</h4>
        <p>機能の説明</p>
    </div>
    <div class="feature-card">
        <h4>機能名</h4>
        <p>機能の説明</p>
    </div>
</div>
```

```css
.feature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 16px 0;
}
.feature-card {
    background: #FFFFFF;
    border: 1px solid #E7E2DA;
    border-radius: 8px;
    padding: 16px;
}
.feature-card h4 {
    color: #B8942F;
    margin: 0 0 8px 0;
}
```

### ステップ表示

```html
<div class="step">
    <span class="step-num">1</span>
    <div>ステップの説明文</div>
</div>
```

```css
.step {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 12px 0;
}
.step-num {
    background: #B8942F;
    color: white;
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    flex-shrink: 0;
}
```

### キーボードショートカット表示

```html
<kbd>Ctrl</kbd> + <kbd>S</kbd>
```

```css
kbd {
    background: #F5F5F5;
    border: 1px solid #CCCCCC;
    border-radius: 3px;
    padding: 2px 6px;
    font-family: 'Consolas', monospace;
    font-size: 12px;
}
```

### ヒーローエリア（overview セクション冒頭）

```html
<div class="hero">
    <h1>Insight Deck Quality Gate</h1>
    <p class="tagline">プレゼン品質を、AIの力で一段上へ</p>
</div>
```

```css
.hero {
    text-align: center;
    padding: 32px 24px;
    margin-bottom: 24px;
    border-bottom: 2px solid #E7E2DA;
}
.hero h1 {
    color: #B8942F;
    font-size: 24px;
    margin: 0 0 8px 0;
}
.tagline {
    color: #57534E;
    font-size: 16px;
    font-style: italic;
    margin: 0;
}
```

### セクションリード文

```html
<p class="section-lead">
    2つのファイルをスライド単位で差分比較。レビュー工数を大幅に削減できます。
</p>
```

```css
.section-lead {
    color: #57534E;
    font-size: 14px;
    border-left: 3px solid #B8942F;
    padding-left: 12px;
    margin: 8px 0 16px 0;
}
```

### アップグレード誘導（自然な CTA）

```html
<div class="upgrade-hint">
    <strong>さらに活用するには</strong>
    <p>チームでの本格運用には BIZ / ENT プランをご検討ください。
    詳しくは<a href="#license">ライセンス・プラン</a>をご覧ください。</p>
</div>
```

```css
.upgrade-hint {
    background: linear-gradient(135deg, #FAF8F5, #F0E6C8);
    border: 1px solid #E7E2DA;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
}
.upgrade-hint strong {
    color: #B8942F;
}
```

### プラン比較テーブル

```css
.plan-table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
}
.plan-table th {
    background: #B8942F;
    color: white;
    padding: 8px 12px;
    text-align: center;
}
.plan-table td {
    padding: 8px 12px;
    border-bottom: 1px solid #E7E2DA;
    text-align: center;
}
.plan-table td:first-child {
    text-align: left;
    font-weight: 500;
}
.plan-table tr:hover {
    background: #FAF8F5;
}
```

---

## §4 必須セクション（全製品共通 — 最低6セクション）

すべての WPF 製品は以下の6セクションを**必ず**含めること。

### 1. はじめに (`overview`) — 製品の第一印象を決める

- **ヒーローエリア**: キャッチコピー（`marketing.tagline`）を大きく表示
- **導入価値**: 「なぜこの製品を使うのか」を3行以内で（`marketing.valueProposition`）
- **効果キーワード**: `feature-card` 形式で4つ（`marketing.benefitKeywords`）
- **対象ユーザー**: 「こんな方におすすめ」形式で（`marketing.targetAudience`）

> ポイント: 機能一覧ではなく「導入効果」を先に伝える。ユーザーが「自分に必要だ」と感じるように。

### 2. 画面構成 (`ui-layout`) — 迷わず使い始められる

- アプリのレイアウト図（ASCII or 番号付きスクリーンショット）
- 各エリアの名前と「何ができるか」を簡潔に
- 初回起動時に最初にやることを3ステップで

> ポイント: 「A のエリアでファイルを開き、B で編集、C の AI に相談」のようなフロー形式が効果的。

### 3. キーボードショートカット (`shortcuts`) — 作業効率アップ

- 全ショートカットを表形式で一覧表示
- カテゴリ別に整理（ファイル操作、編集、表示 等）
- `kbd` タグでキー表示
- 「まず覚えたい5つのショートカット」を冒頭に

### 4. ライセンス (`license`) — 適切なプラン選択を支援

- **共通コンテンツを使用**: `SHARED_LICENSE_CONTENT`（`config/help-content.ts`）
- プラン比較表（FREE / TRIAL / BIZ / ENT）
- FREE でも全機能使えることを強調（保存制限のみ）
- アクティベーション手順（ステップ形式）
- ライセンスキー形式の説明

> ポイント: FREE → BIZ へのアップグレード動機を自然に喚起する。「チームでの本格運用には…」

### 5. システム要件 (`system-req`) — 導入ハードルを下げる

- **共通コンテンツを使用**: `SHARED_SYSTEM_REQ_CONTENT`（`config/help-content.ts`）
- OS（Windows 10/11）、CPU、RAM（最低 / 推奨）、HDD、ディスプレイ
- .NET ランタイムはインストーラーに同梱されることを明記
- ポータブル版（ZIP）の存在を伝え、気軽に試せることを訴求

### 6. お問い合わせ (`support`) — 安心感を提供

- **共通コンテンツを使用**: `SHARED_SUPPORT_CONTENT`（`config/help-content.ts`）
- メールサポート: `support@h-insight.jp`、平日 9:00〜18:00
- 導入・活用相談: `sales@harmonicinsight.com`
- ENT は優先サポート対応であることを明記
- 問い合わせ時に添えるべき情報（製品名・バージョン・ライセンスキー・状況）

### AI 搭載製品の追加必須セクション

INSS / IOSH / IOSD / INMV / INPY / INBT は `ai-assistant` セクションを必ず含めること。

- **共通コンテンツを使用**: `SHARED_AI_ASSISTANT_CONTENT`（`config/help-content.ts`）
- 「回数制限なし・全モデル選択可能」を最初にアピール
- API キー設定手順（3ステップ、BYOK の安全性を強調）
- モデル選択ガイド（Haiku=高速、Sonnet=バランス、Opus=高精度）
- BYOK のメリット: 「弊社サーバーを経由しないため、機密データの安全性が確保されます」

---

## §5 コンテキストヘルプ（? ボタン）標準

### 配置ルール

全パネルヘッダーの右端に `?` ボタンを配置する。

```xml
<!-- 標準パターン: 各パネルヘッダーに設置 -->
<Button Style="{StaticResource SecondaryButtonStyle}"
        Command="{Binding ShowHelpSectionCommand}"
        CommandParameter="ai-assistant"
        ToolTip="{Binding TipPanelHelp}"
        Padding="3,1" Margin="6,0,0,0" FontSize="10"
        MinWidth="0" MinHeight="0">
    <TextBlock Text="&#xE897;" FontFamily="Segoe MDL2 Assets" FontSize="11" />
</Button>
```

### ルール

| ルール | 説明 |
|--------|------|
| **配置** | 全パネルヘッダーの右端 |
| **コマンド** | `ShowHelpSectionCommand` にバインド |
| **パラメータ** | `CommandParameter` にセクション ID（string）を渡す |
| **ツールチップ** | `"このパネルのヘルプを表示します"` で統一 |
| **アイコン** | `&#xE897;` (Segoe MDL2 Assets — Help アイコン) |
| **スタイル** | `SecondaryButtonStyle` |

### ダイアログからのヘルプ呼び出し

ダイアログ（Window）から ? ボタンでヘルプを開く場合は、`HelpWindow.ShowSection()` static メソッドを使用する。

```xml
<!-- ダイアログ内の ? ボタン -->
<Button Click="OnHelpClick" ToolTip="ヘルプ" Padding="3,1" MinWidth="0" MinHeight="0">
    <TextBlock Text="&#xE897;" FontFamily="Segoe MDL2 Assets" FontSize="11" />
</Button>
```

```csharp
private void OnHelpClick(object sender, RoutedEventArgs e)
{
    HelpWindow.ShowSection(this, "license");
}
```

---

## §6 static ShowSection() メソッド

IOSD のパターンを全製品に展開する。HelpWindow に以下の static メソッドを**必ず**実装すること。

```csharp
/// <summary>
/// 任意の Window からヘルプを指定セクションで開く（ダイアログ等から使用）
/// </summary>
public static void ShowSection(Window owner, string sectionId)
{
    var helpWindow = new HelpWindow(sectionId) { Owner = owner };
    helpWindow.ShowDialog();
}
```

### 使用例

```csharp
// ライセンスダイアログから
HelpWindow.ShowSection(this, "license");

// 設定ダイアログから
HelpWindow.ShowSection(this, "shortcuts");

// AI 設定ダイアログから
HelpWindow.ShowSection(this, "ai-assistant");
```

---

## §7 RIBBON ヘルプバー標準

Ribbon を使用する製品（INSS / IOSH / IOSD）では、Home タブの最後に「ヘルプ」RibbonBar を配置する。

```xml
<!-- Home タブの最後に配置 -->
<syncfusion:RibbonBar Header="{Binding LocHelp}">
    <syncfusion:RibbonButton Label="{Binding LocHelp}" SizeForm="Small"
        Command="{Binding ShowHelpCommand}"
        ToolTip="{Binding TipHelp}"
        IconTemplate="{StaticResource IconHelpSmall}" />
</syncfusion:RibbonBar>
```

### IconTemplate 定義

```xml
<DataTemplate x:Key="IconHelpSmall">
    <TextBlock Text="&#xE897;" FontFamily="Segoe MDL2 Assets" FontSize="14"
               HorizontalAlignment="Center" VerticalAlignment="Center" />
</DataTemplate>
```

### 非 Ribbon アプリの場合

メニューバーの「ヘルプ」メニューに操作マニュアル項目を配置する。
`InsightWindowChrome.CreateHelpMenu()` を使用すること。

---

## §8 F1 キーバインド

全製品で F1 キーでヘルプウィンドウを開けるようにする。

```xml
<Window.InputBindings>
    <KeyBinding Key="F1" Command="{Binding ShowHelpSectionCommand}" CommandParameter="overview" />
</Window.InputBindings>
```

---

## §9 ViewModel コマンド標準

ViewModel に以下の2つのコマンドを実装する。

```csharp
/// <summary>
/// ヘルプウィンドウを開く（先頭から表示）
/// </summary>
[RelayCommand]
private void ShowHelp()
{
    new Views.HelpWindow { Owner = Application.Current.MainWindow }.ShowDialog();
}

/// <summary>
/// ヘルプウィンドウを指定セクションで開く（? ボタン・F1 から使用）
/// </summary>
[RelayCommand]
private void ShowHelpSection(string? sectionId)
{
    new Views.HelpWindow(sectionId) { Owner = Application.Current.MainWindow }.ShowDialog();
}
```

### ツールチップのローカライズキー

| キー | 日本語 | 英語 |
|------|--------|------|
| `TipHelp` | `ヘルプを表示します (F1)` | `Show help (F1)` |
| `TipPanelHelp` | `このパネルのヘルプを表示します` | `Show help for this panel` |
| `LocHelp` | `ヘルプ` | `Help` |

---

## §10 ヘルプメニュー構成（InsightWindowChrome）

### 新しい CreateHelpMenu オーバーロード

`InsightWindowChrome.CreateHelpMenu()` に `IReadOnlyList<HelpMenuItemDefinition>` を受け取る新しいオーバーロードを使用すること。

```csharp
// 推奨: 新オーバーロード
var helpTopics = new List<HelpMenuItemDefinition>
{
    new() { Id = "overview",      Label = "操作マニュアル", InputGestureText = "F1", OnClick = () => ShowHelpSection("overview") },
    new() { Id = "shortcuts",     Label = "ショートカット一覧",                      OnClick = () => ShowHelpSection("shortcuts") },
    new() { Id = "ai-assistant",  Label = "AIアシスタント",                           OnClick = () => ShowHelpSection("ai-assistant") },
};

var helpMenu = InsightWindowChrome.CreateHelpMenu(
    productName: "Insight Deck Quality Gate",
    helpTopics: helpTopics,
    onLicenseManage: () => ShowLicenseDialog(),
    onAbout: () => ShowAboutDialog()
);
```

### メニュー構成

```
ヘルプ(_H)
  ├── 操作マニュアル              F1
  ├── ショートカット一覧
  ├── AIアシスタント
  ├── ───────────────────────
  ├── ライセンス管理...
  ├── ───────────────────────
  └── {productName} について
```

---

## §11 既存アプリの不統一項目と修正方針

### 現状の不統一

| 項目 | INSS（基準） | IOSH（要修正） | IOSD（要修正） |
|------|:---:|:---:|:---:|
| セクション ID | string | **integer** | string |
| Open mode | ShowDialog() | **Show()** | ShowDialog() |
| XAML 色参照 | DynamicResource | DynamicResource | **ハードコード** |
| 言語 | JA + EN | JA + EN + ZH | JA + EN + ZH |
| ? ボタン | ShowHelpSectionCommand | HelpRequested event | static ShowSection() |
| static ShowSection() | なし | なし | あり（良い） |

### 修正方針

| アプリ | 修正内容 |
|--------|---------|
| **IOSH** | セクション ID を integer → string に変更、Show() → ShowDialog() に変更、static ShowSection() 追加 |
| **IOSD** | HelpWindow.xaml のハードコード色 → DynamicResource に変更 |
| **INSS** | static ShowSection() を追加（IOSD パターンを採用） |
| **INMV** | HelpWindow 新規作成（10セクション、本標準準拠） |
| **INBT** | HelpWindow 新規作成（9セクション、本標準準拠） |
| **INPY** | HelpWindow 新規作成（8セクション、本標準準拠） |

---

## §12 実装チェックリスト

- [ ] `HelpWindow.xaml` + `.cs` が存在する
- [ ] セクション ID が全て string 型（integer 禁止）
- [ ] `ShowDialog()` で開く（非モーダル `Show()` は禁止）
- [ ] XAML で `DynamicResource` / `StaticResource` を使用（ハードコード色禁止）
- [ ] 必須6セクション（overview, ui-layout, shortcuts, license, system-req, support）が含まれる
- [ ] AI 搭載製品は `ai-assistant` セクションが含まれる
- [ ] 全パネルヘッダーに ? ボタンがある
- [ ] F1 キーで HelpWindow が開く
- [ ] Ribbon Home タブにヘルプバーがある（Ribbon 使用製品のみ）
- [ ] `static ShowSection()` メソッドが実装されている
- [ ] HelpWindow のコンストラクタが `(string? initialSection = null)` 形式
- [ ] ヘルプメニューに `HelpMenuItemDefinition` ベースの新オーバーロードを使用
- [ ] 外部リンクが default browser で開く（Navigating イベント処理）
- [ ] HTML スタイルが §3 の標準に準拠（見出し色・背景色・バッジ等）
- [ ] ツールチップのローカライズキーが定義されている（TipHelp, TipPanelHelp, LocHelp）

---

## 参照

- `config/help-content.ts` — 製品別セクション定義（ソースオブトゥルース）
- `csharp/InsightCommon/UI/HelpMenuItemDefinition.cs` — ヘルプメニュー項目の型定義
- `csharp/InsightCommon/UI/InsightWindowChrome.cs` — CreateHelpMenu ヘルパー
- `standards/CSHARP_WPF.md` — RIBBON ヘルプバー・? ボタン・AI パネル標準
- `standards/AI_ASSISTANT.md` — AI アシスタント実装標準
