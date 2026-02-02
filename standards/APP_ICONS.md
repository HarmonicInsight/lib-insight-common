# アプリアイコン標準ガイド

> Harmonic Insight 全製品のアプリアイコンに適用される標準仕様

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

## 4. 生成方法

### Python スクリプト (推奨)

`scripts/generate-app-icon.py` を使用して一貫したアイコンを生成する。

```bash
# 依存パッケージ
pip install Pillow

# 使用例
python scripts/generate-app-icon.py --product InsightOfficeSheet --output ./Resources/
```

**生成フロー:**
1. 4x サイズでレンダリング (アンチエイリアス)
2. LANCZOS リサンプリングで各サイズにダウンスケール
3. マルチ解像度 ICO ファイルとして保存

### 手動作成時の注意

- Figma / Illustrator で作成する場合も、上記カラー仕様を厳守
- 角丸 radius はサイズの 1/6 (256px なら ~43px)
- マージンはサイズの 1/8 (256px なら 32px)
- コンテンツ領域はサイズの 1/4 マージン (256px なら 64px インセット)

---

## 5. チェックリスト

- [ ] Gold `#B8942F` がベースカラーとして使用されている
- [ ] 白いシンボルが製品の特徴を表現している
- [ ] Blue がアイコンのメインカラーとして使われて**いない**
- [ ] 必要な全サイズが含まれている (プラットフォーム別)
- [ ] `.csproj` / `layout.tsx` / `app.json` で正しく参照されている
- [ ] タスクバー / ブラウザタブで視認性が確保されている (16px)
- [ ] 他の Harmonic Insight 製品アイコンとファミリー感がある

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
