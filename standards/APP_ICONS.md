# アプリアイコン標準ガイド

> HARMONIC insight 全製品のアプリアイコンに適用される標準仕様

---

## 1. デザイン原則

### ブランド統一

| 要素 | 仕様 |
|------|------|
| **ベースカラー** | Gold `#B8942F` (角丸背景) |
| **コンテンツカラー** | White `#FFFFFF` (アイコン内要素) |
| **アクセントカラー** | Gold Dark `#8C711E` (見出しの強調) |
| **サブカラー** | Gold Light `#F0E6C8` (補助要素) |
| **背景形状** | 角丸四角形 (Corner Radius: サイズの 1/6) |

```
禁止: Blue (#2563EB) をアイコンのベースカラーに使用
禁止: 透過背景のままOSに任せる
必須: Gold (#B8942F) の角丸四角形ベース
必須: 製品の特徴を表すホワイトのシンボル
```

### アイコン構造

```
+---------------------+
|  +---------------+  |  <- マージン: サイズの 1/8
|  |               |  |
|  |  Gold #B8942F |  |  <- 角丸背景
|  |               |  |
|  |   +-------+   |  |
|  |   | White |   |  |  <- コンテンツ域: サイズの 1/4 マージン
|  |   |Symbol |   |  |
|  |   +-------+   |  |
|  |               |  |
|  +---------------+  |
+---------------------+
```

---

## 2. 製品別プラットフォーム・アイコン配置

### プラットフォーム一覧

