# アプリアイコン標準ガイチE

> HARMONIC insight 全製品�Eアプリアイコンに適用される標準仕槁E

---

## 1. チE��イン原則

### ブランド統一

| 要素 | 仕槁E|
|------|------|
| **ベ�Eスカラー** | Gold `#B8942F` (角丸背景) |
| **コンチE��チE��ラー** | White `#FFFFFF` (アイコン冁E��素) |
| **アクセントカラー** | Gold Dark `#8C711E` (見�Eし�E強調) |
| **サブカラー** | Gold Light `#F0E6C8` (補助要素) |
| **背景形状** | 角丸四角形 (Corner Radius: サイズの 1/6) |

```
禁止: Blue (#2563EB) をアイコンのベ�Eスカラーに使用
禁止: 透�E背景のままOSに任せる
忁E��E Gold (#B8942F) の角丸四角形ベ�Eス
忁E��E 製品�E特徴を表す�Eワイト�Eシンボル
```

### アイコン構造

```
+---------------------+
|  +---------------+  |  <- マ�Eジン: サイズの 1/8
|  |               |  |
|  |  Gold #B8942F |  |  <- 角丸背景
|  |               |  |
|  |   +-------+   |  |
|  |   | White |   |  |  <- コンチE��チE��域: サイズの 1/4 マ�Eジン
|  |   |Symbol |   |  |
|  |   +-------+   |  |
|  |               |  |
|  +---------------+  |
+---------------------+
```

---

## 2. 製品別プラチE��フォーム・アイコン配置

### プラチE��フォーム一覧

