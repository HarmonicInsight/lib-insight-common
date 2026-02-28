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
│   ├── icon-insight-slide.png        # INSS - Insight Deck Quality Gate
│   ├── icon-insight-sheet.png        # IOSH - Insight Performance Management
│   ├── icon-insight-doc.png          # IOSD - Insight AI Briefcase
│   ├── icon-insight-py.png           # INPY - InsightPy
│   ├── icon-insight-cast.png        # INMV - InsightCast
│   ├── icon-insight-imagegen.png     # INIG - InsightImageGen
│   ├── icon-insight-bot.png          # INBT - InsightBot
│   ├── icon-insight-nca.png          # INCA - InsightNoCodeAnalyzer
│   ├── icon-interview-insight.png    # IVIN - InterviewInsight
│   ├── icon-senior-office.png        # ISOF - InsightSeniorOffice
│   ├── icon-launcher.png             # Insight Launcher
│   ├── icon-camera.png               # スッキリカメラ
│   ├── icon-voice-clock.png          # Insight Voice Clock
│   ├── icon-qr.png                   # Insight QR
│   ├── icon-pinboard.png             # Insight PinBoard
│   └── icon-voice-memo.png           # Insight Voice Memo
├── generated/                        # generate-app-icon.py による生成済みアイコン
│   ├── InsightPerformanceManagement/ # WPF: .ico + 個別PNG
│   ├── InsightNoCodeAnalyzer/        # Tauri: icon.ico + icon.png + sized PNGs
│   ├── InsightCamera/                # Expo: icon.png + splash + Android mipmap
│   ├── InsightQR/                    # Web: favicon.ico + manifest PNGs
│   └── ...
└── README.md
```

> **重要**: `png/` のアイコンが正式版マスターです。すべて手動で作成・管理されます。

## 製品アイコン一覧（10製品）

### Tier 1: 業務変革ツール

| ファイル | コード | 製品名 | プラットフォーム | モチーフ |
|---------|:------:|--------|:---------------:|---------|
| `icon-insight-nca.png` | INCA | InsightNoCodeAnalyzer | Tauri + React | フローチャート + ギア |
| `icon-insight-bot.png` | INBT | InsightBot | Windows Service | かわいいロボット + チャット吹き出し |
| `icon-interview-insight.png` | IVIN | InterviewInsight | Tauri + React | ロボット + マイク + クリップボード |

### Tier 2: AI活用ツール

| ファイル | コード | 製品名 | プラットフォーム | モチーフ |
|---------|:------:|--------|:---------------:|---------|
| `icon-insight-cast.png` | INMV | InsightCast | Python/PyInstaller | 映写機 + フィルムストリップ + ギア |
| `icon-insight-imagegen.png` | INIG | InsightImageGen | Python/PyInstaller | モニター + アパーチャ + 画像 + ギア |

### Tier 3: Insight Business Suite

| ファイル | コード | 製品名 | プラットフォーム | モチーフ |
|---------|:------:|--------|:---------------:|---------|
| `icon-insight-slide.png` | INSS | Insight Deck Quality Gate | C# WPF | プレゼンボード + ギア + 矢印 |
| `icon-insight-sheet.png` | IOSH | Insight Performance Management | C# WPF | スプレッドシートグリッド + ギア |
| `icon-insight-doc.png` | IOSD | Insight AI Briefcase | C# WPF | ドキュメント + ギア + DB |
| `icon-insight-py.png` | INPY | InsightPy | Python/PyInstaller | Python ヘビ + 回路基板 |

### Tier 4: Accessibility

| ファイル | コード | 製品名 | プラットフォーム | モチーフ |
|---------|:------:|--------|:---------------:|---------|
| `icon-senior-office.png` | ISOF | InsightSeniorOffice | C# WPF | カレンダー + 書類 + メール + ギア |

## ユーティリティアプリ一覧（6アプリ）

| ファイル | アプリ | プラットフォーム | モチーフ |
|---------|--------|:---------------:|---------|
| `icon-launcher.png` | Insight Launcher | C# WPF | 2x2 グリッド + ロケット + 回路基板 |
| `icon-camera.png` | スッキリカメラ | Expo (iOS/Android) | カメラ + アパーチャ |
| `icon-voice-clock.png` | Insight Voice Clock | Android Native (Kotlin) | 目覚まし時計 + マイク + 音波 |
| `icon-voice-clock.png` | しゃべってカレンダー | Expo (iOS/Android) | 目覚まし時計 + マイク + 音波（VOICE_CLOCK と共有） |
| `icon-qr.png` | Insight QR | Next.js (Web) | QR コードパターン |
| `icon-pinboard.png` | Insight PinBoard | Expo (iOS/Android) | コルクボード + 付箋メモ |
| `icon-voice-memo.png` | Insight Voice Memo | Expo (iOS/Android) | マイク + 回路基板 + 波形 |

## プラットフォーム別サマリー

| プラットフォーム | 生成形式 | 対象アプリ |
|----------------|---------|-----------|
| **C# WPF** | `.ico` (16-256px) + 個別 PNG | INSS, IOSH, IOSD, ISOF, LAUNCHER |
| **Python/PyInstaller** | `.ico` (16-256px) + 個別 PNG | INPY, INMV, INIG |
| **Tauri + React** | `icon.ico` + `icon.png` + sized PNGs + Store logos | INCA, IVIN |
| **Windows Service** | `.ico` (16-256px) + 個別 PNG | INBT |
| **Expo (iOS/Android)** | `icon.png` (1024x1024) + Android mipmap + splash | QR, VOICE_TASK_CALENDAR, VOICE_MEMO |
| **Android Native** | mipmap PNG + round PNG | CAMERA, VOICE_CLOCK, INCLINE, etc. |
| **Next.js (Web)** | `favicon.ico` + manifest PNGs | QR |

## 使用方法

### 各アプリへの配布（generate-app-icon.py）

```bash
# 製品コード指定（プラットフォーム自動判定）
python scripts/generate-app-icon.py --product IOSH --output ./Resources/

