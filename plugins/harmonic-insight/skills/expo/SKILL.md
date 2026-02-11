---
name: expo
description: Expo / React Native モバイルアプリの開発標準。expo-router、EAS Build、app.json、React Native コンポーネントの作業時に自動適用。Ivory & Gold テーマ、ライセンス統合、OTA アップデートパターンを提供。
allowed-tools: Read, Grep, Glob, Bash
---

# Expo / React Native 開発標準

対象: HARMONIC insight モバイルアプリ（iOS + Android クロスプラットフォーム）

## ネイティブとの使い分け

| 条件 | 選択 |
|------|------|
| iOS/Android 両対応、Web もカバーしたい | **Expo（これ）** |
| カメラ・BLE 等ネイティブ API に深く依存 | ネイティブ（android / ios スキル） |
| 既存ネイティブアプリへの統合 | ネイティブ |
| 短期間でプロトタイプ〜リリース | **Expo（これ）** |

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Expo SDK (最新) |
| ルーティング | expo-router (ファイルベース) |
| UI | React Native + NativeWind (Tailwind) |
| 認証 | Firebase Auth (`@react-native-firebase/auth`) |
| データ | Supabase (`@supabase/supabase-js`) |
| ビルド | EAS Build |
| 配信 | EAS Submit + EAS Update (OTA) |

## プロジェクト構成

```
your-app/
├── app/                        # expo-router (ファイルベースルーティング)
│   ├── _layout.tsx             # ルートレイアウト
│   ├── (tabs)/                 # タブナビゲーション
│   │   ├── _layout.tsx
│   │   ├── index.tsx           # ホーム
│   │   └── settings.tsx        # 設定
│   ├── license.tsx             # ライセンス画面
│   └── +not-found.tsx
├── components/
│   ├── ui/                     # 共通UIコンポーネント
│   └── license/
│       └── LicenseView.tsx     # ライセンス画面コンポーネント
├── lib/
│   ├── colors.ts               # Ivory & Gold カラー
│   ├── license-manager.ts      # ライセンス管理
│   └── supabase.ts             # Supabase クライアント
├── assets/
│   ├── fonts/                  # Noto Sans JP, Inter
│   └── images/
├── app.json                    # Expo 設定
├── eas.json                    # EAS Build 設定
├── tailwind.config.js          # NativeWind 設定
└── insight-common/             # サブモジュール
```

## Ivory & Gold テーマ

### colors.ts
```typescript
import colorsJson from '../insight-common/brand/colors.json';

export const colors = {
  primary: colorsJson.brand.primary,         // "#B8942F"
  primaryHover: colorsJson.brand.primaryHover, // "#8C711E"
  background: colorsJson.background.primary,   // "#FAF8F5"
  card: colorsJson.background.card,            // "#FFFFFF"
  text: colorsJson.text.primary,               // "#1C1917"
  textSecondary: colorsJson.text.secondary,    // "#57534E"
  border: colorsJson.border.primary,           // "#E7E2DA"
};
```

### NativeWind (tailwind.config.js)
```javascript
module.exports = {
  content: ['./app/**/*.{tsx,ts}', './components/**/*.{tsx,ts}'],
  theme: {
    extend: {
      colors: {
        brand: { primary: '#B8942F', hover: '#8C711E', light: '#F0E6C8' },
        ivory: { DEFAULT: '#FAF8F5', secondary: '#F3F0EB' },
      },
      fontFamily: {
        'noto': ['NotoSansJP'],
        'inter': ['Inter'],
      },
    },
  },
};
```

## app.json

```json
{
  "expo": {
    "name": "Your App",
    "slug": "your-app",
    "scheme": "your-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash.png",
      "backgroundColor": "#FAF8F5"
    },
    "ios": {
      "bundleIdentifier": "com.harmonicinsight.yourapp",
      "supportsTablet": true
    },
    "android": {
      "package": "com.harmonicinsight.yourapp",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#FAF8F5"
      }
    },
    "plugins": [
      "expo-router",
      "@react-native-firebase/app"
    ]
  }
}
```

## eas.json

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "dev@harmonicinsight.com" },
      "android": { "track": "production" }
    }
  }
}
```

## ビルド & デプロイ

```bash
# 開発ビルド
eas build --profile development --platform all

# プレビュー（内部配布）
eas build --profile preview --platform all

# 本番ビルド
eas build --profile production --platform all

# ストア提出
eas submit --platform all

# OTA アップデート（コードのみの変更時）
eas update --branch production --message "Bug fix"
```

## ライセンス画面

Insight Slides 形式に準拠。スプラッシュ背景は `#FAF8F5` (Ivory)。

## 禁止事項

- Blue をプライマリに使用（NativeWind デフォルトを上書き必須）
- `expo eject`（Managed Workflow を維持）
- 独自認証（Firebase Auth を使用）
- OpenAI / Azure の使用

## 詳細リファレンス

- `insight-common/standards/ANDROID.md` — Android 固有の注意点
- `insight-common/standards/IOS.md` — iOS 固有の注意点
- `insight-common/standards/REACT.md` — React コンポーネントパターン
