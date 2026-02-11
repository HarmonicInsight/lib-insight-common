# HARMONIC insight アプリアイコン シリーズ

## デザインシステム

すべてのアプリアイコンは統一されたデザイン言語を使用:

- **背景**: Ivory (#FAF8F5)
- **ベースサークル**: Gold (#B8942F)
- **アイコンアート**: White (#FFFFFF)
- **スパークルアクセント**: Light Gold (#D4BC6A)、右上に配置
- **スタイル**: 丸みのある可愛いデザイン

## ディレクトリ構成

```
brand/icons/
├── png/                         # マスター PNG アイコン（正式版）
│   ├── icon-launcher.png        # Insight Launcher
│   ├── icon-camera.png          # Insight Camera
│   ├── icon-voice-clock.png     # Insight Voice Clock
│   └── products-grid-gemini.png # 9製品グリッド（元画像）
├── svg/                         # SVG アイコン（参考・フォールバック用）
│   ├── icon-insight-*.svg       # 9製品アイコン
│   └── icon-*.svg               # ユーティリティアイコン
└── README.md
```

> **重要**: `png/` ディレクトリのアイコンが正式版（マスター）です。
> すべてのアイコンは手動で作成・管理されます。SVG は参考資料として保持しています。

## マスターアイコン（png/ — 正式版）

手動で作成された 1024x1024 PNG マスターアイコン。各プラットフォーム用の画像生成元として使用。

### ユーティリティアイコン

| ファイル | アプリ | モチーフ | スタイル |
|---------|--------|---------|---------|
| `icon-launcher.png` | Insight Launcher | 脳 + 回路基板 + ロケット + スパークル | Gold + Ivory |
| `icon-camera.png` | Insight Camera | カメラ + シャッター + 回路基板 | Gold + Ivory |
| `icon-voice-clock.png` | Insight Voice Clock | 目覚まし時計 + マイク + 音波 + "10:24" | Gold + Ivory |

### 製品アイコン（作成予定）

| ファイル | 製品コード | 製品名 | ステータス |
|---------|-----------|--------|-----------|
| `icon-insight-slide.png` | INSS | InsightOfficeSlide | 未作成 |
| `icon-insight-sheet.png` | IOSH | InsightOfficeSheet | 未作成 |
| `icon-insight-doc.png` | IOSD | InsightOfficeDoc | 未作成 |
| `icon-insight-py.png` | INPY | InsightPy | 未作成 |
| `icon-insight-movie.png` | INMV | InsightMovie | 未作成 |
| `icon-insight-imagegen.png` | INIG | InsightImageGen | 未作成 |
| `icon-insight-bot.png` | INBT | InsightBot | 未作成 |
| `icon-insight-nca.png` | INCA | InsightNoCodeAnalyzer | 未作成 |
| `icon-interview-insight.png` | IVIN | InterviewInsight | 未作成 |

> `products-grid-gemini.png` に9製品のドラフト版グリッドがあります（個別PNG化は今後対応）。

## SVG アイコン（svg/ — 参考用）

プログラマティックに生成した SVG アイコン。Ivory背景 + Gold円 + 白シンボル + スパークルの統一スタイル。

### 製品アイコン（9製品）

| ファイル名 | 製品コード | 製品名 |
|-----------|-----------|--------|
| `icon-insight-slide.svg` | INSS | InsightOfficeSlide |
| `icon-insight-sheet.svg` | IOSH | InsightOfficeSheet |
| `icon-insight-doc.svg` | IOSD | InsightOfficeDoc |
| `icon-insight-py.svg` | INPY | InsightPy |
| `icon-insight-movie.svg` | INMV | InsightMovie |
| `icon-insight-imagegen.svg` | INIG | InsightImageGen |
| `icon-insight-bot.svg` | INBT | InsightBot |
| `icon-insight-nca.svg` | INCA | InsightNoCodeAnalyzer |
| `icon-interview-insight.svg` | IVIN | InterviewInsight |

### ユーティリティアイコン

| ファイル名 | アプリ |
|-----------|--------|
| `icon-launcher.svg` | Insight Launcher |
| `icon-camera.svg` | Insight Camera |
| `icon-voice-clock.svg` | Insight Voice Clock |
| `icon-qr.svg` | Insight QR |
| `icon-incline.svg` | InclineInsight |
| `icon-consul-type.svg` | ConsulType |
| `icon-consul-evaluate.svg` | ConsulEvaluate |
| `icon-horoscope.svg` | Harmonic Horoscope |
| `icon-food-medicine.svg` | Food Medicine Insight |

## 使用方法

### マスター PNG → 各プラットフォーム用画像

```bash
# generate-app-icon.py でマスターPNG から全プラットフォーム用画像を生成
python scripts/generate-app-icon.py --master brand/icons/png/icon-launcher.png --product LAUNCHER
```

### プラットフォーム別配置

| プラットフォーム | 配置先 |
|----------------|--------|
| Android | `app/src/main/res/mipmap-*/ic_launcher.png` |
| iOS | Asset Catalog → `AppIcon` |
| Expo/React Native | `assets/icon.png` |
| WPF (C#) | `Assets/app.ico`（ICO変換が必要） |

## 新しいアイコンの追加方法

1. Gold + Ivory スタイルで 1024x1024 PNG を作成
2. `png/icon-{app-name}.png` として配置
3. この README の一覧に追記
4. `generate-app-icon.py` で各プラットフォーム用を生成