# プラットフォーム手動指定
python scripts/generate-app-icon.py --product IOSH --platform windows --output ./Resources/

# 全製品一括生成（各製品のプラットフォームに合わせて出力）
python scripts/generate-app-icon.py --all --output ./generated-icons/

# 利用可能なアイコン一覧（プラットフォーム・配置先を表示）
python scripts/generate-app-icon.py --list
```

### TypeScript から参照

```typescript
import { getMasterIconPath, PRODUCTS, UTILITY_ICONS } from '@/insight-common/config/products';

getMasterIconPath('IOSH');              // 'brand/icons/png/icon-insight-sheet.png'
PRODUCTS.IOSH.targetPlatform;          // 'wpf'
PRODUCTS.IOSH.iconBuildPath;           // 'Resources/'
UTILITY_ICONS.CAMERA.targetPlatform;   // 'expo'
UTILITY_ICONS.CAMERA.iconBuildPath;    // 'assets/'
```

### プラットフォーム別配置先

| プラットフォーム | 生成コマンド例 | 配置先 |
|----------------|--------------|--------|
| WPF | `--product IOSH --output Resources/` | `Resources/{Name}.ico` |
| Python | `--product INPY --output resources/` | `resources/{Name}.ico` |
| Tauri | `--product INCA --output src-tauri/icons/` | `src-tauri/icons/icon.ico`, `icon.png` etc. |
| Expo | `--product CAMERA --output assets/` | `assets/icon.png`, `assets/splash-icon.png` |
| Web | `--product QR --output public/` | `public/favicon.ico`, `public/icon-*.png` |
| Service | `--product INBT --output Resources/` | `Resources/{Name}.ico` |

## 新しいアイコンの追加方法

1. Gold (#B8942F) + Ivory (#FAF8F5) スタイルで 1024x1024 PNG を作成
2. `png/icon-{app-name}.png` として配置
3. `config/products.ts` の `masterIcon`, `targetPlatform`, `iconBuildPath` フィールドを更新
4. `scripts/generate-app-icon.py` のマッピングに追加（`platform`, `build_path` を含む）
5. この README の一覧に追記
