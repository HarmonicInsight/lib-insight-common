# Harmonic Insight アプリアイコン シリーズ

## デザインシステム

すべてのアプリアイコンは統一されたデザイン言語を使用:

- **背景**: Ivory (#FAF8F5)
- **ベースサークル**: Gold (#B8942F)、半径 34dp
- **アイコンアート**: White (#FFFFFF)
- **スパークルアクセント**: Light Gold (#D4BC6A)、右上に配置
- **スタイル**: 丸みのある可愛いデザイン

## 製品アイコン一覧

### Tier 3: InsightOffice Suite

| ファイル名 | 製品コード | 製品名 | モチーフ |
|-----------|-----------|--------|---------|
| `icon-insight-slide.svg` | INSS | InsightOfficeSlide | スライドレイヤー + 上矢印（テキスト抽出） |
| `icon-insight-sheet.svg` | IOSH | InsightOfficeSheet | スプレッドシートグリッド + ヘッダー行 |
| `icon-insight-doc.svg` | IOSD | InsightOfficeDoc | ドキュメント + 折り角 + テキスト行 |
| `icon-insight-py.svg` | INPY | InsightPy | Python ヘビ（S字カーブ） |

### Tier 2: AI活用ツール

| ファイル名 | 製品コード | 製品名 | モチーフ |
|-----------|-----------|--------|---------|
| `icon-insight-movie.svg` | INMV | InsightMovie | フィルムストリップ + 再生ボタン |
| `icon-insight-imagegen.svg` | INIG | InsightImageGen | 画像フレーム + ペイントブラシ |

### Tier 1: 業務変革ツール

| ファイル名 | 製品コード | 製品名 | モチーフ |
|-----------|-----------|--------|---------|
| `icon-insight-bot.svg` | INBT | InsightBot | かわいいロボット（大きな目 + アンテナ） |
| `icon-insight-nca.svg` | INCA | InsightNoCodeAnalyzer | フローチャート + 虫眼鏡 |
| `icon-interview-insight.svg` | IVIN | InterviewInsight | マイク + 音波 |

## ユーティリティアイコン一覧

| ファイル名 | アプリ | モチーフ |
|-----------|--------|---------|
| `icon-launcher.svg` | Insight Launcher | 2x2 アプリグリッド |
| `icon-qr.svg` | Insight QR | QR コードパターン |
| `icon-voice-clock.svg` | Insight Voice Clock | ベル付き目覚まし時計 |
| `icon-camera.svg` | Insight Camera | カメラ + レンズ |
| `icon-incline.svg` | InclineInsight | ゲージ + スマイル |
| `icon-consul-type.svg` | ConsulType | 盾 + 肉球 |
| `icon-consul-evaluate.svg` | ConsulEvaluate | クリップボード + チェック |
| `icon-horoscope.svg` | Harmonic Horoscope | 三日月 + 星 |
| `icon-food-medicine.svg` | Food Medicine Insight | フォーク + カプセル |

## 使用方法

### SVG → PNG 変換

```bash
# generate-app-icon.py でマスターPNG から全プラットフォーム用画像を生成
python scripts/generate-app-icon.py --master brand/icons/icon-insight-sheet.png --product IOSH

# SVG を 1024x1024 PNG に変換（Inkscape）
inkscape brand/icons/icon-insight-sheet.svg -w 1024 -h 1024 -o icon-insight-sheet.png

# SVG を 1024x1024 PNG に変換（rsvg-convert）
rsvg-convert -w 1024 -h 1024 brand/icons/icon-insight-sheet.svg > icon-insight-sheet.png
```

### Android (Native Kotlin)
SVG を Android Studio で Vector Drawable に変換し、
`app/src/main/res/drawable/ic_launcher_foreground.xml` として配置。

### iOS
SVG を 1024x1024 PNG に書き出し、Xcode の Asset Catalog に `AppIcon` として配置。

### Expo/React Native
SVG を 1024x1024 PNG に書き出し、`assets/icon.png` として配置。

### WPF (C#)
SVG を ICO に変換し、プロジェクトの `Assets/app.ico` として配置。
`generate-app-icon.py` で Windows 用 ICO（16/32/48/64/128/256px）を自動生成可能。
