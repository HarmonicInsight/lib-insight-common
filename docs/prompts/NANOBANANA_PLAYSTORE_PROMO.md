# nanobanana - Simple QR: Play ストアプロモーション画像生成プロンプト

## アプリ概要

| 項目 | 値 |
|------|-----|
| アプリ名 | Simple QR |
| 開発者 | nanobanana |
| カテゴリ | ツール |
| 主要機能 | QR コードスキャン、URL 安全性チェック、QR コード生成、暗号化履歴、CSV エクスポート |

---

## Play ストア画像仕様

| 種類 | サイズ | アスペクト比 | 必須 |
|------|--------|:----------:|:----:|
| フィーチャーグラフィック | 1024×500 | 約 2:1 | ✅ |
| スマホスクリーンショット | 1080×1920 | 9:16 | ✅（2〜8 枚） |
| 7 インチタブレット | 1200×1920 | - | 推奨 |
| 10 インチタブレット | 1600×2560 | - | 推奨 |

---

## デザイン方針

- **背景**: ダークグレー〜ブラック（#1A1A2E / #16213E）で高級感
- **アクセント**: ティールブルー（#0F969C）+ ホワイト（#FFFFFF）
- **フォント**: モダンなゴシック体、太字のキャッチコピー
- **端末モック**: ベゼルレスの最新スマートフォンモックアップ
- **共通要素**: アプリアイコン + アプリ名「Simple QR」を全画像に含める

---

## 1. フィーチャーグラフィック（1024×500）

> Play ストアの一番上に表示される横長バナー。

### プロンプト（日本語版）

```
A premium Google Play Store feature graphic (1024x500px, landscape).
Dark gradient background from deep navy (#16213E) to charcoal (#1A1A2E).

Center composition: A modern bezel-less smartphone displaying a QR code scanning
interface with a glowing teal (#0F969C) scan line animating across a QR code.
Around the phone, floating translucent UI elements: a green shield icon with
a checkmark (URL safety), a QR code being generated, and a lock icon (encrypted history).

Left side: App icon (a minimalist QR code design with teal accent).
Right side: Bold Japanese text "シンプルに、安全に。" in white,
with subtitle "QRコード スキャン & 生成" in light gray below.

Clean, modern, flat design with subtle glassmorphism effects. No photorealism.
Professional tech-app aesthetic. High contrast, sharp edges.
```

### プロンプト（英語版）

```
A premium Google Play Store feature graphic (1024x500px, landscape).
Dark gradient background from deep navy (#16213E) to charcoal (#1A1A2E).

Center composition: A modern bezel-less smartphone displaying a QR code scanning
interface with a glowing teal (#0F969C) scan line animating across a QR code.
Around the phone, floating translucent UI elements: a green shield icon with
a checkmark (URL safety), a QR code being generated, and a lock icon (encrypted history).

Left side: App icon (a minimalist QR code design with teal accent).
Right side: Bold English text "Simple. Secure. Smart." in white,
with subtitle "QR Code Scanner & Generator" in light gray below.

Clean, modern, flat design with subtle glassmorphism effects. No photorealism.
Professional tech-app aesthetic. High contrast, sharp edges.
```

---

## 2. スクリーンショット 1 / 8：メインスキャン機能

> アプリの第一印象。高速スキャンと URL 安全性チェックを訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

