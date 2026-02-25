# Cool Blue & Slate チE�EチE E業務系アプリケーション向けカラー標溁E

> **対象**: RPA、ノーコード解析、データダチE��ュボ�Eド、管琁E��面など、データ寁E��が高く長時間利用する業務アプリケーション

---

## 1. 概要E

### なぜ寒色系チE�Eマが忁E��か

Ivory & Gold チE�Eマ�Eブランド�E高級感・信頼感を表現するのに適してぁE��すが、以下�E業務系ユースケースでは寒色系チE�Eマ�E方が優れてぁE��ぁE

| 観点 | 暖色系�E�Evory & Gold�E�E| 寒色系�E�Eool Blue & Slate�E�E|
|------|----------------------|--------------------------|
| **長時間利用** | 暖色は視覚疲労を蓄積しめE��ぁE| 寒色は目の負拁E��軽渁E|
| **チE�Eタ視認性** | コントラスト比がめE��低い | 高コントラストでチE�Eタが読みめE��ぁE|
| **スチE�Eタス表示** | 暖色背景上で警告色が紛れめE��ぁE| 寒色背景上でスチE�Eタス色が�E確に区別できる |
| **雁E��作業** | リラチE��ス・創造皁E��業向き | 刁E��・監視�EチE�Eタ入力向ぁE|
| **惁E��寁E��** | 余白を活かした�E置向き | 高寁E��チE�Eブル・ダチE��ュボ�Eド向ぁE|

### 対象製品E

| 製品コーチE| 製品名 | チE�Eマ推奨琁E�� |
|-----------|-------|--------------|
| **INBT** | InsightBot | RPA ジョブ監視�EAgent 管琁E��チE��ュボ�EチE|
| **INCA** | InsightNoCodeAnalyzer | コード解析結果・移行アセスメント画面 |
| **IVIN** | InterviewInsight | ヒアリングチE�Eタ刁E��・調査結果ダチE��ュボ�EチE|

> **注**: InsightOffice 系�E�ENSS/IOSH/IOSD�E�、InsightSeniorOffice�E�ESOF�E�、�EーケチE��ング系�E�ENMV/INIG�E��E引き続き **Ivory & Gold チE�EチE* を使用してください、E

---

## 2. カラーパレチE��

### 忁E��カラー

```
Brand Primary (Blue):  #2563EB    ↁEアクセント、CTA、E��択状慁E
Background (Slate):    #F8FAFC    ↁEメイン背景
Background Card:       #FFFFFF    ↁEカード、モーダル
Text Primary:          #0F172A    ↁE本斁E��見�Eし（高コントラスト！E
Text Secondary:        #475569    ↁEサブテキスチE
Border:                #E2E8F0    ↁEボ�Eダー
```

### 全カラーマッチE

| 用送E| カラーコーチE| 備老E|
|------|------------|------|
| **Primary (Blue)** | `#2563EB` | アクセント、CTA、アクチE��ブ状慁E|
| **Primary Hover** | `#1D4ED8` | ホバー状慁E|
| **Primary Light** | `#DBEAFE` | 選択行、軽ぁE��イライチE|
| **Primary Dark** | `#1E40AF` | アクチE��ブ�E押下状慁E|
| **Secondary** | `#64748B` | セカンダリボタン、補助要素 |
| **Accent** | `#3B82F6` | リンク、軽ぁE��クセンチE|
| **Background Primary** | `#F8FAFC` | メイン背景 |
| **Background Secondary** | `#F1F5F9` | サイドパネル、セカンダリ領域 |
| **Background Card** | `#FFFFFF` | カード、モーダル |
| **Background Hover** | `#E2E8F0` | ホバー背景 |
| **Sidebar Background** | `#1E293B` | ダークサイドバー�E�業務系推奨�E�E|
| **Text Primary** | `#0F172A` | 本斁E��見�EぁE|
| **Text Secondary** | `#475569` | サブテキスト、ラベル |
| **Text Tertiary** | `#94A3B8` | プレースホルダー、無効状慁E|
| **Text on Primary** | `#FFFFFF` | プライマリ色上�EチE��スチE|
| **Border Default** | `#E2E8F0` | 標準�Eーダー |
| **Border Light** | `#F1F5F9` | 軽ぁE��ィバイダー |
| **Border Focus** | `#2563EB` | フォーカスリング |
| **Success** | `#16A34A` | 成功スチE�Eタス |
| **Warning** | `#D97706` | 警告スチE�Eタス |
| **Error** | `#DC2626` | エラースチE�Eタス |
| **Info** | `#0EA5E9` | 惁E��スチE�Eタス�E��Eライマリと区別�E�E|

