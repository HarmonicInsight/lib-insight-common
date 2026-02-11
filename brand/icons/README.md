# HARMONIC insight アプリアイコン シリーズ

## デザインシステム

すべてのアプリアイコンは統一されたデザイン言語を使用:

- **背景**: Ivory (#FAF8F5)
- **ベースサークル**: Gold (#B8942F)、半径 34dp
- **アイコンアート**: White (#FFFFFF)
- **スパークルアクセント**: Light Gold (#D4BC6A)、右上に配置
- **スタイル**: 丸みのある可愛いデザイン

## ファイル構成

```
brand/icons/
├── master/                      # AI生成マスターアイコン（1024x1024 PNG）
│   ├── master-grid.png          # 元画像（3x3グリッド）
│   ├── icon-insight-slide.png   # INSS
│   ├── icon-insight-sheet.png   # IOSH
│   ├── icon-insight-doc.png     # IOSD
│   ├── icon-insight-py.png      # INPY
│   ├── icon-insight-movie.png   # INMV
│   ├── icon-insight-imagegen.png # INIG
│   ├── icon-insight-bot.png     # INBT
│   ├── icon-insight-nca.png     # INCA
│   └── icon-interview-insight.png # IVIN
├── launcher.png                 # Launcher マスターアイコン（Gold + 脳 + ロケット）
├── Camera.png                   # Camera マスターアイコン（Gold + シャッター）
├── Clock.png                    # Clock マスターアイコン（Gold + 目覚まし時計）
├── icon-*.svg                   # ブランド準拠 SVG アイコン
└── README.md
```

## マスターアイコン（PNG）— AI生成

Gemini で生成した各製品のマスターアイコン。`master/` ディレクトリに 1024x1024 PNG として格納。

### 製品アイコン（9製品）

| ファイル | 製品コード | 製品名 | モチーフ |
|---------|-----------|--------|---------|
| `master/icon-insight-slide.png` | INSS | InsightOfficeSlide | スライド + 上矢印（テキスト抽出） |
| `master/icon-insight-sheet.png` | IOSH | InsightOfficeSheet | スプレッドシートグリッド |
| `master/icon-insight-doc.png` | IOSD | InsightOfficeDoc | ドキュメント + 折り角 |
| `master/icon-insight-py.png` | INPY | InsightPy | Python ヘビ |
| `master/icon-insight-movie.png` | INMV | InsightMovie | フィルムストリップ + 再生ボタン |
| `master/icon-insight-imagegen.png` | INIG | InsightImageGen | ブラシ + 画像フレーム |
| `master/icon-insight-bot.png` | INBT | InsightBot | かわいいロボット |
| `master/icon-insight-nca.png` | INCA | InsightNoCodeAnalyzer | フローチャート + 虫眼鏡 |
| `master/icon-interview-insight.png` | IVIN | InterviewInsight | マイク + 音波 |

### ユーティリティアイコン（ブランド準拠 Gold + Ivory）

| ファイル | アプリ | モチーフ |
|---------|--------|---------|
| `launcher.png` | Insight Launcher | 脳 + 回路基板 + ロケット + スパークル |
| `Camera.png` | Insight Camera | カメラ + シャッター + 回路基板 |
| `Clock.png` | Insight Voice Clock | 目覚まし時計 + マイク + 音波 + "10:24" |

## SVG アイコン（ブランド準拠）

プログラマティックに生成した SVG アイコン。Ivory背景 + Gold円 + 白シンボル + スパークルの統一スタイル。

### 製品アイコン

| ファイル名 | 製品コード | 製品名 | モチーフ |
|-----------|-----------|--------|---------|
| `icon-insight-slide.svg` | INSS | InsightOfficeSlide | スライドレイヤー + 上矢印 |
| `icon-insight-sheet.svg` | IOSH | InsightOfficeSheet | スプレッドシートグリッド + ヘッダー行 |
| `icon-insight-doc.svg` | IOSD | InsightOfficeDoc | ドキュメント + 折り角 + テキスト行 |
| `icon-insight-py.svg` | INPY | InsightPy | Python ヘビ（S字カーブ） |
| `icon-insight-movie.svg` | INMV | InsightMovie | フィルムストリップ + 再生ボタン |
| `icon-insight-imagegen.svg` | INIG | InsightImageGen | 画像フレーム + ペイントブラシ |
| `icon-insight-bot.svg` | INBT | InsightBot | かわいいロボット（大きな目 + アンテナ） |
| `icon-insight-nca.svg` | INCA | InsightNoCodeAnalyzer | フローチャート + 虫眼鏡 |
| `icon-interview-insight.svg` | IVIN | InterviewInsight | マイク + 音波 |

### ユーティリティアイコン

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

### マスター PNG → 各プラットフォーム用画像

```bash
# generate-app-icon.py でマスターPNG から全プラットフォーム用画像を生成
python scripts/generate-app-icon.py --master brand/icons/master/icon-insight-sheet.png --product IOSH
```

### SVG → PNG 変換

```bash
# Inkscape で SVG を 1024x1024 PNG に変換
inkscape brand/icons/icon-insight-sheet.svg -w 1024 -h 1024 -o icon-insight-sheet.png

# rsvg-convert で変換
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
