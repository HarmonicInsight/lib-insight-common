---
name: design-system
description: HARMONIC insight の Ivory & Gold デザインシステム。UI実装・カラー指定・スタイル変更時に自動適用。色指定やデザイン関連の作業で参照される。
allowed-tools: Read, Grep, Glob
---

# Ivory & Gold デザインシステム

HARMONIC insight 全製品共通のデザインシステム。**Blue (#2563EB) をプライマリに使うのは絶対禁止**。

## カラーパレット

| 用途 | カラーコード | CSS変数 | 備考 |
|-----|-------------|---------|------|
| **Primary (Gold)** | `#B8942F` | `--color-primary` | 製品タイトル、アクセント、CTA |
| **Primary Hover** | `#8C711E` | `--color-primary-hover` | ホバー状態 |
| **Primary Light** | `#F0E6C8` | `--color-primary-light` | 薄い背景 |
| **Background (Ivory)** | `#FAF8F5` | `--color-bg-primary` | メイン背景 |
| **Background Secondary** | `#F3F0EB` | `--color-bg-secondary` | セクション背景 |
| **Background Card** | `#FFFFFF` | `--color-bg-card` | カード、モーダル |
| **Text Primary** | `#1C1917` | `--color-text-primary` | 本文、見出し |
| **Text Secondary** | `#57534E` | `--color-text-secondary` | サブテキスト |
| **Text Tertiary** | `#A8A29E` | `--color-text-tertiary` | プレースホルダー |
| **Border** | `#E7E2DA` | `--color-border` | ボーダー |
| **Success** | `#16A34A` | | 成功ステータス |
| **Warning** | `#CA8A04` | | 警告ステータス |
| **Error** | `#DC2626` | | エラーステータス |
| **Info** | `#2563EB` | | 情報ステータス（プライマリとしては使用禁止） |

## タイポグラフィ

| 用途 | フォント | ウェイト |
|------|---------|---------|
| 日本語本文 | Noto Sans JP | 400 (Regular), 500 (Medium), 700 (Bold) |
| 英語・数値 | Inter | 400, 500, 600, 700 |
| 製品タイトル | Inter | 600 (SemiBold) |

## プラットフォーム別の適用方法

### TypeScript / React
```typescript
import colors from '@/insight-common/brand/colors.json';
// colors.brand.primary → "#B8942F"
// colors.background.primary → "#FAF8F5"
```

### C# / WPF
```xml
<Color x:Key="PrimaryColor">#B8942F</Color>
<Color x:Key="BgPrimaryColor">#FAF8F5</Color>
<SolidColorBrush x:Key="PrimaryBrush" Color="{StaticResource PrimaryColor}"/>
```

### Python / Tkinter
```python
PRIMARY = "#B8942F"
BG_PRIMARY = "#FAF8F5"
```

### Tailwind CSS
```javascript
// tailwind.config.js
colors: {
  brand: { primary: '#B8942F', hover: '#8C711E', light: '#F0E6C8' },
  ivory: { DEFAULT: '#FAF8F5', secondary: '#F3F0EB' },
}
```

## 禁止事項

- `#2563EB`（Blue）をプライマリカラーとして使用
- ハードコードされた色値（必ず変数/StaticResource を使用）
- デフォルトの Tailwind blue-500 / blue-600 をそのまま使用
- 独自のカラーパレット定義（colors.json を正とする）

## 詳細リファレンス

デザインシステムの完全な定義は以下を参照:
- カラー定義: `insight-common/brand/colors.json`
- デザインシステム: `insight-common/brand/design-system.json`
- トンマナ: `insight-common/brand/voice-guidelines.md`