### Ivory & Gold チE�Eマとの対応表

| 用送E| Ivory & Gold | Cool Blue & Slate |
|------|-------------|-------------------|
| Primary | `#B8942F` (Gold) | `#2563EB` (Blue) |
| Background | `#FAF8F5` (Ivory) | `#F8FAFC` (Slate) |
| Text Primary | `#1C1917` (Stone 900) | `#0F172A` (Slate 900) |
| Text Secondary | `#57534E` (Stone 600) | `#475569` (Slate 600) |
| Border | `#E7E2DA` (Warm Gray) | `#E2E8F0` (Slate 200) |
| Hover | `#EEEBE5` | `#E2E8F0` |
| Secondary BG | `#F3F0EB` | `#F1F5F9` |

---

## 3. 業務系 UI コンポ�EネンチE

### 3.1 チE�EタチE�Eブル

チE�EタチE�Eブルは業務系アプリの中核コンポ�Eネントです。寒色系は交互行や選択状態�Eコントラストが明確で、大量データの走査に適してぁE��す、E

```
┌─────────────────────────────────────────────────────────────━E
━E ヘッダー衁E         Background: #F1F5F9  Text: #0F172A     ━E
├─────────────────────────────────────────────────────────────┤
━E 通常衁E             Background: #FFFFFF                     ━E
━E ストライプ衁E       Background: #F8FAFC                     ━E
━E ホバー衁E           Background: #EFF6FF                     ━E
━E 選択衁E             Background: #DBEAFE  Border-left: #2563EB━E
└─────────────────────────────────────────────────────────────━E
```

**カラー仕槁E**

| 状慁E| 背景色 | チE��スト色 | ボ�Eダー |
|------|--------|----------|---------|
| ヘッダー | `#F1F5F9` | `#0F172A` | `#E2E8F0` |
| 通常衁E| `#FFFFFF` | `#0F172A` | `#E2E8F0` |
| ストライプ衁E| `#F8FAFC` | `#0F172A` | `#E2E8F0` |
| ホバー | `#EFF6FF` | `#0F172A` | `#E2E8F0` |
| 選択衁E| `#DBEAFE` | `#0F172A` | `#2563EB` (left) |

### 3.2 ダチE��ュボ�Eド�Eサイドバー

業務系アプリではダークサイドバーが推奨です。コンチE��チE��域との視覚的刁E��が�E確になり、ナビゲーション要素がコンチE��チE��干渉しません、E

```
┌────────────┬──────────────────────────────────────━E
━E           ━E ヘッダー   #FFFFFF / border #E2E8F0  ━E
━E サイドバー ├──────────────────────────────────────┤
━E #1E293B   ━E                                     ━E
━E           ━E コンチE��チE  #F8FAFC                  ━E
━E チE��スチE  ━E                                     ━E
━E #CBD5E1   ━E ┌──────────━E ┌──────────━E         ━E
━E           ━E ━EKPI Card ━E ━EKPI Card ━E         ━E
━E アクチE��チE━E ━E#FFFFFF  ━E ━E#FFFFFF  ━E         ━E
━E #2563EB   ━E └──────────━E └──────────━E         ━E
━E           ━E                                     ━E
└────────────┴──────────────────────────────────────━E
```

**サイドバー仕槁E**

| 要素 | カラー |
|------|--------|
| 背景 | `#1E293B` |
| チE��スト（通常�E�E| `#CBD5E1` |
| チE��スト（アクチE��ブ！E| `#FFFFFF` |
| アクチE��ブアイチE��背景 | `rgba(37, 99, 235, 0.15)` |
| アクチE��ブアイチE��インジケーター | `#2563EB` |
| ホバー背景 | `#334155` |
| チE��バイダー | `#334155` |

