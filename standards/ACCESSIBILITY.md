# アクセシビリティ標準

> 全 WPF 製品共通のアクセシビリティ標準ガイド

---

## §1 概要

HARMONIC insight の全 WPF アプリケーションは、シニア・視覚障害者を含む幅広いユーザーが
快適に利用できるよう、UI スケーリング機能を標準搭載する。

**対象製品**: INSS / IOSH / IOSD / INPY / INBT / INMV / ISOF（全 WPF アプリ）

**方針**:
- `LayoutTransform` + `ScaleTransform` による Window 全体の均一スケーリング
- FontSize の個別変更は行わない（既存コードへの影響なし）
- Syncfusion コンポーネント（Ribbon / Spreadsheet / RichTextBoxAdv）も自動追従
- スケール設定はアプリ横断で共有（1回設定すれば全アプリに反映）

---

## §2 UI スケーリング標準

| 項目 | 値 |
|------|-----|
| 範囲 | 50%〜200% |
| デフォルト | 100% |
| ステップ | 25%（プリセット） |
| 微調整 | 5% |
| 実装方式 | `LayoutTransform` + `ScaleTransform`（Window root） |
| 管理クラス | `InsightScaleManager.Instance` |
| 仕様定義 | `config/ui-scale.ts` |
| 保存先 | `%APPDATA%/HarmonicInsight/ui-scale.json` |
| ショートカット | Ctrl+Plus / Ctrl+Minus / Ctrl+0 |

### プリセット一覧

| 倍率 | 日本語ラベル | 英語ラベル |
|:----:|-------------|-----------|
| 50%  | 極小 | Tiny |
| 75%  | 小 | Small |
| 100% | 標準 | Standard |
| 125% | やや大 | Medium |
| 150% | 大 | Large |
| 175% | 特大 | Extra Large |
| 200% | 最大 | Maximum |

### 保存ファイル形式

```json
{
  "ScaleFactor": 1.25,
  "LastModified": "2026-03-01T12:00:00.000Z"
}
```

---

## §3 実装手順

### 3.1 InsightWindowChrome 経由（自動適用）

`InsightWindowChrome.Apply()` を使っている Window は自動的にスケーリングが適用される。
追加作業は不要。

### 3.2 ViewModel にズームコマンドを追加

```csharp
using InsightCommon.UI;

// RelayCommand を使用する場合
[RelayCommand]
private void ZoomIn() => InsightScaleManager.Instance.ZoomIn();

[RelayCommand]
private void ZoomOut() => InsightScaleManager.Instance.ZoomOut();

[RelayCommand]
private void ResetZoom() => InsightScaleManager.Instance.Reset();

// プリセットボタン用（CommandParameter でファクターを受け取る）
[RelayCommand]
private void SetScale(double factor) => InsightScaleManager.Instance.SetScale(factor);
```

### 3.3 XAML に KeyBinding を追加

```xml
<Window.InputBindings>
    <!-- 既存の KeyBinding に追加 -->
    <KeyBinding Key="OemPlus" Modifiers="Ctrl" Command="{Binding ZoomInCommand}" />
    <KeyBinding Key="OemMinus" Modifiers="Ctrl" Command="{Binding ZoomOutCommand}" />
    <KeyBinding Key="D0" Modifiers="Ctrl" Command="{Binding ResetZoomCommand}" />
</Window.InputBindings>
```

### 3.4 ステータスバーにスケール倍率を表示

```xml
<TextBlock Text="{Binding Source={x:Static ui:InsightScaleManager.Instance}, Path=ScalePercent}"
           FontSize="11"
           Foreground="{StaticResource TextTertiaryBrush}"
           Margin="8,0" />
```

### 3.5 Ribbon「表示」タブにプリセットボタンを配置（推奨）

```xml
<syncfusion:RibbonBar Header="{Binding LocZoom}">
    <syncfusion:RibbonButton Label="50%"  Command="{Binding SetScaleCommand}" CommandParameter="0.5" SizeForm="Small" />
    <syncfusion:RibbonButton Label="75%"  Command="{Binding SetScaleCommand}" CommandParameter="0.75" SizeForm="Small" />
    <syncfusion:RibbonButton Label="100%" Command="{Binding SetScaleCommand}" CommandParameter="1.0" SizeForm="Small" />
    <syncfusion:RibbonButton Label="125%" Command="{Binding SetScaleCommand}" CommandParameter="1.25" SizeForm="Small" />
    <syncfusion:RibbonButton Label="150%" Command="{Binding SetScaleCommand}" CommandParameter="1.5" SizeForm="Small" />
    <syncfusion:RibbonButton Label="200%" Command="{Binding SetScaleCommand}" CommandParameter="2.0" SizeForm="Small" />
</syncfusion:RibbonBar>
```

### 3.6 InsightWindowChrome を使わない Window（ダイアログ等）

```csharp
// Window の Loaded イベントで手動適用
private void OnLoaded(object sender, RoutedEventArgs e)
{
    InsightScaleManager.Instance.ApplyToWindow(this);
}
```

---

## §4 禁止事項

| 禁止 | 正しいやり方 |
|------|-------------|
| FontSize を個別に変更してスケーリング | `InsightScaleManager` + `LayoutTransform` 方式を使用 |
| `InsightScaleManager` を介さず独自のスケール機構を実装 | `InsightScaleManager.Instance` を使用 |
| `RenderTransform` でスケーリング | `LayoutTransform` を使用（レイアウトに反映されるため） |
| スケール設定を各アプリ独自に保存 | `%APPDATA%/HarmonicInsight/ui-scale.json` に統一 |

---

## §5 AutomationProperties（既存標準）

全 WPF アプリでは主要 UI コントロールに `AutomationProperties.Name` を設定すること。
これはスクリーンリーダー対応の基本要件であり、UI スケーリングとは独立した必須事項。

```xml
<Button AutomationProperties.Name="保存"
        Content="{Binding LocSave}" />
```

---

## §6 実装チェックリスト

- [ ] `InsightScaleManager.Instance.ApplyToWindow()` が呼ばれている（InsightWindowChrome 経由で自動適用）
- [ ] Ctrl+Plus / Ctrl+Minus / Ctrl+0 キーバインドがある
- [ ] ステータスバーに現在のスケール倍率が表示されている
- [ ] スケール設定が `ui-scale.json` に永続化されている
- [ ] Ribbon「表示」タブまたはメニューからスケール変更できる
- [ ] 50%〜200% の全プリセットで UI が正常に表示される
- [ ] Syncfusion コンポーネントが正常にスケーリングされる
- [ ] アプリ再起動後にスケール値が復元される

---

## 参考

- **仕様定義**: `config/ui-scale.ts`
- **C# 実装**: `csharp/InsightCommon/UI/InsightScaleManager.cs`
- **WPF 開発標準**: `standards/CSHARP_WPF.md`（§アクセシビリティ）