| プラチE��フォーム | 生�E形弁E| 配置允E|
|----------------|---------|--------|
| **wpf** (C# WPF) | `.ico` (16-256px) + 個別 PNG | `Resources/{Name}.ico` |
| **python** (PyInstaller) | `.ico` (16-256px) + 個別 PNG | `resources/{Name}.ico` |
| **tauri** (Tauri + React) | `icon.ico` + `icon.png` + sized PNGs + Store logos | `src-tauri/icons/` |
| **expo** (Expo/React Native) | `icon.png` + `adaptive-icon.png` + `notification-icon.png` + `favicon.png` + `splash-icon.png` + Android mipmap | `assets/` |
| **web** (Next.js/React) | `favicon.ico` + `apple-touch-icon.png` + manifest PNGs | `public/` |
| **service** (Windows Service) | `.ico` (16-256px) + 個別 PNG | `Resources/{Name}.ico` |

### 全16アプリのプラチE��フォーム・配置允E

| コーチE| 製品名 | プラチE��フォーム | アイコン配置允E| ビルド設宁E|
|-------|--------|----------------|-------------|-----------|
| **INSS** | InsightOfficeSlide | C# WPF | `Resources/InsightOfficeSlide.ico` | `.csproj` の `<ApplicationIcon>` |
| **IOSH** | InsightOfficeSheet | C# WPF | `Resources/InsightOfficeSheet.ico` | `.csproj` の `<ApplicationIcon>` |
| **IOSD** | InsightOfficeDoc | C# WPF | `Resources/InsightOfficeDoc.ico` | `.csproj` の `<ApplicationIcon>` |
| **INPY** | InsightPy | Python/PyInstaller | `resources/InsightPy.ico` | PyInstaller `--icon` |
| **INMV** | InsightCast | Python/PyInstaller | `resources/InsightCast.ico` | PyInstaller `--icon` |
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

## 3. プラチE��フォーム別ビルド設宁E

### WPF (C# / Windows)  EINSS, IOSH, IOSD, ISOF, LAUNCHER

```bash
# アイコン生�E
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

**生�Eファイル:**
- `InsightOfficeSheet.ico` (マルチ解像度: 16/24/32/48/64/128/256px)
- `InsightOfficeSheet_16.png` 、E`InsightOfficeSheet_256.png` (個別 PNG)

### Python / PyInstaller  EINPY, INMV, INIG

```bash
# アイコン生�E
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
# Tkinter ウィンドウアイコン設宁E
import tkinter as tk
root = tk.Tk()
root.iconbitmap('resources/InsightPy.ico')
```

**生�Eファイル:**
- `InsightPy.ico` (マルチ解像度)
- `InsightPy_16.png` 、E`InsightPy_256.png` (個別 PNG)

### Tauri + React  EINCA, IVIN

```bash
# アイコン生�E�E�Eauri 形式で出力！E
python insight-common/scripts/generate-app-icon.py --product INCA --output src-tauri/icons/
```

```json
// tauri.conf.json�E��E動的に src-tauri/icons/ を参照�E�E
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

**生�Eファイル:**
- `icon.ico` (マルチ解像度)
- `icon.png` (512x512)
- `32x32.png`, `128x128.png`, `256x256.png`
- `128x128@2x.png` (256x256)
- `Square150x150Logo.png`, `Square310x310Logo.png` (Windows Store)
- `StoreLogo.png` (50x50)

### Windows Service + Tray  EINBT

```bash
# アイコン生�E
python insight-common/scripts/generate-app-icon.py --product INBT --output Resources/
```

```csharp
// トレイアプリ
notifyIcon.Icon = new System.Drawing.Icon("Resources/InsightBot.ico");
```

### Expo / React Native (iOS + Android)  ECAMERA, VOICE_CLOCK, PINBOARD, VOICE_MEMO

```bash
# アイコン生�E
python insight-common/scripts/generate-app-icon.py --product CAMERA --output assets/
```

```json
// app.json (Expo)  Etemplates/expo/app.json 参�E
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

**生�Eファイル:**
- `icon.png` (1024x1024, RGB, 透�EなぁE  EiOS App Store / Expo アイコン
- `adaptive-icon.png` (1024x1024, RGBA)  EAndroid Adaptive Icon foreground
- `notification-icon.png` (96x96)  EAndroid 通知アイコン
- `splash-icon.png` (200x200)  EスプラチE��ュ画面ロゴ
- `favicon.png` (48x48, RGB)  EWeb/PWA ファビコン
- `android/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png`  EAndroid ランチャー

### Web (Next.js / React)  EQR

```bash
# アイコン生�E
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

**生�Eファイル:**
- `favicon.ico` (16+32px マルチ解像度)
- `favicon-16.png`, `favicon-32.png`
- `apple-touch-icon.png` (180x180)
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

---

## 4. 製品別アイコンシンボル

吁E��品�E Gold ベ�Eスに統一しつつ、シンボルで区別する、E

| 製品コーチE| 製品名 | シンボル | 説昁E|
|-----------|--------|---------|------|
| INSS | InsightOfficeSlide | スライチE+ 矢印 | プレゼン + 抽出を示す矢印 |
| IOSH | InsightOfficeSheet | スプレチE��シートグリチE�� | ヘッダー衁E+ 行�EグリチE�� |
| IOSD | InsightOfficeDoc | ドキュメンチE+ 折り返し | チE��スト衁E+ 右上�E折り返し |
| INPY | InsightPy | Python ロゴ風 | ヘビ or Py斁E��E|
| INMV | InsightCast | 再生ボタン | フィルムストリチE�E + 再生 |
| INIG | InsightImageGen | 画像生戁E| ブラシ + 画像フレーム |
| INBT | InsightBot | ロボッチE| ロボット�EチE�� |
| INCA | InsightNoCodeAnalyzer | 解析グラチE| フローチャーチE+ 虫眼鏡 |
| IVIN | InterviewInsight | インタビュー | マイク + 吹き�EぁE|
| ISOF | InsightSeniorOffice | カレンダー + 斁E�� | カレンダー + 斁E�� + メール + ギア |

---

## 5. マスターアイコンと生�E方況E

### マスターアイコン

すべてのアプリアイコンのマスター PNG (1024x1024) は以下に格紁E

```
insight-common/brand/icons/png/
```

マスターアイコンは手動で作�E・管琁E��れる。�Eログラムでの自動生成�E行わなぁE��E

### 吁E��プリへの配币E generate-app-icon.py

`scripts/generate-app-icon.py` でマスター PNG から吁E�EラチE��フォーム用アイコンを生成する、E
**製品コードを持E��すると、その製品�EプラチE��フォームに合ったアイコンのみ生�Eされる、E*

```bash
# 依存パチE��ージ
pip install Pillow

# 製品コード指定で生�E�E��EラチE��フォーム自動判定！E
python scripts/generate-app-icon.py --product IOSH --output ./Resources/

# プラチE��フォームを手動指宁E
python scripts/generate-app-icon.py --product IOSH --output ./Resources/ --platform windows

# 全製品を一括生�E�E�各製品�EプラチE��フォームに合わせて出力！E
python scripts/generate-app-icon.py --all --output ./generated-icons/

# 利用可能なアイコン一覧�E��EラチE��フォーム・配置先を表示�E�E
python scripts/generate-app-icon.py --list
```

**生�Eフロー:**
1. マスター PNG (1024x1024) を読み込み
2. 製品コードからターゲチE��プラチE��フォームを判宁E
3. LANCZOS リサンプリングで吁E��イズにダウンスケール
4. プラチE��フォーム別にファイルを�E劁E

### TypeScript からのアイコンパス・プラチE��フォーム取征E

```typescript
import { getMasterIconPath, PRODUCTS, UTILITY_ICONS, getAllIcons } from '@/insight-common/config/products';
import type { AppPlatform } from '@/insight-common/config/products';

// 製品�Eマスターアイコンパス
getMasterIconPath('IOSH');  // 'brand/icons/png/icon-insight-sheet.png'

// プラチE��フォーム・ビルドパス
PRODUCTS.IOSH.targetPlatform;  // 'wpf'
PRODUCTS.IOSH.iconBuildPath;   // 'Resources/'
PRODUCTS.INCA.targetPlatform;  // 'tauri'

// ユーチE��リチE��アイコン
UTILITY_ICONS.CAMERA.targetPlatform;  // 'expo'
UTILITY_ICONS.CAMERA.iconBuildPath;   // 'assets/'

// 全アイコン一覧�E��EラチE��フォーム惁E��付き�E�E
getAllIcons();
// [{ key: 'INSS', name: '...', masterIcon: '...', targetPlatform: 'wpf', iconBuildPath: 'Resources/', isProduct: true }, ...]
```

---

## 6. Android ランチャー用アイコン�E�EnsightLauncher�E�E

InsightLauncher は **Android ネイチE��ブアプリ** で、�E Insight 製品をタイルグリチE��で表示する、E
吁E��品�E `targetPlatform` に関係なく、ランチャー表示用に Android mipmap PNG が忁E��、E

### 生�EコマンチE

```bash
# 全製品�Eランチャー用アイコンを一括生�E
python scripts/generate-app-icon.py --launcher

# カスタム出力�Eを指宁E
python scripts/generate-app-icon.py --launcher --output /path/to/output/
```

### 生�Eファイル構造

```
brand/icons/generated/launcher/
├── launcher-manifest.json          # 全製品�EアイコンメタチE�Eタ
├── INSS/
━E  ├── mipmap-mdpi/ic_launcher.png     # 48x48
━E  ├── mipmap-hdpi/ic_launcher.png     # 72x72
━E  ├── mipmap-xhdpi/ic_launcher.png    # 96x96
━E  ├── mipmap-xxhdpi/ic_launcher.png   # 144x144
━E  └── mipmap-xxxhdpi/ic_launcher.png  # 192x192
├── IOSH/
━E  └── ... (同構造)
├── IOSD/
━E  └── ...
└── ... (全15製品E
```

### launcher-manifest.json

Android ランチャーアプリがアイコンを解決するためのマニフェスト、E

```json
{
  "version": 1,
  "basePath": "brand/icons/generated/launcher",
  "densities": { "mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192 },
  "iconFileName": "ic_launcher.png",
  "entries": [
    {
      "code": "INSS",
      "name": "InsightOfficeSlide",
      "category": "office",
      "displayOrder": 100,
      "isProduct": true
    }
  ]
}
```

### Android ネイチE��ブアプリでの利用

**方況E1: assets から読み込み�E�推奨�E�E*

ランチャーアプリの `assets/` に `launcher/` チE��レクトリごとコピ�Eし、実行時に読み込む、E

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

**方況E2: res/drawable にコピ�E**

ビルド時にリソースとして絁E��込む場吁E

```kotlin
// ビルドスクリプトで launcher/{CODE}/mipmap-{density}/ ↁEres/mipmap-{density}/ にコピ�E
// ic_launcher.png ↁEic_{code_lowercase}.png にリネ�Eム
```

### TypeScript からの利用�E�Eonfig/app-icon-manager.ts�E�E

```typescript
import {
  getLauncherIcon,
  getLauncherIconsForDensity,
  getLauncherIconsByCategory,
  LAUNCHER_ICON_MANIFEST,
} from '@/insight-common/config/app-icon-manager';

// 特定製品�Eアイコンパスを取征E
getLauncherIcon('IOSH', 'xxhdpi');
// ↁE'brand/icons/generated/launcher/IOSH/mipmap-xxhdpi/ic_launcher.png'

// 全製品�Eアイコンをまとめて取得（グリチE��表示用�E�E
const icons = getLauncherIconsForDensity('xxhdpi');
// ↁE[{ code: 'INSS', name: 'InsightOfficeSlide', path: '...', size: 144 }, ...]

// カチE��リ別にグルーピング
const grouped = getLauncherIconsByCategory('xxhdpi');
// grouped.office     ↁE[INSS, IOSH, IOSD]
// grouped.ai_tools   ↁE[INPY, INMV, INIG]
// grouped.enterprise ↁE[INCA, INBT, IVIN]
```

### アイコン更新手頁E

1. `brand/icons/png/` のマスター PNG を更新
2. `python scripts/generate-app-icon.py --launcher` を実衁E
3. 生�EされぁE`brand/icons/generated/launcher/` をランチャーアプリにコピ�E
4. ランチャーアプリをリビルチE

---

## 8. チェチE��リスチE

- [ ] Gold `#B8942F` が�Eースカラーとして使用されてぁE��
- [ ] 白ぁE��ンボルが製品�E特徴を表現してぁE��
- [ ] Blue がアイコンのメインカラーとして使われて**ぁE��ぁE*
- [ ] `generate-app-icon.py` で正しいプラチE��フォーム向けアイコンが生成されてぁE��
- [ ] ビルド設定！Ecsproj / tauri.conf.json / app.json / layout.tsx�E�で正しく参�EされてぁE��
- [ ] タスクバ�E / ブラウザタブで視認性が確保されてぁE�� (16px)
- [ ] 他�E HARMONIC insight 製品アイコンとファミリー感がある

---

## 9. 禁止事頁E

| めE��てはぁE��なぁE| 正しいめE��方 |
|-----------------|-------------|
| Blue を�Eースカラーに使用 | Gold `#B8942F` を使用 |
| 製品ごとに異なる�Eース形状 | 統一された角丸四角形 |
| グラチE�Eションの多用 | フラチE��チE��イン |
| 細かすぎるチE��チE�Eル | 16px でも認識できるシンプルぁE|
| チE��スト主体�Eアイコン | シンボル / ピクトグラム主佁E|
| 吁E��プリで独自にアイコン実裁E| `scripts/generate-app-icon.py` で統一生�E |
| プラチE��フォームを間違えてアイコン生�E | `--list` で確認してから生�E |