### 3.3 スチE�Eタスバッジ�E�EPA ジョブ�Eプロセス状態！E

RPA アプリでは実行状態�E即時判別が重要です。以下�EスチE�Eタスカラーを使用してください:

| 状慁E| 背景色 | チE��スト色 | ドット色 | 用送E|
|------|--------|----------|---------|------|
| **Running** | `#DBEAFE` | `#1D4ED8` | `#2563EB` | 実行中 |
| **Success** | `#DCFCE7` | `#15803D` | `#16A34A` | 成功完亁E|
| **Warning** | `#FEF3C7` | `#A16207` | `#D97706` | 警告（部刁E�E功！E|
| **Error** | `#FEE2E2` | `#B91C1C` | `#DC2626` | エラー�E�失敗！E|
| **Idle** | `#F1F5F9` | `#475569` | `#94A3B8` | 征E��中 |
| **Queued** | `#F3E8FF` | `#7C3AED` | `#8B5CF6` | キュー征E�� |

### 3.4 KPI カーチE

```
┌───────────────────────━E
━E 月間実行回数           ━E ↁElabelText: #64748B
━E 1,234                 ━E ↁEvalueText: #0F172A (大きく)
━E ↁE12.5%               ━E ↁEtrendUp: #16A34A
━E                       ━E    trendDown: #DC2626
━E Background: #FFFFFF   ━E
━E Border: #E2E8F0       ━E
└───────────────────────━E
```

---

## 4. プラチE��フォーム別実裁E

### 4.1 TypeScript / React

```typescript
import coolColors from '@/insight-common/brand/colors-cool.json';

// Primary (Blue): coolColors.brand.primary (#2563EB)
// Background (Slate): coolColors.background.primary (#F8FAFC)

// チE�EタチE�Eブルの侁E
const tableStyles = {
  header: {
    backgroundColor: coolColors.dataTable.headerBackground,
    color: coolColors.dataTable.headerText,
  },
  row: {
    backgroundColor: coolColors.background.card,
  },
  rowStripe: {
    backgroundColor: coolColors.dataTable.rowStripe,
  },
  rowHover: {
    backgroundColor: coolColors.dataTable.rowHover,
  },
  rowSelected: {
    backgroundColor: coolColors.dataTable.selectedRow,
    borderLeft: `3px solid ${coolColors.dataTable.selectedRowBorder}`,
  },
};
```

### 4.2 C# (WPF)

```xml
<!-- CoolColors.xaml -->
<ResourceDictionary>
  <!-- Brand -->
  <Color x:Key="CoolPrimaryColor">#2563EB</Color>
  <Color x:Key="CoolPrimaryHoverColor">#1D4ED8</Color>
  <Color x:Key="CoolPrimaryLightColor">#DBEAFE</Color>
  <Color x:Key="CoolPrimaryDarkColor">#1E40AF</Color>

  <!-- Background -->
  <Color x:Key="CoolBgPrimaryColor">#F8FAFC</Color>
  <Color x:Key="CoolBgSecondaryColor">#F1F5F9</Color>
  <Color x:Key="CoolBgCardColor">#FFFFFF</Color>
  <Color x:Key="CoolSidebarColor">#1E293B</Color>

  <!-- Text -->
  <Color x:Key="CoolTextPrimaryColor">#0F172A</Color>
  <Color x:Key="CoolTextSecondaryColor">#475569</Color>

  <!-- Border -->
  <Color x:Key="CoolBorderColor">#E2E8F0</Color>

  <!-- SolidColorBrush -->
  <SolidColorBrush x:Key="CoolPrimaryBrush" Color="{StaticResource CoolPrimaryColor}" />
  <SolidColorBrush x:Key="CoolBgPrimaryBrush" Color="{StaticResource CoolBgPrimaryColor}" />
  <SolidColorBrush x:Key="CoolTextPrimaryBrush" Color="{StaticResource CoolTextPrimaryColor}" />
</ResourceDictionary>
```

### 4.3 Python (Tkinter / CustomTkinter)

