# Cool Blue & Slate テーマ — 業務系アプリケーション向けカラー標準

> **対象**: RPA、ノーコード解析、データダッシュボード、管理画面など、データ密度が高く長時間利用する業務アプリケーション

---

## 1. 概要

### なぜ寒色系テーマが必要か

Ivory & Gold テーマはブランドの高級感・信頼感を表現するのに適していますが、以下の業務系ユースケースでは寒色系テーマの方が優れています:

| 観点 | 暖色系（Ivory & Gold） | 寒色系（Cool Blue & Slate） |
|------|----------------------|--------------------------|
| **長時間利用** | 暖色は視覚疲労を蓄積しやすい | 寒色は目の負担を軽減 |
| **データ視認性** | コントラスト比がやや低い | 高コントラストでデータが読みやすい |
| **ステータス表示** | 暖色背景上で警告色が紛れやすい | 寒色背景上でステータス色が明確に区別できる |
| **集中作業** | リラックス・創造的作業向き | 分析・監視・データ入力向き |
| **情報密度** | 余白を活かした配置向き | 高密度テーブル・ダッシュボード向き |

### 対象製品

| 製品コード | 製品名 | テーマ推奨理由 |
|-----------|-------|--------------|
| **INBT** | InsightBot | RPA ジョブ監視・Agent 管理ダッシュボード |
| **INCA** | InsightNoCodeAnalyzer | コード解析結果・移行アセスメント画面 |
| **IVIN** | InterviewInsight | ヒアリングデータ分析・調査結果ダッシュボード |

> **注**: InsightOffice 系（INSS/IOSH/IOSD）、InsightSeniorOffice（ISOF）、マーケティング系（INMV/INIG）は引き続き **Ivory & Gold テーマ** を使用してください。

---

## 2. カラーパレット

### 必須カラー

```
Brand Primary (Blue):  #2563EB    ← アクセント、CTA、選択状態
Background (Slate):    #F8FAFC    ← メイン背景
Background Card:       #FFFFFF    ← カード、モーダル
Text Primary:          #0F172A    ← 本文、見出し（高コントラスト）
Text Secondary:        #475569    ← サブテキスト
Border:                #E2E8F0    ← ボーダー
```

### 全カラーマップ

| 用途 | カラーコード | 備考 |
|------|------------|------|
| **Primary (Blue)** | `#2563EB` | アクセント、CTA、アクティブ状態 |
| **Primary Hover** | `#1D4ED8` | ホバー状態 |
| **Primary Light** | `#DBEAFE` | 選択行、軽いハイライト |
| **Primary Dark** | `#1E40AF` | アクティブ・押下状態 |
| **Secondary** | `#64748B` | セカンダリボタン、補助要素 |
| **Accent** | `#3B82F6` | リンク、軽いアクセント |
| **Background Primary** | `#F8FAFC` | メイン背景 |
| **Background Secondary** | `#F1F5F9` | サイドパネル、セカンダリ領域 |
| **Background Card** | `#FFFFFF` | カード、モーダル |
| **Background Hover** | `#E2E8F0` | ホバー背景 |
| **Sidebar Background** | `#1E293B` | ダークサイドバー（業務系推奨） |
| **Text Primary** | `#0F172A` | 本文、見出し |
| **Text Secondary** | `#475569` | サブテキスト、ラベル |
| **Text Tertiary** | `#94A3B8` | プレースホルダー、無効状態 |
| **Text on Primary** | `#FFFFFF` | プライマリ色上のテキスト |
| **Border Default** | `#E2E8F0` | 標準ボーダー |
| **Border Light** | `#F1F5F9` | 軽いディバイダー |
| **Border Focus** | `#2563EB` | フォーカスリング |
| **Success** | `#16A34A` | 成功ステータス |
| **Warning** | `#D97706` | 警告ステータス |
| **Error** | `#DC2626` | エラーステータス |
| **Info** | `#0EA5E9` | 情報ステータス（プライマリと区別） |

### Ivory & Gold テーマとの対応表

