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

- **背景**: アイボリー（#FAF8F5）〜 ウォームホワイト のグラデーション
- **プライマリ**: ゴールド（#B8942F）— タイトル、アクセント、CTA
- **テキスト**: ダークブラウン（#1C1917）、サブテキスト（#57534E）
- **カード**: ホワイト（#FFFFFF）+ ボーダー（#E7E2DA）
- **フォント**: モダンなゴシック体、太字のキャッチコピー
- **端末モック**: ベゼルレスの最新スマートフォンモックアップ
- **共通要素**: アプリアイコン（ゴールド QR コインデザイン）+ アプリ名「Simple QR」を全画像に含める
- **トーン**: 高級感・信頼感。金属的なゴールドの質感を活かす

---

## 1. フィーチャーグラフィック（1024×500）

> Play ストアの一番上に表示される横長バナー。

### プロンプト（日本語版）

```
A premium Google Play Store feature graphic (1024x500px, landscape).
Warm ivory-to-gold gradient background (#FAF8F5 to #D4A84B), elegant and luxurious.

Center composition: A modern bezel-less smartphone displaying a QR code scanning
interface with a glowing gold (#B8942F) scan line animating across a QR code.
Around the phone, floating translucent UI elements with gold borders: a shield icon
with a checkmark (URL safety), a QR code being generated, and a lock icon (encrypted history).

Left side: App icon — a golden coin with an embossed 3D QR code pattern and
circuit board traces, metallic gold finish.
Right side: Bold Japanese text "シンプルに、安全に。" in dark brown (#1C1917),
with subtitle "QRコード スキャン & 生成" in warm gray (#57534E) below.

Elegant, premium design with metallic gold accents on ivory background.
Luxurious tech aesthetic. Warm tones, clean layout, no photorealism.
```

### プロンプト（英語版）

```
A premium Google Play Store feature graphic (1024x500px, landscape).
Warm ivory-to-gold gradient background (#FAF8F5 to #D4A84B), elegant and luxurious.

Center composition: A modern bezel-less smartphone displaying a QR code scanning
interface with a glowing gold (#B8942F) scan line animating across a QR code.
Around the phone, floating translucent UI elements with gold borders: a shield icon
with a checkmark (URL safety), a QR code being generated, and a lock icon (encrypted history).

Left side: App icon — a golden coin with an embossed 3D QR code pattern and
circuit board traces, metallic gold finish.
Right side: Bold English text "Simple. Secure. Smart." in dark brown (#1C1917),
with subtitle "QR Code Scanner & Generator" in warm gray (#57534E) below.

Elegant, premium design with metallic gold accents on ivory background.
Luxurious tech aesthetic. Warm tones, clean layout, no photorealism.
```

---

## 2. スクリーンショット 1 / 8：メインスキャン機能

> アプリの第一印象。高速スキャンと URL 安全性チェックを訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