```python
class CoolColors:
    """Cool Blue & Slate チE�EチE E業務系アプリケーション向け"""

    # Brand
    PRIMARY = "#2563EB"
    PRIMARY_HOVER = "#1D4ED8"
    PRIMARY_LIGHT = "#DBEAFE"
    PRIMARY_DARK = "#1E40AF"

    # Background
    BG_PRIMARY = "#F8FAFC"
    BG_SECONDARY = "#F1F5F9"
    BG_CARD = "#FFFFFF"
    SIDEBAR = "#1E293B"

    # Text
    TEXT_PRIMARY = "#0F172A"
    TEXT_SECONDARY = "#475569"
    TEXT_TERTIARY = "#94A3B8"
    TEXT_ON_PRIMARY = "#FFFFFF"

    # Border
    BORDER = "#E2E8F0"
    BORDER_FOCUS = "#2563EB"

    # Semantic
    SUCCESS = "#16A34A"
    WARNING = "#D97706"
    ERROR = "#DC2626"
    INFO = "#0EA5E9"
```

### 4.4 Android (Jetpack Compose)

```kotlin
// CoolColor.kt
package com.harmonic.insight.ui.theme

import androidx.compose.ui.graphics.Color

// Brand
val CoolPrimary = Color(0xFF2563EB)
val CoolPrimaryHover = Color(0xFF1D4ED8)
val CoolPrimaryLight = Color(0xFFDBEAFE)
val CoolPrimaryDark = Color(0xFF1E40AF)
val CoolSecondary = Color(0xFF64748B)

// Background
val CoolBgPrimary = Color(0xFFF8FAFC)
val CoolBgSecondary = Color(0xFFF1F5F9)
val CoolBgCard = Color(0xFFFFFFFF)
val CoolSidebar = Color(0xFF1E293B)

// Text
val CoolTextPrimary = Color(0xFF0F172A)
val CoolTextSecondary = Color(0xFF475569)
val CoolTextTertiary = Color(0xFF94A3B8)

// Border
val CoolBorder = Color(0xFFE2E8F0)

// Status
val CoolStatusRunning = Color(0xFF2563EB)
val CoolStatusSuccess = Color(0xFF16A34A)
val CoolStatusWarning = Color(0xFFD97706)
val CoolStatusError = Color(0xFFDC2626)
val CoolStatusIdle = Color(0xFF94A3B8)
val CoolStatusQueued = Color(0xFF8B5CF6)
```

### 4.5 iOS (SwiftUI)

```swift
// CoolColors.swift
import SwiftUI

extension Color {
    // Brand
    static let coolPrimary = Color(hex: "#2563EB")
    static let coolPrimaryHover = Color(hex: "#1D4ED8")
    static let coolPrimaryLight = Color(hex: "#DBEAFE")
    static let coolPrimaryDark = Color(hex: "#1E40AF")

    // Background
    static let coolBgPrimary = Color(hex: "#F8FAFC")
    static let coolBgSecondary = Color(hex: "#F1F5F9")
    static let coolBgCard = Color(hex: "#FFFFFF")
    static let coolSidebar = Color(hex: "#1E293B")

    // Text
    static let coolTextPrimary = Color(hex: "#0F172A")
    static let coolTextSecondary = Color(hex: "#475569")
    static let coolTextTertiary = Color(hex: "#94A3B8")

    // Border
    static let coolBorder = Color(hex: "#E2E8F0")
}
```

---

## 5. ダークモーチE