| 用途 | Ivory & Gold | Cool Blue & Slate |
|------|-------------|-------------------|
| Primary | `#B8942F` (Gold) | `#2563EB` (Blue) |
| Background | `#FAF8F5` (Ivory) | `#F8FAFC` (Slate) |
| Text Primary | `#1C1917` (Stone 900) | `#0F172A` (Slate 900) |
| Text Secondary | `#57534E` (Stone 600) | `#475569` (Slate 600) |
| Border | `#E7E2DA` (Warm Gray) | `#E2E8F0` (Slate 200) |
| Hover | `#EEEBE5` | `#E2E8F0` |
| Secondary BG | `#F3F0EB` | `#F1F5F9` |

---

## 3. 業務系 UI コンポーネント

### 3.1 データテーブル

データテーブルは業務系アプリの中核コンポーネントです。寒色系は交互行や選択状態のコントラストが明確で、大量データの走査に適しています。

```
┌─────────────────────────────────────────────────────────────┐
│  ヘッダー行          Background: #F1F5F9  Text: #0F172A     │
├─────────────────────────────────────────────────────────────┤
│  通常行              Background: #FFFFFF                     │
│  ストライプ行        Background: #F8FAFC                     │
│  ホバー行            Background: #EFF6FF                     │
│  選択行              Background: #DBEAFE  Border-left: #2563EB│
└─────────────────────────────────────────────────────────────┘
```

**カラー仕様:**

| 状態 | 背景色 | テキスト色 | ボーダー |
|------|--------|----------|---------|
| ヘッダー | `#F1F5F9` | `#0F172A` | `#E2E8F0` |
| 通常行 | `#FFFFFF` | `#0F172A` | `#E2E8F0` |
| ストライプ行 | `#F8FAFC` | `#0F172A` | `#E2E8F0` |
| ホバー | `#EFF6FF` | `#0F172A` | `#E2E8F0` |
| 選択行 | `#DBEAFE` | `#0F172A` | `#2563EB` (left) |

### 3.2 ダッシュボード・サイドバー

業務系アプリではダークサイドバーが推奨です。コンテンツ領域との視覚的分離が明確になり、ナビゲーション要素がコンテンツと干渉しません。

```
┌────────────┬──────────────────────────────────────┐
│            │  ヘッダー   #FFFFFF / border #E2E8F0  │
│  サイドバー ├──────────────────────────────────────┤
│  #1E293B   │                                      │
│            │  コンテンツ   #F8FAFC                  │
│  テキスト   │                                      │
│  #CBD5E1   │  ┌──────────┐  ┌──────────┐          │
│            │  │ KPI Card │  │ KPI Card │          │
│  アクティブ │  │ #FFFFFF  │  │ #FFFFFF  │          │
│  #2563EB   │  └──────────┘  └──────────┘          │
│            │                                      │
└────────────┴──────────────────────────────────────┘
```

**サイドバー仕様:**

| 要素 | カラー |
|------|--------|
| 背景 | `#1E293B` |
| テキスト（通常） | `#CBD5E1` |
| テキスト（アクティブ） | `#FFFFFF` |
| アクティブアイテム背景 | `rgba(37, 99, 235, 0.15)` |
| アクティブアイテムインジケーター | `#2563EB` |
| ホバー背景 | `#334155` |
| ディバイダー | `#334155` |

### 3.3 ステータスバッジ（RPA ジョブ・プロセス状態）

RPA アプリでは実行状態の即時判別が重要です。以下のステータスカラーを使用してください:

| 状態 | 背景色 | テキスト色 | ドット色 | 用途 |
|------|--------|----------|---------|------|
| **Running** | `#DBEAFE` | `#1D4ED8` | `#2563EB` | 実行中 |
| **Success** | `#DCFCE7` | `#15803D` | `#16A34A` | 成功完了 |
| **Warning** | `#FEF3C7` | `#A16207` | `#D97706` | 警告（部分成功） |
| **Error** | `#FEE2E2` | `#B91C1C` | `#DC2626` | エラー（失敗） |
| **Idle** | `#F1F5F9` | `#475569` | `#94A3B8` | 待機中 |
| **Queued** | `#F3E8FF` | `#7C3AED` | `#8B5CF6` | キュー待ち |

### 3.4 KPI カード

```
┌───────────────────────┐
│  月間実行回数           │  ← labelText: #64748B
│  1,234                 │  ← valueText: #0F172A (大きく)
│  ↑ 12.5%               │  ← trendUp: #16A34A
│                        │     trendDown: #DC2626
│  Background: #FFFFFF   │
│  Border: #E2E8F0       │
└───────────────────────┘
```

