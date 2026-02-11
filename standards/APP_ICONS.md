# アプリアイコン標準ガイド

> HARMONIC insight 全製品のアプリアイコンに適用される標準仕様

---

## 1. デザイン原則

### ブランド統一

| 要素 | 仕様 |
|------|------|
| **ベースカラー** | Gold `#B8942F` (角丸背景) |
| **コンテンツカラー** | White `#FFFFFF` (アイコン内要素) |
| **アクセントカラー** | Gold Dark `#8C711E` (見出し・強調) |
| **サブカラー** | Gold Light `#F0E6C8` (補助要素) |
| **背景形状** | 角丸四角形 (Corner Radius: サイズの 1/6) |

```
禁止: Blue (#2563EB) をアイコンのベースカラーに使用
禁止: 透明背景のままOSに任せる
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
|  |   | White |   |  |  <- コンテンツ領域: サイズの 1/4 マージン
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
| **expo** (Expo/React Native) | `icon.png` (1024x1024) + Android mipmap + splash | `assets/` |
| **web** (Next.js/React) | `favicon.ico` + `apple-touch-icon.png` + manifest PNGs | `public/` |
| **service** (Windows Service) | `.ico` (16-256px) + 個別 PNG | `Resources/{Name}.ico` |

### 全16アプリのプラットフォーム・配置先

| コード | 製品名 | プラットフォーム | アイコン配置先 | ビルド設定 |
|-------|--------|----------------|-------------|-----------|
| **INSS** | InsightOfficeSlide | C# WPF | `Resources/InsightOfficeSlide.ico` | `.csproj` の `<ApplicationIcon>` |
| **IOSH** | InsightOfficeSheet | C# WPF | `Resources/InsightOfficeSheet.ico` | `.csproj` の `<ApplicationIcon>` |
| **IOSD** | InsightOfficeDoc | C# WPF | `Resources/InsightOfficeDoc.ico` | `.csproj` の `<ApplicationIcon>` |
| **INPY** | InsightPy | Python/PyInstaller | `resources/InsightPy.ico` | PyInstaller `--icon` |
| **INMV** | InsightMovie | Python/PyInstaller | `resources/InsightMovie.ico` | PyInstaller `--icon` |
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

### WPF (C# / Windows) — INSS, IOSH, IOSD, ISOF, LAUNCHER

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

### Python / PyInstaller — INPY, INMV, INIG

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
// app.json (Expo)
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon.png",
        "backgroundColor": "#B8942F"
      }
    },
    "ios": {
      "icon": "./assets/icon.png"
    }
  }
}
```

**生成ファイル:**
- `icon.png` (1024x1024, RGB, 透明なし)
- `splash-icon.png` (200x200)
- `android/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png`

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
| INSS | InsightOfficeSlide | スライド + 矢印 | プレゼン + 抽出を示す矢印 |
| IOSH | InsightOfficeSheet | スプレッドシートグリッド | ヘッダー行 + 行列グリッド |
| IOSD | InsightOfficeDoc | ドキュメント + 折り返し | テキスト行 + 右上の折り返し |
| INPY | InsightPy | Python ロゴ風 | ヘビ or Py文字 |
| INMV | InsightMovie | 再生ボタン | フィルムストリップ + 再生 |
| INIG | InsightImageGen | 画像生成 | ブラシ + 画像フレーム |
| INBT | InsightBot | ロボット | ロボットヘッド |
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
4. プラットフォーム別にファイルを出力

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

## 6. チェックリスト

- [ ] Gold `#B8942F` がベースカラーとして使用されている
- [ ] 白いシンボルが製品の特徴を表現している
- [ ] Blue がアイコンのメインカラーとして使われて**いない**
- [ ] `generate-app-icon.py` で正しいプラットフォーム向けアイコンが生成されている
- [ ] ビルド設定（.csproj / tauri.conf.json / app.json / layout.tsx）で正しく参照されている
- [ ] タスクバー / ブラウザタブで視認性が確保されている (16px)
- [ ] 他の HARMONIC insight 製品アイコンとファミリー感がある

---

## 7. 禁止事項

| やってはいけない | 正しいやり方 |
|-----------------|-------------|
| Blue をベースカラーに使用 | Gold `#B8942F` を使用 |
| 製品ごとに異なるベース形状 | 統一された角丸四角形 |
| グラデーションの多用 | フラットデザイン |
| 細かすぎるディテール | 16px でも認識できるシンプルさ |
| テキスト主体のアイコン | シンボル / ピクトグラム主体 |
| 各アプリで独自にアイコン実装 | `scripts/generate-app-icon.py` で統一生成 |
| プラットフォームを間違えてアイコン生成 | `--list` で確認してから生成 |