| 用送E| Light Mode | Dark Mode |
|------|-----------|-----------|
| Background Primary | `#F8FAFC` | `#0F172A` |
| Background Secondary | `#F1F5F9` | `#1E293B` |
| Background Card | `#FFFFFF` | `#1E293B` |
| Background Hover | `#E2E8F0` | `#334155` |
| Text Primary | `#0F172A` | `#F8FAFC` |
| Text Secondary | `#475569` | `#CBD5E1` |
| Text Tertiary | `#94A3B8` | `#94A3B8` |
| Border Default | `#E2E8F0` | `#334155` |
| Border Light | `#F1F5F9` | `#1E293B` |
| Primary | `#2563EB` | `#3B82F6` (明度を上げめE |

---

## 6. アクセシビリチE��

### コントラスト比！ECAG 2.1 準拠�E�E

| 絁E��合わぁE| コントラスト毁E| WCAG AA | WCAG AAA |
|-----------|:------------:|:-------:|:--------:|
| Text Primary (#0F172A) on BG (#F8FAFC) | 17.2:1 | AA | AAA |
| Text Secondary (#475569) on BG (#F8FAFC) | 7.1:1 | AA | AAA |
| Text Primary (#0F172A) on Card (#FFFFFF) | 18.4:1 | AA | AAA |
| White (#FFFFFF) on Primary (#2563EB) | 4.6:1 | AA | - |
| Sidebar Text (#CBD5E1) on Sidebar (#1E293B) | 8.4:1 | AA | AAA |
| Active Text (#FFFFFF) on Sidebar (#1E293B) | 13.6:1 | AA | AAA |

### フォーカスインジケーター

キーボ�Eドナビゲーション時�Eフォーカスリングは `#2563EB` を使用し、`2px solid` + `2px offset` で表示:

```css
:focus-visible {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
}
```

---

## 7. チE�Eマ選択ガイドライン

### どちら�EチE�Eマを使ぁE��

```
新規アプリ開発
  ━E
  ├── 製品カチE��リは�E�E
  ━E    ━E
  ━E    ├── InsightOffice 系 (INSS/IOSH/IOSD/INPY)
  ━E    ━E    ↁEIvory & Gold チE�EチE
  ━E    ━E
  ━E    ├── InsightSeniorOffice (ISOF)
  ━E    ━E    ↁEIvory & Gold チE�EチE
  ━E    ━E
  ━E    ├── マ�EケチE��ング系 (INMV/INIG)
  ━E    ━E    ↁEIvory & Gold チE�EチE
  ━E    ━E
  ━E    └── 業務ツール系 (INBT/INCA/IVIN)
  ━E          ↁECool Blue & Slate チE�EチE☁E
  ━E
  └── 特殊なケース
        ━E
        ├── チE�EタダチE��ュボ�Eド�E管琁E��面
        ━E    ↁECool Blue & Slate チE�EチE☁E
        ━E
        └── 公閁EWeb サイト�ELP
              ↁEIvory & Gold チE�EチE
```

### 混在利用のルール

1. **1つのアプリ冁E��はチE�Eマを混在させなぁE*
2. **ライセンス画面のレイアウト構造は共送E*�E�カラーのみチE�Eマに従う�E�E
3. **セマンチE��チE��カラー�E�Euccess/Warning/Error�E��EチE�Eマ間で統一**
4. **アイコン・ロゴは共送E*�E�テーマに依存しなぁE��E

---

## 8. 検証

### スクリプト検証

```bash
# Cool Blue & Slate チE�Eマ�E標準検証
./scripts/validate-cool-color.sh <project-directory>
```

### Claude Code スキル

```
/validate-cool-color <project-directory>
```

### チェチE��頁E��

| チェチE�� | 条件 |
|---------|------|
| Blue Primary | `#2563EB` が�Eライマリとして定義されてぁE�� |
| Slate Background | `#F8FAFC` が背景色として定義されてぁE�� |
| No Gold Primary | `#B8942F` が�Eライマリとして使用されて**ぁE��ぁE* |
| No Warm Background | `#FAF8F5` が背景として使用されて**ぁE��ぁE* |
| High Contrast Text | `#0F172A` がテキストカラーとして定義されてぁE�� |
| Dark Sidebar | `#1E293B` がサイドバーに使用されてぁE���E�推奨�E�E|

---

## 9. 禁止事頁E��Eool Blue & Slate チE�Eマ！E

| めE��てはぁE��なぁE| 正しいめE��方 |
|-----------------|-------------|
| Gold (#B8942F) を�Eライマリに使用 | Blue (#2563EB) を使用 |
| Ivory (#FAF8F5) を背景に使用 | Slate (#F8FAFC) を使用 |
| ハ�Eドコードされた色値 | StaticResource / 変数 / colors-cool.json を参照 |
| ライトサイドバーの使用 | ダークサイドバー (#1E293B) を推奨 |
| 暖色系のスチE�Eタスバッジ背景 | 寒色系の status セクションを使用 |
| Ivory & Gold チE�Eマとの混在 | 1アプリ1チE�Eマを厳宁E|