---

## 4. プラットフォーム別実装

### 4.1 TypeScript / React

```typescript
import coolColors from '@/insight-common/brand/colors-cool.json';

// Primary (Blue): coolColors.brand.primary (#2563EB)
// Background (Slate): coolColors.background.primary (#F8FAFC)

// データテーブルの例
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
    """Cool Blue & Slate テーマ — 業務系アプリケーション向け"""

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

## 5. ダークモード

| 用途 | Light Mode | Dark Mode |
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
| Primary | `#2563EB` | `#3B82F6` (明度を上げる) |

---

## 6. アクセシビリティ

### コントラスト比（WCAG 2.1 準拠）

| 組み合わせ | コントラスト比 | WCAG AA | WCAG AAA |
|-----------|:------------:|:-------:|:--------:|
| Text Primary (#0F172A) on BG (#F8FAFC) | 17.2:1 | AA | AAA |
| Text Secondary (#475569) on BG (#F8FAFC) | 7.1:1 | AA | AAA |
| Text Primary (#0F172A) on Card (#FFFFFF) | 18.4:1 | AA | AAA |
| White (#FFFFFF) on Primary (#2563EB) | 4.6:1 | AA | - |
| Sidebar Text (#CBD5E1) on Sidebar (#1E293B) | 8.4:1 | AA | AAA |
| Active Text (#FFFFFF) on Sidebar (#1E293B) | 13.6:1 | AA | AAA |

### フォーカスインジケーター

キーボードナビゲーション時のフォーカスリングは `#2563EB` を使用し、`2px solid` + `2px offset` で表示:

```css
:focus-visible {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
}
```

---

## 7. テーマ選択ガイドライン

### どちらのテーマを使うか

```
新規アプリ開発
  │
  ├── 製品カテゴリは？
  │     │
  │     ├── InsightOffice 系 (INSS/IOSH/IOSD/INPY)
  │     │     → Ivory & Gold テーマ
  │     │
  │     ├── InsightSeniorOffice (ISOF)
  │     │     → Ivory & Gold テーマ
  │     │
  │     ├── マーケティング系 (INMV/INIG)
  │     │     → Ivory & Gold テーマ
  │     │
  │     └── 業務ツール系 (INBT/INCA/IVIN)
  │           → Cool Blue & Slate テーマ ★
  │
  └── 特殊なケース
        │
        ├── データダッシュボード・管理画面
        │     → Cool Blue & Slate テーマ ★
        │
        └── 公開 Web サイト・LP
              → Ivory & Gold テーマ
```

### 混在利用のルール

1. **1つのアプリ内ではテーマを混在させない**
2. **ライセンス画面のレイアウト構造は共通**（カラーのみテーマに従う）
3. **セマンティックカラー（Success/Warning/Error）はテーマ間で統一**
4. **アイコン・ロゴは共通**（テーマに依存しない）

---

## 8. 検証

### スクリプト検証

```bash
# Cool Blue & Slate テーマの標準検証
./scripts/validate-cool-color.sh <project-directory>
```

### Claude Code スキル

```
/validate-cool-color <project-directory>
```

### チェック項目

| チェック | 条件 |
|---------|------|
| Blue Primary | `#2563EB` がプライマリとして定義されている |
| Slate Background | `#F8FAFC` が背景色として定義されている |
| No Gold Primary | `#B8942F` がプライマリとして使用されて**いない** |
| No Warm Background | `#FAF8F5` が背景として使用されて**いない** |
| High Contrast Text | `#0F172A` がテキストカラーとして定義されている |
| Dark Sidebar | `#1E293B` がサイドバーに使用されている（推奨） |

---

## 9. 禁止事項（Cool Blue & Slate テーマ）

| やってはいけない | 正しいやり方 |
|-----------------|-------------|
| Gold (#B8942F) をプライマリに使用 | Blue (#2563EB) を使用 |
| Ivory (#FAF8F5) を背景に使用 | Slate (#F8FAFC) を使用 |
| ハードコードされた色値 | StaticResource / 変数 / colors-cool.json を参照 |
| ライトサイドバーの使用 | ダークサイドバー (#1E293B) を推奨 |
| 暖色系のステータスバッジ背景 | 寒色系の status セクションを使用 |
| Ivory & Gold テーマとの混在 | 1アプリ1テーマを厳守 |