| プラットフォーム | 生成形式 | 配置先 |
|----------------|---------|--------|
| **wpf** (C# WPF) | `.ico` (16-256px) + 個別 PNG | `Resources/{Name}.ico` |
| **python** (PyInstaller) | `.ico` (16-256px) + 個別 PNG | `resources/{Name}.ico` |
| **tauri** (Tauri + React) | `icon.ico` + `icon.png` + sized PNGs + Store logos | `src-tauri/icons/` |
| **expo** (Expo/React Native) | `icon.png` + `adaptive-icon.png` + `notification-icon.png` + `favicon.png` + `splash-icon.png` + Android mipmap | `assets/` |
| **web** (Next.js/React) | `favicon.ico` + `apple-touch-icon.png` + manifest PNGs | `public/` |
| **service** (Windows Service) | `.ico` (16-256px) + 個別 PNG | `Resources/{Name}.ico` |

### 全16アプリのプラットフォーム・配置先

| コード | 製品名 | プラットフォーム | アイコン配置先 | ビルド設定 |
|-------|--------|----------------|-------------|-----------|
| **INSS** | Insight Deck Quality Gate | C# WPF | `Resources/InsightOfficeSlide.ico` | `.csproj` の `<ApplicationIcon>` |
| **IOSH** | Insight Performance Management | C# WPF | `Resources/InsightOfficeSheet.ico` | `.csproj` の `<ApplicationIcon>` |
| **IOSD** | Insight AI Doc Factory | C# WPF | `Resources/InsightOfficeDoc.ico` | `.csproj` の `<ApplicationIcon>` |
| **INPY** | InsightPy | Python/PyInstaller | `resources/InsightPy.ico` | PyInstaller `--icon` |
| **INMV** | Insight Training Studio | C# WPF | `Resources/InsightCast.ico` | `.csproj` の `<ApplicationIcon>` |
| **INIG** | InsightImageGen | Python/PyInstaller | `resources/InsightImageGen.ico` | PyInstaller `--icon` |
| **INBT** | InsightBot | Windows Service | `Resources/InsightBot.ico` | トレイアプリの `Icon` |
| **INCA** | InsightNoCodeAnalyzer | Tauri + React | `src-tauri/icons/` | `tauri.conf.json` |
| **IVIN** | InterviewInsight | Tauri + React | `src-tauri/icons/` | `tauri.conf.json` |
| **ISOF** | InsightSeniorOffice | C# WPF | `Resources/InsightSeniorOffice.ico` | `.csproj` の `<ApplicationIcon>` |
| LAUNCHER | InsightLauncher | C# WPF | `Resources/InsightLauncher.ico` | `.csproj` の `<ApplicationIcon>` |
| CAMERA | InsightCamera | Expo | `assets/icon.png` | `app.json` の `"icon"` |
| VOICE_CLOCK | InsightVoiceClock | Expo | `assets/icon.png` | `app.json` の `"icon"` |
| QR | InsightQR | Next.js | `public/favicon.ico` | `layout.tsx` の `metadata.icons` |
| PINBOARD | InsightPinBoard | Expo | `assets/icon.png` | `app.json` の `"icon"` |
| VOICE_MEMO | InsightVoiceMemo | Expo | `assets/icon.png` | `app.json` の `"icon"` |

---

## 3. プラットフォーム別ビルド設定

### WPF (C# / Windows) — INSS, IOSH, IOSD, ISOF, INMV, LAUNCHER

```bash
# アイコン生成
python insight-common/scripts/generate-app-icon.py --product IOSH --output src/InsightOfficeSheet.App/Resources/
```

```xml
<!-- .csproj -->
<PropertyGroup>
  <ApplicationIcon>Resources\InsightOfficeSheet.ico</ApplicationIcon>
</PropertyGroup>

<!-- MainWindow.xaml -->
<Window Icon="Resources/InsightOfficeSheet.ico" ... >
```

**生成ファイル:**
- `InsightOfficeSheet.ico` (マルチ解像度: 16/24/32/48/64/128/256px)
- `InsightOfficeSheet_16.png` 〜 `InsightOfficeSheet_256.png` (個別 PNG)

### Python / PyInstaller — INPY, INIG

```bash
# アイコン生成
python insight-common/scripts/generate-app-icon.py --product INPY --output resources/
```

```python
# PyInstaller spec ファイル
a = Analysis(...)
exe = EXE(
    ...
    icon='resources/InsightPy.ico',
    name='InsightPy',
)
```

```python
# Tkinter ウィンドウアイコン設定
import tkinter as tk
root = tk.Tk()
root.iconbitmap('resources/InsightPy.ico')
```

**生成ファイル:**
- `InsightPy.ico` (マルチ解像度)
- `InsightPy_16.png` 〜 `InsightPy_256.png` (個別 PNG)

### Tauri + React — INCA, IVIN

```bash
# アイコン生成（Tauri 形式で出力）
python insight-common/scripts/generate-app-icon.py --product INCA --output src-tauri/icons/
```

```json
// tauri.conf.json（自動的に src-tauri/icons/ を参照）
{
  "bundle": {
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.ico",
      "icons/icon.png"
    ]
  }
}
```

**生成ファイル:**
- `icon.ico` (マルチ解像度)
- `icon.png` (512x512)
- `32x32.png`, `128x128.png`, `256x256.png`
- `128x128@2x.png` (256x256)
- `Square150x150Logo.png`, `Square310x310Logo.png` (Windows Store)
- `StoreLogo.png` (50x50)

### Windows Service + Tray — INBT

```bash
# アイコン生成
python insight-common/scripts/generate-app-icon.py --product INBT --output Resources/
```

```csharp
// トレイアプリ
notifyIcon.Icon = new System.Drawing.Icon("Resources/InsightBot.ico");
```

### Expo / React Native (iOS + Android) — CAMERA, VOICE_CLOCK, PINBOARD, VOICE_MEMO

```bash
# アイコン生成
python insight-common/scripts/generate-app-icon.py --product CAMERA --output assets/
```

```json
// app.json (Expo) — templates/expo/app.json 参照
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "backgroundColor": "#B8942F"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#B8942F"
      },
      "notifications": {
        "icon": "./assets/notification-icon.png",
        "color": "#B8942F"
      }
    },
    "ios": {
      "icon": "./assets/icon.png"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

**生成ファイル:**
- `icon.png` (1024x1024, RGB, 透過なし) — iOS App Store / Expo アイコン
- `adaptive-icon.png` (1024x1024, RGBA) — Android Adaptive Icon foreground
- `notification-icon.png` (96x96) — Android 通知アイコン
- `splash-icon.png` (200x200) — スプラッシュ画面ロゴ
- `favicon.png` (48x48, RGB) — Web/PWA ファビコン
- `android/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png` — Android ランチャー

### Web (Next.js / React) — QR

```bash
# アイコン生成
python insight-common/scripts/generate-app-icon.py --product QR --output public/
```

```typescript
// layout.tsx metadata
export const metadata = {
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};
```

```json
// public/manifest.json
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**生成ファイル:**
- `favicon.ico` (16+32px マルチ解像度)
- `favicon-16.png`, `favicon-32.png`
- `apple-touch-icon.png` (180x180)
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

---

## 4. 製品別アイコンシンボル

各製品は Gold ベースに統一しつつ、シンボルで区別する。

| 製品コード | 製品名 | シンボル | 説明 |
|-----------|--------|---------|------|
| INSS | Insight Deck Quality Gate | スライド + 矢印 | プレゼン + 抽出を示す矢印 |
| IOSH | Insight Performance Management | スプレッドシートグリッド | ヘッダー行 + 行のグリッド |
| IOSD | Insight AI Doc Factory | ドキュメント + 折り返し | テキスト行 + 右上の折り返し |
| INPY | InsightPy | Python ロゴ風 | ヘビ or Py文字 |
| INMV | Insight Training Studio | 再生ボタン | フィルムストリップ + 再生 |
| INIG | InsightImageGen | 画像生成 | ブラシ + 画像フレーム |
| INBT | InsightBot | ロボット | ロボットの顔 |
| INCA | InsightNoCodeAnalyzer | 解析グラフ | フローチャート + 虫眼鏡 |
| IVIN | InterviewInsight | インタビュー | マイク + 吹き出し |
| ISOF | InsightSeniorOffice | カレンダー + 文書 | カレンダー + 文書 + メール + ギア |

---

## 5. マスターアイコンと生成方法

### マスターアイコン

すべてのアプリアイコンのマスター PNG (1024x1024) は以下に格納:

```
insight-common/brand/icons/png/
```

マスターアイコンは手動で作成・管理される。プログラムでの自動生成は行わない。

### 各アプリへの配布: generate-app-icon.py

`scripts/generate-app-icon.py` でマスター PNG から各プラットフォーム用アイコンを生成する。
**製品コードを指定すると、その製品のプラットフォームに合ったアイコンのみ生成される。**

```bash
# 依存パッケージ
pip install Pillow

# 製品コード指定で生成（プラットフォーム自動判定）
python scripts/generate-app-icon.py --product IOSH --output ./Resources/

# プラットフォームを手動指定
python scripts/generate-app-icon.py --product IOSH --output ./Resources/ --platform windows

# 全製品を一括生成（各製品のプラットフォームに合わせて出力）
python scripts/generate-app-icon.py --all --output ./generated-icons/

# 利用可能なアイコン一覧（プラットフォーム・配置先を表示）
python scripts/generate-app-icon.py --list
```

**生成フロー:**
1. マスター PNG (1024x1024) を読み込み
2. 製品コードからターゲットプラットフォームを判定
3. LANCZOS リサンプリングで各サイズにダウンスケール
4. プラットフォーム別にファイルを配列

### TypeScript からのアイコンパス・プラットフォーム取得

```typescript
import { getMasterIconPath, PRODUCTS, UTILITY_ICONS, getAllIcons } from '@/insight-common/config/products';
import type { AppPlatform } from '@/insight-common/config/products';

// 製品のマスターアイコンパス
getMasterIconPath('IOSH');  // 'brand/icons/png/icon-insight-sheet.png'

// プラットフォーム・ビルドパス
PRODUCTS.IOSH.targetPlatform;  // 'wpf'
PRODUCTS.IOSH.iconBuildPath;   // 'Resources/'
PRODUCTS.INCA.targetPlatform;  // 'tauri'

// ユーティリティアイコン
UTILITY_ICONS.CAMERA.targetPlatform;  // 'expo'
UTILITY_ICONS.CAMERA.iconBuildPath;   // 'assets/'

// 全アイコン一覧（プラットフォーム情報付き）
getAllIcons();
// [{ key: 'INSS', name: '...', masterIcon: '...', targetPlatform: 'wpf', iconBuildPath: 'Resources/', isProduct: true }, ...]
```

---

## 6. Android ランチャー用アイコン（InsightLauncher）

InsightLauncher は **Android ネイティブアプリ** で、全 Insight 製品をタイルグリッドで表示する。
各製品の `targetPlatform` に関係なく、ランチャー表示用に Android mipmap PNG が必要。

### 生成コマンド

```bash
# 全製品のランチャー用アイコンを一括生成
python scripts/generate-app-icon.py --launcher

# カスタム出力先を指定
python scripts/generate-app-icon.py --launcher --output /path/to/output/
```

### 生成ファイル構造

```
brand/icons/generated/launcher/
├── launcher-manifest.json          # 全製品のアイコンメタデータ
├── INSS/
│   ├── mipmap-mdpi/ic_launcher.png     # 48x48
│   ├── mipmap-hdpi/ic_launcher.png     # 72x72
│   ├── mipmap-xhdpi/ic_launcher.png    # 96x96
│   ├── mipmap-xxhdpi/ic_launcher.png   # 144x144
│   └── mipmap-xxxhdpi/ic_launcher.png  # 192x192
├── IOSH/
│   └── ... (同構造)
├── IOSD/
│   └── ...
└── ... (全15製品)
```

### launcher-manifest.json

Android ランチャーアプリがアイコンを解決するためのマニフェスト。

```json
{
  "version": 1,
  "basePath": "brand/icons/generated/launcher",
  "densities": { "mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192 },
  "iconFileName": "ic_launcher.png",
  "entries": [
    {
      "code": "INSS",
      "name": "Insight Deck Quality Gate",
      "category": "office",
      "displayOrder": 100,
      "isProduct": true
    }
  ]
}
```

### Android ネイティブアプリでの利用

**方法 1: assets から読み込み（推奨）**

ランチャーアプリの `assets/` に `launcher/` ディレクトリごとコピーし、実行時に読み込む。

```kotlin
// assets/launcher/launcher-manifest.json を読み込み
val manifest = assets.open("launcher/launcher-manifest.json").use {
    JSONObject(it.bufferedReader().readText())
}

// 製品コードからアイコンを読み込み
fun loadProductIcon(code: String, density: String = "xxhdpi"): Bitmap {
    val path = "launcher/$code/mipmap-$density/ic_launcher.png"
    return BitmapFactory.decodeStream(assets.open(path))
}
```

**方法 2: res/drawable にコピー**

ビルド時にリソースとして組み込む場合:

```kotlin
// ビルドスクリプトで launcher/{CODE}/mipmap-{density}/ → res/mipmap-{density}/ にコピー
// ic_launcher.png → ic_{code_lowercase}.png にリネーム
```

### TypeScript からの利用（config/app-icon-manager.ts）

```typescript
import {
  getLauncherIcon,
  getLauncherIconsForDensity,
  getLauncherIconsByCategory,
  LAUNCHER_ICON_MANIFEST,
} from '@/insight-common/config/app-icon-manager';

// 特定製品のアイコンパスを取得
getLauncherIcon('IOSH', 'xxhdpi');
// → 'brand/icons/generated/launcher/IOSH/mipmap-xxhdpi/ic_launcher.png'

// 全製品のアイコンをまとめて取得（グリッド表示用）
const icons = getLauncherIconsForDensity('xxhdpi');
// → [{ code: 'INSS', name: 'Insight Deck Quality Gate', path: '...', size: 144 }, ...]

// カテゴリ別にグルーピング
const grouped = getLauncherIconsByCategory('xxhdpi');
// grouped.office     → [INSS, IOSH, IOSD]
// grouped.ai_tools   → [INPY, INMV, INIG]
// grouped.enterprise → [INCA, INBT, IVIN]
```

### アイコン更新手順

1. `brand/icons/png/` のマスター PNG を更新
2. `python scripts/generate-app-icon.py --launcher` を実行
3. 生成された `brand/icons/generated/launcher/` をランチャーアプリにコピー
4. ランチャーアプリをリビルド

---

## 8. チェックリスト

- [ ] Gold `#B8942F` がベースカラーとして使用されている
- [ ] 白いシンボルが製品の特徴を表現している
- [ ] Blue がアイコンのメインカラーとして使われて**いない**
- [ ] `generate-app-icon.py` で正しいプラットフォーム向けアイコンが生成されている
- [ ] ビルド設定（.csproj / tauri.conf.json / app.json / layout.tsx）で正しく参照されている
- [ ] タスクバー / ブラウザタブで視認性が確保されている (16px)
- [ ] 他の HARMONIC insight 製品アイコンとファミリー感がある

---

## 9. 禁止事項

| やってはいけない | 正しいやり方 |
|-----------------|-------------|
| Blue をベースカラーに使用 | Gold `#B8942F` を使用 |
| 製品ごとに異なるベース形状 | 統一された角丸四角形 |
| グラデーションの多用 | フラットデザイン |
| 細かすぎるディテール | 16px でも認識できるシンプルさ |
| テキスト主体のアイコン | シンボル / ピクトグラム主体 |
| 各アプリで独自にアイコン実装 | `scripts/generate-app-icon.py` で統一生成 |
| プラットフォームを間違えてアイコン生成 | `--list` で確認してから生成 |