A floating bezel-less smartphone in the center-bottom area showing a camera
scanning interface: live viewfinder with a semi-transparent overlay,
a bright gold (#B8942F) animated scan frame targeting a QR code, and a small
gold badge at the top-right corner of the scan frame reading "安全" (safe)
with a shield icon.

Above the phone mockup:
- Large bold Japanese headline: "かざすだけで、安全に。" in dark brown (#1C1917)
- Smaller subtitle: "高速スキャン & URL 安全性チェック" in warm gray (#57534E)
Both center-aligned.

At the very bottom: A row of three small gold-bordered icons with labels:
"1D/2D対応" | "即時判定" | "自動コピー"

Elegant, minimal, premium. Gold accents on ivory background.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

A floating bezel-less smartphone in the center-bottom area showing a camera
scanning interface: live viewfinder with a semi-transparent overlay,
a bright gold (#B8942F) animated scan frame targeting a QR code, and a small
gold badge at the top-right corner reading "Safe" with a shield icon.

Above the phone mockup:
- Large bold headline: "Scan Instantly. Stay Safe." in dark brown (#1C1917)
- Smaller subtitle: "Fast scanning with URL safety check" in warm gray (#57534E)
Both center-aligned.

At the very bottom: A row of three small gold-bordered icons with labels:
"1D/2D Support" | "Instant Check" | "Auto Copy"

Elegant, minimal, premium. Gold accents on ivory background.
```

---

## 3. スクリーンショット 2 / 8：QR コード生成

> 多様な QR コード生成機能を訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

A floating smartphone showing a QR code generation screen: a clean form UI
with input fields for URL, text, Wi-Fi, contact card, and email. Below the
form, a large generated QR code with a gold (#B8942F) border. Gold share and
save buttons are visible at the bottom of the phone screen.

Above the phone:
- Large bold headline: "テキストもWi-Fiも、すぐQRに。" in dark brown (#1C1917)
- Subtitle: "URL・テキスト・Wi-Fi・連絡先を瞬時に変換" in warm gray (#57534E)
Center-aligned.

To the left of the phone, four small floating badges with gold borders
arranged vertically:
"URL" "テキスト" "Wi-Fi" "連絡先" — each with a distinct minimal icon.

Elegant flat design. Gold accents on ivory background. Premium feel.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

A floating smartphone showing a QR code generation screen: a clean form UI
with input fields for URL, text, Wi-Fi, contact card, and email. Below the
form, a large generated QR code with a gold (#B8942F) border. Gold share and
save buttons are visible at the bottom of the phone screen.

Above the phone:
- Large bold headline: "Generate QR Codes Instantly." in dark brown (#1C1917)
- Subtitle: "URL, text, Wi-Fi, contacts — all in one tap" in warm gray (#57534E)
Center-aligned.

To the left of the phone, four small floating badges with gold borders
arranged vertically:
"URL" "Text" "Wi-Fi" "Contact" — each with a distinct minimal icon.

Elegant flat design. Gold accents on ivory background. Premium feel.
```

---

## 4. スクリーンショット 3 / 8：暗号化履歴

> AES-256 暗号化による安全な履歴管理を訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

A floating smartphone displaying a history list screen with several scanned
QR code entries on white (#FFFFFF) cards with light borders (#E7E2DA).
Each entry shows: a small QR code thumbnail, a title (URL or text snippet),
a timestamp, and a small gold lock icon indicating encryption. One entry is
expanded to show full details with gold "コピー" and "共有" action buttons.

Above the phone:
- Large bold headline: "作れる、残せる、守られる。" in dark brown (#1C1917)
- Subtitle: "AES-256 暗号化で履歴を安全に保存" in warm gray (#57534E)
Center-aligned.

A floating gold shield icon with "AES-256" text beside it, positioned to the
right of the phone with a subtle warm glow effect.

At the bottom: Three small gold-bordered icons with labels:
"暗号化保存" | "CSV出力" | "一括削除"

Elegant, trust-building design. Gold and ivory tones. Premium and secure.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

A floating smartphone displaying a history list screen with several scanned
QR code entries on white (#FFFFFF) cards with light borders (#E7E2DA).
Each entry shows: a small QR code thumbnail, a title (URL or text snippet),
a timestamp, and a small gold lock icon indicating encryption. One entry is
expanded to show full details with gold "Copy" and "Share" action buttons.

Above the phone:
- Large bold headline: "Create. Save. Protect." in dark brown (#1C1917)
- Subtitle: "AES-256 encrypted history storage" in warm gray (#57534E)
Center-aligned.

A floating gold shield icon with "AES-256" text beside it, positioned to the
right of the phone with a subtle warm glow effect.

At the bottom: Three small gold-bordered icons with labels:
"Encrypted" | "CSV Export" | "Bulk Delete"

Elegant, trust-building design. Gold and ivory tones. Premium and secure.
```

---

## 5. スクリーンショット 4 / 8：ダークモード & カスタマイズ

> 設定画面とダークモードの切り替えを訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

Two floating smartphones side by side, slightly overlapping and tilted:
- Left phone: Light mode settings screen with ivory (#FAF8F5) background,
  gold (#B8942F) toggle switches, showing toggles for vibration, sound,
  auto-copy, and theme selection.
- Right phone: Dark mode of the same settings screen with deep dark background,
  gold accent toggles and text highlights.

A curved gold arrow connects the two phones, suggesting seamless switching.

Above the phones:
- Large bold headline: "あなた好みに、カスタマイズ。" in dark brown (#1C1917)
- Subtitle: "ダークモード・音・振動・自動コピー" in warm gray (#57534E)
Center-aligned.

Elegant, clean design. Gold accents on ivory. Shows contrast between themes.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

Two floating smartphones side by side, slightly overlapping and tilted:
- Left phone: Light mode settings screen with ivory (#FAF8F5) background,
  gold (#B8942F) toggle switches, showing toggles for vibration, sound,
  auto-copy, and theme selection.
- Right phone: Dark mode of the same settings screen with deep dark background,
  gold accent toggles and text highlights.

A curved gold arrow connects the two phones, suggesting seamless switching.

Above the phones:
- Large bold headline: "Your Way. Your Style." in dark brown (#1C1917)
- Subtitle: "Dark mode, sounds, vibration, auto-copy" in warm gray (#57534E)
Center-aligned.

Elegant, clean design. Gold accents on ivory. Shows contrast between themes.
```

---

## 6. スクリーンショット 5 / 8：バッチスキャン & CSV エクスポート

> 業務利用を想定した大量処理・エクスポート機能を訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

A floating smartphone showing a batch scan results screen: a list of 8-10
scanned QR codes with gold checkboxes on white cards, a "全選択" (Select All)
gold toggle at the top, and a prominent gold (#B8942F) "CSVエクスポート"
button at the bottom of the phone screen.
A floating gold CSV file icon with an arrow is emerging from the phone to the right.

Above the phone:
- Large bold headline: "まとめてスキャン、一括出力。" in dark brown (#1C1917)
- Subtitle: "CSV エクスポートで業務効率化" in warm gray (#57534E)
Center-aligned.

A small spreadsheet/table icon in gold floating to the right side showing
exported data rows, connected to the phone with a dotted gold line.

Professional, business-oriented aesthetic. Gold accents on ivory.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

A floating smartphone showing a batch scan results screen: a list of 8-10
scanned QR codes with gold checkboxes on white cards, a "Select All"
gold toggle at the top, and a prominent gold (#B8942F) "Export CSV"
button at the bottom of the phone screen.
A floating gold CSV file icon with an arrow is emerging from the phone to the right.

Above the phone:
- Large bold headline: "Batch Scan. Bulk Export." in dark brown (#1C1917)
- Subtitle: "CSV export for business workflows" in warm gray (#57534E)
Center-aligned.

A small spreadsheet/table icon in gold floating to the right side showing
exported data rows, connected to the phone with a dotted gold line.

Professional, business-oriented aesthetic. Gold accents on ivory.
```

---

## 7. スクリーンショット 6 / 8：対応フォーマット一覧

> 幅広い 1D/2D バーコード対応を訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

Center composition: A grid of barcode/QR code format icons arranged in a
3x4 grid, each in a white (#FFFFFF) rounded card with gold (#B8942F) borders:
QR Code | Data Matrix | Aztec Code
PDF417 | EAN-13 | EAN-8
UPC-A | Code 128 | Code 39
ITF | Codabar | (more)

Each card has the format name in dark brown below a visual example of that
barcode type rendered in gold tones.

Above the grid:
- Large bold headline: "あらゆるコードに対応。" in dark brown (#1C1917)
- Subtitle: "QR・バーコード・DataMatrix — 20種類以上" in warm gray (#57534E)
Center-aligned.

Below the grid: A gold (#B8942F) banner reading "1D & 2D バーコード完全対応"

Clean infographic style. Well-organized grid on ivory background. Premium gold accents.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

Center composition: A grid of barcode/QR code format icons arranged in a
3x4 grid, each in a white (#FFFFFF) rounded card with gold (#B8942F) borders:
QR Code | Data Matrix | Aztec Code
PDF417 | EAN-13 | EAN-8
UPC-A | Code 128 | Code 39
ITF | Codabar | (more)

Each card has the format name in dark brown below a visual example of that
barcode type rendered in gold tones.

Above the grid:
- Large bold headline: "Every Code. One App." in dark brown (#1C1917)
- Subtitle: "QR, barcodes, DataMatrix — 20+ formats" in warm gray (#57534E)
Center-aligned.

Below the grid: A gold (#B8942F) banner reading "Full 1D & 2D barcode support"

Clean infographic style. Well-organized grid on ivory background. Premium gold accents.
```

---

## 8. スクリーンショット 7 / 8：プライバシー & セキュリティ

> データを収集しない安全設計を訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

Center: A large translucent gold (#B8942F) shield icon with a checkmark,
with a subtle warm glow. Inside and around the shield, floating white cards
with gold borders containing text labels:
"データ収集なし" "広告なし" "AES-256暗号化" "オフライン動作" "オープンソース"

Each label has a small gold checkmark icon beside it.

Above the shield:
- Large bold headline: "あなたのデータは、あなただけのもの。" in dark brown (#1C1917)
- Subtitle: "収集しない。追跡しない。広告もない。" in warm gray (#57534E)
Center-aligned.

Below the shield: The app icon (golden QR coin) and "Simple QR" text
in dark brown.

Trust-building design. Gold and ivory tones. Premium, authoritative, warm.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

Center: A large translucent gold (#B8942F) shield icon with a checkmark,
with a subtle warm glow. Inside and around the shield, floating white cards
with gold borders containing text labels:
"No data collection" "No ads" "AES-256 encryption" "Works offline" "Open source"

Each label has a small gold checkmark icon beside it.

Above the shield:
- Large bold headline: "Your Data. Your Device. Period." in dark brown (#1C1917)
- Subtitle: "No tracking. No ads. No collection." in warm gray (#57534E)
Center-aligned.

Below the shield: The app icon (golden QR coin) and "Simple QR" text
in dark brown.

Trust-building design. Gold and ivory tones. Premium, authoritative, warm.
```

---

## 9. スクリーンショット 8 / 8：多言語対応

> 国際的な利用に対応していることを訴求。

### プロンプト（日本語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

Three floating smartphones arranged in a fan layout (left tilted left,
center straight, right tilted right). Each phone shows the same scan
screen but in a different language:
- Left: Japanese UI (日本語)
- Center: English UI (slightly larger, in front)
- Right: Chinese UI (中文)

Gold-bordered language labels float below each phone: "日本語" "English" "中文"

Above the phones:
- Large bold headline: "世界中で使える。" in dark brown (#1C1917)
- Subtitle: "日本語・英語・中国語対応" in warm gray (#57534E)
Center-aligned.

A subtle gold globe icon with connection lines in the background.

International, inclusive design. Gold accents on ivory. Premium feel.
```

### プロンプト（英語版）

```
A Google Play Store screenshot mockup (1080x1920px, 9:16 portrait).
Warm ivory background (#FAF8F5) with subtle gold gradient at top.

Three floating smartphones arranged in a fan layout (left tilted left,
center straight, right tilted right). Each phone shows the same scan
screen but in a different language:
- Left: Japanese UI
- Center: English UI (slightly larger, in front)
- Right: Chinese UI

Gold-bordered language labels float below each phone: "日本語" "English" "中文"

Above the phones:
- Large bold headline: "One App. Every Language." in dark brown (#1C1917)
- Subtitle: "Japanese, English, Chinese supported" in warm gray (#57534E)
Center-aligned.

A subtle gold globe icon with connection lines in the background.

International, inclusive design. Gold accents on ivory. Premium feel.
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