A floating bezel-less smartphone in the center-bottom area showing a camera
scanning interface: live viewfinder with a semi-transparent dark overlay,
a bright teal (#0F969C) animated scan frame targeting a QR code, and a small
green badge at the top-right corner of the scan frame reading "安全" (safe)
with a shield icon.

Above the phone mockup:
- Large bold Japanese headline: "かざすだけで、安全に。"
- Smaller subtitle: "高速スキャン & URL 安全性チェック"
Both in white text, center-aligned.

At the very bottom: A row of three small icons with labels:
"1D/2D対応" | "即時判定" | "自動コピー"

Flat design, minimal, professional. Teal and white on dark background.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

A floating bezel-less smartphone in the center-bottom area showing a camera
scanning interface: live viewfinder with a semi-transparent dark overlay,
a bright teal (#0F969C) animated scan frame targeting a QR code, and a small
green badge at the top-right corner reading "Safe" with a shield icon.

Above the phone mockup:
- Large bold headline: "Scan Instantly. Stay Safe."
- Smaller subtitle: "Fast scanning with URL safety check"
Both in white text, center-aligned.

At the very bottom: A row of three small icons with labels:
"1D/2D Support" | "Instant Check" | "Auto Copy"

Flat design, minimal, professional. Teal and white on dark background.
```

---

## 3. スクリーンショット 2 / 8：QR コード生成

> 多様な QR コード生成機能を訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

A floating smartphone showing a QR code generation screen: a clean form UI
with input fields for URL, text, Wi-Fi, contact card, and email. Below the
form, a large generated QR code with a subtle teal border. Share and save
buttons are visible at the bottom of the phone screen.

Above the phone:
- Large bold headline: "テキストもWi-Fiも、すぐQRに。"
- Subtitle: "URL・テキスト・Wi-Fi・連絡先を瞬時に変換"
White text on dark background, center-aligned.

To the left of the phone, four small floating badges arranged vertically:
"URL" "テキスト" "Wi-Fi" "連絡先" — each with a distinct minimal icon.

Modern flat design. Teal accents on dark background.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

A floating smartphone showing a QR code generation screen: a clean form UI
with input fields for URL, text, Wi-Fi, contact card, and email. Below the
form, a large generated QR code with a subtle teal border. Share and save
buttons are visible at the bottom of the phone screen.

Above the phone:
- Large bold headline: "Generate QR Codes Instantly."
- Subtitle: "URL, text, Wi-Fi, contacts — all in one tap"
White text on dark background, center-aligned.

To the left of the phone, four small floating badges arranged vertically:
"URL" "Text" "Wi-Fi" "Contact" — each with a distinct minimal icon.

Modern flat design. Teal accents on dark background.
```

---

## 4. スクリーンショット 3 / 8：暗号化履歴

> AES-256 暗号化による安全な履歴管理を訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

A floating smartphone displaying a history list screen with several scanned
QR code entries. Each entry shows: a small QR code thumbnail, a title
(URL or text snippet), a timestamp, and a small lock icon (🔒) indicating
encryption. One entry is expanded to show full details with "コピー" and
"共有" action buttons.

Above the phone:
- Large bold headline: "作れる、残せる、守られる。"
- Subtitle: "AES-256 暗号化で履歴を安全に保存"
White text, center-aligned.

A floating shield icon with "AES-256" text beside it, positioned to the
right of the phone with a subtle glow effect.

At the bottom: Three small icons with labels:
"暗号化保存" | "CSV出力" | "一括削除"

Clean, secure-feeling design. Teal and white on dark.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

A floating smartphone displaying a history list screen with several scanned
QR code entries. Each entry shows: a small QR code thumbnail, a title
(URL or text snippet), a timestamp, and a small lock icon indicating encryption.
One entry is expanded to show full details with "Copy" and "Share" action buttons.

Above the phone:
- Large bold headline: "Create. Save. Protect."
- Subtitle: "AES-256 encrypted history storage"
White text, center-aligned.

A floating shield icon with "AES-256" text beside it, positioned to the right
of the phone with a subtle glow effect.

At the bottom: Three small icons with labels:
"Encrypted" | "CSV Export" | "Bulk Delete"

Clean, secure-feeling design. Teal and white on dark.
```

---

## 5. スクリーンショット 4 / 8：ダークモード & カスタマイズ

> 設定画面とダークモードの切り替えを訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

Two floating smartphones side by side, slightly overlapping and tilted:
- Left phone: Light mode settings screen with ivory/white background, showing
  toggles for vibration, sound, auto-copy, and theme selection.
- Right phone: Dark mode of the same settings screen with deep dark background,
  showing the same toggles in inverted colors.

A curved arrow connects the two phones, suggesting seamless switching.

Above the phones:
- Large bold headline: "あなた好みに、カスタマイズ。"
- Subtitle: "ダークモード・音・振動・自動コピー"
White text, center-aligned.

Minimal, clean design. Shows contrast between light and dark themes.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

Two floating smartphones side by side, slightly overlapping and tilted:
- Left phone: Light mode settings screen with ivory/white background, showing
  toggles for vibration, sound, auto-copy, and theme selection.
- Right phone: Dark mode of the same settings screen with deep dark background,
  showing the same toggles in inverted colors.

A curved arrow connects the two phones, suggesting seamless switching.

Above the phones:
- Large bold headline: "Your Way. Your Style."
- Subtitle: "Dark mode, sounds, vibration, auto-copy"
White text, center-aligned.

Minimal, clean design. Shows contrast between light and dark themes.
```

---

## 6. スクリーンショット 5 / 8：バッチスキャン & CSV エクスポート

> 業務利用を想定した大量処理・エクスポート機能を訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

A floating smartphone showing a batch scan results screen: a list of 8-10
scanned QR codes with checkboxes, a "全選択" (Select All) toggle at the top,
and a prominent "CSVエクスポート" button at the bottom of the phone screen.
A floating CSV file icon with an arrow is emerging from the phone to the right.

Above the phone:
- Large bold headline: "まとめてスキャン、一括出力。"
- Subtitle: "CSV エクスポートで業務効率化"
White text, center-aligned.

A small spreadsheet/table icon floating to the right side showing exported
data rows, connected to the phone with a dotted line.

Professional, business-oriented aesthetic. Teal accents on dark.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

A floating smartphone showing a batch scan results screen: a list of 8-10
scanned QR codes with checkboxes, a "Select All" toggle at the top,
and a prominent "Export CSV" button at the bottom of the phone screen.
A floating CSV file icon with an arrow is emerging from the phone to the right.

Above the phone:
- Large bold headline: "Batch Scan. Bulk Export."
- Subtitle: "CSV export for business workflows"
White text, center-aligned.

A small spreadsheet/table icon floating to the right side showing exported
data rows, connected to the phone with a dotted line.

Professional, business-oriented aesthetic. Teal accents on dark.
```

---

## 7. スクリーンショット 6 / 8：対応フォーマット一覧

> 幅広い 1D/2D バーコード対応を訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

Center composition: A grid of barcode/QR code format icons arranged in a
3x4 grid, each in a rounded card with subtle teal borders:
QR Code | Data Matrix | Aztec Code
PDF417 | EAN-13 | EAN-8
UPC-A | Code 128 | Code 39
ITF | Codabar | (more)

Each card has the format name below a visual example of that barcode type.

Above the grid:
- Large bold headline: "あらゆるコードに対応。"
- Subtitle: "QR・バーコード・DataMatrix — 20種類以上"
White text, center-aligned.

Below the grid: A teal banner reading "1D & 2D バーコード完全対応"

Clean infographic style. Well-organized grid layout on dark background.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

Center composition: A grid of barcode/QR code format icons arranged in a
3x4 grid, each in a rounded card with subtle teal borders:
QR Code | Data Matrix | Aztec Code
PDF417 | EAN-13 | EAN-8
UPC-A | Code 128 | Code 39
ITF | Codabar | (more)

Each card has the format name below a visual example of that barcode type.

Above the grid:
- Large bold headline: "Every Code. One App."
- Subtitle: "QR, barcodes, DataMatrix — 20+ formats"
White text, center-aligned.

Below the grid: A teal banner reading "Full 1D & 2D barcode support"

Clean infographic style. Well-organized grid layout on dark background.
```

---

## 8. スクリーンショット 7 / 8：プライバシー & セキュリティ

> データを収集しない安全設計を訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

Center: A large translucent shield icon with a checkmark, rendered in teal
with a subtle glow. Inside and around the shield, floating text labels:
"データ収集なし" "広告なし" "AES-256暗号化" "オフライン動作" "オープンソース"

Each label has a small green checkmark icon beside it.

Above the shield:
- Large bold headline: "あなたのデータは、あなただけのもの。"
- Subtitle: "収集しない。追跡しない。広告もない。"
White text, center-aligned.

Below the shield: The app icon and "Simple QR" text in white.

Trust-building design. Dark background with teal/green security accents.
Minimal and authoritative.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

Center: A large translucent shield icon with a checkmark, rendered in teal
with a subtle glow. Inside and around the shield, floating text labels:
"No data collection" "No ads" "AES-256 encryption" "Works offline" "Open source"

Each label has a small green checkmark icon beside it.

Above the shield:
- Large bold headline: "Your Data. Your Device. Period."
- Subtitle: "No tracking. No ads. No collection."
White text, center-aligned.

Below the shield: The app icon and "Simple QR" text in white.

Trust-building design. Dark background with teal/green security accents.
Minimal and authoritative.
```

---

## 9. スクリーンショット 8 / 8：多言語対応

> 国際的な利用に対応していることを訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

Three floating smartphones arranged in a fan layout (left tilted left,
center straight, right tilted right). Each phone shows the same scan
screen but in a different language:
- Left: Japanese UI (日本語)
- Center: English UI (slightly larger, in front)
- Right: Chinese UI (中文)

Language labels float below each phone: "日本語" "English" "中文"

Above the phones:
- Large bold headline: "世界中で使える。"
- Subtitle: "日本語・英語・中国語対応"
White text, center-aligned.

A subtle globe icon with connection lines in the background.

International, inclusive design. Teal accents on dark.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Solid dark background (#121212).

Three floating smartphones arranged in a fan layout (left tilted left,
center straight, right tilted right). Each phone shows the same scan
screen but in a different language:
- Left: Japanese UI
- Center: English UI (slightly larger, in front)
- Right: Chinese UI

Language labels float below each phone: "日本語" "English" "中文"

Above the phones:
- Large bold headline: "One App. Every Language."
- Subtitle: "Japanese, English, Chinese supported"
White text, center-aligned.

A subtle globe icon with connection lines in the background.

International, inclusive design. Teal accents on dark.
```

---

## 推奨する掲載順序

| # | 画像 | 訴求ポイント | 優先度 |
|:-:|------|------------|:------:|
| 1 | メインスキャン | 第一印象・コア機能 | 必須 |
| 2 | QR コード生成 | 双方向の機能性 | 必須 |
| 3 | 暗号化履歴 | セキュリティ差別化 | 必須 |
| 4 | ダークモード | ビジュアル訴求 | 必須 |
| 5 | バッチ & CSV | 業務利用の訴求 | 推奨 |
| 6 | 対応フォーマット | 網羅性 | 推奨 |
| 7 | プライバシー | 信頼性 | 推奨 |
| 8 | 多言語対応 | 国際性 | 任意 |

---

## 使い方

1. 上記プロンプトをそのまま画像生成 AI（Gemini、DALL-E、Midjourney 等）に入力
2. 生成結果を確認し、アプリの実際の UI に近い形に調整
3. 日本語版と英語版を別々に生成し、Play Store の各ロケールにアップロード
4. フィーチャーグラフィックは `1024×500` で、スクリーンショットは `1080×1920` 以上で出力
