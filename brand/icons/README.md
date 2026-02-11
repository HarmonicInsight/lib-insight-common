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
├── png/                              # マスター PNG アイコン（1024x1024、正式版）
│   ├── icon-insight-slide.png        # INSS - InsightOfficeSlide
│   ├── icon-insight-sheet.png        # IOSH - InsightOfficeSheet
│   ├── icon-insight-doc.png          # IOSD - InsightOfficeDoc
│   ├── icon-insight-py.png           # INPY - InsightPy
│   ├── icon-insight-movie.png        # INMV - InsightMovie
│   ├── icon-insight-imagegen.png     # INIG - InsightImageGen
│   ├── icon-insight-bot.png          # INBT - InsightBot
│   ├── icon-insight-nca.png          # INCA - InsightNoCodeAnalyzer
│   ├── icon-interview-insight.png    # IVIN - InterviewInsight
│   ├── icon-senior-office.png        # ISOF - InsightSeniorOffice
│   ├── icon-launcher.png             # Insight Launcher
│   ├── icon-camera.png               # Insight Camera
│   ├── icon-voice-clock.png          # Insight Voice Clock
│   ├── icon-qr.png                   # Insight QR
│   ├── icon-pinboard.png             # Insight PinBoard
│   └── icon-voice-memo.png           # Insight Voice Memo
├── svg/                              # SVG アイコン（参考・フォールバック用）
│   └── icon-*.svg
└── README.md
```

> **重要**: `png/` のアイコンが正式版マスターです。すべて手動で作成・管理されます。

## 製品アイコン一覧（10製品）

### Tier 1: 業務変革ツール

| ファイル | コード | 製品名 | モチーフ |
|---------|:------:|--------|---------|
| `icon-insight-nca.png` | INCA | InsightNoCodeAnalyzer | フローチャート + ギア |
| `icon-insight-bot.png` | INBT | InsightBot | かわいいロボット + チャット吹き出し |
| `icon-interview-insight.png` | IVIN | InterviewInsight | ロボット + マイク + クリップボード |

### Tier 2: AI活用ツール

| ファイル | コード | 製品名 | モチーフ |
|---------|:------:|--------|---------|
| `icon-insight-movie.png` | INMV | InsightMovie | 映写機 + フィルムストリップ + ギア |
| `icon-insight-imagegen.png` | INIG | InsightImageGen | モニター + アパーチャ + 画像 + ギア |

### Tier 3: InsightOffice Suite

| ファイル | コード | 製品名 | モチーフ |
|---------|:------:|--------|---------|
| `icon-insight-slide.png` | INSS | InsightOfficeSlide | プレゼンボード + ギア + 矢印 |
| `icon-insight-sheet.png` | IOSH | InsightOfficeSheet | スプレッドシートグリッド + ギア |
| `icon-insight-doc.png` | IOSD | InsightOfficeDoc | ドキュメント + ギア + DB |
| `icon-insight-py.png` | INPY | InsightPy | Python ヘビ + 回路基板 |

### Tier 4: Accessibility

| ファイル | コード | 製品名 | モチーフ |
|---------|:------:|--------|---------|
| `icon-senior-office.png` | ISOF | InsightSeniorOffice | カレンダー + 文書 + メール + ギア |

## ユーティリティアプリ一覧（6アプリ）

| ファイル | アプリ | モチーフ |
|---------|--------|---------|
| `icon-launcher.png` | Insight Launcher | 2x2 グリッド + ロケット + 回路基板 |
| `icon-camera.png` | Insight Camera | カメラ + アパーチャ |
| `icon-voice-clock.png` | Insight Voice Clock | 目覚まし時計 + マイク + 音波 + "10:24" |
| `icon-qr.png` | Insight QR | QR コードパターン |
| `icon-pinboard.png` | Insight PinBoard | コルクボード + 付箋メモ |
| `icon-voice-memo.png` | Insight Voice Memo | マイク + 回路基板 + 波形 |

## 使用方法

### 各アプリへの配布（generate-app-icon.py）

```bash
# 製品コード指定で全プラットフォーム用アイコンを生成
python scripts/generate-app-icon.py --product IOSH --output ./Resources/

# Windows ICO のみ
python scripts/generate-app-icon.py --product IOSH --platform windows --output ./Resources/

# 全製品一括生成
python scripts/generate-app-icon.py --all --output ./generated-icons/

# 利用可能なアイコン一覧
python scripts/generate-app-icon.py --list
```

### TypeScript から参照

```typescript
import { getMasterIconPath, UTILITY_ICONS } from '@/insight-common/config/products';

getMasterIconPath('IOSH');              // 'brand/icons/png/icon-insight-sheet.png'
UTILITY_ICONS.LAUNCHER.masterIcon;      // 'brand/icons/png/icon-launcher.png'
```

### プラットフォーム別配置先

| プラットフォーム | 配置先 |
|----------------|--------|
| Windows (WPF) | `Resources/{ProductName}.ico` |
| Android | `app/src/main/res/mipmap-*/ic_launcher.png` |
| iOS / Expo | `assets/icon.png` (1024x1024) |
| Web (Next.js) | `public/favicon.ico` + `public/icon-*.png` |

## 新しいアイコンの追加方法

1. Gold (#B8942F) + Ivory (#FAF8F5) スタイルで 1024x1024 PNG を作成
2. `png/icon-{app-name}.png` として配置
3. `config/products.ts` の `masterIcon` フィールドを更新
4. `scripts/generate-app-icon.py` のマッピングに追加
5. この README の一覧に追記
