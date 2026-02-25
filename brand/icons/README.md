# HARMONIC insight アプリアイコン シリーズ

## チE��インシスチE��

すべてのアプリアイコンは統一されたデザイン言語を使用:

- **背景**: Ivory (#FAF8F5)
- **ベ�Eスサークル**: Gold (#B8942F)
- **アイコンアーチE*: White (#FFFFFF)
- **スパ�EクルアクセンチE*: Light Gold (#D4BC6A)、右上に配置
- **スタイル**: 丸みのある可愛いチE��イン

## チE��レクトリ構�E

```
brand/icons/
├── png/                              # マスター PNG アイコン�E�E024x1024、正式版�E�E
━E  ├── icon-insight-slide.png        # INSS - InsightOfficeSlide
━E  ├── icon-insight-sheet.png        # IOSH - InsightOfficeSheet
━E  ├── icon-insight-doc.png          # IOSD - InsightOfficeDoc
━E  ├── icon-insight-py.png           # INPY - InsightPy
━E  ├── icon-insight-cast.png        # INMV - InsightCast
━E  ├── icon-insight-imagegen.png     # INIG - InsightImageGen
━E  ├── icon-insight-bot.png          # INBT - InsightBot
━E  ├── icon-insight-nca.png          # INCA - InsightNoCodeAnalyzer
━E  ├── icon-interview-insight.png    # IVIN - InterviewInsight
━E  ├── icon-senior-office.png        # ISOF - InsightSeniorOffice
━E  ├── icon-launcher.png             # Insight Launcher
━E  ├── icon-camera.png               # スチE��リカメラ
━E  ├── icon-voice-clock.png          # Insight Voice Clock
━E  ├── icon-qr.png                   # Insight QR
━E  ├── icon-pinboard.png             # Insight PinBoard
━E  └── icon-voice-memo.png           # Insight Voice Memo
├── generated/                        # generate-app-icon.py による生�E済みアイコン
━E  ├── InsightOfficeSheet/           # WPF: .ico + 個別PNG
━E  ├── InsightNoCodeAnalyzer/        # Tauri: icon.ico + icon.png + sized PNGs
━E  ├── InsightCamera/                # Expo: icon.png + splash + Android mipmap
━E  ├── InsightQR/                    # Web: favicon.ico + manifest PNGs
━E  └── ...
└── README.md
```

> **重要E*: `png/` のアイコンが正式版マスターです。すべて手動で作�E・管琁E��れます、E

## 製品アイコン一覧�E�E0製品E��E

### Tier 1: 業務変革チE�Eル

| ファイル | コーチE| 製品名 | プラチE��フォーム | モチ�EチE|
|---------|:------:|--------|:---------------:|---------|
| `icon-insight-nca.png` | INCA | InsightNoCodeAnalyzer | Tauri + React | フローチャーチE+ ギア |
| `icon-insight-bot.png` | INBT | InsightBot | Windows Service | かわぁE��ロボッチE+ チャチE��吹き�EぁE|
| `icon-interview-insight.png` | IVIN | InterviewInsight | Tauri + React | ロボッチE+ マイク + クリチE�Eボ�EチE|

### Tier 2: AI活用チE�Eル

| ファイル | コーチE| 製品名 | プラチE��フォーム | モチ�EチE|
|---------|:------:|--------|:---------------:|---------|
| `icon-insight-cast.png` | INMV | InsightCast | Python/PyInstaller | 映写橁E+ フィルムストリチE�E + ギア |
| `icon-insight-imagegen.png` | INIG | InsightImageGen | Python/PyInstaller | モニター + アパ�Eチャ + 画僁E+ ギア |

### Tier 3: InsightOffice Suite

| ファイル | コーチE| 製品名 | プラチE��フォーム | モチ�EチE|
|---------|:------:|--------|:---------------:|---------|
| `icon-insight-slide.png` | INSS | InsightOfficeSlide | C# WPF | プレゼンボ�EチE+ ギア + 矢印 |
| `icon-insight-sheet.png` | IOSH | InsightOfficeSheet | C# WPF | スプレチE��シートグリチE�� + ギア |
| `icon-insight-doc.png` | IOSD | InsightOfficeDoc | C# WPF | ドキュメンチE+ ギア + DB |
| `icon-insight-py.png` | INPY | InsightPy | Python/PyInstaller | Python ヘビ + 回路基板 |

### Tier 4: Accessibility

| ファイル | コーチE| 製品名 | プラチE��フォーム | モチ�EチE|
|---------|:------:|--------|:---------------:|---------|
| `icon-senior-office.png` | ISOF | InsightSeniorOffice | C# WPF | カレンダー + 斁E�� + メール + ギア |

## ユーチE��リチE��アプリ一覧�E�Eアプリ�E�E

| ファイル | アプリ | プラチE��フォーム | モチ�EチE|
|---------|--------|:---------------:|---------|
| `icon-launcher.png` | Insight Launcher | C# WPF | 2x2 グリチE�� + ロケチE�� + 回路基板 |
| `icon-camera.png` | スチE��リカメラ | Expo (iOS/Android) | カメラ + アパ�Eチャ |
| `icon-voice-clock.png` | Insight Voice Clock | Android Native (Kotlin) | 目覚まし時訁E+ マイク + 音波 |
| `icon-voice-clock.png` | しゃべってカレンダー | Expo (iOS/Android) | 目覚まし時訁E+ マイク + 音波�E�EOICE_CLOCK と共有！E|
| `icon-qr.png` | Insight QR | Next.js (Web) | QR コードパターン |
| `icon-pinboard.png` | Insight PinBoard | Expo (iOS/Android) | コルクボ�EチE+ 付箋メモ |
| `icon-voice-memo.png` | Insight Voice Memo | Expo (iOS/Android) | マイク + 回路基板 + 波形 |

## プラチE��フォーム別サマリー

| プラチE��フォーム | 生�E形弁E| 対象アプリ |
|----------------|---------|-----------|
| **C# WPF** | `.ico` (16-256px) + 個別 PNG | INSS, IOSH, IOSD, ISOF, LAUNCHER |
| **Python/PyInstaller** | `.ico` (16-256px) + 個別 PNG | INPY, INMV, INIG |
| **Tauri + React** | `icon.ico` + `icon.png` + sized PNGs + Store logos | INCA, IVIN |
| **Windows Service** | `.ico` (16-256px) + 個別 PNG | INBT |
| **Expo (iOS/Android)** | `icon.png` (1024x1024) + Android mipmap + splash | QR, VOICE_TASK_CALENDAR, VOICE_MEMO |
| **Android Native** | mipmap PNG + round PNG | CAMERA, VOICE_CLOCK, INCLINE, etc. |
| **Next.js (Web)** | `favicon.ico` + manifest PNGs | QR |

## 使用方況E

### 吁E��プリへの配币E��Eenerate-app-icon.py�E�E

```bash
# 製品コード指定（�EラチE��フォーム自動判定！E
python scripts/generate-app-icon.py --product IOSH --output ./Resources/

# プラチE��フォーム手動持E��E
python scripts/generate-app-icon.py --product IOSH --platform windows --output ./Resources/

# 全製品一括生�E�E�各製品�EプラチE��フォームに合わせて出力！E
python scripts/generate-app-icon.py --all --output ./generated-icons/

# 利用可能なアイコン一覧�E��EラチE��フォーム・配置先を表示�E�E
python scripts/generate-app-icon.py --list
```

### TypeScript から参�E

```typescript
import { getMasterIconPath, PRODUCTS, UTILITY_ICONS } from '@/insight-common/config/products';

getMasterIconPath('IOSH');              // 'brand/icons/png/icon-insight-sheet.png'
PRODUCTS.IOSH.targetPlatform;          // 'wpf'
PRODUCTS.IOSH.iconBuildPath;           // 'Resources/'
UTILITY_ICONS.CAMERA.targetPlatform;   // 'expo'
UTILITY_ICONS.CAMERA.iconBuildPath;    // 'assets/'
```

### プラチE��フォーム別配置允E

| プラチE��フォーム | 生�Eコマンド侁E| 配置允E|
|----------------|--------------|--------|
| WPF | `--product IOSH --output Resources/` | `Resources/{Name}.ico` |
| Python | `--product INPY --output resources/` | `resources/{Name}.ico` |
| Tauri | `--product INCA --output src-tauri/icons/` | `src-tauri/icons/icon.ico`, `icon.png` etc. |
| Expo | `--product CAMERA --output assets/` | `assets/icon.png`, `assets/splash-icon.png` |
| Web | `--product QR --output public/` | `public/favicon.ico`, `public/icon-*.png` |
| Service | `--product INBT --output Resources/` | `Resources/{Name}.ico` |

## 新しいアイコンの追加方況E

1. Gold (#B8942F) + Ivory (#FAF8F5) スタイルで 1024x1024 PNG を作�E
2. `png/icon-{app-name}.png` として配置
3. `config/products.ts` の `masterIcon`, `targetPlatform`, `iconBuildPath` フィールドを更新
4. `scripts/generate-app-icon.py` のマッピングに追加�E�Eplatform`, `build_path` を含む�E�E
5. こ�E README の一覧に追訁E
