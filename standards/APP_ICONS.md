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
❌ 禁止: Blue (#2563EB) をアイコンのベースカラーに使用
❌ 禁止: 透明背景のままOSに任せる
✅ 必須: Gold (#B8942F) の角丸四角形ベース
✅ 必須: 製品の特徴を表すホワイトのシンボル
```

### アイコン構造

```
┌─────────────────────┐
│  ╭─────────────────╮ │  ← マージン: サイズの 1/8
│  │                 │ │
│  │  Gold (#B8942F) │ │  ← 角丸背景
│  │                 │ │
│  │   ┌─────────┐   │ │
│  │   │ White   │   │ │  ← コンテンツ領域: サイズの 1/4 マージン
│  │   │ Symbol  │   │ │
│  │   └─────────┘   │ │
│  │                 │ │
│  ╰─────────────────╯ │
└─────────────────────┘
```

---

## 2. プラットフォーム別仕様

### Windows (WPF / WinForms)

| 項目 | 仕様 |
|------|------|
| **フォーマット** | `.ico` (マルチ解像度) |
| **必須サイズ** | 16, 24, 32, 48, 64, 128, 256 px |
| **カラーモード** | RGBA (透明背景対応) |
| **配置先** | `Resources/{ProductName}.ico` |
| **参照設定** | `.csproj` の `<ApplicationIcon>` |

```xml
<!-- .csproj -->
<PropertyGroup>
  <ApplicationIcon>Resources\InsightOfficeSheet.ico</ApplicationIcon>
</PropertyGroup>
```

```xml
<!-- MainWindow.xaml -->
<Window Icon="Resources/InsightOfficeSheet.ico" ... >
```

### React / Next.js (Web)

| 項目 | 仕様 |
|------|------|
| **favicon** | `public/favicon.ico` (32x32, 16x16 マルチ解像度) |
| **apple-touch-icon** | `public/apple-touch-icon.png` (180x180) |
| **Web Manifest** | `public/icon-192.png`, `public/icon-512.png` |
| **OGP画像** | `public/og-image.png` (1200x630) |

```html
<!-- layout.tsx metadata -->
export const metadata = {
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};
```

### Android

| 項目 | 仕様 |
|------|------|
| **Adaptive Icon** | `mipmap-anydpi-v26/ic_launcher.xml` |
| **前景レイヤー** | `drawable/ic_launcher_foreground.xml` (108dp) |
| **背景レイヤー** | Gold `#B8942F` 単色 |
| **レガシーアイコン** | `mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png` |

| 密度 | サイズ |
|------|--------|
| mdpi | 48x48 |
| hdpi | 72x72 |
| xhdpi | 96x96 |
| xxhdpi | 144x144 |
| xxxhdpi | 192x192 |

### iOS / Expo

| 項目 | 仕様 |
|------|------|
| **App Icon** | `assets/icon.png` (1024x1024) |
| **フォーマット** | PNG, RGB (透明不可) |
| **背景** | Gold `#B8942F` (透明禁止のため白背景不可) |
| **Splash Icon** | `assets/splash-icon.png` |

```json
// app.json (Expo)
{
  "expo": {
    "icon": "./assets/icon.png",
    "ios": {
      "icon": "./assets/icon.png"
    }
  }
}
```

---

## 3. 製品別アイコンシンボル

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

---

## 4. マスターアイコンと生成方法

### マスターアイコン

すべてのアプリアイコンのマスター PNG (1024x1024) は以下に格納:

```
insight-common/brand/icons/png/
```

マスターアイコンは手動で作成・管理される。プログラムでの自動生成は行わない。

### 各アプリへの配布: generate-app-icon.py

`scripts/generate-app-icon.py` でマスター PNG から各プラットフォーム用アイコンを生成する。

```bash
# 依存パッケージ
pip install Pillow

# 製品コード指定で生成（全プラットフォーム）
python scripts/generate-app-icon.py --product IOSH --output ./Resources/

# Windows ICO のみ生成
python scripts/generate-app-icon.py --product IOSH --output ./Resources/ --platform windows

# 全製品を一括生成
python scripts/generate-app-icon.py --all --output ./generated-icons/

# 利用可能なアイコン一覧
python scripts/generate-app-icon.py --list
```

**生成フロー:**
1. マスター PNG (1024x1024) を読み込み
2. LANCZOS リサンプリングで各サイズにダウンスケール
3. プラットフォーム別にファイルを出力

### 出力ファイル（プラットフォーム別）

| プラットフォーム | 出力 |
|----------------|------|
| **Windows** | `{Name}.ico` (16/24/32/48/64/128/256px) + 個別 PNG |
| **Android** | `mipmap-{density}/ic_launcher.png` (48〜192px) |
| **iOS/Expo** | `icon.png` (1024x1024, RGB, 透明なし) |
| **Web** | `favicon.ico` + `apple-touch-icon.png` + `icon-192.png` + `icon-512.png` |

### 各アプリへの組み込み手順

**1. WPF (C#) アプリ:**
```bash
python scripts/generate-app-icon.py --product IOSH --platform windows --output src/InsightOfficeSheet.App/Resources/
```
```xml
<!-- .csproj -->
<PropertyGroup>
  <ApplicationIcon>Resources\InsightOfficeSheet.ico</ApplicationIcon>
</PropertyGroup>
```

**2. Expo / React Native:**
```bash
python scripts/generate-app-icon.py --product IOSH --platform ios --output assets/
```
```json
// app.json
{ "expo": { "icon": "./assets/icon.png" } }
```

**3. Android:**
```bash
python scripts/generate-app-icon.py --product IOSH --platform android --output app/src/main/res/
```

**4. Web (Next.js):**
```bash
python scripts/generate-app-icon.py --product IOSH --platform web --output public/
```

### TypeScript からのアイコンパス取得

```typescript
import { getMasterIconPath, PRODUCTS, UTILITY_ICONS, getAllIcons } from '@/insight-common/config/products';

// 製品のマスターアイコンパス
getMasterIconPath('IOSH');  // 'brand/icons/png/icon-insight-sheet.png'
PRODUCTS.IOSH.masterIcon;   // 'brand/icons/png/icon-insight-sheet.png'

// ユーティリティアイコン
UTILITY_ICONS.LAUNCHER.masterIcon;  // 'brand/icons/png/icon-launcher.png'

// 全アイコン一覧
getAllIcons();  // [{ key: 'INSS', name: '...', masterIcon: '...', isProduct: true }, ...]
```

---

## 5. チェックリスト

- [ ] Gold `#B8942F` がベースカラーとして使用されている
- [ ] 白いシンボルが製品の特徴を表現している
- [ ] Blue がアイコンのメインカラーとして使われて**いない**
- [ ] 必要な全サイズが含まれている (プラットフォーム別)
- [ ] `.csproj` / `layout.tsx` / `app.json` で正しく参照されている
- [ ] タスクバー / ブラウザタブで視認性が確保されている (16px)
- [ ] 他の HARMONIC insight 製品アイコンとファミリー感がある

---

## 6. 禁止事項

| ❌ やってはいけない | ✅ 正しいやり方 |
|-------------------|----------------|
| Blue をベースカラーに使用 | Gold `#B8942F` を使用 |
| 製品ごとに異なるベース形状 | 統一された角丸四角形 |
| グラデーションの多用 | フラットデザイン |
| 細かすぎるディテール | 16px でも認識できるシンプルさ |
| テキスト主体のアイコン | シンボル / ピクトグラム主体 |
| 各アプリで独自にアイコン実装 | `scripts/generate-app-icon.py` で統一生成 |
